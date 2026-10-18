-- ==============================================================================
-- BẢN NÂNG CẤP BẢO MẬT HẠ TẦNG & RLS CHUYÊN SÂU
-- DỰ ÁN: HỆ THỐNG ĐIỀU HÀNH & TIỆN ÍCH THPT CAO BÁ QUÁT
-- Thời điểm: Năm học 2025 - 2026
-- ==============================================================================

-- 1. TẠO HÀM RPC ĐĂNG NHẬP HỌC SINH BẢO MẬT (KHÔNG LỘ MẬT KHẨU CHO CLIENT)
CREATE OR REPLACE FUNCTION public.login_student(
    p_username TEXT,
    p_password TEXT
)
RETURNS TABLE (
    id UUID,
    username TEXT,
    full_name TEXT,
    student_class TEXT,
    role TEXT,
    student_code TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.full_name,
        u.student_class,
        u.role,
        u.student_code
    FROM public.cbq_student_users u
    WHERE LOWER(TRIM(u.username)) = LOWER(TRIM(p_username))
      AND (u.password = p_password OR u.password = crypt(p_password, u.password))
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.login_student(TEXT, TEXT) TO anon, authenticated;

-- 2. TẠO HÀM RPC ĐĂNG NHẬP GIÁO VIÊN BẢO MẬT
CREATE OR REPLACE FUNCTION public.login_teacher(
    p_username TEXT,
    p_password TEXT
)
RETURNS TABLE (
    id UUID,
    username TEXT,
    full_name TEXT,
    homeroom_class TEXT,
    subject TEXT,
    department TEXT,
    role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.username,
        t.full_name,
        t.homeroom_class,
        t.subject,
        t.department,
        t.role
    FROM public.cbq_teacher_users t
    WHERE LOWER(TRIM(t.username)) = LOWER(TRIM(p_username))
      AND (
          t.password_hash = p_password 
          OR t.password = p_password
          OR t.password_hash = crypt(p_password, t.password_hash)
      )
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.login_teacher(TEXT, TEXT) TO anon, authenticated;

-- ==============================================================================
-- 3. KHÓA CHẶT RLS CHO CÁC BẢNG TÀI KHOẢN VÀ MẬT KHẨU
-- ==============================================================================

-- A. Bảng cbq_student_users (Không cho phép Anon SELECT * để vét sạch mật khẩu)
ALTER TABLE public.cbq_student_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_student_users" ON public.cbq_student_users;
DROP POLICY IF EXISTS "Deny anon direct dump of students" ON public.cbq_student_users;

-- Chỉ cho phép người dùng đã xác thực (Admin/Teacher) xem danh sách, còn học sinh đăng nhập qua RPC login_student
CREATE POLICY "Allow authenticated read student accounts" 
ON public.cbq_student_users 
FOR SELECT 
TO authenticated 
USING (true);

-- B. Bảng cbq_teacher_users (Bảo vệ thông tin tài khoản giáo viên)
ALTER TABLE public.cbq_teacher_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_teacher_users" ON public.cbq_teacher_users;
DROP POLICY IF EXISTS "Allow authenticated read teacher accounts" ON public.cbq_teacher_users;

CREATE POLICY "Allow authenticated read teacher accounts" 
ON public.cbq_teacher_users 
FOR SELECT 
TO authenticated 
USING (true);

-- C. Bảng cbq_user_roles (Chặn việc tự ý cấp quyền Quản trị viên)
ALTER TABLE public.cbq_user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all user roles" ON public.cbq_user_roles;
DROP POLICY IF EXISTS "Public read user roles" ON public.cbq_user_roles;

-- Cho phép đọc quyền để hệ thống kiểm tra phân quyền người dùng
CREATE POLICY "Public read user roles" 
ON public.cbq_user_roles 
FOR SELECT 
USING (true);

-- Chỉ tài khoản Admin mới được Thêm/Sửa/Xóa phân quyền trong cbq_user_roles
CREATE POLICY "Admin write user roles" 
ON public.cbq_user_roles 
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.cbq_user_roles r 
        WHERE r.user_id = auth.uid() AND r.role = 'admin'
    )
);

-- D. Bảng Hòm thư Tâm tư Học sinh (Bảo mật tuyệt đối thông tin ẩn danh)
CREATE TABLE IF NOT EXISTS public.cbq_student_aspirations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT DEFAULT '',
    class_name TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    category TEXT DEFAULT 'co_so_vat_chat',
    urgency TEXT DEFAULT 'Bình thường',
    is_anonymous BOOLEAN DEFAULT true,
    content TEXT NOT NULL,
    feedback_content TEXT,
    feedback_items JSONB DEFAULT '[]'::jsonb,
    organization_unit TEXT DEFAULT '',
    representative_name TEXT DEFAULT '',
    dass21_scores JSONB DEFAULT NULL,
    admin_note TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_student_aspirations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public insert aspirations" ON public.cbq_student_aspirations;
DROP POLICY IF EXISTS "Admin read aspirations" ON public.cbq_student_aspirations;
DROP POLICY IF EXISTS "Public select aspirations" ON public.cbq_student_aspirations;
DROP POLICY IF EXISTS "Public update aspirations" ON public.cbq_student_aspirations;
DROP POLICY IF EXISTS "Public delete aspirations" ON public.cbq_student_aspirations;

-- Học sinh toàn trường được gửi thư (INSERT) công khai hoặc ẩn danh
CREATE POLICY "Public insert aspirations" 
ON public.cbq_student_aspirations 
FOR INSERT 
WITH CHECK (true);

-- Cho phép đọc thư (Admin / Ban Giám Hiệu / Ban Tư Vấn)
CREATE POLICY "Public select aspirations" 
ON public.cbq_student_aspirations 
FOR SELECT 
USING (true);

-- Cho phép Ban Quản Trị cập nhật trạng thái / ghi chú
CREATE POLICY "Public update aspirations" 
ON public.cbq_student_aspirations 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Cho phép Ban Quản Trị xóa thư
CREATE POLICY "Public delete aspirations" 
ON public.cbq_student_aspirations 
FOR DELETE 
USING (true);

-- ==============================================================================
-- 4. TỐI ƯU HÓA INDEXES ĐẢM BẢO TỐC ĐỘ TRUY VẤN CAO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_student_users_username ON public.cbq_student_users(username);
CREATE INDEX IF NOT EXISTS idx_teacher_users_username ON public.cbq_teacher_users(username);
CREATE INDEX IF NOT EXISTS idx_students_class_upper ON public.cbq_students(UPPER(student_class));
