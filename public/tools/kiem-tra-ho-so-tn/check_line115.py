import re

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.read().split('\n')

with open('check_line115.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(lines[105:135]))
