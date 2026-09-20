# CAPP 4 Good Website (static)

Static HTML/CSS/JS site. Everything lives under `public/` and deploys as-is.

## Structure
`public/` is the published root — what it contains is exactly what the site serves.

- `public/index.html`: the main page (the former About page), served at `/`.
- `public/contact/index.html`: served at `/contact/`.
- `public/404.html`: GitHub Pages' not-found page.
- `public/about/index.html`: redirect stub that forwards old `/about/` links to `/`.
- `public/assets/events.json`: events shown on the main page; edit to add/update date/title/description/link.
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
  "title": "Hacknight: Open Data",
  "description": "Hands-on co-work night with open datasets.",
  "link": "https://example.com/register"
}
```
2) Every entry is shown, sorted by date; the arrows scroll through them.

## Contribute workflow
- Preferred: open a PR with your page and/or event edits.  
- Alternatively: email the HTML + images and the JSON edits; we’ll apply them.
