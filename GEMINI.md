# Project Rules - Hệ Thống Điều Hành & Tiện Ích THPT Cao Bá Quát

## Quy tắc đặt tên tệp khi tạo hoặc xuất tài liệu (File Export & Generation Naming)
1. **Tiền tố số thứ tự bắt buộc**:
   - Mọi tệp văn bản, đề án, biểu mẫu, kế hoạch, báo cáo, dự trù kinh phí (.docx, .xlsx, .pdf, .csv, v.v.) được trợ lý tạo ra hoặc tạo kịch bản xuất PHẢI có tiền tố số thứ tự ở đầu tên tệp.
   - Định dạng chuẩn: `{Số}-{Tên_tài_liệu}.{phần_mở_rộng}`.
   - Ví dụ:
     - `1-Ke_hoach_hoat_dong_CLB_2026_2027_THPT_CaoBaQuat.docx`
     - `2-Quy_che_to_chuc_va_hoat_dong_CLB.docx`
     - `3-Du_tru_kinh_phi_AI_For_Life_2026.xlsx`
     - `4-Bao_cao_tong_hop_y_kien_HNVC_ND30.docx`

2. **Thứ tự logic & Bộ hồ sơ**:
   - Khi tạo một bộ hồ sơ gồm nhiều tài liệu liên quan trong cùng một đợt làm việc, đánh số liên tục tăng dần từ `1-`, `2-`, `3-`... theo đúng trình tự phê duyệt / triển khai để khi xem trong thư mục máy tính (Windows Explorer), các file tự động sắp xếp ngăn nắp theo đúng thứ tự.
   - Nếu tài liệu theo tuần hoặc tháng, ưu tiên tiền tố có đánh số tuần/tháng rõ ràng: `01-Lich_cong_tac_tuan_01.docx`, `02-Ke_hoach_thang_09.docx`.

3. **Áp dụng vào mã nguồn xuất file**:
   - Trong các module mã nguồn xuất file tự động (Word, Excel), tên file tải xuống mặc định (`fileName`) cần có tiền tố số thứ tự hoặc số tuần/tháng tương ứng để tránh trùng lặp và tiện cho việc lưu trữ của người dùng.
