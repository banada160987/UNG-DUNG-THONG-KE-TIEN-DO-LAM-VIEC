import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Search, MapPin, Clock, ChevronRight, Download,
  GraduationCap, Briefcase, Users, Calendar, BookOpen,
  FileText, Award, Bike, Heart, CheckCircle2, ShieldCheck,
  Sparkles, ExternalLink, ArrowRight, UserCheck, Key, Lock,
  FileBadge, Compass, Video, LayoutDashboard, ChevronDown,
  ShieldAlert, Cpu, Layers, Smartphone, Gamepad2, FolderLock,
  FileSpreadsheet, Check, School
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { 
  getTeacherSession, 
  getStudentSession, 
  clearTeacherSession, 
  clearStudentSession 
} from '../services/authSessionManager';

const removeAccents = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
};

const FALLBACK_SLIDER_IMAGES = [
  { id: 'f1', image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80', uploaded_by: 'Kỷ niệm 30 năm THPT Cao Bá Quát' },
  { id: 'f2', image_url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop&q=80', uploaded_by: 'Lễ Khai Giảng & Kỷ Niệm' },
  { id: 'f3', image_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop&q=80', uploaded_by: 'Thư Viện Nhà Trường' },
  { id: 'f4', image_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80', uploaded_by: 'Hội Thao Học Sinh' },
  { id: 'f5', image_url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80', uploaded_by: 'Hoạt Động Ngoại Khóa' }
];

const ECOSYSTEM_TABS = [
  { id: 'all', label: '🏛️ Tất Cả', count: 22 },
  { id: 'ai', label: '🤖 Trí Tuệ Nhân Tạo AI', count: 5 },
  { id: 'admin', label: '🏫 Quản Trị BGH', count: 6 },
  { id: 'teacher', label: '👨‍🏫 Sư Phạm Giáo Viên', count: 6 },
  { id: 'student', label: '🧑‍🎓 Không Gian Học Sinh', count: 5 }
];

const ECOSYSTEM_MODULES = [
  // --- NHÓM 1: TRÍ TUỆ NHÂN TẠO (AI) & CHUẨN NGHỊ ĐỊNH 30 ---
  {
    id: 'ai-meeting',
    group: 'ai',
    groupName: 'Trí Tuệ Nhân Tạo AI',
    title: 'Thư Ký Biên Bản Cuộc Họp Bằng AI',
    icon: '🎙️',
    roleType: 'admin',
    roleBadge: '🔒 Yêu cầu: BGH & Thư Ký',
    roleBadgeColor: '#fee2e2',
    roleTextColor: '#991b1b',
    roleBorderColor: '#fecaca',
    desc: 'Tự động hóa 100% công tác thư ký cuộc họp Hội đồng Sư phạm, Giao ban BGH và Sinh hoạt chi bộ bằng AI Gemini Multimodal.',
    highlights: [
      'Ghi âm trực tiếp hoặc nạp file âm thanh (.mp3, .m4a, .wav).',
      'AI nhận diện giọng nói tiếng Việt, tự động phân vai diễn giả.',
      'Trích xuất Ma trận phân công việc (Action Items) có thời hạn.',
      'Xuất file Word (.doc) chuẩn 100% Nghị định 30 (tiền tố số thứ tự 1-...).'
    ],
    isInternal: true
  },
  {
    id: 'ai-latendoc',
    group: 'ai',
    groupName: 'Trí Tuệ Nhân Tạo AI',
    title: 'Studio Soạn Thảo Nghị Định 30 (Latendoc)',
    icon: '📑',
    roleType: 'teacher',
    roleBadge: '🔒 Yêu cầu: Cán Bộ & Giáo Viên',
    roleBadgeColor: '#e0f2fe',
    roleTextColor: '#0369a1',
    roleBorderColor: '#bae6fd',
    desc: 'Chuẩn hóa toàn diện thể thức văn bản hành chính sư phạm theo đúng quy chuẩn Nghị định 30/2020/NĐ-CP của Chính phủ.',
    highlights: [
      'Kho mẫu chuẩn: Giấy mời, Quyết định, Tờ trình, Kế hoạch...',
      'Thẩm định thể thức (Audit) & Tự động sửa lỗi 1-chạm (Auto-Fix).',
      'Trợ lý Deep Polish biên tập văn phong công vụ mạch lạc.',
      'Xuất file Word A4 chuẩn trang in, đúng kiểu chữ và khoảng cách lề.'
    ],
    isInternal: true
  },
  {
    id: 'ai-grad-audit',
    group: 'ai',
    groupName: 'Trí Tuệ Nhân Tạo AI',
    title: 'Trợ Lý AI Thẩm Định Hồ Sơ Tốt Nghiệp THPT',
    icon: '🎓',
    roleType: 'admin',
    roleBadge: '🔒 Yêu cầu: BGH & GVCN Khối 12',
    roleBadgeColor: '#fee2e2',
    roleTextColor: '#991b1b',
    roleBorderColor: '#fecaca',
    desc: 'Đối soát chéo dữ liệu thí sinh dự thi tốt nghiệp THPT tự động bằng trí tuệ nhân tạo, loại bỏ triệt để sai sót hồ sơ.',
    highlights: [
      'So khớp dữ liệu CCCD, Học bạ số, Giấy khai sinh và Ưu tiên.',
      'Cảnh báo tức thì trường hợp lệch dấu tiếng Việt, sai ngày sinh.',
      'Đảm bảo dữ liệu chính xác 100% trước khi đồng bộ lên Bộ GD&ĐT.'
    ],
    isInternal: true
  },
  {
    id: 'ai-maquette',
    group: 'ai',
    groupName: 'Trí Tuệ Nhân Tạo AI',
    title: 'Trợ Lý AI Thiết Kế Ma-két & Phông Sự Kiện',
    icon: '🎨',
    roleType: 'admin',
    roleBadge: '🔒 Yêu cầu: BGH & Văn Phòng',
    roleBadgeColor: '#fee2e2',
    roleTextColor: '#991b1b',
    roleBorderColor: '#fecaca',
    desc: 'Quy trình đồ họa AI 2 lớp tạo phông sân khấu, backdrop đại hội, banner và giấy khen chuẩn hành chính trường học.',
    highlights: [
      'Sinh nền đồ họa AI nghệ thuật độ phân giải cao theo chủ đề.',
      'Phủ typography tiếng Việt hành chính chuẩn xác 100% bằng Pillow.',
      'Xuất bản file in ấn khổ lớn phục vụ đại lễ, hội nghị và khai giảng.'
    ],
    isInternal: true
  },
  {
    id: 'ai-advisor-2plus2',
    group: 'ai',
    groupName: 'Trí Tuệ Nhân Tạo AI',
    title: 'Cố Vấn Hướng Nghiệp & Chọn Tổ Hợp Môn 2+2',
    icon: '🧭',
    roleType: 'student',
    roleBadge: '🟡 Yêu cầu: Học Sinh Đang Học',
    roleBadgeColor: '#fef3c7',
    roleTextColor: '#92400e',
    roleBorderColor: '#fde68a',
    desc: 'Hệ thống AI phân tích học lực, sở thích và định hướng nghề nghiệp giúp học sinh lựa chọn tổ hợp môn thi tốt nghiệp 2025.',
    highlights: [
      'Phân tích tương quan tổ hợp môn tự chọn với các ngành đại học.',
      'Dự báo điểm chuẩn và gợi ý lộ trình ôn tập cá nhân hóa.',
      'Báo cáo định hướng nghề nghiệp trực quan gửi cho học sinh và phụ huynh.'
    ],
    isInternal: true
  },

  // --- NHÓM 2: ĐIỀU HÀNH & QUẢN TRỊ BGH ---
  {
    id: 'bgh-calendar',
    group: 'admin',
    groupName: 'Điều Hành Ban Giám Hiệu',
    title: 'Lịch Công Tác BGH & Thời Khóa Biểu Tuần',
    icon: '📅',
    roleType: 'public',
    roleBadge: '🌐 Dịch Vụ Mở Toàn Dân',
    roleBadgeColor: '#dcfce7',
    roleTextColor: '#166534',
    roleBorderColor: '#86efac',
    desc: 'Lịch công tác Ban Giám hiệu, kế hoạch chuyên môn tuần và thời khóa biểu số cập nhật tức thì theo thời gian thực.',
    highlights: [
      'Công khai lịch họp, lịch công tác ngoại khóa và trực tuần.',
      'Tích hợp Thời khóa biểu 34 lớp học và lịch báo giảng giáo viên.',
      'Tải file Excel lịch công tác tuần với tiền tố số thứ tự chuẩn.'
    ],
    isInternal: false,
    publicUrl: '/lich-cong-tac'
  },
  {
    id: 'bgh-ranking',
    group: 'admin',
    groupName: 'Điều Hành Ban Giám Hiệu',
    title: 'Sổ Chấm Điểm Thi Đua Trực Tuần 34 Lớp',
    icon: '📋',
    roleType: 'public',
    roleBadge: '🌐 Dịch Vụ Mở Toàn Dân',
    roleBadgeColor: '#dcfce7',
    roleTextColor: '#166534',
    roleBorderColor: '#86efac',
    desc: 'Hệ thống số hóa bảng chấm điểm thi đua nề nếp, tác phong, vệ sinh và chuyên cần của 34 tập thể lớp.',
    highlights: [
      'Đội Cờ đỏ và Ban Thi đua chấm điểm trực tiếp bằng điện thoại.',
      'Bảng xếp hạng thi đua cập nhật tự động hàng tuần minh bạch.',
      'Tuyên dương lớp dẫn đầu và phân tích lỗi vi phạm để uốn nắn kịp thời.'
    ],
    isInternal: false,
    publicUrl: '/cham-diem-thi-dua'
  },
  {
    id: 'bgh-feedback',
    group: 'admin',
    groupName: 'Điều Hành Ban Giám Hiệu',
    title: 'Cổng Tiếp Nhận Ý Kiến & Hòm Thư Góp Ý BGH',
    icon: '💌',
    roleType: 'public',
    roleBadge: '🌐 Dịch Vụ Mở Toàn Dân',
    roleBadgeColor: '#dcfce7',
    roleTextColor: '#166534',
    roleBorderColor: '#86efac',
    desc: 'Kênh giao tiếp 2 chiều trực tiếp giữa Ban Giám hiệu với cán bộ, giáo viên, phụ huynh và nhân dân.',
    highlights: [
      'Gửi phản ánh, đề xuất cải tiến và giải pháp phát triển trường.',
      'Cơ chế bảo mật thông tin người gửi, hỗ trợ gửi phản ánh ẩn danh.',
      'Ban Giám hiệu theo dõi tiến độ xử lý và phản hồi công khai thỏa đáng.'
    ],
    isInternal: false,
    publicUrl: '/hom-thu-hoc-sinh'
  },
  {
    id: 'bgh-drives',
    group: 'admin',
    groupName: 'Điều Hành Ban Giám Hiệu',
    title: 'Quản Lý 8 Cây Thư Mục Tổ Chuyên Môn 4 Tầng',
    icon: '🌳',
    roleType: 'admin',
    roleBadge: '🔒 Yêu cầu: BGH & Tổ Trưởng',
    roleBadgeColor: '#fee2e2',
    roleTextColor: '#991b1b',
    roleBorderColor: '#fecaca',
    desc: 'Cấu trúc quản lý tài liệu chuyên môn 8 tổ theo chuẩn Google Drive 4 tầng khoa học, bảo mật và phân quyền linh hoạt.',
    highlights: [
      'Phân cấp 4 tầng: Năm học ➔ Tổ chuyên môn ➔ Bộ môn ➔ Giáo viên.',
      'Lưu trữ Kế hoạch dạy học, biên bản sinh hoạt tổ, SKKN.',
      'Giám sát tiến độ nộp hồ sơ sổ sách sư phạm từng tổ tức thời.'
    ],
    isInternal: true
  },
  {
    id: 'bgh-online-meeting',
    group: 'admin',
    groupName: 'Điều Hành Ban Giám Hiệu',
    title: 'Hệ Thống Điểm Danh & Thống Kê Họp Trực Tuyến',
    icon: '💻',
    roleType: 'admin',
    roleBadge: '🔒 Yêu cầu: Ban Giám Hiệu',
    roleBadgeColor: '#fee2e2',
    roleTextColor: '#991b1b',
    roleBorderColor: '#fecaca',
    desc: 'Điểm danh đại biểu, giáo viên tham dự các hội nghị, tập huấn và họp Hội đồng sư phạm qua QR Code động.',
    highlights: [
      'Quét mã QR xác nhận tham dự trong 1 giây trên điện thoại cá nhân.',
      'Báo cáo tỷ lệ tham dự, danh sách vắng có phép và không phép.',
      'Tích hợp biểu quyết điện tử (Online Voting) lấy ý kiến tức thời.'
    ],
    isInternal: true
  },
  {
    id: 'bgh-clubs',
    group: 'admin',
    groupName: 'Điều Hành Ban Giám Hiệu',
    title: 'Quản Lý Điểm Danh Hoạt Động & CLB Học Sinh',
    icon: '🎯',
    roleType: 'admin',
    roleBadge: '🔒 Yêu cầu: BGH & Đoàn Trường',
    roleBadgeColor: '#fee2e2',
    roleTextColor: '#991b1b',
    roleBorderColor: '#fecaca',
    desc: 'Quản lý đăng ký thành viên, lịch sinh hoạt và điểm danh tham gia các CLB học thuật, văn hóa, thể thao.',
    highlights: [
      'Theo dõi tiến độ sinh hoạt của hơn 10 Câu lạc bộ kỹ năng.',
      'Điểm danh sinh hoạt câu lạc bộ bằng mã học sinh hoặc quét thẻ.',
      'Tích lũy điểm rèn luyện ngoại khóa phục vụ đánh giá cuối năm.'
    ],
    isInternal: true
  },

  // --- NHÓM 3: SƯ PHẠM & GIÁO VIÊN BỘ MÔN ---
  {
    id: 'gv-baogiang',
    group: 'teacher',
    groupName: 'Sư Phạm & Giáo Viên',
    title: 'Quản Lý Lịch Báo Giảng & Lịch Dạy Giáo Viên',
    icon: '📅',
    roleType: 'teacher',
    roleBadge: '🔒 Yêu cầu: Cán Bộ & Giáo Viên',
    roleBadgeColor: '#e0f2fe',
    roleTextColor: '#0369a1',
    roleBorderColor: '#bae6fd',
    desc: 'Lập kế hoạch giảng dạy, báo giảng tuần tự động đồng bộ theo Thời khóa biểu và phân phối chương trình GDPT 2018.',
    highlights: [
      'Khởi tạo lịch báo giảng tuần 1 chạm từ phân phối chương trình.',
      'Quản lý tiết dạy bù, dạy thay, nghỉ phép có thẩm định từ Tổ trưởng.',
      'Xuất sổ báo giảng định kỳ gửi BGH kiểm tra đúng quy chuẩn.'
    ],
    isInternal: true
  },
  {
    id: 'gv-exam-bank',
    group: 'teacher',
    groupName: 'Sư Phạm & Giáo Viên',
    title: 'Ngân Hàng Đề Thi & Trộn Đề Chuẩn GDPT 2018',
    icon: '✏️',
    roleType: 'teacher',
    roleBadge: '🔒 Yêu cầu: Cán Bộ & Giáo Viên',
    roleBadgeColor: '#e0f2fe',
    roleTextColor: '#0369a1',
    roleBorderColor: '#bae6fd',
    desc: 'Soạn thảo ma trận đề thi, trích xuất câu hỏi 3 dạng thức mới của Bộ GD&ĐT và xáo đề trắc nghiệm thông minh.',
    highlights: [
      'Đầy đủ 3 phần: Trắc nghiệm 4 lựa chọn, Đúng/Sai, Trả lời ngắn.',
      'Tự động xáo đề và phương án, sinh nhiều mã đề kèm đáp án.',
      'Xuất file Word chuẩn in ấn kèm phiếu trả lời trắc nghiệm OMR.'
    ],
    isInternal: true
  },
  {
    id: 'gv-sodaubai',
    group: 'teacher',
    groupName: 'Sư Phạm & Giáo Viên',
    title: 'Sổ Đầu Bài Điện Tử & Ký Số Giáo Viên',
    icon: '📖',
    roleType: 'teacher',
    roleBadge: '🔒 Yêu cầu: Cán Bộ & Giáo Viên',
    roleBadgeColor: '#e0f2fe',
    roleTextColor: '#0369a1',
    roleBorderColor: '#bae6fd',
    desc: 'Thay thế hoàn toàn sổ đầu bài giấy truyền thống bằng hệ thống sổ đầu bài điện tử ký xác nhận trực tuyến.',
    highlights: [
      'Ghi nhận tiết dạy, nề nếp và xếp loại tiết học trong 30 giây.',
      'Ký số xác nhận tiết dạy đảm bảo tính pháp lý và chống tẩy xóa.',
      'Ban Giám hiệu theo dõi tiến độ ghi sổ đầu bài 34 lớp thời gian thực.'
    ],
    isInternal: true
  },
  {
    id: 'gv-giaoan-5512',
    group: 'teacher',
    groupName: 'Sư Phạm & Giáo Viên',
    title: 'Kho Kế Hoạch Bài Dạy (Giáo Án Công Văn 5512)',
    icon: '📂',
    roleType: 'teacher',
    roleBadge: '🔒 Yêu cầu: Cán Bộ & Giáo Viên',
    roleBadgeColor: '#e0f2fe',
    roleTextColor: '#0369a1',
    roleBorderColor: '#bae6fd',
    desc: 'Kho lưu trữ, chia sẻ và phê duyệt kế hoạch bài dạy điện tử theo cấu trúc Công văn 5512/BGDĐT-GDTrH.',
    highlights: [
      'Tải lên và quản lý giáo án điện tử theo từng khối lớp và tổ.',
      'Tổ trưởng và BGH duyệt giáo án trực tuyến kèm nhận xét.',
      'Tra cứu, tái sử dụng học liệu và giáo án tham khảo liên môn.'
    ],
    isInternal: true
  },
  {
    id: 'gv-dvc-approval',
    group: 'teacher',
    groupName: 'Sư Phạm & Giáo Viên',
    title: 'Cổng Tiếp Nhận & Thẩm Định Dịch Vụ Công',
    icon: '🏛️',
    roleType: 'teacher',
    roleBadge: '🔒 Yêu cầu: BGH & GVCN',
    roleBadgeColor: '#e0f2fe',
    roleTextColor: '#0369a1',
    roleBorderColor: '#bae6fd',
    desc: 'Xử lý và phê duyệt đơn xin nghỉ phép, đơn xin giấy xác nhận học sinh và các thủ tục hành chính trực tuyến.',
    highlights: [
      'Tiếp nhận đơn nghỉ phép điện tử từ phụ huynh, thông báo tức thì.',
      'Phê duyệt và cấp giấy xác nhận học sinh có mã QR chứng thực số.',
      'Thống kê ngày nghỉ phép của học sinh toàn trường minh bạch.'
    ],
    isInternal: true
  },
  {
    id: 'gv-chat-internal',
    group: 'teacher',
    groupName: 'Sư Phạm & Giáo Viên',
    title: 'Kênh Chat & Trao Đổi Chuyên Môn Nội Bộ',
    icon: '💬',
    roleType: 'teacher',
    roleBadge: '🔒 Yêu cầu: Cán Bộ & Giáo Viên',
    roleBadgeColor: '#e0f2fe',
    roleTextColor: '#0369a1',
    roleBorderColor: '#bae6fd',
    desc: 'Môi trường giao tiếp nội bộ bảo mật cao phục vụ trao đổi chuyên môn, gửi thông báo khẩn và hội ý sư phạm.',
    highlights: [
      'Phòng chat chuyên môn theo từng tổ: Toán, Văn, Ngoại ngữ, KHTN...',
      'Thông báo điều hành tức thì từ Lãnh đạo nhà trường tới hội đồng.',
      'Chia sẻ tệp tài liệu, biên bản và kế hoạch dung lượng lớn an toàn.'
    ],
    isInternal: true
  },

  // --- NHÓM 4: KHÔNG GIAN HỌC SINH & PHỤ HUYNH ---
  {
    id: 'hs-online-exam',
    group: 'student',
    groupName: 'Không Gian Học Sinh',
    title: 'Phòng Thi & Kiểm Tra Đánh Giá Trực Tuyến 2018',
    icon: '📝',
    roleType: 'student',
    roleBadge: '🟡 Yêu cầu: Học Sinh Đang Học',
    roleBadgeColor: '#fef3c7',
    roleTextColor: '#92400e',
    roleBorderColor: '#fde68a',
    desc: 'Hệ thống thi thử, làm bài kiểm tra thường xuyên và định kỳ trên nền tảng web chống gian lận.',
    highlights: [
      'Giao diện trực quan, hỗ trợ công thức Toán, Hóa và Audio Tiếng Anh.',
      'Chấm điểm tự động và giải thích chi tiết đáp án ngay khi nộp.',
      'Thống kê phổ điểm, chỉ ra phần kiến thức học sinh còn yếu để ôn luyện.'
    ],
    isInternal: true
  },
  {
    id: 'hs-public-dvc',
    group: 'student',
    groupName: 'Không Gian Học Sinh',
    title: 'Cổng Dịch Vụ Công Trực Tuyến Học Đường 4.0',
    icon: '🏛️',
    roleType: 'public',
    roleBadge: '🌐 Toàn Trường & Phụ Huynh',
    roleBadgeColor: '#dcfce7',
    roleTextColor: '#166534',
    roleBorderColor: '#86efac',
    desc: 'Phụ huynh và học sinh nộp hồ sơ xin nghỉ phép, xin cấp giấy xác nhận học sinh 100% qua mạng.',
    highlights: [
      'Nộp đơn nghỉ phép có lý do kèm minh chứng (khám bệnh, gia đình).',
      'Đăng ký xin cấp giấy xác nhận học sinh làm hồ sơ học phí, xe bus.',
      'Tra cứu tình trạng xử lý hồ sơ hành chính theo thời gian thực.'
    ],
    isInternal: false,
    publicUrl: '/dich-vu-cong'
  },
  {
    id: 'hs-bepsang',
    group: 'student',
    groupName: 'Không Gian Học Sinh',
    title: 'Điểm Tâm Sáng CBQ (Tiếp Sức Học Đường)',
    icon: '🍳',
    roleType: 'public',
    roleBadge: '🌐 Phụ Huynh & Học Sinh',
    roleBadgeColor: '#dcfce7',
    roleTextColor: '#166534',
    roleBorderColor: '#86efac',
    desc: 'Tiện ích đăng ký và quản lý suất ăn sáng đảm bảo dinh dưỡng và an toàn thực phẩm tại trường.',
    highlights: [
      'Đăng ký trước 06h30 mỗi sáng ngày học qua giao diện điện thoại.',
      'Thực đơn đa dạng, kiểm soát calo và kiểm định nguồn gốc.',
      'Quản lý sổ nhận suất ăn không dùng tiền mặt tiện lợi và minh bạch.'
    ],
    isInternal: false,
    publicUrl: '/bep-sang'
  },
  {
    id: 'hs-diploma',
    group: 'student',
    groupName: 'Không Gian Học Sinh',
    title: 'Tra Cứu Văn Bằng Số & Học Bạ Điện Tử',
    icon: '📜',
    roleType: 'public',
    roleBadge: '🌐 Dịch Vụ Mở Toàn Dân',
    roleBadgeColor: '#dcfce7',
    roleTextColor: '#166534',
    roleBorderColor: '#86efac',
    desc: 'Cổng tra cứu thông tin tốt nghiệp THPT, số hiệu bằng tốt nghiệp và hồ sơ học bạ số của các khóa học sinh.',
    highlights: [
      'Tra cứu bằng số CCCD, Họ tên hoặc Số vào sổ cấp bằng.',
      'Xuất giấy xác nhận thông tin văn bằng điện tử có mã QR đối soát.',
      'Hỗ trợ trường Đại học và cơ quan tuyển dụng xác minh tính xác thực.'
    ],
    isInternal: false,
    publicUrl: '/tra-cuu-van-bang'
  },
  {
    id: 'hs-dass21',
    group: 'student',
    groupName: 'Không Gian Học Sinh',
    title: 'Hòm Thư Tâm Lý Học Đường & Khảo Sát DASS-21',
    icon: '💌',
    roleType: 'student',
    roleBadge: '🟡 Yêu cầu: Học Sinh Đang Học',
    roleBadgeColor: '#fef3c7',
    roleTextColor: '#92400e',
    roleBorderColor: '#fde68a',
    desc: 'Không gian tư vấn tâm lý học đường, tiếp nhận tâm tư tuổi mới lớn và bộ công cụ trắc nghiệm tâm lý DASS-21.',
    highlights: [
      'Thực hiện bài trắc nghiệm sàng lọc lo âu, trầm cảm, căng thẳng DASS-21.',
      'Nhận lời khuyên từ Thầy Cô Ban Tư vấn qua hộp thư riêng tư.',
      'Cam kết giữ bí mật danh tính tuyệt đối cho học sinh.'
    ],
    isInternal: true
  }
];

export default function PublicHome() {
  const [sponsors, setSponsors] = useState([]);
  const [news, setNews] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [quizLeaderboard, setQuizLeaderboard] = useState([]);
  const [quizInfo, setQuizInfo] = useState(null);
  const [galleryList, setGalleryList] = useState(FALLBACK_SLIDER_IMAGES);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rsvpCode, setRsvpCode] = useState('');
  const [rsvpResult, setRsvpResult] = useState(null);
  const [inviteConfig, setInviteConfig] = useState(null);
  const inviteRef = useRef(null);
  
  // LIVE SEARCH SUGGESTIONS
  const [allGuests, setAllGuests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const searchTimeoutRef = useRef(null);
  const [totalDonation, setTotalDonation] = useState(0);
  const [attendingGuests, setAttendingGuests] = useState(0);
  const [externalLinks, setExternalLinks] = useState([]);
  const [searchParams] = useSearchParams();
  const [homeConfig, setHomeConfig] = useState({
    show_announcement: false,
    show_gallery_slider: true,
    show_contact: true,
    show_external_links: true,
    show_services: true,
    show_calendar_widget: true,
    show_rsvp_search: false,
    show_gold_board: false
  });

  const [loggedTeacher, setLoggedTeacher] = useState(() => getTeacherSession());
  const [loggedStudent, setLoggedStudent] = useState(() => getStudentSession());
  const [activeGuestTab, setActiveGuestTab] = useState('parents'); // 'parents' | 'student' | 'teacher'
  const [activeEcosystemTab, setActiveEcosystemTab] = useState('all'); // 'all' | 'ai' | 'admin' | 'teacher' | 'student'

  useEffect(() => {
    const handleTeacherChange = (e) => setLoggedTeacher(e.detail);
    const handleStudentChange = (e) => setLoggedStudent(e.detail);
    window.addEventListener('cbq-teacher-auth-change', handleTeacherChange);
    window.addEventListener('cbq-student-auth-change', handleStudentChange);
    return () => {
      window.removeEventListener('cbq-teacher-auth-change', handleTeacherChange);
      window.removeEventListener('cbq-student-auth-change', handleStudentChange);
    };
  }, []);
  
  const calculateTimeLeft = (targetDateString) => {
    const target = targetDateString ? new Date(targetDateString) : new Date("2026-09-03T07:30:00");
    const difference = +target - +new Date();
    let timeLeft = {};
    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft(inviteConfig?.event_datetime));
    }, 1000);
    return () => clearTimeout(timer);
  });

  useEffect(() => {
    fetchPublicData();
    const rsvpParam = searchParams.get('rsvp');
    if (rsvpParam) {
      setRsvpCode(rsvpParam);
      // Let it render first then fetch
      setTimeout(() => autoFetchRsvp(rsvpParam), 500);
    }
  }, [searchParams]);

  const autoFetchRsvp = async (code) => {
    try {
      const { data, error } = await supabase.from('cbq_guests').select('*').eq('invitation_code', code.trim()).single();
      if (error || !data) setRsvpResult({ error: 'Không tìm thấy mã khách mời. Vui lòng kiểm tra lại mã số.' });
      else setRsvpResult({ success: true, guest: data });
    } catch (err) {
      setRsvpResult({ error: 'Có lỗi xảy ra, vui lòng thử lại sau.' });
    }
  };

  useEffect(() => {
    if (galleryList.length === 0) return;
    const timer = setInterval(() => {
      setCurrentImgIndex(prev => (prev + 1) % galleryList.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [galleryList]);

  async function fetchPublicData() {
    setLoading(true);
    try {
      const [sponsorsRes, newsRes, guestsCountRes, linksRes, configRes, quizRes, quizInfoRes, galleryRes] = await Promise.all([
        supabase.from('cbq_sponsors').select('*').eq('is_public', true).order('date_received', { ascending: false }),
        supabase.from('cbq_news').select('*').order('published_at', { ascending: false }),
        supabase.from('cbq_guests').select('*', { count: 'exact', head: true }).eq('rsvp_status', 'attending'),
        supabase.from('cbq_external_links').select('*').eq('is_active', true).order('order_index', { ascending: true }),
        supabase.from('cbq_pages').select('*').in('slug', ['invite-config', 'home-config']),
        supabase.from('cbq_quiz_submissions').select('*').order('total_score', { ascending: false }).order('time_taken_seconds', { ascending: true }).limit(10),
        supabase.from('cbq_quizzes').select('*').limit(1),
        supabase.from('cbq_gallery').select('*').eq('is_approved', true).order('created_at', { ascending: false })
      ]);
      
      if (configRes.data && configRes.data.length > 0) {
        configRes.data.forEach(page => {
          if (page.slug === 'invite-config') {
            try {
              const parsed = typeof page.content === 'string' ? JSON.parse(page.content) : page.content;
              setInviteConfig(parsed);
            } catch (e) {
              console.error("Lỗi parse cấu hình thiệp", e);
            }
          } else if (page.slug === 'home-config') {
            try {
              const parsed = typeof page.content === 'string' ? JSON.parse(page.content) : page.content;
              setHomeConfig(prev => ({ ...prev, ...parsed }));
            } catch (e) {
              console.error("Lỗi parse home config", e);
            }
          }
        });
      }

      if (!sponsorsRes.error) {
        setSponsors(sponsorsRes.data || []);
        const total = (sponsorsRes.data || []).reduce((sum, s) => sum + (Number(s.donation_amount) || 0), 0);
        setTotalDonation(total);
      }
      if (!newsRes.error) setNews(newsRes.data || []);
      if (quizRes && !quizRes.error) setQuizLeaderboard(quizRes.data || []);
      if (quizInfoRes && !quizInfoRes.error && quizInfoRes.data?.length > 0) setQuizInfo(quizInfoRes.data[0]);
      if (galleryRes && !galleryRes.error && galleryRes.data?.length > 0) {
        setGalleryList([...galleryRes.data, ...FALLBACK_SLIDER_IMAGES]);
      }
      if (!guestsCountRes.error) {
        setAttendingGuests(guestsCountRes.count || 0);
      }
      if (!linksRes.error && Array.isArray(linksRes.data)) {
        setExternalLinks(linksRes.data.filter(l => l && (!l.type || l.type === 'public')));
      }
    } catch (error) {
      console.log('Chưa có dữ liệu mới.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInputChange = (value) => {
    setRsvpCode(value);
    const q = value.trim();
    if (!q || q.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    setIsSearching(true);
    setShowDropdown(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('cbq_guests')
          .select('*')
          .or(`name.ilike.%${q}%,invitation_code.ilike.%${q}%,group_name.ilike.%${q}%`)
          .limit(10);
        
        if (!error && data) {
          setSearchResults(data);
        }
      } catch (err) {
        console.error("Lỗi tìm kiếm", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const handleSelectGuest = (guestItem) => {
    setRsvpCode(guestItem.invitation_code);
    setRsvpResult({ success: true, guest: guestItem });
    setShowDropdown(false);
  };

  const handleRsvpSearch = async (e) => {
    if (e) e.preventDefault();
    const q = rsvpCode.trim();
    if (!q) return;

    try {
      const { data, error } = await supabase
        .from('cbq_guests')
        .select('*')
        .or(`invitation_code.eq.${q},name.ilike.%${q}%`)
        .limit(1);

      if (!error && data && data.length > 0) {
        setRsvpResult({ success: true, guest: data[0] });
        setShowDropdown(false);
      } else {
        setRsvpResult({ error: `Không tìm thấy thông tin khách mời phù hợp từ khóa "${rsvpCode}". Vui lòng kiểm tra lại.` });
      }
    } catch(err) {
      setRsvpResult({ error: `Có lỗi xảy ra, vui lòng thử lại.` });
    }
  };

  const handleConfirm = async (status) => {
    try {
      const { error } = await supabase
        .from('cbq_guests')
        .update({ rsvp_status: status })
        .eq('id', rsvpResult.guest.id);

      if (!error) {
        setRsvpResult(prev => ({
          ...prev,
          guest: { ...prev.guest, rsvp_status: status }
        }));
        alert(status === 'attending' ? 'Cảm ơn Quý vị đã xác nhận tham dự!' : 'Cảm ơn Quý vị đã phản hồi!');
      } else {
        alert('Có lỗi xảy ra khi xác nhận, vui lòng thử lại.');
      }
    } catch (err) {
      alert('Có lỗi xảy ra, vui lòng thử lại.');
    }
  };

  const handleDownloadInvite = async () => {
    if (!inviteRef.current) return;
    try {
      await document.fonts.ready;
      const canvas = await html2canvas(inviteRef.current, { scale: 2, useCORS: true });
      const image = canvas.toDataURL("image/png", 1.0);
      const safeName = (rsvpResult?.guest?.name || 'Khach_Quy').replace(/\s+/g, '_');
      link.download = `1-ThiepMoi_${safeName}.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error("Lỗi khi tải ảnh:", error);
      alert("Không thể tải ảnh. Vui lòng thử lại!");
    }
  };

  const currentDate = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const filteredEcosystemModules = activeEcosystemTab === 'all' 
    ? ECOSYSTEM_MODULES 
    : ECOSYSTEM_MODULES.filter(m => m.group === activeEcosystemTab);

  return (
    <div className="portal-main-grid">
      <style>{`
        .search-dropdown-menu {
          position: absolute; top: 100%; left: 0; right: 0; z-index: 200;
          background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15); margin-top: 6px; max-height: 280px; overflow-y: auto;
        }
        .search-dropdown-item {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          padding: 10px 14px; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background 0.2s;
        }
        .search-dropdown-item:last-child { border-bottom: none; }
        .search-dropdown-item:hover { background: #fff1f2; }
      `}</style>

        {/* LEFT COLUMN */}
        <div className="portal-left-col" style={styles.leftCol}>
          {/* GIỚI THIỆU & THÔNG TIN CHÍNH THỨC NHÀ TRƯỜNG */}
          <PortalBlock title="🏛️ TRƯỜNG THPT CAO BÁ QUÁT" color="#166534" icon="🌟">
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#166534', marginBottom: '6px' }}>
                HỆ THỐNG ĐIỀU HÀNH & KHÔNG GIAN SỐ 4.0
              </div>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#334155', lineHeight: '1.6' }}>
                Trường THPT Cao Bá Quát — Tiên phong chuyển đổi số toàn diện trong quản lý chuyên môn, giảng dạy và phục vụ phụ huynh, học sinh.
              </p>
            </div>
            
            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
                <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span> 100% Hồ sơ & Sổ sách giáo dục số hóa
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
                <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span> Tra cứu Thời khóa biểu & Học bạ trực tuyến
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
                <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span> Kênh tiếp nhận ý kiến phụ huynh & HS 24/7
              </div>
            </div>
          </PortalBlock>

          {homeConfig.show_gallery_slider && (
          <PortalBlock title="HÌNH ẢNH TIÊU BIỂU" color="#166534" icon="📸">
            <div style={{ position: 'relative', width: '100%', height: '175px', overflow: 'hidden', backgroundColor: '#0f172a' }}>
              {galleryList.length > 0 && (
                <>
                  <a href="/thu-vien-anh" title="Click để mở Thư viện ảnh đầy đủ" style={{ display: 'block', width: '100%', height: '100%' }}>
                    <img 
                      src={galleryList[currentImgIndex]?.image_url} 
                      alt="Hình ảnh tiêu biểu" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        transition: 'opacity 0.5s ease-in-out'
                      }} 
                    />
                  </a>

                  {/* Caption & Counter overlay */}
                  <div style={{
                    position: 'absolute',
                    bottom: '6px',
                    left: '6px',
                    right: '6px',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(4px)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    pointerEvents: 'none'
                  }}>
                    <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }}>
                      📸 {galleryList[currentImgIndex]?.uploaded_by || 'Cao Bá Quát'}
                    </span>
                    <span style={{ opacity: 0.85, fontSize: '10.5px' }}>{currentImgIndex + 1}/{galleryList.length}</span>
                  </div>

                  {/* Prev / Next controls */}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentImgIndex(prev => (prev - 1 + galleryList.length) % galleryList.length); }}
                    style={{
                      position: 'absolute',
                      left: '6px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px'
                    }}
                    title="Ảnh trước"
                  >
                    ❮
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentImgIndex(prev => (prev + 1) % galleryList.length); }}
                    style={{
                      position: 'absolute',
                      right: '6px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px'
                    }}
                    title="Ảnh kế tiếp"
                  >
                    ❯
                  </button>
                </>
              )}
            </div>
          </PortalBlock>
          )}

          {homeConfig.show_contact && (
          <PortalBlock title="THÔNG TIN LIÊN HỆ" color="#166534" icon="📞">
            <ul style={styles.listStyle}>
              <li>📍 Địa chỉ trường THPT Cao Bá Quát</li>
              <li>📞 Hotline: 0123.456.789</li>
              <li>✉️ Email: lk@caobaquat.edu.vn</li>
            </ul>
          </PortalBlock>
          )}

          {homeConfig.show_external_links && (
          <PortalBlock title="LIÊN KẾT TRANG" color="#166534" icon="🔗">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {externalLinks && externalLinks.length > 0 ? (
                externalLinks.filter(l => l && l.url).map((link, idx) => (
                  <a 
                    key={link.id || link.url || idx}
                    href={link.url} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      color: '#0f172a',
                      fontSize: '13px',
                      fontWeight: '500',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#ecfdf5';
                      e.currentTarget.style.borderColor = '#86efac';
                      e.currentTarget.style.color = '#15803d';
                      e.currentTarget.style.transform = 'translateX(3px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.color = '#0f172a';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#16a34a' }}>🔗</span>
                      <span>{link.title}</span>
                    </span>
                    <ExternalLink size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                  </a>
                ))
              ) : (
                <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '13px', padding: '6px 0' }}>Đang cập nhật...</div>
              )}
            </div>
          </PortalBlock>
          )}
        </div>

        {/* CENTER COLUMN */}
        <div className="portal-center-col" style={styles.centerCol}>

          {/* ROLE-BASED SMART WORKSPACE HUB (PHÂN ĐỊNH RÕ RÀNG THEO VAI TRÒ) */}
          {loggedStudent ? (
            /* 1. DÀNH RIÊNG CHO HỌC SINH ĐÃ ĐĂNG NHẬP */
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #bae6fd',
              boxShadow: '0 4px 20px rgba(2, 132, 199, 0.08)',
              overflow: 'hidden',
              marginBottom: '20px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
                color: '#ffffff',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <GraduationCap size={22} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#ffffff' }}>
                      Chào em, {loggedStudent.full_name}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#e0f2fe' }}>
                      Học sinh lớp <strong>{loggedStudent.student_class || 'CBQ'}</strong> • Năm học 2026 - 2027
                    </div>
                  </div>
                </div>

                <Link
                  to="/student-dashboard"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: '#ffffff',
                    color: '#0369a1',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  Cổng Em <ArrowRight size={13} />
                </Link>
              </div>

              <div style={{ padding: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '10px' }}>
                <Link to="/bep-sang" style={styles.actionCard('#fff7ed', '#f97316', '#c2410c')}>
                  <span style={{ fontSize: '22px' }}>🍳</span>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '13px' }}>Điểm Tâm Sáng CBQ</div>
                    <div style={{ fontSize: '10.5px', color: '#ea580c' }}>Tiếp sức học đường</div>
                  </div>
                </Link>

                <Link to="/lich-cong-tac?tab=class_tkb" style={styles.actionCard('#f0fdf4', '#22c55e', '#15803d')}>
                  <span style={{ fontSize: '22px' }}>📅</span>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '13px' }}>TKB Lớp Em</div>
                    <div style={{ fontSize: '10.5px', color: '#16a34a' }}>Tiết học & Phòng học</div>
                  </div>
                </Link>

                <Link to="/hoc-sinh/so-dau-bai" style={styles.actionCard('#fffbeb', '#f59e0b', '#b45309')}>
                  <span style={{ fontSize: '22px' }}>📖</span>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '13px' }}>Sổ Đầu Bài Lớp</div>
                    <div style={{ fontSize: '10.5px', color: '#d97706' }}>Tiến độ ghi sổ</div>
                  </div>
                </Link>

                <Link to="/hoc-sinh/kiem-tra-danh-gia" style={styles.actionCard('#eff6ff', '#3b82f6', '#1d4ed8')}>
                  <span style={{ fontSize: '22px' }}>📝</span>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '13px' }}>Phòng Thi 2018</div>
                    <div style={{ fontSize: '10.5px', color: '#3b82f6' }}>Làm bài kiểm tra</div>
                  </div>
                </Link>

                <Link to="/hoc-lieu-so" style={styles.actionCard('#faf5ff', '#a855f7', '#7e22ce')}>
                  <span style={{ fontSize: '22px' }}>📺</span>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '13px' }}>Học Liệu & Video</div>
                    <div style={{ fontSize: '10.5px', color: '#9333ea' }}>Bài giảng số 4.0</div>
                  </div>
                </Link>

                <Link to="/cham-diem-thi-dua" style={styles.actionCard('#f0fdf4', '#16a34a', '#14532d')}>
                  <span style={{ fontSize: '22px' }}>🏆</span>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '13px' }}>Thi Đua Tuần</div>
                    <div style={{ fontSize: '10.5px', color: '#16a34a' }}>Xếp hạng nề nếp</div>
                  </div>
                </Link>

                <Link to="/hom-thu-hoc-sinh" style={styles.actionCard('#fff1f2', '#f43f5e', '#be123c')}>
                  <span style={{ fontSize: '22px' }}>💌</span>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '13px' }}>Tâm Lý & DASS-21</div>
                    <div style={{ fontSize: '10.5px', color: '#e11d48' }}>Cố vấn học đường</div>
                  </div>
                </Link>

                <Link to="/dang-ky-xe" style={styles.actionCard('#fff7ed', '#ea580c', '#c2410c')}>
                  <span style={{ fontSize: '22px' }}>🛵</span>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '13px' }}>Vé Xe Của Em</div>
                    <div style={{ fontSize: '10.5px', color: '#ea580c' }}>Quản lý vé xe</div>
                  </div>
                </Link>

                <Link to="/tra-cuu-van-bang" style={styles.actionCard('#ecfeff', '#06b6d4', '#0e7490')}>
                  <span style={{ fontSize: '22px' }}>📜</span>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '13px' }}>Học Bạ & Bằng Số</div>
                    <div style={{ fontSize: '10.5px', color: '#0891b2' }}>Tra cứu hồ sơ cá nhân</div>
                  </div>
                </Link>
              </div>
            </div>
          ) : loggedTeacher ? (
            /* 2. DÀNH RIÊNG CHO GIÁO VIÊN ĐÃ ĐĂNG NHẬP */
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #bbf7d0',
              boxShadow: '0 4px 20px rgba(22, 101, 52, 0.08)',
              overflow: 'hidden',
              marginBottom: '20px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #14532d 0%, #166534 100%)',
                color: '#ffffff',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Briefcase size={22} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '900', color: '#ffffff' }}>
                      Kính chào Thầy/Cô {loggedTeacher.full_name || loggedTeacher.name}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#bbf7d0' }}>
                      {loggedTeacher.department || 'Tổ Chuyên Môn'} • Năm học 2026 - 2027
                    </div>
                  </div>
                </div>

                <Link
                  to="/teacher-dashboard"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: '#ffffff',
                    color: '#15803d',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  Cổng Thầy/Cô <ArrowRight size={13} />
                </Link>
              </div>

              <div style={{ padding: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '10px' }}>
                <Link to="/bep-sang" style={styles.actionCard('#fff7ed', '#f97316', '#c2410c')}>
                  <span style={{ fontSize: '22px' }}>🍳</span>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '13px' }}>Điểm Tâm Sáng CBQ</div>
                    <div style={{ fontSize: '10.5px', color: '#ea580c' }}>Suất ăn Thầy Cô</div>
                  </div>
                </Link>

                <Link to="/lich-cong-tac?tab=teacher_tkb" style={styles.actionCard('#f0fdf4', '#22c55e', '#15803d')}>
                  <span style={{ fontSize: '22px' }}>📅</span>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '13px' }}>Báo Giảng Của Tôi</div>
                    <div style={{ fontSize: '10.5px', color: '#16a34a' }}>Lịch dạy tuần này</div>
                  </div>
                </Link>

                <Link to="/hoc-sinh/so-dau-bai" style={styles.actionCard('#eff6ff', '#3b82f6', '#1d4ed8')}>
                  <span style={{ fontSize: '22px' }}>📖</span>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '13px' }}>Sổ Đầu Bài Hôm Nay</div>
                    <div style={{ fontSize: '10.5px', color: '#3b82f6' }}>Ký số & ghi sổ điện tử</div>
                  </div>
                </Link>

                <Link to="/admin/department-drives" style={styles.actionCard('#faf5ff', '#a855f7', '#7e22ce')}>
                  <span style={{ fontSize: '22px' }}>📂</span>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '13px' }}>Kế Hoạch 5512</div>
                    <div style={{ fontSize: '10.5px', color: '#9333ea' }}>Kho giáo án của tổ</div>
                  </div>
                </Link>

                <Link to="/giao-vien/ra-de-thi" style={styles.actionCard('#fff1f2', '#f43f5e', '#be123c')}>
                  <span style={{ fontSize: '22px' }}>✏️</span>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '13px' }}>Ra Đề & Trộn Đề</div>
                    <div style={{ fontSize: '10.5px', color: '#e11d48' }}>Ngân hàng đề thi</div>
                  </div>
                </Link>

                <Link to="/cham-diem-thi-dua" style={styles.actionCard('#fffbeb', '#f59e0b', '#b45309')}>
                  <span style={{ fontSize: '22px' }}>📋</span>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '13px' }}>Chấm Thi Đua Tuần</div>
                    <div style={{ fontSize: '10.5px', color: '#d97706' }}>Theo dõi nề nếp lớp</div>
                  </div>
                </Link>

                <Link to="/to-chuyen-mon" style={styles.actionCard('#ecfeff', '#06b6d4', '#0e7490')}>
                  <span style={{ fontSize: '22px' }}>🌳</span>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '13px' }}>Tổ Chuyên Môn</div>
                    <div style={{ fontSize: '10.5px', color: '#0891b2' }}>Cây phân cấp 4 tầng</div>
                  </div>
                </Link>

                <Link to="/can-chinh-nghi-dinh-30" style={styles.actionCard('#f8fafc', '#64748b', '#334155')}>
                  <span style={{ fontSize: '22px' }}>📑</span>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '13px' }}>Nghị Định 30</div>
                    <div style={{ fontSize: '10.5px', color: '#64748b' }}>Chuẩn hóa thể thức</div>
                  </div>
                </Link>

                <Link to="/admin/registrations" style={styles.actionCard('#f0fdfa', '#14b8a6', '#0f766e')}>
                  <span style={{ fontSize: '22px' }}>🎯</span>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '13px' }}>Điểm Danh CLB</div>
                    <div style={{ fontSize: '10.5px', color: '#0f766e' }}>Theo dõi học sinh</div>
                  </div>
                </Link>
              </div>
            </div>
          ) : (
            /* 3. DÀNH CHO PHỤ HUYNH & CỘNG ĐỒNG (CHƯA ĐĂNG NHẬP) - PHÂN TÁCH 3 CỔNG */
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #cbd5e1',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              overflow: 'hidden',
              marginBottom: '20px'
            }}>
              {/* Role Switcher Tabs */}
              <div style={{
                display: 'flex',
                backgroundColor: '#f1f5f9',
                borderBottom: '2px solid #e2e8f0',
                padding: '4px',
                gap: '4px'
              }}>
                <button
                  type="button"
                  onClick={() => setActiveGuestTab('parents')}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: activeGuestTab === 'parents' ? '#ffffff' : 'transparent',
                    color: activeGuestTab === 'parents' ? '#15803d' : '#64748b',
                    fontWeight: activeGuestTab === 'parents' ? '900' : '600',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    boxShadow: activeGuestTab === 'parents' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>👨‍👩‍👧</span> Phụ Huynh & Cộng Đồng
                </button>

                <button
                  type="button"
                  onClick={() => setActiveGuestTab('student')}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: activeGuestTab === 'student' ? '#ffffff' : 'transparent',
                    color: activeGuestTab === 'student' ? '#0284c7' : '#64748b',
                    fontWeight: activeGuestTab === 'student' ? '900' : '600',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    boxShadow: activeGuestTab === 'student' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>🧑‍🎓</span> Học Sinh
                </button>

                <button
                  type="button"
                  onClick={() => setActiveGuestTab('teacher')}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: activeGuestTab === 'teacher' ? '#ffffff' : 'transparent',
                    color: activeGuestTab === 'teacher' ? '#7e22ce' : '#64748b',
                    fontWeight: activeGuestTab === 'teacher' ? '900' : '600',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    boxShadow: activeGuestTab === 'teacher' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>👨‍🏫</span> Giáo Viên
                </button>
              </div>

              {/* Tab Content 1: Phụ Huynh & Cộng Đồng */}
              {activeGuestTab === 'parents' && (
                <div style={{ padding: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                    <Link to="/dich-vu-cong" style={styles.actionCard('#e0f2fe', '#0284c7', '#0369a1')}>
                      <span style={{ fontSize: '22px' }}>🏛️</span>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '13px' }}>Dịch Vụ Công 4.0</div>
                        <div style={{ fontSize: '10.5px', color: '#0284c7' }}>Giấy xác nhận & nghỉ phép</div>
                      </div>
                    </Link>

                    <Link to="/chat" style={styles.actionCard('#f0fdf4', '#16a34a', '#15803d')}>
                      <span style={{ fontSize: '22px' }}>💬</span>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '13px' }}>Nhắn Tin Nội Bộ</div>
                        <div style={{ fontSize: '10.5px', color: '#16a34a' }}>Hội thoại Thầy Cô & PH</div>
                      </div>
                    </Link>

                    <Link to="/bep-sang" style={styles.actionCard('#fff7ed', '#f97316', '#c2410c')}>
                      <span style={{ fontSize: '22px' }}>🍳</span>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '13px' }}>Điểm Tâm Sáng CBQ</div>
                        <div style={{ fontSize: '10.5px', color: '#ea580c' }}>Tiếp sức học đường</div>
                      </div>
                    </Link>

                    <Link to="/tra-cuu-van-bang" style={styles.actionCard('#f0fdf4', '#22c55e', '#15803d')}>
                      <span style={{ fontSize: '22px' }}>📜</span>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '13px' }}>Tra Cứu Bằng Số</div>
                        <div style={{ fontSize: '10.5px', color: '#16a34a' }}>Bằng tốt nghiệp & học bạ</div>
                      </div>
                    </Link>

                    <Link to="/lich-cong-tac" style={styles.actionCard('#eff6ff', '#3b82f6', '#1d4ed8')}>
                      <span style={{ fontSize: '22px' }}>📅</span>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '13px' }}>Lịch Công Tác BGH</div>
                        <div style={{ fontSize: '10.5px', color: '#3b82f6' }}>Kế hoạch tuần & tháng</div>
                      </div>
                    </Link>

                    <Link to="/cham-diem-thi-dua" style={styles.actionCard('#fffbeb', '#f59e0b', '#b45309')}>
                      <span style={{ fontSize: '22px' }}>📋</span>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '13px' }}>Thi Đua 34 Lớp</div>
                        <div style={{ fontSize: '10.5px', color: '#d97706' }}>Nề nếp học sinh</div>
                      </div>
                    </Link>

                    <Link to="/van-ban" style={styles.actionCard('#faf5ff', '#a855f7', '#7e22ce')}>
                      <span style={{ fontSize: '22px' }}>📜</span>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '13px' }}>Văn Bản - Thông Báo</div>
                        <div style={{ fontSize: '10.5px', color: '#9333ea' }}>Thông báo từ nhà trường</div>
                      </div>
                    </Link>

                    <Link to="/to-chuyen-mon" style={styles.actionCard('#ecfeff', '#06b6d4', '#0e7490')}>
                      <span style={{ fontSize: '22px' }}>👨‍🏫</span>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '13px' }}>8 Tổ Chuyên Môn</div>
                        <div style={{ fontSize: '10.5px', color: '#0891b2' }}>Đội ngũ sư phạm</div>
                      </div>
                    </Link>

                    <Link to="/hom-thu-hoc-sinh" style={styles.actionCard('#fff1f2', '#f43f5e', '#be123c')}>
                      <span style={{ fontSize: '22px' }}>💌</span>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '13px' }}>Hòm Thư Góp Ý</div>
                        <div style={{ fontSize: '10.5px', color: '#e11d48' }}>Gửi phản ánh tới BGH</div>
                      </div>
                    </Link>
                  </div>
                </div>
              )}

              {/* Tab Content 2: Học Sinh */}
              {activeGuestTab === 'student' && (
                <div style={{ padding: '20px 16px', textAlign: 'center' }}>
                  <div style={{ maxWidth: '420px', margin: '0 auto' }}>
                    <div style={{ fontSize: '32px', marginBottom: '6px' }}>🧑‍🎓</div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '900', color: '#0369a1' }}>
                      CỔNG KHÔNG GIAN SỐ DÀNH CHO HỌC SINH
                    </h3>
                    <p style={{ margin: '0 0 16px 0', fontSize: '12.5px', color: '#64748b' }}>
                      Đăng nhập bằng mã học sinh hoặc CCCD để xem Thời khóa biểu riêng của lớp, làm bài kiểm tra và điểm danh câu lạc bộ.
                    </p>

                    <Link
                      to="/dang-nhap-hoc-sinh"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '12px 20px',
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        color: '#ffffff',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        textDecoration: 'none',
                        boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                        marginBottom: '14px'
                      }}
                    >
                      <Key size={16} /> Đăng Nhập Cổng Học Sinh
                    </Link>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <Link to="/lich-cong-tac?tab=class_tkb" style={{ fontSize: '12px', color: '#0284c7', textDecoration: 'none', fontWeight: '600' }}>
                        📅 Xem TKB Lớp
                      </Link>
                      <span style={{ color: '#cbd5e1' }}>•</span>
                      <Link to="/hoc-lieu-so" style={{ fontSize: '12px', color: '#0284c7', textDecoration: 'none', fontWeight: '600' }}>
                        📺 Trạm Học Liệu Số
                      </Link>
                      <span style={{ color: '#cbd5e1' }}>•</span>
                      <Link to="/dang-ky-xe-may" style={{ fontSize: '12px', color: '#0284c7', textDecoration: 'none', fontWeight: '600' }}>
                        🛵 Đăng Ký Xe Máy
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content 3: Giáo Viên */}
              {activeGuestTab === 'teacher' && (
                <div style={{ padding: '20px 16px', textAlign: 'center' }}>
                  <div style={{ maxWidth: '420px', margin: '0 auto' }}>
                    <div style={{ fontSize: '32px', marginBottom: '6px' }}>👨‍🏫</div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '900', color: '#15803d' }}>
                      CỔNG QUẢN LÝ NGHIỆP VỤ & SƯ PHẠM
                    </h3>
                    <p style={{ margin: '0 0 16px 0', fontSize: '12.5px', color: '#64748b' }}>
                      Dành cho Cán bộ, Giáo viên & Nhân viên nhà trường quản lý lịch báo giảng, sổ đầu bài điện tử, duyệt giáo án và ra đề thi.
                    </p>

                    <Link
                      to="/dang-nhap-giao-vien"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '12px 20px',
                        background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                        color: '#ffffff',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        textDecoration: 'none',
                        boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
                        marginBottom: '14px'
                      }}
                    >
                      <Key size={16} /> Đăng Nhập Cổng Giáo Viên
                    </Link>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <Link to="/lich-cong-tac?tab=teacher_tkb" style={{ fontSize: '12px', color: '#15803d', textDecoration: 'none', fontWeight: '600' }}>
                        📅 Lịch Báo Giảng
                      </Link>
                      <span style={{ color: '#cbd5e1' }}>•</span>
                      <Link to="/to-chuyen-mon" style={{ fontSize: '12px', color: '#15803d', textDecoration: 'none', fontWeight: '600' }}>
                        🌳 8 Tổ Chuyên Môn
                      </Link>
                      <span style={{ color: '#cbd5e1' }}>•</span>
                      <Link to="/admin" style={{ fontSize: '12px', color: '#e11d48', textDecoration: 'none', fontWeight: '600' }}>
                        🛡️ Cổng Quản Trị BGH
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* KHÔNG GIAN HỆ THỐNG ĐIỀU HÀNH & CÁC PHÂN HỆ TIỆN ÍCH SỐ (KHÔNG GÁN LINK NỘI BỘ) */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1.5px solid #cbd5e1',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            marginBottom: '20px'
          }}>
            {/* Header Bar */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f766e 100%)',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px'
                }}>
                  🏛️
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#5eead4', fontWeight: '800', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                    HỆ SINH THÁI ĐIỀU HÀNH & TIỆN ÍCH SỐ
                  </div>
                  <h2 style={{ margin: 0, fontSize: '16.5px', fontWeight: '900', color: '#ffffff', letterSpacing: '0.2px' }}>
                    DANH MỤC 22 PHÂN HỆ NGHIỆP VỤ & ỨNG DỤNG SỐ
                  </h2>
                </div>
              </div>

              <Link
                to="/huong-dan"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  backdropFilter: 'blur(4px)'
                }}
              >
                <BookOpen size={13} /> Cẩm Nang Toàn Bộ <ChevronRight size={13} />
              </Link>
            </div>

            <div style={{ padding: '18px 16px' }}>
              {/* NGUYÊN TẮC BẢO MẬT & PHÂN QUYỀN BANNER */}
              <div id="official-gateways" style={{
                backgroundColor: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '14px',
                padding: '16px',
                marginBottom: '18px'
              }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e3a8a', marginBottom: '4px' }}>
                      🛡️ NGUYÊN TẮC BẢO MẬT & PHÂN QUYỀN TRUY CẬP HỆ THỐNG
                    </div>
                    <p style={{ margin: 0, fontSize: '12.5px', color: '#475569', lineHeight: '1.6' }}>
                      Để bảo đảm an toàn thông tin, bảo mật hồ sơ học sinh và tính toàn vẹn dữ liệu sư phạm theo quy định của Nhà nước và Bộ GD&ĐT, 
                      <strong> các chức năng nghiệp vụ nội bộ không mở đường dẫn công khai trực tiếp</strong>. Quý Thầy/Cô, Cán bộ và Học sinh vui lòng 
                      <strong> đăng nhập đúng Cổng xác thực của mình</strong>, sau khi đăng nhập thành công hệ thống sẽ tự động kích hoạt và hiển thị đầy đủ menu chức năng cá nhân.
                    </p>
                  </div>
                </div>

                {/* 3 CỔNG ĐĂNG NHẬP CHÍNH THỨC */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '10px'
                }}>
                  <Link
                    to="/login"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #fecaca',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>🔑</span>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#991b1b' }}>Cổng Quản Trị & BGH</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Lãnh đạo & Văn phòng</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: 'bold' }}>Đăng nhập ➔</span>
                  </Link>

                  <Link
                    to="/dang-nhap-giao-vien"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #bbf7d0',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>👨‍🏫</span>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#15803d' }}>Cổng Giáo Viên</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Hội đồng Sư phạm</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 'bold' }}>Đăng nhập ➔</span>
                  </Link>

                  <Link
                    to="/dang-nhap-hoc-sinh"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #bae6fd',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>🧑‍🎓</span>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#0369a1' }}>Cổng Học Sinh</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Không gian số học trò</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#0284c7', fontWeight: 'bold' }}>Đăng nhập ➔</span>
                  </Link>
                </div>
              </div>

              {/* ECOSYSTEM CATEGORY TABS */}
              <div style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                paddingBottom: '8px',
                marginBottom: '14px',
                scrollbarWidth: 'none'
              }}>
                {ECOSYSTEM_TABS.map(tab => {
                  const isSel = activeEcosystemTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveEcosystemTab(tab.id)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '20px',
                        border: isSel ? '1.5px solid #0f766e' : '1px solid #cbd5e1',
                        backgroundColor: isSel ? '#0f766e' : '#f8fafc',
                        color: isSel ? '#ffffff' : '#334155',
                        fontWeight: isSel ? '800' : '600',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: isSel ? '0 2px 8px rgba(15, 118, 110, 0.25)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{tab.label}</span>
                      <span style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        backgroundColor: isSel ? 'rgba(255, 255, 255, 0.25)' : '#e2e8f0',
                        color: isSel ? '#ffffff' : '#64748b'
                      }}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* MODULE CARDS GRID */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '12px',
                marginBottom: '18px'
              }}>
                {filteredEcosystemModules.map(mod => (
                  <div
                    key={mod.id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <div>
                      {/* Top Row: Icon + Role Badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          backgroundColor: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px'
                        }}>
                          {mod.icon}
                        </div>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: mod.roleBadgeColor,
                          color: mod.roleTextColor,
                          border: `1px solid ${mod.roleBorderColor}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {mod.roleBadge}
                        </span>
                      </div>

                      {/* Title & Desc */}
                      <h3 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: '800', color: '#0f172a', lineHeight: '1.35' }}>
                        {mod.title}
                      </h3>
                      <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                        {mod.desc}
                      </p>

                      {/* Highlights */}
                      <div style={{ borderTop: '1px dashed #f1f5f9', paddingTop: '8px', marginBottom: '12px' }}>
                        {mod.highlights.map((h, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11.5px', color: '#334155', marginBottom: '4px', lineHeight: '1.4' }}>
                            <span style={{ color: '#0d9488', fontWeight: 'bold', fontSize: '11px', flexShrink: 0 }}>✓</span>
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button: Public Link vs Internal Protected */}
                    <div>
                      {mod.isInternal ? (
                        <button
                          type="button"
                          onClick={() => window.dispatchEvent(new CustomEvent('cbq-open-auth-choice'))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            backgroundColor: '#f8fafc',
                            border: '1px dashed #cbd5e1',
                            borderRadius: '8px',
                            color: '#475569',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'background 0.15s ease'
                          }}
                          title="Tính năng nội bộ - Bấm để chọn cổng đăng nhập đúng vai trò"
                        >
                          <Lock size={12} color="#64748b" /> Yêu cầu đăng nhập theo vai trò
                        </button>
                      ) : (
                        <Link
                          to={mod.publicUrl}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            backgroundColor: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '8px',
                            color: '#15803d',
                            fontSize: '11.5px',
                            fontWeight: '800',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxSizing: 'border-box'
                          }}
                        >
                          <span>Mở Dịch Vụ Mở Này</span> <ChevronRight size={13} />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* BOTTOM FOOTER LINK TO GUIDE */}
              <div style={{
                textAlign: 'center',
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0'
              }}>
                <span style={{ fontSize: '12.5px', color: '#475569', marginRight: '8px' }}>
                  Quý Thầy/Cô và học sinh muốn tìm hiểu quy trình thao tác chuẩn từng bước?
                </span>
                <Link
                  to="/huong-dan"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#1d4ed8',
                    fontWeight: '800',
                    fontSize: '12.5px',
                    textDecoration: 'none'
                  }}
                >
                  Xem Cẩm Nang Toàn Diện ➔
                </Link>
              </div>
            </div>
          </div>


          {/* WIDGET LỊCH CÔNG TÁC & THỜI KHÓA BIỂU TUẦN TRỰC TUYẾN */}
          {homeConfig.show_calendar_widget && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1.5px solid #bfdbfe',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            overflow: 'hidden',
            marginBottom: '20px'
          }}>
            <div style={{
              backgroundColor: '#1d4ed8',
              color: '#ffffff',
              padding: '12px 18px',
              fontWeight: 'bold',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} /> LỊCH CÔNG TÁC & BÁO GIẢNG TUẦN NHÀ TRƯỜNG
              </div>
              <span style={{ fontSize: '12px', backgroundColor: '#3b82f6', padding: '2px 10px', borderRadius: '12px' }}>
                Năm học 2026 - 2027
              </span>
            </div>

            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', borderLeft: '4px solid #3b82f6' }}>
                  <div style={{ backgroundColor: '#dbeafe', padding: '8px 12px', borderRadius: '8px', textAlign: 'center', minWidth: '70px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e40af' }}>TỪ NGÀY</div>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#1d4ed8' }}>08/09</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>📌 Lịch Công tác Ban Giám hiệu & Chuyên môn Tuần mới</div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#475569', lineHeight: '1.4' }}>
                      • Sinh hoạt chuyên môn Tổ Toán - Lý - Hóa - Văn - Anh chuẩn GDPT 2018.<br />
                      • Kiểm tra tiến độ nộp Sổ sách điện tử & Kế hoạch bài dạy trên hệ thống.<br />
                      • Đội Cờ đỏ thực hiện chấm điểm thi đua nề nếp tuần mới các khối 10, 11, 12.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  <a href="/lich-cong-tac" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#eff6ff', color: '#1d4ed8', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12.5px' }}>
                    <ChevronRight size={14} /> Xem Toàn Bộ Lịch Công Tác BGH
                  </a>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* LƯU TRỮ TRA CỨU THIỆP MỜI KỶ NIỆM 30 NĂM */}
          {homeConfig.show_rsvp_search && (
          <div style={styles.rsvpHighlightBlock}>
            <div style={styles.rsvpHighlightHeader}>
              <span style={{ marginRight: '6px' }}>✉️</span> KHO TRA CỨU THIỆP MỜI & TƯ LIỆU KỶ NIỆM 30 NĂM
            </div>
            <div style={styles.rsvpHighlightBody}>
              <p style={{ marginBottom: '12px', fontSize: '13.5px', color: '#475569', lineHeight: '1.5' }}>
                Tra cứu lại <strong>Phiên bản Thiệp mời Điện tử Kỷ niệm 30 năm</strong> và danh sách tham dự lưu trữ của quý đại biểu.
              </p>

              <div style={{ position: 'relative', width: '100%' }}>
                <form onSubmit={handleRsvpSearch} style={styles.searchForm}>
                  <input
                    type="text"
                    placeholder="Nhập Họ Tên hoặc Mã thiệp (VD: Nguyễn Văn A, 12A01 hoặc CBQ-12345)..."
                    value={rsvpCode}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    onFocus={() => { if(searchResults.length > 0) setShowDropdown(true); }}
                    style={styles.searchInput}
                  />
                  <button type="submit" style={styles.searchBtn}>Tra Cứu</button>
                </form>

                {/* LIVE SEARCH DROPDOWN SUGGESTIONS LIST */}
                {showDropdown && (
                  <div className="search-dropdown-menu">
                    {isSearching ? (
                      <div style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                        ⏳ Đang tìm kiếm khách mời...
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((g) => (
                        <div
                          key={g.id}
                          className="search-dropdown-item"
                          onClick={() => handleSelectGuest(g)}
                        >
                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>
                              👤 {g.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                              {g.group_name || g.note || 'Cựu học sinh'} • Mã: <span style={{ color: '#b45309', fontWeight: 'bold' }}>{g.invitation_code}</span>
                            </div>
                          </div>
                          <a 
                            href={`/invite/${g.invitation_code}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{
                              fontSize: '11.5px', background: 'linear-gradient(135deg, #be123c, #881337)', color: 'white', padding: '6px 14px',
                              borderRadius: '20px', textDecoration: 'none', fontWeight: 'bold', whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(190,18,60,0.25)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Mở Thiệp 5D ➔
                          </a>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                        Không tìm thấy khách mời phù hợp với từ khóa "{rsvpCode}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Kết quả Thiệp Mời */}
              {rsvpResult?.error && <div style={styles.errorMsg}>{rsvpResult.error}</div>}
              {rsvpResult?.success && (
                <div style={styles.inviteCardWrapper} className="invite-card-animated">
                  {/* Mặt thiệp (Bi-fold layout) */}
                  <div className="bifold-invite-container" ref={inviteRef}>
                    
                    {/* TRANG TRÁI - Lời mời & Thông tin khách */}
                    <div className="bifold-page bifold-page-left">
                      <div className="invite-dept">
                        <strong>{inviteConfig?.school_name || 'TRƯỜNG THPT CAO BÁ QUÁT'}</strong>
                        <div className="invite-dept-line"></div>
                      </div>
                      
                      <div className="invite-greeting">{inviteConfig?.invite_title1 || 'Trân trọng kính mời'}</div>
                      <div className="invite-greeting-sub" style={{ textAlign: 'center', marginTop: '5px' }}>
                        <span style={{ borderBottom: '1px solid #d4af37', paddingBottom: '2px', fontWeight: 'bold' }}>
                           {inviteConfig?.invite_title2 || 'ĐẠI BIỂU THAM DỰ'}
                        </span>
                      </div>
                      
                      <div className="event-title-box" style={{ marginTop: '30px' }}>
                        <div className="event-title-line1" style={{ fontSize: '24px', color: '#b71c1c' }}>{inviteConfig?.event_name_main || 'LỄ KỶ NIỆM'}</div>
                        <div className="event-title-line2" style={{ whiteSpace: 'pre-line', color: '#b71c1c', marginTop: '10px' }}>{inviteConfig?.event_name_sub || '30 NĂM THÀNH LẬP\nTRƯỜNG THPT CAO BÁ QUÁT\n(1996 - 2026)'}</div>
                      </div>
                      
                      <div className="time-loc-table">
                        <div className="tl-row" style={{ alignItems: 'flex-start' }}>
                          <div className="tl-icon">🕒</div>
                          <div className="tl-label">THỜI GIAN:</div>
                        </div>
                        <div className="tl-row">
                          <div className="tl-value" style={{ marginLeft: '25px', fontWeight: 'bold' }}>{inviteConfig?.time || '07 giờ 30, ngày 03 tháng 9 năm 2026'}</div>
                        </div>
                        <div className="tl-row" style={{ alignItems: 'flex-start', marginTop: '10px' }}>
                          <div className="tl-icon">📍</div>
                          <div className="tl-label">ĐỊA ĐIỂM:</div>
                        </div>
                        <div className="tl-row">
                          <div className="tl-value" style={{ marginLeft: '25px', whiteSpace: 'pre-line', fontWeight: 'bold' }}>{inviteConfig?.location || 'Trường THPT Cao Bá Quát\nTDP 9, phường Tân An, tỉnh Đắk Lắk'}</div>
                        </div>
                      </div>
                      
                      <div className="honor-text" style={{ whiteSpace: 'pre-line', fontStyle: 'italic', marginTop: '20px' }}>
                        {inviteConfig?.footer_message || 'Sự hiện diện của Quý vị là niềm vinh dự,\ngóp phần làm nên thành công của buổi lễ.'}
                      </div>
                      
                      <div className="signature-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: '20px' }}>
                        <div style={{ fontStyle: 'italic' }}>{inviteConfig?.sign_date || 'Tân An, ngày 10 tháng 8 năm 2026'}</div>
                        <div style={{ fontWeight: 'bold', whiteSpace: 'pre-line', textAlign: 'center', marginTop: '5px' }}>{inviteConfig?.sign_title || 'TM. BAN TỔ CHỨC\nHIỆU TRƯỞNG'}</div>
                        <div className="signature-stamp-placeholder" style={{ height: '50px' }}></div>
                        <div className="signature-handwriting" style={{ fontFamily: '"Brush Script MT", cursive', fontSize: '20px', color: '#b71c1c', fontWeight: 'bold' }}>{inviteConfig?.sign_name || 'Lê Thị Thảo'}</div>
                      </div>
                    </div>

                    {/* TRANG PHẢI - Lịch trình & Mã QR */}
                    <div className="bifold-page bifold-page-right">
                      <div className="agenda-title-box">
                        <div className="agenda-title" style={{ fontSize: '18px', color: '#b71c1c' }}>{inviteConfig?.program_title || 'CHƯƠNG TRÌNH LỄ KỶ NIỆM'}</div>
                      </div>
                      
                      <div className="agenda-table-wrapper" style={{ margin: '15px 0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                          <thead>
                            <tr>
                              <th style={{ color: '#b71c1c', borderBottom: '1px solid #94a3b8', padding: '8px', textAlign: 'left', width: '100px' }}>Thời gian</th>
                              <th style={{ color: '#b71c1c', borderBottom: '1px solid #94a3b8', padding: '8px', textAlign: 'left' }}>Nội dung chương trình</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inviteConfig?.agenda && inviteConfig.agenda.length > 0 ? inviteConfig.agenda.map((item, idx) => {
                              // Nếu agenda là kiểu cũ (chuỗi)
                              if (typeof item === 'string') {
                                const parts = item.split(': ');
                                return (
                                  <tr key={idx}>
                                    <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', color: '#b71c1c', fontWeight: 'bold' }}>{parts[0]}</td>
                                    <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', whiteSpace: 'pre-line' }}>{parts.slice(1).join(': ')}</td>
                                  </tr>
                                );
                              }
                              // Kiểu mới (object)
                              return (
                                <tr key={idx}>
                                  <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', color: '#b71c1c', fontWeight: 'bold' }}>{item.time}</td>
                                  <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'top', whiteSpace: 'pre-line' }}>{item.content}</td>
                                </tr>
                              );
                            }) : (
                               <tr><td colSpan="2" style={{ padding: '8px' }}>Chưa cập nhật</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="qr-box-wrapper" style={{ border: '1px solid #fde68a', backgroundColor: '#fffbeb', borderRadius: '8px', padding: '15px', marginTop: 'auto' }}>
                        <div style={{ whiteSpace: 'pre-line', fontSize: '12px', textAlign: 'center', fontStyle: 'italic', color: '#d32f2f', marginBottom: '10px' }}>
                          {inviteConfig?.qr_message || 'Để khâu tiếp đón được chu đáo,\nQuý đại biểu vui lòng quét mã QR xác nhận thông tin\ntham dự Chương trình Lễ Kỷ niệm'}
                        </div>
                        <div className="qr-box" style={{ marginTop: '0', display: 'flex', justifyContent: 'center' }}>
                          <QRCodeSVG value={rsvpResult.guest.invitation_code} size={80} level="H" fgColor="#000" />
                        </div>
                      </div>
                      
                      <div className="closing-text" style={{ fontStyle: 'italic', color: '#b71c1c', fontSize: '15px', fontWeight: 'bold' }}>
                        {inviteConfig?.ending_message || 'Rất hân hạnh được đón tiếp!'}
                      </div>
                    </div>
                  </div>

                  {/* Khu vực Xác nhận */}
                  <div style={styles.rsvpActionBox}>
                    {rsvpResult.guest.rsvp_status === 'pending' ? (
                      <>
                        <p style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' }}>Quý vị vui lòng xác nhận tham dự:</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button style={styles.btnConfirm} onClick={() => handleConfirm('attending')}>Tham dự</button>
                          <button style={styles.btnDecline} onClick={() => handleConfirm('not_attending')}>Không thể đến</button>
                        </div>
                      </>
                    ) : (
                      <div style={{ padding: '10px', backgroundColor: rsvpResult.guest.rsvp_status === 'attending' ? '#f0fdf4' : '#fef2f2', color: rsvpResult.guest.rsvp_status === 'attending' ? '#166534' : '#991b1b', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px', border: '1px solid #ccc' }}>
                        {rsvpResult.guest.rsvp_status === 'attending'
                          ? '✅ Quý vị đã xác nhận tham dự sự kiện.'
                          : '❌ Quý vị đã xác nhận không thể tham dự.'}
                      </div>
                    )}
                    
                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <a 
                        href={`/thiep/${rsvpResult.guest.invitation_code}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flex: 1, padding: '12px', background: 'linear-gradient(135deg, #be123c, #881337)', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 12px rgba(190,18,60,0.25)', minWidth: '200px' }}
                      >
                        ✨ Trải Nghiệm Thiệp Mời 5D Tương Tác ➔
                      </a>
                      <button onClick={handleDownloadInvite} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 16px', backgroundColor: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                        <Download size={18} /> Tải Về
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          )}

          {/* BẢNG VÀNG THỦ KHOA - XUẤT BẢN THEO CẤU HÌNH ADMIN */}
          {homeConfig.show_gold_board && (
          <div style={styles.goldBoardBlock}>
            <div style={styles.goldBoardHeader}>
              <span style={{ fontSize: '20px' }}>👑</span>
              <span>BẢNG VÀNG THỦ KHOA - {(quizInfo?.title || 'CUỘC THI TÌM HIỂU 30 NĂM').toUpperCase()}</span>
            </div>

            <div style={{ padding: '20px', background: 'linear-gradient(180deg, #fffdf5 0%, #ffffff 100%)' }}>
              {quizInfo && quizInfo.show_leaderboard === false ? (
                <div style={{ textAlign: 'center', color: '#b45309', padding: '20px 10px', fontSize: '14.5px', background: '#fefce8', borderRadius: '10px', border: '1px solid #fef08a' }}>
                  🔒 <strong>BẢNG VÀNG ĐANG Ở CHẾ ĐỘ CHỜ XUẤT BẢN</strong>
                  <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#854d0e' }}>
                    Ban Tổ Chức sẽ công bố Bảng Vàng Vinh Danh công khai ngay sau khi cuộc thi kết thúc!
                  </p>
                </div>
              ) : quizLeaderboard.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '15px 0', fontSize: '14px' }}>
                  Chưa có dữ liệu bài thi nào được ghi nhận.
                </div>
              ) : (
                <>
                  {/* TOP 3 PODIUM (OLYMPIC STANDARD: TOP 1 IN CENTER) */}
                  {(() => {
                    const top3 = quizLeaderboard.slice(0, 3);
                    const podiumItems = [];
                    if (top3[1]) podiumItems.push({ ...top3[1], rank: 2, badge: '🥈 GIẢI NHÌ BẠC', border: '#94a3b8', bg: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', badgeBg: '#475569', icon: '🥈', isCenter: false });
                    if (top3[0]) podiumItems.push({ ...top3[0], rank: 1, badge: '👑 GIẢI NHẤT VÀNG', border: '#eab308', bg: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)', badgeBg: '#ca8a04', icon: '🥇', isCenter: true });
                    if (top3[2]) podiumItems.push({ ...top3[2], rank: 3, badge: '🥉 GIẢI BA ĐỒNG', border: '#f97316', bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', badgeBg: '#c2410c', icon: '🥉', isCenter: false });

                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'end', marginBottom: '20px', paddingTop: '10px' }}>
                        {podiumItems.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              background: item.bg,
                              border: `2px solid ${item.border}`,
                              borderRadius: '16px',
                              padding: item.isCenter ? '24px 14px 20px' : '16px 12px',
                              textAlign: 'center',
                              boxShadow: item.isCenter ? '0 12px 28px rgba(234,179,8,0.28)' : '0 4px 12px rgba(0,0,0,0.05)',
                              position: 'relative',
                              transform: item.isCenter ? 'scale(1.03)' : 'scale(0.98)',
                              zIndex: item.isCenter ? 2 : 1
                            }}
                          >
                            <div style={{
                              position: 'absolute',
                              top: '-12px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              background: item.badgeBg,
                              color: 'white',
                              padding: '3px 14px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              whiteSpace: 'nowrap',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                            }}>
                              {item.badge}
                            </div>

                            <div style={{ fontSize: item.isCenter ? '32px' : '26px', marginTop: item.isCenter ? '4px' : '6px', marginBottom: '2px' }}>
                              {item.icon}
                            </div>

                            <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: item.isCenter ? '16px' : '14.5px', marginBottom: '3px' }}>
                              {item.student_name}
                            </div>

                            <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '500', marginBottom: '10px' }}>
                              Lớp: <span style={{ color: '#be123c', fontWeight: 'bold' }}>{item.student_group}</span>
                            </div>

                            <div style={{ display: 'inline-block', background: 'white', padding: '5px 14px', borderRadius: '20px', border: `1px solid ${item.border}`, fontSize: item.isCenter ? '14px' : '13px', fontWeight: 'bold', color: '#15803d', boxShadow: '0 2px 5px rgba(0,0,0,0.04)' }}>
                              {item.total_score || item.score} / 300 Điểm
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* TOP 4 -> 10 LIST */}
                  {quizLeaderboard.length > 3 && (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
                      <div style={{ padding: '8px 14px', background: '#f8fafc', fontWeight: 'bold', fontSize: '12.5px', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                        🎖️ TOP 4 - TOP 10 THÍ SINH DẪN ĐẦU BẢNG XẾP HẠNG
                      </div>
                      {quizLeaderboard.slice(3, 10).map((item, idx) => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 14px',
                            borderBottom: idx < quizLeaderboard.slice(3, 10).length - 1 ? '1px dashed #f1f5f9' : 'none',
                            fontSize: '13px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              background: '#f1f5f9',
                              color: '#475569',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: '11px'
                            }}>
                              {idx + 4}
                            </span>
                            <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{item.student_name}</span>
                            <span style={{ color: '#64748b', fontSize: '12px' }}>({item.student_group})</span>
                          </div>
                          <span style={{ fontWeight: 'bold', color: '#166534' }}>{item.total_score || item.score} Điểm</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ textAlign: 'center', marginTop: '14px' }}>
                    <a
                      href="/cuoc-thi"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 20px',
                        background: 'linear-gradient(135deg, #be123c 0%, #9f1239 100%)',
                        color: 'white',
                        borderRadius: '25px',
                        fontWeight: 'bold',
                        fontSize: '13.5px',
                        textDecoration: 'none',
                        boxShadow: '0 4px 12px rgba(190,18,60,0.2)'
                      }}
                    >
                      🏆 Thử Sức Ngay & Xem Chi Tiết Bảng Vàng ➔
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
          )}

          {/* Tin Tức - Sự Kiện */}
          <div style={styles.newsBlock}>
            <div style={styles.newsMainHeader}>TIN TỨC - SỰ KIỆN</div>
            <div style={styles.newsMainContent}>
              {news.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Đang cập nhật tin tức...</div>
              ) : (
                <>
                  {/* Tin nổi bật (tin đầu tiên) */}
                  <div 
                    style={{ ...styles.featuredNews, cursor: 'pointer' }} 
                    onClick={() => setSelectedNews(news[0])}
                  >
                    <img src={news[0].image_url || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&auto=format&fit=crop'} alt="featured" style={styles.featuredNewsImg} />
                    <h3 style={styles.featuredNewsTitle}>{news[0].title}</h3>
                    <div style={styles.newsMeta}>📅 {new Date(news[0].published_at).toLocaleDateString('vi-VN')} | 👁️ Lượt xem: 488</div>
                    <p style={styles.featuredNewsDesc}>
                      {(news[0].content || '').replace(/<[^>]+>/g, '').substring(0, 150)}...
                    </p>
                  </div>

                  {/* Danh sách tin cũ hơn */}
                  {news.length > 1 && (
                    <ul style={styles.olderNewsList}>
                      {news.slice(1, 5).map(item => (
                        <li 
                          key={item.id} 
                          style={{ ...styles.olderNewsItem, cursor: 'pointer' }}
                          onClick={() => setSelectedNews(item)}
                        >
                          <ChevronRight size={14} color="#0284c7" style={{ minWidth: '14px' }} />
                          <span style={styles.olderNewsLink}>{item.title}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="portal-right-col" style={styles.rightCol}>
          {homeConfig.show_notifications && (
          <PortalBlock title="THÔNG BÁO MỚI" color="#d32f2f" icon="📢">
            <div style={styles.marqueeVertical}>
              <ul style={styles.linkList}>
                {news.slice(0, 4).map((n, i) => (
                  <li 
                    key={i} 
                    style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px', marginBottom: '8px', cursor: 'pointer' }}
                    onClick={() => setSelectedNews(n)}
                  >
                    <span style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: '13px', textDecoration: 'none' }}>✔ {n.title}</span>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>({new Date(n.published_at).toLocaleDateString('vi-VN')})</div>
                  </li>
                ))}
              </ul>
            </div>
          </PortalBlock>
          )}

          <PortalBlock title="🏆 VINH DANH THI ĐUA & THÀNH TÍCH" color="#166534" icon="🎖️">
            <div style={{ textAlign: 'center', padding: '14px 10px', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>🎖️</div>
              <div style={{ fontWeight: 'bold', color: '#166534', fontSize: '13.5px' }}>Thi Đua Chuyên Môn & Nề Nếp Tuần</div>
              <p style={{ fontSize: '12px', color: '#334155', margin: '6px 0 12px 0', lineHeight: '1.5' }}>
                Tuyên dương các Tập thể Lớp đạt Cờ Nhất thi đua tuần & Cán bộ Giáo viên đạt tích xuất sắc trong giảng dạy.
              </p>
              <a 
                href="/cham-diem-thi-dua" 
                style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, #166534 0%, #15803d 100%)',
                  color: 'white',
                  padding: '7px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(22, 101, 52, 0.25)'
                }}
              >
                Xem Sổ Thi Đua Trực Tuần ➔
              </a>
            </div>
          </PortalBlock>
        </div>

        {/* NEWS DETAIL READER MODAL */}
        {selectedNews && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }} 
            onClick={() => setSelectedNews(null)}
          >
            <div 
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                maxWidth: '750px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
                position: 'relative',
                padding: '28px',
                animation: 'fadeIn 0.2s ease-out'
              }} 
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedNews(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>

              {selectedNews.image_url && (
                <img 
                  src={selectedNews.image_url} 
                  alt={selectedNews.title} 
                  style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', borderRadius: '12px', marginBottom: '20px' }} 
                />
              )}

              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#166534', marginTop: 0, marginBottom: '12px', lineHeight: '1.4' }}>
                {selectedNews.title}
              </h2>

              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '20px' }}>
                <span>📅 Đăng lúc: {new Date(selectedNews.published_at || Date.now()).toLocaleDateString('vi-VN')}</span>
                <span>👁️ Lượt xem: 488</span>
              </div>

              <div 
                dangerouslySetInnerHTML={{ __html: selectedNews.content || '' }} 
                style={{ fontSize: '15px', lineHeight: '1.7', color: '#334155' }}
              />
            </div>
          </div>
        )}

      </div>
  );
}

// Reusable Portal Block Component
function PortalBlock({ title, color = '#166534', icon, children }) {
  const headerBg = color === '#d32f2f' || color === '#be123c'
    ? 'linear-gradient(135deg, #be123c 0%, #9f1239 100%)'
    : color === '#b45309' || color === '#d97706'
    ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
    : 'linear-gradient(135deg, #166534 0%, #14532d 100%)';

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '14px',
      overflow: 'hidden',
      boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
      marginBottom: '16px'
    }}>
      <div style={{
        background: headerBg,
        color: 'white',
        padding: '11px 16px',
        fontWeight: 'bold',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        letterSpacing: '0.4px',
        borderBottom: '2px solid rgba(254, 240, 138, 0.4)'
      }}>
        {icon && <span style={{ fontSize: '15px' }}>{icon}</span>}
        <span>{title}</span>
      </div>
      <div style={{ padding: '14px' }}>
        {children}
      </div>
    </div>
  );
}

const styles = {
  // Card Helper
  actionCard: (bg, border, color) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    borderRadius: '12px',
    backgroundColor: bg,
    border: `1.5px solid ${border}`,
    textDecoration: 'none',
    color: color,
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    transition: 'all 0.15s ease'
  }),

  // Columns
  leftCol: { display: 'flex', flexDirection: 'column', gap: '15px' },
  centerCol: { display: 'flex', flexDirection: 'column', gap: '15px' },
  rightCol: { display: 'flex', flexDirection: 'column', gap: '15px' },

  // Blocks
  goldBoardBlock: {
    backgroundColor: '#fff',
    border: '2px solid #fde047',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(234, 179, 8, 0.12)',
    marginBottom: '20px'
  },
  goldBoardHeader: {
    backgroundColor: '#b45309',
    backgroundImage: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
    color: '#ffffff',
    padding: '14px 20px',
    fontSize: '16px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    letterSpacing: '0.5px'
  },
  portalBlock: {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
  },
  timeBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    color: '#d32f2f',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    width: '50px',
    height: '50px',
  },
  'timeBox span': { // Just inline it, this is React so I should put inline styles carefully
  },
  statIcon: {
    width: '40px',
    height: '40px',
    backgroundColor: '#f1f5f9',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  },
  portalBlockHeader: {
    color: 'white',
    padding: '8px 12px',
    fontWeight: 'bold',
    fontSize: '14px',
    textTransform: 'uppercase',
  },
  portalBlockContent: {
    padding: '10px',
  },
  listStyle: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    fontSize: '13px',
    lineHeight: '1.8',
    color: '#334155'
  },
  linkList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  linkListLi: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 0',
    borderBottom: '1px dashed #e2e8f0',
    fontSize: '13px',
  },
  sponsorList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  sponsorItem: {
    padding: '8px 0',
    borderBottom: '1px dashed #e2e8f0',
    fontSize: '13px',
  },

  // RSVP Highlight in Center
  rsvpHighlightBlock: {
    backgroundColor: '#fff',
    border: '2px solid #fde047',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(217, 119, 6, 0.12)',
    marginBottom: '20px'
  },
  rsvpHighlightHeader: {
    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
    color: '#ffffff',
    padding: '13px 20px',
    fontWeight: 'bold',
    fontSize: '15.5px',
    textAlign: 'center',
    letterSpacing: '0.5px',
    borderBottom: '2px solid #fef08a'
  },
  rsvpHighlightBody: {
    padding: '20px',
    backgroundColor: '#fffdf5',
  },
  searchForm: {
    display: 'flex',
    gap: '10px',
  },
  searchInput: {
    flex: 1,
    padding: '11px 16px',
    border: '1.5px solid #cbd5e1',
    borderRadius: '25px',
    fontSize: '14px',
    outline: 'none',
    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
  },
  searchBtn: {
    padding: '11px 24px',
    background: 'linear-gradient(135deg, #be123c 0%, #9f1239 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(190,18,60,0.25)',
    whiteSpace: 'nowrap'
  },
  errorMsg: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    fontSize: '13px',
    border: '1px solid #fca5a5',
    borderRadius: '4px',
  },

  // Invite Card Styling (Adapted for Portal)
  inviteCardWrapper: { marginTop: '15px' },
  inviteCard: {
    background: 'linear-gradient(135deg, #b71c1c 0%, #7f1d1d 100%)', // Deep red
    padding: '8px',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
  },
  inviteCardInner: {
    backgroundColor: '#fffcf2', // Cream color
    padding: '30px 20px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '2px dashed #d4af37', // Gold dashed border
    backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")',
  },
  inviteHeader: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '15px' },
  inviteLogoSmall: { width: '45px', height: '45px', background: 'linear-gradient(135deg, #d4af37 0%, #aa7c11 100%)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' },
  inviteSchool: { color: '#b71c1c', margin: 0, fontSize: '15px', fontWeight: 'bold', letterSpacing: '1px' },
  inviteIntro: { fontStyle: 'italic', color: '#666', fontSize: '14px', margin: '10px 0 5px' },
  inviteName: { fontFamily: '"Times New Roman", Georgia, serif', fontSize: '28px', margin: '5px 0', color: '#d4af37', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.1)' },
  inviteRole: { color: '#7f1d1d', fontSize: '14px', fontWeight: 'normal', margin: '5px 0 15px' },
  inviteDivider: { width: '80px', height: '2px', background: 'linear-gradient(90deg, transparent, #d4af37, transparent)', margin: '0 auto 15px' },
  inviteEvent: { fontWeight: 'bold', fontSize: '15px', marginBottom: '15px', color: '#1e293b', textTransform: 'uppercase' },
  inviteDetails: { backgroundColor: '#fff', padding: '15px', fontSize: '14px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #fde68a', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' },
  inviteDetailRow: { marginBottom: '8px', color: '#334155' },
  inviteAgenda: { backgroundColor: '#fffcf2', padding: '15px', border: '1px solid #d4af37', borderRadius: '8px' },

  rsvpActionBox: { marginTop: '15px', textAlign: 'center' },
  btnConfirm: { background: 'linear-gradient(135deg, #166534 0%, #14532d 100%)', color: 'white', padding: '10px 25px', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(22,101,52,0.3)' },
  btnDecline: { backgroundColor: '#fff', color: '#64748b', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '25px', cursor: 'pointer' },

  // News Block
  newsBlock: {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
  },
  newsMainHeader: {
    backgroundColor: '#166534',
    color: 'white',
    padding: '8px 15px',
    fontWeight: 'bold',
    fontSize: '15px',
  },
  newsMainContent: {
    padding: '15px',
  },
  featuredNewsImg: {
    width: '100%',
    height: '250px',
    objectFit: 'cover',
    marginBottom: '10px',
  },
  featuredNewsTitle: {
    color: '#166534',
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 5px 0',
  },
  newsMeta: {
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '10px',
  },
  featuredNewsDesc: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#334155',
  },
  olderNewsList: {
    listStyle: 'none',
    padding: 0,
    margin: '15px 0 0 0',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '10px',
  },
  olderNewsItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '5px',
    padding: '6px 0',
  },
  olderNewsLink: {
    color: '#0284c7',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
  },
};

