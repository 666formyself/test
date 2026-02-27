# 佳倩管家

> 私人生活助理 · 记录温暖的小日子

一个基于 React + TypeScript + Vite 构建的渐进式 Web 应用 (PWA)，专为情侣设计的贴心生活助手。

**云端同步**：基于 Supabase 实现用户认证和数据云同步，支持多设备同步。

## ✨ 功能特性

### 1. 打卡系统
- **运动打卡**：跑步、游泳、骑行、跳绳、力量训练、瑜伽等
- **生活打卡**：早起、喝水、阅读、护肤、冥想、家务等
- **自定义任务**：支持创建个性化打卡项目
- **防重复机制**：同一天相同项目会提示确认

### 2. 纪念日管理
- 支持恋爱、生日、生活、目标四种类型
- 自动计算已度过/剩余天数
- 纪念日当天自动触发祝福弹窗

### 3. 佳倩小厨 🍳
- **随机决定吃什么**：支持 22 种菜系、300+ 道具体菜品
- **自定义选项**：输入多个选项随机选择
- **用餐地点**：食堂、外卖、出去吃
- 包含中餐八大菜系、日韩料理、西餐、东南亚菜等

### 4. 账单导入 💰
- 支持微信/支付宝账单 CSV/Excel 导入
- 智能分类（餐饮、购物、交通、娱乐等）
- 消费统计与趋势分析
- 消费最多商家排行

### 5. 每日浪漫
- **每日情话**：启动时随机展示浪漫语录（中英文各 20+ 条）
- **节日祝福**：情人节、新年等特殊节日自动弹窗
- **纪念日祝福**：自动识别并祝福

### 6. 数据统计
- 连续打卡天数统计
- 周活跃度柱状图
- 生活分布饼图
- 今日/累计打卡数

### 7. 日历提醒
- 支持添加多个自定义打卡提醒时间
- 可导出 `.ics` 文件导入系统日历
- 支持 iOS/Android 原生提醒

### 8. 个性化设置
- **多语言**：简体中文 / English
- **深色模式**：跟随系统或手动切换
- **动画强度**：强/中/弱/关闭
- **震动反馈**：打卡成功时触觉反馈

### 9. PWA 支持
- 可添加到手机主屏幕
- Service Worker 离线缓存
- 启动屏和独立图标

## 🛠 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | ^19.0.0 | UI 框架 |
| TypeScript | ~5.8.2 | 类型安全 |
| Vite | ^6.2.0 | 构建工具 |
| Supabase | ^2.49.1 | 后端服务（Auth + Database）|
| xlsx | ^0.18.5 | Excel/CSV 解析 |

## 📁 文件结构

```
.
├── index.html          # PWA 入口
├── index.tsx           # 主应用组件
├── index.css           # 全局样式
├── sw.js               # Service Worker
├── manifest.json       # PWA 配置
├── metadata.json       # 应用元数据
├── vite.config.ts      # Vite 配置
├── tsconfig.json       # TypeScript 配置
├── package.json        # 项目依赖
├── .env.example        # 环境变量示例
├── .env.local          # 本地环境变量（已忽略）
├── .gitignore          # Git 忽略规则
└── lib/
    └── supabase.ts     # Supabase 客户端配置
```

### 文件用途说明

| 文件 | 是否必需 | 说明 |
|------|----------|------|
| `index.html` | ✅ | 应用入口，包含 PWA 必需标签 |
| `index.tsx` | ✅ | 主逻辑，包含所有 React 组件和业务逻辑 |
| `index.css` | ✅ | 样式文件，支持浅色/深色主题 |
| `sw.js` | ✅ | Service Worker，实现离线访问和推送 |
| `manifest.json` | ✅ | PWA 清单文件 |
| `metadata.json` | ✅ | 扩展元数据 |
| `vite.config.ts` | ✅ | 构建配置 |
| `tsconfig.json` | ✅ | TypeScript 编译配置 |
| `package.json` | ✅ | npm 依赖管理 |
| `.gitignore` | ✅ | 忽略 node_modules 等 |

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 1. 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com) 注册/登录
2. 点击 "New Project" 创建新项目
3. 记下 **Project URL** 和 **anon public API key**

### 2. 创建数据库表

在 Supabase SQL Editor 中执行以下 SQL：

```sql
-- 打卡记录表
CREATE TABLE checkin_records (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    timestamp BIGINT NOT NULL,
    type TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    note TEXT,
    duration INTEGER,
    distance REAL,
    unit TEXT,
    count INTEGER,
    sets INTEGER,
    time TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 纪念日表
CREATE TABLE anniversaries (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户设置表
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    language TEXT DEFAULT 'zh',
    dark_mode_type TEXT DEFAULT 'system',
    manual_dark_mode BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT true,
    in_app_popups BOOLEAN DEFAULT true,
    vibration BOOLEAN DEFAULT true,
    reminders JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS（行级安全）
ALTER TABLE checkin_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE anniversaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的数据
CREATE POLICY "Users can only access their own checkin records" ON checkin_records
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own anniversaries" ON anniversaries
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);
```

### 3. 配置环境变量

创建 `.env.local` 文件：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. 安装依赖
```bash
npm install
```

### 5. 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

## 📱 部署说明

### Vercel 部署（推荐）

1. **环境变量配置**
   在 Vercel Project → Settings → Environment Variables 中添加：
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

2. **部署命令**
   ```bash
   vercel --prod
   ```

3. **重新部署**
   修改环境变量后需要重新部署才能生效

### 其他平台

- **Netlify**: 在 Site settings → Build & deploy → Environment variables 中添加变量
- **Cloudflare Pages**: 在 Project → Settings → Environment variables 中配置
- **GitHub Pages**: 需要在 GitHub Secrets 中配置（不推荐，建议用 Vercel）

### 构建配置

- 构建命令：`npm run build`
- 输出目录：`dist`

⚠️ **重要**：`VITE_SUPABASE_ANON_KEY` 是公开可访问的（anon key），不要放入服务密钥（service_role key）！

## 🎯 核心数据结构

### 打卡记录
```typescript
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
```

### 纪念日
```typescript
interface Anniversary {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  category: 'love' | 'birthday' | 'life' | 'goal';
}
```

### 账单记录
```typescript
interface BillRecord {
  id: string;
  date: string;
  merchant: string;
  category: string;
  amount: number;
  type: 'expense' | 'income';
  source: 'wechat' | 'alipay';
}
```

## 🌐 浏览器兼容性

- Chrome / Edge / Safari（推荐）
- iOS Safari（需添加到主屏幕以支持推送）
- Android Chrome

## 📝 更新日志

### 当前版本
- 初始版本，包含完整功能
- 支持打卡、纪念日、账单、随机选餐
- 中英文双语支持
- PWA 离线访问

## 💝 特别说明

这是一个为情侣设计的温馨小工具，名字中的"佳倩"取自项目创建者的另一半。应用中的每日情话、节日祝福等功能都充满了浪漫元素。

## 📄 开源协议

MIT License
