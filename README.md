# MCGA Pro - Minecraft AI 模组生成系统

## 项目简介

MCGA Pro 是一款基于 Electron 框架开发的 Minecraft 模组生成工具，集成了 AI 智能解析、模组市场、整合包管理等功能，帮助用户快速生成、管理和下载 Minecraft 模组。

## 运行环境

### 操作系统
- **Windows**: Windows 10/11 (64位)
- **macOS**: macOS 10.15+ (待支持)
- **Linux**: Ubuntu 20.04+ (待支持)

### 依赖环境
- **Node.js**: v18.0.0+ (推荐 v20.x)
- **npm**: v9.0.0+ (随 Node.js 安装)
- **Java**: JDK 17+ (推荐 JDK 21，用于模组编译，可选)

### 依赖包版本
```json
{
  "electron": "^28.0.0",
  "electron-builder": "^24.9.1",
  "archiver": "^7.0.1",
  "decompress": "^4.2.1"
}
```

## 安装与启动步骤

### 1. 克隆项目
```bash
git clone https://github.com/your-repo/mcga-pro.git
cd mcga-pro
```

### 2. 安装依赖
```bash
npm install
```

### 3. 启动应用
```bash
npm start
```

### 4. 构建可执行文件（可选）
```bash
npm run build-installer
```

## 关键模块文件索引

