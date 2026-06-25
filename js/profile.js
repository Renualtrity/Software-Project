var MCGA = MCGA || {};

MCGA.Profile = (function() {
    function init() {
        refreshProfile();
    }

    function refreshProfile() {
        if (!MCGA.Core.Profile) return;

        var user = MCGA.Core.Profile.getCurrentUser();
        var stats = MCGA.Core.Profile.getUserStats();

        var avatarEl = document.getElementById('profile-avatar');
        var nameEl = document.getElementById('profile-name');
        var emailEl = document.getElementById('profile-email');
        var modCountEl = document.getElementById('profile-mod-count');
        var downloadCountEl = document.getElementById('profile-download-count');
        var favCountEl = document.getElementById('profile-fav-count');
        var loginSection = document.getElementById('profile-login-section');
        var btnChangePwd = document.getElementById('btn-change-pwd');
        var btnBindEmail = document.getElementById('btn-bind-email');
        var btnManageDevices = document.getElementById('btn-manage-devices');
        var btnDeleteAccount = document.getElementById('btn-delete-account');

        if (avatarEl) avatarEl.textContent = user ? user.avatar : '👤';
        if (nameEl) nameEl.textContent = user ? (user.nickname || user.username) : '未登录';
        if (emailEl) emailEl.textContent = user ? (user.email || '未绑定邮箱') : '点击登录体验更多功能';

        if (modCountEl) modCountEl.textContent = stats.modCount;
        if (downloadCountEl) downloadCountEl.textContent = stats.downloadCount;
        if (favCountEl) favCountEl.textContent = stats.favoriteCount;

        if (loginSection) {
            if (user) {
                loginSection.innerHTML = '<button class="btn-secondary" onclick="MCGA.Profile.logout()">退出登录</button>';
            } else {
                loginSection.innerHTML = '<button class="btn-primary" onclick="MCGA.Profile.showLoginModal()">登录 / 注册</button>';
            }
        }

        var isLoggedIn = !!user;
        if (btnChangePwd) btnChangePwd.disabled = !isLoggedIn;
        if (btnBindEmail) btnBindEmail.disabled = !isLoggedIn;
        if (btnManageDevices) btnManageDevices.disabled = !isLoggedIn;
        if (btnDeleteAccount) btnDeleteAccount.disabled = !isLoggedIn;

        refreshFavorites();
        refreshDownloads();
    }

    function refreshFavorites() {
        var container = document.getElementById('profile-favorites');
        if (!container || !MCGA.Core.Profile) return;

        var favorites = MCGA.Core.Profile.getFavorites();

        if (favorites.length === 0) {
            container.innerHTML = '<p class="empty-tip">暂无收藏的模组</p>';
            return;
        }

        var html = '<div class="fav-list">';
        for (var i = 0; i < Math.min(favorites.length, 5); i++) {
            var mod = favorites[i];
            html += '<div class="fav-item" onclick="showPage(\'market\')">' +
                '<span class="fav-icon">' + (mod.icon || '📦') + '</span>' +
                '<span class="fav-name">' + escapeHtml(mod.modName || mod.modId) + '</span>' +
                '<span class="fav-version">MC ' + mod.mcVersion + '</span>' +
                '</div>';
        }
        html += '</div>';
        container.innerHTML = html;
    }

    function refreshDownloads() {
        var container = document.getElementById('profile-downloads');
        if (!container || !MCGA.Core.Profile) return;

        var downloads = MCGA.Core.Profile.getDownloadHistory();

        if (downloads.length === 0) {
            container.innerHTML = '<p class="empty-tip">暂无下载记录</p>';
            return;
        }

        var html = '<div class="download-list">';
        for (var i = 0; i < Math.min(downloads.length, 5); i++) {
            var mod = downloads[i];
            html += '<div class="download-item">' +
                '<span class="download-icon">' + (mod.icon || '📦') + '</span>' +
                '<span class="download-name">' + escapeHtml(mod.modName || mod.modId) + '</span>' +
                '<span class="download-version">MC ' + mod.mcVersion + '</span>' +
                '</div>';
        }
        html += '</div>';
        container.innerHTML = html;
    }

    function showLoginModal() {
        var modalHtml = '<div id="login-modal" class="modal" style="display:flex;">' +
            '<div class="modal-content">' +
            '<div class="modal-header">' +
            '<h3>登录 / 注册</h3>' +
            '<button class="modal-close" onclick="MCGA.Profile.closeLoginModal()">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
            '<div class="login-tabs">' +
            '<button class="login-tab active" data-tab="login" onclick="MCGA.Profile.switchLoginTab(\'login\')">登录</button>' +
            '<button class="login-tab" data-tab="register" onclick="MCGA.Profile.switchLoginTab(\'register\')">注册</button>' +
            '</div>' +
            '<div id="login-form" class="login-form">' +
            '<div class="form-group">' +
            '<label>用户名</label>' +
            '<input type="text" id="login-username" placeholder="请输入用户名">' +
            '</div>' +
            '<div class="form-group">' +
            '<label>密码</label>' +
            '<input type="password" id="login-password" placeholder="请输入密码">' +
            '</div>' +
            '<button class="btn-primary btn-full" onclick="MCGA.Profile.doLogin()">登录</button>' +
            '</div>' +
            '<div id="register-form" class="login-form" style="display:none;">' +
            '<div class="form-group">' +
            '<label>用户名</label>' +
            '<input type="text" id="register-username" placeholder="请输入用户名（3-20位）">' +
            '</div>' +
            '<div class="form-group">' +
            '<label>邮箱（选填）</label>' +
            '<input type="email" id="register-email" placeholder="请输入邮箱">' +
            '</div>' +
            '<div class="form-group">' +
            '<label>密码</label>' +
            '<input type="password" id="register-password" placeholder="请输入密码（至少6位）">' +
            '</div>' +
            '<button class="btn-primary btn-full" onclick="MCGA.Profile.doRegister()">注册</button>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';

        var oldModal = document.getElementById('login-modal');
        if (oldModal) oldModal.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    function closeLoginModal() {
        var modal = document.getElementById('login-modal');
        if (modal) modal.remove();
    }

    function switchLoginTab(tab) {
        var loginTab = document.querySelector('.login-tab[data-tab="login"]');
        var registerTab = document.querySelector('.login-tab[data-tab="register"]');
        var loginForm = document.getElementById('login-form');
        var registerForm = document.getElementById('register-form');

        if (tab === 'login') {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        } else {
            loginTab.classList.remove('active');
            registerTab.classList.add('active');
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        }
    }

    function doLogin() {
        var username = document.getElementById('login-username').value;
        var password = document.getElementById('login-password').value;

        var result = MCGA.Core.Profile.login(username, password);
        if (result.success) {
            MCGA.showNotification('登录成功', 'success');
            closeLoginModal();
            refreshProfile();
        } else {
            MCGA.showNotification(result.error || '登录失败', 'error');
        }
    }

    function doRegister() {
        var username = document.getElementById('register-username').value;
        var email = document.getElementById('register-email').value;
        var password = document.getElementById('register-password').value;

        var result = MCGA.Core.Profile.register(username, email, password);
        if (result.success) {
            MCGA.showNotification('注册成功', 'success');
            closeLoginModal();
            refreshProfile();
        } else {
            MCGA.showNotification(result.error || '注册失败', 'error');
        }
    }

    function logout() {
        if (!confirm('确定要退出登录吗？')) return;
        MCGA.Core.Profile.logout();
        MCGA.showNotification('已退出登录', 'info');
        refreshProfile();
    }

    function changePassword() {
        if (!MCGA.Core.Profile || !MCGA.Core.Profile.isLoggedIn()) {
            MCGA.showNotification('请先登录', 'warning');
            return;
        }
        var oldPwd = prompt('请输入原密码：');
        if (oldPwd === null) return;
        var newPwd = prompt('请输入新密码（至少6位）：');
        if (newPwd === null) return;
        var confirmPwd = prompt('请再次输入新密码：');
        if (confirmPwd === null) return;

        if (newPwd !== confirmPwd) {
            MCGA.showNotification('两次密码不一致', 'error');
            return;
        }

        var result = MCGA.Core.Profile.changePassword(oldPwd, newPwd);
        if (result.success) {
            MCGA.showNotification('密码修改成功', 'success');
        } else {
            MCGA.showNotification(result.error || '修改失败', 'error');
        }
    }

    function bindEmail() {
        if (!MCGA.Core.Profile || !MCGA.Core.Profile.isLoggedIn()) {
            MCGA.showNotification('请先登录', 'warning');
            return;
        }
        var email = prompt('请输入要绑定的邮箱：');
        if (email === null) return;

        var result = MCGA.Core.Profile.bindEmail(email);
        if (result.success) {
            MCGA.showNotification('邮箱绑定成功', 'success');
            refreshProfile();
        } else {
            MCGA.showNotification(result.error || '绑定失败', 'error');
        }
    }

    function manageDevices() {
        if (!MCGA.Core.Profile || !MCGA.Core.Profile.isLoggedIn()) {
            MCGA.showNotification('请先登录', 'warning');
            return;
        }
        MCGA.showNotification('设备管理功能开发中', 'info');
    }

    function deleteAccount() {
        if (!MCGA.Core.Profile || !MCGA.Core.Profile.isLoggedIn()) {
            MCGA.showNotification('请先登录', 'warning');
            return;
        }
        if (!confirm('确定要注销账号吗？此操作不可恢复！')) return;
        var password = prompt('请输入密码确认注销：');
        if (password === null) return;

        var result = MCGA.Core.Profile.deleteAccount(password);
        if (result.success) {
            MCGA.showNotification('账号已注销', 'success');
            refreshProfile();
        } else {
            MCGA.showNotification(result.error || '注销失败', 'error');
        }
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    return {
        init: init,
        refreshProfile: refreshProfile,
        showLoginModal: showLoginModal,
        closeLoginModal: closeLoginModal,
        switchLoginTab: switchLoginTab,
        doLogin: doLogin,
        doRegister: doRegister,
        logout: logout,
        changePassword: changePassword,
        bindEmail: bindEmail,
        manageDevices: manageDevices,
        deleteAccount: deleteAccount
    };
})();

function showLoginModal() {
    MCGA.Profile.showLoginModal();
}

function changePassword() {
    MCGA.Profile.changePassword();
}

function bindEmail() {
    MCGA.Profile.bindEmail();
}

function manageDevices() {
    MCGA.Profile.manageDevices();
}

function deleteAccount() {
    MCGA.Profile.deleteAccount();
}
