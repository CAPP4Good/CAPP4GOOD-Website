# CAPP 4 Good Website (static)

Static HTML/CSS/JS site. Everything lives under `public/` and deploys as-is.

## Structure
- `public/`: full site. `public/index.html` home; styles in `public/ananke/` + `public/assets/custom.css`.
- `public/assets/events.json`: events shown on About; edit to add/update date/title/description/link.
- `.github/workflows/static-site.yml`: deploys `public/` to GitHub Pages via Actions.

## Local preview
```
python -m http.server 8000
open http://localhost:8000/
```

## Publish to GitHub Pages
1) In GitHub Settings → Pages, set Source = GitHub Actions.  
2) `git push` to `main` (or run workflow “Deploy static site to Pages” in Actions).  
3) Check the workflow output for `page_url` (e.g., https://capp4good.github.io/Website/).

## How to add a post
1) Duplicate an existing folder under `public/post/` (e.g., `post_003`), or create a new one with your HTML.  
2) Update the card data in `public/post/index.html`:
   - Add a new `.post-card` block with:
     - `data-date="YYYY-MM-DD"` for sorting (newest first).
     - `data-tags="tag1,tag2"` for filtering.
     - A thumbnail `<div class="post-thumb"><img src=images/your-image.png ...></div>`.
   - Use relative paths for images (`public/images/your-image.png`).  
3) Update the post detail HTML inside your new folder (`index.html`), including title, author, date, tags, and content.  
4) (Optional) Write the content in R Markdown using `public/templates/post_template.Rmd`; knit to HTML fragment and paste into the body.

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
- Preferred: open a PR with post updates and/or event edits.  
- Alternatively: email the Rmd/HTML + images and the JSON edits; we’ll apply them.
