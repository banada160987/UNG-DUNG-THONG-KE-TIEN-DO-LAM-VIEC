-- ==========================================================
-- EXACT SUPABASE 1 SCHEMA DUMP (FIXED SYNTAX)
-- Total Tables Found: 72
-- Generated: 2026-09-09T01:17:02.771Z
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------
-- TABLE: access_logs
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  role text NOT NULL,
  ip_address text,
  user_agent text,
  status text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access access_logs" ON public.access_logs;
CREATE POLICY "Public full access access_logs" ON public.access_logs FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: audit_logs
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor text NOT NULL,
  action_type text NOT NULL,
  target_id text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access audit_logs" ON public.audit_logs;
CREATE POLICY "Public full access audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: batches
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  quota integer NOT NULL,
  deadline text NOT NULL,
  isActive boolean DEFAULT true
);

ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access batches" ON public.batches;
CREATE POLICY "Public full access batches" ON public.batches FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: candidate_logs
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.candidate_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  candidate_id uuid,
  actor_role text NOT NULL,
  actor_name text NOT NULL,
  action text NOT NULL,
  notes text
);

ALTER TABLE public.candidate_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access candidate_logs" ON public.candidate_logs;
CREATE POLICY "Public full access candidate_logs" ON public.candidate_logs FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: candidates
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  batch_id uuid,
  status text DEFAULT 'draft'::text,
  cccd text NOT NULL,
  fullName text NOT NULL,
  dob text,
  gender text,
  ethnicity text,
  phone text,
  unit text,
  currentTitle text,
  targetTitle text,
  feedback_message text,
  decisionRecruitment jsonb DEFAULT '{"date": "", "issuer": "", "number": ""}'::jsonb,
  decisionProbation jsonb DEFAULT '{"date": "", "issuer": "", "number": ""}'::jsonb,
  decisionAppointment jsonb DEFAULT '{"date": "", "issuer": "", "number": ""}'::jsonb,
  decisionSalary jsonb DEFAULT '{"date": "", "issuer": "", "number": ""}'::jsonb,
  degrees jsonb DEFAULT '[]'::jsonb,
  resumeDoc boolean DEFAULT false,
  certIT boolean DEFAULT false,
  certLanguage boolean DEFAULT false,
  reviewDoc boolean DEFAULT false,
  achievements jsonb DEFAULT '[]'::jsonb,
  files jsonb DEFAULT '[]'::jsonb,
  workplace text,
  certEthnic boolean,
  certificates jsonb DEFAULT '[]'::jsonb,
  evalMinute boolean DEFAULT false,
  ratingSheets boolean DEFAULT false
);

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access candidates" ON public.candidates;
CREATE POLICY "Public full access candidates" ON public.candidates FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_academic_reports
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_academic_reports (
  id SERIAL PRIMARY KEY,
  class_name text NOT NULL,
  report_date date DEFAULT CURRENT_DATE NOT NULL,
  subject text NOT NULL,
  missing_homework_students text,
  not_memorized_students text,
  notes text,
  logged_by text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_academic_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_academic_reports" ON public.cbq_academic_reports;
CREATE POLICY "Public full access cbq_academic_reports" ON public.cbq_academic_reports FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_agenda
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  time_start text NOT NULL,
  time_end text NOT NULL,
  activity_name text NOT NULL,
  location text,
  is_public boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_agenda ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_agenda" ON public.cbq_agenda;
CREATE POLICY "Public full access cbq_agenda" ON public.cbq_agenda FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_audit_log
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  description text NOT NULL,
  performed_by text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_audit_log" ON public.cbq_audit_log;
CREATE POLICY "Public full access cbq_audit_log" ON public.cbq_audit_log FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_audit_logs
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  ticket_code text NOT NULL,
  action text NOT NULL,
  performed_by text NOT NULL,
  changes text NOT NULL
);

