-- ==============================================================================
-- TRƯỜNG THPT CAO BÁ QUÁT - NĂM HỌC 2026 - 2027
-- HỆ THỐNG QUẢN LÝ & ĐIỂM DANH CÂU LẠC BỘ THÔNG MINH (AI & ZALO)
-- BẢNG DỮ LIỆU: cbq_club_sessions, cbq_club_attendance, cbq_club_ai_evaluations
-- ==============================================================================

-- 1. BẢNG BUỔI SINH HOẠT CÂU LẠC BỘ (16 Buổi / Năm học)
CREATE TABLE IF NOT EXISTS public.cbq_club_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.cbq_registration_campaigns(id) ON DELETE SET NULL,
    club_name TEXT NOT NULL,                             -- Tên CLB (STEM, IT, ENG, ART, SPORT, SKILL)
    session_number INTEGER NOT NULL CHECK (session_number BETWEEN 1 AND 16), -- Buổi số 1..16
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,    -- Ngày sinh hoạt
    session_time TEXT DEFAULT '14:00 - 16:30 (Thứ 7)',  -- Khung giờ sinh hoạt
    topic TEXT NOT NULL,                                -- Chủ đề / Chuyên đề sinh hoạt
    location TEXT DEFAULT 'Phòng Chức năng CLB',        -- Địa điểm tổ chức
    teacher_note TEXT,                                  -- Ghi chú của Giáo viên / BCN
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index tối ưu tốc độ tra cứu lịch sinh hoạt theo CLB và Buổi số
CREATE INDEX IF NOT EXISTS idx_club_sessions_club_name ON public.cbq_club_sessions(club_name);
CREATE INDEX IF NOT EXISTS idx_club_sessions_date ON public.cbq_club_sessions(session_date);

-- 2. BẢNG CHI TIẾT ĐIỂM DANH THÀNH VIÊN TỪNG BUỔI
CREATE TABLE IF NOT EXISTS public.cbq_club_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.cbq_club_sessions(id) ON DELETE CASCADE,
    student_code TEXT NOT NULL,                         -- Mã Học Sinh
    student_name TEXT NOT NULL,                         -- Họ và Tên
    student_class TEXT,                                 -- Lớp (10A01..12A15)
    status TEXT NOT NULL DEFAULT '1' CHECK (status IN ('1', 'P', '0', 'L')), 
    -- Quy ước: '1': Có mặt (1.0), 'P': Có phép (0.5), '0': Vắng (0.0), 'L': Đi muộn
    checkin_time TEXT,                                  -- Giờ quét mã check-in (HH:mm:ss)
    contribution_score INTEGER DEFAULT 5 CHECK (contribution_score BETWEEN 1 AND 10), -- Điểm tích cực
    remarks TEXT,                                       -- Nhận xét của Ban Chủ Nhiệm
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index tối ưu tra cứu điểm danh theo Session và Học sinh
CREATE INDEX IF NOT EXISTS idx_club_attendance_session ON public.cbq_club_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_club_attendance_student_code ON public.cbq_club_attendance(student_code);
CREATE INDEX IF NOT EXISTS idx_club_attendance_student_class ON public.cbq_club_attendance(student_class);

-- 3. BẢNG TỔNG KẾT ĐÁNH GIÁ CHUYÊN CẦN VÀ HẠNH KIỂM BỞI AI
CREATE TABLE IF NOT EXISTS public.cbq_club_ai_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_name TEXT NOT NULL,
    student_code TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_class TEXT,
    total_sessions INTEGER DEFAULT 16,
    attended_sessions NUMERIC(4, 1) DEFAULT 0.0,
    attendance_rate NUMERIC(5, 2) DEFAULT 0.0,          -- Tỷ lệ chuyên cần (%)
    attendance_score INTEGER DEFAULT 0,                 -- Điểm chuyên cần thang 100
    ai_rating TEXT NOT NULL DEFAULT 'Đạt',              -- 'Xuất sắc', 'Tốt', 'Đạt', 'Chưa đạt'
    conduct_bonus_points INTEGER DEFAULT 0,             -- Điểm cộng Hạnh kiểm GVCN (+10, +5, +2, 0)
    is_reward_recommended BOOLEAN DEFAULT FALSE,        -- Đề xuất Khen thưởng cấp trường
    ai_feedback TEXT,                                   -- Nhận xét chi tiết từ Trợ lý AI Gemini
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_club_ai_eval_student ON public.cbq_club_ai_evaluations(student_code);
CREATE INDEX IF NOT EXISTS idx_club_ai_eval_club ON public.cbq_club_ai_evaluations(club_name);