### 核心模块 (`/core`)
| 文件 | 功能说明 |
|------|----------|
| [codeGenerator.js](file:///d:/TRAE_project/d/mcga-pro/core/codeGenerator.js) | 模组代码生成器，生成 Java 源码和资源文件 |
| [aiParser.js](file:///d:/TRAE_project/d/mcga-pro/core/aiParser.js) | AI 解析模块，接入 DeepSeek/GLM API 解析用户需求 |
| [modMarket.js](file:///d:/TRAE_project/d/mcga-pro/core/modMarket.js) | 模组市场核心逻辑，获取 Modrinth API 数据 |
| [modpacks.js](file:///d:/TRAE_project/d/mcga-pro/core/modpacks.js) | 整合包管理核心逻辑 |
| [index.js](file:///d:/TRAE_project/d/mcga-pro/core/index.js) | 核心模块入口，协调各模块工作 |

### Electron 主进程 (`/electron`)
| 文件 | 功能说明 |
|------|----------|
| [main.js](file:///d:/TRAE_project/d/mcga-pro/electron/main.js) | Electron 主进程，窗口管理、IPC 通信、构建打包 |
| [preload.js](file:///d:/TRAE_project/d/mcga-pro/electron/preload.js) | 预加载脚本，暴露安全的 API 给渲染进程 |

### 前端交互 (`/js`)
| 文件 | 功能说明 |
|------|----------|
| [main.js](file:///d:/TRAE_project/d/mcga-pro/js/main.js) | 前端主入口，页面切换、事件监听 |
| [generator.js](file:///d:/TRAE_project/d/mcga-pro/js/generator.js) | 模组生成器页面交互逻辑 |
| [market.js](file:///d:/TRAE_project/d/mcga-pro/js/market.js) | 模组市场页面交互逻辑 |
| [modpacks.js](file:///d:/TRAE_project/d/mcga-pro/js/modpacks.js) | 整合包页面交互逻辑 |
| [settings.js](file:///d:/TRAE_project/d/mcga-pro/js/settings.js) | 设置页面交互逻辑 |

### 资源文件 (`/assets`, `/css`)
| 目录 | 功能说明 |
|------|----------|
| `/assets` | 图标、图片等静态资源 |
| `/css` | 样式文件，包含主题切换功能 |

## 关键函数注释

### codeGenerator.js - 代码生成

```javascript
/**
 * 生成模组项目文件
 * @param {Object} modData - 模组数据对象，包含 modId、blocks、items 等
 * @param {Function} callback - 回调函数，返回生成的文件列表
 * 
 * 核心逻辑：
 * 1. sanitizeModData() - 清理和验证模组数据
 * 2. generateBuildGradle() - 生成 Gradle 构建配置
 * 3. generateMainClass() - 生成模组主类 Java 代码
 * 4. generateBlockClass() - 生成方块类 Java 代码
 */
function generateModProject(modData, callback) { ... }

/**
 * 清理模组数据，确保所有字段有效
 * - 过滤无效的方块/物品 ID
 * - 设置默认值（modId、mcVersion 等）
 * - 防止类名冲突（Block、Item 等保留字）
 */
function sanitizeModData(modData) { ... }

/**
 * 将 ID 转换为安全的 Java 类名
 * - 遵循 PascalCase 命名规范
 * - 避免与 Minecraft API 类名冲突
 */
function toSafeClassName(id) { ... }
```

### main.js - Electron 主进程

```javascript
/**
 * 构建模组为 JAR 文件
 * @param {String} projectDir - 项目目录路径
 * @param {Object} modData - 模组数据
 * 
 * 构建流程：
 * 1. 验证项目目录存在
 * 2. 检查 settings.gradle 文件
 * 3. 使用 archiver 打包 src/main/ 目录为 JAR
 */
ipcMain.handle('build-mod', async (event, projectDir, modData) => { ... })

/**
 * 复制内置的 Gradle Wrapper Jar 到项目目录
 * - 从 electron/assets/gradle-wrapper.jar 复制
 * - 确保构建不依赖网络下载
 */
async function copyGradleWrapperJar(projectDir) { ... }

/**
 * 处理 AI API 请求
 * - 支持 DeepSeek、GLM 等 API
 * - 通过 Node.js 发送请求，避免 CORS 限制
 */
ipcMain.handle('ai-request', async (event, options) => { ... })
```

### aiParser.js - AI 解析

```javascript
/**
 * 解析用户需求生成模组结构
 * @param {String} userInput - 用户输入的自然语言需求
 * @param {Object} config - API 配置（apiKey、model、provider）
 * @param {Function} callback - 回调函数，返回解析结果
 * 
 * 解析流程：
 * 1. 调用 AI API 解析用户输入
 * 2. 提取方块、物品、配方等信息
 * 3. 验证和补全缺失字段
 */
function parseUserInput(userInput, config, callback) { ... }

/**
 * 本地降级解析（AI API 不可用时）
 * - 基于关键词匹配生成基础模组结构
 */
function localFallbackParse(userInput) { ... }
```

### modMarket.js - 模组市场

```javascript
/**
 * 从 Modrinth API 获取模组列表
 * @param {Object} filters - 筛选条件（gameVersion、loader 等）
 * @param {Function} callback - 回调函数
 * 
 * API 端点：https://api.modrinth.com/v2/search
 */
function fetchMods(filters, callback) { ... }

/**
 * 下载模组文件
 * - 区分 Electron 和浏览器环境
 * - Electron: 通过 IPC 调用主进程下载
 * - 浏览器: 使用代理服务器下载
 */
function downloadFile(url, filename, callback) { ... }
```

## 配置文件

### settings.gradle
```groovy
pluginManagement {
    repositories {
        gradlePluginPortal()
        maven { url = 'https://maven.minecraftforge.net/' }
    }
}
rootProject.name = 'mod-id'
```

### build.gradle
```groovy
plugins {
    id 'net.minecraftforge.gradle' version '5.1.+'
    id 'java'
}
// Forge 版本映射：1.20.1 → 47.3.0, 1.21.1 → 52.0.28
dependencies {
    minecraft 'net.minecraftforge:forge:1.20.1-47.3.0'
}
```

## 项目文档

详细文档请参阅 `documents` 目录：

- [可行性分析报告](https://github.com/Renualtrity/Software-Project/blob/master/documents/2408090602029_%E5%B4%94%E9%9B%B2%E5%BF%97_%E5%8F%AF%E8%A1%8C%E6%80%A7%E5%88%86%E6%9E%90%E6%8A%A5%E5%91%8A.docx)
- [需求规格说明书](https://github.com/Renualtrity/Software-Project/blob/master/documents/2408090602029_%E5%B4%94%E9%9B%B2%E5%BF%97_%E9%9C%80%E6%B1%82%E8%A7%84%E6%A0%BC%E8%AF%B4%E6%98%8E%E4%B9%A6.docx)
- [概要设计说明书](https://github.com/Renualtrity/Software-Project/blob/master/documents/2408090602029_%E5%B4%94%E9%9B%B2%E5%BF%97_%E6%A6%82%E8%A6%81%E8%AE%BE%E8%AE%A1%E8%AF%B4%E6%98%8E%E4%B9%A6.docx)
- [详细设计说明书](https://github.com/Renualtrity/Software-Project/blob/master/documents/2408090602029_%E5%B4%94%E9%9B%B2%E5%BF%97_%E8%AF%A6%E7%BB%86%E8%AE%BE%E8%AE%A1%E8%AF%B4%E6%98%8E%E4%B9%A6.docx)
- [测试计划与报告](https://github.com/Renualtrity/Software-Project/blob/master/documents/2408090602029_%E5%B4%94%E9%9B%B2%E5%BF%97_%E6%B5%8B%E8%AF%95%E8%AE%A1%E5%88%92%E4%B8%8E%E6%8A%A5%E5%91%8A.docx)

## 许可证

MIT License

## 作者

MCGA Pro Team
