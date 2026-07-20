/**
 * renderer.js - DOM rendering for venue cards
 */
const Renderer = {
    grid: null,
    emptyState: null,
    loadingState: null,
    statsBar: null,

    init() {
        this.grid = document.getElementById('cardGrid');
        this.emptyState = document.getElementById('emptyState');
        this.loadingState = document.getElementById('loadingState');
        this.statsBar = document.getElementById('statsBar');
    },

    showLoading() {
        if (this.grid) this.grid.innerHTML = '';
        if (this.emptyState) this.emptyState.style.display = 'none';
        if (this.loadingState) this.loadingState.style.display = 'flex';
    },

    hideLoading() {
        if (this.loadingState) this.loadingState.style.display = 'none';
    },

    render(venues) {
        this.hideLoading();

        if (!venues || venues.length === 0) {
            if (this.grid) this.grid.innerHTML = '';
            if (this.emptyState) this.emptyState.style.display = 'flex';
            if (this.statsBar) this.statsBar.innerHTML = '';
            return;
        }

        if (this.emptyState) this.emptyState.style.display = 'none';

        // Build cards with error protection
        let html = '';
        let errorCount = 0;
        for (const v of venues) {
            try {
                html += this.buildCard(v);
            } catch (e) {
                errorCount++;
                if (errorCount <= 3) {
                    console.error('buildCard error for', v.abbreviation, e);
                }
            }
        }
        if (errorCount > 0) {
            console.error(`buildCard failed for ${errorCount}/${venues.length} venues`);
        }
        if (this.grid) this.grid.innerHTML = html;

        // Update stats
        this.updateStats(venues);

        // Attach click handlers
        this.grid?.querySelectorAll('.venue-card').forEach(card => {
            card.addEventListener('click', () => {
                card.classList.toggle('expanded');
            });
        });
    },

    buildCard(venue) {
        if (!venue || !venue.ccf_rank) return '';
        const rank = venue.ccf_rank;
        const rankClass = `badge-${rank.toLowerCase()}`;
        const rankLabel = (typeof I18N !== 'undefined' && I18N.t) ? (I18N.t(`rank${rank}`) || `CCF-${rank}`) : `CCF-${rank}`;
        const isJournalType = venue.sub_type === 'journal-type' || (typeof DataLoader !== 'undefined' && DataLoader.JOURNAL_TYPE_OVERRIDES && DataLoader.JOURNAL_TYPE_OVERRIDES.has(venue.abbreviation));
        const website = (typeof DataLoader !== 'undefined' && DataLoader.getWebsite) ? DataLoader.getWebsite(venue.abbreviation) : null;
        const tl = (typeof DataLoader !== 'undefined' && DataLoader.getTimeline) ? DataLoader.getTimeline(venue.id) : null;

        return `
        <div class="venue-card" data-id="${venue.id}">
            <div class="venue-card-header">
                <div class="venue-card-title">
                    <div class="venue-abbr">
                        ${this.escape(venue.abbreviation)}
                        ${website ? `<a href="${this.escape(website)}" target="_blank" class="website-link" title="${I18n.t('officialWebsite')}" onclick="event.stopPropagation()">🔗</a>` : ''}
                    </div>
                    <div class="venue-full-name">${this.escape(venue.full_name)}</div>
                </div>
                <div class="venue-badges">
                    <span class="badge badge-rank ${rankClass}">${rankLabel}</span>
                    ${isJournalType ? `<span class="badge badge-journal-type">${this.t('journalType')}</span>` : ''}
                    <span class="badge badge-category">${this.escape(venue.category_zh)}</span>
                </div>
            </div>
            ${this.buildTimeline(venue)}
            ${tl && tl.stats ? this.buildStats(tl.stats) : ''}
        </div>`;
    },

    buildStats(stats) {
        return `
        <div class="venue-stats">
            <div class="stats-row">
                <span class="stat-item" title="${I18n.t('submissions')}">📄 ${stats.submissions?.toLocaleString() || '—'}</span>
                <span class="stat-item" title="${I18n.t('accepted')}">✅ ${stats.accepted?.toLocaleString() || '—'}</span>
                <span class="stat-item stat-rate" title="${I18n.t('acceptanceRate')}">📊 ${stats.acceptance_rate != null ? stats.acceptance_rate + '%' : '—'}</span>
            </div>
        </div>`;
    },

    buildTimeline(venue) {
        const tl = (typeof DataLoader !== 'undefined' && DataLoader.getTimeline) ? DataLoader.getTimeline(venue.id) : null;
        if (tl) {
            return Timeline.buildTimelineHTML(tl);
        }
        return `
        <div class="venue-timeline">
            <div class="timeline-no-data">${this.t('noTimeline')}</div>
        </div>`;
    },

    updateStats(venues) {
        if (!this.statsBar) return;
        const counts = DataLoader.countByRank(venues);
        this.statsBar.innerHTML = `
            ${I18n.t('showing')} <strong>${venues.length}</strong> ${I18n.t('results')}
            (A: ${counts.A}, B: ${counts.B}, C: ${counts.C})
        `;
    },

    t(key) {
        try { return (typeof I18N !== 'undefined' && I18N.t) ? I18N.t(key) : key; }
        catch(e) { return key; }
    },

    escape(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};
