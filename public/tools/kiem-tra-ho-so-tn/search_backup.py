import os
import re

backup_dir = 'BACK UP'
for root, dirs, files in os.walk(backup_dir):
    for f in files:
        if f.endswith('.html'):
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
                content = file.read()
                if re.search(r'GVCN|giáo viên|Giáo viên|biên bản', content, re.IGNORECASE):
                    print(f"Found in {f}")
