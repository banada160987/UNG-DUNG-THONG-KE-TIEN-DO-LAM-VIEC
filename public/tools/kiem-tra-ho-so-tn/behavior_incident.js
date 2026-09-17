/**
 * BEHAVIOR INCIDENT DIGITIZER
 * Generates formal incident reports conforming to Decree 30/2020/ND-CP.
 */

const BehaviorIncident = (function () {
    "use strict";

    let signaturePads = {
        student: { canvas: null, ctx: null, drawing: false, empty: true },
        teacher: { canvas: null, ctx: null, drawing: false, empty: true }
    };

    // --- CƠ SỞ DỮ LIỆU LỖI & GỢI Ý ---
    const incidentTypes = {
        "nenep": {
            label: "Biên bản Vi phạm Nội quy",
            title: "BIÊN BẢN VI PHẠM NỘI QUY TRƯỜNG HỌC",
            violations: [
                { id: "dt", name: "Sử dụng điện thoại trong giờ học", suggest: "Tịch thu điện thoại giao cho GVCN giữ đến cuối tuần; mời phụ huynh lên làm việc và viết bản kiểm điểm." },
                { id: "dm", name: "Đi học muộn không có lý do", suggest: "Cảnh cáo trước lớp, lao động vệ sinh lớp học 1 tuần. Nếu tái phạm sẽ mời phụ huynh." },
                { id: "dp", name: "Vi phạm quy định đồng phục/đầu tóc", suggest: "Nhắc nhở, yêu cầu chỉnh đốn trang phục. Tái phạm sẽ mời phụ huynh và hạ bậc hạnh kiểm." },
                { id: "dn", name: "Đánh nhau/Gây gổ trong trường", suggest: "Đình chỉ học tập 3 ngày, hạ hạnh kiểm loại Yếu và cảnh cáo trước toàn trường." }
            ]
        },
        "hoctap": {
            label: "Biên bản Vi phạm Học tập",
            title: "BIÊN BẢN VI PHẠM KỶ LUẬT HỌC TẬP",
            violations: [
                { id: "qc", name: "Gian lận/Quay cóp trong kiểm tra", suggest: "Hủy kết quả bài kiểm tra (điểm 0); viết bản kiểm điểm và thông báo cho phụ huynh." },
                { id: "kb", name: "Không thuộc bài/Không làm bài tập nhiều lần", suggest: "Phê bình trước lớp, yêu cầu chép phạt và bù bài tập. Thông báo phụ huynh đôn đốc." },
                { id: "tt", name: "Trốn học/Bỏ tiết", suggest: "Cảnh cáo toàn trường, lao động công ích 1 tuần và hạ bậc hạnh kiểm." }
            ]
        },
        "atgt": {
            label: "Biên bản Vi phạm Giao thông",
            title: "BIÊN BẢN VI PHẠM AN TOÀN GIAO THÔNG",
            violations: [
                { id: "mb", name: "Không đội mũ bảo hiểm khi đi xe máy/xe đạp điện", suggest: "Tạm giữ phương tiện, cảnh cáo toàn trường, hạ bậc hạnh kiểm loại Yếu và mời phụ huynh cam kết." },
                { id: "pl", name: "Đi xe máy phân khối lớn (trên 50cc) khi chưa đủ tuổi", suggest: "Phối hợp với Công an giao thông lập biên bản, mời phụ huynh lên làm việc và ký cam kết không giao xe cho học sinh." }
            ]
        },
        "taisan": {
            label: "Biên bản Phá hoại Tài sản",
            title: "BIÊN BẢN PHÁ HOẠI TÀI SẢN NHÀ TRƯỜNG",
            violations: [
                { id: "bp", name: "Làm hỏng/Vẽ bậy lên bàn ghế, tường lớp học", suggest: "Buộc bồi thường 100% giá trị tài sản thiệt hại, dọn dẹp vệ sinh trường 1 tuần và hạ hạnh kiểm." },
                { id: "kt", name: "Phá hoại trang thiết bị phòng thực hành/máy tính", suggest: "Đình chỉ học tập 3 ngày, bồi thường tài sản và cảnh cáo trước toàn trường." }
            ]
        },
        "kiemtra": {
            label: "Biên bản Kiểm tra Đột xuất",
            title: "BIÊN BẢN KIỂM TRA ĐỘT XUẤT",
            violations: [
                { id: "kt1", name: "Phát hiện mang hung khí/vật nhọn nguy hiểm", suggest: "Cách ly học sinh, báo cáo BGH và Công an địa phương. Đình chỉ học vô thời hạn chờ xử lý." },
                { id: "kt2", name: "Phát hiện tàng trữ chất cấm/thuốc lá/vape", suggest: "Tịch thu tang vật, mời phụ huynh lên làm việc khẩn cấp. Phạt cảnh cáo toàn trường." }
            ]
        },
        "tangvat": {
            label: "Biên bản Thu giữ tang vật",
            title: "BIÊN BẢN THU GIỮ TANG VẬT",
            violations: [
                { id: "tl", name: "Tàng trữ/Sử dụng Thuốc lá điện tử (Vape)", suggest: "Tịch thu tiêu hủy tang vật. Đình chỉ học 1 tuần, cảnh cáo trước toàn trường và giao cho cơ quan Công an xử lý nếu cần." },
                { id: "vk", name: "Mang vật sắc nhọn/Nguy hiểm", suggest: "Tịch thu tang vật, cách ly học sinh, mời phụ huynh và Công an địa phương lập hồ sơ." }
            ]
        }
    };

    // --- HTML TEMPLATES ---
    const getTabHTML = () => {
        let typeOptions = Object.keys(incidentTypes).map(k => `<option value="${k}">${incidentTypes[k].label}</option>`).join('');

        return `
            <div class="max-w-7xl mx-auto space-y-6 animate-fade-in font-sans h-[calc(100vh-80px)] overflow-y-auto overflow-x-hidden custom-scrollbar pr-2 pb-12">
                <style>
                    .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 8px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; border: 2px solid #f1f5f9; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                </style>
                <!-- Header -->
                <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                            <i data-lucide="shield-alert" style="width:24px; height:24px"></i>
                        </div>
                        <div>
                            <h2 class="text-xl font-black text-slate-800">Trợ Lý Kỷ Luật (Biên Bản GVCN)</h2>
                            <p class="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">Chuẩn Nghị Định 30/2020/NĐ-CP</p>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    <!-- Form Nhập Liệu -->
                    <div class="lg:col-span-4 space-y-4">
                        <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
                            
                            <!-- Cấu hình Tiêu đề -->
                            <details class="bg-slate-50 border border-slate-200 rounded-xl group" open>
                                <summary class="font-bold text-slate-800 flex items-center justify-between p-3 cursor-pointer select-none">
                                    <span class="flex items-center gap-2"><i data-lucide="settings-2" style="width:16px"></i> Cấu hình Tiêu đề</span>
                                    <i data-lucide="chevron-down" class="group-open:rotate-180 transition-transform" style="width:16px"></i>
                                </summary>
                                <div class="p-4 pt-0 space-y-3 border-t border-slate-200 mt-2">
                                    <div class="space-y-1">
                                        <label class="text-[11px] font-bold text-slate-500 uppercase">Cơ quan chủ quản</label>
                                        <input type="text" id="bi-cfg-dept" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-rose-500" placeholder="VD: SỞ GIÁO DỤC VÀ ĐÀO TẠO..." oninput="BehaviorIncident.saveConfig()">
                                    </div>
                                    <div class="space-y-1">
                                        <label class="text-[11px] font-bold text-slate-500 uppercase">Tên Trường</label>
                                        <input type="text" id="bi-cfg-school" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-rose-500" placeholder="VD: TRƯỜNG THPT..." oninput="BehaviorIncident.saveConfig()">
                                    </div>
                                    <div class="space-y-1">
                                        <label class="text-[11px] font-bold text-slate-500 uppercase">Địa phương (Tỉnh/Thành)</label>
                                        <input type="text" id="bi-cfg-loc" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-rose-500" placeholder="VD: Hà Nội" oninput="BehaviorIncident.saveConfig()">
                                    </div>
                                </div>
                            </details>

                            <h3 class="font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                                <i data-lucide="file-text" style="width:18px"></i> Chọn Mẫu Văn Bản
                            </h3>
                            <div class="space-y-1.5">
                                <select id="bi-doc-mode" class="w-full bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm font-black text-blue-800 focus:ring-2 focus:ring-blue-500 transition-all outline-none" onchange="BehaviorIncident.toggleMode()">
                                    <option value="kyluat">1. Biên Bản Xử Lý Kỷ Luật / Vi Phạm</option>
                                    <option value="tichthu">2. Biên Bản Tịch Thu Tang Vật (Có Làm Chứng)</option>
                                    <option value="hopph">3. Biên Bản Họp Phụ Huynh / Sinh Hoạt</option>
                                </select>
                            </div>

                            <h3 class="font-bold text-slate-800 flex items-center gap-2 border-b pb-2 mt-4">
                                <i data-lucide="edit-3" style="width:18px"></i> Nhập Thông Tin
                            </h3>
                            
                            <!-- Dynamic Extra Fields for Tịch Thu -->
                            <div id="bi-fields-tichthu" class="hidden space-y-4 bg-orange-50 p-4 rounded-xl border border-orange-100">
                                <div class="space-y-1.5">
                                    <label class="text-xs font-bold text-orange-800 uppercase">Học Sinh Làm Chứng 1</label>
                                    <input type="text" id="bi-witness-1" class="w-full bg-white border border-orange-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none" placeholder="Tên HS làm chứng 1...">
                                </div>
                                <div class="space-y-1.5">
                                    <label class="text-xs font-bold text-orange-800 uppercase">Học Sinh Làm Chứng 2</label>
                                    <input type="text" id="bi-witness-2" class="w-full bg-white border border-orange-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none" placeholder="Tên HS làm chứng 2...">
                                </div>
                            </div>

                            <!-- Dynamic Extra Fields for Họp PH -->
                            <div id="bi-fields-hopph" class="hidden space-y-4 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                <div class="space-y-1.5">
                                    <label class="text-xs font-bold text-emerald-800 uppercase">Tiêu đề cuộc họp</label>
                                    <input type="text" id="bi-meet-title" class="w-full bg-white border border-emerald-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none" placeholder="Họp Phụ Huynh Đầu Năm..." value="HỌP PHỤ HUYNH HỌC SINH">
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-emerald-800 uppercase">Tổng Sĩ Số Lớp</label>
                                        <input type="number" id="bi-meet-total" class="w-full bg-white border border-emerald-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none" placeholder="45">
                                    </div>
                                    <div class="space-y-1.5">
                                        <label class="text-xs font-bold text-emerald-800 uppercase">Số PH Có Mặt</label>
                                        <input type="number" id="bi-meet-present" class="w-full bg-white border border-emerald-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none" placeholder="40">
                                    </div>
                                </div>
                                <div class="space-y-1.5">
                                    <label class="text-xs font-bold text-emerald-800 uppercase">Nội dung / Các khoản thu dự kiến</label>
                                    <textarea id="bi-meet-content" rows="4" class="w-full bg-white border border-emerald-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none resize-none" placeholder="- Thu BHYT: ...
- Quỹ lớp: ...
- Ý kiến PH: ..."></textarea>
                                </div>
                            </div>

                            <div id="bi-fields-kyluat" class="space-y-4">
                            <div class="space-y-1.5">
                                <label class="text-xs font-bold text-slate-500 uppercase">Loại Biên Bản</label>
                                <select id="bi-type" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 transition-all outline-none" onchange="BehaviorIncident.updateViolationOptions()">
                                    ${typeOptions}
                                </select>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-1.5">
                                    <label class="text-xs font-bold text-slate-500 uppercase">Chọn Lớp</label>
                                    <select id="bi-select-class" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-1 focus:ring-rose-500" onchange="BehaviorIncident.loadStudentsByClass()">
                                        <option value="">- Gõ tay hoặc Chọn Lớp -</option>
                                    </select>
                                </div>
                                <div class="space-y-1.5 flex items-end gap-2">
                                    <div class="flex-grow space-y-1.5">
                                        <label class="text-xs font-bold text-slate-500 uppercase">Chọn Học Sinh</label>
                                        <select id="bi-select-student" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-1 focus:ring-rose-500" onchange="BehaviorIncident.onStudentSelect()">
                                            <option value="">- Chọn HS -</option>
                                        </select>
                                    </div>
                                    <button onclick="BehaviorIncident.startQRScanner()" class="bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl w-[42px] h-[38px] flex items-center justify-center transition-colors shadow-sm shrink-0" title="Quét thẻ học sinh">
                                        <i data-lucide="scan-line" style="width:20px; height:20px"></i>
                                    </button>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4" id="bi-manual-inputs">
                                <div class="space-y-1.5">
                                    <label class="text-xs font-bold text-slate-500 uppercase">Tên Học Sinh</label>
                                    <input type="text" id="bi-student-name" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none" placeholder="Nguyễn Văn A">
                                </div>
                                <div class="space-y-1.5">
                                    <label class="text-xs font-bold text-slate-500 uppercase">Lớp (Nhập thủ công)</label>
                                    <input type="text" id="bi-student-class" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none" placeholder="12A1">
                                </div>
                            </div>
                            
                            <div class="space-y-1.5">
                                <label class="text-xs font-bold text-slate-500 uppercase">Giáo Viên Lập B.Bản</label>
                                <input type="text" id="bi-teacher-name" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none" placeholder="Nguyễn Văn B">
                            </div>

                            <div class="space-y-1.5">
                                <label class="text-xs font-bold text-slate-500 uppercase">Hành vi Vi phạm</label>
                                <select id="bi-violation" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 transition-all outline-none" onchange="BehaviorIncident.applySuggestion()">
                                </select>
                            </div>

                            <div class="space-y-1.5">
                                <label class="text-xs font-bold text-slate-500 uppercase">Chi tiết & Tang vật (nếu có)</label>
                                <textarea id="bi-details" rows="2" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none resize-none" placeholder="Mô tả cụ thể sự việc..."></textarea>
                            </div>

                            <div class="space-y-1.5">
                                <label class="text-xs font-bold text-rose-600 flex items-center gap-1 uppercase"><i data-lucide="lightbulb" style="width:14px"></i> Biện pháp xử lý (Có thể sửa)</label>
                                <textarea id="bi-action" rows="3" class="w-full bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-900 outline-none resize-none focus:ring-2 focus:ring-rose-400 transition-all" placeholder="Biện pháp xử lý..."></textarea>
                            </div>

                            </div>

                            <button onclick="BehaviorIncident.generatePreview()" class="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-3 rounded-xl transition-all shadow-md shadow-rose-200 flex justify-center items-center gap-2">
                                <i data-lucide="file-check" style="width:18px"></i> Sinh Biên Bản & Lưu Lịch Sử
                            </button>
                        </div>
                        
                        <!-- Báo Cáo Zalo -->
                        <div class="bg-white p-6 rounded-3xl shadow-sm border border-blue-200 space-y-4">
                            <h3 class="font-bold text-blue-800 flex items-center gap-2 border-b border-blue-100 pb-2">
                                <i data-lucide="message-circle" style="width:18px"></i> Báo Cáo Vi Phạm (Zalo)
                            </h3>
                            <div class="space-y-1.5">
                                <label class="text-xs font-bold text-slate-500 uppercase">Thống kê theo lớp</label>
                                <select id="bi-zalo-class" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-1 focus:ring-blue-500" onchange="BehaviorIncident.renderZaloReport()">
                                    <option value="">- Chọn Lớp -</option>
                                </select>
                            </div>
                            <div id="bi-zalo-results" class="space-y-3 mt-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                                <div class="text-xs text-slate-400 text-center italic">Chọn lớp để xem báo cáo Zalo</div>
                            </div>
                            <button onclick="BehaviorIncident.clearHistory()" class="w-full text-xs text-slate-400 hover:text-red-500 font-semibold py-2">Xóa toàn bộ Lịch sử vi phạm</button>
                        </div>
                    </div>

                    <!-- Màn hình Preview A4 -->
                    <div class="lg:col-span-8">
                        <div class="bg-slate-200 py-8 px-4 md:px-8 rounded-3xl border border-slate-300 shadow-inner flex flex-col items-center relative">
                            
                            <!-- Toolbar -->
                            <div class="absolute top-4 right-8 flex gap-2">
                                <button onclick="BehaviorIncident.printA4()" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 text-sm shadow-lg transition-all hidden" id="bi-btn-print">
                                    <i data-lucide="printer" style="width:16px"></i> In ngay
                                </button>
                                <button onclick="BehaviorIncident.exportPDF()" class="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 text-sm shadow-lg transition-all hidden" id="bi-btn-export">
                                    <i data-lucide="download" style="width:16px"></i> Tải PDF
                                </button>
                            </div>

                            <!-- Giấy A4 Họp Phụ Huynh (Hidden by default) -->
                            <div id="bi-a4-hopph" class="bg-white shadow-2xl origin-top shrink-0 hidden" style="width: 210mm; min-width: 210mm; min-height: 297mm; padding: 15mm 15mm 15mm 25mm; font-family: 'Times New Roman', Times, serif; font-size: 14pt; line-height: 1.5; color: black; flex-direction: column;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                                    <div style="text-align: center; width: 40%;">
                                        <div style="font-weight: normal; text-transform: uppercase; font-size: 13pt;" class="doc-dept">SỞ GIÁO DỤC VÀ ĐÀO TẠO</div>
                                        <div style="font-weight: bold; text-transform: uppercase; font-size: 13pt;" class="doc-school">TRƯỜNG THPT</div>
                                        <hr style="width: 40%; border-top: 1px solid black; margin: 5px auto;">
                                    </div>
                                    <div style="text-align: center; width: 60%;">
                                        <div style="font-weight: bold; text-transform: uppercase; font-size: 13pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                                        <div style="font-weight: bold; font-size: 14pt;">Độc lập - Tự do - Hạnh phúc</div>
                                        <hr style="width: 50%; border-top: 1px solid black; margin: 5px auto;">
                                    </div>
                                </div>
                                <div style="text-align: right; font-style: italic; margin-bottom: 15px; font-size: 14pt;" class="doc-date">..., ngày ... tháng ... năm 20...</div>
                                <div style="text-align: center; margin-bottom: 20px;">
                                    <div style="font-weight: bold; text-transform: uppercase; font-size: 16pt;" id="bi-hp-title">BIÊN BẢN HỌP PHỤ HUYNH HỌC SINH</div>
                                </div>
                                <div style="text-align: justify; flex-grow: 1;">
                                    <p style="text-indent: 10mm; margin-bottom: 10px;">Hôm nay, vào lúc <b class="doc-time">...</b>, tại phòng học <b class="doc-room">...</b>.</p>
                                    <p style="text-indent: 10mm; margin-bottom: 10px;"><b>I. Thành phần tham dự:</b></p>
                                    <p style="margin-left: 10mm; margin-bottom: 5px;">- GVCN Lớp: <b class="doc-teacher-text">..................................</b></p>
                                    <p style="margin-left: 10mm; margin-bottom: 5px;">- Sĩ số lớp: <b id="bi-hp-total">...</b> học sinh. Số phụ huynh có mặt: <b id="bi-hp-present">...</b> (Vắng: <b id="bi-hp-absent">...</b>).</p>
                                    <p style="text-indent: 10mm; margin-top: 15px; margin-bottom: 10px;"><b>II. Nội dung cuộc họp:</b></p>
                                    <div style="padding-left: 10mm; margin-bottom: 15px; white-space: pre-wrap;" id="bi-hp-content">..................................</div>
                                    <p style="text-indent: 10mm; margin-bottom: 20px;">Biên bản kết thúc vào lúc cùng ngày. Tập thể phụ huynh đồng ý với các nội dung và khoản thu nêu trên.</p>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-top: 20px; page-break-inside: avoid;">
                                    <div style="text-align: center; width: 40%;">
                                        <div style="font-weight: bold;">ĐẠI DIỆN HỘI PHỤ HUYNH</div>
                                        <div style="font-style: italic; font-size: 12pt;">(Ký và ghi rõ họ tên)</div>
                                        <div style="height: 100px;"></div>
                                    </div>
                                    <div style="text-align: center; width: 40%;">
                                        <div style="font-weight: bold;">GIÁO VIÊN CHỦ NHIỆM</div>
                                        <div style="font-style: italic; font-size: 12pt;">(Ký và ghi rõ họ tên)</div>
                                        <div style="height: 100px;"></div>
                                        <div style="font-weight: bold;" class="doc-teacher-text"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Giấy A4 Tịch Thu (Hidden by default) -->
                            <div id="bi-a4-tichthu" class="bg-white shadow-2xl origin-top shrink-0 hidden" style="width: 210mm; min-width: 210mm; min-height: 297mm; padding: 15mm 15mm 15mm 25mm; font-family: 'Times New Roman', Times, serif; font-size: 14pt; line-height: 1.5; color: black; flex-direction: column;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                                    <div style="text-align: center; width: 40%;">
                                        <div style="font-weight: normal; text-transform: uppercase; font-size: 13pt;" class="doc-dept">SỞ GIÁO DỤC VÀ ĐÀO TẠO</div>
                                        <div style="font-weight: bold; text-transform: uppercase; font-size: 13pt;" class="doc-school">TRƯỜNG THPT</div>
                                        <hr style="width: 40%; border-top: 1px solid black; margin: 5px auto;">
                                    </div>
                                    <div style="text-align: center; width: 60%;">
                                        <div style="font-weight: bold; text-transform: uppercase; font-size: 13pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                                        <div style="font-weight: bold; font-size: 14pt;">Độc lập - Tự do - Hạnh phúc</div>
                                        <hr style="width: 50%; border-top: 1px solid black; margin: 5px auto;">
                                    </div>
                                </div>
                                <div style="text-align: right; font-style: italic; margin-bottom: 15px; font-size: 14pt;" class="doc-date">..., ngày ... tháng ... năm 20...</div>
                                <div style="text-align: center; margin-bottom: 20px;">
                                    <div style="font-weight: bold; text-transform: uppercase; font-size: 16pt;">BIÊN BẢN TẠM GIỮ TANG VẬT / ĐIỆN THOẠI</div>
                                </div>
                                <div style="text-align: justify; flex-grow: 1;">
                                    <p style="text-indent: 10mm; margin-bottom: 10px;">Hôm nay, vào lúc <b class="doc-time">...</b>, tại <b class="doc-room">...</b>.</p>
                                    <p style="text-indent: 10mm; margin-bottom: 10px;"><b>Chúng tôi gồm có:</b></p>
                                    <p style="margin-left: 10mm; margin-bottom: 5px;">1. Ông/Bà: <b class="doc-teacher-text">..................................</b> - Chức vụ: Giáo viên.</p>
                                    <p style="margin-left: 10mm; margin-bottom: 5px;">2. Học sinh: <b id="bi-tt-w1">..................................</b> - Lớp: <b class="doc-room">...</b> (Người làm chứng 1)</p>
                                    <p style="margin-left: 10mm; margin-bottom: 5px;">3. Học sinh: <b id="bi-tt-w2">..................................</b> - Lớp: <b class="doc-room">...</b> (Người làm chứng 2)</p>
                                    
                                    <p style="text-indent: 10mm; margin-top: 15px; margin-bottom: 10px;"><b>Tiến hành lập biên bản đối với học sinh:</b></p>
                                    <p style="margin-left: 10mm; margin-bottom: 5px;">Họ và tên: <b class="doc-student-text">..................................</b> - Lớp: <b class="doc-room">...</b></p>
                                    
                                    <p style="text-indent: 10mm; margin-top: 15px; margin-bottom: 10px;"><b>Nội dung sự việc và tang vật thu giữ:</b></p>
                                    <p style="text-indent: 10mm; margin-bottom: 15px;" class="doc-violation-text">..................................</p>
                                    <p style="text-indent: 10mm; margin-bottom: 10px;">Nhà trường sẽ tạm giữ tang vật trên và chỉ bàn giao lại cho Phụ huynh học sinh khi đến làm việc.</p>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-top: 20px; page-break-inside: avoid;">
                                    <div style="text-align: center; width: 33%;">
                                        <div style="font-weight: bold;">HS VI PHẠM</div>
                                        <div style="height: 70px;"></div><b class="doc-student-text"></b>
                                    </div>
                                    <div style="text-align: center; width: 33%;">
                                        <div style="font-weight: bold;">NGƯỜI LÀM CHỨNG</div>
                                        <div style="height: 70px;"></div><b id="bi-tt-ws"></b>
                                    </div>
                                    <div style="text-align: center; width: 33%;">
                                        <div style="font-weight: bold;">GIÁO VIÊN</div>
                                        <div style="height: 70px;"></div><b class="doc-teacher-text"></b>
                                    </div>
                                </div>
                            </div>

                            <!-- Giấy A4 Kỷ luật (Bản gốc) -->
                            <div id="bi-a4-paper" class="bg-white shadow-2xl origin-top shrink-0" style="width: 210mm; min-width: 210mm; min-height: 297mm; padding: 15mm 15mm 15mm 25mm; font-family: 'Times New Roman', Times, serif; font-size: 14pt; line-height: 1.5; color: black; display:none; flex-direction: column;">
                                
                                <!-- Header: Quốc hiệu, Tiêu ngữ -->
                                <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                                    <div style="text-align: center; width: 40%;">
                                        <div style="font-weight: normal; text-transform: uppercase; font-size: 13pt;" id="bi-doc-department">SỞ GIÁO DỤC VÀ ĐÀO TẠO</div>
                                        <div style="font-weight: bold; text-transform: uppercase; font-size: 13pt;" id="bi-doc-school">TRƯỜNG THPT</div>
                                        <hr style="width: 40%; border-top: 1px solid black; margin: 5px auto;">
                                    </div>
                                    <div style="text-align: center; width: 60%;">
                                        <div style="font-weight: bold; text-transform: uppercase; font-size: 13pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                                        <div style="font-weight: bold; font-size: 14pt;">Độc lập - Tự do - Hạnh phúc</div>
                                        <hr style="width: 50%; border-top: 1px solid black; margin: 5px auto;">
                                    </div>
                                </div>

                                <!-- Ngày tháng -->
                                <div style="text-align: right; font-style: italic; margin-bottom: 15px; font-size: 14pt;" id="bi-doc-date">
                                    ..., ngày ... tháng ... năm 20...
                                </div>

                                <!-- Tên Biên bản -->
                                <div style="text-align: center; margin-bottom: 20px;">
                                    <div style="font-weight: bold; text-transform: uppercase; font-size: 16pt;" id="bi-doc-title">BIÊN BẢN VI PHẠM NỘI QUY</div>
                                    <div style="font-weight: normal; font-size: 14pt;" id="bi-doc-subtitle">V/v: Học sinh vi phạm nề nếp kỷ luật</div>
                                </div>

                                <!-- Nội dung -->
                                <div style="text-align: justify; flex-grow: 1;">
                                    <p style="text-indent: 10mm; margin-bottom: 10px;">
                                        Hôm nay, vào lúc <b id="bi-doc-time">...</b>, tại phòng học <b id="bi-doc-room">...</b>.
                                    </p>
                                    <p style="text-indent: 10mm; margin-bottom: 10px;">
                                        <b>Chúng tôi gồm có:</b>
                                    </p>
                                    <p style="margin-left: 10mm; margin-bottom: 5px;">1. Ông/Bà: <b id="bi-doc-teacher-text">..................................</b> - Chức vụ: Giáo viên / Người lập biên bản.</p>
                                    
                                    <p style="text-indent: 10mm; margin-top: 15px; margin-bottom: 10px;">
                                        <b>Tiến hành lập biên bản đối với học sinh:</b>
                                    </p>
                                    <p style="margin-left: 10mm; margin-bottom: 5px;">Họ và tên: <b id="bi-doc-student-text">..................................</b></p>
                                    <p style="margin-left: 10mm; margin-bottom: 5px;">Lớp: <b id="bi-doc-class-text">..................................</b></p>
                                    
                                    <p style="text-indent: 10mm; margin-top: 15px; margin-bottom: 10px;">
                                        <b>Nội dung sự việc / Hành vi vi phạm:</b>
                                    </p>
                                    <p style="text-indent: 10mm; margin-bottom: 15px;" id="bi-doc-violation-text">..................................</p>
                                    
                                    <p style="text-indent: 10mm; margin-bottom: 10px;">
                                        <b>Biện pháp xử lý / Kiến nghị:</b>
                                    </p>
                                    <p style="text-indent: 10mm; margin-bottom: 15px;" id="bi-doc-action-text">..................................</p>

                                    <p style="text-indent: 10mm; margin-bottom: 10px;">
                                        Học sinh đã nhận thức được lỗi của mình và cam kết không tái phạm. Nếu tái phạm sẽ chịu mọi hình thức kỷ luật cao nhất của nhà trường.
                                    </p>
                                    <p style="text-indent: 10mm; margin-bottom: 20px;">
                                        Biên bản kết thúc vào lúc cùng ngày. Các bên đã đọc lại, đồng ý với nội dung và ký tên dưới đây.
                                    </p>
                                </div>

                                <!-- Chữ ký -->
                                <div style="display: flex; justify-content: space-between; margin-top: 20px; page-break-inside: avoid;">
                                    <div style="text-align: center; width: 40%;">
                                        <div style="font-weight: bold;">HỌC SINH VI PHẠM</div>
                                        <div style="font-style: italic; font-size: 12pt;">(Ký và ghi rõ họ tên)</div>
                                        <div class="mt-2 relative group cursor-crosshair print:border-none print:bg-transparent" style="width: 250px; height: 120px; margin: 10px auto;">
                                            <canvas id="bi-pad-student" class="w-full h-full absolute inset-0"></canvas>
                                            <div class="absolute inset-0 flex items-center justify-center text-slate-200 pointer-events-none group-hover:opacity-0 transition-opacity font-sans text-[11px] uppercase tracking-widest print:hidden">Ký vào đây</div>
                                            
                                        </div>
                                        <div style="font-weight: bold; margin-top: 5px;" id="bi-doc-sign-student"></div>
                                    </div>
                                    <div style="text-align: center; width: 40%;">
                                        <div style="font-weight: bold;">GIÁO VIÊN LẬP BIÊN BẢN</div>
                                        <div style="font-style: italic; font-size: 12pt;">(Ký và ghi rõ họ tên)</div>
                                        <div class="mt-2 relative group cursor-crosshair print:border-none print:bg-transparent" style="width: 250px; height: 120px; margin: 10px auto;">
                                            <canvas id="bi-pad-teacher" class="w-full h-full absolute inset-0"></canvas>
                                            <div class="absolute inset-0 flex items-center justify-center text-slate-200 pointer-events-none group-hover:opacity-0 transition-opacity font-sans text-[11px] uppercase tracking-widest print:hidden">Ký vào đây</div>
                                            
                                        </div>
                                        <div style="font-weight: bold; margin-top: 5px;" id="bi-doc-sign-teacher"></div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
                <!-- QR Scanner Modal -->
                <div id="bi-qr-modal" class="fixed inset-0 z-[100] bg-black/60 hidden flex items-center justify-center p-4">
                    <div class="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative animate-fade-in">
                        <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 class="font-bold text-slate-800 flex items-center gap-2"><i data-lucide="scan-line" style="width:18px"></i> Quét Thẻ Học Sinh</h3>
                            <button onclick="BehaviorIncident.stopQRScanner()" class="text-slate-400 hover:text-red-500"><i data-lucide="x" style="width:20px"></i></button>
                        </div>
                        <div class="p-4 bg-black flex justify-center items-center">
                            <div id="bi-qr-reader" class="w-full max-w-[300px] overflow-hidden rounded-xl"></div>
                        </div>
                        <div class="p-4 text-center text-sm text-slate-500 font-medium">
                            Đưa mã vạch hoặc mã QR chứa tên học sinh vào khung hình.
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    // --- LOGIC ---
    let html5QrcodeScanner = null;

    const startQRScanner = () => {
        const modal = document.getElementById('bi-qr-modal');
        if (!modal) return;
        modal.classList.remove('hidden');

        if (typeof Html5Qrcode === 'undefined') {
            showAlert('Lỗi tải thư viện máy quét. Vui lòng kiểm tra mạng!', 'danger');
            modal.classList.add('hidden');
            return;
        }

        if (html5QrcodeScanner) {
            html5QrcodeScanner.clear();
        }

        html5QrcodeScanner = new Html5Qrcode("bi-qr-reader");
        const config = { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0 };

        html5QrcodeScanner.start({ facingMode: "environment" }, config, (decodedText) => {
            // On Success
            html5QrcodeScanner.stop().then(() => {
                modal.classList.add('hidden');
                handleScannedCode(decodedText);
            });
        }, undefined).catch(err => {
            showAlert('Không thể truy cập Camera. Vui lòng cấp quyền!', 'danger');
            modal.classList.add('hidden');
        });
    };

    const stopQRScanner = () => {
        const modal = document.getElementById('bi-qr-modal');
        if (html5QrcodeScanner && html5QrcodeScanner.isScanning) {
            html5QrcodeScanner.stop().then(() => {
                modal.classList.add('hidden');
            }).catch(err => {
                console.error(err);
                modal.classList.add('hidden');
            });
        } else {
            modal.classList.add('hidden');
        }
    };

    const handleScannedCode = (code) => {
        if (!activeFileName || !dataStore[activeFileName] || !dataStore[activeFileName].mapping) {
            showAlert('Vui lòng chọn danh sách lớp trước khi quét thẻ.', 'warning');
            return;
        }
        const mapping = dataStore[activeFileName].mapping;
        const nameCol = mapping['hoten'];
        const clsCol = mapping['lop'];

        const rawCode = code.toString().trim().toLowerCase();
        
        // Remove vietnamese accents for better matching if needed, but here we expect exact or very close string
        const found = excelData.find(r => {
            const stuName = (r[nameCol] || "").toString().toLowerCase().trim();
            // Try exact match or if QR contains name
            return stuName === rawCode || rawCode.includes(stuName);
        });

        if (found) {
            const stuName = found[nameCol];
            const stuClass = found[clsCol];
            
            const clsSelect = document.getElementById('bi-select-class');
            const stuSelect = document.getElementById('bi-select-student');

            // Select Class
            if(clsSelect.querySelector(`option[value="${stuClass}"]`)) {
                clsSelect.value = stuClass;
                loadStudentsByClass();
                
                // Select Student
                setTimeout(() => {
                    if(stuSelect.querySelector(`option[value="${stuName}"]`)) {
                        stuSelect.value = stuName;
                        onStudentSelect(); 
                        showAlert(`Đã nhận diện: ${stuName} - ${stuClass}`, 'success');
                    }
                }, 100);
            }
        } else {
            showAlert(`Không tìm thấy học sinh: ${code}`, 'warning');
        }
    };

    // --- ZALO & HISTORY LOGIC ---
    const getHistory = () => {
        try {
            return JSON.parse(localStorage.getItem('BehaviorIncidentsDB')) || [];
        } catch(e) { return []; }
    };

    const saveIncidentToHistory = (name, cls, detail, dateObj) => {
        const history = getHistory();
        history.push({
            id: Date.now(),
            name: name,
            cls: cls,
            detail: detail,
            timestamp: dateObj.getTime()
        });
        localStorage.setItem('BehaviorIncidentsDB', JSON.stringify(history));
        updateZaloClassDropdown();
    };

    const clearHistory = () => {
        if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử vi phạm? Dữ liệu này không thể khôi phục.")) {
            localStorage.removeItem('BehaviorIncidentsDB');
            renderZaloReport();
            updateZaloClassDropdown();
        }
    };

    const updateZaloClassDropdown = () => {
        const history = getHistory();
        const classes = [...new Set(history.map(h => h.cls))].sort();
        const sel = document.getElementById('bi-zalo-class');
        if (!sel) return;
        const currentVal = sel.value;
        let html = '<option value="">- Chọn Lớp -</option>';
        classes.forEach(c => { html += `<option value="${c}">Lớp ${c}</option>`; });
        sel.innerHTML = html;
        if(classes.includes(currentVal)) sel.value = currentVal;
    };

    const renderZaloReport = () => {
        const cls = document.getElementById('bi-zalo-class').value;
        const container = document.getElementById('bi-zalo-results');
        if (!cls) {
            container.innerHTML = '<div class="text-xs text-slate-400 text-center italic">Chọn lớp để xem báo cáo Zalo</div>';
            return;
        }

        const history = getHistory();
        const classData = history.filter(h => h.cls === cls);
        
        // Group by student
        const students = {};
        classData.forEach(h => {
            if(!students[h.name]) students[h.name] = [];
            students[h.name].push(h);
        });

        if (Object.keys(students).length === 0) {
            container.innerHTML = '<div class="text-xs text-slate-400 text-center italic">Chưa có vi phạm nào trong lớp này</div>';
            return;
        }

        let html = '';
        Object.keys(students).sort().forEach(name => {
            const faults = students[name];
            const faultCount = faults.length;
            
            // Generate Zalo Text
            const month = new Date().getMonth() + 1;
            let zaloText = `Kính gửi Phụ huynh em ${name} (Lớp ${cls}),\nTrong thời gian qua, em đã vi phạm kỷ luật ${faultCount} lần. Cụ thể:\n`;
            faults.forEach((f, idx) => {
                const dateStr = new Date(f.timestamp).toLocaleDateString('vi-VN');
                zaloText += `${idx + 1}. [${dateStr}] ${f.detail.replace(/<[^>]*>?/gm, '')}\n`;
            });
            zaloText += `Kính mong gia đình phối hợp nhắc nhở em nghiêm chỉnh chấp hành nội quy nhà trường.\nTrân trọng!`;

            html += `
                <div class="bg-blue-50 border border-blue-100 rounded-xl p-3 flex flex-col gap-2">
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="font-bold text-slate-800 text-sm">${name}</div>
                            <div class="text-xs text-rose-600 font-semibold">${faultCount} lỗi vi phạm</div>
                        </div>
                        <button onclick="BehaviorIncident.copyZalo('${encodeURIComponent(zaloText)}')" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm">
                            <i data-lucide="copy" style="width:14px"></i> Copy Zalo
                        </button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const copyZalo = (encodedText) => {
        const text = decodeURIComponent(encodedText);
        navigator.clipboard.writeText(text).then(() => {
            showAlert('Đã copy mẫu tin nhắn Zalo thành công!', 'success');
        }).catch(err => {
            showAlert('Lỗi khi copy vào bộ nhớ đệm', 'danger');
        });
    };

    let currentMode = 'kyluat';
    
    const toggleMode = () => {
        const mode = document.getElementById('bi-doc-mode').value;
        currentMode = mode;
        
        document.getElementById('bi-fields-tichthu').classList.add('hidden');
        document.getElementById('bi-fields-hopph').classList.add('hidden');
        if (document.getElementById('bi-fields-kyluat')) {
            document.getElementById('bi-fields-kyluat').classList.remove('hidden');
        }
        
        if (mode === 'tichthu') {
            document.getElementById('bi-fields-tichthu').classList.remove('hidden');
        } else if (mode === 'hopph') {
            document.getElementById('bi-fields-hopph').classList.remove('hidden');
            if (document.getElementById('bi-fields-kyluat')) {
                document.getElementById('bi-fields-kyluat').classList.add('hidden');
            }
        }
    };

    const saveConfig = () => {
        localStorage.setItem('App_OwnerDepartment', document.getElementById('bi-cfg-dept').value.trim());
        localStorage.setItem('App_OwnerSchool', document.getElementById('bi-cfg-school').value.trim());
        localStorage.setItem('App_Location', document.getElementById('bi-cfg-loc').value.trim());
        generatePreview();
    };

    const loadConfig = () => {
        document.getElementById('bi-cfg-dept').value = localStorage.getItem('App_OwnerDepartment') || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO...';
        document.getElementById('bi-cfg-school').value = localStorage.getItem('App_OwnerSchool') || 'TRƯỜNG THPT...';
        document.getElementById('bi-cfg-loc').value = localStorage.getItem('App_Location') || 'Hà Nội';
    };

    const updateViolationOptions = () => {
        const type = document.getElementById('bi-type').value;
        const viSelect = document.getElementById('bi-violation');
        if (!viSelect) return;

        const list = incidentTypes[type].violations;
        viSelect.innerHTML = list.map((v, idx) => `<option value="${idx}">${v.name}</option>`).join('');
        applySuggestion();
    };

    const applySuggestion = () => {
        const type = document.getElementById('bi-type').value;
        const viSelect = document.getElementById('bi-violation');
        const actionArea = document.getElementById('bi-action');
        if (!viSelect || !actionArea) return;

        const idx = viSelect.value;
        const v = incidentTypes[type].violations[idx];
        if (v) {
            actionArea.value = v.suggest;
        }
    };

    const loadClasses = () => {
        const clsSelect = document.getElementById('bi-select-class');
        if (!clsSelect || typeof excelData === 'undefined' || !excelData || excelData.length === 0) return;
        
        
        if (!activeFileName || !dataStore[activeFileName] || !dataStore[activeFileName].mapping) return;
        const mapping = dataStore[activeFileName].mapping;
        const classes = [...new Set(excelData.map(r => r[mapping['lop']]).filter(Boolean))].sort();
        
        let html = '<option value="">- Gõ tay hoặc Chọn Lớp -</option>';
        classes.forEach(c => { html += `<option value="${c}">Lớp ${c}</option>`; });
        clsSelect.innerHTML = html;
    };

    const loadStudentsByClass = () => {
        const cls = document.getElementById('bi-select-class').value;
        const stuSelect = document.getElementById('bi-select-student');
        
        if (!cls || typeof excelData === 'undefined') {
            stuSelect.innerHTML = '<option value="">- Chọn HS -</option>';
            return;
        }

        
        if (!activeFileName || !dataStore[activeFileName] || !dataStore[activeFileName].mapping) return;
        const mapping = dataStore[activeFileName].mapping;
        const students = excelData.filter(r => r[mapping['lop']] === cls).map(r => r[mapping['hoten']]).filter(Boolean).sort();
        let html = '<option value="">- Chọn HS -</option>';
        students.forEach(s => { html += `<option value="${s}">${s}</option>`; });
        stuSelect.innerHTML = html;
        
        // Auto-fill manual class field if selected
        document.getElementById('bi-student-class').value = cls;
    };

    const onStudentSelect = () => {
        const name = document.getElementById('bi-select-student').value;
        if (name) {
            document.getElementById('bi-student-name').value = name;
        }
    };

    const searchStudent = (query) => {
        const resultBox = document.getElementById('bi-search-results');
        if (!query || query.length < 2) {
            resultBox.classList.add('hidden');
            return;
        }
        
        // Cần có excelData từ app.js
        if (typeof excelData === 'undefined' || !excelData || excelData.length === 0) {
            resultBox.classList.add('hidden');
            return; // Allow manual typing quietly
        }

        const q = query.toLowerCase();
        let matches = excelData.filter(r => {
            const name = (r[detectedMapping.name] || '').toString().toLowerCase();
            const sbd = (r[detectedMapping.sbd] || '').toString().toLowerCase();
            return name.includes(q) || sbd.includes(q);
        }).slice(0, 10); // Lấy max 10 kết quả

        if (matches.length > 0) {
            resultBox.innerHTML = matches.map(m => {
                const name = m[detectedMapping.name] || '';
                const cls = m[detectedMapping.lop] || '';
                return `
                    <div class="px-4 py-2.5 hover:bg-rose-50 cursor-pointer border-b last:border-b-0 border-slate-100 transition-colors"
                         onclick="BehaviorIncident.selectStudent('${name.replace(/'/g, "\\'")}', '${cls.replace(/'/g, "\\'")}')">
                        <div class="font-bold text-slate-800 text-sm">${name}</div>
                        <div class="text-xs text-slate-500 mt-0.5">Lớp: <span class="font-bold text-rose-600">${cls}</span></div>
                    </div>
                `;
            }).join('');
            resultBox.classList.remove('hidden');
        } else {
            resultBox.innerHTML = `<div class="p-3 text-sm text-slate-500">Không tìm thấy học sinh...</div>`;
            resultBox.classList.remove('hidden');
        }
    };

    const selectStudent = (name, cls) => {
        document.getElementById('bi-student-name').value = name;
        document.getElementById('bi-student-class').value = cls;
        document.getElementById('bi-search-results').classList.add('hidden');
    };

    const generatePreview = () => {
        const type = document.getElementById('bi-type').value;
        const viSelect = document.getElementById('bi-violation');
        
        const typeObj = incidentTypes[type];
        const violationText = viSelect.options[viSelect.selectedIndex].text;
        
        const studentName = document.getElementById('bi-student-name').value.trim() || '...........................................';
        const studentClass = document.getElementById('bi-student-class').value.trim() || '...........................................';
        const teacherName = document.getElementById('bi-teacher-name').value.trim() || '...........................................';
        const details = document.getElementById('bi-details').value.trim();
        const actionText = document.getElementById('bi-action').value.trim() || '...........................................';

        // Lấy thông tin trường học từ LocalStorage (nếu có)
        const deptName = document.getElementById('bi-cfg-dept').value.trim() || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO...';
        const unitName = document.getElementById('bi-cfg-school').value.trim() || 'TRƯỜNG THPT...';

        document.getElementById('bi-doc-school').innerText = unitName;
        document.getElementById('bi-doc-department').innerText = deptName;

        // Date & Time
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();
        const h = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');

        let loc = document.getElementById('bi-cfg-loc').value.trim() || 'Hà Nội';
        document.getElementById('bi-doc-date').innerText = `${loc}, ngày ${d} tháng ${m} năm ${y}`;
        document.getElementById('bi-doc-time').innerText = `${h} giờ ${min} phút`;
        document.getElementById('bi-doc-room').innerText = studentClass !== '...........................................' ? `Lớp ${studentClass}` : '...';

        // Titles
        document.getElementById('bi-doc-title').innerText = typeObj.title;
        let sub = '';
        if(type === 'nenep') sub = 'V/v: Học sinh vi phạm nề nếp kỷ luật';
        if(type === 'hoctap') sub = 'V/v: Học sinh vi phạm quy chế học tập, kiểm tra';
        if(type === 'tangvat') sub = 'V/v: Phát hiện và thu giữ vật phẩm trái quy định';
        document.getElementById('bi-doc-subtitle').innerText = sub;

        // Content
        document.getElementById('bi-doc-teacher-text').innerText = teacherName;
        document.getElementById('bi-doc-student-text').innerText = studentName;
        document.getElementById('bi-doc-class-text').innerText = studentClass;

        let fullViolation = `Học sinh có hành vi: <b>${violationText}</b>.`;
        if (details) fullViolation += ` Chi tiết sự việc: ${details}`;
        document.getElementById('bi-doc-violation-text').innerHTML = fullViolation;
        document.getElementById('bi-doc-action-text').innerText = actionText;

        // Signatures Names
        document.getElementById('bi-doc-sign-student').innerText = studentName === '...........................................' ? '' : studentName;
        document.getElementById('bi-doc-sign-teacher').innerText = teacherName === '...........................................' ? '' : teacherName;

        // Lưu vào LocalStorage
        if (studentName !== '...........................................' && studentClass !== '...........................................') {
            saveIncidentToHistory(studentName, studentClass, fullViolation, now);
        }

        // Handle Multi-Mode Data Injection
        if (currentMode === 'kyluat') {
            document.getElementById('bi-a4-paper').style.display = 'flex';
            document.getElementById('bi-a4-tichthu').style.display = 'none';
            document.getElementById('bi-a4-hopph').style.display = 'none';
        } else if (currentMode === 'tichthu') {
            document.getElementById('bi-a4-paper').style.display = 'none';
            document.getElementById('bi-a4-tichthu').style.display = 'flex';
            document.getElementById('bi-a4-hopph').style.display = 'none';
            
            document.getElementById('bi-tt-w1').innerText = document.getElementById('bi-witness-1').value || '................................';
            document.getElementById('bi-tt-w2').innerText = document.getElementById('bi-witness-2').value || '................................';
            document.getElementById('bi-tt-ws').innerText = document.getElementById('bi-witness-1').value; // Just sign 1 name for space
        } else if (currentMode === 'hopph') {
            document.getElementById('bi-a4-paper').style.display = 'none';
            document.getElementById('bi-a4-tichthu').style.display = 'none';
            document.getElementById('bi-a4-hopph').style.display = 'flex';
            
            document.getElementById('bi-hp-title').innerText = document.getElementById('bi-meet-title').value.toUpperCase() || 'BIÊN BẢN HỌP PHỤ HUYNH';
            const total = parseInt(document.getElementById('bi-meet-total').value) || 0;
            const present = parseInt(document.getElementById('bi-meet-present').value) || 0;
            document.getElementById('bi-hp-total').innerText = total;
            document.getElementById('bi-hp-present').innerText = present;
            document.getElementById('bi-hp-absent').innerText = total - present;
            document.getElementById('bi-hp-content').innerText = document.getElementById('bi-meet-content').value || '................................';
        }

        // Broad injection by classes for shared fields across all templates
        document.querySelectorAll('.doc-dept').forEach(el => el.innerText = deptName);
        document.querySelectorAll('.doc-school').forEach(el => el.innerText = unitName);
        document.querySelectorAll('.doc-date').forEach(el => el.innerText = `${loc}, ngày ${d} tháng ${m} năm ${y}`);
        document.querySelectorAll('.doc-time').forEach(el => el.innerText = `${h} giờ ${min} phút`);
        document.querySelectorAll('.doc-room').forEach(el => el.innerText = studentClass !== '...........................................' ? `Lớp ${studentClass}` : '...');
        document.querySelectorAll('.doc-teacher-text').forEach(el => el.innerText = teacherName);
        document.querySelectorAll('.doc-student-text').forEach(el => el.innerText = studentName);
        document.querySelectorAll('.doc-violation-text').forEach(el => el.innerHTML = fullViolation);
        
        // Show Export Button
        document.getElementById('bi-btn-export').classList.remove('hidden');
        const printBtn = document.getElementById('bi-btn-print');
        if(printBtn) printBtn.classList.remove('hidden');

        // Init Canvases if not initialized
        initSignaturePad('student');
        initSignaturePad('teacher');
    };

    // --- CANVAS SIGNATURE LOGIC ---
    const initSignaturePad = (type) => {
        const canvas = document.getElementById(`bi-pad-${type}`);
        if (!canvas || signaturePads[type].ctx) return; // Đã init

        const ctx = canvas.getContext('2d');
        signaturePads[type].canvas = canvas;
        signaturePads[type].ctx = ctx;

        // Resize & High DPI
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        ctx.strokeStyle = '#000000'; // Mực đen
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        let drawing = false;

        const getPos = (e) => {
            const r = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return { x: clientX - r.left, y: clientY - r.top };
        };

        const startDraw = (e) => {
            e.preventDefault();
            drawing = true;
            signaturePads[type].empty = false;
            const p = getPos(e);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
        };

        const draw = (e) => {
            if (!drawing) return;
            e.preventDefault();
            const p = getPos(e);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
        };

        const stopDraw = (e) => {
            if (drawing) {
                e.preventDefault();
                drawing = false;
            }
        };

        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDraw);
        canvas.addEventListener('mouseout', stopDraw);
        canvas.addEventListener('touchstart', startDraw, {passive: false});
        canvas.addEventListener('touchmove', draw, {passive: false});
        canvas.addEventListener('touchend', stopDraw);
    };

    const clearPad = (type) => {
        const p = signaturePads[type];
        if (!p.ctx) return;
        const w = p.canvas.width / (window.devicePixelRatio || 1);
        const h = p.canvas.height / (window.devicePixelRatio || 1);
        p.ctx.clearRect(0, 0, w, h);
        p.empty = true;
    };

    // --- PDF EXPORT ---
    const printA4 = () => {
        const printContent = document.getElementById('bi-a4-paper').innerHTML;
        const originalContent = document.body.innerHTML;
        
        // Cần đảm bảo style in chuẩn
        const printWindow = window.open('', '_blank');
        printWindow.document.write('<html><head><title>Biên Bản</title>');
        printWindow.document.write('<style>@page { size: A4 portrait; margin: 15mm; } body { font-family: "Times New Roman", Times, serif; font-size: 14pt; }</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContent);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    const exportPDF = () => {
                let element = document.getElementById('bi-a4-paper');
        if (typeof currentMode !== 'undefined') {
            if (currentMode === 'tichthu') element = document.getElementById('bi-a4-tichthu');
            if (currentMode === 'hopph') element = document.getElementById('bi-a4-hopph');
        }
        const sName = document.getElementById('bi-doc-sign-student').innerText || 'HocSinh';
        
        // Tắt shadow của paper để in ra không bị dơ viền
        const originalShadow = element.style.boxShadow;
        element.style.boxShadow = 'none';

        const opt = {
            margin:       0,
            filename:     `Bien_Ban_Vi_Pham_${sName.replace(/ /g, '_')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        if (typeof html2pdf !== 'undefined') {
            // Swal removed to prevent blocking render pipeline

            html2pdf().set(opt).from(element).save().then(() => {
                element.style.boxShadow = originalShadow; // Restore shadow
                Swal.fire({
                    title: 'Thành công!',
                    text: 'Biên bản đã được lưu dưới dạng PDF. Bạn có thể gửi file này qua Zalo cho Phụ huynh.',
                    icon: 'success'
                });
            });
        } else {
            Swal.fire('Lỗi', 'Không tìm thấy thư viện xuất PDF (html2pdf.js)', 'error');
        }
    };

    // --- Lifecycle ---
    const init = () => {
        const container = document.getElementById('view-behavior-incident');
        if (container) {
            if (container.innerHTML.trim() === '' || container.innerHTML.includes('Rendered by behavior_incident.js')) { container.innerHTML = getTabHTML(); }
            if (typeof lucide !== 'undefined') lucide.createIcons();
            
            // Setup default values
            setTimeout(() => {
                loadConfig();
                loadClasses();
                updateViolationOptions();
                // Close search box when click outside
                document.addEventListener('click', (e) => {
                    const sb = document.getElementById('bi-search-results');
                    const inp = document.getElementById('bi-student-name');
                    if (sb && !sb.contains(e.target) && e.target !== inp) {
                        sb.classList.add('hidden');
                    }
                });
            }, 100);
        }
    };

    return {
        init,
        printA4,
        startQRScanner,
        stopQRScanner,
        renderZaloReport,
        copyZalo,
        clearHistory,
        toggleMode,
        saveConfig,
        updateViolationOptions,
        applySuggestion,
        loadClasses,
        loadStudentsByClass,
        onStudentSelect,
        searchStudent,
        selectStudent,
        generatePreview,
        clearPad,
        exportPDF
    };
})();
