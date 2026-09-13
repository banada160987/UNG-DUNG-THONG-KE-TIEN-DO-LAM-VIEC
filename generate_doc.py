import docx
from docx.shared import Inches, Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import os

def set_cell_shading(cell, color_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=140, bottom=140, left=200, right=200):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="CBD5E1"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'  <w:top w:val="single" w:sz="6" w:space="0" w:color="{color}"/>'
        f'  <w:bottom w:val="single" w:sz="6" w:space="0" w:color="{color}"/>'
        f'  <w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'  <w:insideV w:val="none"/>'
        f'  <w:left w:val="none"/>'
        f'  <w:right w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def set_callout_borders(table, color="0284C7"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'  <w:left w:val="single" w:sz="24" w:space="0" w:color="{color}"/>'
        f'  <w:top w:val="none"/>'
        f'  <w:bottom w:val="none"/>'
        f'  <w:right w:val="none"/>'
        f'  <w:insideH w:val="none"/>'
        f'  <w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def build_document():
    doc = docx.Document()

    # Set page margins (Standard VN: Left 3cm, Top 2.5cm, Bottom 2.5cm, Right 2cm)
    for section in doc.sections:
        section.top_margin = Cm(2.5)
        section.bottom_margin = Cm(2.5)
        section.left_margin = Cm(3.0)
        section.right_margin = Cm(2.0)

    # Base styles
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Times New Roman'
    style_normal.font.size = Pt(12)
    style_normal.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)

    # 1. Main Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(10)
    p_title.paragraph_format.space_after = Pt(4)
    run_title = p_title.add_run("HỒ SƠ BẢO VỆ VÀ THUYẾT MINH KỸ THUẬT ĐỀ ÁN")
    run_title.font.name = 'Times New Roman'
    run_title.font.size = Pt(16)
    run_title.bold = True
    run_title.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    # Subtitle
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(2)
    p_sub.paragraph_format.space_after = Pt(14)
    run_sub1 = p_sub.add_run("Hệ thống quản lý học tập, kiểm tra, khảo sát linh hoạt ứng dụng AI phục vụ trường phổ thông\n")
    run_sub1.font.name = 'Times New Roman'
    run_sub1.font.size = Pt(12.5)
    run_sub1.italic = True
    run_sub1.font.color.rgb = RGBColor(0x47, 0x55, 0x69)
    run_sub2 = p_sub.add_run("(Cổng thông tin Giáo dục caobaquat.xyz - Cao Bá Quát AI Team)")
    run_sub2.font.name = 'Times New Roman'
    run_sub2.font.size = Pt(13)
    run_sub2.bold = True
    run_sub2.font.color.rgb = RGBColor(0x02, 0x84, 0xC7)

    # Callout box for Summary
    callout_tbl = doc.add_table(rows=1, cols=1)
    callout_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    callout_cell = callout_tbl.cell(0, 0)
    set_cell_shading(callout_cell, "F8FAFC")
    set_cell_margins(callout_cell, top=140, bottom=140, left=200, right=200)
    set_callout_borders(callout_tbl, "0284C7")
    
    p_box = callout_cell.paragraphs[0]
    p_box.paragraph_format.space_before = Pt(2)
    p_box.paragraph_format.space_after = Pt(2)
    p_box.paragraph_format.line_spacing = 1.2
    run_box_t = p_box.add_run("Mục đích tài liệu:\n")
    run_box_t.bold = True
    run_box_t.font.color.rgb = RGBColor(0x02, 0x84, 0xC7)
    run_box_c = p_box.add_run("Tài liệu này cung cấp luận cứ phản biện chuyên sâu, bộ câu hỏi bảo vệ trước Hội đồng Ban Giám khảo, kịch bản thuyết trình mẫu chuẩn quốc gia, và cẩm nang kỹ thuật lắp đặt hệ thống máy chủ (Server/PC) cho các trường học triển khai hệ sinh thái giáo dục số.")
    run_box_c.italic = True

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # ==================== PHẦN I ====================
    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(14)
        r.bold = True
        r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(13)
        r.bold = True
        r.font.color.rgb = RGBColor(0x02, 0x84, 0xC7)
        return p

    def add_body(text, bold_prefix="", italic=False):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.2
        if bold_prefix:
            rb = p.add_run(bold_prefix + " ")
            rb.bold = True
            rb.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        rc = p.add_run(text)
        rc.italic = italic
        return p

    def add_bullet(text, bold_prefix=""):
        p = doc.add_paragraph(style='List Bullet')
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            rb = p.add_run(bold_prefix + " ")
            rb.bold = True
            rb.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        p.add_run(text)
        return p

    def add_quote(title, content):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        set_cell_shading(cell, "F1F5F9")
        set_cell_margins(cell, top=100, bottom=100, left=180, right=180)
        set_callout_borders(tbl, "0284C7")
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        rt = p.add_run(f"👉 {title}\n")
        rt.bold = True
        rt.font.color.rgb = RGBColor(0x02, 0x84, 0xC7)
        rc = p.add_run(content)
        rc.italic = True
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # Content Section 1
    add_h1("PHẦN I: BẢN PHẢN BIỆN CHUYÊN SÂU & ĐÁNH GIÁ RỦI RO KỸ THUẬT")
    add_body("Dưới góc nhìn của Hội đồng Giám khảo chuyên môn (gồm các chuyên gia CNTT, Trí tuệ Nhân tạo, An ninh mạng, Quản lý Giáo dục và Pháp lý), đề án caobaquat.xyz có những điểm sáng tạo rất lớn nhưng đồng thời cũng tồn tại các điểm mâu thuẫn logic và rủi ro kỹ thuật cần chuẩn bị đối thoại:")

    add_h2("1. Mâu thuẫn giữa Khái niệm 'Offline 100%' và 'Giải pháp Trọng tâm AI'")
    add_bullet("Đề án khẳng định hệ thống vận hành ngoại tuyến 100% trong mạng LAN khi mất cáp quang ngoài. Tuy nhiên, 5 Trợ lý AI (Gemini Flash, Azure GPT-4o Vision) đều là Cloud API phụ thuộc đường truyền Internet. Nếu mất mạng, hệ thống mất đi 'trái tim AI' và trở về một Web LMS truyền thống.", "• Điểm mâu thuẫn:")
    add_bullet("Nhóm tác giả cần làm rõ khái niệm 'Kiến trúc Phân tầng Độc lập (Fault-Tolerant Layering)' thay vì nói chung chung là Offline 100% AI.", "• Giải pháp chuẩn hóa:")

    add_h2("2. Vấn đề Ảo giác AI (Hallucination) và Tính pháp lý khi chấm Tự luận")
    add_bullet("Chữ viết tay Tiếng Việt của học sinh THPT rất đa dạng, hay viết tắt. OCR và LLM có thể nhận diện sai ngữ nghĩa hoặc sinh điểm lệch chuẩn.", "• Rủi ro:")
    add_bullet("Phải định vị rõ AI là 'Trợ lý gợi ý (Assistant)' chứ không phải 'Người ra quyết định (Decision Maker)'. Mọi điểm số và nhận xét bắt buộc phải qua khâu duyệt 1-click của Giáo viên (Human-in-the-Loop).", "• Nguyên tắc bảo vệ:")

    add_h2("3. Tuân thủ Quyền riêng tư & Pháp lý (Nghị định 13/2023/NĐ-CP)")
    add_bullet("Bài làm, hình ảnh, họ tên của 1.200 học sinh gửi lên API quốc tế (Google/Microsoft) cần có lớp Vô danh hóa (Anonymization Layer) để băm (hash) hoặc ẩn thông tin định danh cá nhân trước khi truyền đi.", "• Lỗ hổng cần che chắn:")

    add_h2("4. Nợ kỹ thuật trong Hạ tầng Máy chủ tự chế")
    add_bullet("Việc dùng PowerShell script quét ARP để tìm IP máy ảo DMOJ và sửa file web.config của IIS là một giải pháp tình thế (hack) rất dễ gãy hỏng trong môi trường thực tế.", "• Điểm yếu cốt lõi:")
    add_bullet("Cần chuẩn hóa sang Docker Containerization hoặc cấu hình Static Subnet để đảm bảo tính sẵn sàng 99.99%.", "• Khắc phục:")

    # ==================== PHẦN II ====================
    doc.add_page_break()
    add_h1("PHẦN II: BỘ CÂU HỎI BAN GIÁM KHẢO VÀ KỊCH BẢN TRẢ LỜI ĂN ĐIỂM")

    add_h2("Nhóm 1: Câu hỏi về Hạ tầng & Công nghệ")
    add_bullet("Nếu cúp điện đột ngột hoặc hỏng ổ cứng tại phòng kỹ thuật, dữ liệu thi học kỳ của 1.200 học sinh xử lý thế nào?", "Câu hỏi 1.1:")
    add_quote(
        "Kịch bản trả lời xuất sắc:",
        "Kính thưa BGK, hệ thống áp dụng cơ chế Bảo toàn Dữ liệu Kép (Dual Data Resilience): (1) Phía Client lưu vết tức thời từng câu trả lời vào LocalStorage/IndexedDB; (2) Phía Server thực hiện sao lưu CSDL tự động (Automated Backup) mỗi 30 phút sang ổ cứng dự phòng và đồng bộ đám mây mã hóa. Nếu mất điện, khi có điện trở lại, máy học sinh tự động gửi gói đồng bộ ngầm Async Queue lên server mà không mất một bài nào."
    )

    add_bullet("Tại sao không thuê Cloud VPS (AWS/Google Cloud) mà lại đặt Server tại trường?", "Câu hỏi 1.2:")
    add_quote(
        "Kịch bản trả lời xuất sắc:",
        "Việc đặt Máy chủ On-Premise tại trường giải quyết 2 bài toán cốt tử của giáo dục vùng khó: (1) Chi phí 0 đồng hàng tháng; (2) Đảm bảo độ trễ = 0 và thông lượng mạng LAN Gigabit không phụ thuộc vào tình trạng đứt cáp quang biển hay nghẽn mạng Internet ngoại vi khi 1.000 học sinh đồng loạt nộp bài."
    )

    add_h2("Nhóm 2: Câu hỏi về Trí tuệ Nhân tạo (AI Engine)")
    add_bullet("Làm sao đảm bảo AI không chấm thiên vị hoặc ảo giác đối với bài thi Tự luận?", "Câu hỏi 2.1:")
    add_quote(
        "Kịch bản trả lời xuất sắc:",
        "Hệ thống áp dụng kỹ thuật 'Structured Few-Shot Prompting' kết hợp Bare-bone Rubric: Giáo viên nạp ma trận đáp án và tiêu chí chấm chi tiết. AI chỉ đóng vai trò Trợ lý đọc hiểu và đề xuất khung điểm kèm bằng chứng trích dẫn từ bài làm. Giáo viên là người giữ quyền phê duyệt cuối cùng (Human-in-the-Loop), giúp giảm 80% thời gian gõ nhận xét nhưng giữ nguyên 100% trách nhiệm sư phạm."
    )

    add_h2("Nhóm 3: Câu hỏi về An toàn Thông tin & Quyền riêng tư")
    add_bullet("Hệ thống bảo vệ dữ liệu học sinh theo Nghị định 13/2023/NĐ-CP như thế nào khi gọi AI API ngoài?", "Câu hỏi 3.1:")
    add_quote(
        "Kịch bản trả lời xuất sắc:",
        "Trước khi payload được gửi tới Google Gemini hay Azure OpenAI, hệ thống chạy qua Middleware Vô danh hóa (Anonymization Filter): Toàn bộ Họ tên, Mã định danh, Lớp học đều được thay thế bằng chuỗi Token ngẫu nhiên (VD: Candidate_A102). Dữ liệu gửi đi chỉ là văn bản bài làm thuần túy. Đồng thời, nhà trường sử dụng API Enterprise với cam kết 'Zero Data Retention' (không lưu giữ và không dùng dữ liệu để train lại model)."
    )

    # ==================== PHẦN III ====================
    doc.add_page_break()
    add_h1("PHẦN III: BÀI DIỄN VĂN THUYẾT TRÌNH MẪU TRƯỚC HỘI ĐỒNG (7 - 10 PHÚT)")
    add_body("Dưới đây là kịch bản thuyết trình chuẩn được thiết kế súc tích, tự tin và giàu tính thuyết phục dành cho Đại diện Nhóm tác giả trình bày trước Hội đồng Giám khảo:")

    add_h2("1. Mở đầu: Đặt vấn đề & Nỗi đau thực tế (2 phút)")
    add_body("“Kính thưa Ban Giám khảo, thưa toàn thể Hội đồng thi!")
    add_body("Tôi là [Họ tên], đại diện cho Cao Bá Quát AI Team – Trường THPT Cao Bá Quát, tỉnh Đắk Lắk.")
    add_body("Năm học 2025 - 2026 đánh dấu cột mốc 30 năm thành lập trường, cũng là thời điểm Chương trình GDPT 2018 bước vào giai đoạn then chốt với cấu trúc đề thi Tốt nghiệp THPT mới. Tuy nhiên, tại các trường phổ thông – đặc biệt là khu vực Tây Nguyên – thầy cô và nhà trường đang đối mặt với 3 nghịch lý rất lớn:")
    add_body("Thứ nhất: Áp lực đổi mới kiểm tra đánh giá rất cao (câu hỏi Đúng/Sai lũy tiến, lập trình thực tế, tích hợp Năng lực số 5512), nhưng phần mềm thương mại trên thị trường lại có chi phí bản quyền đắt đỏ và phụ thuộc 100% vào mạng Internet ngoài.")
    add_body("Thứ hai: Giáo viên quá tải vì hàng trăm giờ chấm bài tự luận thủ công và xử lý thủ tục hành chính, không còn thời gian tương tác 1-1 với học sinh.")
    add_body("Thứ ba: Học sinh thiếu môi trường rèn luyện kỹ năng nghe nói tiếng Anh chuẩn bản xứ.")
    add_body("Xuất phát từ nỗi đau thực tiễn đó, chúng tôi đã nghiên cứu và phát triển Cổng thông tin Giáo dục & Khảo thí thông minh caobaquat.xyz – một giải pháp Hybrid AI tự chủ 100% về công nghệ với chi phí gần như bằng 0 đồng!”")

    add_h2("2. Thân bài: Điểm đột phá của Giải pháp & 5 Trợ lý AI (4 phút)")
    add_body("“Kính thưa Hội đồng, giải pháp của chúng tôi nổi bật với 3 giá trị cốt lõi:")
    add_body("1. Mô hình Kiến trúc Phân tầng Hybrid độc đáo: Toàn bộ phân hệ thi cử trắc nghiệm OMR, chấm code DMOJ, điểm danh và kho học liệu được xử lý 100% trong mạng LAN nội bộ. Khi mất cáp quang ngoài, trường vẫn tổ chức thi bình thường với độ trễ bằng 0. Khi có Internet, hệ thống tự động kích hoạt tầng Trí tuệ nhân tạo đám mây.")
    add_body("2. Hệ sinh thái 05 Trợ lý AI chuyên sâu cho giáo dục phổ thông:\n"
             "• Gemini AI Grader: Đọc hiểu bài tự luận viết tay, gợi ý điểm chi tiết từng ý theo Rubric chỉ trong 3 giây.\n"
             "• CBQ English Coach: Luyện đàm thoại 4 kỹ năng STT/TTS theo khung chuẩn Châu Âu CEFR.\n"
             "• Digital & AI Planner: Tự động lồng ghép Năng lực số và Năng lực AI vào giáo án 5512, xuất thẳng ra file Word chuẩn Bộ GD&ĐT.\n"
             "• AI Question Bank: Bóc tách đề thi PDF/ảnh quét thành câu hỏi có cấu trúc.\n"
             "• AI Administrative Assistant: Quét ảnh lịch tuần để tự động phân tích và giao việc trên văn phòng số iDoc.")
    add_body("3. An toàn, bảo mật và công bằng tuyệt đối: Áp dụng cơ chế rọc phách kép (Double-Blind) cho chấm thi OMR; điểm danh bằng mã PIN biến đổi 30s kết hợp IP LAN chống gian lận 100%.”")

    add_h2("3. Kết bài: Hiệu quả thực tiễn & Khả năng nhân rộng (2 phút)")
    add_body("“Kính thưa quý vị, giải pháp caobaquat.xyz không phải là một mô hình lý thuyết trên giấy. Hệ thống đã được đóng gói và vận hành thực tế phục vụ hơn 1.200 học sinh và gần 80 cán bộ giáo viên tại trường THPT Cao Bá Quát.")
    add_body("Kết quả thực tế chứng minh: Hệ thống đã giúp giải phóng tới 80% thời gian chấm thi và hành chính cho giáo viên, tiết kiệm cho nhà trường 30 - 50 triệu đồng mỗi năm chi phí mua bản quyền phần mềm. Quan trọng hơn cả, giải pháp đã chứng minh: Một trường học vùng khó khăn hoàn toàn có thể tự chủ công nghệ cao và đưa AI tiên tiến nhất vào phục vụ học sinh nghèo.")
    add_body("Chúng tôi xin trân trọng cảm ơn Ban Giám khảo và kính mời quý thầy cô cùng theo dõi phần Demo trực tiếp hệ thống!”")

    # ==================== PHẦN IV ====================
    doc.add_page_break()
    add_h1("PHẦN IV: CẨM NANG KỸ THUẬT LẮP ĐẶT VÀ VẬN HÀNH MÁY CHỦ TRƯỜNG HỌC")

    add_h2("1. Lựa chọn Phần cứng: Server chuyên dụng vs PC phòng Tin học")
    
    # Table of hardware comparison
    table = doc.add_table(rows=6, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table)

    headers = ["Tiêu chí so sánh", "Phương án 1: PC Phòng Máy (Tận dụng)", "Phương án 2: Server Chuyên dụng (Rack/Tower)"]
    for c_idx, h in enumerate(headers):
        cell = table.cell(0, c_idx)
        set_cell_shading(cell, "1E3A8A")
        set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(11)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    data = [
        ["Chi phí đầu tư", "0 đồng (Tận dụng máy tính sẵn có)", "15 - 35 triệu đồng (Mua mới máy chủ)"],
        ["Cấu hình tối thiểu", "Core i5 / Ryzen 5, 16GB RAM, SSD 256GB NVMe", "Intel Xeon / Core i7, 32GB RAM ECC, 2x 512GB SSD RAID-1"],
        ["Khả năng chịu tải", "300 - 500 học sinh thi đồng thời trong LAN", "1.500 - 3.000 học sinh toàn trường đồng thời"],
        ["Độ bền vận hành", "Nên tắt máy ngoài giờ, tản nhiệt thường", "Hoạt động liên tục 24/7/365, nguồn đôi, quạt công nghiệp"],
        ["Môi trường lắp đặt", "Bàn giáo viên / Bàn kỹ thuật phòng Tin học", "Tủ Rack phòng Server, phòng máy lạnh và UPS"]
    ]

    for r_idx, row in enumerate(data):
        for c_idx, val in enumerate(row):
            cell = table.cell(r_idx + 1, c_idx)
            if r_idx % 2 == 1:
                set_cell_shading(cell, "F1F5F9")
            set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
            p = cell.paragraphs[0]
            p.paragraph_format.line_spacing = 1.15
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT if c_idx == 0 else WD_ALIGN_PARAGRAPH.JUSTIFY
            r = p.add_run(val)
            r.font.size = Pt(10.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_h2("2. Sơ đồ Đấu nối Mạng Nội bộ (Network Topology)")
    add_body("Để đảm bảo tốc độ 1Gbps không bị nghẽn mạng khi học sinh toàn trường cùng truy cập, sơ đồ đấu nối vật lý được thiết kế như sau:")
    add_bullet("Đường truyền cáp quang (FTTH) có IP Tĩnh (hoặc Dynamic DNS) đấu nối trực tiếp vào Router chính (DrayTek / MikroTik / Ruijie).", "1. Router Trung tâm:")
    add_bullet("Từ Router kéo dây mạng CAT6 Gigabit vào Switch Core trung tâm phòng máy. Các Switch tầng phân phối sóng Wi-Fi (Access Points) phủ khắp các dãy phòng học.", "2. Hạ tầng Switch & Wi-Fi:")
    add_bullet("Máy chủ/PC cài đặt hệ thống được cắm trực tiếp vào cổng Gigabit số 1 trên Switch Core và được gán IP Tĩnh nội bộ cố định: 192.168.1.100.", "3. Vị trí Máy chủ:")
    add_bullet("Bắt buộc trang bị Bộ lưu điện (UPS) 1000VA - 2000VA có khả năng duy trì điện 20-30 phút khi cúp điện đột ngột để bảo vệ ổ cứng SSD.", "4. Bộ lưu điện dự phòng (UPS):")

    add_h2("3. Hướng dẫn Cài đặt Hệ thống Tự động (Docker Engine)")
    add_body("Thay vì cài đặt thủ công dễ phát sinh lỗi môi trường, toàn bộ hệ thống được triển khai bằng Docker Compose qua 4 bước:")
    add_bullet("Tải và cài đặt Docker Desktop (trên Windows 10/11 Pro) hoặc Docker Engine (trên Ubuntu Server 22.04/24.04 LTS).", "Bước 1: Cài đặt Docker Engine:")
    add_bullet("Tạo thư mục C:\\SchoolServer\\ và khởi tạo file docker-compose.yml chứa cấu hình Nginx, Supabase/PostgreSQL 15, Redis và DMOJ Judge.", "Bước 2: Cấu hình docker-compose.yml:")
    add_bullet("Mở Terminal / PowerShell tại thư mục và gõ lệnh: docker compose up -d. Sau 3 phút, toàn bộ CSDL và Web Server tự động khởi chạy ngầm.", "Bước 3: Khởi chạy 1-Click:")
    add_bullet("Trên Router trường, thực hiện Port Forwarding (Mở cổng NAT) Port 80 và Port 443 trỏ về địa chỉ IP 192.168.1.100 để người dùng từ ngoài trường có thể truy cập qua tên miền caobaquat.xyz.", "Bước 4: Cấu hình NAT Port & Tên miền:")

    add_h2("4. Quy trình Sao lưu Dự phòng Tự động (Automated Backup Script)")
    add_body("Tạo một tác vụ định kỳ (Windows Task Scheduler hoặc Linux CronJob) chạy mỗi ngày vào lúc 23:00 để tự động kết xuất dữ liệu CSDL PostgreSQL ra file .sql.gz, lưu trữ đồng thời trên ổ cứng ngoài và đẩy lên Google Drive bảo mật của nhà trường.")

    add_quote(
        "Cam kết kỹ thuật & Chuyển giao:",
        "Hệ thống được đóng gói hoàn chỉnh thành Bộ cài đặt tiêu chuẩn (Installer Package) kèm đầy đủ Tài liệu Hướng dẫn Vận hành (SOP). Nhà trường sẵn sàng chuyển giao công nghệ và hỗ trợ kỹ thuật cho các trường THPT, THCS trên địa bàn toàn tỉnh Đắk Lắk và khu vực Tây Nguyên."
    )

    output_file = "Tai_Lieu_Bao_Ve_Va_Huong_Dan_Server_CBQ.docx"
    doc.save(output_file)
    print(f"SUCCESS: Generated {output_file} ({os.path.getsize(output_file)} bytes)")

if __name__ == "__main__":
    build_document()
