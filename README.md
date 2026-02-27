# 佳倩管家

> 私人生活助理 · 记录温暖的小日子

一个基于 React + TypeScript + Vite 构建的渐进式 Web 应用 (PWA)，专为情侣设计的贴心生活助手。

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
| xlsx | ^0.18.5 | Excel/CSV 解析 |
| @google/genai | ^0.7.0 | AI 功能（预留） |

## 📁 文件结构

```
.
├── index.html          # PWA 入口，包含 manifest 和 service worker 注册
├── index.tsx           # 主应用组件（~3000 行，包含所有功能模块）
├── index.css           # 全局样式（CSS 变量主题、动画、响应式）
├── sw.js               # Service Worker（缓存、推送通知）
├── manifest.json       # PWA 配置（图标、主题色、启动方式）
├── metadata.json       # 应用元数据（权限声明）
├── vite.config.ts      # Vite 配置（环境变量注入）
├── tsconfig.json       # TypeScript 配置
├── package.json        # 项目依赖和脚本
├── .env.example        # 环境变量模板
├── .env.local          # 本地环境变量（⚠️ 不要提交到仓库）
└── .gitignore          # Git 忽略规则
```

### 文件用途说明

| 文件 | 是否必需 | 说明 |
|------|----------|------|
| `index.html` | ✅ | 应用入口，包含 PWA 必需标签 |
| `index.tsx` | ✅ | 主逻辑，包含所有 React 组件和业务逻辑 |
| `index.css` | ✅ | 样式文件，支持浅色/深色主题 |
| `sw.js` | ✅ | Service Worker，实现离线访问和推送 |
| `manifest.json` | ✅ | PWA 清单文件 |
| `metadata.json` | ✅ | 扩展元数据（相机权限等） |
| `vite.config.ts` | ✅ | 构建配置，注入 API Key |
| `tsconfig.json` | ✅ | TypeScript 编译配置 |
| `package.json` | ✅ | npm 依赖管理 |
| `.env.example` | ✅ | 环境变量示例模板 |
| `.env.local` | ⚠️ | 本地环境变量（含敏感信息） |
| `.gitignore` | ✅ | 忽略 node_modules 等 |

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 配置环境变量
```bash
cp .env.example .env.local
# 编辑 .env.local，填入你的 API Key（如需 AI 功能）
```

### 开发模式
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

### Vercel 部署注意事项
1. 在 Project → Settings → Environment Variables 中设置 `DOUBAO_API_KEY`
2. 确保变量应用于 Production/Preview 环境
3. 修改环境变量后需要重新部署

### 环境变量安全
- **切勿**将 `.env.local` 提交到代码仓库
- 生产环境应使用服务器端代理转发 AI 请求，避免暴露 API Key

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
