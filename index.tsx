
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
    fixedReminderEnabled: boolean;
    fixedReminderTime: string;
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
        addToHome: '添加到手机主界面',
        addToHomeGuideIOS: '请点击浏览器下方的“分享”按钮，然后选择“添加到主屏幕”✨ (iOS用户需添加后才可接收通知)',
        addToHomeGuideQuark: '请点击底部“三”菜单按钮，在弹出的面板中选择“添加到桌面”图标 📍',
        addToHomeGuideDefault: '请在浏览器菜单中寻找“安装应用”或“添加到主屏幕”选项',
        storage: '存储与缓存', clearCache: '清除本地记录', storageUsage: '已保存记录',
        confirmClear: '确定要清除所有记录吗？此操作无法撤销。',
        langOptions: { zh: '中文简体', en: 'English' },
        aiVision: 'AI 视觉分析', scanFood: '扫描食物', rescan: '重新扫描',
        successMsg: '太棒啦✨', successSub: '坚持就是胜利💪',
        nextTime: '稍后再说', customTask: '自定义任务',
        distance: '运动距离', km: '公里', m: '米',
        count: '个数', sets: '组数', times: '次', groups: '组',
        wakeTime: '起床时刻', min: '分钟',
        greetings: {
            earlyMorning: '清晨好，迎接第一缕阳光',
            morning: '上午好，开启充满活力的一天',
            noon: '中午好，忙碌之余记得按时吃午饭',
            afternoon: '下午好，稍微小憩一下再出发吧',
            evening: '傍晚好，感受落日余晖的温柔',
            night: '夜深了，愿你有个好梦',
        },
        notif: {
            title: '打卡提醒',
            body: '小主，别忘了记录今天的精彩瞬间哦！✨',
            dailyTitle: '每日定点提醒',
            dailyBody: '到点啦，快来看看今天有哪些值得记录的事吧 🍵',
            permissionDenied: '通知权限已被拒绝或当前浏览器不支持。iOS用户需“添加到主屏幕”后再开启。'
        },
        reminder: {
            title: '提醒设置', checkIn: '打卡提醒', auxiliary: '辅助提醒', count: '提醒次数',
            interval: '提醒间隔', dnd: '免打扰时段', anim: '动画强度',
            authNeeded: '权限未授权', goAuth: '去授权',
            granted: '已授权',
            fixedReminder: '每日定点提醒',
            fixedTime: '提醒时刻',
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
            habits: '自律习惯', mind: '精神寄托', housework: '日常事务'
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
        addToHome: 'Add to Home Screen',
        addToHomeGuideIOS: 'Tap "Share" and "Add to Home Screen" ✨ (Required for notifications on iOS)',
        addToHomeGuideQuark: 'Tap the "Menu" button and select "Add to Desktop" 📍',
        addToHomeGuideDefault: 'Look for "Install App" or "Add to Home Screen" in your browser menu.',
        storage: 'Storage & Cache', clearCache: 'Clear Cache', storageUsage: 'Saved',
        confirmClear: 'Clear all records? This cannot be undone.',
        langOptions: { zh: 'Simplified Chinese', en: 'English' },
        aiVision: 'AI Vision', scanFood: 'Scan Food', rescan: 'Re-scan',
        successMsg: 'Awesome! ✨', successSub: 'Consistency is key 💪',
        nextTime: 'Later', customTask: 'Custom Task',
        distance: 'Distance', km: 'km', m: 'm',
        count: 'Count', sets: 'Sets', times: 'times', groups: 'sets',
        wakeTime: 'Wake-up Time', min: 'min',
        greetings: {
            earlyMorning: 'Rise and shine, good morning',
            morning: 'Good morning, have a productive day',
            noon: 'Good noon, don\'t forget to have lunch',
            afternoon: 'Good afternoon, take a nap and recharge',
            evening: 'Good evening, time to unwind',
            night: 'Night vibes, rest well tonight',
        },
        notif: {
            title: 'Check-in Reminder',
            body: 'Don\'t forget to record your wonderful moments today! ✨',
            dailyTitle: 'Daily Reminder',
            dailyBody: 'It\'s time! Let\'s record the highlights of your day 🍵',
            permissionDenied: 'Notifications not supported or denied. iOS users must use "Add to Home Screen".'
        },
        reminder: {
            title: 'Reminders', checkIn: 'Check-in Alert', auxiliary: 'Auxiliary Alert', count: 'Alert Count',
            interval: 'Interval', dnd: 'DND Period', anim: 'Animation',
            authNeeded: 'Unauthorized', goAuth: 'Grant',
            granted: 'Authorized',
            fixedReminder: 'Daily Fixed Reminder',
            fixedTime: 'Reminder Time',
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

// --- 安全 API 调用工具函数 ---
const safeVibrate = (pattern: number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(pattern); } catch (e) { /* silent fail */ }
    }
};

