/**
 * timeline.js - Timeline date formatting and utilities
 */
const Timeline = {
    /**
     * Format a date string for display.
     * Input: "2026-01-15" or ISO string
     * Output: locale-aware short date
     */
    formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
            if (isNaN(d.getTime())) return dateStr;
            const locale = I18N.locale === 'zh' ? 'zh-CN' : 'en-US';
            const month = d.toLocaleDateString(locale, { month: 'short' });
            const day = d.getDate();
            return `${month} ${day}`;
        } catch {
            return dateStr;
        }
    },

    /**
     * Format a full date.
     */
    formatFullDate(dateStr) {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
            if (isNaN(d.getTime())) return dateStr;
            const locale = I18N.locale === 'zh' ? 'zh-CN' : 'en-US';
            return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
            return dateStr;
        }
    },

    /**
     * Calculate days until a deadline.
     * Returns { days, urgent, past }
     */
    daysUntil(dateStr) {
        if (!dateStr) return null;
        try {
            const target = new Date(dateStr + (dateStr.includes('T') ? '' : 'T23:59:59'));
            const now = new Date();
            const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
            return {
                days: diff,
                urgent: diff >= 0 && diff <= 30,
                past: diff < 0,
                upcoming: diff > 30,
            };
        } catch {
            return null;
        }
    },

    /**
     * Get CSS class for a deadline's urgency
     */
    urgencyClass(dateStr) {
        const d = this.daysUntil(dateStr);
        if (!d) return '';
        if (d.past) return 'past';
        if (d.urgent) return 'urgent';
        return 'upcoming';
    },

    /**
     * Build timeline HTML for a venue that has timeline data
     */
    buildTimelineHTML(timeline) {
        if (!timeline) return '';

        const rows = [];
        const items = [
            { key: 'submissionDeadline', label: I18n.t('submissionDeadline') },
            { key: 'abstractDeadline', label: I18n.t('abstractDeadline') },
            { key: 'notification', label: I18n.t('notification') },
            { key: 'cameraReady', label: I18n.t('cameraReady') },
        ];

        for (const item of items) {
            if (timeline[item.key]) {
                const cls = this.urgencyClass(timeline[item.key]);
                const daysInfo = this.daysUntil(timeline[item.key]);
                const daysText = daysInfo && !daysInfo.past
                    ? ` (${daysInfo.days}d)` : '';
                rows.push(`
                    <div class="timeline-row">
                        <span class="timeline-label">${item.label}</span>
                        <span class="timeline-value ${cls}">${this.formatFullDate(timeline[item.key])}${daysText}</span>
                    </div>
                `);
            }
        }

        // Rebuttal period
        if (timeline.rebuttal_start || timeline.rebuttal_end) {
            const start = this.formatDate(timeline.rebuttal_start);
            const end = this.formatDate(timeline.rebuttal_end);
            rows.push(`
                <div class="timeline-row">
                    <span class="timeline-label">${I18n.t('rebuttalPeriod')}</span>
                    <span class="timeline-value">${start} – ${end}</span>
                </div>
            `);
        }

        // Conference dates
        if (timeline.conference_start || timeline.conference_end) {
            const start = this.formatFullDate(timeline.conference_start);
            const end = this.formatFullDate(timeline.conference_end);
            rows.push(`
                <div class="timeline-row">
                    <span class="timeline-label">${I18n.t('conferenceDate')}</span>
                    <span class="timeline-value">${start} – ${end}</span>
                </div>
            `);
        }

        // Location
        if (timeline.location) {
            rows.push(`
                <div class="timeline-row">
                    <span class="timeline-label">${I18n.t('location')}</span>
                    <span class="timeline-value">${Renderer.escape(timeline.location)}</span>
                </div>
            `);
        }

        return rows.length > 0
            ? `<div class="venue-timeline">${rows.join('')}</div>`
            : `<div class="venue-timeline"><div class="timeline-no-data">${I18n.t('noTimeline')}</div></div>`;
    }
};
