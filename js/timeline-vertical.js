/**
 * timeline-vertical.js - Single timeline: left=投稿, right=录用
 */
const VerticalTimeline = {
    MONTHS: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],

    render(venues) {
        const header = document.getElementById('verticalHeader');
        const body = document.getElementById('verticalBody');
        if (!header || !body) return;

        // Collect submission and notification events, paired by label
        const pairs = {};
        for (const v of venues) {
            const tl = v._timeline;
            if (!tl) continue;
            const label = `${v.abbreviation}${v._totalRounds > 1 ? '_' + (v._roundIndex + 1) : ''} ${v._timelineYear || tl.year}`;
            if (!pairs[label]) pairs[label] = {};
            if (tl.submission_deadline) {
                const d = new Date(tl.submission_deadline + 'T00:00:00');
                if (d.getFullYear() >= 2025) pairs[label].sub = { date: d, month: d.getMonth(), day: d.getDate() };
            }
            if (tl.notification) {
                const d = new Date(tl.notification + 'T00:00:00');
                if (d.getFullYear() >= 2025) pairs[label].not = { date: d, month: d.getMonth(), day: d.getDate() };
            }
        }
        console.log('VerticalTimeline: pairs count=' + Object.keys(pairs).length + ', years=' + [...new Set(Object.values(pairs).flatMap(p => [p.sub?.date?.getFullYear(), p.not?.date?.getFullYear()]).filter(Boolean))].sort().join(','));

        // Group by year (use whichever date exists)
        const byYear = {};
        for (const [label, p] of Object.entries(pairs)) {
            const d = p.sub || p.not;
            if (!d) continue;
            const year = d.date.getFullYear();
            if (!byYear[year]) byYear[year] = [];
            byYear[year].push({ label, sub: p.sub, not: p.not });
        }
        const years = Object.keys(byYear).sort();
        if (years.length === 0) {
            header.innerHTML = '';
            body.innerHTML = '<div style="text-align:center;padding:60px;color:var(--color-text-muted);">暂无数据</div>';
            return;
        }
        const now = new Date();

        header.innerHTML = `<div style="display:flex;align-items:center;gap:12px;padding:10px 20px;">
            <span style="font-size:1rem;font-weight:700;">📅 投稿 → 录用时间轴</span>
            <span style="font-size:0.7rem;color:var(--rank-a);background:var(--rank-a-bg);padding:2px 10px;border-radius:9999px;">📍 ${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日</span>
            <span style="font-size:0.6rem;color:var(--color-text-muted);">🟢左=投稿 🟠右=录用</span>
        </div>`;

        const H = 28; // px per day

        let html = '<div class="vt-container">';
        for (const year of years) {
            const entries = byYear[year];
            // Build day-indexed map
            const days = {};
            for (const e of entries) {
                if (e.sub) {
                    const key = e.sub.month * 100 + e.sub.day;
                    if (!days[key]) days[key] = { left: [], right: [] };
                    days[key].left.push(e.label);
                }
                if (e.not) {
                    const key = e.not.month * 100 + e.not.day;
                    if (!days[key]) days[key] = { left: [], right: [] };
                    days[key].right.push(e.label);
                }
            }

            html += `<div class="vt-column">
                <div class="vt-year-title">${year} 年 — 🟢投稿 ${entries.filter(e => e.sub && e.sub.date.getFullYear() == year).length}个  🟠录用 ${entries.filter(e => e.not && e.not.date.getFullYear() == year).length}个</div>
                <div class="vt-timeline-single" style="position:relative;min-height:${366*H}px;">`;

            // Center line
            html += '<div class="vt-centerline"></div>';

            // Month labels on center line
            for (let m = 0; m < 12; m++) {
                const top = m * 31 * H;
                html += `<div class="vt-month-marker" style="top:${top}px">${this.MONTHS[m]}</div>`;
            }

            // Now marker
            if (parseInt(year) === now.getFullYear()) {
                const nowDay = (now.getMonth()) * 31 + now.getDate();
                html += `<div class="vt-now-marker" style="top:${nowDay * H}px"></div>`;
            }

            // Place entries
            const sortedDays = Object.keys(days).sort((a, b) => parseInt(a) - parseInt(b));
            for (const dk of sortedDays) {
                const day = days[dk];
                const m = Math.floor(parseInt(dk) / 100);
                const d = parseInt(dk) % 100;
                const top = (m * 31 + d) * H;

                if (day.left.length > 0) {
                    const labels = day.left.join(', ');
                    html += `<div class="vt-entry-left" style="top:${top}px">
                        <span class="vt-entry-date">${this.MONTHS[m]}${d}日</span>
                        <span class="vt-entry-label">${labels}</span>
                    </div>`;
                }
                if (day.right.length > 0) {
                    const labels = day.right.join(', ');
                    html += `<div class="vt-entry-right" style="top:${top}px">
                        <span class="vt-entry-label">${labels}</span>
                        <span class="vt-entry-date">${this.MONTHS[m]}${d}日</span>
                    </div>`;
                }
            }
            html += '</div></div>';
        }
        html += '</div>';
        body.innerHTML = html;
    }
};
