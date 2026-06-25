var MCGA = MCGA || {};
MCGA.Dashboard = (function() {
    function refreshDashboard() {
        try {
            var stats = MCGA.Core.ModUtils ? MCGA.Core.ModUtils.getStats() : { total: 0, success: 0, failed: 0, recent: [] };
            
            var statTotal = document.getElementById('stat-total');
            var statSuccess = document.getElementById('stat-success');
            var statFailed = document.getElementById('stat-failed');
            
            if (statTotal) statTotal.textContent = stats.total;
            if (statSuccess) statSuccess.textContent = stats.success;
            if (statFailed) statFailed.textContent = stats.failed;
            
            var listEl = document.getElementById('recent-mods-list');
            if (!listEl) return;
            
            if (!stats.recent || stats.recent.length === 0) {
                listEl.innerHTML = '<p class="empty-tip">暂无生成记录，前往模组生成器创建第一个模组</p>';
                return;
            }
            
            var html = '';
            for (var i = 0; i < stats.recent.length; i++) {
                var mod = stats.recent[i];
                html += renderRecentMod(mod);
            }
            listEl.innerHTML = html;
        } catch (e) {
            console.error('refreshDashboard error:', e);
        }
    }
    
    function renderRecentMod(mod) {
        var statusClass = mod.status === 'success' ? 'success' : (mod.status === 'failed' ? 'error' : 'pending');
        var statusText = mod.status === 'success' ? '成功' : (mod.status === 'failed' ? '失败' : '进行中');
        
        return '<div class="mod-card" onclick="MCGA.Mods.showDetail(\'' + mod.id + '\')">' +
            '<div class="mod-card-header">' +
            '<div>' +
            '<div class="mod-card-title">' + (mod.modName || mod.modId) + '</div>' +
            '<div class="mod-card-id">' + mod.modId + '</div>' +
            '</div>' +
            '<span class="mod-card-badge ' + mod.loader + '">' + mod.loader.toUpperCase() + '</span>' +
            '</div>' +
            '<div class="mod-card-meta">' +
            '<span>MC ' + mod.mcVersion + '</span>' +
            '<span>v' + mod.version + '</span>' +
            '<span class="status-' + statusClass + '">' + statusText + '</span>' +
            '</div>' +
            '</div>';
    }
    
    return {
        refreshDashboard: refreshDashboard
    };
})();

MCGA.refreshDashboard = function() {
    MCGA.Dashboard.refreshDashboard();
};