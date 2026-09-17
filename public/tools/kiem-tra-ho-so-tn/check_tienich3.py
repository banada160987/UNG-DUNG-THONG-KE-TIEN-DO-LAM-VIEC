import re

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.read().split('\n')

for i, line in enumerate(lines):
    if 'Tiện ích hỗ trợ' in line or 'Ti?n ch h? tr?' in line:
        start = max(0, i-5)
        end = min(len(lines), i+30)
        print("\n".join(lines[start:end]).encode('utf-8', errors='ignore').decode('utf-8'))
        break
