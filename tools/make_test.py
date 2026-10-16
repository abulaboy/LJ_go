# 產生測試頁：把 three.js 換成 mock.js，並掛出 window.__T 給測試腳本用
# 用法（在 repo 根目錄）：python3 tools/make_test.py
# 產生 tools/test.html 和 tools/check.js（這兩個是暫存檔，不要 commit）
import re, os
here = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(here, '..', 'index.html'), encoding='utf-8').read()
js = re.findall(r'<script>(.*?)</script>', s, re.S)
open(os.path.join(here, 'check.js'), 'w', encoding='utf-8').write('\n;\n'.join(js))
t = s.replace('<script src="https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js"></script>', '<script src="mock.js"></script>')
i = t.rindex('requestAnimationFrame(frame);')
t = t[:i] + 'window.__T={rideTo,goHome,lifts,resetKids,tpTo,VEN,get A(){return A;},hallCab,sit,things,travel,OC};' + t[i:]
open(os.path.join(here, 'test.html'), 'w', encoding='utf-8').write(t)
print('ok')
