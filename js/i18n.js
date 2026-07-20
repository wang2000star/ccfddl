/**
 * i18n.js - Internationalization for zh/en bilingual support
 */
const I18N = {
    locale: 'zh', // default

    strings: {
        zh: {
            appTitle: 'CCF 会议/期刊时间线',
            searchPlaceholder: '搜索名称或缩写...',
            typeConference: '会议',
            typeJournal: '期刊',
            typeAll: '全部',
            categoryAll: '全部领域',
            yearLabel: '年份',
            showing: '显示',
            of: '/',
            results: '条结果',
            noResults: '没有找到匹配的结果',
            noResultsHint: '尝试调整筛选条件或搜索关键词',
            loading: '加载中...',
            submissionDeadline: '投稿截止',
            abstractDeadline: '摘要截止',
            rebuttalPeriod: 'Rebuttal',
            notification: '录用通知',
            cameraReady: 'Camera Ready',
            conferenceDate: '会议日期',
            location: '地点',
            noTimeline: '暂无时间线数据',
            journalType: '期刊型',
            sourceData: '数据来源：CCF推荐目录第七版 (2026年3月)',
            rankA: 'CCF-A',
            rankB: 'CCF-B',
            rankC: 'CCF-C',
        },
        en: {
            appTitle: 'CCF Conference/Journal Timeline',
            searchPlaceholder: 'Search by name or abbreviation...',
            typeConference: 'Conferences',
            typeJournal: 'Journals',
            typeAll: 'All',
            categoryAll: 'All Categories',
            yearLabel: 'Year',
            showing: 'Showing',
            of: 'of',
            results: 'results',
            noResults: 'No matching results',
            noResultsHint: 'Try adjusting filters or search keywords',
            loading: 'Loading...',
            submissionDeadline: 'Submission',
            abstractDeadline: 'Abstract',
            rebuttalPeriod: 'Rebuttal',
            notification: 'Notification',
            cameraReady: 'Camera Ready',
            conferenceDate: 'Conference',
            location: 'Location',
            noTimeline: 'No timeline data',
            journalType: 'Journal-type',
            sourceData: 'Data: CCF Recommended List 7th Edition (Mar 2026)',
            rankA: 'CCF-A',
            rankB: 'CCF-B',
            rankC: 'CCF-C',
        }
    },

    t(key) {
        return this.strings[this.locale]?.[key] || this.strings.en[key] || key;
    },

    setLocale(locale) {
        this.locale = locale;
        document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
        this.updateDOM();
    },

    toggle() {
        this.setLocale(this.locale === 'zh' ? 'en' : 'zh');
    },

    updateDOM() {
        // Update text content
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.t(key);
        });
        // Update placeholder attributes
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });
    }
};
