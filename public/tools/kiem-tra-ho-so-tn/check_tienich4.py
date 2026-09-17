import re

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.read().split('\n')

result = ""
for i, line in enumerate(lines):
    if 'Tiện ích hỗ trợ' in line or 'Ti?n ch h? tr?' in line:
        start = max(0, i-2)
        end = min(len(lines), i+35)
        result = "\n".join(lines[start:end])
        break

with open('result.txt', 'w', encoding='utf-8') as f:
    f.write(result)
