import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

buttons = re.findall(r'<button[^>]*switchTab\(\'(?:pro-report|proctor-board)\'\)[^>]*>[\s\S]*?</button>', text)

with open('pro_buttons.txt', 'w', encoding='utf-8') as f:
    f.write("\n\n---\n\n".join(buttons))
