import sys

with open('exam_incidents.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Add toggleDigitalSignature function
toggle_func = """
    // Toggle digital signature usage
    function toggleDigitalSignature() {
        const isEnabled = document.getElementById('use-digital-signature').checked;
        const container = document.getElementById('signature-pads-container');
        if (container) {
            container.style.display = isEnabled ? 'grid' : 'none';
        }
        if (!isEnabled) {
            clearAllIncidentSignatures();
        }
    }
"""

if "function toggleDigitalSignature()" not in text:
    text = text.replace('    // Student Autocomplete Autocompletion Suggestion', toggle_func + '\n    // Student Autocomplete Autocompletion Suggestion')
    text = text.replace('window.clearAllIncidentSignatures = clearAllIncidentSignatures;', 'window.clearAllIncidentSignatures = clearAllIncidentSignatures;\n    window.toggleDigitalSignature = toggleDigitalSignature;')

# Modify saveExamIncident to respect the checkbox
save_old = """            timestamp: new Date().toISOString(),
            sigStudent: pads.student ? pads.student.getDataURL() : null,
            sigProctor: pads.proctor ? pads.proctor.getDataURL() : null,
            sigChairman: pads.chairman ? pads.chairman.getDataURL() : null
        };"""

save_new = """            timestamp: new Date().toISOString(),
            sigStudent: (pads.student && document.getElementById('use-digital-signature').checked) ? pads.student.getDataURL() : null,
            sigProctor: (pads.proctor && document.getElementById('use-digital-signature').checked) ? pads.proctor.getDataURL() : null,
            sigChairman: (pads.chairman && document.getElementById('use-digital-signature').checked) ? pads.chairman.getDataURL() : null
        };"""

text = text.replace(save_old, save_new)

with open('exam_incidents.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("Replaced exam_incidents.js")
