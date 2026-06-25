var MCGA = MCGA || {};
MCGA.Core = MCGA.Core || {};

(function() {
    var STATUS = {
        PENDING: 'pending',
        RUNNING: 'running',
        SUCCESS: 'success',
        FAILED: 'failed',
        TIMEOUT: 'timeout',
        CANCELED: 'canceled'
    };

    var STEPS = ['parse', 'generate', 'build', 'validate'];
    var STEP_NAMES = {
        parse: '需求解析',
        generate: '代码生成',
        build: '构建打包',
        validate: '成品校验'
    };
    var STEP_TIMEOUT = 1024 * 1000;

    var tasks = {};
    var taskCounter = 0;

    function generateTaskId() {
        taskCounter++;
        return 'task_' + Date.now() + '_' + taskCounter;
    }

    function createTask(config, userInput) {
        var taskId = generateTaskId();
        tasks[taskId] = {
            id: taskId,
            config: config || {},
            userInput: userInput || '',
            status: STATUS.PENDING,
            currentStep: null,
            stepStatus: {
                parse: STATUS.PENDING,
                generate: STATUS.PENDING,
                build: STATUS.PENDING,
                validate: STATUS.PENDING
            },
            logs: [],
            progress: 0,
            result: null,
            error: null,
            startTime: null,
            endTime: null,
            canceled: false,
            modData: null
        };
        return tasks[taskId];
    }

    function addLog(taskId, message, level) {
        level = level || 'info';
        var task = tasks[taskId];
        if (!task) return;
        var timestamp = new Date().toLocaleTimeString();
        task.logs.push({
            timestamp: timestamp,
            message: message,
            level: level
        });
        if (task.logs.length > 500) {
            task.logs = task.logs.slice(-500);
        }
    }

    function updateStepStatus(taskId, step, status) {
        var task = tasks[taskId];
        if (!task) return;
        task.stepStatus[step] = status;
        if (status === STATUS.RUNNING) {
            task.currentStep = step;
        }
        var doneCount = 0;
        for (var i = 0; i < STEPS.length; i++) {
            if (task.stepStatus[STEPS[i]] === STATUS.SUCCESS) {
                doneCount++;
            }
        }
        task.progress = Math.round((doneCount / STEPS.length) * 100);
    }

    function setTaskStatus(taskId, status, error) {
        var task = tasks[taskId];
        if (!task) return;
        task.status = status;
        if (error) {
            task.error = error;
        }
        if (status === STATUS.SUCCESS || status === STATUS.FAILED || 
            status === STATUS.TIMEOUT || status === STATUS.CANCELED) {
            task.endTime = Date.now();
        }
    }

    function validateConfig(config) {
        var errors = [];
        if (!config.modId) {
            errors.push('模组 ID 不能为空');
        } else if (!/^[a-z][a-z0-9_]{1,31}$/.test(config.modId)) {
            errors.push('模组 ID 格式不正确，需为 2-32 位小写字母、数字、下划线，且以字母开头');
        }
        if (!config.mcVersion) {
            errors.push('游戏版本不能为空');
        }
        if (!config.loader) {
            errors.push('加载器不能为空');
        }
        return errors;
    }

    MCGA.Core.startModGeneration = function(config, userInput) {
        var task = createTask(config, userInput);
        var taskId = task.id;

        setTimeout(function() {
            runGeneration(taskId);
        }, 50);

        return taskId;
    };

    function runGeneration(taskId) {
        var task = tasks[taskId];
        if (!task) return;

        task.startTime = Date.now();
        setTaskStatus(taskId, STATUS.RUNNING);
        addLog(taskId, '=== MCGA Pro 模组生成任务启动 ===', 'info');
        addLog(taskId, '模组ID: ' + task.config.modId, 'info');
        addLog(taskId, '游戏版本: ' + task.config.mcVersion, 'info');
        addLog(taskId, '加载器: ' + task.config.loader, 'info');

        var configErrors = validateConfig(task.config);
        if (configErrors.length > 0) {
            addLog(taskId, '配置校验失败:', 'error');
            for (var i = 0; i < configErrors.length; i++) {
                addLog(taskId, '  - ' + configErrors[i], 'error');
            }
            setTaskStatus(taskId, STATUS.FAILED, '配置校验失败');
            return;
        }

        runStep(taskId, 'parse');
    }

    function runStep(taskId, stepName) {
        var task = tasks[taskId];
        if (!task || task.canceled) return;

        updateStepStatus(taskId, stepName, STATUS.RUNNING);
        addLog(taskId, '[' + STEP_NAMES[stepName] + '] 开始执行...', 'info');

        var stepFunc = getStepFunction(stepName);
        if (!stepFunc) {
            addLog(taskId, '[' + STEP_NAMES[stepName] + '] 步骤函数不存在', 'error');
            updateStepStatus(taskId, stepName, STATUS.FAILED);
            setTaskStatus(taskId, STATUS.FAILED, '步骤函数缺失: ' + stepName);
            return;
        }

        var timeoutId = setTimeout(function() {
            if (task.status === STATUS.RUNNING && task.currentStep === stepName) {
                addLog(taskId, '[' + STEP_NAMES[stepName] + '] 执行超时（' + (STEP_TIMEOUT / 1000) + '秒）', 'error');
                updateStepStatus(taskId, stepName, STATUS.FAILED);
                setTaskStatus(taskId, STATUS.TIMEOUT, STEP_NAMES[stepName] + ' 步骤超时');
                task.canceled = true;
            }
        }, STEP_TIMEOUT);

        try {
            stepFunc(task, function(err, result) {
                clearTimeout(timeoutId);
                if (task.canceled) {
                    addLog(taskId, '任务已取消', 'warning');
                    updateStepStatus(taskId, stepName, STATUS.FAILED);
                    setTaskStatus(taskId, STATUS.CANCELED, '用户取消');
                    return;
                }

                if (err) {
                    addLog(taskId, '[' + STEP_NAMES[stepName] + '] 失败: ' + err.message, 'error');
                    updateStepStatus(taskId, stepName, STATUS.FAILED);
                    setTaskStatus(taskId, STATUS.FAILED, STEP_NAMES[stepName] + '失败: ' + err.message);
                    return;
                }

                addLog(taskId, '[' + STEP_NAMES[stepName] + '] 完成', 'success');
                updateStepStatus(taskId, stepName, STATUS.SUCCESS);

                if (result) {
                    if (stepName === 'parse') {
                        task.modData = result;
                    } else if (stepName === 'generate') {
                        task.projectFiles = result;
                    } else if (stepName === 'build') {
                        task.buildResult = result;
                    } else if (stepName === 'validate') {
                        task.validateResult = result;
                    }
                }

                var currentIndex = STEPS.indexOf(stepName);
                if (currentIndex < STEPS.length - 1) {
                    setTimeout(function() {
                        runStep(taskId, STEPS[currentIndex + 1]);
                    }, 200);
                } else {
                    addLog(taskId, '=== 模组生成任务全部完成 ===', 'success');
                    setTaskStatus(taskId, STATUS.SUCCESS);
                    task.progress = 100;
                    saveTaskToHistory(task);
                }
            });
        } catch (e) {
            clearTimeout(timeoutId);
            addLog(taskId, '[' + STEP_NAMES[stepName] + '] 异常: ' + e.message, 'error');
            addLog(taskId, e.stack || '', 'error');
            updateStepStatus(taskId, stepName, STATUS.FAILED);
            setTaskStatus(taskId, STATUS.FAILED, STEP_NAMES[stepName] + '异常: ' + e.message);
        }
    }

    function getStepFunction(stepName) {
        var map = {
            parse: function(task, callback) {
                var aiSettings = MCGA.Core.AIParser ? MCGA.Core.AIParser.loadAISettings() : { enabled: false };
                if (aiSettings.enabled && MCGA.Core.AIParser && MCGA.Core.AIParser.parseWithAI) {
                    addLog(task.id, '正在使用AI解析需求...', 'info');
                    MCGA.Core.AIParser.parseWithAI(task.config, task.userInput, function(err, modData) {
                        if (err) {
                            addLog(task.id, 'AI解析失败: ' + err.message + '，回退到本地解析', 'warning');
                            fallbackParse(task, callback);
                        } else {
                            addLog(task.id, 'AI解析成功，设计了 ' + (modData.blocks ? modData.blocks.length : 0) + ' 个方块, ' + (modData.items ? modData.items.length : 0) + ' 个物品, ' + (modData.recipes ? modData.recipes.length : 0) + ' 个配方', 'success');
                            callback(null, modData);
                        }
                    });
                } else {
                    fallbackParse(task, callback);
                }
            },
            generate: function(task, callback) {
                if (MCGA.Core.CodeGenerator && MCGA.Core.CodeGenerator.generateModProject) {
                    MCGA.Core.CodeGenerator.generateModProject(task.modData, callback);
                } else {
                    callback(null, {
                        files: {},
                        structure: {}
                    });
                }
            },
            build: function(task, callback) {
                if (MCGA.Core.BuildEngine && MCGA.Core.BuildEngine.buildModJar) {
                    MCGA.Core.BuildEngine.buildModJar(task.projectFiles, task.modData, callback);
                } else {
                    callback(null, {
                        jarBlob: null,
                        jarName: (task.config.modName || task.config.modId) + '-' + task.config.mcVersion + '-' + (task.config.modVersion || '1.0.0') + '.jar',
                        sourceZipBlob: null,
                        buildLog: ['模拟构建完成（真实构建需在桌面端运行）']
                    });
                }
            },
            validate: function(task, callback) {
                if (MCGA.Core.ModValidator && MCGA.Core.ModValidator.validateModJar) {
                    MCGA.Core.ModValidator.validateModJar(task.buildResult, task.modData, callback);
                } else {
                    callback(null, {
                        passed: true,
                        issues: [],
                        warnings: []
                    });
                }
            }
        };
        return map[stepName];
    }

    function fallbackParse(task, callback) {
        if (MCGA.Core.ModParser && MCGA.Core.ModParser.parseRequirement) {
            MCGA.Core.ModParser.parseRequirement(task.config, task.userInput, callback);
        } else {
            callback(null, {
                modId: task.config.modId,
                modName: task.config.modName || task.config.modId,
                version: task.config.modVersion || '1.0.0',
                mcVersion: task.config.mcVersion,
                loader: task.config.loader,
                author: task.config.author || 'MCGA',
                description: task.userInput || '由 MCGA Pro 生成的模组',
                features: [],
                blocks: [],
                items: [],
                recipes: []
            });
        }
    }

    function saveTaskToHistory(task) {
        try {
            var history = JSON.parse(localStorage.getItem('mcga_mod_history') || '[]');
            var record = {
                id: task.id,
                modId: task.config.modId,
                modName: task.config.modName || task.config.modId,
                mcVersion: task.config.mcVersion,
                loader: task.config.loader,
                version: task.config.modVersion || '1.0.0',
                author: task.config.author || '',
                description: task.userInput || '',
                status: task.status,
                createdAt: task.startTime,
                finishedAt: task.endTime,
                modData: task.modData,
                buildResult: task.buildResult,
                validateResult: task.validateResult
            };
            history.unshift(record);
            if (history.length > 100) {
                history = history.slice(0, 100);
            }
            localStorage.setItem('mcga_mod_history', JSON.stringify(history));
        } catch (e) {
            console.error('保存历史记录失败:', e);
        }
    }

    MCGA.Core.getGenerationStatus = function(taskId) {
        var task = tasks[taskId];
        if (!task) {
            return {
                exists: false,
                status: 'unknown',
                message: '任务不存在'
            };
        }
        return {
            exists: true,
            id: task.id,
            status: task.status,
            currentStep: task.currentStep,
            stepStatus: task.stepStatus,
            progress: task.progress,
            logs: task.logs,
            result: task.result,
            error: task.error,
            modData: task.modData,
            buildResult: task.buildResult,
            validateResult: task.validateResult,
            startTime: task.startTime,
            endTime: task.endTime,
            config: task.config
        };
    };

    MCGA.Core.cancelGeneration = function(taskId) {
        var task = tasks[taskId];
        if (!task) return false;
        if (task.status === STATUS.RUNNING) {
            task.canceled = true;
            addLog(taskId, '正在取消任务...', 'warning');
            return true;
        }
        return false;
    };

    MCGA.Core.getTaskHistory = function() {
        try {
            return JSON.parse(localStorage.getItem('mcga_mod_history') || '[]');
        } catch (e) {
            return [];
        }
    };

    MCGA.Core.deleteTaskHistory = function(taskId) {
        try {
            var history = JSON.parse(localStorage.getItem('mcga_mod_history') || '[]');
            history = history.filter(function(item) {
                return item.id !== taskId;
            });
            localStorage.setItem('mcga_mod_history', JSON.stringify(history));
            return true;
        } catch (e) {
            return false;
        }
    };

    MCGA.Core.getTaskById = function(taskId) {
        var history = MCGA.Core.getTaskHistory();
        for (var i = 0; i < history.length; i++) {
            if (history[i].id === taskId) {
                return history[i];
            }
        }
        return null;
    };

    MCGA.Core.STATUS = STATUS;
})();

function startModGeneration(config, userInput) {
    return MCGA.Core.startModGeneration(config, userInput);
}

function getGenerationStatus(taskId) {
    return MCGA.Core.getGenerationStatus(taskId);
}

function cancelModGeneration(taskId) {
    return MCGA.Core.cancelGeneration(taskId);
}