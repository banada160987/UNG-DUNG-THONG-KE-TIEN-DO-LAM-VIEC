import { supabase, supabase2, DualSupabaseService } from '../lib/supabase';

/**
 * MÃ NGUỒN GOOGLE APPS SCRIPT TOÀN DIỆN CHO TOÀN TRƯỜNG
 * ----------------------------------------------------
 * Tự động tạo cây thư mục và phân loại:
 * - 01_SO_HOA_VAN_BANG (Bằng tốt nghiệp, Giấy khen, Chứng nhận theo Lớp)
 * - 02_HO_SO_GIAO_VIEN (Giáo án, Kế hoạch bài dạy, Đánh giá theo Tổ chuyên môn)
 * - 03_VAN_BAN_NHA_TRUONG (Công văn, Quyết định, Báo cáo theo Năm học)
 * - 04_DON_DANG_KY_HOC_SINH (Đơn có chữ ký theo từng Đợt & Lớp)
 * - 05_TAI_LIEU_CHUNG (Các tài liệu đính kèm khác)
 */
export const UNIVERSAL_GOOGLE_APPS_SCRIPT_CODE = `/**
 * GOOGLE APPS SCRIPT: HỆ THỐNG LƯU TRỮ GOOGLE DRIVE ĐÁM MÂY TOÀN TRƯỜNG
 * TRƯỜNG THPT CAO BÁ QUÁT
 * =====================================================================
 * HƯỚNG DẪN CÀI ĐẶT 1 LẦN DUY NHẤT (Khoảng 1 phút):
 * 1. Mở trình duyệt, truy cập https://script.google.com bằng tài khoản Google của Trường.
 * 2. Bấm "Dự án mới" (New project), xóa hết code có sẵn và dán toàn bộ đoạn mã này vào.
 * 3. Bấm biểu tượng 💾 (Lưu) hoặc phím Ctrl + S.
 * 4. Bấm nút "Triển khai" (Deploy) -> chọn "Tùy chọn triển khai mới" (New deployment).
 *    - Loại: "Ứng dụng web" (Web app).
 *    - Mô tả: "Hệ thống lưu trữ Drive Trường THPT Cao Bá Quát".
 *    - Thực thi với tư cách: "Tôi" (Me).
 *    - Ai có quyền truy cập: "Bất kỳ ai" (Anyone) -> [QUAN TRỌNG: để học sinh/giáo viên gửi file không bị hỏi đăng nhập].
 * 5. Bấm "Triển khai" -> Cấp quyền truy cập (Review permissions) -> Chọn tài khoản Google -> Chọn "Nâng cao" (Advanced) -> "Đi tới [Tên dự án] (không an toàn)" -> Bấm "Cho phép" (Allow).
 * 6. Sao chép "URL ứng dụng web" (kết thúc bằng /exec) và dán vào phần "Cấu hình Google Drive" trên website!
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Google Drive đang bận xử lý nhiều tệp cùng lúc. Vui lòng thử lại sau giây lát!"
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Không tìm thấy dữ liệu tệp gửi đến."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    var base64Data = data.base64Data;
    var rawFileName = data.fileName || "Tep_dinh_kem.pdf";
    var mimeType = data.mimeType || "application/octet-stream";
    var category = String(data.category || "chung").toLowerCase(); // van_bang | giao_vien | van_ban | hoc_sinh | chung
    var subFolder = String(data.subFolder || "").trim(); // Tên lớp (12A1), Tổ chuyên môn (Toán), hoặc Năm
    var entityName = String(data.entityName || "").trim(); // Tên học sinh, tên giáo viên, hoặc số công văn
    var rootFolderId = data.rootFolderId ? String(data.rootFolderId).trim() : "";

    // 1. Xác định Thư mục Gốc của Trường
    var rootFolder;
    if (rootFolderId) {
      try {
        rootFolder = DriveApp.getFolderById(rootFolderId);
      } catch (err) {
        rootFolder = null;
      }
    }

    if (!rootFolder) {
      var rootName = "HE_THONG_HO_SO_THPT_CAO_BA_QUAT";
      var rootIter = DriveApp.getRootFolder().getFoldersByName(rootName);
      if (rootIter.hasNext()) {
        rootFolder = rootIter.next();
      } else {
        rootFolder = DriveApp.getRootFolder().createFolder(rootName);
        try { rootFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
      }
    }

    // 2. Xác định Thư mục Phân hệ theo Category
    var moduleFolderName = "05_TAI_LIEU_CHUNG";
    var filePrefix = "[Tai_Lieu]";

    if (category === "van_bang") {
      moduleFolderName = "01_SO_HOA_VAN_BANG";
      filePrefix = "[Van_Bang]";
    } else if (category === "giao_vien" || category === "giao_an") {
      moduleFolderName = "02_HO_SO_GIAO_VIEN";
      filePrefix = "[Giao_An]";
    } else if (category === "van_ban" || category === "cong_van") {
      moduleFolderName = "03_VAN_BAN_NHA_TRUONG";
      filePrefix = "[Van_Ban]";
    } else if (category === "hoc_sinh" || category === "dang_ky") {
      moduleFolderName = "04_DON_DANG_KY_HOC_SINH";
      filePrefix = "[Don_Ky]";
    }

    var moduleFolder = getOrCreateSubFolder(rootFolder, moduleFolderName);

    // 3. Xác định Thư mục Con (Ví dụ: "Lớp 12A1" hoặc "Tổ Toán" hoặc "Năm 2026")
    var targetFolder = moduleFolder;
    if (subFolder) {
      targetFolder = getOrCreateSubFolder(moduleFolder, subFolder);
    }

    // 4. Chuẩn hóa Tên tệp
    var cleanEntity = entityName ? entityName.replace(/[/\\\\?%*:|"<>]/g, '_') : "";
    var fileExt = rawFileName.split('.').pop() || "pdf";
    var cleanBaseName = rawFileName.replace('.' + fileExt, '').replace(/[/\\\\?%*:|"<>]/g, '_');
    
    var standardizedFileName = filePrefix + " " + (cleanEntity ? cleanEntity + " - " : "") + cleanBaseName + "." + fileExt;

    // 5. Giải mã Base64 và Lưu tệp vào Drive
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType, standardizedFileName);
    var newFile = targetFolder.createFile(blob);
    
    try {
      newFile.setDescription("Hồ sơ số hóa trường THPT Cao Bá Quát | Phân hệ: " + moduleFolderName + (subFolder ? " | " + subFolder : "") + (entityName ? " | " + entityName : ""));
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {}

    var fileId = newFile.getId();
    var result = {
      status: "success",
      fileId: fileId,
      fileUrl: newFile.getUrl(),
      previewUrl: "https://drive.google.com/file/d/" + fileId + "/view?usp=sharing",
      downloadUrl: "https://drive.google.com/uc?export=download&id=" + fileId,
      embedUrl: "https://drive.google.com/file/d/" + fileId + "/preview",
      folderUrl: targetFolder.getUrl(),
      folderName: targetFolder.getName(),
      fileName: standardizedFileName,
      category: category
    };

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Lỗi lưu file trên Google Drive: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ready",
    service: "CBQ_SCHOOL_GOOGLE_DRIVE_SERVICE",
    version: "2.0",
    message: "Hệ sinh thái Google Drive Trường THPT Cao Bá Quát sẵn sàng tiếp nhận và lưu trữ hồ sơ số hóa!"
  })).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSubFolder(parent, folderName) {
  var iter = parent.getFoldersByName(folderName);
  if (iter.hasNext()) {
    return iter.next();
  }
  var newFolder = parent.createFolder(folderName);
  try {
    newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {}
  return newFolder;
}
`;

