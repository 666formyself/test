
import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';

// --- Types ---
type ActivityType = 'cardio' | 'strength' | 'flexibility' | 'habit' | 'mind' | 'daily' | 'wakeup' | 'general' | 'rope';
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
        checkinDetails: '打卡详情', sportCheck: '运动打卡', eventCheck: '生活打卡',
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
        wakeTime: '起床时刻', min: '分钟', notePlaceholder: '记录一下此刻的心情或身体感受...',
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
            valentineWish: '万物皆有回响，而我所有的温柔都想留给你。愿你在这个浪漫的日子，被爱意包裹。',
            newYearTitle: '跨年钟声响 🎆',
            newYearWish: '愿新的一年，星辰大海，皆是奔赴。愿你万事顺遂，岁岁平安，所得皆所愿。',
            acceptLoveBtn: '收下这份爱',
            acceptWishBtn: '迎接新一年'
        },
        statLabels: {
            streak: '连续打卡', today: '今日达成', total: '累计总数',
            weekly: '周活跃度', distribution: '生活分布', topItems: '最常进行',
            days: '天', items: '项'
        },
        categories: {
            cardio: '有氧训练', strength: '塑形力量', flexibility: '柔韧伸展',
            habits: '自律习惯', mind: '精神寄托', daily: '日常事务', custom: '自定义'
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
        wakeTime: 'Wake-up Time', min: 'min', notePlaceholder: 'Record how you feel or your physical state...',
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
            valentineWish: 'In a world full of echoes, my heart only beats for you. May your day be filled with endless warmth.',
            newYearTitle: 'Happy New Year 🎆',
            newYearWish: 'May the new year bring you closer to the stars. Wishing you peace, joy and prosperity in every step.',
            acceptLoveBtn: 'Accept Love',
            acceptWishBtn: 'Welcome New Year'
        },
        statLabels: {
            streak: 'Streak', today: 'Today', total: 'Total',
            weekly: 'Weekly Momentum', distribution: 'Life Balance', topItems: 'Top Activities',
            days: 'days', items: 'items'
        },
        categories: {
            cardio: 'Cardio', strength: 'Strength', flexibility: 'Flexibility',
            habits: 'Habits', mind: 'Mind', daily: 'Daily', custom: 'Custom'
        }
    }
};

// --- 安全 API 调用工具函数 ---
const safeVibrate = (pattern: number[]) => {
    if (pattern.length === 0) return;
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
        <div className="modern-clock-section">
            <div className="time-display">
                <span className="hour-min">
                    {time.getHours().toString().padStart(2, '0')}:{time.getMinutes().toString().padStart(2, '0')}
                </span>
                <span className="seconds">{time.getSeconds().toString().padStart(2, '0')}</span>
            </div>
            <p className="date-display">
                {time.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
        </div>
    );
};

// Frontend uses server proxy `/api/doubao`; no client-side secret required.

