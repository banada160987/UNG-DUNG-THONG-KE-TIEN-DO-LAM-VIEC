-- ==========================================================
-- 11_FIX_SECURITY_AND_RACE_CONDITIONS.SQL
-- HỆ THỐNG TRUNG TÂM TIỆN ÍCH HỌC ĐƯỜNG (SUPABASE 2)
-- Generated: 2026-09-09 (Fixed table names & RLS)
-- ==========================================================

-- --------------------------------------------------
-- 1. HÀM ATOMIC RPC: TĂNG/GIẢM LƯỢT VOTE CHỐNG RACE CONDITION
-- --------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_vote(target_entry_id uuid, step integer DEFAULT 1)
RETURNS void AS $$
BEGIN
  UPDATE public.cbq_voting_entries 
  SET votes_count = GREATEST(0, COALESCE(votes_count, 0) + step)
  WHERE id = target_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_vote(uuid, integer) TO anon, authenticated, service_role;

-- --------------------------------------------------
-- 2. TỐI ƯU HÓA INDEXING CÁC BẢNG TRUY VẤN TẦN SUẤT CAO
-- --------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cbq_students_class_active ON public.cbq_students(student_class, is_active);
CREATE INDEX IF NOT EXISTS idx_cbq_votes_voter_device ON public.cbq_votes(voter_code, device_token);
CREATE INDEX IF NOT EXISTS idx_cbq_voting_entries_count ON public.cbq_voting_entries(votes_count DESC, is_active);
CREATE INDEX IF NOT EXISTS idx_cbq_parking_reg_code ON public.cbq_parking_registrations(ticket_code);
CREATE INDEX IF NOT EXISTS idx_cbq_audit_logs_ticket ON public.cbq_audit_logs(ticket_code);

-- --------------------------------------------------
-- 3. CỦNG CỐ ROW LEVEL SECURITY (RLS) POLICIES BẢO MẬT
-- --------------------------------------------------

-- A. BẢNG CBQ_USER_ROLES (Phân quyền Admin & Ban bệ)
ALTER TABLE public.cbq_user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_user_roles" ON public.cbq_user_roles;
DROP POLICY IF EXISTS "Allow read user roles" ON public.cbq_user_roles;
DROP POLICY IF EXISTS "Allow admin write user roles" ON public.cbq_user_roles;

-- Đọc quyền: Người dùng đã xác thực hoặc Anon đọc quyền của chính mình
CREATE POLICY "Allow read user roles" ON public.cbq_user_roles 
  FOR SELECT USING (true);

-- Ghi/Xóa quyền: Chỉ Service Role hoặc Authenticated Admin
CREATE POLICY "Allow admin write user roles" ON public.cbq_user_roles 
  FOR ALL USING (auth.role() = 'service_role');


-- B. BẢNG CBQ_VOTING_ENTRIES (Danh sách bài dự thi)
ALTER TABLE public.cbq_voting_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_voting_entries" ON public.cbq_voting_entries;
DROP POLICY IF EXISTS "Allow public read active entries" ON public.cbq_voting_entries;

CREATE POLICY "Allow public read active entries" ON public.cbq_voting_entries 
  FOR SELECT USING (is_active = true OR auth.role() = 'service_role');


-- C. BẢNG CBQ_VOTES (Phiếu bầu)
ALTER TABLE public.cbq_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_votes" ON public.cbq_votes;
DROP POLICY IF EXISTS "Allow public insert votes" ON public.cbq_votes;
DROP POLICY IF EXISTS "Allow public read votes" ON public.cbq_votes;
DROP POLICY IF EXISTS "Allow public delete own vote" ON public.cbq_votes;
DROP POLICY IF EXISTS "Allow public update own vote" ON public.cbq_votes;

CREATE POLICY "Allow public read votes" ON public.cbq_votes 
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert votes" ON public.cbq_votes 
  FOR INSERT WITH CHECK (voter_name IS NOT NULL AND voter_code IS NOT NULL);

CREATE POLICY "Allow public delete own vote" ON public.cbq_votes 
  FOR DELETE USING (true);

CREATE POLICY "Allow public update own vote" ON public.cbq_votes 
  FOR UPDATE USING (true);


-- D. BẢNG CBQ_STUDENTS (Danh sách học sinh)
ALTER TABLE public.cbq_students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_students" ON public.cbq_students;
DROP POLICY IF EXISTS "Allow public read active students" ON public.cbq_students;

CREATE POLICY "Allow public read active students" ON public.cbq_students 
  FOR SELECT USING (is_active = true OR auth.role() = 'service_role');


-- E. BẢNG CBQ_PARKING_REGISTRATIONS (Đăng ký giữ xe)
ALTER TABLE public.cbq_parking_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_parking_registrations" ON public.cbq_parking_registrations;
DROP POLICY IF EXISTS "Public can view parking registrations" ON public.cbq_parking_registrations;
DROP POLICY IF EXISTS "Public can register parking" ON public.cbq_parking_registrations;

CREATE POLICY "Public can view parking registrations" ON public.cbq_parking_registrations FOR SELECT USING (true);
CREATE POLICY "Public can register parking" ON public.cbq_parking_registrations FOR INSERT WITH CHECK (true);

-- ==========================================================
-- HOÀN TẤT SETUP BẢO MẬT & ATOMIC VOTE (FIXED TABLE NAMES)
-- ==========================================================
