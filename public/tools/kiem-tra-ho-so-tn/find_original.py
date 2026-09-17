import json

log_path = r"C:\Users\Admin\.gemini\antigravity\brain\a39b6f07-1831-43bb-a392-9944716976cb\.system_generated\logs\transcript.jsonl"
data = []
with open(log_path, "r", encoding="utf-8") as f:
    for line in f:
        data.append(json.loads(line))

original_html = ""
for step in data:
    if step.get("type") == "TOOL_OUTPUT":
        content = str(step.get("content", ""))
        # We need to find the step that viewed the whole index.html or at least the sidebar
        if "<!-- Sidebar -->" in content and "btn-tab-splitname" in content:
            original_html = content
            break

if original_html:
    with open("original_sidebar.txt", "w", encoding="utf-8") as f:
        f.write(original_html)
    print("Found original HTML with splitname! Saved to original_sidebar.txt")
else:
    print("Not found in transcript.")
