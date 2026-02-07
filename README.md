# LoveLog - Private Intimacy Tracker / 私密亲密日记

![Vue.js](https://img.shields.io/badge/vue-%2335495e.svg?style=flat&logo=vuedotjs&logoColor=%234FC08D)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)

[English](#english) | [中文](#chinese)

---

<a name="english"></a>
## English

**LoveLog** is a beautiful, privacy-first progressive web application (PWA) designed to track and cherish your intimate moments. Built with a focus on user experience, aesthetics, and data privacy.

### ✨ Key Features

*   **Privacy First**: All data is stored locally on your device using IndexedDB and LocalStorage. No data is uploaded to any cloud server.
*   **Quick Logging**: One-tap hero button for instant recording.
*   **Detailed Records**: Long-press or edit to add duration, custom tags, and notes.
*   **Visual Statistics**: Track your streaks, total count, and view insights with beautiful charts.
*   **Atmospheric Experience**: Dynamic greetings based on the time of day and your current streak.
*   **Secure**: Built-in PIN Code protection to keep your logs private.
*   **PWA Support**: Installable on mobile devices (iOS/Android) with offline support.
*   **Dark/Light Mode**: Fully responsive design with automatic theme switching.

### 🛠 Tech Stack

*   **Frontend Framework**: Vue 3 (Composition API)
*   **Build Tool**: Vite
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS 4.0
*   **State Management**: Pinia + Pinia Plugin Persistedstate
*   **Router**: Vue Router
*   **Charts**: Chart.js + vue-chartjs
*   **Date Handling**: date-fns
*   **Icons**: Material Symbols (Google Fonts)
*   **Local Storage**: idb (IndexedDB wrapper) & @vueuse/core

### 🚀 Getting Started

#### Prerequisites
*   Node.js (v18 or higher recommended)
*   npm or pnpm

#### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/lovelog.git
    cd lovelog
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Build for production:
    ```bash
    npm run build
    ```

### ☁️ Deployment

This project is optimized for **Cloudflare Pages**.

1.  Connect your GitHub repository to Cloudflare Pages.
2.  Set the build command to `npm run build`.
3.  Set the output directory to `dist`.
4.  Deploy! (The included `public/_redirects` file handles SPA routing).

---

<a name="chinese"></a>
## 中文

**LoveLog** 是一款精美、注重隐私的亲密关系记录应用 (PWA)。它专注于提供极致的用户体验、美观的界面以及绝对的数据安全。

### ✨ 核心功能

*   **隐私至上**: 所有数据仅存储在您的设备本地（使用 IndexedDB 和 LocalStorage），绝不上传至任何云端服务器。
*   **快速记录**: 首页超大按钮，一键快速记录美好时刻。
*   **详细编辑**: 支持长按按钮或后期编辑，添加持续时间、自定义标签和备注。
*   **数据统计**: 追踪连胜纪录 (Streak)、总次数，并通过图表回顾过往。
*   **沉浸体验**: 根据时间段和当前连胜状态显示的动态问候语。
*   **安全保护**: 内置 PIN 码锁功能，保护您的私密记录不被他人查看。
*   **PWA 支持**: 可作为原生应用安装在手机 (iOS/Android) 上，支持离线使用。
*   **深色/浅色模式**: 完美适配的响应式设计，支持系统自动切换主题。

### 🛠 技术栈

*   **前端框架**: Vue 3 (组合式 API)
*   **构建工具**: Vite
*   **由于语言**: TypeScript
*   **样式库**: Tailwind CSS 4.0
*   **状态管理**: Pinia
*   **路由**: Vue Router
*   **图表**: Chart.js + vue-chartjs
*   **本地存储**: idb (IndexedDB 封装) & @vueuse/core

### 🚀 快速开始

#### 环境要求
*   Node.js (建议 v18 或更高)
*   npm 或 pnpm

#### 安装步骤

1.  克隆仓库:
    ```bash
    git clone https://github.com/yourusername/lovelog.git
    cd lovelog
    ```

2.  安装依赖:
    ```bash
    npm install
    ```

3.  启动开发服务器:
    ```bash
    npm run dev
    ```

4.  构建生产版本:
    ```bash
    npm run build
    ```

### ☁️ 部署指南

本项目已针对 **Cloudflare Pages** 进行了优化。

1.  将您的 GitHub 仓库连接到 Cloudflare Pages。
2.  设置构建命令为 `npm run build`。
3.  设置输出目录为 `dist`。
4.  点击部署即可！(项目中已包含 `public/_redirects` 文件以处理 SPA 路由问题)。

---

## 📄 License

MIT License © 2024 LoveLog
