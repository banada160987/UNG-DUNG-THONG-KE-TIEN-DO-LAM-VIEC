/**
 * VALIDATION ENGINE
 * Extracted from app.js to handle all business logic checks.
 */

const ValidationEngine = {
    validateRow: function(row, mapping, classMapping = []) {
    const result = { hasError: false, errorCols: {}, rowData: row };
    const val = (k) => {
        const col = mapping[k];
        return col ? (row[col] || "").toString().trim() : "";
    };

    const addError = (key, msg) => {
        result.hasError = true;
        const colName = mapping[key] || key;
        result.errorCols[colName] = (result.errorCols[colName] ? result.errorCols[colName] + " | " : "") + msg;
    };

    // Sắp xếp các lỗi theo thứ tự ưu tiên: Định danh -> Thông tin cá nhân -> Môn thi -> Diện xét TN

    // 1. Kiểm tra CCCD (Bắt buộc và đúng định dạng)
    if (activeValidationMode === 'cccd' || activeValidationMode === 'ALL_ERROR') {
        const cccd = val('cccd').replace(/\s+/g, '');
        if (!cccd) {
            addError('cccd', "⚠️ THIẾU DỮ LIỆU: Số CCCD không được để trống.");
        } else if (!/^\d{12}$/.test(cccd)) {
            addError('cccd', `⚠️ ĐỊNH DẠNG: CCCD [${cccd}] phải đủ 12 chữ số.`);
        } else {
            // Kiểm tra mã tỉnh trong CCCD
            const provinceCode = cccd.substring(0, 3);
            if (!PROVINCE_CODES[provinceCode]) {
                addError('cccd', `⚠️ Mã tỉnh (${provinceCode}) trong CCCD không hợp lệ.`);
            }

            // Kiểm tra Giới tính & Năm sinh từ CCCD
            const genderDigit = parseInt(cccd.charAt(3));
            const cccdYearShort = cccd.substring(4, 6);
            let century = 1900;
            if (genderDigit === 2 || genderDigit === 3) century = 2000;
            else if (genderDigit === 4 || genderDigit === 5) century = 2100;

            const birthYearFromCCCD = century + parseInt(cccdYearShort);
            const gioiTinh = val('gioi_tinh');
            if (gioiTinh !== "") {
                const isFemaleCCCD = (genderDigit % 2 !== 0);
                if ((gioiTinh === "0" && isFemaleCCCD) || (gioiTinh === "1" && !isFemaleCCCD)) {
                    addError('gioi_tinh', `⚠️ XUNG ĐỘT: Giới tính không khớp mã giới tính trong CCCD.`);
                }
            }

            // Kiểm tra năm sinh
            const declaredYear = val('nam_yy') || (val('ngaysinh').match(/\d{4}$/) || [])[0];
            if (declaredYear) {
                let yearNum = parseInt(declaredYear);
                if (yearNum < 100) yearNum += 2000; // Chuyển đổi ví dụ 08 -> 2008
                if (yearNum !== birthYearFromCCCD) {
                    addError('cccd', `⚠️ XUNG ĐỘT: Năm sinh (${declaredYear}) không khớp CCCD (${birthYearFromCCCD}).`);
                }
                if (yearNum !== 2008) {
                    addError('cccd', `⚠️ CẢNH BÁO: Năm sinh (${declaredYear}) khác năm 2008, vui lòng kiểm tra lại.`);
                }
            }
        }
    }

    // 2. Kiểm tra Họ tên và Dân tộc
    if ((activeValidationMode === 'ethnic' || activeValidationMode === 'ALL_ERROR') && mapping['dantoc']) {
        const dt = val('dantoc');
        const firstName = val('ten') || val('hoten').split(/\s+/).pop();

        if (!dt) addError('dantoc', "⚠️ Thiếu thông tin dân tộc.");
        else {
            const normalize = (s) => s.toLowerCase().replace(/[-]/g, ' ').replace(/\s+/g, ' ').trim();
            const target = normalize(dt);
            if (!VIETNAM_ETHNICS.some(e => normalize(e) === target)) {
                addError('dantoc', `⚠️ '${dt}' không thuộc 54 dân tộc chuẩn.`);
            }
        }

        if (firstName) {
            const normalize = (s) => s.toLowerCase().replace(/[-]/g, ' ').replace(/\s+/g, ' ').trim();
            if (ETHNIC_SURNAMES.some(s => normalize(s) === normalize(firstName))) {
                addError('ten', `⚠️ LỖI: Cột 'Tên' không được chỉ chứa họ dân tộc.`);
            }
        }
    }

    // 3. Kiểm tra đăng ký môn thi (Quy tắc 2+2)
    if (activeValidationMode === 'subject' || activeValidationMode === 'ALL_ERROR') {
        const subjects = ['anh', 'ly', 'hoa', 'sinh', 'su', 'dia', 'gdkt', 'tin', 'cnn', 'cnc', 'nhat', 'trung', 'han', 'phap', 'nga', 'duc'];
        const registered = subjects.filter(s => isSubjectMarked(row, s, mapping));

        const registeredNames = registered.map(s => subjectLabels[subjects.indexOf(s)]);

        if (registered.length !== 2) {
            addError('toan', `⚠️ SAI QUY TẮC 2+2: Hệ thống đang thấy ${registered.length} môn tự chọn (${registeredNames.join(", ")}). Yêu cầu đúng 02 môn.`);
        }

        // Kiểm tra theo cấu hình lớp
        const lop = val('lop').replace(/\s+/g, '').toUpperCase();
        const classCfg = classMapping.find(c => c.name.replace(/\s+/g, '').toUpperCase() === lop);
        if (classCfg) {
            registered.forEach(s => {
                const idx = subjects.indexOf(s);
                if (!classCfg.allowed[idx]) {
                    addError(s, `⚠️ MÔN KHÔNG PHÙ HỢP: Lớp ${lop} không học môn ${subjectLabels[idx]}.`);
                }
            });
        }
    }

    // 4. Kiểm tra Diện xét tốt nghiệp
    if ((activeValidationMode === 'dien_TN' || activeValidationMode === 'ALL_ERROR') && mapping['dien_tn']) {
        const dienVal = val('dien_tn').trim();
        const address = val('thuong_tru');
        const dtRaw = val('dantoc').toLowerCase().trim();
        const isMinority = dtRaw !== "" && dtRaw !== "kinh";

        let expectedArea = "";
        let ruleReason = "";

        // Kiểm tra theo mã trường (2/3 năm)
        const schools = [val('school_10'), val('school_11'), val('school_12')];
        if (graduationRules.school) {
            for (const [key, area] of Object.entries(graduationRules.school)) {
                const [code, ethReq] = key.split('|');
                let ethMatch = (ethReq === 'all') || (ethReq === 'minority' && isMinority) || (ethReq === 'kinh' && !isMinority);
                if (ethMatch) {
                    const matchCount = schools.filter(s => s === code).length;
                    if (matchCount >= 2) { expectedArea = area; ruleReason = `Trường ${code}`; break; }
                }
            }
        }

        // Kiểm tra theo địa chỉ nếu chưa tìm thấy
        if (!expectedArea && address && graduationRules.address) {
            const sortedKeywords = Object.keys(graduationRules.address).sort((a, b) => b.length - a.length);
            for (const keyword of sortedKeywords) {
                if (address.toLowerCase().includes(keyword.toLowerCase())) {
                    expectedArea = graduationRules.address[keyword];
                    ruleReason = `Địa chỉ '${keyword}'`;
                    break;
                }
            }
        }

        if (!dienVal) {
            const suggestion = expectedArea ? ` -> Gợi ý: ${expectedArea}` : "";
            addError('dien_tn', `⚠️ THIẾU DIỆN XÉT TN${suggestion}.`);
        } else if (expectedArea && dienVal.toUpperCase() !== expectedArea.toUpperCase()) {
            addError('dien_tn', `⚠️ SAI LỆCH DIỆN: Hệ thống tính toán là ${expectedArea} (${ruleReason}).`);
        }
    }

    // 5. Các kiểm tra bổ sung (Birthday, Classname, Contact, Gender, Priority)
    if (activeValidationMode === 'birthday' || activeValidationMode === 'ALL_ERROR') {
        // Đã kiểm tra gộp tại phần CCCD để tránh lặp cảnh báo
    }

    if (activeValidationMode === 'classname' || activeValidationMode === 'ALL_ERROR') {
        const lop = val('lop').trim();
        const lopRegex = /^12[A-Z]+\d{2}$/i;
        if (lop && !lopRegex.test(lop)) {
            addError('lop', "⚠️ TÊN LỚP SAI: Tên lớp phải đúng định dạng (ví dụ: 12A01, 12A02).");
        }
    }

    if (activeValidationMode === 'contact' || activeValidationMode === 'ALL_ERROR') {
        const phone = val('dienthoai').replace(/[^0-9]/g, '');
        const email = val('email');
        if (phone && phone.length < 10) addError('dienthoai', "⚠️ SĐT SAI: Số điện thoại phải có ít nhất 10 chữ số.");
        if (email && !email.includes('@')) addError('email', "⚠️ EMAIL SAI: Định dạng email không hợp lệ.");
    }

    if (activeValidationMode === 'gender' || activeValidationMode === 'ALL_ERROR') {
        let gioiTinhRaw = val('gioi_tinh').toLowerCase();
        const cccd = val('cccd').replace(/[^0-9]/g, '');

        // Chuẩn hóa giới tính: Nam -> 0, Nữ -> 1
        let gioiTinh = "";
        if (gioiTinhRaw === "" || gioiTinhRaw.includes("nam") || gioiTinhRaw === "0") gioiTinh = "0";
        else if (gioiTinhRaw.includes("nữ") || gioiTinhRaw === "1") gioiTinh = "1";

        if (cccd.length === 12) {
            const genderDigit = parseInt(cccd.charAt(3));
            const isFemaleCCCD = (genderDigit % 2 !== 0);

            if (gioiTinh === "0" && isFemaleCCCD) {
                addError('gioi_tinh', `⚠️ XUNG ĐỘT: Hồ sơ là Nam nhưng mã CCCD (${genderDigit}) là của Nữ.`);
            } else if (gioiTinh === "1" && !isFemaleCCCD) {
                addError('gioi_tinh', `⚠️ XUNG ĐỘT: Hồ sơ là Nữ nhưng mã CCCD (${genderDigit}) là của Nam.`);
            }
        } else if (gioiTinhRaw !== "" && gioiTinh === "") {
            addError('gioi_tinh', "⚠️ SAI ĐỊNH DẠNG: Giới tính phải là 0 (Nam) hoặc 1 (Nữ).");
        }
    }

    if (activeValidationMode === 'profile' || activeValidationMode === 'ALL_ERROR') {
        const isTuDoDaTN = val('ts_tu_do_da_tn') === 'X';
        const isTuDoChuaTN = val('ts_tu_do_chua_tn') === 'X';
        if (isTuDoDaTN && isTuDoChuaTN) addError('ts_tu_do_da_tn', "⚠️ MÂU THUẪN: Thí sinh không thể vừa là Tự do đã TN vừa là Tự do chưa TN.");
    }

    if (activeValidationMode === 'lienthong' || activeValidationMode === 'ALL_ERROR') {
        const lt_tc = val('lt_tc') === 'X';
        const lt_cd = val('lt_cd') === 'X';
        const lt_dh = val('lt_dh') === 'X';
        if ([lt_tc, lt_cd, lt_dh].filter(x => x).length > 1) {
            addError('lt_tc', "⚠️ MÂU THUẪN: Chỉ chọn 01 loại hình liên thông (TC/CĐ/ĐH).");
        }
    }

    if ((activeValidationMode === 'Dien_utdt' || activeValidationMode === 'ALL_ERROR') && mapping['ut_dt']) {
        const dt = val('dantoc').toLowerCase().trim();
        const ut = val('ut_dt').trim();
        if (dt !== "" && dt !== "kinh" && !ut) {
            addError('ut_dt', "⚠️ THIẾU ƯU TIÊN: Thí sinh dân tộc thiểu số thường có mã đối tượng ưu tiên (ví dụ: 01).");
        }
    }

    if ((activeValidationMode === 'gdpt' || activeValidationMode === 'ALL_ERROR') && (mapping['hinh_thuc_gdpt'] || mapping['hinh_thuc_gdtx'])) {
        const isGDPT = val('hinh_thuc_gdpt') !== 'X';
        const isGDTX = val('hinh_thuc_gdtx') === 'X';
        if (isGDPT && isGDTX) addError('hinh_thuc_gdpt', "⚠️ MÂU THUẪN: Thí sinh không thể vừa học GDPT vừa học GDTX.");
        if (!isGDPT && !isGDTX) addError('hinh_thuc_gdpt', "⚠️ THIẾU HÌNH THỨC: Vui lòng chọn GDPT hoặc GDTX.");
    }

    // Custom UI Rules
    const customRules = [...document.querySelectorAll("#logic-rules .filter-row")];
    customRules.forEach(g => {
        const field = g.querySelector("select").value;
        const op = g.querySelectorAll("select")[1].value;
        const targetVal = g.querySelector("input").value.trim().toLowerCase();
        const cellVal = (row[field] || "").toString().trim().toLowerCase();

        let failed = false;
        if (op === "Phải bằng" && cellVal !== targetVal) failed = true;
        if (op === "Phải khác" && cellVal === targetVal) failed = true;
        if (op === "Phải có dữ liệu" && !cellVal) failed = true;
        if (op === "Phải trống" && cellVal) failed = true;

        if (failed) addError(field, `Không khớp quy tắc: ${op} ${targetVal}`);
    });

    return result;

    }
};

window.validateRow = ValidationEngine.validateRow.bind(ValidationEngine);