ALTER TABLE public.cbq_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_audit_logs" ON public.cbq_audit_logs;
CREATE POLICY "Public full access cbq_audit_logs" ON public.cbq_audit_logs FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_bus_packages
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_bus_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_key text NOT NULL,
  title text NOT NULL,
  months_count integer NOT NULL,
  fee_amount numeric NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  hide_fee boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.cbq_bus_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_bus_packages" ON public.cbq_bus_packages;
CREATE POLICY "Public full access cbq_bus_packages" ON public.cbq_bus_packages FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_bus_registrations
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_bus_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_code text NOT NULL,
  student_name text NOT NULL,
  student_class text NOT NULL,
  student_code text,
  address text NOT NULL,
  distance_km numeric NOT NULL,
  pickup_point text NOT NULL,
  route_type text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  package_type text,
  start_date date,
  end_date date,
  fee_amount numeric,
  status text DEFAULT 'active'::text
);

ALTER TABLE public.cbq_bus_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_bus_registrations" ON public.cbq_bus_registrations;
CREATE POLICY "Public full access cbq_bus_registrations" ON public.cbq_bus_registrations FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_bus_settings
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_bus_settings (
  id SERIAL PRIMARY KEY,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  is_open boolean DEFAULT true,
  notice_message text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_bus_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_bus_settings" ON public.cbq_bus_settings;
CREATE POLICY "Public full access cbq_bus_settings" ON public.cbq_bus_settings FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_chatbot_logs
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_chatbot_logs (
  id SERIAL PRIMARY KEY,
  session_id text NOT NULL,
  user_query text NOT NULL,
  bot_response text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_chatbot_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_chatbot_logs" ON public.cbq_chatbot_logs;
CREATE POLICY "Public full access cbq_chatbot_logs" ON public.cbq_chatbot_logs FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_class_journals
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_class_journals (
  id SERIAL PRIMARY KEY,
  class_name text NOT NULL,
  study_date date DEFAULT CURRENT_DATE NOT NULL,
  period_number integer NOT NULL,
  subject text NOT NULL,
  teacher_name text,
  absent_students text,
  notes text,
  status text DEFAULT 'pending'::text,
  logged_by text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_class_journals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_class_journals" ON public.cbq_class_journals;
CREATE POLICY "Public full access cbq_class_journals" ON public.cbq_class_journals FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_committees
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_committees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.cbq_committees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_committees" ON public.cbq_committees;
CREATE POLICY "Public full access cbq_committees" ON public.cbq_committees FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_departments
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_departments" ON public.cbq_departments;
CREATE POLICY "Public full access cbq_departments" ON public.cbq_departments FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_digital_documents
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_digital_documents (
  id SERIAL PRIMARY KEY,
  document_code text NOT NULL,
  student_name text NOT NULL,
  student_class text NOT NULL,
  document_type text NOT NULL,
  title text NOT NULL,
  content text,
  issue_date date DEFAULT CURRENT_DATE NOT NULL,
  issued_by text NOT NULL,
  status text DEFAULT 'Active'::text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_digital_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_digital_documents" ON public.cbq_digital_documents;
CREATE POLICY "Public full access cbq_digital_documents" ON public.cbq_digital_documents FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_discipline_records
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_discipline_records (
  id SERIAL PRIMARY KEY,
  inspected_class text NOT NULL,
  inspection_date date DEFAULT CURRENT_DATE NOT NULL,
  violation_type text NOT NULL,
  point_deduction integer DEFAULT 0,
  evidence_url text,
  notes text,
  logged_by text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_discipline_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_discipline_records" ON public.cbq_discipline_records;
CREATE POLICY "Public full access cbq_discipline_records" ON public.cbq_discipline_records FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_docs
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_docs (
  id SERIAL PRIMARY KEY,
  title text NOT NULL,
  category text DEFAULT 'Thông báo'::text,
  content text,
  document_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  is_public boolean DEFAULT true,
  author text,
  reference_number text
);

ALTER TABLE public.cbq_docs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_docs" ON public.cbq_docs;
CREATE POLICY "Public full access cbq_docs" ON public.cbq_docs FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_documents
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  file_url text,
  published_date date NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.cbq_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_documents" ON public.cbq_documents;
CREATE POLICY "Public full access cbq_documents" ON public.cbq_documents FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_dossier_categories
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_dossier_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  title text NOT NULL,
  target_type text DEFAULT 'teacher'::text NOT NULL,
  frequency text DEFAULT 'weekly'::text,
  description text,
  is_required boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.cbq_dossier_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_dossier_categories" ON public.cbq_dossier_categories;
CREATE POLICY "Public full access cbq_dossier_categories" ON public.cbq_dossier_categories FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_dossier_inspections
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_dossier_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id uuid,
  inspector_name text NOT NULL,
  inspector_role text DEFAULT 'BGH'::text NOT NULL,
  rating_score text DEFAULT 'Tốt'::text,
  comments text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.cbq_dossier_inspections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_dossier_inspections" ON public.cbq_dossier_inspections;
CREATE POLICY "Public full access cbq_dossier_inspections" ON public.cbq_dossier_inspections FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_dossiers
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_dossiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid,
  category_code text,
  department_name text NOT NULL,
  teacher_name text NOT NULL,
  teacher_code text,
  school_year text DEFAULT '2025-2026'::text NOT NULL,
  term text DEFAULT 'HK1'::text,
  week_number integer DEFAULT 1,
  title text NOT NULL,
  file_url text,
  drive_url text,
  status text DEFAULT 'pending'::text,
  reviewer_name text,
  reviewer_note text,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.cbq_dossiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_dossiers" ON public.cbq_dossiers;
CREATE POLICY "Public full access cbq_dossiers" ON public.cbq_dossiers FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_duty_rosters
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_duty_rosters (
  id SERIAL PRIMARY KEY,
  class_name text NOT NULL,
  duty_date date NOT NULL,
  assigned_students text NOT NULL,
  task_description text,
  is_completed boolean DEFAULT false,
  logged_by text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_duty_rosters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_duty_rosters" ON public.cbq_duty_rosters;
CREATE POLICY "Public full access cbq_duty_rosters" ON public.cbq_duty_rosters FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_emulation_criteria
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_emulation_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  score_change numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_emulation_criteria ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_emulation_criteria" ON public.cbq_emulation_criteria;
CREATE POLICY "Public full access cbq_emulation_criteria" ON public.cbq_emulation_criteria FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_emulation_logs
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_emulation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number integer DEFAULT 1 NOT NULL,
  log_date date DEFAULT CURRENT_DATE NOT NULL,
  student_class text NOT NULL,
  grade_level text,
  criteria_title text NOT NULL,
  category text NOT NULL,
  score_change numeric NOT NULL,
  reason text,
  reporter_name text DEFAULT 'Đội Cờ Đỏ'::text,
  status text DEFAULT 'approved'::text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  student_id uuid
);

ALTER TABLE public.cbq_emulation_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_emulation_logs" ON public.cbq_emulation_logs;
CREATE POLICY "Public full access cbq_emulation_logs" ON public.cbq_emulation_logs FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_emulation_weekly_summary
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_emulation_weekly_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number integer NOT NULL,
  student_class text NOT NULL,
  grade_level text,
  total_deduction integer DEFAULT 0,
  total_bonus integer DEFAULT 0,
  final_score integer DEFAULT 100,
  rank_position integer,
  classification text DEFAULT 'Tốt'::text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  is_locked boolean DEFAULT false
);

ALTER TABLE public.cbq_emulation_weekly_summary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_emulation_weekly_summary" ON public.cbq_emulation_weekly_summary;
CREATE POLICY "Public full access cbq_emulation_weekly_summary" ON public.cbq_emulation_weekly_summary FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_event_attendance
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_event_attendance (
  id SERIAL PRIMARY KEY,
  event_name text NOT NULL,
  event_date date NOT NULL,
  class_name text NOT NULL,
  attended_students text NOT NULL,
  total_attended integer DEFAULT 0,
  logged_by text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_event_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_event_attendance" ON public.cbq_event_attendance;
CREATE POLICY "Public full access cbq_event_attendance" ON public.cbq_event_attendance FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_external_links
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_external_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.cbq_external_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_external_links" ON public.cbq_external_links;
CREATE POLICY "Public full access cbq_external_links" ON public.cbq_external_links FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_fee_campaigns
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_fee_campaigns (
  id SERIAL PRIMARY KEY,
  class_name text NOT NULL,
  campaign_name text NOT NULL,
  amount_per_student integer NOT NULL,
  deadline date,
  created_by text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_fee_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_fee_campaigns" ON public.cbq_fee_campaigns;
CREATE POLICY "Public full access cbq_fee_campaigns" ON public.cbq_fee_campaigns FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_fee_transactions
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_fee_transactions (
  id SERIAL PRIMARY KEY,
  campaign_id integer,
  student_name text NOT NULL,
  amount_paid integer NOT NULL,
  payment_date date DEFAULT CURRENT_DATE NOT NULL,
  payment_method text DEFAULT 'Tiền mặt'::text,
  logged_by text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_fee_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_fee_transactions" ON public.cbq_fee_transactions;
CREATE POLICY "Public full access cbq_fee_transactions" ON public.cbq_fee_transactions FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_feedback_responses
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_feedback_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid,
  organization_unit text NOT NULL,
  representative_name text NOT NULL,
  phone text NOT NULL,
  email text,
  feedback_content text NOT NULL,
  attached_file_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  agreement_level text DEFAULT 'thong_nhat'::text,
  is_verified boolean DEFAULT true
);

ALTER TABLE public.cbq_feedback_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_feedback_responses" ON public.cbq_feedback_responses;
CREATE POLICY "Public full access cbq_feedback_responses" ON public.cbq_feedback_responses FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_feedback_topics
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_feedback_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  dispatch_number text,
  description text NOT NULL,
  deadline timestamp with time zone NOT NULL,
  contact_info text,
  attached_doc_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  is_approved boolean DEFAULT false,
  approved_at timestamp with time zone,
  approved_by text
);

ALTER TABLE public.cbq_feedback_topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_feedback_topics" ON public.cbq_feedback_topics;
CREATE POLICY "Public full access cbq_feedback_topics" ON public.cbq_feedback_topics FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_gallery
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  uploaded_by text,
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_gallery ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_gallery" ON public.cbq_gallery;
CREATE POLICY "Public full access cbq_gallery" ON public.cbq_gallery FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_gifts
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid,
  guest_name text NOT NULL,
  gift_name text NOT NULL,
  gift_icon text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.cbq_gifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_gifts" ON public.cbq_gifts;
CREATE POLICY "Public full access cbq_gifts" ON public.cbq_gifts FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_guestbook
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_guestbook (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  author_category text DEFAULT 'Khách mời'::text NOT NULL,
  content text NOT NULL,
  image_url text,
  likes_count integer DEFAULT 0,
  is_approved boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.cbq_guestbook ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_guestbook" ON public.cbq_guestbook;
CREATE POLICY "Public full access cbq_guestbook" ON public.cbq_guestbook FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_guests
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  phone text,
  invitation_code text,
  rsvp_status text DEFAULT 'pending'::text,
  qr_code text,
  checkin_time timestamp with time zone,
  email text,
  note text
);

ALTER TABLE public.cbq_guests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_guests" ON public.cbq_guests;
CREATE POLICY "Public full access cbq_guests" ON public.cbq_guests FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_magazines
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_magazines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  pdf_url text,
  cover_image text,
  pages jsonb DEFAULT '[]'::jsonb,
  toc jsonb DEFAULT '[]'::jsonb,
  is_published boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_magazines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_magazines" ON public.cbq_magazines;
CREATE POLICY "Public full access cbq_magazines" ON public.cbq_magazines FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_navigation_menus
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_navigation_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text DEFAULT 'public'::text NOT NULL,
  parent_group text,
  label text NOT NULL,
  path text NOT NULL,
  icon text,
  permission_key text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_navigation_menus ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_navigation_menus" ON public.cbq_navigation_menus;
CREATE POLICY "Public full access cbq_navigation_menus" ON public.cbq_navigation_menus FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_news
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  published_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.cbq_news ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_news" ON public.cbq_news;
CREATE POLICY "Public full access cbq_news" ON public.cbq_news FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_notifications
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  task_id uuid
);

ALTER TABLE public.cbq_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_notifications" ON public.cbq_notifications;
CREATE POLICY "Public full access cbq_notifications" ON public.cbq_notifications FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_pages
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.cbq_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_pages" ON public.cbq_pages;
CREATE POLICY "Public full access cbq_pages" ON public.cbq_pages FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_parking_packages
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_parking_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_key text NOT NULL,
  title text NOT NULL,
  months_count integer DEFAULT 1,
  fee_amount numeric DEFAULT 50000 NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  hide_fee boolean DEFAULT false,
  applicable_vehicles text[] DEFAULT '{}'::text[]
);

ALTER TABLE public.cbq_parking_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_parking_packages" ON public.cbq_parking_packages;
CREATE POLICY "Public full access cbq_parking_packages" ON public.cbq_parking_packages FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_parking_registrations
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_parking_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_code text NOT NULL,
  student_name text NOT NULL,
  student_code text,
  student_class text NOT NULL,
  grade_level text,
  license_plate text NOT NULL,
  vehicle_type text DEFAULT 'Xe máy điện'::text,
  vehicle_color text,
  package_type text DEFAULT 'month'::text NOT NULL,
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  fee_amount numeric DEFAULT 0,
  status text DEFAULT 'active'::text,
  note text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  student_id uuid
);

ALTER TABLE public.cbq_parking_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_parking_registrations" ON public.cbq_parking_registrations;
CREATE POLICY "Public full access cbq_parking_registrations" ON public.cbq_parking_registrations FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_parking_settings
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_parking_settings (
  id SERIAL PRIMARY KEY,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  is_open boolean DEFAULT true,
  notice_message text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_parking_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_parking_settings" ON public.cbq_parking_settings;
CREATE POLICY "Public full access cbq_parking_settings" ON public.cbq_parking_settings FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_performances
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_performances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_name text NOT NULL,
  contact_info text,
  performance_type text NOT NULL,
  performance_name text NOT NULL,
  description text,
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_performances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_performances" ON public.cbq_performances;
CREATE POLICY "Public full access cbq_performances" ON public.cbq_performances FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_quiz_questions
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid,
  question_text text NOT NULL,
  question_type text DEFAULT 'multiple_choice'::text,
  options jsonb DEFAULT '[]'::jsonb,
  correct_option_index integer DEFAULT 0,
  points integer DEFAULT 10,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.cbq_quiz_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_quiz_questions" ON public.cbq_quiz_questions;
CREATE POLICY "Public full access cbq_quiz_questions" ON public.cbq_quiz_questions FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_quiz_submissions
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_quiz_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid,
  student_name text NOT NULL,
  student_group text,
  student_code text,
  phone text,
  score numeric DEFAULT 0,
  essay_score numeric DEFAULT 0,
  total_score numeric DEFAULT 0,
  answers jsonb DEFAULT '{}'::jsonb,
  essay_answer text,
  time_taken_seconds integer DEFAULT 0,
  is_graded boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.cbq_quiz_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_quiz_submissions" ON public.cbq_quiz_submissions;
CREATE POLICY "Public full access cbq_quiz_submissions" ON public.cbq_quiz_submissions FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_quizzes
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  time_limit_minutes integer DEFAULT 15,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  start_time text,
  end_time text,
  show_leaderboard boolean DEFAULT true
);

ALTER TABLE public.cbq_quizzes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_quizzes" ON public.cbq_quizzes;
CREATE POLICY "Public full access cbq_quizzes" ON public.cbq_quizzes FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_registration_campaigns
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_registration_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  target_grades text[],
  form_schema jsonb DEFAULT '[]'::jsonb NOT NULL,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_registration_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_registration_campaigns" ON public.cbq_registration_campaigns;
CREATE POLICY "Public full access cbq_registration_campaigns" ON public.cbq_registration_campaigns FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_schedules
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  week_number integer DEFAULT 1,
  start_date date,
  end_date date,
  bgh_duty text,
  teacher_duty text,
  schedule_items jsonb DEFAULT '[]'::jsonb,
  note text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_schedules" ON public.cbq_schedules;
CREATE POLICY "Public full access cbq_schedules" ON public.cbq_schedules FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_scholarship_feedback
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_scholarship_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_unit text NOT NULL,
  representative_name text NOT NULL,
  phone text NOT NULL,
  email text,
  feedback_content text NOT NULL,
  attached_file_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_scholarship_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_scholarship_feedback" ON public.cbq_scholarship_feedback;
CREATE POLICY "Public full access cbq_scholarship_feedback" ON public.cbq_scholarship_feedback FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_sponsors
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  donation_amount numeric DEFAULT 0,
  donation_item text,
  date_received timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_public boolean DEFAULT true
);

ALTER TABLE public.cbq_sponsors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_sponsors" ON public.cbq_sponsors;
CREATE POLICY "Public full access cbq_sponsors" ON public.cbq_sponsors FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_sports_registrations
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_sports_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text,
  sport_name text,
  phone text,
  cohort_year text,
  unit_name text,
  user_category text DEFAULT 'Cựu học sinh'::text,
  table_group text DEFAULT 'Bảng A'::text,
  fee_paid boolean DEFAULT false,
  fee_amount numeric DEFAULT 300000,
  is_approved boolean DEFAULT true,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  payment_status text DEFAULT 'Chờ nộp kinh phí'::text
);

