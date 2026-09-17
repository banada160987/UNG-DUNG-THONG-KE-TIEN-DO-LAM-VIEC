let crosscheckDataA = [];
let crosscheckDataB = [];
let crosscheckHeadersA = [];
let crosscheckHeadersB = [];

document.addEventListener('DOMContentLoaded', () => {
    const fileAInput = document.getElementById('crosscheck-file-a');
    const fileBInput = document.getElementById('crosscheck-file-b');

    if(fileAInput) {
        fileAInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const data = await readExcel(file);
            crosscheckDataA = data.jsonData;
            crosscheckHeadersA = data.headers;
            
            populateCrosscheckDropdown('crosscheck-key-a', crosscheckHeadersA, 'Khóa Chính File A');
            document.getElementById('crosscheck-key-a').disabled = false;
            checkEnableCrosscheck();
        });
    }

    if(fileBInput) {
        fileBInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const data = await readExcel(file);
            crosscheckDataB = data.jsonData;
            crosscheckHeadersB = data.headers;
            
            populateCrosscheckDropdown('crosscheck-key-b', crosscheckHeadersB, 'Khóa Chính File B');
            document.getElementById('crosscheck-key-b').disabled = false;
            checkEnableCrosscheck();
        });
    }
});

function readExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                
                // Get raw JSON data (header: 1 gets a 2D array, good for extracting headers properly)
                const rows = XLSX.utils.sheet_to_json(firstSheet, {header: 1, defval: ""});
                if(rows.length === 0) return resolve({jsonData: [], headers: []});

                // Assuming row 0 is header. (In real life, might be row 1 or 2, but we stick to row 0 for simplicity)
                // Let's find the first row that has actual data to use as header
                let headerRowIdx = 0;
                for(let i=0; i<rows.length; i++) {
                    if(rows[i].length > 0 && rows[i].some(cell => cell !== "")) {
                        headerRowIdx = i;
                        break;
                    }
                }
                const headers = rows[headerRowIdx].map(h => (h !== undefined && h !== null) ? h.toString().trim() : "");
                
                // Now get data as objects
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, {range: headerRowIdx, defval: ""});
                
                resolve({jsonData, headers: headers.filter(h => h !== "")});
            } catch (err) {
                reject(err);
            }
        };
        reader.readAsArrayBuffer(file);
    });
}

function populateCrosscheckDropdown(selectId, headers, defaultText) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = `<option value="">-- Chọn cột --</option>`;
    headers.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h;
        opt.innerText = h;
        select.appendChild(opt);
    });
}

function checkEnableCrosscheck() {
    const container = document.getElementById('crosscheck-mapping-container');
    const msg = document.getElementById('crosscheck-empty-msg');
    const btn = document.getElementById('btn-run-crosscheck');
    
    if (crosscheckHeadersA.length > 0 && crosscheckHeadersB.length > 0) {
        if(msg) msg.style.display = 'none';
        btn.disabled = false;
        
        // Add one default mapping row if empty
        if (container.querySelectorAll('.mapping-row').length === 0) {
            addCrosscheckMappingRow();
        }
    } else {
        if(msg) msg.style.display = 'block';
        btn.disabled = true;
    }
}

function addCrosscheckMappingRow() {
    const container = document.getElementById('crosscheck-mapping-container');
    if (!container) return;
    
    if(crosscheckHeadersA.length === 0 || crosscheckHeadersB.length === 0) {
        alert("Vui lòng tải cả 2 File Excel trước khi thêm ánh xạ!");
        return;
    }

    const rowId = 'map-' + Date.now();
    const row = document.createElement('div');
    row.className = 'mapping-row';
    row.style = 'display: flex; gap: 10px; align-items: center; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;';
    
    let optionsA = `<option value="">-- Chọn Cột File A --</option>` + crosscheckHeadersA.map(h => `<option value="${h}">${h}</option>`).join('');
    let optionsB = `<option value="">-- Chọn Cột File B --</option>` + crosscheckHeadersB.map(h => `<option value="${h}">${h}</option>`).join('');

    row.innerHTML = `
        <div style="flex: 1;">
            <select class="form-control map-col-a" style="font-size: 13px;">${optionsA}</select>
        </div>
        <div style="color: #94a3b8;"><i data-lucide="arrow-right-left" style="width: 16px;"></i></div>
        <div style="flex: 1;">
            <select class="form-control map-col-b" style="font-size: 13px;">${optionsB}</select>
        </div>
        <button class="btn btn-danger" onclick="this.parentElement.remove()" style="padding: 6px; border-radius: 6px;">
            <i data-lucide="trash-2" style="width: 16px;"></i>
        </button>
    `;
    
    container.appendChild(row);
    if(window.lucide) window.lucide.createIcons();
}

