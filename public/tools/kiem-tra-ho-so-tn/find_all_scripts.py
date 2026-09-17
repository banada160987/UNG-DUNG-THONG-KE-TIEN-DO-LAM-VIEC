import json
import re
import io

log_path = r"C:\Users\Admin\.gemini\antigravity\brain\a39b6f07-1831-43bb-a392-9944716976cb\.system_generated\logs\transcript.jsonl"
data = []
with open(log_path, "r", encoding="utf-8") as f:
    for line in f:
        data.append(json.loads(line))

scripts = []
for step in data:
    content = str(step.get("content", ""))
    if "<script src=" in content and "app.js" in content:
        # Extract all <script src="..."> lines
        found_scripts = re.findall(r'<script src=".*\.js(?:[^"]*)"></script>', content)
        if len(found_scripts) > 10:
            scripts = found_scripts
            break

if scripts:
    with open("scripts_to_add.txt", "w", encoding="utf-8") as f:
        for s in scripts:
            f.write(s + "\n")
    print("Found", len(scripts), "scripts!")
else:
    print("Could not find scripts.")
