import re
import sys

with open("index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Total lines:", len(lines))

# Find indices of "<!-- Sidebar -->"
sidebar_indices = [i for i, line in enumerate(lines) if "<!-- Sidebar -->" in line]
print("Sidebar indices:", sidebar_indices)

if len(sidebar_indices) >= 2:
    start_idx = sidebar_indices[1]
    
    end_idx = -1
    for i in range(start_idx, len(lines)):
        if "</aside>" in lines[i]:
            end_idx = i
            break
            
    print("Deleting from", start_idx, "to", end_idx)
    
    buttons = """            <button id="btn-tab-seating-chart" class="nav-item" onclick="switchTab('seating-chart')">
                <i data-lucide="grid" style="width:18px; color: #3b82f6;"></i> <span style="font-weight: 700;">Sơ đồ Chỗ ngồi kéo thả</span>
            </button>
            </div>
<div class="nav-group-label nav-group-header" onclick="toggleNavGroup(this)" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;" style="color: #0ea5e9;"><i data-lucide="wrench" style="width:16px"></i> Tiện ích hỗ trợ<i data-lucide="chevron-down" class="nav-chevron transition-transform duration-300" style="width:16px;"></i></div>
<div class="nav-sub-items" style="display: none; overflow: hidden;">
            <button id="btn-tab-exam-shuffler" class="nav-item" onclick="switchTab('exam-shuffler')">
                <i data-lucide="shuffle" style="width:18px; color: #ef4444;"></i> <span
                    style="font-weight: 700;">Trộn Đề Thi (Word)</span>
            </button>
            <button id="btn-tab-smarttest" class="nav-item" onclick="switchTab('smarttest-formatter')">
                <i data-lucide="file-check-2" style="width:18px; color: #10b981;"></i> <span
                    style="font-weight: 700;">Chuẩn hóa Đề (SmartTest)</span>
            </button>
            <button id="btn-tab-decree30" class="nav-item" onclick="switchTab('decree30-editor')">
                <i data-lucide="file-text" style="width:18px; color: #f59e0b;"></i> <span
                    style="font-weight: 700;">Soạn thảo Nghị định 30</span>
            </button>
            </div>
"""
    # Delete the duplicate sidebar
    del lines[start_idx:end_idx+1]
    
    # Insert the missing buttons (from the missing nav-group) right where we deleted it
    # Because when it was deleted, it also took away "Tiện ích hỗ trợ" block.
    # Wait, did it? In the original file, "Tiện ích hỗ trợ" is right after "Dự phóng Tốt nghiệp".
    lines.insert(start_idx, buttons)
    
    with open("index.html", "w", encoding="utf-8") as f:
        f.writelines(lines)
    print("Fixed!")
else:
    print("No duplicate sidebar found.")
