var MCGA = MCGA || {};
MCGA.Core = MCGA.Core || {};

MCGA.Core.ModUtils = (function() {
    var STORAGE_KEY = 'mcga_mod_history';
    var TEMPLATES_KEY = 'mcga_user_templates';
    var SETTINGS_KEY = 'mcga_settings';

    function getModHistory() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function saveModHistory(history) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
            return true;
        } catch (e) {
            return false;
        }
    }

    function addMod(mod) {
        var history = getModHistory();
        history.unshift(mod);
        if (history.length > 200) {
            history = history.slice(0, 200);
        }
        saveModHistory(history);
        return mod;
    }

    function updateMod(modId, updates) {
        var history = getModHistory();
        var updated = false;
        for (var i = 0; i < history.length; i++) {
            if (history[i].id === modId) {
                history[i] = Object.assign({}, history[i], updates);
                updated = true;
                break;
            }
        }
        if (updated) {
            saveModHistory(history);
        }
        return updated;
    }

    function deleteMod(modId) {
        var history = getModHistory();
        var newHistory = history.filter(function(m) {
            return m.id !== modId;
        });
        saveModHistory(newHistory);
        return newHistory.length !== history.length;
    }

    function getModById(modId) {
        var history = getModHistory();
        for (var i = 0; i < history.length; i++) {
            if (history[i].id === modId) {
                return history[i];
            }
        }
        return null;
    }

    function searchMods(keyword, filters) {
        var history = getModHistory();
        keyword = (keyword || '').toLowerCase();
        filters = filters || {};

        return history.filter(function(mod) {
            if (keyword) {
                var match = false;
                if (mod.modId && mod.modId.toLowerCase().indexOf(keyword) !== -1) match = true;
                if (mod.modName && mod.modName.toLowerCase().indexOf(keyword) !== -1) match = true;
                if (mod.description && mod.description.toLowerCase().indexOf(keyword) !== -1) match = true;
                if (!match) return false;
            }
            if (filters.mcVersion && mod.mcVersion !== filters.mcVersion) return false;
            if (filters.loader && mod.loader !== filters.loader) return false;
            if (filters.status && mod.status !== filters.status) return false;
            return true;
        });
    }

    function getStats() {
        var history = getModHistory();
        var success = 0;
        var failed = 0;
        for (var i = 0; i < history.length; i++) {
            if (history[i].status === 'success') success++;
            else if (history[i].status === 'failed') failed++;
        }
        return {
            total: history.length,
            success: success,
            failed: failed,
            recent: history.slice(0, 5)
        };
    }

    function detectConflicts(modIds) {
        var history = getModHistory();
        var conflicts = [];
        var idMap = {};

        for (var i = 0; i < history.length; i++) {
            var mod = history[i];
            if (modIds.indexOf(mod.modId) !== -1) {
                if (idMap[mod.modId]) {
                    conflicts.push({
                        modId: mod.modId,
                        type: 'duplicate',
                        mods: [idMap[mod.modId], mod]
                    });
                } else {
                    idMap[mod.modId] = mod;
                }
            }
        }

        return {
            hasConflict: conflicts.length > 0,
            conflicts: conflicts
        };
    }

    function exportModsAsZip(modIds) {
        var history = getModHistory();
        var selected = history.filter(function(m) {
            return modIds.indexOf(m.id) !== -1;
        });

        var readme = '# 模组批量导出\n\n';
        readme += '导出时间: ' + new Date().toLocaleString() + '\n';
        readme += '模组数量: ' + selected.length + '\n\n';
        readme += '## 模组列表\n\n';

        for (var i = 0; i < selected.length; i++) {
            var mod = selected[i];
            readme += '### ' + mod.modName + '\n';
            readme += '- 模组ID: ' + mod.modId + '\n';
            readme += '- 版本: ' + mod.version + '\n';
            readme += '- 游戏版本: ' + mod.mcVersion + '\n';
            readme += '- 加载器: ' + mod.loader + '\n';
            readme += '- 描述: ' + (mod.description || '无') + '\n\n';
        }

        return {
            mods: selected,
            readme: readme,
            count: selected.length
        };
    }

    function importLocalMod(fileData) {
        var mod = {
            id: 'imported_' + Date.now(),
            modId: fileData.modId || 'imported',
            modName: fileData.modName || '导入的模组',
            version: fileData.version || '1.0.0',
            mcVersion: fileData.mcVersion || '1.20.1',
            loader: fileData.loader || 'forge',
            author: fileData.author || '',
            description: fileData.description || '从本地导入的模组',
            status: 'imported',
            createdAt: Date.now(),
            isImported: true,
            fileName: fileData.fileName || ''
        };
        addMod(mod);
        return mod;
    }

    function getUserTemplates() {
        try {
            return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function saveUserTemplate(template) {
        var templates = getUserTemplates();
        template.id = 'user_' + Date.now();
        template.isUser = true;
        templates.unshift(template);
        try {
            localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
            return template;
        } catch (e) {
            return null;
        }
    }

    function deleteUserTemplate(templateId) {
        var templates = getUserTemplates();
        var newTemplates = templates.filter(function(t) {
            return t.id !== templateId;
        });
        try {
            localStorage.setItem(TEMPLATES_KEY, JSON.stringify(newTemplates));
            return true;
        } catch (e) {
            return false;
        }
    }

    function getSettings() {
        try {
            return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
        } catch (e) {
            return {};
        }
    }

    function saveSettings(settings) {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            return true;
        } catch (e) {
            return false;
        }
    }

    function generateModInfoCard(mod) {
        var lines = [];
        lines.push('═══ ' + mod.modName + ' ═══');
        lines.push('');
        lines.push('📦 模组ID: ' + mod.modId);
        lines.push('📋 版本: ' + mod.version);
        lines.push('🎮 游戏版本: ' + mod.mcVersion);
        lines.push('🔧 加载器: ' + mod.loader.toUpperCase());
        if (mod.author) {
            lines.push('👤 作者: ' + mod.author);
        }
        lines.push('');
        if (mod.description) {
            lines.push('📝 功能: ' + mod.description);
        }
        lines.push('');
        lines.push('由 MCGA Pro 生成');

        return lines.join('\n');
    }

    function exportModConfig(mod) {
        var config = {
            modId: mod.modId,
            modName: mod.modName,
            version: mod.version,
            mcVersion: mod.mcVersion,
            loader: mod.loader,
            author: mod.author,
            description: mod.description,
            modData: mod.modData || null,
            exportTime: Date.now(),
            mcgaVersion: '2.0.0'
        };
        return JSON.stringify(config, null, 2);
    }

    function importModConfig(configJson) {
        try {
            var config = JSON.parse(configJson);
            if (!config.modId || !config.mcVersion || !config.loader) {
                return { success: false, error: '配置文件格式不正确' };
            }
            return {
                success: true,
                config: config
            };
        } catch (e) {
            return { success: false, error: 'JSON 解析失败: ' + e.message };
        }
    }

    return {
        getModHistory: getModHistory,
        saveModHistory: saveModHistory,
        addMod: addMod,
        updateMod: updateMod,
        deleteMod: deleteMod,
        getModById: getModById,
        searchMods: searchMods,
        getStats: getStats,
        detectConflicts: detectConflicts,
        exportModsAsZip: exportModsAsZip,
        importLocalMod: importLocalMod,
        getUserTemplates: getUserTemplates,
        saveUserTemplate: saveUserTemplate,
        deleteUserTemplate: deleteUserTemplate,
        getSettings: getSettings,
        saveSettings: saveSettings,
        generateModInfoCard: generateModInfoCard,
        exportModConfig: exportModConfig,
        importModConfig: importModConfig
    };
})();