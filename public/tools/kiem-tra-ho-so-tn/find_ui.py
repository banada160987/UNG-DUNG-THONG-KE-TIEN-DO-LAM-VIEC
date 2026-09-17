import re

with open('index.html', 'r', encoding='utf-8') as f:
    s = f.read()

lines = s.split('\n')
for i, line in enumerate(lines):
    if 'LỰA CHỌN 2' in line or 'PHÂN CÔNG' in line.upper():
        print(f"Line {i}: {line[:100].encode('ascii', 'ignore').decode()}")
