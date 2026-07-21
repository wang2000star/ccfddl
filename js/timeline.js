/**
 * timeline.js - Timeline date formatting and utilities
 */
const Timeline = {
    t(key) { try { return (typeof I18N !== 'undefined' && I18N.t) ? I18N.t(key) : key; } catch(e) { return key; } },
    getLocale() { try { return (typeof I18N !== 'undefined' && I18N.locale === 'zh') ? 'zh-CN' : 'en-US'; } catch(e) { return 'en-US'; } },

    formatDate(dateStr, tz) {
        if (!dateStr) return '';
        try {
            const d = this._parseDate(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            const locale = this.getLocale();
            const month = d.toLocaleDateString(locale, { month: 'short' });
            const day = d.getDate();
            return `${month} ${day}${tz ? ' ('+tz+')' : ''}`;
        } catch { return dateStr; }
    },

    formatFullDate(dateStr, tz) {
        if (!dateStr) return '';
        try {
            const d = this._parseDate(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            const localStr = d.toLocaleDateString(this.getLocale(), { year: 'numeric', month: 'short', day: 'numeric' });
            return `${localStr}${tz ? ' '+tz : ''}`;
        } catch { return dateStr; }
    },

    _parseDate(dateStr) { return new Date(dateStr.replace(' AoE', '').replace(' US Pacific', '').replace(' US PDT', '').replace(' US EST', '') + 'T12:00:00Z'); },
    toLocalTime(dateStr, tz) {
        if (!dateStr) return '';
        try { const d = this._parseDate(dateStr); if (isNaN(d.getTime())) return dateStr; return d.toLocaleString(this.getLocale(), { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', timeZoneName:'short' }); } catch { return dateStr; }
    },

    daysUntil(dateStr) {
        if (!dateStr) return null;
        try {
            const target = new Date(this._parseDate(dateStr));
            const now = new Date();
            const diff = Math.ceil((target - now) / 86400000);
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

    buildTimelineHTML(timeline, venueType) {
        if (!timeline) return '';
        const rows = [];
        const tz = timeline.timezone || 'AoE';
        const isJournal = (venueType === 'journal');

        if (isJournal) {
            const jItems = [
                { key: 'submission_deadline', label: '投稿截止' },
                { key: 'notification', label: '一审结果' },
                { key: 'camera_ready', label: '修回截止' },
            ];
            for (const item of jItems) {
                if (timeline[item.key]) {
                    rows.push(`<div class="timeline-row"><span class="timeline-label">${item.label}</span><span class="timeline-value">${this.formatFullDate(timeline[item.key], tz)}</span></div>`);
                }
            }
            if (timeline.location) {
                rows.push(`<div class="timeline-row"><span class="timeline-label">${this.t('location')}</span><span class="timeline-value">${(timeline.location||'').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span></div>`);
            }
            return rows.length > 0 ? `<div class="venue-timeline">${rows.join('')}</div>` : `<div class="venue-timeline"><div class="timeline-no-data">${this.t('noTimeline')}</div></div>`;
        }

        // Conference
        const items = [
            { key: 'submission_deadline', label: this.t('submissionDeadline') },
            { key: 'abstract_deadline', label: this.t('abstractDeadline') },
            { key: 'notification', label: this.t('notification') },
            { key: 'camera_ready', label: this.t('cameraReady') },
        ];
        for (const item of items) {
            if (timeline[item.key]) {
                const cls = this.urgencyClass(timeline[item.key]);
                const di = this.daysUntil(timeline[item.key]);
                const dt = (di && di.days != null && !di.past) ? ` (${di.days}d)` : '';
                const lt = (item.key === 'submission_deadline') ? `<br><span style="font-size:0.6rem;color:var(--color-text-muted);">🕐 ${this.toLocalTime(timeline[item.key], tz)} 本地</span>` : '';
                rows.push(`<div class="timeline-row"><span class="timeline-label">${item.label}</span><span class="timeline-value ${cls}">${this.formatFullDate(timeline[item.key], tz)}${dt}${lt}</span></div>`);
            }
        }
        if (timeline.rebuttal_start || timeline.rebuttal_end) {
            rows.push(`<div class="timeline-row"><span class="timeline-label">${this.t('rebuttalPeriod')}</span><span class="timeline-value">${this.formatDate(timeline.rebuttal_start, tz)} – ${this.formatDate(timeline.rebuttal_end, tz)}</span></div>`);
        }
        if (timeline.conference_start || timeline.conference_end) {
            rows.push(`<div class="timeline-row"><span class="timeline-label">${this.t('conferenceDate')}</span><span class="timeline-value">${this.formatFullDate(timeline.conference_start)} – ${this.formatFullDate(timeline.conference_end)}</span></div>`);
        }
        if (timeline.location) {
            rows.push(`<div class="timeline-row"><span class="timeline-label">${this.t('location')}</span><span class="timeline-value">${(timeline.location||'').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span></div>`);
        }
        return rows.length > 0 ? `<div class="venue-timeline">${rows.join('')}</div>` : `<div class="venue-timeline"><div class="timeline-no-data">${this.t('noTimeline')}</div></div>`;
    }
};
