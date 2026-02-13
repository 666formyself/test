
import { GoogleGenAI } from '@google/genai';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// --- Types ---
interface CheckInRecord {
    id: string;
    type: 'sport' | 'event';
    name: string;
    category: string;
    duration: number;
    note: string;
    timestamp: number;
}

interface UserProfile {
    name: string;
    avatar: string;
    bio: string;
}

// --- Icons ---
const HomeIcon = ({ active }: { active: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#FF9671" : "none"} stroke={active ? "#FF9671" : "#A1A1AA"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);
const CheckIcon = ({ active }: { active: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#FF9671" : "none"} stroke={active ? "#FF9671" : "#A1A1AA"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
);
const FoodIcon = ({ active }: { active: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#FF9671" : "none"} stroke={active ? "#FF9671" : "#A1A1AA"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 0 1 7 7c0 2.5-2 4.5-4.5 4.5S10 11.5 10 9s2-7 2-7Z"/><path d="M12 21v-3"/><path d="M9 18h6"/></svg>
);
const StatsIcon = ({ active }: { active: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#FF9671" : "none"} stroke={active ? "#FF9671" : "#A1A1AA"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
);

// --- Constants ---
const SPORT_CATEGORIES = [
    { title: '有氧运动', items: [{ name: '跑步', emoji: '🏃' }, { name: '跳绳', emoji: '🪢' }, { name: '游泳', emoji: '🏊' }, { name: '椭圆机', emoji: '🚲' }, { name: '动感单车', emoji: '🚴' }, { name: '快走', emoji: '🚶' }] },
    { title: '力量训练', items: [{ name: '哑铃', emoji: '🏋️' }, { name: '杠铃', emoji: '💪' }, { name: '俯卧撑', emoji: '🤸' }, { name: '仰卧起坐', emoji: '🧘' }] }
];

const EVENT_CATEGORIES = [
    { title: '日常作息', items: [{ name: '早睡', emoji: '😴' }, { name: '早起', emoji: '🌅' }, { name: '午睡', emoji: '🛌' }, { name: '不熬夜', emoji: '🌙' }] },
    { title: '健康管理', items: [{ name: '喝水', emoji: '🥛' }, { name: '吃药', emoji: '💊' }, { name: '冥想', emoji: '🧘' }, { name: '泡脚', emoji: '🦶' }, { name: '体检', emoji: '🏥' }] },
    { title: '亲密互动', items: [{ name: '陪对象散步', emoji: '👫' }, { name: '给家人打电话', emoji: '📞' }, { name: '和朋友聊天', emoji: '💬' }, { name: '一起吃饭', emoji: '🍲' }] }
];

// --- App Component ---
function App() {
    const [tab, setTab] = useState<'home' | 'checkin' | 'food' | 'stats'>('home');
    const [checkinSubTab, setCheckinSubTab] = useState<'sport' | 'event'>('sport');
    const [records, setRecords] = useState<CheckInRecord[]>([]);
    const [profile] = useState<UserProfile>({ name: 'jiaqian', avatar: '🐶', bio: '私人生活助理 · 记录温暖的小日子' });
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [calorieResult, setCalorieResult] = useState<string | null>(null);

    // Load data
    useEffect(() => {
        const saved = localStorage.getItem('jiaqian_records');
        if (saved) setRecords(JSON.parse(saved));
    }, []);

    // Save data
    useEffect(() => {
        localStorage.setItem('jiaqian_records', JSON.stringify(records));
    }, [records]);

    const handleAddRecord = (record: Omit<CheckInRecord, 'id' | 'timestamp'>) => {
        const newRecord: CheckInRecord = {
            ...record,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now()
        };
        setRecords([newRecord, ...records]);
        setSelectedItem(null);
        setTab('home');
    };

    const handleCustomAdd = (type: 'sport' | 'event') => {
        const name = prompt(`请输入自定义${type === 'sport' ? '运动' : '事件'}名称:`);
        if (name && name.trim()) {
            setSelectedItem({ name, emoji: type === 'sport' ? '🔥' : '📝', isCustom: true, type });
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        setCalorieResult(null);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Data = (reader.result as string).split(',')[1];
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: {
                        parts: [
                            { inlineData: { data: base64Data, mimeType: file.type } },
                            { text: "请识别这张图中的食物，估算它的热量（大卡）和主要营养成分，用亲切、温馨的中文回复。" }
                        ]
                    }
                });
                setCalorieResult(response.text || "无法识别食物，请重试。");
                setIsAnalyzing(false);
            };
        } catch (err) {
            console.error(err);
            setIsAnalyzing(false);
            setCalorieResult("识别过程中出错了。");
        }
    };

    // Render Home
    const renderHome = () => {
        const today = new Date().setHours(0, 0, 0, 0);
        const todayRecords = records.filter(r => new Date(r.timestamp).setHours(0, 0, 0, 0) === today);

        return (
            <div className="view fade-in">
                <header className="user-header">
                    <div className="avatar">{profile.avatar}</div>
                    <div className="info">
                        <h2>{profile.name}</h2>
                        <p>{profile.bio}</p>
                    </div>
                    <button className="settings-btn">⚙️</button>
                </header>

                <div className="grid-nav">
                    <div className="nav-card card-orange" onClick={() => { setTab('checkin'); setCheckinSubTab('sport'); }}>
                        <div className="icon-bg">👟</div>
                        <span>打卡</span>
                    </div>
                    <div className="nav-card card-blue" onClick={() => setTab('food')}>
                        <div className="icon-bg">🍽️</div>
                        <span>热量</span>
                    </div>
                    <div className="nav-card card-pink">
                        <div className="icon-bg">❤️</div>
                        <span>纪念日</span>
                    </div>
                    <div className="nav-card card-purple">
                        <div className="icon-bg">📖</div>
                        <span>功能待开发</span>
                    </div>
                </div>

                <section className="footprint-section">
                    <div className="section-title">
                        <span>✨ 今日小脚印</span>
                    </div>
                    <div className="footprint-card">
                        {todayRecords.length === 0 ? (
                            <div className="empty-state">
                                <p>今天还没留下小印记呢~</p>
                                <div className="sleepy-emoji">😴</div>
                            </div>
                        ) : (
                            <ul className="record-list">
                                {todayRecords.map(r => (
                                    <li key={r.id} className="record-item">
                                        <span className="dot"></span>
                                        <span className="time">{new Date(r.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        <span className="content">
                                            {r.type === 'sport' ? '完成了 ' : '记录了 '}
                                            <b>{r.name}</b> 
                                            {r.duration > 0 && ` ${r.duration}分钟`}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
                <p className="footer-tag">私人生活助理 · 您的专属空间</p>
            </div>
        );
    };

    // Render Checkin
    const renderCheckin = () => {
        if (selectedItem) {
            const isSport = selectedItem.type === 'sport' || checkinSubTab === 'sport';
            return (
                <div className="view fade-in">
                    <div className="sub-header">
                        <button onClick={() => setSelectedItem(null)} className="back-btn">⬅️</button>
                        <h2>打卡细节</h2>
                    </div>
                    <div className="detail-card">
                        <div className="sport-header">
                            <div className="sport-emoji-large">{selectedItem.emoji}</div>
                            <div>
                                <p className="category-label">{isSport ? '日常运动' : '生活事件'}</p>
                                <h3>{selectedItem.name}</h3>
                            </div>
                        </div>
                        
                        <div className="input-group">
                            <label>{isSport ? '持续时长 (分钟)' : '完成时长/次数 (分钟)'}</label>
                            <input type="range" min="0" max="120" defaultValue={isSport ? "30" : "0"} id="duration-slider" onChange={(e) => {
                                document.getElementById('duration-val')!.innerText = e.target.value;
                            }} />
                            <div className="range-labels">
                                <span>0</span>
                                <span id="duration-val">{isSport ? "30" : "0"}</span>
                                <span>120</span>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>快速备注</label>
                            <div className="chip-group">
                                {['轻松完成', '中途休息', '未达目标', '超额完成'].map(tag => (
                                    <button key={tag} className="chip" onClick={() => {
                                        const area = document.getElementById('note-area') as HTMLTextAreaElement;
                                        area.value = tag;
                                    }}>{tag}</button>
                                ))}
                            </div>
                            <textarea placeholder="写点什么吧..." rows={4} id="note-area" />
                        </div>

                        <div className="action-buttons">
                            <button className="btn-secondary" onClick={() => setSelectedItem(null)}>下次加油</button>
                            <button className="btn-primary" onClick={() => {
                                const dur = parseInt((document.getElementById('duration-slider') as HTMLInputElement).value);
                                const note = (document.getElementById('note-area') as HTMLTextAreaElement).value;
                                handleAddRecord({ 
                                    type: isSport ? 'sport' : 'event', 
                                    name: selectedItem.name, 
                                    category: isSport ? '运动' : '事件', 
                                    duration: dur, 
                                    note 
                                });
                            }}>打卡完成</button>
                        </div>
                    </div>
                </div>
            );
        }

        const categories = checkinSubTab === 'sport' ? SPORT_CATEGORIES : EVENT_CATEGORIES;

        return (
            <div className="view fade-in">
                <div className="sub-header">
                    <h2>打卡分类</h2>
                </div>
                <div className="tab-switcher">
                    <button 
                        className={checkinSubTab === 'sport' ? 'active' : ''} 
                        onClick={() => setCheckinSubTab('sport')}
                    >
                        运动打卡
                    </button>
                    <button 
                        className={checkinSubTab === 'event' ? 'active' : ''} 
                        onClick={() => setCheckinSubTab('event')}
                    >
                        事件打卡
                    </button>
                </div>
                {categories.map(cat => (
                    <div key={cat.title} className="category-section">
                        <h4>{cat.title}</h4>
                        <div className="item-grid">
                            {cat.items.map(item => (
                                <div key={item.name} className="item-button" onClick={() => setSelectedItem({...item, type: checkinSubTab})}>
                                    <span className="item-emoji">{item.emoji}</span>
                                    <span className="item-name">{item.name}</span>
                                </div>
                            ))}
                            <div className="item-button custom" onClick={() => handleCustomAdd(checkinSubTab)}>
                                <span className="item-emoji">+</span>
                                <span className="item-name">自定义</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Render Food
    const renderFood = () => (
        <div className="view fade-in">
            <div className="sub-header">
                <h2>热量计算</h2>
            </div>
            <div className="food-card">
                <div className="camera-area">
                    {isAnalyzing ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>AI 正在努力识别中...</p>
                        </div>
                    ) : calorieResult ? (
                        <div className="result-area">
                            <h3>识别结果</h3>
                            <div className="result-content">{calorieResult}</div>
                            <button className="btn-primary" onClick={() => setCalorieResult(null)}>再次识别</button>
                        </div>
                    ) : (
                        <div className="upload-prompt">
                            <div className="icon-camera">📸</div>
                            <p>拍摄或上传食物图片</p>
                            <label className="upload-btn">
                                选择图片
                                <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                            </label>
                        </div>
                    )}
                </div>
                <div className="search-bar">
                    <input type="text" placeholder="🔍 搜索食物热量..." />
                </div>
            </div>
        </div>
    );

    // Render Stats
    const renderStats = () => (
        <div className="view fade-in">
            <div className="sub-header">
                <h2>数据统计</h2>
            </div>
            <div className="stats-card">
                <div className="stats-summary">
                    <div className="stat-box">
                        <span className="stat-val">{records.length}</span>
                        <span className="stat-label">累计打卡</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-val">{records.reduce((acc, r) => acc + r.duration, 0)}</span>
                        <span className="stat-label">累计时长</span>
                    </div>
                </div>
                <div className="placeholder-chart">
                    <p>📊 统计报表正在生成中...</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="app-container">
            <main className="content-area">
                {tab === 'home' && renderHome()}
                {tab === 'checkin' && renderCheckin()}
                {tab === 'food' && renderFood()}
                {tab === 'stats' && renderStats()}
            </main>

            <nav className="bottom-nav">
                <button onClick={() => setTab('home')} className={tab === 'home' ? 'active' : ''}>
                    <HomeIcon active={tab === 'home'} />
                    <span>主页</span>
                </button>
                <button onClick={() => { setTab('checkin'); setSelectedItem(null); }} className={tab === 'checkin' ? 'active' : ''}>
                    <CheckIcon active={tab === 'checkin'} />
                    <span>打卡</span>
                </button>
                <button onClick={() => setTab('food')} className={tab === 'food' ? 'active' : ''}>
                    <FoodIcon active={tab === 'food'} />
                    <span>热量</span>
                </button>
                <button onClick={() => setTab('stats')} className={tab === 'stats' ? 'active' : ''}>
                    <StatsIcon active={tab === 'stats'} />
                    <span>统计</span>
                </button>
            </nav>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
