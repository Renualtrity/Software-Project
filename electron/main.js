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

// 下载Gradle Wrapper JAR
async function downloadGradleWrapperJar(projectDir, onLog) {
    const wrapperDir = path.join(projectDir, 'gradle', 'wrapper');
    const jarPath = path.join(wrapperDir, 'gradle-wrapper.jar');
    
    if (!fs.existsSync(wrapperDir)) {
        fs.mkdirSync(wrapperDir, { recursive: true });
    }
    
    if (fs.existsSync(jarPath)) {
        return jarPath;
    }
    
    const jarUrl = 'https://services.gradle.org/distributions/gradle-8.1.1-bin.zip';
    const tempZipPath = path.join(wrapperDir, 'gradle-temp.zip');
    
    return new Promise((resolve, reject) => {
        const https = require('https');
        const http = require('http');
        const urlObj = new URL('https://raw.githubusercontent.com/gradle/gradle/v8.1.1/gradle/wrapper/gradle-wrapper.jar');
        const protocol = urlObj.protocol === 'https:' ? https : http;
        
        const file = fs.createWriteStream(jarPath);
        const req = protocol.get(urlObj, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                file.close();
                fs.unlink(jarPath, () => {});
                const redirectUrl = new URL(res.headers.location, urlObj);
                const proto = redirectUrl.protocol === 'https:' ? https : http;
                const redirectReq = proto.get(redirectUrl, (res2) => {
                    if (res2.statusCode !== 200) {
                        reject(new Error('下载失败: HTTP ' + res2.statusCode));
                        return;
                    }
                    res2.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve(jarPath);
                    });
                });
                redirectReq.on('error', reject);
                return;
            }
            
            if (res.statusCode !== 200) {
                file.close();
                fs.unlink(jarPath, () => {});
                reject(new Error('下载失败: HTTP ' + res.statusCode));
                return;
            }
            
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(jarPath);
            });
        });
        
        req.on('error', (err) => {
            file.close();
            fs.unlink(jarPath, () => {});
            reject(err);
        });
    });
}

// 执行Gradle构建
ipcMain.handle('build-mod', async (event, projectDir, modData) => {
    const logs = [];
    const startTime = Date.now();

    logs.push('=== MCGA Pro 模组构建 ===');
    logs.push('项目目录: ' + projectDir);
    logs.push('模组ID: ' + modData.modId);
    logs.push('开始时间: ' + new Date().toLocaleString());
    logs.push('');

    const gradlewPath = process.platform === 'win32' 
        ? path.join(projectDir, 'gradlew.bat')
        : path.join(projectDir, 'gradlew');
    const wrapperJarPath = path.join(projectDir, 'gradle', 'wrapper', 'gradle-wrapper.jar');

    let gradleCmd = null;

    if (fs.existsSync(gradlewPath) && fs.existsSync(wrapperJarPath)) {
        gradleCmd = gradlewPath;
        logs.push('使用项目 Gradle Wrapper');
        logs.push('');
    } else {
        logs.push('[准备] 检查系统 Gradle...');
        const hasSystemGradle = await new Promise((res) => {
            exec('gradle -version', (err) => res(!err));
        });

        if (hasSystemGradle) {
            gradleCmd = 'gradle';
            logs.push('使用系统 Gradle');
            logs.push('');
        } else {
            logs.push('系统未安装 Gradle，尝试下载 Gradle Wrapper...');
            event.sender.send('build-status', { stage: 'downloading', progress: 5 });

            try {
                await downloadGradleWrapperJar(projectDir, (log) => {
                    logs.push(log);
                    event.sender.send('build-log', log);
                });
                
                if (process.platform === 'win32') {
                    fs.chmodSync(gradlewPath, 0o755);
                }
                
                gradleCmd = gradlewPath;
                logs.push('Gradle Wrapper 下载完成');
                logs.push('');
            } catch (err) {
                logs.push('[错误] Gradle Wrapper 下载失败: ' + err.message);
                logs.push('');
                logs.push('请手动安装 Gradle 或检查网络连接');
                return { success: false, error: '未找到 Gradle 且 Wrapper 下载失败', logs: logs };
            }
        }
    }

    event.sender.send('build-status', { stage: 'building', progress: 10 });
    logs.push('[构建] 执行 Gradle 构建...');
    logs.push('命令: ' + gradleCmd + ' build');
    logs.push('提示：首次构建需要下载依赖（5~15分钟），请耐心等待');
    logs.push('');

    return new Promise((resolve) => {
        // Windows上运行.bat需要特殊处理，否则stdout无法捕获
        var buildCmd, buildArgs;
        if (process.platform === 'win32' && gradleCmd.endsWith('.bat')) {
            buildCmd = 'cmd';
            buildArgs = ['/c', gradleCmd, 'build', '--no-daemon'];
        } else {
            buildCmd = gradleCmd;
            buildArgs = ['build', '--no-daemon'];
        }

        logs.push('[执行] ' + buildCmd + ' ' + buildArgs.join(' '));
        logs.push('');

        const buildProcess = spawn(buildCmd, buildArgs, {
            cwd: projectDir,
            env: { ...process.env, JAVA_HOME: process.env.JAVA_HOME || '' },
            stdio: ['ignore', 'pipe', 'pipe']
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
            if (msg) {
                logs.push('[STDERR] ' + msg);
                event.sender.send('build-log', '[STDERR] ' + msg);
            }
        });

        buildProcess.on('close', (code) => {
            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000).toFixed(1);

            logs.push('');
            logs.push('构建进程结束 (退出码: ' + code + ')');
            logs.push('总耗时: ' + duration + ' 秒');
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

                if (jarFile && fs.existsSync(jarFile)) {
                    const stats = fs.statSync(jarFile);
                    logs.push('=== 构建成功 ===');
                    logs.push('生成文件: ' + jarName);
                    logs.push('文件大小: ' + (stats.size / 1024).toFixed(1) + ' KB');
                    logs.push('完整路径: ' + jarFile);
                    logs.push('');

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
                    logs.push('=== 构建完成但未找到 JAR ===');
                    logs.push('请检查 build/libs 目录');
                    logs.push('');

                    event.sender.send('build-status', { stage: 'warning', progress: 100 });
                    resolve({
                        success: false,
                        error: 'JAR 文件未生成',
                        logs: logs,
                        jarDir: buildLibsDir
                    });
                }
            } else {
                logs.push('=== 构建失败 ===');
                logs.push('退出码: ' + code);
                logs.push('');
                logs.push('常见问题排查:');
                logs.push('  1. Java 版本不兼容（需要 JDK 17+）');
                logs.push('  2. 网络问题导致依赖下载失败');
                logs.push('  3. 源码编译错误（请查看上方日志）');
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