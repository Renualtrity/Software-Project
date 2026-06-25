var MCGA = MCGA || {};
MCGA.Core = MCGA.Core || {};

MCGA.Core.ModMarket = (function() {
    var STORAGE_KEY = 'mcga_market_downloads';
    var FAVORITES_KEY = 'mcga_market_favorites';

    var CATEGORIES = {
        technology: { name: '科技', icon: '⚙️' },
        magic: { name: '魔法', icon: '✨' },
        adventure: { name: '冒险', icon: '🗺️' },
        decoration: { name: '装饰', icon: '🏠' },
        utility: { name: '工具辅助', icon: '🔧' },
        food: { name: '食物农业', icon: '🌾' },
        worldgen: { name: '世界生成', icon: '🌍' },
        storage: { name: '存储管理', icon: '📦' }
    };

    var mockMods = [
        {
            id: 'market_001',
            modId: 'industrialcraft',
            modName: '工业时代 2',
            author: 'IC2 Team',
            version: '2.8.221',
            mcVersion: '1.20.1',
            loader: 'forge',
            category: 'technology',
            downloads: 12580000,
            rating: 4.8,
            icon: '⚙️',
            description: '经典的科技类模组，添加了大量的机器、能源系统和自动化设备。',
            tags: ['科技', '能源', '自动化'],
            updatedAt: '2024-01-15',
            size: '4.2 MB'
        },
        {
            id: 'market_002',
            modId: 'thaumcraft',
            modName: '神秘时代 6',
            author: 'Azanor',
            version: '6.1.BETA26',
            mcVersion: '1.12.2',
            loader: 'forge',
            category: 'magic',
            downloads: 8920000,
            rating: 4.9,
            icon: '✨',
            description: '探索神秘的魔法世界，研究奥术、炼金和傀儡术。',
            tags: ['魔法', '探索', '炼金'],
            updatedAt: '2023-12-20',
            size: '6.8 MB'
        },
        {
            id: 'market_003',
            modId: 'twilightforest',
            modName: '暮色森林',
            author: 'Benimatic',
            version: '4.2.1.1654',
            mcVersion: '1.20.1',
            loader: 'forge',
            category: 'adventure',
            downloads: 32450000,
            rating: 4.9,
            icon: '🌲',
            description: '进入暮色森林维度，探索神秘的生物群落和强大的Boss。',
            tags: ['维度', '冒险', 'Boss'],
            updatedAt: '2024-01-10',
            size: '8.5 MB'
        },
        {
            id: 'market_004',
            modId: 'chisel',
            modName: '凿子',
            author: 'tterrag',
            version: '4.0.3',
            mcVersion: '1.20.1',
            loader: 'forge',
            category: 'decoration',
            downloads: 15680000,
            rating: 4.7,
            icon: '🔨',
            description: '添加了大量装饰性方块，让你的建筑更加精美。',
            tags: ['装饰', '建筑', '方块'],
            updatedAt: '2024-01-05',
            size: '2.1 MB'
        },
        {
            id: 'market_005',
            modId: 'jei',
            modName: 'JEI 物品管理器',
            author: 'mezz',
            version: '15.3.0.30',
            mcVersion: '1.20.1',
            loader: 'forge',
            category: 'utility',
            downloads: 89500000,
            rating: 4.9,
            icon: '📖',
            description: 'Just Enough Items - 查看物品合成配方和用途的必备工具。',
            tags: ['工具', '合成', '查询'],
            updatedAt: '2024-01-18',
            size: '1.8 MB'
        },
        {
            id: 'market_006',
            modId: 'pamhc2',
            modName: 'Pam 丰收物语 2',
            author: 'Pam',
            version: '1.0.0',
            mcVersion: '1.20.1',
            loader: 'forge',
            category: 'food',
            downloads: 7820000,
            rating: 4.6,
            icon: '🍎',
            description: '添加了大量新的农作物、食物和烹饪系统。',
            tags: ['食物', '农业', '烹饪'],
            updatedAt: '2023-12-28',
            size: '3.5 MB'
        },
        {
            id: 'market_007',
            modId: 'biomesoplenty',
            modName: '超多生物群系',
            author: 'Forstride',
            version: '18.0.0.31',
            mcVersion: '1.20.1',
            loader: 'forge',
            category: 'worldgen',
            downloads: 45620000,
            rating: 4.8,
            icon: '🌴',
            description: '为 Minecraft 添加了超过 50 种新的生物群系。',
            tags: ['生物群系', '世界生成', '探索'],
            updatedAt: '2024-01-12',
            size: '5.2 MB'
        },
        {
            id: 'market_008',
            modId: 'ironchest',
            modName: '铁箱子',
            author: 'cpw',
            version: '14.2.0',
            mcVersion: '1.20.1',
            loader: 'forge',
            category: 'storage',
            downloads: 28900000,
            rating: 4.7,
            icon: '🗄️',
            description: '更大更好的箱子！从铁箱子到水晶箱子，各种材质任你选择。',
            tags: ['存储', '箱子', '升级'],
            updatedAt: '2024-01-08',
            size: '0.9 MB'
        },
        {
            id: 'market_009',
            modId: 'ae2',
            modName: '应用能源 2',
            author: 'AlgorithmX2',
            version: '15.0.9',
            mcVersion: '1.20.1',
            loader: 'forge',
            category: 'storage',
            downloads: 21340000,
            rating: 4.8,
            icon: '💾',
            description: '基于物质能量的高级存储系统和自动化网络。',
            tags: ['存储', '自动化', '网络'],
            updatedAt: '2024-01-16',
            size: '7.3 MB'
        },
        {
            id: 'market_010',
            modId: 'botania',
            modName: '植物魔法',
            author: 'Vazkii',
            version: '443',
            mcVersion: '1.20.1',
            loader: 'forge',
            category: 'magic',
            downloads: 18760000,
            rating: 4.9,
            icon: '🌸',
            description: '以植物为基础的魔法模组，用花朵产生魔力。',
            tags: ['魔法', '植物', '自动化'],
            updatedAt: '2024-01-14',
            size: '5.6 MB'
        },
        {
            id: 'market_011',
            modId: 'create',
            modName: '机械动力',
            author: 'simibubi',
            version: '0.5.1.f',
            mcVersion: '1.20.1',
            loader: 'forge',
            category: 'technology',
            downloads: 35200000,
            rating: 4.9,
            icon: '⚙️',
            description: '基于旋转动力的机械系统，建造精美的机器和装置。',
            tags: ['科技', '机械', '建筑'],
            updatedAt: '2024-01-17',
            size: '9.1 MB'
        },
        {
            id: 'market_012',
            modId: 'quark',
            modName: '夸克',
            author: 'Vazkii',
            version: '4.0.421',
            mcVersion: '1.20.1',
            loader: 'forge',
            category: 'utility',
            downloads: 16580000,
            rating: 4.8,
            icon: '🔷',
            description: '模块化的模组，添加了大量小而精的功能。',
            tags: ['工具', '优化', '功能'],
            updatedAt: '2024-01-11',
            size: '4.0 MB'
        }
    ];

    function getCategories() {
        return CATEGORIES;
    }

    function getAllMods() {
        return mockMods.slice();
    }

    function getModById(modId) {
        for (var i = 0; i < mockMods.length; i++) {
            if (mockMods[i].id === modId || mockMods[i].modId === modId) {
                return mockMods[i];
            }
        }
        return null;
    }

    function searchMods(keyword, filters) {
        var mods = getAllMods();
        keyword = (keyword || '').toLowerCase();
        filters = filters || {};

        return mods.filter(function(mod) {
            if (keyword) {
                var match = false;
                if (mod.modId && mod.modId.toLowerCase().indexOf(keyword) !== -1) match = true;
                if (mod.modName && mod.modName.toLowerCase().indexOf(keyword) !== -1) match = true;
                if (mod.description && mod.description.toLowerCase().indexOf(keyword) !== -1) match = true;
                if (mod.author && mod.author.toLowerCase().indexOf(keyword) !== -1) match = true;
                if (mod.tags) {
                    for (var i = 0; i < mod.tags.length; i++) {
                        if (mod.tags[i].toLowerCase().indexOf(keyword) !== -1) {
                            match = true;
                            break;
                        }
                    }
                }
                if (!match) return false;
            }
            if (filters.category && mod.category !== filters.category) return false;
            if (filters.mcVersion && mod.mcVersion !== filters.mcVersion) return false;
            if (filters.loader && mod.loader !== filters.loader) return false;
            return true;
        });
    }

    function sortMods(mods, sortBy) {
        var sorted = mods.slice();
        switch (sortBy) {
            case 'new':
                sorted.sort(function(a, b) {
                    return new Date(b.updatedAt) - new Date(a.updatedAt);
                });
                break;
            case 'downloads':
                sorted.sort(function(a, b) {
                    return b.downloads - a.downloads;
                });
                break;
            case 'rating':
                sorted.sort(function(a, b) {
                    return b.rating - a.rating;
                });
                break;
            case 'hot':
            default:
                sorted.sort(function(a, b) {
                    return (b.downloads * b.rating) - (a.downloads * a.rating);
                });
                break;
        }
        return sorted;
    }

    function getDownloadedMods() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function isDownloaded(modId) {
        var downloaded = getDownloadedMods();
        for (var i = 0; i < downloaded.length; i++) {
            if (downloaded[i].id === modId || downloaded[i].modId === modId) {
                return true;
            }
        }
        return false;
    }

    function downloadMod(modData) {
        var downloaded = getDownloadedMods();
        var modRecord = Object.assign({}, modData, {
            downloadedAt: Date.now(),
            downloadStatus: 'completed'
        });
        downloaded.unshift(modRecord);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(downloaded));
        } catch (e) {}
        return modRecord;
    }

    function getFavorites() {
        try {
            return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function isFavorite(modId) {
        var favorites = getFavorites();
        for (var i = 0; i < favorites.length; i++) {
            if (favorites[i].id === modId || favorites[i].modId === modId) {
                return true;
            }
        }
        return false;
    }

    function toggleFavorite(modData) {
        var favorites = getFavorites();
        var exists = false;
        var newFavorites = [];
        for (var i = 0; i < favorites.length; i++) {
            if (favorites[i].id === modData.id) {
                exists = true;
            } else {
                newFavorites.push(favorites[i]);
            }
        }
        if (!exists) {
            newFavorites.unshift(modData);
        }
        try {
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
        } catch (e) {}
        return !exists;
    }

    function removeFromDownloads(modId) {
        var downloaded = getDownloadedMods();
        var newDownloads = downloaded.filter(function(m) {
            return m.id !== modId && m.modId !== modId;
        });
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newDownloads));
        } catch (e) {}
        return newDownloads.length !== downloaded.length;
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
        getAllMods: getAllMods,
        getModById: getModById,
        searchMods: searchMods,
        sortMods: sortMods,
        getDownloadedMods: getDownloadedMods,
        isDownloaded: isDownloaded,
        downloadMod: downloadMod,
        getFavorites: getFavorites,
        isFavorite: isFavorite,
        toggleFavorite: toggleFavorite,
        removeFromDownloads: removeFromDownloads,
        formatDownloads: formatDownloads
    };
})();
