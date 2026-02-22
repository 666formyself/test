
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
            intensity: { strong: '强', medium: '中', weak: '弱', off: '关闭' },
            permissionDenied: '通知权限被拒绝，请在浏览器设置中手动开启',
            enableNotification: '开启通知权限',
            notificationDesc: '允许发送打卡提醒和节日祝福'
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
        calendar: {
            exportTitle: '导出到系统日历',
            exportDesc: '生成 .ics 文件，导入手机日历获得后台提醒',
            exportBtn: '生成日历文件',
            exportSuccess: '日历文件已生成，请选择"打开"导入',
            noReminders: '请先开启至少一种提醒（定点提醒或打卡提醒）',
            iosTip: 'iOS 用户：下载后在分享菜单中选择"添加日历"',
            androidTip: 'Android 用户：下载后用日历应用打开即可导入'
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
            intensity: { strong: 'High', medium: 'Med', weak: 'Weak', off: 'Off' },
            permissionDenied: 'Notification permission denied. Please enable it in browser settings.',
            enableNotification: 'Enable Notifications',
            notificationDesc: 'Allow check-in reminders and festival greetings'
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
        calendar: {
            exportTitle: 'Export to Calendar',
            exportDesc: 'Generate .ics file for system calendar reminders',
            exportBtn: 'Generate Calendar File',
            exportSuccess: 'Calendar file generated, open to import',
            noReminders: 'Please enable at least one reminder first',
            iosTip: 'iOS: Select "Add to Calendar" in share menu',
            androidTip: 'Android: Open with your calendar app'
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

// 生成 ICS 日历文件并下载
const generateICSFile = (settings: AppSettings, t: any) => {
    const now = new Date();
    const formatDate = (d: Date) => {
        return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    let events = '';
    const uidBase = 'jiaqian-' + Date.now();
    
    // 1. 每日定点提醒事件
    if (settings.reminders.fixedReminderEnabled) {
        const [hour, min] = settings.reminders.fixedReminderTime.split(':').map(Number);
        const dtstart = new Date(now);
        dtstart.setHours(hour, min, 0, 0);
        
        // 如果设置时间已过，从明天开始
        if (dtstart < now) {
            dtstart.setDate(dtstart.getDate() + 1);
        }
        
        events += `BEGIN:VEVENT
UID:${uidBase}-fixed@jiaqian.app
DTSTART;TZID=Asia/Shanghai:${formatDate(dtstart).replace('Z', '')}
RRULE:FREQ=DAILY
SUMMARY:${t.notif.dailyTitle}
DESCRIPTION:${t.notif.dailyBody}
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:${t.notif.dailyTitle}
TRIGGER:-PT0M
END:VALARM
END:VEVENT
`;
    }
    
    // 2. 打卡提醒事件（每小时检查一次，只在未打卡时提醒）
    if (settings.reminders.checkInEnabled) {
        // 在免打扰时段外设置提醒
        const [dndStartHour, dndStartMin] = settings.reminders.dndStart.split(':').map(Number);
        const [dndEndHour, dndEndMin] = settings.reminders.dndEnd.split(':').map(Number);
        
        // 设置几个关键时间点的提醒（早上、中午、下午、晚上）
        const reminderTimes = [
            { hour: 9, min: 0, label: 'morning' },
            { hour: 12, min: 0, label: 'noon' },
            { hour: 15, min: 0, label: 'afternoon' },
            { hour: 18, min: 0, label: 'evening' }
        ];
        
        reminderTimes.forEach((time, idx) => {
            // 检查是否在免打扰时段
            const timeInMinutes = time.hour * 60 + time.min;
            const dndStartMinutes = dndStartHour * 60 + dndStartMin;
            const dndEndMinutes = dndEndHour * 60 + dndEndMin;
            
            let isInDND = false;
            if (dndStartMinutes < dndEndMinutes) {
                isInDND = timeInMinutes >= dndStartMinutes && timeInMinutes <= dndEndMinutes;
            } else {
                // 跨午夜
                isInDND = timeInMinutes >= dndStartMinutes || timeInMinutes <= dndEndMinutes;
            }
            
            if (!isInDND) {
                const dtstart = new Date(now);
                dtstart.setHours(time.hour, time.min, 0, 0);
                
                if (dtstart < now) {
                    dtstart.setDate(dtstart.getDate() + 1);
                }
                
                events += `BEGIN:VEVENT
UID:${uidBase}-checkin-${time.label}@jiaqian.app
DTSTART;TZID=Asia/Shanghai:${formatDate(dtstart).replace('Z', '')}
RRULE:FREQ=DAILY
SUMMARY:${t.notif.title}
DESCRIPTION:${t.notif.body}
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:${t.notif.title}
TRIGGER:-PT0M
END:VALARM
END:VEVENT
`;
            }
        });
    }
    
    if (!events) {
        alert(t.calendar?.noReminders || '请先开启至少一种提醒');
        return false;
    }
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//佳倩管家//打卡提醒//CN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:佳倩管家打卡提醒
X-WR-TIMEZONE:Asia/Shanghai
BEGIN:VTIMEZONE
TZID:Asia/Shanghai
X-LIC-LOCATION:Asia/Shanghai
BEGIN:STANDARD
TZOFFSETFROM:+0800
TZOFFSETTO:+0800
TZNAME:CST
DTSTART:19700101T000000
END:STANDARD
END:VTIMEZONE
${events}END:VCALENDAR`;
    
    // 下载文件
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `佳倩管家提醒_${now.toLocaleDateString('zh-CN')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
};

// 通过 Service Worker 发送通知（支持后台推送）
const triggerNotification = async (title: string, body: string, tag?: string) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    
    try {
        // 检查 Service Worker 是否可用
        if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, {
                body,
                icon: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
                badge: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
                tag: tag || 'checkin-reminder',
                requireInteraction: false,
                vibrate: [200, 100, 200]
            });
        } else {
            // 降级方案：如果 SW 不可用，使用传统通知
            new Notification(title, { body, icon: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png' });
        }
    } catch (e) { 
        console.error('通知发送失败:', e);
    }
};

// 请求通知权限
const requestNotificationPermission = async (): Promise<boolean> => {
    if (typeof Notification === 'undefined') {
        console.log('浏览器不支持通知 API');
        return false;
    }
    
    if (Notification.permission === 'granted') {
        return true;
    }
    
    if (Notification.permission === 'denied') {
        console.log('通知权限已被拒绝');
        return false;
    }
    
    // 请求权限
    const permission = await Notification.requestPermission();
    return permission === 'granted';
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

// AI / Doubao helper functions removed — feature disabled. If you want to re-enable,
// restore the server proxy calls and UI handling in the food view.

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
    const [view, setView] = useState<'home' | 'checkin' | 'stats' | 'settings' | 'anniversary'>('home');
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
    // pending duplicate add flow
    const [pendingRecord, setPendingRecord] = useState<Omit<CheckInRecord, 'id' | 'timestamp'> | null>(null);
    const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);

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

    // 检查是否在免打扰时段
    const isInDND = (timeStr: string, dndStart: string, dndEnd: string): boolean => {
        if (dndStart < dndEnd) {
            return timeStr >= dndStart && timeStr <= dndEnd;
        }
        // 跨午夜的情况（如 23:00 - 07:00）
        return timeStr >= dndStart || timeStr <= dndEnd;
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        
        const checkReminders = async () => {
            // 确保权限已授予
            if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
            
            const now = new Date();
            const hour = now.getHours();
            const min = now.getMinutes();
            const timeStr = `${hour.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}`;
            const todayKey = now.toDateString();
            const currentMinute = `${hour}:${min}`; // 用于精确匹配

            // 每日定点提醒
            if (settings.reminders.fixedReminderEnabled) {
                const reminderTime = settings.reminders.fixedReminderTime;
                const [reminderHour, reminderMin] = reminderTime.split(':').map(Number);
                const reminderMinuteStr = `${reminderHour}:${reminderMin}`;
                
                // 只在设定的时间点触发（精确到分钟）
                if (currentMinute === reminderMinuteStr && lastFixedNotifDay.current !== todayKey) {
                    // 检查免打扰
                    if (!isInDND(timeStr, settings.reminders.dndStart, settings.reminders.dndEnd)) {
                        await triggerNotification(t.notif.dailyTitle, t.notif.dailyBody, 'daily-reminder');
                        lastFixedNotifDay.current = todayKey;
                        if (settings.vibration) safeVibrate([200, 100, 200]);
                    }
                }
            }

            // 打卡提醒（整点检查，每小时一次）
            if (settings.reminders.checkInEnabled && min === 0) {
                if (isInDND(timeStr, settings.reminders.dndStart, settings.reminders.dndEnd)) return;
                
                const todayTimestamp = new Date().setHours(0,0,0,0);
                const hasTodayCheckin = records.some(r => new Date(r.timestamp).setHours(0,0,0,0) === todayTimestamp);
                
                if (!hasTodayCheckin) {
                    await triggerNotification(t.notif.title, t.notif.body, 'checkin-reminder');
                    if (settings.vibration) safeVibrate([200, 100, 200]);
                }
            }
        };
        
        // 每分钟检查一次
        interval = setInterval(checkReminders, 60000);
        
        // 立即检查一次（页面加载时）
        checkReminders();
        
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
        // Prevent duplicate records of same activity/type on the same calendar day
        try {
            const todayStart = new Date().setHours(0,0,0,0);
            const existsSameDay = records.some(r => {
                const rDay = new Date(r.timestamp).setHours(0,0,0,0);
                return rDay === todayStart && r.activityType === record.activityType && r.type === record.type && r.name === record.name;
            });
            if (existsSameDay) {
                // show in-app confirmation to allow user to still add if desired
                setPendingRecord(record);
                setShowDuplicateConfirm(true);
                if (settings.vibration) safeVibrate([30]);
                try { triggerNotification(t.notif.title, (settings.language === 'zh' ? '检测到今日已记录相同项目，是否仍然添加？' : 'Detected same activity recorded today — add anyway?')); } catch (e) { }
                return;
            }

            const newRecord: CheckInRecord = { ...record, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() };
            setRecords([newRecord, ...records]);
            setShowSuccess(true);
            setTimeout(() => { setShowSuccess(false); setSelectedItem(null); setView('home'); }, 2200);
            if (settings.vibration) safeVibrate([50]);
        } catch (e) {
            const newRecord: CheckInRecord = { ...record, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() };
            setRecords([newRecord, ...records]);
            setShowSuccess(true);
            setTimeout(() => { setShowSuccess(false); setSelectedItem(null); setView('home'); }, 2200);
            if (settings.vibration) safeVibrate([50]);
        }
    };

    // AI image upload handler removed (feature disabled)

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
                    {/* AI 热量功能已移除 */}
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
                {showDuplicateConfirm && pendingRecord && (
                    <div className="modal-overlay" onClick={() => { setShowDuplicateConfirm(false); setPendingRecord(null); }}>
                        <div className="modal-card prettier-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
                            <div className="modal-header">
                                <div className="modal-icon">⚠️</div>
                                <div>
                                    <div className="modal-title">{settings.language === 'zh' ? '检测到重复打卡' : 'Duplicate check-in detected'}</div>
                                    <div className="modal-sub">{settings.language === 'zh' ? '今日已记录相同项目，是否仍然添加？' : 'The same activity was already recorded today. Add anyway?'}</div>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button className="modal-btn modal-btn-primary" onClick={() => {
                                    const rec = pendingRecord as Omit<CheckInRecord, 'id' | 'timestamp'>;
                                    const newRecord: CheckInRecord = { ...rec, id: Math.random().toString(36).substr(2,9), timestamp: Date.now() };
                                    setRecords([newRecord, ...records]);
                                    setShowDuplicateConfirm(false);
                                    setPendingRecord(null);
                                    setShowSuccess(true);
                                    setTimeout(() => { setShowSuccess(false); setSelectedItem(null); setView('home'); }, 2200);
                                }}>{settings.language === 'zh' ? '仍然添加' : 'Add Anyway'}</button>
                                <button className="modal-btn modal-btn-ghost" onClick={() => { setShowDuplicateConfirm(false); setPendingRecord(null); }}>{settings.language === 'zh' ? '取消' : 'Cancel'}</button>
                            </div>
                        </div>
                    </div>
                )}
                <main className="content-area">
                    {view === 'home' && renderHome()}
                    {view === 'checkin' && <CheckinSelection t={t} checkinSubTab={checkinSubTab} setCheckinSubTab={setCheckinSubTab} setSelectedItem={setSelectedItem} handleAddRecord={handleAddRecord} setView={setView} selectedItem={selectedItem} editName={editName} setEditName={setEditName} settings={settings} />}
                    {/* AI 热量功能已从界面移除 */}
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
                    {/* 食物/热量页已移除 */}
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
    const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');

    // 检查通知权限状态
    useEffect(() => {
        if (typeof Notification === 'undefined') {
            setNotifPermission('unsupported');
        } else {
            setNotifPermission(Notification.permission);
        }
    }, []);

    // 请求通知权限
    const handleRequestPermission = async () => {
        const granted = await requestNotificationPermission();
        setNotifPermission(granted ? 'granted' : 'denied');
        if (granted) {
            // 发送测试通知
            await triggerNotification('权限已开启', '您已成功开启通知权限，打卡提醒将准时送达！✨', 'test-notification');
        }
    };

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

            <div className="settings-container">
                <div className="settings-card-new">
                    <div className="setting-row">
                        <div className="setting-left">
                            <div className="icon-circle">🌐</div>
                            <div>
                                <div className="setting-title">{t.language}</div>
                                <div className="setting-desc">{settings.language === 'zh' ? t.langOptions.zh : t.langOptions.en}</div>
                            </div>
                        </div>
                        <div className="setting-right">
                            <div className="pill-group">
                                <button className={settings.language === 'zh' ? 'pill active' : 'pill'} onClick={() => update({ language: 'zh' })}>{t.langOptions.zh}</button>
                                <button className={settings.language === 'en' ? 'pill active' : 'pill'} onClick={() => update({ language: 'en' })}>{t.langOptions.en}</button>
                            </div>
                        </div>
                    </div>

                    <div className="divider" />

                    <div className="setting-row">
                        <div className="setting-left">
                            <div className="icon-circle">🌓</div>
                            <div>
                                <div className="setting-title">{t.darkMode}</div>
                                <div className="setting-desc">{t.followSystem} / {t.manualControl}</div>
                            </div>
                        </div>
                        <div className="setting-right">
                            <div className="pill-group">
                                <button className={settings.darkModeType === 'system' ? 'pill active' : 'pill'} onClick={() => update({ darkModeType: 'system' })}>{t.followSystem}</button>
                                <button className={settings.darkModeType === 'manual' ? 'pill active' : 'pill'} onClick={() => update({ darkModeType: 'manual' })}>{t.manualControl}</button>
                            </div>
                        </div>
                    </div>

                    {settings.darkModeType === 'manual' && (
                        <div className="setting-row" style={{ marginTop: 6 }}>
                            <div className="setting-left"></div>
                            <div className="setting-right">
                                <label className="switch"><input type="checkbox" checked={!!settings.manualDarkMode} onChange={e => update({ manualDarkMode: e.target.checked })} /><span className="slider-round"></span></label>
                            </div>
                        </div>
                    )}

                    <div className="divider" />

                    <div className="setting-row" style={{ paddingBottom: 6 }}>
                        <div className="setting-left">
                            <div className="icon-circle">📲</div>
                            <div>
                                <div className="setting-title">{t.addToHome}</div>
                                <div className="setting-desc">{t.addToHomeGuideDefault}</div>
                            </div>
                        </div>
                        <div className="setting-right">
                            <button className="setting-action-btn" onClick={handleInstall}> {t.addToHome} </button>
                        </div>
                    </div>
                </div>

                <div className="settings-card-new">
                    <div className="section-label">{t.reminder.title}</div>
                    
                    {/* 通知权限请求按钮 */}
                    {notifPermission !== 'granted' && (
                        <div className="setting-row" style={{background: 'rgba(255, 182, 163, 0.15)', borderRadius: '16px', marginBottom: '12px', padding: '16px'}}>
                            <div className="setting-left">
                                <div className="icon-circle" style={{background: '#FFB6A3'}}>🔔</div>
                                <div>
                                    <div className="setting-title" style={{color: '#FF8A65', fontWeight: '800'}}>
                                        {notifPermission === 'denied' ? t.reminder.permissionDenied.split('。')[0] : t.reminder.enableNotification}
                                    </div>
                                    <div className="setting-desc">
                                        {notifPermission === 'denied' 
                                            ? t.reminder.permissionDenied
                                            : t.reminder.notificationDesc}
                                    </div>
                                </div>
                            </div>
                            <div className="setting-right">
                                {notifPermission !== 'denied' && (
                                    <button 
                                        className="setting-action-btn" 
                                        onClick={handleRequestPermission}
                                        style={{background: '#FFB6A3', color: 'white'}}
                                    >
                                        {t.reminder.goAuth}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <div className="setting-row">
                        <div className="setting-left">
                            <div className="icon-circle">⏰</div>
                            <div>
                                <div className="setting-title">{t.reminder.checkIn}</div>
                                <div className="setting-desc">{notifPermission === 'granted' ? t.reminder.granted : t.reminder.authNeeded}</div>
                            </div>
                        </div>
                        <div className="setting-right">
                            <label className="switch">
                                <input 
                                    type="checkbox" 
                                    checked={settings.reminders.checkInEnabled && notifPermission === 'granted'} 
                                    onChange={e => {
                                        if (notifPermission !== 'granted') {
                                            handleRequestPermission();
                                            return;
                                        }
                                        updateReminders({ checkInEnabled: e.target.checked });
                                    }} 
                                    disabled={notifPermission !== 'granted'}
                                />
                                <span className="slider-round"></span>
                            </label>
                        </div>
                    </div>

                    <div className="divider" />

                    <div className="setting-row">
                        <div className="setting-left">
                            <div className="icon-circle">📅</div>
                            <div>
                                <div className="setting-title">{t.reminder.fixedReminder}</div>
                                <div className="setting-desc">{t.reminder.fixedTime}</div>
                            </div>
                        </div>
                        <div className="setting-right">
                            <label className="switch">
                                <input 
                                    type="checkbox" 
                                    checked={settings.reminders.fixedReminderEnabled && notifPermission === 'granted'} 
                                    onChange={e => {
                                        if (notifPermission !== 'granted') {
                                            handleRequestPermission();
                                            return;
                                        }
                                        updateReminders({ fixedReminderEnabled: e.target.checked });
                                    }}
                                    disabled={notifPermission !== 'granted'}
                                />
                                <span className="slider-round"></span>
                            </label>
                        </div>
                    </div>

                    {settings.reminders.fixedReminderEnabled && (
                        <div className="setting-row" style={{ paddingTop: 6 }}>
                            <div className="setting-left" style={{ gap: 8 }}></div>
                            <div className="setting-right"><input type="time" className="time-input-simple" value={settings.reminders.fixedReminderTime} onChange={e => updateReminders({ fixedReminderTime: e.target.value })} /></div>
                        </div>
                    )}
                </div>

                {/* 导出到系统日历 */}
                <div className="settings-card-new">
                    <div className="section-label">{t.calendar.exportTitle}</div>
                    <div className="setting-row" style={{alignItems: 'flex-start'}}>
                        <div className="setting-left" style={{flex: 1}}>
                            <div className="icon-circle" style={{background: '#4CAF50'}}>📅</div>
                            <div style={{flex: 1}}>
                                <div className="setting-title">{t.calendar.exportTitle}</div>
                                <div className="setting-desc">{t.calendar.exportDesc}</div>
                                <div style={{marginTop: '8px', fontSize: '11px', color: 'var(--text-soft)', lineHeight: '1.5'}}>
                                    💡 {settings.language === 'zh' ? t.calendar.iosTip : t.calendar.androidTip}
                                </div>
                            </div>
                        </div>
                        <div className="setting-right">
                            <button 
                                className="setting-action-btn" 
                                onClick={() => {
                                    const success = generateICSFile(settings, t);
                                    if (success) {
                                        safeVibrate([50, 30, 50]);
                                    }
                                }}
                                style={{background: settings.reminders.checkInEnabled || settings.reminders.fixedReminderEnabled ? '#4CAF50' : '#ccc', color: 'white'}}
                                disabled={!settings.reminders.checkInEnabled && !settings.reminders.fixedReminderEnabled}
                            >
                                {t.calendar.exportBtn}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="settings-card-new">
                    <div className="section-label">{t.storage}</div>
                    <div className="setting-row">
                        <div className="setting-left">
                            <div className="icon-circle">🗄️</div>
                            <div>
                                <div className="setting-title">{t.storage}</div>
                                <div className="setting-desc">{t.storageUsage}: {records.length}</div>
                            </div>
                        </div>
                        <div className="setting-right">
                            <button className="setting-action-btn danger" onClick={() => { if (confirm(t.confirmClear)) { setRecords([]); localStorage.removeItem('jq_records'); } }}>{t.clearCache}</button>
                        </div>
                    </div>
                </div>

            </div>

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
            <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'16px'}}>
                <div className="chart-card" style={{padding:'18px', borderRadius:12, background:'var(--card-bg)', boxShadow:'var(--shadow-soft)'}}>
                    <h4 style={{margin:'0 0 8px'}}>{t.statLabels.weekly}</h4>
                    <div style={{display:'flex', alignItems:'flex-end', gap:'8px', height:140}}>
                        {(() => {
                            // ensure visibility: set baseMax to at least 1 so zero-data still shows tiny bars
                            const vals = statsData.weekly.map((w: any) => Number(w.count) || 0);
                            const max = Math.max(...vals, 1);
                            return statsData.weekly.map((w: any, idx: number) => {
                                const count = Number(w.count) || 0;
                                // compute percent of column area (min 6% when non-zero)
                                const pct = max === 0 ? 0 : Math.round((count / max) * 100);
                                const heightPct = count === 0 ? 6 : Math.max(6, pct);
                                return (
                                    <div key={idx} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center'}}>
                                        <div className="week-bar" title={`${w.label}: ${count} 次`}>
                                            <div className="week-bar-inner" style={{height: `${heightPct}%`}}></div>
                                        </div>
                                        <div style={{marginTop:8, fontSize:12, color:'var(--text-soft)'}}>{w.label}</div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                    <div style={{marginTop:10, fontSize:12, color:'var(--text-soft)'}}>柱状图按周统计，数值越高代表活动越多</div>
                </div>
                <div className="chart-card" style={{padding:'18px', borderRadius:12, background:'var(--card-bg)', boxShadow:'var(--shadow-soft)'}}>
                    <h4 style={{margin:'0 0 8px'}}>{t.statLabels.distribution}</h4>
                    <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                        {statsData.distribution && statsData.distribution.length ? statsData.distribution.map((d: any, i: number) => {
                            const pct = d.percentage || Math.round((d.count / (records.length || 1)) * 100);
                            const colors = ['#FFB085','#8EC5FF','#FF9CCF','#FFD580','#C7F9CC','#D3C2FF'];
                            const label = t.categories && (t.categories as any)[d.type] ? (t.categories as any)[d.type] : d.type;
                            return (
                                <div key={i} style={{display:'flex', alignItems:'center', gap:10}}>
                                    <div style={{width:12, height:12, borderRadius:3, background: colors[i % colors.length]}}></div>
                                    <div style={{width:90, fontSize:13, color:'var(--text-main)', fontWeight:800}}>{label}</div>
                                    <div style={{flex:1, height:12, background:'var(--border-color)', borderRadius:6, overflow:'hidden'}}>
                                        <div style={{width: `${pct}%`, height:'100%', background: colors[i % colors.length]}}></div>
                                    </div>
                                    <div style={{width:48, textAlign:'right', fontSize:13, color:'var(--text-soft)'}}>{pct}%</div>
                                </div>
                            );
                        }) : <div style={{color:'var(--text-soft)'}}>暂无分布数据</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
