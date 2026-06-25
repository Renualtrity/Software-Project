var MCGA = MCGA || {};
MCGA.Mods = (function() {
    var selectedMods = [];
    
    function loadMods() {
        try {
            renderMods();
        } catch (e) {
            console.error('loadMods error:', e);
        }
    }
    
    function renderMods() {
        var grid = document.getElementById('mods-grid');
        if (!grid) return;
        
        var mods = getFilteredMods();
        
        if (mods.length === 0) {
            grid.innerHTML = '<p class="empty-tip">暂无模组，前往模组生成器创建第一个模组</p>';
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
        var searchEl = document.getElementById('mods-search');
        if (searchEl) keyword = searchEl.value;
        
        var versionFilter = '';
        var versionEl = document.getElementById('filter-version');
        if (versionEl) versionFilter = versionEl.value;
        
        var loaderFilter = '';
        var loaderEl = document.getElementById('filter-loader');
        if (loaderEl) loaderFilter = loaderEl.value;
        
        if (MCGA.Core.ModUtils) {
            return MCGA.Core.ModUtils.searchMods(keyword, {
                mcVersion: versionFilter,
                loader: loaderFilter
            });
        }
        return [];
    }
    
    function renderModCard(mod) {
        var statusClass = mod.status === 'success' ? 'success' : (mod.status === 'failed' ? 'error' : 'pending');
        var statusText = mod.status === 'success' ? '成功' : (mod.status === 'failed' ? '失败' : (mod.status === 'imported' ? '已导入' : '进行中'));
        
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
            '<div class="mod-card-desc">' + (mod.description || '暂无描述') + '</div>' +
            '<div class="mod-card-actions" onclick="event.stopPropagation()">' +
            '<button onclick="MCGA.Mods.downloadJar(\'' + mod.id + '\')">下载JAR</button>' +
            '<button onclick="MCGA.Mods.deleteMod(\'' + mod.id + '\')">删除</button>' +
            '</div>' +
            '</div>';
    }
    
    function filterMods() {
        renderMods();
    }
    
    function showDetail(modId) {
        var mod = MCGA.Core.ModUtils ? MCGA.Core.ModUtils.getModById(modId) : null;
        if (!mod) return;
        
        var modal = document.getElementById('mod-detail-modal');
        var titleEl = document.getElementById('detail-title');
        var bodyEl = document.getElementById('detail-body');
        
        if (!modal || !titleEl || !bodyEl) return;
        
        titleEl.textContent = mod.modName || mod.modId;
        
        var html = '';
        html += '<div class="detail-section">';
        html += '<h4>基本信息</h4>';
        html += '<div class="detail-grid">';
        html += '<div class="detail-item"><span class="detail-label">模组 ID</span><span class="detail-value">' + mod.modId + '</span></div>';
        html += '<div class="detail-item"><span class="detail-label">版本</span><span class="detail-value">' + mod.version + '</span></div>';
        html += '<div class="detail-item"><span class="detail-label">游戏版本</span><span class="detail-value">' + mod.mcVersion + '</span></div>';
        html += '<div class="detail-item"><span class="detail-label">加载器</span><span class="detail-value">' + mod.loader.toUpperCase() + '</span></div>';
        html += '<div class="detail-item"><span class="detail-label">作者</span><span class="detail-value">' + (mod.author || '-') + '</span></div>';
        html += '<div class="detail-item"><span class="detail-label">状态</span><span class="detail-value">' + getStatusText(mod.status) + '</span></div>';
        html += '</div>';
        html += '</div>';
        
        html += '<div class="detail-section">';
        html += '<h4>模组描述</h4>';
        html += '<div class="detail-desc">' + (mod.description || '暂无描述') + '</div>';
        html += '</div>';
        
        if (mod.validateResult && mod.validateResult.readme) {
            html += '<div class="detail-section">';
            html += '<h4>模组说明书</h4>';
            html += '<div class="detail-desc" style="white-space: pre-wrap;">' + escapeHtml(mod.validateResult.readme) + '</div>';
            html += '</div>';
        }
        
        html += '<div class="detail-actions">';
        html += '<button class="btn-primary" onclick="MCGA.Mods.downloadJar(\'' + mod.id + '\')">📥 下载 JAR</button>';
        html += '<button class="btn-secondary" onclick="MCGA.Mods.exportConfig(\'' + mod.id + '\')">📤 导出配置</button>';
        html += '<button class="btn-danger" onclick="MCGA.Mods.deleteMod(\'' + mod.id + '\');closeModal(\'mod-detail-modal\')">🗑️ 删除</button>';
        html += '</div>';
        
        bodyEl.innerHTML = html;
        modal.style.display = 'flex';
    }
    
    function getStatusText(status) {
        var map = {
            success: '✅ 构建成功',
            failed: '❌ 构建失败',
            pending: '⏳ 等待中',
            running: '🔄 进行中',
            timeout: '⏰ 超时',
            canceled: '🚫 已取消',
            imported: '📥 已导入'
        };
        return map[status] || status;
    }
    
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function downloadJar(modId) {
        var mod = MCGA.Core.ModUtils ? MCGA.Core.ModUtils.getModById(modId) : null;
        if (!mod) {
            MCGA.showNotification('模组不存在', 'error');
            return;
        }
        
        if (mod.status !== 'success') {
            MCGA.showNotification('该模组构建未成功，无法下载', 'warning');
            return;
        }
        
        var zipName = (mod.modId || 'mod') + '-' + mod.mcVersion + '-' + mod.version + '-sources.zip';

        // 生成包含所有源码的zip
        var files = mod.projectFiles || mod.modData;
        if (!files || !files.files) {
            MCGA.showNotification('源码数据不存在', 'error');
            return;
        }

        // 简单的zip生成（不压缩）
        var zipContent = generateZipFile(files.files);
        var blob = new Blob([zipContent], { type: 'application/zip' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = zipName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        MCGA.showNotification('开始下载源码包: ' + zipName, 'success');
    }
    
    function deleteMod(modId) {
        if (!confirm('确定要删除这个模组吗？')) return;
        
        if (MCGA.Core.ModUtils) {
            MCGA.Core.ModUtils.deleteMod(modId);
            MCGA.showNotification('已删除', 'info');
            renderMods();
            if (typeof MCGA.refreshDashboard === 'function') {
                MCGA.refreshDashboard();
            }
        }
    }
    
    function batchExport() {
        MCGA.showNotification('批量导出功能开发中', 'info');
    }
    
    function batchDelete() {
        MCGA.showNotification('批量删除功能开发中', 'info');
    }

    // 简单的ZIP文件生成器（不压缩）
    function generateZipFile(files) {
        var parts = [];
        var centralDirParts = [];
        var offset = 0;
        var fileCount = 0;

        for (var filepath in files) {
            if (!files.hasOwnProperty(filepath)) continue;
            fileCount++;

            var content = files[filepath];
            var pathBytes = strToUint8(filepath);
            var contentBytes = strToUint8(content);
            var crc = crc32a(contentBytes);

            // 本地文件头
            var localHeader = new Uint8Array(30 + pathBytes.length);
            var dv = new DataView(localHeader.buffer);
            dv.setUint32(0, 0x04034b50, true);
            dv.setUint16(4, 20, true);
            dv.setUint16(6, 0, true);
            dv.setUint32(8, crc, true);
            dv.setUint32(12, contentBytes.length, true);
            dv.setUint32(16, contentBytes.length, true);
            dv.setUint16(20, pathBytes.length, true);
            localHeader.set(pathBytes, 30);

            parts.push(localHeader);
            parts.push(contentBytes);

            // 中央目录条目
            var centralEntry = new Uint8Array(46 + pathBytes.length);
            var dv2 = new DataView(centralEntry.buffer);
            dv2.setUint32(0, 0x02014b50, true);
            dv2.setUint16(4, 20, true);
            dv2.setUint16(6, 20, true);
            dv2.setUint16(8, 0, true);
            dv2.setUint32(10, crc, true);
            dv2.setUint32(14, contentBytes.length, true);
            dv2.setUint32(18, contentBytes.length, true);
            dv2.setUint16(22, pathBytes.length, true);
            dv2.setUint16(24, 0, true);
            dv2.setUint32(28, offset, true);
            centralDirParts.push(centralEntry);

            offset += 30 + pathBytes.length + contentBytes.length;
        }

        var centralDirOffset = offset;
        var centralDirSize = centralDirParts.reduce(function(s, p) { return s + p.length; }, 0);
        var totalSize = offset + centralDirSize + 22;

        var zip = new Uint8Array(totalSize);
        var pos = 0;

        // 写入本地文件头和内容
        for (var i = 0; i < parts.length; i++) {
            zip.set(parts[i], pos);
            pos += parts[i].length;
        }

        // 写入中央目录
        for (var i = 0; i < centralDirParts.length; i++) {
            zip.set(centralDirParts[i], pos);
            pos += centralDirParts[i].length;
        }

        // 写入中央目录结尾
        var dv3 = new DataView(zip.buffer, pos);
        dv3.setUint32(0, 0x06054b50, true);
        dv3.setUint16(4, 0, true);
        dv3.setUint16(6, 0, true);
        dv3.setUint16(8, fileCount, true);
        dv3.setUint16(10, fileCount, true);
        dv3.setUint32(12, centralDirSize, true);
        dv3.setUint32(16, centralDirOffset, true);
        dv3.setUint16(20, 0, true);

        return zip;
    }

    function strToUint8(str) {
        var s = unescape(encodeURIComponent(str));
        var buf = new Uint8Array(s.length);
        for (var i = 0; i < s.length; i++) buf[i] = s.charCodeAt(i);
        return buf;
    }

    function crc32a(data) {
        var crc = 0xffffffff;
        for (var i = 0; i < data.length; i++) {
            crc = (crc >>> 8) ^ crcTab[(crc ^ data[i]) & 0xff];
        }
        return (crc ^ 0xffffffff) >>> 0;
    }

    var crcTab = (function() {
        var t = new Uint32Array(256);
        for (var n = 0; n < 256; n++) {
            var c = n;
            for (var k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
            t[n] = c;
        }
        return t;
    })();

    return {
        loadMods: loadMods,
        renderMods: renderMods,
        filterMods: filterMods,
        showDetail: showDetail,
        downloadJar: downloadJar,
        deleteMod: deleteMod,
        batchExport: batchExport,
        batchDelete: batchDelete
    };
})();

MCGA.loadMods = function() {
    MCGA.Mods.loadMods();
};

function filterMods() {
    MCGA.Mods.filterMods();
}

function batchExport() {
    MCGA.Mods.batchExport();
}

function batchDelete() {
    MCGA.Mods.batchDelete();
}