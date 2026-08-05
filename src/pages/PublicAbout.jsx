import { Link } from 'react-router-dom';

export default function PublicAbout() {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Giới thiệu trường THPT Cao Bá Quát</h1>
        <Link to="/" style={styles.backBtn}>← Về trang chủ</Link>
      </div>
      <div style={styles.content}>
        <p>Trường THPT Cao Bá Quát được thành lập vào năm 1996. Trải qua 30 năm xây dựng và phát triển...</p>
        <p>(Nội dung chi tiết đang được cập nhật bởi Ban tổ chức)</p>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '800px', margin: '40px auto', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #166534', paddingBottom: '10px', marginBottom: '20px' },
  title: { color: '#166534', margin: 0 },
  backBtn: { textDecoration: 'none', color: '#d32f2f', fontWeight: 'bold' },
  content: { lineHeight: '1.8', fontSize: '16px' }
};
