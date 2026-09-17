import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's find: CHỌN FILE EXCEL PHÒNG</button>
# Then there should be 2 closing divs: </div></div>
# Let's add the closing tags for our modal wrapper.

pattern = r'(CHỌN FILE EXCEL PHÒNG</button>\s*</div>\s*<input type="file" id="indep-room-excel" accept=".xlsx, .xls" hidden onchange="importRoomsAndAssignProctors\(event\)">\s*</div>\s*</div>)'

if re.search(pattern, text):
    # Add two closing divs for the modal we wrapped.
    text = re.sub(pattern, r'\1\n            </div>\n        </div>', text)
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Fixed modal closing!")
else:
    print("Pattern not found!")