const triggerNotification = (title: string, body: string) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
            new Notification(title, { body, icon: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png' });
        } catch (e) { }
    }
};

const HomeIcon = ({ active }: { active: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: active ? 1 : 0.6 }}>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
);
const CheckIcon = ({ active }: { active: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: active ? 1 : 0.6 }}>
        <polyline points="20 6 9 17 4 12"/>
    </svg>
);
const FoodIcon = ({ active }: { active: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: active ? 1 : 0.6 }}>
        <path d="M12 20.94c1.88-1.55 3.94-3.08 5.61-4.78a9 9 0 1 0-11.22 0c1.67 1.7 3.73 3.23 5.61 4.78z"/><circle cx="12" cy="12" r="3"/>
    </svg>
);
const StatsIcon = ({ active }: { active: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: active ? 1 : 0.6 }}>
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
);

const Clock = ({ lang }: { lang: 'zh' | 'en' }) => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return (
        <div className="clock-section" style={{ textAlign: 'center', margin: '24px 0' }}>
            <h1 style={{ fontSize: '52px', margin: 0, fontWeight: '900', color: 'var(--text-main)' }}>
                {time.getHours().toString().padStart(2, '0')}:{time.getMinutes().toString().padStart(2, '0')}
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-soft)', fontWeight: '700', margin: '4px 0 0' }}>
                {time.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
        </div>
    );
};

const SplashScreen = ({ onFinish, t }: { onFinish: () => void, t: any }) => {
    const [fadeOut, setFadeOut] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => {
            setFadeOut(true);
            setTimeout(onFinish, 600);
        }, 2200);
        return () => clearTimeout(timer);
    }, [onFinish]);

    return (
        <div className={`splash-overlay ${fadeOut ? 'fade-up' : ''}`}>
            <div className="splash-content">
                <div className="splash-logo">🥑</div>
                <h1 className="splash-title">佳倩管家</h1>
                <p className="splash-subtitle">{t.warmMoments}</p>
                <div className="splash-loader-track">
                    <div className="splash-loader-bar"></div>
                </div>
            </div>
        </div>
    );
};

