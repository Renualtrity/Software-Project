var MCGA = MCGA || {};

(function() {
    var currentPage = 'dashboard';

    MCGA.showPage = function(pageName) {
        try {
            var pages = document.querySelectorAll('.page');
            for (var i = 0; i < pages.length; i++) {
                pages[i].classList.remove('active');
            }
            var targetPage = document.getElementById('page-' + pageName);
            if (targetPage) {
                targetPage.classList.add('active');
            }
            var navItems = document.querySelectorAll('.nav-item');
            for (var j = 0; j < navItems.length; j++) {
                navItems[j].classList.remove('active');
                if (navItems[j].getAttribute('data-page') === pageName) {
                    navItems[j].classList.add('active');
                }
            }
            currentPage = pageName;
            if (pageName === 'dashboard' && typeof MCGA.refreshDashboard === 'function') {
                MCGA.refreshDashboard();
            }
            if (pageName === 'mods' && typeof MCGA.loadMods === 'function') {
                MCGA.loadMods();
            }
            if (pageName === 'market' && typeof MCGA.Market !== 'undefined' && typeof MCGA.Market.renderMarketMods === 'function') {
                MCGA.Market.renderMarketMods();
            }
            if (pageName === 'modpacks' && typeof MCGA.Modpacks !== 'undefined' && typeof MCGA.Modpacks.renderModpacks === 'function') {
                MCGA.Modpacks.renderModpacks();
            }
            if (pageName === 'launcher' && typeof MCGA.Launcher !== 'undefined' && typeof MCGA.Launcher.init === 'function') {
                MCGA.Launcher.init();
            }
            if (pageName === 'profile' && typeof MCGA.Profile !== 'undefined' && typeof MCGA.Profile.refreshProfile === 'function') {
                MCGA.Profile.refreshProfile();
            }
            if (pageName === 'help' && typeof MCGA.Help !== 'undefined' && typeof MCGA.Help.init === 'function') {
                MCGA.Help.init();
            }
        } catch (e) {
            console.error('showPage error:', e);
        }
    };

    MCGA.showNotification = function(message, type) {
        type = type || 'info';
        try {
            var container = document.getElementById('notification-container');
            if (!container) return;
            var notif = document.createElement('div');
            notif.className = 'notification ' + type;
            notif.textContent = message;
            container.appendChild(notif);
            setTimeout(function() {
                notif.style.opacity = '0';
                notif.style.transform = 'translateX(100%)';
                notif.style.transition = 'all 0.3s ease';
                setTimeout(function() {
                    if (notif.parentNode) {
                        notif.parentNode.removeChild(notif);
                    }
                }, 300);
            }, 3000);
        } catch (e) {
            console.error('showNotification error:', e);
        }
    };

    MCGA.closeModal = function(modalId) {
        try {
            var modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
            }
        } catch (e) {
            console.error('closeModal error:', e);
        }
    };

    MCGA.applyTheme = function(theme) {
        try {
            if (theme === 'light') {
                document.body.classList.add('light-theme');
            } else {
                document.body.classList.remove('light-theme');
            }
        } catch (e) {
            console.error('applyTheme error:', e);
        }
    };

    function init() {
        try {
            var settings = MCGA.Settings && MCGA.Settings.load ? MCGA.Settings.load() : {};
            if (settings.theme) {
                MCGA.applyTheme(settings.theme);
            }
            MCGA.showPage('dashboard');
        } catch (e) {
            console.error('init error:', e);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

function showPage(pageName) {
    MCGA.showPage(pageName);
}

function closeModal(modalId) {
    MCGA.closeModal(modalId);
}

function applyTheme() {
    var themeSelect = document.getElementById('setting-theme');
    if (themeSelect) {
        MCGA.applyTheme(themeSelect.value);
    }
}