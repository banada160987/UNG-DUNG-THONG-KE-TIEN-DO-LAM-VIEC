import { Link } from 'react-router-dom';

export default function PublicGallery() {
  const mockImages = [
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1427504494785-319ce8372ac0?w=500&auto=format&fit=crop&q=60'
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Thư viện ảnh</h1>
        <Link to="/" style={styles.backBtn}>← Về trang chủ</Link>
      </div>
      <div style={styles.grid}>
        {mockImages.map((img, i) => (
          <img key={i} src={img} alt="gallery" style={styles.img} />
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1000px', margin: '40px auto', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #166534', paddingBottom: '10px', marginBottom: '20px' },
  title: { color: '#166534', margin: 0 },
  backBtn: { textDecoration: 'none', color: '#d32f2f', fontWeight: 'bold' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' },
  img: { width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }
};
