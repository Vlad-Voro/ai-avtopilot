/**
 * Ephemeral Static HTTP Server for E2E Testing
 * Serves static assets from data/ai-avtopilot and simulates GitHub Pages routing / 404 SPA fallback.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

function createStaticServer(baseDir) {
  const root = path.resolve(baseDir);

  const server = http.createServer((req, res) => {
    // Parse URL path, ignore query params for file lookup
    const urlObj = new URL(req.url, 'http://localhost');
    let pathname = decodeURIComponent(urlObj.pathname);

    if (pathname === '/') {
      pathname = '/index.html';
    }

    const filePath = path.join(root, pathname);

    // Security check to avoid path traversal
    if (!filePath.startsWith(root)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    // Check if the requested file exists
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // GitHub Pages SPA Behavior:
    // If requesting a clean path like /services or /cases and 404.html exists in root,
    // GitHub Pages serves 404.html (with status 404, allowing redirect script to run).
    const fallback404 = path.join(root, '404.html');
    if (fs.existsSync(fallback404) && fs.statSync(fallback404).isFile()) {
      res.writeHead(404, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      fs.createReadStream(fallback404).pipe(res);
      return;
    }

    // Standard 404 if no 404.html exists
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  });

  return {
    server,
    start: () => {
      return new Promise((resolve, reject) => {
        server.listen(0, '127.0.0.1', () => {
          const port = server.address().port;
          resolve({
            port,
            baseUrl: `http://127.0.0.1:${port}`
          });
        });
        server.on('error', reject);
      });
    },
    stop: () => {
      return new Promise((resolve) => {
        server.close(resolve);
      });
    }
  };
}

module.exports = {
  createStaticServer
};
