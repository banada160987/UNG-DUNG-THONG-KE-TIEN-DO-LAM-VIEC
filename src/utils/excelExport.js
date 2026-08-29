import * as XLSX from 'xlsx';

/**
 * Export data to Excel with a formal header
 * @param {Object} options
 * @param {string} options.reportName - The main title of the report (e.g. DANH SÁCH HỌC SINH...)
 * @param {Array<Array<any>>} options.data - The data array (AoA) starting with headers row, then data rows
 * @param {Array<any>} options.cols - Column width definitions e.g. [{wch: 8}, {wch: 20}]
 * @param {string} options.sheetName - Sheet name
 * @param {string} options.fileName - Output filename
 */
export const exportToExcelWithTitle = ({
  reportName,
  data,
  cols = [],
  sheetName = "Sheet1",
  fileName = "Export.xlsx"
}) => {
  const aoa = [
    ["TRƯỜNG THPT CAO BÁ QUÁT"],
    ["BAN TỔ CHỨC LỄ KỶ NIỆM 30 NĂM"],
    [""],
    [reportName],
    [`Thời gian trích xuất: ${new Date().toLocaleString('vi-VN')}`],
    [""],
    ...data
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);

  // Merge headers across all data columns
  const maxCol = cols.length > 0 ? cols.length - 1 : 3;
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: maxCol } }, // TRƯỜNG...
    { s: { r: 1, c: 0 }, e: { r: 1, c: maxCol } }, // BAN TỔ CHỨC...
    { s: { r: 3, c: 0 }, e: { r: 3, c: maxCol } }, // Báo cáo...
    { s: { r: 4, c: 0 }, e: { r: 4, c: maxCol } }, // Thời gian...
  ];

  if (cols.length > 0) {
    worksheet['!cols'] = cols;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  XLSX.writeFile(workbook, fileName);
};
