import re

with open('index.html', 'r', encoding='utf-8') as f:
    s = f.read()

m = re.search(r'<section id="view-exam-shuffler"[^>]*>([\s\S]*?)</section>', s)
if m:
    print(m.group(1)[:500])
else:
    print("Not found")