function App() {
    const [isAppLoading, setIsAppLoading] = useState(true);
    const [view, setView] = useState<'home' | 'checkin' | 'food' | 'stats' | 'settings' | 'anniversary'>('home');
    const [checkinSubTab, setCheckinSubTab] = useState<'sport' | 'event'>('sport');
    const [records, setRecords] = useState<CheckInRecord[]>([]);
    const [anniversaries, setAnniversaries] = useState<Anniversary[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    
    const [settings, setSettings] = useState<AppSettings>({
        language: 'zh',
        darkModeType: 'system',
        manualDarkMode: false,
        pushNotifications: true,
        inAppPopups: true,
        vibration: true,
        reminders: {
            checkInEnabled: false,
            reminderCount: 1,
            interval: 10,
            dndStart: '23:00',
            dndEnd: '07:00',
            auxiliaryEnabled: true,
            reportNotify: true,
            shareNotify: true,
            messageCenterNotify: false,
            animIntensity: 'medium',
            fixedReminderEnabled: false,
            fixedReminderTime: '17:00'
        }
    });
    
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [editName, setEditName] = useState('');
    const [calorieResult, setCalorieResult] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const t = TRANSLATIONS[settings.language];
    const firstUpdate = useRef(true);
    const lastFixedNotifDay = useRef<string | null>(null);

    const getDynamicGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 9) return t.greetings.earlyMorning;
        if (hour >= 9 && hour < 12) return t.greetings.morning;
        if (hour >= 12 && hour < 14) return t.greetings.noon;
        if (hour >= 14 && hour < 18) return t.greetings.afternoon;
        if (hour >= 18 && hour < 22) return t.greetings.evening;
        return t.greetings.night;
    };

    useEffect(() => {
        const checkReminders = () => {
            if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
            const now = new Date();
            const hour = now.getHours();
            const min = now.getMinutes();
            const timeStr = `${hour.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}`;
            const todayKey = now.toDateString();

            if (settings.reminders.fixedReminderEnabled) {
                if (timeStr === settings.reminders.fixedReminderTime && lastFixedNotifDay.current !== todayKey) {
                    triggerNotification(t.notif.dailyTitle, t.notif.dailyBody);
                    lastFixedNotifDay.current = todayKey;
                    if (settings.vibration) safeVibrate([200, 100, 200]);
                }
            }

            if (settings.reminders.checkInEnabled && min === 0) {
                const isDND = settings.reminders.dndStart < settings.reminders.dndEnd 
                    ? (timeStr >= settings.reminders.dndStart && timeStr <= settings.reminders.dndEnd)
                    : (timeStr >= settings.reminders.dndStart || timeStr <= settings.reminders.dndEnd);
                
                if (isDND) return;
                const todayTimestamp = new Date().setHours(0,0,0,0);
                const hasTodayCheckin = records.some(r => new Date(r.timestamp).setHours(0,0,0,0) === todayTimestamp);
                if (!hasTodayCheckin) {
                    triggerNotification(t.notif.title, t.notif.body);
                    if (settings.vibration) safeVibrate([200, 100, 200]);
                }
            }
        };
        const interval = setInterval(checkReminders, 60000);
        return () => clearInterval(interval);
    }, [settings.reminders, records, t, settings.vibration]);

    useEffect(() => {
        const handleBeforeInstall = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        
        const savedRecords = localStorage.getItem('jq_records');
        const savedSettings = localStorage.getItem('jq_settings');
        const savedAnniv = localStorage.getItem('jq_anniv');
        if (savedRecords) setRecords(JSON.parse(savedRecords));
        if (savedAnniv) setAnniversaries(JSON.parse(savedAnniv));
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setSettings(prev => ({ 
                ...prev, 
                ...parsed, 
                reminders: { ...prev.reminders, ...parsed.reminders } 
            }));
        }
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }, []);

    useEffect(() => {
        const applyTheme = () => {
            let isDark = settings.darkModeType === 'system' 
                ? window.matchMedia('(prefers-color-scheme: dark)').matches 
                : settings.manualDarkMode;
            document.body.className = isDark ? 'dark' : '';
        };
        applyTheme();
        if (!firstUpdate.current) {
            localStorage.setItem('jq_records', JSON.stringify(records));
            localStorage.setItem('jq_settings', JSON.stringify(settings));
            localStorage.setItem('jq_anniv', JSON.stringify(anniversaries));
        }
        firstUpdate.current = false;
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
        const total = records.length || 1;
        const distribution = Object.entries(types).map(([key, value]) => ({ 
            type: key as ActivityType, 
            count: value,
            percentage: Math.round((value / total) * 100)
        })).filter(d => d.count > 0).sort((a, b) => b.count - a.count);
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
                            { text: settings.language === 'zh' ? "请分析这张图片中的食物，估计其热量（卡路里），并给出简单的营养建议。请分条列出。请用中文回答。" : "Please analyze the food in this image, estimate its calories, and provide simple nutritional advice. List them in bullet points. Please answer in English." }
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
                        <h2 style={{ transition: 'opacity 0.5s ease' }}>{getDynamicGreeting()}</h2>
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
                                    <li key={r.id} className="record-item" style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px', borderBottom:'1px solid var(--border-color)'}}>
                                        <div style={{display:'flex', alignItems:'center'}}>
                                            <div className="item-icon-small" style={{width:'44px', height:'44px', background:'var(--card-bg)', border:'1px solid var(--border-color)', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px'}}>
                                                <span>{r.activityType === 'wakeup' ? '🌅' : r.type === 'sport' ? '💪' : '📝'}</span>
                                            </div>
                                            <div style={{marginLeft:'14px'}}>
                                                <p className="item-name" style={{margin:0, fontWeight:'800', fontSize:'15px'}}>{r.name}</p>
                                                <p style={{fontSize:'12px', color:'var(--text-soft)', margin:'2px 0 0', fontWeight:'600'}}>
                                                    {r.activityType === 'wakeup' && `🕒 ${r.time}`}
                                                    {r.activityType === 'cardio' && `⏱️ ${r.duration}${t.min} ${r.distance ? `· 📍 ${r.distance}${r.unit}` : ''}`}
                                                    {r.activityType === 'strength' && `🔥 ${r.sets}${t.groups} · 🔢 ${r.count}${t.times}`}
                                                    {(r.activityType === 'habit' || r.activityType === 'general') && `⏱️ ${r.duration}${t.min}`}
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
        <>
            {isAppLoading && <SplashScreen t={t} onFinish={() => setIsAppLoading(false)} />}
            <div className={`app-container ${isAppLoading ? 'hidden' : 'fade-in-ready'}`}>
                {showSuccess && (
                    <div className="success-overlay"><span style={{fontSize:'80px', marginBottom:'20px'}}>✨</span><h1 style={{color:'var(--accent)'}}>{t.successMsg}</h1><p style={{color:'var(--text-soft)', fontWeight:'700'}}>{t.successSub}</p></div>
                )}
                <main className="content-area">
                    {view === 'home' && renderHome()}
                    {view === 'checkin' && <CheckinSelection t={t} checkinSubTab={checkinSubTab} setCheckinSubTab={setCheckinSubTab} setSelectedItem={setSelectedItem} handleAddRecord={handleAddRecord} setView={setView} selectedItem={selectedItem} editName={editName} setEditName={setEditName} settings={settings} />}
                    {view === 'food' && (
                        <div className="view">
                            <div className="sub-header">
                                <button onClick={() => setView('home')} className="back-btn-square">⬅️</button>
                                <h2>AI {t.calories}</h2>
                            </div>
                            <div className="detail-card" style={{background:'var(--card-bg)', padding:'32px', borderRadius:'40px', border:'1px solid var(--border-color)', boxShadow:'var(--shadow-soft)'}}>
                                {isAnalyzing ? (
                                    <div style={{textAlign:'center', padding:'40px 0'}}>
                                        <div className="loading-spinner" style={{width:'48px', height:'48px', border:'4px solid var(--accent-light)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 20px'}}></div>
                                        <p style={{fontWeight:'700', color:'var(--text-soft)'}}>分析中...</p>
                                    </div>
                                ) : calorieResult ? (
                                    <div style={{animation:'fadeIn 0.5s ease'}}>
                                        <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px', paddingBottom:'16px', borderBottom:'2px dashed var(--accent-light)'}}>
                                            <div style={{fontSize:'32px'}}>🥗</div>
                                            <h3 style={{margin:0, fontSize:'20px', fontWeight:'900', color:'var(--accent)'}}>{t.aiVision}</h3>
                                        </div>
                                        <div style={{textAlign:'left', whiteSpace:'pre-wrap', lineHeight:'1.8', color:'var(--text-main)', fontSize:'15px', fontWeight:'600'}}>{calorieResult}</div>
                                        <button onClick={() => setCalorieResult(null)} className="btn-confirm highlight" style={{marginTop:'32px', width:'100%', height:'56px'}}>🔄 {t.rescan}</button>
                                    </div>
                                ) : (
                                    <label style={{cursor:'pointer', display:'block', textAlign:'center', padding:'40px 0'}}>
                                        <input type="file" hidden onChange={handleImageUpload} />
                                        <div style={{width:'100px', height:'100px', background:'var(--card-orange)', borderRadius:'32px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'48px', margin:'0 auto 24px', boxShadow:'0 8px 20px rgba(255,150,113,0.1)'}}>📸</div>
                                        <h3 style={{fontSize:'20px', fontWeight:'850', color:'var(--text-main)'}}>{t.scanFood}</h3>
                                        <p style={{color:'var(--text-soft)', marginTop:'8px', fontWeight:'700', fontSize:'13px'}}>拍照即刻获知热量建议</p>
                                    </label>
                                )}
                            </div>
                        </div>
                    )}
                    {view === 'stats' && <StatsView t={t} statsData={statsData} setView={setView} records={records} />}
                    {view === 'anniversary' && <AnniversaryView t={t} anniversaries={anniversaries} setAnniversaries={setAnniversaries} setView={setView} />}
                    {view === 'settings' && <SettingsView t={t} settings={settings} setSettings={setSettings} setView={setView} records={records} setRecords={setRecords} deferredPrompt={deferredPrompt} setDeferredPrompt={setDeferredPrompt} />}
                </main>
                <nav className="bottom-nav">
                    <button onClick={() => setView('home')} className={view === 'home' ? 'active' : ''}><HomeIcon active={view === 'home'} /><span>{t.home}</span></button>
                    <button onClick={() => {setView('checkin'); setSelectedItem(null);}} className={view === 'checkin' ? 'active' : ''}><CheckIcon active={view === 'checkin'} /><span>{t.checkin}</span></button>
                    <button onClick={() => setView('food')} className={view === 'food' ? 'active' : ''}><FoodIcon active={view === 'food'} /><span>{t.calories}</span></button>
                    <button onClick={() => setView('stats')} className={view === 'stats' ? 'active' : ''}><StatsIcon active={view === 'stats'} /><span>{t.stats}</span></button>
                </nav>
            </div>
        </>
    );
}

function SettingsView({ t, settings, setSettings, setView, records, setRecords, deferredPrompt, setDeferredPrompt }: any) {
    const update = (obj: Partial<AppSettings>) => setSettings((p: AppSettings) => ({ ...p, ...obj }));
    const updateReminders = (obj: Partial<ReminderSettings>) => setSettings((p: AppSettings) => ({ ...p, reminders: { ...p.reminders, ...obj } }));
    const [guideType, setGuideType] = useState<'ios' | 'quark' | 'default' | null>(null);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') setDeferredPrompt(null);
        } else {
            const ua = navigator.userAgent;
            const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
            const isQuark = /Quark/.test(ua);
            if (isQuark) setGuideType('quark');
            else if (isIOS) setGuideType('ios');
            else setGuideType('default');
        }
    };

    return (
        <div className="view">
            <div className="sub-header"><button onClick={() => setView('home')} className="back-btn-square">⬅️</button><h2>{t.settings}</h2></div>
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
                    <button className="setting-item-btn" onClick={handleInstall} style={{ borderBottom: 'none' }}><span>{t.addToHome}</span><span style={{ fontSize: '18px', color: 'var(--accent)' }}>📲</span></button>
                </div>
            </section>
            <section className="settings-section">
                <h4 className="category-title">{t.reminder.title}</h4>
                <div className="settings-card">
                    <div className="setting-item">
                        <div style={{display:'flex', flexDirection:'column'}}><span>{t.reminder.checkIn}</span><small style={{fontSize:'10px', color: (typeof Notification !== 'undefined' && Notification.permission === 'granted') ? '#4CD964' : '#FF3B30', fontWeight:'800'}}>{(typeof Notification !== 'undefined' && Notification.permission === 'granted') ? t.reminder.granted : t.reminder.authNeeded}</small></div>
                        <label className="cream-switch"><input type="checkbox" checked={settings.reminders.checkInEnabled} onChange={e => updateReminders({ checkInEnabled: e.target.checked })} /><span className="slider"></span></label>
                    </div>
                    <div className="setting-item"><span>{t.reminder.fixedReminder}</span><label className="cream-switch"><input type="checkbox" checked={settings.reminders.fixedReminderEnabled} onChange={e => updateReminders({ fixedReminderEnabled: e.target.checked })} /><span className="slider"></span></label></div>
                    {settings.reminders.fixedReminderEnabled && <div className="setting-item"><span>{t.reminder.fixedTime}</span><input type="time" className="time-input-simple" style={{maxWidth:'100px'}} value={settings.reminders.fixedReminderTime} onChange={e => updateReminders({ fixedReminderTime: e.target.value })} /></div>}
                </div>
            </section>
            <section className="settings-section">
                <h4 className="category-title">{t.storage}</h4>
                <div className="settings-card">
                    <button className="setting-action-btn danger" onClick={() => { if (confirm(t.confirmClear)) { setRecords([]); localStorage.removeItem('jq_records'); } }}>{t.clearCache}</button>
                </div>
            </section>
            {guideType && (
                <div className="drawer-overlay" onClick={() => setGuideType(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.1)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent:'center', padding: '24px' }}>
                    <div className="valentine-card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '340px', borderRadius: '40px', padding: '32px 24px', textAlign: 'center', background: 'white' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>{guideType === 'ios' ? '📱' : '🧭'}</div>
                        <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '850' }}>{t.addToHome}</h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-soft)', lineHeight: '1.6', fontWeight: '600', marginBottom: '24px' }}>{guideType === 'ios' ? t.addToHomeGuideIOS : guideType === 'quark' ? t.addToHomeGuideQuark : t.addToHomeGuideDefault}</p>
                        <button onClick={() => setGuideType(null)} className="btn-confirm highlight" style={{ width: '100%', height: '56px' }}>好的，知道啦</button>
                    </div>
                </div>
            )}
        </div>
    );
}

