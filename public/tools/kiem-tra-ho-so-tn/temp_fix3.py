import sys
with open('decree30_editor.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Add canvases to getTabHTML
old_checkbox = """                            <div class="mt-6 space-y-1.5 border-t pt-4">
                                <label class="checkbox-item" style="color: #2563eb; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="nd30-use-signature" onchange="Decree30Editor.generatePreview()">
                                    <span>Chèn chữ ký / Con dấu (Minh họa)</span>
                                </label>
                            </div>"""

new_checkbox = """                            <div class="mt-6 space-y-4 border-t pt-4">
                                <div class="flex items-center justify-between">
                                    <label class="checkbox-item" style="color: #2563eb; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                        <input type="checkbox" id="nd30-use-signature" checked onchange="Decree30Editor.toggleSignaturePads()">
                                        <span>Sử dụng chữ ký số (Canvas Signature Pads)</span>
                                    </label>
                                    <button onclick="Decree30Editor.clearSignatures()" class="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer flex items-center gap-1 text-[10px] font-bold">
                                        <i data-lucide="eraser" style="width:12px"></i> XÓA CHỮ KÝ
                                    </button>
                                </div>
                                <div id="nd30-signature-pads" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div class="space-y-2">
                                        <div class="text-[10px] font-bold text-slate-500">NGƯỜI KÝ 1 (BÊN A / HIỆU TRƯỞNG)</div>
                                        <div class="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center" style="height:120px; position:relative;">
                                            <canvas id="nd30-pad-1" class="w-full h-full cursor-crosshair block" style="touch-action: none; background:#fafafa; position:absolute; inset:0;"></canvas>
                                            <div class="pointer-events-none text-slate-200 font-sans text-[11px] uppercase tracking-widest absolute inset-0 flex items-center justify-center">Ký vào đây</div>
                                        </div>
                                    </div>
                                    <div class="space-y-2" id="nd30-pad-2-container">
                                        <div class="text-[10px] font-bold text-slate-500">NGƯỜI KÝ 2 (BÊN B / ĐỐI TÁC)</div>
                                        <div class="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center" style="height:120px; position:relative;">
                                            <canvas id="nd30-pad-2" class="w-full h-full cursor-crosshair block" style="touch-action: none; background:#fafafa; position:absolute; inset:0;"></canvas>
                                            <div class="pointer-events-none text-slate-200 font-sans text-[11px] uppercase tracking-widest absolute inset-0 flex items-center justify-center">Ký vào đây</div>
                                        </div>
                                    </div>
                                </div>
                            </div>"""

if old_checkbox in text:
    text = text.replace(old_checkbox, new_checkbox)

# Initialize canvases
init_old = """            // Set initial state
            updateFormVisibility();
            generatePreview();
        }
    };"""

init_new = """            // Set initial state
            updateFormVisibility();
            initPads();
            generatePreview();
        }
    };

    let pads = { pad1: null, pad2: null };

    const initPads = () => {
        pads.pad1 = createSignaturePad('nd30-pad-1');
        pads.pad2 = createSignaturePad('nd30-pad-2');
        setTimeout(() => {
            if (pads.pad1) pads.pad1.resize();
            if (pads.pad2) pads.pad2.resize();
        }, 100);
    };

    const clearSignatures = () => {
        if (pads.pad1) pads.pad1.clear();
        if (pads.pad2) pads.pad2.clear();
        generatePreview();
    };

    const toggleSignaturePads = () => {
        const isEnabled = document.getElementById('nd30-use-signature').checked;
        const container = document.getElementById('nd30-signature-pads');
        if (container) container.style.display = isEnabled ? 'grid' : 'none';
        generatePreview();
    };

    // Vector Signature Canvas Logic
    function createSignaturePad(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        let drawing = false;

        function resizeCanvas() {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
        resizeCanvas();

        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return { x: clientX - rect.left, y: clientY - rect.top };
        }

        function startDraw(e) { drawing = true; const pos = getPos(e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); e.preventDefault(); }
        function draw(e) { if (!drawing) return; const pos = getPos(e); ctx.lineTo(pos.x, pos.y); ctx.stroke(); e.preventDefault(); generatePreview(); }
        function stopDraw() { drawing = false; generatePreview(); }

        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDraw);
        canvas.addEventListener('mouseleave', stopDraw);
        canvas.addEventListener('touchstart', startDraw, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', stopDraw);

        return {
            clear: () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; },
            getDataURL: () => { return canvas.toDataURL(); },
            resize: resizeCanvas
        };
    }"""

if init_old in text:
    text = text.replace(init_old, init_new)

# Update generatePreview to use canvas images
gen_old = """        // Phần Footer chuẩn (Nơi nhận, Chữ ký)
        let signatureHtml = '';
        if (useSignature) {
            signatureHtml = `
                <span style="font-style: italic;">(Ký, ghi rõ họ tên và đóng dấu)</span>
                <div style="position: relative; height: 100px;">
                    <!-- Giả lập chữ ký số/con dấu đỏ -->
                    <div style="position: absolute; top: -10px; right: 20px; width: 120px; height: 120px; border-radius: 50%; border: 3px solid #dc2626; color: #dc2626; display: flex; align-items: center; justify-content: center; transform: rotate(-15deg); opacity: 0.7;">
                        <div style="text-align: center; font-size: 14px; font-weight: bold; font-family: 'Times New Roman', serif;">
                            TRƯỜNG<br>THPT<br>...
                        </div>
                    </div>
                    <div style="position: absolute; top: 20px; right: 30px; width: 160px; text-align: center; color: #2563eb; font-family: 'Brush Script MT', cursive; font-size: 40px; transform: rotate(-5deg);">
                        Đã ký
                    </div>
                </div>
            `;
        } else {
            signatureHtml = `
                <span style="font-style: italic;">(Ký, ghi rõ họ tên và đóng dấu)</span>
                <div style="height: 100px;"></div>
            `;
        }"""

gen_new = """        // Phần Footer chuẩn (Nơi nhận, Chữ ký)
        let signatureHtml = '';
        let sig1 = (useSignature && pads.pad1) ? pads.pad1.getDataURL() : null;
        let sig2 = (useSignature && pads.pad2) ? pads.pad2.getDataURL() : null;
        
        let sigImage1 = sig1 ? `<img src="${sig1}" style="max-height: 80px; max-width: 100%; object-fit: contain; position: relative; z-index: 10; border: none; background: transparent;">` : '';
        let sigImage2 = sig2 ? `<img src="${sig2}" style="max-height: 80px; max-width: 100%; object-fit: contain; position: relative; z-index: 10; border: none; background: transparent;">` : '';

        // Check if canvas is basically blank
        if (sig1 && sig1.length < 5000) sigImage1 = '';
        if (sig2 && sig2.length < 5000) sigImage2 = '';

        if (isContractType) {
            signatureHtml = `
                <table width="100%" style="margin-top: 30px;">
                    <tr>
                        <td width="50%" align="center" valign="top">
                            <b>ĐẠI DIỆN BÊN A</b><br>
                            <span style="font-style: italic;">(Ký, ghi rõ họ tên)</span>
                            <div style="height: 100px; display: flex; align-items: center; justify-content: center;">${sigImage1}</div>
                        </td>
                        <td width="50%" align="center" valign="top">
                            <b>ĐẠI DIỆN BÊN B</b><br>
                            <span style="font-style: italic;">(Ký, ghi rõ họ tên)</span>
                            <div style="height: 100px; display: flex; align-items: center; justify-content: center;">${sigImage2}</div>
                        </td>
                    </tr>
                </table>
            `;
        } else {
            signatureHtml = `
                <span style="font-style: italic;">(Ký, ghi rõ họ tên và đóng dấu)</span>
                <div style="position: relative; height: 100px; display: flex; align-items: center; justify-content: center;">
                    ${sigImage1}
                </div>
            `;
        }"""

if gen_old in text:
    text = text.replace(gen_old, gen_new)

# Modify updateFormVisibility to show/hide pad 2
vis_old = """        if (groupSend.includes(currentMode)) targetField = 'nd30-fields-generic_send';
        if (groupContract.includes(currentMode)) targetField = 'nd30-fields-contract';"""

vis_new = """        if (groupSend.includes(currentMode)) targetField = 'nd30-fields-generic_send';
        if (groupContract.includes(currentMode)) targetField = 'nd30-fields-contract';
        
        // Show/hide second signature pad
        const pad2Container = document.getElementById('nd30-pad-2-container');
        if (pad2Container) {
            if (groupContract.includes(currentMode) || currentMode === 'bien_ban' || currentMode === 'giay_uy_quyen') {
                pad2Container.style.display = 'block';
            } else {
                pad2Container.style.display = 'none';
            }
        }"""

if vis_old in text:
    text = text.replace(vis_old, vis_new)

# Export functions globally
export_old = """    return {
        init,
        updateFormVisibility,
        generatePreview,
        printA4,
        exportWord
    };"""

export_new = """    return {
        init,
        updateFormVisibility,
        generatePreview,
        printA4,
        exportWord,
        clearSignatures,
        toggleSignaturePads
    };"""

if export_old in text:
    text = text.replace(export_old, export_new)


with open('decree30_editor.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("Replaced decree30_editor.js")
