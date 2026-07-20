/**
 * search.js - Search and filter logic
 */
const Search = {
    // Current filter state
    state: {
        type: 'conference',
        ranks: new Set(['A', 'B', 'C']),
        category: 'all',
        year: 'all',
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

        // 6. Year filter: if specific year, only include entries with timelines for that year
        const yearFilter = this.state.year || 'all';
        if (yearFilter !== 'all') {
            venues = venues.filter(v => {
                const timelines = DataLoader.getTimelines(v.id, yearFilter);
                return timelines && timelines.length > 0;
            });
        }

        // 7. Expand multi-round: one entry per round
        const expanded = [];
        for (const v of venues) {
            const timelines = DataLoader.getTimelines(v.id, yearFilter === 'all' ? '2026' : yearFilter);
            // For 'all' mode, collect timelines from all years
            let allTLs = [];
            if (yearFilter === 'all') {
                for (const y of ['2025','2026','2027']) {
                    const tls = DataLoader.getTimelines(v.id, y);
                    if (tls) allTLs = allTLs.concat(tls);
                }
            } else {
                allTLs = timelines;
            }

            if (allTLs.length > 1) {
                for (let i = 0; i < allTLs.length; i++) {
                    expanded.push({ ...v, _roundIndex: i, _totalRounds: allTLs.length, _timelineYear: allTLs[i].year || yearFilter });
                }
            } else if (allTLs.length === 1) {
                expanded.push({ ...v, _roundIndex: 0, _totalRounds: 1, _timelineYear: allTLs[0].year || yearFilter });
            } else {
                expanded.push({ ...v, _roundIndex: 0, _totalRounds: 1, _timelineYear: yearFilter });
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
