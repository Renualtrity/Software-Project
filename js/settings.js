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
            MCGA.applyTheme(settings.theme);
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

document.addEventListener('DOMContentLoaded', function() {
    MCGA.Settings.load();
});