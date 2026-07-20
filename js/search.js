/**
 * search.js - Search and filter logic
 */
const Search = {
    // Current filter state
    state: {
        type: 'conference',     // 'conference' | 'journal' | 'all'
        ranks: new Set(['A', 'B', 'C']),  // empty = all
        category: 'all',
        year: '2026',
        query: '',
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

        // 5. Sort: by rank priority (A>B>C), then alphabetically by abbreviation
        const rankOrder = { A: 0, B: 1, C: 2 };
        venues.sort((a, b) => {
            const rDiff = rankOrder[a.ccf_rank] - rankOrder[b.ccf_rank];
            if (rDiff !== 0) return rDiff;
            return a.abbreviation.localeCompare(b.abbreviation);
        });

        return venues;
    },

    // Update a single filter state and return new results
    updateFilter(key, value) {
        this.state[key] = value;
        return this.filter();
    },
};
