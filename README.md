# slush.app — The Saim

Website for The Saim (thesaim.xyz content) presented in the slush.app design system.

## Run locally

```bash
node server.js
```

The server uses only Node's built-in modules. It looks in `clone/public` first, then `clone`, and binds to a free port (printed on startup).

## Structure

- `server.js` — static file server (lookup order: clone/public -> clone)
- `clone/` — site pages (HTML)
- `clone/public/` — static assets (CSS, images, fonts, etc.)
- `clone/public/site.css` — shared design stylesheet
