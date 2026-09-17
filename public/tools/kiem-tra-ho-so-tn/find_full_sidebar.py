import json

log_path = r"C:\Users\Admin\.gemini\antigravity\brain\a39b6f07-1831-43bb-a392-9944716976cb\.system_generated\logs\transcript.jsonl"
data = []
with open(log_path, "r", encoding="utf-8") as f:
    for line in f:
        data.append(json.loads(line))

for step in data:
    if step.get("type") == "TOOL_OUTPUT":
        content = str(step.get("content", ""))
        # find the original full index.html before we did the sidebar replace
        if "btn-tab-splitname" in content and "btn-tab-exam-shuffler" in content and "btn-tab-photorename" in content:
            with open("original_full_sidebar.html", "w", encoding="utf-8") as f:
                f.write(content)
            print("Found original_full_sidebar.html")
            break