const LOCAL_STORAGE_SCRIPT_KEY = 'cbq_school_drive_script_url';
const LOCAL_STORAGE_FOLDER_KEY = 'cbq_school_drive_folder_id';

/**
 * Trích xuất Google Drive Folder ID từ URL hoặc chuỗi ID
 */
export function extractDriveFolderId(input) {
  if (!input) return '';
  const str = String(input).trim();
  const match = str.match(/[-\w]{25,}/);
  return match ? match[0] : str;
}

/**
 * Lấy cấu hình Google Drive toàn trường (Ưu tiên: Database -> LocalStorage -> Env)
 */
export async function getSchoolDriveConfig() {
  let scriptUrl = localStorage.getItem(LOCAL_STORAGE_SCRIPT_KEY) || import.meta.env.VITE_GOOGLE_DRIVE_SCRIPT_URL || '';
  let folderId = localStorage.getItem(LOCAL_STORAGE_FOLDER_KEY) || import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || '';

  try {
    // Thử truy vấn cấu hình đã lưu trên Supabase
    const { data } = await supabase
      .from('cbq_external_links')
      .select('*')
      .eq('type', 'school_drive_config')
      .maybeSingle();

    if (data) {
      if (data.url && data.url.startsWith('http')) {
        scriptUrl = data.url;
        localStorage.setItem(LOCAL_STORAGE_SCRIPT_KEY, scriptUrl);
      }
      if (data.description) {
        folderId = data.description;
        localStorage.setItem(LOCAL_STORAGE_FOLDER_KEY, folderId);
      }
    }
  } catch (e) {
    // Giữ nguyên giá trị từ localStorage
  }

  return {
    scriptUrl: scriptUrl.trim(),
    folderId: extractDriveFolderId(folderId)
  };
}

/**
 * Lưu cấu hình Google Drive toàn trường (Đồng bộ cả LocalStorage và Database)
 */
