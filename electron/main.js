const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const archiver = require('archiver');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        title: 'MCGA Pro - Minecraft AI 模组生成系统',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        show: false
    });

    mainWindow.loadFile(path.join(__dirname, '../index.html'));

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC Handlers

// 检测环境
ipcMain.handle('check-environment', async () => {
    const env = {
        java: await checkJava(),
        gradle: await checkGradle(),
        node: process.version,
        platform: process.platform,
        arch: process.arch
    };
    return env;
});

async function checkJava() {
    return new Promise((resolve) => {
        exec('java -version', (error, stdout, stderr) => {
            if (error) {
                resolve({ installed: false, error: error.message });
            } else {
                const versionMatch = stderr.match(/version "([^"]+)"/) || stdout.match(/version "([^"]+)"/);
                resolve({
                    installed: true,
                    version: versionMatch ? versionMatch[1] : 'unknown',
                    output: stderr || stdout
                });
            }
        });
    });
}

async function checkGradle() {
    return new Promise((resolve) => {
        exec('gradle -version', (error, stdout, stderr) => {
            if (error) {
                // 检查是否有gradlew
                resolve({ installed: false, error: error.message, hasGradlew: false });
            } else {
                const versionMatch = stdout.match(/Gradle\s+(\d+\.\d+)/);
                resolve({
                    installed: true,
                    version: versionMatch ? versionMatch[1] : 'unknown',
                    output: stdout
                });
            }
        });
    });
}

// 选择目录
ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'createDirectory'],
        title: '选择输出目录'
    });
    return result.canceled ? null : result.filePaths[0];
});

// 选择文件
ipcMain.handle('select-file', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: options?.filters || [{ name: 'All Files', extensions: ['*'] }],
        title: options?.title || '选择文件'
    });
    return result.canceled ? null : result.filePaths[0];
});

// 写入项目文件
ipcMain.handle('write-project', async (event, projectDir, files) => {
    try {
        // 创建目录
        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir, { recursive: true });
        }

        // 写入所有文件
        for (const filePath in files) {
            const fullPath = path.join(projectDir, filePath);
            const dirPath = path.dirname(fullPath);

            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            fs.writeFileSync(fullPath, files[filePath], 'utf8');
        }

        return { success: true, path: projectDir };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// 执行Gradle构建
ipcMain.handle('build-mod', async (event, projectDir, modData) => {
    return new Promise((resolve) => {
        const logs = [];
        const startTime = Date.now();

        logs.push('=== MCGA Pro 模组构建 ===');
        logs.push('项目目录: ' + projectDir);
        logs.push('模组ID: ' + modData.modId);
        logs.push('开始时间: ' + new Date().toLocaleString());
        logs.push('');

        // 检查gradlew
        const gradlewPath = process.platform === 'win32' 
            ? path.join(projectDir, 'gradlew.bat')
            : path.join(projectDir, 'gradlew');

        let gradleCmd;
        if (fs.existsSync(gradlewPath)) {
            gradleCmd = gradlewPath;
            logs.push('使用项目内置 Gradle Wrapper');
        } else {
            gradleCmd = 'gradle';
            logs.push('使用系统 Gradle');
        }
        logs.push('');

        // 先初始化Gradle wrapper（如果没有）
        if (!fs.existsSync(gradlewPath)) {
            logs.push('[1/4] 初始化 Gradle Wrapper...');
            const initGradle = spawn('gradle', ['wrapper'], { cwd: projectDir, shell: true });
            
            initGradle.stdout.on('data', (data) => {
                logs.push(data.toString().trim());
                event.sender.send('build-log', data.toString().trim());
            });
            initGradle.stderr.on('data', (data) => {
                logs.push('[ERROR] ' + data.toString().trim());
                event.sender.send('build-log', '[ERROR] ' + data.toString().trim());
            });
        }

        logs.push('[2/4] 执行 Gradle 构建...');
        logs.push('命令: ' + gradleCmd + ' build');
        logs.push('');

        event.sender.send('build-status', { stage: 'building', progress: 50 });

        const buildProcess = spawn(gradleCmd, ['build', '--no-daemon'], {
            cwd: projectDir,
            shell: true,
            env: { ...process.env, JAVA_HOME: process.env.JAVA_HOME || '' }
        });

        buildProcess.stdout.on('data', (data) => {
            const msg = data.toString().trim();
            if (msg) {
                logs.push(msg);
                event.sender.send('build-log', msg);
            }
        });

        buildProcess.stderr.on('data', (data) => {
            const msg = data.toString().trim();
            if (msg && !msg.includes('Deprecated Gradle features')) {
                logs.push('[WARN] ' + msg);
                event.sender.send('build-log', '[WARN] ' + msg);
            }
        });

        buildProcess.on('close', (code) => {
            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000).toFixed(1);

            logs.push('');
            logs.push('[3/4] 构建进程结束 (退出码: ' + code + ')');
            logs.push('耗时: ' + duration + ' 秒');
            logs.push('');

            if (code === 0) {
                // 查找生成的jar
                const buildLibsDir = path.join(projectDir, 'build', 'libs');
                let jarFile = null;
                let jarName = null;

                if (fs.existsSync(buildLibsDir)) {
                    const files = fs.readdirSync(buildLibsDir);
                    for (const f of files) {
                        if (f.endsWith('.jar') && !f.includes('sources') && !f.includes('javadoc')) {
                            jarFile = path.join(buildLibsDir, f);
                            jarName = f;
                            break;
                        }
                    }
                }

                logs.push('[4/4] 检查输出文件...');
                if (jarFile && fs.existsSync(jarFile)) {
                    const stats = fs.statSync(jarFile);
                    logs.push('生成成功: ' + jarName);
                    logs.push('文件大小: ' + (stats.size / 1024).toFixed(1) + ' KB');
                    logs.push('完整路径: ' + jarFile);
                    logs.push('');
                    logs.push('=== 构建成功 ===');

                    event.sender.send('build-status', { 
                        stage: 'success', 
                        progress: 100, 
                        jarPath: jarFile,
                        jarName: jarName
                    });

                    resolve({
                        success: true,
                        jarPath: jarFile,
                        jarName: jarName,
                        jarSize: stats.size,
                        logs: logs,
                        duration: duration
                    });
                } else {
                    logs.push('警告: 未找到生成的 JAR 文件');
                    logs.push('请检查 build/libs 目录');
                    logs.push('');
                    logs.push('=== 构建完成但无输出 ===');

                    event.sender.send('build-status', { stage: 'warning', progress: 100 });
                    resolve({
                        success: false,
                        error: 'JAR 文件未生成',
                        logs: logs,
                        jarDir: buildLibsDir
                    });
                }
            } else {
                logs.push('');
                logs.push('=== 构建失败 ===');
                logs.push('请检查上方日志中的错误信息');
                logs.push('常见问题:');
                logs.push('  1. Java 版本不兼容（需要 JDK 17+）');
                logs.push('  2. Gradle 未安装或版本过低');
                logs.push('  3. 源码编译错误');
                logs.push('');

                event.sender.send('build-status', { stage: 'failed', progress: 100 });
                resolve({
                    success: false,
                    error: 'Gradle 构建失败，退出码 ' + code,
                    logs: logs
                });
            }
        });

        buildProcess.on('error', (err) => {
            logs.push('');
            logs.push('[ERROR] 构建进程启动失败: ' + err.message);
            logs.push('');
            logs.push('可能原因:');
            logs.push('  1. Gradle 未安装');
            logs.push('  2. Java 未安装或 JAVA_HOME 未配置');
            logs.push('  3. gradlew 脚本不可执行');
            logs.push('');

            event.sender.send('build-status', { stage: 'error', progress: 100 });
            resolve({
                success: false,
                error: err.message,
                logs: logs
            });
        });
    });
});

