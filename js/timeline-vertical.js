/**
 * timeline-vertical.js - Vertical dual-column timeline view
 * Left: 2025 submission deadlines  |  Right: 2026 submission deadlines
 */
const VerticalTimeline = {
    render(venues) {
        const header = document.getElementById('verticalHeader');
        const body = document.getElementById('verticalBody');
        if (!header || !body) return;

        // Collect all entries with submission deadlines
        const all = [];
        for (const v of venues) {
            const timelines = DataLoader.getTimelines ? DataLoader.getTimelines(v.id, '2026') : [];
            for (const tl of timelines) {
                if (tl.submission_deadline) {
                    all.push({ venue: v, timeline: tl, year: tl.year, round: tl.round || 1, total: timelines.length });
                }
            }
            const tls25 = DataLoader.getTimelines ? DataLoader.getTimelines(v.id, '2025') : [];
            for (const tl of (tls25 || [])) {
                if (tl.submission_deadline) {
                    all.push({ venue: v, timeline: tl, year: 2025, round: tl.round || 1, total: tls25.length });
                }
            }
        }

        // Split by submission year
        const byYear = {};
        for (const e of all) {
            const sy = e.timeline.submission_deadline.substring(0, 4);
            if (!byYear[sy]) byYear[sy] = [];
            byYear[sy].push(e);
        }

        // Sort each year's entries by submission date
        for (const y of Object.keys(byYear)) {
            byYear[y].sort((a, b) => a.timeline.submission_deadline.localeCompare(b.timeline.submission_deadline));
        }

        const years = Object.keys(byYear).sort();

        // Build header with current time marker
        const now = new Date();
        const nowStr = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`;
        header.innerHTML = `<div style="font-size:1rem;font-weight:700;padding:10px 20px;color:var(--color-text);display:flex;align-items:center;gap:12px;">
            <span>📅 投稿截止时间轴</span>
            <span style="font-size:0.7rem;color:var(--rank-a);background:var(--rank-a-bg);padding:2px 10px;border-radius:9999px;animation:pulse 2s infinite;">📍 今日: ${nowStr}</span>
        </div>`;

        // Build body
        let html = '<div class="vt-container">';

        // Month labels
        const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

        const now = new Date();
        const nowYear = now.getFullYear();
        const nowMonth = now.getMonth() + 1;
        const nowDay = now.getDate();
        const nowPos = nowMonth * 24 + (nowDay / 31) * 24; // approximate pixel position

        for (const year of years) {
            const entries = byYear[year];
            const showNow = parseInt(year) === nowYear;
            html += `<div class="vt-column">
                <div class="vt-year-title">${year} 年投稿 (${entries.length}个)</div>
                <div class="vt-timeline" style="position:relative;">`;

            if (showNow) {
                html += `<div class="vt-now-marker" style="top:${nowPos}px" title="今日 ${nowStr}">
                    <span>📍 今日</span><span class="vt-now-line"></span>
                </div>`;
            }

            let prevMonth = 0;
            for (const e of entries) {
                const d = new Date(e.timeline.submission_deadline + 'T00:00:00');
                const month = d.getMonth();
                const day = d.getDate();
                const label = `${e.venue.abbreviation}${e.total > 1 ? '_' + e.round : ''} ${e.year}`;
                const side = (entries.indexOf(e) % 2 === 0) ? 'left' : 'right';
                const monthGap = month - prevMonth;
                const spacer = monthGap > 0 ? `<div style="height:${monthGap * 24}px;"></div>` : '';

                html += `${spacer}
                <div class="vt-entry vt-${side}">
                    <div class="vt-label">${label}</div>
                    <div class="vt-brace">
                        <span class="vt-date">${months[month]}${day}日</span>
                        <span class="vt-dot"></span>
                    </div>
                </div>`;
                prevMonth = month;
            }
            html += `</div></div>`;
        }

        html += '</div>';
        body.innerHTML = html;
    }
};
