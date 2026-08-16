import { useState } from 'react';
import { 
  BookOpen, Trophy, HeartHandshake, Mail, Upload, 
  AlertCircle, HelpCircle, Award, ShieldCheck, Sparkles
} from 'lucide-react';

export default function PublicGuide() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div style={styles.container}>
      {/* BANNER HEADER */}
      <div style={styles.headerCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
          <div style={{ background: '#fef08a', padding: '12px', borderRadius: '12px', color: '#854d0e' }}>
            <BookOpen size={36} />
          </div>
          <div>
            <span style={styles.badge}>TÀI LIỆU HƯỚNG DẪN CHÍNH THỨC</span>
            <h1 style={styles.title}>CẨM NANG HƯỚNG DẪN VÀ ĐỒNG HÀNH CÙNG NHÀ TRƯỜNG</h1>
            <p style={styles.subtitle}>Lễ Kỷ Niệm 30 Năm Thành Lập Trường THPT Cao Bá Quát (1996 - 2026)</p>
          </div>
        </div>
      </div>

      {/* QUICK CATEGORY FILTER TABS */}
      <div style={styles.tabBar}>
        <button 
          onClick={() => setActiveTab('all')}
          style={activeTab === 'all' ? styles.tabBtnActive : styles.tabBtn}
        >
          <Sparkles size={16} /> Tất Cả Hướng Dẫn
        </button>
        <button 
          onClick={() => setActiveTab('sponsorship')}
          style={activeTab === 'sponsorship' ? styles.tabBtnActive : styles.tabBtn}
        >
          <HeartHandshake size={16} /> Đồng Hành & Tài Trợ
        </button>
        <button 
          onClick={() => setActiveTab('quiz')}
          style={activeTab === 'quiz' ? styles.tabBtnActive : styles.tabBtn}
        >
          <Trophy size={16} /> Cuộc Thi Tìm Hiểu
        </button>
        <button 
          onClick={() => setActiveTab('invite')}
          style={activeTab === 'invite' ? styles.tabBtnActive : styles.tabBtn}
        >
          <Mail size={16} /> Thiệp Mời & Lời Chúc
        </button>
        <button 
          onClick={() => setActiveTab('voting')}
          style={activeTab === 'voting' ? styles.tabBtnActive : styles.tabBtn}
        >
          <Upload size={16} /> Nộp Bài & Bình Chọn
        </button>
        <button 
          onClick={() => setActiveTab('admin')}
          style={activeTab === 'admin' ? styles.tabBtnActive : styles.tabBtn}
        >
          <ShieldCheck size={16} /> Quản Trị Admin
        </button>
      </div>

      {/* SECTION 1: ĐỒNG HÀNH VÀ ĐÓNG GÓP CÙNG NHÀ TRƯỜNG */}
      {(activeTab === 'all' || activeTab === 'sponsorship') && (
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <HeartHandshake size={24} color="#be123c" />
            <h2>1. ĐỒNG HÀNH & ĐÓNG GÓP TÀI TRỢ CÙNG NHÀ TRƯỜNG</h2>
          </div>
          <p style={styles.descText}>
            Hướng tới Lễ Kỷ Niệm 30 Năm Ngày Thành Lập Trường (1996 - 2026), Ban Tổ Chức trân trọng kính mời quý Cơ quan, Doanh nghiệp, các thế hệ Nhà giáo, quý Cha mẹ học sinh và các thế hệ Cựu học sinh cùng chung tay đồng hành, đóng góp nguồn lực để xây dựng công trình kỷ niệm và tổ chức thành công ngày Đại Lễ.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', margin: '20px 0' }}>
            <div style={styles.featureBox}>
              <div style={styles.boxIcon}><Award size={22} color="#ca8a04" /></div>
              <h4>Hạng Mục Ủng Hộ & Tài Trợ</h4>
              <ul style={styles.bulletList}>
                <li>Tài trợ kinh phí tổ chức Đại Lễ 30 năm.</li>
                <li>Tài trợ học bổng cho học sinh vượt khó học giỏi.</li>
                <li>Tài trợ hiện vật, quà kỷ niệm, cây xanh, công trình thanh niên.</li>
                <li>Ủng hộ Quỹ Khuyến học & Phát triển Nhà trường.</li>
              </ul>
            </div>

            <div style={styles.featureBox}>
              <div style={styles.boxIcon}><Sparkles size={22} color="#166534" /></div>
              <h4>Quyền Lợi Nhà Tài Trợ & Vinh Danh</h4>
              <ul style={styles.bulletList}>
                <li>Vinh danh tên cá nhân/tập thể trên <strong>Bảng Vàng Kỷ Niệm</strong> tại Cổng thông tin trường.</li>
                <li>In tên trên Kỷ yếu 30 năm và Bảng Vàng lưu danh tại khuôn viên trường.</li>
                <li>Vinh danh và trao thư cảm ơn trực tiếp tại Lễ Kỷ Niệm ngày 03/9/2026.</li>
              </ul>
            </div>
          </div>

          {/* BANK ACCOUNT CARD */}
          <div style={styles.bankCard}>
            <div style={{ fontWeight: 'bold', color: '#854d0e', fontSize: '16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BuildingBankIcon /> THÔNG TIN TÀI KHOẢN TIẾP NHẬN ĐÓNG GÓP
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', color: '#713f12', fontSize: '14.5px' }}>
              <div><strong>Tên tài khoản:</strong> Trường THPT Cao Bá Quát</div>
              <div><strong>Số tài khoản:</strong> 1234 5678 9999 (Agribank / Vietcombank)</div>
              <div><strong>Ngân hàng:</strong> Ngân hàng Agribank - Chi nhánh Tân An (Long An)</div>
              <div><strong>Nội dung chuyển khoản:</strong> <code>[Họ tên / Lớp] Ung ho Ky niem 30 nam</code></div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: CUỘC THI TRỰC TUYẾN TÌM HIỂU 30 NĂM */}
      {(activeTab === 'all' || activeTab === 'quiz') && (
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <Trophy size={24} color="#be123c" />
            <h2>2. HƯỚNG DẪN THAM GIA CUỘC THI TÌM HIỂU 30 NĂM TRƯỜNG THPT CAO BÁ QUÁT</h2>
          </div>
          <p style={styles.descText}>
            Cuộc thi trực tuyến là sân chơi bổ ích dành cho toàn thể học sinh đang theo học, cựu học sinh các thời kỳ và cán bộ giáo viên nhà trường nhằm ôn lại truyền thống 30 năm chắp cánh ước mơ.
          </p>

          <div style={styles.stepGrid}>
            <div style={styles.stepCard}>
              <div style={styles.stepBadge}>Bước 1</div>
              <h4>Đăng Ký Thông Tin Dự Thi</h4>
              <p>Truy cập vào mục <strong>"🏆 Cuộc thi tìm hiểu"</strong> (`/cuoc-thi`). Điền đầy đủ Họ và Tên (*), Lớp/Niên khóa (*) và **Số điện thoại liên hệ (*)**.</p>
            </div>

            <div style={styles.stepCard}>
              <div style={styles.stepBadge}>Bước 2</div>
              <h4>Làm 30 Câu Trắc Nghiệm</h4>
              <p>Trong thời gian tối đa 15 phút, trả lời 30 câu hỏi trắc nghiệm (mỗi câu 10 điểm, tổng 300 điểm) về lịch sử, thầy cô và thành tựu nhà trường.</p>
            </div>

            <div style={styles.stepCard}>
              <div style={styles.stepBadge}>Bước 3</div>
              <h4>Dự Đoán Phụ Xếp Hạng</h4>
              <p>Ở câu số 31, nhập số lượng thí sinh bạn dự đoán sẽ trả lời đúng 30/30 câu. Đây là căn cứ xếp hạng giải Nhất, Nhì, Ba khi bằng điểm.</p>
            </div>
          </div>

          {/* IMPORTANT RULES ALERT */}
          <div style={styles.alertBox}>
            <AlertCircle size={22} color="#991b1b" />
            <div>
              <strong>Quy định quan trọng từ Ban Tổ Chức:</strong>
              <ul style={{ margin: '5px 0 0 18px', padding: 0 }}>
                <li><strong>Mỗi số điện thoại chỉ được phép thi 01 LẦN DUY NHẤT:</strong> Hệ thống tự động chặn các lượt cố tình thi lại bằng cùng 1 SĐT.</li>
                <li><strong>Tiêu chí xếp hạng giải thưởng:</strong> Tổng điểm cao nhất ➔ Sai số câu dự đoán ít nhất ➔ Thời gian hoàn thành nhanh nhất (tính theo giây).</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: THIỆP MỜI ĐIỆN TỬ & SỔ LƯU BÚT */}
      {(activeTab === 'all' || activeTab === 'invite') && (
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <Mail size={24} color="#be123c" />
            <h2>3. HƯỚNG DẪN XEM THIỆP MỜI ĐIỆN TỬ & GỬI LỜI CHÚC LƯU BÚT</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
            <div style={styles.featureBox}>
              <h4>💌 Trải Nghiệm Thiệp Mời 3D Tương Tác</h4>
              <ul style={styles.bulletList}>
                <li>Mở liên kết thiệp cá nhân hoặc thiệp chung (`/thiep/chung`).</li>
                <li>Chuyển đổi linh hoạt giữa 5 phong cách trình diễn (*Cinelove, Lộng lẫy, Chuyên nghiệp, Hiện đại, Truyền thống*).</li>
                <li>Nhấn <strong>`📍 Chỉ Đường Google Maps`</strong> để mở ứng dụng chỉ đường tới nhà trường.</li>
                <li>Nhấn <strong>`📅 Thêm Vào Google Calendar`</strong> để lưu nhắc lịch hẹn ngày 03/9/2026.</li>
              </ul>
            </div>

            <div style={styles.featureBox}>
              <h4>✍️ Gửi Lời Chúc Kỷ Niệm 30 Năm</h4>
              <ul style={styles.bulletList}>
                <li>Nhập Họ tên và Lời chúc tri ân nhà trường.</li>
                <li>Bấm <strong>`💌 Gửi Lời Chúc`</strong>: Lời chúc sẽ xuất hiện trôi bồng bềnh công khai trên Tường lưu bút của trường.</li>
                <li>Lời chúc được đồng bộ thời gian thực cho hàng ngàn người xem cùng lúc.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: NỘP BÀI DỰ THI SÁNG TẠO & BÌNH CHỌN */}
      {(activeTab === 'all' || activeTab === 'voting') && (
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <Upload size={24} color="#be123c" />
            <h2>4. HƯỚNG DẪN NỘP BÀI DỰ THI SÁNG TẠO & BÌNH CHỌN TÁC PHẨM</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
            <div style={styles.featureBox}>
              <h4>📤 Nộp Bài Dự Thi Sáng Tạo (`/nop-bai-thi`)</h4>
              <p style={{ fontSize: '13.5px', color: '#475569' }}>Dành cho các chi đoàn học sinh và các tập thể cựu học sinh gửi tác phẩm tri ân kỷ niệm 30 năm trường.</p>
              <ul style={styles.bulletList}>
                <li>Điền thông tin tác giả, tiêu đề bài thi và nội dung mô tả.</li>
                <li>Đính kèm liên kết tệp Ảnh kỷ niệm, Video tri ân hoặc Kỷ yếu.</li>
                <li>Bài dự thi sau khi duyệt sẽ xuất hiện công khai tại mục Bình chọn.</li>
              </ul>
            </div>

            <div style={styles.featureBox}>
              <h4>🗳️ Bình Chọn Bài Thi Ấn Tượng (`/binh-chon`)</h4>
              <p style={{ fontSize: '13.5px', color: '#475569' }}>Khán giả toàn quốc tham gia bình chọn tác phẩm được yêu thích nhất.</p>
              <ul style={styles.bulletList}>
                <li>Xem toàn bộ tác phẩm sáng tạo tại trang Bình chọn.</li>
                <li>Bấm nút <strong>`❤️ Thả Tim / Bình Chọn`</strong> cho bài viết xuất sắc nhất.</li>
                <li>Thống kê lượt thả tim cập nhật trực tiếp theo thời gian thực.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: HƯỚNG DẪN DÀNH CHO ADMIN & BAN TỔ CHỨC */}
      {(activeTab === 'all' || activeTab === 'admin') && (
        <div style={{ ...styles.sectionCard, borderLeft: '4px solid #166534' }}>
          <div style={styles.sectionHeader}>
            <ShieldCheck size={24} color="#166534" />
            <h2 style={{ color: '#166534' }}>5. HƯỚNG DẪN QUẢN TRỊ DÀNH CHO BAN TỔ CHỨC (ADMIN GUIDE)</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
            <div style={styles.featureBox}>
              <h4>🏆 Quản Lý Cuộc Thi (`/admin/quizzes`)</h4>
              <ul style={styles.bulletList}>
                <li>Nạp tự động bộ 30 câu hỏi bằng nút <strong>`✨ Nạp 30 Câu Hỏi BTC`</strong>.</li>
                <li>Bấm <strong>`✏️ Sửa`</strong> để thay đổi nội dung, đáp án đúng của từng câu.</li>
                <li>Chỉnh sửa điểm trực tiếp tại ô <strong>`Điểm: [ 10 ] đ`</strong>.</li>
                <li>Bấm <strong>`📥 Xuất Excel / CSV`</strong> để tải danh sách thí sinh làm bài chuẩn UTF-8.</li>
              </ul>
            </div>

            <div style={styles.featureBox}>
              <h4>💌 Quản Lý Thiệp & Lời Chúc (`/admin/invite-config`)</h4>
              <ul style={styles.bulletList}>
                <li>Tạo mã link thiệp mời riêng cho từng vị Đại biểu, Thầy cô.</li>
                <li>Bấm <strong>`🗑️ Xóa Lời Chúc Mẫu`</strong> để dọn dẹp các câu chúc test.</li>
                <li>Quản lý danh sách khách mời đăng ký tham dự.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER HELP CARD */}
      <div style={styles.footerHelp}>
        <HelpCircle size={28} color="#be123c" />
        <div>
          <h4 style={{ margin: '0 0 4px 0', color: '#881337', fontSize: '16px' }}>CẦN HỖ TRỢ KỸ THUẬT VÀ GIẢI ĐÁP THẮC MẮC?</h4>
          <p style={{ margin: 0, color: '#475569', fontSize: '14px' }}>
            Quý đại biểu và cựu học sinh vui lòng liên hệ Ban Thư ký Lễ Kỷ Niệm qua Hotline/Zalo: <strong>0975 609 590</strong> hoặc Email: <strong>thptcaobaquat@longan.edu.vn</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

function BuildingBankIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>
    </svg>
  );
}

const styles = {
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '20px 15px 50px 15px',
    fontFamily: 'Arial, Helvetica, sans-serif'
  },
  headerCard: {
    background: 'linear-gradient(135deg, #be123c 0%, #881337 100%)',
    color: '#ffffff',
    padding: '26px 30px',
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(190,18,60,0.2)',
    marginBottom: '20px'
  },
  badge: {
    background: '#fde047',
    color: '#854d0e',
    fontSize: '11px',
    fontWeight: 'bold',
    padding: '3px 10px',
    borderRadius: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '8px 0 4px 0',
    color: '#fde047',
    textShadow: '0 2px 8px rgba(0,0,0,0.5)'
  },
  subtitle: {
    fontSize: '14px',
    color: '#f8fafc',
    margin: 0,
    opacity: 0.9
  },
  tabBar: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '10px',
    marginBottom: '25px'
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    borderRadius: '20px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#475569',
    fontWeight: 'bold',
    fontSize: '13.5px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease'
  },
  tabBtnActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    borderRadius: '20px',
    border: 'none',
    background: '#be123c',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '13.5px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(190,18,60,0.25)'
  },
  sectionCard: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '24px 28px',
    marginBottom: '25px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: '2px solid #f1f5f9',
    paddingBottom: '12px',
    marginBottom: '14px'
  },
  descText: {
    color: '#334155',
    fontSize: '14.5px',
    lineHeight: '1.6',
    margin: '0 0 15px 0'
  },
  featureBox: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '18px'
  },
  boxIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    marginBottom: '10px'
  },
  bulletList: {
    margin: '8px 0 0 0',
    paddingLeft: '18px',
    fontSize: '13.5px',
    color: '#334155',
    lineHeight: '1.7'
  },
  bankCard: {
    background: '#fefce8',
    border: '2px dashed #ca8a04',
    borderRadius: '14px',
    padding: '18px 22px',
    marginTop: '15px'
  },
  stepGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '15px',
    margin: '20px 0'
  },
  stepCard: {
    background: '#fff1f2',
    border: '1px solid #fecdd3',
    borderRadius: '14px',
    padding: '18px',
    position: 'relative'
  },
  stepBadge: {
    background: '#be123c',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '10px',
    display: 'inline-block',
    marginBottom: '8px'
  },
  alertBox: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: '12px',
    padding: '16px 20px',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    color: '#991b1b',
    fontSize: '13.5px',
    lineHeight: '1.6'
  },
  footerHelp: {
    background: '#fff1f2',
    border: '1px solid #ffe4e6',
    borderRadius: '14px',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  }
};