// 打开目录
ipcMain.handle('open-directory', async (event, dirPath) => {
    shell.openPath(dirPath);
    return true;
});

// 打开文件
ipcMain.handle('open-file', async (event, filePath) => {
    shell.openPath(filePath);
    return true;
});

// 读取文件
ipcMain.handle('read-file', async (event, filePath) => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return { success: true, content };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// 创建ZIP
ipcMain.handle('create-zip', async (event, sourceDir, outputPath) => {
    return new Promise((resolve) => {
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            resolve({
                success: true,
                path: outputPath,
                size: archive.pointer()
            });
        });

        archive.on('error', (err) => {
            resolve({ success: false, error: err.message });
        });

        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
});

// 获取用户数据目录
ipcMain.handle('get-user-data-path', async () => {
    return app.getPath('userData');
});

// 获取应用版本
ipcMain.handle('get-app-version', async () => {
    return app.getVersion();
});

// 获取应用路径
ipcMain.handle('get-app-path', async () => {
    return app.getAppPath();
});

// AI请求代理（避免CORS）
ipcMain.handle('ai-request', async (event, options) => {
    const http = require('http');
    const https = require('https');

    return new Promise((resolve) => {
        const urlObj = new URL(options.url);
        const protocol = urlObj.protocol === 'https:' ? https : http;

        const reqOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + options.apiKey,
                'User-Agent': 'MCGA-Pro/' + app.getVersion()
            }
        };

        const req = protocol.request(reqOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const data = JSON.parse(body);
                        const content = data.choices?.[0]?.message?.content || '';
                        resolve({ success: true, content, raw: data });
                    } catch (e) {
                        resolve({ success: false, error: 'Parse error', raw: body });
                    }
                } else {
                    resolve({ success: false, error: 'API error: ' + res.statusCode, raw: body });
                }
            });
        });

        req.on('error', (err) => {
            resolve({ success: false, error: err.message });
        });

        req.write(JSON.stringify({
            model: options.model,
            messages: options.messages,
            temperature: options.temperature || 0.7,
            max_tokens: 4096,
            stream: false
        }));
        req.end();
    });
});

// 下载文件
ipcMain.handle('download-file', async (event, url, savePath) => {
    const http = require('http');
    const https = require('https');

    return new Promise((resolve) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;

        const file = fs.createWriteStream(savePath);

        protocol.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // 处理重定向
                file.close();
                fs.unlinkSync(savePath);
                return ipcMain.invoke('download-file', event, res.headers.location, savePath);
            }

            if (res.statusCode !== 200) {
                file.close();
                fs.unlinkSync(savePath);
                return resolve({ success: false, error: 'HTTP ' + res.statusCode });
            }

            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve({ success: true, path: savePath, size: fs.statSync(savePath).size });
            });
        }).on('error', (err) => {
            file.close();
            fs.unlinkSync(savePath);
            resolve({ success: false, error: err.message });
        });
    });
});