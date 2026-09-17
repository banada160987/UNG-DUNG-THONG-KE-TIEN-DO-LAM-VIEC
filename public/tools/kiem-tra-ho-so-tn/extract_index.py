import json
import re

log_path = r"C:\Users\Admin\.gemini\antigravity\brain\a39b6f07-1831-43bb-a392-9944716976cb\.system_generated\logs\transcript.jsonl"
data = []
with open(log_path, "r", encoding="utf-8") as f:
    for line in f:
        data.append(json.loads(line))

for step in data:
    if step.get("type") == "TOOL_OUTPUT":
        content = str(step.get("content", ""))
        if "btn-tab-splitname" in content:
            with open("extracted_index.html", "w", encoding="utf-8") as f:
                f.write(content)
            print("Found and saved extracted_index.html")
            break
