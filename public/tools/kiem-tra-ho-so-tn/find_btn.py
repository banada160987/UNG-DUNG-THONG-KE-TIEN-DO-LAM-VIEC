import re

with open(r'BACK UP\main - Copy_Ver02 - Copy.html', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

buttons = re.findall(r'<button[^>]*>[\s\S]*?</button>', text)
res = []
for b in buttons:
    if 'Biên bản' in b or 'GVCN' in b or 'giáo viên' in b.lower():
        res.append(b)

with open('buttons.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(res))
