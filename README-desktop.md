# MCGA Pro - Minecraft AI 模组生成系统

## 🖥️ 桌面端版本 (Electron)

桌面端版本支持真实的Gradle编译，可以生成可运行的JAR文件！

### 系统要求

- **Node.js** 18+ 
- **JDK** 17 或更高版本
- **Gradle** 7.5+ (可选，项目会自动生成Gradle Wrapper)

### 快速启动

1. **双击 `start-desktop.bat`** 启动桌面端
2. 或手动启动：
   ```bash
   npm install
   npm start
   ```

### 功能对比

| 功能 | 网页版 | 桌面端 |
|------|--------|--------|
| AI设计MOD | ✅ | ✅ |
| 生成Java源码 | ✅ | ✅ |
| 真实Gradle编译 | ❌ | ✅ |
| 生成可运行JAR | ❌ | ✅ |
| 本地项目导出 | 源码ZIP | 真实JAR |

### 构建流程

桌面端构建流程：
1. AI解析需求 → 设计MOD结构
2. 生成Java源码 + Gradle配置
3. 选择输出目录
4. 写入项目文件
5. 调用本地Gradle编译
6. 输出可运行JAR文件

### 常见问题

**Q: 构建失败提示Java未安装？**
A: 安装JDK 17+，并确保`JAVA_HOME`环境变量正确配置。

**Q: Gradle构建很慢？**
A: 第一次构建需要下载依赖，之后会快很多。耐心等待即可。

**Q: 找不到生成的JAR？**
A: JAR文件位于 `项目目录/build/libs/` 下。

### 目录结构

```
mcga-pro/
├── electron/           # Electron主进程
│   ├── main.js         # 主进程入口
│   └── preload.js      # 预加载脚本
├── core/               # 核心业务逻辑
├── js/                 # 前端交互
├── css/                # 样式
├── index.html          # 主页面
├── package.json        # 项目配置
└── start-desktop.bat   # 启动脚本
```

---

## 🌐 网页版

网页版仍可通过 `node server.js` 启动，访问 http://localhost:8080

网页版功能：
- AI设计MOD结构
- 生成Java源码文件
- 下载源码ZIP包（需要桌面端编译）
- 模组市场/整合包下载
- 模组管理

---

## 📦 打包发布

打包成可安装程序：
```bash
npm run build
```

输出位于 `dist/` 目录。