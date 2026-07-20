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

    TIMEZONES: { 'AoE': 'UTC-12', 'UTC': 'UTC', 'PST': 'UTC-8', 'EST': 'UTC-5', 'CET': 'UTC+1', 'CST': 'UTC+8', 'JST': 'UTC+9' },

    formatDate(dateStr, tz) {
        if (!dateStr) return '';
        try {
            const d = this._parseDate(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            const locale = this.getLocale();
            const month = d.toLocaleDateString(locale, { month: 'short' });
            const day = d.getDate();
            const tzLabel = tz ? ` (${tz})` : '';
            return `${month} ${day}${tzLabel}`;
        } catch { return dateStr; }
    },

    formatFullDate(dateStr, tz) {
        if (!dateStr) return '';
        try {
            const d = this._parseDate(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            const localStr = d.toLocaleDateString(this.getLocale(), { year: 'numeric', month: 'short', day: 'numeric' });
            const tzLabel = tz ? ` AoE` : '';
            return `${localStr}${tzLabel}`;
        } catch { return dateStr; }
    },

    _parseDate(dateStr) {
        // AoE = UTC-12, so "2026-01-15 AoE" = 2026-01-15T12:00:00Z
        // For display, parse as UTC midnight and note the timezone
        return new Date(dateStr.replace(' AoE', '') + 'T12:00:00Z');
    },

    toLocalTime(dateStr, tz) {
        // Convert an AoE deadline to the user's local time for display
        if (!dateStr) return '';
        try {
            const d = this._parseDate(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleString(this.getLocale(), { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
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

        const tz = timeline.timezone || 'AoE';

        for (const item of items) {
            if (timeline[item.key]) {
                const cls = this.urgencyClass(timeline[item.key]);
                const daysInfo = this.daysUntil(timeline[item.key]);
                const daysText = (daysInfo && daysInfo.days != null && !daysInfo.past) ? ` (${daysInfo.days}d)` : '';
                const localTime = (item.key === 'submission_deadline') ? `<br><span style="font-size:0.6rem;color:var(--color-text-muted)">🕐 ${this.toLocalTime(timeline[item.key], tz)} 本地</span>` : '';
                rows.push(`
                    <div class="timeline-row">
                        <span class="timeline-label">${item.label}</span>
                        <span class="timeline-value ${cls}">${this.formatFullDate(timeline[item.key], tz)}${daysText}${localTime}</span>
                    </div>
                `);
            }
        }

        if (timeline.rebuttal_start || timeline.rebuttal_end) {
            const start = this.formatDate(timeline.rebuttal_start, tz);
            const end = this.formatDate(timeline.rebuttal_end, tz);
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
