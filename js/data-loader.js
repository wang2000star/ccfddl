/**
 * data-loader.js - Load and cache JSON data
 */
const DataLoader = {
    conferences: [],
    journals: [],
    metadata: null,
    timelines: {}, // year -> venue_id -> timeline entry
    websites: {},  // abbr -> website URL
    loaded: false,

    async init() {
        if (this.loaded) return;
        try {
            const [confResp, jrnResp, metaResp, tlResp, webResp] = await Promise.all([
                fetch('data/conferences.json'),
                fetch('data/journals.json'),
                fetch('data/metadata.json'),
                fetch('data/timelines/2026.json').catch(() => Promise.resolve({ json: () => [] })),
                fetch('data/websites.json').catch(() => Promise.resolve({ json: () => ({}) }))
            ]);
            this.conferences = await confResp.json();
            this.journals = await jrnResp.json();
            this.metadata = await metaResp.json();
            const tlArray = await tlResp.json();
            this.websites = await webResp.json();

            // Index timelines by venue_id (use string keys for consistency)
            this.timelines = {};
            for (const tl of tlArray) {
                const year = String(tl.year || '2026');
                if (!this.timelines[year]) this.timelines[year] = {};
                this.timelines[year][tl.venue_id] = tl;
            }

            this.loaded = true;
            console.log(`Loaded: ${this.conferences.length} conferences, ${this.journals.length} journals, ${tlArray.length} timelines, ${Object.keys(this.websites).length} websites`);
        } catch (err) {
            console.error('Failed to load data:', err);
            throw err;
        }
    },

    getTimeline(venueId, year) {
        year = year || '2026';
        return this.timelines[year]?.[venueId] || null;
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