function AnniversaryView({ t, anniversaries, setAnniversaries, setView }: any) {
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDate, setNewDate] = useState('');
    const handleAdd = () => { if (!newName || !newDate) return; const item: Anniversary = { id: Math.random().toString(36).substr(2, 9), name: newName, date: newDate, category: 'life' }; setAnniversaries([...anniversaries, item]); setNewName(''); setNewDate(''); setShowAdd(false); };
    return (
        <div className="view">
            <div className="sub-header"><button onClick={() => setView('home')} className="back-btn-square">⬅️</button><h2>{t.anniv.title}</h2></div>
            <div className="anniv-stats" style={{display:'flex', justifyContent:'space-between', padding:'0 8px 24px'}}><span style={{fontSize:'13px', fontWeight:'700', color:'var(--text-soft)'}}>已收录 {anniversaries.length} 个瞬间</span><button onClick={() => setShowAdd(true)} style={{fontSize:'13px', fontWeight:'850', color:'var(--accent)'}}>+ {t.anniv.add}</button></div>
            <div className="anniv-list" style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                {anniversaries.map((a: Anniversary) => (
                    <div key={a.id} className="anniv-card" style={{background:'white', borderRadius:'32px', padding:'24px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'var(--shadow-soft)'}}>
                        <div><p style={{margin:0, fontWeight:'850', fontSize:'16px'}}>{a.name}</p><p style={{margin:'4px 0 0', fontSize:'12px', color:'var(--text-soft)'}}>{a.date}</p></div>
                        <button onClick={() => {if(confirm(t.anniv.confirmDel)) setAnniversaries(anniversaries.filter((it:any)=>it.id !== a.id))}} style={{color:'#FF3B30', fontSize:'12px'}}>{t.anniv.delete}</button>
                    </div>
                ))}
            </div>
            {showAdd && (
                <div className="drawer-overlay" onClick={() => setShowAdd(false)} style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.1)', zIndex:2000, display:'flex', alignItems:'flex-end'}}>
                    <div className="drawer-content" onClick={e => e.stopPropagation()} style={{width:'100%', background:'white', borderTopLeftRadius:'40px', borderTopRightRadius:'40px', padding:'40px 24px'}}>
                        <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder={t.anniv.name} style={{width:'100%', height:'56px', borderRadius:'20px', background:'#F4F4F7', border:'none', padding:'0 20px', marginBottom:'16px'}} />
                        <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={{width:'100%', height:'56px', borderRadius:'20px', background:'#F4F4F7', border:'none', padding:'0 20px', marginBottom:'16px'}} />
                        <button onClick={handleAdd} className="btn-confirm highlight" style={{width:'100%'}}>{t.complete} ✨</button>
                    </div>
                </div>
            )}
        </div>
    );
}

