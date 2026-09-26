#!/usr/bin/env python3
"""Regenerate timeline JSON from the complete, maintained Excel source.

The former embedded snapshot contained only 80 records and overwrote the
complete 134-record workbook. Keep this legacy entry point safe by delegating
to the workbook-to-JSON synchronizer instead.
"""
from sync_from_excel import excel_to_json


if __name__ == "__main__":
    excel_to_json()
