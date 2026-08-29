import React from 'react';
import Layout from '../components/Layout';
import { 
  GraduationCap, 
  PenTool, 
  Monitor, 
  Mail, 
  Globe, 
  BookOpen, 
  FileText,
  ExternalLink
} from 'lucide-react';

export default function AppHub() {
  const apps = [
    {
      category: "Hệ thống Quản lý Giảng dạy",
      items: [
        {
          name: "SMAS",
          description: "Hệ thống quản lý điểm và học bạ điện tử (Viettel).",
          url: "https://smas.edu.vn",
          icon: <GraduationCap size={32} color="#dc2626" />, // red
          bgColor: "#fee2e2",
          borderColor: "#fca5a5"
        },
        {
          name: "CSDL Ngành",
          description: "Cơ sở dữ liệu ngành Giáo dục.",
          url: "https://csdl.moet.gov.vn",
          icon: <BookOpen size={32} color="#2563eb" />, // blue
          bgColor: "#dbeafe",
          borderColor: "#93c5fd"
        }
      ]
    },
    {
      category: "Thi & Kiểm tra Trực tuyến",
      items: [
        {
          name: "Azota",
          description: "Giao bài tập, tạo đề thi trắc nghiệm trực tuyến.",
          url: "https://azota.vn",
          icon: <PenTool size={32} color="#16a34a" />, // green
          bgColor: "#dcfce7",
          borderColor: "#86efac"
        },
        {
          name: "K12Online",
          description: "Hệ thống quản lý học tập và thi trực tuyến (Viettel).",
          url: "https://k12online.vn",
          icon: <Monitor size={32} color="#d97706" />, // yellow/orange
          bgColor: "#fef3c7",
          borderColor: "#fcd34d"
        },
        {
          name: "OLM",
          description: "Hệ thống học tập, thi trực tuyến (ĐH Quốc gia HN).",
          url: "https://olm.vn",
          icon: <FileText size={32} color="#0d9488" />, // teal
          bgColor: "#ccfbf1",
          borderColor: "#5eead4"
        }
      ]
    },
    {
      category: "Hành chính & Nội bộ",
      items: [
        {
          name: "Email Trường",
          description: "Hệ thống thư điện tử nội bộ.",
          url: "https://mail.google.com",
          icon: <Mail size={32} color="#4f46e5" />, // indigo
          bgColor: "#e0e7ff",
          borderColor: "#a5b4fc"
        },
        {
          name: "Website Trường",
          description: "Cổng thông tin điện tử của trường.",
          url: "/",
          icon: <Globe size={32} color="#0891b2" />, // cyan
          bgColor: "#cffafe",
          borderColor: "#67e8f9"
        }
      ]
    }
  ];

  return (
    <Layout>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '28px', color: '#1e293b', marginBottom: '10px', fontWeight: 'bold' }}>Cổng Tiện Ích</h1>
          <p style={{ color: '#64748b', fontSize: '16px' }}>Danh bạ tổng hợp các phần mềm và hệ thống ứng dụng dành cho Giáo viên</p>
        </div>

        {apps.map((category, index) => (
          <div key={index} style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '20px', color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px', fontWeight: '600' }}>
              {category.category}
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '20px' 
            }}>
              {category.items.map((app, appIndex) => (
                <a 
                  key={appIndex}
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '20px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    color: 'inherit',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
                  }}
                >
                  <div style={{ 
                    width: '60px', 
                    height: '60px', 
                    borderRadius: '12px', 
                    background: app.bgColor,
                    border: `1px solid ${app.borderColor}`,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginRight: '16px',
                    flexShrink: 0
                  }}>
                    {app.icon}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 'bold' }}>{app.name}</h3>
                      <ExternalLink size={16} color="#94a3b8" />
                    </div>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
                      {app.description}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
        
        <div style={{ 
          background: '#f8fafc', 
          border: '1px dashed #cbd5e1', 
          borderRadius: '8px', 
          padding: '20px', 
          textAlign: 'center',
          marginTop: '40px'
        }}>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
            💡 Cổng tiện ích được quản lý tập trung. Nếu thầy/cô cần bổ sung thêm phần mềm nào khác, vui lòng liên hệ với Ban Quản trị.
          </p>
        </div>
      </div>
    </Layout>
  );
}
