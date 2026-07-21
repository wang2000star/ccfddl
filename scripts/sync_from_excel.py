# Read timeline data from 4-sheet Excel and generate JSON
import json
from pathlib import Path
try:
    import openpyxl
except ImportError:
    print("pip install openpyxl")
    exit(1)

BASE = Path(__file__).resolve().parent.parent
EXCEL_PATH = BASE / "timeline_data.xlsx"
DATA_DIR = BASE / "data" / "timelines"

def excel_to_json():
    wb = openpyxl.load_workbook(EXCEL_PATH)
    entries = []

    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        headers = [cell.value for cell in ws[1]]
        for row in ws.iter_rows(min_row=2, max_row=ws.max_row, values_only=True):
            if not row[0]: continue
            entry = {}
            stats = {}
            has_data = False
            for i, key in enumerate(headers):
                if key is None: continue
                val = row[i] if i < len(row) else None
                if val is None or val == '':
                    if key in ('submissions','accepted','acceptance_rate'):
                        continue
                    else:
                        entry[key] = val if val is not None else None
                        continue
                if key in ('submissions','accepted'):
                    stats[key] = int(val) if isinstance(val,(int,float)) else val
                elif key == 'acceptance_rate':
                    stats[key] = float(val) if isinstance(val,(int,float)) else val
                elif key == 'round':
                    entry[key] = int(val)
                elif key == 'year':
                    entry[key] = int(val)
                else:
                    entry[key] = str(val).strip()
                has_data = True

            required = ['venue_id', 'abbreviation', 'year']
            if has_data and all(k in entry for k in required):
                if stats: entry['stats'] = stats
                entries.append(entry)

    wb.close()
    entries.sort(key=lambda e: (e.get('submission_deadline',''), e['venue_id']))

    # Save combined JSON
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(DATA_DIR / "all.json", 'w', encoding='utf-8') as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)

    # Save per-year files
    years = sorted(set(e['year'] for e in entries))
    for year in years:
        year_entries = [e for e in entries if e['year'] == year]
        with open(DATA_DIR / f"{year}.json", 'w', encoding='utf-8') as f:
            json.dump(year_entries, f, ensure_ascii=False, indent=2)

    print(f"Total: {len(entries)} entries across {len(years)} years")
    for y in years:
        count = len([e for e in entries if e['year'] == y])
        venues = len(set(e['venue_id'] for e in entries if e['year'] == y))
        print(f"  {y}: {count} entries, {venues} venues")

if __name__ == '__main__':
    excel_to_json()
