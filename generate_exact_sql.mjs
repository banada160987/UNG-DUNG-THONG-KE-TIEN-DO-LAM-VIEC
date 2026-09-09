import fs from 'fs';

const rawData = `table_name,column_name,data_type,is_nullable,column_default
access_logs,id,uuid,NO,gen_random_uuid()
access_logs,username,text,NO,null
access_logs,role,text,NO,null
access_logs,ip_address,text,YES,null
access_logs,user_agent,text,YES,null
access_logs,status,text,NO,null
access_logs,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
audit_logs,id,uuid,NO,uuid_generate_v4()
audit_logs,actor,text,NO,null
audit_logs,action_type,text,NO,null
audit_logs,target_id,text,NO,null
audit_logs,old_data,jsonb,YES,null
audit_logs,new_data,jsonb,YES,null
audit_logs,created_at,timestamp with time zone,YES,now()
batches,id,uuid,NO,gen_random_uuid()
batches,created_at,timestamp with time zone,NO,"timezone('utc'::text, now())"
batches,name,text,NO,null
batches,type,text,NO,null
batches,quota,integer,NO,null
batches,deadline,text,NO,null
batches,isActive,boolean,YES,true
candidate_logs,id,uuid,NO,gen_random_uuid()
candidate_logs,created_at,timestamp with time zone,NO,"timezone('utc'::text, now())"
candidate_logs,candidate_id,uuid,YES,null
candidate_logs,actor_role,text,NO,null
candidate_logs,actor_name,text,NO,null
candidate_logs,action,text,NO,null
candidate_logs,notes,text,YES,null
candidates,id,uuid,NO,gen_random_uuid()
candidates,created_at,timestamp with time zone,NO,"timezone('utc'::text, now())"
candidates,batch_id,uuid,YES,null
candidates,status,text,YES,'draft'::text
candidates,cccd,text,NO,null
candidates,fullName,text,NO,null
candidates,dob,text,YES,null
candidates,gender,text,YES,null
candidates,ethnicity,text,YES,null
candidates,phone,text,YES,null
candidates,unit,text,YES,null
candidates,currentTitle,text,YES,null
candidates,targetTitle,text,YES,null
candidates,feedback_message,text,YES,null
candidates,decisionRecruitment,jsonb,YES,"'{\""date\"\": \"\"\", \"\"issuer\"\": \"\"\", \"\"number\"\": \"\"\"}'::jsonb"
candidates,decisionProbation,jsonb,YES,"'{\""date\"\": \"\"\", \"\"issuer\"\": \"\"\", \"\"number\"\": \"\"\"}'::jsonb"
candidates,decisionAppointment,jsonb,YES,"'{\""date\"\": \"\"\", \"\"issuer\"\": \"\"\", \"\"number\"\": \"\"\"}'::jsonb"
candidates,decisionSalary,jsonb,YES,"'{\""date\"\": \"\"\", \"\"issuer\"\": \"\"\", \"\"number\"\": \"\"\"}'::jsonb"
candidates,degrees,jsonb,YES,'[]'::jsonb
candidates,resumeDoc,boolean,YES,false
candidates,certIT,boolean,YES,false
candidates,certLanguage,boolean,YES,false
candidates,reviewDoc,boolean,YES,false
candidates,achievements,jsonb,YES,'[]'::jsonb
candidates,files,jsonb,YES,'[]'::jsonb
candidates,workplace,text,YES,null
candidates,certEthnic,boolean,YES,null
candidates,certificates,jsonb,YES,'[]'::jsonb
candidates,evalMinute,boolean,YES,false
candidates,ratingSheets,boolean,YES,false
cbq_academic_reports,id,integer,NO,nextval('cbq_academic_reports_id_seq'::regclass)
cbq_academic_reports,class_name,text,NO,null
cbq_academic_reports,report_date,date,NO,CURRENT_DATE
cbq_academic_reports,subject,text,NO,null
cbq_academic_reports,missing_homework_students,text,YES,null
cbq_academic_reports,not_memorized_students,text,YES,null
cbq_academic_reports,notes,text,YES,null
cbq_academic_reports,logged_by,text,NO,null
cbq_academic_reports,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_agenda,id,uuid,NO,gen_random_uuid()
cbq_agenda,time_start,text,NO,null
cbq_agenda,time_end,text,NO,null
cbq_agenda,activity_name,text,NO,null
cbq_agenda,location,text,YES,null
cbq_agenda,is_public,boolean,YES,true
cbq_agenda,order_index,integer,YES,0
cbq_agenda,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_audit_log,id,uuid,NO,gen_random_uuid()
cbq_audit_log,action,text,NO,null
cbq_audit_log,description,text,NO,null
cbq_audit_log,performed_by,text,YES,null
cbq_audit_log,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_audit_logs,id,uuid,NO,gen_random_uuid()
cbq_audit_logs,created_at,timestamp with time zone,NO,"timezone('utc'::text, now())"
cbq_audit_logs,entity_type,text,NO,null
cbq_audit_logs,entity_id,uuid,NO,null
cbq_audit_logs,ticket_code,text,NO,null
cbq_audit_logs,action,text,NO,null
cbq_audit_logs,performed_by,text,NO,null
cbq_audit_logs,changes,text,NO,null
cbq_bus_packages,id,uuid,NO,uuid_generate_v4()
cbq_bus_packages,package_key,text,NO,null
cbq_bus_packages,title,text,NO,null
cbq_bus_packages,months_count,integer,NO,null
cbq_bus_packages,fee_amount,numeric,NO,null
cbq_bus_packages,description,text,YES,null
cbq_bus_packages,sort_order,integer,YES,0
cbq_bus_packages,is_active,boolean,YES,true
cbq_bus_packages,hide_fee,boolean,YES,false
cbq_bus_packages,created_at,timestamp with time zone,YES,now()
cbq_bus_registrations,id,uuid,NO,gen_random_uuid()
cbq_bus_registrations,ticket_code,text,NO,null
cbq_bus_registrations,student_name,text,NO,null
cbq_bus_registrations,student_class,text,NO,null
cbq_bus_registrations,student_code,text,YES,null
cbq_bus_registrations,address,text,NO,null
cbq_bus_registrations,distance_km,numeric,NO,null
cbq_bus_registrations,pickup_point,text,NO,null
cbq_bus_registrations,route_type,text,NO,null
cbq_bus_registrations,created_at,timestamp with time zone,NO,"timezone('utc'::text, now())"
cbq_bus_registrations,package_type,text,YES,null
cbq_bus_registrations,start_date,date,YES,null
cbq_bus_registrations,end_date,date,YES,null
cbq_bus_registrations,fee_amount,numeric,YES,null
cbq_bus_registrations,status,text,YES,'active'::text
cbq_bus_settings,id,integer,NO,1
cbq_bus_settings,start_time,timestamp with time zone,YES,null
cbq_bus_settings,end_time,timestamp with time zone,YES,null
cbq_bus_settings,is_open,boolean,YES,true
cbq_bus_settings,notice_message,text,YES,null
cbq_bus_settings,updated_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_chatbot_logs,id,integer,NO,nextval('cbq_chatbot_logs_id_seq'::regclass)
cbq_chatbot_logs,session_id,text,NO,null
cbq_chatbot_logs,user_query,text,NO,null
cbq_chatbot_logs,bot_response,text,NO,null
cbq_chatbot_logs,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_class_journals,id,integer,NO,nextval('cbq_class_journals_id_seq'::regclass)
cbq_class_journals,class_name,text,NO,null
cbq_class_journals,study_date,date,NO,CURRENT_DATE
cbq_class_journals,period_number,integer,NO,null
cbq_class_journals,subject,text,NO,null
cbq_class_journals,teacher_name,text,YES,null
cbq_class_journals,absent_students,text,YES,null
cbq_class_journals,notes,text,YES,null
cbq_class_journals,status,text,YES,'pending'::text
cbq_class_journals,logged_by,text,NO,null
cbq_class_journals,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_committees,id,uuid,NO,uuid_generate_v4()
cbq_committees,name,text,NO,null
cbq_committees,description,text,YES,null
cbq_committees,created_at,timestamp with time zone,NO,"timezone('utc'::text, now())"
cbq_departments,id,uuid,NO,gen_random_uuid()
cbq_departments,name,text,NO,null
cbq_departments,description,text,YES,null
cbq_departments,sort_order,integer,YES,0
cbq_departments,is_active,boolean,YES,true
cbq_departments,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_digital_documents,id,integer,NO,nextval('cbq_digital_documents_id_seq'::regclass)
cbq_digital_documents,document_code,text,NO,null
cbq_digital_documents,student_name,text,NO,null
cbq_digital_documents,student_class,text,NO,null
cbq_digital_documents,document_type,text,NO,null
cbq_digital_documents,title,text,NO,null
cbq_digital_documents,content,text,YES,null
cbq_digital_documents,issue_date,date,NO,CURRENT_DATE
cbq_digital_documents,issued_by,text,NO,null
cbq_digital_documents,status,text,YES,'Active'::text
cbq_digital_documents,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_discipline_records,id,integer,NO,nextval('cbq_discipline_records_id_seq'::regclass)
cbq_discipline_records,inspected_class,text,NO,null
cbq_discipline_records,inspection_date,date,NO,CURRENT_DATE
cbq_discipline_records,violation_type,text,NO,null
cbq_discipline_records,point_deduction,integer,YES,0
cbq_discipline_records,evidence_url,text,YES,null
cbq_discipline_records,notes,text,YES,null
cbq_discipline_records,logged_by,text,NO,null
cbq_discipline_records,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_docs,id,integer,NO,nextval('cbq_docs_id_seq'::regclass)
cbq_docs,title,text,NO,null
cbq_docs,category,text,YES,'Thông báo'::text
cbq_docs,content,text,YES,null
cbq_docs,document_url,text,YES,null
cbq_docs,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_docs,is_public,boolean,YES,true
cbq_docs,author,text,YES,null
cbq_docs,reference_number,text,YES,null
cbq_documents,id,uuid,NO,uuid_generate_v4()
cbq_documents,title,text,NO,null
cbq_documents,file_url,text,YES,null
cbq_documents,published_date,date,NO,null
cbq_documents,created_at,timestamp with time zone,NO,"timezone('utc'::text, now())"
cbq_dossier_categories,id,uuid,NO,gen_random_uuid()
cbq_dossier_categories,code,text,NO,null
cbq_dossier_categories,title,text,NO,null
cbq_dossier_categories,target_type,text,NO,'teacher'::text
cbq_dossier_categories,frequency,text,YES,'weekly'::text
cbq_dossier_categories,description,text,YES,null
cbq_dossier_categories,is_required,boolean,YES,true
cbq_dossier_categories,created_at,timestamp with time zone,YES,now()
cbq_dossier_inspections,id,uuid,NO,gen_random_uuid()
cbq_dossier_inspections,dossier_id,uuid,YES,null
cbq_dossier_inspections,inspector_name,text,NO,null
cbq_dossier_inspections,inspector_role,text,NO,'BGH'::text
cbq_dossier_inspections,rating_score,text,YES,'Tốt'::text
cbq_dossier_inspections,comments,text,YES,null
cbq_dossier_inspections,created_at,timestamp with time zone,YES,now()
cbq_dossiers,id,uuid,NO,gen_random_uuid()
cbq_dossiers,category_id,uuid,YES,null
cbq_dossiers,category_code,text,YES,null
cbq_dossiers,department_name,text,NO,null
cbq_dossiers,teacher_name,text,NO,null
cbq_dossiers,teacher_code,text,YES,null
cbq_dossiers,school_year,text,NO,'2025-2026'::text
cbq_dossiers,term,text,YES,'HK1'::text
cbq_dossiers,week_number,integer,YES,1
cbq_dossiers,title,text,NO,null
cbq_dossiers,file_url,text,YES,null
cbq_dossiers,drive_url,text,YES,null
cbq_dossiers,status,text,YES,'pending'::text
cbq_dossiers,reviewer_name,text,YES,null
cbq_dossiers,reviewer_note,text,YES,null
cbq_dossiers,reviewed_at,timestamp with time zone,YES,null
cbq_dossiers,created_at,timestamp with time zone,YES,now()
cbq_dossiers,updated_at,timestamp with time zone,YES,now()
cbq_duty_rosters,id,integer,NO,nextval('cbq_duty_rosters_id_seq'::regclass)
cbq_duty_rosters,class_name,text,NO,null
cbq_duty_rosters,duty_date,date,NO,null
cbq_duty_rosters,assigned_students,text,NO,null
cbq_duty_rosters,task_description,text,YES,null
cbq_duty_rosters,is_completed,boolean,YES,false
cbq_duty_rosters,logged_by,text,NO,null
cbq_duty_rosters,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_emulation_criteria,id,uuid,NO,gen_random_uuid()
cbq_emulation_criteria,category,text,NO,null
cbq_emulation_criteria,title,text,NO,null
cbq_emulation_criteria,score_change,numeric,NO,null
cbq_emulation_criteria,is_active,boolean,YES,true
cbq_emulation_criteria,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_emulation_logs,id,uuid,NO,gen_random_uuid()
cbq_emulation_logs,week_number,integer,NO,1
cbq_emulation_logs,log_date,date,NO,CURRENT_DATE
cbq_emulation_logs,student_class,text,NO,null
cbq_emulation_logs,grade_level,text,YES,null
cbq_emulation_logs,criteria_title,text,NO,null
cbq_emulation_logs,category,text,NO,null
cbq_emulation_logs,score_change,numeric,NO,null
cbq_emulation_logs,reason,text,YES,null
cbq_emulation_logs,reporter_name,text,YES,'Đội Cờ Đỏ'::text
cbq_emulation_logs,status,text,YES,'approved'::text
cbq_emulation_logs,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_emulation_logs,student_id,uuid,YES,null
cbq_emulation_weekly_summary,id,uuid,NO,gen_random_uuid()
cbq_emulation_weekly_summary,week_number,integer,NO,null
cbq_emulation_weekly_summary,student_class,text,NO,null
cbq_emulation_weekly_summary,grade_level,text,YES,null
cbq_emulation_weekly_summary,total_deduction,integer,YES,0
cbq_emulation_weekly_summary,total_bonus,integer,YES,0
cbq_emulation_weekly_summary,final_score,integer,YES,100
cbq_emulation_weekly_summary,rank_position,integer,YES,null
cbq_emulation_weekly_summary,classification,text,YES,'Tốt'::text
cbq_emulation_weekly_summary,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_emulation_weekly_summary,is_locked,boolean,YES,false
cbq_event_attendance,id,integer,NO,nextval('cbq_event_attendance_id_seq'::regclass)
cbq_event_attendance,event_name,text,NO,null
cbq_event_attendance,event_date,date,NO,null
cbq_event_attendance,class_name,text,NO,null
cbq_event_attendance,attended_students,text,NO,null
cbq_event_attendance,total_attended,integer,YES,0
cbq_event_attendance,logged_by,text,NO,null
cbq_event_attendance,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_external_links,id,uuid,NO,uuid_generate_v4()
cbq_external_links,title,text,NO,null
cbq_external_links,url,text,NO,null
cbq_external_links,order_index,integer,YES,0
cbq_external_links,is_active,boolean,YES,true
cbq_external_links,created_at,timestamp with time zone,NO,"timezone('utc'::text, now())"
cbq_fee_campaigns,id,integer,NO,nextval('cbq_fee_campaigns_id_seq'::regclass)
cbq_fee_campaigns,class_name,text,NO,null
cbq_fee_campaigns,campaign_name,text,NO,null
cbq_fee_campaigns,amount_per_student,integer,NO,null
cbq_fee_campaigns,deadline,date,YES,null
cbq_fee_campaigns,created_by,text,NO,null
cbq_fee_campaigns,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_fee_transactions,id,integer,NO,nextval('cbq_fee_transactions_id_seq'::regclass)
cbq_fee_transactions,campaign_id,integer,YES,null
cbq_fee_transactions,student_name,text,NO,null
cbq_fee_transactions,amount_paid,integer,NO,null
cbq_fee_transactions,payment_date,date,NO,CURRENT_DATE
cbq_fee_transactions,payment_method,text,YES,'Tiền mặt'::text
cbq_fee_transactions,logged_by,text,NO,null
cbq_fee_transactions,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_feedback_responses,id,uuid,NO,gen_random_uuid()
cbq_feedback_responses,topic_id,uuid,YES,null
cbq_feedback_responses,organization_unit,text,NO,null
cbq_feedback_responses,representative_name,text,NO,null
cbq_feedback_responses,phone,text,NO,null
cbq_feedback_responses,email,text,YES,null
cbq_feedback_responses,feedback_content,text,NO,null
cbq_feedback_responses,attached_file_url,text,YES,null
cbq_feedback_responses,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_feedback_responses,agreement_level,text,YES,'thong_nhat'::text
cbq_feedback_responses,is_verified,boolean,YES,true
cbq_feedback_topics,id,uuid,NO,gen_random_uuid()
cbq_feedback_topics,title,text,NO,null
cbq_feedback_topics,dispatch_number,text,YES,null
cbq_feedback_topics,description,text,NO,null
cbq_feedback_topics,deadline,timestamp with time zone,NO,null
cbq_feedback_topics,contact_info,text,YES,null
cbq_feedback_topics,attached_doc_url,text,YES,null
cbq_feedback_topics,is_active,boolean,YES,true
cbq_feedback_topics,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_feedback_topics,is_approved,boolean,YES,false
cbq_feedback_topics,approved_at,timestamp with time zone,YES,null
cbq_feedback_topics,approved_by,text,YES,null
cbq_gallery,id,uuid,NO,gen_random_uuid()
cbq_gallery,image_url,text,NO,null
cbq_gallery,uploaded_by,text,YES,null
cbq_gallery,is_approved,boolean,YES,false
cbq_gallery,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_gifts,id,uuid,NO,gen_random_uuid()
cbq_gifts,guest_id,uuid,YES,null
cbq_gifts,guest_name,text,NO,null
cbq_gifts,gift_name,text,NO,null
cbq_gifts,gift_icon,text,NO,null
cbq_gifts,created_at,timestamp with time zone,YES,now()
cbq_guestbook,id,uuid,NO,gen_random_uuid()
cbq_guestbook,author_name,text,NO,null
cbq_guestbook,author_category,text,NO,'Khách mời'::text
cbq_guestbook,content,text,NO,null
cbq_guestbook,image_url,text,YES,null
cbq_guestbook,likes_count,integer,YES,0
cbq_guestbook,is_approved,boolean,YES,true
cbq_guestbook,created_at,timestamp with time zone,YES,now()
cbq_guests,id,uuid,NO,uuid_generate_v4()
cbq_guests,name,text,NO,null
cbq_guests,category,text,YES,null
cbq_guests,phone,text,YES,null
cbq_guests,invitation_code,text,YES,null
cbq_guests,rsvp_status,text,YES,'pending'::text
cbq_guests,qr_code,text,YES,null
cbq_guests,checkin_time,timestamp with time zone,YES,null
cbq_guests,email,text,YES,null
cbq_guests,note,text,YES,null
cbq_magazines,id,uuid,NO,gen_random_uuid()
cbq_magazines,title,text,NO,null
cbq_magazines,description,text,YES,null
cbq_magazines,pdf_url,text,YES,null
cbq_magazines,cover_image,text,YES,null
cbq_magazines,pages,jsonb,YES,'[]'::jsonb
cbq_magazines,toc,jsonb,YES,'[]'::jsonb
cbq_magazines,is_published,boolean,YES,true
cbq_magazines,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_magazines,updated_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_navigation_menus,id,uuid,NO,gen_random_uuid()
cbq_navigation_menus,target_type,text,NO,'public'::text
cbq_navigation_menus,parent_group,text,YES,null
cbq_navigation_menus,label,text,NO,null
cbq_navigation_menus,path,text,NO,null
cbq_navigation_menus,icon,text,YES,null
cbq_navigation_menus,permission_key,text,YES,null
cbq_navigation_menus,sort_order,integer,YES,0
cbq_navigation_menus,is_active,boolean,YES,true
cbq_navigation_menus,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_news,id,uuid,NO,uuid_generate_v4()
cbq_news,title,text,NO,null
cbq_news,content,text,NO,null
cbq_news,image_url,text,YES,null
cbq_news,published_at,timestamp with time zone,NO,"timezone('utc'::text, now())"
cbq_notifications,id,uuid,NO,uuid_generate_v4()
cbq_notifications,committee_id,uuid,YES,null
cbq_notifications,title,text,NO,null
cbq_notifications,message,text,NO,null
cbq_notifications,is_read,boolean,YES,false
cbq_notifications,created_at,timestamp with time zone,NO,"timezone('utc'::text, now())"
cbq_notifications,task_id,uuid,YES,null
cbq_pages,id,uuid,NO,uuid_generate_v4()
cbq_pages,slug,text,NO,null
cbq_pages,title,text,NO,null
cbq_pages,content,text,NO,null
cbq_pages,updated_at,timestamp with time zone,NO,"timezone('utc'::text, now())"
cbq_parking_packages,id,uuid,NO,gen_random_uuid()
cbq_parking_packages,package_key,text,NO,null
cbq_parking_packages,title,text,NO,null
cbq_parking_packages,months_count,integer,YES,1
cbq_parking_packages,fee_amount,numeric,NO,50000
cbq_parking_packages,description,text,YES,null
cbq_parking_packages,sort_order,integer,YES,0
cbq_parking_packages,is_active,boolean,YES,true
cbq_parking_packages,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_parking_packages,hide_fee,boolean,YES,false
cbq_parking_packages,applicable_vehicles,ARRAY,YES,'{}'::text[]
cbq_parking_registrations,id,uuid,NO,gen_random_uuid()
cbq_parking_registrations,ticket_code,text,NO,null
cbq_parking_registrations,student_name,text,NO,null
cbq_parking_registrations,student_code,text,YES,null
cbq_parking_registrations,student_class,text,NO,null
cbq_parking_registrations,grade_level,text,YES,null
cbq_parking_registrations,license_plate,text,NO,null
cbq_parking_registrations,vehicle_type,text,YES,'Xe máy điện'::text
cbq_parking_registrations,vehicle_color,text,YES,null
cbq_parking_registrations,package_type,text,NO,'month'::text
cbq_parking_registrations,start_date,date,YES,CURRENT_DATE
cbq_parking_registrations,end_date,date,YES,null
cbq_parking_registrations,fee_amount,numeric,YES,0
cbq_parking_registrations,status,text,YES,'active'::text
cbq_parking_registrations,note,text,YES,null
cbq_parking_registrations,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_parking_registrations,updated_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_parking_registrations,student_id,uuid,YES,null
cbq_parking_settings,id,integer,NO,1
cbq_parking_settings,start_time,timestamp with time zone,YES,null
cbq_parking_settings,end_time,timestamp with time zone,YES,null
cbq_parking_settings,is_open,boolean,YES,true
cbq_parking_settings,notice_message,text,YES,null
cbq_parking_settings,updated_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_performances,id,uuid,NO,gen_random_uuid()
cbq_performances,applicant_name,text,NO,null
cbq_performances,contact_info,text,YES,null
cbq_performances,performance_type,text,NO,null
cbq_performances,performance_name,text,NO,null
cbq_performances,description,text,YES,null
cbq_performances,is_approved,boolean,YES,false
cbq_performances,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_quiz_questions,id,uuid,NO,gen_random_uuid()
cbq_quiz_questions,quiz_id,uuid,YES,null
cbq_quiz_questions,question_text,text,NO,null
cbq_quiz_questions,question_type,text,YES,'multiple_choice'::text
cbq_quiz_questions,options,jsonb,YES,'[]'::jsonb
cbq_quiz_questions,correct_option_index,integer,YES,0
cbq_quiz_questions,points,integer,YES,10
cbq_quiz_questions,order_index,integer,YES,0
cbq_quiz_questions,created_at,timestamp with time zone,YES,now()
cbq_quiz_submissions,id,uuid,NO,gen_random_uuid()
cbq_quiz_submissions,quiz_id,uuid,YES,null
cbq_quiz_submissions,student_name,text,NO,null
cbq_quiz_submissions,student_group,text,YES,null
cbq_quiz_submissions,student_code,text,YES,null
cbq_quiz_submissions,phone,text,YES,null
cbq_quiz_submissions,score,numeric,YES,0
cbq_quiz_submissions,essay_score,numeric,YES,0
cbq_quiz_submissions,total_score,numeric,YES,0
cbq_quiz_submissions,answers,jsonb,YES,'{}'::jsonb
cbq_quiz_submissions,essay_answer,text,YES,null
cbq_quiz_submissions,time_taken_seconds,integer,YES,0
cbq_quiz_submissions,is_graded,boolean,YES,false
cbq_quiz_submissions,created_at,timestamp with time zone,YES,now()
cbq_quizzes,id,uuid,NO,gen_random_uuid()
cbq_quizzes,title,text,NO,null
cbq_quizzes,description,text,YES,null
cbq_quizzes,time_limit_minutes,integer,YES,15
cbq_quizzes,is_active,boolean,YES,true
cbq_quizzes,created_at,timestamp with time zone,YES,now()
cbq_quizzes,start_time,text,YES,null
cbq_quizzes,end_time,text,YES,null
cbq_quizzes,show_leaderboard,boolean,YES,true
cbq_registration_campaigns,id,uuid,NO,gen_random_uuid()
cbq_registration_campaigns,title,text,NO,null
cbq_registration_campaigns,description,text,YES,null
cbq_registration_campaigns,target_grades,ARRAY,YES,null
cbq_registration_campaigns,form_schema,jsonb,NO,'[]'::jsonb
cbq_registration_campaigns,start_date,timestamp with time zone,YES,null
cbq_registration_campaigns,end_date,timestamp with time zone,YES,null
cbq_registration_campaigns,is_active,boolean,YES,true
cbq_registration_campaigns,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_schedules,id,uuid,NO,gen_random_uuid()
cbq_schedules,title,text,NO,null
cbq_schedules,week_number,integer,YES,1
cbq_schedules,start_date,date,YES,null
cbq_schedules,end_date,date,YES,null
cbq_schedules,bgh_duty,text,YES,null
cbq_schedules,teacher_duty,text,YES,null
cbq_schedules,schedule_items,jsonb,YES,'[]'::jsonb
cbq_schedules,note,text,YES,null
cbq_schedules,is_active,boolean,YES,true
cbq_schedules,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_schedules,updated_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_scholarship_feedback,id,uuid,NO,gen_random_uuid()
cbq_scholarship_feedback,organization_unit,text,NO,null
cbq_scholarship_feedback,representative_name,text,NO,null
cbq_scholarship_feedback,phone,text,NO,null
cbq_scholarship_feedback,email,text,YES,null
cbq_scholarship_feedback,feedback_content,text,NO,null
cbq_scholarship_feedback,attached_file_url,text,YES,null
cbq_scholarship_feedback,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_sponsors,id,uuid,NO,uuid_generate_v4()
cbq_sponsors,name,text,NO,null
cbq_sponsors,donation_amount,numeric,YES,0
cbq_sponsors,donation_item,text,YES,null
cbq_sponsors,date_received,timestamp with time zone,NO,"timezone('utc'::text, now())"
cbq_sponsors,is_public,boolean,YES,true
cbq_sports_registrations,id,uuid,NO,gen_random_uuid()
cbq_sports_registrations,full_name,text,YES,null
cbq_sports_registrations,sport_name,text,YES,null
cbq_sports_registrations,phone,text,YES,null
cbq_sports_registrations,cohort_year,text,YES,null
cbq_sports_registrations,unit_name,text,YES,null
cbq_sports_registrations,user_category,text,YES,'Cựu học sinh'::text
cbq_sports_registrations,table_group,text,YES,'Bảng A'::text
cbq_sports_registrations,fee_paid,boolean,YES,false
cbq_sports_registrations,fee_amount,numeric,YES,300000
cbq_sports_registrations,is_approved,boolean,YES,true
cbq_sports_registrations,notes,text,YES,null
cbq_sports_registrations,created_at,timestamp with time zone,YES,now()
cbq_sports_registrations,payment_status,text,YES,'Chờ nộp kinh phí'::text
cbq_staff,id,uuid,NO,gen_random_uuid()
cbq_staff,name,text,NO,null
cbq_staff,title,text,YES,null
cbq_staff,department,text,NO,null
cbq_staff,avatar_url,text,YES,null
cbq_staff,email,text,YES,null
cbq_staff,phone,text,YES,null
cbq_staff,bio,text,YES,null
cbq_staff,sort_order,integer,YES,0
cbq_staff,is_active,boolean,YES,true
cbq_staff,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_student_registrations,id,uuid,NO,gen_random_uuid()
cbq_student_registrations,campaign_id,uuid,YES,null
cbq_student_registrations,student_code,text,NO,null
cbq_student_registrations,student_name,text,NO,null
cbq_student_registrations,student_class,text,YES,null
cbq_student_registrations,responses,jsonb,NO,'{}'::jsonb
cbq_student_registrations,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_student_users,id,integer,NO,nextval('cbq_student_users_id_seq'::regclass)
cbq_student_users,username,text,NO,null
cbq_student_users,password,text,NO,null
cbq_student_users,full_name,text,NO,null
cbq_student_users,student_class,text,NO,null
cbq_student_users,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_student_users,role,text,YES,'member'::text
cbq_students,id,uuid,NO,gen_random_uuid()
cbq_students,student_code,text,NO,null
cbq_students,student_name,text,NO,null
cbq_students,student_class,text,NO,null
cbq_students,grade_level,text,YES,null
cbq_students,is_active,boolean,YES,true
cbq_students,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_task_comments,id,uuid,NO,uuid_generate_v4()
cbq_task_comments,task_id,uuid,YES,null
cbq_task_comments,user_email,text,NO,null
cbq_task_comments,content,text,NO,null
cbq_task_comments,attachment_url,text,YES,null
cbq_task_comments,created_at,timestamp with time zone,NO,"timezone('utc'::text, now())"
cbq_tasks,id,uuid,NO,uuid_generate_v4()
cbq_tasks,title,text,NO,null
cbq_tasks,assignee,text,NO,null
cbq_tasks,responsible,text,NO,null
cbq_tasks,deadline,timestamp with time zone,NO,null
cbq_tasks,location,text,NO,null
cbq_tasks,expected_result,text,NO,null
cbq_tasks,progress,integer,YES,0
cbq_tasks,status,text,YES,'pending'::text
cbq_tasks,committee_id,uuid,YES,null
cbq_tasks,created_at,timestamp with time zone,NO,"timezone('utc'::text, now())"
cbq_tasks,updated_at,timestamp with time zone,NO,"timezone('utc'::text, now())"
cbq_tasks,budget_estimate,numeric,YES,0
cbq_tasks,notes,text,YES,null
cbq_teacher_users,id,integer,NO,nextval('cbq_teacher_users_id_seq'::regclass)
cbq_teacher_users,username,text,NO,null
cbq_teacher_users,password_hash,text,NO,null
cbq_teacher_users,full_name,text,NO,null
cbq_teacher_users,homeroom_class,text,YES,null
cbq_teacher_users,phone_number,text,YES,null
cbq_teacher_users,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
cbq_timetable_items,id,uuid,NO,gen_random_uuid()
cbq_timetable_items,student_class,character varying,NO,null
cbq_timetable_items,day_of_week,character varying,NO,null
cbq_timetable_items,period,integer,NO,null
cbq_timetable_items,subject,character varying,NO,null
cbq_timetable_items,teacher_name,character varying,NO,null
cbq_timetable_items,room,character varying,YES,'Lớp học'::character varying
cbq_timetable_items,school_year,character varying,YES,'2025-2026'::character varying
cbq_timetable_items,term,character varying,YES,'HK1'::character varying
cbq_timetable_items,created_at,timestamp with time zone,YES,now()
cbq_timetable_items,updated_at,timestamp with time zone,YES,now()
cbq_user_roles,user_id,uuid,NO,null
cbq_user_roles,role,text,NO,'committee_member'::text
cbq_user_roles,committee_id,uuid,YES,null
cbq_user_roles,permissions,jsonb,YES,'{}'::jsonb
cbq_votes,id,uuid,NO,gen_random_uuid()
cbq_votes,entry_id,uuid,YES,null
cbq_votes,voter_name,text,YES,null
cbq_votes,voter_code,text,NO,null
cbq_votes,device_token,text,YES,null
cbq_votes,created_at,timestamp with time zone,YES,now()
cbq_votes,voting_id,uuid,YES,null
cbq_votes,student_code,text,YES,null
cbq_votes,student_name,text,YES,null
cbq_votes,student_class,text,YES,null
cbq_votes,option_id,text,YES,null
cbq_voting_entries,id,uuid,NO,gen_random_uuid()
cbq_voting_entries,title,text,NO,null
cbq_voting_entries,author_name,text,NO,null
cbq_voting_entries,category,text,YES,'Chung'::text
cbq_voting_entries,image_url,text,YES,null
cbq_voting_entries,description,text,YES,null
cbq_voting_entries,votes_count,integer,YES,0
cbq_voting_entries,order_index,integer,YES,0
cbq_voting_entries,is_active,boolean,YES,true
cbq_voting_entries,created_at,timestamp with time zone,YES,now()
cbq_wishes,id,uuid,NO,gen_random_uuid()
cbq_wishes,guest_id,uuid,YES,null
cbq_wishes,guest_name,text,NO,null
cbq_wishes,message,text,NO,null
cbq_wishes,created_at,timestamp with time zone,YES,now()
cbq_youth_union_funds,id,integer,NO,nextval('cbq_youth_union_funds_id_seq'::regclass)
cbq_youth_union_funds,class_name,text,NO,null
cbq_youth_union_funds,transaction_date,date,NO,CURRENT_DATE
cbq_youth_union_funds,amount,numeric,NO,null
cbq_youth_union_funds,transaction_type,text,NO,null
cbq_youth_union_funds,description,text,NO,null
cbq_youth_union_funds,logged_by,text,NO,null
cbq_youth_union_funds,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
departments,id,uuid,NO,gen_random_uuid()
departments,name,text,NO,null
heads,department,text,NO,null
heads,password,text,NO,null
heads,failed_attempts,integer,YES,0
heads,locked_until,timestamp with time zone,YES,null
secretaries,id,uuid,NO,gen_random_uuid()
secretaries,username,text,NO,null
secretaries,password,text,NO,null
secretaries,departments,ARRAY,YES,'{}'::text[]
secretaries,failed_attempts,integer,YES,0
secretaries,locked_until,timestamp with time zone,YES,null
settings,id,text,NO,null
settings,points,jsonb,NO,'{}'::jsonb
settings,updated_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
teachers,cccd,text,NO,null
teachers,password,text,NO,null
teachers,created_at,timestamp with time zone,YES,"timezone('utc'::text, now())"
teachers,failed_attempts,integer,YES,0
teachers,locked_until,timestamp with time zone,YES,null

function generateSQL() {
  const lines = rawData.split('\n').filter(l => l.trim().length > 0);
  const rows = lines.slice(1);
  const tables = {};

  rows.forEach(r => {
    const parts = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < r.length; i++) {
      const c = r[i];
      if (c === '"') inQuotes = !inQuotes;
      else if (c === ',' && !inQuotes) {
        parts.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    parts.push(cur.trim());

    if (parts.length >= 5) {
      const [tableName, colName, dataType, isNullable, colDefault] = parts;
      if (!tables[tableName]) tables[tableName] = [];
      tables[tableName].push({
        colName,
        dataType,
        isNullable: isNullable === 'YES',
        colDefault: colDefault === 'null' ? null : colDefault
      });
    }
  });

  let sqlOutput = `-- ==========================================================\n`;
  sqlOutput += `-- EXACT SUPABASE 1 SCHEMA DUMP (FIXED SYNTAX & JSON DEFAULTS)\n`;
  sqlOutput += `-- Total Tables Found: ${Object.keys(tables).length}\n`;
  sqlOutput += `-- Generated: ${new Date().toISOString()}\n`;
  sqlOutput += `-- ==========================================================\n\n`;

  sqlOutput += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n`;

  for (const [tName, cols] of Object.entries(tables)) {
    sqlOutput += `-- --------------------------------------------------\n`;
    sqlOutput += `-- TABLE: ${tName}\n`;
    sqlOutput += `-- --------------------------------------------------\n`;
    sqlOutput += `CREATE TABLE IF NOT EXISTS public.${tName} (\n`;

    const colDefs = cols.map(c => {
      let typeStr = c.dataType;
      if (typeStr === 'ARRAY') typeStr = 'text[]';
      if (typeStr === 'character varying') typeStr = 'varchar(255)';

      let def = '';

      if (c.colName === 'id') {
        if (c.dataType === 'uuid') {
          def = `  id uuid PRIMARY KEY DEFAULT gen_random_uuid()`;
        } else if (c.dataType === 'integer' || c.dataType === 'bigint') {
          def = `  id SERIAL PRIMARY KEY`;
        } else {
          def = `  ${c.colName} ${typeStr} PRIMARY KEY`;
        }
      } else {
        def = `  ${c.colName} ${typeStr}`;
        if (c.colDefault) {
          let d = c.colDefault;
          if (d.includes('nextval(')) {
            // bỏ qua
          } else {
            // Sửa cú pháp default JSONB nếu bị lỗi ngoặc đơn
            if (d.startsWith("'{") && d.endsWith("}'::jsonb")) {
              d = "'{}'::jsonb";
            }
            def += ` DEFAULT ${d}`;
          }
        }
        if (!c.isNullable) {
          def += ` NOT NULL`;
        }
      }
      return def;
    });

    sqlOutput += colDefs.join(',\n');
    sqlOutput += `\n);\n\n`;

    sqlOutput += `ALTER TABLE public.${tName} ENABLE ROW LEVEL SECURITY;\n`;
    sqlOutput += `DROP POLICY IF EXISTS "Public full access ${tName}" ON public.${tName};\n`;
    sqlOutput += `CREATE POLICY "Public full access ${tName}" ON public.${tName} FOR ALL USING (true) WITH CHECK (true);\n\n`;
  }

  fs.writeFileSync('master_setup_supabase2_exact.sql', sqlOutput, 'utf-8');
  console.log(`Successfully generated master_setup_supabase2_exact.sql for ${Object.keys(tables).length} tables!`);
}

generateSQL();
