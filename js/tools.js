var MCGA = MCGA || {};
MCGA.Tools = (function() {
    function openCrashAnalyzer() {
        MCGA.showNotification('崩溃日志分析器已打开', 'info');
        var result = prompt('请粘贴 Minecraft 崩溃日志（首行）：');
        if (result && MCGA.Core.ModValidator) {
            var analysis = MCGA.Core.ModValidator.analyzeCrashLog(result);
            alert(
                '=== 崩溃分析结果 ===\n' +
                '原因: ' + analysis.cause + '\n' +
                '类型: ' + analysis.type + '\n\n' +
                '建议:\n' +
                analysis.suggestions.map(function(s, i) { return (i+1) + '. ' + s; }).join('\n')
            );
        }
    }
    
    function openRecipePreview() {
        MCGA.showNotification('合成配方预览器已打开', 'info');
    }
    
    function openModIdChecker() {
        MCGA.showNotification('Mod ID 冲突检测已打开', 'info');
    }
    
    function openImportLocal() {
        MCGA.showNotification('本地模组导入功能开发中', 'info');
    }
    
    return {
        openCrashAnalyzer: openCrashAnalyzer,
        openRecipePreview: openRecipePreview,
        openModIdChecker: openModIdChecker,
        openImportLocal: openImportLocal
    };
})();

function openCrashAnalyzer() {
    MCGA.Tools.openCrashAnalyzer();
}

function openRecipePreview() {
    MCGA.Tools.openRecipePreview();
}

function openModIdChecker() {
    MCGA.Tools.openModIdChecker();
}

function openImportLocal() {
    MCGA.Tools.openImportLocal();
}