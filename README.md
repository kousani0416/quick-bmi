# QuickBMI

QuickBMI is a fast, single-screen BMI calculator website with:

- Metric and imperial unit support
- WHO category classification
- Contextual health tip per category
- Validation and edge-case warnings
- Ad banner and interstitial placeholders

## Local run

Open `index.html` in your browser, or run:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Deployment

This repository includes `.github/workflows/deploy-pages.yml` to deploy automatically to GitHub Pages on every push to `main`.

## AI proxy setup (no frontend API key)

The frontend calls a secure endpoint instead of exposing an API key in the browser.

### 1) Create Cloudflare Worker

```bash
cd worker
npm create cloudflare@latest . -- --type=hello-world --lang=js
```

If prompted about overwriting, keep `index.js` and `wrangler.toml` from this repo.

### 2) Authenticate and set secrets

```bash
npx wrangler login
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put OPENAI_MODEL
```

For `OPENAI_MODEL`, use e.g. `gpt-4o-mini`.

### 3) Deploy worker

```bash
npx wrangler deploy
```

Copy the deployed URL, for example:

`https://quickbmi-ai-proxy.your-subdomain.workers.dev/api/analyze`

### 4) Wire frontend to worker

Update `state.aiEndpoint` in `app.js` with your deployed URL and push to GitHub Pages.
