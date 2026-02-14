
import { GoogleGenAI } from '@google/genai';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';

// --- Types ---
type ActivityType = 'cardio' | 'strength' | 'habit' | 'wakeup' | 'general';
type DarkModeType = 'manual' | 'system';
type AnimIntensity = 'strong' | 'medium' | 'weak' | 'off';

interface ReminderSettings {
    checkInEnabled: boolean;
    reminderCount: number;
    interval: number;
    dndStart: string;
    dndEnd: string;
    auxiliaryEnabled: boolean;
    reportNotify: boolean;
    shareNotify: boolean;
    messageCenterNotify: boolean;
    animIntensity: AnimIntensity;
}

interface AppSettings {
    language: 'zh' | 'en';
    darkModeType: DarkModeType;
    manualDarkMode: boolean;
    pushNotifications: boolean;
    inAppPopups: boolean;
    vibration: boolean;
    reminders: ReminderSettings;
}

interface CheckInRecord {
    id: string;
    timestamp: number;
    type: 'sport' | 'event';
    activityType: ActivityType;
    name: string;
    category: string;
    note?: string;
    duration?: number;
    distance?: number;
    unit?: string;
    count?: number;
    sets?: number;
    time?: string;
}

interface Anniversary {
    id: string;
    name: string;
    date: string; // YYYY-MM-DD
    category: 'love' | 'birthday' | 'life' | 'goal';
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
        followSystem: '跟随系统', manualControl: '手动开关',
        storage: '存储与缓存', clearCache: '清除本地记录', storageUsage: '已保存记录',
        confirmClear: '确定要清除所有记录吗？此操作无法撤销。',
        langOptions: { zh: '中文简体', en: 'English' },
        aiVision: 'AI 视觉分析', scanFood: '扫描食物',
        successMsg: '太棒啦✨', successSub: '坚持就是胜利💪',
        nextTime: '稍后再说', customTask: '自定义任务',
        distance: '运动距离', km: '公里', m: '米',
        count: '个数', sets: '组数', times: '次', groups: '组',
        wakeTime: '起床时间', min: '分钟',
        reminder: {
            title: '提醒设置', checkIn: '打卡提醒', auxiliary: '辅助提醒', count: '提醒次数',
            interval: '提醒间隔', dnd: '免打扰时段', anim: '动画强度',
            authNeeded: '请授权通知权限，以使用提醒功能', goAuth: '去授权',
            report: '统计报告', share: '分享成功', message: '消息中心',
            intensity: { strong: '强', medium: '中', weak: '弱', off: '关闭' }
        },
        anniv: {
            title: '小岁月的记录', add: '记下一刻', name: '在这个日子...', date: '选择日期',
            past: '已度过', future: '还有', day: '天', empty: '生活需要仪式感，记下一件事吧~',
            delete: '删除', confirmDel: '确定要删除这个纪念日吗？',
            cats: { love: '浪漫恋爱', birthday: '温馨生日', life: '平凡生活', goal: '理想目标' },
            valentineTitle: '情人节快乐 ❤️',
            valentineWish: '愿你的生活被爱填满，每一个小日子都闪闪发光。',
            valentineBtn: '收下爱意'
        },
        statLabels: {
            streak: '连续打卡', today: '今日达成', total: '累计总数',
            weekly: '周活跃度', distribution: '生活分布', topItems: '最常进行',
            days: '天', items: '项'
        },
        categories: {
            cardio: '有氧训练', strength: '塑形力量', flexibility: '柔韧伸展',
            habits: '自律习惯', mind: '精神寄托', housework: '工作'
        }
    },
    en: {
        home: 'Home', checkin: 'Check-in', calories: 'Calories', stats: 'Stats',
        anniversary: 'Anniversary', settings: 'Settings',
        todaySteps: "Today's Journey", noRecords: 'No records today yet~',
        personalAssistant: 'Assistant', warmMoments: 'Warm moments',
        complete: 'Done', matterName: 'Task Name', duration: 'Duration',
        checkinDetails: 'Details', sportCheck: 'Sport', eventCheck: 'Life',
        general: 'General', language: 'Language', darkMode: 'Night Mode',
        followSystem: 'Follow System', manualControl: 'Manual Toggle',
        storage: 'Storage & Cache', clearCache: 'Clear Cache', storageUsage: 'Saved',
        confirmClear: 'Clear all records? This cannot be undone.',
        langOptions: { zh: 'Simplified Chinese', en: 'English' },
        aiVision: 'AI Vision', scanFood: 'Scan Food',
        successMsg: 'Awesome! ✨', successSub: 'Consistency is key 💪',
        nextTime: 'Later', customTask: 'Custom Task',
        distance: 'Distance', km: 'km', m: 'm',
        count: 'Count', sets: 'Sets', times: 'times', groups: 'sets',
        wakeTime: 'Wake-up Time', min: 'min',
        reminder: {
            title: 'Reminders', checkIn: 'Check-in Alert', auxiliary: 'Auxiliary Alert', count: 'Alert Count',
            interval: 'Interval', dnd: 'DND Period', anim: 'Animation',
            authNeeded: 'Please grant notification permission', goAuth: 'Grant',
            report: 'Report Notify', share: 'Share Notify', message: 'Message Center',
            intensity: { strong: 'High', medium: 'Med', weak: 'Weak', off: 'Off' }
        },
        anniv: {
            title: 'Memory Lane', add: 'Record Moment', name: 'On this day...', date: 'Pick Date',
            past: 'Passed', future: 'Remaining', day: 'Days', empty: 'Life needs ceremony, record something~',
            delete: 'Delete', confirmDel: 'Delete this anniversary?',
            cats: { love: 'Romance', birthday: 'Birthday', life: 'Daily Life', goal: 'Milestone' },
            valentineTitle: 'Happy Valentine\'s ❤️',
            valentineWish: 'May your life be filled with love, and every small day shine bright.',
            valentineBtn: 'Accept Love'
        },
        statLabels: {
            streak: 'Streak', today: 'Today', total: 'Total',
            weekly: 'Weekly Momentum', distribution: 'Life Balance', topItems: 'Top Activities',
            days: 'days', items: 'items'
        },
        categories: {
            cardio: 'Cardio', strength: 'Strength', flexibility: 'Flexibility',
            habits: 'Habits', mind: 'Mindfulness', housework: 'Work'
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

const Clock = ({ lang }: { lang: 'zh' | 'en' }) => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const dateStr = time.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    });
    const timeStr = time.toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });

    return (
        <div className="clock-widget" style={{padding:'24px', background:'white', borderRadius:'32px', textAlign:'center', boxShadow:'0 10px 30px rgba(0,0,0,0.03)', marginBottom:'32px'}}>
            <div className="clock-time" style={{fontSize:'48px', fontWeight:'900', color:'var(--accent)', letterSpacing:'-1px'}}>{timeStr}</div>
            <div className="clock-date" style={{fontSize:'14px', fontWeight:'700', color:'var(--text-soft)', marginTop:'4px'}}>{dateStr}</div>
        </div>
    );
};

