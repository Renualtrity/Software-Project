var MCGA = MCGA || {};
MCGA.Core = MCGA.Core || {};

MCGA.Core.Launcher = (function() {
    var STORAGE_KEY = 'mcga_launcher_config';
    var INSTALL_HISTORY_KEY = 'mcga_install_history';

    var LAUNCHERS = {
        hmcl: {
            name: 'HMCL 启动器',
            icon: '📦',
            description: 'Hello Minecraft! Launcher',
            defaultPath: '',
            supports: ['auto_detect', 'manual_path']
        },
        pcl2: {
            name: 'PCL2 启动器',
            icon: '🟢',
            description: 'Plain Craft Launcher 2',
            defaultPath: '',
            supports: ['auto_detect', 'manual_path']
        },
        bakaltool: {
            name: 'BakaTool',
            icon: '🐱',
            description: 'BakaTool 启动器',
            defaultPath: '',
            supports: ['auto_detect', 'manual_path']
        }
    };

    var mockInstances = [
        {
            id: 'inst_001',
            name: '1.20.1 Forge',
            mcVersion: '1.20.1',
            loader: 'forge',
            loaderVersion: '47.2.0',
            modsFolder: '.minecraft/mods',
            modCount: 12,
            hasModsFolder: true
        },
        {
            id: 'inst_002',
            name: '1.20.1 Fabric',
            mcVersion: '1.20.1',
            loader: 'fabric',
            loaderVersion: '0.15.0',
            modsFolder: '.minecraft/mods',
            modCount: 8,
            hasModsFolder: true
        },
        {
            id: 'inst_003',
            name: '1.19.4 Forge',
            mcVersion: '1.19.4',
            loader: 'forge',
            loaderVersion: '45.2.0',
            modsFolder: '.minecraft/mods',
            modCount: 25,
            hasModsFolder: true
        },
        {
            id: 'inst_004',
            name: '1.21 原版',
            mcVersion: '1.21',
            loader: 'vanilla',
            loaderVersion: '',
            modsFolder: '',
            modCount: 0,
            hasModsFolder: false
        }
    ];

    function getLaunchers() {
        var config = getConfig();
        var result = {};
        for (var key in LAUNCHERS) {
            if (LAUNCHERS.hasOwnProperty(key)) {
                result[key] = Object.assign({}, LAUNCHERS[key], {
                    connected: config.connectedLaunchers ? config.connectedLaunchers.indexOf(key) !== -1 : false,
                    path: (config.launcherPaths && config.launcherPaths[key]) || ''
                });
            }
        }
        return result;
    }

    function getConfig() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        } catch (e) {
            return {};
        }
    }

    function saveConfig(config) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
            return true;
        } catch (e) {
            return false;
        }
    }

    function connectLauncher(launcherType, path) {
        var config = getConfig();
        if (!config.connectedLaunchers) {
            config.connectedLaunchers = [];
        }
        if (!config.launcherPaths) {
            config.launcherPaths = {};
        }
        if (config.connectedLaunchers.indexOf(launcherType) === -1) {
            config.connectedLaunchers.push(launcherType);
        }
        if (path) {
            config.launcherPaths[launcherType] = path;
        }
        saveConfig(config);
        return true;
    }

    function disconnectLauncher(launcherType) {
        var config = getConfig();
        if (config.connectedLaunchers) {
            config.connectedLaunchers = config.connectedLaunchers.filter(function(l) {
                return l !== launcherType;
            });
        }
        saveConfig(config);
        return true;
    }

    function isConnected(launcherType) {
        var config = getConfig();
        return config.connectedLaunchers && config.connectedLaunchers.indexOf(launcherType) !== -1;
    }

    function hasAnyConnected() {
        var config = getConfig();
        return config.connectedLaunchers && config.connectedLaunchers.length > 0;
    }

    function getInstances(launcherType) {
        if (launcherType && !isConnected(launcherType)) {
            return [];
        }
        return mockInstances.slice();
    }

    function getInstanceById(instanceId) {
        for (var i = 0; i < mockInstances.length; i++) {
            if (mockInstances[i].id === instanceId) {
                return mockInstances[i];
            }
        }
        return null;
    }

    function installModToInstance(modData, instanceId) {
        var instance = getInstanceById(instanceId);
        if (!instance) {
            return { success: false, error: '游戏实例不存在' };
        }
        if (!instance.hasModsFolder) {
            return { success: false, error: '该版本没有 mods 文件夹（原版游戏）' };
        }
        if (modData.loader && instance.loader && modData.loader !== instance.loader) {
            return { success: false, error: '模组加载器与游戏实例不匹配' };
        }
        if (modData.mcVersion && instance.mcVersion && modData.mcVersion !== instance.mcVersion) {
            return { success: false, error: '模组版本与游戏版本不匹配' };
        }
        var history = getInstallHistory();
        var record = {
            id: 'install_' + Date.now(),
            modId: modData.modId || modData.id,
            modName: modData.modName || modData.name,
            modVersion: modData.version || '',
            mcVersion: instance.mcVersion,
            loader: instance.loader,
            instanceName: instance.name,
            instanceId: instanceId,
            installedAt: Date.now(),
            status: 'success'
        };
        history.unshift(record);
        if (history.length > 100) {
            history = history.slice(0, 100);
        }
        try {
            localStorage.setItem(INSTALL_HISTORY_KEY, JSON.stringify(history));
        } catch (e) {}
        return { success: true, record: record };
    }

    function getInstallHistory() {
        try {
            return JSON.parse(localStorage.getItem(INSTALL_HISTORY_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function checkModCompatibility(modData, instanceId) {
        var instance = getInstanceById(instanceId);
        if (!instance) {
            return { compatible: false, reason: '游戏实例不存在' };
        }
        var issues = [];
        var warnings = [];
        if (modData.loader && instance.loader && modData.loader !== instance.loader && instance.loader !== 'vanilla') {
            issues.push('模组加载器（' + modData.loader.toUpperCase() + '）与游戏实例（' + instance.loader.toUpperCase() + '）不匹配');
        }
        if (modData.mcVersion && instance.mcVersion && modData.mcVersion !== instance.mcVersion) {
            issues.push('模组版本（' + modData.mcVersion + '）与游戏版本（' + instance.mcVersion + '）不匹配');
        }
        if (!instance.hasModsFolder) {
            issues.push('该游戏实例是原版，没有 mods 文件夹');
        }
        return {
            compatible: issues.length === 0,
            issues: issues,
            warnings: warnings
        };
    }

    function quickInstall(modList, instanceId) {
        var results = [];
        var successCount = 0;
        var failCount = 0;
        for (var i = 0; i < modList.length; i++) {
            var result = installModToInstance(modList[i], instanceId);
            results.push(result);
            if (result.success) {
                successCount++;
            } else {
                failCount++;
            }
        }
        return {
            total: modList.length,
            success: successCount,
            failed: failCount,
            results: results
        };
    }

    return {
        getLaunchers: getLaunchers,
        getConfig: getConfig,
        saveConfig: saveConfig,
        connectLauncher: connectLauncher,
        disconnectLauncher: disconnectLauncher,
        isConnected: isConnected,
        hasAnyConnected: hasAnyConnected,
        getInstances: getInstances,
        getInstanceById: getInstanceById,
        installModToInstance: installModToInstance,
        getInstallHistory: getInstallHistory,
        checkModCompatibility: checkModCompatibility,
        quickInstall: quickInstall
    };
})();
