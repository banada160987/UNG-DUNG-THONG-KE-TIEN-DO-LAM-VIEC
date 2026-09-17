/**
 * EXPORT SERVICE
 * Handles Excel generation.
 */

async function exportErrorsToExcel() {
    const activeFile = dataStore[activeFileName];
    if (!activeFile?.mapping) { alert("⚠️ Vui lòng cấu hình Mapping trước."); return; }

    const classMapping = [...document.querySelectorAll("#class-subject-body tr")].map(tr => ({
        name: tr.querySelector(".class-name-input").value.trim().toUpperCase(),
        allowed: [...tr.querySelectorAll(".subj-check")].map(cb => cb.checked)
    }));

    const errorRows = excelData.filter(row => validateRow(row, activeFile.mapping, classMapping).hasError);
    if (errorRows.length === 0) { alert("🎉 Không tìm thấy lỗi!"); return; }

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Danh sách lỗi');
    ws.pageSetup = EXCEL_STYLES.printSetup;
    const showCols = [...document.querySelectorAll(".col-check:checked")].map(cb => cb.value);
    const colCount = showCols.length + 2;

    applyDecree30Header(ws, 'BÁO CÁO DANH SÁCH HỒ SƠ SAI SÓT / CẦN ĐIỀU CHỈNH', colCount);

    const headers = ["STT", "LÝ DO LỖI", ...showCols];
    const headerRow = ws.addRow(headers);
    headerRow.eachCell(c => c.style = EXCEL_STYLES.tableHeader);

    errorRows.forEach((row, idx) => {
        const v = validateRow(row, activeFile.mapping, classMapping);
        const r = ws.addRow([idx + 1, Object.values(v.errorCols).join(" | "), ...showCols.map(c => row[c] || "")]);
        r.eachCell(c => c.style = EXCEL_STYLES.cell);
    });

    const footerRow = ws.addRow([]).number + 2;
    addExcelSignatures(ws, footerRow, colCount);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Bao_cao_loi_${activeFileName.split('.')[0]}.xlsx`;
    link.click();
}

async function exportByClass() {
    if (excelData.length === 0) return;
    const mapping = dataStore[activeFileName]?.mapping;
    if (!mapping?.['lop']) { alert("Vui lòng Mapping cột Lớp!"); return; }

    const groups = {};
    excelData.forEach(row => {
        const className = (row[mapping['lop']] || "Khác").toString().trim();
        if (!groups[className]) groups[className] = [];
        groups[className].push(row);
    });

    const workbook = new ExcelJS.Workbook();
    const showCols = [...document.querySelectorAll(".col-check:checked")].map(cb => cb.value);
    const colCount = showCols.length + 1;

    Object.entries(groups).forEach(([className, rows]) => {
        const ws = workbook.addWorksheet(className.substring(0, 31));
        ws.pageSetup = EXCEL_STYLES.printSetup;
        applyDecree30Header(ws, `DANH SÁCH THÍ SINH - LỚP: ${className}`, colCount);

        const h = ws.addRow(["STT", ...showCols]);
        h.eachCell(c => c.style = EXCEL_STYLES.tableHeader);

        rows.forEach((r, idx) => {
            const row = ws.addRow([idx + 1, ...showCols.map(c => r[c] || "")]);
            row.eachCell(c => c.style = EXCEL_STYLES.cell);
        });

        const footerRow = ws.addRow([]).number + 2;
        addExcelSignatures(ws, footerRow, colCount);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Danh_sach_tach_lop.xlsx`;
    link.click();
}

async function exportToExcel() {
    if (excelData.length === 0) {
        showAlert("⚠️ Không có dữ liệu để xuất!", 'warning');
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Dữ liệu hệ thống');
    ws.pageSetup = EXCEL_STYLES.printSetup;
    const showCols = [...document.querySelectorAll(".col-check:checked")].map(cb => cb.value);
    const colCount = showCols.length + 1;

    applyDecree30Header(ws, 'BÁO CÁO TỔNG HỢP DỮ LIỆU KIỂM TRA HỒ SƠ', colCount);

    const h = ws.addRow(["STT", ...showCols]);
    h.eachCell(c => c.style = EXCEL_STYLES.tableHeader);

    excelData.forEach((row, idx) => {
        const r = ws.addRow([idx + 1, ...showCols.map(c => row[c] || "")]);
        r.eachCell(c => c.style = EXCEL_STYLES.cell);
    });

    const footerRow = ws.addRow([]).number + 2;
    addExcelSignatures(ws, footerRow, colCount);

    ws.columns.forEach(column => {
        let maxLen = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
            const currLen = cell.value ? cell.value.toString().length : 0;
            if (currLen > maxLen) maxLen = currLen;
        });
        column.width = Math.min(Math.max(maxLen + 2, 10), 50);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Du_lieu_tong_hop_${new Date().getTime()}.xlsx`;
    link.click();
    showAlert("✅ Đã xuất dữ liệu thành công!", 'success');
}

window.exportToExcel = exportToExcel;
