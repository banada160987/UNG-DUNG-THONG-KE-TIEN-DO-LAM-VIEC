import re

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.read().split('\n')

start = -1
end = -1
for i, line in enumerate(lines):
    if 'id="indep-session-count"' in line:
        start = i
        break

if start != -1:
    # Look for the end of the modal content
    # Let's print 50 lines from start to see what we need to wrap
    print("\n".join(lines[max(0, start-10):start+60]))
