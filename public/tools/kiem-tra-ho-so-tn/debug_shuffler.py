import re
with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.read().split('\n')
for i, line in enumerate(lines):
    if 'view-exam-shuffler' in line:
        start = max(0, i-20)
        end = min(len(lines), i+20)
        with open('debug_shuffler.txt', 'w', encoding='utf-8') as out:
            out.write('\n'.join(lines[start:end]))
        break