ALTER TABLE public.cbq_sports_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_sports_registrations" ON public.cbq_sports_registrations;
CREATE POLICY "Public full access cbq_sports_registrations" ON public.cbq_sports_registrations FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_staff
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text,
  department text NOT NULL,
  avatar_url text,
  email text,
  phone text,
  bio text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_staff" ON public.cbq_staff;
CREATE POLICY "Public full access cbq_staff" ON public.cbq_staff FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_student_registrations
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_student_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid,
  student_code text NOT NULL,
  student_name text NOT NULL,
  student_class text,
  responses jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_student_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_student_registrations" ON public.cbq_student_registrations;
CREATE POLICY "Public full access cbq_student_registrations" ON public.cbq_student_registrations FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_student_users
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_student_users (
  id SERIAL PRIMARY KEY,
  username text NOT NULL,
  password text NOT NULL,
  full_name text NOT NULL,
  student_class text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  role text DEFAULT 'member'::text
);

ALTER TABLE public.cbq_student_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_student_users" ON public.cbq_student_users;
CREATE POLICY "Public full access cbq_student_users" ON public.cbq_student_users FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_students
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_code text NOT NULL,
  student_name text NOT NULL,
  student_class text NOT NULL,
  grade_level text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_students" ON public.cbq_students;
CREATE POLICY "Public full access cbq_students" ON public.cbq_students FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_task_comments
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid,
  user_email text NOT NULL,
  content text NOT NULL,
  attachment_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.cbq_task_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_task_comments" ON public.cbq_task_comments;
