-- 06_quiz_optimizations.sql
-- Hàm lấy danh sách học sinh chưa tham gia thi trắc nghiệm
-- Chạy script này trong giao diện SQL Editor của Supabase

CREATE OR REPLACE FUNCTION get_unsubmitted_students()
RETURNS TABLE (
  student_code text,
  full_name text,
  student_class text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.student_code, 
    s.student_name AS full_name, 
    s.student_class
  FROM cbq_students s
  LEFT JOIN cbq_quiz_submissions q 
    ON LOWER(TRIM(s.student_code)) = LOWER(TRIM(q.student_code))
  WHERE q.id IS NULL
  ORDER BY s.student_class ASC, s.student_name ASC;
END;
$$ LANGUAGE plpgsql;
