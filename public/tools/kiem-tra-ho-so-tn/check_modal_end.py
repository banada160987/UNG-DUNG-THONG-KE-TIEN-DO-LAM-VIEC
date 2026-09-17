import re
import sys

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.read().split('\n')

for i, line in enumerate(lines):
    if 'id="indep-room-excel"' in line:
        start = max(0, i-10)
        end = min(len(lines), i+20)
        print("\n".join(lines[start:end]).encode('utf-8', errors='ignore').decode('utf-8'))
        break
