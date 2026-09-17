import re

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.read().split('\n')

results = []
for i, line in enumerate(lines):
    if re.search(r'GVCN|Giáo viên', line, re.I):
        start = max(0, i-2)
        end = min(len(lines), i+3)
        results.append(f"--- Match at line {i+1} ---")
        results.append("\n".join(lines[start:end]))

with open('find_gvcn_result.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(results))
