import { Link } from 'react-router-dom';

export default function PublicDocs() {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Văn bản - Thông báo</h1>
        <Link to="/" style={styles.backBtn}>← Về trang chủ</Link>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>STT</th>
            <th style={styles.th}>Tên văn bản</th>
            <th style={styles.th}>Ngày ban hành</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={styles.td}>1</td>
            <td style={styles.td}>Kế hoạch tổ chức Lễ Kỷ niệm 30 năm</td>
            <td style={styles.td}>01/08/2026</td>
          </tr>
          <tr>
            <td style={styles.td}>2</td>
            <td style={styles.td}>Quyết định thành lập các Tiểu ban</td>
            <td style={styles.td}>15/07/2026</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1000px', margin: '40px auto', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #166534', paddingBottom: '10px', marginBottom: '20px' },
  title: { color: '#166534', margin: 0 },
  backBtn: { textDecoration: 'none', color: '#d32f2f', fontWeight: 'bold' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { backgroundColor: '#166534', color: 'white', padding: '10px', textAlign: 'left', border: '1px solid #14532d' },
  td: { padding: '10px', border: '1px solid #e2e8f0' }
};
