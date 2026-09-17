import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

sections = re.findall(r'<section id="view-([^"]+)"', text)
buttons = re.findall(r"switchTab\('([^']+)'\)", text)
buttons += re.findall(r'window\.open\([^)]*\)', text) # For pro-report

missing = [s for s in sections if s not in buttons and s != 'pro-report']
print("Missing buttons for sections:", missing)