function normalizeValue(val) {
    if (val === undefined || val === null) return "";
    val = val.toString().trim().toLowerCase();
    
    // Try to convert to float if it looks like a number
    // Replace comma with dot for decimals (e.g. 8,5 -> 8.5)
    let numVal = val.replace(',', '.');
    if (!isNaN(parseFloat(numVal)) && isFinite(numVal)) {
        // e.g. "8.0" -> 8, "08" -> 8
        return parseFloat(numVal).toString(); 
    }
    
    return val;
}

function runCrosscheck() {
    const keyA = document.getElementById('crosscheck-key-a').value;
    const keyB = document.getElementById('crosscheck-key-b').value;

    if (!keyA || !keyB) {
        alert("Vui lòng chọn Khóa Chính (Định danh) cho cả 2 file!");
        return;
    }

    const mappingRows = document.querySelectorAll('.mapping-row');
    const mappings = [];
    mappingRows.forEach(row => {
        const a = row.querySelector('.map-col-a').value;
        const b = row.querySelector('.map-col-b').value;
        if (a && b) mappings.push({ a, b });
    });

    if (mappings.length === 0) {
        alert("Vui lòng ánh xạ ít nhất 1 cặp cột để đối chiếu!");
        return;
    }

    showAlert("⏳ Đang soi chiếu dữ liệu...", "info");

    // Index File B by key for fast lookup
    const indexB = {};
    crosscheckDataB.forEach(rowB => {
        const k = (rowB[keyB] || "").toString().trim().toLowerCase();
        if (k) indexB[k] = rowB;
    });

    const reportData = [];
    let mismatchCount = 0;

    crosscheckDataA.forEach(rowA => {
        const kA = (rowA[keyA] || "").toString().trim().toLowerCase();
        if (!kA) return;

        const rowB = indexB[kA];
        if (!rowB) {
            // Missing in B
            const reportRow = {
                [keyA]: rowA[keyA],
                "Trạng thái": "⚠️ Không tìm thấy trong File B"
            };
            reportData.push(reportRow);
            mismatchCount++;
            return;
        }

        // Both exist, let's compare mapped columns
        let hasMismatch = false;
        const reportRow = {
            [keyA]: rowA[keyA],
            "Trạng thái": "❌ Bị Lệch"
        };

        mappings.forEach(map => {
            const valA = rowA[map.a];
            const valB = rowB[map.b];
            
            const normA = normalizeValue(valA);
            const normB = normalizeValue(valB);

            if (normA !== normB) {
                hasMismatch = true;
                reportRow[`[LỆCH] ${map.a}`] = `File A: ${valA}  ➔  File B: ${valB}`;
            } else {
                // Keep original value if match, just to show context
                reportRow[`${map.a}`] = valA;
            }
        });

        if (hasMismatch) {
            reportData.push(reportRow);
            mismatchCount++;
        }
    });

    if (mismatchCount === 0) {
        showAlert("🎉 Tuyệt vời! Không phát hiện sai lệch nào giữa 2 file.", "success");
    } else {
        showAlert(`⚠️ Phát hiện ${mismatchCount} bản ghi bị lệch. Đang tải báo cáo...`, "error");
        
        // Generate Excel
        const ws = XLSX.utils.json_to_sheet(reportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bao_Cao_Sai_Lech");
        XLSX.writeFile(wb, "Bao_Cao_Sai_Lech_Diem.xlsx");
    }
}
