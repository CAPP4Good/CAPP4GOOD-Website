# CAPP 4 Good Website

Hugo static site. The repo includes the editable Hugo sources and the generated `public` output.

## Project layout
- `hugo.toml`: Site configuration (title, base URL, theme, languages).
- `content/en/_index.md`: Homepage content
- `content/en/about/index.md`: About page content folder (can include images or sub-sections).
- `content/en/post/`: Blog section; `_index.md` controls listing, individual `post_*.md` files are posts.
- `archetypes/default.md`: Front matter template used when running `hugo new`.
- `themes/ananke/`: Ananke theme assets/layouts; customize here if you need design changes beyond content.
- `public/`: Generated site output (overwritten by `hugo`); do not edit by hand.

## Run and develop
1. Install Hugo Extended (https://gohugo.io/installation/) and Go (needed to fetch the theme module).
2. From the repo root, fetch the Ananke theme module: `hugo mod vendor` (or `hugo mod get` if you prefer using the cache).
3. Start the dev server with drafts: `hugo server -D` (if port 1313 is busy, use `--port 1315 --bind 127.0.0.1`).
4. Edit files under `content/en/` for text changes; add posts with `hugo new post/post_slug.md`.
5. Build for production with `hugo`, which refreshes `public/`.
