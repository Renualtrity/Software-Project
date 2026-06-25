var MCGA = MCGA || {};

MCGA.Help = (function() {
    var currentTab = 'faq';

    function init() {
        renderFaqList();
    }

    function switchHelpTab(tabName) {
        currentTab = tabName;

        var tabs = document.querySelectorAll('.help-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.remove('active');
            if (tabs[i].getAttribute('data-tab') === tabName) {
                tabs[i].classList.add('active');
            }
        }

        var contents = document.querySelectorAll('.help-content');
        for (var j = 0; j < contents.length; j++) {
            contents[j].classList.remove('active');
        }

        var targetContent = document.getElementById('help-' + tabName);
        if (targetContent) {
            targetContent.classList.add('active');
        }
    }

    function renderFaqList() {
        var listEl = document.getElementById('faq-list');
        if (!listEl || !MCGA.Core.Help) return;

        var faqs = MCGA.Core.Help.getFaqList();
        var html = '';

        for (var i = 0; i < faqs.length; i++) {
            var faq = faqs[i];
            html += '<div class="faq-item" onclick="MCGA.Help.toggleFaq(this)">' +
                '<div class="faq-question">' +
                '<span class="faq-icon">📌</span>' +
                '<span class="faq-q-text">' + escapeHtml(faq.question) + '</span>' +
                '<span class="faq-arrow">▼</span>' +
                '</div>' +
                '<div class="faq-answer">' +
                escapeHtml(faq.answer) +
                '</div>' +
                '</div>';
        }

        listEl.innerHTML = html;
    }

    function toggleFaq(item) {
        item.classList.toggle('open');
    }

    function submitFeedback() {
        if (!MCGA.Core.Help) {
            MCGA.showNotification('反馈功能暂不可用', 'error');
            return;
        }

        var typeEl = document.getElementById('feedback-type');
        var titleEl = document.getElementById('feedback-title');
        var contentEl = document.getElementById('feedback-content');
        var contactEl = document.getElementById('feedback-contact');

        var type = typeEl ? typeEl.value : 'other';
        var title = titleEl ? titleEl.value.trim() : '';
        var content = contentEl ? contentEl.value.trim() : '';
        var contact = contactEl ? contactEl.value.trim() : '';

        if (!title) {
            MCGA.showNotification('请填写反馈标题', 'warning');
            return;
        }
        if (!content) {
            MCGA.showNotification('请填写详细描述', 'warning');
            return;
        }

        var result = MCGA.Core.Help.submitFeedback({
            type: type,
            title: title,
            content: content,
            contact: contact
        });

        if (result.success) {
            MCGA.showNotification('反馈提交成功，感谢您的支持！', 'success');
            if (titleEl) titleEl.value = '';
            if (contentEl) contentEl.value = '';
            if (contactEl) contactEl.value = '';
        } else {
            MCGA.showNotification('提交失败，请稍后重试', 'error');
        }
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    return {
        init: init,
        switchHelpTab: switchHelpTab,
        renderFaqList: renderFaqList,
        toggleFaq: toggleFaq,
        submitFeedback: submitFeedback
    };
})();

function switchHelpTab(tabName) {
    MCGA.Help.switchHelpTab(tabName);
}

function submitFeedback() {
    MCGA.Help.submitFeedback();
}
