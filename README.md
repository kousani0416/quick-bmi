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
