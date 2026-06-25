var MCGA = MCGA || {};

MCGA.Market = (function() {
    var currentSort = 'downloads';
    var allMods = [];
    var currentOffset = 0;
    var totalMods = 0;
    var isLoading = false;

    function init() {
        allMods = [];
        currentOffset = 0;
        totalMods = 0;
        renderMarketMods(true);
    }

    function renderMarketMods(reset) {
        var grid = document.getElementById('market-grid');
        if (!grid) return;

        if (reset) {
            allMods = [];
            currentOffset = 0;
            totalMods = 0;
            grid.innerHTML = '<div class="loading-spinner">加载中...</div>';
        }

        if (isLoading) return;
        isLoading = true;

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
            MCGA.Core.ModMarket.searchMods(keyword, {
                category: category,
                mcVersion: mcVersion
            }, currentOffset, function(err, mods, pagination) {
                isLoading = false;
                if (err) {
                    if (reset) {
                        grid.innerHTML = '<div class="empty-tip" style="text-align:center;padding:40px;">' +
                            '<p style="font-size:24px;margin-bottom:10px;">⚠️</p>' +
                            '<p>网络连接失败</p>' +
                            '<p style="font-size:12px;color:#666;margin-top:10px;">请确保通过 http://localhost:8080 访问<br>或检查网络连接</p>' +
                            '</div>';
                    }
                    return;
                }

                if (reset) {
                    allMods = mods;
                } else {
                    allMods = allMods.concat(mods);
                }
                totalMods = pagination ? pagination.total : 0;
                currentOffset = allMods.length;

                if (allMods.length === 0) {
                    grid.innerHTML = '<p class="empty-tip">没有找到符合条件的模组</p>';
                    return;
                }

                var html = '';
                for (var i = 0; i < allMods.length; i++) {
                    html += renderModCard(allMods[i]);
                }
                if (allMods.length < totalMods) {
                    html += '<div class="load-more-wrap" style="grid-column:1/-1;text-align:center;padding:20px;">' +
                        '<button class="btn-secondary" onclick="MCGA.Market.loadMore()">加载更多 (' + allMods.length + '/' + totalMods + ')</button>' +
                        '</div>';
                } else if (totalMods > 0) {
                    html += '<div class="load-more-wrap" style="grid-column:1/-1;text-align:center;padding:20px;color:#888;">' +
                        '已加载全部 (' + totalMods + ' 个模组)</div>';
                }
                grid.innerHTML = html;
            });
        }
    }

    function loadMore() {
        renderMarketMods(false);
    }

    function renderModCard(mod) {
        var isDownloaded = MCGA.Core.ModMarket ? MCGA.Core.ModMarket.isDownloaded(mod.id) : false;
        var isFavorite = MCGA.Core.ModMarket ? MCGA.Core.ModMarket.isFavorite(mod.id) : false;
        var categoryInfo = MCGA.Core.ModMarket ? MCGA.Core.ModMarket.getCategories()[mod.category] : null;
        var downloadsText = MCGA.Core.ModMarket ? MCGA.Core.ModMarket.formatDownloads(mod.downloads) : mod.downloads;

        var iconHtml = mod.icon ?
            '<img src="' + mod.icon + '" alt="' + escapeHtml(mod.modName) + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">' +
            '<span style="display:none">📦</span>' :
            '<span>📦</span>';

        var tagsHtml = '';
        if (mod.tags && mod.tags.length > 0) {
            for (var i = 0; i < Math.min(mod.tags.length, 3); i++) {
                tagsHtml += '<span class="mod-tag">' + escapeHtml(mod.tags[i]) + '</span>';
            }
        }

        return '<div class="market-mod-card" onclick="MCGA.Market.showDetail(\'' + mod.id + '\')">' +
            '<div class="market-mod-header">' +
            '<div class="market-mod-icon">' + iconHtml + '</div>' +
            '<div class="market-mod-info">' +
            '<div class="market-mod-title">' + escapeHtml(mod.modName || mod.modId) + '</div>' +
            '<div class="market-mod-author">' + escapeHtml(mod.author || '未知') + '</div>' +
            '</div>' +
            '<button class="fav-btn ' + (isFavorite ? 'active' : '') + '" onclick="event.stopPropagation();MCGA.Market.toggleFav(\'' + mod.id + '\', this)">' +
            (isFavorite ? '❤️' : '🤍') +
            '</button>' +
            '</div>' +
            '<div class="market-mod-tags">' + tagsHtml + '</div>' +
            '<div class="market-mod-desc">' + escapeHtml(mod.description || '') + '</div>' +
            '<div class="market-mod-meta">' +
            '<span class="meta-item">下载: ' + downloadsText + '</span>' +
            '<span class="meta-item">⭐ ' + mod.rating + '</span>' +
            '<span class="meta-item loader-badge ' + mod.loader + '">' + mod.loader.toUpperCase() + '</span>' +
            '</div>' +
            '<div class="market-mod-footer">' +
            '<span class="mc-version">MC ' + mod.mcVersion + '</span>' +
            '</div>' +
            '<div class="market-mod-actions" onclick="event.stopPropagation()">' +
            (isDownloaded ?
                '<button class="btn-secondary" onclick="MCGA.Market.reDownloadMod(\'' + mod.id + '\')">重新下载</button>' :
                '<button class="btn-primary" onclick="MCGA.Market.downloadMod(\'' + mod.id + '\')">📥 下载</button>') +
            '</div>' +
            '</div>';
    }

    function filterMarketMods() {
        renderMarketMods(true);
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
        renderMarketMods(true);
    }

    function showDetail(modId) {
        var modal = document.getElementById('mod-detail-modal');
        var titleEl = document.getElementById('detail-title');
        var bodyEl = document.getElementById('detail-body');

        if (!modal || !titleEl || !bodyEl) return;

        titleEl.textContent = '加载中...';
        bodyEl.innerHTML = '<div class="loading-spinner">加载中...</div>';
        modal.style.display = 'flex';

        if (!MCGA.Core.ModMarket) return;

        MCGA.Core.ModMarket.getModById(modId, function(err, mod) {
            if (err || !mod) {
                bodyEl.innerHTML = '<p class="empty-tip">加载失败，请稍后重试</p>';
                return;
            }

            var isDownloaded = MCGA.Core.ModMarket.isDownloaded(mod.id);
            var isFavorite = MCGA.Core.ModMarket.isFavorite(mod.id);
            var downloadsText = MCGA.Core.ModMarket.formatDownloads(mod.downloads);

            var iconHtml = mod.icon ?
                '<img src="' + mod.icon + '" alt="' + escapeHtml(mod.modName) + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">' +
                '<span style="display:none">📦</span>' :
                '<span>📦</span>';

            var tagsHtml = '';
            if (mod.tags && mod.tags.length > 0) {
                for (var i = 0; i < mod.tags.length; i++) {
                    tagsHtml += '<span class="mod-tag">' + escapeHtml(mod.tags[i]) + '</span>';
                }
            }

            var versionsHtml = '';
            if (mod.versions && mod.versions.length > 0) {
                versionsHtml = '<div class="detail-section">' +
                    '<h4>版本列表</h4>' +
                    '<div class="versions-list">';
                for (var j = 0; j < Math.min(mod.versions.length, 5); j++) {
                    var v = mod.versions[j];
                    var fileSize = MCGA.Core.ModMarket.formatSize(v.files[0] ? v.files[0].size : 0);
                    versionsHtml += '<div class="version-item">' +
                        '<div class="version-name">' + escapeHtml(v.name) + '</div>' +
                        '<div class="version-meta">' +
                        '<span>' + v.gameVersions.join(', ') + '</span>' +
                        '<span>' + fileSize + '</span>' +
                        '</div>' +
                        '<button class="btn-sm" onclick="MCGA.Market.downloadMod(\'' + mod.id + '\', \'' + v.id + '\')">下载</button>' +
                        '</div>';
                }
                versionsHtml += '</div></div>';
            }

            var html = '';
            html += '<div class="detail-top">' +
                '<div class="detail-icon-big">' + iconHtml + '</div>' +
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
            html += '<div class="detail-item"><span class="detail-label">游戏版本</span><span class="detail-value">' + (mod.gameVersions ? mod.gameVersions.join(', ') : mod.mcVersion) + '</span></div>';
            html += '<div class="detail-item"><span class="detail-label">加载器</span><span class="detail-value">' + (mod.loaders ? mod.loaders.join(', ') : mod.loader).toUpperCase() + '</span></div>';
            html += '<div class="detail-item"><span class="detail-label">下载量</span><span class="detail-value">' + downloadsText + '</span></div>';
            html += '<div class="detail-item"><span class="detail-label">评分</span><span class="detail-value">⭐ ' + mod.rating + '</span></div>';
            html += '<div class="detail-item"><span class="detail-label">关注数</span><span class="detail-value">👥 ' + mod.follows + '</span></div>';
            html += '<div class="detail-item"><span class="detail-label">许可证</span><span class="detail-value">' + mod.license + '</span></div>';
            html += '<div class="detail-item"><span class="detail-label">客户端</span><span class="detail-value">' + mod.clientSide + '</span></div>';
            html += '<div class="detail-item"><span class="detail-label">服务端</span><span class="detail-value">' + mod.serverSide + '</span></div>';
            html += '</div>';
            html += '</div>';

            html += '<div class="detail-section">';
            html += '<h4>模组介绍</h4>';
            html += '<div class="detail-desc">' + escapeHtml(mod.description || '') + '</div>';
            if (mod.body) {
                html += '<div class="detail-body">' + mod.body + '</div>';
            }
            html += '</div>';

            html += versionsHtml;

            html += '<div class="detail-actions">';
            if (isDownloaded) {
                html += '<button class="btn-secondary" onclick="MCGA.Market.reDownloadMod(\'' + mod.id + '\')">🔄 重新下载</button>';
            } else {
                html += '<button class="btn-primary" onclick="MCGA.Market.downloadMod(\'' + mod.id + '\')">📥 下载模组</button>';
            }
            if (mod.pageUrl) {
                html += '<button class="btn-secondary" onclick="window.open(\'' + mod.pageUrl + '\', \'_blank\')">🌐 查看详情</button>';
            }
            html += '</div>';

            bodyEl.innerHTML = html;
        });
    }

    function downloadMod(modId, versionId) {
        MCGA.showNotification('开始下载...', 'info');

        if (!MCGA.Core.ModMarket) {
            MCGA.showNotification('下载功能不可用', 'error');
            return;
        }

        MCGA.Core.ModMarket.downloadMod(modId, versionId, function(err, fileInfo) {
            if (err) {
                MCGA.showNotification('下载失败：' + err.message, 'error');
                return;
            }

            MCGA.Core.ModMarket.getModById(modId, function(getErr, mod) {
                if (!getErr && mod) {
                    MCGA.Core.ModMarket.recordDownload(mod);
                }
            });

            MCGA.showNotification('下载完成：' + fileInfo.filename, 'success');
            renderMarketMods();
        });
    }

    function reDownloadMod(modId) {
        downloadMod(modId);
    }

    function toggleFav(modId, btnEl) {
        if (!MCGA.Core.ModMarket) return;

        MCGA.Core.ModMarket.getModById(modId, function(err, mod) {
            if (!err && mod) {
                var added = MCGA.Core.ModMarket.toggleFavorite(mod);
                if (btnEl) {
                    btnEl.innerHTML = added ? '❤️' : '🤍';
                    btnEl.classList.toggle('active');
                }
                MCGA.showNotification(added ? '已添加收藏' : '已取消收藏', 'info');
            }
        });
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
        reDownloadMod: reDownloadMod,
        toggleFav: toggleFav,
        loadMore: loadMore
    };
})();

function filterMarketMods() {
    MCGA.Market.filterMarketMods();
}

function sortMarket(sortBy) {
    MCGA.Market.sortMarket(sortBy);
}
