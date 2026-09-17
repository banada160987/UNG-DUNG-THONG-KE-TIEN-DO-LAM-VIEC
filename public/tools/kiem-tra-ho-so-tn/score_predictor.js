/**
 * PREMIUM MODULE 3: GRADUATION SCORE PREDICTOR (GD2026 MOET FORMULA)
 * Automatically calculates Graduation Score (ĐXTN), flags danger zones, and predicts pass/fail statuses.
 */

(function() {
    "use strict";

    let currentFilter = 'all'; // 'all', 'danger', 'failed'

    // Remove Vietnamese accents for matching
    function cleanAccents(str) {
        if (!str) return '';
        return str.toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D')
            .toLowerCase().trim();
    }

    // Automatically detect column mapping for score calculation
    function detectColumns(columnNames) {
        const mapping = {
            sbd: '', name: '', lop: '',
            scores: {} // subjectKey -> columnName
        };

        const subjectsConfig = [
            { key: 'toan', keywords: ['toan', 'math', 'diemtoan'] },
            { key: 'van', keywords: ['van', 'nguvan', 'diemvan'] },
            { key: 'ngoaingu', keywords: ['ngoaingu', 'anh', 'tienganh', 'diemanh', 'nn'] },
            { key: 'ly', keywords: ['vatly', 'vatli', 'ly', 'li', 'diemly'] },
            { key: 'hoa', keywords: ['hoahoc', 'hoa', 'diemhoa'] },
            { key: 'sinh', keywords: ['sinhhoc', 'sinh', 'diemsinh'] },
            { key: 'su', keywords: ['lichsu', 'su', 'diemsu'] },
            { key: 'dia', keywords: ['diali', 'dia', 'diemdia', 'dialy'] },
            { key: 'gdkt', keywords: ['gdcd', 'gdkt', 'gdktpl', 'congdan'] },
            { key: 'tin', keywords: ['tinhoc', 'tin', 'diemtinhoc'] },
            { key: 'cnc', keywords: ['cnc', 'congnghecongnghiep'] },
            { key: 'cnn', keywords: ['cnn', 'congnghenongnghiep'] }
        ];

        columnNames.forEach(col => {
            const cleanCol = cleanAccents(col).replace(/[^a-z0-9]/g, '');
            
            // Core mappings
            if (cleanCol === 'sbd' || cleanCol === 'sobaodanh' || cleanCol === 'baodanh') {
                mapping.sbd = col;
            } else if (cleanCol === 'hoten' || cleanCol === 'hovaten' || cleanCol === 'thisinh' || cleanCol === 'ten') {
                mapping.name = col;
            } else if (cleanCol === 'lop' || cleanCol === 'class') {
                mapping.lop = col;
            }

            // Subjects
            subjectsConfig.forEach(sub => {
                sub.keywords.forEach(kw => {
                    if (cleanCol === kw || cleanCol.includes(kw)) {
                        mapping.scores[sub.key] = col;
                    }
                });
            });
        });

        // Fallback for SBD & Name if not matched perfectly
        if (!mapping.sbd) mapping.sbd = columnNames.find(c => cleanAccents(c).includes('sbd') || cleanAccents(c).includes('bao danh')) || columnNames[0];
        if (!mapping.name) mapping.name = columnNames.find(c => cleanAccents(c).includes('ten') || cleanAccents(c).includes('ho')) || columnNames[1];
        if (!mapping.lop) mapping.lop = columnNames.find(c => cleanAccents(c).includes('lop')) || columnNames[2];

        return mapping;
    }

    // Initialize Predictor Tab View
    function initGraduationPredictor() {
        const inputDefaultGpa = document.getElementById('pred-gpa-default');
        if (inputDefaultGpa) {
            inputDefaultGpa.value = window.graduationGpaDefault || 7.5;
        }

        renderPredictorData();
    }

    // Update Default GPA & Trigger Re-calculation
    function updateGpaDefaultValue(value) {
        const gpa = parseFloat(value);
        if (isNaN(gpa) || gpa < 1.0 || gpa > 10.0) return;
        
        window.graduationGpaDefault = gpa; // Saves to localStorage automatically via setter
        renderPredictorData();
    }

    // Filter Predictor Table View
    function filterPredictorTable(mode) {
        currentFilter = mode;

        // Visual button toggle
        const buttons = {
            all: document.getElementById('pred-filter-all'),
            danger: document.getElementById('pred-filter-danger'),
            failed: document.getElementById('pred-filter-failed')
        };

        Object.keys(buttons).forEach(key => {
            const btn = buttons[key];
            if (!btn) return;
            if (key === currentFilter) {
                btn.className = "px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md border-none cursor-pointer";
            } else {
                btn.className = "px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold text-xs border-none cursor-pointer";
            }
        });

        renderPredictorData();
    }

    // Core score calculator & renderer
    function renderPredictorData() {
        const tbody = document.getElementById('predictor-table-body');
        if (!tbody) return;

        const filename = window.activeFileName;
        const fileObj = window.dataStore ? window.dataStore[filename] : null;
        
        if (!fileObj || !fileObj.data || fileObj.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="py-12 text-center text-slate-400 font-medium italic">Vui lòng nạp dữ liệu điểm thi trong tab "Danh sách dữ liệu" để sử dụng tính năng dự phóng tốt nghiệp.</td></tr>`;
            updatePredictorStats(0, 0, 0, 0);
            return;
        }

        const rawData = fileObj.data;
        const columns = fileObj.columns || Object.keys(rawData[0]);
        const mapping = detectColumns(columns);

        const defaultGpa = window.graduationGpaDefault || 7.5;

        // Statistics
        let totalCount = rawData.length;
        let passCount = 0;
        let dangerCount = 0;
        let failedCount = 0;

        let processedRows = [];

        rawData.forEach((row, index) => {
            const sbd = row[mapping.sbd] || '---';
            const name = row[mapping.name] || 'Chưa rõ';
            const lop = row[mapping.lop] || '12';

            // Extract exam scores
            let examScores = [];
            let hasFailSubject = false;
            let failSubjectsList = [];

            Object.keys(mapping.scores).forEach(subKey => {
                const colName = mapping.scores[subKey];
                const rawVal = row[colName];
                const score = parseFloat(rawVal);

                if (!isNaN(score)) {
                    examScores.push(score);
                    if (score <= 1.0) {
                        hasFailSubject = true;
                        failSubjectsList.push(`${subKey.toUpperCase()} (${score}đ)`);
                    }
                }
            });

            // Calculate mock average
            let averageExamScore = 0;
            if (examScores.length > 0) {
                const sum = examScores.reduce((a, b) => a + b, 0);
                averageExamScore = sum / examScores.length;
            }

            // Standard MOET Graduation Score Formula (GD2026)
            // ĐXTN = (Average_Exam_Score * 7 + GPA_Class12 * 3) / 10 + Priority_Score
            let dxtn = (averageExamScore * 7 + defaultGpa * 3) / 10;
            
            // Status determination
            let status = 'pass'; // 'pass', 'danger', 'failed'
            let statusLabel = '';
            let statusClass = '';

            if (hasFailSubject) {
                status = 'failed';
                failedCount++;
                statusLabel = `💥 Liệt môn: ${failSubjectsList.join(', ')}`;
                statusClass = "bg-rose-100 text-rose-800 border-rose-200";
            } else if (dxtn < 5.0) {
                status = 'danger';
                dangerCount++;
                statusLabel = `⚠️ Nguy cơ (ĐXTN < 5.0)`;
                statusClass = "bg-amber-100 text-amber-800 border-amber-200";
            } else {
                status = 'pass';
                passCount++;
                statusLabel = `✅ Đạt tốt nghiệp`;
                statusClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
            }

            processedRows.push({
                stt: index + 1,
                sbd,
                name,
                lop,
                averageExamScore,
                gpa: defaultGpa,
                dxtn,
                status,
                statusLabel,
                statusClass
            });
        });

        // Filter processed rows
        let filteredRows = processedRows;
        if (currentFilter === 'danger') {
            filteredRows = processedRows.filter(r => r.status === 'danger');
        } else if (currentFilter === 'failed') {
            filteredRows = processedRows.filter(r => r.status === 'failed');
        }

        // Render table
        if (filteredRows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="py-12 text-center text-slate-400 font-medium italic">Không tìm thấy thí sinh nào khớp với bộ lọc "${currentFilter}".</td></tr>`;
        } else {
            tbody.innerHTML = filteredRows.map(r => `
                <tr class="hover:bg-slate-50 text-slate-700 font-semibold border-b border-slate-100 transition-all">
                    <td class="p-3 text-center text-slate-400 font-bold">${r.stt}</td>
                    <td class="p-3 font-mono text-blue-600 font-bold">${r.sbd}</td>
                    <td class="p-3 text-slate-900 font-extrabold">${r.name}</td>
                    <td class="p-3">${r.lop}</td>
                    <td class="p-3 text-center text-indigo-600 font-bold">${r.averageExamScore.toFixed(2)}đ</td>
                    <td class="p-3 text-center text-slate-500">${r.gpa.toFixed(1)}</td>
                    <td class="p-3 text-center text-emerald-700 font-black text-sm">${r.dxtn.toFixed(2)}đ</td>
                    <td class="p-3">
                        <span class="px-3 py-1 border text-[10px] font-black uppercase rounded-full ${r.statusClass}">
                            ${r.statusLabel}
                        </span>
                    </td>
                </tr>
            `).join('');
        }

        // Update statistics overview widget
        updatePredictorStats(totalCount, passCount, dangerCount, failedCount);
    }

    // Update Statistics DOM values
    function updatePredictorStats(total, pass, danger, failed) {
        const rateEl = document.getElementById('pred-stat-rate');
        const passCountEl = document.getElementById('pred-stat-pass-count');
        const dangerEl = document.getElementById('pred-stat-danger');
        const failedEl = document.getElementById('pred-stat-failed');

        const rate = total > 0 ? ((pass / total) * 100).toFixed(1) : "0.0";

        if (rateEl) rateEl.textContent = `${rate}%`;
        if (passCountEl) passCountEl.textContent = `${pass} / ${total} học sinh đạt`;
        if (dangerEl) dangerEl.textContent = danger;
        if (failedEl) failedEl.textContent = failed;
    }

    // Expose functions globally
    window.initGraduationPredictor = initGraduationPredictor;
    window.updateGpaDefaultValue = updateGpaDefaultValue;
    window.filterPredictorTable = filterPredictorTable;

})();
