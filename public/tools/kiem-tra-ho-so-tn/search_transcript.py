import json
import re
import os

log_path = r"C:\Users\Admin\.gemini\antigravity\brain\a39b6f07-1831-43bb-a392-9944716976cb\.system_generated\logs\transcript.jsonl"
found = False

with open(log_path, "r", encoding="utf-8") as f:
    for line in f:
        data = json.loads(line)
        content = data.get("content", "")
        # Look for index.html content in the first tool calls or system responses
        if "Biên bản GVCN" in content or "GVCN" in content or "biên bản giáo viên" in content.lower():
            print(f"Found in step {data.get('step_index')}")
            found = True
            
        tool_calls = data.get("tool_calls", [])
        for call in tool_calls:
            args = call.get("args", {})
            for k, v in args.items():
                if isinstance(v, str) and ("Biên bản" in v or "GVCN" in v):
                    print(f"Found in tool call step {data.get('step_index')}")
                    found = True

if not found:
    print("Not found in transcript!")
