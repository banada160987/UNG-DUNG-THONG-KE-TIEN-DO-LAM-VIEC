import re

with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# 1. Remove SmartTest button
btn_pattern = r'\s*<button id="btn-tab-smarttest"[^>]*>[\s\S]*?</button>\n'
html = re.sub(btn_pattern, '\n', html)

# 2. Remove SmartTest section
sec_pattern = r'\s*<!-- SECTION: SMARTTEST FORMATTER -->\s*<section id="view-smarttest-formatter"[^>]*>[\s\S]*?</section>\n'
html = re.sub(sec_pattern, '\n', html)

# 3. Add scripts before </body> if they are missing
scripts_to_inject = """
    <script src="proctor_store.js?v=2026051605"></script>
    <script src="proctor_rules.js?v=2026051605"></script>
    <script src="proctor_engine.js?v=2026051605"></script>
    <script src="proctor_pro.js?v=2026051605"></script>
    <script src="exam_config.js?v=2026051605"></script>
    <script src="exam_shuffler.js"></script>
    <script src="validation_engine.js"></script>
    <script src="export_service.js"></script>
    <script src="app.js?v=2026051901"></script>
    <script src="photorename.js?v=2026051605"></script>
    <script src="zalo_hub.js?v=2026051605"></script>
    <script src="decree30_editor.js"></script>
"""

# Only inject if app.js is missing
if "src=\"app.js" not in html:
    html = html.replace("</body>", scripts_to_inject + "\n</body>")

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Restored index.html!")
