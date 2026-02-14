
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

// Added CheckInRecord interface to fix the "Cannot find name 'CheckInRecord'" error
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
        confirmClear: '确定要清除所有打卡记录吗？此操作无法撤销。',
        langOptions: { zh: '中文简体', en: 'English' },
        aiVision: 'AI 视觉分析', scanFood: '扫描食物',
        successMsg: '太棒啦✨', successSub: '坚持就是胜利💪',
        nextTime: '稍后再说', customTask: '自定义任务',
        distance: '运动距离', km: '公里', m: '米',
        count: '个数', sets: '组数', times: '次', groups: '组',
        wakeTime: '起床时间', min: '分钟',
        reminder: {
            title: '提醒设置',
            checkIn: '打卡提醒',
            auxiliary: '辅助提醒',
            count: '提醒次数',
            interval: '提醒间隔',
            dnd: '免打扰时段',
            anim: '动画强度',
            authNeeded: '请授权通知权限，以使用提醒功能',
            goAuth: '去授权',
            report: '统计报告',
            share: '分享成功',
            message: '消息中心',
            intensity: { strong: '强', medium: '中', weak: '弱', off: '关闭' }
        },
        statLabels: {
            streak: '连续打卡', today: '今日达成', total: '累计总数',
            weekly: '周活跃度', distribution: '生活分布', topItems: '最常进行',
            days: '天', items: '项'
        },
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
            title: 'Reminders',
            checkIn: 'Check-in Alert',
            auxiliary: 'Auxiliary Alert',
            count: 'Alert Count',
            interval: 'Interval',
            dnd: 'DND Period',
            anim: 'Animation',
            authNeeded: 'Please grant notification permission',
            goAuth: 'Grant',
            report: 'Report Notify',
            share: 'Share Notify',
            message: 'Message Center',
            intensity: { strong: 'High', medium: 'Med', weak: 'Weak', off: 'Off' }
        },
        statLabels: {
            streak: 'Streak', today: 'Today', total: 'Total',
            weekly: 'Weekly Momentum', distribution: 'Life Balance', topItems: 'Top Activities',
            days: 'days', items: 'items'
        },
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
    const [notificationPermission, setNotificationPermission] = useState<string>(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );

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
    
    // Mode notification state
    const [modeNotification, setModeNotification] = useState<{visible: boolean, type: 'sun' | 'moon'}>({visible: false, type: 'sun'});

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
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            // Deep merge defaults for new reminder fields
            setSettings(prev => ({
                ...prev,
                ...parsed,
                reminders: { ...prev.reminders, ...(parsed.reminders || {}) }
            }));
        }
    }, []);

    // Theme & Anim Intensity logic
    useEffect(() => {
        const applyTheme = () => {
            let isDark = false;
            if (settings.darkModeType === 'system') {
                isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            } else {
                isDark = settings.manualDarkMode;
            }
            document.body.className = isDark ? 'dark' : '';
            
            // Apply animation intensity
            const intensities = { strong: '1.2s', medium: '0.8s', weak: '0.4s', off: '0s' };
            document.documentElement.style.setProperty('--global-transition', intensities[settings.reminders.animIntensity]);
        };

        applyTheme();

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = () => {
            if (settings.darkModeType === 'system') applyTheme();
        };
        mediaQuery.addEventListener('change', listener);

        if (firstUpdate.current) {
            firstUpdate.current = false;
            return;
        }
        localStorage.setItem('jq_records', JSON.stringify(records));
        localStorage.setItem('jq_settings', JSON.stringify(settings));

        return () => mediaQuery.removeEventListener('change', listener);
    }, [records, settings]);

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
                if (recordDates[i] === current) {
                    streak++;
                    current -= 86400000;
                } else if (recordDates[i] < current) break;
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
        const counts: Record<string, number> = {};
        records.forEach(r => counts[r.name] = (counts[r.name] || 0) + 1);
        const topActivities = Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 3);
        return { todayCount, streak, weekly, distribution, topActivities };
    }, [records, settings.language]);

    const changeLanguage = (lang: 'zh' | 'en') => {
        if (lang === settings.language) return;
        setIsRefreshing(true);
        setTimeout(() => {
            setSettings(prev => ({ ...prev, language: lang }));
            setTimeout(() => setIsRefreshing(false), 300);
        }, 50);
    };

    const toggleThemeManual = (isDark: boolean) => {
        setSettings(s => ({...s, manualDarkMode: isDark, darkModeType: 'manual'}));
        showThemeNotification(isDark ? 'moon' : 'sun');
    };

    const setThemeType = (type: DarkModeType) => {
        setSettings(s => ({...s, darkModeType: type}));
        const targetIsDark = type === 'system' 
            ? window.matchMedia('(prefers-color-scheme: dark)').matches 
            : settings.manualDarkMode;
        showThemeNotification(targetIsDark ? 'moon' : 'sun');
    };

    const showThemeNotification = (type: 'sun' | 'moon') => {
        setModeNotification({visible: true, type});
        setTimeout(() => setModeNotification(prev => ({...prev, visible: false})), 1200);
    };

    const handleRequestNotification = async () => {
        if (typeof Notification === 'undefined') return;
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
    };

    const updateReminders = (updates: Partial<ReminderSettings>) => {
        setSettings(s => ({
            ...s,
            reminders: { ...s.reminders, ...updates }
        }));
    };

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
        try {
            const reader = new FileReader();
            reader.onload = async () => {
                if (!reader.result) return;
                const base64Data = (reader.result as string).split(',')[1];
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const imagePart = { inlineData: { mimeType: file.type, data: base64Data } };
                const textPart = { text: settings.language === 'zh' ? '分析这张图片估算热量' : 'Estimate calories from this image' };
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: { parts: [imagePart, textPart] },
                });
                setCalorieResult(response.text || 'Error');
                setIsAnalyzing(false);
            };
            reader.readAsDataURL(file);
        } catch (error) { setIsAnalyzing(false); }
    };

    const renderSettings = () => {
        const isAuthBlocked = notificationPermission !== 'granted';
        
        return (
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

                <div className="settings-section-title">{t.darkMode}</div>
                <div className="settings-card">
                    <div className="radio-group" style={{padding:'8px'}}>
                        <div className={`cartoon-radio ${settings.darkModeType === 'system' ? 'selected' : ''}`} onClick={() => setThemeType('system')}>
                            <span className="radio-label">{t.followSystem}</span>
                            <div className="check-mark">✓</div>
                        </div>
                        <div className={`cartoon-radio ${settings.darkModeType === 'manual' ? 'selected' : ''}`} onClick={() => setThemeType('manual')}>
                            <span className="radio-label">{t.manualControl}</span>
                            <div className="check-mark">✓</div>
                        </div>
                    </div>
                    <div className="divider-h" />
                    <div className={`setting-item ${settings.darkModeType === 'system' ? 'disabled-ui' : ''}`} style={{marginTop:'4px'}}>
                        <span className="radio-label">{t.darkMode}</span>
                        <label className="switch">
                            <input type="checkbox" disabled={settings.darkModeType === 'system'} checked={settings.darkModeType === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches : settings.manualDarkMode} onChange={(e) => toggleThemeManual(e.target.checked)} />
                            <span className="slider"></span>
                        </label>
                    </div>
                </div>

                {/* Reminder Settings Section */}
                <div className="settings-section-title">{t.reminder.title}</div>
                
                {/* Check-in Alerts Card */}
                <div className={`settings-card ${isAuthBlocked ? 'auth-blocked' : ''}`} style={{marginBottom:'16px'}}>
                    <div className="setting-item">
                        <span className="radio-label">{t.reminder.checkIn}</span>
                        <label className="switch">
                            <input type="checkbox" disabled={isAuthBlocked} checked={settings.reminders.checkInEnabled} onChange={(e) => updateReminders({checkInEnabled: e.target.checked})} />
                            <span className="slider"></span>
                        </label>
                    </div>
                    
                    {isAuthBlocked ? (
                        <div className="auth-notice">
                            <p>{t.reminder.authNeeded}</p>
                            <button className="btn-auth" onClick={handleRequestNotification}>{t.reminder.goAuth}</button>
                        </div>
                    ) : (
                        <>
                            <div className="divider-h" />
                            <div className={`setting-sub-group ${!settings.reminders.checkInEnabled ? 'disabled-ui' : ''}`}>
                                <div className="setting-item">
                                    <span className="radio-label-small">{t.reminder.count}</span>
                                    <div className="count-selector">
                                        {[1, 2, 3].map(num => (
                                            <button key={num} className={settings.reminders.reminderCount === num ? 'active' : ''} onClick={() => updateReminders({reminderCount: num})}>{num}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="setting-item">
                                    <span className="radio-label-small">{t.reminder.interval}</span>
                                    <select className="select-mini" value={settings.reminders.interval} onChange={(e) => updateReminders({interval: parseInt(e.target.value)})}>
                                        <option value={5}>5 {t.min}</option>
                                        <option value={10}>10 {t.min}</option>
                                        <option value={15}>15 {t.min}</option>
                                    </select>
                                </div>
                                <div className="setting-item" style={{alignItems:'flex-start', flexDirection:'column', gap:'10px'}}>
                                    <span className="radio-label-small">{t.reminder.dnd}</span>
                                    <div style={{display:'flex', gap:'8px', width:'100%'}}>
                                        <input type="time" className="time-input-mini" value={settings.reminders.dndStart} onChange={(e) => updateReminders({dndStart: e.target.value})} />
                                        <span style={{color:'var(--text-soft)'}}>~</span>
                                        <input type="time" className="time-input-mini" value={settings.reminders.dndEnd} onChange={(e) => updateReminders({dndEnd: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Auxiliary Alerts Card */}
                <div className="settings-card">
                    <div className="setting-item">
                        <span className="radio-label">{t.reminder.auxiliary}</span>
                        <label className="switch">
                            <input type="checkbox" checked={settings.reminders.auxiliaryEnabled} onChange={(e) => updateReminders({auxiliaryEnabled: e.target.checked})} />
                            <span className="slider"></span>
                        </label>
                    </div>
                    <div className={`setting-sub-group ${!settings.reminders.auxiliaryEnabled ? 'disabled-ui' : ''}`}>
                        <div className="divider-h" />
                        <div className="setting-item">
                            <span className="radio-label-small">{t.reminder.report}</span>
                            <label className="switch mini">
                                <input type="checkbox" checked={settings.reminders.reportNotify} onChange={(e) => updateReminders({reportNotify: e.target.checked})} />
                                <span className="slider"></span>
                            </label>
                        </div>
                        <div className="setting-item">
                            <span className="radio-label-small">{t.reminder.share}</span>
                            <label className="switch mini">
                                <input type="checkbox" checked={settings.reminders.shareNotify} onChange={(e) => updateReminders({shareNotify: e.target.checked})} />
                                <span className="slider"></span>
                            </label>
                        </div>
                        <div className="setting-item">
                            <span className="radio-label-small">{t.reminder.message}</span>
                            <label className="switch mini">
                                <input type="checkbox" checked={settings.reminders.messageCenterNotify} onChange={(e) => updateReminders({messageCenterNotify: e.target.checked})} />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Animation Intensity Section */}
                <div className="settings-section-title">{t.reminder.anim}</div>
                <div className="settings-card" style={{padding:'20px'}}>
                    <div className="intensity-slider">
                        {(['off', 'weak', 'medium', 'strong'] as AnimIntensity[]).map((level) => (
                            <button key={level} className={`intensity-btn ${settings.reminders.animIntensity === level ? 'active' : ''}`} onClick={() => updateReminders({animIntensity: level})}>
                                <div className="dot" />
                                <span>{t.reminder.intensity[level]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="settings-section-title">{t.storage}</div>
                <button className="btn-danger-soft" style={{marginTop:0}} onClick={() => { if(window.confirm(t.confirmClear)) { setRecords([]); alert(settings.language==='zh'?'清理成功':'Cleared'); } }}>{t.clearCache}</button>
            </div>
        );
    };

    const renderCheckinSelection = () => {
        const isZh = settings.language === 'zh';
        const SPORT_CATS = [
            { title: t.categories.cardio, color:'var(--card-blue)', items: [{name: isZh?'晨跑':'Jogging', icon: '🏃', type: 'cardio'}, {name: isZh?'游泳':'Swimming', icon: '🏊', type: 'cardio'}, {name: isZh?'自行车':'Cycling', icon: '🚲', type: 'cardio'}, {name: isZh?'跳绳':'Jump Rope', icon: '➰', type: 'strength'}, {name: isZh?'步行':'Walking', icon: '🚶', type: 'cardio'}] },
            { title: t.categories.strength, color:'var(--card-orange)', items: [{name: isZh?'深蹲':'Squat', icon: '💪', type: 'strength'}, {name: isZh?'俯卧撑':'Push-ups', icon: '🏋️', type: 'strength'}, {name: isZh?'核心':'Core', icon: '🧘', type: 'strength'}] },
            { title: t.categories.flexibility, color:'var(--card-pink)', items: [{name: isZh?'瑜伽':'Yoga', icon: '🤸', type: 'general'}, {name: isZh?'拉伸':'Stretching', icon: '🙆', type: 'general'}] }
        ];
        const LIFE_CATS = [
            { title: t.categories.habits, color:'var(--card-purple)', items: [{name: isZh?'早起':'Early Bird', icon: '🌅', type: 'wakeup'}, {name: isZh?'多喝水':'Drink Water', icon: '💧', type: 'habit'}, {name: isZh?'阅读':'Reading', icon: '📖', type: 'habit'}] },
            { title: t.categories.mind, color:'var(--card-blue)', items: [{name: isZh?'冥想':'Meditate', icon: '🧠', type: 'habit'}, {name: isZh?'护肤':'✨', type: 'habit'}] },
            { title: t.categories.housework, color:'var(--card-orange)', items: [{name: isZh?'大扫除':'Cleaning', icon: '🧹', type: 'habit'}, {name: isZh?'下厨':'Cooking', icon: '🍳', type: 'habit'}] }
        ];
        const cats = checkinSubTab === 'sport' ? SPORT_CATS : LIFE_CATS;
        const openDetail = (item: any) => { setSelectedItem(item); setEditName(item.name.includes('自定义') || item.name.includes('Custom') ? '' : item.name); };

        if (selectedItem) return (
            <div className="view">
                <div className="sub-header"><button onClick={() => setSelectedItem(null)} className="back-btn-square">⬅️</button><h2>{t.checkinDetails}</h2></div>
                <div className="detail-card">
                    <div style={{display:'flex', gap:'20px', marginBottom:'24px', alignItems:'center'}}><div style={{width:'80px', height:'80px', background:'var(--input-bg)', borderRadius:'24px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'40px', border:'1px solid var(--border-color)'}}>{selectedItem.icon}</div><div style={{flex:1}}><p style={{color:'var(--accent)', fontSize:'12px', fontWeight:'800', marginBottom:'4px'}}>{selectedItem.category}</p><input type="text" className="name-edit-input" placeholder={t.matterName} value={editName} onChange={(e)=>setEditName(e.target.value)}/></div></div>
                    {selectedItem.type === 'cardio' && (
                        <><div className="input-group" style={{marginBottom:'20px'}}><div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}><label style={{fontWeight:'700', color:'var(--text-soft)'}}>{t.duration}</label><span style={{color:'var(--accent)', fontWeight:'800'}}><span id="dur-val">30</span> {t.min}</span></div><input type="range" className="peach-range" style={{width:'100%'}} min="0" max="120" defaultValue="30" id="dur-s" onChange={(e)=>{const val=document.getElementById('dur-val'); if(val) val.innerText=e.target.value;}}/></div><div className="input-group" style={{marginBottom:'20px'}}><label style={{fontWeight:'700', color:'var(--text-soft)', display:'block', marginBottom:'10px'}}>{t.distance}</label><div style={{display:'flex', gap:'10px'}}><input type="number" id="dist-v" className="text-input-compact" placeholder="0.0" step="0.1" style={{flex: 2.5, minWidth:'100px'}}/><select id="dist-u" className="select-compact" style={{flex:1, minWidth:'75px'}}><option value="km">{t.km}</option><option value="m">{t.m}</option></select></div></div></>
                    )}
                    {selectedItem.type === 'strength' && (
                        <div style={{marginBottom:'20px', display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:'15px'}}><div style={{minWidth:0}}><label style={{fontWeight:'700', color:'var(--text-soft)', display:'block', marginBottom:'10px'}}>{t.count}</label><div style={{display:'flex', alignItems:'center', gap:'8px'}}><input type="number" id="count-v" className="text-input-compact" placeholder="0" style={{flex:1, minWidth:0}}/><span style={{fontSize:'12px', color:'var(--text-soft)', flexShrink:0}}>{t.times}</span></div></div><div style={{minWidth:0}}><label style={{fontWeight:'700', color:'var(--text-soft)', display:'block', marginBottom:'10px'}}>{t.sets}</label><div style={{display:'flex', alignItems:'center', gap:'8px'}}><input type="number" id="sets-v" className="text-input-compact" placeholder="0" style={{flex:1, minWidth:0}}/><span style={{fontSize:'12px', color:'var(--text-soft)', flexShrink:0}}>{t.groups}</span></div></div></div>
                    )}
                    {selectedItem.type === 'wakeup' && (
                        <div className="input-group" style={{marginBottom:'24px'}}><label style={{fontWeight:'700', color:'var(--text-soft)', display:'block', marginBottom:'10px'}}>{t.wakeTime}</label><input type="time" id="wake-v" className="text-input-compact" defaultValue="07:30" style={{width:'100%', fontSize:'20px', textAlign:'center', height:'60px'}}/></div>
                    )}
                    {(selectedItem.type === 'habit' || selectedItem.type === 'general') && (
                        <div className="input-group" style={{marginBottom:'24px'}}><div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}><label style={{fontWeight:'700', color:'var(--text-soft)'}}>{t.duration}</label><span style={{color:'var(--accent)', fontWeight:'800'}}><span id="dur-val-h">30</span> {t.min}</span></div><input type="range" className="peach-range" style={{width:'100%'}} min="0" max="180" defaultValue="30" id="dur-h" onChange={(e)=>{const val=document.getElementById('dur-val-h'); if(val) val.innerText=e.target.value;}}/></div>
                    )}
                    <div className="input-group" style={{marginBottom:'24px'}}><label style={{fontWeight:'700', color:'var(--text-soft)', display:'block', marginBottom:'10px'}}>{settings.language==='zh'?'备注':'Note'}</label><textarea placeholder={isZh?"记下此刻的心情...":"Note your mood..."} id="note-a" className="textarea-light" rows={2}/></div>
                    <div style={{display:'flex', gap:'12px'}}><button className="btn-danger-soft" style={{marginTop:0, flex:1, borderRadius:'18px'}} onClick={()=>setSelectedItem(null)}>{t.nextTime}</button><button className="back-btn-square" style={{width:'auto', flex:2, height:'58px', borderRadius:'18px', background:'var(--accent)', fontSize:'16px', fontWeight:'800'}} onClick={()=>{
                        const finalName = editName.trim() || selectedItem.name;
                        const note = (document.getElementById('note-a') as HTMLTextAreaElement).value;
                        let payload: any = { type: checkinSubTab, activityType: selectedItem.type, name: finalName, category: selectedItem.category, note: note };
                        if (selectedItem.type === 'cardio') { payload.duration = parseInt((document.getElementById('dur-s') as HTMLInputElement).value); payload.distance = parseFloat((document.getElementById('dist-v') as HTMLInputElement).value) || 0; payload.unit = (document.getElementById('dist-u') as HTMLSelectElement).value; }
                        else if (selectedItem.type === 'strength') { payload.count = parseInt((document.getElementById('count-v') as HTMLInputElement).value) || 0; payload.sets = parseInt((document.getElementById('sets-v') as HTMLInputElement).value) || 0; }
                        else if (selectedItem.type === 'wakeup') { payload.time = (document.getElementById('wake-v') as HTMLInputElement).value; }
                        else { payload.duration = parseInt((document.getElementById('dur-h') as HTMLInputElement).value) || 0; }
                        handleAddRecord(payload);
                    }}>{t.complete}</button></div>
                </div>
            </div>
        );
        return (
            <div className="view">
                <div className="sub-header"><button onClick={() => setView('home')} className="back-btn-square">⬅️</button><h2>{t.checkin}</h2></div>
                <div style={{display:'flex', background:'var(--input-bg)', borderRadius:'16px', padding:'4px', marginBottom:'24px'}}><button className={`tab-btn ${checkinSubTab === 'sport' ? 'active' : ''}`} style={{flex:1, border:'none', background: checkinSubTab === 'sport' ? 'var(--card-bg)' : 'none', padding:'12px', borderRadius:'12px', color: checkinSubTab === 'sport' ? 'var(--accent)' : 'var(--text-soft)', fontWeight:'800'}} onClick={() => setCheckinSubTab('sport')}>{t.sportCheck}</button><button className={`tab-btn ${checkinSubTab === 'event' ? 'active' : ''}`} style={{flex:1, border:'none', background: checkinSubTab === 'event' ? 'var(--card-bg)' : 'none', padding:'12px', borderRadius:'12px', color: checkinSubTab === 'event' ? 'var(--accent)' : 'var(--text-soft)', fontWeight:'800'}} onClick={() => setCheckinSubTab('event')}>{t.eventCheck}</button></div>
                {cats.map(c => (
                    <div key={c.title} style={{marginBottom:'24px'}}><h4 style={{margin:'0 0 12px 8px', color:'var(--text-soft)', fontSize:'14px'}}>{c.title}</h4><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>{c.items.map(i => (<div key={i.name} className="nav-card" style={{background: c.color, border:'none', padding: '16px'}} onClick={() => openDetail({...i, category: c.title})}><span style={{fontSize:'28px', marginBottom:'4px'}}>{i.icon}</span><span style={{fontWeight:'700', fontSize:'13px'}}>{i.name}</span></div>))}<div className="nav-card" style={{border:'2px dashed var(--border-color)', background:'none', padding: '16px'}} onClick={() => openDetail({name: isZh?'自定义任务':'Custom Task', icon: '📝', category: c.title, type: checkinSubTab === 'sport' ? 'strength' : 'habit'})}><span style={{fontSize:'28px', marginBottom:'4px'}}>➕</span><span style={{fontWeight:'700', fontSize:'13px', color:'var(--accent)'}}>{isZh ? '自定义' : 'Custom'}</span></div></div></div>
                ))}
            </div>
        );
    };

    const renderStats = () => {
        if (!statsData) return <div className="view"><div className="sub-header"><button onClick={() => setView('home')} className="back-btn-square">⬅️</button><h2>{t.stats}</h2></div><div className="empty-state" style={{marginTop:'100px'}}><div style={{fontSize:'64px', marginBottom:'20px'}}>📈</div><p>{t.noRecords}</p></div></div>;
        const maxWeekly = Math.max(...statsData.weekly.map(w => w.count), 1);
        return (
            <div className="view">
                <div className="sub-header"><button onClick={() => setView('home')} className="back-btn-square">⬅️</button><h2>{t.stats}</h2></div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', marginBottom:'20px'}}><div className="settings-card" style={{padding:'12px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', background:'var(--card-orange)'}}><span style={{fontSize:'10px', fontWeight:'800', color:'var(--accent)', marginBottom:'4px'}}>{t.statLabels.streak}</span><div style={{display:'flex', alignItems:'baseline', gap:'2px'}}><span style={{fontSize:'20px', fontWeight:'900'}}>{statsData.streak}</span><span style={{fontSize:'10px', fontWeight:'700', color:'var(--text-soft)'}}>{t.statLabels.days}</span></div></div><div className="settings-card" style={{padding:'12px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', background:'var(--card-blue)'}}><span style={{fontSize:'10px', fontWeight:'800', color:'var(--blue)', marginBottom:'4px'}}>{t.statLabels.today}</span><div style={{display:'flex', alignItems:'baseline', gap:'2px'}}><span style={{fontSize:'20px', fontWeight:'900'}}>{statsData.todayCount}</span><span style={{fontSize:'10px', fontWeight:'700', color:'var(--text-soft)'}}>{t.statLabels.items}</span></div></div><div className="settings-card" style={{padding:'12px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', background:'var(--card-pink)'}}><span style={{fontSize:'10px', fontWeight:'800', color:'#FF5C5C', marginBottom:'4px'}}>{t.statLabels.total}</span><div style={{display:'flex', alignItems:'baseline', gap:'2px'}}><span style={{fontSize:'20px', fontWeight:'900'}}>{records.length}</span><span style={{fontSize:'10px', fontWeight:'700', color:'var(--text-soft)'}}>{t.statLabels.items}</span></div></div></div>
                <div className="settings-card" style={{padding:'20px', marginBottom:'20px'}}><h4 style={{margin:'0 0 20px', fontSize:'14px', fontWeight:'800'}}>{t.statLabels.weekly}</h4><div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', height:'100px', padding:'0 5px'}}>{statsData.weekly.map((w, i) => (<div key={i} style={{display:'flex', flexDirection:'column', alignItems:'center', flex:1}}><div style={{width:'12px', height:`${(w.count / maxWeekly) * 80}px`, minHeight: w.count > 0 ? '4px' : '0px', background: w.count > 0 ? 'var(--accent)' : 'var(--input-bg)', borderRadius:'6px', transition:'height 0.6s cubic-bezier(0.16, 1, 0.3, 1)'}} /><span style={{fontSize:'10px', marginTop:'8px', fontWeight:'700', color: i === 6 ? 'var(--accent)' : 'var(--text-soft)'}}>{w.label}</span></div>))}</div></div>
                <div style={{display:'grid', gridTemplateColumns:'1fr', gap:'20px'}}><div className="settings-card" style={{padding:'20px'}}><h4 style={{margin:'0 0 16px', fontSize:'14px', fontWeight:'800'}}>{t.statLabels.distribution}</h4><div style={{display:'flex', flexDirection:'column', gap:'12px'}}>{statsData.distribution.map(d => (<div key={d.type} style={{display:'flex', alignItems:'center', gap:'12px'}}><span style={{fontSize:'14px', width:'20px'}}>{d.type === 'cardio' ? '👟' : d.type === 'strength' ? '💪' : d.type === 'wakeup' ? '🌅' : d.type === 'habit' ? '💧' : '📝'}</span><div style={{flex:1, height:'8px', background:'var(--input-bg)', borderRadius:'4px', overflow:'hidden'}}><div style={{width: `${(d.count / records.length) * 100}%`, height: '100%', background: d.type === 'cardio' ? 'var(--blue)' : d.type === 'strength' ? 'var(--accent)' : d.type === 'wakeup' ? '#FFD700' : 'var(--card-purple)', transition: 'width 0.8s ease-out'}} /></div><span style={{fontSize:'11px', fontWeight:'800', minWidth:'30px', textAlign:'right'}}>{Math.round((d.count / records.length) * 100)}%</span></div>))}</div></div><div className="settings-card" style={{padding:'20px'}}><h4 style={{margin:'0 0 16px', fontSize:'14px', fontWeight:'800'}}>{t.statLabels.topItems}</h4><div style={{display:'flex', flexDirection:'column', gap:'10px'}}>{statsData.topActivities.map((act, idx) => (<div key={act.name} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', background:'var(--input-bg)', borderRadius:'12px'}}><div style={{display:'flex', alignItems:'center', gap:'10px'}}><span style={{fontSize:'14px'}}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span><span style={{fontSize:'13px', fontWeight:'700'}}>{act.name}</span></div><span style={{fontSize:'11px', fontWeight:'800', color:'var(--accent)'}}>{act.count} {t.statLabels.items}</span></div>))}</div></div></div>
            </div>
        );
    };

    const renderHome = () => {
        const today = new Date().setHours(0,0,0,0);
        const todayRecords = records.filter(r => new Date(r.timestamp).setHours(0,0,0,0) === today);
        return (
            <div className="view">
                <header className="user-header"><div className="avatar">🥑</div><div className="info"><h2>{settings.language === 'zh' ? '你好，开启活力一天' : 'Hello, active day!'}</h2><p>{t.personalAssistant} · {t.warmMoments}</p></div><button className="settings-btn" onClick={() => setView('settings')}>⚙️</button></header>
                <div className="grid-nav"><div className="nav-card card-orange" onClick={() => setView('checkin')}><div className="icon-bg-wrap"><span style={{fontSize:'32px'}}>👟</span></div><span>{t.checkin}</span></div><div className="nav-card card-blue" onClick={() => setView('food')}><div className="icon-bg-wrap"><span style={{fontSize:'32px'}}>🍎</span></div><span>{t.calories}</span></div><div className="nav-card card-pink" onClick={() => {}}><div className="icon-bg-wrap"><span style={{fontSize:'32px'}}>❤️</span></div><span>{t.anniversary}</span></div><div className="nav-card card-purple" onClick={() => setView('stats')}><div className="icon-bg-wrap"><span style={{fontSize:'32px'}}>📊</span></div><span>{t.stats}</span></div></div>
                <section className="footprint-section"><div className="section-title">✨ {t.todaySteps}</div><div className="footprint-card">{todayRecords.length === 0 ? <div className="empty-state"><p>{t.noRecords}</p></div> : <ul style={{listStyle:'none', padding:0, margin:0}}>{todayRecords.map(r => (<li key={r.id} className="record-item"><div style={{display:'flex', alignItems:'center'}}><div className="item-icon-small"><span>{r.activityType === 'wakeup' ? '🌅' : r.type === 'sport' ? '💪' : '📝'}</span></div><div style={{marginLeft:'12px'}}><p className="item-name" style={{margin:0}}>{r.name}</p><p style={{fontSize:'11px', color:'var(--text-soft)', margin:'2px 0 0'}}>{r.activityType === 'wakeup' && `🕒 ${r.time}`}{r.activityType === 'cardio' && `⏱️ ${r.duration}min · 📍 ${r.distance}${r.unit}`}{r.activityType === 'strength' && `🔥 ${r.sets}${t.groups} · 🔢 ${r.count}${t.times}`}{(r.activityType === 'habit' || r.activityType === 'general') && `⏱️ ${r.duration}min`}{` · ${r.category}`}</p></div></div><div style={{opacity:0.3}}>🌱</div></li>))}</ul>}</div></section>
            </div>
        );
    };

    return (
        <div className={`app-container ${isRefreshing ? 'refresh-anim' : ''}`}>
            {showSuccess && (
                <div className="success-overlay" style={{position:'fixed', inset:0, background: 'var(--bg-color)', zIndex:2000, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
                    <span style={{fontSize:'80px', marginBottom:'20px'}}>✨</span>
                    <h1 style={{color:'var(--accent)'}}>{t.successMsg}</h1>
                    <p style={{color:'var(--text-soft)', fontWeight:'700'}}>{t.successSub}</p>
                </div>
            )}
            
            {/* Mode notification */}
            <div className={`mode-popup ${modeNotification.visible ? 'active' : ''}`}>
                <div className="mode-icon-wrap">
                    {modeNotification.type === 'sun' ? '☀️' : '🌙'}
                </div>
            </div>

            <main className="content-area">
                {view === 'home' && renderHome()}
                {view === 'checkin' && renderCheckinSelection()}
                {view === 'food' && (
                    <div className="view">
                        <div className="sub-header"><button onClick={() => setView('home')} className="back-btn-square">⬅️</button><h2>AI {t.calories}</h2></div>
                        <div className="detail-card" style={{textAlign:'center', background:'var(--card-bg)', padding:'40px', borderRadius:'32px', border:'1px solid var(--border-color)'}}>{isAnalyzing ? <div className="refresh-anim">Analyzing...</div> : calorieResult ? <div className="refresh-anim" style={{textAlign:'left', whiteSpace:'pre-wrap'}}>{calorieResult}</div> : (<label style={{cursor:'pointer'}}><input type="file" hidden onChange={handleImageUpload} /><div style={{fontSize:'64px', marginBottom:'20px'}}>📸</div><h3>{t.scanFood}</h3></label>)}</div>
                    </div>
                )}
                {view === 'stats' && renderStats()}
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
