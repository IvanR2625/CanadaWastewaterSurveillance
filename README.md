# Canada Wastewater Surveillance Dashboard

An interactive dashboard for visualizing SARS-CoV-2 viral signal from wastewater surveillance sites across Canada, built on Public Health Agency of Canada (PHAC) open data.

**[Live Site → https://ivanr2625.github.io/CanadaWastewaterSurveillance/](https://ivanr2625.github.io/CanadaWastewaterSurveillance/)**

---

## Features

- **National trend chart** — time series of viral signal percentile across all reporting sites, with date-range filter (3 mo / 6 mo / 1 yr / all)
- **Province & territory overlay** — select up to 5 provinces to compare directly on the trend chart
- **Province grid** — colour-coded cards for all 13 provinces and territories, showing current signal level and 15-day trend direction
- **Rankings table** — sortable by highest/lowest signal, rising most, falling most, or alphabetical; click any row to overlay on the chart
- **KPI tiles** — national percentile, % of provinces rising, monitoring site count, dataset attribution
- **Light / dark mode** — respects system preference, persists across sessions
- **Live PHAC data** — fetches the PHAC wastewater aggregate CSV on load; falls back to embedded illustrative data if the endpoint is unavailable

---

## Data Source

**Public Health Agency of Canada — Wastewater Surveillance**

| Resource | Link |
|---|---|
| PHAC Dashboard | https://health-infobase.canada.ca/wastewater/ |
| Open Dataset | https://search.open.canada.ca/opendata/ |
| Aggregate CSV (time series) | https://health-infobase.canada.ca/src/data/wastewater/wastewater_aggregate.csv |
| Trend CSV (current snapshot) | https://health-infobase.canada.ca/src/data/wastewater/wastewater_trend.csv |

Data covers SARS-CoV-2 (N2 gene target, `measureid = covN2`) from wastewater treatment plants across Canada. Raw concentration values (`w_avg`, gene copies/mL) are converted to a 0–100 site-relative percentile by ranking each reading against the full history at that site — so a value of 75 means the current signal is higher than 75% of all readings ever recorded at that site.

---

## Tech Stack

| Layer | Library |
|---|---|
| UI framework | React 18 |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts 2 |
| Icons | Lucide React |
| Hosting | GitHub Pages |

---

## Run Locally

```bash
git clone https://github.com/IvanR2625/CanadaWastewaterSurveillance.git
cd CanadaWastewaterSurveillance
npm install
npm run dev
# → http://localhost:5173
```

## Build & Deploy

```bash
npm run build          # outputs to dist/
```

To redeploy to GitHub Pages, push the contents of `dist/` to the `gh-pages` branch:

```bash
# From repo root after npm run build
git -C <temp-dir> init && git -C <temp-dir> checkout --orphan gh-pages
cp -r dist/. <temp-dir>/
git -C <temp-dir> add . && git -C <temp-dir> commit -m "Deploy"
git -C <temp-dir> remote add origin https://<token>@github.com/IvanR2625/CanadaWastewaterSurveillance.git
git -C <temp-dir> push origin HEAD:gh-pages --force
```

---

## Related Projects

- [US Wastewater Surveillance (CDC NWSS)](https://github.com/IvanR2625/WasteWaterSurveillance) — companion dashboard for US data
