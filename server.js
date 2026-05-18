const express = require('express');
const path = require('path');
const https = require('https');
const http = require('http');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Proxy: fetch Google Sheets CSV server-side to bypass CORS
app.get('/api/sheet', (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('Missing url param');

  console.log('Proxying:', url.substring(0, 80));

  const client = url.startsWith('https') ? https : http;
  const request = client.get(url, { 
    headers: { 'User-Agent': 'Mozilla/5.0' }
  }, (upstream) => {
    console.log('Upstream status:', upstream.statusCode);
    
    // Follow redirect
    if (upstream.statusCode === 301 || upstream.statusCode === 302) {
      const redirectUrl = upstream.headers.location;
      console.log('Redirecting to:', redirectUrl);
      const r2 = https.get(redirectUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (upstream2) => {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        upstream2.pipe(res);
      });
      r2.on('error', e => res.status(500).send('Redirect error: ' + e.message));
      return;
    }

    if (upstream.statusCode !== 200) {
      return res.status(upstream.statusCode).send('Upstream error: ' + upstream.statusCode);
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    upstream.pipe(res);
  });

  request.on('error', (e) => {
    console.error('Proxy error:', e.message);
    res.status(500).send('Proxy error: ' + e.message);
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Patsnap Dashboard running on port ${PORT}`);
});
