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

        // Safety timeout: hide loading after 10s even on error
        const safetyTimer = setTimeout(() => {
            if (!DataLoader.loaded) {
                Renderer.hideLoading();
                if (Renderer.emptyState) {
                    Renderer.emptyState.style.display = 'flex';
                    const h2 = Renderer.emptyState.querySelector('h2');
                    if (h2) h2.textContent = I18N.locale === 'zh' ? '数据加载超时' : 'Data load timeout';
                    const p = Renderer.emptyState.querySelector('p');
                    if (p) p.textContent = I18N.locale === 'zh' ? '请刷新页面重试' : 'Please refresh the page';
                }
            }
        }, 10000);

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
            clearTimeout(safetyTimer);
            Renderer.hideLoading();
            if (Renderer.emptyState) {
                Renderer.emptyState.style.display = 'flex';
                const h2 = Renderer.emptyState.querySelector('h2');
                if (h2) h2.textContent = I18N.locale === 'zh' ? '数据加载失败' : 'Data Load Failed';
                const p = Renderer.emptyState.querySelector('p');
                if (p) p.textContent = I18N.locale === 'zh' ? '请检查网络连接或刷新页面重试' : 'Check your network or refresh the page';
            }
            console.error('Data init failed:', err);
            return;
        }

        clearTimeout(safetyTimer);

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
