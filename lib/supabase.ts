import { createClient } from '@supabase/supabase-js';

// 从环境变量读取 Supabase 配置
// 在 .env.local 文件中设置：
// VITE_SUPABASE_URL=https://your-project.supabase.co
// VITE_SUPABASE_ANON_KEY=your-anon-key
// 调试：打印环境变量（开发时看，生产时删除）
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '已设置 ✅' : '未设置 ❌');

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('⚠️ Supabase 配置缺失，请在 .env.local 中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 类型定义
export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
}

export interface CheckInRecordDB {
  id: string;
  user_id: string;
  timestamp: number;
  type: 'sport' | 'event';
  activity_type: string;
  name: string;
  category: string;
  note?: string;
  duration?: number;
  distance?: number;
  unit?: string;
  count?: number;
  sets?: number;
  time?: string;
  created_at: string;
}

export interface AnniversaryDB {
  id: string;
  user_id: string;
  name: string;
  date: string;
  category: 'love' | 'birthday' | 'life' | 'goal';
  created_at: string;
}

export interface BillRecordDB {
  id: string;
  user_id: string;
  date: string;
  merchant: string;
  category: string;
  amount: number;
  type: 'expense' | 'income';
  source: 'wechat' | 'alipay';
  created_at: string;
}

export interface UserSettingsDB {
  user_id: string;
  language: 'zh' | 'en';
  dark_mode_type: 'manual' | 'system';
  manual_dark_mode: boolean;
  push_notifications: boolean;
  in_app_popups: boolean;
  vibration: boolean;
  reminders: any;
  updated_at: string;
}
