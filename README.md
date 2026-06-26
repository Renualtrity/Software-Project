MCGA Pro - Minecraft AI 模组生成系统

## 一、软件介绍

MCGA Pro（Minecraft AI Mod Generator Advanced Pro）是一款面向 Minecraft 玩家与开发者的模组生成与管理工具。本软件基于 **AI 智能体**技术，支持通过自然语言描述自动生成符合 Forge/Fabric 规范的 Minecraft 模组代码，并在桌面端调用本地 Gradle 完成真实编译，输出可直接运行的 `.jar` 文件。

软件同时集成了**模组市场**与**整合包管理**功能，支持从 Modrinth 等公开平台搜索、浏览、下载海量社区模组与整合包；并内置**启动器适配**、**个人中心**、**帮助与反馈**等模块，为 Minecraft 玩家提供一站式的模组开发与管理体验。

### 主要功能模块

| 模块      | 功能描述                                                                 |
| ------- | -------------------------------------------------------------------- |
| AI 模组生成 | 接入 DeepSeek / GLM 等大模型 API，将自然语言需求转化为结构化模组数据，自动生成 Java 源码与 Gradle 配置 |
| 模组市场    | 基于 Modrinth API，支持搜索、分类浏览、版本选择与下载社区模组                                |
| 整合包管理   | 浏览、搜索、下载 Minecraft 整合包，支持多版本筛选                                       |
| 模组管理    | 管理已生成的模组历史，支持查看源码、重新编译、导出                                            |
| 启动器适配   | 提供标准接口，支持与 HMCL、PCL2 等主流启动器进行模组安装适配                                  |
| 个人中心    | 用户设置、AI 参数配置、账号与安全管理                                                 |
| 帮助与反馈   | 使用指南、常见问题、意见反馈入口                                                     |

***
=======
| 模块 | 功能描述 |
|------|----------|
| AI 模组生成 | 接入 DeepSeek / GLM 等大模型 API，将自然语言需求转化为结构化模组数据，自动生成 Java 源码与 Gradle 配置 |
| 模组市场 | 基于 Modrinth API，支持搜索、分类浏览、版本选择与下载社区模组 |
| 整合包管理 | 浏览、搜索、下载 Minecraft 整合包，支持多版本筛选 |
| 模组管理 | 管理已生成的模组历史，支持查看源码、重新编译、导出 |
| 启动器适配 | 提供标准接口，支持与 HMCL、PCL2 等主流启动器进行模组安装适配 |
| 个人中心 | 用户设置、AI 参数配置、账号与安全管理 |
| 帮助与反馈 | 使用指南、常见问题、意见反馈入口 |

---

## 二、制作目的

1. **降低模组开发门槛**：传统 Minecraft 模组开发需要掌握 Java、Gradle、Forge/Fabric API 等技术，学习曲线陡峭。MCGA Pro 通过 AI 辅助，让普通玩家仅需描述需求即可生成可运行的模组。
2. **打通开发-获取-使用链路**：整合模组生成、市场下载、启动器适配三大环节，避免用户在多个平台间切换。
3. **支持桌面端真实编译**：区别于纯网页端的模拟编译，桌面版基于 Electron 调用本地 Gradle，生成真正可加载到游戏中的模组文件。
4. **提供完整的软件工程实践**：本项目配套完整的软件工程文档（需求分析、概要设计、详细设计、测试报告），可作为相关课程设计或项目实践的参考。

***
=======
---

## 三、配置要求

### 3.1 硬件要求

<<<<<<< HEAD
| 项目   | 最低配置                        | 推荐配置                            |
| ---- | --------------------------- | ------------------------------- |
| 处理器  | Intel Core i3 / AMD Ryzen 3 | Intel Core i5 / AMD Ryzen 5 及以上 |
| 内存   | 4 GB RAM                    | 8 GB RAM 及以上                    |
| 存储空间 | 2 GB 可用空间（含 Gradle 缓存）      | 5 GB 可用空间                       |
| 网络   | 能访问 DeepSeek / GLM API      | 稳定的互联网连接                        |

### 3.2 软件依赖

| 依赖项        | 版本要求                | 用途              |
| ---------- | ------------------- | --------------- |
| Node.js    | ≥ 18.0.0            | 运行 Electron 桌面端 |
| JDK        | 17 或更高              | Gradle 构建所需     |
| Gradle     | 7.5+（或自动下载 Wrapper） | 模组编译            |
| npm / pnpm | 随 Node.js 安装        | 依赖包管理           |

> **注意**：若系统未安装 Gradle，项目首次构建时会通过 `gradlew` 自动下载对应版本。

***
=======
| 项目 | 最低配置 | 推荐配置 |
|------|----------|----------|
| 处理器 | Intel Core i3 / AMD Ryzen 3 | Intel Core i5 / AMD Ryzen 5 及以上 |
| 内存 | 4 GB RAM | 8 GB RAM 及以上 |
| 存储空间 | 2 GB 可用空间（含 Gradle 缓存） | 5 GB 可用空间 |
| 网络 | 能访问 DeepSeek / GLM API | 稳定的互联网连接 |

