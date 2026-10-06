/**
 * 零依赖的本地静态服务器（ES 模块不能用 file:// 打开）。
 *   npm run dev            → http://localhost:5173/examples/
 *   PORT=8080 npm run dev
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.md': 'text/markdown; charset=utf-8',
};

async function resolveFile(urlPath) {
  const path = normalize(join(ROOT, decodeURIComponent(urlPath)));
  if (path !== ROOT && !path.startsWith(ROOT + sep)) return null;
  const info = await stat(path).catch(() => null);
  if (!info) return null;
  if (info.isDirectory()) return resolveFile(join(urlPath, 'index.html'));
  return path;
}

/** 启动服务器，port 为 0 时随机分配。返回 { server, url } */
export function serve(port = 0) {
  const server = createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    const file = await resolveFile(pathname);
    if (!file) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('404');
      return;
    }
    res.writeHead(200, {
      'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(await readFile(file));
  });

  return new Promise((done) => {
    server.listen(port, '127.0.0.1', () => {
      done({ server, url: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { url } = await serve(Number(process.env.PORT ?? 5173));
  console.log(`Vunio 开发服务器：${url}/examples/`);
}
