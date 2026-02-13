
import { GoogleGenAI } from '@google/genai';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

// --- Types & Interfaces ---
interface CheckInRecord {
    id: string;
    type: 'sport' | 'event';
    name: string;
    category: string;
    duration: number;
    note: string;
    timestamp: number;
}

interface Anniversary {
    id: string;
    title: string;
    date: string;
}

interface AppSettings {
    language: 'zh' | 'en';
    isDarkMode: boolean;
    pushNotifications: boolean;
    inAppPopups: boolean;
    reminderFreq: number;
    reminderInterval: number;
    dndStart: string;
    dndEnd: string;
    auxReminder: boolean;
    msgCenter: boolean;
    vibration: boolean;
    animationIntensity: 'off' | 'low' | 'medium' | 'high';
}

const TRANSLATIONS = {
    zh: {
        home: '主页', checkin: '打卡', calories: '热量', stats: '统计',
        anniversary: '纪念日', settings: '偏好设置', reminders: '提醒设置',
        todaySteps: '今日足迹', noRecords: '今天还没留下小印记呢~',
        personalAssistant: '私人生活助理', warmMoments: '记录温暖的小日子',
        nextTime: '稍后再说', complete: '打卡完成', matterName: '事项名称',
        duration: '持续时长 (分钟)', quickNote: '快速备注',
        checkinDetails: '打卡细节', comingSoon: '功能开发中',
        sportCheck: '运动打卡', eventCheck: '生活打卡',
        successMsg: '太棒啦✨', successSub: '坚持就是胜利💪',
        addAnniversary: '新增纪念日'
    },
    en: {
        home: 'Home', checkin: 'Check-in', calories: 'Calories', stats: 'Stats',
        anniversary: 'Anniversary', settings: 'Settings', reminders: 'Reminders',
        todaySteps: "Today's Journey", noRecords: 'No records yet today~',
        personalAssistant: 'Personal Assistant', warmMoments: 'Warm moments',
        nextTime: 'Maybe later', complete: 'Check-in Done', matterName: 'Task Name',
        duration: 'Duration (Min)', quickNote: 'Quick Note',
        checkinDetails: 'Details', comingSoon: 'Coming Soon',
        sportCheck: 'Sport', eventCheck: 'Life',
        successMsg: 'Awesome! ✨', successSub: 'Consistency is key 💪',
        addAnniversary: 'Add Anniversary'
    }
};

