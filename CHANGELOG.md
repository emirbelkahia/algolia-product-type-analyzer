# Changelog

## v1.1 — 2026-06-12

- Section 2 queries batched through the Algolia multi-queries endpoint (50 per call): 1000 queries now take seconds instead of minutes
- Proper CSV parsing: quoted fields, commas inside queries, Windows line endings, Excel BOM, case-insensitive `search` header
- Errors are now displayed in the page (invalid key, missing column, invalid JSON, failed requests) instead of the browser console only
- API key fields are masked with a show/hide toggle
- Previews are HTML-escaped (queries come from end users and could contain markup)
- Fixed: `0`/`false` values dropped from CSV exports, `NaN%` on zero-hit queries, Section 2 loader hidden before work started, links pointing to the old repository name
- Per-batch progress indicator during hits extraction
- Added MIT LICENSE file and favicon, removed dead code (duplicated tooltip CSS, unused A/B test container)

## v1.0 — Jan 2024

- Initial release: top searches extraction (Analytics API, US + DE regions), hits retrieval (Search API), attribute percentage analysis with CSV export
