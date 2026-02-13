
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI } from '@google/genai';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { generateId } from './utils';

// Icons
const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
);
const CodeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
);
const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
);
const HistoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
);

interface Artifact {
    id: string;
    prompt: string;
    html: string;
    timestamp: number;
    status: 'idle' | 'generating' | 'done' | 'error';
}

function App() {
    const [history, setHistory] = useState<Artifact[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(-1);
    const [inputValue, setInputValue] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showCode, setShowCode] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const currentArtifact = currentIndex >= 0 ? history[currentIndex] : null;

    const handleSendMessage = useCallback(async (manualPrompt?: string) => {
        const prompt = manualPrompt || inputValue;
        if (!prompt.trim() || (currentArtifact && currentArtifact.status === 'generating')) return;

        setInputValue('');
        const newId = generateId();
        const newArtifact: Artifact = {
            id: newId,
            prompt: prompt,
            html: '',
            timestamp: Date.now(),
            status: 'generating'
        };

        setHistory(prev => [newArtifact, ...prev]);
        setCurrentIndex(0);
        setShowCode(false);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const responseStream = await ai.models.generateContentStream({
                model: 'gemini-3-flash-preview',
                contents: [{ 
                    role: 'user', 
                    parts: [{ text: `Create a stunning, high-fidelity UI component for: "${prompt}". Return ONLY the raw HTML/CSS/JS code. Avoid markdown code blocks if possible, or I will strip them. Use modern fonts like Inter and include subtle animations.` }] 
                }],
            });

            let fullHtml = '';
            for await (const chunk of responseStream) {
                const text = chunk.text;
                if (text) {
                    fullHtml += text;
                    setHistory(prev => prev.map(a => a.id === newId ? { ...a, html: fullHtml } : a));
                }
            }

            let cleaned = fullHtml.trim();
            if (cleaned.startsWith('```html')) cleaned = cleaned.replace(/^```html\n?/, '');
            if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\n?/, '');
            if (cleaned.endsWith('```')) cleaned = cleaned.replace(/\n?```$/, '');

            setHistory(prev => prev.map(a => a.id === newId ? { ...a, html: cleaned, status: 'done' } : a));
        } catch (error: any) {
            console.error(error);
            setHistory(prev => prev.map(a => a.id === newId ? { ...a, status: 'error', html: `<div class="error">Error: ${error.message}</div>` } : a));
        }
    }, [inputValue, currentIndex, history]);

    const copyCode = () => {
        if (currentArtifact) {
            navigator.clipboard.writeText(currentArtifact.html);
        }
    };

    return (
        <div className="app-container">
            {/* Header */}
            <header className="main-header">
                <div className="logo" onClick={() => window.location.reload()}>
                    <SparklesIcon />
                    <span>Flash UI</span>
                </div>
                <div className="header-actions">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="icon-btn" title="History">
                        <HistoryIcon />
                    </button>
                    {currentArtifact && currentArtifact.status === 'done' && (
                        <>
                            <button onClick={() => setShowCode(!showCode)} className={`icon-btn ${showCode ? 'active' : ''}`} title="View Code">
                                <CodeIcon />
                            </button>
                            <button onClick={copyCode} className="icon-btn" title="Copy Code">
                                <CopyIcon />
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Main Stage */}
            <main className="stage">
                {!currentArtifact ? (
                    <div className="hero">
                        <h1>What should we build?</h1>
                        <p>Generate production-ready UI components in seconds.</p>
                        <div className="suggestions">
                            {['Pricing table', 'Glassmorphism Login', 'Music Player', 'Analytics Dashboard'].map(s => (
                                <button key={s} onClick={() => handleSendMessage(s)}>{s}</button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="preview-container">
                        {showCode ? (
                            <div className="code-viewer">
                                <pre><code>{currentArtifact.html}</code></pre>
                            </div>
                        ) : (
                            <iframe 
                                key={currentArtifact.id}
                                srcDoc={currentArtifact.html} 
                                title="preview"
                                sandbox="allow-scripts allow-same-origin"
                            />
                        )}
                        {currentArtifact.status === 'generating' && (
                            <div className="generating-loader">
                                <div className="shimmer"></div>
                                <span>Generating your vision...</span>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h3>History</h3>
                    <button onClick={() => setIsSidebarOpen(false)}>&times;</button>
                </div>
                <div className="history-list">
                    {history.map((item, idx) => (
                        <div 
                            key={item.id} 
                            className={`history-item ${idx === currentIndex ? 'active' : ''}`}
                            onClick={() => { setCurrentIndex(idx); setIsSidebarOpen(false); setShowCode(false); }}
                        >
                            <span className="prompt-text">{item.prompt}</span>
                            <span className="time-text">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    ))}
                    {history.length === 0 && <p className="empty-msg">No history yet.</p>}
                </div>
            </aside>

            {/* Input Bar */}
            <div className="input-bar-container">
                <div className="input-bar">
                    <input 
                        ref={inputRef}
                        type="text" 
                        placeholder="Describe a component..." 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button 
                        onClick={() => handleSendMessage()} 
                        disabled={!inputValue.trim() || (currentArtifact?.status === 'generating')}
                        className="send-btn"
                    >
                        {currentArtifact?.status === 'generating' ? '...' : <SparklesIcon />}
                    </button>
                </div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
