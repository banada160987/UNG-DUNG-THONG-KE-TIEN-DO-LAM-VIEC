import sys

with open('decree30_editor.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the export block
export_old = """    return {
        init,
        getTabHTML,
        updateFormVisibility,
        generatePreview,
        printA4,
        exportWord
    };"""

export_new = """    return {
        init,
        getTabHTML,
        updateFormVisibility,
        generatePreview,
        printA4,
        exportWord,
        clearSignatures,
        toggleSignaturePads
    };"""

if export_old in text:
    text = text.replace(export_old, export_new)
    print("Replaced export block")
else:
    print("Could not find export block")

# Initial call to toggleSignaturePads to hide it if unchecked initially
# Let's see if we can add a toggleSignaturePads() call inside initPads
initpads_old = """    const initPads = () => {
        pads.pad1 = createSignaturePad('nd30-pad-1');
        pads.pad2 = createSignaturePad('nd30-pad-2');
        setTimeout(() => {
            if (pads.pad1) pads.pad1.resize();
            if (pads.pad2) pads.pad2.resize();
        }, 100);
    };"""

initpads_new = """    const initPads = () => {
        pads.pad1 = createSignaturePad('nd30-pad-1');
        pads.pad2 = createSignaturePad('nd30-pad-2');
        setTimeout(() => {
            if (pads.pad1) pads.pad1.resize();
            if (pads.pad2) pads.pad2.resize();
            toggleSignaturePads(); // Hide initially if unchecked
        }, 100);
    };"""

if initpads_old in text:
    text = text.replace(initpads_old, initpads_new)
    print("Replaced initPads")
else:
    print("Could not find initPads")

with open('decree30_editor.js', 'w', encoding='utf-8') as f:
    f.write(text)
