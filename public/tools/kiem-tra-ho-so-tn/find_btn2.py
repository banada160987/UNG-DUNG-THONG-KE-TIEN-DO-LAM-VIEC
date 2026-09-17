import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

buttons = re.findall(r'<button[^>]*>[\s\S]*?</button>', text)
res = []
for b in buttons:
    if 'Biên bản' in b or 'GVCN' in b or 'giáo viên' in b.lower():
        res.append(b.strip())

with open('current_buttons_res.txt', 'w', encoding='utf-8') as f:
    f.write("\n\n---\n\n".join(res))
