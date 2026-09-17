import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('btn-tab-proctor-board')
if idx != -1:
    with open('find_group.txt', 'w', encoding='utf-8') as out:
        out.write(text[max(0, idx-200):min(len(text), idx+200)])