function App() {
    const [view, setView] = useState<'home' | 'checkin' | 'food' | 'stats' | 'settings' | 'anniversary'>('home');
    const [checkinSubTab, setCheckinSubTab] = useState<'sport' | 'event'>('sport');
    const [records, setRecords] = useState<CheckInRecord[]>([]);
    const [anniversaries, setAnniversaries] = useState<Anniversary[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);
    
    const [settings, setSettings] = useState<AppSettings>({
        language: 'zh',
        darkModeType: 'system',
        manualDarkMode: false,
        pushNotifications: true,
        inAppPopups: true,
        vibration: true,
        reminders: {
            checkInEnabled: true,
            reminderCount: 1,
            interval: 10,
            dndStart: '23:00',
            dndEnd: '07:00',
            auxiliaryEnabled: true,
            reportNotify: true,
            shareNotify: true,
            messageCenterNotify: false,
            animIntensity: 'medium'
        }
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
        const savedAnniv = localStorage.getItem('jq_anniv');
        if (savedRecords) setRecords(JSON.parse(savedRecords));
        if (savedAnniv) setAnniversaries(JSON.parse(savedAnniv));
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setSettings(prev => ({ ...prev, ...parsed }));
        }
    }, []);

    useEffect(() => {
        const applyTheme = () => {
            let isDark = settings.darkModeType === 'system' 
                ? window.matchMedia('(prefers-color-scheme: dark)').matches 
                : settings.manualDarkMode;
            document.body.className = isDark ? 'dark' : '';
        };
        applyTheme();
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = () => { if (settings.darkModeType === 'system') applyTheme(); };
        mediaQuery.addEventListener('change', listener);
        if (!firstUpdate.current) {
            localStorage.setItem('jq_records', JSON.stringify(records));
            localStorage.setItem('jq_settings', JSON.stringify(settings));
            localStorage.setItem('jq_anniv', JSON.stringify(anniversaries));
        }
        firstUpdate.current = false;
        return () => mediaQuery.removeEventListener('change', listener);
    }, [records, settings, anniversaries]);

    const statsData = useMemo(() => {
        if (records.length === 0) return null;
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const todayCount = records.filter(r => r.timestamp >= startOfToday).length;
        let streak = 0;
        const recordDates: number[] = Array.from(new Set<number>(records.map(r => {
            const d = new Date(r.timestamp);
            return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        }))).sort((a: number, b: number) => b - a);

        if (recordDates.length > 0) {
            let current = startOfToday;
            if (recordDates[0] < startOfToday) current = startOfToday - 86400000;
            for (let i = 0; i < recordDates.length; i++) {
                if (recordDates[i] === current) { streak++; current -= 86400000; } 
                else if (recordDates[i] < current) break;
            }
        }
        const weekly = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(startOfToday - (6 - i) * 86400000);
            const label = settings.language === 'zh' ? ['日', '一', '二', '三', '四', '五', '六'][d.getDay()] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()];
            const count = records.filter(r => {
                const rd = new Date(r.timestamp);
                return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth() && rd.getDate() === d.getDate();
            }).length;
            return { label, count };
        });
        const types: Record<ActivityType, number> = { cardio: 0, strength: 0, habit: 0, wakeup: 0, general: 0 };
        records.forEach(r => types[r.activityType]++);
        const distribution = Object.entries(types).map(([key, value]) => ({ type: key as ActivityType, count: value })).filter(d => d.count > 0).sort((a, b) => b.count - a.count);
        return { todayCount, streak, weekly, distribution };
    }, [records, settings.language]);

    const handleAddRecord = (record: Omit<CheckInRecord, 'id' | 'timestamp'>) => {
        const newRecord: CheckInRecord = { ...record, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() };
        setRecords([newRecord, ...records]);
        setShowSuccess(true);
        setTimeout(() => { setShowSuccess(false); setSelectedItem(null); setView('home'); }, 2200);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsAnalyzing(true);
        setCalorieResult(null);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: {
                        parts: [
                            { inlineData: { data: base64Data, mimeType: file.type } },
                            { text: settings.language === 'zh' ? "请分析这张图片中的食物，估计其热量（卡路里），并给出简单的营养建议。请用中文回答。" : "Please analyze the food in this image, estimate its calories, and provide simple nutritional advice. Please answer in English." }
                        ]
                    }
                });
                setCalorieResult(response.text || '');
            } catch (err) {
                setCalorieResult(settings.language === 'zh' ? '分析失败，请稍后重试' : 'Analysis failed, please try again later');
            } finally { setIsAnalyzing(false); }
        };
        reader.readAsDataURL(file);
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
                <Clock lang={settings.language} />
                <div className="grid-nav">
                    <div className="nav-card card-orange" onClick={() => setView('checkin')}><div className="icon-bg-wrap"><span style={{fontSize:'32px'}}>👟</span></div><span>{t.checkin}</span></div>
                    <div className="nav-card card-blue" onClick={() => setView('food')}><div className="icon-bg-wrap"><span style={{fontSize:'32px'}}>🍎</span></div><span>{t.calories}</span></div>
                    <div className="nav-card card-pink" onClick={() => setView('anniversary')}><div className="icon-bg-wrap"><span style={{fontSize:'32px'}}>❤️</span></div><span>{t.anniversary}</span></div>
                    <div className="nav-card card-purple" onClick={() => setView('stats')}><div className="icon-bg-wrap"><span style={{fontSize:'32px'}}>📊</span></div><span>{t.stats}</span></div>
                </div>
                <section className="footprint-section">
                    <div className="section-title">✨ {t.todaySteps}</div>
                    <div className="footprint-card">
                        {todayRecords.length === 0 ? 
                            <div className="empty-state"><p>{t.noRecords}</p></div> : 
                            <ul style={{listStyle:'none', padding:0, margin:0}}>
                                {todayRecords.map(r => (
                                    <li key={r.id} className="record-item" style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px', borderBottom:'1px solid #F9F9F9'}}>
                                        <div style={{display:'flex', alignItems:'center'}}>
                                            <div className="item-icon-small" style={{width:'44px', height:'44px', background:'#F7F7F7', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px'}}>
                                                <span>{r.activityType === 'wakeup' ? '🌅' : r.type === 'sport' ? '💪' : '📝'}</span>
                                            </div>
                                            <div style={{marginLeft:'14px'}}>
                                                <p className="item-name" style={{margin:0, fontWeight:'800', fontSize:'15px'}}>{r.name}</p>
                                                <p style={{fontSize:'12px', color:'var(--text-soft)', margin:'2px 0 0', fontWeight:'600'}}>
                                                    {r.activityType === 'wakeup' && `🕒 ${r.time}`}
                                                    {r.activityType === 'cardio' && `⏱️ ${r.duration}min · 📍 ${r.distance}${r.unit}`}
                                                    {r.activityType === 'strength' && `🔥 ${r.sets}${t.groups} · 🔢 ${r.count}${t.times}`}
                                                    {(r.activityType === 'habit' || r.activityType === 'general') && `⏱️ ${r.duration}min`}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        }
                    </div>
                </section>
            </div>
        );
    };

    return (
        <div className={`app-container`}>
            {showSuccess && (
                <div className="success-overlay"><span style={{fontSize:'80px', marginBottom:'20px'}}>✨</span><h1 style={{color:'var(--accent)'}}>{t.successMsg}</h1><p style={{color:'var(--text-soft)', fontWeight:'700'}}>{t.successSub}</p></div>
            )}
            <main className="content-area">
                {view === 'home' && renderHome()}
                {view === 'checkin' && <CheckinSelection t={t} checkinSubTab={checkinSubTab} setCheckinSubTab={setCheckinSubTab} setSelectedItem={setSelectedItem} handleAddRecord={handleAddRecord} setView={setView} selectedItem={selectedItem} editName={editName} setEditName={setEditName} />}
                {view === 'food' && (<div className="view"><div className="sub-header"><button onClick={() => setView('home')} className="back-btn-square">⬅️</button><h2>AI {t.calories}</h2></div><div className="detail-card" style={{textAlign:'center', background:'var(--card-bg)', padding:'40px', borderRadius:'32px', border:'1px solid var(--border-color)'}}>{isAnalyzing ? <div className="refresh-anim">Analyzing...</div> : calorieResult ? <div className="refresh-anim" style={{textAlign:'left', whiteSpace:'pre-wrap'}}>{calorieResult}</div> : (<label style={{cursor:'pointer'}}><input type="file" hidden onChange={handleImageUpload} /><div style={{fontSize:'64px', marginBottom:'20px'}}>📸</div><h3>{t.scanFood}</h3></label>)}</div></div>)}
                {view === 'stats' && <StatsView t={t} statsData={statsData} setView={setView} records={records} />}
                {view === 'anniversary' && <AnniversaryView t={t} anniversaries={anniversaries} setAnniversaries={setAnniversaries} setView={setView} />}
                {view === 'settings' && <SettingsView t={t} settings={settings} setSettings={setSettings} setView={setView} records={records} setRecords={setRecords} />}
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

function SettingsView({ t, settings, setSettings, setView, records, setRecords }: any) {
    const update = (obj: Partial<AppSettings>) => setSettings((p: AppSettings) => ({ ...p, ...obj }));
    const updateReminders = (obj: Partial<ReminderSettings>) => setSettings((p: AppSettings) => ({ ...p, reminders: { ...p.reminders, ...obj } }));

    return (
        <div className="view">
            <div className="sub-header">
                <button onClick={() => setView('home')} className="back-btn-square">⬅️</button>
                <h2>{t.settings}</h2>
            </div>

            <section className="settings-section">
                <h4 className="category-title">{t.general}</h4>
                <div className="settings-card">
                    <div className="setting-item">
                        <span>{t.language}</span>
                        <div className="segment-control">
                            <button className={settings.language === 'zh' ? 'active' : ''} onClick={() => update({ language: 'zh' })}>ZH</button>
                            <button className={settings.language === 'en' ? 'active' : ''} onClick={() => update({ language: 'en' })}>EN</button>
                        </div>
                    </div>
                    <div className="setting-item">
                        <span>{t.darkMode} ({t.followSystem})</span>
                        <label className="cream-switch">
                            <input type="checkbox" checked={settings.darkModeType === 'system'} onChange={e => update({ darkModeType: e.target.checked ? 'system' : 'manual' })} />
                            <span className="slider"></span>
                        </label>
                    </div>
                    {settings.darkModeType === 'manual' && (
                        <div className="setting-item">
                            <span>{t.manualControl}</span>
                            <label className="cream-switch">
                                <input type="checkbox" checked={settings.manualDarkMode} onChange={e => update({ manualDarkMode: e.target.checked })} />
                                <span className="slider"></span>
                            </label>
                        </div>
                    )}
                </div>
            </section>

            <section className="settings-section">
                <h4 className="category-title">{t.reminder.title}</h4>
                <div className="settings-card">
                    <div className="setting-item">
                        <span>{t.reminder.checkIn}</span>
                        <label className="cream-switch">
                            <input type="checkbox" checked={settings.reminders.checkInEnabled} onChange={e => updateReminders({ checkInEnabled: e.target.checked })} />
                            <span className="slider"></span>
                        </label>
                    </div>
                    <div className="setting-item">
                        <span>{t.reminder.count}</span>
                        <div className="segment-control small">
                            {[1, 2, 3].map(v => (
                                <button key={v} className={settings.reminders.reminderCount === v ? 'active' : ''} onClick={() => updateReminders({ reminderCount: v })}>{v}</button>
                            ))}
                        </div>
                    </div>
                    <div className="setting-item">
                        <span>{t.reminder.interval} (min)</span>
                        <div className="segment-control small">
                            {[5, 10, 30].map(v => (
                                <button key={v} className={settings.reminders.interval === v ? 'active' : ''} onClick={() => updateReminders({ interval: v })}>{v}</button>
                            ))}
                        </div>
                    </div>
                    <div className="setting-item vertical">
                        <span>{t.reminder.dnd}</span>
                        <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '8px' }}>
                            <input type="time" className="time-input-simple" value={settings.reminders.dndStart} onChange={e => updateReminders({ dndStart: e.target.value })} />
                            <span style={{ alignSelf: 'center', opacity: 0.3 }}>-</span>
                            <input type="time" className="time-input-simple" value={settings.reminders.dndEnd} onChange={e => updateReminders({ dndEnd: e.target.value })} />
                        </div>
                    </div>
                    <div className="setting-item">
                        <span>{t.reminder.anim}</span>
                        <div className="segment-control">
                            {(['strong', 'medium', 'weak', 'off'] as AnimIntensity[]).map(v => (
                                <button key={v} className={settings.reminders.animIntensity === v ? 'active' : ''} onClick={() => updateReminders({ animIntensity: v })}>{t.reminder.intensity[v]}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="settings-section">
                <h4 className="category-title">{t.storage}</h4>
                <div className="settings-card">
                    <div className="setting-item">
                        <span>{t.storageUsage}</span>
                        <span style={{ fontWeight: '800', color: 'var(--text-soft)' }}>{records.length} {t.statLabels.items}</span>
                    </div>
                    <button className="setting-action-btn danger" onClick={() => {
                        if (confirm(t.confirmClear)) {
                            setRecords([]);
                            localStorage.removeItem('jq_records');
                        }
                    }}>
                        {t.clearCache}
                    </button>
                </div>
            </section>
        </div>
    );
}

function AnniversaryView({ t, anniversaries, setAnniversaries, setView }: any) {
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newCat, setNewCat] = useState<'love' | 'birthday' | 'life' | 'goal'>('life');
    const [showValentine, setShowValentine] = useState(false);

    useEffect(() => {
        const now = new Date();
        const isFeb14 = now.getMonth() === 1 && now.getDate() === 14;
        const hasSeenToday = sessionStorage.getItem('seen_valentine_today');
        if (isFeb14 && !hasSeenToday) {
            setShowValentine(true);
            sessionStorage.setItem('seen_valentine_today', 'true');
        }
    }, []);

    const handleAdd = () => {
        if (!newName || !newDate) return;
        const item: Anniversary = { id: Math.random().toString(36).substr(2, 9), name: newName, date: newDate, category: newCat };
        setAnniversaries([...anniversaries, item]);
        setNewName(''); setNewDate(''); setShowAdd(false);
    };

    const handleDelete = (id: string) => {
        if (confirm(t.anniv.confirmDel)) {
            setAnniversaries(anniversaries.filter((a: Anniversary) => a.id !== id));
        }
    };

    const calculateDays = (dateStr: string) => {
        const target = new Date(dateStr).setHours(0,0,0,0);
        const today = new Date().setHours(0,0,0,0);
        const diff = Math.floor((target - today) / (1000 * 60 * 60 * 24));
        return { diff, isPast: diff < 0 };
    };

    const getIcon = (cat: string) => {
        switch(cat) {
            case 'love': return { emoji: '❤️', color: 'var(--card-pink)' };
            case 'birthday': return { emoji: '🎂', color: 'var(--card-orange)' };
            case 'goal': return { emoji: '🎯', color: 'var(--card-blue)' };
            default: return { emoji: '🌱', color: 'var(--card-purple)' };
        }
    };

    return (
        <div className="view">
            <div className="sub-header">
                <button onClick={() => setView('home')} className="back-btn-square">⬅️</button>
                <h2>{t.anniv.title}</h2>
            </div>

            <div className="anniv-stats" style={{display:'flex', justifyContent:'space-between', padding:'0 8px 24px'}}>
                <span style={{fontSize:'13px', fontWeight:'700', color:'var(--text-soft)'}}>已收录 {anniversaries.length} 个瞬间</span>
                <button onClick={() => setShowAdd(true)} style={{fontSize:'13px', fontWeight:'850', color:'var(--accent)'}}>+ {t.anniv.add}</button>
            </div>

            {anniversaries.length === 0 ? (
                <div className="empty-state" style={{marginTop:'80px'}}>
                    <div style={{fontSize:'64px', marginBottom:'16px', opacity:0.6}}>📅</div>
                    <p style={{color:'var(--text-soft)', fontWeight:'600'}}>{t.anniv.empty}</p>
                </div>
            ) : (
                <div className="anniv-list" style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                    {anniversaries.map((a: Anniversary) => {
                        const { diff, isPast } = calculateDays(a.date);
                        const { emoji, color } = getIcon(a.category);
                        return (
                            <div key={a.id} className="anniv-card" onClick={() => handleDelete(a.id)} style={{background:'white', borderRadius:'32px', padding:'24px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'var(--shadow-soft)'}}>
                                <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
                                    <div style={{width:'56px', height:'56px', background:color, borderRadius:'20px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px'}}>{emoji}</div>
                                    <div>
                                        <p style={{margin:0, fontWeight:'850', fontSize:'16px'}}>{a.name}</p>
                                        <p style={{margin:'4px 0 0', fontSize:'12px', color:'var(--text-soft)', fontWeight:'600'}}>{a.date}</p>
                                    </div>
                                </div>
                                <div style={{textAlign:'right'}}>
                                    <p style={{margin:0, fontSize:'11px', fontWeight:'800', color:'var(--text-soft)', textTransform:'uppercase'}}>{isPast ? t.anniv.past : t.anniv.future}</p>
                                    <p style={{margin:0, fontSize:'24px', fontWeight:'900', color:'var(--accent)'}}>{Math.abs(diff)}<span style={{fontSize:'12px', fontWeight:'700', marginLeft:'2px'}}>{t.anniv.day}</span></p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showValentine && (
                <div className="valentine-overlay" style={{position:'fixed', inset:0, zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', background:'rgba(255, 251, 248, 0.85)', backdropFilter:'blur(20px)', animation:'fadeIn 0.5s ease'}}>
                    <div className="valentine-card" style={{background:'white', width:'100%', maxWidth:'320px', borderRadius:'48px', padding:'48px 24px', textAlign:'center', boxShadow:'0 20px 60px rgba(255, 107, 107, 0.15)', animation:'slideInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'}}>
                        <div className="heart-icon-floating" style={{fontSize:'72px', marginBottom:'24px', display:'inline-block', animation:'floating 3s ease-in-out infinite'}}>❤️</div>
                        <h2 style={{margin:'0 0 16px', fontSize:'24px', fontWeight:'900', color:'var(--accent)'}}>{t.anniv.valentineTitle}</h2>
                        <p style={{margin:'0 0 40px', fontSize:'15px', color:'var(--text-soft)', lineHeight:'1.6', fontWeight:'700'}}>{t.anniv.valentineWish}</p>
                        <button onClick={() => setShowValentine(false)} className="btn-confirm highlight" style={{width:'100%', height:'64px', borderRadius:'24px'}}>{t.anniv.valentineBtn}</button>
                    </div>
                </div>
            )}

            {showAdd && (
                <div className="drawer-overlay" onClick={() => setShowAdd(false)} style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.1)', backdropFilter:'blur(4px)', zIndex:2000, display:'flex', alignItems:'flex-end'}}>
                    <div className="drawer-content" onClick={e => e.stopPropagation()} style={{width:'100%', background:'white', borderTopLeftRadius:'40px', borderTopRightRadius:'40px', padding:'40px 24px', animation:'slideInUp 0.4s cubic-bezier(0, 0, 0.2, 1)'}}>
                        <div style={{width:'40px', height:'4px', background:'#EEE', borderRadius:'2px', margin:'0 auto 32px'}}></div>
                        <h3 style={{margin:'0 0 24px', textAlign:'center', fontSize:'20px', fontWeight:'850'}}>{t.anniv.add}</h3>
                        
                        <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder={t.anniv.name} style={{width:'100%', height:'56px', borderRadius:'20px', background:'#F4F4F7', border:'none', padding:'0 20px', fontSize:'16px', fontWeight:'700'}} />
                            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={{width:'100%', height:'56px', borderRadius:'20px', background:'#F4F4F7', border:'none', padding:'0 20px', fontSize:'16px', fontWeight:'700'}} />
                            
                            <div className="preset-chips" style={{justifyContent:'center'}}>
                                {(Object.keys(t.anniv.cats) as Array<keyof typeof t.anniv.cats>).map(cat => (
                                    <button key={cat} onClick={() => setNewCat(cat)} className={newCat === cat ? 'active' : ''}>{t.anniv.cats[cat]}</button>
                                ))}
                            </div>

                            <button onClick={handleAdd} className="btn-confirm highlight" style={{marginTop:'12px', width:'100%'}}>{t.complete} ✨</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function CheckinSelection({ t, checkinSubTab, setCheckinSubTab, setSelectedItem, handleAddRecord, setView, selectedItem, editName, setEditName }: any) {
    const isZh = t.langOptions.zh === '中文简体';
    const [localValues, setLocalValues] = useState<any>({
        duration: 30, distance: 0, count: 0, sets: 0, time: '07:30', unit: 'km'
    });

    const adjust = (key: string, delta: number) => {
        setLocalValues((p: any) => ({ ...p, [key]: Math.max(0, Number((p[key] + delta).toFixed(1))) }));
    };

    const SPORT_CATS = [
        { title: t.categories.cardio, color:'var(--card-blue)', items: [
            {name: isZh?'晨跑':'Morning Run', icon: '🏃', type: 'cardio'}, 
            {name: isZh?'游泳':'Swimming', icon: '🏊', type: 'cardio'}, 
            {name: isZh?'自行车':'Cycling', icon: '🚲', type: 'cardio'}, 
            {name: isZh?'步行':'Walking', icon: '🚶', type: 'cardio'},
            {name: isZh?'羽毛球':'Badminton', icon: '🏸', type: 'cardio'},
            {name: isZh?'跳绳':'Jump Rope', icon: '➰', type: 'strength'},
            {name: isZh?'登山':'Climbing', icon: '🧗', type: 'cardio'}
        ] },
        { title: t.categories.strength, color:'var(--card-orange)', items: [
            {name: isZh?'深蹲':'Squat', icon: '💪', type: 'strength'}, 
            {name: isZh?'俯卧撑':'Push-ups', icon: '🏋️', type: 'strength'}, 
            {name: isZh?'核心':'Core', icon: '🧘', type: 'strength'},
            {name: isZh?'瑜伽':'Yoga', icon: '🧘‍♀️', type: 'strength'},
            {name: isZh?'HIIT':'HIIT', icon: '🔥', type: 'strength'}
        ] }
    ];
    const LIFE_CATS = [
        { title: t.categories.habits, color:'var(--card-purple)', items: [
            {name: isZh?'早起':'Early Bird', icon: '🌅', type: 'wakeup'}, 
            {name: isZh?'多喝水':'Drink Water', icon: '💧', type: 'habit'}, 
            {name: isZh?'阅读':'Reading', icon: '📖', type: 'habit'},
            {name: isZh?'冥想':'Meditation', icon: '🧠', type: 'habit'},
            {name: isZh?'护肤':'Skincare', icon: '✨', type: 'habit'}
        ] }
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
            
            <div className="detail-hero">
                <div className="detail-icon-wrap">{selectedItem.icon}</div>
                <div className="detail-title-group">
                    <span className="detail-cat-tag">{selectedItem.category}</span>
                    <input 
                        type="text" 
                        className="detail-name-input" 
                        placeholder={t.matterName} 
                        value={editName} 
                        onChange={(e)=>setEditName(e.target.value)}
                    />
                </div>
            </div>

            <div className="detail-options-card">
                {selectedItem.type === 'wakeup' && (
                    <div className="option-group">
                        <label>{t.wakeTime}</label>
                        <div className="time-select-hero">
                            <input type="time" value={localValues.time} onChange={(e)=>setLocalValues((p:any)=>({...p, time: e.target.value}))}/>
                            <span style={{fontSize:'32px', color:'var(--accent)', opacity:0.3}}>🕒</span>
                        </div>
                    </div>
                )}

                {selectedItem.type === 'cardio' && (
                    <>
                        <div className="option-group">
                            <div className="option-header">
                                <label>{t.duration}</label>
                                <span className="option-val-display">{localValues.duration} <small>{t.min}</small></span>
                            </div>
                            <input type="range" className="peach-range" min="0" max="180" step="5" value={localValues.duration} onChange={(e)=>setLocalValues((p:any)=>({...p, duration: parseInt(e.target.value)}))}/>
                            <div className="preset-chips">
                                {[15, 30, 45, 60].map(v => (
                                    <button key={v} onClick={()=>setLocalValues((p:any)=>({...p, duration: v}))} className={localValues.duration === v ? 'active' : ''}>
                                        {v}{t.min}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="option-group">
                            <label>{t.distance}</label>
                            <div className="stepper-row minimalist">
                                <button onClick={()=>adjust('distance', -0.5)} className="step-btn">−</button>
                                <div className="stepper-value-block with-unit">
                                    <span>{localValues.distance}</span>
                                    <select className="unit-selector" value={localValues.unit} onChange={(e)=>setLocalValues((p:any)=>({...p, unit: e.target.value}))}>
                                        <option value="km">km</option>
                                        <option value="m">m</option>
                                    </select>
                                </div>
                                <button onClick={()=>adjust('distance', 0.5)} className="step-btn">+</button>
                            </div>
                        </div>
                    </>
                )}

                {selectedItem.type === 'strength' && (
                    <div className="strength-row-layout">
                        <div className="option-group" style={{flex:1}}>
                            <label style={{textAlign:'center'}}>{t.count}</label>
                            <div className="stepper-row minimalist">
                                <button onClick={()=>adjust('count', -1)} className="step-btn">−</button>
                                <div className="stepper-value-block">
                                    <span>{localValues.count}</span>
                                </div>
                                <button onClick={()=>adjust('count', 1)} className="step-btn">+</button>
                            </div>
                        </div>
                        <div className="option-group" style={{flex:1}}>
                            <label style={{textAlign:'center'}}>{t.sets}</label>
                            <div className="stepper-row minimalist">
                                <button onClick={()=>adjust('sets', -1)} className="step-btn">−</button>
                                <div className="stepper-value-block">
                                    <span>{localValues.sets}</span>
                                </div>
                                <button onClick={()=>adjust('sets', 1)} className="step-btn">+</button>
                            </div>
                        </div>
                    </div>
                )}

                {selectedItem.type === 'habit' && (
                    <div className="option-group">
                        <div className="option-header">
                            <label>{t.duration}</label>
                            <span className="option-val-display">{localValues.duration} <small>{t.min}</small></span>
                        </div>
                        <input type="range" className="peach-range" min="0" max="180" step="5" value={localValues.duration} onChange={(e)=>setLocalValues((p:any)=>({...p, duration: parseInt(e.target.value)}))}/>
                    </div>
                )}

                <div className="option-group" style={{marginTop:'4px'}}>
                    <label style={{display:'flex', alignItems:'center', gap:'6px'}}>
                        写下此刻... <span style={{fontSize:'12px', fontWeight:'normal', opacity:0.6}}>🌱</span>
                    </label>
                    <textarea 
                        id="note-area"
                        className="moment-textarea minimalist" 
                        placeholder="留下一段温暖的文字..."
                        rows={3}
                    />
                </div>
            </div>

            <div className="detail-action-bar">
                <button className="btn-cancel" onClick={()=>setSelectedItem(null)}>{t.nextTime}</button>
                <button className="btn-confirm highlight" onClick={()=>{
                    const note = (document.getElementById('note-area') as HTMLTextAreaElement).value;
                    handleAddRecord({
                        type: checkinSubTab,
                        activityType: selectedItem.type,
                        name: editName.trim() || selectedItem.name,
                        category: selectedItem.category,
                        note,
                        ...localValues
                    });
                }}>
                    {t.complete} ✨
                </button>
            </div>
        </div>
    );

    return (
        <div className="view">
            <div className="sub-header">
                <button onClick={() => setView('home')} className="back-btn-square">⬅️</button>
                <h2>{t.checkin}</h2>
            </div>
            
            <div className="subtab-container">
                <div className={`subtab-slider ${checkinSubTab === 'event' ? 'right' : ''}`}></div>
                <button className={`tab-btn ${checkinSubTab === 'sport' ? 'active' : ''}`} onClick={() => setCheckinSubTab('sport')}>{t.sportCheck}</button>
                <button className={`tab-btn ${checkinSubTab === 'event' ? 'active' : ''}`} onClick={() => setCheckinSubTab('event')}>{t.eventCheck}</button>
            </div>

            <div key={checkinSubTab} className="category-fade-in">
                {cats.map(c => (
                    <div key={c.title} style={{marginBottom:'24px'}}>
                        <h4 className="category-title">{c.title}</h4>
                        <div className="grid-nav">
                            {c.items.map(i => (
                                <div key={i.name} className="nav-card" style={{background: 'white', boxShadow:'0 4px 12px rgba(0,0,0,0.02)'}} onClick={() => openDetail({...i, category: c.title})}>
                                    <div className="icon-bg-wrap" style={{background: c.color}}><span style={{fontSize:'28px'}}>{i.icon}</span></div>
                                    <span>{i.name}</span>
                                </div>
                            ))}
                            <div className="nav-card custom-card" onClick={() => openDetail({name: isZh?'自定义':'Custom', icon: '📝', category: c.title, type: checkinSubTab === 'sport' ? 'strength' : 'habit'})}>
                                <div className="icon-bg-wrap" style={{border:'2px dashed var(--accent-light)', background:'none', boxShadow:'none'}}><span style={{fontSize:'24px', color:'var(--accent)'}}>+</span></div>
                                <span style={{color:'var(--accent)'}}>{isZh ? '自定义' : 'Custom'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StatsView({ t, statsData, setView, records }: any) {
    if (!statsData) return <div className="view"><div className="sub-header"><button onClick={() => setView('home')} className="back-btn-square">⬅️</button><h2>{t.stats}</h2></div><div className="empty-state" style={{marginTop:'100px'}}><p>{t.noRecords}</p></div></div>;
    const maxWeekly = Math.max(...statsData.weekly.map((w:any) => w.count), 1);
    return (
        <div className="view">
            <div className="sub-header"><button onClick={() => setView('home')} className="back-btn-square">⬅️</button><h2>{t.stats}</h2></div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'12px', marginBottom:'24px'}}>
                <div className="nav-card" style={{background:'var(--card-orange)', padding:'16px'}}>
                    <span style={{fontSize:'12px', fontWeight:'800', opacity:0.6}}>{t.statLabels.streak}</span>
                    <span style={{fontSize:'24px', fontWeight:'900'}}>{statsData.streak}</span>
                </div>
                <div className="nav-card" style={{background:'var(--card-blue)', padding:'16px'}}>
                    <span style={{fontSize:'12px', fontWeight:'800', opacity:0.6}}>{t.statLabels.today}</span>
                    <span style={{fontSize:'24px', fontWeight:'900'}}>{statsData.todayCount}</span>
                </div>
                <div className="nav-card" style={{background:'var(--card-pink)', padding:'16px'}}>
                    <span style={{fontSize:'12px', fontWeight:'800', opacity:0.6}}>{t.statLabels.total}</span>
                    <span style={{fontSize:'24px', fontWeight:'900'}}>{records.length}</span>
                </div>
            </div>
            <div style={{background:'white', borderRadius:'32px', padding:'24px', boxShadow:'var(--shadow-soft)'}}>
                <h4 style={{margin:'0 0 20px', fontSize:'16px', fontWeight:'850'}}>{t.statLabels.weekly}</h4>
                <div style={{height:'120px', display:'flex', alignItems:'flex-end', justifyContent:'space-around'}}>
                    {statsData.weekly.map((w:any, i:number) => (
                        <div key={i} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'8px'}}>
                            <div style={{width:'10px', height:`${(w.count / maxWeekly) * 100}%`, background:'var(--accent-gradient)', borderRadius:'5px', minHeight:'6px', transition:'height 0.8s ease-out'}}></div>
                            <span style={{fontSize:'10px', fontWeight:'800', color: i===6 ? 'var(--accent)' : 'var(--text-soft)'}}>{w.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
