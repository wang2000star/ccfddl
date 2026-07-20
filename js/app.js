/**
 * app.js - Main application entry point
 * Wires together i18n, data loading, search/filter, and rendering
 */
const App = {
    async init() {
        // Initialize renderer
        Renderer.init();

        // Show loading state
        Renderer.showLoading();

        // Set up event listeners
        this.setupTypeToggle();
        this.setupRankFilter();
        this.setupSearch();
        this.setupCategoryFilter();
        this.setupLanguageToggle();

        // Load data
        try {
            await DataLoader.init();
        } catch (err) {
            Renderer.hideLoading();
            Renderer.emptyState.style.display = 'flex';
            Renderer.emptyState.querySelector('h2').textContent = '数据加载失败';
            Renderer.emptyState.querySelector('p').textContent = '请检查网络连接或刷新页面重试';
            console.error(err);
            return;
        }

        // Populate category dropdown
        this.populateCategories();

        // Set initial locale
        I18N.updateDOM();

        // Initial render
        this.refresh();
    },

    refresh() {
        const results = Search.filter();
        Renderer.render(results);
    },

    setupTypeToggle() {
        const container = document.getElementById('typeToggle');
        if (!container) return;

        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.toggle-btn');
            if (!btn) return;

            // Update active states
            container.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update filter
            Search.updateFilter('type', btn.getAttribute('data-type'));
            this.refresh();
        });
    },

    setupRankFilter() {
        const container = document.getElementById('rankFilter');
        if (!container) return;

        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.toggle-btn');
            if (!btn) return;

            const rank = btn.getAttribute('data-rank');

            // Toggle rank in set
            if (Search.state.ranks.has(rank)) {
                Search.state.ranks.delete(rank);
                btn.classList.remove('active');
            } else {
                Search.state.ranks.add(rank);
                btn.classList.add('active');
            }

            this.refresh();
        });
    },

    setupSearch() {
        const input = document.getElementById('searchInput');
        if (!input) return;

        let debounceTimer;
        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                Search.updateFilter('query', input.value);
                this.refresh();
            }, 250);
        });
    },

    setupCategoryFilter() {
        const select = document.getElementById('categoryFilter');
        if (!select) return;

        select.addEventListener('change', () => {
            Search.updateFilter('category', select.value);
            this.refresh();
        });
    },

    setupLanguageToggle() {
        const btn = document.getElementById('langToggle');
        if (!btn) return;

        btn.addEventListener('click', () => {
            I18n.toggle();
            // Re-render to update card labels
            this.refresh();
        });
    },

    populateCategories() {
        const select = document.getElementById('categoryFilter');
        if (!select) return;

        const categories = DataLoader.getCategories();
        for (const cat of categories) {
            const option = document.createElement('option');
            option.value = cat.zh;
            option.textContent = `${cat.zh} (${cat.en})`;
            select.appendChild(option);
        }
    }
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
