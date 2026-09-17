import os
path = r'e:\2025-2026\VIET CODE\TRUNG TAM TIEN ICH\TOOL KIEM TRA HO SO DANG KY THI TN\app.js'
code = r"""const APP_VERSION = '2026.Final.Pro';

        /**
         * Chức năng: Tách họ tên chuẩn xác cho cả người Kinh và các dân tộc thiểu số (Ê-đê, Ba-na,...)
         * Logic: 
         * - Nếu có các tiền tố dân tộc (H', Y-,...), Tên sẽ là từ ngay sau tiền tố.
         * - Nếu là tên người Kinh, Tên là từ cuối cùng.
         */
        function splitVietnameseName(fullName) {
            let name = (fullName || "").trim();
            if (!name) return { ho: "", lot: "", ten: "", fullTen: "" };
            const ethnicPrefixes = ["H'", "H`", "H-", "H ", "Y-", "Y'", "Y`", "Y ", "A ", "M'", "K'"];
            let foundPrefix = ethnicPrefixes.filter(p => name.startsWith(p)).sort((a,b) => b.length - a.length)[0];
            if (foundPrefix) {
                let rest = name.substring(foundPrefix.length).trim();
                let clanPart = ""; let givenPart = "";
                if (rest.includes("-")) {
                    const lastHyphenIndex = rest.lastIndexOf("-");
                    givenPart = rest.substring(0, lastHyphenIndex).trim();
                    clanPart = rest.substring(lastHyphenIndex + 1).trim();
                } else {
                    let parts = rest.split(/\s+/);
                    if (parts.length > 1) { clanPart = parts.pop(); givenPart = parts.join(" "); }
                    else { givenPart = rest; }
                }
                return { ho: clanPart.trim(), lot: foundPrefix.trim(), ten: givenPart.trim(), fullTen: givenPart.trim() };
            }
            const p = name.split(/\s+/);
            if (p.length === 1) return { ho: "", lot: "", ten: p[0], fullTen: p[0] };
            const ten = p.pop(); const ho = p.shift(); const lot = p.join(" ");
            return { ho: ho, lot: lot, ten: ten, fullTen: ten };
        }

        function checkForUpdate(manual = false) {
            const lastVersion = localStorage.getItem('vtool_app_version');
            if (manual || lastVersion !== APP_VERSION) {
                localStorage.setItem('vtool_app_version', APP_VERSION);
                if (manual) { document.body.style.opacity = '0.5'; }
                setTimeout(() => { window.location.reload(); }, manual ? 500 : 0);
            }
        }
        checkForUpdate();

        function toggleHeaderInputs() {
            const isAuto = document.getElementById('auto-header-priority').checked;
            const groups = document.querySelectorAll('.header-input-group');
            groups.forEach(el => {
                el.style.opacity = isAuto ? '0.5' : '1';
                el.style.pointerEvents = isAuto ? 'none' : 'auto';
            });
        }

        let graduationRules = { address: {}, school: {}, ethnic: {} };
        function initGraduationRules() {
            const saved = localStorage.getItem('vtool_village_mapping');
            if (!saved) return;
            try {
                const parsed = JSON.parse(saved);
                if (parsed && !parsed.address && !parsed.school && !parsed.ethnic) { graduationRules.address = parsed; }
                else { graduationRules = { ...graduationRules, ...parsed }; }
            } catch (e) { console.error("Lỗi load cấu hình Diện:", e); }
        }
        initGraduationRules();

        function showAlert(msg, type = 'info') {
            const overlay = document.getElementById('custom-alert-overlay');
            const iconBox = document.getElementById('alert-icon-container');
            const msgEl = document.getElementById('alert-message');
            const titleEl = document.getElementById('alert-title');
            if(!overlay) return;
            msgEl.innerHTML = msg;
            overlay.style.display = 'flex';
            let color = "var(--primary)", icon = "info";
            if (type === 'success') { color = "var(--success)"; icon = "check-circle"; titleEl.innerText = "Thành công"; }
            else if (type === 'error') { color = "var(--danger)"; icon = "x-circle"; titleEl.innerText = "Lỗi hệ thống"; }
            else if (type === 'warning') { color = "var(--warning)"; icon = "alert-triangle"; titleEl.innerText = "Cảnh báo"; }
            else { titleEl.innerText = "Thông báo"; }
            iconBox.style.background = color + "22"; iconBox.style.color = color;
            iconBox.innerHTML = `<i data-lucide="${icon}" style="width:32px; height:32px"></i>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
        window.alert = function (msg) { showAlert(msg); };
        function closeAlert() { document.getElementById('custom-alert-overlay').style.display = 'none'; }

        // --- CORE DATA HANDLING ---
        let dataStore = {}; let activeFileName = null; let excelData = [], columnNames = []; let activeValidationMode = 'none';
        const DB_NAME = 'SMAS_DataDB'; const STORE_NAME = 'dataStore';

        function refreshActiveFileData(name) {
            if (!dataStore[name]) return;
            activeFileName = name; excelData = dataStore[name].data; columnNames = dataStore[name].columns;
            renderColumnCheckboxes(); renderDataPreview(); updateDashboard();
        }

        function renderDataPreview() {
            const table = document.getElementById('preview-table');
            if (!table || !activeFileName) return;
            const store = dataStore[activeFileName];
            const headers = store.columns; const data = store.data.slice(0, 50);
            let html = "<thead><tr><th>STT</th>" + headers.map(h => `<th>${h}</th>`).join('') + "</tr></thead><tbody>";
            data.forEach((row, i) => {
                html += `<tr><td>${i+1}</td>` + headers.map(h => `<td>${row[h] || ""}</td>`).join('') + "</tr>";
            });
            table.innerHTML = html + "</tbody>";
        }

        function renderColumnCheckboxes() {
            const container = document.getElementById('columns-checkboxes');
            if (!container || !activeFileName) return;
            const store = dataStore[activeFileName]; const mapping = store.mapping || {};
            container.innerHTML = CORE_FIELDS.map(field => {
                const mappedCol = mapping[field.key] || "";
                return `<div class="mapping-card" style="padding:10px; border:1px solid var(--border); border-radius:8px; margin-bottom:10px">
                    <label style="display:block; margin-bottom:5px; font-weight:600">${field.label}</label>
                    <select class="form-control" onchange="updateMapping('${field.key}', this.value)">
                        <option value="">-- Không ánh xạ --</option>
                        ${store.columns.map(col => `<option value="${col}" ${col === mappedCol ? 'selected' : ''}>${col}</option>`).join('')}
                    </select>
                </div>`;
            }).join('');
        }

        function updateMapping(key, val) {
            if (!activeFileName) return;
            dataStore[activeFileName].mapping[key] = val;
            saveToDB();
        }

        async function processExcelFile(file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                const headerCols = rows[0].map(c => String(c).trim());
                dataStore[file.name] = { columns: headerCols, data: XLSX.utils.sheet_to_json(sheet), mapping: {} };
                await saveToDB(); refreshActiveFileData(file.name);
                showAlert("✅ Đã tải file thành công!", 'success');
            };
            reader.readAsArrayBuffer(file);
        }

        document.getElementById('excel-file')?.addEventListener('change', (e) => {
            Array.from(e.target.files).forEach(processExcelFile);
        });

        function switchTab(tabId) {
            document.querySelectorAll('.section-view').forEach(v => v.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            document.getElementById(`view-${tabId}`)?.classList.add('active');
            document.getElementById(`btn-tab-${tabId}`)?.classList.add('active');
            if (tabId === 'combo') renderComboAnalysis();
            if (tabId === 'rank') renderClassRanking();
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        function updateDashboard() {
            const files = Object.keys(dataStore);
            document.getElementById('dash-total-files').innerText = files.length;
            let total = 0; files.forEach(f => total += dataStore[f].data.length);
            document.getElementById('dash-total-students').innerText = total;
        }

        function getConsolidatedStudents() {
            const consolidated = {};
            Object.keys(dataStore).forEach(f => {
                const store = dataStore[f]; const m = store.mapping; if (!m) return;
                store.data.forEach(row => {
                    const key = row[m['cccd']] || row[m['hoten']];
                    if (!key) return;
                    if (!consolidated[key]) consolidated[key] = { hoten: row[m['hoten']], lop: row[m['lop']], subjects: {} };
                    const score = parseFloat(row[m['diem']] || row[m['diem_thi']]);
                    if (!isNaN(score)) consolidated[key].subjects[row[m['mon']] || f] = score;
                });
            });
            return Object.values(consolidated);
        }

        function predictGraduationRiskPro(s) {
            const scores = Object.values(s.subjects); if (scores.length === 0) return { level: "CHƯA ĐỦ ĐIỂM", color: "#64748b" };
            const avg = scores.reduce((a,b) => a+b, 0) / scores.length;
            if (avg < 5.0) return { level: "NGUY CƠ CAO", color: "#ef4444" };
            if (avg < 7.0) return { level: "TRUNG BÌNH", color: "#f59e0b" };
            return { level: "AN TOÀN", color: "#10b981" };
        }

        function renderComboAnalysis() {
            const students = getConsolidatedStudents();
            const body = document.getElementById('combo-full-stats-body'); if (!body) return;
            body.innerHTML = students.slice(0, 50).map((s, i) => `<tr><td>${i+1}</td><td>${s.hoten}</td><td>${s.lop}</td><td>${Object.keys(s.subjects).length} môn</td></tr>`).join('');
        }

        function renderClassRanking() {
            const students = getConsolidatedStudents();
            const body = document.getElementById('rank-table-body'); if (!body) return;
            body.innerHTML = "<tr><td colspan='4' style='text-align:center'>Đang phân tích thứ hạng lớp...</td></tr>";
        }

        function exportBroadsheetPDF() { alert("🚀 Đang chuẩn bị bản in Broadsheet..."); }
        function exportIndividualSlipsPDF() { alert("🚀 Đang chuẩn bị in phiếu điểm cá nhân..."); }

        async function initDB() {
            return new Promise((resolve) => {
                const request = indexedDB.open(DB_NAME, 1);
                request.onupgradeneeded = (e) => { e.target.result.createObjectStore(STORE_NAME); };
                request.onsuccess = () => resolve();
            });
        }

        async function saveToDB() {
            const dbReq = indexedDB.open(DB_NAME, 1);
            dbReq.onsuccess = (e) => {
                const db = e.target.result;
                const tx = db.transaction(STORE_NAME, 'readwrite');
                tx.objectStore(STORE_NAME).put(dataStore, 'app_dataStore');
            };
        }

        async function loadFromDB() {
            return new Promise((resolve) => {
                const request = indexedDB.open(DB_NAME, 1);
                request.onsuccess = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) { resolve(null); return; }
                    const tx = db.transaction(STORE_NAME, 'readonly');
                    const req = tx.objectStore(STORE_NAME).get('app_dataStore');
                    req.onsuccess = () => resolve(req.result);
                };
            });
        }

        document.addEventListener('DOMContentLoaded', () => {
            initDB().then(() => {
                loadFromDB().then(data => { if (data) { dataStore = data; updateDashboard(); } });
            });
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
"""
with open(path, "w", encoding="utf-8") as f:
    f.write(code)
