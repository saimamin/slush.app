// Static file server for the slush.app copy.
// Uses only Node built-in modules. For each request it looks in clone/public first,
// then in clone. Binds to a free port (0 = OS-assigned) and writes it to a port file.
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE = __dirname;
const PUBLIC_DIR = path.join(BASE, 'clone', 'public');
const CLONE_DIR = path.join(BASE, 'clone');
const PORT_FILE = path.join(BASE, '.clone-server-port');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function resolveFile(urlPath) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0]); }
  catch { return null; }
  if (decoded === '/' || decoded === '') decoded = '/index.html';

  // Normalize and block path traversal outside the allowed roots.
  let rel = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]+/, '');
  if (rel === '' || rel === '.') rel = 'index.html';

  const roots = [PUBLIC_DIR, CLONE_DIR];
  // Build a list of relative paths to try (with and without .html, plus index.html in dirs).
  const tries = [rel];
  if (!path.extname(rel)) {
    tries.push(rel + '.html');
    tries.push(path.join(rel, 'index.html'));
  }
  for (const root of roots) {
    for (const t of tries) {
      const file = path.resolve(root, t);
      if (!file.startsWith(root + path.sep) && file !== root) continue;
      try {
        const st = fs.statSync(file);
        if (st.isFile()) return file;
      } catch { /* keep looking */ }
    }
  }
  return null;
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url || '/');
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('404 Not Found: ' + (req.url || ''));
  }
  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  });
  fs.createReadStream(file).pipe(res);
});

// Reuse the previously chosen port on restart so the local link stays stable.
function savedPort() {
  try { const p = Number(fs.readFileSync(PORT_FILE, 'utf8').trim()); return p > 0 ? p : 0; }
  catch { return 0; }
}
function start(port) {
  server.listen(port, '0.0.0.0', () => {
    const actual = server.address().port;
    fs.writeFileSync(PORT_FILE, String(actual));
    console.log(`CLONE_SERVER_READY http://127.0.0.1:${actual}/ (lookup: clone/public -> clone)`);
  });
}
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') { console.log('Port busy, choosing another free port'); start(0); }
  else { console.error('SERVER ERROR', err); process.exit(1); }
});
start(process.env.PORT ? Number(process.env.PORT) : savedPort());