-- ==============================================================================
-- 4. BẢO MẬT & PHÂN QUYỀN TRUY CẬP (ROW LEVEL SECURITY - RLS)
-- ==============================================================================

-- Kích hoạt RLS
ALTER TABLE public.cbq_club_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbq_club_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbq_club_ai_evaluations ENABLE ROW LEVEL SECURITY;

-- Chính sách cho Buổi sinh hoạt (Mọi người được xem lịch, Admin/GV có quyền thêm/sửa)
DROP POLICY IF EXISTS "Public can view club sessions" ON public.cbq_club_sessions;
CREATE POLICY "Public can view club sessions" ON public.cbq_club_sessions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin and Teachers can manage club sessions" ON public.cbq_club_sessions;
CREATE POLICY "Admin and Teachers can manage club sessions" ON public.cbq_club_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- Chính sách cho Bảng điểm danh
DROP POLICY IF EXISTS "Public can view club attendance" ON public.cbq_club_attendance;
CREATE POLICY "Public can view club attendance" ON public.cbq_club_attendance
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin and Teachers can manage attendance" ON public.cbq_club_attendance;
CREATE POLICY "Admin and Teachers can manage attendance" ON public.cbq_club_attendance
    FOR ALL USING (true) WITH CHECK (true);

-- Chính sách cho Bảng đánh giá AI
DROP POLICY IF EXISTS "Public can view AI evaluations" ON public.cbq_club_ai_evaluations;
CREATE POLICY "Public can view AI evaluations" ON public.cbq_club_ai_evaluations
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin and Teachers can manage AI evaluations" ON public.cbq_club_ai_evaluations;
CREATE POLICY "Admin and Teachers can manage AI evaluations" ON public.cbq_club_ai_evaluations
    FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 5. NẠP DỮ LIỆU MẪU: 16 BUỔI SINH HOẠT NĂM HỌC 2026 - 2027 CHO 6 CLB
-- ==============================================================================

