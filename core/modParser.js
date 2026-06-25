var MCGA = MCGA || {};
MCGA.Core = MCGA.Core || {};

MCGA.Core.ModParser = (function() {
    var SUPPORTED_VERSIONS = {
        '1.21.1': { forge: '21.1.0', neoforge: '21.1.0', fabric: '0.104.0' },
        '1.21': { forge: '21.0.0', neoforge: '21.0.0', fabric: '0.100.0' },
        '1.20.1': { forge: '47.2.0', neoforge: '', fabric: '0.92.0' },
        '1.20': { forge: '46.0.14', neoforge: '', fabric: '0.83.0' },
        '1.19.4': { forge: '45.0.66', neoforge: '', fabric: '0.76.0' }
    };

    var KNOWN_MOD_IDS = [
        'minecraft', 'forge', 'neoforge', 'fabric', 'jei', 'jei-core',
        'justenoughitems', 'jade', 'waila', 'hwyla', 'journeymap',
        'xaerominimap', 'xaeroworldmap', 'ironchest', 'ironcheststoo',
        'create', 'createmachinery', 'thermalexpansion', 'thermalfoundation',
        'mekanism', 'mekanismgenerators', 'mekanismtools', 'botania',
        'thaumcraft', 'ae2', 'appliedenergistics2', 'enderio',
        'tinkersconstruct', 'tconstruct', 'silentsgems', 'silentsmechanisms',
        'industrialforegoing', 'cyclic', 'quark', 'complementary',
        'oculus', 'sodium', 'lithium', 'phosphor', 'ferritecore'
    ];

    var TEMPLATES = [
        {
            id: 'basic_item',
            name: '基础物品',
            icon: '💎',
            description: '新增一个简单物品，带自定义名称和描述',
            template: '新增一个物品，名为"神秘水晶"，在创造模式物品栏可以找到，右键使用时有特殊效果'
        },
        {
            id: 'decorative_block',
            name: '装饰方块',
            icon: '🧱',
            description: '新增一个装饰性方块，可合成获取',
            template: '新增一个装饰方块，名为"大理石"，用石头合成，硬度和石头差不多，可以用来建筑装饰'
        },
        {
            id: 'weapon_tool',
            name: '武器工具',
            icon: '⚔️',
            description: '新增一把武器或工具，有特殊属性',
            template: '新增一把剑，名为"烈焰之剑"，用钻石和烈焰棒合成，攻击时有几率点燃目标'
        },
        {
            id: 'food_item',
            name: '食物物品',
            icon: '🍎',
            description: '新增一种食物，有特殊效果',
            template: '新增一种食物，名为"金苹果派"，用金苹果和小麦合成，食用后恢复饱食度并获得抗性提升效果'
        },
        {
            id: 'glowing_block',
            name: '发光方块',
            icon: '💡',
            description: '新增一个发光照明方块',
            template: '新增一个发光方块，亮度等级14，四个角放萤石粉合成，可以照亮黑暗区域并防止刷怪，放在副手对亡灵生物造成伤害'
        },
        {
            id: 'ore_gen',
            name: '矿石生成',
            icon: '⛏️',
            description: '新增一种矿石，世界自然生成',
            template: '新增一种矿石，名为"秘银矿"，在地下深层生成，用铁镐及以上开采，可以合成秘银工具和装备'
        },
        {
            id: 'armor_set',
            name: '装备套装',
            icon: '🛡️',
            description: '新增一整套盔甲装备',
            template: '新增一整套装备，名为"龙晶套装"，包括头盔、胸甲、护腿、靴子，用龙晶合成，穿满一套有特殊效果'
        },
        {
            id: 'potion_item',
            name: '药水效果',
            icon: '🧪',
            description: '新增药水或状态效果',
            template: '新增一种药水，名为"飞行药水"，用幻翼膜和粗制药水合成，饮用后获得短暂的飞行能力'
        },
        {
            id: 'command_mod',
            name: '指令辅助',
            icon: '⌨️',
            description: '新增游戏指令功能',
            template: '新增一个指令 /fly，可以切换飞行模式，需要有管理员权限才能使用'
        },
        {
            id: 'mob_entity',
            name: '生物实体',
            icon: '👾',
            description: '新增一种生物实体',
            template: '新增一个友好生物，名为"精灵"，在森林中生成，可以和玩家交易，用绿宝石兑换稀有物品'
        }
    ];

    function parseRequirement(config, userInput, callback) {
        try {
            var result = {
                modId: config.modId,
                modName: config.modName || config.modId,
                version: config.modVersion || '1.0.0',
                mcVersion: config.mcVersion,
                loader: config.loader,
                author: config.author || 'MCGA Pro',
                description: userInput || '由 MCGA Pro 生成的模组',
                license: 'MIT',
                features: [],
                blocks: [],
                items: [],
                recipes: [],
                entities: [],
                creativeTabs: []
            };

            var input = (userInput || '').toLowerCase();

            detectBlocks(input, result);
            detectItems(input, result);
            detectRecipes(input, result, config);
            detectFeatures(input, result);
            detectCreativeTab(input, result, config);

            var loaderVersion = getLoaderVersion(config.mcVersion, config.loader);
            result.loaderVersion = loaderVersion;

            callback(null, result);
        } catch (e) {
            callback(new Error('需求解析失败: ' + e.message), null);
        }
    }

    function detectBlocks(input, result) {
        var blockPatterns = [
            { pattern: /发光.*方块|方块.*发光|照明方块|light.*block|glow.*block/i, name: '发光方块', type: 'glowing' },
            { pattern: /装饰方块|建筑方块|decorative.*block/i, name: '装饰方块', type: 'decorative' },
            { pattern: /矿石|ore/i, name: '矿石', type: 'ore' },
            { pattern: /机器|machine/i, name: '机器方块', type: 'machine' },
            { pattern: /容器|箱子|chest|container/i, name: '容器方块', type: 'container' }
        ];

        for (var i = 0; i < blockPatterns.length; i++) {
            var p = blockPatterns[i];
            if (p.pattern.test(input)) {
                var blockName = generateBlockName(result.modId, p.name);
                var block = {
                    id: blockName.id,
                    name: blockName.name,
                    type: p.type,
                    translationKey: 'block.' + result.modId + '.' + blockName.id,
                    properties: {}
                };

                if (p.type === 'glowing') {
                    block.properties.lightLevel = extractLightLevel(input) || 14;
                    block.properties.noOcclusion = true;
                    block.properties.soundType = 'GLASS';
                    block.properties.strength = 0.3;
                } else if (p.type === 'ore') {
                    block.properties.harvestLevel = extractHarvestLevel(input) || 2;
                    block.properties.strength = 3.0;
                    block.properties.experience = true;
                } else {
                    block.properties.strength = 1.5;
                    block.properties.soundType = 'STONE';
                }

                result.blocks.push(block);
                result.features.push({ type: 'block', name: p.name, description: '新增' + p.name });
            }
        }
    }

    function detectItems(input, result) {
        var itemPatterns = [
            { pattern: /剑|武器|sword|weapon/i, name: '剑', type: 'sword' },
            { pattern: /镐|镐子|pickaxe/i, name: '镐', type: 'pickaxe' },
            { pattern: /食物|食品|food|edible/i, name: '食物', type: 'food' },
            { pattern: /药水|potion/i, name: '药水', type: 'potion' },
            { pattern: /盔甲|装备|armor/i, name: '盔甲', type: 'armor' },
            { pattern: /物品|item/i, name: '物品', type: 'basic' }
        ];

        for (var i = 0; i < itemPatterns.length; i++) {
            var p = itemPatterns[i];
            if (p.pattern.test(input) && result.items.length < result.blocks.length + 1) {
                var itemName = generateItemName(result.modId, p.name);
                var item = {
                    id: itemName.id,
                    name: itemName.name,
                    type: p.type,
                    translationKey: 'item.' + result.modId + '.' + itemName.id,
                    properties: {}
                };

                if (p.type === 'sword') {
                    item.properties.damage = 6;
                    item.properties.speed = -2.4;
                    item.properties.tier = 'DIAMOND';
                } else if (p.type === 'pickaxe') {
                    item.properties.damage = 4;
                    item.properties.speed = -2.8;
                    item.properties.tier = 'DIAMOND';
                } else if (p.type === 'food') {
                    item.properties.nutrition = 6;
                    item.properties.saturation = 0.6;
                }

                result.items.push(item);
                result.features.push({ type: 'item', name: p.name, description: '新增' + p.name + '物品' });
            }
        }

        for (var j = 0; j < result.blocks.length; j++) {
            var blockItemName = result.blocks[j].id;
            var blockItem = {
                id: blockItemName,
                name: result.blocks[j].name,
                type: 'block_item',
                blockId: blockItemName,
                translationKey: 'item.' + result.modId + '.' + blockItemName,
                properties: {}
            };
            var exists = false;
            for (var k = 0; k < result.items.length; k++) {
                if (result.items[k].id === blockItemName) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                result.items.push(blockItem);
            }
        }
    }

    function detectRecipes(input, result, config) {
        for (var i = 0; i < result.blocks.length; i++) {
            var block = result.blocks[i];
            var recipe = generateDefaultRecipe(block, 'block', config);
            if (recipe) {
                result.recipes.push(recipe);
            }
        }
        for (var j = 0; j < result.items.length; j++) {
            var item = result.items[j];
            if (item.type === 'block_item') continue;
            var recipe2 = generateDefaultRecipe(item, 'item', config);
            if (recipe2) {
                result.recipes.push(recipe2);
            }
        }
    }

    function generateDefaultRecipe(target, type, config) {
        if (!target || !target.id) return null;

        if (target.type === 'glowing') {
            return {
                id: target.id,
                type: 'crafting_shaped',
                result: { item: config.modId + ':' + target.id, count: 1 },
                pattern: ['FSF', 'SGS', 'FSF'],
                key: {
                    F: { item: 'minecraft:glowstone_dust' },
                    G: { item: 'minecraft:glass' },
                    S: { item: 'minecraft:glass' }
                },
                outputName: target.name
            };
        }

        if (target.type === 'sword') {
            return {
                id: target.id,
                type: 'crafting_shaped',
                result: { item: config.modId + ':' + target.id, count: 1 },
                pattern: [' M ', ' M ', ' S '],
                key: {
                    M: { item: 'minecraft:diamond' },
                    S: { item: 'minecraft:stick' }
                },
                outputName: target.name
            };
        }

        if (target.type === 'ore') {
            return {
                id: target.id + '_block',
                type: 'crafting_shaped',
                result: { item: config.modId + ':' + target.id, count: 1 },
                pattern: ['MMM', 'MMM', 'MMM'],
                key: {
                    M: { item: config.modId + ':' + target.id.replace('_ore', '_ingot') }
                },
                outputName: target.name + '块'
            };
        }

        return {
            id: target.id,
            type: 'crafting_shaped',
            result: { item: config.modId + ':' + target.id, count: 1 },
            pattern: [' M ', 'MMM', ' M '],
            key: {
                M: { item: 'minecraft:diamond' }
            },
            outputName: target.name
        };
    }

    function detectFeatures(input, result) {
        if (/刷怪|刷怪|生成|spawn/i.test(input)) {
            result.features.push({ type: 'spawn_control', name: '刷怪控制', description: '控制生物生成' });
        }
        if (/亡灵|僵尸|骷髅|undead|zombie|skeleton/i.test(input)) {
            result.features.push({ type: 'undead_damage', name: '亡灵伤害', description: '对亡灵生物造成额外伤害' });
        }
        if (/副手|副手持|offhand/i.test(input)) {
            result.features.push({ type: 'offhand_effect', name: '副手效果', description: '放在副手时有特殊效果' });
        }
        if (/世界生成|自然生成|world.*gen/i.test(input)) {
            result.features.push({ type: 'world_gen', name: '世界生成', description: '世界中自然生成' });
        }
    }

    function detectCreativeTab(input, result, config) {
        if (result.blocks.length > 0 || result.items.length > 0) {
            result.creativeTabs.push({
                id: config.modId + '_tab',
                name: config.modName || config.modId,
                translationKey: 'itemGroup.' + config.modId,
                icon: result.blocks.length > 0 ? result.blocks[0].id : (result.items.length > 0 ? result.items[0].id : 'diamond')
            });
        }
    }

    function generateBlockName(modId, displayName) {
        var id = toSnakeCase(displayName);
        if (!id.endsWith('_block') && !id.endsWith('_ore')) {
            id = id + '_block';
        }
        return { id: id, name: displayName };
    }

    function generateItemName(modId, displayName) {
        var id = toSnakeCase(displayName);
        return { id: id, name: displayName };
    }

    function toSnakeCase(str) {
        return str.toLowerCase()
            .replace(/[\s]+/g, '_')
            .replace(/[^a-z0-9_]/g, '')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }

    function extractLightLevel(input) {
        var match = input.match(/亮度[^0-9]*([0-9]+)|light[^0-9]*([0-9]+)/i);
        if (match) {
            var level = parseInt(match[1] || match[2]);
            return Math.min(15, Math.max(0, level));
        }
        return null;
    }

    function extractHarvestLevel(input) {
        if (/铁.*镐|iron.*pick/i.test(input)) return 1;
        if (/钻石.*镐|diamond.*pick/i.test(input)) return 2;
        if (/下界合金|netherite/i.test(input)) return 3;
        return null;
    }

    function validateModId(modId) {
        var result = {
            valid: true,
            errors: [],
            warnings: [],
            suggestions: []
        };

        if (!modId) {
            result.valid = false;
            result.errors.push('模组 ID 不能为空');
            return result;
        }

        if (modId.length < 2) {
            result.valid = false;
            result.errors.push('模组 ID 长度不能少于 2 个字符');
        }

        if (modId.length > 32) {
            result.valid = false;
            result.errors.push('模组 ID 长度不能超过 32 个字符');
        }

        if (!/^[a-z]/.test(modId)) {
            result.valid = false;
            result.errors.push('模组 ID 必须以小写字母开头');
        }

        if (!/^[a-z0-9_]+$/.test(modId)) {
            result.valid = false;
            result.errors.push('模组 ID 只能包含小写字母、数字和下划线');
        }

        if (KNOWN_MOD_IDS.indexOf(modId.toLowerCase()) !== -1) {
            result.warnings.push('该 ID 与已知热门模组 ID 冲突，建议更换');
        }

        if (/^minecraft|^forge|^neoforge|^fabric/i.test(modId)) {
            result.errors.push('模组 ID 不能以 minecraft/forge/neoforge/fabric 等保留字开头');
            result.valid = false;
        }

        return result;
    }

    function getLoaderVersion(mcVersion, loader) {
        var versions = SUPPORTED_VERSIONS[mcVersion];
        if (versions && versions[loader]) {
            return versions[loader];
        }
        return null;
    }

    function getSupportedVersions() {
        return Object.keys(SUPPORTED_VERSIONS);
    }

    function getTemplates() {
        return TEMPLATES.slice();
    }

    function getTemplateById(id) {
        for (var i = 0; i < TEMPLATES.length; i++) {
            if (TEMPLATES[i].id === id) {
                return TEMPLATES[i];
            }
        }
        return null;
    }

    return {
        parseRequirement: parseRequirement,
        validateModId: validateModId,
        getLoaderVersion: getLoaderVersion,
        getSupportedVersions: getSupportedVersions,
        getTemplates: getTemplates,
        getTemplateById: getTemplateById,
        KNOWN_MOD_IDS: KNOWN_MOD_IDS.slice(),
        SUPPORTED_VERSIONS: JSON.parse(JSON.stringify(SUPPORTED_VERSIONS))
    };
})();