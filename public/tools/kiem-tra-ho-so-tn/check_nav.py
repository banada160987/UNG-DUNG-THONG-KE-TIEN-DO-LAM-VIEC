import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

m = re.search(r'<nav class="sidebar-nav">([\s\S]*?)</nav>', text)
if m:
    print(m.group(1)[:500].encode('ascii', 'ignore').decode('ascii'))
else:
    print("Nav not found!")
