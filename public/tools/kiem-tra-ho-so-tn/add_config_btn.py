import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# I will find the decree30 button and insert the config button right after it.
decree30_btn = """            <button id="btn-tab-decree30" class="nav-item" onclick="switchTab('decree30-editor')">
                <i data-lucide="file-text" style="width:18px; color: #f59e0b;"></i> <span
                    style="font-weight: 700;">Soạn thảo Nghị định 30</span>
            </button>"""

config_btn = """
            <button id="btn-tab-exam-config" class="nav-item" onclick="switchTab('exam-config')">
                <i data-lucide="settings" style="width:18px; color: #1e293b;"></i> <span
                    style="font-weight: 700;">Cấu hình Kỳ thi</span>
            </button>"""

if decree30_btn in text:
    text = text.replace(decree30_btn, decree30_btn + config_btn)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Fixed Cấu hình Kỳ thi button!")
else:
    print("decree30 button not found!")
