const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
    // 环境检测
    checkEnvironment: () => ipcRenderer.invoke('check-environment'),

    // 文件/目录选择
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    selectFile: (options) => ipcRenderer.invoke('select-file', options),

    // 项目写入
    writeProject: (projectDir, files) => ipcRenderer.invoke('write-project', projectDir, files),

    // Gradle构建
    buildMod: (projectDir, modData) => ipcRenderer.invoke('build-mod', projectDir, modData),

    // 构建状态监听
    onBuildStatus: (callback) => {
        ipcRenderer.on('build-status', (event, data) => callback(data));
    },
    onBuildLog: (callback) => {
        ipcRenderer.on('build-log', (event, log) => callback(log));
    },

    // 文件操作
    openDirectory: (dirPath) => ipcRenderer.invoke('open-directory', dirPath),
    openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),

    // ZIP创建
    createZip: (sourceDir, outputPath) => ipcRenderer.invoke('create-zip', sourceDir, outputPath),

    // 应用信息
    getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getAppPath: () => ipcRenderer.invoke('get-app-path'),

    // AI请求
    aiRequest: (options) => ipcRenderer.invoke('ai-request', options),

    // 下载
    downloadFile: (url, savePath) => ipcRenderer.invoke('download-file', url, savePath)
});

// 检测是否在Electron环境
contextBridge.exposeInMainWorld('isElectron', true);