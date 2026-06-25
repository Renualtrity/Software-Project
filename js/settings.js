var MCGA = MCGA || {};
MCGA.Settings = (function() {
    function load() {
        try {
            var settings = JSON.parse(localStorage.getItem('mcga_settings') || '{}');
            applyToUI(settings);
            return settings;
        } catch (e) {
            return {};
        }
    }
    
    function save() {
        try {
            var settings = getFromUI();
            localStorage.setItem('mcga_settings', JSON.stringify(settings));
            return settings;
        } catch (e) {
            return {};
        }
    }
    
    function getFromUI() {
        var settings = {};
        
        var defaultVersionEl = document.getElementById('setting-default-version');
        if (defaultVersionEl) settings.defaultVersion = defaultVersionEl.value;
        
        var defaultLoaderEl = document.getElementById('setting-default-loader');
        if (defaultLoaderEl) settings.defaultLoader = defaultLoaderEl.value;
        
        var authorEl = document.getElementById('setting-author');
        if (authorEl) settings.author = authorEl.value;
        
        var themeEl = document.getElementById('setting-theme');
        if (themeEl) settings.theme = themeEl.value;
        
        return settings;
    }
    
    function applyToUI(settings) {
        if (!settings) return;
        
        if (settings.defaultVersion) {
            var defaultVersionEl = document.getElementById('setting-default-version');
            if (defaultVersionEl) defaultVersionEl.value = settings.defaultVersion;
            
            var mcVersionEl = document.getElementById('mc-version');
            if (mcVersionEl) mcVersionEl.value = settings.defaultVersion;
        }
        
        if (settings.defaultLoader) {
            var defaultLoaderEl = document.getElementById('setting-default-loader');
            if (defaultLoaderEl) defaultLoaderEl.value = settings.defaultLoader;
            
            var modLoaderEl = document.getElementById('mod-loader');
            if (modLoaderEl) modLoaderEl.value = settings.defaultLoader;
        }
        
        if (settings.author) {
            var authorEl = document.getElementById('setting-author');
            if (authorEl) authorEl.value = settings.author;
            
            var modAuthorEl = document.getElementById('mod-author');
            if (modAuthorEl) modAuthorEl.value = settings.author;
        }
        
        if (settings.theme) {
            var themeEl = document.getElementById('setting-theme');
            if (themeEl) themeEl.value = settings.theme;
        } else {
            var themeEl2 = document.getElementById('setting-theme');
            if (themeEl2) themeEl2.value = 'dark';
        }
    }
    
    return {
        load: load,
        save: save
    };
})();

MCGA.Settings = MCGA.Settings;

function saveSettings() {
    MCGA.Settings.save();
}

function loadAIConfig() {
    try {
        var settings = MCGA.Core.AIParser ? MCGA.Core.AIParser.loadAISettings() : {};
        var enabledEl = document.getElementById('ai-enabled');
        if (enabledEl) enabledEl.checked = !!settings.enabled;
        var providerEl = document.getElementById('ai-provider');
        if (providerEl) providerEl.value = settings.provider || 'deepseek';
        var apiKeyEl = document.getElementById('ai-api-key');
        if (apiKeyEl) apiKeyEl.value = settings.apiKey || '';
        var apiUrlEl = document.getElementById('ai-api-url');
        if (apiUrlEl) apiUrlEl.value = settings.apiUrl || '';
        var modelEl = document.getElementById('ai-model');
        if (modelEl) modelEl.value = settings.model || 'deepseek-chat';
        var tempEl = document.getElementById('ai-temperature');
        if (tempEl) {
            tempEl.value = typeof settings.temperature === 'number' ? settings.temperature : 0.7;
            var tempValEl = document.getElementById('ai-temp-val');
            if (tempValEl) tempValEl.textContent = tempEl.value;
        }
        onAIProviderChange();
    } catch (e) {
        console.error('loadAIConfig error:', e);
    }
}

function saveAIConfig() {
    try {
        var settings = {};
        var enabledEl = document.getElementById('ai-enabled');
        if (enabledEl) settings.enabled = enabledEl.checked;
        var providerEl = document.getElementById('ai-provider');
        if (providerEl) settings.provider = providerEl.value;
        var apiKeyEl = document.getElementById('ai-api-key');
        if (apiKeyEl) settings.apiKey = apiKeyEl.value.trim();
        var apiUrlEl = document.getElementById('ai-api-url');
        if (apiUrlEl) settings.apiUrl = apiUrlEl.value.trim();
        var modelEl = document.getElementById('ai-model');
        if (modelEl) settings.model = modelEl.value;
        var tempEl = document.getElementById('ai-temperature');
        if (tempEl) settings.temperature = parseFloat(tempEl.value);

        // 自动填充预设API地址
        var presets = MCGA.Core.AIParser ? MCGA.Core.AIParser.getPresets() : {};
        var preset = presets[settings.provider];
        if (preset && preset.apiUrl && !settings.apiUrl) {
            settings.apiUrl = preset.apiUrl;
        }

        if (MCGA.Core.AIParser && MCGA.Core.AIParser.saveAISettings) {
            MCGA.Core.AIParser.saveAISettings(settings);
        }
    } catch (e) {
        console.error('saveAIConfig error:', e);
    }
}

function onAIProviderChange() {
    try {
        var providerEl = document.getElementById('ai-provider');
        if (!providerEl) return;
        var provider = providerEl.value;
        var presets = MCGA.Core.AIParser ? MCGA.Core.AIParser.getPresets() : {};
        var preset = presets[provider];

        var modelEl = document.getElementById('ai-model');
        if (modelEl && preset && preset.models) {
            var currentVal = modelEl.value;
            modelEl.innerHTML = '';
            for (var i = 0; i < preset.models.length; i++) {
                var opt = document.createElement('option');
                opt.value = preset.models[i];
                opt.textContent = preset.models[i];
                modelEl.appendChild(opt);
            }
            if (preset.models.indexOf(currentVal) >= 0) {
                modelEl.value = currentVal;
            }
        }

        var apiUrlWrap = document.getElementById('ai-api-url-wrap');
        if (apiUrlWrap) {
            apiUrlWrap.style.display = (provider === 'custom') ? 'flex' : 'none';
        }
    } catch (e) {
        console.error('onAIProviderChange error:', e);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    MCGA.Settings.load();
    loadAIConfig();
});