var MCGA = MCGA || {};
MCGA.Core = MCGA.Core || {};

MCGA.Core.Help = (function() {
    var FEEDBACK_KEY = 'mcga_feedback_history';

    var faqList = [
        {
            id: 'faq_001',
            question: 'MCGA Pro 是什么？',
            answer: 'MCGA Pro 是一款基于 AI 技术的 Minecraft 模组生成工具，只需用自然语言描述你想要的功能，就能自动生成完整可运行的模组代码和资源文件。'
        },
        {
            id: 'faq_002',
            question: '生成的模组支持哪些游戏版本？',
            answer: '目前支持 Minecraft 1.19.4、1.20、1.20.1、1.21、1.21.1 版本，支持 Forge、NeoForge 和 Fabric 三种加载器。'
        },
        {
            id: 'faq_003',
            question: '生成模组需要编程基础吗？',
            answer: '不需要。MCGA Pro 的核心理念就是让不懂编程的玩家也能轻松创建模组。只需用自然语言描述需求，AI 会自动生成所有代码。'
        },
        {
            id: 'faq_004',
            question: '生成的模组可以商用吗？',
            answer: '由 MCGA Pro 生成的模组代码，你拥有完全的使用权和修改权。可以自由分发、修改，也可以用于商业用途。但请遵守 Minecraft EULA 和相关模组的开源协议。'
        },
        {
            id: 'faq_005',
            question: '如何安装生成的模组？',
            answer: '生成成功后，下载 JAR 文件，将文件放入 Minecraft 客户端的 mods 文件夹中。确保你已经安装了对应的 Forge/Fabric 加载器。你也可以使用"启动器适配"功能一键安装。'
        },
        {
            id: 'faq_006',
            question: '游戏崩溃了怎么办？',
            answer: '首先使用工具箱中的"崩溃日志分析"功能，粘贴崩溃日志查看具体原因。常见问题包括模组版本不匹配、模组冲突、缺少前置模组等。'
        },
        {
            id: 'faq_007',
            question: '模组市场的模组从哪里来？',
            answer: '模组市场汇集了其他开发者分享的优质模组。所有模组都经过基本的安全检测，但仍建议在使用前自行确认安全性。'
        },
        {
            id: 'faq_008',
            question: '如何连接启动器？',
            answer: '在"启动器适配"页面，选择你使用的启动器（HMCL/PCL2/BakaTool），点击"连接"按钮，按照提示设置启动器路径即可。连接成功后可以一键安装模组。'
        },
        {
            id: 'faq_009',
            question: '我可以上传自己的模组到市场吗？',
            answer: '目前模组上传功能正在开发中，敬请期待。你可以通过"意见反馈"告诉我们你希望看到的功能。'
        },
        {
            id: 'faq_010',
            question: '生成的模组质量如何保证？',
            answer: 'MCGA Pro 使用先进的 AI 模型生成代码，并内置了多层校验机制，包括结构验证、语法检查和兼容性检测。但由于 AI 生成的特性，建议在使用前进行充分测试。'
        }
    ];

    var tutorials = [
        {
            id: 'tut_001',
            title: '快速开始：生成你的第一个模组',
            icon: '🚀',
            content: '打开模组生成器，输入模组名称、选择游戏版本，用自然语言描述你想要的功能，点击"开始生成"即可。生成过程中可以实时查看进度和日志。',
            steps: [
                '进入"模组生成器"页面',
                '填写模组名称和选择游戏版本',
                '用自然语言描述你想要的功能',
                '点击"开始生成"按钮',
                '等待生成完成，下载模组'
            ]
        },
        {
            id: 'tut_002',
            title: '如何写出高质量的需求描述',
            icon: '📝',
            content: '好的需求描述能让 AI 生成更符合预期的模组。建议包含：功能描述、具体数值、合成配方、交互方式等细节。',
            steps: [
                '明确说明要添加的内容（新方块/物品/生物等）',
                '描述具体属性（如亮度等级、伤害值、耐久度等）',
                '说明获取方式（如合成配方、掉落等）',
                '描述特殊效果和交互逻辑',
                '用清晰的语言分点描述'
            ]
        },
        {
            id: 'tut_003',
            title: '模组市场使用指南',
            icon: '🌐',
            content: '模组市场汇集了其他开发者分享的优质模组。你可以按分类浏览、搜索、筛选，下载喜欢的模组到本地。',
            steps: [
                '进入"模组市场"页面',
                '使用搜索框搜索模组名称或关键词',
                '通过分类和版本筛选器缩小范围',
                '点击模组卡片查看详情',
                '点击下载按钮获取模组'
            ]
        },
        {
            id: 'tut_004',
            title: '启动器适配：一键安装模组',
            icon: '🎮',
            content: '连接你的 Minecraft 启动器后，可以直接将模组安装到指定游戏版本的 mods 文件夹，无需手动操作。',
            steps: [
                '进入"启动器适配"页面',
                '选择你的启动器并点击"连接"',
                '设置启动器安装路径',
                '连接成功后选择目标游戏版本',
                '选择模组点击"快速安装"'
            ]
        },
        {
            id: 'tut_005',
            title: '工具箱使用指南',
            icon: '🔧',
            content: '工具箱提供了多个实用工具，帮助你更好地开发和使用模组。包括崩溃日志分析、合成配方预览、Mod ID 冲突检测等。',
            steps: [
                '进入"工具箱"页面',
                '选择你需要的工具',
                '按照工具提示输入相关信息',
                '查看分析结果和建议'
            ]
        },
        {
            id: 'tut_006',
            title: '整合包管理入门',
            icon: '📚',
            content: '整合包是一组预先配置好的模组集合，可以直接下载使用，省去了逐个安装和配置的麻烦。',
            steps: [
                '进入"整合包"页面',
                '浏览或搜索你感兴趣的整合包',
                '点击查看整合包详情和模组列表',
                '下载并导入整合包',
                '在启动器中选择对应版本开始游戏'
            ]
        }
    ];

    function getFaqList() {
        return faqList.slice();
    }

    function searchFaq(keyword) {
        keyword = (keyword || '').toLowerCase();
        if (!keyword) return faqList.slice();
        return faqList.filter(function(item) {
            return item.question.toLowerCase().indexOf(keyword) !== -1 ||
                   item.answer.toLowerCase().indexOf(keyword) !== -1;
        });
    }

    function getTutorials() {
        return tutorials.slice();
    }

    function getTutorialById(tutorialId) {
        for (var i = 0; i < tutorials.length; i++) {
            if (tutorials[i].id === tutorialId) {
                return tutorials[i];
            }
        }
        return null;
    }

    function submitFeedback(feedbackData) {
        var feedback = {
            id: 'fb_' + Date.now(),
            type: feedbackData.type || 'other',
            title: feedbackData.title || '',
            content: feedbackData.content || '',
            contact: feedbackData.contact || '',
            createdAt: Date.now(),
            status: 'pending'
        };
        var list = [];
        try {
            list = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]');
        } catch (e) {}
        list.unshift(feedback);
        try {
            localStorage.setItem(FEEDBACK_KEY, JSON.stringify(list));
        } catch (e) {}
        return { success: true, feedback: feedback };
    }

    function getFeedbackHistory() {
        try {
            return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function getFeedbackTypeText(type) {
        var map = {
            bug: 'Bug 反馈',
            feature: '功能建议',
            question: '使用问题',
            other: '其他'
        };
        return map[type] || type;
    }

    function getAboutInfo() {
        return {
            name: 'MCGA Pro',
            fullName: 'Minecraft AI 模组生成系统',
            version: '2.0.0',
            description: '用 AI 赋能模组开发，让每个人都能轻松创建属于自己的 Minecraft 模组。',
            supportedVersions: '1.19.4 - 1.21.1',
            supportedLoaders: ['Forge', 'NeoForge', 'Fabric'],
            features: [
                'AI 智能代码生成',
                '多版本多加载器支持',
                '模组市场浏览下载',
                '整合包管理',
                '启动器一键适配',
                '实用工具箱'
            ]
        };
    }

    return {
        getFaqList: getFaqList,
        searchFaq: searchFaq,
        getTutorials: getTutorials,
        getTutorialById: getTutorialById,
        submitFeedback: submitFeedback,
        getFeedbackHistory: getFeedbackHistory,
        getFeedbackTypeText: getFeedbackTypeText,
        getAboutInfo: getAboutInfo
    };
})();
