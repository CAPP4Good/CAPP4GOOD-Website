# CAPP 4 Good Website (static)

Static HTML/CSS/JS site. Everything lives under `public/` and deploys as-is.

## Structure
`public/` is the published root — what it contains is exactly what the site serves.

- `public/index.html`: the main page (the former About page), served at `/`.
- `public/events/index.html`: the full calendar, served at `/events/`.
- `public/contact/index.html`: served at `/contact/`.
- `public/404.html`: GitHub Pages' not-found page.
- `public/about/index.html`: redirect stub that forwards old `/about/` links to `/`.
- `public/assets/events.json`: the event data; edit to add/update date/title/description/link.
- `public/assets/events.js`: shared rendering for the calendar, used by both pages.
- `public/assets/custom.css` + `public/ananke/`: styles.
- `.github/workflows/static-site.yml`: deploys `public/` to GitHub Pages via Actions.

## Published site
  https://capp4good.github.io/CAPP4GOOD-Website/

## Local preview
Serve `public/` over HTTP (opening the files directly with `file://` will not work,
because the events calendar is loaded with `fetch`):

```sh
cd public && python3 -m http.server 8000
# then open http://localhost:8000/
```

## URLs and paths
Pages link to each other with ordinary relative paths, so the site works unchanged
whether it is served from `https://capp4good.github.io/CAPP4GOOD-Website/`, from a
custom domain at `/`, or from `localhost`. Two rules keep it that way:

- From `public/index.html`, reference assets as `assets/...`, `images/...`.
- From a page one level down (like `contact/`), prefix them with `../`.

`public/404.html` is the exception: GitHub Pages serves it for any missing path, at any
depth, so relative URLs cannot work there. It carries a hardcoded
`<base href="/CAPP4GOOD-Website/">` that must be updated if the site moves to another domain.

## How to update the events calendar
1) Edit `public/assets/events.json` and add objects like:
```json
{
  "date": "2026-01-22",
  "startTime": "12:30",
  "endTime": "13:30",
  "title": "Hacknight: Open Data",
  "description": "Hands-on co-work night with open datasets.",
  "link": "https://example.com/register",
  "image": "images/hacknight.png"
}
```
2) The home page shows the next three upcoming events; `/events/` lists every event,
   soonest first. Past events drop off the home page automatically but stay on `/events/`.
3) For an event whose date is not settled yet, leave `"date": ""`. The card renders as
   "Date TBD" and sorts after everything scheduled; fill in the date later to place it.
4) Image paths in `events.json` are relative to the site root (`images/...`). The events
   page passes `assetBase: '../'` so the same paths work one level down.
5) `startTime`/`endTime` are 24-hour campus-local times and drive the "Add to calendar"
   button. Leave both blank for an all-day entry; omit `endTime` for a one-hour default.
   An event with no `date` gets no button, since there is nothing to schedule.
   The timezone is set by `TIMEZONE` in `public/assets/events.js`.

## Contribute workflow
- Preferred: open a PR with your page and/or event edits.  
- Alternatively: email the HTML + images and the JSON edits; we’ll apply them.
