#!/usr/bin/env python3
"""Local dev server for MKK — no-store headers, utf-8 charset, and byte-range support
so local QA behaves like the published artifact (audio seeking + Lithuanian text)."""
import http.server, socketserver, os, re, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class H(http.server.SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

    def guess_type(self, path):
        t = super().guess_type(path)
        base = t.split(';')[0].strip()
        if base in ('text/html', 'text/css', 'application/javascript', 'text/javascript',
                    'application/json', 'image/svg+xml', 'text/plain'):
            return base + '; charset=utf-8'
        if path.endswith('.webmanifest'):
            return 'application/manifest+json; charset=utf-8'
        if path.endswith('.webp'):
            return 'image/webp'
        return t

    def send_head(self):
        rng = self.headers.get('Range')
        if not rng:
            return super().send_head()
        path = self.translate_path(self.path)
        if os.path.isdir(path) or not os.path.exists(path):
            return super().send_head()
        m = re.match(r'bytes=(\d*)-(\d*)$', rng.strip())
        if not m:
            return super().send_head()
        size = os.path.getsize(path)
        start = int(m.group(1)) if m.group(1) else 0
        end = int(m.group(2)) if m.group(2) else size - 1
        if m.group(1) == '':                      # suffix range: bytes=-500
            start, end = max(0, size - end), size - 1
        end = min(end, size - 1)
        if start > end:
            self.send_error(416, 'Requested Range Not Satisfiable')
            return None
        f = open(path, 'rb')
        f.seek(start)
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Range', 'bytes %d-%d/%d' % (start, end, size))
        self.send_header('Content-Length', str(end - start + 1))
        self.end_headers()
        return _Slice(f, end - start + 1)

    def log_message(self, *a):
        pass


class _Slice:
    """File-like wrapper that stops after n bytes, for copyfile()."""
    def __init__(self, f, n):
        self.f, self.left = f, n

    def read(self, sz=-1):
        if self.left <= 0:
            return b''
        if sz is None or sz < 0:
            sz = self.left
        data = self.f.read(min(sz, self.left))
        self.left -= len(data)
        return data

    def close(self):
        self.f.close()


class Server(socketserver.ThreadingTCPServer):
    """Threaded: the page pulls ~22 illustrations in parallel and a single-threaded
    handler makes them queue (and one stalled 404 blocks every other request)."""
    allow_reuse_address = True
    daemon_threads = True


with Server(('127.0.0.1', PORT), H) as s:
    print('MKK on http://localhost:%d/' % PORT)
    s.serve_forever()
