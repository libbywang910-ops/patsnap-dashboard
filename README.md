# Patsnap Eureka Marketing Dashboard

Live marketing dashboard that reads data directly from Google Sheets.

## Data Sources

Data is fetched live from Google Sheets (public CSV) every time the page loads or Refresh is clicked:

- **SM_Data** — Social Media ad creatives
- **GA_Data** — Google Ads keyword performance  
- **KOL_Data** — KOL partnership data

To update the dashboard, simply update the Google Sheets. No redeployment needed.

## Deploy to Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Select this repo → Railway auto-detects Node.js and deploys
4. Go to Settings → Networking → Generate Domain → copy your public URL

## Local Development

```bash
npm install
npm start
# Open http://localhost:3000
```

## Project Structure

```
├── server.js        # Express static file server
├── package.json     # Node.js dependencies
├── public/
│   └── index.html   # Dashboard (fetches CSV from Google Sheets on load)
└── README.md
```
