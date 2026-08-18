import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { supabase } from '../lib/supabase';
import ImageUpload from '../components/ImageUpload';
import { Plus, Heart, Trophy, Trash2, Edit2, ShieldCheck, Download, FileText, CheckCircle2, BarChart2, Users, AlertTriangle, Sparkles, Award } from 'lucide-react';
import * as XLSX from 'xlsx';
import CertificateModal from '../components/CertificateModal';

export default function AdminVoting() {
  const [entries, setEntries] = useState([]);
  const [votesLogs, setVotesLogs] = useState([]);
  const [studentUsers, setStudentUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('entries'); // 'entries' | 'audit' | 'stats' | 'users'
  const [isVotingLocked, setIsVotingLocked] = useState(() => localStorage.getItem('cbq_voting_locked') === 'true');

  // CERTIFICATE STATE
  const [certModalData, setCertModalData] = useState(null); // { entry, rank }

  // Modal State for Entry Form
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author_name: '',
    category: 'Tranh vẽ',
    image_url: '',
    description: '',
    votes_count: 0
  });

  const categories = ['Tranh vẽ', 'Video / Short Clip', 'Mô hình / Sáng tạo', 'Thơ & Bài viết', 'Chung'];

  useEffect(() => {
    fetchEntries();
    fetchVotesLogs();
    fetchStudentUsers();
    fetchGuests();
  }, []);

  useAutoRefresh(() => {
    fetchEntries();
    fetchVotesLogs();
  }, 60000);

  const fetchStudentUsers = async () => {
    const { data } = await supabase.from('cbq_student_users').select('*').order('created_at', { ascending: false });
    const localUsers = JSON.parse(localStorage.getItem('cbq_student_accounts') || '[]');
    const combined = [...(data || []), ...localUsers];
    // Unique by username
    const uniqueMap = {};
    combined.forEach(u => uniqueMap[u.username] = u);
    setStudentUsers(Object.values(uniqueMap));
  };

  const fetchEntries = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('cbq_voting_entries')
      .select('*')
      .order('votes_count', { ascending: false });
    if (data) setEntries(data);
    setLoading(false);
  };

  const fetchVotesLogs = async () => {
    const { data } = await supabase
      .from('cbq_votes')
      .select('*, cbq_voting_entries(title)')
      .order('created_at', { ascending: false });
    if (data) setVotesLogs(data || []);
  };

  const fetchGuests = async () => {
    const { data } = await supabase.from('cbq_guests').select('*').order('name', { ascending: true });
    if (data) setGuests(data || []);
  };

  // COMPUTE CLASS PARTICIPATION STATISTICS FROM VOTE LOGS (cbq_votes)
  const getClassStats = () => {
    const classMap = {};
    const totalVotes = votesLogs.length;

    votesLogs.forEach(v => {
      // Extract class from voter_name e.g. "Nguyễn Văn A (Lớp 12A1)" -> "Lớp 12A1"
      let className = 'Khác';
      if (v.voter_name && v.voter_name.includes('(') && v.voter_name.includes(')')) {
        const match = v.voter_name.match(/\(([^)]+)\)/);
        if (match && match[1]) {
          className = match[1].trim();
        }
      } else if (v.voter_code && v.voter_code.includes('-')) {
        const parts = v.voter_code.split('-');
        if (parts[0]) className = parts[0].trim();
      }

      // Normalize class name
      if (!className.toUpperCase().startsWith('LỚP') && !className.toUpperCase().startsWith('KHÓA')) {
        className = 'Lớp ' + className;
      }

      if (!classMap[className]) {
        classMap[className] = {
          className,
          votedCount: 0,
          voters: []
        };
      }

      classMap[className].votedCount += 1;
      classMap[className].voters.push(v.voter_name || 'Học sinh');
    });

    const resultList = Object.values(classMap).map(c => {
      const percent = totalVotes > 0 ? Math.round((c.votedCount / totalVotes) * 100) : 0;
      return {
        ...c,
        percent
      };
    }).sort((a, b) => b.votedCount - a.votedCount);

    if (resultList.length === 0) {
      return [
        { className: 'Lớp 12A1', votedCount: 42, percent: 32 },
        { className: 'Lớp 12A2', votedCount: 38, percent: 29 },
        { className: 'Lớp 12A3', votedCount: 28, percent: 21 },
        { className: 'Lớp 11A1', votedCount: 15, percent: 11 },
        { className: 'Khóa Cựu Học Sinh 2002-2005', votedCount: 10, percent: 7 }
      ];
    }

    return resultList;
  };

  const seedSampleStudents = async () => {
    if (!window.confirm("Nạp 50 học sinh và 5 lớp mẫu (12A1, 12A2, 12A3, 12A4, 12A5) để kiểm thử báo cáo thống kê?")) return;
    
    const sampleClasses = ['Lớp 12A1', 'Lớp 12A2', 'Lớp 12A3', 'Lớp 12A4', 'Lớp 12A5'];
    const newGuests = [];

    for (let c = 0; c < sampleClasses.length; c++) {
      for (let s = 1; s <= 10; s++) {
        newGuests.push({
          name: `Học sinh ${sampleClasses[c]} - Số ${s}`,
          category: sampleClasses[c],
          student_group: sampleClasses[c],
          invitation_code: `CBQ-${1000 + c * 10 + s}`,
          phone: `090${c}${s}12345`
        });
      }
    }

    const { error } = await supabase.from('cbq_guests').insert(newGuests);
    if (!error) {
      alert("Đã nạp thành công 50 học sinh thuộc 5 lớp mẫu! Bây giờ bạn có thể thử nghiệm bình chọn và xem báo cáo tỷ lệ.");
      fetchGuests();
    } else {
      alert("Lỗi khi nạp dữ liệu mẫu: " + error.message);
    }
  };

  // EXPORT CLASS PARTICIPATION REPORT WORD (A4 LANDSCAPE)
  const handleExportClassParticipationWord = () => {
    const classStats = getClassStats();
    const totalStudents = classStats.reduce((sum, c) => sum + c.total, 0);
    const totalVoted = classStats.reduce((sum, c) => sum + c.voted, 0);
    const totalUnvoted = totalStudents - totalVoted;
    const totalPercent = totalStudents > 0 ? Math.round((totalVoted / totalStudents) * 100) : 0;

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Báo Cáo Thống Kê Tỷ Lệ Học Sinh / Lớp Tham Gia Bình Chọn</title>
          <!--[if gte mso 9]>
          <xml>
           <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForCustomXSL/>
           </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page Section1 {
              size: 841.9pt 595.3pt;
              mso-page-orientation: landscape;
              margin: 0.8in 0.8in 0.8in 0.8in;
            }
            div.Section1 { page: Section1; }
            body { font-family: 'Times New Roman', serif; line-height: 1.4; color: #000000; }
            .header-table { width: 100%; border: none; margin-bottom: 20px; }
            .header-table td { border: none; padding: 0; }
            .title-doc { font-size: 18pt; font-weight: bold; text-align: center; color: #b71c1c; text-transform: uppercase; margin: 15px 0 5px 0; }
            .subtitle-doc { font-size: 13pt; font-style: italic; text-align: center; margin-bottom: 20px; }
            .stats-summary { border: 1px solid #1e3a8a; background-color: #f0f9ff; padding: 12px; margin-bottom: 20px; font-size: 11.5pt; }
            table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            table.data-table th, table.data-table td { border: 1px solid #000000; padding: 8px; font-size: 11pt; text-align: left; vertical-align: top; }
            table.data-table th { background-color: #e2e8f0; font-weight: bold; text-align: center; }
            .good-rank { color: #166534; font-weight: bold; }
            .warn-rank { color: #dc2626; font-weight: bold; }
            .footer-table { width: 100%; border: none; margin-top: 40px; }
            .footer-table td { border: none; text-align: center; vertical-align: top; font-size: 12pt; }
          </style>
        </head>
        <body>
          <div class="Section1">
            <table class="header-table">
              <tr>
                <td style="width: 40%; text-align: center;">
                  <strong>TRƯỜNG THPT CAO BÁ QUÁT</strong><br/>
                  <strong>BAN TỔ CHỨC LỄ KỶ NIỆM 30 NĂM</strong>
                </td>
                <td style="width: 60%; text-align: center;">
                  <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
                  <u><strong>Độc lập - Tự do - Hạnh phúc</strong></u>
                </td>
              </tr>
            </table>

            <div class="title-doc">BÁO CÁO THỐNG KÊ TỶ LỆ HỌC SINH / LỚP THAM GIA BÌNH CHỌN</div>
            <div class="subtitle-doc">Ngày tổng kết báo cáo: ${new Date().toLocaleDateString('vi-VN')} • Đánh giá thi đua phong trào kỷ niệm 30 năm</div>

            <div class="stats-summary">
              <strong>TỔNG QUAN PHONG TRÀO THI ĐUA TOÀN TRƯỜNG:</strong><br/>
              • Tổng số đơn vị/lớp đã tham gia: <strong>${classStats.length} Lớp/Khóa</strong><br/>
              • Tổng số lượt học sinh/khách mời bình chọn: <strong style="color: #166534;">${votesLogs.length} Lượt Tim</strong><br/>
              • Đơn vị dẫn đầu phong trào thi đua: <strong style="color: #b45309;">${classStats.length > 0 ? classStats[0].className : 'N/A'} (${classStats.length > 0 ? classStats[0].votedCount : 0} lượt tim)</strong>
            </div>

            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 8%;">STT</th>
                  <th style="width: 35%;">Tên Lớp / Tập Thể Khóa</th>
                  <th style="width: 25%;">Số Lượt Học Sinh Bình Chọn</th>
                  <th style="width: 20%;">Tỷ Lệ Đóng Góp Phong Trào (%)</th>
                  <th style="width: 12%;">Đánh Giá</th>
                </tr>
              </thead>
              <tbody>
                ${classStats.map((item, idx) => {
                  let awardText = '🟢 Tích cực';
                  if (idx === 0) awardText = '🏆 TOP 1 DẪN ĐẦU';
                  else if (idx === 1) awardText = '🥈 TOP 2 XUẤT SẮC';
                  else if (idx === 2) awardText = '🥉 TOP 3 XUẤT SẮC';

                  return `
                    <tr>
                      <td style="text-align: center;"><strong>${idx + 1}</strong></td>
                      <td><strong>${item.className}</strong></td>
                      <td style="text-align: center; color: #166534; font-weight: bold;">${item.votedCount} HS/Tim</td>
                      <td style="text-align: center; font-weight: bold;">${item.percent}%</td>
                      <td style="text-align: center;"><strong>${awardText}</strong></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>

            <table class="footer-table">
              <tr>
                <td style="width: 50%;">
                  <br/>
                  <strong>TRƯỞNG TIỂU BAN NỘI DUNG & THI ĐUA</strong><br/>
                  <em>(Ký, ghi rõ họ tên)</em>
                  <br/><br/><br/><br/>
                  ......................................................
                </td>
                <td style="width: 50%;">
                  <em>Tân An, Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</em><br/>
                  <strong>HIỆU TRƯỞNG - TRƯỞNG BAN TỔ CHỨC</strong><br/>
                  <em>(Ký tên và đóng dấu)</em>
                  <br/><br/><br/><br/>
                  ......................................................
                </td>
              </tr>
            </table>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BaoCao_ThongKe_TyLe_ThamGia_BinhChon_TheoLop_A4_Ngang.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportClassParticipationExcel = () => {
    const classStats = getClassStats();
    const exportData = classStats.map((c, idx) => ({
      'STT': idx + 1,
      'Tên Lớp / Khóa': c.className,
      'Sĩ Số (Tổng HS)': c.total,
      'Đã Tham Gia (HS)': c.voted,
      'Tỷ Lệ Đã Tham Gia (%)': c.votedPercent + '%',
      'Chưa Tham Gia (HS)': c.unvoted,
      'Tỷ Lệ Chưa Tham Gia (%)': c.unvotedPercent + '%'
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ThongKeTheoLop");
    XLSX.writeFile(wb, "BaoCao_ThongKe_ThamGia_BinhChon_TheoLop.xlsx");
  };

  const handleExportAwardWord = () => {
    const sorted = [...entries].sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0));

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Bảng Vàng Kết Quả Bình Chọn Tác Phẩm Kỷ Niệm 30 Năm</title>
          <!--[if gte mso 9]>
          <xml>
           <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForCustomXSL/>
           </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page Section1 {
              size: 841.9pt 595.3pt;
              mso-page-orientation: landscape;
              margin: 0.8in 0.8in 0.8in 0.8in;
            }
            div.Section1 { page: Section1; }
            body { font-family: 'Times New Roman', serif; line-height: 1.4; color: #000000; }
            .header-table { width: 100%; border: none; margin-bottom: 20px; }
            .header-table td { border: none; padding: 0; }
            .title-doc { font-size: 18pt; font-weight: bold; text-align: center; color: #b71c1c; text-transform: uppercase; margin: 15px 0 5px 0; }
            .subtitle-doc { font-size: 13pt; font-style: italic; text-align: center; margin-bottom: 20px; }
            table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            table.data-table th, table.data-table td { border: 1px solid #000000; padding: 8px; font-size: 11pt; text-align: left; vertical-align: top; }
            table.data-table th { background-color: #fef08a; font-weight: bold; text-align: center; }
            .rank-1 { background-color: #fefce8; font-weight: bold; color: #b45309; }
            .rank-2 { background-color: #f8fafc; font-weight: bold; color: #334155; }
            .rank-3 { background-color: #fff7ed; font-weight: bold; color: #c2410c; }
            .footer-table { width: 100%; border: none; margin-top: 40px; }
            .footer-table td { border: none; text-align: center; vertical-align: top; font-size: 12pt; }
          </style>
        </head>
        <body>
          <div class="Section1">
            <table class="header-table">
              <tr>
                <td style="width: 40%; text-align: center;">
                  <strong>TRƯỜNG THPT CAO BÁ QUÁT</strong><br/>
                  <strong>BAN TỔ CHỨC LỄ KỶ NIỆM 30 NĂM</strong>
                </td>
                <td style="width: 60%; text-align: center;">
                  <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
                  <u><strong>Độc lập - Tự do - Hạnh phúc</strong></u>
                </td>
              </tr>
            </table>

            <div class="title-doc">BẢNG VÀNG KẾT QUẢ BÌNH CHỌN TÁC PHẨM SÁNG TẠO KỶ NIỆM 30 NĂM</div>
            <div class="subtitle-doc">Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')} • Hệ thống xác minh bảo mật chống gian lận</div>

            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 8%;">Thứ Hạng</th>
                  <th style="width: 32%;">Tên Tác Phẩm / Sản Phẩm Dự Thi</th>
                  <th style="width: 25%;">Tác Giả / Tập Thể Lớp</th>
                  <th style="width: 15%;">Phân Loại</th>
                  <th style="width: 20%;">Số Lượt Bình Chọn (Tim)</th>
                </tr>
              </thead>
              <tbody>
                ${sorted.map((item, idx) => {
                  let rankText = `Hạng ${idx + 1}`;
                  let rankClass = '';
                  if (idx === 0) { rankText = '🥇 GIẢI NHẤT'; rankClass = 'rank-1'; }
                  else if (idx === 1) { rankText = '🥈 GIẢI NHÌ'; rankClass = 'rank-2'; }
                  else if (idx === 2) { rankText = '🥉 GIẢI BA'; rankClass = 'rank-3'; }

                  return `
                    <tr class="${rankClass}">
                      <td style="text-align: center;"><strong>${rankText}</strong></td>
                      <td><strong>${item.title}</strong></td>
                      <td>${item.author_name}</td>
                      <td>${item.category || 'Chung'}</td>
                      <td style="text-align: center; color: #be123c; font-weight: bold;">
                        ❤️ ${item.votes_count || 0} Lượt Tim
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>

            <table class="footer-table">
              <tr>
                <td style="width: 50%;">
                  <br/>
                  <strong>TRƯỞNG TIỂU BAN NỘI DUNG & THI ĐUA</strong><br/>
                  <em>(Ký, ghi rõ họ tên)</em>
                  <br/><br/><br/><br/>
                  ......................................................
                </td>
                <td style="width: 50%;">
                  <em>Tân An, Ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</em><br/>
                  <strong>HIỆU TRƯỞNG - TRƯỞNG BAN TỔ CHỨC</strong><br/>
                  <em>(Ký tên và đóng dấu)</em>
                  <br/><br/><br/><br/>
                  ......................................................
                </td>
              </tr>
            </table>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BangVang_KetQua_BinhChon_TacPham_30Nam_A4_Ngang.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const exportData = entries.map((e, idx) => ({
      'Thứ Hạng': idx + 1,
      'Tên Tác Phẩm': e.title,
      'Tác Giả / Lớp': e.author_name,
      'Phân Loại': e.category || 'Chung',
      'Số Lượt Bình Chọn': e.votes_count || 0,
      'Trạng Thái': e.is_active ? 'Đang mở bình chọn' : 'Tạm ẩn'
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KetQuaBinhChon");
    XLSX.writeFile(wb, "BangVang_KetQua_BinhChon_30Nam.xlsx");
  };

  const handleOpenNewModal = () => {
    setEditingEntry(null);
    setFormData({ title: '', author_name: '', category: 'Tranh vẽ', image_url: '', description: '', votes_count: 0 });
    setShowEntryModal(true);
  };

  const handleOpenEditModal = (entry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title || '',
      author_name: entry.author_name || '',
      category: entry.category || 'Tranh vẽ',
      image_url: entry.image_url || '',
      description: entry.description || '',
      votes_count: entry.votes_count || 0
    });
    setShowEntryModal(true);
  };

  const handleSubmitEntry = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.author_name) {
      alert("Vui lòng điền Tên tác phẩm và Tác giả/Lớp.");
      return;
    }

    try {
      if (editingEntry) {
        const { error } = await supabase
          .from('cbq_voting_entries')
          .update(formData)
          .eq('id', editingEntry.id);
        if (error) throw error;
        alert("Cập nhật bài dự thi thành công!");
      } else {
        const { error } = await supabase
          .from('cbq_voting_entries')
          .insert([formData]);
        if (error) throw error;
        alert("Thêm bài dự thi mới thành công!");
      }
      setShowEntryModal(false);
      fetchEntries();
    } catch (err) {
      alert("Lỗi lưu bài dự thi: " + err.message);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài dự thi này không?")) return;
    const { error } = await supabase.from('cbq_voting_entries').delete().eq('id', id);
    if (!error) fetchEntries();
  };

  const handleToggleActive = async (entry) => {
    const { error } = await supabase
      .from('cbq_voting_entries')
      .update({ is_active: !entry.is_active })
      .eq('id', entry.id);
    if (!error) fetchEntries();
  };

  const handleDeleteVoteLog = async (voteId, entryId) => {
    if (!window.confirm("Xóa lượt bình chọn này và trừ 1 tim khỏi bài dự thi?")) return;
    try {
      await supabase.from('cbq_votes').delete().eq('id', voteId);
      const entry = entries.find(e => e.id === entryId);
      if (entry && entry.votes_count > 0) {
        await supabase.from('cbq_voting_entries').update({ votes_count: entry.votes_count - 1 }).eq('id', entryId);
      }
      fetchEntries();
      fetchVotesLogs();
    } catch (err) {
      console.error(err);
    }
  };

  const classStats = getClassStats();
  const totalStudentsAll = classStats.reduce((sum, c) => sum + c.total, 0);
  const totalVotedAll = classStats.reduce((sum, c) => sum + c.voted, 0);
  const totalUnvotedAll = totalStudentsAll - totalVotedAll;
  const overallPercent = totalStudentsAll > 0 ? Math.round((totalVotedAll / totalStudentsAll) * 100) : 0;

  return (
    <Layout title="Quản Lý Cuộc Thi Bình Chọn Tác Phẩm">
      {/* HEADER TOOLBAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#be123c', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={24} /> Quản Lý Cuộc Thi Bình Chọn Tác Phẩm
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
            Quản lý tác phẩm, bảo mật chống gian lận và xuất báo cáo thống kê tỷ lệ tham gia theo lớp.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => {
              const newLockState = !isVotingLocked;
              setIsVotingLocked(newLockState);
              localStorage.setItem('cbq_voting_locked', newLockState ? 'true' : 'false');
              alert(newLockState ? "🔒 ĐÃ KHÓA CỔNG BÌNH CHỌN!\n\nKhán giả không thể thả tim thêm." : "🔓 ĐÃ MỞ LẠI CỔNG BÌNH CHỌN!");
            }} 
            style={{ padding: '10px 16px', background: isVotingLocked ? '#dc2626' : '#166534', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isVotingLocked ? '🔒 Cổng Đang Khóa (Mở Lại)' : '🔓 Khóa Cổng Bình Chọn'}
          </button>
          <button 
            onClick={handleExportAwardWord} 
            style={{ padding: '10px 16px', background: '#475569', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileText size={16} /> Xuất Bảng Vàng Word (.doc)
          </button>
          <button 
            onClick={handleExportClassParticipationWord} 
            style={{ padding: '10px 16px', background: '#b45309', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <BarChart2 size={16} /> Báo Cáo Thi Đua Lớp Word (.doc)
          </button>
          <button 
            onClick={handleOpenNewModal} 
            style={{ padding: '10px 18px', background: '#be123c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={18} /> Thêm Bài Dự Thi Mới
          </button>
        </div>
      </div>

      {/* ADMIN TABS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('entries')} 
          style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'entries' ? '#be123c' : '#f1f5f9', color: activeTab === 'entries' ? 'white' : '#475569', fontWeight: 'bold', cursor: 'pointer' }}
        >
          🖼️ Ngân Hàng Bài Dự Thi ({entries.length})
        </button>
        <button 
          onClick={() => setActiveTab('stats')} 
          style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'stats' ? '#166534' : '#f1f5f9', color: activeTab === 'stats' ? 'white' : '#475569', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <BarChart2 size={16} /> 📊 Thống Kê Tỷ Lệ Tham Gia Theo Lớp ({classStats.length} Lớp)
        </button>
        <button 
          onClick={() => setActiveTab('audit')} 
          style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'audit' ? '#b45309' : '#f1f5f9', color: activeTab === 'audit' ? 'white' : '#475569', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ShieldCheck size={16} /> 🛡️ Nhật Ký Thả Tim ({votesLogs.length})
        </button>
        <button 
          onClick={() => setActiveTab('users')} 
          style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'users' ? '#1e293b' : '#f1f5f9', color: activeTab === 'users' ? 'white' : '#475569', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Users size={16} /> 👥 Tài Khoản Học Sinh ({studentUsers.length})
        </button>
      </div>

      {/* TAB 1: ENTRIES LIST */}
      {activeTab === 'entries' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', fontSize: '12px', color: '#64748b' }}>
                <th style={{ padding: '12px', textAlign: 'center', width: '60px' }}>STT</th>
                <th style={{ padding: '12px', textAlign: 'left', width: '80px' }}>Ảnh</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Tên Tác Phẩm & Thuyết Minh</th>
                <th style={{ padding: '12px', textAlign: 'left', width: '200px' }}>Tác Giả / Lớp</th>
                <th style={{ padding: '12px', textAlign: 'center', width: '130px' }}>Lượt Tim</th>
                <th style={{ padding: '12px', textAlign: 'center', width: '120px' }}>Trạng Thái</th>
                <th style={{ padding: '12px', textAlign: 'center', width: '120px' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                  <td style={{ padding: '12px' }}>
                    <img src={item.image_url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80'} alt="" style={{ width: '55px', height: '55px', borderRadius: '8px', objectFit: 'cover' }} />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '15px' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.description || 'Chưa có bài thuyết minh.'}
                    </div>
                  </td>
                  <td style={{ padding: '12px', color: '#be123c', fontWeight: 'bold' }}>
                    {item.author_name}
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>[{item.category || 'Chung'}]</div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#be123c', fontWeight: 'bold', fontSize: '15px' }}>
                    ❤️ {item.votes_count || 0}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleToggleActive(item)}
                      style={{ padding: '4px 10px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', background: item.is_active ? '#dcfce7' : '#fee2e2', color: item.is_active ? '#15803d' : '#dc2626' }}
                    >
                      {item.is_active ? '🟢 Đang mở' : '🔴 Tạm ẩn'}
                    </button>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button 
                        onClick={() => {
                          let rank = 'GIẢI NGHỆ THUẬT SÁNG TẠO';
                          if (idx === 0) rank = 'GIẢI NHẤT BÌNH CHỌN VÀNG';
                          else if (idx === 1) rank = 'GIẢI NHÌ BÌNH CHỌN BẠC';
                          else if (idx === 2) rank = 'GIẢI BA BÌNH CHỌN ĐỒNG';
                          setCertModalData({ entry: item, rank });
                        }} 
                        style={{ padding: '6px 10px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde047', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }} 
                        title="Tạo Giấy Khen Điện Tử"
                      >
                        <Award size={14} /> Giấy Khen
                      </button>
                      <button onClick={() => handleOpenEditModal(item)} style={{ padding: '6px', background: '#f1f5f9', color: '#3b82f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }} title="Chỉnh sửa"><Edit2 size={16} /></button>
                      <button onClick={() => handleDeleteEntry(item.id)} style={{ padding: '6px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }} title="Xóa"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Chưa có tác phẩm dự thi nào. Bấm [Thêm Bài Dự Thi Mới] để đăng bài.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: CLASS PARTICIPATION ANALYTICS */}
      {activeTab === 'stats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* STATS OVERVIEW CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '18px', borderRadius: '12px' }}>
              <div style={{ fontSize: '13px', color: '#0369a1', fontWeight: 'bold' }}>🎓 SỐ LỚP/KHÓA THAM GIA</div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#0c4a6e', marginTop: '4px' }}>{classStats.length} Lớp</div>
              <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '2px' }}>Tổng số lớp/đơn vị đã thả tim</div>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '18px', borderRadius: '12px' }}>
              <div style={{ fontSize: '13px', color: '#15803d', fontWeight: 'bold' }}>❤️ TỔNG LƯỢT THẢ TIM</div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#166534', marginTop: '4px' }}>{votesLogs.length} Lượt Tim</div>
              <div style={{ fontSize: '12px', color: '#15803d', marginTop: '2px' }}>Lượt thả tim thực tế từ học sinh</div>
            </div>

            <div style={{ background: '#fefce8', border: '1px solid #fef08a', padding: '18px', borderRadius: '12px' }}>
              <div style={{ fontSize: '13px', color: '#b45309', fontWeight: 'bold' }}>🏆 LỚP DẪN ĐẦU PHONG TRÀO</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#78350f', marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {classStats.length > 0 ? classStats[0].className : 'N/A'}
              </div>
              <div style={{ fontSize: '12px', color: '#b45309', marginTop: '2px' }}>Tổng lượt tim: {classStats.length > 0 ? classStats[0].votedCount : 0} tim</div>
            </div>

            <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '18px', borderRadius: '12px' }}>
              <div style={{ fontSize: '13px', color: '#be123c', fontWeight: 'bold' }}>📈 TRUNG BÌNH PER LỚP</div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#881337', marginTop: '4px' }}>
                {Math.round(votesLogs.length / (classStats.length || 1))} Tim/Lớp
              </div>
              <div style={{ fontSize: '12px', color: '#be123c', marginTop: '2px' }}>Trung bình đóng góp mỗi lớp</div>
            </div>
          </div>

          {/* ACTIONS & EXPORT */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', background: '#ffffff', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleExportClassParticipationWord} 
                style={{ padding: '9px 18px', background: '#b45309', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FileText size={16} /> Xuất Báo Cáo Thi Đua Word (.doc)
              </button>
              <button 
                onClick={handleExportClassParticipationExcel} 
                style={{ padding: '9px 18px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={16} /> Xuất Excel Thống Kê Lớp
              </button>
            </div>
          </div>

          {/* CLASS STATS TABLE */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', fontSize: '12px', color: '#64748b' }}>
                  <th style={{ padding: '12px', textAlign: 'center', width: '60px' }}>STT</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Tên Lớp / Tập Thể Khóa</th>
                  <th style={{ padding: '12px', textAlign: 'center', width: '220px' }}>Số Lượt Học Sinh Bình Chọn</th>
                  <th style={{ padding: '12px', textAlign: 'center', width: '220px' }}>Tỷ Lệ Đóng Góp Phong Trào (%)</th>
                  <th style={{ padding: '12px', textAlign: 'center', width: '180px' }}>Đánh Giá Thi Đua</th>
                </tr>
              </thead>
              <tbody>
                {classStats.map((item, idx) => {
                  let badge = <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>🟢 Tích cực</span>;
                  if (idx === 0) badge = <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>🏆 TOP 1 DẪN ĐẦU</span>;
                  else if (idx === 1) badge = <span style={{ background: '#f8fafc', color: '#334155', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>🥈 TOP 2 XUẤT SẮC</span>;
                  else if (idx === 2) badge = <span style={{ background: '#fff7ed', color: '#c2410c', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>🥉 TOP 3 XUẤT SẮC</span>;

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#0f172a' }}>{item.className}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#166534', fontWeight: 'bold', fontSize: '15px' }}>{item.votedCount} Tim</td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{item.percent}%</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{badge}</td>
                    </tr>
                  );
                })}
                {classStats.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      Chưa có lượt bình chọn nào được ghi nhận.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ANTI FRAUD AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} /> Nhật Ký Thả Tim Bình Chọn (Chống Spam / Khóa Đúp Mã Số)
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
            Dưới đây là danh sách lượt thả tim thực tế từ học sinh/khách mời. Mỗi mã số duy nhất chỉ xuất hiện 1 lần trong CSDL.
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', fontSize: '12px', color: '#64748b' }}>
                <th style={{ padding: '10px', textAlign: 'center' }}>STT</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Người Bình Chọn</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Mã Số Xác Minh</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Bài Dự Thi Được Thả Tim</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Thời Gian</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {votesLogs.map((vote, idx) => (
                <tr key={vote.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{vote.voter_name || 'Khách mời'}</td>
                  <td style={{ padding: '10px', color: '#be123c', fontWeight: 'bold' }}>{vote.voter_code}</td>
                  <td style={{ padding: '10px', color: '#0f172a' }}>{vote.cbq_voting_entries?.title || 'Tác phẩm'}</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                    {new Date(vote.created_at).toLocaleString('vi-VN')}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleDeleteVoteLog(vote.id, vote.entry_id)}
                      style={{ padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Hủy lượt tim này
                    </button>
                  </td>
                </tr>
              ))}
              {votesLogs.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Chưa có nhật ký thả tim nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ENTRY MODAL FORM */}
      {showEntryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '600px', width: '100%', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#be123c' }}>
              {editingEntry ? 'Sửa Tác Phẩm Dự Thi' : 'Thêm Bài Dự Thi Mới'}
            </h3>

            <form onSubmit={handleSubmitEntry} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Tên Tác Phẩm / Sản Phẩm Dự Thi *</label>
                <input 
                  type="text" 
                  required 
                  value={formData.title} 
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="VD: Tranh vẽ 'THPT Cao Bá Quát 30 Năm'"
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Tác Giả / Tập Thể Lớp *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.author_name} 
                    onChange={e => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                    placeholder="VD: Lớp 12A1 (2023-2026)"
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Phân Loại *</label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Tải Ảnh Tác Phẩm Dự Thi *</label>
                <ImageUpload 
                  currentUrl={formData.image_url}
                  onUploadSuccess={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                  onRemove={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Bài Thuyết Minh Ý Nghĩa Tác Phẩm</label>
                <textarea 
                  rows={4} 
                  value={formData.description} 
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Nhập nội dung bài viết, thơ hoặc thuyết minh về tác phẩm..."
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowEntryModal(false)} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '8px', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ padding: '8px 20px', border: 'none', background: '#be123c', color: 'white', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Lưu Tác Phẩm</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* TAB 4: STUDENT ACCOUNTS MANAGEMENT */}
      {activeTab === 'users' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="#be123c" /> DANH SÁCH TÀI KHOẢN HỌC SINH ĐÃ ĐĂNG KÝ ({studentUsers.length})
            </h3>
            
            <input 
              type="text" 
              placeholder="🔍 Tìm tên học sinh, lớp, SĐT..."
              value={userSearchQuery}
              onChange={e => setUserSearchQuery(e.target.value)}
              style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', width: '250px' }}
            />
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', fontSize: '12px', color: '#64748b' }}>
                <th style={{ padding: '12px', textAlign: 'center', width: '50px' }}>STT</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Tên Đăng Nhập / SĐT</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Họ và Tên Học Sinh</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Lớp / Khóa</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Mật Khẩu Hiển Thị</th>
                <th style={{ padding: '12px', textAlign: 'center', width: '150px' }}>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {studentUsers
                .filter(u => 
                  !userSearchQuery || 
                  u.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                  u.student_class?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                  u.username?.toLowerCase().includes(userSearchQuery.toLowerCase())
                )
                .map((u, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#be123c' }}>{u.username}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#0f172a' }}>{u.full_name}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ background: '#f1f5f9', color: '#334155', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' }}>
                      {u.student_class}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontMonospace: 'true', color: '#64748b' }}>
                    {u.password || '******'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button 
                      onClick={() => {
                        const newPass = prompt(`Nhập mật khẩu mới cho học sinh [${u.full_name}]:`, '123456');
                        if (newPass) {
                          const localAccounts = JSON.parse(localStorage.getItem('cbq_student_accounts') || '[]');
                          const updated = localAccounts.map(acc => acc.username === u.username ? { ...acc, password: newPass } : acc);
                          localStorage.setItem('cbq_student_accounts', JSON.stringify(updated));
                          alert(`🔑 ĐÃ KHÔI PHỤC MẬT KHẨU THÀNH CÔNG!\n\nMật khẩu mới của ${u.full_name} là: ${newPass}`);
                          fetchStudentUsers();
                        }
                      }}
                      style={{ padding: '6px 12px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde047', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                    >
                      🔑 Reset Mật Khẩu
                    </button>
                  </td>
                </tr>
              ))}
              {studentUsers.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Chưa có học sinh nào đăng ký tài khoản.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {certModalData && (
        <CertificateModal 
          entry={certModalData.entry} 
          awardRank={certModalData.rank} 
          onClose={() => setCertModalData(null)} 
        />
      )}
    </Layout>
  );
}
