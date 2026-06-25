var MCGA = MCGA || {};

MCGA.Launcher = (function() {
    var selectedInstance = null;

    function init() {
        refreshLauncherList();
        refreshInstanceList();
    }

    function refreshLauncherList() {
        var listEl = document.getElementById('launcher-list');
        if (!listEl || !MCGA.Core.Launcher) return;

        var launchers = MCGA.Core.Launcher.getLaunchers();
        var html = '';

        for (var key in launchers) {
            if (launchers.hasOwnProperty(key)) {
                var launcher = launchers[key];
                var isConnected = launcher.connected;
                html += '<div class="launcher-card" data-launcher="' + key + '">' +
                    '<div class="launcher-icon">' + launcher.icon + '</div>' +
                    '<div class="launcher-info">' +
                    '<div class="launcher-name">' + launcher.name + '</div>' +
                    '<div class="launcher-status ' + (isConnected ? 'connected' : 'disconnected') + '">' +
                    (isConnected ? '已连接' : '未连接') +
                    '</div>' +
                    '</div>' +
                    (isConnected ?
                        '<button class="btn-danger" onclick="MCGA.Launcher.disconnect(\'' + key + '\')">断开</button>' :
                        '<button class="btn-secondary" onclick="MCGA.Launcher.connect(\'' + key + '\')">连接</button>') +
                    '</div>';
            }
        }

        listEl.innerHTML = html;
    }

    function refreshInstanceList() {
        var listEl = document.getElementById('instance-list');
        if (!listEl || !MCGA.Core.Launcher) return;

        if (!MCGA.Core.Launcher.hasAnyConnected()) {
            listEl.innerHTML = '<p class="empty-tip">连接启动器后显示游戏版本实例</p>';
            return;
        }

        var instances = MCGA.Core.Launcher.getInstances();
        if (instances.length === 0) {
            listEl.innerHTML = '<p class="empty-tip">没有找到游戏版本实例</p>';
            return;
        }

        var html = '';
        for (var i = 0; i < instances.length; i++) {
            var inst = instances[i];
            html += '<div class="instance-card" data-instance="' + inst.id + '" onclick="MCGA.Launcher.selectInstance(\'' + inst.id + '\')">' +
                '<div class="instance-icon">' + (inst.loader === 'forge' ? '⚙️' : (inst.loader === 'fabric' ? '🧵' : '🎮')) + '</div>' +
                '<div class="instance-info">' +
                '<div class="instance-name">' + inst.name + '</div>' +
                '<div class="instance-meta">' +
                '<span>MC ' + inst.mcVersion + '</span>' +
                '<span>' + inst.loader.toUpperCase() + '</span>' +
                (inst.hasModsFolder ? '<span>' + inst.modCount + ' 个模组</span>' : '<span>原版</span>') +
                '</div>' +
                '</div>' +
                '<div class="instance-check">' +
                (selectedInstance === inst.id ? '✅' : '⬜') +
                '</div>' +
                '</div>';
        }

        listEl.innerHTML = html;
    }

    function connectLauncher(launcherType) {
        if (!MCGA.Core.Launcher) return;
        var path = prompt('请输入启动器安装路径（留空则使用默认路径）：');
        if (path === null) return;

        MCGA.showNotification('正在连接启动器...', 'info');

        setTimeout(function() {
            MCGA.Core.Launcher.connectLauncher(launcherType, path);
            MCGA.showNotification('连接成功', 'success');
            refreshLauncherList();
            refreshInstanceList();
        }, 500);
    }

    function disconnectLauncher(launcherType) {
        if (!confirm('确定要断开连接吗？')) return;
        MCGA.Core.Launcher.disconnectLauncher(launcherType);
        MCGA.showNotification('已断开连接', 'info');
        refreshLauncherList();
        refreshInstanceList();
        selectedInstance = null;
    }

    function selectInstance(instanceId) {
        selectedInstance = selectedInstance === instanceId ? null : instanceId;
        refreshInstanceList();
    }

    function quickInstall() {
        if (!MCGA.Core.Launcher || !MCGA.Core.Launcher.hasAnyConnected()) {
            MCGA.showNotification('请先连接启动器', 'warning');
            return;
        }
        if (!selectedInstance) {
            MCGA.showNotification('请先选择目标游戏版本', 'warning');
            return;
        }
        MCGA.showNotification('快速安装功能开发中，请先到模组管理或模组市场选择模组安装', 'info');
    }

    return {
        init: init,
        refreshLauncherList: refreshLauncherList,
        refreshInstanceList: refreshInstanceList,
        connect: connectLauncher,
        disconnect: disconnectLauncher,
        selectInstance: selectInstance,
        quickInstall: quickInstall
    };
})();

function connectLauncher(launcherType) {
    MCGA.Launcher.connect(launcherType);
}

function quickInstall() {
    MCGA.Launcher.quickInstall();
}
