#!/usr/bin/env python3
"""MKK bundler — index.html + styles.css + app.js + content/*.json -> dist/artifact.html

The artifact is a single self-contained fragment:
  <title>  ->  Google Fonts <link>  ->  <style>  ->  markup  ->  <script>
It deliberately contains NO <!doctype>, <html>, <head> or <body> tags, and no
service worker: the artifact host supplies the page skeleton.
Audio stays a relative reference (audio/mkk-<band>.mp3) — it is not inlined.

Usage:  python3 bin/bundle.py
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = ['config', 'techniques', 'practices', 'library', 'games', 'podcasts']
LIMIT = 1_500_000


def read(*parts):
    with open(os.path.join(ROOT, *parts), encoding='utf-8') as fh:
        return fh.read()


def slice_between(text, start, end, label):
    a = text.find(start)
    b = text.find(end)
    if a < 0 or b < 0:
        sys.exit('bundle.py: missing %s markers in index.html' % label)
    return text[a + len(start):b]


def main():
    html = read('index.html')
    css = read('styles.css')
    js = read('app.js')

    head = slice_between(html, '<!--BUNDLE:HEAD-START-->', '<!--BUNDLE:HEAD-END-->', 'HEAD')
    body = slice_between(html, '<!--BUNDLE:BODY-START-->', '<!--BUNDLE:BODY-END-->', 'BODY')

    # the fonts link survives; the local stylesheet link is replaced by inline CSS
    fonts = ''
    for line in head.splitlines():
        if 'fonts.googleapis.com' in line:
            fonts = line.strip()
    if not fonts:
        sys.exit('bundle.py: Google Fonts link not found in the HEAD block')

    # drop the local <script src="app.js"> — it is inlined after the markup
    body = re.sub(r'<script src="app\.js"></script>', '', body).strip()

    content = {}
    for name in CONTENT:
        path = os.path.join(ROOT, 'content', name + '.json')
        if os.path.exists(path):
            with open(path, encoding='utf-8') as fh:
                content[name] = json.load(fh)
        else:
            content[name] = None
            print('  ! missing content/%s.json — bundled as null' % name)

    data = json.dumps(content, ensure_ascii=False, separators=(',', ':'))
    # never let a literal </script> inside data close the tag
    data = data.replace('</', '<\\/')

    out = []
    out.append('<title>MKK</title>')
    out.append(fonts)
    out.append('<style>\n' + css.strip() + '\n</style>')
    out.append(body)
    out.append('<script>window.MKK_CONTENT=' + data + ';</script>')
    out.append('<script>\n' + js.strip() + '\n</script>')
    artifact = '\n'.join(out) + '\n'

    # <header>/<headers> are fine; only real document-skeleton tags are forbidden
    forbidden = re.compile(r'<!doctype|</?(?:html|head|body)(?:\s|>|/>)', re.I)
    hit = forbidden.search(artifact)
    if hit:
        sys.exit('bundle.py: forbidden tag %r ended up in the artifact' % hit.group(0))
    if 'serviceWorker' in artifact:
        sys.exit('bundle.py: service worker registration leaked into the artifact')

    os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
    dest = os.path.join(ROOT, 'dist', 'artifact.html')
    with open(dest, 'w', encoding='utf-8') as fh:
        fh.write(artifact)

    size = os.path.getsize(dest)
    print('dist/artifact.html  %.1f KB  (limit %d KB)' % (size / 1024, LIMIT // 1024))
    print('  css %.1f KB · js %.1f KB · content %.1f KB'
          % (len(css) / 1024, len(js) / 1024, len(data) / 1024))
    if size > LIMIT:
        sys.exit('bundle.py: artifact is over 1.5 MB')
    print('OK')


if __name__ == '__main__':
    main()
