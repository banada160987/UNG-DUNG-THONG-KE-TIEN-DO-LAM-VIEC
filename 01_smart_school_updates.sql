-- =======================================================
-- MIGRATION SCRIPT: SMART SCHOOL 4.0 E-APPROVAL SYSTEM
-- =======================================================

-- 1. Bổ sung trường is_approved và approved_at vào bảng cbq_feedback_topics
-- Để đánh dấu văn bản dự thảo đã được Hiệu trưởng phê duyệt & ban hành
ALTER TABLE cbq_feedback_topics 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by TEXT;

-- 2. Đảm bảo bảng cbq_docs (Văn bản - Thông báo) tồn tại để có thể push dự thảo đã duyệt sang
CREATE TABLE IF NOT EXISTS cbq_docs (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Thông báo', -- Ví dụ: Thông báo, Quyết định, Dự thảo
    content TEXT,
    document_url TEXT, -- Link file PDF nếu có
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_public BOOLEAN DEFAULT true,
    author TEXT,
    reference_number TEXT -- Số hiệu văn bản
);

-- =======================================================
-- Bảng hỗ trợ gửi tin nhắn AI Chatbot (Tùy chọn tương lai)
-- =======================================================
CREATE TABLE IF NOT EXISTS cbq_chatbot_logs (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_query TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
