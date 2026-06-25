var MCGA = MCGA || {};
MCGA.Generator = (function() {
    var currentTaskId = null;
    var pollInterval = null;
    var currentLogLevel = 'all';
    
    function startGeneration() {
        try {
            var modId = document.getElementById('mod-id').value.trim();
            var modName = document.getElementById('mod-name').value.trim();
            var mcVersion = document.getElementById('mc-version').value;
            var loader = document.getElementById('mod-loader').value;
            var modVersion = document.getElementById('mod-version').value.trim();
            var author = document.getElementById('mod-author').value.trim();
            var description = document.getElementById('mod-description').value.trim();
            
            if (!modId) {
                MCGA.showNotification('请输入模组 ID', 'error');
                return;
            }
            
            if (!/^[a-z][a-z0-9_]{1,31}$/.test(modId)) {
                MCGA.showNotification('模组 ID 格式不正确', 'error');
                return;
            }
            
            if (!description) {
                MCGA.showNotification('请输入需求描述', 'error');
                return;
            }
            
            var config = {
                modId: modId,
                modName: modName || modId,
                mcVersion: mcVersion,
                loader: loader,
                modVersion: modVersion || '1.0.0',
                author: author || 'MCGA Pro'
            };
            
            var taskId = startModGeneration(config, description);
            currentTaskId = taskId;
            
            resetProgressUI();
            setButtonsDisabled(true);
            document.getElementById('log-actions').style.display = 'flex';
            
            pollInterval = setInterval(function() {
                pollStatus(taskId);
            }, 500);
            
            MCGA.showNotification('生成任务已启动', 'info');
        } catch (e) {
            console.error('startGeneration error:', e);
            MCGA.showNotification('启动失败: ' + e.message, 'error');
            setButtonsDisabled(false);
        }
    }
    
    function pollStatus(taskId) {
        try {
            var status = getGenerationStatus(taskId);
            if (!status || !status.exists) {
                clearInterval(pollInterval);
                return;
            }
            
            updateProgressUI(status);
            updateLogDisplay(status.logs);
            
            if (status.status === 'success' || status.status === 'failed' || 
                status.status === 'timeout' || status.status === 'canceled') {
                clearInterval(pollInterval);
                setButtonsDisabled(false);
                document.getElementById('log-actions').style.display = 'none';
                
                if (status.status === 'success') {
                    MCGA.showNotification('模组生成成功！', 'success');
                } else if (status.status === 'failed') {
                    MCGA.showNotification('生成失败: ' + (status.error || '未知错误'), 'error');
                } else if (status.status === 'timeout') {
                    MCGA.showNotification('生成超时', 'warning');
                } else if (status.status === 'canceled') {
                    MCGA.showNotification('已取消生成', 'warning');
                }
            }
        } catch (e) {
            console.error('pollStatus error:', e);
        }
    }
    
    function resetProgressUI() {
        var steps = ['parse', 'generate', 'build', 'validate'];
        for (var i = 0; i < steps.length; i++) {
            var stepEl = document.getElementById('step-' + steps[i]);
            if (stepEl) {
                stepEl.classList.remove('active', 'done', 'error');
            }
        }
        var logOutput = document.getElementById('log-output');
        if (logOutput) {
            logOutput.innerHTML = '';
        }
    }
    
    function updateProgressUI(status) {
        var steps = ['parse', 'generate', 'build', 'validate'];
        for (var i = 0; i < steps.length; i++) {
            var step = steps[i];
            var stepEl = document.getElementById('step-' + step);
            if (!stepEl) continue;
            
            stepEl.classList.remove('active', 'done', 'error');
            
            var stepStatus = status.stepStatus ? status.stepStatus[step] : 'pending';
            if (stepStatus === 'running') {
                stepEl.classList.add('active');
            } else if (stepStatus === 'success') {
                stepEl.classList.add('done');
            } else if (stepStatus === 'failed') {
                stepEl.classList.add('error');
            }
        }
    }
    
    function updateLogDisplay(logs) {
        var logOutput = document.getElementById('log-output');
        if (!logOutput || !logs) return;
        
        var html = '';
        for (var i = 0; i < logs.length; i++) {
            var log = logs[i];
            if (currentLogLevel !== 'all' && log.level !== currentLogLevel) {
                continue;
            }
            html += '<div class="log-line ' + log.level + '">[' + log.timestamp + '] ' + log.message + '</div>';
        }
        
        if (html === '') {
            html = '<p class="log-empty">暂无日志</p>';
        }
        
        logOutput.innerHTML = html;
        logOutput.scrollTop = logOutput.scrollHeight;
    }
    
    function filterLog(level) {
        currentLogLevel = level;
        
        var btns = document.querySelectorAll('.filter-btn');
        for (var i = 0; i < btns.length; i++) {
            btns[i].classList.remove('active');
            if (btns[i].getAttribute('data-level') === level) {
                btns[i].classList.add('active');
            }
        }
        
        if (currentTaskId) {
            var status = getGenerationStatus(currentTaskId);
            if (status) {
                updateLogDisplay(status.logs);
            }
        }
    }
    
    function setButtonsDisabled(disabled) {
        var btn = document.getElementById('btn-start-gen');
        if (btn) {
            btn.disabled = disabled;
            btn.textContent = disabled ? '生成中...' : '🚀 开始生成';
        }
    }
    
    function cancelGeneration() {
        if (!currentTaskId) return;
        cancelModGeneration(currentTaskId);
    }
    
    function validateModId(value) {
        var hint = document.getElementById('mod-id-hint');
        if (!hint) return;
        
        if (!value) {
            hint.textContent = '全小写字母、数字、下划线，2-32 个字符';
            hint.className = 'hint';
            return;
        }
        
        var result = MCGA.Core.ModParser ? 
            MCGA.Core.ModParser.validateModId(value) : 
            { valid: /^[a-z][a-z0-9_]{1,31}$/.test(value), errors: [], warnings: [] };
        
        if (!result.valid) {
            hint.textContent = result.errors.length > 0 ? result.errors[0] : '格式不正确';
            hint.className = 'hint error';
        } else if (result.warnings && result.warnings.length > 0) {
            hint.textContent = result.warnings[0];
            hint.className = 'hint warning';
        } else {
            hint.textContent = '✓ 格式正确';
            hint.className = 'hint success';
        }
    }
    
    function showTemplateLibrary() {
        var modal = document.getElementById('template-modal');
        var grid = document.getElementById('template-grid');
        if (!modal || !grid) return;
        
        var templates = MCGA.Core.ModParser ? MCGA.Core.ModParser.getTemplates() : [];
        var userTemplates = MCGA.Core.ModUtils ? MCGA.Core.ModUtils.getUserTemplates() : [];
        var allTemplates = userTemplates.concat(templates);
        
        var html = '';
        for (var i = 0; i < allTemplates.length; i++) {
            var t = allTemplates[i];
            html += '<div class="template-item" onclick="MCGA.Generator.applyTemplate(\'' + t.id + '\', ' + t.isUser + ')">' +
                '<h4>' + (t.icon || '📋') + ' ' + t.name + '</h4>' +
                '<p>' + (t.description || '') + '</p>' +
                '</div>';
        }
        grid.innerHTML = html;
        
        modal.style.display = 'flex';
    }
    
    function applyTemplate(templateId, isUser) {
        var template = null;
        
        if (isUser && MCGA.Core.ModUtils) {
            var userTpls = MCGA.Core.ModUtils.getUserTemplates();
            for (var i = 0; i < userTpls.length; i++) {
                if (userTpls[i].id === templateId) {
                    template = userTpls[i];
                    break;
                }
            }
        } else if (MCGA.Core.ModParser) {
            template = MCGA.Core.ModParser.getTemplateById(templateId);
        }
        
        if (template && template.template) {
            var descEl = document.getElementById('mod-description');
            if (descEl) {
                descEl.value = template.template;
            }
            closeModal('template-modal');
            MCGA.showNotification('已应用模板: ' + template.name, 'success');
        }
    }
    
    return {
        startGeneration: startGeneration,
        cancelGeneration: cancelGeneration,
        filterLog: filterLog,
        validateModId: validateModId,
        showTemplateLibrary: showTemplateLibrary,
        applyTemplate: applyTemplate
    };
})();

function startGeneration() {
    MCGA.Generator.startGeneration();
}

function cancelGeneration() {
    MCGA.Generator.cancelGeneration();
}

function filterLog(level) {
    MCGA.Generator.filterLog(level);
}

function validateModId(value) {
    MCGA.Generator.validateModId(value);
}

function showTemplateLibrary() {
    MCGA.Generator.showTemplateLibrary();
}