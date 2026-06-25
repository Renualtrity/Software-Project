var MCGA = MCGA || {};

MCGA.Modpacks = (function() {
    function init() {
        renderModpacks();
    }

    function renderModpacks() {
        var grid = document.getElementById('modpacks-grid');
        if (!grid) return;

        var packs = getFilteredModpacks();

        if (packs.length === 0) {
            grid.innerHTML = '<p class="empty-tip">没有找到符合条件的整合包</p>';
            return;
        }

        var html = '';
        for (var i = 0; i < packs.length; i++) {
            html += renderPackCard(packs[i]);
        }
        grid.innerHTML = html;
    }

    function getFilteredModpacks() {
        var keyword = '';
        var searchEl = document.getElementById('modpacks-search');
        if (searchEl) keyword = searchEl.value;

        var category = '';
        var categoryEl = document.getElementById('modpacks-category');
        if (categoryEl) category = categoryEl.value;

        if (MCGA.Core.Modpacks) {
            return MCGA.Core.Modpacks.searchModpacks(keyword, {
                category: category
            });
        }
        return [];
    }

    function renderPackCard(pack) {
        var isInstalled = MCGA.Core.Modpacks ? MCGA.Core.Modpacks.isInstalled(pack.id) : false;
        var categoryInfo = MCGA.Core.Modpacks ? MCGA.Core.Modpacks.getCategories()[pack.category] : null;
        var downloadsText = MCGA.Core.Modpacks ? MCGA.Core.Modpacks.formatDownloads(pack.downloads) : pack.downloads;

        var tagsHtml = '';
        if (pack.tags && pack.tags.length > 0) {
            for (var i = 0; i < Math.min(pack.tags.length, 4); i++) {
                tagsHtml += '<span class="pack-tag">' + pack.tags[i] + '</span>';
            }
        }

        return '<div class="modpack-card" onclick="MCGA.Modpacks.showDetail(\'' + pack.id + '\')">' +
            '<div class="modpack-header">' +
            '<div class="modpack-icon">' + (pack.icon || '📦') + '</div>' +
            '<div class="modpack-info">' +
            '<div class="modpack-title">' + escapeHtml(pack.name) + '</div>' +
            '<div class="modpack-author">' + escapeHtml(pack.author || '未知') + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="modpack-tags">' + tagsHtml + '</div>' +
            '<div class="modpack-desc">' + escapeHtml(pack.description || '') + '</div>' +
            '<div class="modpack-stats">' +
            '<span class="stat">📦 ' + pack.modCount + ' 个模组</span>' +
            '<span class="stat">⬇️ ' + downloadsText + '</span>' +
            '<span class="stat">⭐ ' + pack.rating + '</span>' +
            '</div>' +
            '<div class="modpack-footer">' +
            '<span class="mc-version">MC ' + pack.mcVersion + '</span>' +
            '<span class="pack-size">' + pack.size + '</span>' +
            '<span class="loader-badge ' + pack.loader + '">' + pack.loader.toUpperCase() + '</span>' +
            '</div>' +
            '<div class="modpack-actions" onclick="event.stopPropagation()">' +
            (isInstalled ?
                '<button class="btn-secondary" onclick="MCGA.Modpacks.managePack(\'' + pack.id + '\')">已安装</button>' :
                '<button class="btn-primary" onclick="MCGA.Modpacks.downloadPack(\'' + pack.id + '\')">📥 下载</button>') +
            '</div>' +
            '</div>';
    }

    function filterModpacks() {
        renderModpacks();
    }

    function showDetail(packId) {
        var pack = MCGA.Core.Modpacks ? MCGA.Core.Modpacks.getModpackById(packId) : null;
        if (!pack) return;

        var modal = document.getElementById('mod-detail-modal');
        var titleEl = document.getElementById('detail-title');
        var bodyEl = document.getElementById('detail-body');

        if (!modal || !titleEl || !bodyEl) return;

        var isInstalled = MCGA.Core.Modpacks.isInstalled(pack.id);
        var downloadsText = MCGA.Core.Modpacks.formatDownloads(pack.downloads);
        var categoryInfo = MCGA.Core.Modpacks.getCategories()[pack.category];

        titleEl.textContent = pack.name;

        var tagsHtml = '';
        if (pack.tags && pack.tags.length > 0) {
            for (var i = 0; i < pack.tags.length; i++) {
                tagsHtml += '<span class="pack-tag">' + pack.tags[i] + '</span>';
            }
        }

        var modListHtml = '';
        if (pack.mods && pack.mods.length > 0) {
            modListHtml = '<div class="detail-section">' +
                '<h4>包含模组（部分）</h4>' +
                '<div class="mod-list-mini">';
            for (var j = 0; j < pack.mods.length; j++) {
                modListHtml += '<span class="mod-chip">' + pack.mods[j] + '</span>';
            }
            modListHtml += '</div></div>';
        }

        var html = '';
        html += '<div class="detail-top">' +
            '<div class="detail-icon-big">' + (pack.icon || '📦') + '</div>' +
            '<div class="detail-top-info">' +
            '<h3>' + escapeHtml(pack.name) + '</h3>' +
            '<p class="detail-author">作者：' + escapeHtml(pack.author) + '</p>' +
            '<div class="detail-tags">' + tagsHtml + '</div>' +
            '</div>' +
            '</div>';

        html += '<div class="detail-section">';
        html += '<h4>基本信息</h4>';
        html += '<div class="detail-grid">';
        html += '<div class="detail-item"><span class="detail-label">版本</span><span class="detail-value">' + pack.version + '</span></div>';
        html += '<div class="detail-item"><span class="detail-label">游戏版本</span><span class="detail-value">' + pack.mcVersion + '</span></div>';
        html += '<div class="detail-item"><span class="detail-label">加载器</span><span class="detail-value loader-badge ' + pack.loader + '">' + pack.loader.toUpperCase() + '</span></div>';
        html += '<div class="detail-item"><span class="detail-label">分类</span><span class="detail-value">' + (categoryInfo ? categoryInfo.name : pack.category) + '</span></div>';
        html += '<div class="detail-item"><span class="detail-label">模组数量</span><span class="detail-value">' + pack.modCount + ' 个</span></div>';
        html += '<div class="detail-item"><span class="detail-label">文件大小</span><span class="detail-value">' + pack.size + '</span></div>';
        html += '<div class="detail-item"><span class="detail-label">下载量</span><span class="detail-value">' + downloadsText + '</span></div>';
        html += '<div class="detail-item"><span class="detail-label">评分</span><span class="detail-value">⭐ ' + pack.rating + '</span></div>';
        html += '<div class="detail-item"><span class="detail-label">更新时间</span><span class="detail-value">' + pack.updatedAt + '</span></div>';
        html += '</div>';
        html += '</div>';

        html += '<div class="detail-section">';
        html += '<h4>整合包介绍</h4>';
        html += '<div class="detail-desc">' + escapeHtml(pack.description || '') + '</div>';
        html += '</div>';

        html += modListHtml;

        html += '<div class="detail-actions">';
        if (isInstalled) {
            html += '<button class="btn-danger" onclick="MCGA.Modpacks.uninstallPack(\'' + pack.id + '\');closeModal(\'mod-detail-modal\')">🗑️ 卸载</button>';
        } else {
            html += '<button class="btn-primary" onclick="MCGA.Modpacks.downloadPack(\'' + pack.id + '\')">📥 下载整合包</button>';
        }
        html += '</div>';

        bodyEl.innerHTML = html;
        modal.style.display = 'flex';
    }

    function downloadPack(packId) {
        var pack = MCGA.Core.Modpacks ? MCGA.Core.Modpacks.getModpackById(packId) : null;
        if (!pack) {
            MCGA.showNotification('整合包不存在', 'error');
            return;
        }

        MCGA.showNotification('开始下载: ' + pack.name, 'info');

        setTimeout(function() {
            MCGA.Core.Modpacks.installModpack(pack);
            MCGA.showNotification('下载完成: ' + pack.name, 'success');
            renderModpacks();
            var modal = document.getElementById('mod-detail-modal');
            if (modal && modal.style.display === 'flex') {
                showDetail(packId);
            }
        }, 1000);
    }

    function managePack(packId) {
        MCGA.showNotification('整合包管理功能开发中', 'info');
    }

    function uninstallPack(packId) {
        if (!confirm('确定要卸载这个整合包吗？')) return;
        MCGA.Core.Modpacks.uninstallModpack(packId);
        MCGA.showNotification('已卸载', 'info');
        renderModpacks();
    }

    function importModpack() {
        MCGA.showNotification('导入本地整合包功能开发中', 'info');
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    return {
        init: init,
        renderModpacks: renderModpacks,
        filterModpacks: filterModpacks,
        showDetail: showDetail,
        downloadPack: downloadPack,
        managePack: managePack,
        uninstallPack: uninstallPack,
        importModpack: importModpack
    };
})();

function filterModpacks() {
    MCGA.Modpacks.filterModpacks();
}

function importModpack() {
    MCGA.Modpacks.importModpack();
}
