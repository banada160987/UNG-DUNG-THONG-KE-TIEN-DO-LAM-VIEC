// --- SMART DATA ENGINE CONFIG ---
        const VIETNAM_ETHNICS = ["Kinh", "Tày", "Thái", "Mường", "Khơ Me", "Mông", "Nùng", "Hoa", "Dao", "Gia Rai", "Ê Đê", "Ba Na", "Sán Chay", "Chăm", "Kơ Ho", "Xơ Đăng", "Sán Dìu", "Hrê", "Ra Glai", "M'Nông", "Xtiêng", "Bru-Vân Kiều", "Thổ", "Giáy", "Cơ Tu", "Giẻ Triêng", "Mạ", "Khơ Mú", "Co", "Tà Ôi", "Chơ Ro", "Kháng", "Xinh Mun", "Hà Nhì", "Chu Ru", "Lào", "La Chí", "Phù Lá", "La Hủ", "La Ha", "Pà Thẻn", "Lự", "Ngái", "Chứt", "Lô Lô", "Mảng", "Cơ Lao", "Bố Y", "Cống", "Si La", "Pu Péo", "Rơ Măm", "Brâu", "Ơ Đu"];

        const ETHNIC_SURNAMES = ["Niê", "Mlô", "Êban", "Adrơng", "Kpă", "Byă", "Nay", "Siu", "Ksor", "Hdruê", "Êñuôl", "Hđơ̆k", "Rchom", "Rơchom", "Ktul", "Knul", "Êčăm", "Arul", "Buôn Krông", "Buôn Yă", "Niê Kdăm", "Hrỡ", "Bdap", "Mlo Duôn Du", "Adrâng", "Buôn Tô", "Đang Hơ", "Hwing", "Iun", "Jơ Nơng", "Kđoh", "Krông", "Ksơr", "Kuan", "Pang Ting", "Rahlan", "Rơ Chăm", "Rơ Mah", "Sơ Krông", "Ya", "Yă", "BRIT", "KBUÔR", "KTLA", "ÊNUÔL", "ÊYA"];

        const PROVINCE_CODES = {
            "001": "Hà Nội", "002": "Hà Giang", "004": "Cao Bằng", "006": "Bắc Kạn", "008": "Tuyên Quang", "010": "Lào Cai", "011": "Điện Biên", "012": "Lai Châu", "014": "Sơn La", "015": "Yên Bái", "017": "Hoà Bình", "019": "Thái Nguyên", "020": "Lạng Sơn", "022": "Quảng Ninh", "024": "Bắc Giang", "025": "Phú Thọ", "026": "Vĩnh Phúc", "027": "Bắc Ninh", "030": "Hải Dương", "031": "Hải Phòng", "033": "Hưng Yên", "034": "Thái Bình", "035": "Hà Nam", "036": "Nam Định", "037": "Ninh Bình", "038": "Thanh Hóa", "040": "Nghệ An", "042": "Hà Tĩnh", "044": "Quảng Bình", "045": "Quảng Trị", "046": "Thừa Thiên Huế", "048": "Đà Nẵng", "049": "Quảng Nam", "051": "Quảng Ngãi", "052": "Bình Định", "054": "Phú Yên", "056": "Khánh Hòa", "058": "Ninh Thuận", "060": "Bình Thuận", "062": "Kon Tum", "064": "Gia Lai", "066": "Đắk Lắk", "067": "Đắk Nông", "068": "Lâm Đồng", "070": "Bình Phước", "072": "Tây Ninh", "074": "Bình Dương", "075": "Đồng Nai", "077": "Bà Rịa - Vũng Tàu", "079": "TP Hồ Chí Minh", "080": "Long An", "082": "Tiền Giang", "083": "Bến Tre", "084": "Trà Vinh", "086": "Vĩnh Long", "087": "Đồng Tháp", "089": "An Giang", "091": "Kiên Giang", "092": "Cần Thơ", "093": "Hậu Giang", "094": "Sóc Trăng", "095": "Bạc Liêu", "096": "Cà Mau"
        };

        const CORE_FIELDS = [
            { key: 'hoten', label: 'Họ và tên thí sinh', patterns: ['họ và tên', 'họ tên', 'họ tên thí sinh', 'họ và tên thí sinh'] },
            { key: 'ho_dem', label: 'Họ và đệm (SMAS)', patterns: ['họ và chữ đệm', 'họ đệm', 'họ và đệm', 'họ học sinh', 'họ và tên đệm'] },
            { key: 'ten', label: 'Tên thí sinh', patterns: ['^tên$', '^tên gọi$', 'tên thí sinh'] },
            { key: 'gioi_tinh', label: 'Giới tính (Nam 0, Nữ 1)', patterns: ['giới tính', 'phái', 'nam/nữ', 'giới tính (nam 0, nữ 1)'] },
            { key: 'sbd', label: 'Số báo danh', patterns: ['số báo danh', 'sbd'] },
            { key: 'cccd', label: 'Số CCCD/Định danh', patterns: ['cccd', 'căn cước', 'số định danh', 'số thẻ căn cước'] },
            { key: 'lop', label: 'Tên Lớp 12', patterns: ['lớp', 'lớp 12', 'tên lớp'] },
            { key: 'ngaysinh', label: 'Ngày sinh (Dạng ngày)', patterns: ['ngày sinh', 'ngày tháng năm sinh'] },
            { key: 'ngay_dd', label: 'Ngày (dd)', patterns: ['ngày (dd)', 'ngày sinh - ngày', 'ngày(dd)'] },
            { key: 'thang_mm', label: 'Tháng (mm)', patterns: ['tháng (mm)', 'ngày sinh - tháng', 'tháng(mm)'] },
            { key: 'nam_yy', label: 'Năm (yy)', patterns: ['năm (yy)', 'ngày sinh - năm', 'năm(yy)'] },
            { key: 'dantoc', label: 'Dân tộc', patterns: ['dân tộc'] },
            { key: 'toan', label: 'Toán', patterns: ['đăng ký thi các môn - toán', '^toán$', '^môn toán$'] },
            { key: 'van', label: 'Ngữ văn', patterns: ['đăng ký thi các môn - ngữ văn', '^ngữ văn$', '^văn$'] },
            { key: 'anh', label: 'Ngoại ngữ', patterns: ['đăng ký thi các môn - ngoại ngữ', '^ngoại ngữ$', '^tiếng anh$', '^anh$'] },
            { key: 'ly', label: 'Vật lí', patterns: ['đăng ký thi các môn - vật lí', '^vật lí$', '^vật lý$', '^lý$', '^lí$'] },
            { key: 'hoa', label: 'Hóa học', patterns: ['đăng ký thi các môn - hóa học', '^hóa học$', '^hóa$', '^hoá$'] },
            { key: 'sinh', label: 'Sinh học', patterns: ['đăng ký thi các môn - sinh học', '^sinh học$', '^sinh$'] },
            { key: 'su', label: 'Lịch sử', patterns: ['đăng ký thi các môn - lịch sử', '^lịch sử$', '^sử$'] },
            { key: 'dia', label: 'Địa lí', patterns: ['đăng ký thi các môn - địa lí', '^địa lí$', '^địa lý$', '^địa$'] },
            { key: 'gdkt', label: 'Giáo dục Kinh tế-pháp luật', patterns: ['đăng ký thi các môn - giáo dục kinh tế-pháp luật', '^giáo dục kinh tế$', '^gdkt$', '^pháp luật$', '^kinh tế pháp luật$', '^gdcd$'] },
            { key: 'tin', label: 'Tin học', patterns: ['đăng ký thi các môn - tin học', '^tin học$', '^tin$'] },
            { key: 'cnc', label: 'Công nghệ Công nghiệp', patterns: ['đăng ký thi các môn - công nghệ công nghiệp', '^công nghệ công nghiệp$', '^công nghệ công$', '^cnc$'] },
            { key: 'cnn', label: 'Công nghệ Nông nghiệp', patterns: ['đăng ký thi các môn - công nghệ nông nghiệp', '^công nghệ nông nghiệp$', '^công nghệ nông$', '^cnn$'] },
            { key: 'lt_tc', label: 'Liên thông - Đã TN Trung cấp', patterns: ['trung cấp', 'tn trung cấp', 'đã tốt nghiệp trung cấp'] },
            { key: 'lt_cd', label: 'Liên thông - Đã TN Cao đẳng', patterns: ['cao đẳng', 'tn cao đẳng', 'đã tốt nghiệp cao đẳng'] },
            { key: 'lt_dh', label: 'Liên thông - Đã TN Đại học', patterns: ['đại học', 'tn đại học', 'đã tốt nghiệp đại học'] },
            { key: 'ts_tu_do_da_tn', label: 'TS Tự do - Đã TN', patterns: ['thí sinh tự do - đã tốt nghiệp thpt'] },
            { key: 'ts_tu_do_chua_tn', label: 'TS Tự do - Chưa TN', patterns: ['thí sinh tự do - chưa tốt nghiệp thpt'] },
            { key: 'hinh_thuc_gdpt', label: 'Hình thức GDPT', patterns: ['hình thức giáo dục phổ thông - gdpt'] },
            { key: 'hinh_thuc_gdtx', label: 'Hình thức GDTX', patterns: ['hình thức giáo dục phổ thông - gdtx'] },
            { key: 'ut_dt', label: 'Đối tượng ưu tiên', patterns: ['đối tượng ưu tiên', 'ưu tiên', 'dt_ut', 'mã đối tượng ưu tiên'] },
            { key: 'dienthoai', label: 'Điện thoại', patterns: ['điện thoại', 'sđt', 'số điện thoại', 'phone', 'di động'] },
            { key: 'email', label: 'Email', patterns: ['email', 'thư điện tử', 'địa chỉ email'] },
            { key: 'thuong_tru', label: 'Hộ khẩu / Thường trú', patterns: ['hộ khẩu', 'thường trú', 'địa chỉ', 'hộ khẩu thường trú', 'địa chỉ thường trú', 'thường trú/hộ khẩu'] },
            { key: 'dien_tn', label: 'Diện xét tốt nghiệp', patterns: ['diện xét tốt nghiệp', 'diện xét tn', 'mã diện xét tốt nghiệp', 'diện xtn', 'diện tốt nghiệp'] },
            { key: 'school_10', label: 'Mã trường Lớp 10', patterns: ['mã trường lớp 10', 'mã trường 10', 'trường lớp 10', 'mã trường thpt lớp 10'] },
            { key: 'school_11', label: 'Mã trường Lớp 11', patterns: ['mã trường lớp 11', 'mã trường 11', 'trường lớp 11', 'mã trường thpt lớp 11'] },
            { key: 'school_12', label: 'Mã trường Lớp 12', patterns: ['mã trường lớp 12', 'mã trường 12', 'trường lớp 12', 'mã trường thpt lớp 12'] },
            { key: 'province_10', label: 'Mã tỉnh Lớp 10', patterns: ['mã tỉnh lớp 10', 'mã tỉnh 10', 'tỉnh lớp 10'] },
            { key: 'province_11', label: 'Mã tỉnh Lớp 11', patterns: ['mã tỉnh lớp 11', 'mã tỉnh 11', 'tỉnh lớp 11'] },
            { key: 'province_12', label: 'Mã tỉnh Lớp 12', patterns: ['mã tỉnh lớp 12', 'mã tỉnh 12', 'tỉnh lớp 12'] }
        ];