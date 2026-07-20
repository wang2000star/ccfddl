/**
 * renderer.js - DOM rendering for venue cards + Gantt view
 */
const Renderer = {
    grid: null, ganttView: null, ganttHeader: null, ganttBody: null,
    emptyState: null, loadingState: null, statsBar: null,

    init() {
        this.grid = document.getElementById('cardGrid');
        this.ganttView = document.getElementById('ganttView');
        this.ganttHeader = document.getElementById('ganttHeader');
        this.ganttBody = document.getElementById('ganttBody');
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
                    <div class="venue-abbr">${this.esc(venue.abbreviation)}</div>
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

        let html = '';
        for (let i = 0; i < timelines.length; i++) {
            const tl = timelines[i];
            const roundLabel = timelines.length > 1 ? `<div class="timeline-round-label">📋 Round ${tl.round || (i+1)}</div>` : '';
            html += roundLabel + Timeline.buildTimelineHTML(tl);
            if (tl.submission_deadline) {
                const cd = this.countdown(tl.submission_deadline);
                if (cd) html += `<div class="countdown-badge ${cd.cls}">${cd.text}</div>`;
            }
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
            if (this.ganttBody) this.ganttBody.innerHTML = `<div style="text-align:center;padding:60px;color:var(--color-text-muted);">📊 ${this.t('noTimeline')} — ${this.t('noResultsHint')}</div>`;
            if (this.ganttHeader) this.ganttHeader.innerHTML = '';
            this.updateStats(venues);
            return;
        }

        this.updateStats(venues);

        // Build month columns
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const monthW = 100 / 12;

        let headerHTML = `<div class="gantt-title">${this.t('ganttTitle')}</div><div class="gantt-legend">${this.t('ganttLegend')} <span class="gleg sub">■ ${this.t('ganttSubmission')}</span> <span class="gleg review">■ ${this.t('ganttReview')}</span> <span class="gleg conf">■ ${this.t('ganttConference')}</span> <span class="gleg conflict">${this.t('ganttConflict')}</span></div>`;
        headerHTML += `<div class="gantt-months">${months.map(m => `<span style="width:${monthW}%">${m}</span>`).join('')}</div>`;
        if (this.ganttHeader) this.ganttHeader.innerHTML = headerHTML;

        // Build rows
        let bodyHTML = '';

        // Check overlap between any two venue-round pairs
        const checkOverlap = (a, b) => {
            const tla = a.timeline, tlb = b.timeline;
            const a1 = tla.submission_deadline ? new Date(tla.submission_deadline) : null;
            const a2 = tla.conference_end ? new Date(tla.conference_end) : (tla.conference_start ? new Date(tla.conference_start) : null);
            const b1 = tlb.submission_deadline ? new Date(tlb.submission_deadline) : null;
            const b2 = tlb.conference_end ? new Date(tlb.conference_end) : (tlb.conference_start ? new Date(tlb.conference_start) : null);
            if (!a1 || !a2 || !b1 || !b2) return false;
            return a1 <= b2 && b1 <= a2;
        };

        for (let i = 0; i < withTimeline.length; i++) {
            const row = withTimeline[i];
            const v = row.venue, tl = row.timeline;
            const rankCls = `gantt-${v.ccf_rank.toLowerCase()}`;
            const hasConflict = withTimeline.some((row2, j) => i !== j && row.venue.id !== row2.venue.id && checkOverlap(row, row2));

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
                const subW = mid - sub;
                const revW = conf - mid;
                barHTML = `
                    <div class="gantt-bar-wrap" style="position:relative;height:20px;margin:2px 0;">
                        <div class="gantt-seg submission" style="left:${sub}%;width:${Math.max(subW,1)}%"></div>
                        <div class="gantt-seg review" style="left:${mid}%;width:${Math.max(revW,1)}%"></div>
                        ${conf != null ? `<div class="gantt-marker conf" style="left:${conf}%">▼</div>` : ''}
                    </div>`;
            }

            // Check for overlap with previous row
            let overlapWarning = '';
            if (hasConflict) {
                overlapWarning = `<span class="gantt-conflict-icon" title="${this.t('ganttConflict')}">⚠️</span>`;
            }

            const roundLabel = row.totalRounds > 1 ? ` <span style="font-size:0.6rem;color:var(--color-primary);font-weight:700;">R${row.round}</span>` : '';

            bodyHTML += `
            <div class="gantt-row ${rankCls} ${hasConflict ? 'has-conflict' : ''}">
                <div class="gantt-label">
                    <span class="badge badge-rank badge-${v.ccf_rank.toLowerCase()}">${v.ccf_rank}</span>
                    <strong>${this.esc(v.abbreviation)}${roundLabel}</strong>
                    ${overlapWarning}
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
        if (this.ganttBody) this.ganttBody.innerHTML = bodyHTML;
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
