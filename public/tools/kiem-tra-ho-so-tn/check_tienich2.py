import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

m = re.search(r'(<div class="nav-group-label[^>]*>[\s\S]*?<i data-lucide="layers"[\s\S]*?</div>\s*<div class="nav-sub-items"[\s\S]*?</div>)', text)
if m:
    print(m.group(1).encode('ascii', 'ignore').decode('ascii'))
else:
    print("Not found")
