/**
 * timeline.js - Timeline date formatting and utilities
 */
const Timeline = {
    t(key) {
        try { return (typeof I18N !== 'undefined' && I18N.t) ? I18N.t(key) : key; }
        catch(e) { return key; }
    },

    getLocale() {
        try { return (typeof I18N !== 'undefined' && I18N.locale === 'zh') ? 'zh-CN' : 'en-US'; }
        catch(e) { return 'en-US'; }
    },

    formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
            if (isNaN(d.getTime())) return dateStr;
            const locale = this.getLocale();
            const month = d.toLocaleDateString(locale, { month: 'short' });
            const day = d.getDate();
            return `${month} ${day}`;
        } catch { return dateStr; }
    },

    formatFullDate(dateStr) {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString(this.getLocale(), { year: 'numeric', month: 'short', day: 'numeric' });
        } catch { return dateStr; }
    },

    daysUntil(dateStr) {
        if (!dateStr) return null;
        try {
            const target = new Date(dateStr + (dateStr.includes('T') ? '' : 'T23:59:59'));
            const now = new Date();
            const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
            return { days: diff, urgent: diff >= 0 && diff <= 30, past: diff < 0, upcoming: diff > 30 };
        } catch { return null; }
    },

    urgencyClass(dateStr) {
        const d = this.daysUntil(dateStr);
        if (!d) return '';
        if (d.past) return 'past';
        if (d.urgent) return 'urgent';
        return 'upcoming';
    },

    buildTimelineHTML(timeline) {
        if (!timeline) return '';
        const rows = [];
        const items = [
            { key: 'submission_deadline', label: this.t('submissionDeadline') },
            { key: 'abstract_deadline', label: this.t('abstractDeadline') },
            { key: 'notification', label: this.t('notification') },
            { key: 'camera_ready', label: this.t('cameraReady') },
        ];

        for (const item of items) {
            if (timeline[item.key]) {
                const cls = this.urgencyClass(timeline[item.key]);
                const daysInfo = this.daysUntil(timeline[item.key]);
                const daysText = daysInfo && !daysInfo.past ? ` (${daysInfo.days}d)` : '';
                rows.push(`
                    <div class="timeline-row">
                        <span class="timeline-label">${item.label}</span>
                        <span class="timeline-value ${cls}">${this.formatFullDate(timeline[item.key])}${daysText}</span>
                    </div>
                `);
            }
        }

        if (timeline.rebuttal_start || timeline.rebuttal_end) {
            const start = this.formatDate(timeline.rebuttal_start);
            const end = this.formatDate(timeline.rebuttal_end);
            rows.push(`
                <div class="timeline-row">
                    <span class="timeline-label">${this.t('rebuttalPeriod')}</span>
                    <span class="timeline-value">${start} – ${end}</span>
                </div>
            `);
        }

        if (timeline.conference_start || timeline.conference_end) {
            const start = this.formatFullDate(timeline.conference_start);
            const end = this.formatFullDate(timeline.conference_end);
            rows.push(`
                <div class="timeline-row">
                    <span class="timeline-label">${this.t('conferenceDate')}</span>
                    <span class="timeline-value">${start} – ${end}</span>
                </div>
            `);
        }

        if (timeline.location) {
            const loc = timeline.location;
            rows.push(`
                <div class="timeline-row">
                    <span class="timeline-label">${this.t('location')}</span>
                    <span class="timeline-value">${loc.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>
                </div>
            `);
        }

        return rows.length > 0
            ? `<div class="venue-timeline">${rows.join('')}</div>`
            : `<div class="venue-timeline"><div class="timeline-no-data">${this.t('noTimeline')}</div></div>`;
    }
};
