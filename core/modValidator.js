var MCGA = MCGA || {};
MCGA.Core = MCGA.Core || {};

MCGA.Core.ModValidator = (function() {
    function validateModJar(buildResult, modData, callback) {
        try {
            var result = {
                passed: true,
                issues: [],
                warnings: [],
                checks: {}
            };

            result.checks.structure = checkStructure(buildResult, modData);
            if (!result.checks.structure.valid) {
                result.passed = false;
                result.issues = result.issues.concat(result.checks.structure.errors);
            }
            result.warnings = result.warnings.concat(result.checks.structure.warnings || []);

            result.checks.metadata = checkMetadata(buildResult, modData);
            if (!result.checks.metadata.valid) {
                result.passed = false;
                result.issues = result.issues.concat(result.checks.metadata.errors);
            }
            result.warnings = result.warnings.concat(result.checks.metadata.warnings || []);

            result.checks.crashRisks = checkCrashRisks(buildResult, modData);
            if (!result.checks.crashRisks.valid) {
                result.passed = false;
                result.issues = result.issues.concat(result.checks.crashRisks.errors);
            }
            result.warnings = result.warnings.concat(result.checks.crashRisks.warnings || []);

            result.readme = generateReadme(modData, result);

            callback(null, result);
        } catch (e) {
            callback(new Error('校验异常: ' + e.message), null);
        }
    }

    function checkStructure(buildResult, modData) {
        var result = {
            valid: true,
            errors: [],
            warnings: []
        };

        var files = buildResult.projectFiles && buildResult.projectFiles.files 
            ? buildResult.projectFiles.files 
            : (buildResult.files || {});

        if (!files['build.gradle']) {
            result.errors.push('缺少 build.gradle 构建脚本');
            result.valid = false;
        }

        if (!files['src/main/resources/META-INF/mods.toml']) {
            result.errors.push('缺少 mods.toml 元数据文件');
            result.valid = false;
        }

        var hasMainClass = false;
        var fileKeys = Object.keys(files);
        for (var i = 0; i < fileKeys.length; i++) {
            if (fileKeys[i].endsWith('.java') && fileKeys[i].indexOf('src/main/java') !== -1) {
                hasMainClass = true;
                break;
            }
        }

        if (!hasMainClass) {
            result.errors.push('未找到 Java 源码文件');
            result.valid = false;
        }

        var hasLangEn = false;
        var hasLangZh = false;
        for (var j = 0; j < fileKeys.length; j++) {
            if (fileKeys[j].indexOf('lang/en_us.json') !== -1) hasLangEn = true;
            if (fileKeys[j].indexOf('lang/zh_cn.json') !== -1) hasLangZh = true;
        }

        if (!hasLangEn) {
            result.warnings.push('缺少英文语言文件 (en_us.json)');
        }
        if (!hasLangZh) {
            result.warnings.push('缺少中文语言文件 (zh_cn.json)');
        }

        return result;
    }

    function checkMetadata(buildResult, modData) {
        var result = {
            valid: true,
            errors: [],
            warnings: []
        };

        var modsToml = null;
        var files = buildResult.projectFiles && buildResult.projectFiles.files 
            ? buildResult.projectFiles.files 
            : (buildResult.files || {});
        modsToml = files['src/main/resources/META-INF/mods.toml'];

        if (!modsToml) {
            result.errors.push('mods.toml 文件内容为空');
            result.valid = false;
            return result;
        }

        if (modsToml.indexOf('modId') === -1) {
            result.errors.push('mods.toml 中缺少 modId 字段');
            result.valid = false;
        }

        if (modsToml.indexOf('license') === -1) {
            result.errors.push('mods.toml 中缺少 license 字段');
            result.valid = false;
        }

        if (modsToml.indexOf('version') === -1) {
            result.errors.push('mods.toml 中缺少 version 字段');
            result.valid = false;
        }

        if (modsToml.indexOf(modData.modId) === -1) {
            result.warnings.push('mods.toml 中未找到模组 ID: ' + modData.modId);
        }

        if (modsToml.indexOf('[[dependencies') === -1) {
            result.warnings.push('mods.toml 中未声明依赖关系');
        }

        return result;
    }

    function checkCrashRisks(buildResult, modData) {
        var result = {
            valid: true,
            errors: [],
            warnings: []
        };

        var files = buildResult.projectFiles && buildResult.projectFiles.files 
            ? buildResult.projectFiles.files 
            : (buildResult.files || {});

        var fileKeys = Object.keys(files);
        var javaFiles = fileKeys.filter(function(f) { 
            return f.endsWith('.java') && f.indexOf('src/main/java') !== -1; 
        });

        for (var i = 0; i < javaFiles.length; i++) {
            var content = files[javaFiles[i]] || '';
            
            if (content.indexOf('DeferredRegister') === -1 && 
                content.indexOf('public class') !== -1 &&
                content.indexOf('Block') !== -1 &&
                javaFiles[i].indexOf('/block/') !== -1) {
                continue;
            }

            if (content.indexOf('DeferredRegister') === -1 && content.indexOf('@Mod') !== -1) {
                result.warnings.push('主类中未使用 DeferredRegister 注册方式');
            }
        }

        if (modData.mcVersion >= '1.20.5' && modData.loader === 'forge') {
            var hasNewRegistry = false;
            for (var j = 0; j < javaFiles.length; j++) {
                if (files[javaFiles[j]] && files[javaFiles[j]].indexOf('DeferredRegister') !== -1) {
                    hasNewRegistry = true;
                    break;
                }
            }
            if (!hasNewRegistry && javaFiles.length > 0) {
                result.warnings.push('高版本建议使用 DeferredRegister 注册机制');
            }
        }

        return result;
    }

    function autoFix(validationResult, buildResult, modData) {
        var fixes = [];
        var files = buildResult.projectFiles && buildResult.projectFiles.files 
            ? buildResult.projectFiles.files 
            : (buildResult.files || {});

        if (validationResult.checks.metadata && !validationResult.checks.metadata.valid) {
            for (var i = 0; i < validationResult.checks.metadata.errors.length; i++) {
                var err = validationResult.checks.metadata.errors[i];
                if (err.indexOf('license') !== -1 || err.indexOf('License') !== -1) {
                    fixes.push({ type: 'metadata', fix: '添加 license 字段' });
                }
            }
        }

        return {
            applied: fixes.length > 0,
            fixes: fixes
        };
    }

    function generateReadme(modData, validationResult) {
        var lines = [];
        lines.push('# ' + modData.modName + ' 模组说明书');
        lines.push('');
        lines.push('## 基本信息');
        lines.push('- **模组 ID**: ' + modData.modId);
        lines.push('- **模组名称**: ' + modData.modName);
        lines.push('- **版本**: ' + modData.version);
        lines.push('- **适用游戏版本**: ' + modData.mcVersion);
        lines.push('- **加载器**: ' + modData.loader.toUpperCase());
        lines.push('- **作者**: ' + (modData.author || 'MCGA Pro'));
        lines.push('- **许可证**: ' + (modData.license || 'MIT'));
        lines.push('');

        lines.push('## 功能介绍');
        lines.push(modData.description || '由 MCGA Pro 生成的模组');
        lines.push('');

        if (modData.features && modData.features.length > 0) {
            lines.push('## 主要功能');
            for (var i = 0; i < modData.features.length; i++) {
                lines.push('- ' + modData.features[i].name + ': ' + modData.features[i].description);
            }
            lines.push('');
        }

        if (modData.blocks && modData.blocks.length > 0) {
            lines.push('## 新增方块');
            for (var j = 0; j < modData.blocks.length; j++) {
                lines.push('- ' + modData.blocks[j].name + ' (`' + modData.modId + ':' + modData.blocks[j].id + '`)');
            }
            lines.push('');
        }

        if (modData.items && modData.items.length > 0) {
            var nonBlockItems = modData.items.filter(function(it) { return it.type !== 'block_item'; });
            if (nonBlockItems.length > 0) {
                lines.push('## 新增物品');
                for (var k = 0; k < nonBlockItems.length; k++) {
                    lines.push('- ' + nonBlockItems[k].name + ' (`' + modData.modId + ':' + nonBlockItems[k].id + '`)');
                }
                lines.push('');
            }
        }

        if (modData.recipes && modData.recipes.length > 0) {
            lines.push('## 合成配方');
            for (var r = 0; r < modData.recipes.length; r++) {
                var recipe = modData.recipes[r];
                lines.push('- ' + recipe.outputName + ': ' + recipe.type);
            }
            lines.push('');
        }

        lines.push('## 安装方法');
        lines.push('1. 确保已安装 ' + modData.loader.toUpperCase() + ' ' + modData.mcVersion + ' 版本');
        lines.push('2. 将模组 JAR 文件放入 `.minecraft/mods/` 文件夹');
        lines.push('3. 启动游戏即可');
        lines.push('');

        lines.push('## 常见问题');
        lines.push('**Q: 游戏启动崩溃怎么办？**');
        lines.push('A: 请检查游戏版本和加载器版本是否匹配，查看崩溃日志确认具体原因。');
        lines.push('');
        lines.push('**Q: 模组不显示怎么办？**');
        lines.push('A: 请确认模组已正确放入 mods 文件夹，且版本与游戏匹配。');
        lines.push('');

        lines.push('---');
        lines.push('*由 MCGA Pro 生成于 ' + new Date().toLocaleString() + '*');

        return lines.join('\n');
    }

    function analyzeCrashLog(logContent) {
        var result = {
            cause: 'unknown',
            type: 'unknown',
            suggestions: [],
            modCandidates: []
        };

        var lines = logContent.split('\n');
        var lowerLog = logContent.toLowerCase();

        if (lowerLog.indexOf('out of memory') !== -1 || lowerLog.indexOf('OutOfMemoryError') !== -1) {
            result.type = 'memory';
            result.cause = '内存不足';
            result.suggestions.push('增加游戏分配的内存（建议至少 4GB）');
            result.suggestions.push('关闭其他占用内存的程序');
            result.suggestions.push('减少安装的模组数量');
        }

        if (lowerLog.indexOf('classnotfoundexception') !== -1 || lowerLog.indexOf('nosuchmethoderror') !== -1) {
            result.type = 'version_mismatch';
            result.cause = '版本不匹配';
            result.suggestions.push('检查模组版本是否与游戏版本匹配');
            result.suggestions.push('确认 Forge/Fabric 加载器版本正确');
        }

        if (lowerLog.indexOf('duplicate') !== -1 && lowerLog.indexOf('mod') !== -1) {
            result.type = 'duplicate_mod';
            result.cause = '重复模组';
            result.suggestions.push('检查 mods 文件夹中是否有重复的模组');
            result.suggestions.push('删除重复的模组文件');
        }

        var modIdMatch = logContent.match(/modId[:\s]+["']?([a-z0-9_]+)["']?/i);
        if (modIdMatch) {
            result.modCandidates.push(modIdMatch[1]);
        }

        if (result.suggestions.length === 0) {
            result.suggestions.push('请查看完整崩溃日志以获取更多信息');
            result.suggestions.push('尝试只保留此模组测试是否正常运行');
            result.suggestions.push('确认游戏版本和加载器版本正确');
        }

        return result;
    }

    return {
        validateModJar: validateModJar,
        checkStructure: checkStructure,
        checkMetadata: checkMetadata,
        checkCrashRisks: checkCrashRisks,
        autoFix: autoFix,
        generateReadme: generateReadme,
        analyzeCrashLog: analyzeCrashLog
    };
})();