CREATE POLICY "Public full access cbq_task_comments" ON public.cbq_task_comments FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_tasks
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  assignee text NOT NULL,
  responsible text NOT NULL,
  deadline timestamp with time zone NOT NULL,
  location text NOT NULL,
  expected_result text NOT NULL,
  progress integer DEFAULT 0,
  status text DEFAULT 'pending'::text,
  committee_id uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  budget_estimate numeric DEFAULT 0,
  notes text
);

ALTER TABLE public.cbq_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_tasks" ON public.cbq_tasks;
CREATE POLICY "Public full access cbq_tasks" ON public.cbq_tasks FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_teacher_users
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_teacher_users (
  id SERIAL PRIMARY KEY,
  username text NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  homeroom_class text,
  phone_number text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_teacher_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_teacher_users" ON public.cbq_teacher_users;
CREATE POLICY "Public full access cbq_teacher_users" ON public.cbq_teacher_users FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_timetable_items
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_timetable_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_class varchar(255) NOT NULL,
  day_of_week varchar(255) NOT NULL,
  period integer NOT NULL,
  subject varchar(255) NOT NULL,
  teacher_name varchar(255) NOT NULL,
  room varchar(255) DEFAULT 'Lớp học'::character varying,
  school_year varchar(255) DEFAULT '2025-2026'::character varying,
  term varchar(255) DEFAULT 'HK1'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.cbq_timetable_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_timetable_items" ON public.cbq_timetable_items;
CREATE POLICY "Public full access cbq_timetable_items" ON public.cbq_timetable_items FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_user_roles
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_user_roles (
  user_id uuid NOT NULL,
  role text DEFAULT 'committee_member'::text NOT NULL,
  committee_id uuid,
  permissions jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.cbq_user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_user_roles" ON public.cbq_user_roles;
CREATE POLICY "Public full access cbq_user_roles" ON public.cbq_user_roles FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_votes
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid,
  voter_name text,
  voter_code text NOT NULL,
  device_token text,
  created_at timestamp with time zone DEFAULT now(),
  voting_id uuid,
  student_code text,
  student_name text,
  student_class text,
  option_id text
);

ALTER TABLE public.cbq_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_votes" ON public.cbq_votes;
CREATE POLICY "Public full access cbq_votes" ON public.cbq_votes FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_voting_entries
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_voting_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author_name text NOT NULL,
  category text DEFAULT 'Chung'::text,
  image_url text,
  description text,
  votes_count integer DEFAULT 0,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.cbq_voting_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_voting_entries" ON public.cbq_voting_entries;
CREATE POLICY "Public full access cbq_voting_entries" ON public.cbq_voting_entries FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_wishes
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_wishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid,
  guest_name text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.cbq_wishes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_wishes" ON public.cbq_wishes;
CREATE POLICY "Public full access cbq_wishes" ON public.cbq_wishes FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: cbq_youth_union_funds
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cbq_youth_union_funds (
  id SERIAL PRIMARY KEY,
  class_name text NOT NULL,
  transaction_date date DEFAULT CURRENT_DATE NOT NULL,
  amount numeric NOT NULL,
  transaction_type text NOT NULL,
  description text NOT NULL,
  logged_by text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.cbq_youth_union_funds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access cbq_youth_union_funds" ON public.cbq_youth_union_funds;
CREATE POLICY "Public full access cbq_youth_union_funds" ON public.cbq_youth_union_funds FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: departments
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access departments" ON public.departments;
CREATE POLICY "Public full access departments" ON public.departments FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: heads
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.heads (
  department text NOT NULL,
  password text NOT NULL,
  failed_attempts integer DEFAULT 0,
  locked_until timestamp with time zone
);

ALTER TABLE public.heads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access heads" ON public.heads;
CREATE POLICY "Public full access heads" ON public.heads FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: secretaries
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.secretaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  password text NOT NULL,
  departments text[] DEFAULT '{}'::text[],
  failed_attempts integer DEFAULT 0,
  locked_until timestamp with time zone
);

ALTER TABLE public.secretaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access secretaries" ON public.secretaries;
CREATE POLICY "Public full access secretaries" ON public.secretaries FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: settings
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
  id text PRIMARY KEY,
  points jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access settings" ON public.settings;
CREATE POLICY "Public full access settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------
-- TABLE: teachers
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teachers (
  cccd text NOT NULL,
  password text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  failed_attempts integer DEFAULT 0,
  locked_until timestamp with time zone
);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access teachers" ON public.teachers;
CREATE POLICY "Public full access teachers" ON public.teachers FOR ALL USING (true) WITH CHECK (true);

