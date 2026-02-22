
import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import * as XLSX from 'xlsx';

// --- Types ---
type ActivityType = 'cardio' | 'strength' | 'flexibility' | 'habit' | 'mind' | 'daily' | 'wakeup' | 'general' | 'rope';
type DarkModeType = 'manual' | 'system';
type AnimIntensity = 'strong' | 'medium' | 'weak' | 'off';

interface CalendarReminder {
    id: string;
    name: string;
    time: string; // HH:mm
    enabled: boolean;
}

interface ReminderSettings {
    calendarReminders: CalendarReminder[];
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

// 账单记录类型
interface BillRecord {
    id: string;
    date: string;
    merchant: string;
    category: string;
    amount: number;
    type: 'expense' | 'income';
    source: 'wechat' | 'alipay';
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
            title: '日历打卡提醒',
            exportTitle: '导出到系统日历',
            exportDesc: '生成 .ics 文件，导入手机日历获得后台提醒',
            exportBtn: '生成日历文件',
            exportSuccess: '日历文件已生成，请选择"打开"导入',
            noReminders: '请至少添加一个打卡时间',
            iosTip: 'iOS 用户：下载后在分享菜单中选择"添加日历"',
            androidTip: 'Android 用户：下载后用日历应用打开即可导入',
            addReminder: '添加打卡时间',
            reminderPrefix: '打卡提醒',
            reminderDesc: '别忘了完成今天的打卡任务哦',
            editReminder: '编辑打卡时间',
            deleteReminder: '删除',
            reminderName: '打卡名称',
            reminderTime: '提醒时间'
        },
        bill: {
            title: '账单导入',
            importTitle: '导入消费记录',
            importDesc: '从微信/支付宝导出账单，导入分析（支持CSV/Excel）',
            howToExport: '如何导出账单',
            wechatGuide: '微信账单导出指南',
            alipayGuide: '支付宝账单导出指南',
            step1: '1. 打开微信 → 我 → 服务 → 钱包 → 账单',
            step2: '2. 点击右上角"常见问题" → 下载账单',
            step3: '3. 选择"用于个人对账"，导出CSV或Excel格式',
            step4: '4. 将文件发送到手机，在下方选择导入',
            selectFile: '选择账单文件 (CSV/Excel)',
            parseSuccess: '成功导入 {count} 条记录',
            parseError: '文件解析失败，请检查格式',
            totalAmount: '总消费',
            recordCount: '记录数',
            avgAmount: '平均消费',
            categoryStats: '消费分类',
            monthlyTrend: '月度趋势',
            topMerchants: '消费最多商家',
            date: '日期',
            merchant: '商家',
            category: '类别',
            amount: '金额',
            noData: '暂无数据，请先导入账单'
        },
        categories: {
            cardio: '有氧训练', strength: '塑形力量', flexibility: '柔韧伸展',
            habits: '自律习惯', mind: '精神寄托', daily: '日常事务', custom: '自定义'
        },
        chef: {
            title: '佳倩小厨',
            whatToEat: '今天吃什么',
            menu: '点菜菜单',
            custom: '帮我选',
            randomDecide: '随机决定',
            style: '风格偏好',
            chinese: '中餐',
            western: '西餐',
            noodle: '面食',
            rice: '米饭',
            cuisine: '菜系',
            place: '用餐地点',
            cafeteria: '食堂',
            delivery: '外卖',
            dineOut: '出去吃',
            result: '今日推荐',
            tryAgain: '再试一次',
            startRandom: '开始随机',
            selectPreferences: '先选择你的偏好',
            menuComingSoon: '点菜功能即将上线，敬请期待！',
            customTitle: '输入你的选项',
            customDesc: '不知道选哪个？让我来帮你决定！',
            option: '选项',
            addOption: '添加选项',
            helpMeChoose: '帮我选',
            deciding: '决定中...',
            needTwoOptions: '请至少输入两个选项'
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
            title: 'Calendar Reminders',
            exportTitle: 'Export to Calendar',
            exportDesc: 'Generate .ics file for system calendar reminders',
            exportBtn: 'Generate Calendar File',
            exportSuccess: 'Calendar file generated, open to import',
            noReminders: 'Please add at least one reminder',
            iosTip: 'iOS: Select "Add to Calendar" in share menu',
            androidTip: 'Android: Open with your calendar app',
            addReminder: 'Add Reminder',
            reminderPrefix: 'Check-in',
            reminderDesc: 'Don\'t forget to complete your check-in task',
            editReminder: 'Edit Reminder',
            deleteReminder: 'Delete',
            reminderName: 'Reminder Name',
            reminderTime: 'Reminder Time'
        },
        bill: {
            title: 'Bill Import',
            importTitle: 'Import Expenses',
            importDesc: 'Export bills from WeChat/Alipay and analyze (CSV/Excel)',
            howToExport: 'How to Export',
            wechatGuide: 'WeChat Bill Guide',
            alipayGuide: 'Alipay Bill Guide',
            step1: '1. Open WeChat → Me → Services → Wallet → Bills',
            step2: '2. Tap FAQ → Download Bills',
            step3: '3. Select "Personal Record", export CSV/Excel',
            step4: '4. Send file to phone, import below',
            selectFile: 'Select Bill File (CSV/Excel)',
            parseSuccess: 'Imported {count} records',
            parseError: 'Parse failed, check file format',
            totalAmount: 'Total Spent',
            recordCount: 'Records',
            avgAmount: 'Average',
            categoryStats: 'Categories',
            monthlyTrend: 'Monthly Trend',
            topMerchants: 'Top Merchants',
            date: 'Date',
            merchant: 'Merchant',
            category: 'Category',
            amount: 'Amount',
            noData: 'No data, please import bills first'
        },
        categories: {
            cardio: 'Cardio', strength: 'Strength', flexibility: 'Flexibility',
            habits: 'Habits', mind: 'Mind', daily: 'Daily', custom: 'Custom'
        },
        chef: {
            title: 'Chef Jiaqian',
            whatToEat: 'What to Eat',
            menu: 'Menu',
            custom: 'Help Me Choose',
            randomDecide: 'Random Pick',
            style: 'Style',
            chinese: 'Chinese',
            western: 'Western',
            noodle: 'Noodle',
            rice: 'Rice',
            cuisine: 'Cuisine',
            place: 'Location',
            cafeteria: 'Cafeteria',
            delivery: 'Delivery',
            dineOut: 'Dine Out',
            result: 'Today\'s Pick',
            tryAgain: 'Try Again',
            startRandom: 'Start',
            selectPreferences: 'Select your preferences',
            menuComingSoon: 'Menu feature coming soon!',
            customTitle: 'Enter Your Options',
            customDesc: 'Can\'t decide? Let me help you!',
            option: 'Option',
            addOption: 'Add Option',
            helpMeChoose: 'Help Me Choose',
            deciding: 'Deciding...',
            needTwoOptions: 'Please enter at least two options'
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

// 生成 ICS 日历文件并下载 - 使用用户自定义的打卡时间
interface CalendarReminder {
    id: string;
    name: string;
    time: string; // HH:mm
    enabled: boolean;
}

// 每日情话库
const LOVE_QUOTES = {
    zh: [
        { text: "万物皆有裂痕，那是光照进来的地方，而你就是我的光。", author: "伦纳德·科恩" },
        { text: "我想和你一起生活，在某个小镇，共享无尽的黄昏和绵绵不绝的钟声。", author: "茨维塔耶娃" },
        { text: "遇见你之前，我没想过结婚；遇见你之后，结婚我没想过别人。", author: "钱钟书" },
        { text: "你是我温暖的手套，冰冷的啤酒，带着阳光味道的衬衫，日复一日的梦想。", author: "《恋爱的犀牛》" },
        { text: "从前车马很慢，书信很远，一生只够爱一个人。", author: "木心" },
        { text: "我想在你的睫毛上荡秋千，在你的眼睛里数星星。", author: "" },
        { text: "世界很大，可是我的心很小，只够装下你。", author: "" },
        { text: "你是我这一生等了半世未拆的礼物。", author: "林夕" },
        { text: "春水初生，春林初盛，春风十里，不如你。", author: "冯唐" },
        { text: "醒来觉得甚是爱你。", author: "朱生豪" },
        { text: "我想和你互相浪费，一起虚度短的沉默，长的无意义。", author: "李元胜" },
        { text: "如果全世界都对你恶语相加，我就对你说上一世情话。", author: "马頔" },
        { text: "愿有岁月可回首，且以深情共白头。", author: "" },
        { text: "你走，我不送你；你来，无论多大风雨，我都去接你。", author: "梁实秋" },
        { text: "海底月是天上月，眼前人是心上人。", author: "张爱玲" },
        { text: "世间所有的相遇，都是久别重逢。", author: "《一代宗师》" },
        { text: "我喜欢你不是一见钟情的见色起意，而是朝夕相处的日久生情。", author: "" },
        { text: "你微微地笑着，不同我说什么话，而我觉得，为了这个，我已等待得很久了。", author: "泰戈尔" },
        { text: "草在结它的种子，风在摇它的叶子，我们站着，不说话，就十分美好。", author: "顾城" },
        { text: "今夜我不关心人类，我只想你。", author: "海子" }
    ],
    en: [
        { text: "I love you not because of who you are, but because of who I am when I am with you.", author: "Roy Croft" },
        { text: "The best thing to hold onto in life is each other.", author: "Audrey Hepburn" },
        { text: "I would rather spend one lifetime with you, than face all the ages of this world alone.", author: "J.R.R. Tolkien" },
        { text: "You are my sun, my moon, and all my stars.", author: "E.E. Cummings" },
        { text: "In all the world, there is no heart for me like yours.", author: "Maya Angelou" },
        { text: "To the world you may be one person, but to one person you are the world.", author: "Dr. Seuss" },
        { text: "I saw that you were perfect, and so I loved you. Then I saw that you were not perfect and I loved you even more.", author: "Angelita Lim" },
        { text: "I need you like a heart needs a beat.", author: "" },
        { text: "You are the last thought in my mind before I drift off to sleep and the first thought when I wake up each morning.", author: "" },
        { text: "If I know what love is, it is because of you.", author: "Hermann Hesse" }
    ]
};

// 节日祝福
const FESTIVAL_WISHES = {
    valentine: {
        zh: { text: "情人节快乐！万物皆有回响，而我所有的温柔都想留给你。", title: "❤️ 情人节快乐" },
        en: { text: "Happy Valentine's Day! In a world full of echoes, my heart only beats for you.", title: "❤️ Happy Valentine's" }
    },
    newyear: {
        zh: { text: "新年快乐！愿新的一年，星辰大海，皆是奔赴。愿你万事顺遂，岁岁平安。", title: "🎆 新年快乐" },
        en: { text: "Happy New Year! May the new year bring you closer to the stars.", title: "🎆 Happy New Year" }
    },
    birthday: {
        zh: { text: "生日快乐！愿你的每一天都如今天般灿烂，愿所有的美好都如期而至。", title: "🎂 生日快乐" },
        en: { text: "Happy Birthday! May your day be filled with love, laughter, and cake!", title: "🎂 Happy Birthday" }
    },
    anniversary: {
        zh: { text: "纪念日快乐！时光往复，爱你如初。愿我们携手走过更多个春夏秋冬。", title: "💕 纪念日快乐" },
        en: { text: "Happy Anniversary! Time goes by, but my love for you remains the same.", title: "💕 Happy Anniversary" }
    }
};

const generateICSFile = (reminders: CalendarReminder[], t: any) => {
    const now = new Date();
    const formatDate = (d: Date) => {
        return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    let events = '';
    const uidBase = 'jiaqian-' + Date.now();
    
    const activeReminders = reminders.filter(r => r.enabled && r.time);
    
    if (activeReminders.length === 0) {
        alert(t.calendar?.noReminders || '请至少添加一个打卡时间');
        return false;
    }
    
    activeReminders.forEach((reminder, idx) => {
        const [hour, min] = reminder.time.split(':').map(Number);
        const dtstart = new Date(now);
        dtstart.setHours(hour, min, 0, 0);
        
        // 如果设置时间已过，从明天开始
        if (dtstart < now) {
            dtstart.setDate(dtstart.getDate() + 1);
        }
        
        events += `BEGIN:VEVENT
UID:${uidBase}-${idx}@jiaqian.app
DTSTART;TZID=Asia/Shanghai:${formatDate(dtstart).replace('Z', '')}
RRULE:FREQ=DAILY
SUMMARY:${t.calendar?.reminderPrefix || '打卡'}: ${reminder.name}
DESCRIPTION:${t.calendar?.reminderDesc || '别忘了完成今天的打卡任务哦'}
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:${reminder.name}
TRIGGER:-PT0M
END:VALARM
END:VEVENT
`;
    });
    
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
    link.download = `佳倩管家打卡提醒_${now.toLocaleDateString('zh-CN')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
};



// 精致图标组件
const HomeIcon = ({ active }: { active: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: active ? 1 : 0.5 }}>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
);
const CheckIcon = ({ active }: { active: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: active ? 1 : 0.5 }}>
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/>
    </svg>
);
const StatsIcon = ({ active }: { active: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: active ? 1 : 0.5 }}>
        <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
    </svg>
);

// 精致返回箭头
const BackArrow = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
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
    const [view, setView] = useState<'home' | 'checkin' | 'stats' | 'settings' | 'anniversary' | 'chef' | 'bill'>('home');
    const [showDailyQuote, setShowDailyQuote] = useState(false);
    const [dailyQuote, setDailyQuote] = useState<{text: string, author?: string, isSpecial?: boolean, type?: 'festival' | 'anniversary'} | null>(null);
    const [checkinSubTab, setCheckinSubTab] = useState<'sport' | 'event'>('sport');
    const [records, setRecords] = useState<CheckInRecord[]>([]);
    const [anniversaries, setAnniversaries] = useState<Anniversary[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [activeFestival, setActiveFestival] = useState<'valentine' | 'newyear' | null>(null);
    const [showShareCard, setShowShareCard] = useState(false);
    
    const [settings, setSettings] = useState<AppSettings>({
        language: 'zh',
        darkModeType: 'system',
        manualDarkMode: false,
        pushNotifications: true,
        inAppPopups: true,
        vibration: true,
        reminders: {
            calendarReminders: [
                { id: '1', name: '早起打卡', time: '07:00', enabled: true },
                { id: '2', name: '喝水提醒', time: '10:00', enabled: false },
                { id: '3', name: '午休提醒', time: '12:30', enabled: false },
            ],
            auxiliaryEnabled: true,
            reportNotify: true,
            shareNotify: true,
            messageCenterNotify: false,
            animIntensity: 'medium'
        }
    });
    
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [editName, setEditName] = useState('');
    // pending duplicate add flow
    const [pendingRecord, setPendingRecord] = useState<Omit<CheckInRecord, 'id' | 'timestamp'> | null>(null);
    const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);

    const t = TRANSLATIONS[settings.language];
    const firstUpdate = useRef(true);

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
        
        // 检查是否需要显示每日情话（一天只显示一次）
        const lastQuoteDate = localStorage.getItem('jq_lastQuoteDate');
        const today = now.toDateString();
        
        if (lastQuoteDate !== today) {
            // 检查是否是特殊日子
            const specialQuote = checkSpecialDay();
            if (specialQuote) {
                setDailyQuote(specialQuote);
            } else {
                // 随机选择一句情话
                const quotes = LOVE_QUOTES[settings.language];
                const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
                setDailyQuote({ text: randomQuote.text, author: randomQuote.author });
            }
            setShowDailyQuote(true);
            localStorage.setItem('jq_lastQuoteDate', today);
        }
    }, []);
    
    // 检查是否是特殊日子（节日或纪念日）
    const checkSpecialDay = () => {
        const now = new Date();
        const m = now.getMonth() + 1;
        const d = now.getDate();
        
        // 检查节日
        if (m === 2 && d === 14) {
            return { 
                ...FESTIVAL_WISHES.valentine[settings.language], 
                isSpecial: true, 
                type: 'festival' as const 
            };
        }
        if (m === 1 && d === 1) {
            return { 
                ...FESTIVAL_WISHES.newyear[settings.language], 
                isSpecial: true, 
                type: 'festival' as const 
            };
        }
        
        // 检查是否是纪念日（今天）
        const today = now.toISOString().split('T')[0];
        const todayAnniversary = anniversaries.find(a => {
            const annivDate = new Date(a.date);
            return annivDate.getMonth() === now.getMonth() && annivDate.getDate() === now.getDate();
        });
        
        if (todayAnniversary) {
            const isBirthday = todayAnniversary.category === 'birthday';
            const wish = isBirthday ? FESTIVAL_WISHES.birthday[settings.language] : FESTIVAL_WISHES.anniversary[settings.language];
            return { 
                text: `${todayAnniversary.name}：${wish.text}`, 
                title: wish.title,
                isSpecial: true, 
                type: 'anniversary' as const 
            };
        }
        
        return null;
    };



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
                return;
            }

            const newRecord: CheckInRecord = { ...record, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() };
            setRecords([newRecord, ...records]);
            setTodayNote(record.note || '');
            setShowSuccess(true);
            setTimeout(() => { 
                setShowSuccess(false); 
                setShowShareCard(true);
                setSelectedItem(null); 
            }, 1500);
            if (settings.vibration) safeVibrate([50]);
        } catch (e) {
            const newRecord: CheckInRecord = { ...record, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() };
            setRecords([newRecord, ...records]);
            setTodayNote(record.note || '');
            setShowSuccess(true);
            setTimeout(() => { 
                setShowSuccess(false); 
                setShowShareCard(true);
                setSelectedItem(null); 
            }, 1500);
            if (settings.vibration) safeVibrate([50]);
        }
    };

    // 生成今日分享卡片数据
    const generateShareCardData = () => {
        const today = new Date().setHours(0,0,0,0);
        const todayRecords = records.filter(r => new Date(r.timestamp).setHours(0,0,0,0) === today);
        const todayMoods = todayRecords.map(r => r.note).filter(Boolean);
        
        return {
            date: new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }),
            count: todayRecords.length,
            records: todayRecords.slice(0, 4),
            moods: todayMoods,
            streak: statsData?.streak || 0
        };
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

                <div className="home-action-grid" style={{gridTemplateColumns: 'repeat(3, 1fr)'}}>
                    <div className="action-card h-card-1" onClick={() => setView('checkin')}>
                        <div className="action-icon">👟</div>
                        <div className="action-label">{t.checkin}</div>
                    </div>
                    <div className="action-card h-card-3" onClick={() => setView('anniversary')}>
                        <div className="action-icon">❤️</div>
                        <div className="action-label">{t.anniversary}</div>
                    </div>
                    <div className="action-card h-card-4" onClick={() => setView('stats')}>
                        <div className="action-icon">📊</div>
                        <div className="action-label">{t.stats}</div>
                    </div>
                    <div className="action-card h-card-chef" onClick={() => setView('chef')}>
                        <div className="action-icon">🍳</div>
                        <div className="action-label">{t.chef?.title || '佳倩小厨'}</div>
                    </div>
                    <div className="action-card h-card-bill" onClick={() => setView('bill')}>
                        <div className="action-icon">💰</div>
                        <div className="action-label">{t.bill?.title || '账单导入'}</div>
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
            {/* 每日情话弹窗 - 在启动页之前显示 */}
            {showDailyQuote && dailyQuote && (
                <DailyQuoteModal 
                    quote={dailyQuote} 
                    onClose={() => setShowDailyQuote(false)}
                    language={settings.language}
                />
            )}
            
            {isAppLoading && !showDailyQuote && <SplashScreen t={t} onFadeStart={() => setAppReady(true)} onFinish={() => setIsAppLoading(false)} />}
            {activeFestival && <FestivalPopup type={activeFestival} t={t} onClose={() => setActiveFestival(null)} />}
            <div className={`app-container ${appReady ? 'fade-in-ready' : ''}`}>
                
                {showSuccess && (
                    <div className="success-overlay"><span style={{fontSize:'80px', marginBottom:'20px'}}>✨</span><h1 style={{color:'var(--accent)'}}>{t.successMsg}</h1><p style={{color:'var(--text-soft)', fontWeight:'700'}}>{t.successSub}</p></div>
                )}

                {/* 分享卡片弹窗 */}
                {showShareCard && (
                    <ShareCard 
                        data={generateShareCardData()} 
                        onClose={() => setShowShareCard(false)}
                        t={t}
                    />
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
                    {view === 'bill' && <BillView t={t} setView={setView} />}
                    {view === 'chef' && <ChefView t={t} setView={setView} />}
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
    const [showAddReminder, setShowAddReminder] = useState(false);
    const [editingReminder, setEditingReminder] = useState<CalendarReminder | null>(null);
    const [newReminderName, setNewReminderName] = useState('');
    const [newReminderTime, setNewReminderTime] = useState('08:00');

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

    // 添加/编辑打卡提醒
    const handleSaveReminder = () => {
        if (!newReminderName.trim() || !newReminderTime) return;
        
        const reminders = [...settings.reminders.calendarReminders];
        
        if (editingReminder) {
            // 编辑现有提醒
            const idx = reminders.findIndex(r => r.id === editingReminder.id);
            if (idx >= 0) {
                reminders[idx] = { ...editingReminder, name: newReminderName.trim(), time: newReminderTime };
            }
        } else {
            // 添加新提醒
            reminders.push({
                id: Date.now().toString(),
                name: newReminderName.trim(),
                time: newReminderTime,
                enabled: true
            });
        }
        
        updateReminders({ calendarReminders: reminders });
        setShowAddReminder(false);
        setEditingReminder(null);
        setNewReminderName('');
        setNewReminderTime('08:00');
    };

    // 删除打卡提醒
    const handleDeleteReminder = (id: string) => {
        const reminders = settings.reminders.calendarReminders.filter(r => r.id !== id);
        updateReminders({ calendarReminders: reminders });
    };

    // 切换提醒启用状态
    const toggleReminder = (id: string) => {
        const reminders = settings.reminders.calendarReminders.map(r => 
            r.id === id ? { ...r, enabled: !r.enabled } : r
        );
        updateReminders({ calendarReminders: reminders });
    };

    // 开始编辑
    const startEdit = (reminder: CalendarReminder) => {
        setEditingReminder(reminder);
        setNewReminderName(reminder.name);
        setNewReminderTime(reminder.time);
        setShowAddReminder(true);
    };

    // 取消编辑
    const cancelEdit = () => {
        setShowAddReminder(false);
        setEditingReminder(null);
        setNewReminderName('');
        setNewReminderTime('08:00');
    };

    const activeReminders = settings.reminders.calendarReminders.filter(r => r.enabled);

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

                {/* 日历打卡提醒 */}
                <div className="settings-card-new">
                    <div className="section-label" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <span>{t.calendar.title}</span>
                        <button 
                            onClick={() => setShowAddReminder(true)}
                            style={{fontSize: '13px', fontWeight: '700', color: 'var(--accent)', background: 'none', border: 'none', padding: '4px 8px'}}
                        >
                            + {t.calendar.addReminder}
                        </button>
                    </div>
                    
                    {settings.reminders.calendarReminders.length === 0 ? (
                        <div style={{padding: '24px', textAlign: 'center', color: 'var(--text-soft)'}}>
                            <div style={{fontSize: '32px', marginBottom: '8px'}}>📅</div>
                            <p>{t.calendar.noReminders}</p>
                        </div>
                    ) : (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                            {settings.reminders.calendarReminders.map(reminder => (
                                <div key={reminder.id} className="setting-row" style={{padding: '12px 0'}}>
                                    <div className="setting-left" style={{gap: '12px'}}>
                                        <label className="switch" style={{transform: 'scale(0.85)'}}>
                                            <input 
                                                type="checkbox" 
                                                checked={reminder.enabled} 
                                                onChange={() => toggleReminder(reminder.id)}
                                            />
                                            <span className="slider-round"></span>
                                        </label>
                                        <div>
                                            <div className="setting-title" style={{fontSize: '15px'}}>{reminder.name}</div>
                                            <div className="setting-desc">{reminder.time}</div>
                                        </div>
                                    </div>
                                    <div className="setting-right" style={{gap: '8px'}}>
                                        <button 
                                            onClick={() => startEdit(reminder)}
                                            style={{background: 'none', border: 'none', fontSize: '16px', padding: '4px'}}
                                        >✏️</button>
                                        <button 
                                            onClick={() => handleDeleteReminder(reminder.id)}
                                            style={{background: 'none', border: 'none', fontSize: '16px', padding: '4px', color: '#FF6B6B'}}
                                        >🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* 导出按钮 */}
                    {activeReminders.length > 0 && (
                        <>
                            <div className="divider" />
                            <div className="setting-row" style={{paddingTop: '16px', alignItems: 'flex-start'}}>
                                <div className="setting-left" style={{flex: 1}}>
                                    <div className="icon-circle" style={{background: '#4CAF50'}}>📲</div>
                                    <div style={{flex: 1}}>
                                        <div className="setting-title">{t.calendar.exportTitle}</div>
                                        <div className="setting-desc">{t.calendar.exportDesc}</div>
                                    </div>
                                </div>
                                <div className="setting-right">
                                    <button 
                                        className="setting-action-btn" 
                                        onClick={() => {
                                            generateICSFile(settings.reminders.calendarReminders, t);
                                            safeVibrate([50, 30, 50]);
                                        }}
                                        style={{background: '#4CAF50', color: 'white'}}
                                    >
                                        {t.calendar.exportBtn}
                                    </button>
                                </div>
                            </div>
                            <div style={{marginTop: '12px', padding: '12px', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '12px', fontSize: '12px', color: 'var(--text-soft)', lineHeight: '1.6'}}>
                                💡 {t.calendar.iosTip}<br/>
                                💡 {t.calendar.androidTip}
                            </div>
                        </>
                    )}
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

            {/* 添加/编辑打卡提醒弹窗 */}
            {showAddReminder && (
                <div className="drawer-overlay" onClick={cancelEdit} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', alignItems: 'flex-end' }}>
                    <div className="drawer-content" onClick={e => e.stopPropagation()} style={{ width: '100%', background: 'white', borderTopLeftRadius: '40px', borderTopRightRadius: '40px', padding: '32px 24px' }}>
                        <h3 style={{ margin: '0 0 24px', fontSize: '18px', fontWeight: '850' }}>
                            {editingReminder ? t.calendar.editReminder : t.calendar.addReminder}
                        </h3>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>{t.calendar.reminderName}</label>
                            <input 
                                type="text" 
                                value={newReminderName}
                                onChange={e => setNewReminderName(e.target.value)}
                                placeholder={t.calendar.reminderName}
                                className="time-input-simple"
                                style={{ width: '100%' }}
                                autoFocus
                            />
                        </div>
                        
                        <div style={{ marginBottom: '28px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>{t.calendar.reminderTime}</label>
                            <input 
                                type="time" 
                                value={newReminderTime}
                                onChange={e => setNewReminderTime(e.target.value)}
                                className="time-input-simple"
                                style={{ width: '100%', fontSize: '18px' }}
                            />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                                onClick={handleSaveReminder}
                                disabled={!newReminderName.trim()}
                                className="btn-confirm highlight"
                                style={{ flex: 1, opacity: newReminderName.trim() ? 1 : 0.5 }}
                            >
                                {t.complete} ✨
                            </button>
                            <button 
                                onClick={cancelEdit}
                                className="btn-confirm"
                                style={{ flex: 1, background: '#F4F4F7', color: 'var(--text-main)' }}
                            >
                                {t.nextTime}
                            </button>
                        </div>
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
            <div className="sub-header"><button onClick={() => setView('home')} className="back-btn"><BackArrow /></button><h2>{t.checkin}</h2></div>
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
    if (!statsData) return <div className="view"><div className="sub-header"><button onClick={() => setView('home')} className="back-btn"><BackArrow /></button><h2>{t.stats}</h2></div><div className="empty-state" style={{marginTop:'100px'}}><p>{t.noRecords}</p></div></div>;
    return (
        <div className="view">
            <div className="sub-header"><button onClick={() => setView('home')} className="back-btn"><BackArrow /></button><h2>{t.stats}</h2></div>
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

// 分享卡片组件
function ShareCard({ data, onClose, t }: { data: any, onClose: () => void, t: any }) {
    const cardRef = useRef<HTMLDivElement>(null);
    
    const handleDownload = () => {
        // 模拟下载功能
        alert('长按图片保存到相册，然后发给TA吧！❤️');
    };
    
    return (
        <div className="modal-overlay" onClick={onClose} style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
            <div 
                ref={cardRef}
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'linear-gradient(135deg, #FF9671 0%, #FF6B9D 50%, #C44569 100%)',
                    borderRadius: '24px',
                    padding: '32px 28px',
                    width: '90%',
                    maxWidth: '360px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* 装饰背景 */}
                <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 100, opacity: 0.1 }}>❤️</div>
                <div style={{ position: 'absolute', bottom: -30, left: -30, fontSize: 120, opacity: 0.08 }}>✨</div>
                
                {/* 日期 */}
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.9)', fontSize: '13px', marginBottom: '8px' }}>
                    {data.date}
                </div>
                
                {/* 标题 */}
                <h2 style={{ 
                    textAlign: 'center', 
                    color: 'white', 
                    margin: '0 0 20px',
                    fontSize: '22px',
                    fontWeight: '800',
                    textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                }}>
                    今日打卡完成 ✨
                </h2>
                
                {/* 连续打卡 */}
                <div style={{ 
                    textAlign: 'center', 
                    background: 'rgba(255,255,255,0.2)', 
                    borderRadius: '16px',
                    padding: '12px 20px',
                    marginBottom: '20px',
                    backdropFilter: 'blur(10px)'
                }}>
                    <span style={{ color: 'white', fontSize: '14px' }}>已连续打卡 </span>
                    <span style={{ color: 'white', fontSize: '32px', fontWeight: '900' }}>{data.streak}</span>
                    <span style={{ color: 'white', fontSize: '14px' }}> 天</span>
                </div>
                
                {/* 打卡项目 */}
                <div style={{ marginBottom: '20px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginBottom: '12px' }}>今日完成 {data.count} 项：</p>
                    {data.records.map((record: any, idx: number) => (
                        <div key={idx} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px',
                            background: 'rgba(255,255,255,0.15)',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            marginBottom: '8px'
                        }}>
                            <span style={{ fontSize: '20px' }}>
                                {record.activityType === 'wakeup' ? '🌅' : record.type === 'sport' ? '💪' : '📝'}
                            </span>
                            <span style={{ color: 'white', fontSize: '15px', fontWeight: '600', flex: 1 }}>
                                {record.name}
                            </span>
                        </div>
                    ))}
                </div>
                
                {/* 心情语录 */}
                {data.moods.length > 0 && (
                    <div style={{ 
                        background: 'rgba(255,255,255,0.25)', 
                        borderRadius: '16px',
                        padding: '16px',
                        marginBottom: '20px',
                        border: '1px solid rgba(255,255,255,0.3)'
                    }}>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', margin: '0 0 6px' }}>💭 今日心情</p>
                        <p style={{ color: 'white', fontSize: '15px', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
                            "{data.moods[0]}"
                        </p>
                    </div>
                )}
                
                {/* 底部 */}
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                    来自 佳倩管家 💕
                </div>
                
                {/* 操作按钮 */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button 
                        onClick={handleDownload}
                        style={{
                            flex: 1,
                            padding: '14px',
                            background: 'white',
                            border: 'none',
                            borderRadius: '14px',
                            color: '#FF6B9D',
                            fontWeight: '800',
                            fontSize: '15px',
                            cursor: 'pointer'
                        }}
                    >
                        📸 保存分享
                    </button>
                    <button 
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '14px',
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            borderRadius: '14px',
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '15px',
                            cursor: 'pointer'
                        }}
                    >
                        关闭
                    </button>
                </div>
            </div>
        </div>
    );
}

// 佳倩小厨组件
function ChefView({ t, setView }: any) {
    const [activeTab, setActiveTab] = useState<'random' | 'custom' | 'menu'>('random');
    const [preferences, setPreferences] = useState({
        style: '', // 'chinese' | 'western'
        type: '',  // 'noodle' | 'rice'
        cuisine: '', // 'sichuan' | 'cantonese' | 'japanese' | 'italian' | etc
        place: ''  // 'cafeteria' | 'delivery' | 'dineOut'
    });
    const [result, setResult] = useState<string | null>(null);
    const [isRandomizing, setIsRandomizing] = useState(false);
    
    // 自定义随机功能
    const [customOptions, setCustomOptions] = useState<string[]>(['', '']);
    const [customResult, setCustomResult] = useState<string | null>(null);

    // 扩充食物数据库 - 300+ 种具体菜肴
    const foodDatabase: Record<string, string[]> = {
        // 川菜
        sichuan: ['鱼香肉丝', '宫保鸡丁', '麻婆豆腐', '水煮鱼', '回锅肉', '水煮肉片', '辣子鸡', '毛血旺', '夫妻肺片', '口水鸡', '糖醋排骨', '鱼香茄子', '干煸豆角', '酸菜鱼', '麻辣香锅', '串串香', '冒菜', '钵钵鸡', '凉面', '冰粉', '担担面', '龙抄手', '钟水饺', '韩包子', '三大炮', '蛋烘糕', '糖油果子', '肥肠粉', '酸辣粉', '川北凉粉'],
        // 湘菜
        hunan: ['剁椒鱼头', '辣椒炒肉', '口味虾', '臭豆腐', '糖油粑粑', '湘西外婆菜', '干锅牛蛙', '酸辣粉', '米粉', '红烧肉', '腊味合蒸', '永州血鸭', '东安子鸡', '油爆虾', '姊妹团子', '姊妹团子', '龙脂猪血', '荷兰粉', '刮凉粉', '白粒丸', '葱油粑粑'],
        // 粤菜
        cantonese: ['白切鸡', '烧鹅', '叉烧', '虾饺', '肠粉', '云吞面', '及第粥', '煲仔饭', '豉汁蒸排骨', '凤爪', '蛋挞', '菠萝包', '奶茶', '双皮奶', '姜撞奶', '杨枝甘露', '干炒牛河', '广式月饼', '老火靓汤', '烧卖', '叉烧包', '奶黄包', '流沙包', '莲蓉包', '马拉糕', '萝卜糕', '马蹄糕', '伦教糕'],
        // 鲁菜
        shandong: ['糖醋鲤鱼', '九转大肠', '葱烧海参', '德州扒鸡', '四喜丸子', '油爆双脆', '奶汤蒲菜', '扒原壳鲍鱼', '糟熘鱼片', '一品豆腐', '锅塌豆腐', '胶东大饽饽', '周村烧饼', '潍坊朝天锅', '青岛大包', '济南油旋', '临沂煎饼', '德州扒鸡', '把子肉', '甜沫'],
        // 苏菜
        jiangsu: ['盐水鸭', '松鼠鳜鱼', '狮子头', '东坡肉', '叫花鸡', '糖醋小排', '蟹粉豆腐', '阳春面', '鸭血粉丝汤', '小笼包', '汤包', '三丁包子', '千层油糕', '翡翠烧卖', '糯米烧卖', '蟹黄汤包', '千层油糕', '翡翠烧卖', '三丁包子', '奥灶面', '锅盖面'],
        // 浙菜
        zhejiang: ['西湖醋鱼', '龙井虾仁', '东坡肉', '宋嫂鱼羹', '叫花童鸡', '荷叶粉蒸肉', '片儿川', '葱包桧', '定胜糕', '猫耳朵', '虾爆鳝面', '宁波汤圆', '嘉兴粽子', '西湖莼菜汤', '赛蟹羹', '沙地马蹄鳖', '重症碎鳖'],
        // 闽菜
        fujian: ['佛跳墙', '荔枝肉', '醉排骨', '七星鱼丸', '扁肉', '沙茶面', '土笋冻', '海蛎煎', '线面', '光饼', '鼎边糊', '肉燕', '扳指干贝', '鸡茸金丝笋', '太极芋泥', '锅边糊', '沙县拌面', '沙县蒸饺', '福州鱼丸'],
        // 徽菜
        anhui: ['臭鳜鱼', '毛豆腐', '问政山笋', '徽州刀板香', '一品锅', '方腊鱼', '清炖马蹄鳖', '杨梅丸子', '凤炖牡丹', '双爆串飞', '红烧划水', '腌鲜鳜鱼', '虎皮毛豆腐', '徽州裹粽', '绩溪炒粉'],
        // 东北菜
        dongbei: ['锅包肉', '地三鲜', '小鸡炖蘑菇', '猪肉炖粉条', '东北乱炖', '酱骨架', '溜肉段', '东北大拉皮', '粘豆包', '酸菜白肉', '血肠', '东北水饺', '东北烧烤', '冷面', '烤冷面', '铁锅炖', '杀猪菜', '东北炖菜'],
        // 西北菜
        xibei: ['羊肉泡馍', '肉夹馍', '凉皮', '岐山臊子面', 'biangbiang面', '油泼面', '兰州拉面', '新疆大盘鸡', '新疆烤羊肉串', '手抓羊肉', '酿皮', '甜胚子', '牛奶鸡蛋醪糟', '杏皮水', '灰豆子'],
        // 云南菜
        yunnan: ['过桥米线', '小锅米线', '汽锅鸡', '云南野生菌火锅', '宣威火腿', '大理砂锅鱼', '丽江粑粑', '饵块', '饵丝', '乳扇', '鲜花饼', '路南乳饼', '曲靖蒸饵丝', '腾冲大救驾', '建水烧豆腐'],
        // 贵州菜
        guizhou: ['酸汤鱼', '丝娃娃', '肠旺面', '花溪牛肉粉', '遵义羊肉粉', '折耳根炒腊肉', '苗家酸汤鱼', '青岩猪脚', '玫瑰糖', '豆腐圆子', '恋爱豆腐果', '糕粑稀饭', '米豆腐', '荞酥'],
        // 湖北菜
        hubei: ['热干面', '三鲜豆皮', '武昌鱼', '排骨藕汤', '鸭脖', '面窝', '欢喜坨', '糯米鸡', '烧梅', '糊汤粉', '蛋酒', '米酒', '周黑鸭', '精武鸭脖'],
        // 江西菜
        jiangxi: ['瓦罐汤', '南昌拌粉', '三杯鸡', '莲花血鸭', '庐山石鸡', '井冈烟笋', '藜蒿炒腊肉', '白糖糕', '萝卜饼', '艾米果', '清明果', '九江茶饼', '南安板鸭'],
        // 日料
        japanese: ['寿司', '刺身', '拉面', '天妇罗', '寿喜烧', '鳗鱼饭', '牛肉饭', '咖喱饭', '乌冬面', '荞麦面', '章鱼烧', '大阪烧', '可乐饼', '炸猪排', '味噌汤', '茶泡饭', '亲子丼', '海鲜丼', '炸虾饭', '日式汉堡排', '关东煮', '日式烤肉', '寿司拼盘', '刺身拼盘', '日式咖喱'],
        // 韩餐
        korean: ['石锅拌饭', '韩式炸鸡', '泡菜汤', '大酱汤', '海带汤', '冷面', '炸酱面', '海鲜面', '烤肉', '烤五花肉', '炒年糕', '鱼饼', '紫菜包饭', '泡菜饼', '海鲜饼', '土豆排骨锅', '部队锅', '参鸡汤', '韩式猪蹄', '辣炒猪肉', '韩式豆腐汤', '泡菜炒饭', '韩式烧烤'],
        // 泰餐
        thai: ['冬阴功汤', '绿咖喱鸡', '黄咖喱蟹', '红咖喱鸭', '泰式炒河粉', '芒果糯米饭', '菠萝炒饭', '泰式奶茶', '青木瓜沙拉', '泰式烤鱼', '椰汁鸡汤', '马沙文咖喱', '泰式炒空心菜', '泰式奶茶', '泰式甜品'],
        // 越南菜
        vietnamese: ['越南河粉', '越南春卷', '法棍三明治', '牛肉粉', '鸡肉粉', '海鲜粉', '越南咖啡', '滴漏咖啡', '越南粽子', '炸春卷', '甘蔗虾', '香茅鸡', '越南甜品'],
        // 西餐
        western: ['牛排', '猪排', '鸡排', '汉堡', '披萨', '意大利面', '肉酱面', '奶油培根面', '海鲜面', '千层面', '通心粉', '焗饭', 'risotto', '沙拉', '三明治', '热狗', 'tacos', 'burrito', '烤鸡', '炸鱼薯条', '惠灵顿牛排', '红酒炖牛肉', '奶油蘑菇汤'],
        // 意餐
        italian: ['玛格丽特披萨', '夏威夷披萨', '海鲜披萨', '肉酱意面', '奶油培根意面', '千层面', ' risotto', '提拉米苏', '意式浓缩', '卡布奇诺', '意大利冰淇淋', '意式肉丸', '意式烤蔬菜', '意式海鲜饭'],
        // 法餐
        french: ['法式蜗牛', '鹅肝', '法式洋葱汤', '法式长棍', '可颂', '马卡龙', '舒芙蕾', '法式吐司', '红酒炖鸡', '法式羊排', '法式海鲜汤', '拿破仑蛋糕', '歌剧院蛋糕'],
        // 美式快餐
        american: ['芝士汉堡', '双层汉堡', '巨无霸', '麦香鸡', '麦乐鸡', '薯条', '洋葱圈', '奶昔', '可乐', '热狗', '炸鸡', '炸鸡桶', '披萨', '三明治', 'BBQ烤肋排', '美式松饼', '华夫饼'],
        // 面食
        noodle: ['兰州牛肉面', '山西刀削面', '河南烩面', '武汉热干面', '北京炸酱面', '四川担担面', '重庆小面', '陕西油泼面', '岐山臊子面', 'biangbiang面', '延吉冷面', '扬州炒面', '昆山奥灶面', '镇江锅盖面', '杭州片儿川', '葱油拌面', '阳春面', '云吞面', '竹升面', '伊府面'],
        // 米饭类
        rice: ['扬州炒饭', '蛋炒饭', '腊味煲仔饭', '卤肉饭', '黄焖鸡米饭', '照烧鸡腿饭', '叉烧饭', '烧鹅饭', '盐焗鸡饭', '豉油鸡饭', '海南鸡饭', '排骨饭', '牛腩饭', '猪肘饭', '烧鸭饭', '白切鸡饭', '咖喱饭', '石锅拌饭', '紫菜包饭', '饭团'],
        // 火锅/干锅
        hotpot: ['四川火锅', '重庆火锅', '老北京铜锅涮肉', '潮汕牛肉火锅', '菌菇火锅', '酸菜鱼火锅', '羊蝎子火锅', '韩式部队锅', '日式寿喜烧', '泰式冬阴功火锅', '麻辣香锅', '干锅牛蛙', '干锅花菜', '干锅土豆片', '干锅排骨'],
        // 烧烤/炸物
        bbq: ['烤羊肉串', '烤鸡翅', '烤鱼', '烤茄子', '烤韭菜', '烤金针菇', '烤生蚝', '烤扇贝', '烤冷面', '煎饼果子', '手抓饼', '鸡蛋灌饼', '炸鸡排', '炸鸡腿', '炸薯条', '炸串', '臭豆腐', '糖油粑粑', '油条', '麻球'],
        // 小吃/点心
        snack: ['肉夹馍', '凉皮', '凉面', '凉粉', '酸辣粉', '螺蛳粉', '桂林米粉', '过桥米线', '砂锅米线', '花甲粉', '新疆炒米粉', '鸭血粉丝汤', '馄饨', '饺子', '包子', '馒头', '花卷', '烧卖', '小笼包', '生煎包'],
        // 快餐/外卖
        fastfood: ['麦当劳', '肯德基', '汉堡王', '赛百味', '必胜客', '达美乐', '真功夫', '永和大王', '吉野家', '食其家', '老乡鸡', '大米先生', '乡村基', '华莱士', '塔斯汀', '正新鸡排', '绝味鸭脖', '周黑鸭', '煌上煌', '紫燕百味鸡'],
        // 轻食/健康
        healthy: ['鸡胸肉沙拉', '金枪鱼沙拉', '牛油果沙拉', '凯撒沙拉', '希腊沙拉', '藜麦饭', '全麦三明治', '蔬菜卷', '果昔碗', '酸奶杯', '能量碗', '波奇饭', '荞麦面沙拉', '烤蔬菜', '蒸蛋', '杂粮粥', '紫薯', '玉米', '南瓜', '鸡胸肉'],
        // 甜品/饮料
        dessert: ['奶茶', '水果茶', '奶盖茶', '咖啡', '美式', '拿铁', '卡布奇诺', '摩卡', '星冰乐', '蛋糕', '提拉米苏', '芝士蛋糕', '芒果班戟', '榴莲千层', '泡芙', '蛋挞', '曲奇', '马卡龙', '布丁', '冰淇淋']
    };

    const cuisineNames: Record<string, string> = {
        sichuan: '川菜', cantonese: '粤菜', jiangsu: '苏菜', shandong: '鲁菜',
        hunan: '湘菜', zhejiang: '浙菜', fujian: '闽菜', anhui: '徽菜',
        japanese: '日料', korean: '韩餐', italian: '意餐', french: '法餐',
        american: '美式', thai: '泰餐', vietnamese: '越南菜'
    };

    const placeEmojis: Record<string, string> = {
        cafeteria: '🏢', delivery: '🛵', dineOut: '🚶'
    };

    const handleRandom = () => {
        setIsRandomizing(true);
        setResult(null);
        
        // 模拟随机过程动画
        let count = 0;
        const interval = setInterval(() => {
            count++;
            if (count > 10) {
                clearInterval(interval);
                generateResult();
                setIsRandomizing(false);
            }
        }, 100);
    };

    const generateResult = () => {
        let candidates: string[] = [];
        
        // 根据菜系筛选
        if (preferences.cuisine) {
            // 特定菜系
            if (foodDatabase[preferences.cuisine]) {
                candidates = [...foodDatabase[preferences.cuisine]];
            }
        } else if (preferences.style === 'chinese') {
            // 中餐大类
            candidates = [
                ...foodDatabase.sichuan, ...foodDatabase.cantonese, 
                ...foodDatabase.hunan, ...foodDatabase.shandong,
                ...foodDatabase.jiangsu, ...foodDatabase.zhejiang,
                ...foodDatabase.fujian, ...foodDatabase.anhui,
                ...foodDatabase.noodle, ...foodDatabase.rice
            ];
        } else if (preferences.style === 'western') {
            // 西餐大类
            candidates = [
                ...foodDatabase.western, ...foodDatabase.japanese,
                ...foodDatabase.korean, ...foodDatabase.southeast
            ];
        } else if (preferences.type === 'noodle') {
            // 面食
            candidates = [...foodDatabase.noodle];
        } else if (preferences.type === 'rice') {
            // 米饭
            candidates = [...foodDatabase.rice];
        } else {
            // 全部食物
            candidates = Object.values(foodDatabase).flat();
        }

        // 去重
        candidates = [...new Set(candidates)];

        // 随机选择
        const randomFood = candidates[Math.floor(Math.random() * candidates.length)];
        
        let placeText = '';
        if (preferences.place) {
            const placeMap: Record<string, string> = {
                cafeteria: t.chef?.cafeteria || '食堂',
                delivery: t.chef?.delivery || '外卖',
                dineOut: t.chef?.dineOut || '出去吃'
            };
            placeText = ` (${placeEmojis[preferences.place]} ${placeMap[preferences.place]})`;
        }

        setResult(randomFood + placeText);
    };

    // 自定义随机
    const handleCustomRandom = () => {
        const validOptions = customOptions.filter(opt => opt.trim() !== '');
        if (validOptions.length < 2) {
            alert(t.chef?.needTwoOptions || '请至少输入两个选项');
            return;
        }
        
        setIsRandomizing(true);
        setCustomResult(null);
        
        let count = 0;
        const interval = setInterval(() => {
            count++;
            if (count > 8) {
                clearInterval(interval);
                const randomResult = validOptions[Math.floor(Math.random() * validOptions.length)];
                setCustomResult(randomResult);
                setIsRandomizing(false);
            }
        }, 100);
    };

    const addCustomOption = () => {
        setCustomOptions([...customOptions, '']);
    };

    const removeCustomOption = (index: number) => {
        if (customOptions.length <= 2) return;
        setCustomOptions(customOptions.filter((_, i) => i !== index));
    };

    const updateCustomOption = (index: number, value: string) => {
        const newOptions = [...customOptions];
        newOptions[index] = value;
        setCustomOptions(newOptions);
    };

    const cuisineOptions = [
        { key: 'sichuan', label: '川菜 🔥' },
        { key: 'cantonese', label: '粤菜 🥟' },
        { key: 'jiangsu', label: '苏菜 🍲' },
        { key: 'shandong', label: '鲁菜 🥟' },
        { key: 'hunan', label: '湘菜 🌶️' },
        { key: 'japanese', label: '日料 🍣' },
        { key: 'korean', label: '韩餐 🍜' },
        { key: 'italian', label: '意餐 🍝' }
    ];

    return (
        <div className="view">
            <div className="sub-header">
                <button onClick={() => setView('home')} className="back-btn"><BackArrow /></button>
                <h2>👨‍🍳 {t.chef?.title || '佳倩小厨'}</h2>
            </div>

            {/* Tab 切换 */}
            <div className="subtab-container" style={{ marginBottom: '20px' }}>
                <div className={`subtab-slider ${activeTab === 'custom' ? 'middle' : activeTab === 'menu' ? 'right' : ''}`}></div>
                <button 
                    className={`tab-btn ${activeTab === 'random' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('random')}
                >
                    🎲 {t.chef?.whatToEat || '今天吃什么'}
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'custom' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('custom')}
                >
                    🤔 {t.chef?.custom || '帮我选'}
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('menu')}
                >
                    📋 {t.chef?.menu || '菜单'}
                </button>
            </div>

            <div style={{ padding: '0 20px' }}>
                {activeTab === 'random' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* 偏好选择区域 */}
                        {!result && (
                            <>
                                {/* 菜系选择 */}
                                <div className="settings-card-new">
                                    <div className="section-label">🍜 {t.chef?.cuisine || '菜系'}</div>
                                    <div className="cuisine-grid">
                                        {[
                                            { key: 'sichuan', emoji: '🌶️', label: '川菜' },
                                            { key: 'hunan', emoji: '🔥', label: '湘菜' },
                                            { key: 'cantonese', emoji: '🥟', label: '粤菜' },
                                            { key: 'shandong', emoji: '🍖', label: '鲁菜' },
                                            { key: 'jiangsu', emoji: '🍲', label: '苏菜' },
                                            { key: 'zhejiang', emoji: '🐟', label: '浙菜' },
                                            { key: 'fujian', emoji: '🍜', label: '闽菜' },
                                            { key: 'anhui', emoji: '🍄', label: '徽菜' },
                                            { key: 'dongbei', emoji: '❄️', label: '东北菜' },
                                            { key: 'xibei', emoji: '🍜', label: '西北菜' },
                                            { key: 'yunnan', emoji: '🌸', label: '云南菜' },
                                            { key: 'guizhou', emoji: '🍋', label: '贵州菜' },
                                            { key: 'hubei', emoji: '🦆', label: '湖北菜' },
                                            { key: 'jiangxi', emoji: '🍲', label: '江西菜' },
                                            { key: 'japanese', emoji: '🍣', label: '日料' },
                                            { key: 'korean', emoji: '🍜', label: '韩餐' },
                                            { key: 'thai', emoji: '🥥', label: '泰餐' },
                                            { key: 'vietnamese', emoji: '🍜', label: '越南菜' },
                                            { key: 'western', emoji: '🥩', label: '西餐' },
                                            { key: 'italian', emoji: '🍕', label: '意餐' },
                                            { key: 'french', emoji: '🥐', label: '法餐' },
                                            { key: 'american', emoji: '🍔', label: '美式快餐' }
                                        ].map(({ key, emoji, label }) => (
                                            <button
                                                key={key}
                                                onClick={() => setPreferences(p => ({ 
                                                    ...p, 
                                                    cuisine: p.cuisine === key ? '' : key 
                                                }))}
                                                className={`cuisine-btn ${preferences.cuisine === key ? 'active' : ''}`}
                                            >
                                                <span style={{ fontSize: '20px' }}>{emoji}</span>
                                                <span>{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* 或选择大类 */}
                                {!preferences.cuisine && (
                                    <div className="settings-card-new">
                                        <div className="section-label">🍽️ {t.chef?.category || '大类'}</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <button
                                                onClick={() => setPreferences(p => ({ ...p, style: p.style === 'chinese' ? '' : 'chinese', cuisine: '' }))}
                                                style={{
                                                    padding: '14px',
                                                    borderRadius: '14px',
                                                    border: '2px solid',
                                                    borderColor: preferences.style === 'chinese' ? 'var(--accent)' : 'var(--border-color)',
                                                    background: preferences.style === 'chinese' ? 'var(--accent-light)' : 'var(--card-bg)',
                                                    color: preferences.style === 'chinese' ? 'var(--accent)' : 'var(--text-main)',
                                                    fontWeight: 700,
                                                    fontSize: '14px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                🥢 {t.chef?.chinese || '中餐'}
                                            </button>
                                            <button
                                                onClick={() => setPreferences(p => ({ ...p, style: p.style === 'western' ? '' : 'western', cuisine: '' }))}
                                                style={{
                                                    padding: '14px',
                                                    borderRadius: '14px',
                                                    border: '2px solid',
                                                    borderColor: preferences.style === 'western' ? 'var(--accent)' : 'var(--border-color)',
                                                    background: preferences.style === 'western' ? 'var(--accent-light)' : 'var(--card-bg)',
                                                    color: preferences.style === 'western' ? 'var(--accent)' : 'var(--text-main)',
                                                    fontWeight: 700,
                                                    fontSize: '14px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                🍴 {t.chef?.western || '西餐'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* 面/饭选择 */}
                                <div className="settings-card-new">
                                    <div className="section-label">🍚 {t.chef?.type === 'undefined' ? '主食' : '主食'}</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <button
                                            onClick={() => setPreferences(p => ({ ...p, type: p.type === 'noodle' ? '' : 'noodle' }))}
                                            style={{
                                                padding: '14px',
                                                borderRadius: '14px',
                                                border: '2px solid',
                                                borderColor: preferences.type === 'noodle' ? 'var(--accent)' : 'var(--border-color)',
                                                background: preferences.type === 'noodle' ? 'var(--accent-light)' : 'var(--card-bg)',
                                                color: preferences.type === 'noodle' ? 'var(--accent)' : 'var(--text-main)',
                                                fontWeight: 700,
                                                fontSize: '14px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            🍜 {t.chef?.noodle || '面食'}
                                        </button>
                                        <button
                                            onClick={() => setPreferences(p => ({ ...p, type: p.type === 'rice' ? '' : 'rice' }))}
                                            style={{
                                                padding: '14px',
                                                borderRadius: '14px',
                                                border: '2px solid',
                                                borderColor: preferences.type === 'rice' ? 'var(--accent)' : 'var(--border-color)',
                                                background: preferences.type === 'rice' ? 'var(--accent-light)' : 'var(--card-bg)',
                                                color: preferences.type === 'rice' ? 'var(--accent)' : 'var(--text-main)',
                                                fontWeight: 700,
                                                fontSize: '14px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            🍚 {t.chef?.rice || '米饭'}
                                        </button>
                                    </div>
                                </div>

                                {/* 用餐地点 */}
                                <div className="settings-card-new">
                                    <div className="section-label">📍 {t.chef?.place || '用餐地点'}</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                        {[
                                            { key: 'cafeteria', icon: '🏢', label: t.chef?.cafeteria || '食堂' },
                                            { key: 'delivery', icon: '🛵', label: t.chef?.delivery || '外卖' },
                                            { key: 'dineOut', icon: '🚶', label: t.chef?.dineOut || '出去吃' }
                                        ].map(({ key, icon, label }) => (
                                            <button
                                                key={key}
                                                onClick={() => setPreferences(p => ({ 
                                                    ...p, 
                                                    place: p.place === key ? '' : key 
                                                }))}
                                                style={{
                                                    padding: '12px 8px',
                                                    borderRadius: '12px',
                                                    border: '2px solid',
                                                    borderColor: preferences.place === key ? 'var(--accent)' : 'var(--border-color)',
                                                    background: preferences.place === key ? 'var(--accent-light)' : 'var(--card-bg)',
                                                    color: preferences.place === key ? 'var(--accent)' : 'var(--text-main)',
                                                    fontWeight: 700,
                                                    fontSize: '13px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                            >
                                                <span style={{ fontSize: '20px' }}>{icon}</span>
                                                <span>{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 开始按钮 */}
                                <button
                                    onClick={handleRandom}
                                    disabled={isRandomizing}
                                    className="btn-confirm highlight glow"
                                    style={{
                                        height: '56px',
                                        fontSize: '18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {isRandomizing ? (
                                        <><span className="spin">🎲</span> 正在决定...</>
                                    ) : (
                                        <><span>🎲</span> {t.chef?.startRandom || '开始随机'}</>
                                    )}
                                </button>
                            </>
                        )}

                        {/* 结果显示 */}
                        {result && (
                            <div 
                                className="settings-card-new"
                                style={{
                                    background: 'linear-gradient(135deg, var(--card-orange) 0%, #FFF8F3 100%)',
                                    textAlign: 'center',
                                    padding: '40px 24px',
                                    animation: 'quotePop 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)'
                                }}
                            >
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                                <div style={{ 
                                    fontSize: '13px', 
                                    color: 'var(--text-soft)', 
                                    marginBottom: '8px',
                                    fontWeight: 600
                                }}>
                                    {t.chef?.result || '今日推荐'}
                                </div>
                                <div style={{ 
                                    fontSize: '28px', 
                                    fontWeight: 800, 
                                    color: 'var(--text-main)',
                                    marginBottom: '24px',
                                    lineHeight: 1.4
                                }}>
                                    {result}
                                </div>
                                <button
                                    onClick={() => {
                                        setResult(null);
                                        setPreferences({ style: '', type: '', cuisine: '', place: '' });
                                    }}
                                    className="btn-confirm"
                                    style={{
                                        background: 'var(--card-bg)',
                                        color: 'var(--text-main)',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.06)'
                                    }}
                                >
                                    🔄 {t.chef?.tryAgain || '再试一次'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'custom' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="settings-card-new">
                            <div className="section-label">🤔 {t.chef?.customTitle || '输入你的选项'}</div>
                            <p style={{ color: 'var(--text-soft)', fontSize: '13px', marginBottom: '16px' }}>
                                {t.chef?.customDesc || '不知道选哪个？让我来帮你决定！'}
                            </p>
                            
                            {customOptions.map((option, index) => (
                                <div key={index} className="custom-option-input">
                                    <input
                                        type="text"
                                        placeholder={`${t.chef?.option || '选项'} ${index + 1}`}
                                        value={option}
                                        onChange={(e) => updateCustomOption(index, e.target.value)}
                                    />
                                    {customOptions.length > 2 && (
                                        <button 
                                            className="remove-btn"
                                            onClick={() => removeCustomOption(index)}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                            
                            <button 
                                className="add-option-btn"
                                onClick={addCustomOption}
                            >
                                <span>+</span> {t.chef?.addOption || '添加选项'}
                            </button>
                        </div>

                        {!customResult ? (
                            <button
                                onClick={handleCustomRandom}
                                disabled={isRandomizing}
                                className="btn-confirm highlight glow"
                                style={{
                                    height: '56px',
                                    fontSize: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                {isRandomizing ? (
                                    <><span className="spin">🎲</span> {t.chef?.deciding || '决定中...'}</>
                                ) : (
                                    <><span>🎯</span> {t.chef?.helpMeChoose || '帮我选'}</>
                                )}
                            </button>
                        ) : (
                            <div className="custom-result">
                                <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎉</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-soft)', fontWeight: 600 }}>
                                    {t.chef?.result || '结果是'}
                                </div>
                                <div className="custom-result-text">
                                    {customResult}
                                </div>
                                <button
                                    onClick={() => {
                                        setCustomResult(null);
                                        setCustomOptions(['', '']);
                                    }}
                                    className="btn-confirm"
                                    style={{
                                        background: 'var(--card-bg)',
                                        color: 'var(--text-main)',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.06)'
                                    }}
                                >
                                    🔄 {t.chef?.tryAgain || '再试一次'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'menu' && (
                    <div 
                        className="settings-card-new"
                        style={{
                            textAlign: 'center',
                            padding: '60px 24px',
                            background: 'linear-gradient(135deg, var(--card-blue) 0%, #F8FBFF 100%)'
                        }}
                    >
                        <div style={{ fontSize: '64px', marginBottom: '20px' }}>📋</div>
                        <h3 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: 800 }}>
                            {t.chef?.menu || '点菜菜单'}
                        </h3>
                        <p style={{ 
                            color: 'var(--text-soft)', 
                            margin: '0 0 24px',
                            fontSize: '15px',
                            lineHeight: 1.6
                        }}>
                            {t.chef?.menuComingSoon || '点菜功能即将上线，敬请期待！'}
                        </p>
                        <div style={{
                            padding: '12px 24px',
                            background: 'var(--accent-light)',
                            borderRadius: '12px',
                            display: 'inline-block',
                            color: 'var(--accent)',
                            fontWeight: 700,
                            fontSize: '14px'
                        }}>
                            🚧 开发中...
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// 纪念日视图组件
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
            <div className="sub-header"><button onClick={() => setView('home')} className="back-btn"><BackArrow /></button><h2>{t.anniv.title}</h2></div>
            <div className="anniv-stats" style={{display:'flex', justifyContent:'space-between', padding:'0 20px 24px'}}>
                <span style={{fontSize:'13px', fontWeight:'700', color:'var(--text-soft)'}}>已收录 {anniversaries.length} 个瞬间</span>
                <button onClick={() => setShowAdd(true)} style={{fontSize:'13px', fontWeight:'850', color:'var(--accent)', background:'none', border:'none'}}>+ {t.anniv.add}</button>
            </div>
            <div className="anniv-list" style={{display:'flex', flexDirection:'column', gap:'16px', padding:'0 20px'}}>
                {anniversaries.length === 0 ? 
                    <div className="empty-state" style={{marginTop:'40px', textAlign:'center', color:'var(--text-soft)'}}>
                        <div style={{fontSize:'48px', marginBottom:'12px'}}>🌱</div>
                        <p>{t.anniv.empty}</p>
                    </div> :
                    anniversaries.map((a: Anniversary) => {
                        const days = getDaysBetween(a.date);
                        return (
                            <div key={a.id} className="anniv-card-full">
                                <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
                                    <div style={{width:'48px', height:'48px', borderRadius:'16px', background: catColors[a.category], display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px'}}>{catIcons[a.category]}</div>
                                    <div><p style={{margin:0, fontWeight:'850', fontSize:'16px'}}>{a.name}</p><p style={{margin:'4px 0 0', fontSize:'12px', color:'var(--text-soft)', fontWeight:'600'}}>{a.date}</p></div>
                                </div>
                                <div style={{textAlign:'right'}}>
                                    <p style={{margin:0, fontSize:'11px', color:'var(--text-soft)', fontWeight:'800'}}>{days >= 0 ? t.anniv.past : t.anniv.future}</p>
                                    <p style={{margin:0, fontSize:'24px', fontWeight:'900', color: days >= 0 ? 'var(--accent)' : 'var(--blue)'}}>{Math.abs(days)}<span style={{fontSize:'12px', marginLeft:'2px'}}>{t.anniv.day}</span></p>
                                    <button onClick={() => {if(confirm(t.anniv.confirmDel)) setAnniversaries(anniversaries.filter((it:any)=>it.id !== a.id))}} style={{color:'#FF3B30', fontSize:'10px', marginTop:'8px', fontWeight:'700', background:'none', border:'none'}}>{t.anniv.delete}</button>
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

                        <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder={t.anniv.name} className="time-input-simple" style={{width:'100%', marginBottom:'16px'}} />
                        <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="time-input-simple" style={{width:'100%', marginBottom:'24px'}} />
                        
                        <button onClick={handleAdd} className="btn-confirm highlight" style={{width:'100%'}}>{t.complete} ✨</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// 账单导入组件
function BillView({ t, setView }: any) {
    const [billRecords, setBillRecords] = useState<BillRecord[]>(() => {
        const saved = localStorage.getItem('jq_bills');
        return saved ? JSON.parse(saved) : [];
    });
    const [activeTab, setActiveTab] = useState<'import' | 'stats' | 'list'>('import');
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 保存到 localStorage
    useEffect(() => {
        localStorage.setItem('jq_bills', JSON.stringify(billRecords));
    }, [billRecords]);

    // 用 xlsx 库统一解析 CSV/XLSX
    const parseBills = (data: ArrayBuffer, source: 'wechat' | 'alipay'): BillRecord[] => {
        try {
            // xlsx 库可以同时处理 CSV 和 Excel
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            // 以二维数组形式读取，保留原始数据格式
            const jsonData = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1, defval: '' });
            
            const records: BillRecord[] = [];
            console.log(`[Bill Import] Parsing ${source}, total rows:`, jsonData.length);
            
            // 微信账单第一行是标题"微信支付账单明细列表"，第二行才是表头
            // 支付宝也可能有类似情况，需要找到真正的表头行
            let headerRowIdx = 0;
            for (let i = 0; i < Math.min(10, jsonData.length); i++) {
                const row = jsonData[i];
                if (row && row.some((cell: string) => 
                    String(cell).includes('交易时间') || 
                    String(cell).includes('交易对方') ||
                    String(cell).includes('金额')
                )) {
                    headerRowIdx = i;
                    break;
                }
            }
            
            console.log('[Bill Import] Header row index:', headerRowIdx);
            console.log('[Bill Import] Header row:', jsonData[headerRowIdx]);
            
            // 打印前5行原始数据用于调试
            console.log('[Bill Import] First 5 rows:');
            for (let i = 0; i < Math.min(5, jsonData.length); i++) {
                console.log(`  Row ${i}:`, jsonData[i]);
            }
            
            // 尝试自动检测列位置
            const headerRow = jsonData[headerRowIdx] || [];
            let dateCol = -1, merchantCol = -1, typeCol = -1, amountCol = -1;
            
            // 根据表头关键词检测列位置
            headerRow.forEach((col: string, idx: number) => {
                const colLower = String(col).toLowerCase();
                // 日期列
                if (colLower.includes('时间') || colLower.includes('date') || colLower.includes('创建')) {
                    dateCol = idx;
                }
                // 商户列
                if (colLower.includes('对方') || colLower.includes('商户') || colLower.includes('商家') || colLower.includes('counterparty')) {
                    merchantCol = idx;
                }
                // 类型列（收/支）
                if (colLower.includes('收/支') || colLower.includes('类型') || colLower.includes('income/expense')) {
                    typeCol = idx;
                }
                // 金额列
                if (colLower.includes('金额') || colLower.includes('amount') || colLower.includes('钱')) {
                    amountCol = idx;
                }
            });
            
            console.log('[Bill Import] Detected columns:', { dateCol, merchantCol, typeCol, amountCol });
            
            // 如果无法自动检测，使用默认列位置
            if (source === 'wechat') {
                // 微信默认：交易时间=0, 交易对方=2, 收/支=4, 金额(元)=5
                if (dateCol === -1) dateCol = 0;
                if (merchantCol === -1) merchantCol = 2;
                if (typeCol === -1) typeCol = 4;
                if (amountCol === -1) amountCol = 5;
            } else {
                // 支付宝默认：交易创建时间=2, 交易对方=7, 收/支=10, 金额（元）=9
                if (dateCol === -1) dateCol = 2;
                if (merchantCol === -1) merchantCol = 7;
                if (typeCol === -1) typeCol = 10;
                if (amountCol === -1) amountCol = 9;
            }
            
            // 从表头行的下一行开始读取数据
            for (let i = headerRowIdx + 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || row.length < Math.max(dateCol, merchantCol, typeCol, amountCol) + 1) {
                    continue;
                }
                
                try {
                    const date = String(row[dateCol] || '').trim();
                    let merchant = String(row[merchantCol] || '').trim();
                    const typeStr = String(row[typeCol] || '').trim();
                    const type: 'income' | 'expense' = typeStr === '收入' ? 'income' : 'expense';
                    const amountStr = String(row[amountCol] || '').replace(/[¥,]/g, '').trim();
                    const amount = parseFloat(amountStr) || 0;
                    
                    // 调试：打印前几行数据
                    if (i <= 3) {
                        console.log(`[Bill Import] Row ${i}:`, { date, merchant, typeStr, amountStr, amount });
                    }
                    
                    // 如果商户为空，尝试使用商品名称列作为备选
                    if (!merchant && source === 'wechat' && row[3]) {
                        merchant = String(row[3] || '').trim(); // 微信商品列
                    }
                    if (!merchant && source === 'alipay' && row[8]) {
                        merchant = String(row[8] || '').trim(); // 支付宝商品名称列
                    }
                    
                    // 验证数据有效性
                    if (!date || amount <= 0) {
                        if (i <= 3) {
                            console.log(`[Bill Import] Row ${i} skipped: invalid data`, { date, merchant, amount });
                        }
                        continue;
                    }
                    
                    // 提取日期部分（去掉时间）
                    const dateOnly = date.split(' ')[0].split('T')[0];
                    
                    records.push({
                        id: Math.random().toString(36).substr(2, 9),
                        date: dateOnly,
                        merchant: merchant || '未知商户',
                        category: guessCategory(merchant),
                        amount,
                        type,
                        source
                    });
                } catch (e) {
                    console.error(`[Bill Import] Parse row ${i} error:`, e);
                }
            }
            
            console.log(`[Bill Import] Parsed ${records.length} valid records`);
            return records;
        } catch (e) {
            console.error('[Bill Import] Parse error:', e);
            return [];
        }
    };

    // 根据商家名称猜测类别
    const guessCategory = (merchant: string): string => {
        if (!merchant) return '其他';
        const m = merchant.toLowerCase();
        const categories: Record<string, string[]> = {
            '餐饮': ['餐厅', '饭店', '火锅', '烧烤', '奶茶', '咖啡', '肯德基', '麦当劳', '必胜客', '星巴克', '瑞幸', '美食', '小吃', '面馆', '饺子', '寿司', '料理', '快餐', '汉堡', ' pizza', '披萨', '烘焙', '面包', 'cake', '饮品', '酒吧', 'pub', '料理', '食堂', 'canteen', 'kfc', 'mcdonald', 'burger', 'cafe'],
            '购物': ['超市', '便利店', '商场', '百货', '淘宝', '京东', '拼多多', '天猫', '唯品会', '超市', '沃尔玛', '家乐福', 'costco', '山姆', '盒马', '永辉', '华润', '便利蜂', '711', 'seven-eleven', 'familymart', 'lawson', 'store', 'shop', 'mall', 'market'],
            '交通': ['地铁', '公交', '打车', '滴滴', '出租车', '加油', '停车', '高铁', '火车', '机票', '地铁', 'metro', 'subway', 'uber', 'didi', 'taxi', '加油站', 'petrol', ' parking', '航空', 'airlines', '国航', '南航', '东航'],
            '娱乐': ['电影', 'ktv', 'KTV', '游戏', '充值', '会员', '视频', '音乐', '书店', '网吧', 'netflix', '爱奇艺', '腾讯', '优酷', 'bilibili', 'steam', 'app store', 'apple', 'google play', 'cinema', 'theater', '剧院'],
            '生活': ['水电', '煤气', '燃气', '物业', '房租', '宽带', '话费', '快递', '洗衣', '理发', 'hair', 'salon', 'beauty', '物业', 'utility', 'phone bill', 'mobile', '电信', '联通', '移动', '快递', 'express', 'logistics'],
            '医疗': ['医院', '药店', '诊所', '体检', 'hospital', 'pharmacy', 'drug', 'clinic', 'medical', 'dental', '牙医'],
            '教育': ['培训', '课程', '学费', '书本', '教材', 'education', 'course', 'training', 'school', 'university', 'college', '学费', 'tutor', 'learn']
        };
        
        for (const [cat, keywords] of Object.entries(categories)) {
            if (keywords.some(k => m.includes(k.toLowerCase()))) return cat;
        }
        return '其他';
    };



    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setImporting(true);
        
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const data = event.target?.result as ArrayBuffer;
            if (!data) {
                alert(t.bill?.parseError || '解析失败');
                setImporting(false);
                return;
            }
            
            // 检测来源（微信/支付宝）- 通过读取部分文本判断
            const textSample = new TextDecoder().decode(data.slice(0, 5000));
            const source: 'wechat' | 'alipay' = textSample.includes('微信') || textSample.includes('WeChat') || textSample.includes('微信支付') ? 'wechat' : 'alipay';
            
            console.log('[Bill Import] Detected source:', source);
            
            const newRecords = parseBills(data, source);
            
            if (newRecords.length > 0) {
                setBillRecords(prev => [...newRecords, ...prev]);
                alert((t.bill?.parseSuccess || '成功导入 {count} 条记录').replace('{count}', String(newRecords.length)));
                setActiveTab('stats');
            } else {
                alert(t.bill?.parseError || '未找到有效记录，请检查文件格式是否为微信/支付宝导出格式');
            }
            setImporting(false);
        };
        
        reader.onerror = () => {
            alert(t.bill?.parseError || '文件读取失败');
            setImporting(false);
        };
        
        // 统一使用 ArrayBuffer 读取，xlsx 库可以处理 CSV 和 Excel
        reader.readAsArrayBuffer(file);
    };

    const clearData = () => {
        if (confirm(t.bill?.confirmClear || '确定清空？')) {
            setBillRecords([]);
            localStorage.removeItem('jq_bills');
        }
    };

    // 统计数据
    const stats = useMemo(() => {
        const expenses = billRecords.filter(r => r.type === 'expense');
        const total = expenses.reduce((sum, r) => sum + r.amount, 0);
        const avg = expenses.length > 0 ? total / expenses.length : 0;
        
        // 按类别统计
        const byCategory: Record<string, number> = {};
        expenses.forEach(r => {
            byCategory[r.category] = (byCategory[r.category] || 0) + r.amount;
        });
        
        // 按月份统计
        const byMonth: Record<string, number> = {};
        expenses.forEach(r => {
            const month = r.date.substring(0, 7);
            byMonth[month] = (byMonth[month] || 0) + r.amount;
        });
        
        // 消费最多的商家
        const byMerchant: Record<string, number> = {};
        expenses.forEach(r => {
            byMerchant[r.merchant] = (byMerchant[r.merchant] || 0) + r.amount;
        });
        const topMerchants = Object.entries(byMerchant)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        return { total, avg, byCategory, byMonth, topMerchants, count: expenses.length };
    }, [billRecords]);

    return (
        <div className="view">
            <div className="sub-header">
                <button onClick={() => setView('home')} className="back-btn"><BackArrow /></button>
                <h2>💰 {t.bill?.title || '账单导入'}</h2>
            </div>

            {/* Tab 切换 */}
            <div className="subtab-container" style={{ marginBottom: '20px' }}>
                <div className={`subtab-slider ${activeTab === 'stats' ? 'middle' : activeTab === 'list' ? 'right' : ''}`}></div>
                <button className={`tab-btn ${activeTab === 'import' ? 'active' : ''}`} onClick={() => setActiveTab('import')}>
                    📥 {t.bill?.importTitle || '导入'}
                </button>
                <button className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
                    📊 {t.bill?.categoryStats || '统计'}
                </button>
                <button className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
                    📝 {t.bill?.recordCount || '明细'}
                </button>
            </div>

            <div style={{ padding: '0 20px' }}>
                {activeTab === 'import' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* 导入指南 */}
                        <div className="settings-card-new">
                            <div className="section-label">📖 {t.bill?.howToExport || '导出指南'}</div>
                            <div style={{ background: 'var(--input-bg)', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
                                <p style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--text-main)' }}>微信账单导出：</p>
                                <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--text-soft)', lineHeight: 1.6 }}>
                                    {t.bill?.step1}<br/>
                                    {t.bill?.step2}<br/>
                                    {t.bill?.step3}<br/>
                                    {t.bill?.step4}
                                </p>
                            </div>
                            
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                            />
                            
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={importing}
                                className="btn-confirm highlight"
                                style={{
                                    height: '56px',
                                    fontSize: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                {importing ? (
                                    <><span className="spin">📊</span> 解析中...</>
                                ) : (
                                    <><span>📁</span> {t.bill?.selectFile || '选择账单文件'}</>
                                )}
                            </button>
                            
                            {billRecords.length > 0 && (
                                <button
                                    onClick={clearData}
                                    style={{
                                        marginTop: '12px',
                                        width: '100%',
                                        padding: '14px',
                                        borderRadius: '14px',
                                        border: 'none',
                                        background: '#FFE5E5',
                                        color: '#FF3B30',
                                        fontWeight: 700,
                                        fontSize: '14px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🗑️ {t.bill?.clearData || '清空数据'} ({billRecords.length} 条)
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'stats' && billRecords.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* 总览卡片 */}
                        <div className="settings-card-new" style={{ background: 'linear-gradient(135deg, var(--card-orange) 0%, #FFF8F3 100%)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'center' }}>
                                <div>
                                    <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-soft)' }}>{t.bill?.totalAmount || '总消费'}</p>
                                    <p style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: 'var(--accent)' }}>¥{stats.total.toFixed(0)}</p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-soft)' }}>{t.bill?.recordCount || '记录数'}</p>
                                    <p style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>{stats.count}</p>
                                </div>
                            </div>
                        </div>

                        {/* 类别统计 */}
                        <div className="settings-card-new">
                            <div className="section-label">📊 {t.bill?.categoryStats || '消费分类'}</div>
                            {Object.entries(stats.byCategory)
                                .sort((a, b) => b[1] - a[1])
                                .map(([cat, amount]) => (
                                    <div key={cat} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                                        <span style={{ width: '60px', fontSize: '13px', fontWeight: 600 }}>{cat}</span>
                                        <div style={{ flex: 1, height: '8px', background: 'var(--input-bg)', borderRadius: '4px', margin: '0 12px', overflow: 'hidden' }}>
                                            <div style={{ width: `${(amount / stats.total * 100)}%`, height: '100%', background: 'var(--accent-gradient)', borderRadius: '4px' }}></div>
                                        </div>
                                        <span style={{ width: '70px', textAlign: 'right', fontSize: '13px', fontWeight: 700 }}>¥{amount.toFixed(0)}</span>
                                    </div>
                                ))}
                        </div>

                        {/* 消费最多商家 */}
                        <div className="settings-card-new">
                            <div className="section-label">🏪 {t.bill?.topMerchants || '消费最多商家'}</div>
                            {stats.topMerchants.map(([merchant, amount], idx) => (
                                <div key={merchant} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: idx < stats.topMerchants.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: idx < 3 ? 'var(--accent)' : 'var(--input-bg)', color: idx < 3 ? 'white' : 'var(--text-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>{idx + 1}</span>
                                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{merchant}</span>
                                    </div>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>¥{amount.toFixed(0)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'stats' && billRecords.length === 0 && (
                    <div className="settings-card-new" style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                        <p style={{ color: 'var(--text-soft)' }}>{t.bill?.noData || '暂无数据'}</p>
                    </div>
                )}

                {activeTab === 'list' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {billRecords.length > 0 ? billRecords.slice(0, 50).map(record => (
                            <div key={record.id} className="settings-card-new" style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '15px' }}>{record.merchant}</p>
                                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-soft)' }}>{record.date} · {record.category}</p>
                                    </div>
                                    <span style={{ fontSize: '18px', fontWeight: 800, color: record.type === 'expense' ? 'var(--accent)' : '#4CAF50' }}>
                                        {record.type === 'expense' ? '-' : '+'}¥{record.amount.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="settings-card-new" style={{ textAlign: 'center', padding: '60px 20px' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                                <p style={{ color: 'var(--text-soft)' }}>{t.bill?.noData || '暂无数据'}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// 每日情话弹窗组件
function DailyQuoteModal({ quote, onClose, language }: { quote: {text: string, author?: string, title?: string, isSpecial?: boolean}, onClose: () => void, language: 'zh' | 'en' }) {
    const [fadeOut, setFadeOut] = useState(false);
    
    const handleClose = () => {
        setFadeOut(true);
        setTimeout(onClose, 400);
    };
    
    return (
        <div 
            className={`daily-quote-overlay ${fadeOut ? 'fade-out' : ''}`} 
            onClick={handleClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(15px)',
                zIndex: 15000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                animation: 'fadeIn 0.5s ease-out'
            }}
        >
            <div 
                onClick={e => e.stopPropagation()}
                style={{
                    background: quote.isSpecial 
                        ? 'linear-gradient(135deg, #FF6B9D 0%, #C44569 100%)' 
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '28px',
                    padding: '40px 32px',
                    width: '100%',
                    maxWidth: '360px',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    animation: 'quotePop 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)'
                }}
            >
                {/* 装饰元素 */}
                <div style={{ 
                    position: 'absolute', 
                    top: -30, 
                    right: -30, 
                    fontSize: 100, 
                    opacity: 0.1,
                    transform: 'rotate(15deg)'
                }}>
                    {quote.isSpecial ? (quote.title?.includes('生日') ? '🎂' : quote.title?.includes('新年') ? '🎆' : '❤️') : '💕'}
                </div>
                
                {/* 标题 */}
                {quote.title && (
                    <h2 style={{
                        color: 'white',
                        fontSize: '22px',
                        fontWeight: '800',
                        margin: '0 0 20px',
                        textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                    }}>
                        {quote.title}
                    </h2>
                )}
                
                {/* 分隔线 */}
                {quote.title && (
                    <div style={{
                        width: '60px',
                        height: '3px',
                        background: 'rgba(255,255,255,0.3)',
                        margin: '0 auto 24px',
                        borderRadius: '2px'
                    }} />
                )}
                
                {/* 情话内容 */}
                <p style={{
                    color: 'white',
                    fontSize: '18px',
                    lineHeight: '1.8',
                    margin: '0 0 20px',
                    fontWeight: '500',
                    textShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    「{quote.text}」
                </p>
                
                {/* 作者 */}
                {quote.author && (
                    <p style={{
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: '14px',
                        margin: '0 0 32px',
                        fontStyle: 'italic'
                    }}>
                        —— {quote.author}
                    </p>
                )}
                
                {/* 提示文字 */}
                <p style={{
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '12px',
                    margin: '0 0 20px'
                }}>
                    {language === 'zh' ? '点击任意处开始美好的一天 ✨' : 'Tap anywhere to start a wonderful day ✨'}
                </p>
                
                {/* 关闭按钮 */}
                <button
                    onClick={handleClose}
                    style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        borderRadius: '16px',
                        padding: '14px 32px',
                        color: 'white',
                        fontSize: '15px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                >
                    {language === 'zh' ? '开启今日份心动' : 'Start Today'}
                </button>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
