import sys
with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

old_block = """                                    <h4 class="text-xs font-black text-slate-700 m-0 uppercase flex items-center gap-1.5">
                                        <i data-lucide="pen-tool" class="text-amber-500" style="width:16px"></i> Ký xác nhận trực tiếp (Canvas Signature Pads)
                                    </h4>
                                    <button onclick="clearAllIncidentSignatures()" class="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer flex items-center gap-1 text-[10px] font-bold">
                                        <i data-lucide="eraser" style="width:12px"></i> XÓA TOÀN BỘ CHỮ KÝ
                                    </button>
                                </div>

                                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">"""

new_block = """                                    <h4 class="text-xs font-black text-slate-700 m-0 uppercase flex items-center gap-1.5">
                                        <i data-lucide="pen-tool" class="text-amber-500" style="width:16px"></i> Ký xác nhận trực tiếp (Canvas Signature Pads)
                                    </h4>
                                    <div class="flex items-center gap-4">
                                        <label class="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition">
                                            <input type="checkbox" id="use-digital-signature" class="w-3.5 h-3.5" checked onchange="toggleDigitalSignature()">
                                            Sử dụng chữ ký số
                                        </label>
                                        <button onclick="clearAllIncidentSignatures()" class="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer flex items-center gap-1 text-[10px] font-bold">
                                            <i data-lucide="eraser" style="width:12px"></i> XÓA TOÀN BỘ CHỮ KÝ
                                        </button>
                                    </div>
                                </div>

                                <div id="signature-pads-container" class="grid grid-cols-1 sm:grid-cols-3 gap-4">"""

if old_block in text:
    text = text.replace(old_block, new_block)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Replaced index.html")
else:
    print("Could not find the block in index.html")