async function callDoubaoImageAnalysis(base64Data: string, mimeType: string, prompt: string) {
    const model = 'doubao-seed-1-8-251228';

    const resp = await fetch('/api/doubao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data, mimeType, prompt, model })
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Proxy error: ${resp.status} ${txt}`);
    }


    const json = await resp.json();
    return json.result;
}

function parseDoubaoResult(res: any): string {
    if (!res) return '';
    // If provider returned wrapper { result: {...} }
    if (res.result) return parseDoubaoResult(res.result);

    // Common: `output` is an array with items that may contain `content` or `summary`.
    // Collect candidate text fragments, then dedupe and remove fragments
    // that are identical or wholly contained within another fragment.
    if (Array.isArray(res.output) && res.output.length > 0) {
        const parts: string[] = [];
        const push = (val: any) => {
            if (!val) return;
            if (typeof val === 'string') parts.push(val.trim());
            else if (val.text) parts.push(String(val.text).trim());
        };

        for (const out of res.output) {
            if (out.summary && Array.isArray(out.summary)) {
                for (const s of out.summary) push(s && (s.text || s));
            }
            if (out.content && Array.isArray(out.content)) {
                for (const c of out.content) {
                    if (!c) continue;
                    if (typeof c === 'string') push(c);
                    else if (c.type === 'output_text' && c.text) push(c.text);
                    else if (c.type === 'message' && Array.isArray(c.content)) {
                        for (const cc of c.content) if (cc && cc.type === 'output_text' && cc.text) push(cc.text);
                    } else if (c.text) push(c.text);
                }
            }
            if (out.text) push(out.text);
        }

        // Normalize and dedupe by exact match or containment
        const normalized = parts.map(p => p.replace(/\s+/g, ' ').trim()).filter(Boolean);
        const unique: string[] = [];
        for (const p of normalized) {
            let skipped = false;
            for (let i = 0; i < unique.length; i++) {
                const u = unique[i];
                if (u === p) { skipped = true; break; }
                if (u.includes(p)) { skipped = true; break; }
                if (p.includes(u)) { unique[i] = p; skipped = true; break; }
            }
            if (!skipped) unique.push(p);
        }
        if (unique.length) return unique.join('\n\n');
    }

    // Older shapes: `output` may be string, or `outputs`/`choices` arrays
    if (typeof res.output === 'string') return res.output;
    if (Array.isArray(res.outputs) && res.outputs.length) {
        const o = res.outputs[0];
        if (o.content && o.content[0] && o.content[0].text) return o.content[0].text;
        if (o.text) return o.text;
    }
    if (Array.isArray(res.choices) && res.choices.length) {
        const c = res.choices[0];
        if (c.text) return c.text;
    }

    // If it's already text
    if (typeof res === 'string') return res;

    // Fallback: pretty-print JSON so it's still readable
    try { return JSON.stringify(res, null, 2); } catch (e) { return String(res); }
}

function makeShortSummary(text: string | null, maxChars = 180, maxLines = 4) {
    if (!text) return '';
    // prefer first paragraph
    const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
    let base = paragraphs.length ? paragraphs[0] : text;
    // if contains numbered list, keep first few list items
    const lines = base.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const take = lines.slice(0, maxLines).join('\n');
    const short = take.length <= maxChars ? take : take.slice(0, maxChars) + '…';
    return short;
}

function cleanDoubaoText(text: string | null, maxFullChars = 600) {
    if (!text) return '';
    // remove likely instruction/meta lines and empty lines, dedupe paragraphs
    const paras = text.split(/\n{1,}\s*\n{1,}|\r\n{2,}/).map(p => p.trim()).filter(Boolean);
    const out: string[] = [];
    for (const p of paras) {
        // drop lines that look like instructions, checks, or chain-of-thought markers
        if (/^(现在|请|注意|检查|整理|输出要求|只输出|Only return|Do not|Don't|Please|Now|Note)[:，,\s]/i.test(p)) continue;
        if (/(现在整理|现在输出|现在检查|按照要求|输出要求|思考过程|过程|步骤|原因|解释|说明|提示|字数|检查字数|整理一下|现在|我将)/i.test(p)) continue;
        const norm = p.replace(/\s+/g, ' ').trim();
        // if this paragraph is contained in an already-kept paragraph, skip it
        let isContained = false;
        for (let i = 0; i < out.length; i++) {
            const existingNorm = out[i].replace(/\s+/g, ' ').trim();
            if (existingNorm === norm) { isContained = true; break; }
            if (existingNorm.includes(norm)) { isContained = true; break; }
            if (norm.includes(existingNorm)) {
                // replace with the longer paragraph
                out[i] = p;
                isContained = true;
                break;
            }
        }
        if (isContained) continue;
        out.push(p);
    }
    let result = out.join('\n\n');
    // If still empty, fallback to original trimmed text
    if (!result) result = text.trim();
    if (result.length > maxFullChars) result = result.slice(0, maxFullChars) + '…';
    return result;
}

const SplashScreen = ({ onFinish, onFadeStart, t }: { onFinish: () => void, onFadeStart?: () => void, t: any }) => {
    const [fadeOut, setFadeOut] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => {
            setFadeOut(true);
            try { onFadeStart && onFadeStart(); } catch (e) { }
            setTimeout(onFinish, 600);
        }, 2200);
        return () => clearTimeout(timer);
    }, [onFinish, onFadeStart]);

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

const FestivalPopup = ({ type, t, onClose }: { type: 'valentine' | 'newyear', t: any, onClose: () => void }) => {
    const [isClosing, setIsClosing] = useState(false);
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 400);
    };

    return (
        <div className={`festival-popup-overlay ${isClosing ? 'out' : ''}`} onClick={handleClose}>
            <div className={`festival-card ${type}`} onClick={e => e.stopPropagation()}>
                <div className="floating-icons">
                    {type === 'valentine' ? 
                        ['❤️','💖','✨','🌹','💕','🍯','🦋'].map((it, idx) => <span key={idx} className={`float i-${idx}`}>{it}</span>) :
                        ['🎇','🧨','✨','💰','🧧','🏮','🥂'].map((it, idx) => <span key={idx} className={`float i-${idx}`}>{it}</span>)
                    }
                </div>
                <div className="festival-icon-hero">{type === 'valentine' ? '💑' : '🎆'}</div>
                <h2 className="festival-title">{type === 'valentine' ? t.anniv.valentineTitle : t.anniv.newYearTitle}</h2>
                <div className="festival-divider"></div>
                <p className="festival-wish">{type === 'valentine' ? t.anniv.valentineWish : t.anniv.newYearWish}</p>
                <button className="festival-btn" onClick={handleClose}>
                    {type === 'valentine' ? t.anniv.acceptLoveBtn : t.anniv.acceptWishBtn}
                </button>
            </div>
        </div>
    );
};

// --- 新增辅助组件：步进器 ---
const Stepper = ({ value, onChange, label, unit, step = 1 }: { value: number, onChange: (v: number) => void, label: string, unit: string, step?: number }) => (
    <div className="stepper-item">
        <div className="stepper-label-group">
            <span className="stepper-label">{label}</span>
            <span className="stepper-value-display">{value}<small>{unit}</small></span>
        </div>
        <div className="stepper-controls">
            <button onClick={() => onChange(Math.max(0, value - step))} className="stepper-btn">−</button>
            <button onClick={() => onChange(value + step)} className="stepper-btn">+</button>
        </div>
    </div>
);

function App() {
    const [isAppLoading, setIsAppLoading] = useState(true);
    const [appReady, setAppReady] = useState(false);
    const [view, setView] = useState<'home' | 'checkin' | 'food' | 'stats' | 'settings' | 'anniversary'>('home');
    const [checkinSubTab, setCheckinSubTab] = useState<'sport' | 'event'>('sport');
    const [records, setRecords] = useState<CheckInRecord[]>([]);
    const [anniversaries, setAnniversaries] = useState<Anniversary[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [activeFestival, setActiveFestival] = useState<'valentine' | 'newyear' | null>(null);
    
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
    const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);
    const [showFullResult, setShowFullResult] = useState(false);

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
        const now = new Date();
        const m = now.getMonth() + 1;
        const d = now.getDate();
        if (m === 2 && d === 14) setActiveFestival('valentine');
        else if (m === 1 && d === 1) setActiveFestival('newyear');
    }, []);

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
        const types: Record<ActivityType, number> = { cardio: 0, strength: 0, flexibility: 0, habit: 0, mind: 0, daily: 0, wakeup: 0, general: 0, rope: 0 };
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
        if (settings.vibration) safeVibrate([50]);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsAnalyzing(true);
        setCalorieResult(null);

        // proceed to send image to serverless proxy; server reports errors if misconfigured
        const reader = new FileReader();
        reader.onloadend = async () => {
            const dataUrl = (reader.result as string);
            setUploadedDataUrl(dataUrl);
            const base64Data = dataUrl.split(',')[1];
            try {
                const prompt = settings.language === 'zh'
                    ? `请严格按照下面格式输出（只输出正文，不要有任何额外注释、提示或重复的说明）：\n
1) 第一行：一句话结论（不超过30字）。\n2) 接着最多3条要点，每条不超过60字，包含热量估算与1-2条实用营养建议（每条开头用短破折号或数字）。\n3) 全文不要超过600字。\n\n只输出结果正文，禁止任何格式说明、字数检查或多余重复内容。`
                    : `Strictly output only the requested content, no extra commentary, no repetition, no instructions:\n\n1) First line: one-line summary (<=30 words).\n2) Then up to 3 bullet points, each <=60 words, include calorie estimate and 1-2 practical nutrition tips.\n3) Total output must not exceed 600 words.\n\nOutput only the result body. Do NOT repeat the prompt, do NOT add any notes or checks.`;
                const response = await callDoubaoImageAnalysis(base64Data, file.type, prompt);
                let textOutput = parseDoubaoResult(response) || '';
                textOutput = cleanDoubaoText(textOutput, 600);
                setCalorieResult(textOutput);
            } catch (err: any) {
                const msg = err?.message || String(err);
                setCalorieResult(settings.language === 'zh' ? `分析失败：${msg}` : `Analysis failed: ${msg}`);
            } finally { setIsAnalyzing(false); }
        };
        reader.readAsDataURL(file);
    };

    const renderHome = () => {
        const today = new Date().setHours(0,0,0,0);
        const todayRecords = records.filter(r => new Date(r.timestamp).setHours(0,0,0,0) === today);
        return (
            <div className="view">
                <header className="modern-header">
                    <div className="profile-group">
                        <div className="avatar-circle">🥑</div>
                        <div className="welcome-text">
                            <h2>{getDynamicGreeting()}</h2>
                            <p>{t.warmMoments}</p>
                        </div>
                    </div>
                    <button className="settings-icon-btn" onClick={() => setView('settings')}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.1a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                </header>
                
                <Clock lang={settings.language} />

                <div className="home-action-grid">
                    <div className="action-card h-card-1" onClick={() => setView('checkin')}>
                        <div className="action-icon">👟</div>
                        <div className="action-label">{t.checkin}</div>
                    </div>
                    <div className="action-card h-card-2" onClick={() => setView('food')}>
                        <div className="action-icon">🍎</div>
                        <div className="action-label">{t.calories}</div>
                    </div>
                    <div className="action-card h-card-3" onClick={() => setView('anniversary')}>
                        <div className="action-icon">❤️</div>
                        <div className="action-label">{t.anniversary}</div>
                    </div>
                    <div className="action-card h-card-4" onClick={() => setView('stats')}>
                        <div className="action-icon">📊</div>
                        <div className="action-label">{t.stats}</div>
                    </div>
                </div>

                <section className="timeline-section">
                    <div className="section-header">
                        <h3>✨ {t.todaySteps}</h3>
                        {todayRecords.length > 0 && <span className="item-count">{todayRecords.length} 项</span>}
                    </div>
                    
                    {todayRecords.length === 0 ? (
                        <div className="timeline-empty">
                            <div className="empty-illust">🌱</div>
                            <p>{t.noRecords}</p>
                        </div>
                    ) : (
                        <div className="timeline-container">
                            {todayRecords.map((r, idx) => (
                                <div key={r.id} className="timeline-node">
                                    <div className="node-marker">
                                        <div className="marker-dot"></div>
                                        {idx !== todayRecords.length - 1 && <div className="marker-line"></div>}
                                    </div>
                                    <div className="node-card">
                                        <div className="node-icon">{r.activityType === 'wakeup' ? '🌅' : r.type === 'sport' ? '💪' : '📝'}</div>
                                        <div className="node-info">
                                            <div className="node-title">{r.name}</div>
                                            <div className="node-meta">
                                                {r.activityType === 'wakeup' && `${r.time}`}
                                                {r.activityType === 'cardio' && `${r.duration}${t.min}${r.distance ? ` · ${r.distance}${r.unit}` : ''}`}
                                                {r.activityType === 'rope' && `${r.duration}${t.min} · ${r.count}${t.times}`}
                                                {r.activityType === 'strength' && `${r.sets}${t.groups} · ${r.count}${t.times}`}
                                                {['flexibility', 'habit', 'mind', 'daily', 'general'].includes(r.activityType) && `${r.duration}${t.min}`}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        );
    };

    return (
        <>
            {isAppLoading && <SplashScreen t={t} onFadeStart={() => setAppReady(true)} onFinish={() => setIsAppLoading(false)} />}
            {activeFestival && <FestivalPopup type={activeFestival} t={t} onClose={() => setActiveFestival(null)} />}
            <div className={`app-container ${appReady ? 'fade-in-ready' : ''}`}>
                
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
                                        <div style={{display:'flex', flexDirection:'column', gap:'12px', alignItems:'center', justifyContent:'center', marginBottom:'18px', paddingBottom:'12px', borderBottom:'2px dashed var(--accent-light)'}}>
                                            {uploadedDataUrl && (
                                                <div style={{display:'flex', alignItems:'center', justifyContent:'center'}}>
                                                    <img src={uploadedDataUrl} alt="upload" style={{width:'160px', height:'160px', objectFit:'cover', borderRadius:'12px', boxShadow:'var(--shadow-soft)', display:'block'}} />
                                                </div>
                                            )}
                                            <div style={{width: '100%', maxWidth: '560px'}}>
                                                <h3 style={{margin:'0 0 8px', fontSize:'18px', fontWeight:'900', color:'var(--accent)', textAlign:'left'}}>{t.aiVision}</h3>
                                                <div style={{textAlign:'left', whiteSpace:'pre-wrap', lineHeight:'1.6', color:'var(--text-main)', fontSize:'14px', fontWeight:'600'}}>
                                                    {(() => {
                                                        const short = makeShortSummary(calorieResult, 180, 4);
                                                        if (showFullResult) {
                                                            if (!calorieResult) return '';
                                                            return calorieResult.length > 600 ? calorieResult.slice(0, 600) + '…' : calorieResult;
                                                        }
                                                        return short || calorieResult || '';
                                                    })()}
                                                </div>
                                                {calorieResult && calorieResult.length > 180 && (
                                                    <button onClick={() => setShowFullResult(s => !s)} className="link-btn" style={{marginTop:'12px'}}>{showFullResult ? '收起' : '展开全文'}</button>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{display:'flex', gap:'12px'}}>
                                            <button onClick={() => { setCalorieResult(null); setUploadedDataUrl(null); setShowFullResult(false); }} className="btn-confirm highlight" style={{marginTop:'0', width:'100%', height:'56px'}}>🔄 {t.rescan}</button>
                                        </div>
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
                    <button onClick={() => setView('home')} className={view === 'home' ? 'active' : ''}>
                        <div className="nav-btn-pill"><HomeIcon active={view === 'home'} /><span>{t.home}</span></div>
                    </button>
                    <button onClick={() => {setView('checkin'); setSelectedItem(null);}} className={view === 'checkin' ? 'active' : ''}>
                        <div className="nav-btn-pill"><CheckIcon active={view === 'checkin'} /><span>{t.checkin}</span></div>
                    </button>
                    <button onClick={() => setView('food')} className={view === 'food' ? 'active' : ''}>
                        <div className="nav-btn-pill"><FoodIcon active={view === 'food'} /><span>{t.calories}</span></div>
                    </button>
                    <button onClick={() => setView('stats')} className={view === 'stats' ? 'active' : ''}>
                        <div className="nav-btn-pill"><StatsIcon active={view === 'stats'} /><span>{t.stats}</span></div>
                    </button>
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
                /* Fix CSS blur() call in backdropFilter by changing it to a string literal 'blur(8px)' to avoid conflict with window.blur(). */
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
    const [newCat, setNewCat] = useState<'love' | 'birthday' | 'life' | 'goal'>('life');

    const handleAdd = () => {
        if (!newName || !newDate) return;
        const item: Anniversary = { id: Math.random().toString(36).substr(2, 9), name: newName, date: newDate, category: newCat };
        setAnniversaries([...anniversaries, item]);
        setNewName(''); setNewDate(''); setNewCat('life');
        setShowAdd(false);
    };

    const getDaysBetween = (target: string) => {
        const d1 = new Date(target).getTime();
        const d2 = new Date().setHours(0,0,0,0);
        const diff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const catIcons = { love: '❤️', birthday: '🎂', life: '🌱', goal: '🎯' };
    const catColors = { love: '#FFD7E2', birthday: '#FFF4D6', life: '#E5F6D3', goal: '#D6E9FF' };

    return (
        <div className="view">
            <div className="sub-header"><button onClick={() => setView('home')} className="back-btn-square">⬅️</button><h2>{t.anniv.title}</h2></div>
            <div className="anniv-stats" style={{display:'flex', justifyContent:'space-between', padding:'0 8px 24px'}}><span style={{fontSize:'13px', fontWeight:'700', color:'var(--text-soft)'}}>已收录 {anniversaries.length} 个瞬间</span><button onClick={() => setShowAdd(true)} style={{fontSize:'13px', fontWeight:'850', color:'var(--accent)'}}>+ {t.anniv.add}</button></div>
            <div className="anniv-list" style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                {anniversaries.length === 0 ? 
                    <div className="empty-state" style={{marginTop:'40px'}}><p>{t.anniv.empty}</p></div> :
                    anniversaries.map((a: Anniversary) => {
                        const days = getDaysBetween(a.date);
                        return (
                            <div key={a.id} className="anniv-card-full" style={{background:'var(--card-bg)', borderRadius:'32px', padding:'24px', display:'flex', alignItems:'center', justifyContent:'space-between', border:'1px solid var(--border-color)', boxShadow:'var(--shadow-soft)'}}>
                                <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
                                    <div style={{width:'48px', height:'48px', borderRadius:'16px', background: catColors[a.category], display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px'}}>{catIcons[a.category]}</div>
                                    <div><p style={{margin:0, fontWeight:'850', fontSize:'16px'}}>{a.name}</p><p style={{margin:'4px 0 0', fontSize:'12px', color:'var(--text-soft)', fontWeight:'600'}}>{a.date}</p></div>
                                </div>
                                <div style={{textAlign:'right'}}>
                                    <p style={{margin:0, fontSize:'11px', color:'var(--text-soft)', fontWeight:'800'}}>{days >= 0 ? t.anniv.past : t.anniv.future}</p>
                                    <p style={{margin:0, fontSize:'24px', fontWeight:'900', color: days >= 0 ? 'var(--accent)' : 'var(--blue)'}}>{Math.abs(days)}<span style={{fontSize:'12px', marginLeft:'2px'}}>{t.anniv.day}</span></p>
                                    <button onClick={() => {if(confirm(t.anniv.confirmDel)) setAnniversaries(anniversaries.filter((it:any)=>it.id !== a.id))}} style={{color:'#FF3B30', fontSize:'10px', marginTop:'8px', fontWeight:'700'}}>{t.anniv.delete}</button>
                                </div>
                            </div>
                        );
                    })
                }
            </div>
            {showAdd && (
                <div className="drawer-overlay" onClick={() => setShowAdd(false)} style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.1)', zIndex:2000, display:'flex', alignItems:'flex-end'}}>
                    <div className="drawer-content" onClick={e => e.stopPropagation()} style={{width:'100%', background:'white', borderTopLeftRadius:'40px', borderTopRightRadius:'40px', padding:'40px 24px'}}>
                        <h3 style={{margin:'0 0 24px', fontSize:'18px', fontWeight:'850'}}>{t.anniv.add}</h3>
                        
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'24px'}}>
                            {Object.entries(t.anniv.cats).map(([key, label]: any) => (
                                <button key={key} onClick={() => setNewCat(key)} style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'8px', border:'none', background:'none'}}>
                                    <div style={{width:'56px', height:'56px', borderRadius:'18px', background: newCat === key ? catColors[key as keyof typeof catColors] : '#F4F4F7', border: newCat === key ? '2px solid var(--accent)' : '2px solid transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', transition:'0.2s'}}>
                                        {catIcons[key as keyof typeof catIcons]}
                                    </div>
                                    <span style={{fontSize:'11px', fontWeight:'800', color: newCat === key ? 'var(--text-main)' : 'var(--text-soft)'}}>{label}</span>
                                </button>
                            ))}
                        </div>

                        <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder={t.anniv.name} className="time-input-simple" style={{marginBottom:'16px'}} />
                        <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="time-input-simple" style={{marginBottom:'24px'}} />
                        
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
    const [count, setCount] = useState<number>(200);
    const [sets, setSets] = useState<number>(3);
    const [wakeupTime, setWakeupTime] = useState<string>('07:00');
    const [note, setNote] = useState<string>('');

    // 完整的预置打卡项
    const SPORT_CATS = [
        { title: t.categories.cardio, color: 'rgba(90, 200, 250, 0.1)', items: [ 
            { name: isZh ? '户外跑步' : 'Running', icon: '🏃', type: 'cardio' }, 
            { name: isZh ? '室内游泳' : 'Swimming', icon: '🏊', type: 'cardio' },
            { name: isZh ? '单车骑行' : 'Cycling', icon: '🚴', type: 'cardio' },
            { name: isZh ? '跳绳' : 'Rope', icon: '🪢', type: 'rope' },
            { name: isZh ? '健走' : 'Walking', icon: '🚶', type: 'cardio' },
            { name: isZh ? t.categories.custom : 'Custom', icon: '⚙️', type: 'cardio' }
        ] },
        { title: t.categories.strength, color: 'rgba(255, 150, 113, 0.1)', items: [ 
            { name: isZh ? '俯卧撑' : 'Push-ups', icon: '💪', type: 'strength' }, 
            { name: isZh ? '深蹲训练' : 'Squats', icon: '🦵', type: 'strength' },
            { name: isZh ? '哑铃训练' : 'Dumbbell', icon: '🏋️', type: 'strength' },
            { name: isZh ? '核心平板' : 'Plank', icon: '🧘', type: 'strength' },
            { name: isZh ? t.categories.custom : 'Custom', icon: '⚙️', type: 'strength' }
        ] },
        { title: t.categories.flexibility, color: 'rgba(175, 82, 222, 0.1)', items: [ 
            { name: isZh ? '瑜伽' : 'Yoga', icon: '🧘‍♀️', type: 'flexibility' }, 
            { name: isZh ? '普拉提' : 'Pilates', icon: '🩰', type: 'flexibility' },
            { name: isZh ? '拉伸' : 'Stretching', icon: '🙆', type: 'flexibility' },
            { name: isZh ? t.categories.custom : 'Custom', icon: '⚙️', type: 'flexibility' }
        ] }
    ];

    const LIFE_CATS = [ 
        { title: t.categories.habits, color: 'rgba(175, 82, 222, 0.1)', items: [ 
            { name: isZh ? '早起打卡' : 'Wake up', icon: '🌅', type: 'wakeup' }, 
            { name: isZh ? '多喝水' : 'Drink Water', icon: '💧', type: 'habit' },
            { name: isZh ? '阅读' : 'Reading', icon: '📖', type: 'habit' },
            { name: isZh ? '护肤' : 'Skincare', icon: '✨', type: 'habit' },
            { name: isZh ? t.categories.custom : 'Custom', icon: '⚙️', type: 'habit' }
        ] },
        { title: t.categories.mind, color: 'rgba(90, 200, 250, 0.1)', items: [ 
            { name: isZh ? '冥想' : 'Meditation', icon: '🧘‍♂️', type: 'mind' }, 
            { name: isZh ? '写日记' : 'Journaling', icon: '✍️', type: 'mind' },
            { name: isZh ? '听音乐' : 'Music', icon: '🎵', type: 'mind' },
            { name: isZh ? t.categories.custom : 'Custom', icon: '⚙️', type: 'mind' }
        ] },
        { title: t.categories.daily, color: 'rgba(255, 150, 113, 0.1)', items: [ 
            { name: isZh ? '做家务' : 'Housework', icon: '🧹', type: 'daily' }, 
            { name: isZh ? '烹饪' : 'Cooking', icon: '🍳', type: 'daily' },
            { name: isZh ? '洗衣服' : 'Laundry', icon: '🧺', type: 'daily' },
            { name: isZh ? t.categories.custom : 'Custom', icon: '⚙️', type: 'daily' }
        ] }
    ];
    
    const cats = checkinSubTab === 'sport' ? SPORT_CATS : LIFE_CATS;

    if (selectedItem) return (
        <div className="view detail-view-animate">
            <div className="sub-header">
                <button onClick={() => setSelectedItem(null)} className="back-btn-square">⬅️</button>
                <h2>{t.checkinDetails}</h2>
            </div>
            
            <div className="detail-card-main warm-theme">
                <div className="detail-hero-section">
                    <div className="detail-icon-large" style={{ background: cats.find(c => c.title === selectedItem.category)?.color.replace('0.1', '1') }}>
                        {selectedItem.icon}
                    </div>
                    <div className="detail-name-wrap">
                        <input 
                            type="text" 
                            className="detail-title-input" 
                            value={editName === (isZh ? '自定义' : 'Custom') ? '' : editName} 
                            onChange={(e) => setEditName(e.target.value)} 
                            placeholder={t.matterName}
                        />
                        <span className="category-tag">{selectedItem.category}</span>
                    </div>
                </div>

                <div className="form-content-wrap">
                    {selectedItem.type === 'cardio' && (
                        <div className="inputs-grid">
                            <Stepper label={t.duration} value={duration} unit={t.min} onChange={setDuration} step={5} />
                            <div className="input-with-toggle">
                                <span className="stepper-label">{t.distance}</span>
                                <div className="toggle-input-group">
                                    <input type="number" className="minimal-number-input" value={distance} onChange={e => setDistance(Number(e.target.value))} />
                                    <div className="mini-toggle">
                                        <button className={unit === 'km' ? 'active' : ''} onClick={() => setUnit('km')}>km</button>
                                        <button className={unit === 'm' ? 'active' : ''} onClick={() => setUnit('m')}>m</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedItem.type === 'rope' && (
                        <div className="inputs-grid">
                            <Stepper label={t.duration} value={duration} unit={t.min} onChange={setDuration} step={5} />
                            <Stepper label={isZh ? '跳绳个数' : 'Count'} value={count} unit={t.times} onChange={setCount} step={100} />
                        </div>
                    )}

                    {selectedItem.type === 'strength' && (
                        <div className="inputs-grid">
                            <Stepper label={t.sets} value={sets} unit={t.groups} onChange={setSets} />
                            <Stepper label={t.count} value={count} unit={t.times} onChange={setCount} step={5} />
                        </div>
                    )}

                    {selectedItem.type === 'wakeup' && (
                        <div className="full-width-input">
                            <span className="stepper-label">{t.wakeTime}</span>
                            <input type="time" className="large-time-input" value={wakeupTime} onChange={e => setWakeupTime(e.target.value)} />
                        </div>
                    )}

                    {['flexibility', 'habit', 'mind', 'daily', 'general'].includes(selectedItem.type) && (
                        <div className="inputs-grid">
                            <Stepper label={t.duration} value={duration} unit={t.min} onChange={setDuration} step={10} />
                        </div>
                    )}

                    <div className="note-area-wrap">
                        <span className="stepper-label">{isZh ? '写点感受' : 'How was it?'}</span>
                        <div className="warm-textarea-container">
                            <textarea 
                                className="warm-textarea" 
                                placeholder={t.notePlaceholder} 
                                value={note} 
                                onChange={e => setNote(e.target.value)}
                            />
                            <div className="note-decor">✍️</div>
                        </div>
                    </div>
                </div>

                <button className="btn-confirm highlight glow" onClick={() => handleAddRecord({ 
                    type: checkinSubTab, 
                    activityType: selectedItem.type, 
                    name: editName || selectedItem.name, 
                    category: selectedItem.category, 
                    duration, distance, unit, count, sets, 
                    time: wakeupTime,
                    note 
                })}>
                    {t.complete} ✨
                </button>
            </div>
        </div>
    );

    return (
        <div className="view">
            <div className="sub-header"><button onClick={() => setView('home')} className="back-btn-square">⬅️</button><h2>{t.checkin}</h2></div>
            <div className="subtab-container"><div className={`subtab-slider ${checkinSubTab === 'event' ? 'right' : ''}`}></div><button className={`tab-btn ${checkinSubTab === 'sport' ? 'active' : ''}`} onClick={() => setCheckinSubTab('sport')}>{t.sportCheck}</button><button className={`tab-btn ${checkinSubTab === 'event' ? 'active' : ''}`} onClick={() => setCheckinSubTab('event')}>{t.eventCheck}</button></div>
            <div className="scroll-area-categories" style={{paddingBottom:'20px'}}>
                {cats.map(c => ( 
                    <div key={c.title} style={{marginBottom:'24px'}}>
                        <h4 className="category-title-list">{c.title}</h4>
                        <div className="category-list-container">
                            {c.items.map(i => ( 
                                <div key={i.name} className="category-item-row" onClick={() => {setSelectedItem({...i, category: c.title, color: c.color}); setEditName(i.name);}}>
                                    <div className="category-item-indicator" style={{ background: c.color }}></div>
                                    <div className="item-row-content">
                                        <span className="item-icon">{i.icon}</span>
                                        <span className="item-name">{i.name}</span>
                                    </div>
                                    <span className="item-arrow">›</span>
                                </div> 
                            ))}
                        </div>
                    </div> 
                ))}
            </div>
        </div>
    );
}

function StatsView({ t, statsData, setView, records }: any) {
    if (!statsData) return <div className="view"><div className="sub-header"><button onClick={() => setView('home')} className="back-btn-square">⬅️</button><h2>{t.stats}</h2></div><div className="empty-state" style={{marginTop:'100px'}}><p>{t.noRecords}</p></div></div>;
    return (
        <div className="view">
            <div className="sub-header"><button onClick={() => setView('home')} className="back-btn-square">⬅️</button><h2>{t.stats}</h2></div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginBottom:'24px'}}>
                <div className="nav-card" style={{background:'var(--card-orange)'}}><span>{t.statLabels.streak}</span><span style={{fontSize:'24px', fontWeight:'900', marginTop:'4px'}}>{statsData.streak} {t.statLabels.days}</span></div>
                <div className="nav-card" style={{background:'var(--card-blue)'}}><span>{t.statLabels.today}</span><span style={{fontSize:'24px', fontWeight:'900', marginTop:'4px'}}>{statsData.todayCount} {t.statLabels.items}</span></div>
                <div className="nav-card" style={{background:'var(--card-pink)'}}><span>{t.statLabels.total}</span><span style={{fontSize:'24px', fontWeight:'900', marginTop:'4px'}}>{records.length} {t.statLabels.items}</span></div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
