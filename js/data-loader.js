/**
 * data-loader.js - Load and cache JSON data
 */
const DataLoader = {
    conferences: [],
    journals: [],
    metadata: null,
    timelines: {}, // year -> venue_id -> array of timeline entries (supports multi-round)
    websites: {},  // abbr -> website URL
    loaded: false,

    loadedYears: new Set(),

    async init() {
        if (this.loaded) return;
        try {
            const [confResp, jrnResp, metaResp, webResp] = await Promise.all([
                fetch('data/conferences.json'),
                fetch('data/journals.json'),
                fetch('data/metadata.json'),
                fetch('data/websites.json').catch(() => Promise.resolve({ json: () => ({}) }))
            ]);
            this.conferences = await confResp.json();
            this.journals = await jrnResp.json();
            this.metadata = await metaResp.json();
            this.websites = await webResp.json();
            this.timelines = {};

            // Load initial year
            await this.loadYear('2026');
            // Preload adjacent years
            this.loadYear('2025').catch(() => {});
            this.loadYear('2027').catch(() => {});

            this.loaded = true;
            console.log(`Loaded: ${this.conferences.length} conferences, ${this.journals.length} journals, ${Object.keys(this.websites).length} websites`);
        } catch (err) {
            console.error('Failed to load data:', err);
            throw err;
        }
    },

    async loadYear(year) {
        year = String(year);
        if (this.loadedYears.has(year)) return;
        try {
            const resp = await fetch(`data/timelines/${year}.json`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const tlArray = await resp.json();
            if (!this.timelines[year]) this.timelines[year] = {};
            for (const tl of tlArray) {
                const y = String(tl.year || year);
                if (!this.timelines[y]) this.timelines[y] = {};
                if (!this.timelines[y][tl.venue_id]) this.timelines[y][tl.venue_id] = [];
                this.timelines[y][tl.venue_id].push(tl);
            }
            for (const vid of Object.keys(this.timelines[year])) {
                this.timelines[year][vid].sort((a, b) => {
                    return (a.submission_deadline || '9999').localeCompare(b.submission_deadline || '9999');
                });
            }
            this.loadedYears.add(year);
            console.log(`Loaded timeline ${year}: ${tlArray.length} entries`);
        } catch (err) {
            console.warn(`Timeline ${year} not available:`, err.message);
            if (!this.timelines[year]) this.timelines[year] = {};
        }
    },

    getAvailableYears() {
        // Return years that have been loaded or are known to exist
        const years = [];
        for (const y of this.loadedYears) years.push(y);
        years.sort();
        return years.length > 0 ? years : ['2026'];
    },

    getTimeline(venueId, year) {
        year = year || '2026';
        const arr = this.timelines[year]?.[venueId];
        return (arr && arr.length > 0) ? arr[0] : null;
    },

    getTimelines(venueId, year) {
        year = year || '2026';
        return this.timelines[year]?.[venueId] || [];
    },

    hasMultiRound(venueId, year) {
        year = year || '2026';
        return (this.timelines[year]?.[venueId]?.length || 0) > 1;
    },

    // Get all venues combined
    getAllVenues() {
        const all = [
            ...this.conferences,
            ...this.journals
        ];
        return all;
    },

    // Get venues by type with optional CHES/TCHES override
    getByType(type) {
        if (type === 'conference') {
            return this.conferences;
            // Note: TCHES is already in journal list; special handling is in filtering
        }
        if (type === 'journal') {
            return this.journals;
        }
        return this.getAllVenues();
    },

    // Get unique categories for filter dropdown
    getCategories() {
        const cats = new Map();
        for (const c of this.conferences) {
            if (!cats.has(c.category_zh)) {
                cats.set(c.category_zh, c.category_en);
            }
        }
        return Array.from(cats.entries()).map(([zh, en]) => ({ zh, en }));
    },

    // Count by rank for a given list
    countByRank(venues) {
        const counts = { A: 0, B: 0, C: 0 };
        for (const v of venues) {
            if (counts[v.ccf_rank] !== undefined) counts[v.ccf_rank]++;
        }
        return counts;
    },

    getWebsite(abbr) {
        return this.websites[abbr] || null;
    },

    // Journal-type overrides: these journals are treated as conferences
    JOURNAL_TYPE_OVERRIDES: new Set(['CHES', 'TCHES', 'FSE', 'IACR TCHES', 'IACR ToSC']),
};
