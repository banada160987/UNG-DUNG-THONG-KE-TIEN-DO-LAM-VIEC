import json

log_path = r"C:\Users\Admin\.gemini\antigravity\brain\a39b6f07-1831-43bb-a392-9944716976cb\.system_generated\logs\transcript.jsonl"
with open(log_path, "r", encoding="utf-8") as f:
    for line in f:
        data = json.loads(line)
        if data.get("step_index") in [88, 125]:
            print(f"--- STEP {data.get('step_index')} ---")
            tool_calls = data.get("tool_calls", [])
            for call in tool_calls:
                args = call.get("args", {})
                for k, v in args.items():
                    if isinstance(v, str) and ("GVCN" in v or "Biên bản" in v):
                        # print the string around the match
                        idx = v.find("GVCN")
                        if idx == -1: idx = v.find("Biên bản")
                        print(v[max(0, idx-50):min(len(v), idx+50)])
