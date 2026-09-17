import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

board_btn = """            <button id="btn-tab-proctor-board" class="nav-item" onclick="switchTab('proctor-board')">
                <i data-lucide="calendar-check" style="width:18px; color: #f97316;"></i> <span>Bảng phân công GT</span>
            </button>"""

report_btn = """
            <button id="btn-tab-pro-report" class="nav-item" onclick="switchTab('pro-report')">
                <i data-lucide="file-signature" style="width:18px; color: #8b5cf6;"></i> <span style="font-weight: 700;">Biên bản GVCN & Giám thị</span>
            </button>"""

if board_btn in text:
    text = text.replace(board_btn, board_btn + report_btn)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Fixed pro-report button!")
else:
    print("board_btn not found!")
