import re

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.read().split('\n')

for i, line in enumerate(lines):
    if re.search(r'GVCN|Giáo viên', line, re.I):
        start = max(0, i-5)
        end = min(len(lines), i+5)
        print("\n".join(lines[start:end]).encode('utf-8', errors='ignore').decode('utf-8'))
        break