INSERT INTO public.cbq_club_sessions (club_name, session_number, session_date, session_time, topic, location, status)
VALUES
-- 1. CLB Toán học và STEM
('Câu lạc bộ Toán học và STEM sáng tạo', 1, '2026-09-19', '14:00 - 16:30', 'Lễ Ra Mắt & Định Hướng Dự Án Robot STEM 2026 - 2027', 'Phòng Thực Hành STEM 1', 'completed'),
('Câu lạc bộ Toán học và STEM sáng tạo', 2, '2026-10-03', '14:00 - 16:30', 'Kỹ Năng Lập Trình Vi Điều Khiển Arduino & Cảm Biến', 'Phòng Thực Hành STEM 1', 'completed'),
('Câu lạc bộ Toán học và STEM sáng tạo', 3, '2026-10-17', '14:00 - 16:30', 'Mô Hình Hóa Toán Học Trong Giải Quyết Vấn Đề Thực Tiễn', 'Phòng Đa Năng', 'completed'),
('Câu lạc bộ Toán học và STEM sáng tạo', 4, '2026-10-31', '14:00 - 16:30', 'Chế Tạo Xe Đua Năng Lượng Mặt Trời Mini', 'Sân Trường / Sân Cỏ', 'completed'),
('Câu lạc bộ Toán học và STEM sáng tạo', 5, '2026-11-14', '14:00 - 16:30', 'Ứng Dụng AI & Thị Giác Máy Tính Nhận Diện Khuôn Mặt', 'Phòng Máy Tính 2', 'completed'),
('Câu lạc bộ Toán học và STEM sáng tạo', 6, '2026-11-28', '14:00 - 16:30', 'Chuẩn Bị Gian Hàng Ngày Hội STEM Cấp Trường Chào Mừng 20/11', 'Nhà Đa Năng', 'completed'),
('Câu lạc bộ Toán học và STEM sáng tạo', 7, '2026-12-12', '14:00 - 16:30', 'Thực Hành In 3D & Thiết Kế Mô Hình Kỹ Thuật', 'Phòng Thực Hành STEM 1', 'completed'),
('Câu lạc bộ Toán học và STEM sáng tạo', 8, '2026-12-26', '14:00 - 16:30', 'Tổng Kết Hoạt Động Học Kỳ I & Triển Lãm Dự Án Mini', 'Hội Trường A', 'completed'),
('Câu lạc bộ Toán học và STEM sáng tạo', 9, '2027-01-16', '14:00 - 16:30', 'Khởi Động Học Kỳ II & Dự Án Khoa Học Kỹ Thuật Cấp Tỉnh', 'Phòng STEM 1', 'scheduled'),
('Câu lạc bộ Toán học và STEM sáng tạo', 10, '2027-02-13', '14:00 - 16:30', 'Hệ Thống IoT Nông Nghiệp Thông Minh Đắk Lắk', 'Phòng STEM 1', 'scheduled'),
('Câu lạc bộ Toán học và STEM sáng tạo', 11, '2027-02-27', '14:00 - 16:30', 'Lập Trình Drone / Flycam Tự Hành Lập Bản Đồ', 'Sân Bóng Trường', 'scheduled'),
('Câu lạc bộ Toán học và STEM sáng tạo', 12, '2027-03-13', '14:00 - 16:30', 'Chuyên Đề Toán Ứng Dụng Trong Kinh Tế Số', 'Phòng Đa Năng', 'scheduled'),
('Câu lạc bộ Toán học và STEM sáng tạo', 13, '2027-03-27', '14:00 - 16:30', 'Thử Nghiệm & Tối Ưu Sản Phẩm KHKT Cấp Tỉnh', 'Phòng STEM 1', 'scheduled'),
('Câu lạc bộ Toán học và STEM sáng tạo', 14, '2027-04-10', '14:00 - 16:30', 'Giao Lưu Học Thuật Với CLB STEM Các Trường THPT Bạn', 'Hội Trường A', 'scheduled'),
('Câu lạc bộ Toán học và STEM sáng tạo', 15, '2027-04-24', '14:00 - 16:30', 'Báo Cáo Dự Án Cuối Năm & Chấm Điểm Thi Đua', 'Phòng STEM 1', 'scheduled'),
('Câu lạc bộ Toán học và STEM sáng tạo', 16, '2027-05-08', '14:00 - 16:30', 'Đại Hội Tổng Kết CLB 2026-2027 & Khen Thưởng Đoàn Trường', 'Hội Trường A', 'scheduled'),

-- 2. CLB Tin học & Lập trình ứng dụng
('Câu lạc bộ Tin học và Lập trình ứng dụng', 1, '2026-09-19', '14:00 - 16:30', 'Khởi Động CLB: Lộ Trình Lập Trình Web & Python 2026', 'Phòng Máy 1', 'completed'),
('Câu lạc bộ Tin học và Lập trình ứng dụng', 2, '2026-10-03', '14:00 - 16:30', 'Xây Dựng Website Trường Học Với HTML, CSS & JavaScript', 'Phòng Máy 1', 'completed'),
('Câu lạc bộ Tin học và Lập trình ứng dụng', 3, '2026-10-17', '14:00 - 16:30', 'Lập Trình Python Xử Lý Dữ Liệu Tự Động Hóa', 'Phòng Máy 1', 'completed'),
('Câu lạc bộ Tin học và Lập trình ứng dụng', 4, '2026-10-31', '14:00 - 16:30', 'Bảo Mật Thông Tin & An Toàn Không Gian Mạng Cho Học Sinh', 'Hội Trường B', 'completed'),

-- 3. CLB Tiếng Anh và Hội nhập Quốc tế
('Câu lạc bộ Tiếng Anh và Hội nhập Quốc tế (CBQ English Club)', 1, '2026-09-19', '14:00 - 16:30', 'Ice Breaking & Public Speaking Fundamentals', 'Thư Viện Tiếng Anh', 'completed'),
('Câu lạc bộ Tiếng Anh và Hội nhập Quốc tế (CBQ English Club)', 2, '2026-10-03', '14:00 - 16:30', 'Debate Workshop: Youth & Digital Transformation', 'Thư Viện Tiếng Anh', 'completed'),
('Câu lạc bộ Tiếng Anh và Hội nhập Quốc tế (CBQ English Club)', 3, '2026-10-17', '14:00 - 16:30', 'IELTS & VSTEP Speaking Mastery Skills', 'Phòng Đa Năng', 'completed'),
('Câu lạc bộ Tiếng Anh và Hội nhập Quốc tế (CBQ English Club)', 4, '2026-10-31', '14:00 - 16:30', 'Halloween Cultural Festival & English Drama', 'Sân Khấu Ngoài Trời', 'completed'),

