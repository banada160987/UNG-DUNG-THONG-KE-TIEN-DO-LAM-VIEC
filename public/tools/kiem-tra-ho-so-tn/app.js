// app-utils.js và app-state.js đã chuyển các tiện ích và trạng thái chung ra module riêng.
// Nội dung xử lý Excel và các chức năng chính tiếp theo vẫn nằm trong app.js.
// --- EXCEL PROCESSING ---
function findBestHeaderRow(rows) {
    let best = { index: 0, confidence: 0 };
    rows.slice(0, 15).forEach((row, idx) => {
        let matches = 0;
        const flatRow = row.map(c => String(c).toLowerCase());
        CORE_FIELDS.forEach(field => {
            if (field.patterns.some(p => flatRow.some(cell => cell.includes(p)))) matches++;
        });
        if (matches > best.confidence) best = { index: idx, confidence: matches };
    });
    return { ...best, confident: best.confidence >= 3 };
}

function getStandardColumnName(raw) {
    if (!raw) return "";
    return raw.toString().trim().replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ");
}

function autoMapColumns(cols) {
    const mapping = {};
    let matchedCount = 0;
    const normalize = (s) => s.toLowerCase().replace(/[-\s–—]/g, '').trim();

    CORE_FIELDS.forEach(field => {
        const normalizedPatterns = field.patterns.map(p => normalize(p));
        const found = cols.find(c => {
            const normCol = normalize(c);
            return normalizedPatterns.some(p => {
                if (p.startsWith('^') && p.endsWith('$')) return normCol === p.slice(1, -1);
                return normCol.includes(p);
            });
        });
        if (found) { mapping[field.key] = found; matchedCount++; }
    });
    return { mapping, isConfident: matchedCount >= 5 };
}

function switchTab(tabId) {
    const adminOnlyTabs = [
        'config', 'examrooms', 'proctor-config', 'proctor-board', 
        'analytics', 'qr-pass', 'kiosk-map', 'live-attendance', 
        'exam-sealing', 'command-center', 'exam-incidents', 
        'graduation-predictor', 'seating-chart', 'exam-shuffler', 
        'decree30-editor', 'exam-config'
    ];

    if (currentUser && currentUser.role !== 'admin' && adminOnlyTabs.includes(tabId)) {
        showAlert("🔒 Chức năng này chỉ dành cho Tài khoản Quản trị / Ban Giám Hiệu.", "warning");
        tabId = 'upload';
    }

    // 1. Hide all section views
    document.querySelectorAll('.section-view').forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none';
    });
    // 2. Deactivate all nav buttons
    document.querySelectorAll('.nav-item').forEach(v => v.classList.remove('active'));

    // 3. Activate target view
    const target = document.getElementById(`view-${tabId}`);
    if (target) {
        target.classList.add('active');
        target.classList.remove('hidden');
        target.style.display = 'block';
    }

    // 4. Activate corresponding nav button
    const btn = document.getElementById(`btn-tab-${tabId}`);
    if (btn) btn.classList.add('active');

    // 5. Safe Tab-specific initializations
    try {
        if (tabId === 'stats' && typeof renderStatistics === 'function') renderStatistics();
    } catch(e) { console.warn("stats init warning:", e); }

    try {
        if (tabId === 'aianalysis' && typeof runAIAnalysis === 'function') runAIAnalysis();
    } catch(e) { console.warn("aianalysis init warning:", e); }

    try {
        if (tabId === 'splitname' && typeof updateSplitFileSelector === 'function') updateSplitFileSelector();
    } catch(e) { console.warn("splitname init warning:", e); }

    try {
        if (tabId === 'photorename' && typeof updatePhotoFileSelector === 'function') updatePhotoFileSelector();
    } catch(e) { console.warn("photorename init warning:", e); }

    try {
        if (tabId === 'smas-excel' && typeof initSmasExcelTab === 'function') initSmasExcelTab();
    } catch(e) { console.warn("smas-excel init warning:", e); }

    try {
        if (tabId === 'datamanager') { 
            if (typeof renderFileList === 'function') renderFileList(); 
            if (typeof updateCompareDropdowns === 'function') updateCompareDropdowns(); 
        }
    } catch(e) { console.warn("datamanager init warning:", e); }

    try {
        if (tabId === 'proctor-board' && typeof renderProctorBoard === 'function') renderProctorBoard();
    } catch(e) { console.warn("proctor-board init warning:", e); }

    try {
        if (tabId === 'analytics' && typeof renderExecutiveAnalytics === 'function') renderExecutiveAnalytics();
    } catch(e) { console.warn("analytics init warning:", e); }

    try {
        if (tabId === 'qr-pass' && typeof renderQRPasses === 'function') renderQRPasses();
    } catch(e) { console.warn("qr-pass init warning:", e); }

    try {
        if (tabId === 'kiosk-map' && typeof ExamUltimate !== 'undefined' && typeof ExamUltimate.renderKioskMap === 'function') ExamUltimate.renderKioskMap();
    } catch(e) { console.warn("kiosk-map init warning:", e); }

    try {
        if (tabId === 'live-attendance' && typeof ExamUltimate !== 'undefined' && typeof ExamUltimate.renderLiveAttendance === 'function') ExamUltimate.renderLiveAttendance();
    } catch(e) { console.warn("live-attendance init warning:", e); }

    try {
        if (tabId === 'exam-sealing' && typeof ExamUltimate !== 'undefined' && typeof ExamUltimate.renderExamSealing === 'function') ExamUltimate.renderExamSealing();
    } catch(e) { console.warn("exam-sealing init warning:", e); }

    try {
        if (tabId === 'command-center' && typeof initCommandCenter === 'function') initCommandCenter();
    } catch(e) { console.warn("command-center init warning:", e); }

    try {
        if (tabId === 'exam-incidents' && typeof initExamIncidents === 'function') initExamIncidents();
    } catch(e) { console.warn("exam-incidents init warning:", e); }

    try {
        if (tabId === 'graduation-predictor' && typeof initGraduationPredictor === 'function') initGraduationPredictor();
    } catch(e) { console.warn("graduation-predictor init warning:", e); }

    try {
        if (tabId === 'seating-chart' && typeof initSeatingChart === 'function') initSeatingChart();
    } catch(e) { console.warn("seating-chart init warning:", e); }

    try {
        if (tabId === 'behavior-incident' && typeof BehaviorIncident !== 'undefined' && typeof BehaviorIncident.init === 'function') BehaviorIncident.init();
    } catch(e) { console.warn("behavior-incident init warning:", e); }

    try {
        if (tabId === 'decree30-editor' && typeof Decree30Editor !== 'undefined' && typeof Decree30Editor.init === 'function') Decree30Editor.init();
    } catch(e) { console.warn("decree30-editor init warning:", e); }

    try {
        if (tabId === 'excel-transfer' && typeof ExcelTransfer !== 'undefined' && typeof ExcelTransfer.init === 'function') ExcelTransfer.init();
    } catch(e) { console.warn("excel-transfer init warning:", e); }

    try {
        if (tabId === 'exam-shuffler' && typeof ExamShuffler !== 'undefined' && typeof ExamShuffler.init === 'function') ExamShuffler.init();
    } catch(e) { console.warn("exam-shuffler init warning:", e); }

    try {
        if (typeof saveAppState === 'function') saveAppState();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch(e) {}
}

async function processExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const data = new Uint8Array(ev.target.result);
                const wb = XLSX.read(data, { type: 'array' });
                const sheet = wb.Sheets[wb.SheetNames[0]];
                const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

                if (!raw || raw.length === 0) { resolve(); return; }

                // Xử lý Merge Cells nếu có
                const merges = sheet["!merges"] || [];
                merges.forEach(m => {
                    const val = raw[m.s.r]?.[m.s.c];
                    for (let R = m.s.r; R <= m.e.r; ++R) {
                        for (let C = m.s.c; C <= m.e.c; ++C) {
                            if (!raw[R]) raw[R] = [];
                            raw[R][C] = val;
                        }
                    }
                });

                let i1 = parseInt(document.getElementById('header-row1').value) - 1;
                let i2 = parseInt(document.getElementById('header-row2').value) - 1;
                const useAutoPriority = document.getElementById('auto-header-priority').checked;
                const detection = findBestHeaderRow(raw);
                let autoDetected = false;

                if (useAutoPriority && detection.confident) {
                    i1 = detection.index;
                    autoDetected = true;
                }

                const mergeH = document.getElementById('merge-checkbox').checked;
                const rowA = raw[i1] || [], rowB = raw[i2] || [];
                let currentCols = [];

                if (mergeH && i1 !== i2 && raw[i2]) {
                    const maxLen = Math.max(rowA.length, rowB.length);
                    currentCols = Array.from({ length: maxLen }, (_, idx) => {
                        let a = (rowA[idx] || "").toString().trim();
                        let b = (rowB[idx] || "").toString().trim();
                        if (a && b && a !== b) return `${a} - ${b}`;
                        return getStandardColumnName(a || b || `Cột ${idx + 1}`);
                    });
                } else {
                    currentCols = rowA.map((a, idx) => getStandardColumnName(a || `Cột ${idx + 1}`));
                }

                const body = raw.slice(Math.max(i1, i2) + 1);
                const currentData = body.filter(r => r.some(cell => cell !== "")).map(r => {
                    const obj = { _sourceFile: file.name };
                    currentCols.forEach((c, j) => { if (c) obj[c] = r[j]; });
                    return obj;
                });

                if (currentData.length > 0) {
                    const sig = getFileSignature(currentCols);
                    const existingFile = dataStore[file.name];
                    const autoResult = autoMapColumns(currentCols);

                    // Logic lấy mapping: 
                    // 1. Ưu tiên mapping đã tồn tại của tệp trùng tên
                    // 2. Nếu không có, tìm trong lịch sử cấu hình dựa trên cấu trúc cột (Signature)
                    // 3. Cuối cùng mới dùng Auto Map
                    let finalMapping = autoResult.mapping;
                    if (existingFile && existingFile.mapping) {
                        finalMapping = existingFile.mapping;
                    } else if (mappingHistory[sig]) {
                        finalMapping = mappingHistory[sig];
                    }

                    dataStore[file.name] = {
                        columns: currentCols,
                        data: currentData,
                        mapping: finalMapping,
                        timestamp: new Date().toLocaleString('vi-VN'),
                        autoDetected: autoDetected,
                        signature: sig
                    };

                    refreshActiveFileData(file.name);

                    // Chỉ hiện modal Mapping nếu:
                    // - Chưa từng có mapping cho cấu trúc này
                    // - HOẶC auto-map không tự tin (matched < 5)
                    if (!mappingHistory[sig] && !autoResult.isConfident) {
                        showMappingReview(file.name);
                    } else {
                        const msg = mappingHistory[sig] ? `✅ Đã tải tệp "${file.name}" và áp dụng cấu hình đã lưu.` : `✅ Đã tải tệp "${file.name}" và tự động ánh xạ cột.`;
                        showAlert(msg, 'success');
                    }

                    saveToDB();
                } else {
                    throw new Error("Không tìm thấy dữ liệu hợp lệ.");
                }
                resolve();
            } catch (err) {
                showAlert(`❌ Lỗi xử lý tệp: ${err.message}`, 'danger');
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function renderColumnCheckboxes() {
    const container = document.getElementById("column-checkbox-container");
    if (!container) return;
    container.innerHTML = columnNames.map(col => `
        <label class="col-checkbox-label">
            <input type="checkbox" class="col-check" value="${col}" checked onchange="saveAppState(); search();">
            <span>${col}</span>
        </label>
    `).join('');
}

function renderDataPreview() {
    const area = document.getElementById("data-preview-area");
    if (!area) return;
    if (excelData.length === 0) {
        area.innerHTML = '<div class="preview-placeholder">Dữ liệu xem trước sẽ hiển thị ở đây sau khi tải tệp thành công.</div>';
        return;
    }

    let html = `<div class="table-area"><div class="table-wrapper"><table><thead><tr>`;
    columnNames.forEach(c => html += `<th>${c}</th>`);
    html += `</tr></thead><tbody>`;
    excelData.slice(0, 10).forEach(row => {
        html += `<tr>`;
        columnNames.forEach(c => html += `<td>${row[c] || ""}</td>`);
        html += `</tr>`;
    });
    area.innerHTML = html + `</tbody></table></div></div><p style="font-size:12px; color:var(--text-muted); margin-top:10px">* Đang hiển thị 10 dòng dữ liệu đầu tiên.</p>`;
}

function updateDashboard() {
    const total = excelData.length;
    const filesCount = Object.keys(dataStore).length;

    const elements = {
        'dash-total-students': total,
        'dash-total-files': filesCount,
        'stat-total-students': total,
        'stat-files-count': filesCount,
        'stat-active-file': activeFileName || "Chưa chọn"
    };

    Object.entries(elements).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    });

    if (activeFileName) {
        renderStatistics();
        runAIAnalysis();
    }
}

function mergeSmasNameIfNeeded(f) {
    if (!f || !f.mapping) return;
    const hoDemCol = f.mapping['ho_dem'];
    const tenCol = f.mapping['ten'];
    if (hoDemCol && tenCol) {
        const autoMergedCol = "Họ và tên (Tự động ghép)";
        if (!f.columns.includes(autoMergedCol)) {
            f.columns.push(autoMergedCol);
        }
        if (!f.mapping['hoten'] || f.mapping['hoten'] === autoMergedCol) {
            f.mapping['hoten'] = autoMergedCol;
        }
        f.data.forEach(row => {
            const hoDemVal = (row[hoDemCol] || "").toString().trim();
            const tenVal = (row[tenCol] || "").toString().trim();
            row[autoMergedCol] = (hoDemVal + " " + tenVal).replace(/\s+/g, " ").trim();
        });
    }
}

function refreshActiveFileData(name) {
    if (!dataStore[name]) return;
    activeFileName = name;
    const f = dataStore[name];
    
    // Tự động ghép họ tên SMAS nếu có cấu hình cột Họ đệm và Tên
    mergeSmasNameIfNeeded(f);
    
    excelData = f.data;
    columnNames = f.columns;
    renderColumnCheckboxes();
    renderDataPreview();
    updateDashboard();
    updateActiveMappingUI();
    saveAppState(); // Persist activeFileName immediately
    saveToDB();     // Also persist to IndexedDB
    search();       // Tự động kiểm tra lỗi khi chuyển tệp
    
    // Auto-update Behavior Incident dropdowns when data changes
    if (typeof BehaviorIncident !== 'undefined' && typeof BehaviorIncident.loadClasses === 'function') {
        BehaviorIncident.loadClasses();
    }
}


// validateRow moved to validation_engine.js

function updateActiveMappingUI() {
    const card = document.getElementById('active-mapping-card');
    const list = document.getElementById('active-mapping-list');
    if (!card || !list || !activeFileName || !dataStore[activeFileName]) {
        if (card) card.style.display = 'none';
        return;
    }

    const f = dataStore[activeFileName];
    if (!f.mapping) {
        card.style.display = 'none';
        return;
    }

    card.style.display = 'block';
    const mappedFields = CORE_FIELDS.filter(field => f.mapping[field.key]);

    list.innerHTML = mappedFields.map(field => `
        <div class="flex justify-between items-center py-1 border-bottom-dashed" style="font-size:12px; border-bottom: 1px dashed #eee">
            <span style="color:var(--text-muted)">${field.label}:</span>
            <span style="font-weight:600; color:var(--primary)">${f.mapping[field.key]}</span>
        </div>
    `).join('');
}

// --- UI & TAB MANAGEMENT ---
// switchTab consolidated above

// Đã gộp vào refreshActiveFileData chính ở trên

function renderFileList() {
    const body = document.getElementById("file-list-body");
    if (!body) return;
    const files = Object.keys(dataStore);
    if (files.length === 0) { body.innerHTML = ""; return; }
    document.getElementById("file-empty-msg").style.display = "none";
    body.innerHTML = files.map(name => {
        const f = dataStore[name];
        const isMaster = masterFileName === name;
        const uniqueCCCDs = new Set();
        const mapping = f.mapping;
        if (mapping && mapping['cccd']) {
            f.data.forEach(row => {
                const val = (row[mapping['cccd']] || "").toString().trim();
                if (val) uniqueCCCDs.add(val);
            });
        }
        const uniqueCount = uniqueCCCDs.size > 0 ? uniqueCCCDs.size : f.data.length;

        return `<tr class="${isMaster ? 'master-row' : ''}">
                <td>${isMaster ? '⭐ ' : ''}${name}</td>
                <td style="font-weight:700; color:var(--primary)">${uniqueCount.toLocaleString()}</td>
                <td style="color:var(--text-muted)">${f.data.length} dòng</td>
                <td>${f.timestamp}</td>
                <td>${activeFileName === name ? '<span class="badge badge-success">Hoạt động</span>' : '<span class="badge badge-outline">Chờ</span>'}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="setActiveFile('${name}')">Mở</button>
                    <button class="btn btn-sm btn-outline" onclick="showMappingReview('${name}')">Map</button>
                    <button class="btn btn-sm btn-outline" style="${isMaster ? 'display:none' : ''}" onclick="setMasterFile('${name}')">Gốc</button>
                    <button class="btn btn-sm btn-outline" style="color:var(--danger)" onclick="deleteFile('${name}')">Xóa</button>
                </td></tr>`;
    }).join('');
}

function setActiveFile(name) {
    refreshActiveFileData(name);
    renderFileList(); // Update active/waiting status in UI
}

function setMasterFile(name) {
    masterFileName = name;
    const masterDisplay = document.getElementById('master-filename');
    const masterInfo = document.getElementById('master-list-info');
    if (masterDisplay) masterDisplay.innerText = name;
    if (masterInfo) masterInfo.style.display = 'block';
    renderFileList();
}

function unsetMasterFile() {
    masterFileName = null;
    const masterInfo = document.getElementById('master-list-info');
    if (masterInfo) masterInfo.style.display = 'none';
    renderFileList();
}

function deleteFile(name) {
    if (confirm(`Bạn có chắc chắn muốn xóa tệp "${name}" khỏi hệ thống?`)) {
        delete dataStore[name];
        if (activeFileName === name) {
            activeFileName = null;
            excelData = [];
            columnNames = [];
            updateDashboard();
        }
        if (masterFileName === name) unsetMasterFile();
        saveToDB();
        renderFileList();
        updateCompareDropdowns();
        showAlert("🗑️ Đã xóa tệp thành công!", 'success');
    }
}

// --- REPORTING & EXPORTS ---

// Export functions moved to export_service.js



// --- AI & STATISTICS ---
let riskChart = null;

function renderRiskGauge(score) {
    const ctx = document.getElementById('riskGaugeChart')?.getContext('2d');
    if (!ctx) return;
    if (riskChart) riskChart.destroy();
    riskChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [score, 100 - score],
                backgroundColor: [score > 70 ? '#10b981' : '#ef4444', '#f1f5f9'],
                circumference: 180, rotation: 270,
            }]
        },
        options: { cutout: '80%', plugins: { legend: { display: false } } }
    });
}

// --- EXAM ROOMS ---
function generateExamRooms() {
    if (!activeFileName || excelData.length === 0) {
        showAlert("⚠️ Vui lòng tải dữ liệu và chọn tệp hoạt động trước!", 'warning');
        return;
    }

    const mapping = dataStore[activeFileName].mapping;
    if (!mapping['hoten']) {
        showAlert("⚠️ Vui lòng ánh xạ cột 'Họ và tên' để thực hiện xếp phòng!", 'warning');
        return;
    }

    const capacity = parseInt(document.getElementById('room-capacity').value) || 24;
    const startSBD = document.getElementById('sbd-start').value.trim();
    const sbdPrefix = document.getElementById('sbd-prefix')?.value.trim() || "";
    const sbdPadding = parseInt(document.getElementById('sbd-padding')?.value) || startSBD.length || 6;
    const startRoom = parseInt(document.getElementById('room-start-index').value) || 1;
    const sortMode = document.getElementById('room-sort-mode').value;
    const balanceRooms = document.getElementById('room-balance-toggle')?.checked || false;
    const subjects = ['anh', 'ly', 'hoa', 'sinh', 'su', 'dia', 'gdkt', 'tin', 'cnn', 'cnc', 'nhat', 'trung', 'han', 'phap', 'nga', 'duc'];
    const totalStudents = excelData.length;

    let sorted = [...excelData];

    // Sorting Logic - Professional Vietnamese Sorting
    const vnSort = (a, b) => {
        const nameA = (a[mapping['hoten']] || "").toString().trim();
        const nameB = (b[mapping['hoten']] || "").toString().trim();
        const sA = splitVietnameseName(nameA);
        const sB = splitVietnameseName(nameB);

        // So sánh Tên trước
        const cmpTen = sA.ten.localeCompare(sB.ten, 'vi', { sensitivity: 'base' });
        if (cmpTen !== 0) return cmpTen;

        // Nếu tên trùng, so sánh Họ và lót
        return (sA.ho + " " + sA.lot).localeCompare((sB.ho + " " + sB.lot), 'vi', { sensitivity: 'base' });
    };

    if (sortMode === 'name') {
        sorted.sort(vnSort);
    } else if (sortMode === 'class') {
        sorted.sort((a, b) => {
            const clsA = (a[mapping['lop']] || "").toString().trim();
            const clsB = (b[mapping['lop']] || "").toString().trim();
            const cmpCls = clsA.localeCompare(clsB, undefined, { numeric: true });
            return cmpCls !== 0 ? cmpCls : vnSort(a, b);
        });
    } else if (sortMode === 'random') {
        sorted.sort(() => Math.random() - 0.5);
    } else if (sortMode === 'gender') {
        sorted.sort((a, b) => {
            const gA = (a[mapping['gioi_tinh']] || "").toString().trim();
            const gB = (b[mapping['gioi_tinh']] || "").toString().trim();
            if (gA !== gB) return gA.localeCompare(gB);
            return vnSort(a, b);
        });
    } else if (sortMode === 'smart_comb') {
        // Sắp xếp thông minh: Ưu tiên các tổ hợp có đông thí sinh nhất lên trước 
        // để dễ phân bổ vào các phòng tập trung môn, sau đó mới đến các tổ hợp lẻ.
        const getComb = (s) => subjects.filter(sub => isSubjectMarked(s, sub, mapping)).sort().join('-');

        const combCounts = {};
        sorted.forEach(s => { const c = getComb(s); combCounts[c] = (combCounts[c] || 0) + 1; });

        sorted.sort((a, b) => {
            const cA = getComb(a), cB = getComb(b);
            if (combCounts[cA] !== combCounts[cB]) return combCounts[cB] - combCounts[cA]; // Giảm dần theo số lượng
            if (cA !== cB) return cA.localeCompare(cB);
            return vnSort(a, b);
        });
    } else if (sortMode === 'combination') {
        const getComb = (s) => subjects.filter(sub => isSubjectMarked(s, sub, mapping)).sort().join('-');
        sorted.sort((a, b) => {
            const cA = getComb(a), cB = getComb(b);
            return cA.localeCompare(cB) !== 0 ? cA.localeCompare(cB) : vnSort(a, b);
        });
    } else if (sortMode === 'subject1' || sortMode === 'subject2') {
        const caIdx = sortMode === 'subject1' ? 0 : 1;
        const getSub = (s) => {
            const subs = subjects.filter(sub => isSubjectMarked(s, sub, mapping)).map(sub => subjectLabels[subjects.indexOf(sub)]);
            return subs[caIdx] || "ZZZ"; // Put students without the subject at the end
        };
        sorted.sort((a, b) => {
            const sA = getSub(a), sB = getSub(b);
            if (sA !== sB) return sA.localeCompare(sB);
            return vnSort(a, b);
        });
    } else if (sortMode === 'random_comb') {
        const getComb = (s) => subjects.filter(sub => isSubjectMarked(s, sub, mapping)).sort().join('-');
        const combs = [...new Set(sorted.map(getComb))];
        const shuffledCombs = combs.sort(() => Math.random() - 0.5);
        sorted.sort((a, b) => shuffledCombs.indexOf(getComb(a)) - shuffledCombs.indexOf(getComb(b)) || Math.random() - 0.5);
    } else if (sortMode === 'interleave_sub') {
        const getComb = (s) => subjects.filter(sub => isSubjectMarked(s, sub, mapping)).sort().join('-');
        const groups = {};
        sorted.forEach(s => { const c = getComb(s); if (!groups[c]) groups[c] = []; groups[c].push(s); });
        const newSorted = [];
        const keys = Object.keys(groups);
        let maxLen = Math.max(...Object.values(groups).map(g => g.length));
        for (let i = 0; i < maxLen; i++) {
            keys.forEach(k => { if (groups[k][i]) newSorted.push(groups[k][i]); });
        }
        sorted = newSorted;
    } else if (sortMode === 'shuffle_class') {
        const groups = {};
        sorted.forEach(s => { const c = (s[mapping['lop']] || "KHAC"); if (!groups[c]) groups[c] = []; groups[c].push(s); });
        const newSorted = [];
        const keys = Object.keys(groups).sort();
        let maxLen = Math.max(...Object.values(groups).map(g => g.length));
        for (let i = 0; i < maxLen; i++) {
            keys.forEach(k => { if (groups[k][i]) newSorted.push(groups[k][i]); });
        }
        sorted = newSorted;
    } else if (sortMode === 'original') {
        // No changes needed, already in original order from excelData
    }

    // Apply Advanced Constraints (Combined Logic)
    const constraintGender = document.getElementById('constraint-gender')?.checked || false;
    const constraintClass = document.getElementById('constraint-class')?.checked || false;
    const constraintSubject = document.getElementById('constraint-subject')?.checked || false;
    const constraintSurname = document.getElementById('constraint-surname')?.checked || false;
    const constraintSource = document.getElementById('constraint-source')?.checked || false;

    if (constraintGender || constraintClass || constraintSubject || constraintSurname || constraintSource) {
        console.log("Applying advanced allocation constraints...");
        const getComb = (s) => subjects.filter(sub => isSubjectMarked(s, sub, mapping)).sort().join('-');

        let pool = sorted.map(s => {
            const fullName = (s[mapping['hoten']] || "").toString().trim();
            const sName = splitVietnameseName(fullName);
            return {
                original: s,
                gender: (s[mapping['gioi_tinh']] || "").toString().trim(),
                class: (s[mapping['lop']] || "").toString().trim(),
                comb: getComb(s),
                surname: sName.ho,
                source: s._sourceFile || ""
            };
        });

        let result = [];
        if (pool.length > 0) {
            result.push(pool.shift());
            while (pool.length > 0) {
                let bestIdx = 0;
                let minViolations = 1000;
                const last = result[result.length - 1];

                // Heuristic search in a sliding window for performance
                const searchLimit = Math.min(pool.length, 200);
                for (let i = 0; i < searchLimit; i++) {
                    let violations = 0;
                    const curr = pool[i];

                    // Priority weightings for violations
                    if (constraintGender && last.gender === curr.gender) violations += 1;
                    if (constraintClass && last.class === curr.class) violations += 10; // High priority: different classes
                    if (constraintSubject && last.comb === curr.comb) violations += 2;
                    if (constraintSurname && last.surname === curr.surname && last.surname !== "") violations += 5;
                    if (constraintSource && last.source === curr.source && last.source !== "") violations += 3;

                    if (violations < minViolations) {
                        minViolations = violations;
                        bestIdx = i;
                        if (violations === 0) break;
                    }
                }
                result.push(pool.splice(bestIdx, 1)[0]);

                // Progress logging for large datasets
                if (result.length % 500 === 0) {
                    console.log(`Allocated ${result.length}/${totalStudents} students...`);
                }
            }
            sorted = result.map(r => r.original);
        }
    }

    // Luôn reset danh sách phòng khi xếp mới (Đã gỡ bỏ Chế độ cộng dồn theo yêu cầu)
    generatedRooms = [];
    let currentStartRoom = startRoom;

    // --- ADVANCED FEATURE: SMALL GROUP CLUSTERING (Gom nhóm môn lẻ) ---
    const rareSubjectThreshold = 10;
    const subjectCounts = {};
    sorted.forEach(s => {
        subjects.forEach(sub => {
            if (isSubjectMarked(s, sub, mapping)) {
                subjectCounts[sub] = (subjectCounts[sub] || 0) + 1;
            }
        });
    });

    const rareSubjects = subjects.filter(sub => subjectCounts[sub] > 0 && subjectCounts[sub] < rareSubjectThreshold);
    const isRare = (s) => subjects.some(sub => {
        return rareSubjects.includes(sub) && isSubjectMarked(s, sub, mapping);
    });

    if (rareSubjects.length > 0) {
        console.log("Rare subjects detected:", rareSubjects.map(s => subjectLabels[subjects.indexOf(s)]));
        // Move students with rare subjects to the end to cluster them in the last rooms
        const normal = sorted.filter(s => !isRare(s));
        const rare = sorted.filter(s => isRare(s));
        sorted = [...normal, ...rare];
    }

    // Room Allocation with Balancing Option
    let currentSBDVal = parseInt(startSBD) || 1;

    let studentsPerRoom = [];
    const roomCountNeeded = Math.ceil(totalStudents / capacity);

    if (balanceRooms && roomCountNeeded > 0) {
        const baseCount = Math.floor(totalStudents / roomCountNeeded);
        const extraOnes = totalStudents % roomCountNeeded;
        for (let i = 0; i < roomCountNeeded; i++) {
            studentsPerRoom.push(i < extraOnes ? baseCount + 1 : baseCount);
        }
    } else {
        for (let i = 0; i < roomCountNeeded; i++) {
            const remaining = totalStudents - i * capacity;
            studentsPerRoom.push(Math.min(capacity, remaining));
        }
    }

    let currentIndex = 0;
    const allSubjectKeys = ['toan', 'van', 'anh', 'ly', 'hoa', 'sinh', 'su', 'dia', 'gdkt', 'tin', 'cnn', 'cnc', 'nhat', 'trung', 'han', 'phap', 'nga', 'duc'];
    
    studentsPerRoom.forEach((count, roomIdx) => {
        const sampleStudent = sorted[currentIndex];
        const gradeName = mapping['lop'] ? (sampleStudent ? (sampleStudent[mapping['lop']] || "").toString().trim() : "") : "";
        const gradePrefix = gradeName.match(/\d+/) ? `K${gradeName.match(/\d+/)[0]}` : "P";
        const roomNumDisplay = (currentStartRoom + roomIdx).toString().padStart(2, '0');
        const roomNumberStr = `${gradePrefix}-P${roomNumDisplay}`;

        const roomStudents = sorted.slice(currentIndex, currentIndex + count).map((s, idx) => {
            const sbdStr = (currentSBDVal + currentIndex + idx).toString().padStart(sbdPadding, '0');
            const fullSbdStr = sbdPrefix + sbdStr;
            
            // Resolve subjects here so they are permanent for this student
            const resolvedSubjects = {};
            allSubjectKeys.forEach(k => {
                resolvedSubjects[k] = isSubjectMarked(s, k, mapping);
            });

            // Ghi nhận vĩnh viễn SBD và Mã Phòng vào tham chiếu gốc của excelData
            s.sbd = fullSbdStr;
            s.roomNumber = roomNumberStr;
            s.stt = idx + 1;
            if (mapping['sbd']) s[mapping['sbd']] = fullSbdStr;

            return {
                ...s,
                stt: idx + 1,
                sbd: fullSbdStr,
                roomNumber: roomNumberStr,
                hoten: s[mapping['hoten']] || "",
                lop: mapping['lop'] ? s[mapping['lop']] : "",
                _resolvedSubjects: resolvedSubjects // Pin the subjects to the student object
            };
        });

        generatedRooms.push({
            number: roomNumberStr,
            grade: gradeName.substring(0, 5), // Giữ lại tên lớp/khối ngắn gọn
            students: roomStudents
        });
        currentIndex += count;
    });

    // Đã gỡ bỏ tự động phân giám thị tại đây (Chuyển sang module ProctorPro độc lập)

    renderExamRoomResults();
    saveToDB();         // Persist generatedRooms immediately to IndexedDB
    saveAppState();     // Persist activeFileName to localStorage
    showAlert(`✅ Đã xếp xong ${totalStudents} thí sinh vào ${generatedRooms.length} phòng!`, 'success');
}


