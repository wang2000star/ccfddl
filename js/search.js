/**
 * search.js - Search and filter logic
 */
const Search = {
    // Current filter state
    state: {
        type: 'conference',
        ranks: new Set(['A', 'B', 'C']),
        category: 'all',
        year: '2026',
        query: '',
        sort: 'default',    // 'default' | 'deadline' | 'conference'
        view: 'cards',      // 'cards' | 'timeline'
    },

    // Get filtered venues based on current state
    filter() {
        let venues;

        // 1. Type filter
        if (this.state.type === 'all') {
            venues = DataLoader.getAllVenues();
        } else if (this.state.type === 'conference') {
            venues = [...DataLoader.conferences];
            // Add journal-type overrides (CHES, TCHES, etc.)
            for (const j of DataLoader.journals) {
                if (DataLoader.JOURNAL_TYPE_OVERRIDES.has(j.abbreviation)) {
                    venues.push(j);
                }
            }
        } else {
            // journal: exclude journal-type overrides
            venues = DataLoader.journals.filter(
                j => !DataLoader.JOURNAL_TYPE_OVERRIDES.has(j.abbreviation)
            );
        }

        // 2. Rank filter
        if (this.state.ranks.size > 0 && this.state.ranks.size < 3) {
            venues = venues.filter(v => this.state.ranks.has(v.ccf_rank));
        }

        // 3. Category filter
        if (this.state.category !== 'all') {
            venues = venues.filter(v => v.category_zh === this.state.category);
        }

        // 4. Search query (fuzzy, case-insensitive)
        if (this.state.query.trim()) {
            const q = this.state.query.trim().toLowerCase();
            venues = venues.filter(v => {
                return v.abbreviation.toLowerCase().includes(q) ||
                       v.full_name.toLowerCase().includes(q) ||
                       (v.category_zh && v.category_zh.includes(q)) ||
                       (v.category_en && v.category_en.toLowerCase().includes(q));
            });
        }

        // 5. Sort
        const rankOrder = { A: 0, B: 1, C: 2 };
        const now = new Date();

        const year = this.state.year || '2026';
        if (this.state.sort === 'deadline') {
            venues.sort((a, b) => {
                const tlA = DataLoader.getTimeline(a.id, year) || {};
                const tlB = DataLoader.getTimeline(b.id, year) || {};
                const dA = tlA.submission_deadline ? new Date(tlA.submission_deadline) : null;
                const dB = tlB.submission_deadline ? new Date(tlB.submission_deadline) : null;
                if (dA && !dB) return -1;
                if (!dA && dB) return 1;
                if (!dA && !dB) return rankOrder[a.ccf_rank] - rankOrder[b.ccf_rank];
                return dA - dB;
            });
        } else if (this.state.sort === 'conference') {
            venues.sort((a, b) => {
                const tlA = DataLoader.getTimeline(a.id) || {};
                const tlB = DataLoader.getTimeline(b.id) || {};
                const dA = tlA.conference_start ? new Date(tlA.conference_start) : null;
                const dB = tlB.conference_start ? new Date(tlB.conference_start) : null;
                if (dA && !dB) return -1;
                if (!dA && dB) return 1;
                if (!dA && !dB) return rankOrder[a.ccf_rank] - rankOrder[b.ccf_rank];
                return dA - dB;
            });
        } else {
            venues.sort((a, b) => {
                const rDiff = rankOrder[a.ccf_rank] - rankOrder[b.ccf_rank];
                if (rDiff !== 0) return rDiff;
                return a.abbreviation.localeCompare(b.abbreviation);
            });
        }

        // 6. Expand multi-round: one entry per round
        const expanded = [];
        for (const v of venues) {
            const timelines = DataLoader.getTimelines(v.id, year);
            if (timelines.length > 1) {
                for (let i = 0; i < timelines.length; i++) {
                    expanded.push({ ...v, _roundIndex: i, _totalRounds: timelines.length });
                }
            } else {
                expanded.push({ ...v, _roundIndex: 0, _totalRounds: 1 });
            }
        }
        return expanded;
    },

    // Update a single filter state and return new results
    updateFilter(key, value) {
        this.state[key] = value;
        return this.filter();
    },
};
