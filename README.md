# CAPP 4 Good Website (static)

Static HTML/CSS/JS site. Everything lives under `public/` and deploys as-is.

## Structure
- `public/`: full site. `public/index.html` home; styles in `public/ananke/` + `public/assets/custom.css`.
- `public/assets/events.json`: events shown on About; edit to add/update date/title/description/link.
- `.github/workflows/static-site.yml`: deploys `public/` to GitHub Pages via Actions.

## Published site
  https://capp4good.github.io/CAPP4GOOD-Website/

## How to update the events calendar
1) Edit `public/assets/events.json` and add objects like:
```json
{
  "date": "2026-01-22",
  "title": "Hacknight: Open Data",
  "description": "Hands-on co-work night with open datasets.",
  "link": "https://example.com/register"
}
```
2) The calendar shows the next 14 days by default; “Show more events” reveals all entries.

## Contribute workflow
- Preferred: open a PR with your page and/or event edits.  
- Alternatively: email the HTML + images and the JSON edits; we’ll apply them.
