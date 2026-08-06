import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function PublicDocs() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('cbq_documents').select('*').order('published_date', { ascending: false }).then(({data}) => {
      if(data) setDocs(data);
      setLoading(false);
    });
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Văn bản - Thông báo</h1>
      </div>
      
      {loading ? <p>Đang tải...</p> : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>STT</th>
              <th style={styles.th}>Ngày ban hành</th>
              <th style={styles.th}>Tên văn bản</th>
              <th style={styles.th}>Tệp đính kèm</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d, index) => (
              <tr key={d.id}>
                <td style={styles.td}>{index + 1}</td>
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
            {docs.length === 0 && (
              <tr><td colSpan="4" style={{...styles.td, textAlign: 'center'}}>Đang cập nhật...</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '1000px', margin: '40px auto', padding: '30px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #166534', paddingBottom: '10px', marginBottom: '20px' },
  title: { color: '#166534', margin: 0, fontSize: '24px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { backgroundColor: '#166534', color: 'white', padding: '10px', textAlign: 'left', border: '1px solid #14532d' },
  td: { padding: '10px', border: '1px solid #e2e8f0' }
};
