import re
import sys

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# The missing opening part for the modal
modal_opening = """        <div id="independent-proctor-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; justify-content:center; align-items:center;">
            <div style="background:white; padding:20px; border-radius:12px; max-width:800px; width:90%; max-height:90vh; overflow-y:auto; box-shadow: 0 10px 25px rgba(0,0,0,0.2); position:relative;">
                <button onclick="closeIndependentProctorModal()" style="position:absolute; top:15px; right:15px; background:none; border:none; cursor:pointer; color:#64748b;"><i data-lucide="x"></i></button>
                <div style="margin-bottom: 20px; text-align: center;">
                    <h2 style="font-size: 20px; font-weight: 800; color: var(--primary); margin-bottom: 5px;">PHÂN CÔNG GIÁM THỊ NHANH</h2>
                    <p style="font-size: 13px; color: var(--text-muted);">Phân công giám thị độc lập với hệ thống phòng thi chính</p>
                </div>
                
                <div style="display:flex; gap:20px; margin-bottom:20px;">
                    <div style="flex:1;">
                        <h4 style="margin-bottom: 10px; color: var(--primary); font-size:14px">LỰA CHỌN 1: TẠO PHÒNG TỰ ĐỘNG</h4>
                        <div style="display:flex; gap:10px; margin-bottom:15px">
                            <div style="flex:1">
                                <label style="font-size:10px; color:var(--text-muted)">Số phòng cần tạo</label>
                                <input type="number" id="indep-room-count" class="form-control" value="10" style="height:32px">
                            </div>
                            <div>
                                <label style="font-size:10px; color:var(--text-muted)">Số buổi thi</label>
"""

# Let's replace the broken part where it starts:
broken_pattern = r'(\s*<!-- BEHAVIOR INCIDENT VIEW -->\s*<div id="view-behavior-incident" class="section-view">\s*<!-- Rendered by behavior_incident\.js -->\s*</div>)(\s*<select id="indep-session-count")'

if re.search(broken_pattern, text):
    text = re.sub(broken_pattern, r'\1\n' + modal_opening + r'\2', text)
    
    # We also need to add closing tags for the modal!
    # Where does the modal end? It ends before `<div id="custom-alert-overlay">` or `</main>` or `</script>`
    # The modal content has: `exportIndependentProctorExcel()` button, etc.
    # Let's find: `CHỌN FILE EXCEL PHÒNG</button>` and the closing divs.
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Fixed modal opening!")
else:
    print("Pattern not found!")

