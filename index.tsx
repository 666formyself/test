
import { GoogleGenAI } from '@google/genai';
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// --- Types ---
type ActivityType = 'cardio' | 'strength' | 'habit' | 'wakeup' | 'general';

interface CheckInRecord {
    id: string;
    type: 'sport' | 'event';
    activityType: ActivityType;
    name: string;
    category: string;
    duration?: number; // 分钟
    distance?: number; // 公里/米
    unit?: string;
    count?: number; // 个数
    sets?: number; // 组数
    time?: string; // 起床时间
    note: string;
    timestamp: number;
}

interface AppSettings {
    language: 'zh' | 'en';
    isDarkMode: boolean;
    pushNotifications: boolean;
    inAppPopups: boolean;
    vibration: boolean;
}

const TRANSLATIONS = {
    zh: {
        home: '主页', checkin: '打卡', calories: '热量', stats: '统计',
        anniversary: '纪念日', settings: '偏好设置', 
        todaySteps: '今日足迹', noRecords: '今天还没留下小印记呢~',
        personalAssistant: '私人生活助理', warmMoments: '记录温暖的小日子',
        complete: '打卡完成', matterName: '事项名称', duration: '持续时长',
        checkinDetails: '打卡细节', sportCheck: '运动打卡', eventCheck: '生活打卡',
        general: '通用设置', language: '多语言设置', darkMode: '深色模式',
        storage: '存储与缓存', clearCache: '清除本地记录', storageUsage: '已保存记录',
        confirmClear: '确定要清除所有打卡记录吗？此操作无法撤销。',
        langOptions: { zh: '中文简体', en: 'English' },
        aiVision: 'AI 视觉分析', scanFood: '扫描食物',
        successMsg: '太棒啦✨', successSub: '坚持就是胜利💪',
        nextTime: '稍后再说', customTask: '自定义任务',
        distance: '运动距离', km: '公里', m: '米',
        count: '个数', sets: '组数', times: '次', groups: '组',
        wakeTime: '起床时间', min: '分钟',
        categories: {
            cardio: '有氧训练', strength: '塑形力量', flexibility: '柔韧伸展',
            habits: '自律习惯', mind: '精神寄托', housework: '家务琐事'
        }
    },
    en: {
        home: 'Home', checkin: 'Check-in', calories: 'Calories', stats: 'Stats',
        anniversary: 'Anniversary', settings: 'Settings',
        todaySteps: "Today's Journey", noRecords: 'No records today yet~',
        personalAssistant: 'Assistant', warmMoments: 'Warm moments',
        complete: 'Done', matterName: 'Task Name', duration: 'Duration',
        checkinDetails: 'Details', sportCheck: 'Sport', eventCheck: 'Life',
        general: 'General', language: 'Language', darkMode: 'Dark Mode',
        storage: 'Storage & Cache', clearCache: 'Clear Cache', storageUsage: 'Saved',
        confirmClear: 'Clear all records? This cannot be undone.',
        langOptions: { zh: 'Simplified Chinese', en: 'English' },
        aiVision: 'AI Vision', scanFood: 'Scan Food',
        successMsg: 'Awesome! ✨', successSub: 'Consistency is key 💪',
        nextTime: 'Later', customTask: 'Custom Task',
        distance: 'Distance', km: 'km', m: 'm',
        count: 'Count', sets: 'Sets', times: 'times', groups: 'sets',
        wakeTime: 'Wake-up Time', min: 'min',
        categories: {
            cardio: 'Cardio', strength: 'Strength', flexibility: 'Flexibility',
            habits: 'Habits', mind: 'Mindfulness', housework: 'Housework'
        }
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
    const [view, setView] = useState<'home' | 'checkin' | 'food' | 'stats' | 'settings'>('home');
    const [checkinSubTab, setCheckinSubTab] = useState<'sport' | 'event'>('sport');
    const [records, setRecords] = useState<CheckInRecord[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [settings, setSettings] = useState<AppSettings>({
        language: 'zh', isDarkMode: false, pushNotifications: true,
        inAppPopups: true, vibration: true
    });

    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [editName, setEditName] = useState('');
    const [calorieResult, setCalorieResult] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const t = TRANSLATIONS[settings.language];
    const firstUpdate = useRef(true);

    useEffect(() => {
        const savedRecords = localStorage.getItem('jq_records');
        const savedSettings = localStorage.getItem('jq_settings');
        if (savedRecords) setRecords(JSON.parse(savedRecords));
        if (savedSettings) setSettings(JSON.parse(savedSettings));
    }, []);

    useEffect(() => {
        if (firstUpdate.current) {
            firstUpdate.current = false;
            return;
        }
        localStorage.setItem('jq_records', JSON.stringify(records));
        localStorage.setItem('jq_settings', JSON.stringify(settings));
        document.body.className = settings.isDarkMode ? 'dark' : '';
    }, [records, settings]);

    const changeLanguage = (lang: 'zh' | 'en') => {
        if (lang === settings.language) return;
        setIsRefreshing(true);
        setTimeout(() => {
            setSettings(prev => ({ ...prev, language: lang }));
            setTimeout(() => setIsRefreshing(false), 300);
        }, 50);
    };

    const handleAddRecord = (record: Omit<CheckInRecord, 'id' | 'timestamp'>) => {
        const newRecord: CheckInRecord = { ...record, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() };
        setRecords([newRecord, ...records]);
        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
            setSelectedItem(null);
            setView('home');
        }, 2200);
    };

    const handleClearCache = () => {
        if (window.confirm(t.confirmClear)) {
            setRecords([]);
            alert(settings.language === 'zh' ? '清理成功' : 'Cleared');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsAnalyzing(true);
        setCalorieResult(null);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64Data = event.target?.result?.toString().split(',')[1];
            if (!base64Data) return;
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: {
                        parts: [
                            { inlineData: { data: base64Data, mimeType: file.type } },
                            { text: settings.language === 'zh' ? '识别食物并估算卡路里' : 'Identify food and estimate calories' }
                        ]
                    }
                });
                setCalorieResult(response.text);
            } catch (error) { setCalorieResult("Error"); }
            finally { setIsAnalyzing(false); }
        };
        reader.readAsDataURL(file);
    };

    const renderSettings = () => (
        <div className="view">
            <div className="sub-header">
                <button onClick={() => setView('home')} className="back-btn-square">⬅️</button>
                <h2>{t.settings}</h2>
            </div>
            <div className="settings-section-title">{t.language}</div>
            <div className="settings-card">
                <div className="radio-group" style={{padding:'8px'}}>
                    <div className={`cartoon-radio ${settings.language === 'zh' ? 'selected' : ''}`} onClick={() => changeLanguage('zh')}>
                        <span className="radio-label">{t.langOptions.zh}</span>
                        <div className="check-mark">✓</div>
                    </div>
                    <div className={`cartoon-radio ${settings.language === 'en' ? 'selected' : ''}`} onClick={() => changeLanguage('en')}>
                        <span className="radio-label">{t.langOptions.en}</span>
                        <div className="check-mark">✓</div>
                    </div>
                </div>
            </div>
            <div className="settings-section-title">{t.general}</div>
            <div className="settings-card">
                <div className="setting-item">
                    <span className="radio-label">{t.darkMode}</span>
                    <label className="switch">
                        <input type="checkbox" checked={settings.isDarkMode} onChange={() => setSettings(s => ({...s, isDarkMode: !s.isDarkMode}))} />
                        <span className="slider"></span>
                    </label>
                </div>
            </div>
            <button className="btn-danger-soft" onClick={handleClearCache}>{t.clearCache}</button>
        </div>
    );

    const renderCheckinSelection = () => {
        const isZh = settings.language === 'zh';
        const SPORT_CATS = [
            { 
                title: t.categories.cardio, 
                color:'var(--card-blue)', 
                items: [
                    {name: isZh ? '晨跑' : 'Jogging', icon: '🏃', type: 'cardio' as ActivityType}, 
                    {name: isZh ? '游泳' : 'Swimming', icon: '🏊', type: 'cardio' as ActivityType}, 
                    {name: isZh ? '自行车' : 'Cycling', icon: '🚲', type: 'cardio' as ActivityType},
                    {name: isZh ? '跳绳' : 'Jump Rope', icon: '➰', type: 'strength' as ActivityType},
                    {name: isZh ? '步行' : 'Walking', icon: '🚶', type: 'cardio' as ActivityType}
                ] 
            },
            { 
                title: t.categories.strength, 
                color:'var(--card-orange)', 
                items: [
                    {name: isZh ? '深蹲' : 'Squat', icon: '💪', type: 'strength' as ActivityType}, 
                    {name: isZh ? '俯卧撑' : 'Push-ups', icon: '🏋️', type: 'strength' as ActivityType},
                    {name: isZh ? '核心' : 'Core', icon: '🧘', type: 'strength' as ActivityType}
                ] 
            },
            {
                title: t.categories.flexibility,
                color:'var(--card-pink)',
                items: [
                    {name: isZh ? '瑜伽' : 'Yoga', icon: '🤸', type: 'general' as ActivityType},
                    {name: isZh ? '拉伸' : 'Stretching', icon: '🙆', type: 'general' as ActivityType}
                ]
            }
        ];
        const LIFE_CATS = [
            { 
                title: t.categories.habits, 
                color:'var(--card-purple)', 
                items: [
                    {name: isZh ? '早起' : 'Early Bird', icon: '🌅', type: 'wakeup' as ActivityType}, 
                    {name: isZh ? '多喝水' : 'Drink Water', icon: '💧', type: 'habit' as ActivityType}, 
                    {name: isZh ? '阅读' : 'Reading', icon: '📖', type: 'habit' as ActivityType}
                ] 
            },
            {
                title: t.categories.mind,
                color: 'var(--card-blue)',
                items: [
                    {name: isZh ? '冥想' : 'Meditate', icon: '🧠', type: 'habit' as ActivityType},
                    {name: isZh ? '护肤' : 'Skincare', icon: '✨', type: 'habit' as ActivityType}
                ]
            },
            {
                title: t.categories.housework,
                color: 'var(--card-orange)',
                items: [
                    {name: isZh ? '大扫除' : 'Cleaning', icon: '🧹', type: 'habit' as ActivityType},
                    {name: isZh ? '下厨' : 'Cooking', icon: '🍳', type: 'habit' as ActivityType}
                ]
            }
        ];
        const cats = checkinSubTab === 'sport' ? SPORT_CATS : LIFE_CATS;

        const openDetail = (item: any) => {
            setSelectedItem(item);
            setEditName(item.name.includes('自定义') || item.name.includes('Custom') ? '' : item.name);
        };

        if (selectedItem) return (
            <div className="view">
                <div className="sub-header">
                    <button onClick={() => setSelectedItem(null)} className="back-btn-square">⬅️</button>
                    <h2>{t.checkinDetails}</h2>
                </div>
                <div className="detail-card">
                    <div style={{display:'flex', gap:'20px', marginBottom:'24px', alignItems:'center'}}>
                        <div style={{width:'80px', height:'80px', background:'var(--input-bg)', borderRadius:'24px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'40px', border:'1px solid var(--border-color)'}}>{selectedItem.icon}</div>
                        <div style={{flex:1}}>
                            <p style={{color:'var(--accent)', fontSize:'12px', fontWeight:'800', marginBottom:'4px'}}>{selectedItem.category}</p>
                            <input 
                                type="text" 
                                className="name-edit-input" 
                                placeholder={t.matterName}
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Specialized Inputs based on ActivityType */}
                    {selectedItem.type === 'cardio' && (
                        <>
                            <div className="input-group" style={{marginBottom:'20px'}}>
                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                                    <label style={{fontWeight:'700', color:'var(--text-soft)'}}>{t.duration}</label>
                                    <span style={{color:'var(--accent)', fontWeight:'800'}}><span id="dur-val">30</span> {t.min}</span>
                                </div>
                                <input type="range" className="peach-range" style={{width:'100%'}} min="0" max="120" defaultValue="30" id="dur-s" onChange={(e) => {
                                    const val = document.getElementById('dur-val');
                                    if (val) val.innerText = e.target.value;
                                }} />
                            </div>
                            <div className="input-group" style={{marginBottom:'20px'}}>
                                <label style={{fontWeight:'700', color:'var(--text-soft)', display:'block', marginBottom:'10px'}}>{t.distance}</label>
                                <div style={{display:'flex', gap:'10px'}}>
                                    <input type="number" id="dist-v" className="text-input-compact" placeholder="0.0" step="0.1" style={{flex: 2.5, minWidth: '100px'}} />
                                    <select id="dist-u" className="select-compact" style={{flex: 1, minWidth: '75px'}}>
                                        <option value="km">{t.km}</option>
                                        <option value="m">{t.m}</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}

                    {selectedItem.type === 'strength' && (
                        <div className="input-group" style={{marginBottom:'20px', display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:'15px'}}>
                            <div style={{minWidth: 0}}>
                                <label style={{fontWeight:'700', color:'var(--text-soft)', display:'block', marginBottom:'10px'}}>{t.count}</label>
                                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                    <input type="number" id="count-v" className="text-input-compact" placeholder="0" style={{flex:1, minWidth: 0}} />
                                    <span style={{fontSize:'12px', color:'var(--text-soft)', flexShrink: 0}}>{t.times}</span>
                                </div>
                            </div>
                            <div style={{minWidth: 0}}>
                                <label style={{fontWeight:'700', color:'var(--text-soft)', display:'block', marginBottom:'10px'}}>{t.sets}</label>
                                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                    <input type="number" id="sets-v" className="text-input-compact" placeholder="0" style={{flex:1, minWidth: 0}} />
                                    <span style={{fontSize:'12px', color:'var(--text-soft)', flexShrink: 0}}>{t.groups}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedItem.type === 'wakeup' && (
                        <div className="input-group" style={{marginBottom:'24px'}}>
                            <label style={{fontWeight:'700', color:'var(--text-soft)', display:'block', marginBottom:'10px'}}>{t.wakeTime}</label>
                            <input type="time" id="wake-v" className="text-input-compact" defaultValue="07:30" style={{width:'100%', fontSize:'20px', textAlign:'center', height:'60px'}} />
                        </div>
                    )}

                    {(selectedItem.type === 'habit' || selectedItem.type === 'general') && (
                        <div className="input-group" style={{marginBottom:'24px'}}>
                            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                                <label style={{fontWeight:'700', color:'var(--text-soft)'}}>{t.duration}</label>
                                <span style={{color:'var(--accent)', fontWeight:'800'}}><span id="dur-val-h">30</span> {t.min}</span>
                            </div>
                            <input type="range" className="peach-range" style={{width:'100%'}} min="0" max="180" defaultValue="30" id="dur-h" onChange={(e) => {
                                const val = document.getElementById('dur-val-h');
                                if (val) val.innerText = e.target.value;
                            }} />
                        </div>
                    )}

                    <div className="input-group" style={{marginBottom:'24px'}}>
                        <label style={{fontWeight:'700', color:'var(--text-soft)', display:'block', marginBottom:'10px'}}>{settings.language === 'zh' ? '备注' : 'Note'}</label>
                        <textarea placeholder={isZh ? "记下此刻的心情..." : "Note your mood..."} id="note-a" className="textarea-light" rows={2} />
                    </div>

                    <div style={{display:'flex', gap:'12px'}}>
                        <button className="btn-danger-soft" style={{marginTop:0, flex:1, borderRadius:'18px'}} onClick={() => setSelectedItem(null)}>{t.nextTime}</button>
                        <button className="back-btn-square" style={{width:'auto', flex:2, height:'58px', borderRadius:'18px', background:'var(--accent)', fontSize:'16px', fontWeight:'800'}} onClick={() => {
                            const finalName = editName.trim() || selectedItem.name;
                            const note = (document.getElementById('note-a') as HTMLTextAreaElement).value;
                            
                            let payload: any = {
                                type: checkinSubTab,
                                activityType: selectedItem.type,
                                name: finalName,
                                category: selectedItem.category,
                                note: note
                            };

                            if (selectedItem.type === 'cardio') {
                                payload.duration = parseInt((document.getElementById('dur-s') as HTMLInputElement).value);
                                payload.distance = parseFloat((document.getElementById('dist-v') as HTMLInputElement).value) || 0;
                                payload.unit = (document.getElementById('dist-u') as HTMLSelectElement).value;
                            } else if (selectedItem.type === 'strength') {
                                payload.count = parseInt((document.getElementById('count-v') as HTMLInputElement).value) || 0;
                                payload.sets = parseInt((document.getElementById('sets-v') as HTMLInputElement).value) || 0;
                            } else if (selectedItem.type === 'wakeup') {
                                payload.time = (document.getElementById('wake-v') as HTMLInputElement).value;
                            } else {
                                payload.duration = parseInt((document.getElementById('dur-h') as HTMLInputElement).value) || 0;
                            }

                            handleAddRecord(payload);
                        }}>{t.complete}</button>
                    </div>
                </div>
            </div>
        );

        return (
            <div className="view">
                <div className="sub-header">
                    <button onClick={() => setView('home')} className="back-btn-square">⬅️</button>
                    <h2>{t.checkin}</h2>
                </div>
                <div style={{display:'flex', background:'var(--input-bg)', borderRadius:'16px', padding:'4px', marginBottom:'24px'}}>
                    <button className={`tab-btn ${checkinSubTab === 'sport' ? 'active' : ''}`} style={{flex:1, border:'none', background: checkinSubTab === 'sport' ? 'var(--card-bg)' : 'none', padding:'12px', borderRadius:'12px', color: checkinSubTab === 'sport' ? 'var(--accent)' : 'var(--text-soft)', fontWeight:'800'}} onClick={() => setCheckinSubTab('sport')}>{t.sportCheck}</button>
                    <button className={`tab-btn ${checkinSubTab === 'event' ? 'active' : ''}`} style={{flex:1, border:'none', background: checkinSubTab === 'event' ? 'var(--card-bg)' : 'none', padding:'12px', borderRadius:'12px', color: checkinSubTab === 'event' ? 'var(--accent)' : 'var(--text-soft)', fontWeight:'800'}} onClick={() => setCheckinSubTab('event')}>{t.eventCheck}</button>
                </div>
                {cats.map(c => (
                    <div key={c.title} style={{marginBottom:'24px'}}>
                        <h4 style={{margin:'0 0 12px 8px', color:'var(--text-soft)', fontSize:'14px'}}>{c.title}</h4>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
                            {c.items.map(i => (
                                <div key={i.name} className="nav-card" style={{background: c.color, border:'none', padding: '16px'}} onClick={() => openDetail({...i, category: c.title})}>
                                    <span style={{fontSize:'28px', marginBottom:'4px'}}>{i.icon}</span>
                                    <span style={{fontWeight:'700', fontSize:'13px'}}>{i.name}</span>
                                </div>
                            ))}
                            <div className="nav-card" style={{border:'2px dashed var(--border-color)', background:'none', padding: '16px'}} onClick={() => openDetail({name: isZh ? '自定义任务' : 'Custom Task', icon: '📝', category: c.title, type: checkinSubTab === 'sport' ? 'strength' : 'habit'})}>
                                <span style={{fontSize:'28px', marginBottom:'4px'}}>➕</span>
                                <span style={{fontWeight:'700', fontSize:'13px', color:'var(--accent)'}}>{isZh ? '自定义' : 'Custom'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderHome = () => {
        const today = new Date().setHours(0,0,0,0);
        const todayRecords = records.filter(r => new Date(r.timestamp).setHours(0,0,0,0) === today);
        return (
            <div className="view">
                <header className="user-header">
                    <div className="avatar">🥑</div>
                    <div className="info">
                        <h2>{settings.language === 'zh' ? '你好，开启活力一天' : 'Hello, active day!'}</h2>
                        <p>{t.personalAssistant} · {t.warmMoments}</p>
                    </div>
                    <button className="settings-btn" onClick={() => setView('settings')}>⚙️</button>
                </header>
                <div className="grid-nav">
                    <div className="nav-card card-orange" onClick={() => setView('checkin')}><div className="icon-bg-wrap"><span style={{fontSize:'32px'}}>👟</span></div><span>{t.checkin}</span></div>
                    <div className="nav-card card-blue" onClick={() => setView('food')}><div className="icon-bg-wrap"><span style={{fontSize:'32px'}}>🍎</span></div><span>{t.calories}</span></div>
                    <div className="nav-card card-pink" onClick={() => {}}><div className="icon-bg-wrap"><span style={{fontSize:'32px'}}>❤️</span></div><span>{t.anniversary}</span></div>
                    <div className="nav-card card-purple" onClick={() => setView('stats')}><div className="icon-bg-wrap"><span style={{fontSize:'32px'}}>📊</span></div><span>{t.stats}</span></div>
                </div>
                <section className="footprint-section">
                    <div className="section-title">✨ {t.todaySteps}</div>
                    <div className="footprint-card">
                        {todayRecords.length === 0 ? <div className="empty-state"><p>{t.noRecords}</p></div> : 
                        <ul style={{listStyle:'none', padding:0, margin:0}}>{todayRecords.map(r => (
                            <li key={r.id} className="record-item">
                                <div style={{display:'flex', alignItems:'center'}}>
                                    <div className="item-icon-small"><span>{r.activityType === 'wakeup' ? '🌅' : r.type === 'sport' ? '💪' : '📝'}</span></div>
                                    <div style={{marginLeft:'12px'}}>
                                        <p className="item-name" style={{margin:0}}>{r.name}</p>
                                        <p style={{fontSize:'11px', color:'var(--text-soft)', margin:'2px 0 0'}}>
                                            {r.activityType === 'wakeup' && `🕒 ${r.time}`}
                                            {r.activityType === 'cardio' && `⏱️ ${r.duration}min · 📍 ${r.distance}${r.unit}`}
                                            {r.activityType === 'strength' && `🔥 ${r.sets}${t.groups} · 🔢 ${r.count}${t.times}`}
                                            {(r.activityType === 'habit' || r.activityType === 'general') && `⏱️ ${r.duration}min`}
                                            {` · ${r.category}`}
                                        </p>
                                    </div>
                                </div>
                                <div style={{opacity:0.3}}>🌱</div>
                            </li>
                        ))}</ul>}
                    </div>
                </section>
            </div>
        );
    };

    return (
        <div className={`app-container ${isRefreshing ? 'refresh-anim' : ''}`}>
            {showSuccess && (
                <div className="success-overlay" style={{position:'fixed', inset:0, background: settings.isDarkMode ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)', zIndex:2000, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
                    <span style={{fontSize:'80px', marginBottom:'20px'}}>✨</span>
                    <h1 style={{color:'var(--accent)'}}>{t.successMsg}</h1>
                    <p style={{color:'var(--text-soft)', fontWeight:'700'}}>{t.successSub}</p>
                </div>
            )}
            <main className="content-area">
                {view === 'home' && renderHome()}
                {view === 'checkin' && renderCheckinSelection()}
                {view === 'food' && (
                    <div className="view">
                        <div className="sub-header"><button onClick={() => setView('home')} className="back-btn-square">⬅️</button><h2>AI {t.calories}</h2></div>
                        <div className="detail-card" style={{textAlign:'center', background:'var(--card-bg)', padding:'40px', borderRadius:'32px', border:'1px solid var(--border-color)'}}>
                            {isAnalyzing ? <div className="refresh-anim">Analyzing...</div> : calorieResult ? <div className="refresh-anim" style={{textAlign:'left', whiteSpace:'pre-wrap'}}>{calorieResult}</div> : (
                                <label style={{cursor:'pointer'}}><input type="file" hidden onChange={handleImageUpload} /><div style={{fontSize:'64px', marginBottom:'20px'}}>📸</div><h3>{t.scanFood}</h3></label>
                            )}
                        </div>
                    </div>
                )}
                {view === 'stats' && (
                    <div className="view">
                        <div className="sub-header"><button onClick={() => setView('home')} className="back-btn-square">⬅️</button><h2>{t.stats}</h2></div>
                        <div className="settings-card" style={{padding:'32px', textAlign:'center'}}>
                            <div style={{fontSize:'48px', marginBottom:'16px'}}>📊</div>
                            <p style={{fontSize:'20px', fontWeight:'800', margin:0}}>{records.length}</p>
                            <p style={{color:'var(--text-soft)', fontSize:'14px'}}>{settings.language === 'zh' ? '总打卡次数' : 'Total Check-ins'}</p>
                        </div>
                    </div>
                )}
                {view === 'settings' && renderSettings()}
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
