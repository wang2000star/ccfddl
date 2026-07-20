/**
 * search.js - Search and filter logic
 */
const Search = {
    state: {
        type: 'conference',
        ranks: new Set(['A', 'B', 'C']),
        category: 'all',
        year: 'all',
        query: '',
        sort: 'default',
        view: 'cards',
    },

    filter() {
        let venues;
        const yearFilter = this.state.year || 'all';

        // 1. Type filter
        if (this.state.type === 'all') {
            venues = DataLoader.getAllVenues();
        } else if (this.state.type === 'conference') {
            venues = [...DataLoader.conferences];
            for (const j of DataLoader.journals) {
                if (DataLoader.JOURNAL_TYPE_OVERRIDES.has(j.abbreviation)) venues.push(j);
            }
        } else {
            venues = DataLoader.journals.filter(j => !DataLoader.JOURNAL_TYPE_OVERRIDES.has(j.abbreviation));
        }

        // 2. Rank filter
        if (this.state.ranks.size > 0 && this.state.ranks.size < 3) {
            venues = venues.filter(v => this.state.ranks.has(v.ccf_rank));
        }

        // 3. Category filter
        if (this.state.category !== 'all') {
            venues = venues.filter(v => v.category_zh === this.state.category);
        }

        // 4. Search query
        if (this.state.query.trim()) {
            const q = this.state.query.trim().toLowerCase();
            venues = venues.filter(v =>
                v.abbreviation.toLowerCase().includes(q) ||
                v.full_name.toLowerCase().includes(q) ||
                (v.category_zh && v.category_zh.includes(q)) ||
                (v.category_en && v.category_en.toLowerCase().includes(q))
            );
        }

        // 5. Year filter: only venues with timeline data for selected year
        if (yearFilter !== 'all') {
            venues = venues.filter(v => {
                const tls = DataLoader.getTimelines(v.id, yearFilter);
                return tls && tls.length > 0;
            });
        }

        // 6. Expand multi-round: one card per round, with its own _timeline
        const expanded = [];
        for (const v of venues) {
            let allTLs = [];
            if (yearFilter === 'all') {
                for (const y of ['2025','2026','2027']) {
                    const tls = DataLoader.getTimelines(v.id, y);
                    if (tls) allTLs = allTLs.concat(tls);
                }
            } else {
                allTLs = DataLoader.getTimelines(v.id, yearFilter) || [];
            }

            if (allTLs.length > 1) {
                for (let i = 0; i < allTLs.length; i++) {
                    expanded.push({ ...v, _roundIndex: i, _totalRounds: allTLs.length, _timelineYear: allTLs[i].year || yearFilter, _timeline: allTLs[i] });
                }
            } else if (allTLs.length === 1) {
                expanded.push({ ...v, _roundIndex: 0, _totalRounds: 1, _timelineYear: allTLs[0].year || yearFilter, _timeline: allTLs[0] });
            } else {
                expanded.push({ ...v, _roundIndex: 0, _totalRounds: 1, _timelineYear: yearFilter, _timeline: null });
            }
        }

        // 7. Sort by actual date value (earliest first)
        const getTime = (entry, field) => {
            const tl = entry._timeline;
            if (!tl || !tl[field]) return Infinity; // no date → sort to end
            return new Date(tl[field]).getTime();
        };

        if (this.state.sort === 'deadline') {
            expanded.sort((a, b) => getTime(a, 'submission_deadline') - getTime(b, 'submission_deadline'));
        } else if (this.state.sort === 'conference') {
            expanded.sort((a, b) => getTime(a, 'conference_start') - getTime(b, 'conference_start'));
        } else {
            const rankOrder = { A: 0, B: 1, C: 2 };
            expanded.sort((a, b) => {
                const rDiff = rankOrder[a.ccf_rank] - rankOrder[b.ccf_rank];
                if (rDiff !== 0) return rDiff;
                return a.abbreviation.localeCompare(b.abbreviation);
            });
        }

        return expanded;
    },

    updateFilter(key, value) {
        this.state[key] = value;
        return this.filter();
    },
};
