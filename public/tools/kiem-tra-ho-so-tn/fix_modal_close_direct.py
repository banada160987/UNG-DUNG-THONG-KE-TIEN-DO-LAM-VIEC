import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# I want to add </div></div> after the <input type="file" ...> tag related to the modal
# The last part of the modal is:
# <button class="btn btn-outline flex-1" onclick="exportIndependentProctorExcel()" style="height: 38px;">
#   <i data-lucide="download"></i> Xuất Excel
# </button>
# </div>
# <input type="file" id="indep-room-excel" accept=".xlsx, .xls" hidden onchange="importRoomsAndAssignProctors(event)">
# </div>
# 
# Wait, let's just find the `exportIndependentProctorExcel` button and the input tag!
pattern = r'(onclick="exportIndependentProctorExcel\(\)"[^>]*>[\s\S]*?</button>\s*</div>\s*<input[^>]+hidden[^>]+importRoomsAndAssignProctors\(event\)"[^>]*>\s*</div>)'

if re.search(pattern, text):
    text = re.sub(pattern, r'\1\n            </div>\n        </div>', text)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Fixed modal closing!")
else:
    print("Pattern not found!")

