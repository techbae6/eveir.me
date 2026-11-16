#!/usr/bin/env python3
"""Regenerate the social site (selam/) from the professional pages.

Run from the site folder after editing index.html, work.html or graphics.html:
    python3 tools/build-selam.py
"""
import os, re

PAGES = ["index.html", "work.html", "graphics.html"]

def social(s):
    # name: professional pages say Eve Uygur, the social site says Eve Irem
    s = s.replace("<span>eve</span><span>uygur</span>", "<span>eve</span><span>irem</span>")
    s = s.replace("Eve Uygur", "Eve Irem").replace("eve uygur", "eve irem")
    # shared files live one folder up
    s = re.sub(r'(href|src)="((?:style\.css|[a-z]+\.js)(?:\?v=\d+)?)"', r'\1="../\2"', s)
    s = re.sub(r'(href|src)="(assets/[^"]+)"', r'\1="../\2"', s)
    # tell the data files which side this is; keep it out of search engines
    s = s.replace('<meta name="viewport"',
                  '<meta name="robots" content="noindex, nofollow">\n  <script>window.SIDE = "social"; window.BASE = "../";</script>\n  <meta name="viewport"', 1)
    # professional-only bits (Duolingo etc.) are wrapped in <!--pro--> ... <!--/pro-->
    s = re.sub(r"<!--pro-->.*?<!--/pro-->", "", s, flags=re.S)
    s = s.replace("Creative Technology Manager at Duolingo. Technical art and art direction, New York.",
                  "creative technology, technical art and art direction. New York.")
    # social-only touches
    s = s.replace('data-shape="star"', 'data-shape="hat"').replace('class="lowpoly lp-star"', 'class="lowpoly lp-star lp-hat"')
    return s

os.makedirs("selam", exist_ok=True)
for p in PAGES:
    with open(p) as f:
        out = social(f.read())
    with open(os.path.join("selam", p), "w") as f:
        f.write(out)
print("selam/ rebuilt:", ", ".join(PAGES))
