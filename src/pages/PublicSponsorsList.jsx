import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

export default function PublicSponsorsList() {
  const [sponsors, setSponsors] = useState([]);

  useEffect(() => {
    supabase.from('cbq_sponsors').select('*').eq('is_public', true).order('date_received', { ascending: false }).then(({data}) => {
      if(data) setSponsors(data);
    });
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Bảng vàng tri ân</h1>
        <Link to="/" style={styles.backBtn}>← Về trang chủ</Link>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Nhà tài trợ</th>
            <th style={styles.th}>Hình thức / Hiện vật</th>
            <th style={styles.th}>Số tiền (VNĐ)</th>
          </tr>
        </thead>
        <tbody>
          {sponsors.map(s => (
            <tr key={s.id}>
              <td style={styles.td}><strong>{s.name}</strong></td>
              <td style={styles.td}>{s.donation_item || '-'}</td>
              <td style={{...styles.td, color: '#d32f2f', fontWeight: 'bold'}}>{s.donation_amount ? Number(s.donation_amount).toLocaleString() : '-'}</td>
            </tr>
          ))}
          {sponsors.length === 0 && (
            <tr><td colSpan="3" style={{padding: '20px', textAlign: 'center'}}>Đang cập nhật...</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1000px', margin: '40px auto', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #d32f2f', paddingBottom: '10px', marginBottom: '20px' },
  title: { color: '#d32f2f', margin: 0 },
  backBtn: { textDecoration: 'none', color: '#166534', fontWeight: 'bold' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { backgroundColor: '#d32f2f', color: 'white', padding: '10px', textAlign: 'left', border: '1px solid #b71c1c' },
  td: { padding: '10px', border: '1px solid #e2e8f0' }
};