### 3.2 软件依赖

| 依赖项 | 版本要求 | 用途 |
|--------|----------|------|
| Node.js | ≥ 18.0.0 | 运行 Electron 桌面端 |
| JDK | 17 或更高 | Gradle 构建所需 |
| Gradle | 7.5+（或自动下载 Wrapper） | 模组编译 |
| npm / pnpm | 随 Node.js 安装 | 依赖包管理 |

> **注意**：若系统未安装 Gradle，项目首次构建时会通过 `gradlew` 自动下载对应版本。

---

## 四、运行环境

- **操作系统**：Windows 10 / Windows 11（64位）
- **运行模式**：
  - **桌面端**：基于 Electron 的独立应用，支持本地 Gradle 编译与文件系统访问
  - **Web 预览版**：可通过本地 Node.js 服务器（`npm run dev` 或 `node server.js`）在浏览器中访问基础功能，但 AI 请求与模组编译受限
- **分辨率**：推荐 1366×768 及以上，支持自适应布局

***
=======
---

## 五、使用方法

### 5.1 桌面端启动（推荐）

#### 方式一：开发模式运行

```bash
# 1. 进入项目目录
cd mcga-pro

# 2. 安装依赖
npm install

# 3. 启动桌面应用
npm start
```

#### 方式二：构建并运行发行版

```bash
# 1. 构建可执行文件（输出到 dist/win-unpacked）
npm run build

# 2. 直接运行
dist/win-unpacked/MCGA Pro.exe
```

### 5.2 AI 生成模组

1. 打开软件，点击左侧导航栏 **"AI 生成"**
2. 配置 AI 参数（支持 DeepSeek / GLM，需填写 API Key）
3. 输入模组需求描述（如："生成一个可以增加玩家生命上限的模组"）
4. 选择 Minecraft 版本、加载器类型（Forge/Fabric）
5. 点击 **"开始生成"** → 系统自动完成 AI 解析 → 源码生成 → Gradle 编译
6. 构建完成后，可在 **"模组管理"** 中查看、测试或导出 `.jar` 文件

### 5.3 模组市场与下载

1. 点击左侧 **"模组市场"** 或 **"整合包"**
2. 使用搜索栏输入关键词，或通过版本、加载器类型筛选
3. 点击卡片查看详情，选择所需版本
4. 点击 **"下载"** 按钮，文件将保存至指定目录

### 5.4 启动器适配

1. 在 **"启动器适配"** 页面选择已安装的启动器（HMCL / PCL2 等）
2. 设置游戏目录与模组文件夹路径
3. 选择已生成或已下载的模组，点击 **"安装到启动器"**

***
=======
---

## 六、实现原理

### 6.1 前端交互层

- **技术栈**：HTML5 + CSS3 + Vanilla JavaScript
- **UI 设计**：采用 Minecraft 风格主题，支持浅色/深色主题切换
- **页面路由**：基于 `data-page` 属性的单页应用（SPA）模式，各模块页面通过 `showPage()` 函数切换
- **状态管理**：使用 `localStorage` 持久化用户设置、模组历史、AI 配置等

### 6.2 内核服务层（`/core` 目录）

| 模块文件               | 职责                                                           |
| ------------------ | ------------------------------------------------------------ |
| `aiParser.js`      | 封装 DeepSeek / GLM API 调用，将自然语言解析为结构化模组 JSON                  |
| `codeGenerator.js` | 根据 AI 返回的 JSON 数据，生成完整的 Java 源码、`build.gradle`、`mods.toml` 等 |
| `buildEngine.js`   | 控制 Gradle 构建流程，编译生成可运行的 `.jar`                               |
| `modMarket.js`     | 封装 Modrinth API，实现模组搜索、版本获取、下载链接解析                           |
| `modpacks.js`      | 封装整合包搜索与下载逻辑                                                 |
| `launcher.js`      | 启动器适配接口，定义 HMCL / PCL2 的标准化连接协议                              |
| `modValidator.js`  | 校验生成的模组结构、ID 合法性、版本兼容性                                       |
| `modUtils.js`      | 通用工具函数（文件操作、版本比较等）                                           |
=======
| 模块文件 | 职责 |
|----------|------|
| `aiParser.js` | 封装 DeepSeek / GLM API 调用，将自然语言解析为结构化模组 JSON |
| `codeGenerator.js` | 根据 AI 返回的 JSON 数据，生成完整的 Java 源码、`build.gradle`、`mods.toml` 等 |
| `buildEngine.js` | 控制 Gradle 构建流程，编译生成可运行的 `.jar` |
| `modMarket.js` | 封装 Modrinth API，实现模组搜索、版本获取、下载链接解析 |
| `modpacks.js` | 封装整合包搜索与下载逻辑 |
| `launcher.js` | 启动器适配接口，定义 HMCL / PCL2 的标准化连接协议 |
| `modValidator.js` | 校验生成的模组结构、ID 合法性、版本兼容性 |
| `modUtils.js` | 通用工具函数（文件操作、版本比较等） |

