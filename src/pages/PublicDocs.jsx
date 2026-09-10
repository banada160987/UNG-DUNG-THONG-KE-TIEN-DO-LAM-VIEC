import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { FileText, Send, Calendar, Phone, Sparkles, AlertCircle, Download, Bot, ShieldCheck } from 'lucide-react';
import { exportAiRulesToWordDecree30 } from '../utils/decree30AiRulesWord';

export default function PublicDocs() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiRulesPublished, setAiRulesPublished] = useState(false);

  useEffect(() => {
    supabase.from('cbq_documents').select('*').order('published_date', { ascending: false }).then(({data}) => {
      if(data) {
        setDocs(data);
        const hasAiDoc = data.some(d => d.file_url === 'ai_rules_decree30' || (d.title && d.title.includes('Trí tuệ Nhân tạo')));
        const localStatus = localStorage.getItem('cbq_ai_rules_status');
        if (hasAiDoc || localStatus === 'published') {
          setAiRulesPublished(true);
        } else {
          setAiRulesPublished(false);
        }
      }
      setLoading(false);
    });
  }, []);

  return (
    <div style={styles.container}>

      {/* FEATURED BANNER BAN HÀNH QUY TẮC SỬ DỤNG AI TRONG NHÀ TRƯỜNG (CHỈ HIỂN THỊ KHI ADMIN ĐÃ BAN HÀNH) */}
      {aiRulesPublished && (
        <div style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          borderRadius: '16px',
          padding: '22px',
          color: '#ffffff',
          marginBottom: '20px',
          boxShadow: '0 8px 20px rgba(2,132,199,0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: '20px', fontSize: '12.5px', fontWeight: 'bold', width: 'fit-content', marginBottom: '10px' }}>
            <Bot size={16} color="#38bdf8" /> QUYẾT ĐỊNH BAN HÀNH QUY TẮC SỬ DỤNG AI - NĂM HỌC 2026 - 2027
          </div>
          
          <h2 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#ffffff', lineHeight: '1.4', fontWeight: '900' }}>
            🤖 Quyết định số 158/QĐ-THPTCBQ: Ban hành Quy tắc sử dụng Trí tuệ Nhân tạo (AI) trong nhà trường
          </h2>
          
          <p style={{ margin: '0 0 14px 0', fontSize: '13.5px', color: '#e0f2fe', lineHeight: '1.6' }}>
            Thực hiện hướng dẫn của Bộ Giáo dục & Đào tạo (tối thiểu <strong>12 tiết/lớp/năm học</strong> đối với nội dung cốt lõi); Phân công rõ trách nhiệm cán bộ quản lý, tổ chuyên môn, GV Tin học, GV bộ môn, GVCN & đầu mối kỹ thuật; Bảo vệ dữ liệu cá nhân học sinh theo Nghị định 13/2023/NĐ-CP và đảm bảo trung thực học thuật.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => exportAiRulesToWordDecree30()}
              style={{ padding: '10px 20px', background: '#ffffff', color: '#0369a1', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
            >
              <Download size={18} /> 📥 Tải File Word Quy Tắc AI (.doc chuẩn NĐ 30)
            </button>
            <span style={{ fontSize: '12.5px', color: '#f0f9ff', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={16} /> Áp dụng đối với toàn thể Cán bộ, Giáo viên & Học sinh toàn trường
            </span>
          </div>
        </div>
      )}
      
      {/* FEATURED BANNER CÔNG VĂN QUỸ HỌC BỔNG */}
      <div style={{
        background: 'linear-gradient(135deg, #166534 0%, #14532d 100%)',
        borderRadius: '16px',
        padding: '22px',
        color: '#ffffff',
        marginBottom: '25px',
        boxShadow: '0 8px 20px rgba(22,101,52,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: '20px', fontSize: '12.5px', fontWeight: 'bold', width: 'fit-content', marginBottom: '10px' }}>
          <Sparkles size={15} color="#fde047" /> THÔNG BÁO KHẨN TỪ BGH TRƯỜNG THPT CAO BÁ QUÁT
        </div>
        
        <h2 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#fde047', lineHeight: '1.4' }}>
          📜 Công văn lấy ý kiến Góp ý Dự thảo Đề án Thành lập Quỹ Học bổng "Chắp cánh ước mơ tuổi học trò"
        </h2>
        
        <p style={{ margin: '0 0 14px 0', fontSize: '13.5px', color: '#dcfce7', lineHeight: '1.6' }}>
          Căn cứ Công văn 409/SGDĐT-VP ngày 11/02/2026 của Sở GD&ĐT & Kế hoạch 53/KH-TrTHPTCBQ. Đề nghị BCH Đảng ủy, BTV Đoàn trường, các Tổ chuyên môn & Tổ Văn phòng gửi ý kiến góp ý trước ngày <strong>19/8/2026</strong>.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link
            to="/gop-y-quy-hoc-bong"
            style={{ padding: '10px 18px', background: '#fde047', color: '#14532d', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}
          >
            <Send size={16} /> ✍️ Gửi Ý Kiến Góp Ý Trực Tuyến Ngay ➔
          </Link>
          <span style={{ fontSize: '12.5px', color: '#e2e8f0' }}>📞 Liên hệ giải đáp: Đ/c <strong>Nghiêm Xuân Bảo</strong> (Tổ Văn phòng)</span>
        </div>
      </div>

      <div style={styles.header}>
        <h1 style={styles.title}>Văn bản - Thông báo Chính thức</h1>
      </div>
      
      {loading ? <p>Đang tải danh sách văn bản...</p> : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>STT</th>
              <th style={styles.th}>Ngày ban hành</th>
              <th style={styles.th}>Tên văn bản / Thông báo</th>
              <th style={styles.th}>Tệp đính kèm</th>
            </tr>
          </thead>
          <tbody>
            {/* THÊM DÒNG QUYẾT ĐỊNH QUY TẮC AI (CHỈ HIỂN THỊ KHI ĐÃ BAN HÀNH) */}
            {aiRulesPublished && (
              <tr style={{ background: '#f0f9ff' }}>
                <td style={{ ...styles.td, textAlign: 'center', fontWeight: 'bold', color: '#0284c7' }}>📌</td>
                <td style={{ ...styles.td, fontWeight: 'bold', color: '#0284c7' }}>10/09/2026</td>
                <td style={styles.td}>
                  <strong style={{ color: '#0369a1' }}>Quyết định số 158/QĐ-THPTCBQ: Ban hành Quy tắc sử dụng Trí tuệ Nhân tạo (AI) trong nhà trường năm học 2026 - 2027</strong>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                    Ban hành theo hướng dẫn của Bộ GD&ĐT (12 tiết cốt lõi/năm), Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân & Quy tắc trung thực học thuật.
                  </div>
                </td>
                <td style={styles.td}>
                  <button 
                    onClick={() => exportAiRulesToWordDecree30()}
                    style={{ color: '#0284c7', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '13px' }}
                  >
                    📥 Tải Word (NĐ 30)
                  </button>
                </td>
              </tr>
            )}

            {/* THÊM DÒNG NỔI BẬT CÔNG VĂN QUỸ HỌC BỔNG */}
            <tr style={{ background: '#f0fdf4' }}>
              <td style={{ ...styles.td, textAlign: 'center', fontWeight: 'bold', color: '#166534' }}>📌</td>
              <td style={{ ...styles.td, fontWeight: 'bold', color: '#166534' }}>12/03/2026</td>
              <td style={styles.td}>
                <strong style={{ color: '#166534' }}>Công văn số 409/SGDĐT-VP & Kế hoạch 53/KH-TrTHPTCBQ: Lấy ý kiến góp ý dự thảo Đề án Thành lập Quỹ Học bổng "Chắp cánh ước mơ tuổi học trò"</strong>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                  Đơn vị nhận: BCH Đảng ủy, BTV Đoàn trường, Các Tổ chuyên môn & Tổ Văn phòng (Hạn chót: 19/8/2026).
                </div>
              </td>
              <td style={styles.td}>
                <Link to="/gop-y-quy-hoc-bong" style={{ color: '#166534', fontWeight: 'bold', textDecoration: 'none' }}>
                  ✍️ Gửi Góp Ý
                </Link>
              </td>
            </tr>

            {docs.map((d, index) => (
              <tr key={d.id}>
                <td style={{ ...styles.td, textAlign: 'center' }}>{index + 2}</td>
                <td style={styles.td}>{new Date(d.published_date).toLocaleDateString('vi-VN')}</td>
                <td style={styles.td}><strong>{d.title}</strong></td>
                <td style={styles.td}>
                  {d.file_url ? (
                    <a href={d.file_url} target="_blank" rel="noreferrer" style={{color: '#166534', fontWeight: 'bold', textDecoration: 'none'}}>
                      Tải về / Xem
                    </a>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '1050px', margin: '30px auto', padding: '25px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #166534', paddingBottom: '10px', marginBottom: '20px' },
  title: { color: '#166534', margin: 0, fontSize: '22px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { backgroundColor: '#166534', color: 'white', padding: '12px 10px', textAlign: 'left', border: '1px solid #14532d' },
  td: { padding: '12px 10px', border: '1px solid #e2e8f0', fontSize: '13.5px' }
};
