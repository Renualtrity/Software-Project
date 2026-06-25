var MCGA = MCGA || {};
MCGA.Core = MCGA.Core || {};

MCGA.Core.Profile = (function() {
    var USER_KEY = 'mcga_user_info';
    var SESSION_KEY = 'mcga_user_session';
    var FEEDBACK_KEY = 'mcga_user_feedback';

    var mockUser = null;

    function getCurrentUser() {
        try {
            var session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
            if (session && session.userId) {
                var user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
                if (user && user.id === session.userId) {
                    return user;
                }
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    function isLoggedIn() {
        return getCurrentUser() !== null;
    }

    function login(username, password) {
        if (!username || !password) {
            return { success: false, error: '用户名和密码不能为空' };
        }
        if (password.length < 6) {
            return { success: false, error: '密码长度不能少于6位' };
        }
        var user = {
            id: 'user_' + Date.now(),
            username: username,
            email: username + '@example.com',
            avatar: '👤',
            nickname: username,
            createdAt: Date.now(),
            lastLoginAt: Date.now(),
            vipLevel: 0,
            downloadCount: 0,
            generateCount: 0,
            favoriteCount: 0
        };
        try {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            localStorage.setItem(SESSION_KEY, JSON.stringify({
                userId: user.id,
                loginAt: Date.now(),
                token: 'mock_token_' + Date.now()
            }));
        } catch (e) {}
        return { success: true, user: user };
    }

    function register(username, email, password) {
        if (!username || !password) {
            return { success: false, error: '用户名和密码不能为空' };
        }
        if (password.length < 6) {
            return { success: false, error: '密码长度不能少于6位' };
        }
        if (username.length < 3) {
            return { success: false, error: '用户名长度不能少于3位' };
        }
        var user = {
            id: 'user_' + Date.now(),
            username: username,
            email: email || '',
            avatar: '👤',
            nickname: username,
            createdAt: Date.now(),
            lastLoginAt: Date.now(),
            vipLevel: 0,
            downloadCount: 0,
            generateCount: 0,
            favoriteCount: 0
        };
        try {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            localStorage.setItem(SESSION_KEY, JSON.stringify({
                userId: user.id,
                loginAt: Date.now(),
                token: 'mock_token_' + Date.now()
            }));
        } catch (e) {}
        return { success: true, user: user };
    }

    function logout() {
        try {
            localStorage.removeItem(SESSION_KEY);
        } catch (e) {}
        return true;
    }

    function updateUserInfo(updates) {
        var user = getCurrentUser();
        if (!user) {
            return { success: false, error: '用户未登录' };
        }
        var updated = Object.assign({}, user, updates);
        try {
            localStorage.setItem(USER_KEY, JSON.stringify(updated));
            return { success: true, user: updated };
        } catch (e) {
            return { success: false, error: '保存失败' };
        }
    }

    function changePassword(oldPassword, newPassword) {
        if (!isLoggedIn()) {
            return { success: false, error: '用户未登录' };
        }
        if (!oldPassword || !newPassword) {
            return { success: false, error: '密码不能为空' };
        }
        if (newPassword.length < 6) {
            return { success: false, error: '新密码长度不能少于6位' };
        }
        return { success: true, message: '密码修改成功' };
    }

    function bindEmail(email) {
        if (!isLoggedIn()) {
            return { success: false, error: '用户未登录' };
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return { success: false, error: '邮箱格式不正确' };
        }
        return updateUserInfo({ email: email });
    }

    function getLoginDevices() {
        if (!isLoggedIn()) {
            return [];
        }
        return [
            {
                id: 'dev_001',
                name: '当前设备 - Windows',
                type: 'desktop',
                lastActive: Date.now(),
                isCurrent: true,
                location: '本地'
            }
        ];
    }

    function removeDevice(deviceId) {
        if (!isLoggedIn()) {
            return { success: false, error: '用户未登录' };
        }
        return { success: true };
    }

    function deleteAccount(password) {
        if (!isLoggedIn()) {
            return { success: false, error: '用户未登录' };
        }
        if (!password) {
            return { success: false, error: '请输入密码确认' };
        }
        try {
            localStorage.removeItem(USER_KEY);
            localStorage.removeItem(SESSION_KEY);
        } catch (e) {}
        return { success: true };
    }

    function getUserStats() {
        var user = getCurrentUser();
        if (!user) {
            return {
                modCount: 0,
                downloadCount: 0,
                favoriteCount: 0
            };
        }
        var modHistory = [];
        try {
            modHistory = JSON.parse(localStorage.getItem('mcga_mod_history') || '[]');
        } catch (e) {}
        var downloadHistory = [];
        try {
            downloadHistory = JSON.parse(localStorage.getItem('mcga_market_downloads') || '[]');
        } catch (e) {}
        var favorites = [];
        try {
            favorites = JSON.parse(localStorage.getItem('mcga_market_favorites') || '[]');
        } catch (e) {}
        return {
            modCount: modHistory.length,
            downloadCount: downloadHistory.length,
            favoriteCount: favorites.length
        };
    }

    function getFavorites() {
        try {
            return JSON.parse(localStorage.getItem('mcga_market_favorites') || '[]');
        } catch (e) {
            return [];
        }
    }

    function getDownloadHistory() {
        try {
            return JSON.parse(localStorage.getItem('mcga_market_downloads') || '[]');
        } catch (e) {
            return [];
        }
    }

    function submitFeedback(feedbackData) {
        var feedback = {
            id: 'fb_' + Date.now(),
            type: feedbackData.type || 'other',
            title: feedbackData.title || '',
            content: feedbackData.content || '',
            contact: feedbackData.contact || '',
            userId: isLoggedIn() ? getCurrentUser().id : null,
            username: isLoggedIn() ? getCurrentUser().username : '匿名用户',
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

    function getFeedbackList() {
        try {
            return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    return {
        getCurrentUser: getCurrentUser,
        isLoggedIn: isLoggedIn,
        login: login,
        register: register,
        logout: logout,
        updateUserInfo: updateUserInfo,
        changePassword: changePassword,
        bindEmail: bindEmail,
        getLoginDevices: getLoginDevices,
        removeDevice: removeDevice,
        deleteAccount: deleteAccount,
        getUserStats: getUserStats,
        getFavorites: getFavorites,
        getDownloadHistory: getDownloadHistory,
        submitFeedback: submitFeedback,
        getFeedbackList: getFeedbackList
    };
})();
