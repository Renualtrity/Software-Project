var MCGA = MCGA || {};

MCGA.Market = (function() {
    var currentSort = 'hot';

    function init() {
        renderMarketMods();
    }

    function renderMarketMods() {
        var grid = document.getElementById('market-grid');
        if (!grid) return;

        var mods = getFilteredMods();
        mods = MCGA.Core.ModMarket.sortMods(mods, currentSort);

        if (mods.length === 0) {
            grid.innerHTML = '<p class="empty-tip">没有找到符合条件的模组</p>';
            return;
        }

        var html = '';
        for (var i = 0; i < mods.length; i++) {
            html += renderModCard(mods[i]);
        }
        grid.innerHTML = html;
    }

    function getFilteredMods() {
        var keyword = '';
        var searchEl = document.getElementById('market-search');
        if (searchEl) keyword = searchEl.value;

        var category = '';
        var categoryEl = document.getElementById('market-category');
        if (categoryEl) category = categoryEl.value;

        var mcVersion = '';
        var versionEl = document.getElementById('market-mc-version');
        if (versionEl) mcVersion = versionEl.value;

        if (MCGA.Core.ModMarket) {
            return MCGA.Core.ModMarket.searchMods(keyword, {
                category: category,
                mcVersion: mcVersion
            });
        }
        return [];
    }

    function renderModCard(mod) {
        var isDownloaded = MCGA.Core.ModMarket ? MCGA.Core.ModMarket.isDownloaded(mod.id) : false;
        var isFavorite = MCGA.Core.ModMarket ? MCGA.Core.ModMarket.isFavorite(mod.id) : false;
        var categoryInfo = MCGA.Core.ModMarket ? MCGA.Core.ModMarket.getCategories()[mod.category] : null;
        var downloadsText = MCGA.Core.ModMarket ? MCGA.Core.ModMarket.formatDownloads(mod.downloads) : mod.downloads;

        var tagsHtml = '';
        if (mod.tags && mod.tags.length > 0) {
            for (var i = 0; i < Math.min(mod.tags.length, 3); i++) {
                tagsHtml += '<span class="mod-tag">' + mod.tags[i] + '</span>';
            }
        }

        return '<div class="market-mod-card" onclick="MCGA.Market.showDetail(\'' + mod.id + '\')">' +
            '<div class="market-mod-header">' +
            '<div class="market-mod-icon">' + (mod.icon || '📦') + '</div>' +
            '<div class="market-mod-info">' +
            '<div class="market-mod-title">' + escapeHtml(mod.modName || mod.modId) + '</div>' +
            '<div class="market-mod-author">' + escapeHtml(mod.author || '未知') + '</div>' +
            '</div>' +
            '<button class="fav-btn ' + (isFavorite ? 'active' : '') + '" onclick="event.stopPropagation();MCGA.Market.toggleFav(\'' + mod.id + '\')">' +
            (isFavorite ? '❤️' : '🤍') +
            '</button>' +
            '</div>' +
            '<div class="market-mod-tags">' + tagsHtml + '</div>' +
            '<div class="market-mod-desc">' + escapeHtml(mod.description || '') + '</div>' +
            '<div class="market-mod-meta">' +
            '<span class="meta-item">⬇️ ' + downloadsText + '</span>' +
            '<span class="meta-item">⭐ ' + mod.rating + '</span>' +
            '<span class="meta-item loader-badge ' + mod.loader + '">' + mod.loader.toUpperCase() + '</span>' +
            '</div>' +
            '<div class="market-mod-footer">' +
            '<span class="mc-version">MC ' + mod.mcVersion + '</span>' +
            '<span class="mod-size">' + mod.size + '</span>' +
            '</div>' +
            '<div class="market-mod-actions" onclick="event.stopPropagation()">' +
            (isDownloaded ?
                '<button class="btn-secondary" onclick="MCGA.Market.manageMod(\'' + mod.id + '\')">已下载</button>' :
                '<button class="btn-primary" onclick="MCGA.Market.downloadMod(\'' + mod.id + '\')">📥 下载</button>') +
            '</div>' +
            '</div>';
    }

    function filterMarketMods() {
        renderMarketMods();
    }

    function sortMarket(sortBy) {
        currentSort = sortBy;
        var tabs = document.querySelectorAll('.market-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.remove('active');
            if (tabs[i].getAttribute('data-sort') === sortBy) {
                tabs[i].classList.add('active');
            }
        }
        renderMarketMods();
    }

    function showDetail(modId) {
        var mod = MCGA.Core.ModMarket ? MCGA.Core.ModMarket.getModById(modId) : null;
        if (!mod) return;

        var modal = document.getElementById('mod-detail-modal');
        var titleEl = document.getElementById('detail-title');
        var bodyEl = document.getElementById('detail-body');

        if (!modal || !titleEl || !bodyEl) return;

        var isDownloaded = MCGA.Core.ModMarket.isDownloaded(mod.id);
        var isFavorite = MCGA.Core.ModMarket.isFavorite(mod.id);
        var downloadsText = MCGA.Core.ModMarket.formatDownloads(mod.downloads);
        var categoryInfo = MCGA.Core.ModMarket.getCategories()[mod.category];

        titleEl.textContent = mod.modName || mod.modId;

        var tagsHtml = '';
        if (mod.tags && mod.tags.length > 0) {
            for (var i = 0; i < mod.tags.length; i++) {
                tagsHtml += '<span class="mod-tag">' + mod.tags[i] + '</span>';
            }
        }

        var html = '';
        html += '<div class="detail-top">' +
            '<div class="detail-icon-big">' + (mod.icon || '📦') + '</div>' +
            '<div class="detail-top-info">' +
            '<h3>' + escapeHtml(mod.modName) + '</h3>' +
            '<p class="detail-author">作者：' + escapeHtml(mod.author) + '</p>' +
            '<div class="detail-tags">' + tagsHtml + '</div>' +
            '</div>' +
            '<button class="fav-btn-big ' + (isFavorite ? 'active' : '') + '" onclick="MCGA.Market.toggleFav(\'' + mod.id + '\');MCGA.Market.showDetail(\'' + mod.id + '\')">' +
            (isFavorite ? '❤️ 已收藏' : '🤍 收藏') +
            '</button>' +
            '</div>';

        html += '<div class="detail-section">';
        html += '<h4>基本信息</h4>';
        html += '<div class="detail-grid">';
        html += '<div class="detail-item"><span class="detail-label">模组 ID</span><span class="detail-value">' + mod.modId + '</span></div>';
        html += '<div class="detail-item"><span class="detail-label">版本</span><span class="detail-value">' + mod.version + '</span></div>';
        html += '<div class="detail-item"><span class="detail-label">游戏版本</span><span class="detail-value">' + mod.mcVersion + '</span></div>';
        html += '<div class="detail-item"><span class="detail-label">加载器</span><span class="detail-value loader-badge ' + mod.loader + '">' + mod.loader.toUpperCase() + '</span></div>';
        html += '<div class="detail-item"><span class="detail-label">分类</span><span class="detail-value">' + (categoryInfo ? categoryInfo.name : mod.category) + '</span></div>';
        html += '<div class="detail-item"><span class="detail-label">文件大小</span><span class="detail-value">' + mod.size + '</span></div>';
        html += '<div class="detail-item"><span class="detail-label">下载量</span><span class="detail-value">' + downloadsText + '</span></div>';
        html += '<div class="detail-item"><span class="detail-label">评分</span><span class="detail-value">⭐ ' + mod.rating + '</span></div>';
        html += '<div class="detail-item"><span class="detail-label">更新时间</span><span class="detail-value">' + mod.updatedAt + '</span></div>';
        html += '</div>';
        html += '</div>';

        html += '<div class="detail-section">';
        html += '<h4>模组介绍</h4>';
        html += '<div class="detail-desc">' + escapeHtml(mod.description || '') + '</div>';
        html += '</div>';

        html += '<div class="detail-actions">';
        if (isDownloaded) {
            html += '<button class="btn-secondary" onclick="MCGA.Market.manageMod(\'' + mod.id + '\')">✅ 已下载</button>';
        } else {
            html += '<button class="btn-primary" onclick="MCGA.Market.downloadMod(\'' + mod.id + '\')">📥 下载模组</button>';
        }
        html += '<button class="btn-secondary" onclick="MCGA.Market.installToLauncher(\'' + mod.id + '\')">🎮 安装到启动器</button>';
        html += '</div>';

        bodyEl.innerHTML = html;
        modal.style.display = 'flex';
    }

    function downloadMod(modId) {
        var mod = MCGA.Core.ModMarket ? MCGA.Core.ModMarket.getModById(modId) : null;
        if (!mod) {
            MCGA.showNotification('模组不存在', 'error');
            return;
        }

        MCGA.showNotification('开始下载: ' + mod.modName, 'info');

        setTimeout(function() {
            MCGA.Core.ModMarket.downloadMod(mod);
            MCGA.showNotification('下载完成: ' + mod.modName, 'success');
            renderMarketMods();
        }, 800);
    }

    function toggleFav(modId) {
        var mod = MCGA.Core.ModMarket ? MCGA.Core.ModMarket.getModById(modId) : null;
        if (!mod) return;

        var added = MCGA.Core.ModMarket.toggleFavorite(mod);
        MCGA.showNotification(added ? '已添加收藏' : '已取消收藏', 'info');
        renderMarketMods();
    }

    function manageMod(modId) {
        var mod = MCGA.Core.ModMarket ? MCGA.Core.ModMarket.getModById(modId) : null;
        if (!mod) return;
        MCGA.showNotification('模组管理功能开发中', 'info');
    }

    function installToLauncher(modId) {
        if (!MCGA.Core.Launcher || !MCGA.Core.Launcher.hasAnyConnected()) {
            MCGA.showNotification('请先连接启动器', 'warning');
            showPage('launcher');
            return;
        }
        MCGA.showNotification('快速安装功能开发中', 'info');
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    return {
        init: init,
        renderMarketMods: renderMarketMods,
        filterMarketMods: filterMarketMods,
        sortMarket: sortMarket,
        showDetail: showDetail,
        downloadMod: downloadMod,
        toggleFav: toggleFav,
        manageMod: manageMod,
        installToLauncher: installToLauncher
    };
})();

function filterMarketMods() {
    MCGA.Market.filterMarketMods();
}

function sortMarket(sortBy) {
    MCGA.Market.sortMarket(sortBy);
}
