const express = require('express');
const path = require('path');
const https = require('https');
const http = require('http');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Proxy endpoint — fetches Google Sheets CSV server-side, bypasses CORS
app.get('/api/sheet', (req, res) => {
  const url = req.query.url;
  if (!url || !url.startsWith('https://docs.google.com')) {
    return res.status(400).send('Invalid URL');
  }

  console.log('Fetching:', url.substring(0, 80) + '...');

  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; PatSnapDashboard/1.0)',
      'Accept': 'text/csv,text/plain,*/*',
    }
  };

  function doRequest(targetUrl, redirectCount) {
    if (redirectCount > 5) return res.status(500).send('Too many redirects');
    const client = targetUrl.startsWith('https') ? https : http;
    client.get(targetUrl, options, (upstream) => {
      const status = upstream.statusCode;
      console.log('Status:', status, 'for', targetUrl.substring(0, 60));

      if (status === 301 || status === 302 || status === 303 || status === 307 || status === 308) {
        const loc = upstream.headers.location;
        upstream.resume();
        return doRequest(loc, redirectCount + 1);
      }

      if (status !== 200) {
        upstream.resume();
        return res.status(status).send('Upstream returned ' + status);
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache');
      upstream.pipe(res);
    }).on('error', (e) => {
      console.error('Request error:', e.message);
      res.status(500).send('Proxy error: ' + e.message);
    });
  }

  doRequest(url, 0);
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Patsnap Dashboard running on port ${PORT}`);
});
