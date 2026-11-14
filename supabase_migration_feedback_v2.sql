-- =========================================================
-- NÂNG CẤP BẢNG GÓP Ý DỰ THẢO VĂN BẢN (VERSION 2)
-- Bổ sung: Link tiếp nhận Biên bản họp tổ, Cấu trúc bảng góp ý & Danh sách văn bản con
-- =========================================================

-- 1. Thêm trường link Google Form tiếp nhận Biên bản họp tổ
ALTER TABLE IF EXISTS cbq_feedback_topics 
ADD COLUMN IF NOT EXISTS meeting_minutes_url TEXT;

-- 2. Thêm trường danh sách các văn bản / quy chế con cần góp ý (JSONB Array)
ALTER TABLE IF EXISTS cbq_feedback_topics 
ADD COLUMN IF NOT EXISTS sub_documents JSONB;

-- 3. Thêm trường lưu mảng chi tiết các mục góp ý theo bảng
ALTER TABLE IF EXISTS cbq_feedback_responses 
ADD COLUMN IF NOT EXISTS feedback_items JSONB;

-- 4. Thêm trường lưu link file scan biên bản họp tổ (nếu tổ nộp qua link trực tiếp)
ALTER TABLE IF EXISTS cbq_feedback_responses 
ADD COLUMN IF NOT EXISTS meeting_minutes_file_url TEXT;

-- 5. Cập nhật mẫu chủ đề với link Google Form tiếp nhận biên bản họp
UPDATE cbq_feedback_topics 
SET meeting_minutes_url = 'https://docs.google.com/forms/d/1FgEhgB53h3EmbhmjFEwwiZE3-lASx6ujbTvQrpKtqVk/viewform'
WHERE meeting_minutes_url IS NULL OR meeting_minutes_url = '';
