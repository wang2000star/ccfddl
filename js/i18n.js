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
            officialWebsite: '官网',
            submissions: '投稿数',
            accepted: '录用数',
            acceptanceRate: '录用率',
            sortDefault: '默认排序',
            sortDeadline: '投稿截止倒计时',
            sortConference: '会议召开时间',
            daysLeft: '天后截止',
            daysOverdue: '天前截止',
            overdue: '已截止',
            viewCards: '卡片视图',
            viewTimeline: '时间轴',
            ganttTitle: '📊 会议时间轴（检查一稿多投冲突）',
            ganttLegend: '图例：',
            ganttSubmission: '投稿期',
            ganttReview: '审稿期',
            ganttConference: '会议',
            ganttConflict: '⚠ 重叠可能冲突',
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
            officialWebsite: 'Website',
            submissions: 'Submissions',
            accepted: 'Accepted',
            acceptanceRate: 'Rate',
            sortDefault: 'Default',
            sortDeadline: 'By Deadline',
            sortConference: 'By Conf Date',
            daysLeft: 'd left',
            daysOverdue: 'd ago',
            overdue: 'Closed',
            viewCards: 'Cards',
            viewTimeline: 'Timeline',
            ganttTitle: '📊 Conference Timeline (check conflicts)',
            ganttLegend: 'Legend:',
            ganttSubmission: 'Submission',
            ganttReview: 'Review',
            ganttConference: 'Conference',
            ganttConflict: '⚠ Overlap conflict',
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
