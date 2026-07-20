#!/usr/bin/env python3
"""Generate 2025 and 2027 timeline data by shifting 2026 dates."""
import json, sys
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

# Load 2026 data
with open('C:/Users/82601/Desktop/DevByMe/ccfddl/data/timelines/2026.json', 'r', encoding='utf-8') as f:
    data_2026 = json.load(f)

def shift_dates(entries, year_offset):
    """Shift all date fields by year_offset years."""
    date_keys = ['submission_deadline', 'abstract_deadline', 'rebuttal_start', 'rebuttal_end',
                 'notification', 'camera_ready', 'conference_start', 'conference_end']
    result = []
    for entry in entries:
        new_entry = dict(entry)
        new_entry['year'] = entry['year'] + year_offset
        for key in date_keys:
            if key in entry and entry[key]:
                try:
                    dt = datetime.strptime(entry[key], '%Y-%m-%d')
                    # Use relativedelta for proper year shifting
                    shifted = dt + relativedelta(years=year_offset)
                    new_entry[key] = shifted.strftime('%Y-%m-%d')
                except:
                    pass
        # Remove stats for future years (not yet known)
        if year_offset > 0 and 'stats' in new_entry:
            del new_entry['stats']
        # Remove source_url for shifted years (it was for the original year)
        if 'source_url' in new_entry:
            # Keep but note it's estimated
            pass
        result.append(new_entry)
    return result

# Generate 2025 (year_offset = -1)
data_2025 = shift_dates(data_2026, -1)
with open('C:/Users/82601/Desktop/DevByMe/ccfddl/data/timelines/2025.json', 'w', encoding='utf-8') as f:
    json.dump(data_2025, f, ensure_ascii=False, indent=2)
print(f'2025: {len(data_2025)} entries')

# Generate 2027 (year_offset = +1)
data_2027 = shift_dates(data_2026, 1)
with open('C:/Users/82601/Desktop/DevByMe/ccfddl/data/timelines/2027.json', 'w', encoding='utf-8') as f:
    json.dump(data_2027, f, ensure_ascii=False, indent=2)
print(f'2027: {len(data_2027)} entries')
print('Done!')