export async function saveSchoolDriveConfig({ scriptUrl, folderId }) {
  const cleanScript = (scriptUrl || '').trim();
  const cleanFolder = extractDriveFolderId(folderId);

  localStorage.setItem(LOCAL_STORAGE_SCRIPT_KEY, cleanScript);
  localStorage.setItem(LOCAL_STORAGE_FOLDER_KEY, cleanFolder);

  try {
    const { data: existing } = await supabase
      .from('cbq_external_links')
      .select('id')
      .eq('type', 'school_drive_config')
      .maybeSingle();

    const payload = {
      type: 'school_drive_config',
      title: 'Google Apps Script Lưu Trữ Toàn Trường',
      url: cleanScript,
      description: cleanFolder,
      is_active: true,
      order_index: 99
    };

    if (existing?.id) {
      await DualSupabaseService.update('cbq_external_links', payload, 'id', existing.id);
    } else {
      await DualSupabaseService.insert('cbq_external_links', [payload]);
    }
  } catch (err) {
    console.warn("Lỗi lưu cấu hình Drive lên database:", err);
  }

  return { scriptUrl: cleanScript, folderId: cleanFolder };
}

/**
 * Kiểm tra kết nối Web App Google Apps Script
 */
export async function testDriveScriptConnection(scriptUrl) {
  if (!scriptUrl || !scriptUrl.startsWith('http')) {
    return { ok: false, message: 'URL Web App không hợp lệ hoặc chưa được nhập.' };
  }

  try {
    const res = await fetch(scriptUrl, { method: 'GET' });
    if (!res.ok) {
      return { ok: false, message: `Máy chủ Google phản hồi HTTP ${res.status}. Hãy kiểm tra xem đã triển khai ở chế độ "Ai có quyền truy cập: Bất kỳ ai" chưa.` };
    }
    const json = await res.json();
    if (json.status === 'ready') {
      return { ok: true, message: json.message || 'Kết nối Google Drive thành công!' };
    }
    return { ok: true, message: 'Google Apps Script đang hoạt động!' };
  } catch (err) {
    return { ok: false, message: 'Không thể kết nối đến Web App: ' + err.message };
  }
}

/**
 * Hàm Tải Tệp Lên Google Drive Toàn Trường
 * @param {Object} options
 * @param {File|Blob} options.file - Đối tượng file người dùng chọn
 * @param {'van_bang'|'giao_vien'|'van_ban'|'hoc_sinh'|'chung'} options.category - Phân hệ lưu trữ
 * @param {string} options.subFolder - Tên thư mục con (VD: 'Lớp 12A1', 'Tổ Toán', 'Năm 2026')
 * @param {string} options.entityName - Tên học sinh, tên giáo viên hoặc số hiệu văn bản
 * @param {string} [options.overrideScriptUrl] - URL script riêng nếu có
 * @param {string} [options.overrideFolderId] - ID thư mục gốc riêng nếu có
 */
export async function uploadToSchoolDrive({
  file,
  category = 'chung',
  subFolder = '',
  entityName = '',
  overrideScriptUrl = '',
  overrideFolderId = ''
}) {
  const config = await getSchoolDriveConfig();
  const scriptUrl = overrideScriptUrl || config.scriptUrl;
  const rootFolderId = overrideFolderId || config.folderId;

  if (!scriptUrl || !scriptUrl.startsWith('http')) {
    throw new Error("URL Web App Google Apps Script chưa được cấu hình. Vui lòng vào Cấu hình Google Drive để thiết lập!");
  }

  // Đọc file thành Base64
  const base64Data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = typeof result === 'string' && result.includes(',')
        ? result.split(',')[1]
        : result;
      resolve(base64);
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });

  const payload = {
    base64Data,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    category,
    subFolder,
    entityName,
    rootFolderId
  };

  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8' // Tránh CORS preflight
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Google Apps Script phản hồi HTTP ${response.status}. Hãy kiểm tra xem Script đã triển khai đúng quyền "Bất kỳ ai" (Anyone) chưa.`);
  }

  const json = await response.json();
  if (json.status !== 'success') {
    throw new Error(json.message || 'Lỗi khi lưu file vào Google Drive.');
  }

  return json;
}

/**
 * Tiện ích mã hóa & giải mã Drive Link trong trường content của cbq_digital_documents
 */
export function buildDocContent(text, driveUrl) {
  const cleanText = (text || '').trim();
  const cleanUrl = (driveUrl || '').trim();
  if (!cleanUrl) return cleanText;
  return cleanText ? `${cleanText}\n[DRIVE_URL:${cleanUrl}]` : `[DRIVE_URL:${cleanUrl}]`;
}

export function parseDocContent(content) {
  if (!content) return { text: '', driveUrl: '' };
  const str = String(content);
  const match = str.match(/\[(?:DRIVE_URL|Link bản scan):\s*(https:\/\/[^\]]+)\]/i);
  if (match) {
    const driveUrl = match[1].trim();
    const text = str.replace(match[0], '').trim();
    return { text, driveUrl };
  }
  // Thử kiểm tra nếu cả content là 1 link Drive
  if (str.startsWith('https://drive.google.com/')) {
    return { text: '', driveUrl: str.trim() };
  }
  return { text: str, driveUrl: '' };
}