### 6.3 桌面端运行时（Electron）

- **主进程**（`electron/main.js`）：窗口管理、IPC 通信、环境检测、Gradle 子进程调用、AI 代理请求、文件系统访问
- **预加载脚本**（`electron/preload.js`）：通过 `contextBridge` 向渲染进程暴露安全的 API，隔离 Node.js 权限
- **构建流程**：
  1. 前端收集用户输入与配置
  2. 渲染进程通过 `electronAPI` 将请求发送至主进程
  3. 主进程调用 AI API 获取模组结构数据
  4. 调用 `codeGenerator.js` 生成完整项目文件
  5. 写入临时目录，启动 Gradle Wrapper 执行 `gradle build`
  6. 监听构建日志回传前端，最终返回生成的 `.jar` 路径

### 6.4 架构图

```
┌─────────────────────────────────────────────────────┐
│                  前端交互层 (Renderer)                 │
│   index.html / CSS / JS (market.js / generator.js)  │
└──────────────────┬──────────────────────────────────┘
                   │ IPC (electronAPI)
┌──────────────────▼──────────────────────────────────┐
│                 Electron 主进程                      │
│              electron/main.js / preload.js            │
└──────────────────┬──────────────────────────────────┘
                   │
     ┌─────────────┼─────────────┐
     ▼             ▼             ▼
  ┌──────┐    ┌──────┐    ┌──────────┐
  │ AI   │    │ 文件 │    │ Gradle   │
  │ API  │    │ 系统 │    │ 子进程   │
  └──────┘    └──────┘    └────┬─────┘
                               │
                        ┌──────▼──────┐
                        │   /core     │
                        │ aiParser.js │
                        │ codeGen.js  │
                        │ buildEng.js │
                        └─────────────┘
```

***
=======
---

## 七、配套文档

本项目配套完整的软件工程文档，均位于 `docs/` 目录下，可供查阅：

| 文档名称    | 文件路径                                                                                                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
=======
| 文档名称 | 文件路径 |
|----------|----------|
>>>>>>> e1285ff (Initial commit - MCGA Pro Minecraft mod generator)
| 可行性分析报告 | [下载](https://github.com/Renualtrity/Software-Project/blob/master/documents/2408090602029_%E5%B4%94%E9%9B%B2%E5%BF%97_%E5%8F%AF%E8%A1%8C%E6%80%A7%E5%88%86%E6%9E%90%E6%8A%A5%E5%91%8A.docx) |
| 需求规格说明书 | [下载](https://github.com/Renualtrity/Software-Project/blob/master/documents/2408090602029_%E5%B4%94%E9%9B%B2%E5%BF%97_%E9%9C%80%E6%B1%82%E8%A7%84%E6%A0%BC%E8%AF%B4%E6%98%8E%E4%B9%A6.docx) |
| 概要设计说明书 | [下载](https://github.com/Renualtrity/Software-Project/blob/master/documents/2408090602029_%E5%B4%94%E9%9B%B2%E5%BF%97_%E6%A6%82%E8%A6%81%E8%AE%BE%E8%AE%A1%E8%AF%B4%E6%98%8E%E4%B9%A6.docx) |
| 详细设计说明书 | [下载](https://github.com/Renualtrity/Software-Project/blob/master/documents/2408090602029_%E5%B4%94%E9%9B%B2%E5%BF%97_%E8%AF%A6%E7%BB%86%E8%AE%BE%E8%AE%A1%E8%AF%B4%E6%98%8E%E4%B9%A6.docx) |
| 测试计划与报告 | [下载](https://github.com/Renualtrity/Software-Project/blob/master/documents/2408090602029_%E5%B4%94%E9%9B%B2%E5%BF%97_%E6%B5%8B%E8%AF%95%E8%AE%A1%E5%88%92%E4%B8%8E%E6%8A%A5%E5%91%8A.docx) |

***
=======
---

## 八、项目结构

```
mcga-pro/
├── assets/                  # 静态资源（图标等）
├── core/                    # 内核服务层（核心业务逻辑）
│   ├── aiParser.js
│   ├── buildEngine.js
│   ├── codeGenerator.js
│   ├── modMarket.js
│   ├── modpacks.js
│   ├── launcher.js
│   └── ...
├── css/                     # 样式文件
│   ├── style.css
│   └── minecraft-theme.css
├── docs/                    # 配套工程文档
├── electron/                # Electron 桌面端入口
│   ├── main.js
│   └── preload.js
├── js/                      # 前端交互脚本
│   ├── main.js
│   ├── generator.js
│   ├── market.js
│   └── ...
├── index.html               # 主页面
├── package.json             # 项目配置
├── server.js                # 本地 Web 预览服务器
├── .gitignore               # Git 忽略配置
└── README.md                # 本文件
```

***
=======
---

## 九、开源协议

本项目采用 [MIT License](https://opensource.org/licenses/MIT) 开源协议。

***
=======
---
## 十、反馈与支持

如有问题或建议，欢迎在 **GitHub Issues** 中提出，或通过软件内的 **"帮助与反馈"** 页面联系我们。

