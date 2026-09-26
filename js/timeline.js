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
            const month = d.toLocaleDateString(locale, { month: 'short', timeZone: 'UTC' });
            const day = d.getUTCDate();
            return `${month} ${day}${tz ? ' ('+tz+')' : ''}`;
        } catch { return dateStr; }
    },

    formatFullDate(dateStr, tz) {
        if (!dateStr) return '';
        try {
            const d = this._parseDate(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            const localStr = d.toLocaleDateString(this.getLocale(), { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
            return `${localStr}${tz ? ' '+tz : ''}`;
        } catch { return dateStr; }
    },

    _parseDate(dateStr) {
        const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
        return match ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12)) : new Date(NaN);
    },

    deadlineInstant(dateStr, timezone = 'AoE') {
        const date = this._parseDate(dateStr);
        if (Number.isNaN(date.getTime())) return null;
        const [year, month, day] = [date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()];
        const deadlineFields = Date.UTC(year, month, day, 23, 59, 59);
        const zone = ({
            'AoE': 'Etc/GMT+12',
            'US Pacific': 'America/Los_Angeles',
            'US PDT': 'America/Los_Angeles',
            'US EST': 'America/New_York',
            'CET': 'Europe/Paris',
        })[timezone] || 'Etc/GMT+12';
        if (timezone === 'AoE' || !['US Pacific', 'US PDT', 'US EST', 'CET'].includes(timezone)) {
            return new Date(deadlineFields + 12 * 60 * 60 * 1000);
        }

        // Convert the deadline's wall-clock time in its source time zone to UTC.
        let instant = deadlineFields;
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
        });
        for (let i = 0; i < 3; i++) {
            const parts = Object.fromEntries(formatter.formatToParts(new Date(instant)).map(p => [p.type, p.value]));
            const wallClockAsUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
            instant = deadlineFields - (wallClockAsUtc - instant);
        }
        return new Date(instant);
    },

    toLocalTime(dateStr, tz) {
        if (!dateStr) return '';
        try { const d = this.deadlineInstant(dateStr, tz); if (!d || isNaN(d.getTime())) return dateStr; return d.toLocaleString(this.getLocale(), { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', timeZoneName:'short' }); } catch { return dateStr; }
    },

    daysUntil(dateStr, timezone) {
        if (!dateStr) return null;
        try {
            const target = this.deadlineInstant(dateStr, timezone);
            if (!target) return null;
            const now = new Date();
            const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
            const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const diffDays = Math.round((targetDay - currentDay) / 86400000);
            const past = target < now;
            return { days: diffDays, urgent: !past && diffDays <= 30, past, upcoming: diffDays > 30 };
        } catch { return null; }
    },

    urgencyClass(dateStr, timezone) {
        const d = this.daysUntil(dateStr, timezone);
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
                const cls = this.urgencyClass(timeline[item.key], tz);
                const di = this.daysUntil(timeline[item.key], tz);
                const dt = (di && di.days != null && !di.past) ? ` (${di.days}d)` : '';
                const lt = (item.key === 'submission_deadline') ? `<br><span style="font-size:0.6rem;color:var(--color-text-muted);">🕐 ${this.toLocalTime(timeline[item.key], tz)} ${this.t('localTime')}</span>` : '';
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
