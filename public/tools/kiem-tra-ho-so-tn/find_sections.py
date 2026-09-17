import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

sections = re.findall(r'<section id="view-[^"]+"', text)
for s in sections:
    print(s)
