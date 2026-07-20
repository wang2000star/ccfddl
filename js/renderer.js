/**
 * renderer.js - DOM rendering for venue cards + Gantt view
 */
const Renderer = {
    grid: null, ganttView: null, ganttHeader: null, ganttMonths: null, ganttBodyScroll: null,
    emptyState: null, loadingState: null, statsBar: null,

    init() {
        this.grid = document.getElementById('cardGrid');
        this.ganttView = document.getElementById('ganttView');
        this.ganttHeader = document.getElementById('ganttHeader');
        this.ganttMonths = document.getElementById('ganttMonths');
        this.ganttBodyScroll = document.getElementById('ganttBodyScroll');
        this.emptyState = document.getElementById('emptyState');
        this.loadingState = document.getElementById('loadingState');
        this.statsBar = document.getElementById('statsBar');
    },

    showLoading() {
        if (this.grid) this.grid.style.display = '';
        if (this.ganttView) this.ganttView.style.display = 'none';
        if (this.emptyState) this.emptyState.style.display = 'none';
        if (this.loadingState) this.loadingState.style.display = 'flex';
    },

    hideLoading() {
        if (this.loadingState) this.loadingState.style.display = 'none';
    },

    render(venues) {
        this.hideLoading();
        const view = (typeof Search !== 'undefined') ? Search.state.view : 'cards';

        if (view === 'timeline') {
            this.renderGantt(venues);
            return;
        }

        // Card view
        if (this.grid) this.grid.style.display = '';
        if (this.ganttView) this.ganttView.style.display = 'none';

        if (!venues || venues.length === 0) {
            if (this.grid) this.grid.innerHTML = '';
            if (this.emptyState) this.emptyState.style.display = 'flex';
            if (this.statsBar) this.statsBar.innerHTML = '';
            return;
        }
        if (this.emptyState) this.emptyState.style.display = 'none';

        let html = '', errorCount = 0;
        for (const v of venues) {
            try { html += this.buildCard(v); }
            catch(e) { errorCount++; if (errorCount <= 3) console.error('buildCard error for', v.abbreviation, e); }
        }
        if (errorCount) console.error(`buildCard failed for ${errorCount}/${venues.length} venues`);
        if (this.grid) this.grid.innerHTML = html;

        this.updateStats(venues);

        this.grid?.querySelectorAll('.venue-card').forEach(card => {
            card.addEventListener('click', () => card.classList.toggle('expanded'));
        });
    },

    // ==================== CARD VIEW ====================

    buildCard(venue) {
        if (!venue || !venue.ccf_rank) return '';
        const rank = venue.ccf_rank;
        const rankClass = `badge-${rank.toLowerCase()}`;
        const rankLabel = this.t(`rank${rank}`) || `CCF-${rank}`;
        const isJT = venue.sub_type === 'journal-type' || (DataLoader.JOURNAL_TYPE_OVERRIDES && DataLoader.JOURNAL_TYPE_OVERRIDES.has(venue.abbreviation));
        const year = (typeof Search !== 'undefined') ? (Search.state.year || '2026') : '2026';
        const website = (DataLoader.getWebsite) ? DataLoader.getWebsite(venue.abbreviation) : null;
        const tl = (DataLoader.getTimeline) ? DataLoader.getTimeline(venue.id, year) : null;
        const webLink = website ? `<a href="${this.esc(website)}" target="_blank" class="badge badge-website" onclick="event.stopPropagation()">🌐 ${this.t('officialWebsite')}</a>` : '';

        return `
        <div class="venue-card" data-id="${venue.id}">
            <div class="venue-card-header">
                <div class="venue-card-title">
                    <div class="venue-abbr">${this.esc(venue.abbreviation)} ${year}${venue._totalRounds > 1 ? ` <span style="font-size:0.65em;color:var(--color-primary);">#${(venue._roundIndex||0)+1}</span>` : ''}</div>
                    <div class="venue-full-name">${this.esc(venue.full_name)}</div>
                </div>
                <div class="venue-badges">
                    ${webLink}
                    <span class="badge badge-rank ${rankClass}">${rankLabel}</span>
                    ${isJT ? `<span class="badge badge-journal-type">${this.t('journalType')}</span>` : ''}
                    <span class="badge badge-category">${this.esc(venue.category_zh)}</span>
                </div>
            </div>
            ${this.buildTimeline(venue, tl)}
            ${tl && tl.stats ? this.buildStats(tl.stats) : ''}
        </div>`;
    },

    buildTimeline(venue, _tl) {
        const year = (typeof Search !== 'undefined') ? (Search.state.year || '2026') : '2026';
        const timelines = DataLoader.getTimelines ? DataLoader.getTimelines(venue.id, year) : [];
        if (timelines.length === 0) {
            return `<div class="venue-timeline"><div class="timeline-no-data">${this.t('noTimeline')}</div></div>`;
        }

        // Show only the round for this card (venue._roundIndex)
        const idx = (venue._roundIndex != null) ? venue._roundIndex : 0;
        const tl = timelines[idx] || timelines[0];
        if (!tl) return `<div class="venue-timeline"><div class="timeline-no-data">${this.t('noTimeline')}</div></div>`;

        const total = venue._totalRounds || timelines.length;
        const label = total > 1 ? `📋 #${idx + 1}/${total}` : '';
        let html = label ? `<div class="timeline-round-label">${label}</div>` : '';
        html += Timeline.buildTimelineHTML(tl);
        if (tl.submission_deadline) {
            const cd = this.countdown(tl.submission_deadline);
            if (cd) html += `<div class="countdown-badge ${cd.cls}">${cd.text}</div>`;
        }
        return html;
    },

    countdown(dateStr) {
        try {
            const target = new Date(dateStr + 'T23:59:59');
            const now = new Date();
            const diffDays = Math.ceil((target - now) / 86400000);
            if (diffDays < 0) return { text: this.t('overdue'), cls: 'cd-overdue' };
            if (diffDays === 0) return { text: '⚠ ' + this.t('daysLeft').replace('d left','Today'), cls: 'cd-urgent' };
            if (diffDays <= 7) return { text: `⚠ ${diffDays}d`, cls: 'cd-urgent' };
            if (diffDays <= 30) return { text: `${diffDays}d`, cls: 'cd-soon' };
            return { text: `${diffDays}d`, cls: 'cd-ok' };
        } catch { return null; }
    },

    buildStats(stats) {
        return `<div class="venue-stats"><div class="stats-row">
            <span class="stat-item">📄 ${stats.submissions?.toLocaleString() || '—'}</span>
            <span class="stat-item">✅ ${stats.accepted?.toLocaleString() || '—'}</span>
            <span class="stat-item stat-rate">📊 ${stats.acceptance_rate != null ? stats.acceptance_rate + '%' : '—'}</span>
        </div></div>`;
    },

    // ==================== GANTT VIEW ====================

    renderGantt(venues) {
        if (this.grid) this.grid.style.display = 'none';
        if (this.ganttView) this.ganttView.style.display = 'block';
        if (this.emptyState) this.emptyState.style.display = 'none';

        // Collect all venue-round combinations for Gantt
        const year = (typeof Search !== 'undefined') ? (Search.state.year || '2026') : '2026';
        const ganttRows = [];
        for (const v of venues) {
            const timelines = DataLoader.getTimelines ? DataLoader.getTimelines(v.id, year) : [];
            if (timelines.length === 0) continue;
            for (const tl of timelines) {
                if (tl.submission_deadline || tl.conference_start) {
                    ganttRows.push({ venue: v, timeline: tl, round: tl.round || 1, totalRounds: timelines.length });
                }
            }
        }
        const withTimeline = ganttRows;

        if (withTimeline.length === 0) {
            if (this.ganttBodyScroll) this.ganttBodyScroll.innerHTML = `<div style="text-align:center;padding:60px;color:var(--color-text-muted);">📊 ${this.t('noTimeline')} — ${this.t('noResultsHint')}</div>`;
            if (this.ganttHeader) this.ganttHeader.innerHTML = '';
            if (this.ganttMonths) this.ganttMonths.innerHTML = '';
            this.updateStats(venues);
            return;
        }

        this.updateStats(venues);

        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

        // Title + legend
        if (this.ganttHeader) {
            this.ganttHeader.innerHTML = `<div class="gantt-title">${this.t('ganttTitle')}</div><div class="gantt-legend">${this.t('ganttLegend')} <span class="gleg sub">▼投稿</span> → <span class="gleg sub">■${this.t('ganttSubmission')}</span> → <span class="gleg review">●${this.t('ganttReview')}</span> → <span class="gleg conf">▼会议</span></div>`;
        }

        // Sticky months header
        if (this.ganttMonths) {
            this.ganttMonths.innerHTML = `<div class="gantt-months-sticky"></div><div class="gantt-months-scroll">${months.map(m => `<span>${m}</span>`).join('')}</div>`;
        }

        // Build rows
        let bodyHTML = '';

        for (let i = 0; i < withTimeline.length; i++) {
            const row = withTimeline[i];
            const v = row.venue, tl = row.timeline;
            const rankCls = `gantt-${v.ccf_rank.toLowerCase()}`;

            // Calculate positions as % of year
            const pos = (dateStr) => {
                if (!dateStr) return null;
                const d = new Date(dateStr + 'T00:00:00');
                return ((d.getMonth()) / 12 * 100) + (d.getDate() / 31 * (100 / 12));
            };

            const sub = pos(tl.submission_deadline);
            const notif = pos(tl.notification) || pos(tl.rebuttal_end);
            const conf = pos(tl.conference_start);

            let barHTML = '';
            if (sub != null && conf != null) {
                const mid = notif != null ? notif : (sub + conf) / 2;
                const subW = Math.max(mid - sub, 1);
                const revW = Math.max(conf - mid, 1);
                barHTML = `
                    <div class="gantt-bar-wrap" style="position:relative;height:20px;margin:2px 0;">
                        <div class="gantt-marker sub-marker" style="left:${sub}%" title="📥 ${Timeline.formatFullDate(tl.submission_deadline)}">▼</div>
                        <div class="gantt-seg submission" style="left:${sub}%;width:${subW}%"></div>
                        ${notif != null ? `<div class="gantt-marker notif-marker" style="left:${notif}%" title="📢 ${Timeline.formatFullDate(tl.notification)}">●</div>` : ''}
                        <div class="gantt-seg review" style="left:${mid}%;width:${revW}%"></div>
                        <div class="gantt-marker conf-marker" style="left:${conf}%" title="📅 ${Timeline.formatFullDate(tl.conference_start)}">▼</div>
                    </div>`;
            }

            const roundLabel = row.totalRounds > 1 ? ` <span style="font-size:0.6rem;color:var(--color-primary);font-weight:700;">#${row.round}</span>` : '';

            bodyHTML += `
            <div class="gantt-row ${rankCls}">
                <div class="gantt-label">
                    <span class="badge badge-rank badge-${v.ccf_rank.toLowerCase()}">${v.ccf_rank}</span>
                    <strong>${this.esc(v.abbreviation)} ${year}${roundLabel}</strong>
                    <span style="font-size:0.65rem;color:var(--color-text-muted)">${this.esc(tl.location || '')}</span>
                </div>
                <div class="gantt-bars">${barHTML}</div>
                <div class="gantt-dates">
                    ${tl.submission_deadline ? `<span>📥 ${Timeline.formatDate(tl.submission_deadline)}</span>` : ''}
                    ${tl.notification ? `<span>📢 ${Timeline.formatDate(tl.notification)}</span>` : ''}
                    ${tl.conference_start ? `<span>📅 ${Timeline.formatDate(tl.conference_start)}</span>` : ''}
                </div>
            </div>`;
        }
        if (this.ganttBodyScroll) {
            this.ganttBodyScroll.innerHTML = bodyHTML;
            // Sync horizontal scroll: body ←→ months header
            const monthsScroll = this.ganttMonths?.querySelector('.gantt-months-scroll');
            if (monthsScroll) {
                this.ganttBodyScroll.onscroll = function() {
                    monthsScroll.scrollLeft = this.scrollLeft;
                };
                monthsScroll.onscroll = function() {
                    const body = document.getElementById('ganttBodyScroll');
                    if (body) body.scrollLeft = this.scrollLeft;
                };
            }
        }
    },

    updateStats(venues) {
        if (!this.statsBar) return;
        const counts = DataLoader.countByRank(venues);
        const withTL = venues.filter(v => DataLoader.getTimeline && DataLoader.getTimeline(v.id, year)).length;
        this.statsBar.innerHTML = `${this.t('showing')} <strong>${venues.length}</strong> ${this.t('results')} (A:${counts.A} B:${counts.B} C:${counts.C}) | 📅 ${withTL} ${this.t('ganttTitle').replace('📊 ','')}`;
    },

    t(key) { try { return (typeof I18N !== 'undefined' && I18N.t) ? I18N.t(key) : key; } catch(e) { return key; } },
    esc(str) { if (!str) return ''; const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
};
