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

        // Build cards
        const html = venues.map(v => this.buildCard(v)).join('');
        if (this.grid) this.grid.innerHTML = html;

        // Update stats
        this.updateStats(venues);

        // Attach click handlers
        this.grid?.querySelectorAll('.venue-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.getAttribute('data-id');
                // Toggle expanded state
                card.classList.toggle('expanded');
            });
        });
    },

    buildCard(venue) {
        const rankClass = `badge-${venue.ccf_rank.toLowerCase()}`;
        const rankLabel = I18N.t(`rank${venue.ccf_rank}`) || `CCF-${venue.ccf_rank}`;
        const isJournalType = venue.sub_type === 'journal-type' || DataLoader.JOURNAL_TYPE_OVERRIDES.has(venue.abbreviation);
        const website = DataLoader.getWebsite(venue.abbreviation);
        const tl = DataLoader.getTimeline(venue.id);

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
                    ${isJournalType ? `<span class="badge badge-journal-type">${I18n.t('journalType')}</span>` : ''}
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
        const tl = DataLoader.getTimeline(venue.id);
        if (tl) {
            return Timeline.buildTimelineHTML(tl);
        }
        return `
        <div class="venue-timeline">
            <div class="timeline-no-data">${I18n.t('noTimeline')}</div>
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

    escape(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};
