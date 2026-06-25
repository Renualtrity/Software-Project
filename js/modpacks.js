var MCGA = MCGA || {};

MCGA.Modpacks = (function() {
    var allPacks = [];
    var currentOffset = 0;
    var totalPacks = 0;
    var isLoading = false;

    function init() {
        allPacks = [];
        currentOffset = 0;
        totalPacks = 0;
        renderModpacks(true);
    }

    function renderModpacks(reset) {
        var grid = document.getElementById('modpacks-grid');
        if (!grid) return;

        if (reset) {
            allPacks = [];
            currentOffset = 0;
            totalPacks = 0;
            grid.innerHTML = '<div class="loading-spinner">加载中...</div>';
        }

        if (isLoading) return;
        isLoading = true;

        var keyword = '';
        var searchEl = document.getElementById('modpacks-search');
        if (searchEl) keyword = searchEl.value;

        var category = '';
        var categoryEl = document.getElementById('modpacks-category');
        if (categoryEl) category = categoryEl.value;

        if (MCGA.Core.Modpacks) {
            MCGA.Core.Modpacks.searchModpacks(keyword, {
                category: category
            }, currentOffset, function(err, packs, pagination) {
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
                    allPacks = packs;
                } else {
                    allPacks = allPacks.concat(packs);
                }
                totalPacks = pagination ? pagination.total : 0;
                currentOffset = allPacks.length;

                if (allPacks.length === 0) {
                    grid.innerHTML = '<p class="empty-tip">没有找到符合条件的整合包</p>';
                    return;
                }

                var html = '';
                for (var i = 0; i < allPacks.length; i++) {
                    html += renderPackCard(allPacks[i]);
                }
                if (allPacks.length < totalPacks) {
                    html += '<div class="load-more-wrap" style="grid-column:1/-1;text-align:center;padding:20px;">' +
                        '<button class="btn-secondary" onclick="MCGA.Modpacks.loadMore()">加载更多 (' + allPacks.length + '/' + totalPacks + ')</button>' +
                        '</div>';
                } else if (totalPacks > 0) {
                    html += '<div class="load-more-wrap" style="grid-column:1/-1;text-align:center;padding:20px;color:#888;">' +
                        '已加载全部 (' + totalPacks + ' 个整合包)</div>';
                }
                grid.innerHTML = html;
            });
        }
    }

    function loadMore() {
        renderModpacks(false);
    }

    function renderPackCard(pack) {
        var isInstalled = MCGA.Core.Modpacks ? MCGA.Core.Modpacks.isInstalled(pack.id) : false;
        var downloadsText = MCGA.Core.Modpacks ? MCGA.Core.Modpacks.formatDownloads(pack.downloads) : pack.downloads;

        var iconHtml = pack.icon ?
            '<img src="' + pack.icon + '" alt="' + escapeHtml(pack.name) + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">' +
            '<span style="display:none">📦</span>' :
            '<span>📦</span>';

        var tagsHtml = '';
        if (pack.tags && pack.tags.length > 0) {
            for (var i = 0; i < Math.min(pack.tags.length, 4); i++) {
                tagsHtml += '<span class="pack-tag">' + escapeHtml(pack.tags[i]) + '</span>';
            }
        }

        return '<div class="modpack-card" onclick="MCGA.Modpacks.showDetail(\'' + pack.id + '\')">' +
            '<div class="modpack-header">' +
            '<div class="modpack-icon">' + iconHtml + '</div>' +
            '<div class="modpack-info">' +
            '<div class="modpack-title">' + escapeHtml(pack.name) + '</div>' +
            '<div class="modpack-author">' + escapeHtml(pack.author || '未知') + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="modpack-tags">' + tagsHtml + '</div>' +
            '<div class="modpack-desc">' + escapeHtml(pack.description || '') + '</div>' +
            '<div class="modpack-stats">' +
            '<span class="stat">下载: ' + downloadsText + '</span>' +
            '<span class="stat">⭐ ' + pack.rating + '</span>' +
            '</div>' +
            '<div class="modpack-footer">' +
            '<span class="mc-version">MC ' + pack.mcVersion + '</span>' +
            '<span class="loader-badge ' + pack.loader + '">' + pack.loader.toUpperCase() + '</span>' +
            '</div>' +
            '<div class="modpack-actions" onclick="event.stopPropagation()">' +
            (isInstalled ?
                '<button class="btn-secondary" onclick="MCGA.Modpacks.reDownloadPack(\'' + pack.id + '\')">重新下载</button>' :
                '<button class="btn-primary" onclick="MCGA.Modpacks.downloadPack(\'' + pack.id + '\')">📥 下载</button>') +
            '</div>' +
            '</div>';
    }

    function filterModpacks() {
        renderModpacks(true);
    }

    function showDetail(packId) {
        var modal = document.getElementById('mod-detail-modal');
        var titleEl = document.getElementById('detail-title');
        var bodyEl = document.getElementById('detail-body');

        if (!modal || !titleEl || !bodyEl) return;

        titleEl.textContent = '加载中...';
        bodyEl.innerHTML = '<div class="loading-spinner">加载中...</div>';
        modal.style.display = 'flex';

        if (!MCGA.Core.Modpacks) return;

        MCGA.Core.Modpacks.getModpackById(packId, function(err, pack) {
            if (err || !pack) {
                bodyEl.innerHTML = '<p class="empty-tip">加载失败，请稍后重试</p>';
                return;
            }

            var isInstalled = MCGA.Core.Modpacks.isInstalled(pack.id);
            var downloadsText = MCGA.Core.Modpacks.formatDownloads(pack.downloads);

            var iconHtml = pack.icon ?
                '<img src="' + pack.icon + '" alt="' + escapeHtml(pack.name) + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">' +
                '<span style="display:none">📦</span>' :
                '<span>📦</span>';

            var tagsHtml = '';
            if (pack.tags && pack.tags.length > 0) {
                for (var i = 0; i < pack.tags.length; i++) {
                    tagsHtml += '<span class="pack-tag">' + escapeHtml(pack.tags[i]) + '</span>';
                }
            }

            var versionsHtml = '';
            if (pack.versions && pack.versions.length > 0) {
                versionsHtml = '<div class="detail-section">' +
                    '<h4>版本列表</h4>' +
                    '<div class="versions-list">';
                for (var j = 0; j < Math.min(pack.versions.length, 5); j++) {
                    var v = pack.versions[j];
                    var fileSize = MCGA.Core.Modpacks.formatSize(v.files[0] ? v.files[0].size : 0);
                    versionsHtml += '<div class="version-item">' +
                        '<div class="version-name">' + escapeHtml(v.name) + '</div>' +
                        '<div class="version-meta">' +
                        '<span>' + v.gameVersions.join(', ') + '</span>' +
                        '<span>' + fileSize + '</span>' +
                        '</div>' +
                        '<button class="btn-sm" onclick="MCGA.Modpacks.downloadPack(\'' + pack.id + '\', \'' + v.id + '\')">下载</button>' +
                        '</div>';
                }
                versionsHtml += '</div></div>';
            }

            var html = '';
            html += '<div class="detail-top">' +
                '<div class="detail-icon-big">' + iconHtml + '</div>' +
                '<div class="detail-top-info">' +
                '<h3>' + escapeHtml(pack.name) + '</h3>' +
                '<p class="detail-author">作者：' + escapeHtml(pack.author) + '</p>' +
                '<div class="detail-tags">' + tagsHtml + '</div>' +
                '</div>' +
                '</div>';

            html += '<div class="detail-section">';
            html += '<h4>基本信息</h4>';
            html += '<div class="detail-grid">';
            html += '<div class="detail-item"><span class="detail-label">游戏版本</span><span class="detail-value">' + (pack.gameVersions ? pack.gameVersions.join(', ') : pack.mcVersion) + '</span></div>';
            html += '<div class="detail-item"><span class="detail-label">加载器</span><span class="detail-value">' + (pack.loaders ? pack.loaders.join(', ') : pack.loader).toUpperCase() + '</span></div>';
            html += '<div class="detail-item"><span class="detail-label">下载量</span><span class="detail-value">' + downloadsText + '</span></div>';
            html += '<div class="detail-item"><span class="detail-label">评分</span><span class="detail-value">⭐ ' + pack.rating + '</span></div>';
            html += '<div class="detail-item"><span class="detail-label">关注数</span><span class="detail-value">👥 ' + pack.follows + '</span></div>';
            html += '<div class="detail-item"><span class="detail-label">许可证</span><span class="detail-value">' + pack.license + '</span></div>';
            html += '</div>';
            html += '</div>';

            html += '<div class="detail-section">';
            html += '<h4>整合包介绍</h4>';
            html += '<div class="detail-desc">' + escapeHtml(pack.description || '') + '</div>';
            if (pack.body) {
                html += '<div class="detail-body">' + pack.body + '</div>';
            }
            html += '</div>';

            html += versionsHtml;

            html += '<div class="detail-actions">';
            if (isInstalled) {
                html += '<button class="btn-danger" onclick="MCGA.Modpacks.uninstallPack(\'' + pack.id + '\');closeModal(\'mod-detail-modal\')">🗑️ 卸载</button>';
                html += '<button class="btn-secondary" onclick="MCGA.Modpacks.reDownloadPack(\'' + pack.id + '\')">🔄 重新下载</button>';
            } else {
                html += '<button class="btn-primary" onclick="MCGA.Modpacks.downloadPack(\'' + pack.id + '\')">📥 下载整合包</button>';
            }
            if (pack.pageUrl) {
                html += '<button class="btn-secondary" onclick="window.open(\'' + pack.pageUrl + '\', \'_blank\')">🌐 查看详情</button>';
            }
            html += '</div>';

            bodyEl.innerHTML = html;
        });
    }

    function downloadPack(packId, versionId) {
        MCGA.showNotification('开始下载...', 'info');

        if (!MCGA.Core.Modpacks) {
            MCGA.showNotification('下载功能不可用', 'error');
            return;
        }

        MCGA.Core.Modpacks.downloadModpack(packId, versionId, function(err, fileInfo) {
            if (err) {
                MCGA.showNotification('下载失败：' + err.message, 'error');
                return;
            }

            MCGA.Core.Modpacks.getModpackById(packId, function(getErr, pack) {
                if (!getErr && pack) {
                    MCGA.Core.Modpacks.installModpack(pack);
                }
            });

            MCGA.showNotification('下载完成：' + fileInfo.filename, 'success');
            renderModpacks();
        });
    }

    function reDownloadPack(packId) {
        downloadPack(packId);
    }

    function uninstallPack(packId) {
        MCGA.Core.Modpacks.uninstallModpack(packId);
        MCGA.showNotification('已卸载', 'info');
        renderModpacks();
    }

    function importModpack() {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = '.mrpack,.zip';
        input.onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return;

            MCGA.showNotification('正在导入整合包...', 'info');

            setTimeout(function() {
                MCGA.Core.Modpacks.importLocalModpack({
                    name: file.name.replace(/\.(mrpack|zip)$/i, ''),
                    fileName: file.name,
                    size: file.size
                });
                MCGA.showNotification('导入成功', 'success');
                renderModpacks();
            }, 500);
        };
        input.click();
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
        reDownloadPack: reDownloadPack,
        uninstallPack: uninstallPack,
        importModpack: importModpack,
        loadMore: loadMore
    };
})();

function filterModpacks() {
    MCGA.Modpacks.filterModpacks();
}

function importModpack() {
    MCGA.Modpacks.importModpack();
}