function renderExamRoomResults() {
    const body = document.getElementById('exam-rooms-body');
    const dashboard = document.getElementById('room-dashboard');
    const placeholder = document.getElementById('exam-rooms-placeholder');
    const resultsContainer = document.getElementById('exam-rooms-results');
    const statsContent = document.getElementById('room-stats-content');
    const statsCard = document.getElementById('room-stats-card');

    if (!body) return;

    if (generatedRooms.length === 0) {
        if (placeholder) placeholder.style.display = 'block';
        if (resultsContainer) resultsContainer.style.display = 'none';
        if (dashboard) dashboard.style.display = 'none';
        if (statsCard) statsCard.style.display = 'none';
        return;
    }

    if (placeholder) placeholder.style.display = 'none';
    if (resultsContainer) resultsContainer.style.display = 'block';
    if (dashboard) dashboard.style.display = 'grid';
    if (statsCard) statsCard.style.display = 'block';

    // Update Dashboard Stats
    const totalStudents = excelData.length;
    const roomCount = generatedRooms.length;
    const capacity = parseInt(document.getElementById('room-capacity').value) || 24;
    const fillRate = roomCount > 0 ? ((totalStudents / (roomCount * capacity)) * 100).toFixed(1) : 0;

    // New Widgets
    if (document.getElementById('stat-total-students')) document.getElementById('stat-total-students').innerText = totalStudents.toLocaleString();
    if (document.getElementById('stat-total-rooms')) document.getElementById('stat-total-rooms').innerText = roomCount;
    if (document.getElementById('stat-fill-rate')) document.getElementById('stat-fill-rate').innerText = fillRate + "%";
    if (document.getElementById('stat-room-status')) {
        const el = document.getElementById('stat-room-status');
        el.innerText = "HOÀN TẤT";
        el.style.color = "#15803d";
    }

    // Legacy badges (keep for safety)
    if (document.getElementById('stats-room-count')) document.getElementById('stats-room-count').innerText = roomCount;
    if (document.getElementById('stats-room-fill')) document.getElementById('stats-room-fill').innerText = fillRate + "%";

    // Calculate Global Subject Stats
    const globalStats = {};
    const subjects = ['anh', 'ly', 'hoa', 'sinh', 'su', 'dia', 'gdkt', 'tin', 'cnn', 'cnc', 'nhat', 'trung', 'han', 'phap', 'nga', 'duc'];
    const subjectLabels = ["Anh", "Lý", "Hóa", "Sinh", "Sử", "Địa", "GDKTPL", "Tin", "CNN", "CNC", "Nhật", "Trung", "Hàn", "Pháp", "Nga", "Đức"];
    const mapping = dataStore[activeFileName].mapping;

    excelData.forEach(s => {
        subjects.forEach((sub, idx) => {
            // Use pinned subjects if available (for allocated students) or detect real-time
            const isRegistered = s._resolvedSubjects ? s._resolvedSubjects[sub] : (() => {
                const col = mapping[sub];
                if (!col) return false;
                const v = (s[col] || "").toString().trim().toUpperCase();
                const headerName = col.toUpperCase();
                return v !== "" && v !== "0" && v !== "FALSE" && v !== "NULL" && (v.length <= 5 || v === headerName);
            })();

            if (isRegistered) {
                const label = subjectLabels[idx];
                globalStats[label] = (globalStats[label] || 0) + 1;
            }
        });
    });

    // Group Rooms by Grade for Summary
    const gradeSummary = {};
    generatedRooms.forEach(r => {
        const g = r.grade || "??";
        if (!gradeSummary[g]) gradeSummary[g] = { rooms: 0, students: 0, start: r.number, end: r.number };
        gradeSummary[g].rooms++;
        gradeSummary[g].students += r.students.length;
        gradeSummary[g].end = r.number;
    });

    if (statsContent) {
        let sessionHtml = `
            <div style="background: var(--bg-secondary); padding: 15px; border-radius: 12px; margin-bottom: 20px; border: 1px solid var(--border)">
                <div style="font-weight:800; margin-bottom:12px; color:var(--primary); font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Tóm tắt Phiên thi liên khối</div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;">
        `;

        Object.entries(gradeSummary).forEach(([grade, data]) => {
            sessionHtml += `
                <div style="background: #fff; padding: 12px; border-radius: 8px; border-left: 4px solid var(--primary); box-shadow: 0 2px 4px rgba(0,0,0,0.05)">
                    <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">KHỐI ${grade}</div>
                    <div style="font-size: 18px; font-weight: 800; color: var(--text-main); margin: 4px 0;">${data.rooms} <span style="font-size: 12px; font-weight: 400;">phòng</span></div>
                    <div style="font-size: 12px; color: var(--text-muted);">P.${data.start} - P.${data.end} | ${data.students} TS</div>
                </div>
            `;
        });

        sessionHtml += `
                </div>
            </div>
            <div style="font-weight:700; margin-bottom:10px; color:var(--text-main)">Phân bổ môn tự chọn toàn trường:</div>
            <div class="room-summary-badges">
                ${Object.entries(globalStats).map(([sub, count]) => `
                    <div class="global-subject-badge">
                        <span class="sub-label">${sub}</span>
                        <span class="sub-value">${count}</span>
                    </div>
                `).join('')}
            </div>
        `;
        statsContent.innerHTML = sessionHtml;
    }

    let html = "";
    generatedRooms.forEach(room => {
        const roomStats = {};
        room.students.forEach(s => {
            subjects.forEach((sub, idx) => {
                const isRegistered = isSubjectMarked(s, sub, mapping);

                if (isRegistered) {
                    const label = subjectLabels[idx];
                    roomStats[label] = (roomStats[label] || 0) + 1;
                }
            });
        });

        const statsHtml = Object.entries(roomStats)
            .map(([sub, count]) => `<span class="badge-mini">${sub}: <b>${count}</b></span>`)
            .join(' ');

        html += `<tr style="background: var(--bg-secondary); border-left: 4px solid var(--primary)">
            <td colspan="6">
                <div class="flex justify-between items-center" style="padding: 12px 15px">
                    <div class="flex flex-col gap-1">
                        <div class="flex items-center gap-3">
                            <span style="background: var(--primary); color: #fff; padding: 2px 10px; border-radius: 4px; font-weight: 800; font-size: 13px;">${room.grade ? room.grade + ' - ' : ''}PHÒNG ${room.number}</span>
                            <span style="font-size: 13px; font-weight: 700; color: var(--text-main)">${room.isVirtual ? 'Phòng thi bổ sung (Không có DS học sinh)' : 'Tổng số: ' + room.students.length + ' thí sinh'}</span>
                        </div>
                        <!-- Đã gỡ bỏ hiển thị giám thị tại đây để chuyển sang module ProctorPro chuyên nghiệp -->
                        <div class="flex flex-wrap gap-1 mt-1">${statsHtml}</div>
                    </div>
                    <div class="flex gap-2">
                        <button class="btn btn-sm btn-outline" style="background:#fff" onclick="showSeatingDiagram('${room.number}')">
                            <i data-lucide="layout" style="width:14px; margin-right:4px"></i> Sơ đồ
                        </button>
                    </div>
                </div>
            </td>
        </tr>`;

        room.students.forEach(s => {
            const registeredNames = subjects.filter(sub => isSubjectMarked(s, sub, mapping)).map(sub => subjectLabels[subjects.indexOf(sub)]);
            const comboText = registeredNames.join(' - ');

            html += `<tr class="hover-row">
                <td style="text-align:center; color:var(--text-muted)">${room.number}</td>
                <td style="text-align:center; font-weight:600">${s.stt}</td>
                <td style="font-weight:700; color:var(--primary)">${s.hoten}</td>
                <td>${s.lop}</td>
                <td style="font-family: monospace; font-weight:700; color:#1e40af">${s.sbd}</td>
                <td style="color:var(--text-muted); font-size:11px">${comboText || '-'}</td>
            </tr>`;
        });
    });
    body.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Render các icon tĩnh ngay lập tức
    if (typeof lucide !== 'undefined') lucide.createIcons();

    initDB().then(() => {
        loadFromDB().then(result => {
            if (result) {
                dataStore = result.dataStore || {};
                mappingHistory = result.mappingHistory || {};
                if (result.generatedRooms && result.generatedRooms.length > 0) {
                    // eslint-disable-next-line no-global-assign
                    generatedRooms = result.generatedRooms;
                }
                if (result.examIncidents) {
                    window.examIncidents = result.examIncidents;
                }
                if (result.roomSeats) {
                    window.roomSeats = result.roomSeats;
                }
                // Restore activeFileName from DB
                if (result.activeFileName && dataStore[result.activeFileName]) {
                    activeFileName = result.activeFileName;
                    excelData = dataStore[activeFileName].data || [];
                    columnNames = dataStore[activeFileName].columns || [];
                    renderColumnCheckboxes();
                    renderDataPreview();
                }
                updateDashboard();
                renderFileList();
                updateCompareDropdowns();
                if (activeFileName) {
                    updateActiveMappingUI();
                    search(); // Tự động kiểm tra lỗi & tạo dữ liệu lỗi theo lớp
                    
                    // Khôi phục dữ liệu cho dropdown Biên bản GVCN khi F5
                    if (typeof BehaviorIncident !== 'undefined' && typeof BehaviorIncident.loadClasses === 'function') {
                        BehaviorIncident.loadClasses();
                    }
                }
                // Re-render room results if rooms were restored
                if (generatedRooms.length > 0) renderExamRoomResults();
                
                // Vẽ lại các icon sau khi dữ liệu IndexedDB đã render xong UI động
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        }).catch(err => {
            console.error("Lỗi phục hồi dữ liệu từ IndexedDB:", err);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    }).catch(err => {
        console.error("Lỗi khởi tạo IndexedDB:", err);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    });

    try {
        initGraduationRules();
    } catch (e) {
        console.error("Lỗi initGraduationRules:", e);
    }

    try {
        restoreAppState();
    } catch (e) {
        console.error("Lỗi restoreAppState:", e);
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Event Listeners
    document.getElementById('excel-file')?.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        for (const file of files) await processExcelFile(file);
        e.target.value = "";
    });

    // Scroll Listener for Back to Top
    const content = document.querySelector('.content-body');
    if (content) {
        content.onscroll = function () {
            const btn = document.getElementById("back-to-top");
            if (btn) btn.style.display = content.scrollTop > 100 ? "flex" : "none";
        };
    }
});
function runAIAnalysis() {
    if (!activeFileName || !dataStore[activeFileName]) return;
    const mapping = dataStore[activeFileName].mapping;
    const data = excelData;
    const alerts = [];
    let riskScore = 100; // 100 is healthy

    // 1. Check Age Anomaly (THPT 2026 usually 2008 born)
    const yearCol = mapping['nam_yy'] || mapping['ngaysinh'];
    if (yearCol) {
        const offAge = data.filter(r => {
            const val = (r[yearCol] || "").toString();
            const year = parseInt(val.match(/\d{4}/)?.[0] || val.match(/\d{2}/)?.[0]);
            return year && (year < 2005 || year > 2009);
        });
        if (offAge.length > 0) {
            alerts.push({
                type: 'warning',
                category: 'Độ tuổi',
                msg: `Phát hiện ${offAge.length} thí sinh có năm sinh bất thường (trước 2005 hoặc sau 2009). Cần kiểm tra xem có phải thí sinh tự do hay không.`,
                icon: 'calendar'
            });
            riskScore -= 10;
        }
    }

    // 2. Check Ethnic Surname vs Ethnic Category
    const nameCol = mapping['hoten'];
    const ethnicCol = mapping['dantoc'];
    if (nameCol && ethnicCol) {
        const ethnicMismatch = data.filter(r => {
            const name = (r[nameCol] || "").toString();
            const ethnic = (r[ethnicCol] || "").toString().trim().toLowerCase();
            const hasEthnicSurname = ETHNIC_SURNAMES.some(s => name.includes(s));
            return hasEthnicSurname && (ethnic === 'kinh' || ethnic === '');
        });
        if (ethnicMismatch.length > 0) {
            alerts.push({
                type: 'danger',
                category: 'Dân tộc',
                msg: `Có ${ethnicMismatch.length} thí sinh có Họ đặc thù dân tộc (Niê, Êban...) nhưng đang để Dân tộc là "Kinh" hoặc trống.`,
                icon: 'users'
            });
            riskScore -= 15;
        }
    }

    // 3. Check CCCD Logic & Duplicates
    const cccdCol = mapping['cccd'];
    if (cccdCol) {
        const cccdCounts = {};
        let logicErrors = 0;
        data.forEach(r => {
            const cccd = (r[cccdCol] || "").toString().trim();
            if (cccd) {
                cccdCounts[cccd] = (cccdCounts[cccd] || 0) + 1;
                
                // Logic check
                if (cccd.length === 12) {
                    const genderDigit = parseInt(cccd.charAt(3));
                    const isFemaleCCCD = (genderDigit % 2 !== 0);
                    const gioiTinhRaw = (r[mapping['gioi_tinh']] || "").toString().toLowerCase().trim();
                    let gioiTinh = "";
                    if (gioiTinhRaw === "0" || gioiTinhRaw.includes("nam")) gioiTinh = "0";
                    else if (gioiTinhRaw === "1" || gioiTinhRaw.includes("nữ")) gioiTinh = "1";

                    if (gioiTinh !== "" && ((gioiTinh === "0" && isFemaleCCCD) || (gioiTinh === "1" && !isFemaleCCCD))) {
                        logicErrors++;
                    }
                } else if (cccd.length > 0) {
                    logicErrors++;
                }
            }
        });

        const duplicates = Object.values(cccdCounts).filter(c => c > 1).length;
        if (duplicates > 0) {
            alerts.push({
                type: 'danger',
                category: 'Trùng lặp',
                msg: `Phát hiện ${duplicates} số CCCD bị trùng lặp trong danh sách.`,
                icon: 'copy'
            });
            riskScore -= 20;
        }
        if (logicErrors > 0) {
            alerts.push({
                type: 'danger',
                category: 'Sai lệch CCCD',
                msg: `Có ${logicErrors} thí sinh có số CCCD sai định dạng hoặc không khớp giới tính.`,
                icon: 'shield-alert'
            });
            riskScore -= 15;
        }
    }

    // 4. Check Contact Info
    const phoneCol = mapping['dienthoai'];
    if (phoneCol) {
        const missingPhone = data.filter(r => !(r[phoneCol] || "").toString().trim());
        if (missingPhone.length > 0) {
            alerts.push({
                type: 'info',
                category: 'Liên lạc',
                msg: `${missingPhone.length} thí sinh chưa có số điện thoại. Sẽ khó khăn khi cần thông báo sửa lỗi hồ sơ.`,
                icon: 'phone'
            });
            riskScore -= 5;
        }
    }

    // 5. Check Registration Balance
    const subjects = ['anh', 'ly', 'hoa', 'sinh', 'su', 'dia', 'gdkt', 'tin', 'cnn', 'cnc', 'nhat', 'trung', 'han', 'phap', 'nga', 'duc'];
    const unmapped = data.filter(row => {
        return !subjects.some(s => isSubjectMarked(row, s, mapping));
    });
    if (unmapped.length > 0) {
        alerts.push({
            type: 'danger',
            category: 'Đăng ký môn',
            msg: `${unmapped.length} thí sinh chưa đăng ký bất kỳ môn tự chọn nào. Đây là lỗi nghiêm trọng.`,
            icon: 'book-open'
        });
        riskScore -= 30;
    }

    // --- Render to UI ---
    const container = document.getElementById('ai-alerts-container');
    if (container) {
        if (alerts.length === 0) {
            document.getElementById('ai-no-alerts').style.display = 'block';
            container.innerHTML = '';
        } else {
            document.getElementById('ai-no-alerts').style.display = 'none';
            container.innerHTML = alerts.map(a => `
                <div class="ai-alert-card ai-alert-${a.type}">
                    <div class="flex gap-4">
                        <div class="ai-alert-icon"><i data-lucide="${a.icon}"></i></div>
                        <div>
                            <div class="ai-alert-category">${a.category}</div>
                            <div class="ai-alert-msg">${a.msg}</div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    const riskEl = document.getElementById('stat-ai-risk');
    const riskHeaderEl = document.getElementById('stat-ai-risk-header');
    const riskBarEl = document.getElementById('stat-ai-risk-bar');

    if (riskEl) {
        riskEl.innerText = Math.max(0, riskScore) + "%";
        riskEl.style.color = riskScore > 80 ? 'var(--success)' : (riskScore > 50 ? 'var(--warning)' : 'var(--danger)');
    }
    if (riskHeaderEl) riskHeaderEl.innerText = Math.max(0, riskScore) + "%";
    if (riskBarEl) {
        riskBarEl.style.width = Math.max(0, riskScore) + "%";
        riskBarEl.style.background = riskScore > 80 ? 'linear-gradient(90deg, #10b981, #34d399)' : (riskScore > 50 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #ef4444, #f87171)');
    }
    const anomalyEl = document.getElementById('stat-ai-anomaly');
    if (anomalyEl) anomalyEl.innerText = alerts.length;

    if (typeof lucide !== 'undefined') lucide.createIcons();
    renderRiskGauge(Math.max(0, riskScore));
}
window.runAIAnalysis = runAIAnalysis;
window.generateExamRooms = generateExamRooms;
window.exportErrorsToExcel = exportErrorsToExcel;
window.exportByClass = exportByClass;
window.search = search;
window.autoFixData = autoFixData;
window.printErrorForms = printErrorForms;
window.applyQuickTemplate = applyQuickTemplate;
window.toggleColumns = toggleColumns;
window.addFilter = addFilter;
window.exportMapping = exportMapping;
window.importMapping = importMapping;

// --- UI INTERACTION & SETTINGS ---
function setValidationPreset(mode) {
    activeValidationMode = mode;
    const selector = document.getElementById('preset-selector');
    if (selector) selector.value = mode;
    saveAppState();
    if (activeFileName) search();
}

function addClassRow(data = null) {
    const placeholder = document.getElementById("class-placeholder");
    if (placeholder) placeholder.style.display = 'none';
    const tr = document.createElement("tr");
    let h = `<td><input type="text" class="form-control class-name-input" value="${data ? data.name : ''}"></td>`;
    for (let i = 0; i < 10; i++) h += `<td style="text-align:center"><input type="checkbox" class="subj-check" ${data && data.subjects[i] ? 'checked' : ''}></td>`;
    h += `<td><button class="btn btn-danger" onclick="this.closest('tr').remove()">Xóa</button></td>`;
    tr.innerHTML = h;
    document.getElementById("class-subject-body")?.appendChild(tr);
}

function showMappingReview(filename) {
    const f = dataStore[filename];
    if (!f) return;
    const fnDisplay = document.getElementById('mapping-filename');
    if (fnDisplay) fnDisplay.innerText = filename;

    const list = document.getElementById('mapping-list');
    if (list) {
        list.innerHTML = CORE_FIELDS.map(field => {
            const sel = f.mapping[field.key] || "";
            const options = `<option value="">--- Chưa chọn ---</option>` + f.columns.map(c => `<option value="${c}" ${c === sel ? 'selected' : ''}>${c}</option>`).join('');
            const sample = sel ? (f.data[0][sel] || "-") : "-";

            return `<div class="mapping-grid">
                        <div style="font-weight:500">${field.label}</div>
                        <select class="mapping-select" data-key="${field.key}">${options}</select>
                        <div style="color:var(--text-muted); font-size:13px">${sample}</div>
                    </div>`;
        }).join('');
    }
    const overlay = document.getElementById('mapping-overlay');
    if (overlay) overlay.style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function getFileSignature(cols) {
    return cols.slice().sort().join('|');
}

function confirmMapping() {
    const fnDisplay = document.getElementById('mapping-filename');
    if (!fnDisplay) return;
    const filename = fnDisplay.innerText.trim();
    const f = dataStore[filename];
    if (!f) return;

    if (!f.mapping) f.mapping = {};
    document.querySelectorAll('.mapping-select').forEach(s => {
        const key = s.dataset.key;
        if (key) f.mapping[key] = s.value;
    });

    // Lưu vào lịch sử mapping theo cấu trúc file (Signature)
    if (f.signature) {
        mappingHistory[f.signature] = { ...f.mapping };
    }

    const overlay = document.getElementById('mapping-overlay');
    if (overlay) overlay.style.display = 'none';
    refreshActiveFileData(filename);
    saveToDB();
    showAlert("💾 Đã lưu cấu hình Mapping và ghi nhớ cấu trúc này!", 'success');
}

function exportMapping() {
    const fnDisplay = document.getElementById('mapping-filename');
    if (!fnDisplay) return;
    const filename = fnDisplay.innerText.trim();
    const f = dataStore[filename];

    const mapping = {};
    document.querySelectorAll('.mapping-select').forEach(s => {
        const key = s.dataset.key;
        if (key && s.value) mapping[key] = s.value;
    });

    if (Object.keys(mapping).length === 0) {
        showAlert("⚠️ Chưa có cấu hình ánh xạ nào để xuất!", 'warning');
        return;
    }

    const dataStr = JSON.stringify({ mapping }, null, 4);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mapping_config_${filename.split('.')[0] || 'default'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showAlert("✅ Đã xuất cấu hình ánh xạ thành công!", 'success');
}

function importMapping(event) {
    const file = event.target.files[0];
    if (!file) return;

    const fnDisplay = document.getElementById('mapping-filename');
    if (!fnDisplay) return;
    const filename = fnDisplay.innerText.trim();
    const f = dataStore[filename];
    if (!f) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const config = JSON.parse(e.target.result);
            if (!config.mapping) {
                showAlert("❌ File JSON không đúng định dạng cấu hình mapping!", 'danger');
                return;
            }

            let matchCount = 0;
            document.querySelectorAll('.mapping-select').forEach(s => {
                const key = s.dataset.key;
                if (key && config.mapping[key]) {
                    // Kiểm tra xem cột có tồn tại trong file hiện tại không
                    const exists = f.columns.includes(config.mapping[key]);
                    if (exists) {
                        s.value = config.mapping[key];
                        matchCount++;

                        // Cập nhật dữ liệu mẫu (Sample data)
                        const sampleDiv = s.nextElementSibling;
                        if (sampleDiv) {
                            const val = f.data[0][s.value];
                            sampleDiv.innerText = (val !== undefined && val !== null) ? val : "-";
                        }
                    }
                }
            });

            if (matchCount > 0) {
                showAlert(`✅ Đã nhập thành công ${matchCount} trường ánh xạ!`, 'success');
            } else {
                showAlert("⚠️ Không có trường nào khớp với cấu trúc file hiện tại.", 'warning');
            }
        } catch (err) {
            console.error(err);
            showAlert("❌ Lỗi khi đọc file JSON!", 'danger');
        }
        event.target.value = ""; // Reset input
    };
    reader.readAsText(file);
}

function saveAppState() {
    const state = {
        header1: document.getElementById('header-row1')?.value,
        header2: document.getElementById('header-row2')?.value,
        merge: document.getElementById('merge-checkbox')?.checked,
        autoHeaderPriority: document.getElementById('auto-header-priority')?.checked,
        validationMode: activeValidationMode,
        selectedColumns: [...document.querySelectorAll(".col-check:checked")].map(cb => cb.value),
        deptName: document.getElementById('cfg-dept-name')?.value,
        schoolName: document.getElementById('cfg-school-name')?.value,
        proctorList: proctorList,
        activeFileName: activeFileName,
        // Dữ liệu phòng thi (generatedRooms) đã được lưu trữ an toàn trong IndexedDB ở app-state.js để tránh lỗi QuotaExceededError trên localStorage khi dữ liệu lớn.
        // Room Tech Settings
        sbdPrefix: document.getElementById('sbd-prefix')?.value,
        sbdPadding: document.getElementById('sbd-padding')?.value,
        sbdStart: document.getElementById('sbd-start')?.value,
        roomCapacity: document.getElementById('room-capacity')?.value,
        roomStartIndex: document.getElementById('room-start-index')?.value,
        roomSortMode: document.getElementById('room-sort-mode')?.value,
        // Constraints
        roomBalance: document.getElementById('room-balance-toggle')?.checked,
        constraintGender: document.getElementById('constraint-gender')?.checked,
        constraintClass: document.getElementById('constraint-class')?.checked,
        constraintSubject: document.getElementById('constraint-subject')?.checked,
        constraintSurname: document.getElementById('constraint-surname')?.checked,
        constraintSource: document.getElementById('constraint-source')?.checked
    };
    localStorage.setItem('vtool_settings', JSON.stringify(state));
}

function updateUnitNames() {
    const dept = document.getElementById('cfg-dept-name')?.value || "SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK";
    const school = document.getElementById('cfg-school-name')?.value || "TRƯỜNG THPT CAO BÁ QUÁT";

    // Update Sidebar
    const sideSchool = document.getElementById('display-school-name');
    if (sideSchool) sideSchool.innerText = school;

    // Update Infographic Header
    const statsDept = document.getElementById('stats-dept-name');
    if (statsDept) statsDept.innerText = dept;

    // NOTE: Removed automatic syncing to Exam Room headers to prevent "bundling" content.
    // The user now has full independent control in the "Xếp phòng thi" tab.

    saveAppState();
}

function restoreAppState() {
    const saved = localStorage.getItem('vtool_settings');
    if (!saved) return;
    const state = JSON.parse(saved);
    if (state.header1 && document.getElementById('header-row1')) document.getElementById('header-row1').value = state.header1;
    if (state.header2 && document.getElementById('header-row2')) document.getElementById('header-row2').value = state.header2;
    if (state.merge !== undefined && document.getElementById('merge-checkbox')) document.getElementById('merge-checkbox').checked = state.merge;
    if (state.autoHeaderPriority !== undefined && document.getElementById('auto-header-priority')) document.getElementById('auto-header-priority').checked = state.autoHeaderPriority;
    if (state.validationMode) setValidationPreset(state.validationMode);

    if (state.selectedColumns && state.selectedColumns.length > 0) {
        document.querySelectorAll(".col-check").forEach(cb => {
            cb.checked = state.selectedColumns.includes(cb.value);
        });
    }

    if (state.deptName && document.getElementById('cfg-dept-name')) document.getElementById('cfg-dept-name').value = state.deptName;
    if (state.schoolName && document.getElementById('cfg-school-name')) document.getElementById('cfg-school-name').value = state.schoolName;
    if (state.proctorList) proctorList = state.proctorList;

    // Restore generatedRooms as fallback if IndexedDB hasn't loaded yet or is empty
    if (state.generatedRooms && state.generatedRooms.length > 0 && generatedRooms.length === 0) {
        generatedRooms = state.generatedRooms;
    }

    // Restore Room Tech Settings
    if (state.sbdPrefix && document.getElementById('sbd-prefix')) document.getElementById('sbd-prefix').value = state.sbdPrefix;
    if (state.sbdPadding && document.getElementById('sbd-padding')) document.getElementById('sbd-padding').value = state.sbdPadding;
    if (state.sbdStart && document.getElementById('sbd-start')) document.getElementById('sbd-start').value = state.sbdStart;
    if (state.roomCapacity && document.getElementById('room-capacity')) document.getElementById('room-capacity').value = state.roomCapacity;
    if (state.roomStartIndex && document.getElementById('room-start-index')) document.getElementById('room-start-index').value = state.roomStartIndex;
    if (state.roomSortMode && document.getElementById('room-sort-mode')) document.getElementById('room-sort-mode').value = state.roomSortMode;

    // Restore Constraints
    if (state.roomBalance !== undefined && document.getElementById('room-balance-toggle')) document.getElementById('room-balance-toggle').checked = state.roomBalance;
    if (state.constraintGender !== undefined && document.getElementById('constraint-gender')) document.getElementById('constraint-gender').checked = state.constraintGender;
    if (state.constraintClass !== undefined && document.getElementById('constraint-class')) document.getElementById('constraint-class').checked = state.constraintClass;
    if (state.constraintSubject !== undefined && document.getElementById('constraint-subject')) document.getElementById('constraint-subject').checked = state.constraintSubject;
    if (state.constraintSurname !== undefined && document.getElementById('constraint-surname')) document.getElementById('constraint-surname').checked = state.constraintSurname;
    if (state.constraintSource !== undefined && document.getElementById('constraint-source')) document.getElementById('constraint-source').checked = state.constraintSource;

    updateUnitNames();
}

// --- ANALYTICS & STATISTICS ---
let subjectChart = null, genderChart = null, blockChart = null;
function renderStatistics() {
    if (!activeFileName || !dataStore[activeFileName]) return;
    const mapping = dataStore[activeFileName].mapping;
    if (!mapping) return;

    const stats = {
        total: excelData.length,
        subjects: {},
        combinations: {},
        blocks: { A00: 0, A01: 0, B00: 0, C00: 0, D01: 0, Khác: 0 },
        gender: { male: 0, female: 0, unknown: 0 },
        classes: {},
        errors: { total: 0, types: {} },
        completeness: 0,
        hasChosen: 0
    };

    const subjects = ['anh', 'ly', 'hoa', 'sinh', 'su', 'dia', 'gdkt', 'tin', 'cnn', 'cnc', 'nhat', 'trung', 'han', 'phap', 'nga', 'duc'];
    const subjectLabels = ["Anh", "Lý", "Hóa", "Sinh", "Sử", "Địa", "GDKTPL", "Tin", "CNN", "CNC", "Nhật", "Trung", "Hàn", "Pháp", "Nga", "Đức"];

    // Initialize subject counts
    subjectLabels.forEach(label => stats.subjects[label] = 0);

    stats.hasChosen = 0;
    excelData.forEach(row => {
        // 1. Gender
        const gCol = mapping['gioi_tinh'];
        if (gCol) {
            const g = (row[gCol] || "").toString().trim();
            if (g === '0' || g.toLowerCase() === 'nam') stats.gender.male++;
            else if (g === '1' || g.toLowerCase() === 'nữ') stats.gender.female++;
            else stats.gender.unknown++;
        }

        // 2. Class
        const cCol = mapping['lop'];
        if (cCol) {
            const cls = (row[cCol] || "KHÁC").toString().trim().toUpperCase();
            stats.classes[cls] = (stats.classes[cls] || 0) + 1;
        }

        // 3. Subjects & Combos
        const chosen = new Set();
        subjects.forEach((sub, idx) => {
            if (isSubjectMarked(row, sub, mapping)) {
                stats.subjects[subjectLabels[idx]]++;
                chosen.add(subjectLabels[idx]);
            }
        });

        // Tỷ lệ chọn môn đúng quy định (chọn đúng 2 môn)
        if (chosen.size === 2) {
            stats.hasChosen++;
        }

        if (chosen.size > 0) {
            const comboKey = Array.from(chosen).sort().join(' - ');
            stats.combinations[comboKey] = (stats.combinations[comboKey] || 0) + 1;
        }

        // 4. Blocks (Traditional)
        if (chosen.has('Lý') && chosen.has('Hóa')) stats.blocks.A00++;
        if (chosen.has('Lý') && chosen.has('Anh')) stats.blocks.A01++;
        if (chosen.has('Hóa') && chosen.has('Sinh')) stats.blocks.B00++;
        if (chosen.has('Sử') && chosen.has('Địa')) stats.blocks.C00++;
        if (chosen.has('Anh')) stats.blocks.D01++;

        // 5. Validation Errors
        const v = validateRow(row, mapping, []);
        if (v.hasError) {
            stats.errors.total++;
            Object.values(v.errorCols).forEach(msg => {
                const type = msg.split(':')[0].replace('⚠️ ', '');
                stats.errors.types[type] = (stats.errors.types[type] || 0) + 1;
            });
        }
    });

    // --- Update Infographic Header ---
    const updateText = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    updateText('stats-current-time', new Date().toLocaleString('vi-VN'));
    updateText('info-total-students', stats.total.toLocaleString());

    const chosenPercent = (stats.hasChosen / stats.total * 100).toFixed(1);
    updateText('info-mapped-percent', `${chosenPercent}%`);
    updateText('info-valid-percent', (stats.total - stats.errors.total).toLocaleString());

    // --- Render Top Subjects & Combos (Bars) ---
    const renderBars = (containerId, data, max, colorClass = '', limit = 5) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, limit);
        container.innerHTML = sorted.map(([name, val]) => `
            <div class="subject-bar-item">
                <div class="subject-name" title="${name}">${name}</div>
                <div class="bar-track">
                    <div class="bar-fill ${colorClass}" style="width: ${(val / max) * 100}%"></div>
                </div>
                <div class="subject-val">${val.toLocaleString()}</div>
            </div>
        `).join('');
    };

    renderBars('top-subjects-list', stats.subjects, stats.total);
    renderBars('top-combos-list', stats.combinations, Math.max(...Object.values(stats.combinations), 1), 'bg-orange', 10);

    // --- Render Subject Grid ---
    const otherGrid = document.getElementById('other-subjects-grid');
    if (otherGrid) {
        otherGrid.innerHTML = Object.entries(stats.subjects).map(([name, val]) => `
            <div class="subject-small-card">
                <div class="subject-small-val">${val.toLocaleString()}</div>
                <div class="subject-small-name">${name}</div>
            </div>
        `).join('');
    }

    // --- Render Full Combinations Table ---
    const fullCombosBody = document.getElementById('full-combos-table-body');
    if (fullCombosBody) {
        const sortedAll = Object.entries(stats.combinations).sort((a, b) => b[1] - a[1]);
        fullCombosBody.innerHTML = sortedAll.map(([combo, count], idx) => `
            <tr>
                <td style="text-align:center">${idx + 1}</td>
                <td style="font-weight:700; color:#4338ca">${combo}</td>
                <td>${count.toLocaleString()}</td>
                <td>${((count / stats.total) * 100).toFixed(1)}%</td>
            </tr>
        `).join('');
    }

    // --- Render NEW Attractive Stats: Class Distribution & Error Types ---
    const summaryBody = document.getElementById('stats-summary-body');
    if (summaryBody) {
        let html = "";

        // Error breakdown
        if (stats.errors.total > 0) {
            html += `<tr style="background:#fff1f2"><td colspan="4" style="font-weight:800; color:#b91c1c"><i data-lucide="alert-triangle"></i> PHÂN TÍCH CÁC SAI SÓT PHỔ BIẾN</td></tr>`;
            html += Object.entries(stats.errors.types).map(([type, count], idx) => `
                <tr>
                    <td style="text-align:center">${idx + 1}</td>
                    <td><span class="badge badge-danger" style="background:#fee2e2; color:#b91c1c; border:none">${type}</span></td>
                    <td>${count}</td>
                    <td>${((count / stats.total) * 100).toFixed(1)}%</td>
                </tr>
            `).join('');
        }

        // Class breakdown
        html += `<tr style="background:#f0f9ff"><td colspan="4" style="font-weight:800; color:#0369a1"><i data-lucide="layout"></i> CƠ CẤU THÍ SINH THEO LỚP</td></tr>`;
        const sortedClasses = Object.entries(stats.classes).sort((a, b) => b[1] - a[1]);
        html += sortedClasses.map(([cls, count], idx) => `
            <tr>
                <td style="text-align:center">${idx + 1}</td>
                <td>Lớp <b>${cls}</b></td>
                <td>${count}</td>
                <td>${((count / stats.total) * 100).toFixed(1)}%</td>
            </tr>
        `).join('');

        summaryBody.innerHTML = html;
    }

    // --- Add Charts back using Chart.js ---
    // Note: We need canvas elements in the HTML for this.
    const chartsHtml = `
        <div class="info-main-grid mt-6" style="grid-template-columns: 1fr 1fr 1fr;">
            <div class="info-panel">
                <div class="panel-title mb-4">Cơ cấu Giới tính</div>
                <canvas id="genderChart" height="200"></canvas>
            </div>
            <div class="info-panel">
                <div class="panel-title mb-4">Top 6 Tổ hợp tự chọn</div>
                <canvas id="blockChart" height="200"></canvas>
            </div>
            <div class="info-panel">
                <div class="panel-title mb-4">Trạng thái hồ sơ</div>
                <canvas id="statusChart" height="200"></canvas>
            </div>
        </div>
    `;

    // Append charts area if not exists
    let chartsContainer = document.getElementById('stats-charts-container');
    if (!chartsContainer) {
        chartsContainer = document.createElement('div');
        chartsContainer.id = 'stats-charts-container';
        document.querySelector('.infographic-dashboard').insertBefore(chartsContainer, document.querySelector('.other-subjects-grid').parentElement);
    }
    chartsContainer.innerHTML = chartsHtml;

    if (typeof Chart !== 'undefined') {
        // Gender Chart
        new Chart(document.getElementById('genderChart'), {
            type: 'doughnut',
            data: {
                labels: ['Nam', 'Nữ', 'Khác'],
                datasets: [{
                    data: [stats.gender.male, stats.gender.female, stats.gender.unknown],
                    backgroundColor: ['#3b82f6', '#ec4899', '#94a3b8']
                }]
            },
            options: { plugins: { legend: { position: 'bottom' } } }
        });

        // Combination Chart (Top 5)
        const topCombos = Object.entries(stats.combinations).sort((a, b) => b[1] - a[1]).slice(0, 6);
        new Chart(document.getElementById('blockChart'), {
            type: 'bar',
            data: {
                labels: topCombos.map(x => x[0]),
                datasets: [{
                    label: 'Số thí sinh',
                    data: topCombos.map(x => x[1]),
                    backgroundColor: '#f59e0b'
                }]
            },
            options: {
                indexAxis: 'y',
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true } }
            }
        });

        // Status Chart
        new Chart(document.getElementById('statusChart'), {
            type: 'pie',
            data: {
                labels: ['Hợp lệ', 'Có lỗi'],
                datasets: [{
                    data: [stats.total - stats.errors.total, stats.errors.total],
                    backgroundColor: ['#10b981', '#ef4444']
                }]
            },
            options: { plugins: { legend: { position: 'bottom' } } }
        });
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderBarChart(id, labels, data, label, color) {
    const canvas = document.getElementById(id);
    if (!canvas || typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label, data, backgroundColor: color, borderRadius: 6 }] },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
}

function search() {
    if (!activeFileName || !dataStore[activeFileName]) return;
    const rd = document.getElementById("result");
    if (!rd) return;

    const mapping = dataStore[activeFileName].mapping;
    const showCols = [...document.querySelectorAll(".col-check:checked")].map(cb => cb.value);

    const classMapping = [...document.querySelectorAll("#class-subject-body tr")].map(tr => ({
        name: tr.querySelector(".class-name-input").value.trim().toUpperCase(),
        allowed: [...tr.querySelectorAll(".subj-check")].map(cb => cb.checked)
    }));

    // Gom nhóm lỗi theo LỚP
    const classGroupedErrors = {};
    const results = excelData.map((row, idx) => {
        const v = validateRow(row, mapping, classMapping);
        if (v.hasError) {
            let rawClassName = mapping && mapping['lop'] ? (row[mapping['lop']] || "Chưa rõ lớp") : "Chưa rõ lớp";
            const className = normalizeClass(rawClassName);

            if (!classGroupedErrors[className]) classGroupedErrors[className] = { students: {} };

            if (!classGroupedErrors[className].students[idx]) {
                const phone = mapping && mapping['dienthoai'] ? (row[mapping['dienthoai']] || "") : "";
                const name = mapping && mapping['hoten'] ? (row[mapping['hoten']] || "Thí sinh") : `Dòng ${idx + 1}`;
                classGroupedErrors[className].students[idx] = { name, phone: phone.toString().trim(), errors: [] };
            }

            Object.entries(v.errorCols).forEach(([col, msg]) => {
                const cleanMsg = msg.replace(/⚠️ (LỖI|CẢNH BÁO|DỮ LIỆU|ĐỊNH DẠNG): /g, '').split('.')[0];
                classGroupedErrors[className].students[idx].errors.push(cleanMsg);
            });
        }
        return { ...row, _validation: v, _originalIndex: idx };
    }).sort((a, b) => (b._validation.hasError ? 1 : 0) - (a._validation.hasError ? 1 : 0));

    const errorCount = results.filter(r => r._validation.hasError).length;
    if (document.getElementById("stat-errors")) document.getElementById("stat-errors").innerText = errorCount;
    if (document.getElementById("stat-total")) document.getElementById("stat-total").innerText = excelData.length;

    // Export to window so ZaloHub can access class errors globally
    window.classGroupedErrors = classGroupedErrors;

    let html = "";

    // RENDER REMINDER LOG
    if (errorCount > 0) {
        html += `<div class="error-log-card">
                <div class="error-log-header flex justify-between items-center" onclick="document.getElementById('error-body').classList.toggle('hidden')"> 
                    <div class="flex items-center gap-2">
                        <i data-lucide="alert-circle" style="width:16px"></i> NHẬT KÝ NHẮC NHỞ THEO LỚP (${Object.keys(classGroupedErrors).length} lớp)
                    </div>
                    <button class="btn btn-sm" style="background:#0ea5e9; color:#fff; font-size:11px; margin-right:40px" 
                        onclick="event.stopPropagation(); openZaloHub('errors')">
                        <i data-lucide="send" style="width:12px; margin-right:4px"></i> TRUNG TÂM ZALO (HUB)
                    </button>
                </div>
                <div id="error-body" class="error-log-body">
                    ${Object.entries(classGroupedErrors).sort().map(([className, data]) => `
                        <div class="class-error-section" style="border-bottom: 2px solid #e2e8f0; margin-bottom: 10px; background: #fff">
                            <div class="flex justify-between items-center" style="padding: 10px 15px; background: #f8fafc; border-bottom: 1px solid #e2e8f0">
                                <span style="font-weight:800; color:var(--primary)">LỚP: ${className}</span>
                                <div class="flex gap-2">
                                    <button class="btn btn-sm" style="background:#059669; color:#fff; font-size:11px" 
                                        onclick="copyClassZaloReminder(this, '${className}', ${JSON.stringify(Object.values(data.students)).replace(/"/g, '&quot;')})">
                                        <i data-lucide="copy" style="width:12px; margin-right:4px"></i> Copy Nhắc Cả Lớp
                                    </button>
                                    <button class="btn btn-sm" style="background:#0ea5e9; color:#fff; font-size:11px" 
                                        onclick="event.stopPropagation(); openZaloHub('errors', '${className}')">
                                        <i data-lucide="send" style="width:12px; margin-right:4px"></i> Gửi Zalo GVCN
                                    </button>
                                </div>
                            </div>
                            ${Object.entries(data.students).map(([idx, s]) => `
                                <div class="error-item flex justify-between items-center" style="gap:15px; padding:8px 15px; font-size:13px; border-bottom: 1px dashed #f1f5f9">
                                    <div onclick="scrollToRow(${idx})" style="cursor:pointer; flex:1">
                                        <span style="font-weight:600; color:var(--danger)">${s.name}</span>: 
                                        <span style="color:var(--text-secondary)">${s.errors.join('; ')}</span>
                                    </div>
                                    <div class="flex gap-2">
                                        <button class="btn btn-sm" style="background:#10b981; color:#fff; font-size:11px; padding:2px 6px" title="Sửa trực tiếp thông tin thí sinh" onclick="openLiveEditor(${idx})"><i data-lucide="edit-3" style="width:12px"></i> Sửa</button>
                                        <button class="btn btn-sm btn-outline" style="color:#0ea5e9; font-size:11px; padding:2px 6px" title="Copy mẫu nhắn tin"
                                            onclick="copyZaloReminder(this, '${s.name.replace(/'/g, "\\'")}', '${className.replace(/'/g, "\\'")}', '${s.errors.join(', ').replace(/'/g, "\\'")}')">
                                            <i data-lucide="copy" style="width:12px"></i> Copy
                                        </button>
                                        ${s.phone ? `<button class="btn btn-sm" style="background:#0ea5e9; color:#fff; font-size:11px; padding:2px 6px;" title="Vừa Copy vừa mở Zalo" 
                                            onclick="sendZaloMessage(this, '${s.phone.replace(/[^0-9]/g, '')}', '${s.name.replace(/'/g, "\\'")}', '${className.replace(/'/g, "\\'")}', '${s.errors.join(', ').replace(/'/g, "\\'")}')">
                                            <i data-lucide="send" style="width:12px"></i> Nhắn Zalo</button>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div></div>`;
    }

    // RENDER TABLE
    html += `<div class="table-area"><div class="table-wrapper"><table><thead><tr>${showCols.map(c => `<th>${c}</th>`).join('')}<th style="width:100px">Thao tác</th></tr></thead><tbody>`;
    results.forEach(row => {
        const errorMsg = Object.values(row._validation.errorCols).join(" | ");
        const studentName = row[mapping['hoten']] || "";
        const className = mapping['lop'] ? (row[mapping['lop']] || "") : "";

        html += `<tr id="row-${row._originalIndex}" class="${row._validation.hasError ? 'row-has-error' : ''}">`;
        showCols.forEach(c => {
            const errorKey = Object.keys(mapping).find(key => mapping[key] === c);
            const msg = errorKey ? row._validation.errorCols[errorKey] : null;
            html += `<td class="${msg ? 'cell-error' : ''}" title="${msg || ''}">${row[c] || ""}</td>`;
        });

        if (row._validation.hasError) {
            const phone = mapping['dienthoai'] ? (row[mapping['dienthoai']] || "").toString().trim().replace(/[^0-9]/g, '') : "";
            const safeName = studentName.replace(/'/g, "\\'");
            const safeClass = className.replace(/'/g, "\\'");
            const safeMsg = errorMsg.replace(/'/g, "\\'").replace(/⚠️ (LỖI|CẢNH BÁO|DỮ LIỆU|ĐỊNH DẠNG): /g, '');
            html += `<td style="white-space:nowrap;">
                <button class="btn btn-sm" style="background:#10b981; color:#fff; font-size:11px; padding:2px 6px; margin-right:4px;" onclick="openLiveEditor(${row._originalIndex})" title="Sửa trực tiếp">Sửa</button>
                <button class="btn btn-sm btn-outline" style="color:#0ea5e9; font-size:11px; padding:2px 6px" 
                    onclick="sendZaloMessage(this, '${phone}', '${safeName}', '${safeClass}', '${safeMsg}')">Zalo</button>
            </td>`;
        } else {
            html += `<td style="white-space:nowrap;">
                <button class="btn btn-sm" style="background:#10b981; color:#fff; font-size:11px; padding:2px 6px;" onclick="openLiveEditor(${row._originalIndex})" title="Sửa trực tiếp">Sửa</button>
            </td>`;
        }

        html += `</tr>`;
    });
    rd.innerHTML = html + "</tbody></table></div></div>";

    const toolbar = document.getElementById("export-toolbar");
    if (toolbar) toolbar.style.display = results.length > 0 ? "flex" : "none";
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function sendZaloMessage(btn, phone, name, className = "", errorText = "") {
    if (!phone) {
        showAlert("⚠️ Thí sinh này không có số điện thoại!", 'warning');
        return;
    }

    const template = `Chào em ${name}${className ? ` (lớp ${className})` : ''}, hồ sơ đăng ký thi TN 2026 của em đang gặp một số lỗi cần chỉnh sửa gấp:
- Nội dung: ${errorText}.
Em vui lòng kiểm tra và phản hồi lại thầy/cô ngay nhé!`;

    const openZalo = () => {
        setTimeout(() => {
            // Thử mở qua app Zalo desktop/mobile nếu có
            window.location.href = `zalo://conversation?phone=${phone}`;
            // Hoặc mở qua web
            setTimeout(() => {
                if (document.hasFocus()) {
                    window.open(`https://zalo.me/${phone}?text=${encodeURIComponent(template)}`, '_blank');
                }
            }, 500);
        }, 300);
    };

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(template).then(() => {
            showCopyFeedback(btn);
            openZalo();
        }).catch(err => {
            fallbackCopyTextToClipboard(template, btn);
            openZalo();
        });
    } else {
        fallbackCopyTextToClipboard(template, btn);
        openZalo();
    }
}

function normalizeClass(name) {
    let n = (name || "").toString().trim().toUpperCase();
    return n.replace(/([A-Z]+)(\d)$/i, (m, letters, num) => letters + '0' + num);
}

function scrollToRow(idx) {
    const row = document.getElementById(`row-${idx}`);
    if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function fallbackCopyTextToClipboard(text, btn) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        showCopyFeedback(btn);
    } catch (err) {
        console.error('Fallback copy failed', err);
    }
    document.body.removeChild(textArea);
}

function copyZaloReminder(btn, name, className, errorText) {
    const template = `Chào em ${name} (lớp ${className}), hồ sơ đăng ký thi TN 2026 của em đang gặp một số lỗi cần chỉnh sửa gấp:
- Nội dung: ${errorText}.
Em vui lòng kiểm tra và phản hồi lại thầy/cô ngay nhé!`;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(template).then(() => showCopyFeedback(btn));
    } else {
        fallbackCopyTextToClipboard(template, btn);
    }
}

function copyClassZaloReminder(btn, className, studentList) {
    let listText = studentList.map((s, i) => `${i + 1}. ${s.name}: ${s.errors.join(', ')}`).join('\n');
    const template = `📢 THÔNG BÁO LỚP ${className.toUpperCase()}:
Các em sau đây có hồ sơ đăng ký thi TN 2026 chưa hoàn thiện, vui lòng kiểm tra và chỉnh sửa gấp để nộp về trường:

${listText}

Trân trọng thông báo!`;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(template).then(() => showCopyFeedback(btn));
    } else {
        fallbackCopyTextToClipboard(template, btn);
    }
}

function showCopyFeedback(btn) {
    if (!btn || btn === window) return;
    const originalHTML = btn.innerHTML;
    const originalBg = btn.style.background;
    btn.innerHTML = '<i data-lucide="check" style="width:14px; margin-right:4px"></i> Đã Copy!';
    btn.style.background = '#10b981';
    btn.style.color = '#fff';
    if (typeof lucide !== 'undefined') lucide.createIcons();
    setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.background = originalBg;
        btn.style.color = '';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 2000);
}

function startBulkZalo() {
    const buttons = document.querySelectorAll('.error-log-body button[onclick*="sendZaloMessage"]');
    if (buttons.length === 0) {
        showAlert("⚠️ Không có tin nhắn nào để gửi!", 'warning');
        return;
    }

    if (confirm(`Hệ thống sẽ mở ${buttons.length} cửa sổ Zalo. Bạn có chắc chắn muốn tiếp tục?`)) {
        buttons.forEach((btn, index) => {
            setTimeout(() => {
                btn.click();
            }, index * 1500); // Gửi giãn cách 1.5 giây
        });
    }
}

function autoFixData() {
    if (!activeFileName || excelData.length === 0) return;
    let fixCount = 0;
    const mapping = dataStore[activeFileName].mapping;

    excelData.forEach(row => {
        // Tự động viết hoa Họ tên
        if (mapping['hoten'] && row[mapping['hoten']]) {
            const old = row[mapping['hoten']];
            row[mapping['hoten']] = old.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ').toUpperCase();
            if (row[mapping['hoten']] !== old) fixCount++;
        }
    });

    if (fixCount > 0) {
        saveToDB();
        search();
        showAlert(`✅ Đã tự động chuẩn hóa ${fixCount} trường dữ liệu.`, 'success');
    } else {
        showAlert("✨ Dữ liệu đã khá chuẩn, không cần sửa thêm.", 'info');
    }
}

function printErrorForms() {
    showAlert("🖨️ Chức năng In phiếu báo lỗi đang được chuyển sang bản Pro Master để có định dạng chuẩn nhất.", 'info');
    setTimeout(() => {
        window.open('in bang diem_KTT_pro - V2.html', '_blank');
    }, 1500);
}

// --- FINAL UTILITIES ---
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('vtool_theme', isDark ? 'dark' : 'light');
    const icon = document.getElementById('theme-icon');
    const text = document.getElementById('theme-text');
    if (icon) icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    if (text) text.innerText = isDark ? 'CHẾ ĐỘ SÁNG' : 'CHẾ ĐỘ TỐI';
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function scrollToTop() {
    const content = document.querySelector('.content-body');
    if (content) content.scrollTo({ top: 0, behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
}

// JSON Management
function exportVillageConfig() {
    const blob = new Blob([JSON.stringify(graduationRules, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `VTOOL_VILLAGE_RULES.json`;
    a.click();
}

function importVillageConfig(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            graduationRules = JSON.parse(e.target.result);
            localStorage.setItem('vtool_village_mapping', JSON.stringify(graduationRules));
            renderVillageRules();
            showAlert("✅ Đã nhập cấu hình thành công!", 'success');
        } catch (err) { alert("Lỗi đọc file!"); }
    };
    reader.readAsText(file);
}

function exportSystemData() {
    const data = { dataStore, graduationRules, timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `VTOOL_BACKUP.json`;
    a.click();
}

async function importSystemData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const json = JSON.parse(e.target.result);
            if (json.dataStore) {
                dataStore = json.dataStore;
                graduationRules = json.graduationRules || graduationRules;
                await saveToDB();
                showAlert("✅ Đã khôi phục hệ thống!", 'success');
                setTimeout(() => window.location.reload(), 1000);
            }
        } catch (err) { alert("Lỗi khôi phục!"); }
    };
    reader.readAsText(file);
}

// Initial Theme Restore
if (localStorage.getItem('vtool_theme') === 'dark') {
    document.body.classList.add('dark-mode');
    setTimeout(() => {
        const icon = document.getElementById('theme-icon');
        const text = document.getElementById('theme-text');
        if (icon) icon.setAttribute('data-lucide', 'sun');
        if (text) text.innerText = 'CHẾ ĐỘ SÁNG';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 100);
}

// Event Exports
window.toggleDarkMode = toggleDarkMode;
window.scrollToTop = scrollToTop;
window.exportVillageConfig = exportVillageConfig;
window.importVillageConfig = importVillageConfig;
window.exportSystemData = exportSystemData;
window.importSystemData = importSystemData;
window.exportGraduationAnalysisPDF = () => showAlert("🚀 Tính năng Xuất PDF đang được phát triển và sẽ sớm ra mắt trong bản cập nhật tới!", 'info');
function updateCompareDropdowns() {
    const files = Object.keys(dataStore);
    ['merge-file-1', 'merge-file-2', 'compare-file-1', 'compare-file-2'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = files.map(f => `<option value="${f}">${f}</option>`).join('');
    });
}

async function mergeAllFiles() {
    const f1 = document.getElementById('merge-file-1').value;
    const f2 = document.getElementById('merge-file-2').value;
    if (!f1 || !f2 || f1 === f2) { alert("Vui lòng chọn 2 tệp khác nhau!"); return; }

    const s1 = dataStore[f1], s2 = dataStore[f2];
    const m1 = s1.mapping['cccd'], m2 = s2.mapping['cccd'];
    if (!m1 || !m2) { alert("Cả 2 tệp phải được Map cột CCCD!"); return; }

    const mergedData = s1.data.map(row => {
        const match = s2.data.find(r => (r[m2] || "").toString().trim() === (row[m1] || "").toString().trim());
        return match ? { ...row, ...match } : row;
    });

    const newName = `Merged_${f1}_${f2}`;
    dataStore[newName] = {
        columns: [...new Set([...s1.columns, ...s2.columns])],
        data: mergedData,
        mapping: { ...s1.mapping, ...s2.mapping },
        timestamp: new Date().toLocaleString('vi-VN')
    };
    await saveToDB();
    renderFileList();
    showAlert(`✅ Đã ghép thành công vào tệp: ${newName}`, 'success');
}

async function compareTwoFiles() {
    const f1 = document.getElementById('compare-file-1').value;
    const f2 = document.getElementById('compare-file-2').value;
    if (!f1 || !f2 || f1 === f2) { alert("Vui lòng chọn 2 tệp khác nhau!"); return; }
    alert(`🔍 Tính năng đối chiếu đang xử lý giữa ${f1} và ${f2}...`);
}

// Event Exports
window.updateCompareDropdowns = updateCompareDropdowns;
window.mergeAllFiles = mergeAllFiles;
window.compareTwoFiles = compareTwoFiles;


// --- GRADUATION CRITERIA MODAL ---
function openVillageModal() {
    document.getElementById('village-modal-overlay').style.display = 'flex';
    renderVillageRules();
}
function closeVillageModal() { document.getElementById('village-modal-overlay').style.display = 'none'; }

function switchVillageTab(tab) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    event.currentTarget.classList.add('active');
}

function addGraduationRule(type) {
    if (type === 'address') {
        const kw = document.getElementById('v-keyword').value.trim();
        const area = document.getElementById('v-area-address').value.trim();
        if (kw && area) graduationRules.address[kw] = area;
    } else if (type === 'school') {
        const code = document.getElementById('v-school-code').value.trim();
        const eth = document.getElementById('v-school-ethnic-req').value;
        const area = document.getElementById('v-area-school').value.trim();
        if (code && area) graduationRules.school[`${code}|${eth}`] = area;
    } else if (type === 'ethnic') {
        const typeEth = document.getElementById('v-ethnic-type').value;
        const area = document.getElementById('v-area-ethnic').value.trim();
        if (area) graduationRules.ethnic[typeEth] = area;
    }
    renderVillageRules();
    localStorage.setItem('vtool_village_mapping', JSON.stringify(graduationRules));
}

function renderVillageRules() {
    const body = document.getElementById('village-mapping-body');
    if (!body) return;
    let html = "";
    Object.entries(graduationRules.address).forEach(([kw, area]) => {
        html += `<tr><td>Địa chỉ chứa: <b>${kw}</b></td><td>${area}</td><td><button class="btn-refresh-mini" onclick="deleteRule('address', '${kw}')"><i data-lucide="trash-2"></i></button></td></tr>`;
    });
    Object.entries(graduationRules.school).forEach(([key, area]) => {
        const [code, eth] = key.split('|');
        html += `<tr><td>Trường <b>${code}</b> (${eth})</td><td>${area}</td><td><button class="btn-refresh-mini" onclick="deleteRule('school', '${key}')"><i data-lucide="trash-2"></i></button></td></tr>`;
    });
    body.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function applyQuickTemplate(type) {
    const templates = {
        'dkdt': ['hoten', 'cccd', 'ngaysinh', 'dantoc', 'toan', 'van', 'anh', 'lop'],
        'cntn': ['hoten', 'cccd', 'lop', 'dantoc', 'dien_tn', 'thuong_tru'],
        'diachi': ['hoten', 'cccd', 'thuong_tru', 'dienthoai', 'email']
    };
    const targetKeys = templates[type] || [];
    const checkboxes = document.querySelectorAll('.col-check');
    const mapping = dataStore[activeFileName]?.mapping || {};

    checkboxes.forEach(cb => {
        const colName = cb.value;
        const key = Object.keys(mapping).find(k => mapping[k] === colName);
        cb.checked = targetKeys.includes(key);
    });
    saveAppState();
    search();
}

function toggleColumns(checked) {
    document.querySelectorAll('.col-check').forEach(cb => cb.checked = checked);
    saveAppState();
    search();
}

function addFilter() {
    const container = document.getElementById("filters");
    if (!container) return;
    const div = document.createElement("div");
    div.className = "filter-row flex gap-2 mb-2";

    let options = columnNames.map(c => `<option value="${c}">${c}</option>`).join('');
    div.innerHTML = `
        <select class="form-control" style="flex:1">${options}</select>
        <select class="form-control" style="width:150px">
            <option>Chứa</option>
            <option>Không chứa</option>
            <option>Bằng</option>
            <option>Trống</option>
        </select>
        <input type="text" class="form-control" style="flex:1" placeholder="Giá trị...">
        <button class="btn btn-refresh-mini" onclick="this.parentElement.remove(); search();"><i data-lucide="trash-2"></i></button>
    `;
    container.appendChild(div);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function deleteRule(type, key) {
    delete graduationRules[type][key];
    renderVillageRules();
    localStorage.setItem('vtool_village_mapping', JSON.stringify(graduationRules));
}

window.openVillageModal = openVillageModal;
window.deleteRule = deleteRule;
window.renderStatistics = renderStatistics;

function addLogicRule() {
    const container = document.getElementById("logic-rules");
    if (!container) return;
    const div = document.createElement("div");
    div.className = "filter-row flex gap-2 mb-2";

    let options = columnNames.map(c => `<option value="${c}">${c}</option>`).join('');
    div.innerHTML = `
        <select class="form-control" style="flex:1">${options}</select>
        <select class="form-control" style="width:150px">
            <option>Phải bằng</option>
            <option>Phải khác</option>
            <option>Phải có dữ liệu</option>
            <option>Phải trống</option>
        </select>
        <input type="text" class="form-control" style="flex:1" placeholder="Giá trị so sánh...">
        <button class="btn btn-refresh-mini" onclick="this.parentElement.remove(); search();"><i data-lucide="trash-2"></i></button>
    `;
    container.appendChild(div);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}
window.addLogicRule = addLogicRule;

// --- EXPORT UTILS ---
function sanitizeSheetName(name) {
    if (!name) return 'Sheet';
    // Remove invalid characters: \ / ? * [ ] :
    let safeName = name.toString().replace(/[\\\/\?\*\[\]\:]/g, '');
    // Limit to 31 characters
    return safeName.substring(0, 31);
}

function cleanData(val) {
    if (val === null || val === undefined) return "";
    // Remove illegal XML characters (control characters) that corrupt ExcelJS
    return val.toString().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "").trim();
}

// --- EXPORT STYLES (Decree 30) ---
const EXCEL_STYLES = {
    deptHeader: { font: { name: 'Times New Roman', size: 11 }, alignment: { horizontal: 'center', vertical: 'middle', wrapText: false } },
    mottoHeader: { font: { name: 'Times New Roman', bold: true, size: 11 }, alignment: { horizontal: 'center', vertical: 'middle', wrapText: false } },
    title: { font: { name: 'Times New Roman', bold: true, size: 14 }, alignment: { horizontal: 'center', vertical: 'middle' } },
    tableHeader: {
        font: { name: 'Times New Roman', bold: true, size: 11 },
        alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
        border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' }, bgColor: { argb: 'FFE8E8E8' } }
    },
    cell: {
        font: { name: 'Times New Roman', size: 11 },
        border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
        alignment: { vertical: 'middle', wrapText: true }
    },
    signature: { font: { name: 'Times New Roman', italic: true, size: 11 }, alignment: { horizontal: 'center', vertical: 'middle' } },
    signatureName: { font: { name: 'Times New Roman', bold: true, size: 11 }, alignment: { horizontal: 'center', vertical: 'middle' } },
    printSetup: {
        paperSize: 9, // A4
        orientation: 'portrait',
        fitToPage: true,
        fitToWidth: 1,
        margins: { left: 0.787, right: 0.59, top: 0.787, bottom: 0.787, header: 0.3, footer: 0.3 }, // ~20mm left, 15mm others
        horizontalCentered: true
    }
};

function applyDecree30Header(ws, title, colCount = 6) {
    const startRow = ws.rowCount + 1;
    const deptName = document.getElementById('excel-dept-name')?.value || "SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK";
    const boardName = document.getElementById('excel-board-name')?.value || "HỘI ĐỒNG THI TRƯỜNG THPT CAO BÁ QUÁT";
    const examName = document.getElementById('excel-exam-name')?.value || "";

    const splitCol = Math.ceil(colCount * 0.45);
    
    ws.mergeCells(startRow, 1, startRow, splitCol);
    const cellDept = ws.getCell(startRow, 1);
    cellDept.value = deptName.toUpperCase();
    cellDept.style = { ...EXCEL_STYLES.deptHeader };

    ws.mergeCells(startRow + 1, 1, startRow + 1, splitCol);
    const cellBoard = ws.getCell(startRow + 1, 1);
    cellBoard.value = boardName.toUpperCase();
    cellBoard.font = { ...EXCEL_STYLES.deptHeader.font, bold: true };
    cellBoard.alignment = { ...EXCEL_STYLES.deptHeader.alignment };
    cellBoard.border = { bottom: { style: 'thin' } };

    ws.getRow(startRow).height = 25;
    ws.getRow(startRow + 1).height = 25;

    ws.mergeCells(startRow, splitCol + 1, startRow, colCount);
    const cellMotto1 = ws.getCell(startRow, splitCol + 1);
    cellMotto1.value = "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM";
    cellMotto1.style = { ...EXCEL_STYLES.mottoHeader };

    ws.mergeCells(startRow + 1, splitCol + 1, startRow + 1, colCount);
    const cellMotto2 = ws.getCell(startRow + 1, splitCol + 1);
    cellMotto2.value = "Độc lập - Tự do - Hạnh phúc";
    cellMotto2.style = { ...EXCEL_STYLES.mottoHeader };
    cellMotto2.font = { ...EXCEL_STYLES.mottoHeader.font, underline: true, bold: true };

    ws.addRow([]);
    ws.getRow(startRow + 2).height = 10;

    const titleRow = ws.addRow([examName ? (examName.toUpperCase() + "\n" + title.toUpperCase()) : title.toUpperCase()]);
    ws.mergeCells(titleRow.number, 1, titleRow.number, colCount);
    titleRow.height = examName ? 50 : 35;
    const cellTitle = ws.getCell(titleRow.number, 1);
    cellTitle.font = { ...EXCEL_STYLES.title.font, size: examName ? 14 : 16 };
    cellTitle.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    ws.addRow([]);
    ws.getRow(titleRow.number + 1).height = 10;

    return titleRow.number + 2;
}

/**
 * Adds a collection record (biên bản thu bài) to the worksheet
 * Compliant with Decree 30/2020/NĐ-CP reporting standards
 */
function addCollectionRecord(ws, rowIdx, colCount = 8) {
    ws.addRow([]); // Spacer
    const fields = [
        `Tổng số bài thi: ............ (bằng chữ:.......................................................................)`,
        `Tổng số tờ: ............ (bằng chữ:.......................................................................)`,
        `Thu xong bài thi hồi ..........giờ...........phút, ngày..........tháng..........năm..........`,
        `Giám thị coi thi số 1 (ký và ghi rõ họ tên): .......................................................................`,
        `Giám thị coi thi số 2 (ký và ghi rõ họ tên): .......................................................................`
    ];

    fields.forEach(text => {
        const row = ws.addRow(['', text]);
        ws.mergeCells(row.number, 2, row.number, colCount);
        row.getCell(2).font = { italic: true, size: 10, name: 'Times New Roman' };
        row.height = 25;
        row.getCell(2).alignment = { vertical: 'middle' };
    });

    return ws.rowCount;
}

function addExcelSignatures(ws, rowIdx, colCount = 6, proctors = []) {
    const startRow = rowIdx + 2;
    const splitCol = Math.floor(colCount / 2);

    const creatorName = proctors[0]?.name || document.getElementById('excel-creator-name')?.value || "";
    const leaderName = proctors[1]?.name || document.getElementById('excel-leader-name')?.value || "";

    // Left Side: Người lập danh sách / GT1
    ws.mergeCells(startRow, 1, startRow, splitCol);
    const cellL1 = ws.getCell(startRow, 1);
    cellL1.value = proctors.length > 0 ? "GIÁM THỊ COI THI SỐ 1" : "NGƯỜI LẬP DANH SÁCH";
    cellL1.style = { ...EXCEL_STYLES.signatureName };

    ws.mergeCells(startRow + 1, 1, startRow + 1, splitCol);
    const cellL2 = ws.getCell(startRow + 1, 1);
    cellL2.value = "(Ký và ghi rõ họ tên)";
    cellL2.style = { ...EXCEL_STYLES.signature };

    if (creatorName) {
        ws.mergeCells(startRow + 5, 1, startRow + 5, splitCol);
        const cellL3 = ws.getCell(startRow + 5, 1);
        cellL3.value = creatorName;
        cellL3.style = { ...EXCEL_STYLES.signatureName };
    }

    // Right Side: Phụ trách chuyên môn / GT2
    ws.mergeCells(startRow, splitCol + 1, startRow, colCount);
    const cellR1 = ws.getCell(startRow, splitCol + 1);
    cellR1.value = proctors.length > 1 ? "GIÁM THỊ COI THI SỐ 2" : "PHỤ TRÁCH CHUYÊN MÔN";
    cellR1.style = { ...EXCEL_STYLES.signatureName };

    ws.mergeCells(startRow + 1, splitCol + 1, startRow + 1, colCount);
    const cellR2 = ws.getCell(startRow + 1, splitCol + 1);
    cellR2.value = "(Ký tên, đóng dấu)";
    cellR2.style = { ...EXCEL_STYLES.signature };

    if (leaderName) {
        ws.mergeCells(startRow + 5, splitCol + 1, startRow + 5, colCount);
        const cellR3 = ws.getCell(startRow + 5, splitCol + 1);
        cellR3.value = leaderName;
        cellR3.style = { ...EXCEL_STYLES.signatureName };
    }

    ws.getRow(startRow).height = 20;
    ws.getRow(startRow + 1).height = 20;
    ws.getRow(startRow + 5).height = 25;
}

// addCollectionRecord consolidated above

function getGlobalStudentSubjects(s, currentMapping = null) {
    const electiveKeys = ['ly', 'hoa', 'sinh', 'su', 'dia', 'gdkt', 'tin', 'cnn', 'cnc', 'anh', 'nhat', 'trung', 'han', 'phap', 'nga', 'duc'];
    const subjectLabelsMap = {
        'anh': 'Anh', 'ly': 'Lý', 'hoa': 'Hóa', 'sinh': 'Sinh', 'su': 'Sử', 'dia': 'Địa', 'gdkt': 'GDKTPL', 'tin': 'Tin', 'cnn': 'CNN', 'cnc': 'CNC',
        'nhat': 'Nhật', 'trung': 'Trung', 'han': 'Hàn', 'phap': 'Pháp', 'nga': 'Nga', 'duc': 'Đức'
    };
    
    if (s._resolvedSubjects) {
        return electiveKeys.filter(k => s._resolvedSubjects[k]).map(k => subjectLabelsMap[k] || k.toUpperCase());
    }

    let mapping = currentMapping;
    if (!mapping) {
        if (typeof activeFileName !== 'undefined' && activeFileName && dataStore[activeFileName]?.mapping) {
            mapping = dataStore[activeFileName].mapping;
        } else {
            const fallbackFile = Object.keys(dataStore).find(fn => dataStore[fn]?.mapping?.hoten);
            if (fallbackFile) mapping = dataStore[fallbackFile].mapping;
        }
    }
    if (!mapping) return [];
    return electiveKeys.filter(sub => isSubjectMarked(s, sub, mapping)).map(sub => subjectLabelsMap[sub] || sub.toUpperCase());
}

function getFullStudentSubjects(s, currentMapping = null) {
    const allKeys = ['toan', 'van', 'ly', 'hoa', 'sinh', 'su', 'dia', 'gdkt', 'tin', 'cnn', 'cnc', 'anh', 'nhat', 'trung', 'han', 'phap', 'nga', 'duc'];
    const subjectLabelsMap = {
        'toan': 'Toán', 'van': 'Văn', 'anh': 'Anh', 'ly': 'Lý', 'hoa': 'Hóa', 'sinh': 'Sinh', 'su': 'Sử', 'dia': 'Địa', 'gdkt': 'GDKTPL', 'tin': 'Tin', 'cnn': 'CNN', 'cnc': 'CNC',
        'nhat': 'Nhật', 'trung': 'Trung', 'han': 'Hàn', 'phap': 'Pháp', 'nga': 'Nga', 'duc': 'Đức'
    };
    
    if (s._resolvedSubjects) {
        return allKeys.filter(k => s._resolvedSubjects[k]).map(k => subjectLabelsMap[k] || k.toUpperCase());
    }

    let mapping = currentMapping;
    if (!mapping) {
        if (typeof activeFileName !== 'undefined' && activeFileName && dataStore[activeFileName]?.mapping) {
            mapping = dataStore[activeFileName].mapping;
        } else {
            const fallbackFile = Object.keys(dataStore).find(fn => dataStore[fn]?.mapping?.hoten);
            if (fallbackFile) mapping = dataStore[fallbackFile].mapping;
        }
    }
    if (!mapping) return [];
    return allKeys.filter(sub => isSubjectMarked(s, sub, mapping)).map(sub => subjectLabelsMap[sub] || sub.toUpperCase());
}

// --- EXAM ROOM EXPORTS ---
async function exportExamRoomsToExcel() {
    try {
        if (generatedRooms.length === 0) {
            showAlert("⚠️ Vui lòng thực hiện xếp phòng trước khi xuất Excel!", "warning");
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const hasActiveFile = activeFileName && dataStore[activeFileName];
        const mapping = hasActiveFile ? dataStore[activeFileName].mapping : {};
        const subjects = ['ly', 'hoa', 'sinh', 'su', 'dia', 'gdkt', 'tin', 'cnn', 'cnc', 'anh', 'nhat', 'trung', 'han', 'phap', 'nga', 'duc'];
        const subjectLabels = ["Lý", "Hóa", "Sinh", "Sử", "Địa", "GDKTPL", "Tin", "CNN", "CNC", "Anh", "Nhật", "Trung", "Hàn", "Pháp", "Nga", "Đức"];

        const getStudentSubjects = (s) => getGlobalStudentSubjects(s, mapping);

        // --- BẢNG TỔNG HỢP GIÁM THỊ ĐÃ ĐƯỢC CHUYỂN SANG MODULE PROCTORPRO ---
        // (Đã gỡ bỏ logic cũ tại đây để đảm bảo tính đồng bộ và nhẹ tệp Excel)

        // --- 1. Master Sheet ---
        const masterSheet = workbook.addWorksheet(sanitizeSheetName('TỔNG HỢP CHUNG'));
        masterSheet.pageSetup = EXCEL_STYLES.printSetup;
        applyDecree30Header(masterSheet, 'DANH SÁCH THÍ SINH DỰ THI', 8);
        const hMaster = masterSheet.addRow(['STT', 'Phòng', 'SBD', 'Họ và Tên', 'Lớp', 'Môn đăng ký', 'Ghi chú']);
        hMaster.eachCell(c => c.style = { ...EXCEL_STYLES.tableHeader });

        let sttMaster = 1;
        generatedRooms.forEach(room => {
            if (room.isVirtual) {
                const r = masterSheet.addRow([sttMaster++, `Phòng ${room.number}`, '', '(Phòng thi bổ sung)', '', '', '']);
                r.eachCell(c => c.style = { ...EXCEL_STYLES.cell });
                return;
            }
            room.students.forEach(std => {
                const subs = getFullStudentSubjects(std, mapping).join(', ');
                const r = masterSheet.addRow([sttMaster++, `Phòng ${room.number}`, cleanData(std.sbd), cleanData(std.hoten), cleanData(std.lop), subs, '']);
                r.eachCell(c => c.style = { ...EXCEL_STYLES.cell });
            });
        });

        masterSheet.getColumn(1).width = 6;
        masterSheet.getColumn(2).width = 15;
        masterSheet.getColumn(3).width = 15;
        masterSheet.getColumn(4).width = 25;
        masterSheet.getColumn(5).width = 12;
        masterSheet.getColumn(6).width = 30;
        masterSheet.getColumn(7).width = 15;

        // --- 2. Matrix Statistics ---
        const statsSheet = workbook.addWorksheet(sanitizeSheetName('THỐNG KÊ CHI TIẾT'));
        statsSheet.pageSetup = { ...EXCEL_STYLES.printSetup, orientation: 'landscape' };
        applyDecree30Header(statsSheet, 'BẢNG THỐNG KÊ CHI TIẾT SỐ LƯỢNG MÔN THI THEO PHÒNG VÀ CA', Math.max(8, generatedRooms.length + 3));

        const roomHeaders = generatedRooms.map(r => `Phòng ${r.number}`);
        const mainHeader = statsSheet.addRow(['Môn thi', 'Ca', 'Tổng số', ...roomHeaders]);
        mainHeader.eachCell(c => c.style = { ...EXCEL_STYLES.tableHeader });

        const matrix = {};
        subjectLabels.forEach(label => {
            matrix[label] = { ca1: { total: 0, rooms: {} }, ca2: { total: 0, rooms: {} } };
        });

        generatedRooms.forEach(room => {
            room.students.forEach(s => {
                const subs = getStudentSubjects(s);
                if (subs[0]) {
                    const m = subs[0];
                    matrix[m].ca1.total++;
                    matrix[m].ca1.rooms[room.number] = (matrix[m].ca1.rooms[room.number] || 0) + 1;
                }
                if (subs[1]) {
                    const m = subs[1];
                    matrix[m].ca2.total++;
                    matrix[m].ca2.rooms[room.number] = (matrix[m].ca2.rooms[room.number] || 0) + 1;
                }
            });
        });

        Object.keys(matrix).forEach(sub => {
            ['ca1', 'ca2'].forEach(caKey => {
                const data = matrix[sub][caKey];
                if (data.total > 0) {
                    const rowData = [sub, caKey === 'ca1' ? 'Ca 01' : 'Ca 02', data.total];
                    generatedRooms.forEach(room => { rowData.push(data.rooms[room.number] || ''); });
                    const r = statsSheet.addRow(rowData);
                    r.eachCell(c => c.style = { ...EXCEL_STYLES.cell });
                }
            });
        });

        statsSheet.getColumn(1).width = 20;
        statsSheet.getColumn(2).width = 12;
        statsSheet.getColumn(3).width = 15;
        for(let i = 0; i < generatedRooms.length; i++) {
            statsSheet.getColumn(4 + i).width = 12;
        }

        // --- 3. Individual Room Sheets ---
        for (const room of generatedRooms) {
            const wsCall = workbook.addWorksheet(sanitizeSheetName(`P.${room.number}`));
            wsCall.pageSetup = EXCEL_STYLES.printSetup;
            applyDecree30Header(wsCall, `DANH SÁCH GỌI THÍ SINH VÀO PHÒNG - PHÒNG THI SỐ: ${room.number}`, 6);
            const hCall = wsCall.addRow(['STT', 'SBD', 'Họ và Tên', 'Lớp', 'Ca 01', 'Ca 02']);
            hCall.eachCell(c => c.style = { ...EXCEL_STYLES.tableHeader });
            room.students.forEach((s, idx) => {
                const subs = getStudentSubjects(s);
                const r = wsCall.addRow([idx + 1, cleanData(s.sbd), cleanData(s.hoten), cleanData(s.lop), subs[0] || '', subs[1] || '']);
                r.eachCell(c => c.style = { ...EXCEL_STYLES.cell });
            });
            addExcelSignatures(wsCall, wsCall.rowCount + 2, 6, room.proctorsVan || []);

            wsCall.getColumn(1).width = 6;
            wsCall.getColumn(2).width = 15;
            wsCall.getColumn(3).width = 25;
            wsCall.getColumn(4).width = 12;
            wsCall.getColumn(5).width = 15;
            wsCall.getColumn(6).width = 15;

            const sessions = [
                { id: 'Van', label: 'MÔN VĂN', sheetSuffix: 'VAN' },
                { id: 'Toan', label: 'MÔN TOÁN', sheetSuffix: 'TOAN' },
                { id: 'Ca1', label: 'TỔ HỢP - CA 1', sheetSuffix: 'CA1', index: 0 },
                { id: 'Ca2', label: 'TỔ HỢP - CA 2', sheetSuffix: 'CA2', index: 1 }
            ];

            for (const session of sessions) {
                const wsCollect = workbook.addWorksheet(sanitizeSheetName(`TB_P${room.number}_${session.sheetSuffix}`));
                wsCollect.pageSetup = EXCEL_STYLES.printSetup;
                applyDecree30Header(wsCollect, `DANH SÁCH THU BÀI THI - ${session.label}\n- PHÒNG THI SỐ: ${room.number}`, 8);

                const hCollect = wsCollect.addRow(['STT', 'SBD', 'Họ và Tên', 'Lớp', 'Môn thi', 'Số tờ', 'Mã đề', 'Ký tên']);
                hCollect.eachCell(c => c.style = { ...EXCEL_STYLES.tableHeader });

                const sessionStudents = room.students.filter(s => {
                    if (session.id === 'Van' || session.id === 'Toan') return true;
                    return getStudentSubjects(s)[session.index] !== undefined;
                });

                sessionStudents.forEach((s, idx) => {
                    let displaySub = "";
                    if (session.id === 'Van') displaySub = "Ngữ Văn";
                    else if (session.id === 'Toan') displaySub = "Toán";
                    else displaySub = getStudentSubjects(s)[session.index] || "";

                    const r = wsCollect.addRow([idx + 1, cleanData(s.sbd), cleanData(s.hoten), cleanData(s.lop), displaySub, '', '', '']);
                    r.eachCell(c => c.style = { ...EXCEL_STYLES.cell });
                });
                addCollectionRecord(wsCollect, wsCollect.rowCount + 2, 8);

                wsCollect.getColumn(1).width = 6;
                wsCollect.getColumn(2).width = 15;
                wsCollect.getColumn(3).width = 25;
                wsCollect.getColumn(4).width = 12;
                wsCollect.getColumn(5).width = 20;
                wsCollect.getColumn(6).width = 10;
                wsCollect.getColumn(7).width = 12;
                wsCollect.getColumn(8).width = 15;
            }
        }

        // --- 4. Diagrams ---
        const diagramSheet = workbook.addWorksheet(sanitizeSheetName('SƠ ĐỒ CHỖ NGỒI'));
        let diagramRow = 1;
        generatedRooms.forEach(room => {
            diagramSheet.mergeCells(diagramRow, 1, diagramRow, 4);
            const cellTitle = diagramSheet.getCell(diagramRow, 1);
            cellTitle.value = `SƠ ĐỒ CHỖ NGỒI - PHÒNG: ${room.number}`;
            cellTitle.font = { bold: true, size: 12 };
            cellTitle.alignment = { horizontal: 'center' };
            diagramRow++;

            for (let r = 0; r < 6; r++) {
                for (let c = 0; c < 4; c++) {
                    const sIdx = r * 4 + c;
                    const s = room.students[sIdx];
                    const cell = diagramSheet.getCell(diagramRow + r, c + 1);
                    cell.value = s ? `[${sIdx + 1}]\n${cleanData(s.hoten).split(' ').pop()}\n${cleanData(s.sbd)}` : `[${sIdx + 1}]\n(TRỐNG)`;
                    cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                }
                diagramSheet.getRow(diagramRow + r).height = 45;
            }
            diagramRow += 8;
        });

        for (let c = 1; c <= 4; c++) {
            diagramSheet.getColumn(c).width = 18;
        }

        // --- 5. Labels ---
        const labelSheet = workbook.addWorksheet(sanitizeSheetName('NHÃN CHỖ NGỒI'));
        let lRow = 1, lCol = 1;
        for (let i = 1; i <= 4; i++) labelSheet.getColumn(i).width = 28;

        for (const room of generatedRooms) {
            for (const s of room.students) {
                const cell = labelSheet.getCell(lRow, lCol);
                cell.value = {
                    richText: [
                        { text: `PHÒNG THI: ${room.number}\n`, font: { bold: true, size: 9, color: { argb: 'FF475569' } } },
                        { text: `SBD: ${cleanData(s.sbd)}\n`, font: { bold: true, size: 16, color: { argb: 'FFCC0000' } } },
                        { text: `${cleanData(s.hoten)}\n`, font: { bold: true, size: 11 } },
                        { text: `Lớp: ${cleanData(s.lop)}\n`, font: { size: 8, italic: true } }
                    ]
                };
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                cell.border = { top: { style: 'medium' }, left: { style: 'medium' }, bottom: { style: 'medium' }, right: { style: 'medium' } };
                labelSheet.getRow(lRow).height = 100;
                if (++lCol > 4) { lCol = 1; lRow++; }
            }
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `HO_SO_PHONG_THI_PRO_MAX_${new Date().getTime()}.xlsx`;
        a.click();
        showAlert("✅ Đã xuất bộ hồ sơ phòng thi Pro Max đầy đủ nhất!", "success");
    } catch (err) {
        console.error("Lỗi xuất Excel Pro Max:", err);
        showAlert("❌ Có lỗi xảy ra khi tạo tệp Excel. Vui lòng kiểm tra lại dữ liệu và thử lại!", "danger");
    }
}

function showSeatingDiagram(roomNum) {
    const room = generatedRooms.find(r => r.number == roomNum);
    if (!room) return;

    let overlay = document.getElementById('diagram-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'diagram-overlay';
        overlay.className = 'mapping-overlay';
        overlay.style.zIndex = '10002';
        document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
        <div class="mapping-modal" style="max-width: 800px; width:95%">
            <div class="modal-header">
                <div>
                    <h2 style="font-size: 18px; font-weight: 700;">Sơ đồ chỗ ngồi - Phòng ${roomNum}</h2>
                    <p style="font-size: 13px; color: var(--text-muted);">Mẫu sơ đồ tiêu chuẩn 24 chỗ (6 hàng x 4 dãy)</p>
                </div>
                <button class="btn-refresh-mini" onclick="document.getElementById('diagram-overlay').style.display='none'">
                    <i data-lucide="x" style="width:24px; height:24px"></i>
                </button>
            </div>
            <div class="modal-body">
                <div id="diagram-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid var(--border)">
                    <!-- Cells -->
                </div>
                <div class="flex justify-between items-center mt-6">
                    <div style="font-size:12px; color:var(--text-muted)">
                        <span style="display:inline-block; width:12px; height:12px; background:var(--primary); border-radius:2px; margin-right:4px"></span> Có thí sinh
                        <span style="display:inline-block; width:12px; height:12px; background:#e2e8f0; border-radius:2px; margin-left:15px; margin-right:4px"></span> Trống
                    </div>
                    <button class="btn btn-primary" onclick="document.getElementById('diagram-overlay').style.display='none'">Đóng</button>
                </div>
            </div>
        </div>
    `;

    const container = overlay.querySelector('#diagram-grid');
    const rows = 6, cols = 4;
    let html = "";
    for (let i = 1; i <= 24; i++) {
        const s = room.students[i - 1];
        html += `
            <div style="aspect-ratio: 1; border: 2px solid ${s ? 'var(--primary)' : '#e2e8f0'}; background: ${s ? '#fff' : '#f1f5f9'}; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5px; position: relative;">
                <div style="font-size: 9px; color: var(--text-muted); position: absolute; top: 4px; left: 6px;">${i}</div>
                ${s ? `
                    <div style="font-weight: 800; color: var(--primary); font-size: 14px;">${s.stt}</div>
                    <div style="font-size: 9px; font-weight: 700; text-align: center; margin-top: 2px;">${s.hoten.split(' ').pop()}</div>
                ` : '<i data-lucide="minus" style="width:12px; color:#cbd5e1"></i>'}
            </div>
        `;
    }
    container.innerHTML = html;
    overlay.style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function exportGradingLists() {
    let sourceData = [];
    if (typeof generatedRooms !== 'undefined' && generatedRooms && generatedRooms.length > 0) {
        sourceData = generatedRooms.flatMap(r => r.students);
    } else {
        sourceData = typeof excelData !== 'undefined' ? excelData : [];
    }

    if (sourceData.length === 0) {
        showAlert("⚠️ Không có dữ liệu để xuất!", "warning");
        return;
    }

    const mapping = dataStore[activeFileName].mapping;
    
    // Check if SBD is available either from mapping or generatedRooms
    const hasMappedSbd = mapping['sbd'] && sourceData[0] && sourceData[0][mapping['sbd']];
    const hasGeneratedSbd = sourceData[0] && sourceData[0].sbd;
    if (!hasMappedSbd && !hasGeneratedSbd) {
        showAlert("⚠️ CẢNH BÁO: Chưa có dữ liệu Số Báo Danh! Hãy thực hiện 'Xếp phòng thi' trước khi xuất file này.", "warning");
        // We do not return here, we still allow them to export if they really want, but warn them.
    }

    const workbook = new ExcelJS.Workbook();

    const subjects = [
        { key: 'toan', label: 'TOÁN' }, { key: 'van', label: 'NGỮ VĂN' },
        { key: 'anh', label: 'TIẾNG ANH' }, { key: 'ly', label: 'VẬT LÝ' },
        { key: 'hoa', label: 'HÓA HỌC' }, { key: 'sinh', label: 'SINH HỌC' },
        { key: 'su', label: 'LỊCH SỬ' }, { key: 'dia', label: 'ĐỊA LÝ' },
        { key: 'gdkt', label: 'GDKTPL' }, { key: 'tin', label: 'TIN HỌC' },
        { key: 'cnn', label: 'CÔNG NGHỆ (NN)' }, { key: 'cnc', label: 'CÔNG NGHỆ (CN)' },
        { key: 'nhat', label: 'TIẾNG NHẬT' }, { key: 'trung', label: 'TIẾNG TRUNG' },
        { key: 'han', label: 'TIẾNG HÀN' }, { key: 'phap', label: 'TIẾNG PHÁP' },
        { key: 'nga', label: 'TIẾNG NGA' }, { key: 'duc', label: 'TIẾNG ĐỨC' }
    ];

    // --- 1. Master Summary Sheet ---
    const summarySheet = workbook.addWorksheet('TỔNG HỢP CHUNG');
    summarySheet.pageSetup = EXCEL_STYLES.printSetup;
    applyDecree30Header(summarySheet, 'DANH SÁCH TỔNG HỢP THÍ SINH DỰ THI', 6);
    const hSum = summarySheet.addRow(["STT", "SBD", "Họ và Tên", "Lớp", "Môn đăng ký", "Ghi chú"]);
    hSum.eachCell(c => c.style = { ...EXCEL_STYLES.tableHeader });

    sourceData.forEach((row, idx) => {
        const registered = subjects.filter(sub => isSubjectMarked(row, sub.key, mapping)).map(s => s.label);
        const sbdValue = row.sbd || row[mapping['sbd']] || '';
        const r = summarySheet.addRow([idx + 1, sbdValue, row.hoten || row[mapping['hoten']] || '', row.lop || row[mapping['lop']] || '', registered.join(', '), '']);
        r.eachCell(c => c.style = { ...EXCEL_STYLES.cell });
    });
    summarySheet.getColumn(5).width = 35;

    // --- 2. Individual Subject Sheets ---
    subjects.forEach(sub => {
        const filteredData = sourceData.filter(row => isSubjectMarked(row, sub.key, mapping));

        if (filteredData.length > 0) {
            const ws = workbook.addWorksheet(`MÔN ${sub.label}`.substring(0, 31));
            ws.pageSetup = EXCEL_STYLES.printSetup;
            applyDecree30Header(ws, `DANH SÁCH THÍ SINH DỰ THI - MÔN: ${sub.label}`, 6);
            const h = ws.addRow(["STT", "SBD", "Họ và Tên", "Lớp", "Điểm", "Chữ ký"]);
            h.eachCell(c => c.style = { ...EXCEL_STYLES.tableHeader });

            filteredData.forEach((row, idx) => {
                const sbdValue = row.sbd || row[mapping['sbd']] || '';
                const r = ws.addRow([idx + 1, sbdValue, row.hoten || row[mapping['hoten']] || '', row.lop || row[mapping['lop']] || '', '', '']);
                r.eachCell(c => c.style = { ...EXCEL_STYLES.cell });
            });

            ws.getColumn(1).width = 8; ws.getColumn(2).width = 20; ws.getColumn(3).width = 35;
            ws.getColumn(4).width = 15; ws.getColumn(5).width = 10; ws.getColumn(6).width = 20;
            addExcelSignatures(ws, ws.rowCount + 2, 6);
        }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DANH_SACH_CHAM_THI_THEO_MON_${new Date().getTime()}.xlsx`;
    a.click();
    showAlert("✅ Đã xuất danh sách chấm thi theo môn thành công!", "success");
}
window.exportGradingLists = exportGradingLists;

// --- NAME SPLIT UTILITIES ---
let splitResultData = [];

function updateSplitFileSelector() {
    const el = document.getElementById('split-file-selector');
    if (!el) return;
    const files = Object.keys(dataStore);
    el.innerHTML = '<option value="">--- Chọn tệp ---</option>' + files.map(f => `<option value="${f}">${f}</option>`).join('');
}

function updateSplitColumnSelector() {
    const fileName = document.getElementById('split-file-selector').value;
    const colEl = document.getElementById('split-column-selector');
    if (!colEl || !fileName || !dataStore[fileName]) return;

    const cols = dataStore[fileName].columns;
    colEl.innerHTML = '<option value="">--- Chọn cột ---</option>' + cols.map(c => `<option value="${c}">${c}</option>`).join('');
}

function executeNameSplit() {
    const fileName = document.getElementById('split-file-selector').value;
    const columnName = document.getElementById('split-column-selector').value;
    if (!fileName || !columnName) {
        showAlert("⚠️ Vui lòng chọn tệp và cột!", 'warning');
        return;
    }

    const data = dataStore[fileName].data;
    splitResultData = data.map(row => {
        const fullName = (row[columnName] || "").toString().trim();
        const split = splitVietnameseName(fullName);
        return {
            ...row,
            'Họ lót': (split.ho + " " + split.lot).trim(),
            'Tên': split.ten
        };
    });

    renderSplitPreview();
}

function renderSplitPreview() {
    const body = document.getElementById('split-preview-body');
    const placeholder = document.getElementById('split-placeholder');
    const container = document.getElementById('split-preview-container');

    if (!body || splitResultData.length === 0) return;

    if (placeholder) placeholder.style.display = 'none';
    if (container) container.style.display = 'block';

    body.innerHTML = splitResultData.slice(0, 10).map(row => `
        <tr>
            <td>${row[document.getElementById('split-column-selector').value] || ''}</td>
            <td>${row['Họ lót'] || ''}</td>
            <td>${row['Tên'] || ''}</td>
        </tr>
    `).join('');
}

async function downloadSplitResult() {
    if (splitResultData.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Kết quả tách tên');

    const headers = Object.keys(splitResultData[0]);
    ws.addRow(headers);

    splitResultData.forEach(row => {
        ws.addRow(headers.map(h => row[h]));
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Ket_qua_tach_ten.xlsx`;
    link.click();
}


// --- PROCTOR MANAGEMENT ---
// Lưu ý: Toàn bộ module phân công giám thị đã được chuyển sang proctor_pro.js để đảm bảo tính chuyên nghiệp và linh hoạt.

async function exportOfficialExamPackage() {
    try {
        if (!generatedRooms || generatedRooms.length === 0) {
            showAlert("⚠️ Vui lòng thực hiện xếp phòng trước khi xuất hồ sơ!", 'warning');
            return;
        }

        if (!activeFileName || !dataStore[activeFileName]) {
            showAlert("⚠️ Không tìm thấy dữ liệu tệp đang hoạt động!", 'warning');
            return;
        }

        const mapping = dataStore[activeFileName].mapping;
        const subjects = [
            { key: 'toan', label: 'TOÁN' }, { key: 'van', label: 'NGỮ VĂN' },
            { key: 'anh', label: 'TIẾNG ANH' }, { key: 'ly', label: 'VẬT LÝ' },
            { key: 'hoa', label: 'HÓA HỌC' }, { key: 'sinh', label: 'SINH HỌC' },
            { key: 'su', label: 'LỊCH SỬ' }, { key: 'dia', label: 'ĐỊA LÝ' },
            { key: 'gdkt', label: 'GDKTPL' }, { key: 'tin', label: 'TIN HỌC' }
        ];

        const workbook = new ExcelJS.Workbook();

        // 1. Sheet: TỔNG HỢP HỘI ĐỒ đồng
        const masterSheet = workbook.addWorksheet('DANH SÁCH TỔNG HỢP', {
            pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToHeight: 0, fitToWidth: 1 }
        });
        applyDecree30Header(masterSheet, 'DANH SÁCH TỔNG HỢP THÍ SINH TOÀN HỘI ĐỒNG', 7);
        const hMaster = masterSheet.addRow(['STT', 'Phòng', 'SBD', 'Họ và Tên', 'Lớp', 'Môn đăng ký', 'Ghi chú']);
        hMaster.eachCell(c => c.style = EXCEL_STYLES.tableHeader);
        hMaster.height = 30;

        masterSheet.getColumn(1).width = 6;
        masterSheet.getColumn(2).width = 10;
        masterSheet.getColumn(3).width = 15;
        masterSheet.getColumn(4).width = 30;
        masterSheet.getColumn(5).width = 12;
        masterSheet.getColumn(6).width = 25;
        masterSheet.getColumn(7).width = 15;

        generatedRooms.forEach(room => {
            room.students.forEach(std => {
                const registered = subjects.filter(sub => {
                    const colName = mapping[sub.key];
                    if (!colName) return false;
                    const v = (std[colName] || "").toString().trim().toUpperCase();
                    return v !== "" && v !== "0" && v !== "FALSE";
                }).map(sub => sub.label).join(', ');

                const r = masterSheet.addRow([std.stt, room.number, std.sbd, std.hoten, std.lop, registered, '']);
                r.eachCell(c => {
                    c.style = EXCEL_STYLES.cell;
                    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                });
                r.getCell(4).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            });
        });

        // 2. Sheet: THỐNG KÊ MÔN THI
        const statsSheet = workbook.addWorksheet('THỐNG KÊ MÔN', {
            pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToHeight: 0, fitToWidth: 1 }
        });
        applyDecree30Header(statsSheet, 'BẢNG THỐNG KÊ THÍ SINH THEO MÔN THI', 4);
        statsSheet.getColumn(1).width = 8;
        statsSheet.getColumn(2).width = 30;
        statsSheet.getColumn(3).width = 15;
        statsSheet.getColumn(4).width = 20;

        const hStats = statsSheet.addRow(['STT', 'Môn thi', 'Số lượng', 'Ghi chú']);
        hStats.eachCell(c => c.style = EXCEL_STYLES.tableHeader);

        const subCounts = {};
        const activeData = dataStore[activeFileName].data || [];
        activeData.forEach(row => {
            subjects.forEach(sub => {
                const colName = mapping[sub.key];
                if (!colName) return;
                const v = (row[colName] || "").toString().trim().toUpperCase();
                if (v !== "" && v !== "0" && v !== "FALSE") subCounts[sub.label] = (subCounts[sub.label] || 0) + 1;
            });
        });

        Object.entries(subCounts).forEach(([label, count], idx) => {
            const r = statsSheet.addRow([idx + 1, label, count, '']);
            r.eachCell(c => c.style = EXCEL_STYLES.cell);
        });

        // 3. For each room: Generate Official Dossier
        for (const room of generatedRooms) {
            const roomSheet = workbook.addWorksheet(`Phòng ${room.number}`, {
                pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToHeight: 0, fitToWidth: 1 }
            });
            roomSheet.getColumn(1).width = 6;
            roomSheet.getColumn(2).width = 12;
            roomSheet.getColumn(3).width = 28;
            roomSheet.getColumn(4).width = 10;
            roomSheet.getColumn(5).width = 20;
            roomSheet.getColumn(6).width = 10;
            roomSheet.getColumn(7).width = 12;
            roomSheet.getColumn(8).width = 12;

            // --- PART A: DANH SÁCH GỌI TÊN ---
            applyDecree30Header(roomSheet, `DANH SÁCH GỌI THÍ SINH VÀO PHÒNG THI
PHÒNG THI SỐ: ${room.number}`, 8);
            const hGoi = roomSheet.addRow(['STT', 'SBD', 'Họ và Tên', 'Lớp', 'Môn thi', 'Ảnh', 'Ký tên', 'Ghi chú']);
            hGoi.eachCell(c => c.style = EXCEL_STYLES.tableHeader);
            hGoi.height = 30;

            room.students.forEach(s => {
                const registered = subjects.filter(sub => isSubjectMarked(s, sub.key, mapping)).map(sub => sub.label).join(', ');

                const r = roomSheet.addRow([s.stt, s.sbd, s.hoten, s.lop, registered, '', '', '']);
                r.eachCell(c => {
                    c.style = EXCEL_STYLES.cell;
                    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                });
                r.getCell(3).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
                r.height = 35;
            });

            addExcelSignatures(roomSheet, roomSheet.rowCount + 1, 8);
            roomSheet.getRow(roomSheet.rowCount).addPageBreak();

            // --- PART B: PHIẾU THU BÀI THI ---
            applyDecree30Header(roomSheet, `PHIẾU THU BÀI THI - PHÒNG THI SỐ: ${room.number}`, 8);
            const hThu = roomSheet.addRow(['STT', 'SBD', 'Họ và Tên', 'Lớp', 'Số tờ', 'Mã đề', 'Ký tên', 'Ghi chú']);
            hThu.eachCell(c => c.style = EXCEL_STYLES.tableHeader);

            room.students.forEach(s => {
                const r = roomSheet.addRow([s.stt, s.sbd, s.hoten, s.lop, '', '', '', '']);
                r.eachCell(c => {
                    c.style = EXCEL_STYLES.cell;
                    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                });
                r.getCell(3).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
                r.height = 30;
            });

            addCollectionRecord(roomSheet, roomSheet.rowCount + 1, 8);
            roomSheet.getRow(roomSheet.rowCount).addPageBreak();

            // --- PART C: SƠ ĐỒ CHỖ NGỒI ---
            applyOfficialDiagram(roomSheet, room, roomSheet.rowCount + 1);
            roomSheet.getRow(roomSheet.rowCount).addPageBreak();
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `HO_SO_THI_TOAN_HOI_DONG.xlsx`;
        link.click();
        showAlert("✅ Đã xuất Hồ sơ tổng hợp thành công!", 'success');
    } catch (err) {
        console.error("Lỗi xuất hồ sơ:", err);
        showAlert("❌ Có lỗi xảy ra khi xuất hồ sơ. Vui lòng kiểm tra lại dữ liệu!", 'danger');
    }
}

function applyOfficialDiagram(ws, room, startRow) {
    try {
        applyDecree30Header(ws, `SƠ ĐỒ CHỖ NGỒI - PHÒNG THI SỐ: ${room.number}`, 8);
        ws.addRow([]);
        const diagramRow = ws.rowCount + 1;

        ws.mergeCells(diagramRow - 1, 1, diagramRow - 1, 8);
        ws.getCell(diagramRow - 1, 1).value = "BẢNG GIẢNG (PHÍA TRÊN)";
        ws.getCell(diagramRow - 1, 1).alignment = { horizontal: 'center' };

        for (let r = 0; r < 6; r++) {
            const rowNum = diagramRow + r;
            ws.getRow(rowNum).height = 60;
            for (let c = 0; c < 4; c++) {
                const sIdx = r * 4 + c;
                const s = room.students ? room.students[sIdx] : null;
                const colStart = c * 2 + 1;

                ws.mergeCells(rowNum, colStart, rowNum, colStart + 1);
                const cell = ws.getCell(rowNum, colStart);

                cell.value = s ? `[${sIdx + 1}]
${s.hoten}
${s.sbd}` : `[${sIdx + 1}]
(TRỐNG)`;
                cell.style = EXCEL_STYLES.cell;
                cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                if (s) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F7FF' } };
                }
            }
        }
    } catch (e) {
        console.error("Lỗi vẽ sơ đồ:", e);
    }
}

async function exportClassRoomSummaryExcel() {
    try {
        if (!generatedRooms || generatedRooms.length === 0) {
            showAlert("⚠️ Vui lòng thực hiện xếp phòng trước khi xuất danh sách!", 'warning');
            return;
        }
        if (!activeFileName || !dataStore[activeFileName]) {
            showAlert("⚠️ Không tìm thấy dữ liệu tệp đang hoạt động!", 'warning');
            return;
        }

        const mapping = dataStore[activeFileName].mapping;
        const subjects = [
            { key: 'toan', label: 'TOÁN' }, { key: 'van', label: 'NGỮ VĂN' },
            { key: 'anh', label: 'TIẾNG ANH' }, { key: 'ly', label: 'VẬT LÝ' },
            { key: 'hoa', label: 'HÓA HỌC' }, { key: 'sinh', label: 'SINH HỌC' },
            { key: 'su', label: 'LỊCH SỬ' }, { key: 'dia', label: 'ĐỊA LÝ' },
            { key: 'gdkt', label: 'GDKTPL' }, { key: 'tin', label: 'TIN HỌC' }
        ];

        const workbook = new ExcelJS.Workbook();
        const ws = workbook.addWorksheet('DANH SÁCH THEO LỚP', {
            pageSetup: EXCEL_STYLES.printSetup
        });

        const all = [];
        generatedRooms.forEach(room => {
            room.students.forEach(s => {
                all.push({ ...s, roomNum: room.number });
            });
        });

        all.sort((a, b) => {
            const clsA = (a.lop || "").toString();
            const clsB = (b.lop || "").toString();
            if (clsA !== clsB) return clsA.localeCompare(clsB);
            return a.hoten.localeCompare(b.hoten);
        });

        applyDecree30Header(ws, 'DANH SÁCH THÔNG TIN PHÒNG THI THÍ SINH (SẮP XẾP THEO LỚP)', 7);
        const hRow = ws.addRow(['STT', 'Lớp', 'SBD', 'Họ và Tên', 'Phòng', 'Môn đăng ký', 'Ghi chú']);
        hRow.height = 30;
        hRow.eachCell(c => c.style = EXCEL_STYLES.tableHeader);

        all.forEach((s, idx) => {
            const registered = subjects.filter(sub => {
                const colName = mapping[sub.key];
                if (!colName) return false;
                const v = (s[colName] || "").toString().trim().toUpperCase();
                return v !== "" && v !== "0" && v !== "FALSE";
            }).map(sub => sub.label).join(', ');

            const r = ws.addRow([idx + 1, s.lop, s.sbd, s.hoten, `P.${s.roomNum}`, registered, '']);
            r.eachCell(c => {
                c.style = EXCEL_STYLES.cell;
                c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            });
            r.getCell(4).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        });

        ws.getColumn(1).width = 6; ws.getColumn(2).width = 12; ws.getColumn(3).width = 15;
        ws.getColumn(4).width = 30; ws.getColumn(5).width = 12; ws.getColumn(6).width = 35;
        ws.getColumn(7).width = 15;

        addExcelSignatures(ws, ws.rowCount + 2, 7);

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `DANH_SACH_PHONG_THI_THEO_LOP_${new Date().getTime()}.xlsx`;
        link.click();
        showAlert("✅ Đã xuất thông tin phòng thi (Excel/PDF) thành công!", 'success');
    } catch (err) {
        console.error("Lỗi xuất summary:", err);
        showAlert("❌ Có lỗi xảy ra khi xuất dữ liệu!", 'danger');
    }
}

// --- MANUALLY ADDED INDEPENDENT PROCTORING FUNCTIONS ---

function showIndependentProctorModal() {
    const modal = document.getElementById('independent-proctor-modal');
    if (modal) {
        modal.style.display = 'flex';
        toggleIndepLabels();
    }
}

function closeIndependentProctorModal() {
    const modal = document.getElementById('independent-proctor-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function addIndependentRange() {
    const container = document.getElementById('independent-ranges-container');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'indep-range-item flex gap-2 mb-3 p-3 border-dashed border-2 rounded bg-white relative';
    div.innerHTML = `
        <div style="flex:1">
            <label style="font-size:10px; font-weight:700">Tiền tố (vd: 10_P)</label>
            <input type="text" class="form-control indep-prefix" placeholder="P." value="P." style="height:35px">
        </div>
        <div style="width:70px">
            <label style="font-size:10px; font-weight:700">Từ số</label>
            <input type="number" class="form-control indep-start" value="1" style="height:35px">
        </div>
        <div style="width:70px">
            <label style="font-size:10px; font-weight:700">Đến số</label>
            <input type="number" class="form-control indep-end" value="12" style="height:35px">
        </div>
        <div style="flex:2">
            <label style="font-size:10px; font-weight:700">Lớp (vd: 10A1, 10A2)</label>
            <input type="text" class="form-control indep-classes" placeholder="Các lớp cách nhau dấu phẩy" style="height:35px">
        </div>
        <button class="btn-remove-range text-red-500 hover:text-red-700 self-end mb-1 border-none bg-transparent cursor-pointer" onclick="this.parentElement.remove()" style="height:35px; width:35px; border:none; background:transparent;">
            <i data-lucide="trash-2" style="width:18px; height:18px;"></i>
        </button>
    `;
    container.appendChild(div);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function toggleIndepLabels() {
    const selectEl = document.getElementById('indep-session-count');
    const count = selectEl ? (parseInt(selectEl.value) || 1) : 1;
    const container = document.getElementById('indep-labels-container');
    if (!container) return;
    
    const defaultLabels = ["Văn", "Toán", "Tự chọn 1", "Tự chọn 2"];
    container.innerHTML = "";
    for (let i = 0; i < count; i++) {
        const div = document.createElement("div");
        div.innerHTML = `
            <label style="font-size:10px; color:var(--text-muted)">Tên buổi ${i + 1}</label>
            <input type="text" id="indep-label-${i}" class="form-control" value="${defaultLabels[i] || `Buổi ${i+1}`}"
                style="height:30px; font-size:12px">
        `;
        container.appendChild(div);
    }
}

async function downloadRoomSample() {
    try {
        if (typeof ExcelJS === 'undefined') {
            showAlert("❌ Thư viện ExcelJS chưa được tải!", "danger");
            return;
        }
        const workbook = new ExcelJS.Workbook();
        const ws = workbook.addWorksheet('Mau_Phong_Thi');
        
        ws.addRow(['Số phòng', 'Danh sách lớp']);
        ws.addRow(['P.01', '12A1']);
        ws.addRow(['P.02', '12A2, 12A3']);
        ws.addRow(['P.03', '']);
        
        ws.columns.forEach(col => col.width = 20);
        
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Mau_Nhap_Phong_Thi.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Lỗi download room sample:", err);
        showAlert("❌ Không thể tạo file mẫu!", "danger");
    }
}

function importRoomsAndAssignProctors(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (typeof XLSX === 'undefined') {
        showAlert("❌ Thư viện XLSX chưa được tải!", "danger");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            if (jsonData.length === 0) {
                showAlert("⚠️ File Excel trống hoặc không đúng định dạng!", "warning");
                return;
            }
            
            const rooms = [];
            let roomIdCounter = 1;
            jsonData.forEach(row => {
                const roomNum = (row['Số phòng'] || row['So phong'] || '').toString().trim();
                const classesRaw = (row['Danh sách lớp'] || row['Danh sach lop'] || '').toString().trim();
                if (!roomNum) return;
                
                const classes = classesRaw ? classesRaw.split(",").map(c => c.trim()) : [];
                rooms.push({
                    id: `R-${roomIdCounter++}`,
                    number: roomNum,
                    name: roomNum,
                    classes: classes,
                    grade: ""
                });
            });
            
            if (rooms.length === 0) {
                showAlert("⚠️ Không tìm thấy danh sách phòng hợp lệ trong file Excel!", "warning");
                return;
            }
            
            runAssignmentSolver(rooms);
        } catch (err) {
            console.error("Lỗi import room Excel:", err);
            showAlert("❌ Lỗi khi đọc file Excel phòng thi!", "danger");
        }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = "";
}

function assignProctorsManual() {
    const rangeItems = document.querySelectorAll(".indep-range-item");
    if (rangeItems.length === 0) {
        showAlert("⚠️ Vui lòng thêm ít nhất một dãy phòng thi!", "warning");
        return;
    }
    
    const rooms = [];
    let roomIdCounter = 1;
    rangeItems.forEach(item => {
        const prefix = item.querySelector(".indep-prefix").value.trim();
        const start = parseInt(item.querySelector(".indep-start").value) || 1;
        const end = parseInt(item.querySelector(".indep-end").value) || 1;
        const classesRaw = item.querySelector(".indep-classes").value.trim();
        const classes = classesRaw ? classesRaw.split(",").map(c => c.trim()) : [];
        
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        for (let r = min; r <= max; r++) {
            const rNumStr = r.toString().padStart(2, '0');
            const roomName = `${prefix}${rNumStr}`;
            let assignedClass = [];
            if (classes.length > 0) {
                const classIndex = (r - min) % classes.length;
                assignedClass = [classes[classIndex]];
            }
            rooms.push({
                id: `R-${roomIdCounter++}`,
                number: rNumStr,
                name: roomName,
                classes: assignedClass,
                grade: ""
            });
        }
    });
    
    if (rooms.length === 0) {
        showAlert("⚠️ Vui lòng cấu hình dãy phòng hợp lệ!", "warning");
        return;
    }
    
    runAssignmentSolver(rooms);
}

function runAssignmentSolver(rooms) {
    const sessSelect = document.getElementById('indep-session-count');
    const sessCount = sessSelect ? (parseInt(sessSelect.value) || 1) : 1;
    const defaultLabels = ["Văn", "Toán", "Tự chọn 1", "Tự chọn 2"];
    const sessions = [];
    for (let i = 0; i < sessCount; i++) {
        const inputEl = document.getElementById(`indep-label-${i}`);
        const label = inputEl ? inputEl.value.trim() : (defaultLabels[i] || `Buổi ${i+1}`);
        sessions.push({
            id: `S-${i+1}`,
            name: label,
            date: new Date().toLocaleDateString('vi-VN'),
            slot: i % 2 === 0 ? "Sáng" : "Chiều",
            slotKey: `SLOT-${i+1}`
        });
    }
    
    const proctors = (typeof ProctorStore !== 'undefined') ? ProctorStore.getState().proctors : (window.proctorList || []);
    if (proctors.length === 0) {
        showAlert("⚠️ Vui lòng cấu hình danh sách giám thị trước khi chạy!", "warning");
        return;
    }
    
    const proctorStats = {};
    proctors.forEach(p => {
        proctorStats[p.id || p.name] = 0;
    });
    
    rooms.forEach(room => {
        const roomClasses = room.classes || [];
        sessions.forEach(session => {
            const sessId = session.id;
            const sessName = session.name;
            const assignedInRoom = [];
            
            for (let proctorNum = 1; proctorNum <= 2; proctorNum++) {
                let candidates = proctors.filter(p => {
                    const pKey = p.id || p.name;
                    const alreadyAssigned = rooms.some(r => {
                        const key = `proctors_${sessId}`;
                        const rAssigned = r[key] || [];
                        return rAssigned.some(ap => (ap.id || ap.name) === pKey);
                    });
                    if (alreadyAssigned) return false;
                    
                    const hasClassConflict = (p.classes || []).some(c => roomClasses.includes(c));
                    if (hasClassConflict) return false;
                    
                    return true;
                });
                
                if (candidates.length === 0) {
                    candidates = proctors.filter(p => {
                        const pKey = p.id || p.name;
                        const alreadyAssigned = rooms.some(r => {
                            const key = `proctors_${sessId}`;
                            const rAssigned = r[key] || [];
                            return rAssigned.some(ap => (ap.id || ap.name) === pKey);
                        });
                        return !alreadyAssigned;
                    });
                }
                
                candidates.sort((a, b) => {
                    const countA = proctorStats[a.id || a.name] || 0;
                    const countB = proctorStats[b.id || b.name] || 0;
                    if (countA !== countB) return countA - countB;
                    if (assignedInRoom.length > 0) {
                        const gt1 = assignedInRoom[0];
                        const aSameUnit = (gt1.unit && a.unit && gt1.unit === a.unit) ? 1 : 0;
                        const bSameUnit = (gt1.unit && b.unit && gt1.unit === b.unit) ? 1 : 0;
                        return aSameUnit - bSameUnit;
                    }
                    return 0;
                });
                
                if (candidates.length > 0) {
                    const chosen = candidates[0];
                    assignedInRoom.push(chosen);
                    proctorStats[chosen.id || chosen.name]++;
                }
            }
            
            room[`proctors_${sessId}`] = assignedInRoom.map(p => ({
                id: p.id || p.name,
                name: p.name,
                unit: p.unit || ""
            }));
            room[`proctors_${sessName}`] = room[`proctors_${sessId}`];
        });
    });
    
    // Save to global variables & store
    if (typeof ProctorStore !== 'undefined') {
        ProctorStore.setSessions(sessions);
        ProctorStore.setRooms(rooms);
    }
    window.generatedRooms = rooms;
    if (typeof saveToDB === 'function') {
        saveToDB();
    }
    
    if (typeof ProctorPro !== 'undefined') {
        ProctorPro.renderBoard(sessions);
    }
    
    closeIndependentProctorModal();
    showAlert(`✅ Đã phân công giám thị độc lập thành công cho ${rooms.length} phòng!`, "success");
}

function exportIndependentProctorExcel() {
    if (typeof ProctorPro !== 'undefined') {
        ProctorPro.exportExcel();
    } else {
        showAlert("❌ Không tìm thấy thư viện ProctorPro!", "danger");
    }
}

window.exportClassRoomSummaryExcel = exportClassRoomSummaryExcel;
window.exportOfficialExamPackage = exportOfficialExamPackage;
window.addIndependentRange = addIndependentRange;
window.toggleIndepLabels = toggleIndepLabels;
window.exportIndependentProctorExcel = exportIndependentProctorExcel;
window.showIndependentProctorModal = showIndependentProctorModal;
window.closeIndependentProctorModal = closeIndependentProctorModal;
window.assignProctorsManual = assignProctorsManual;
window.importRoomsAndAssignProctors = importRoomsAndAssignProctors;
window.downloadRoomSample = downloadRoomSample;
// window.filterProctorBoard = filterProctorBoard; (Defined in proctor_pro.js)







window.switchTab = switchTab;
window.setActiveFile = setActiveFile;
window.setMasterFile = setMasterFile;
window.unsetMasterFile = unsetMasterFile;
window.deleteFile = deleteFile;
window.showMappingReview = showMappingReview;
window.confirmMapping = confirmMapping;
window.setValidationPreset = setValidationPreset;
window.search = search;
window.addFilter = addFilter;
window.addClassRow = addClassRow;
window.showVillageModal = showVillageModal;
window.addLogicRule = addLogicRule;
window.autoFixData = autoFixData;
window.exportErrorsToExcel = exportErrorsToExcel;
window.printErrorForms = printErrorForms;
window.exportByClass = exportByClass;
window.exportToExcel = exportToExcel;
window.generateExamRooms = generateExamRooms;
window.exportExamRoomsToExcel = exportExamRoomsToExcel;
window.showSeatingDiagram = showSeatingDiagram;
window.exportGradingLists = exportGradingLists;
window.updateSplitFileSelector = updateSplitFileSelector;
window.updateSplitColumnSelector = updateSplitColumnSelector;
window.executeNameSplit = executeNameSplit;
window.downloadSplitResult = downloadSplitResult;
window.scrollToRow = scrollToRow;
window.copyZaloReminder = copyZaloReminder;
window.copyClassZaloReminder = copyClassZaloReminder;
window.startBulkZalo = startBulkZalo;
window.sendZaloMessage = sendZaloMessage;
window.closeVillageModal = closeVillageModal;
window.switchVillageTab = switchVillageTab;
window.addGraduationRule = addGraduationRule;
window.exportVillageConfig = exportVillageConfig;
window.importVillageConfig = importVillageConfig;
window.exportSystemData = exportSystemData;
window.importSystemData = importSystemData;
window.toggleHeaderInputs = toggleHeaderInputs;
window.saveAppState = saveAppState;
window.toggleDarkMode = toggleDarkMode;
window.checkForUpdate = checkForUpdate;
window.closeAlert = closeAlert;
window.scrollToTop = scrollToTop;
window.applyQuickTemplate = applyQuickTemplate;
window.toggleColumns = toggleColumns;
window.renderDataPreview = renderDataPreview;
window.mergeAllFiles = mergeAllFiles;
window.compareTwoFiles = compareTwoFiles;
window.closeDrilldown = closeDrilldown;
window.updateUnitNames = updateUnitNames;

function exportExamBagLabels() {
    if (typeof generatedRooms === 'undefined' || !generatedRooms || generatedRooms.length === 0) {
        showAlert('Vui lòng xếp phòng trước khi xuất nhãn!', 'warning');
        return;
    }

    if (!activeFileName || !dataStore[activeFileName]) {
        showAlert('Không tìm thấy dữ liệu file hoạt động!', 'error');
        return;
    }

    try {
        const mapping = dataStore[activeFileName].mapping;
        const electiveKeys = ['ly', 'hoa', 'sinh', 'su', 'dia', 'gdkt', 'tin', 'cnn', 'cnc', 'anh', 'nhat', 'trung', 'han', 'phap', 'nga', 'duc'];
        const subjectLabelsMap = {
            'anh': 'Tiếng Anh', 'ly': 'Vật lý', 'hoa': 'Hóa học', 'sinh': 'Sinh học', 'su': 'Lịch sử', 'dia': 'Địa lý', 'gdkt': 'GDKTPL', 'tin': 'Tin học', 'cnn': 'Công nghệ', 'cnc': 'Công nghệ',
            'nhat': 'Tiếng Nhật', 'trung': 'Tiếng Trung', 'han': 'Tiếng Hàn', 'phap': 'Tiếng Pháp', 'nga': 'Tiếng Nga', 'duc': 'Tiếng Đức'
        };

        const targetSessions = [
            { id: 'VAN', label: 'NGỮ VĂN', type: 'fixed' },
            { id: 'TOAN', label: 'TOÁN', type: 'fixed' },
            { id: 'CA1', label: 'TỰ CHỌN - CA 1', index: 0, type: 'elective' },
            { id: 'CA2', label: 'TỰ CHỌN - CA 2', index: 1, type: 'elective' }
        ];

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('NHAN TUI DE', {
            pageSetup: {
                paperSize: 9,
                orientation: 'portrait',
                fitToPage: true,
                margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5 }
            }
        });

        const deptName = document.getElementById('excel-dept-name')?.value || "SỞ GIÁO DỤC VÀ ĐÀO TẠO";
        const boardName = document.getElementById('excel-board-name')?.value || "HỘI ĐỒNG THI TRƯỜNG THPT CAO BÁ QUÁT";
        const examName = document.getElementById('excel-exam-name')?.value || "KỲ THI TỐT NGHIỆP THPT 2026";

        ws.columns = [
            { width: 2 }, { width: 7 }, { width: 7 }, { width: 7 }, { width: 7 }, { width: 7 }, { width: 7 }, { width: 2 }, // Label 1
            { width: 2 }, // Spacer
            { width: 2 }, { width: 7 }, { width: 7 }, { width: 7 }, { width: 7 }, { width: 7 }, { width: 7 }, { width: 2 }  // Label 2
        ];

        let labelCount = 0;
        generatedRooms.forEach((room) => {
            targetSessions.forEach(session => {
                if (session.type === 'fixed') {
                    const count = room.students.length;
                    if (count > 0) createLabelExcel(session.label, count, room.number);
                } else {
                    const uniqueSubsInSession = [];
                    room.students.forEach(s => {
                        const studentSubs = electiveKeys.filter(k => isSubjectMarked(s, k, mapping));
                        const subKey = studentSubs[session.index];
                        if (subKey && !uniqueSubsInSession.includes(subKey)) uniqueSubsInSession.push(subKey);
                    });

                    uniqueSubsInSession.forEach(subKey => {
                        const studentCount = room.students.filter(s => {
                            const studentSubs = electiveKeys.filter(k => isSubjectMarked(s, k, mapping));
                            return studentSubs[session.index] === subKey;
                        }).length;

                        const displayLabel = (subjectLabelsMap[subKey] || subKey.toUpperCase()).toUpperCase() + ` (${session.id})`;
                        createLabelExcel(displayLabel, studentCount, room.number);
                    });
                }
            });
        });

        function createLabelExcel(subLabel, studentCount, roomNumber) {
            const pageIdx = Math.floor(labelCount / 4);
            const posInPage = labelCount % 4; // 0: TL, 1: TR, 2: BL, 3: BR

            const startRow = (pageIdx * 32) + (posInPage >= 2 ? 16 : 1);
            const startCol = (posInPage % 2 === 0 ? 1 : 10);

            addBagLabel(ws, startRow, startCol, examName, subLabel, roomNumber, studentCount);

            labelCount++;
            if (labelCount % 4 === 0) {
                ws.getRow(startRow + 14).addPageBreak();
            }
        }

        wb.xlsx.writeBuffer().then(buffer => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `NHAN_TUI_DE_${new Date().getTime()}.xlsx`;
            link.click();
            showAlert('Đã xuất nhãn túi đề thành công!', 'success');
        }).catch(err => {
            console.error(err);
            showAlert('Lỗi khi tạo file Excel: ' + err.message, 'error');
        });
    } catch (e) {
        console.error(e);
        showAlert('Lỗi thực thi: ' + e.message, 'error');
    }
}

function addBagLabel(ws, startRow, startCol, examName, subject, roomNum, studentCount) {
    // Row Heights for spacing
    for (let i = 0; i < 15; i++) {
        ws.getRow(startRow + i).height = (i === 0 || i === 14) ? 5 : 22;
    }
    ws.getRow(startRow + 3).height = 35; // Subject row height

    // Outer Border
    for (let r = startRow + 1; r < startRow + 14; r++) {
        for (let c = startCol; c < startCol + 8; c++) {
            const cell = ws.getCell(r, c);
            cell.border = {
                top: r === startRow + 1 ? { style: 'medium' } : (cell.border?.top || {}),
                bottom: r === startRow + 13 ? { style: 'medium' } : (cell.border?.bottom || {}),
                left: c === startCol ? { style: 'medium' } : (cell.border?.left || {}),
                right: c === startCol + 7 ? { style: 'medium' } : (cell.border?.right || {})
            };
        }
    }

    // Header: Exam Name
    ws.mergeCells(startRow + 2, startCol + 1, startRow + 2, startCol + 6);
    const cellExam = ws.getCell(startRow + 2, startCol + 1);
    cellExam.value = examName.toUpperCase();
    cellExam.font = { name: 'Times New Roman', bold: true, size: 12, underline: true };
    cellExam.alignment = { horizontal: 'center', vertical: 'middle' };

    // Subject Row
    ws.mergeCells(startRow + 4, startCol + 1, startRow + 4, startCol + 6);
    const cellSub = ws.getCell(startRow + 4, startCol + 1);
    cellSub.value = `Môn: ${subject.toUpperCase()}`;
    cellSub.font = { name: 'Times New Roman', bold: true, size: 18 };
    cellSub.alignment = { horizontal: 'center', vertical: 'middle' };

    // Room Info
    ws.mergeCells(startRow + 5, startCol + 6, startRow + 6, startCol + 7);
    const cellRoom = ws.getCell(startRow + 5, startCol + 6);
    cellRoom.value = `P.${roomNum.toString().padStart(2, '0')}`;
    cellRoom.font = { name: 'Times New Roman', bold: true, size: 14 };
    cellRoom.alignment = { horizontal: 'center', vertical: 'middle' };
    cellRoom.border = { 
        top: { style: 'thin' }, left: { style: 'thin' }, 
        bottom: { style: 'thin' }, right: { style: 'medium' } 
    };

    // Stats Table
    const stats = [
        [`Dự thi:.......... / Vắng:..........`],
        [`Số bài:.......... / Số tờ:..........`],
        [`SBD vắng:.....................................`]
    ];

    stats.forEach((s, idx) => {
        ws.mergeCells(startRow + 7 + idx, startCol + 1, startRow + 7 + idx, startCol + 6);
        const cell = ws.getCell(startRow + 7 + idx, startCol + 1);
        cell.value = s[0];
        cell.font = { name: 'Times New Roman', bold: true, size: 11 };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
    });

    // Signatures
    ws.mergeCells(startRow + 11, startCol + 1, startRow + 11, startCol + 3);
    const sig1 = ws.getCell(startRow + 11, startCol + 1);
    sig1.value = "Giám thị 1";
    sig1.font = { name: 'Times New Roman', bold: true, size: 10.5 };
    sig1.alignment = { horizontal: 'center', vertical: 'middle' };

    ws.mergeCells(startRow + 11, startCol + 4, startRow + 11, startCol + 6);
    const sig2 = ws.getCell(startRow + 11, startCol + 4);
    sig2.value = "Giám thị 2";
    sig2.font = { name: 'Times New Roman', bold: true, size: 10.5 };
    sig2.alignment = { horizontal: 'center', vertical: 'middle' };
}

window.exportExamBagLabels = exportExamBagLabels;


/* ===== PRINT PREVIEW SYSTEM (PRO MASTER) ===== */
function openPrintPreview(type) {
    const contentArea = document.getElementById('print-content-area');
    const modal = document.getElementById('print-modal');
    if (!contentArea || !modal) {
        console.error("Print modal components not found");
        return;
    }

    // Show loading state if possible
    contentArea.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:300px; flex-direction:column; gap:20px;">' +
        '<div class="spinner-pro"></div>' +
        '<div style="font-weight:700; color:#6366f1">ĐANG KHỞI TẠO BẢN IN CHUẨN...</div></div>';
    modal.classList.add('active');
    document.getElementById('print-controls').style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Small delay to let the UI update
    setTimeout(() => {
        try {
            let html = '';
            const dept = document.getElementById('excel-dept-name')?.value || document.getElementById('cfg-dept-name')?.value || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO';
            const school = document.getElementById('excel-board-name')?.value || document.getElementById('cfg-school-name')?.value || 'HỘI ĐỒNG THI';
            const exam = document.getElementById('excel-exam-name')?.value || 'KỲ THI TỐT NGHIỆP THPT 2026';
            const dateStr = new Date().toLocaleDateString('vi-VN');

            if (type === 'grading') {
                html = generateGradingPrintHTML(dept, school, exam, dateStr);
            } else if (type === 'rooms' || type === 'calling' || type === 'collection') {
                html = generateRoomsPrintHTML(dept, school, exam, dateStr, type);
            } else if (type === 'labels') {
                html = generateExamBagLabels(exam);
            } else if (type === 'labels_by_session') {
                html = generateExamBagLabelsBySession(exam);
            } else if (type === 'question_labels') {
                html = generateQuestionBagLabels(exam);
            } else if (type === 'master_question_labels') {
                html = generateMasterQuestionBagLabels(exam);
            } else if (type === 'diagrams') {
                html = generateAllDiagramsPrintHTML(dept, school, exam);
            } else if (type === 'detailed_stats') {
                html = generateDetailedStatsPrintHTML(dept, school, exam);
            }

            if (!html) {
                showAlert("⚠️ Không có dữ liệu để tạo bản in!", 'warning');
                closePrintModal();
                return;
            }

            contentArea.innerHTML = html;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } catch (err) {
            console.error("Print Error:", err);
            showAlert("❌ Lỗi khi tạo bản in: " + err.message, 'danger');
            closePrintModal();
        }
    }, 300);
}

function closePrintModal() {
    const modal = document.getElementById('print-modal');
    if (modal) modal.classList.remove('active');
    const controls = document.getElementById('print-controls');
    if (controls) controls.style.display = 'none';
    document.body.style.overflow = '';
}

/**
 * High-fidelity PDF Export using html2pdf.js
 */
async function exportToPDF() {
    const element = document.getElementById('print-content-area');
    if (!element || !element.innerHTML.trim()) {
        showAlert("⚠️ Không có nội dung để xuất PDF!", "warning");
        return;
    }

    // Temporary UI feedback
    const btn = event?.target?.closest('button');
    const originalContent = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="spinner-pro" style="width:14px; height:14px; border-width:2px"></i> ĐANG XỬ LÝ...';
    }

    try {
        const opt = {
            margin:       0,
            filename:     `HO_SO_THI_${new Date().getTime()}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
        };

        // If landscape container exists, change orientation
        if (element.querySelector('.landscape')) {
            opt.jsPDF.orientation = 'landscape';
        }

        await html2pdf().set(opt).from(element).save();
        showAlert("✅ Đã xuất tệp PDF thành công!", "success");
    } catch (err) {
        console.error("PDF Export Error:", err);
        showAlert("❌ Lỗi khi xuất PDF: " + err.message, "danger");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    }
}

function generatePrintHeaderHTML(dept, school, title, subtitle = '') {
    return `
        <div class="print-header-top">
            <div class="print-header-left" style="min-width: 250px;">
                <div style="font-size: 10pt; white-space: nowrap; letter-spacing: -0.2px;">${dept.toUpperCase()}</div>
                <div style="font-size: 10.5pt; font-weight:bold; white-space: nowrap; letter-spacing: -0.3px;">${school.toUpperCase()}</div>
                <div style="width:100px; border-bottom:1px solid black; margin: 3px auto"></div>
            </div>
            <div class="print-header-right">
                <div style="font-weight:bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div style="font-weight:bold; text-decoration: underline">Độc lập - Tự do - Hạnh phúc</div>
            </div>
        </div>
        <div class="print-title">
            ${title}<br>
            ${subtitle ? `<span style="font-size:12pt; font-weight:normal; text-transform: none;">${subtitle}</span>` : ''}
        </div>
    `;
}

function generatePrintFooterHTML(leftTitle = 'Người lập biểu', rightTitle = 'CÁN BỘ COI THI') {
    const creator = document.getElementById('excel-creator-name')?.value || '';
    const leader = document.getElementById('excel-leader-name')?.value || '';
    return `
        <div class="print-footer">
            <div class="print-footer-item">
                <i>${leftTitle}</i><br><br><br>
                <span style="font-weight:bold">${creator || '........................'}</span>
            </div>
            <div class="print-footer-item">
                <i>Ngày ..... tháng ..... năm 2026</i><br>
                <b>${rightTitle}</b><br><br><br>
                <span style="font-weight:bold">${leader || '........................'}</span>
            </div>
        </div>
    `;
}

function generateGradingPrintHTML(dept, school, exam, date) {
    if (!activeFileName || !dataStore[activeFileName]) return '';
    const mapping = dataStore[activeFileName].mapping;
    
    // Prioritize students from generatedRooms to get actual SBDs
    let sourceData = [];
    if (typeof generatedRooms !== 'undefined' && generatedRooms && generatedRooms.length > 0) {
        sourceData = generatedRooms.flatMap(r => r.students);
    } else {
        sourceData = dataStore[activeFileName].data || excelData;
    }
    
    const subjects = [
        { key: 'toan', label: 'TOÁN' }, { key: 'van', label: 'NGỮ VĂN' },
        { key: 'anh', label: 'TIẾNG ANH' }, { key: 'ly', label: 'VẬT LÝ' },
        { key: 'hoa', label: 'HÓA HỌC' }, { key: 'sinh', label: 'SINH HỌC' },
        { key: 'su', label: 'LỊCH SỬ' }, { key: 'dia', label: 'ĐỊA LÝ' },
        { key: 'gdkt', label: 'GDKTPL' }, { key: 'tin', label: 'TIN HỌC' },
        { key: 'cnn', label: 'CÔNG NGHỆ (NN)' }, { key: 'cnc', label: 'CÔNG NGHỆ (CN)' },
        { key: 'nhat', label: 'TIẾNG NHẬT' }, { key: 'trung', label: 'TIẾNG TRUNG' },
        { key: 'han', label: 'TIẾNG HÀN' }, { key: 'phap', label: 'TIẾNG PHÁP' },
        { key: 'nga', label: 'TIẾNG NGA' }, { key: 'duc', label: 'TIẾNG ĐỨC' }
    ];

    let fullHtml = '';

    subjects.forEach(sub => {
        const filteredData = sourceData.filter(row => isSubjectMarked(row, sub.key, mapping));

        if (filteredData.length > 0) {
            // Sort by name for grading list
            filteredData.sort((a, b) => {
                const nameA = splitVietnameseName(a.hoten || a[mapping['hoten']] || "");
                const nameB = splitVietnameseName(b.hoten || b[mapping['hoten']] || "");
                return nameA.ten.localeCompare(nameB.ten, 'vi') || nameA.ho.localeCompare(nameB.ho, 'vi');
            });

            fullHtml += `
                <div class="print-container page-break">
                    ${generatePrintHeaderHTML(dept, school, `DANH SÁCH CHẤM THI - MÔN: ${sub.label}`, exam)}

                    <table class="print-table">
                        <thead>
                            <tr>
                                <th style="width:40px">STT</th>
                                <th style="width:100px">SBD</th>
                                <th>HỌ VÀ TÊN</th>
                                <th style="width:80px">LỚP</th>
                                <th style="width:100px">ĐIỂM</th>
                                <th style="width:150px">CHỮ KÝ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredData.map((row, idx) => {
                                // Extract values handling both raw and generated student objects
                                const sbdVal = row.sbd || row[mapping['sbd']] || '';
                                const nameVal = row.hoten || row[mapping['hoten']] || '';
                                const lopVal = row.lop || row[mapping['lop']] || '';

                                return `
                                    <tr>
                                        <td style="text-align:center">${idx + 1}</td>
                                        <td style="text-align:center; font-weight:bold">${sbdVal}</td>
                                        <td>${nameVal}</td>
                                        <td style="text-align:center">${lopVal}</td>
                                        <td></td>
                                        <td></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>

                    ${generatePrintFooterHTML()}
                </div>
            `;
        }
    });

    return fullHtml;
}
function generateRoomsPrintHTML(dept, school, exam, date, mode = 'rooms') {
    if (!generatedRooms || generatedRooms.length === 0) return '';
    
    // Resolve mapping: use activeFileName if available, otherwise search all files for a valid mapping
    let mapping = {};
    if (activeFileName && dataStore[activeFileName]?.mapping) {
        mapping = dataStore[activeFileName].mapping;
    } else {
        // Fallback: find first file with a valid mapping (has 'hoten' mapped)
        const fallbackFile = Object.keys(dataStore).find(fn => dataStore[fn]?.mapping?.hoten);
        if (fallbackFile) mapping = dataStore[fallbackFile].mapping;
    }
    const subjects = [
        { key: 'toan', label: 'TOÁN' }, { key: 'van', label: 'NGỮ VĂN' },
        { key: 'anh', label: 'TIẾNG ANH' }, { key: 'ly', label: 'VẬT LÝ' },
        { key: 'hoa', label: 'HÓA HỌC' }, { key: 'sinh', label: 'SINH HỌC' },
        { key: 'su', label: 'LỊCH SỬ' }, { key: 'dia', label: 'ĐỊA LÝ' },
        { key: 'gdkt', label: 'GDKTPL' }, { key: 'tin', label: 'TIN HỌC' },
        { key: 'cnn', label: 'CÔNG NGHỆ' }, { key: 'cnc', label: 'CÔNG NGHỆ' },
        { key: 'trung', label: 'TIẾNG TRUNG' }, { key: 'nhat', label: 'TIẾNG NHẬT' },
        { key: 'nga', label: 'TIẾNG NGA' }, { key: 'phap', label: 'TIẾNG PHÁP' },
        { key: 'han', label: 'TIẾNG HÀN' }, { key: 'duc', label: 'TIẾNG ĐỨC' }
    ];

    let fullHtml = '';

    generatedRooms.forEach(room => {
        // 1. Calling List
        if (mode === 'rooms' || mode === 'calling') {
            fullHtml += `
                <div class="print-container page-break">
                    ${generatePrintHeaderHTML(dept, school, 'DANH SÁCH GỌI THÍ SINH VÀO PHÒNG THI', `PHÒNG THI SỐ: ${room.number} | ${exam}`)}
                    <table class="print-table">
                        <thead>
                            <tr>
                                <th style="width:40px">STT</th>
                                <th style="width:100px">SBD</th>
                                <th>HỌ VÀ TÊN</th>
                                <th style="width:80px">LỚP</th>
                                <th>MÔN ĐĂNG KÝ</th>
                                <th style="width:120px">KÝ TÊN</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${room.students.map(s => {
                                const registered = getFullStudentSubjects(s, mapping).join(', ');

                                return `
                                    <tr>
                                        <td style="text-align:center">${s.stt}</td>
                                        <td style="text-align:center; font-weight:bold">${s.sbd}</td>
                                        <td>${s.hoten}</td>
                                        <td style="text-align:center">${s.lop || ''}</td>
                                        <td style="font-size:9pt">${registered}</td>
                                        <td></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                    <div class="print-footer">
                        <div class="print-footer-item">
                            <i>Người lập biểu</i><br><br><br>
                            <span style="font-weight:bold">${document.getElementById('excel-creator-name')?.value || '........................'}</span>
                        </div>
                        <div class="print-footer-item">
                            <i>Ngày ..... tháng ..... năm 2026</i><br>
                            <b>CÁN BỘ COI THI</b><br><br><br>
                            <span style="font-style:italic; font-size:10pt">(Ký và ghi rõ họ tên)</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // 2. Collection Records (Fixed 4 Sheets Per Room: Văn, Toán, Tự chọn Ca 1, Tự chọn Ca 2)
        if (mode === 'rooms' || mode === 'collection') {
            const collectionGroups = [
                { id: 'VAN', title: 'MÔN: NGỮ VĂN', type: 'single', key: 'van' },
                { id: 'TOAN', title: 'MÔN: TOÁN', type: 'single', key: 'toan' },
                { id: 'CA1', title: 'CÁC MÔN TỰ CHỌN - CA 1', type: 'multi', index: 0 }, // Môn thứ nhất
                { id: 'CA2', title: 'CÁC MÔN TỰ CHỌN - CA 2', type: 'multi', index: 1 }  // Môn thứ hai
            ];

            collectionGroups.forEach(group => {
                const actualSessionCount = group.type === 'single' ? room.students.length : room.students.filter(s => getGlobalStudentSubjects(s, mapping)[group.index] !== undefined).length;

                fullHtml += `
                    <div class="print-container page-break">
                        ${generatePrintHeaderHTML(dept, school, 'PHIẾU THU BÀI THI', `PHÒNG THI SỐ: ${room.number} | ${group.title}`)}
                        
                        <table class="print-table">
                            <thead>
                                <tr>
                                    <th style="width:35px">STT</th>
                                    <th style="width:80px">SBD</th>
                                    <th>HỌ VÀ TÊN</th>
                                    <th style="width:60px">LỚP</th>
                                    ${group.type === 'multi' ? '<th style="width:110px">MÔN THI</th>' : ''}
                                    <th style="width:55px">SỐ TỜ</th>
                                    <th style="width:65px">MÃ ĐỀ</th>
                                    <th style="width:110px">KÝ TÊN</th>
                                    <th>GHI CHÚ</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(() => {
                                    if (group.type === 'single') {
                                        return room.students.map((s, idx) => `
                                            <tr>
                                                <td style="text-align:center">${idx + 1}</td>
                                                <td style="text-align:center; font-weight:bold">${s.sbd}</td>
                                                <td>${s.hoten}</td>
                                                <td style="text-align:center">${s.lop || ''}</td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
                                            </tr>
                                        `).join('');
                                    } else {
                                        return room.students
                                            .filter(s => {
                                                const registeredSubs = getGlobalStudentSubjects(s, mapping);
                                                return registeredSubs[group.index] !== undefined;
                                            })
                                            .map((s, idx) => {
                                                const registeredSubs = getGlobalStudentSubjects(s, mapping);
                                                const subLabel = registeredSubs[group.index];
                                                
                                                return `
                                                    <tr>
                                                        <td style="text-align:center">${idx + 1}</td>
                                                        <td style="text-align:center; font-weight:bold">${s.sbd}</td>
                                                        <td>${s.hoten}</td>
                                                        <td style="text-align:center">${s.lop || ''}</td>
                                                        <td style="text-align:center; font-weight:bold">${subLabel}</td>
                                                        <td></td>
                                                        <td></td>
                                                        <td></td>
                                                        <td></td>
                                                    </tr>
                                                `;
                                            }).join('');
                                    }
                                })()}
                            </tbody>
                        </table>
                        <div style="border:0.5pt solid black; padding:8px; margin-top:10px; font-size:9pt; line-height: 1.3;">
                            <b>BÁO CÁO PHÒNG THI (${group.title}):</b><br>
                            - Tổng số thí sinh: <b>${actualSessionCount}</b> - Có mặt: ......... - Vắng: ......... (SBD vắng: .........................)<br>
                            - Tổng số bài thi: .................. - Tổng số tờ giấy thi: .................. - Tình trạng túi đề: .........................
                        </div>
                        <div class="print-footer" style="margin-top:15px">
                            <div class="print-footer-item">
                                <b>CÁN BỘ COI THI 1</b><br><br><br>
                                <span>(Ký và ghi rõ họ tên)</span>
                            </div>
                            <div class="print-footer-item">
                                <i>Ngày ..... tháng ..... năm 2026</i><br>
                                <b>CÁN BỘ COI THI 2</b><br><br><br>
                                <span>(Ký và ghi rõ họ tên)</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        // 3. Seating Diagram (Part of rooms mode)
        if (mode === 'rooms') {
            const totalSlots = Math.max(24, Math.ceil(room.students.length / 4) * 4);
            fullHtml += `
                <div class="print-container page-break">
                    ${generatePrintHeaderHTML(dept, school, 'SƠ ĐỒ CHỖ NGỒI THÍ SINH', `PHÒNG THI SỐ: ${room.number}`)}
                    <div style="text-align:center; padding:10px; border:2pt solid #000; margin-bottom:30px; font-weight:bold; font-size:14pt; background:#f8f9fa">
                        BẢNG GIẢNG (PHÍA TRÊN)
                    </div>
                    <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                        ${Array.from({length: totalSlots}).map((_, i) => {
                            const s = room.students[i];
                            return `
                                <div style="border:1pt solid #000; height:100px; padding:8px; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; background:${s ? '#fff' : '#f2f2f2'}">
                                    <div style="font-size:9pt; color:#666">Chỗ số: ${i + 1}</div>
                                    ${s ? `
                                        <div style="font-weight:bold; font-size:11pt; margin:4px 0">${s.hoten}</div>
                                        <div style="font-weight:bold; font-size:12pt; color:#000">${s.sbd}</div>
                                    ` : '<div style="color:#000; font-style:italic">TRỐNG</div>'}
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div style="margin-top:40px; text-align:right">
                        <i>Ngày ..... tháng ..... năm 2026</i><br>
                        <b>GIÁM THỊ COI THI</b><br><br><br><br>
                        <span>(Ký và ghi rõ họ tên)</span>
                    </div>
                </div>
            `;
        }
    });

    return fullHtml;
}

function generateExamBagLabels(exam) {
    if (!generatedRooms || generatedRooms.length === 0) return '';
    const mapping = dataStore[activeFileName]?.mapping || {};
    
    const dept = (document.getElementById('excel-dept-name')?.value || "SỞ GIÁO DỤC VÀ ĐÀO TẠO").toUpperCase();
    const school = (document.getElementById('excel-board-name')?.value || "HỘI ĐỒNG THI").toUpperCase();

    let html = '';
    const itemsPerBatch = 4; // 4 labels per page
    let labelIndex = 0;

    generatedRooms.forEach((room) => {
        const electiveKeys = ['ly', 'hoa', 'sinh', 'su', 'dia', 'gdkt', 'tin', 'cnn', 'cnc', 'anh', 'nhat', 'trung', 'han', 'phap', 'nga', 'duc'];
        const subjectLabelsMap = {
            'anh': 'Tiếng Anh', 'ly': 'Vật lý', 'hoa': 'Hóa học', 'sinh': 'Sinh học', 'su': 'Lịch sử', 'dia': 'Địa lý', 'gdkt': 'GDKTPL', 'tin': 'Tin học', 'cnn': 'Công nghệ', 'cnc': 'Công nghệ',
            'nhat': 'Tiếng Nhật', 'trung': 'Tiếng Trung', 'han': 'Tiếng Hàn', 'phap': 'Tiếng Pháp', 'nga': 'Tiếng Nga', 'duc': 'Tiếng Đức'
        };

        // Standard sessions for labels
        const targetSessions = [
            { id: 'VAN', label: 'NGỮ VĂN', type: 'fixed' },
            { id: 'TOAN', label: 'TOÁN', type: 'fixed' },
            { id: 'CA1', label: 'TỰ CHỌN - CA 1', index: 0, type: 'elective' },
            { id: 'CA2', label: 'TỰ CHỌN - CA 2', index: 1, type: 'elective' }
        ];

        targetSessions.forEach(session => {
            if (session.type === 'fixed') {
                const count = room.students.length;
                if (count > 0) addLabel(session.label, count, room);
            } else {
                // For electives, identify unique subjects in this room's session
                const uniqueSubsInSession = [];
                room.students.forEach(s => {
                    const studentSubs = electiveKeys.filter(k => isSubjectMarked(s, k, mapping));
                    const subKey = studentSubs[session.index];
                    if (subKey && !uniqueSubsInSession.includes(subKey)) uniqueSubsInSession.push(subKey);
                });

                uniqueSubsInSession.forEach(subKey => {
                    const studentCount = room.students.filter(s => {
                        const studentSubs = electiveKeys.filter(k => isSubjectMarked(s, k, mapping));
                        return studentSubs[session.index] === subKey;
                    }).length;

                    const displayLabel = (subjectLabelsMap[subKey] || subKey.toUpperCase()).toUpperCase() + ` (${session.id})`;
                    addLabel(displayLabel, studentCount, room);
                });
            }
        });

        function addLabel(subLabel, studentCount, room) {
            if (labelIndex % itemsPerBatch === 0) {
                if (labelIndex > 0) html += '</div>';
                html += '<div class="print-container page-break labels-page" style="display:grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 15px; font-family: \'Inter\', sans-serif;">';
            }

            html += `
                <div style="border:2pt solid #000; padding:10px 14px; position:relative; height:100%; display:flex; flex-direction:column; justify-content:space-between; color:#000; box-sizing: border-box; overflow:hidden; page-break-inside: avoid;">
                    <div style="text-align:center; border-bottom:1.5pt solid #000; padding-bottom:6px; margin-bottom:8px">
                        <div style="font-size:9pt; font-weight:700; color:#000; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${dept}</div>
                        <div style="font-size:9.5pt; font-weight:900; color:#000; margin-top:2px; letter-spacing:-0.2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${school}</div>
                        <div style="font-size:8.5pt; margin-top:3px; border-top:1pt solid #000; padding-top:3px; color:#000">${exam.toUpperCase()}</div>
                        <div style="font-weight:900; font-size:14pt; margin-top:4px; color:#000; letter-spacing:0.5px;">NHÃN TÚI BÀI THI</div>
                    </div>
                    
                    <div style="flex:1; color:#000">
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:12pt; font-weight:600">
                            <span style="white-space:nowrap">Phòng thi: <b style="font-size:14pt; color:#000">${room.number}</b></span>
                            <span style="white-space:nowrap">Số TS: <b style="font-size:14pt; color:#000">${studentCount}</b></span>
                        </div>
                        
                        <div style="margin-bottom:12px; padding:8px 10px; border-radius:6px; border:1.5pt solid #000; background:#f8f9fa; text-align:center">
                            <div style="font-size:10pt; color:#000; text-transform:uppercase; font-weight:900; margin-bottom:2px; letter-spacing:0.5px">MÔN THI</div>
                            <div style="font-size:15pt; font-weight:900; color:#000; line-height:1.2">${subLabel}</div>
                        </div>

                        <div style="font-size:11pt; line-height:1.7; font-weight:600; color:#000">
                            - Số bài thi: .....................................................<br>
                            - Số tờ giấy thi: ................................................<br>
                            - SBD vắng: .....................................................<br>
                            ........................................................................
                        </div>
                    </div>

                    <div style="display:flex; justify-content:space-between; font-size:9.5pt; border-top:1pt dashed #000; padding-top:8px; margin-top:10px">
                        <div style="text-align:center; width:45%">
                            <b style="font-size:11pt">GT 1</b><br><br><br>
                            <span style="font-weight:bold">(Ký tên)</span>
                        </div>
                        <div style="text-align:center; width:45%">
                            <b style="font-size:11pt">GT 2</b><br><br><br>
                            <span style="font-weight:bold">(Ký tên)</span>
                        </div>
                    </div>
                </div>
            `;
            labelIndex++;
        }
    });

    if (labelIndex > 0) html += '</div>';
    return html;
}

function generateExamBagLabelsBySession(exam) {
    if (!generatedRooms || generatedRooms.length === 0) return '';
    const mapping = dataStore[activeFileName]?.mapping || {};
    
    const dept = (document.getElementById('excel-dept-name')?.value || document.getElementById('cfg-dept-name')?.value || "SỞ GIÁO DỤC VÀ ĐÀO TẠO").toUpperCase();
    const school = (document.getElementById('excel-board-name')?.value || document.getElementById('cfg-school-name')?.value || "HỘI ĐỒNG THI").toUpperCase();

    let html = '';
    const itemsPerBatch = 4; // 4 labels per page
    let labelIndex = 0;

    generatedRooms.forEach((room) => {
        const electiveKeys = ['ly', 'hoa', 'sinh', 'su', 'dia', 'gdkt', 'tin', 'cnn', 'cnc', 'anh', 'nhat', 'trung', 'han', 'phap', 'nga', 'duc'];
        const subjectLabelsMap = {
            'anh': 'Tiếng Anh', 'ly': 'Vật lý', 'hoa': 'Hóa học', 'sinh': 'Sinh học', 'su': 'Lịch sử', 'dia': 'Địa lý', 'gdkt': 'GDKTPL', 'tin': 'Tin học', 'cnn': 'Công nghệ', 'cnc': 'Công nghệ',
            'nhat': 'Tiếng Nhật', 'trung': 'Tiếng Trung', 'han': 'Tiếng Hàn', 'phap': 'Tiếng Pháp', 'nga': 'Tiếng Nga', 'duc': 'Tiếng Đức'
        };

        const targetSessions = [
            { id: 'VAN', label: 'NGỮ VĂN', type: 'fixed', sessionHeader: 'NGỮ VĂN' },
            { id: 'TOAN', label: 'TOÁN', type: 'fixed', sessionHeader: 'TOÁN' },
            { id: 'CA1', label: 'TỰ CHỌN - CA 1', index: 0, type: 'elective', sessionHeader: 'TỰ CHỌN CA 1' },
            { id: 'CA2', label: 'TỰ CHỌN - CA 2', index: 1, type: 'elective', sessionHeader: 'TỰ CHỌN CA 2' }
        ];

        targetSessions.forEach(session => {
            if (session.type === 'fixed') {
                const count = room.students.length;
                if (count > 0) addLabel(session.label, count, room, session.sessionHeader);
            } else {
                const uniqueSubsInSession = [];
                let totalStudentsInSession = 0;
                room.students.forEach(s => {
                    const studentSubs = electiveKeys.filter(k => isSubjectMarked(s, k, mapping));
                    const subKey = studentSubs[session.index];
                    if (subKey) { totalStudentsInSession++; if (!uniqueSubsInSession.includes(subKey)) uniqueSubsInSession.push(subKey); }
                });

                if (totalStudentsInSession > 0) {
                    const subNames = uniqueSubsInSession.map(subKey => (subjectLabelsMap[subKey] || subKey.toUpperCase()).toUpperCase());
                    addLabel(subNames.join(', '), totalStudentsInSession, room, session.sessionHeader);
                }
            }
        });

        function addLabel(subDisplay, studentCount, room, sessionHeader) {
            if (labelIndex % itemsPerBatch === 0) {
                if (labelIndex > 0) html += '</div>';
                html += '<div class="print-container page-break labels-page" style="display:grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 15px; font-family: \'Inter\', sans-serif;">';
            }

            html += `
                <div style="border:2pt solid #000; padding:10px 14px; position:relative; height:100%; display:flex; flex-direction:column; justify-content:space-between; color:#000; box-sizing: border-box; overflow:hidden; page-break-inside: avoid;">
                    <div style="text-align:center; border-bottom:1.5pt solid #000; padding-bottom:6px; margin-bottom:8px">
                        <div style="font-size:9pt; font-weight:700; color:#000; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${dept}</div>
                        <div style="font-size:9.5pt; font-weight:900; color:#000; margin-top:2px; letter-spacing:-0.2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${school}</div>
                        <div style="font-size:8.5pt; margin-top:3px; border-top:1pt solid #000; padding-top:3px; color:#000">${exam.toUpperCase()}</div>
                        <div style="font-weight:900; font-size:14pt; margin-top:4px; color:#000; letter-spacing:0.5px;">NHÃN TÚI BÀI THI</div>
                    </div>
                    
                    <div style="flex:1; color:#000">
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:12pt; font-weight:600">
                            <span style="white-space:nowrap">Phòng thi: <b style="font-size:14pt; color:#000">${room.number}</b></span>
                            <span style="white-space:nowrap">Số TS: <b style="font-size:14pt; color:#000">${studentCount}</b></span>
                        </div>
                        
                        <div style="margin-bottom:12px; padding:8px 10px; border-radius:6px; border:1.5pt solid #000; background:#f8f9fa; text-align:center">
                            <div style="font-size:10pt; color:#000; text-transform:uppercase; font-weight:900; margin-bottom:2px; letter-spacing:0.5px">MÔN THI (${sessionHeader})</div>
                            <div style="font-size:${subDisplay.length > 25 ? '12pt' : '15pt'}; font-weight:900; color:#000; line-height:1.2">${subDisplay}</div>
                        </div>

                        <div style="font-size:11pt; line-height:1.7; font-weight:600; color:#000">
                            - Số bài thi: .....................................................<br>
                            - Số tờ giấy thi: ................................................<br>
                            - SBD vắng: .....................................................<br>
                            ........................................................................
                        </div>
                    </div>

                    <div style="display:flex; justify-content:space-between; font-size:9.5pt; border-top:1pt dashed #000; padding-top:8px; margin-top:10px">
                        <div style="text-align:center; width:45%">
                            <b style="font-size:11pt">GT 1</b><br><br><br>
                            <span style="font-weight:bold">(Ký tên)</span>
                        </div>
                        <div style="text-align:center; width:45%">
                            <b style="font-size:11pt">GT 2</b><br><br><br>
                            <span style="font-weight:bold">(Ký tên)</span>
                        </div>
                    </div>
                </div>
            `;
            labelIndex++;
        }
    });

    if (labelIndex > 0) html += '</div>';
    return html;
}

function generateQuestionBagLabels(exam) {
    if (!generatedRooms || generatedRooms.length === 0) return '';
    const mapping = dataStore[activeFileName]?.mapping || {};
    
    const dept = (document.getElementById('excel-dept-name')?.value || document.getElementById('cfg-dept-name')?.value || "SỞ GIÁO DỤC VÀ ĐÀO TẠO").toUpperCase();
    const school = (document.getElementById('excel-board-name')?.value || document.getElementById('cfg-school-name')?.value || "HỘI ĐỒNG THI").toUpperCase();

    let html = '';
    const itemsPerBatch = 4; // 4 labels per page
    let labelIndex = 0;

    generatedRooms.forEach((room) => {
        const electiveKeys = ['ly', 'hoa', 'sinh', 'su', 'dia', 'gdkt', 'tin', 'cnn', 'cnc', 'anh', 'nhat', 'trung', 'han', 'phap', 'nga', 'duc'];
        const subjectLabelsMap = {
            'anh': 'Tiếng Anh', 'ly': 'Vật lý', 'hoa': 'Hóa học', 'sinh': 'Sinh học', 'su': 'Lịch sử', 'dia': 'Địa lý', 'gdkt': 'GDKTPL', 'tin': 'Tin học', 'cnn': 'Công nghệ', 'cnc': 'Công nghệ',
            'nhat': 'Tiếng Nhật', 'trung': 'Tiếng Trung', 'han': 'Tiếng Hàn', 'phap': 'Tiếng Pháp', 'nga': 'Tiếng Nga', 'duc': 'Tiếng Đức'
        };

        const targetSessions = [
            { id: 'VAN', label: 'NGỮ VĂN', type: 'fixed' },
            { id: 'TOAN', label: 'TOÁN', type: 'fixed' },
            { id: 'CA1', label: 'TỰ CHỌN - CA 1', index: 0, type: 'elective' },
            { id: 'CA2', label: 'TỰ CHỌN - CA 2', index: 1, type: 'elective' }
        ];

        targetSessions.forEach(session => {
            if (session.type === 'fixed') {
                const count = room.students.length;
                if (count > 0) addLabel(session.label, count, room);
            } else {
                const uniqueSubsInSession = [];
                room.students.forEach(s => {
                    const studentSubs = electiveKeys.filter(k => isSubjectMarked(s, k, mapping));
                    const subKey = studentSubs[session.index];
                    if (subKey && !uniqueSubsInSession.includes(subKey)) uniqueSubsInSession.push(subKey);
                });

                uniqueSubsInSession.forEach(subKey => {
                    const studentCount = room.students.filter(s => {
                        const studentSubs = electiveKeys.filter(k => isSubjectMarked(s, k, mapping));
                        return studentSubs[session.index] === subKey;
                    }).length;

                    const displayLabel = (subjectLabelsMap[subKey] || subKey.toUpperCase()).toUpperCase() + ` (${session.id})`;
                    addLabel(displayLabel, studentCount, room);
                });
            }
        });

        function addLabel(subLabel, studentCount, room) {
            if (labelIndex % itemsPerBatch === 0) {
                if (labelIndex > 0) html += '</div>';
                html += '<div class="print-container page-break labels-page" style="display:grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 15px; font-family: \'Inter\', sans-serif;">';
            }

            const questionCount = studentCount + 1; // 1 reserve question paper

            html += `
                <div style="border:2pt solid #000; padding:10px 14px; position:relative; height:100%; display:flex; flex-direction:column; justify-content:space-between; color:#000; box-sizing: border-box; overflow:hidden; page-break-inside: avoid;">
                    <div style="text-align:center; border-bottom:1.5pt solid #000; padding-bottom:6px; margin-bottom:8px">
                        <div style="font-size:9pt; font-weight:700; color:#000; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${dept}</div>
                        <div style="font-size:9.5pt; font-weight:900; color:#000; margin-top:2px; letter-spacing:-0.2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${school}</div>
                        <div style="font-size:8.5pt; margin-top:3px; border-top:1pt solid #000; padding-top:3px; color:#000">${exam.toUpperCase()}</div>
                        <div style="font-weight:900; font-size:15pt; margin-top:4px; color:#000; letter-spacing:0.5px;">NHÃN TÚI ĐỀ THI</div>
                    </div>
                    
                    <div style="flex:1; color:#000">
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:12pt; font-weight:600">
                            <span style="white-space:nowrap">Phòng thi: <b style="font-size:14pt; color:#000">${room.number}</b></span>
                            <span style="white-space:nowrap">Số TS: <b style="font-size:14pt; color:#000">${studentCount}</b></span>
                        </div>
                        
                        <div style="margin-bottom:12px; padding:8px 10px; border-radius:6px; border:1.5pt solid #000; background:#f8f9fa; text-align:center">
                            <div style="font-size:10pt; color:#000; text-transform:uppercase; font-weight:900; margin-bottom:2px; letter-spacing:0.5px">MÔN THI</div>
                            <div style="font-size:15pt; font-weight:900; color:#000; line-height:1.2">${subLabel}</div>
                        </div>

                        <div style="font-size:11pt; line-height:1.7; font-weight:600; color:#000">
                            - Số lượng đề thi bên trong: <b style="font-size:14pt; color:#000; font-weight:900">${questionCount}</b> đề <i style="font-size:10pt; font-weight:normal; color:#000;">(Đã gồm 1 đề dự phòng)</i><br>
                            - Buổi thi / Ngày thi: .....................................................<br>
                        </div>
                        <div style="margin-top:10px; font-size:10pt; font-weight:600; color:#000; border-top:1pt dashed #000; padding-top:8px; line-height: 1.3;">
                            ⚠️ Giám thị chỉ được cắt túi đề thi trước sự chứng kiến của thí sinh lúc ....... giờ ....... phút.
                        </div>
                    </div>
                    
                    <div style="display:flex; justify-content:space-between; margin-top:14px; border-top:1.5pt solid #000; padding-top:8px; font-size:9.5pt; text-align:center; font-weight:bold; color:#000">
                        <div style="width:32%">
                            <span style="font-weight:900">BÀN GIAO ĐỀ THI</span><br>
                            <span style="font-size:8pt; font-weight:normal; color:#000">(Ký và ghi rõ họ tên)</span>
                            <br><br><br>
                        </div>
                        <div style="width:32%">
                            <span style="font-weight:900">CÁN BỘ COI THI 1</span><br>
                            <span style="font-size:8pt; font-weight:normal; color:#000">(Ký và ghi rõ họ tên)</span>
                            <br><br><br>
                        </div>
                        <div style="width:32%">
                            <span style="font-weight:900">CÁN BỘ COI THI 2</span><br>
                            <span style="font-size:8pt; font-weight:normal; color:#000">(Ký và ghi rõ họ tên)</span>
                            <br><br><br>
                        </div>
                    </div>
                </div>
            `;
            labelIndex++;
        }
    });

    if (labelIndex > 0) html += '</div>';
    return html;
}

function generateMasterQuestionBagLabels(exam) {
    if (!generatedRooms || generatedRooms.length === 0) return '';
    const mapping = dataStore[activeFileName]?.mapping || {};
    
    const dept = (document.getElementById('excel-dept-name')?.value || document.getElementById('cfg-dept-name')?.value || "SỞ GIÁO DỤC VÀ ĐÀO TẠO").toUpperCase();
    const school = (document.getElementById('excel-board-name')?.value || document.getElementById('cfg-school-name')?.value || "HỘI ĐỒNG THI").toUpperCase();

    let html = '';
    const itemsPerBatch = 4; // 4 labels per page
    let labelIndex = 0;

    const electiveKeys = ['ly', 'hoa', 'sinh', 'su', 'dia', 'gdkt', 'tin', 'cnn', 'cnc', 'anh', 'nhat', 'trung', 'han', 'phap', 'nga', 'duc'];
    const subjectLabelsMap = {
        'anh': 'Tiếng Anh', 'ly': 'Vật lý', 'hoa': 'Hóa học', 'sinh': 'Sinh học', 'su': 'Lịch sử', 'dia': 'Địa lý', 'gdkt': 'GDKTPL', 'tin': 'Tin học', 'cnn': 'Công nghệ', 'cnc': 'Công nghệ',
        'nhat': 'Tiếng Nhật', 'trung': 'Tiếng Trung', 'han': 'Tiếng Hàn', 'phap': 'Tiếng Pháp', 'nga': 'Tiếng Nga', 'duc': 'Tiếng Đức'
    };

    const targetSessions = [
        { id: 'VAN', label: 'NGỮ VĂN', type: 'fixed' },
        { id: 'TOAN', label: 'TOÁN', type: 'fixed' },
        { id: 'CA1', label: 'TỰ CHỌN - CA 1', index: 0, type: 'elective' },
        { id: 'CA2', label: 'TỰ CHỌN - CA 2', index: 1, type: 'elective' }
    ];

    targetSessions.forEach(session => {
        if (session.type === 'fixed') {
            let totalStudents = 0;
            let roomCount = 0;
            generatedRooms.forEach(r => {
                if (r.students.length > 0) {
                    roomCount++;
                    totalStudents += r.students.length;
                }
            });
            if (totalStudents > 0) {
                const totalPapers = totalStudents + roomCount;
                addMasterLabels(session.label, session.label, totalStudents, roomCount, totalPapers);
            }
        } else {
            const uniqueSubsInSession = [];
            generatedRooms.forEach(r => {
                r.students.forEach(s => {
                    const studentSubs = electiveKeys.filter(k => isSubjectMarked(s, k, mapping));
                    const subKey = studentSubs[session.index];
                    if (subKey && !uniqueSubsInSession.includes(subKey)) uniqueSubsInSession.push(subKey);
                });
            });

            uniqueSubsInSession.forEach(subKey => {
                let totalStudents = 0;
                let roomCount = 0;
                generatedRooms.forEach(r => {
                    const sCount = r.students.filter(s => {
                        const studentSubs = electiveKeys.filter(k => isSubjectMarked(s, k, mapping));
                        return studentSubs[session.index] === subKey;
                    }).length;
                    if (sCount > 0) {
                        roomCount++;
                        totalStudents += sCount;
                    }
                });
                const subName = subjectLabelsMap[subKey] || subKey.toUpperCase();
                const totalPapers = totalStudents + roomCount;
                addMasterLabels(subName.toUpperCase(), session.label, totalStudents, roomCount, totalPapers);
            });
        }
    });

    function addMasterLabels(subjectName, sessionLabel, totalStudents, roomCount, totalPapers) {
        // Label 1: Official
        if (labelIndex % itemsPerBatch === 0) {
            if (labelIndex > 0) html += '</div>';
            html += '<div class="print-container page-break labels-page" style="display:grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 15px; font-family: \'Inter\', sans-serif;">';
        }

        html += `
            <div style="border:2pt solid #000; padding:10px 14px; position:relative; height:100%; display:flex; flex-direction:column; justify-content:space-between; color:#000; box-sizing: border-box; overflow:hidden; page-break-inside: avoid;">
                <div style="text-align:center; border-bottom:1.5pt solid #000; padding-bottom:6px; margin-bottom:8px">
                    <div style="font-size:9pt; font-weight:700; color:#000; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${dept}</div>
                    <div style="font-size:9.5pt; font-weight:900; color:#000; margin-top:2px; letter-spacing:-0.2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${school}</div>
                    <div style="font-size:8.5pt; margin-top:3px; border-top:1pt solid #000; padding-top:3px; color:#000">${exam.toUpperCase()}</div>
                    <div style="font-weight:900; font-size:15pt; margin-top:4px; color:#e11d48; letter-spacing:0.5px;">TÚI ĐỀ THI CHÍNH THỨC</div>
                </div>
                
                <div style="flex:1; color:#000">
                    <div style="margin-bottom:12px; padding:8px 10px; border-radius:6px; border:1.5pt solid #000; background:#fff1f2; text-align:center">
                        <div style="font-size:10pt; color:#9f1239; text-transform:uppercase; font-weight:900; margin-bottom:2px; letter-spacing:0.5px">MÔN THI (${sessionLabel})</div>
                        <div style="font-size:${subjectName.length > 25 ? '13pt' : '16pt'}; font-weight:900; color:#9f1239; line-height:1.2">${subjectName}</div>
                    </div>

                    <div style="font-size:11pt; line-height:1.8; font-weight:600; color:#000">
                        - Số phòng thi: <b style="font-size:13pt">${roomCount}</b> phòng <i style="font-size:10pt; font-weight:normal">(Tổng số TS: ${totalStudents})</i><br>
                        - Số lượng đề bên trong: <b style="font-size:14pt; color:#e11d48; font-weight:900">01</b> bộ đề gốc<br>
                        - Ngày thi: ................................... Buổi thi: .................................<br>
                    </div>
                    <div style="margin-top:8px; font-size:10pt; font-weight:600; color:#000; border-top:1pt dashed #000; padding-top:8px; line-height: 1.3;">
                        ⚠️ Túi chứa đề chính thức phân phối cho các phòng thi. Bảo mật tuyệt đối theo quy định.
                    </div>
                </div>
                
                <div style="display:flex; justify-content:space-between; margin-top:12px; border-top:1.5pt solid #000; padding-top:8px; font-size:9.5pt; text-align:center; font-weight:bold; color:#000">
                    <div style="width:45%">
                        <span style="font-weight:900">TRƯỞNG ĐIỂM THI</span><br>
                        <span style="font-size:8pt; font-weight:normal; color:#000">(Ký, ghi rõ họ tên và đóng dấu)</span>
                        <br><br><br>
                    </div>
                    <div style="width:45%">
                        <span style="font-weight:900">BỘ PHẬN IN SAO</span><br>
                        <span style="font-size:8pt; font-weight:normal; color:#000">(Ký và ghi rõ họ tên)</span>
                        <br><br><br>
                    </div>
                </div>
            </div>
        `;
        labelIndex++;

        // Label 2: Backup
        if (labelIndex % itemsPerBatch === 0) {
            if (labelIndex > 0) html += '</div>';
            html += '<div class="print-container page-break labels-page" style="display:grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 15px; font-family: \'Inter\', sans-serif;">';
        }

        html += `
            <div style="border:2pt solid #000; padding:10px 14px; position:relative; height:100%; display:flex; flex-direction:column; justify-content:space-between; color:#000; box-sizing: border-box; overflow:hidden; page-break-inside: avoid;">
                <div style="text-align:center; border-bottom:1.5pt solid #000; padding-bottom:6px; margin-bottom:8px">
                    <div style="font-size:9pt; font-weight:700; color:#000; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${dept}</div>
                    <div style="font-size:9.5pt; font-weight:900; color:#000; margin-top:2px; letter-spacing:-0.2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${school}</div>
                    <div style="font-size:8.5pt; margin-top:3px; border-top:1pt solid #000; padding-top:3px; color:#000">${exam.toUpperCase()}</div>
                    <div style="font-weight:900; font-size:15pt; margin-top:4px; color:#2563eb; letter-spacing:0.5px;">TÚI ĐỀ THI DỰ PHÒNG</div>
                </div>
                
                <div style="flex:1; color:#000">
                    <div style="margin-bottom:12px; padding:8px 10px; border-radius:6px; border:1.5pt solid #000; background:#eff6ff; text-align:center">
                        <div style="font-size:10pt; color:#1e40af; text-transform:uppercase; font-weight:900; margin-bottom:2px; letter-spacing:0.5px">MÔN THI (${sessionLabel})</div>
                        <div style="font-size:${subjectName.length > 25 ? '13pt' : '16pt'}; font-weight:900; color:#1e40af; line-height:1.2">${subjectName}</div>
                    </div>

                    <div style="font-size:11pt; line-height:1.8; font-weight:600; color:#000">
                        - Số lượng đề dự phòng: .......................................................... đề<br>
                        - Ngày thi: ................................... Buổi thi: .................................<br>
                        - Ghi chú: Sử dụng khi đề chính thức gặp sự cố theo lệnh Trưởng điểm.<br>
                    </div>
                    <div style="margin-top:8px; font-size:10pt; font-weight:600; color:#000; border-top:1pt dashed #000; padding-top:8px; line-height: 1.3;">
                        ⚠️ Chỉ mở túi đề dự phòng khi có ý kiến chỉ đạo trực tiếp của Trưởng điểm thi.
                    </div>
                </div>
                
                <div style="display:flex; justify-content:space-between; margin-top:12px; border-top:1.5pt solid #000; padding-top:8px; font-size:9.5pt; text-align:center; font-weight:bold; color:#000">
                    <div style="width:45%">
                        <span style="font-weight:900">TRƯỞNG ĐIỂM THI</span><br>
                        <span style="font-size:8pt; font-weight:normal; color:#000">(Ký, ghi rõ họ tên và đóng dấu)</span>
                        <br><br><br>
                    </div>
                    <div style="width:45%">
                        <span style="font-weight:900">BỘ PHẬN IN SAO</span><br>
                        <span style="font-size:8pt; font-weight:normal; color:#000">(Ký và ghi rõ họ tên)</span>
                        <br><br><br>
                    </div>
                </div>
            </div>
        `;
        labelIndex++;
    }

    if (labelIndex > 0) html += '</div>';
    return html;
}

function generateAllDiagramsPrintHTML(dept, school, exam) {
    if (!generatedRooms || generatedRooms.length === 0) return '';
    
    let html = '';
    generatedRooms.forEach(room => {
        const totalSlots = Math.max(24, Math.ceil(room.students.length / 4) * 4);
        html += `
            <div class="print-container page-break">
                ${generatePrintHeaderHTML(dept, school, 'SƠ ĐỒ CHỖ NGỒI THÍ SINH', `PHÒNG THI SỐ: ${room.number} | ${exam}`)}
                
                <div style="text-align:center; padding:10px; border:2pt solid #000; margin-bottom:30px; font-weight:bold; font-size:14pt; background:#f8f9fa">
                    BẢNG GIẢNG (PHÍA TRÊN)
                </div>

                <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                    ${Array.from({length: totalSlots}).map((_, i) => {
                        const s = room.students[i];
                        return `
                            <div style="border:1pt solid #000; height:100px; padding:8px; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; background:${s ? '#fff' : '#f2f2f2'}">
                                <div style="font-size:9pt; color:#666">Chỗ số: ${i + 1}</div>
                                ${s ? `
                                    <div style="font-weight:bold; font-size:11pt; margin:4px 0">${s.hoten}</div>
                                    <div style="font-weight:bold; font-size:12pt; color:#000">${s.sbd}</div>
                                ` : '<div style="color:#000; font-style:italic">TRỐNG</div>'}
                            </div>
                        `;
                    }).join('')}
                </div>

                <div style="margin-top:40px; text-align:right">
                    <i>Ngày ..... tháng ..... năm 2026</i><br>
                    <b>GIÁM THỊ COI THI</b><br><br><br><br>
                    <span>(Ký và ghi rõ họ tên)</span>
                </div>
            </div>
        `;
    });
    return html;
}

function generateDetailedStatsPrintHTML(dept, school, exam) {
    if (!generatedRooms || generatedRooms.length === 0) return '';
    const mapping = dataStore[activeFileName]?.mapping || {};
    const subjects = ['ly', 'hoa', 'sinh', 'su', 'dia', 'gdkt', 'tin', 'cnn', 'cnc', 'anh', 'nhat', 'trung', 'han', 'phap', 'nga', 'duc'];
    const subjectLabels = ["Lý", "Hóa", "Sinh", "Sử", "Địa", "GDKTPL", "Tin", "CNN", "CNC", "Anh", "Nhật", "Trung", "Hàn", "Pháp", "Nga", "Đức"];

    // Build matrix
    const matrix = {};
    subjectLabels.forEach(label => {
        matrix[label] = { ca1: { total: 0, rooms: {} }, ca2: { total: 0, rooms: {} } };
    });

    generatedRooms.forEach(room => {
        room.students.forEach(s => {
            const subs = getGlobalStudentSubjects(s, mapping);

            if (subs[0]) {
                const m = subs[0];
                if (matrix[m]) {
                    matrix[m].ca1.total++;
                    matrix[m].ca1.rooms[room.number] = (matrix[m].ca1.rooms[room.number] || 0) + 1;
                }
            }
            if (subs[1]) {
                const m = subs[1];
                if (matrix[m]) {
                    matrix[m].ca2.total++;
                    matrix[m].ca2.rooms[room.number] = (matrix[m].ca2.rooms[room.number] || 0) + 1;
                }
            }
        });
    });

    const roomNumbers = generatedRooms.map(r => r.number);

    return `
        <div class="print-container landscape page-break" style="width: 297mm !important; max-width: 297mm !important;">
            ${generatePrintHeaderHTML(dept, school, 'BẢNG THỐNG KÊ CHI TIẾT SỐ LƯỢNG MÔN THI THEO PHÒNG VÀ CA', exam)}

            <table class="print-table" style="font-size:9pt">
                <thead>
                    <tr>
                        <th rowspan="2" style="width:80px">Môn thi</th>
                        <th rowspan="2" style="width:50px">Ca</th>
                        <th rowspan="2" style="width:50px">Tổng</th>
                        <th colspan="${roomNumbers.length}">Phòng thi số</th>
                    </tr>
                    <tr>
                        ${roomNumbers.map(n => `<th style="min-width:30px">${n}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${Object.keys(matrix).map(sub => {
                        let rows = '';
                        ['ca1', 'ca2'].forEach((caKey, idx) => {
                            const data = matrix[sub][caKey];
                            if (data.total > 0) {
                                rows += `
                                    <tr>
                                        ${idx === 0 ? `<td rowspan="2" style="font-weight:bold">${sub}</td>` : ''}
                                        <td style="text-align:center">${caKey === 'ca1' ? '01' : '02'}</td>
                                        <td style="text-align:center; font-weight:bold">${data.total}</td>
                                        ${roomNumbers.map(n => `<td style="text-align:center">${data.rooms[n] || ''}</td>`).join('')}
                                    </tr>
                                `;
                            } else if (idx === 0) {
                                // Add a placeholder row if ca1 is empty but ca2 might not be (unlikely but safe)
                                rows += `
                                    <tr>
                                        <td rowspan="2" style="font-weight:bold">${sub}</td>
                                        <td style="text-align:center">01</td>
                                        <td style="text-align:center">-</td>
                                        ${roomNumbers.map(n => `<td style="text-align:center"></td>`).join('')}
                                    </tr>
                                `;
                            } else {
                                rows += `
                                    <tr>
                                        <td style="text-align:center">02</td>
                                        <td style="text-align:center">-</td>
                                        ${roomNumbers.map(n => `<td style="text-align:center"></td>`).join('')}
                                    </tr>
                                `;
                            }
                        });
                        return rows;
                    }).join('')}
                </tbody>
            </table>

            ${generatePrintFooterHTML()}
        </div>
    `;
}

window.openPrintPreview = openPrintPreview;
window.closePrintModal = closePrintModal;

// ============================================================================
// FLAGSHIP FEATURES IMPLEMENTATION (SAAS PREMIUM 2.0)
// ============================================================================

// --- 1. INSTANT LIVE DATA EDITOR ---
function openLiveEditor(originalIndex) {
    if (typeof excelData === 'undefined' || !excelData || !excelData[originalIndex]) {
        showAlert("⚠️ Thí sinh không tồn tại trong bộ nhớ!", "warning");
        return;
    }
    const student = excelData[originalIndex];
    const mapping = (dataStore[activeFileName] && dataStore[activeFileName].mapping) ? dataStore[activeFileName].mapping : {};
    
    document.getElementById('live-edit-idx').value = originalIndex;
    document.getElementById('live-edit-name').value = mapping['hoten'] ? (student[mapping['hoten']] || "") : "";
    document.getElementById('live-edit-sbd').value = mapping['sbd'] ? (student[mapping['sbd']] || "") : "";
    document.getElementById('live-edit-cccd').value = mapping['cccd'] ? (student[mapping['cccd']] || "") : "";
    document.getElementById('live-edit-class').value = mapping['lop'] ? (student[mapping['lop']] || "") : "";
    document.getElementById('live-edit-phone').value = mapping['dienthoai'] ? (student[mapping['dienthoai']] || "") : "";
    document.getElementById('live-edit-email').value = mapping['email'] ? (student[mapping['email']] || "") : "";
    
    // Render subjects grid
    const subjGrid = document.getElementById('live-edit-subjects-grid');
    if (subjGrid) {
        let subjHtml = "";
        const allSubjects = [
            { key: 'toan', label: 'Toán' },
            { key: 'van', label: 'Ngữ Văn' },
            { key: 'anh', label: 'Ngoại Ngữ' },
            { key: 'ly', label: 'Vật Lý' },
            { key: 'hoa', label: 'Hóa Học' },
            { key: 'sinh', label: 'Sinh Học' },
            { key: 'su', label: 'Lịch Sử' },
            { key: 'dia', label: 'Địa Lý' },
            { key: 'gdkt', label: 'GDKTPL' },
            { key: 'tin', label: 'Tin Học' },
            { key: 'cnn', label: 'CN Nông' },
            { key: 'cnc', label: 'CN Công' }
        ];
        allSubjects.forEach(s => {
            const mappedCol = mapping[s.key];
            const val = mappedCol ? student[mappedCol] : "";
            const isSelected = isSubjectMarked(student, s.key, mapping);
            subjHtml += `
                <label class="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-blue-500 transition-all shadow-sm">
                    <input type="checkbox" class="live-subj-cb form-checkbox h-4 w-4 text-blue-600 rounded" data-key="${s.key}" ${isSelected ? 'checked' : ''}>
                    <span class="text-xs font-bold text-slate-700">${s.label}</span>
                </label>
            `;
        });
        subjGrid.innerHTML = subjHtml;
    }
    
    const overlay = document.getElementById('live-editor-overlay');
    if (overlay) overlay.style.display = 'flex';
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeLiveEditor() {
    const overlay = document.getElementById('live-editor-overlay');
    if (overlay) overlay.style.display = 'none';
}

function saveLiveEdit() {
    const idxStr = document.getElementById('live-edit-idx').value;
    if (idxStr === "") return;
    const idx = parseInt(idxStr);
    if (!excelData || !excelData[idx]) return;
    
    const mapping = dataStore[activeFileName].mapping;
    if (mapping['hoten']) excelData[idx][mapping['hoten']] = document.getElementById('live-edit-name').value.trim();
    if (mapping['sbd']) excelData[idx][mapping['sbd']] = document.getElementById('live-edit-sbd').value.trim();
    if (mapping['cccd']) excelData[idx][mapping['cccd']] = document.getElementById('live-edit-cccd').value.trim();
    if (mapping['lop']) excelData[idx][mapping['lop']] = document.getElementById('live-edit-class').value.trim();
    if (mapping['dienthoai']) excelData[idx][mapping['dienthoai']] = document.getElementById('live-edit-phone').value.trim();
    if (mapping['email']) excelData[idx][mapping['email']] = document.getElementById('live-edit-email').value.trim();
    
    // Update subjects
    const subjCheckboxes = document.querySelectorAll('.live-subj-cb');
    subjCheckboxes.forEach(cb => {
        const key = cb.getAttribute('data-key');
        const mappedCol = mapping[key];
        if (mappedCol) {
            excelData[idx][mappedCol] = cb.checked ? "1" : "";
        }
    });
    
    // Save to dataStore
    dataStore[activeFileName].data = excelData;
    saveToDB();
    
    closeLiveEditor();
    showAlert("✅ Đã cập nhật và đồng bộ trực tiếp thành công!", "success");
    if (typeof search === 'function') search();
}

// --- 2. QUY CHẾ GPT / EXAM COPILOT ---
function toggleExamCopilot() {
    const drawer = document.getElementById('exam-copilot-drawer');
    if (!drawer) return;
    if (drawer.classList.contains('translate-x-full')) {
        drawer.classList.remove('translate-x-full');
        refreshCopilotInsights();
    } else {
        drawer.classList.add('translate-x-full');
    }
}

function switchCopilotTab(tab) {
    const tabInsights = document.getElementById('copilot-tab-insights');
    const tabRules = document.getElementById('copilot-tab-rules');
    const btnInsights = document.getElementById('btn-copilot-insights');
    const btnRules = document.getElementById('btn-copilot-rules');
    
    if (tab === 'insights') {
        tabInsights.style.display = 'block';
        tabRules.style.display = 'none';
        btnInsights.className = "flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-white shadow-sm text-blue-600 transition-all border-none cursor-pointer";
        btnRules.className = "flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 text-slate-500 hover:text-slate-800 transition-all border-none cursor-pointer";
    } else {
        tabInsights.style.display = 'none';
        tabRules.style.display = 'block';
        btnRules.className = "flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-white shadow-sm text-indigo-600 transition-all border-none cursor-pointer";
        btnInsights.className = "flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 text-slate-500 hover:text-slate-800 transition-all border-none cursor-pointer";
    }
}

function refreshCopilotInsights() {
    const container = document.getElementById('copilot-ai-summary');
    if (!container) return;
    
    if (!excelData || excelData.length === 0 || !activeFileName || !dataStore[activeFileName]?.mapping) {
        container.innerHTML = `<div class="py-12 text-center text-slate-400 font-medium italic">Vui lòng tải lên hoặc chọn file Excel để phân tích AI.</div>`;
        return;
    }
    
    const mapping = dataStore[activeFileName].mapping;
    const classMapping = [...document.querySelectorAll("#class-subject-body tr")].map(tr => ({
        name: tr.querySelector(".class-name-input").value.trim().toUpperCase(),
        allowed: [...tr.querySelectorAll(".subj-check")].map(cb => cb.checked)
    }));
    
    let totalErrors = 0;
    const errorClasses = {};
    let khtn = 0, khxh = 0;
    const languages = { 'N1 (Tiếng Anh)': 0, 'N2 (Tiếng Nga)': 0, 'N3 (Tiếng Pháp)': 0, 'N4 (Tiếng Trung)': 0, 'N5 (Tiếng Đức)': 0, 'N6 (Tiếng Nhật)': 0, 'N7 (Tiếng Hàn)': 0, 'Khác': 0 };
    
    excelData.forEach(row => {
        const v = validateRow(row, mapping, classMapping);
        if (v.hasError) {
            totalErrors++;
            const cName = normalizeClass(mapping['lop'] ? (row[mapping['lop']] || "Không rõ") : "Không rõ");
            errorClasses[cName] = (errorClasses[cName] || 0) + 1;
        }
        
        // Count combo
        const isLy = isSubjectMarked(row, 'ly', mapping);
        const isSu = isSubjectMarked(row, 'su', mapping);
        if (isLy) khtn++;
        if (isSu) khxh++;
        
        // Count language
        const langVal = (mapping['anh'] ? row[mapping['anh']] : "") || "";
        const strVal = langVal.toString().trim().toUpperCase();
        if (strVal.includes('N1') || strVal === '1' || strVal === 'X' || strVal === 'V' || strVal === 'ANH') languages['N1 (Tiếng Anh)']++;
        else if (strVal.includes('N2')) languages['N2 (Tiếng Nga)']++;
        else if (strVal.includes('N3')) languages['N3 (Tiếng Pháp)']++;
        else if (strVal.includes('N4')) languages['N4 (Tiếng Trung)']++;
        else if (strVal.includes('N5')) languages['N5 (Tiếng Đức)']++;
        else if (strVal.includes('N6')) languages['N6 (Tiếng Nhật)']++;
        else if (strVal.includes('N7')) languages['N7 (Tiếng Hàn)']++;
        else if (strVal !== '') languages['Khác']++;
    });
    
    const cleanRate = Math.round(((excelData.length - totalErrors) / excelData.length) * 100);
    const topClass = Object.entries(errorClasses).sort((a,b) => b[1] - a[1])[0] || ["Không có", 0];
    
    let activeLangsText = Object.entries(languages).filter(x => x[1] > 0).map(x => `${x[0]}: ${x[1]}`).join(', ');
    if (!activeLangsText) activeLangsText = "Chưa đăng ký";
    
    container.innerHTML = `
        <div class="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 space-y-2 border-l-4 border-l-blue-500">
            <div class="font-bold text-slate-800 text-sm flex items-center gap-2">
                <i data-lucide="shield-alert" style="width:16px; color:#3b82f6"></i> Đánh giá chất lượng hồ sơ
            </div>
            <p class="text-xs text-slate-600 m-0 leading-relaxed">
                Phát hiện <b>${totalErrors}</b> hồ sơ lỗi trên tổng số <b>${excelData.length}</b> thí sinh. Tỷ lệ hoàn hảo đạt <b>${cleanRate}%</b>.
                ${totalErrors > 0 ? `Lớp <b>${topClass[0]}</b> hiện đang tồn đọng nhiều lỗi nhất (${topClass[1]} lỗi).` : 'Tuyệt vời! Dữ liệu đã đạt chuẩn 100%.'}
            </p>
        </div>

        <div class="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 space-y-2 border-l-4 border-l-emerald-500">
            <div class="font-bold text-slate-800 text-sm flex items-center gap-2">
                <i data-lucide="pie-chart" style="width:16px; color:#10b981"></i> Tổ hợp môn & Ngoại ngữ
            </div>
            <p class="text-xs text-slate-600 m-0 leading-relaxed">
                Tỷ lệ phân bổ: <b>${khtn}</b> KHTN vs <b>${khxh}</b> KHXH.<br>
                Ngoại ngữ: ${activeLangsText}.
            </p>
        </div>

        <div class="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 space-y-2 border-l-4 border-l-purple-500">
            <div class="font-bold text-slate-800 text-sm flex items-center gap-2">
                <i data-lucide="check-circle" style="width:16px; color:#8b5cf6"></i> Khuyến nghị AI
            </div>
            <p class="text-xs text-slate-600 m-0 leading-relaxed">
                ${totalErrors > 0 ? `Ban Giám Hiệu nên gửi thông báo Zalo nhắc nhở giáo viên chủ nhiệm lớp ${topClass[0]} và sử dụng tính năng <b>Sửa trực tiếp</b> trên bảng dữ liệu để chỉnh nhanh.` : `Dữ liệu sẵn sàng để Xếp phòng thi và tạo Thẻ dự thi Smart Pass.`}
            </p>
        </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// --- 3. QR SMART PASS GENERATION ---
function getGoogleQRUrl(dataStr) {
    return `https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=${encodeURIComponent(dataStr)}`;
}

function renderQRPasses() {
    const container = document.getElementById('qr-passes-container');
    const filterMode = document.getElementById('qr-pass-mode')?.value || 'student';
    const classFilter = document.getElementById('qr-pass-class-filter')?.value || 'ALL';
    const countDisplay = document.getElementById('qr-pass-count-display');
    
    const deptName = document.getElementById('cfg-dept-name')?.value || "SỞ GIÁO DỤC VÀ ĐÀO TẠO";
    const schoolName = document.getElementById('cfg-school-name')?.value || "TRƯỜNG THPT CẤP KỲ THI";
    
    if (filterMode === 'student') {
        // Populate class dropdown if empty
        const dropdown = document.getElementById('qr-pass-class-filter');
        if (dropdown && dropdown.options.length <= 1 && excelData.length > 0 && activeFileName && dataStore[activeFileName]?.mapping?.lop) {
            const classes = new Set();
            excelData.forEach(r => {
                const c = normalizeClass(r[dataStore[activeFileName].mapping.lop]);
                if (c) classes.add(c);
            });
            Array.from(classes).sort().forEach(c => {
                dropdown.innerHTML += `<option value="${c}">${c}</option>`;
            });
        }
        
        if (!excelData || excelData.length === 0 || !activeFileName || !dataStore[activeFileName]?.mapping) {
            if (container) container.innerHTML = `<div class="col-span-full py-16 text-center text-slate-400 font-medium italic">Vui lòng nạp tệp dữ liệu để tạo Thẻ dự thi.</div>`;
            if (countDisplay) countDisplay.innerText = "0";
            return;
        }
        
        const mapping = dataStore[activeFileName].mapping;
        let students = excelData.map((row, idx) => {
            const rNum = row.roomNumber || row[mapping['phong']] || (generatedRooms && generatedRooms.find(r => r.students.some(st => st.hoten === row[mapping['hoten']]))?.number) || "Chưa xếp";
            return {
                name: row[mapping['hoten']] || "Chưa rõ tên",
                sbd: row[mapping['sbd']] || row.sbd || `SBD-${idx+1}`,
                cccd: row[mapping['cccd']] || "Chưa cập nhật",
                className: normalizeClass(row[mapping['lop']] || "12"),
                roomNumber: rNum,
                phone: row[mapping['dienthoai']] || "",
                idx: idx
            };
        });
        
        if (classFilter !== 'ALL') {
            students = students.filter(s => s.className === classFilter);
        }
        
        if (countDisplay) countDisplay.innerText = students.length;
        if (students.length === 0) {
            container.innerHTML = `<div class="col-span-full py-16 text-center text-slate-400 font-medium italic">Không có thí sinh nào thuộc lớp đã chọn.</div>`;
            return;
        }
        
        container.innerHTML = students.map(s => {
            const qrData = `SBD:${s.sbd}|ROOM:${s.roomNumber}|NAME:${s.name}|CCCD:${s.cccd}|CLASS:${s.className}`;
            const qrUrl = getGoogleQRUrl(qrData);
            return `
                <div class="bg-white rounded-3xl p-6 shadow-lg border border-slate-200 flex items-center justify-between gap-6 hover:shadow-xl transition-all relative overflow-hidden bg-gradient-to-r from-purple-50/30 to-indigo-50/30">
                    <div class="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-indigo-600 text-white font-extrabold text-[11px] px-6 py-1 rounded-bl-2xl uppercase shadow-md">THẺ THÍ SINH</div>
                    <div class="flex-1 space-y-3">
                        <div class="border-b border-purple-100 pb-2">
                            <div class="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">${deptName}</div>
                            <div class="text-xs font-black text-purple-700 tracking-wide">${schoolName}</div>
                        </div>
                        <div>
                            <h3 class="text-lg font-black text-slate-800 m-0 leading-tight">${s.name}</h3>
                            <div class="text-xs font-bold mt-2 flex items-center gap-2 flex-wrap">
                                <span class="bg-purple-100 px-2.5 py-1 rounded-lg text-purple-800 border border-purple-200">SBD: ${s.sbd}</span>
                                <span class="bg-indigo-100 px-2.5 py-1 rounded-lg text-indigo-800 font-extrabold border border-indigo-200">PHÒNG: ${s.roomNumber}</span>
                                <span class="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 border border-slate-200">LỚP: ${s.className}</span>
                            </div>
                        </div>
                        <div class="text-xs text-slate-500 pt-1 flex items-center gap-2 font-medium">
                            <i data-lucide="credit-card" style="width:14px; color:#8b5cf6"></i> CCCD: ${s.cccd}
                        </div>
                    </div>
                    <div class="bg-white p-2.5 rounded-2xl shadow-md border border-purple-100 flex flex-col items-center flex-shrink-0">
                        <img src="${qrUrl}" alt="QR" class="w-28 h-28 object-contain rounded-xl">
                        <span class="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">SMART PASS</span>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        // Proctor cards
        let proctors = [];
        if (typeof proctorList !== 'undefined' && proctorList.length > 0) {
            proctors = proctorList;
        } else if (typeof ProctorStore !== 'undefined' && ProctorStore.getState()?.proctors?.length > 0) {
            proctors = ProctorStore.getState().proctors;
        } else {
            proctors = [{ name: "Chưa cấu hình danh sách giám thị", unit: "Trường" }];
        }
        
        if (typeof window.attachAssignmentsToProctors === 'function') {
            window.attachAssignmentsToProctors(proctors);
        } else if (typeof ZaloHub !== 'undefined' && typeof ZaloHub.attachAssignmentsToProctors === 'function') {
            ZaloHub.attachAssignmentsToProctors(proctors);
        }
        
        if (countDisplay) countDisplay.innerText = proctors.length;
        container.innerHTML = proctors.map((p, idx) => {
            const id = p.id || `CB-${idx+1}`;
            let assignedText = "Nhiệm vụ: Cán bộ coi thi";
            let assignedRoomsStr = "Chưa phân công phòng";
            if (p.assignments && p.assignments.length > 0) {
                assignedRoomsStr = p.assignments.map(a => `${a.sessionName || a.sessionId}: P.${a.roomNumber}(${a.role})`).join(', ');
                assignedText = `Phân công: ${assignedRoomsStr}`;
            }
            const qrData = `ID:${id}|NAME:${p.name}|UNIT:${p.unit}|ASSIGN:${assignedRoomsStr}`;
            const qrUrl = getGoogleQRUrl(qrData);
            return `
                <div class="bg-white rounded-3xl p-6 shadow-lg border border-slate-200 flex items-center justify-between gap-6 hover:shadow-xl transition-all relative overflow-hidden bg-gradient-to-r from-blue-50/30 to-cyan-50/30">
                    <div class="absolute top-0 right-0 bg-gradient-to-l from-blue-600 to-cyan-600 text-white font-extrabold text-[11px] px-6 py-1 rounded-bl-2xl uppercase shadow-md">THẺ CÁN BỘ COI THI</div>
                    <div class="flex-1 space-y-3">
                        <div class="border-b border-blue-100 pb-2">
                            <div class="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">${deptName}</div>
                            <div class="text-xs font-black text-blue-700 tracking-wide">${schoolName}</div>
                        </div>
                        <div>
                            <h3 class="text-lg font-black text-slate-800 m-0 leading-tight">${p.name}</h3>
                            <div class="text-xs font-bold text-blue-600 mt-2 flex items-center gap-2 flex-wrap">
                                <span class="bg-blue-100 px-2.5 py-1 rounded-lg text-blue-800 border border-blue-200">ĐƠN VỊ: ${p.unit}</span>
                                <span class="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 border border-slate-200">MÃ CB: ${id}</span>
                            </div>
                        </div>
                        <div class="text-xs text-slate-600 pt-1 flex items-start gap-2 font-medium bg-blue-50/50 p-2 rounded-xl border border-blue-100">
                            <i data-lucide="shield-check" style="width:16px; color:#0ea5e9; margin-top:2px; flex-shrink:0;"></i>
                            <div class="leading-relaxed"><b>${assignedText}</b></div>
                        </div>
                    </div>
                    <div class="bg-white p-2.5 rounded-2xl shadow-md border border-blue-100 flex flex-col items-center flex-shrink-0">
                        <img src="${qrUrl}" alt="QR" class="w-28 h-28 object-contain rounded-xl">
                        <span class="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">PROCTOR PASS</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function printQRPassesArea() {
    const container = document.getElementById('qr-passes-container');
    if (!container || container.innerText.includes('Vui lòng nạp')) {
        showAlert("⚠️ Chưa có thẻ để in!", "warning");
        return;
    }
    const mode = document.getElementById('qr-pass-mode')?.value === 'student' ? 'THẺ DỰ THI THÍ SINH' : 'THẺ CÁN BỘ COI THI';
    
    let html = `
        <div style="padding:40px; background:#fff; font-family:'Inter', sans-serif;">
            <div style="text-align:center; margin-bottom:30px;">
                <h1 style="font-size:24px; font-weight:900; margin:0;">DANH SÁCH ${mode}</h1>
                <p style="font-size:14px; color:#64748b; margin:5px 0 0;">Kỳ thi Tốt nghiệp THPT 2026</p>
            </div>
            <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:20px;">
                ${container.innerHTML}
            </div>
        </div>
    `;
    
    const printArea = document.getElementById('print-content-area');
    const printModal = document.getElementById('print-modal');
    const printControls = document.getElementById('print-controls');
    if (printArea && printModal && printControls) {
        printArea.innerHTML = html;
        printModal.style.display = 'block';
        printControls.style.display = 'flex';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } else {
        const win = window.open('', '_blank');
        win.document.write(`<html><head><title>In Thẻ Smart Pass</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet"><script src="https://cdn.tailwindcss.com"></script></head><body>${html}</body></html>`);
        win.document.close();
        setTimeout(() => { win.print(); }, 1000);
    }
}

// --- 4. EXECUTIVE ANALYTICS DASHBOARD ---
let execComboChart = null;
let execLangChart = null;

function renderExecutiveAnalytics() {
    if (!excelData || excelData.length === 0 || !activeFileName || !dataStore[activeFileName]?.mapping) {
        document.getElementById('analytics-total-candidates').innerText = "0";
        document.getElementById('analytics-clean-rate').innerText = "0%";
        document.getElementById('analytics-pending-errors').innerText = "0";
        document.getElementById('analytics-est-rooms').innerText = "0";
        return;
    }
    
    const mapping = dataStore[activeFileName].mapping;
    const classMapping = [...document.querySelectorAll("#class-subject-body tr")].map(tr => ({
        name: tr.querySelector(".class-name-input").value.trim().toUpperCase(),
        allowed: [...tr.querySelectorAll(".subj-check")].map(cb => cb.checked)
    }));
    
    let totalErrors = 0;
    const classErrorCounts = {};
    let khtn = 0, khxh = 0;
    const languages = { 'N1 (Anh)': 0, 'N2 (Nga)': 0, 'N3 (Pháp)': 0, 'N4 (Trung)': 0, 'N5 (Đức)': 0, 'N6 (Nhật)': 0, 'N7 (Hàn)': 0 };
    
    excelData.forEach(row => {
        const v = validateRow(row, mapping, classMapping);
        if (v.hasError) totalErrors++;
        
        const cName = normalizeClass(mapping['lop'] ? (row[mapping['lop']] || "Khác") : "Khác");
        if (!classErrorCounts[cName]) classErrorCounts[cName] = { total: 0, errors: 0 };
        classErrorCounts[cName].total++;
        if (v.hasError) classErrorCounts[cName].errors++;
        
        const isLy = isSubjectMarked(row, 'ly', mapping);
        const isSu = isSubjectMarked(row, 'su', mapping);
        if (isLy) khtn++;
        if (isSu) khxh++;
        
        const langVal = (mapping['anh'] ? row[mapping['anh']] : "") || "";
        const strVal = langVal.toString().trim().toUpperCase();
        if (strVal.includes('N1') || strVal === '1' || strVal === 'X' || strVal === 'V' || strVal === 'ANH') languages['N1 (Anh)']++;
        else if (strVal.includes('N2')) languages['N2 (Nga)']++;
        else if (strVal.includes('N3')) languages['N3 (Pháp)']++;
        else if (strVal.includes('N4')) languages['N4 (Trung)']++;
        else if (strVal.includes('N5')) languages['N5 (Đức)']++;
        else if (strVal.includes('N6')) languages['N6 (Nhật)']++;
        else if (strVal.includes('N7')) languages['N7 (Hàn)']++;
    });
    
    const total = excelData.length;
    const cleanRate = Math.round(((total - totalErrors) / total) * 100);
    const estRooms = Math.ceil(total / 24);
    
    document.getElementById('analytics-total-candidates').innerText = total;
    document.getElementById('analytics-clean-rate').innerText = `${cleanRate}%`;
    document.getElementById('analytics-pending-errors').innerText = totalErrors;
    document.getElementById('analytics-est-rooms').innerText = estRooms;
    
    // Render Charts if Chart.js is ready
    if (typeof Chart !== 'undefined') {
        const ctxCombo = document.getElementById('comboPieChart')?.getContext('2d');
        if (ctxCombo) {
            if (execComboChart) execComboChart.destroy();
            execComboChart = new Chart(ctxCombo, {
                type: 'doughnut',
                data: {
                    labels: ['KHTN (Vật Lý, Hóa, Sinh)', 'KHXH (Lịch Sử, Địa, GDKTPL)'],
                    datasets: [{
                        data: [khtn, khxh],
                        backgroundColor: ['#3b82f6', '#10b981'],
                        borderWidth: 4,
                        borderColor: '#ffffff',
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    cutout: '70%'
                }
            });
            const legendEl = document.getElementById('combo-legend');
            if (legendEl) {
                legendEl.innerHTML = `
                    <div class="flex items-center gap-2"><span class="w-4 h-4 rounded-full bg-blue-500 inline-block"></span> KHTN: ${khtn} (${Math.round((khtn/(khtn+khxh || 1))*100)}%)</div>
                    <div class="flex items-center gap-2"><span class="w-4 h-4 rounded-full bg-emerald-500 inline-block"></span> KHXH: ${khxh} (${Math.round((khxh/(khtn+khxh || 1))*100)}%)</div>
                `;
            }
        }
        
        const ctxLang = document.getElementById('langBarChart')?.getContext('2d');
        if (ctxLang) {
            if (execLangChart) execLangChart.destroy();
            execLangChart = new Chart(ctxLang, {
                type: 'bar',
                data: {
                    labels: Object.keys(languages),
                    datasets: [{
                        label: 'Số Thí sinh',
                        data: Object.values(languages),
                        backgroundColor: '#8b5cf6',
                        borderRadius: 12,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
                }
            });
        }
    }
    
    // Render Class Error Ranking Bars
    const rankContainer = document.getElementById('class-error-ranking-bars');
    if (rankContainer) {
        const sortedClasses = Object.entries(classErrorCounts).sort((a,b) => b[1].errors - a[1].errors);
        if (sortedClasses.length === 0) {
            rankContainer.innerHTML = `<div class="p-8 text-center text-slate-400 font-medium italic">Không có dữ liệu lớp.</div>`;
        } else {
            const maxErrors = Math.max(...sortedClasses.map(x => x[1].errors), 1);
            rankContainer.innerHTML = sortedClasses.map(([cName, stats]) => {
                const pct = Math.round((stats.errors / maxErrors) * 100);
                return `
                    <div class="space-y-1">
                        <div class="flex justify-between text-xs font-bold text-slate-700">
                            <span>Lớp: <b class="text-slate-900">${cName}</b> (${stats.total} TS)</span>
                            <span class="${stats.errors > 0 ? 'text-red-600' : 'text-emerald-600 font-extrabold'}">${stats.errors > 0 ? `${stats.errors} lỗi` : '✅ Sạch 100%'}</span>
                        </div>
                        <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div class="bg-gradient-to-r ${stats.errors > 0 ? 'from-amber-500 to-red-600' : 'from-emerald-400 to-teal-500'} h-full rounded-full transition-all duration-500" style="width: ${stats.errors > 0 ? pct : 100}%"></div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

// ============================================================================
// WORKSPACE BACKUP & RESTORE SYSTEM
// ============================================================================

function backupWorkspace() {
    try {
        const backupData = {
            version: "2026.1",
            timestamp: new Date().toISOString(),
            dataStore: dataStore,
            activeFileName: activeFileName,
            generatedRooms: generatedRooms,
            configs: {
                maxRoom: document.getElementById('cfg-max-room')?.value,
                maxLab: document.getElementById('cfg-max-lab')?.value,
                maxReserve: document.getElementById('cfg-max-reserve')?.value,
                deptName: document.getElementById('cfg-dept-name')?.value,
                schoolName: document.getElementById('cfg-school-name')?.value,
                excelDept: document.getElementById('excel-dept-name')?.value,
                excelBoard: document.getElementById('excel-board-name')?.value,
                excelExam: document.getElementById('excel-exam-name')?.value
            },
            storage: {}
        };

        // Capture all relevant localStorage keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('ProctorStore_') || key.startsWith('ZALO_') || key.startsWith('vtool_') || key.includes('Configs') || key.includes('Assignment'))) {
                backupData.storage[key] = localStorage.getItem(key);
            }
        }

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `ExamWorkspace_Backup_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        showAlert("✅ Đã xuất file sao lưu toàn bộ cấu hình, dữ liệu thí sinh và phòng thi thành công!", "success");
    } catch (err) {
        console.error("Backup Error:", err);
        showAlert("❌ Lỗi khi sao lưu dữ liệu: " + err.message, "danger");
    }
}

function triggerRestoreWorkspace() {
    const fileInput = document.getElementById('workspace-backup-file');
    if (fileInput) fileInput.click();
}

function restoreWorkspaceBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backupData = JSON.parse(e.target.result);

            // Restore dataStore and activeFileName
            if (backupData.dataStore) {
                dataStore = backupData.dataStore;
                activeFileName = backupData.activeFileName || Object.keys(dataStore)[0] || '';
                if (activeFileName && dataStore[activeFileName]) {
                    setActiveFile(activeFileName);
                } else {
                    renderFileList();
                }
            }

            // Restore generatedRooms
            if (backupData.generatedRooms) {
                generatedRooms = backupData.generatedRooms;
                renderExamRoomResults();
            }

            // Restore configs
            if (backupData.configs) {
                if (document.getElementById('cfg-max-room') && backupData.configs.maxRoom) document.getElementById('cfg-max-room').value = backupData.configs.maxRoom;
                if (document.getElementById('cfg-max-lab') && backupData.configs.maxLab) document.getElementById('cfg-max-lab').value = backupData.configs.maxLab;
                if (document.getElementById('cfg-max-reserve') && backupData.configs.maxReserve) document.getElementById('cfg-max-reserve').value = backupData.configs.maxReserve;
                if (document.getElementById('cfg-dept-name') && backupData.configs.deptName) document.getElementById('cfg-dept-name').value = backupData.configs.deptName;
                if (document.getElementById('cfg-school-name') && backupData.configs.schoolName) {
                    document.getElementById('cfg-school-name').value = backupData.configs.schoolName;
                    const displayBrand = document.getElementById('display-school-name');
                    if (displayBrand) displayBrand.innerText = backupData.configs.schoolName.toUpperCase();
                }
                if (document.getElementById('excel-dept-name') && backupData.configs.excelDept) document.getElementById('excel-dept-name').value = backupData.configs.excelDept;
                if (document.getElementById('excel-board-name') && backupData.configs.excelBoard) document.getElementById('excel-board-name').value = backupData.configs.excelBoard;
                if (document.getElementById('excel-exam-name') && backupData.configs.excelExam) document.getElementById('excel-exam-name').value = backupData.configs.excelExam;
            }

            // Restore localStorage
            if (backupData.storage) {
                Object.keys(backupData.storage).forEach(key => {
                    localStorage.setItem(key, backupData.storage[key]);
                });
            }

            // Refresh UI components
            if (typeof updateStats === 'function') updateStats();
            if (typeof updateDashboardWidgets === 'function') updateDashboardWidgets();

            event.target.value = ''; // reset input
            showAlert("🎉 Đã phục hồi thành công toàn bộ hệ thống từ file sao lưu!", "success");
        } catch (err) {
            console.error("Restore Error:", err);
            showAlert("❌ Lỗi khi đọc file sao lưu (File không đúng định dạng): " + err.message, "danger");
        }
    };
    reader.readAsText(file);
}

// ============================================================================
// CLOUD MYSQL SYNC SYSTEM (HOST fdb1027.biz.nf)
// ============================================================================

async function syncToCloud() {
    try {
        const btn = document.getElementById('btn-cloud-save');
        if (btn) btn.innerHTML = '<i class="spinner-pro" style="width:14px;height:14px"></i> <span class="hidden sm:inline" style="font-size:12px">ĐANG LƯU...</span>';

        const backupPayload = {
            version: "2026.1",
            timestamp: new Date().toISOString(),
            dataStore: dataStore,
            activeFileName: activeFileName,
            generatedRooms: generatedRooms,
            configs: {
                maxRoom: document.getElementById('cfg-max-room')?.value,
                maxLab: document.getElementById('cfg-max-lab')?.value,
                maxReserve: document.getElementById('cfg-max-reserve')?.value,
                deptName: document.getElementById('cfg-dept-name')?.value,
                schoolName: document.getElementById('cfg-school-name')?.value,
                excelDept: document.getElementById('excel-dept-name')?.value,
                excelBoard: document.getElementById('excel-board-name')?.value,
                excelExam: document.getElementById('excel-exam-name')?.value
            },
            storage: {}
        };

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('ProctorStore_') || key.startsWith('ZALO_') || key.startsWith('vtool_') || key.includes('Configs') || key.includes('Assignment'))) {
                backupPayload.storage[key] = localStorage.getItem(key);
            }
        }

        const councilCode = document.getElementById('cfg-school-name')?.value?.trim() || 'DEFAULT_COUNCIL';

        const response = await fetch('cloud_save.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                council_code: councilCode,
                council_name: document.getElementById('cfg-school-name')?.value || 'THPT CAO BÁ QUÁT',
                version: "2026.1",
                payload: backupPayload
            })
        });

        const resData = await response.json();
        if (btn) btn.innerHTML = '<i data-lucide="cloud-upload" style="width:16px"></i> <span class="hidden sm:inline" style="font-size:12px">LƯU CLOUD</span>';
        if (typeof lucide !== 'undefined') lucide.createIcons();

        if (resData.success) {
            showAlert("☁️ " + resData.message, "success");
        } else {
            showAlert("❌ Lỗi Cloud: " + resData.error, "danger");
        }
    } catch (err) {
        console.error("Cloud Save Error:", err);
        const btn = document.getElementById('btn-cloud-save');
        if (btn) {
            btn.innerHTML = '<i data-lucide="cloud-upload" style="width:16px"></i> <span class="hidden sm:inline" style="font-size:12px">LƯU CLOUD</span>';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
        showAlert("❌ Không thể kết nối đến máy chủ Cloud MySQL. Vui lòng kiểm tra lại đường truyền!", "danger");
    }
}

async function loadFromCloud() {
    try {
        const councilCode = document.getElementById('cfg-school-name')?.value?.trim() || 'DEFAULT_COUNCIL';
        const btn = document.getElementById('btn-cloud-load');
        if (btn) btn.innerHTML = '<i class="spinner-pro" style="width:14px;height:14px"></i> <span class="hidden sm:inline" style="font-size:12px">ĐANG TẢI...</span>';

        const response = await fetch('cloud_load.php?council_code=' + encodeURIComponent(councilCode));
        const resData = await response.json();

        if (btn) btn.innerHTML = '<i data-lucide="cloud-download" style="width:16px"></i> <span class="hidden sm:inline" style="font-size:12px">TẢI CLOUD</span>';
        if (typeof lucide !== 'undefined') lucide.createIcons();

        if (resData.success && resData.payload) {
            const backupData = resData.payload;

            if (backupData.dataStore) {
                dataStore = backupData.dataStore;
                activeFileName = backupData.activeFileName || Object.keys(dataStore)[0] || '';
                if (activeFileName && dataStore[activeFileName]) {
                    setActiveFile(activeFileName);
                } else {
                    renderFileList();
                }
            }

            if (backupData.generatedRooms) {
                generatedRooms = backupData.generatedRooms;
                renderExamRoomResults();
            }

            if (backupData.configs) {
                if (document.getElementById('cfg-max-room') && backupData.configs.maxRoom) document.getElementById('cfg-max-room').value = backupData.configs.maxRoom;
                if (document.getElementById('cfg-max-lab') && backupData.configs.maxLab) document.getElementById('cfg-max-lab').value = backupData.configs.maxLab;
                if (document.getElementById('cfg-max-reserve') && backupData.configs.maxReserve) document.getElementById('cfg-max-reserve').value = backupData.configs.maxReserve;
                if (document.getElementById('cfg-dept-name') && backupData.configs.deptName) document.getElementById('cfg-dept-name').value = backupData.configs.deptName;
                if (document.getElementById('cfg-school-name') && backupData.configs.schoolName) {
                    document.getElementById('cfg-school-name').value = backupData.configs.schoolName;
                    const displayBrand = document.getElementById('display-school-name');
                    if (displayBrand) displayBrand.innerText = backupData.configs.schoolName.toUpperCase();
                }
                if (document.getElementById('excel-dept-name') && backupData.configs.excelDept) document.getElementById('excel-dept-name').value = backupData.configs.excelDept;
                if (document.getElementById('excel-board-name') && backupData.configs.excelBoard) document.getElementById('excel-board-name').value = backupData.configs.excelBoard;
                if (document.getElementById('excel-exam-name') && backupData.configs.excelExam) document.getElementById('excel-exam-name').value = backupData.configs.excelExam;
            }

            if (backupData.storage) {
                Object.keys(backupData.storage).forEach(key => {
                    localStorage.setItem(key, backupData.storage[key]);
                });
            }

            if (typeof updateStats === 'function') updateStats();
            if (typeof updateDashboardWidgets === 'function') updateDashboardWidgets();

            showAlert("🎉 Đã khôi phục thành công toàn bộ hệ thống từ dữ liệu Cloud (" + resData.updated_at + ")!", "success");
        } else {
            showAlert("⚠️ " + (resData.error || "Không tìm thấy bản ghi trên Cloud."), "warning");
        }
    } catch (err) {
        console.error("Cloud Load Error:", err);
        const btn = document.getElementById('btn-cloud-load');
        if (btn) {
            btn.innerHTML = '<i data-lucide="cloud-download" style="width:16px"></i> <span class="hidden sm:inline" style="font-size:12px">TẢI CLOUD</span>';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
        showAlert("❌ Lỗi kết nối máy chủ Cloud MySQL. Vui lòng thử lại!", "danger");
    }
}

// ============================================================================
// AUTHENTICATION & USER PERMISSIONS SYSTEM
// ============================================================================

let currentUser = (function() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const roleParam = urlParams.get('role');
        const classParam = urlParams.get('class');
        const nameParam = urlParams.get('name');

        if (roleParam === 'teacher' || roleParam === 'proctor') {
            return {
                username: "gv",
                fullName: nameParam ? decodeURIComponent(nameParam) : (classParam ? `GVCN ${decodeURIComponent(classParam)}` : 'GIÁO VIÊN'),
                role: "proctor",
                homeroomClass: classParam ? decodeURIComponent(classParam) : '',
                councilCode: "THPT_CBQ"
            };
        }
    } catch(e) {
        console.warn("Init user parse err:", e);
    }
    return {
        username: "admin",
        fullName: "CHỦ TỊCH HỘI ĐỒNG",
        role: "admin",
        councilCode: "THPT_CBQ"
    };
})();

function openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('auth-username')?.focus();
    }
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'none';
}

async function executeLogin() {
    const userInp = document.getElementById('auth-username')?.value?.trim();
    const passInp = document.getElementById('auth-password')?.value?.trim();
    const btn = document.getElementById('btn-auth-submit');

    if (!userInp || !passInp) {
        showAlert("⚠️ Vui lòng nhập đầy đủ tên tài khoản và mật khẩu!", "warning");
        return;
    }

    if (btn) btn.innerHTML = '<i class="spinner-pro" style="width:16px;height:16px"></i> ĐANG XÁC THỰC...';

    try {
        const response = await fetch('auth_login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: userInp, password: passInp })
        });
        const resData = await response.json();

        if (btn) btn.innerHTML = '<i data-lucide="log-in" style="width:18px"></i> XÁC THỰC VÀ BẮT ĐẦU VẬN HÀNH';
        if (typeof lucide !== 'undefined') lucide.createIcons();

        if (resData.success && resData.account) {
            currentUser = {
                username: resData.account.username,
                fullName: resData.account.full_name,
                role: resData.account.role,
                councilCode: resData.account.council_code
            };

            applyUserRole(currentUser);
            closeAuthModal();
            showAlert(`🎉 Xin chào ${currentUser.fullName} (${currentUser.role.toUpperCase()})! Hệ thống đã chuyển sang chế độ hoạt động tương ứng.`, "success");
        } else {
            showAlert("❌ " + (resData.error || "Đăng nhập thất bại. Vui lòng kiểm tra lại!"), "danger");
        }
    } catch (err) {
        console.error("Login Auth Error:", err);
        if (btn) {
            btn.innerHTML = '<i data-lucide="log-in" style="width:18px"></i> XÁC THỰC VÀ BẮT ĐẦU VẬN HÀNH';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        // Chế độ dự phòng offline (Offline fallback khi test trên máy không chạy PHP)
        if (userInp === 'admin' && passInp === '123456') {
            currentUser = { username: "admin", fullName: "CHỦ TỊCH HỘI ĐỒNG", role: "admin", councilCode: "THPT_CBQ" };
            applyUserRole(currentUser);
            closeAuthModal();
            showAlert("🎉 Chế độ Offline Fallback: Xác thực Admin thành công!", "success");
        } else if (userInp === 'giamthi' && passInp === '123456') {
            currentUser = { username: "giamthi", fullName: "CÁN BỘ GIÁM THỊ 1", role: "proctor", councilCode: "THPT_CBQ" };
            applyUserRole(currentUser);
            closeAuthModal();
            showAlert("🎉 Chế độ Offline Fallback: Xác thực Giám thị phòng thi thành công!", "success");
        } else {
            showAlert("❌ Lỗi kết nối CSDL và thông tin nhập offline không hợp lệ!", "danger");
        }
    }
}

function applyUserRole(userObj) {
    if (!userObj) return;
    const dispName = document.getElementById('display-user-name');
    const dispRole = document.getElementById('display-user-role');

    if (dispName) dispName.innerText = (userObj.fullName || 'NGƯỜI DÙNG').toUpperCase();
    if (dispRole) {
        if (userObj.role === 'admin') {
            dispRole.innerText = 'ADMIN';
            dispRole.className = "bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md";
            document.body.classList.remove('role-proctor', 'role-teacher');
            document.body.classList.add('role-admin');
        } else {
            dispRole.innerText = userObj.homeroomClass ? `GVCN ${userObj.homeroomClass}` : 'GIÁO VIÊN';
            dispRole.className = "bg-sky-500/20 text-sky-400 border border-sky-500/40 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md";
            document.body.classList.remove('role-admin');
            document.body.classList.add('role-proctor', 'role-teacher');
        }
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ==========================================
// TÍCH HỢP & XUẤT BẢN SMAS / EXCEL MẪU
// ==========================================
let currentTemplateBuffer = null;
let currentTemplateName = "";
let currentTemplateSheetName = "";

function initSmasExcelTab() {
    updateSmasSourceSelector();
    renderSmasMappingTable();
}

function updateSmasSourceSelector() {
    const el = document.getElementById('smas-export-source');
    if (!el) return;
    const files = Object.keys(dataStore);
    const prevVal = el.value;
    
    el.innerHTML = '<option value="">--- Chọn tệp nguồn ---</option>' + 
                   files.map(f => `<option value="${f}">${f}</option>`).join('');
                   
    if (files.includes(prevVal)) {
        el.value = prevVal;
    } else if (activeFileName && files.includes(activeFileName)) {
        el.value = activeFileName;
    }
}

function renderSmasMappingTable() {
    const body = document.getElementById('smas-mapping-table-body');
    if (!body) return;
    
    // Đọc cấu hình ánh xạ từ localStorage
    const storageKey = currentTemplateName ? `vtool_smas_excel_mapping_${currentTemplateName}` : 'vtool_smas_excel_mapping_default';
    let savedMapping = {};
    try {
        savedMapping = JSON.parse(localStorage.getItem(storageKey) || '{}');
        // Nếu không có cấu hình riêng và đang có tên tệp mẫu, thử tìm cấu hình mặc định
        if (Object.keys(savedMapping).length === 0 && currentTemplateName) {
            savedMapping = JSON.parse(localStorage.getItem('vtool_smas_excel_mapping_default') || '{}');
        }
    } catch (e) {
        console.error("Lỗi đọc cấu hình ánh xạ:", e);
    }
    
    body.innerHTML = CORE_FIELDS.map(field => {
        const value = savedMapping[field.key] || "";
        return `
            <tr>
                <td style="font-weight: 600; color: var(--text-main);">${field.label}</td>
                <td style="font-family: monospace; font-size: 11px; color: var(--text-muted);">${field.key}</td>
                <td>
                    <input type="text" 
                           class="form-control smas-col-input" 
                           data-key="${field.key}" 
                           value="${value}" 
                           placeholder="Ví dụ: A, B, C, D..." 
                           style="width: 100%; max-width: 180px; text-transform: uppercase; text-align: center; font-weight: bold; border-color: var(--border);">
                </td>
            </tr>
        `;
    }).join('');
}

function applySmasPreset(presetValue) {
    if (!presetValue || presetValue === 'none') return;
    
    const presets = {
        'smas_official': {
            'sbd': 'B', 'hoten': 'C', 'ngaysinh': 'D', 'gioi_tinh': 'E', 'lop': 'F',
            'cccd': 'G', 'dantoc': 'H', 'toan': 'I', 'van': 'J', 'anh': 'K',
            'ly': 'L', 'hoa': 'M', 'sinh': 'N', 'su': 'O', 'dia': 'P', 'gdkt': 'Q',
            'tin': 'R', 'cnc': 'S', 'cnn': 'T', 'thuong_tru': 'U', 'dienthoai': 'V', 'email': 'W'
        },
        'bodg_dkdt': {
            'sbd': 'A', 'hoten': 'B', 'ngaysinh': 'C', 'gioi_tinh': 'D',
            'cccd': 'E', 'lop': 'F', 'toan': 'G', 'van': 'H', 'anh': 'I'
        },
        'custom_simple': {
            'sbd': 'A', 'hoten': 'B', 'lop': 'C', 'ngaysinh': 'D', 'cccd': 'E'
        }
    };
    
    const mapping = presets[presetValue];
    if (!mapping) return;
    
    const inputs = document.querySelectorAll('.smas-col-input');
    inputs.forEach(input => {
        const key = input.getAttribute('data-key');
        if (mapping[key] !== undefined) {
            input.value = mapping[key];
        } else {
            input.value = "";
        }
    });
    
    showAlert(`🎯 Đã áp dụng mẫu ánh xạ nhanh: ${document.querySelector(`#smas-preset-mapping option[value="${presetValue}"]`).innerText}`, 'success');
}

function saveSmasMappingConfig() {
    const inputs = document.querySelectorAll('.smas-col-input');
    const mapping = {};
    inputs.forEach(input => {
        const key = input.getAttribute('data-key');
        const val = input.value.trim().toUpperCase();
        if (val) {
            mapping[key] = val;
        }
    });
    
    const storageKey = currentTemplateName ? `vtool_smas_excel_mapping_${currentTemplateName}` : 'vtool_smas_excel_mapping_default';
    localStorage.setItem(storageKey, JSON.stringify(mapping));
    // Đồng thời lưu vào cấu hình mặc định để làm dự phòng
    localStorage.setItem('vtool_smas_excel_mapping_default', JSON.stringify(mapping));
    
    showAlert('💾 Đã lưu cấu hình ánh xạ cột thành công!', 'success');
}

async function handleTemplateUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    currentTemplateName = file.name;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const arrayBuffer = e.target.result;
            
            // Đọc thử xem file có đúng Excel chuẩn và lấy tên sheet đầu tiên
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);
            
            if (workbook.worksheets.length === 0) {
                throw new Error("Tệp Excel không chứa sheet nào.");
            }
            
            currentTemplateBuffer = arrayBuffer;
            currentTemplateSheetName = workbook.worksheets[0].name;
            
            // Hiển thị trạng thái nạp thành công
            const statusEl = document.getElementById('smas-template-status');
            const filenameEl = document.getElementById('smas-template-filename');
            const sheetinfoEl = document.getElementById('smas-template-sheetinfo');
            
            if (statusEl && filenameEl && sheetinfoEl) {
                filenameEl.innerText = file.name;
                sheetinfoEl.innerText = `Sheet hoạt động: ${currentTemplateSheetName} (${workbook.worksheets[0].rowCount} hàng)`;
                statusEl.classList.remove('hidden');
            }
            
            // Cập nhật lại bảng ánh xạ dựa trên file mẫu mới (khôi phục cấu hình riêng nếu có)
            renderSmasMappingTable();
            showAlert(`✅ Đã nạp thành công tệp mẫu: "${file.name}"`, 'success');
        } catch (err) {
            console.error("Lỗi nạp tệp mẫu:", err);
            showAlert(`❌ Không thể đọc tệp mẫu Excel. Vui lòng chọn tệp .xlsx chuẩn. Chi tiết: ${err.message}`, 'danger');
            currentTemplateBuffer = null;
            currentTemplateName = "";
            currentTemplateSheetName = "";
            const statusEl = document.getElementById('smas-template-status');
            if (statusEl) statusEl.classList.add('hidden');
        }
    };
    reader.readAsArrayBuffer(file);
}

function getStudentValue(student, key, sourceMapping) {
    if (!student) return "";
    
    // Nếu là môn thi
    const examKeys = ['toan', 'van', 'anh', 'ly', 'hoa', 'sinh', 'su', 'dia', 'gdkt', 'tin', 'cnc', 'cnn'];
    if (examKeys.includes(key)) {
        return isSubjectMarked(student, key, sourceMapping) ? "x" : "";
    }
    
    // Nếu là giới tính
    if (key === 'gioi_tinh') {
        const col = sourceMapping['gioi_tinh'];
        const val = col ? (student[col] || "").toString().trim() : "";
        const lowerVal = val.toLowerCase();
        if (lowerVal === "1" || lowerVal === "nữ" || lowerVal === "nu" || lowerVal === "female") return "Nữ";
        if (lowerVal === "0" || lowerVal === "nam" || lowerVal === "name" || lowerVal === "male") return "Nam";
        return val;
    }
    
    // Các trường ngày sinh, nếu là chuỗi hoặc đối tượng Date
    if (key === 'ngaysinh') {
        const col = sourceMapping['ngaysinh'];
        let val = col ? student[col] : "";
        if (val instanceof Date) {
            // Định dạng DD/MM/YYYY
            const d = String(val.getDate()).padStart(2, '0');
            const m = String(val.getMonth() + 1).padStart(2, '0');
            const y = val.getFullYear();
            return `${d}/${m}/${y}`;
        }
        return val || "";
    }
    
    // Các trường bình thường khác
    const col = sourceMapping[key];
    if (col && student[col] !== undefined) {
        return student[col];
    }
    
    // Nếu không tìm thấy qua ánh xạ nguồn, thử tìm thuộc tính trùng tên trực tiếp
    if (student[key] !== undefined) return student[key];
    
    // Trường hợp đặc biệt Họ tên tự ghép
    if (key === 'hoten' && student['Họ và tên (Tự động ghép)']) {
        return student['Họ và tên (Tự động ghép)'];
    }
    
    return "";
}

async function exportDataToTemplate() {
    const sourceFile = document.getElementById('smas-export-source').value;
    if (!sourceFile) {
        showAlert('⚠️ Vui lòng chọn tệp dữ liệu nguồn ở mục 1!', 'warning');
        return;
    }
    
    if (!currentTemplateBuffer) {
        showAlert('⚠️ Vui lòng nạp tệp Excel mẫu ở mục 2!', 'warning');
        return;
    }
    
    const startRow = parseInt(document.getElementById('smas-start-row').value) || 8;
    if (startRow < 1) {
        showAlert('⚠️ Dòng bắt đầu điền dữ liệu phải từ 1 trở lên!', 'warning');
        return;
    }
    
    // Lấy ánh xạ cột chữ cái
    const inputs = document.querySelectorAll('.smas-col-input');
    const mappingDest = {};
    let hasMapping = false;
    inputs.forEach(input => {
        const key = input.getAttribute('data-key');
        const val = input.value.trim().toUpperCase();
        if (val) {
            mappingDest[key] = val;
            hasMapping = true;
        }
    });
    
    if (!hasMapping) {
        showAlert('⚠️ Vui lòng nhập ít nhất một ánh xạ cột trong bảng ở mục 3!', 'warning');
        return;
    }
    
    const fileDataObj = dataStore[sourceFile];
    if (!fileDataObj || !fileDataObj.data) {
        showAlert('❌ Không tìm thấy dữ liệu nguồn hợp lệ!', 'danger');
        return;
    }
    
    const students = fileDataObj.data;
    const sourceMapping = fileDataObj.mapping;
    
    // Hiển thị hiệu ứng loading trên nút xuất
    const btn = document.querySelector('button[onclick="exportDataToTemplate()"]');
    const origHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true" style="display:inline-block; width:14px; height:14px; border:2px solid currentColor; border-right-color:transparent; border-radius:50%; vertical-align:text-bottom; margin-right:6px; animation:spinner-border .75s linear infinite"></span> ĐANG ĐIỀN DỮ LIỆU...';
    
    // Động lực tạo animation keyframe nếu chưa có
    if (!document.getElementById('spinner-keyframes')) {
        const style = document.createElement('style');
        style.id = 'spinner-keyframes';
        style.innerHTML = `@keyframes spinner-border { to { transform: rotate(360deg); } }`;
        document.head.appendChild(style);
    }
    
    // Cho trình duyệt thời gian render loading UI
    setTimeout(async () => {
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(currentTemplateBuffer);
            const worksheet = workbook.worksheets[0];
            
            // Ghi đè dữ liệu từng học sinh
            students.forEach((student, idx) => {
                const rowNum = startRow + idx;
                
                Object.entries(mappingDest).forEach(([key, colLetter]) => {
                    const value = getStudentValue(student, key, sourceMapping);
                    worksheet.getCell(`${colLetter}${rowNum}`).value = value;
                });
            });
            
            // Xuất file
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            // Chuẩn hóa tên file xuất
            const cleanName = sourceFile.replace(/\.[^/.]+$/, "");
            link.download = `HO_SO_${cleanName}_MAU_IN.xlsx`;
            link.click();
            
            showAlert(`🎉 Đã xuất thành công ${students.length} học sinh vào file mẫu!`, 'success');
        } catch (err) {
            console.error("Lỗi xuất Excel đè mẫu:", err);
            showAlert(`❌ Đã xảy ra lỗi khi điền dữ liệu: ${err.message}`, 'danger');
        } finally {
            btn.disabled = false;
            btn.innerHTML = origHtml;
        }
    }, 100);
}

function updateSmasMappingPreview() {
    const sourceFile = document.getElementById('smas-export-source').value;
    if (sourceFile && dataStore[sourceFile]) {
        const studentCount = dataStore[sourceFile].data.length;
        showAlert(`📊 Đã chọn nguồn: "${sourceFile}" (${studentCount} học sinh sẵn sàng).`, 'info');
    }
}

// Xuất các hàm ra global scope để gọi được từ HTML onclick/onchange
window.initSmasExcelTab = initSmasExcelTab;
window.applySmasPreset = applySmasPreset;
window.saveSmasMappingConfig = saveSmasMappingConfig;
window.handleTemplateUpload = handleTemplateUpload;
window.exportDataToTemplate = exportDataToTemplate;
window.updateSmasMappingPreview = updateSmasMappingPreview;

// ====================================================================
// ECOSYSTEM INTEGRATION: 2-WAY SYNC WITH PARENT REACT SYSTEM (SUPABASE)
// ====================================================================
window.addEventListener('message', function(event) {
    if (!event.data || typeof event.data !== 'object') return;
    const { type, payload } = event.data;

    // 1. NHẬN DỮ LIỆU HỌC SINH KHỐI 12 TỪ CSDL SUPABASE
    if (type === 'LOAD_CBQ_STUDENTS') {
        const students = Array.isArray(payload) ? payload : [];
        if (students.length === 0) {
            showAlert("⚠️ Không có dữ liệu học sinh được gửi từ CSDL trường.", "warning");
            return;
        }

        const fileName = "CSDL_KHOI_12_TRUONG.xlsx";
        const standardColumns = [
            "STT", "Mã HS", "Họ và tên", "Lớp", "Số CCCD", "Ngày sinh", 
            "Giới tính", "Dân tộc", "Số điện thoại", "Địa chỉ", 
            "Toán", "Ngữ văn", "Tiếng Anh", "Vật lí", "Hóa học", 
            "Sinh học", "Lịch sử", "Địa lí", "GDKT&PL", "Tin học", 
            "Công nghệ", "Diện xét TN"
        ];

        const mappedRows = students.map((s, idx) => {
            const electives = Array.isArray(s.exam_electives) ? s.exam_electives.map(e => String(e).toLowerCase()) : [];
            const hasElective = (kw) => electives.some(e => e.includes(kw.toLowerCase()));

            const row = {
                _sourceFile: fileName,
                "STT": idx + 1,
                "Mã HS": s.student_code || `HS12-${String(idx + 1).padStart(3, '0')}`,
                "Họ và tên": s.student_name || s.full_name || "",
                "Lớp": s.student_class || "12A01",
                "Số CCCD": s.identity_card || "",
                "Ngày sinh": s.birth_date || "",
                "Giới tính": s.gender === 'Nữ' || s.gender === '1' ? '1' : '0',
                "Dân tộc": s.ethnicity || "Kinh",
                "Số điện thoại": s.phone || "",
                "Địa chỉ": s.address || s.current_address || "",
                "Toán": "X",
                "Ngữ văn": "X",
                "Tiếng Anh": hasElective('anh') ? 'X' : '',
                "Vật lí": hasElective('vật lý') || hasElective('vật lí') || hasElective('lý') ? 'X' : '',
                "Hóa học": hasElective('hóa') ? 'X' : '',
                "Sinh học": hasElective('sinh') ? 'X' : '',
                "Lịch sử": hasElective('sử') ? 'X' : '',
                "Địa lí": hasElective('địa') ? 'X' : '',
                "GDKT&PL": hasElective('gdkt') || hasElective('gdcd') || hasElective('pháp luật') ? 'X' : '',
                "Tin học": hasElective('tin') ? 'X' : '',
                "Công nghệ": hasElective('công nghệ') || hasElective('cnn') || hasElective('cnc') ? 'X' : '',
                "Diện xét TN": s.exam_graduation_area || "Diện 1"
            };
            return row;
        });

        const customMapping = {
            cccd: "Số CCCD",
            hoten: "Họ và tên",
            lop: "Lớp",
            ngaysinh: "Ngày sinh",
            gioi_tinh: "Giới tính",
            dantoc: "Dân tộc",
            dienthoai: "Số điện thoại",
            thuong_tru: "Địa chỉ",
            toan: "Toán",
            van: "Ngữ văn",
            anh: "Tiếng Anh",
            ly: "Vật lí",
            hoa: "Hóa học",
            sinh: "Sinh học",
            su: "Lịch sử",
            dia: "Địa lí",
            gdkt: "GDKT&PL",
            tin: "Tin học",
            cnn: "Công nghệ",
            dien_tn: "Diện xét TN"
        };

        dataStore[fileName] = {
            columns: standardColumns,
            data: mappedRows,
            mapping: customMapping,
            validated: true
        };

        if (typeof activeFile !== 'undefined') activeFile = fileName;
        if (typeof dataTable !== 'undefined') dataTable = mappedRows;
        if (typeof columns !== 'undefined') columns = standardColumns;
        if (typeof mapping !== 'undefined') mapping = customMapping;

        // Tiến hành thẩm định và thu thập thống kê
        let validCount = 0;
        let errorCount = 0;
        const errorList = [];
        const subjectStats = {
            'Tiếng Anh': 0, 'Vật lí': 0, 'Hóa học': 0, 'Sinh học': 0,
            'Lịch sử': 0, 'Địa lí': 0, 'GDKT&PL': 0, 'Tin học': 0, 'Công nghệ': 0
        };

        mappedRows.forEach((r, idx) => {
            let res = { hasError: false, errorCols: {} };
            if (typeof ValidationEngine !== 'undefined' && ValidationEngine.validateRow) {
                res = ValidationEngine.validateRow(r, customMapping, []);
            }
            if (res.hasError) {
                errorCount++;
                errorList.push({
                    stt: idx + 1,
                    student_code: r["Mã HS"],
                    student_name: r["Họ và tên"],
                    student_class: r["Lớp"],
                    identity_card: r["Số CCCD"],
                    errors: Object.values(res.errorCols).join(" | ")
                });
            } else {
                validCount++;
            }

            // Đếm môn tự chọn
            if (r["Tiếng Anh"] === 'X') subjectStats['Tiếng Anh']++;
            if (r["Vật lí"] === 'X') subjectStats['Vật lí']++;
            if (r["Hóa học"] === 'X') subjectStats['Hóa học']++;
            if (r["Sinh học"] === 'X') subjectStats['Sinh học']++;
            if (r["Lịch sử"] === 'X') subjectStats['Lịch sử']++;
            if (r["Địa lí"] === 'X') subjectStats['Địa lí']++;
            if (r["GDKT&PL"] === 'X') subjectStats['GDKT&PL']++;
            if (r["Tin học"] === 'X') subjectStats['Tin học']++;
            if (r["Công nghệ"] === 'X') subjectStats['Công nghệ']++;
        });

        // Phân quyền trong giao diện Tool theo vai trò nhận được từ React Host
        const userRole = event.data.role || 'admin';
        const scopedClass = event.data.scopedClass || '';
        if (userRole === 'teacher') {
            currentUser = { 
                username: "gv", 
                fullName: `GVCN ${scopedClass || 'LỚP CHỦ NHIỆM'}`, 
                role: "proctor", 
                councilCode: "THPT_CBQ" 
            };
        } else {
            currentUser = { 
                username: "admin", 
                fullName: "CHỦ TỊCH HỘI ĐỒNG (ADMIN)", 
                role: "admin", 
                councilCode: "THPT_CBQ" 
            };
        }
        if (typeof applyUserRole === 'function') applyUserRole(currentUser);

        // Cập nhật giao diện
        if (typeof renderFileList === 'function') renderFileList();
        if (typeof renderTable === 'function') renderTable();
        if (typeof renderStatistics === 'function') renderStatistics();
        if (typeof switchTab === 'function') switchTab('datatable');

        showAlert(`🎉 Đã nạp thành công ${students.length} học sinh (${userRole === 'teacher' ? `Lớp ${scopedClass}` : 'Toàn Khối 12'}) từ CSDL!`, 'success');

        // Bắn kết quả thẩm định ngược lại cho React app
        try {
            window.parent.postMessage({
                type: 'CBQ_STUDENTS_VALIDATED',
                payload: {
                    total: students.length,
                    validCount,
                    errorCount,
                    errorList,
                    subjectStats
                }
            }, '*');
        } catch (e) {
            console.warn("Lỗi gửi postMessage về parent:", e);
        }
    }

    // 2. NHẬN DỮ LIỆU CÁN BỘ GIÁO VIÊN COI THI TỪ SUPABASE
    if (type === 'LOAD_CBQ_PROCTORS') {
        const teachers = Array.isArray(payload) ? payload : [];
        if (teachers.length > 0) {
            showAlert(`🧑‍🏫 Đã tiếp nhận ${teachers.length} Giáo viên từ CSDL cho thuật toán Phân công Giám thị!`, 'success');
            if (typeof renderProctorBoard === 'function') {
                renderProctorBoard();
            }
        }
    }

    // 3. THIẾT LẬP VAI TRÒ NGƯỜI DÙNG TỪ REACT APP (ADMIN vs TEACHER)
    if (type === 'SET_USER_ROLE') {
        const { role: newRole, scopedClass, teacherName } = payload || {};
        if (newRole === 'teacher' || newRole === 'proctor') {
            currentUser = { 
                username: "gv", 
                fullName: teacherName || (scopedClass ? `GVCN ${scopedClass}` : 'GIÁO VIÊN'), 
                role: "proctor", 
                homeroomClass: scopedClass || '',
                councilCode: "THPT_CBQ" 
            };
        } else {
            currentUser = { 
                username: "admin", 
                fullName: "CHỦ TỊCH HỘI ĐỒNG (ADMIN)", 
                role: "admin", 
                councilCode: "THPT_CBQ" 
            };
        }
        applyUserRole(currentUser);
    }
});

// Tự động kiểm tra trạng thái khởi tạo
document.addEventListener('DOMContentLoaded', () => {
    applyUserRole(currentUser);
});

