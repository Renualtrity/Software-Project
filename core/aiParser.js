var MCGA = MCGA || {};
MCGA.Core = MCGA.Core || {};

MCGA.Core.AIParser = (function() {

    var SYSTEM_PROMPT = '你是一个Minecraft模组设计助手。请将用户的自然语言需求转换为结构化的模组数据JSON。\\n\\n你需要输出一个JSON对象，格式如下：\\n```json\\n{\\n  \"modId\": \"modid\", // 小写英文+数字+下划线，必须以字母开头\\n  \"modName\": \"模组名称\",\\n  \"version\": \"1.0.0\",\\n  \"mcVersion\": \"1.20.1\", // 从用户配置获取，不要自行更改\\n  \"loader\": \"forge\", // 从用户配置获取，不要自行更改\\n  \"author\": \"作者名\", // 从用户配置获取，不要自行更改\\n  \"description\": \"模组描述\",\\n  \"features\": [\\n    {\\n      \"id\": \"feature_id\",\\n      \"name\": \"功能名称\",\\n      \"description\": \"功能描述\"\\n    }\\n  ],\\n  \"blocks\": [\\n    {\\n      \"id\": \"block_id\", // 小写英文+下划线\\n      \"name\": \"方块名称\",\\n      \"type\": \"block\", // block, ore, log, leaf, crop, ore_block等\\n      \"material\": \"stone\", // stone, wood, metal, glass, plant, ground, grass等\\n      \"hardness\": 3.0,\\n      \"resistance\": 3.0,\\n      \"harvestLevel\": 1, // 0=手, 1=木镐, 2=石镐, 3=铁镐\\n      \"harvestTool\": \"pickaxe\", // pickaxe, axe, shovel, hoe\\n      \"lightLevel\": 0, // 0-15\\n      \"drops\": \"self\", // self或物品ID\\n      \" creativeTab\": \"building_blocks\" // building_blocks, decorations, redstone, tools, combat, food, materials, natural等\\n    }\\n  ],\\n  \"items\": [\\n    {\\n      \"id\": \"item_id\",\\n      \"name\": \"物品名称\",\\n      \"type\": \"item\", // item, food, tool, sword, pickaxe, axe, armor, material\\n      \"maxStackSize\": 64,\\n      \"creativeTab\": \"materials\",\\n      \"food\": { // 仅食物类型需要\\n        \"hunger\": 4,\\n        \"saturation\": 0.3\\n      },\\n      \"tool\": { // 仅工具类型需要\\n        \"type\": \"pickaxe\", // pickaxe, axe, shovel, hoe, sword\\n        \"tier\": \"iron\", // wood, stone, iron, diamond, netherite, gold\\n        \"durability\": 250,\\n        \"attackDamage\": 4,\\n        \"attackSpeed\": 1.2,\\n        \"miningSpeed\": 6.0,\\n        \"miningLevel\": 2,\\n        \"enchantability\": 14\\n      },\\n      \"armor\": { // 仅盔甲类型需要\\n        \"slot\": \"chestplate\", // helmet, chestplate, leggings, boots\\n        \"durability\": 240,\\n        \"defense\": 6,\\n        \"toughness\": 0,\\n        \"enchantability\": 10\\n      }\\n    }\\n  ],\\n  \"recipes\": [\\n    {\\n      \"id\": \"recipe_id\",\\n      \"type\": \"crafting_shaped\", // crafting_shaped, crafting_shapeless, smelting, blasting, smoking\\n      \"output\": \"modid:item_id\",\\n      \"outputCount\": 1,\\n      \"pattern\": [\\n        \"AAA\",\\n        \"ABA\",\\n        \"AAA\"\\n      ],\\n      \"key\": {\\n        \"A\": \"minecraft:iron_ingot\",\\n        \"B\": \"minecraft:diamond\"\\n      },\\n      \"cookingTime\": 200, // 仅冶炼类需要\\n      \"experience\": 0.5 // 仅冶炼类需要\\n    }\\n  ]\\n}\\n```\\n\\n注意事项：\\n1. 只输出JSON，不要输出任何解释文字\\n2. modId必须是有效的Java标识符格式（小写字母开头，只含a-z,0-9,_）\\n3. 如果用户没有指定某些内容，可以适度发挥创意补充\\n4. 配方中的物品引用必须使用modid:id格式，原版物品用minecraft:前缀\\n5. 方块和物品的ID不要重复\\n6. 如果用户描述很简单，不要设计太复杂的内容，保持简洁\\n7. 如果用户指定了mcVersion/loader/author，请使用用户指定的值';

    function parseWithAI(config, userInput, callback) {
        var settings = loadAISettings();
        if (!settings.enabled || !settings.apiKey) {
            callback(new Error('AI功能未启用或未配置API Key'));
            return;
        }

        var apiUrl = settings.apiUrl || 'https://api.deepseek.com/chat/completions';
        var model = settings.model || 'deepseek-chat';
        var temperature = typeof settings.temperature === 'number' ? settings.temperature : 0.7;

        var messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: '请设计一个Minecraft模组，需求如下：\\n\\n' + userInput + '\\n\\n基础配置：\\n- MC版本: ' + (config.mcVersion || '1.20.1') + '\\n- 加载器: ' + (config.loader || 'forge') + '\\n- 作者: ' + (config.author || 'MCGA') + '\\n\\n请直接输出JSON，不要有任何其他文字。' }
        ];

        fetch('/api/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiKey: settings.apiKey,
                apiUrl: apiUrl,
                model: model,
                messages: messages,
                temperature: temperature
            })
        })
        .then(function(response) {
            if (!response.ok) {
                return response.json().then(function(data) {
                    throw new Error(data.error || 'AI请求失败: ' + response.status);
                });
            }
            return response.json();
        })
        .then(function(data) {
            if (!data.success) {
                throw new Error(data.error || 'AI响应失败');
            }

            var content = data.content || '';
            var jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/) || [null, content];
            var jsonStr = jsonMatch[1] || content;

            // 尝试提取JSON
            var jsonStart = jsonStr.indexOf('{');
            var jsonEnd = jsonStr.lastIndexOf('}');
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
            }

            var modData = JSON.parse(jsonStr);

            // 补充必要字段
            modData.modId = modData.modId || config.modId;
            modData.modName = modData.modName || config.modName || modData.modId;
            modData.mcVersion = config.mcVersion || modData.mcVersion || '1.20.1';
            modData.loader = config.loader || modData.loader || 'forge';
            modData.author = config.author || modData.author || 'MCGA';
            modData.description = modData.description || userInput;
            modData.features = modData.features || [];
            modData.blocks = modData.blocks || [];
            modData.items = modData.items || [];
            modData.recipes = modData.recipes || [];

            // 确保方块有block_item
            for (var i = 0; i < modData.blocks.length; i++) {
                var block = modData.blocks[i];
                var hasItem = false;
                for (var j = 0; j < modData.items.length; j++) {
                    if (modData.items[j].id === block.id && modData.items[j].type === 'block_item') {
                        hasItem = true;
                        break;
                    }
                }
                if (!hasItem) {
                    modData.items.push({
                        id: block.id,
                        name: block.name,
                        type: 'block_item',
                        maxStackSize: 64,
                        creativeTab: block.creativeTab || 'building_blocks'
                    });
                }
            }

            callback(null, modData);
        })
        .catch(function(error) {
            console.error('AI parse error:', error);
            callback(error);
        });
    }

    function loadAISettings() {
        try {
            var raw = localStorage.getItem('mcga_ai_settings');
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (e) {
            console.error('Load AI settings error:', e);
        }
        return { enabled: false };
    }

    function saveAISettings(settings) {
        try {
            localStorage.setItem('mcga_ai_settings', JSON.stringify(settings));
        } catch (e) {
            console.error('Save AI settings error:', e);
        }
    }

    function getPresets() {
        return {
            deepseek: {
                name: 'DeepSeek',
                apiUrl: 'https://api.deepseek.com/chat/completions',
                models: ['deepseek-chat', 'deepseek-coder']
            },
            zhipu: {
                name: '智谱GLM',
                apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
                models: ['glm-4', 'glm-4-flash', 'glm-4-air', 'glm-4-plus']
            },
            openai: {
                name: 'OpenAI',
                apiUrl: 'https://api.openai.com/v1/chat/completions',
                models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo']
            },
            siliconflow: {
                name: '硅基流动',
                apiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
                models: ['deepseek-ai/DeepSeek-V3', 'deepseek-ai/DeepSeek-R1', 'Qwen/Qwen2.5-72B-Instruct']
            },
            custom: {
                name: '自定义',
                apiUrl: '',
                models: []
            }
        };
    }

    return {
        parseWithAI: parseWithAI,
        loadAISettings: loadAISettings,
        saveAISettings: saveAISettings,
        getPresets: getPresets
    };
})();