-- 4. CLB Văn nghệ - Nghệ thuật
('Câu lạc bộ Văn nghệ - Âm nhạc và Mỹ thuật', 1, '2026-09-19', '14:00 - 16:30', 'Thanh Nhạc Căn Bản & Tuyển Chọn Đội Hình Múa - Hát', 'Phòng Âm Nhạc', 'completed'),
('Câu lạc bộ Văn nghệ - Âm nhạc và Mỹ thuật', 2, '2026-10-03', '14:00 - 16:30', 'Hòa Âm Nhạc Cụ: Guitar, Organ & Trống Cajon', 'Phòng Âm Nhạc', 'completed'),
('Câu lạc bộ Văn nghệ - Âm nhạc và Mỹ thuật', 3, '2026-10-17', '14:00 - 16:30', 'Hội Họa: Kỹ Thuật Vẽ Tranh Sơn Dầu & Màu Nước', 'Phòng Mỹ Thuật', 'completed'),
('Câu lạc bộ Văn nghệ - Âm nhạc và Mỹ thuật', 4, '2026-10-31', '14:00 - 16:30', 'Dàn Dựng Tiết Mục Văn Nghệ Chào Mừng 20/11', 'Hội Trường A', 'completed'),

-- 5. CLB Thể dục Thể thao
('Câu lạc bộ Thể dục Thể thao (Bóng rổ, Cầu lông, Bóng chuyền)', 1, '2026-09-19', '14:00 - 16:30', 'Khởi Động Mùa Giải & Kiểm Tra Thể Lực Đầu Năm', 'Nhà Đa Năng', 'completed'),
('Câu lạc bộ Thể dục Thể thao (Bóng rổ, Cầu lông, Bóng chuyền)', 2, '2026-10-03', '14:00 - 16:30', 'Chiến Thuật Thi Đấu Bóng Rổ 3x3 & 5x5 Hiện Đại', 'Sân Bóng Rổ', 'completed'),
('Câu lạc bộ Thể dục Thể thao (Bóng rổ, Cầu lông, Bóng chuyền)', 3, '2026-10-17', '14:00 - 16:30', 'Kỹ Thuật Đập Cầu & Phòng Thủ Trong Cầu Lông Đôi', 'Nhà Đa Năng', 'completed'),
('Câu lạc bộ Thể dục Thể thao (Bóng rổ, Cầu lông, Bóng chuyền)', 4, '2026-10-31', '14:00 - 16:30', 'Bóng Chuyền: Kỹ Thuật Bắt Bước 1 & Chuyền Hai Tấn Công', 'Sân Bóng Chuyền', 'completed'),

-- 6. CLB Kỹ năng sống & Tình nguyện xanh
('Câu lạc bộ Kỹ năng sống, Công tác Xã hội và Tình nguyện xanh', 1, '2026-09-19', '14:00 - 16:30', 'Kỹ Năng Làm Việc Nhóm & Quản Lý Thời Gian Cho Học Sinh THPT', 'Hội Trường B', 'completed'),
('Câu lạc bộ Kỹ năng sống, Công tác Xã hội và Tình nguyện xanh', 2, '2026-10-03', '14:00 - 16:30', 'Kỹ Năng Sơ Cấp Cứu Ban Đầu & Ứng Phó Tình Huống Khẩn Cấp', 'Phòng Y Tế / Hội Trường B', 'completed'),
('Câu lạc bộ Kỹ năng sống, Công tác Xã hội và Tình nguyện xanh', 3, '2026-10-17', '14:00 - 16:30', 'Chiến Dịch Tình Nguyện Xanh: Phân Loại Rác & Trồng Cây', 'Khuôn Viên Trường', 'completed'),
('Câu lạc bộ Kỹ năng sống, Công tác Xã hội và Tình nguyện xanh', 4, '2026-10-31', '14:00 - 16:30', 'Kỹ Năng Quản Lý Cảm Xúc & Giải Tỏa Áp Lực Thi Cử', 'Hội Trường B', 'completed')
ON CONFLICT DO NOTHING;
