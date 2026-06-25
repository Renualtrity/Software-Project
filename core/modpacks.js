var MCGA = MCGA || {};
MCGA.Core = MCGA.Core || {};

MCGA.Core.Modpacks = (function() {
    var STORAGE_KEY = 'mcga_modpacks';

    var CATEGORIES = {
        tech: { name: '科技向', icon: '⚙️' },
        magic: { name: '魔法向', icon: '✨' },
        adventure: { name: '冒险向', icon: '🗺️' },
        hardcore: { name: '硬核向', icon: '💀' },
        lightweight: { name: '轻量优化', icon: '🚀' },
        kitchensink: { name: '万能厨房', icon: '🍳' }
    };

    var mockModpacks = [
        {
            id: 'pack_001',
            name: 'FTB Revelation',
            author: 'Feed The Beast',
            version: '3.5.0',
            mcVersion: '1.12.2',
            loader: 'forge',
            category: 'kitchensink',
            downloads: 5820000,
            rating: 4.7,
            icon: '🌐',
            description: '经典的大而全整合包，包含科技、魔法、冒险等多种玩法。',
            modCount: 248,
            tags: ['科技', '魔法', '冒险', '万能厨房'],
            updatedAt: '2024-01-10',
            size: '320 MB',
            mods: ['industrialcraft', 'thaumcraft', 'twilightforest', 'jei']
        },
        {
            id: 'pack_002',
            name: 'SkyFactory 4',
            author: 'Darkosto',
            version: '4.2.4',
            mcVersion: '1.12.2',
            loader: 'forge',
            category: 'tech',
            downloads: 8560000,
            rating: 4.8,
            icon: '🌤️',
            description: '经典的空岛科技整合包，从一棵树开始你的工业帝国。',
            modCount: 195,
            tags: ['空岛', '科技', '自动化'],
            updatedAt: '2024-01-08',
            size: '256 MB',
            mods: ['industrialcraft', 'ae2', 'jei']
        },
        {
            id: 'pack_003',
            name: 'SevTech: Ages',
            author: 'Darkosto',
            version: '3.2.3',
            mcVersion: '1.12.2',
            loader: 'forge',
            category: 'adventure',
            downloads: 4230000,
            rating: 4.9,
            icon: '⏳',
            description: '时代演进式整合包，从原始时代一步步发展到星际时代。',
            modCount: 308,
            tags: ['冒险', '科技', '进度', '硬核'],
            updatedAt: '2024-01-05',
            size: '412 MB',
            mods: ['twilightforest', 'industrialcraft', 'botania']
        },
        {
            id: 'pack_004',
            name: 'Better Minecraft',
            author: 'Lundeth',
            version: '1.20.1-20',
            mcVersion: '1.20.1',
            loader: 'forge',
            category: 'adventure',
            downloads: 12580000,
            rating: 4.8,
            icon: '🌟',
            description: '让 Minecraft 变得更好的轻量整合包，保留原版感觉。',
            modCount: 120,
            tags: ['冒险', '探索', '轻量'],
            updatedAt: '2024-01-15',
            size: '180 MB',
            mods: ['jei', 'quark', 'biomesoplenty']
        },
        {
            id: 'pack_005',
            name: 'All the Mods 9',
            author: 'ATM Team',
            version: '9.0.14',
            mcVersion: '1.20.1',
            loader: 'forge',
            category: 'kitchensink',
            downloads: 6890000,
            rating: 4.7,
            icon: '🎉',
            description: '包含所有热门模组的大型整合包，应有尽有。',
            modCount: 356,
            tags: ['科技', '魔法', '冒险', '大型'],
            updatedAt: '2024-01-18',
            size: '480 MB',
            mods: ['create', 'ae2', 'botania', 'jei', 'quark']
        },
        {
            id: 'pack_006',
            name: 'Fabric优化整合包',
            author: 'MCGA Team',
            version: '1.2.0',
            mcVersion: '1.20.1',
            loader: 'fabric',
            category: 'lightweight',
            downloads: 1560000,
            rating: 4.6,
            icon: '⚡',
            description: '基于 Fabric 的轻量优化整合包，显著提升游戏性能。',
            modCount: 45,
            tags: ['优化', '轻量', '性能'],
            updatedAt: '2024-01-12',
            size: '45 MB',
            mods: ['sodium', 'lithium', 'phosphor']
        },
        {
            id: 'pack_007',
            name: '机械动力之旅',
            author: 'Create Team',
            version: '1.0.5',
            mcVersion: '1.20.1',
            loader: 'forge',
            category: 'tech',
            downloads: 2340000,
            rating: 4.8,
            icon: '⚙️',
            description: '以机械动力为核心的科技整合包，打造精美工厂。',
            modCount: 156,
            tags: ['科技', '机械', '自动化', '建筑'],
            updatedAt: '2024-01-16',
            size: '220 MB',
            mods: ['create', 'jei', 'ironchest']
        },
        {
            id: 'pack_008',
            name: '魔法纪元',
            author: 'Magic Team',
            version: '2.1.0',
            mcVersion: '1.20.1',
            loader: 'forge',
            category: 'magic',
            downloads: 1890000,
            rating: 4.7,
            icon: '🔮',
            description: '专注于魔法玩法的整合包，探索神秘的魔法世界。',
            modCount: 98,
            tags: ['魔法', '探索', '冒险'],
            updatedAt: '2024-01-14',
            size: '165 MB',
            mods: ['botania', 'quark', 'biomesoplenty']
        }
    ];

    function getCategories() {
        return CATEGORIES;
    }

    function getAllModpacks() {
        return mockModpacks.slice();
    }

    function getModpackById(packId) {
        for (var i = 0; i < mockModpacks.length; i++) {
            if (mockModpacks[i].id === packId) {
                return mockModpacks[i];
            }
        }
        return null;
    }

    function searchModpacks(keyword, filters) {
        var packs = getAllModpacks();
        keyword = (keyword || '').toLowerCase();
        filters = filters || {};

        return packs.filter(function(pack) {
            if (keyword) {
                var match = false;
                if (pack.name && pack.name.toLowerCase().indexOf(keyword) !== -1) match = true;
                if (pack.description && pack.description.toLowerCase().indexOf(keyword) !== -1) match = true;
                if (pack.author && pack.author.toLowerCase().indexOf(keyword) !== -1) match = true;
                if (pack.tags) {
                    for (var i = 0; i < pack.tags.length; i++) {
                        if (pack.tags[i].toLowerCase().indexOf(keyword) !== -1) {
                            match = true;
                            break;
                        }
                    }
                }
                if (!match) return false;
            }
            if (filters.category && pack.category !== filters.category) return false;
            if (filters.mcVersion && pack.mcVersion !== filters.mcVersion) return false;
            if (filters.loader && pack.loader !== filters.loader) return false;
            return true;
        });
    }

    function getInstalledModpacks() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function isInstalled(packId) {
        var installed = getInstalledModpacks();
        for (var i = 0; i < installed.length; i++) {
            if (installed[i].id === packId) {
                return true;
            }
        }
        return false;
    }

    function installModpack(packData) {
        var installed = getInstalledModpacks();
        var packRecord = Object.assign({}, packData, {
            installedAt: Date.now(),
            installStatus: 'completed'
        });
        installed.unshift(packRecord);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(installed));
        } catch (e) {}
        return packRecord;
    }

    function uninstallModpack(packId) {
        var installed = getInstalledModpacks();
        var newInstalled = installed.filter(function(p) {
            return p.id !== packId;
        });
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newInstalled));
        } catch (e) {}
        return newInstalled.length !== installed.length;
    }

    function importLocalModpack(fileData) {
        var pack = {
            id: 'local_pack_' + Date.now(),
            name: fileData.name || '本地整合包',
            author: fileData.author || '未知',
            version: fileData.version || '1.0.0',
            mcVersion: fileData.mcVersion || '1.20.1',
            loader: fileData.loader || 'forge',
            category: fileData.category || 'kitchensink',
            icon: '📦',
            description: fileData.description || '从本地导入的整合包',
            modCount: fileData.modCount || 0,
            tags: ['本地', '导入'],
            isLocal: true,
            fileName: fileData.fileName || '',
            installedAt: Date.now(),
            installStatus: 'completed'
        };
        var installed = getInstalledModpacks();
        installed.unshift(pack);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(installed));
        } catch (e) {}
        return pack;
    }

    function formatDownloads(count) {
        if (count >= 10000000) {
            return (count / 10000000).toFixed(1) + '千万';
        } else if (count >= 10000) {
            return (count / 10000).toFixed(1) + '万';
        }
        return count.toString();
    }

    return {
        getCategories: getCategories,
        getAllModpacks: getAllModpacks,
        getModpackById: getModpackById,
        searchModpacks: searchModpacks,
        getInstalledModpacks: getInstalledModpacks,
        isInstalled: isInstalled,
        installModpack: installModpack,
        uninstallModpack: uninstallModpack,
        importLocalModpack: importLocalModpack,
        formatDownloads: formatDownloads
    };
})();