function CheckinSelection({ t, checkinSubTab, setCheckinSubTab, setSelectedItem, handleAddRecord, setView, selectedItem, editName, setEditName, settings }: any) {
    const isZh = t.langOptions.zh === '中文简体';
    const [duration, setDuration] = useState<number>(30);
    const [distance, setDistance] = useState<number>(5);
    const [unit, setUnit] = useState<string>('km');
    const [count, setCount] = useState<number>(10);
    const [sets, setSets] = useState<number>(3);
    const [wakeupTime, setWakeupTime] = useState<string>('07:00');

    const SPORT_CATS = [
        { title: t.categories.cardio, color: 'var(--card-blue)', items: [ { name: isZh ? '跑步' : 'Running', icon: '🏃', type: 'cardio' }, { name: isZh ? '游泳' : 'Swimming', icon: '🏊', type: 'cardio' } ] },
        { title: t.categories.strength, color: 'var(--card-pink)', items: [ { name: isZh ? '俯卧撑' : 'Push-ups', icon: '💪', type: 'strength' }, { name: isZh ? '深蹲' : 'Squats', icon: '🦵', type: 'strength' } ] }
    ];
    const LIFE_CATS = [ { title: t.categories.habits, color: 'var(--card-purple)', items: [ { name: isZh ? '早起' : 'Early Bird', icon: '🌅', type: 'wakeup' }, { name: isZh ? '多喝水' : 'Drink Water', icon: '💧', type: 'habit' } ] } ];
    const cats = checkinSubTab === 'sport' ? SPORT_CATS : LIFE_CATS;

    if (selectedItem) return (
        <div className="view">
            <div className="sub-header"><button onClick={() => setSelectedItem(null)} className="back-btn-square">⬅️</button><h2>{t.checkinDetails}</h2></div>
            <div className="detail-hero" style={{marginBottom: '32px'}}><div className="detail-icon-wrap" style={{background: 'var(--card-bg)', border: '1px solid var(--border-color)'}}>{selectedItem.icon}</div><div className="detail-title-group"><input type="text" className="detail-name-input" value={editName} onChange={(e) => setEditName(e.target.value)} /></div></div>
            <div className="settings-section">
                <div className="settings-card" style={{padding: '12px 20px'}}>
                    {selectedItem.type === 'cardio' && <>
                        <div className="setting-item"><span>⏱️ {t.duration} ({t.min})</span><input type="number" className="time-input-simple" style={{maxWidth: '80px'}} value={duration} onChange={e => setDuration(Number(e.target.value))} /></div>
                        <div className="setting-item"><span>📍 {t.distance}</span><div style={{display: 'flex', gap: '8px'}}><input type="number" className="time-input-simple" style={{maxWidth: '80px'}} value={distance} onChange={e => setDistance(Number(e.target.value))} /><div className="segment-control"><button className={unit === 'km' ? 'active' : ''} onClick={() => setUnit('km')}>km</button><button className={unit === 'm' ? 'active' : ''} onClick={() => setUnit('m')}>m</button></div></div></div>
                    </>}
                    {selectedItem.type === 'strength' && <>
                        <div className="setting-item"><span>🔥 {t.sets}</span><input type="number" className="time-input-simple" style={{maxWidth: '80px'}} value={sets} onChange={e => setSets(Number(e.target.value))} /></div>
                        <div className="setting-item"><span>🔢 {t.count} ({t.times})</span><input type="number" className="time-input-simple" style={{maxWidth: '80px'}} value={count} onChange={e => setCount(Number(e.target.value))} /></div>
                    </>}
                    {selectedItem.type === 'wakeup' && <div className="setting-item"><span>🕒 {t.wakeTime}</span><input type="time" className="time-input-simple" value={wakeupTime} onChange={e => setWakeupTime(e.target.value)} /></div>}
                </div>
            </div>
            <button className="btn-confirm highlight" onClick={() => handleAddRecord({ type: checkinSubTab, activityType: selectedItem.type, name: editName || selectedItem.name, category: selectedItem.category, duration, distance, unit, count, sets, time: wakeupTime })}>{t.complete} ✨</button>
        </div>
    );

    return (
        <div className="view">
            <div className="sub-header"><button onClick={() => setView('home')} className="back-btn-square">⬅️</button><h2>{t.checkin}</h2></div>
            <div className="subtab-container"><div className={`subtab-slider ${checkinSubTab === 'event' ? 'right' : ''}`}></div><button className={`tab-btn ${checkinSubTab === 'sport' ? 'active' : ''}`} onClick={() => setCheckinSubTab('sport')}>{t.sportCheck}</button><button className={`tab-btn ${checkinSubTab === 'event' ? 'active' : ''}`} onClick={() => setCheckinSubTab('event')}>{t.eventCheck}</button></div>
            {cats.map(c => ( <div key={c.title}><h4 className="category-title">{c.title}</h4><div className="grid-nav">{c.items.map(i => ( <div key={i.name} className="nav-card" style={{background: 'var(--card-bg)', border: '1px solid var(--border-color)'}} onClick={() => {setSelectedItem({...i, category: c.title}); setEditName(i.name);}}><div className="icon-bg-wrap" style={{background: c.color}}><span>{i.icon}</span></div><span style={{fontWeight: '800', fontSize: '14px'}}>{i.name}</span></div> ))}</div></div> ))}
        </div>
    );
}

function StatsView({ t, statsData, setView, records }: any) {
    if (!statsData) return <div className="view"><div className="sub-header"><button onClick={() => setView('home')} className="back-btn-square">⬅️</button><h2>{t.stats}</h2></div><div className="empty-state" style={{marginTop:'100px'}}><p>{t.noRecords}</p></div></div>;
    return (
        <div className="view">
            <div className="sub-header"><button onClick={() => setView('home')} className="back-btn-square">⬅️</button><h2>{t.stats}</h2></div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginBottom:'24px'}}><div className="nav-card" style={{background:'var(--card-orange)'}}><span>连续</span><span>{statsData.streak}</span></div><div className="nav-card" style={{background:'var(--card-blue)'}}><span>今日</span><span>{statsData.todayCount}</span></div><div className="nav-card" style={{background:'var(--card-pink)'}}><span>累计</span><span>{records.length}</span></div></div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