const HomeIcon = ({ active }: { active: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#FF9671" : "none"} stroke={active ? "#FF9671" : "#A1A1AA"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);
const CheckIcon = ({ active }: { active: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#FF9671" : "none"} stroke={active ? "#FF9671" : "#A1A1AA"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
const FoodIcon = ({ active }: { active: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#FF9671" : "none"} stroke={active ? "#FF9671" : "#A1A1AA"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 0 1 7 7c0 2.5-2 4.5-4.5 4.5S10 11.5 10 9s2-7 2-7Z"/></svg>
);
const StatsIcon = ({ active }: { active: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#FF9671" : "none"} stroke={active ? "#FF9671" : "#A1A1AA"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
);

function App() {
    const [view, setView] = useState<'home' | 'checkin' | 'food' | 'stats' | 'settings' | 'reminders' | 'msg_center' | 'anniversary'>('home');
    const [checkinSubTab, setCheckinSubTab] = useState<'sport' | 'event'>('sport');
    const [records, setRecords] = useState<CheckInRecord[]>([]);
    const [anniversaries, setAnniversaries] = useState<Anniversary[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [settings, setSettings] = useState<AppSettings>({
        language: 'zh', isDarkMode: false, pushNotifications: true,
        inAppPopups: true, reminderFreq: 1, reminderInterval: 10,
        dndStart: '23:00', dndEnd: '07:00', auxReminder: true,
        msgCenter: true, vibration: true, animationIntensity: 'medium'
    });

    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [activeNoteTag, setActiveNoteTag] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [calorieResult, setCalorieResult] = useState<string | null>(null);
    const [greeting, setGreeting] = useState('');

    const t = TRANSLATIONS[settings.language];

    useEffect(() => {
        const savedRecords = localStorage.getItem('jq_records');
        const savedSettings = localStorage.getItem('jq_settings');
        const savedAnnis = localStorage.getItem('jq_annis');
        if (savedRecords) setRecords(JSON.parse(savedRecords));
        if (savedSettings) setSettings(JSON.parse(savedSettings));
        if (savedAnnis) setAnniversaries(JSON.parse(savedAnnis));

        const hour = new Date().getHours();
        if (hour < 5) setGreeting('深夜了，早点休息呀');
        else if (hour < 11) setGreeting('早安，开启活力一天');
        else if (hour < 14) setGreeting('午后好，记得休息下');
        else if (hour < 18) setGreeting('下午好，继续加油');
        else setGreeting('晚上好，忙碌一天辛苦了');
    }, []);

    useEffect(() => {
        localStorage.setItem('jq_records', JSON.stringify(records));
        localStorage.setItem('jq_settings', JSON.stringify(settings));
        localStorage.setItem('jq_annis', JSON.stringify(anniversaries));
        document.body.className = settings.isDarkMode ? 'dark' : '';
    }, [records, settings, anniversaries]);

    const handleAddRecord = (record: Omit<CheckInRecord, 'id' | 'timestamp'>) => {
        const newRecord: CheckInRecord = { ...record, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() };
        setRecords([newRecord, ...records]);
        setShowSuccess(true);
        if (settings.vibration && navigator.vibrate) navigator.vibrate([100, 50, 100]);
        setTimeout(() => {
            setShowSuccess(false);
            setSelectedItem(null);
            setView('home');
        }, 2200);
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
                    model: 'gemini-3-flash-preview',
                    contents: {
                        parts: [
                            { inlineData: { data: base64Data, mimeType: file.type } },
                            { text: `请识别图片中的食物并提供简明扼要的热量分析。请列出：1.食物名称 2.每100克大致卡路里 3.健康建议。请使用${settings.language === 'zh' ? '中文' : '英文'}回答。` }
                        ]
                    }
                });
                setCalorieResult(response.text || "识别失败");
                setIsAnalyzing(false);
            };
        } catch (error) {
            console.error(error);
            setCalorieResult("分析出了一点小状况，换张图试试？");
            setIsAnalyzing(false);
        }
    };

    const renderSuccessOverlay = () => (
        <div className="success-overlay">
            <div className="success-content">
                <div className="confetti-emoji">✨</div>
                <h2 className="success-title">{t.successMsg}</h2>
                <p className="success-subtext">{t.successSub}</p>
            </div>
        </div>
    );

    const renderHome = () => {
        const today = new Date().setHours(0, 0, 0, 0);
        const todayRecords = records.filter(r => new Date(r.timestamp).setHours(0, 0, 0, 0) === today);

        return (
            <div className="view">
                <header className="user-header">
                    <div className="avatar">🥑</div>
                    <div className="info">
                        <h2>{greeting}</h2>
                        <p>{t.personalAssistant} · {t.warmMoments}</p>
                    </div>
                    <button className="settings-btn" onClick={() => setView('settings')}>⚙️</button>
                </header>

                <div className="grid-nav">
                    <div className="nav-card card-orange" onClick={() => { setView('checkin'); setSelectedItem(null); }}>
                        <div className="icon-bg-wrap"><img src="https://img.icons8.com/emoji/96/running-shoe.png" width="36" alt="打卡" /></div>
                        <span>{t.checkin}</span>
                    </div>
                    <div className="nav-card card-blue" onClick={() => setView('food')}>
                        <div className="icon-bg-wrap"><img src="https://img.icons8.com/emoji/96/fork-and-knife-with-plate.png" width="36" alt="热量" /></div>
                        <span>{t.calories}</span>
                    </div>
                    <div className="nav-card card-pink" onClick={() => setView('anniversary')}>
                        <div className="icon-bg-wrap"><img src="https://img.icons8.com/emoji/96/heart-suit.png" width="36" alt="纪念日" /></div>
                        <span>{t.anniversary}</span>
                    </div>
                    <div className="nav-card card-purple" onClick={() => setView('stats')}>
                        <div className="icon-bg-wrap"><img src="https://img.icons8.com/emoji/96/bar-chart.png" width="36" alt="统计" /></div>
                        <span>{t.stats}</span>
                    </div>
                </div>

                <section className="footprint-section">
                    <div className="section-title">✨ {t.todaySteps}</div>
                    <div className="footprint-card">
                        {todayRecords.length === 0 ? (
                            <div className="empty-state">
                                <p>{t.noRecords}</p>
                                <div className="sleepy-emoji-wrap">
                                   <img src="https://img.icons8.com/emoji/96/sleeping-face.png" width="64" alt="sleepy" />
                                </div>
                            </div>
                        ) : (
                            <ul className="record-list">
                                {todayRecords.map(r => (
                                    <li key={r.id} className="record-item">
                                        <div className="item-main">
                                            <div className="item-icon-small">
                                                <img src={r.type === 'sport' ? 'https://img.icons8.com/emoji/48/flexed-biceps.png' : 'https://img.icons8.com/emoji/48/memo.png'} width="22" alt="icon" />
                                            </div>
                                            <div className="item-text">
                                                <p className="item-name">{r.name}</p>
                                                <p className="item-time">{new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                        <div className="item-right-icon">🌱</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
                <p className="version-info">jiaqian助理 · 陪伴你的第 {Math.ceil((Date.now() - (records[records.length-1]?.timestamp || Date.now())) / 86400000) || 1} 天</p>
            </div>
        );
    };

    const renderCheckinDetails = () => (
        <div className="view">
            <div className="sub-header">
                <button onClick={() => setSelectedItem(null)} className="back-btn-square">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <h2>{t.checkinDetails}</h2>
            </div>
            <div className="detail-card">
                <div className="sport-header" style={{display:'flex', alignItems:'center', gap:'20px', marginBottom:'32px'}}>
                    <div className="sport-emoji-large" style={{width:'80px', height:'80px', background:'var(--bg-color)', borderRadius:'28px', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid var(--border-color)', boxShadow:'0 8px 16px rgba(0,0,0,0.03)'}}>
                        <img src={selectedItem.type === 'sport' ? 'https://img.icons8.com/emoji/96/person-running.png' : 'https://img.icons8.com/emoji/96/memo.png'} width="56" alt="icon" />
                    </div>
                    <div style={{flex: 1}}>
                        <p className="category-label" style={{color:'var(--accent)', fontSize:'11px', background:'var(--accent-light)', padding:'2px 8px', borderRadius:'10px', display:'inline-block'}}>{selectedItem.category}</p>
                        <h3 style={{marginTop:'4px', fontSize:'24px', letterSpacing:'-0.5px'}}>{selectedItem.isCustom ? (selectedItem.name || '自定义') : selectedItem.name}</h3>
                    </div>
                </div>
                
                <div className="input-group">
                    <label>{t.matterName}</label>
                    <input type="text" className="text-input-light" 
                        defaultValue={selectedItem.isCustom ? '' : selectedItem.name} 
                        placeholder={selectedItem.isCustom ? '输入任务名...' : ''} id="matter-name" 
                        autoFocus={selectedItem.isCustom}
                    />
                </div>

                <div className="input-group">
                    <div className="label-row" style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
                        <label>{t.duration}</label>
                        <span id="duration-val" className="duration-highlight">{selectedItem.duration || 30}</span>
                    </div>
                    <input type="range" className="peach-range" min="0" max="120" step="5" defaultValue={selectedItem.duration || 30} id="duration-slider" onChange={(e) => {
                        const val = document.getElementById('duration-val');
                        if (val) val.innerText = e.target.value;
                    }} />
                    <div style={{display:'flex', justifyContent:'space-between', marginTop:'-10px', fontSize:'11px', color:'var(--text-soft)', fontWeight:'700'}}>
                        <span>0m</span>
                        <span>60m</span>
                        <span>120m</span>
                    </div>
                </div>

                <div className="input-group">
                    <label>{t.quickNote}</label>
                    <div className="chip-group" style={{display:'flex', gap:'10px', flexWrap:'wrap', marginBottom:'15px'}}>
                        {['轻松完成', '中途休息', '下次加油', '太棒了', '身体微酸'].map(tag => (
                            <button 
                                key={tag} 
                                className={`chip ${activeNoteTag === tag ? 'selected' : ''}`} 
                                onClick={() => {
                                    setActiveNoteTag(tag);
                                    const area = document.getElementById('note-area') as HTMLTextAreaElement;
                                    if (area) area.value = tag;
                                }}
                            >{tag}</button>
                        ))}
                    </div>
                    <textarea placeholder="记下此刻的心情..." rows={5} id="note-area" className="textarea-light" />
                </div>

                <div className="action-buttons-row" style={{display:'flex', gap:'16px', marginTop:'40px'}}>
                    <button className="btn-secondary-light" style={{flex:1}} onClick={() => setSelectedItem(null)}>{t.nextTime}</button>
                    <button className="btn-primary-peach" style={{flex:2}} onClick={() => {
                        const nameEl = document.getElementById('matter-name') as HTMLInputElement;
                        const durEl = document.getElementById('duration-slider') as HTMLInputElement;
                        const noteEl = document.getElementById('note-area') as HTMLTextAreaElement;
                        handleAddRecord({ 
                            type: selectedItem.type, 
                            name: nameEl?.value || selectedItem.name, 
                            category: selectedItem.category, 
                            duration: parseInt(durEl?.value || "30"), 
                            note: noteEl?.value || "" 
                        });
                    }}>{t.complete}</button>
                </div>
            </div>
        </div>
    );

    const renderFood = () => (
        <div className="view">
            <div className="sub-header">
                <button onClick={() => setView('home')} className="back-btn-square">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <h2>AI {t.calories}</h2>
            </div>
            <div className="food-main-card">
                <div className="food-placeholder-dashed">
                    {isAnalyzing ? (
                        <div className="analyzing-state">
                            <div className="pulse-loader"></div>
                            <p style={{marginTop:'20px', fontWeight:'700', color: 'var(--accent)'}}>正在努力扫描食物...</p>
                        </div>
                    ) : calorieResult ? (
                        <div className="calorie-result-display fade-in">
                            <h3>🔍 识别结果</h3>
                            <div className="result-text-content">{calorieResult}</div>
                            <button className="btn-retry" style={{marginTop:'20px', background:'var(--accent)', color:'white', border:'none', padding:'10px 20px', borderRadius:'12px', fontWeight:'700'}} onClick={() => setCalorieResult(null)}>重拍一张</button>
                        </div>
                    ) : (
                        <label className="camera-upload-label" style={{cursor:'pointer', display:'block'}}>
                            <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                            <div className="camera-icon-wrap" style={{marginBottom:'15px'}}>
                                <img src="https://img.icons8.com/emoji/96/camera-with-flash.png" width="64" alt="camera" />
                            </div>
                            <p style={{fontSize:'18px', fontWeight:'800', margin:'0 0 8px'}}>点击扫描食物</p>
                            <small style={{color:'var(--text-soft)', fontWeight:'600'}}>由 Gemini AI 提供视觉支持</small>
                        </label>
                    )}
                </div>
            </div>
        </div>
    );

    const renderStats = () => (
        <div className="view">
             <div className="sub-header">
                <button onClick={() => setView('home')} className="back-btn-square">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <h2>我的{t.stats}</h2>
            </div>
            <div className="stats-dashboard">
                <div className="stats-row" style={{display:'flex', gap:'15px', marginBottom:'24px'}}>
                    <div className="stats-card-mini">
                        <span className="stats-val">{records.length}</span>
                        <span className="stats-label">本月打卡</span>
                    </div>
                    <div className="stats-card-mini">
                        <span className="stats-val">🔥</span>
                        <span className="stats-label">最高连续</span>
                    </div>
                </div>
                <div className="heatmap-card" style={{background:'var(--input-bg)', borderRadius:'24px', padding:'24px', border:'1px solid var(--border-color)'}}>
                    <p className="group-title" style={{margin:'0 0 20px'}}>打卡频率</p>
                    <div className="mock-heatmap" style={{display:'flex', gap:'8px', height:'100px', alignItems:'flex-end'}}>
                        {[20, 50, 80, 40, 90, 60, 100].map((h, i) => (
                            <div key={i} className="heatmap-bar" style={{ flex:1, height: `${h}%`, background:'var(--accent)', borderRadius:'6px', opacity: h/100 }}></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderCheckinSelection = () => {
        const SPORT_CATS = [
            { title: '有氧训练', color:'var(--cardio-bg)', items: [{ name: '晨跑' }, { name: '游泳' }, { name: '跳绳' }, { name: '自行车' }] },
            { title: '塑形力量', color:'var(--strength-bg)', items: [{ name: '哑铃' }, { name: '核心' }, { name: '深蹲' }, { name: '平板支撑' }] },
            { title: '柔韧拉伸', color:'var(--flex-bg)', items: [{ name: '瑜伽' }, { name: '普拉提' }, { name: '拉伸' }] }
        ];
        const LIFE_CATS = [
            { title: '自律习惯', color:'var(--cardio-bg)', items: [{ name: '早起' }, { name: '多喝水' }, { name: '冥想' }] },
            { title: '温暖时刻', color:'var(--strength-bg)', items: [{ name: '惊喜' }, { name: '给家人的爱' }, { name: '散步' }] }
        ];
        const cats = checkinSubTab === 'sport' ? SPORT_CATS : LIFE_CATS;
        const iconSrc = checkinSubTab === 'sport' ? 'https://img.icons8.com/emoji/48/flexed-biceps.png' : 'https://img.icons8.com/emoji/48/memo.png';

        if (selectedItem) return renderCheckinDetails();

        return (
            <div className="view">
                 <div className="sub-header">
                    <button onClick={() => setView('home')} className="back-btn-square">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <h2>{t.checkin}</h2>
                </div>
                <div className="tab-switcher-pill">
                    <button className={checkinSubTab === 'sport' ? 'active' : ''} onClick={() => setCheckinSubTab('sport')}>{t.sportCheck}</button>
                    <button className={checkinSubTab === 'event' ? 'active' : ''} onClick={() => setCheckinSubTab('event')}>{t.eventCheck}</button>
                </div>
                {cats.map(cat => (
                    <div key={cat.title} className="category-section">
                        <h4>{cat.title}</h4>
                        <div className="item-grid-col3">
                            {cat.items.map(item => (
                                <div key={item.name} className="item-button-card" style={{borderColor: cat.color}} onClick={() => setSelectedItem({ ...item, type: checkinSubTab, category: cat.title, isCustom: false })}>
                                    <span className="item-icon-wrap" style={{background: cat.color}}><img src={iconSrc} width="28" alt="icon" /></span>
                                    <span className="item-label-small">{item.name}</span>
                                </div>
                            ))}
                            <div className="item-button-dashed-card" onClick={() => setSelectedItem({ name: '', type: checkinSubTab, category: cat.title, isCustom: true })}>
                                <span className="item-icon-plus">+</span>
                                <span className="item-label-small-peach">自定义</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="app-container">
            {showSuccess && renderSuccessOverlay()}
            <main className="content-area">
                {view === 'home' && renderHome()}
                {view === 'checkin' && renderCheckinSelection()}
                {view === 'food' && renderFood()}
                {view === 'stats' && renderStats()}
                {view === 'settings' && <div className="view"><div className="sub-header"><button onClick={()=>setView('home')} className="back-btn-square">⬅️</button><h2>{t.settings}</h2></div><div className="settings-card"><div className="setting-item" onClick={()=>setSettings({...settings, isDarkMode: !settings.isDarkMode})}>🌙 深色模式 {settings.isDarkMode ? '已开启':'已关闭'}</div></div></div>}
            </main>

            <nav className="bottom-nav">
                <button onClick={() => setView('home')} className={view === 'home' ? 'active' : ''}><HomeIcon active={view === 'home'} /><span>{t.home}</span></button>
                <button onClick={() => {setView('checkin'); setSelectedItem(null);}} className={view === 'checkin' ? 'active' : ''}><CheckIcon active={view === 'checkin'} /><span>{t.checkin}</span></button>
                <button onClick={() => setView('food')} className={view === 'food' ? 'active' : ''}><FoodIcon active={view === 'food'} /><span>{t.calories}</span></button>
                <button onClick={() => setView('stats')} className={view === 'stats' ? 'active' : ''}><StatsIcon active={view === 'stats'} /><span>{t.stats}</span></button>
            </nav>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
