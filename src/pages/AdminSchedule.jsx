import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Calendar, Plus, Save, Trash2, Edit3, Eye, Clock, MapPin, CheckCircle2, RefreshCw } from 'lucide-react';

export default function AdminSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [weekNumber, setWeekNumber] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bghDuty, setBghDuty] = useState('');
  const [teacherDuty, setTeacherDuty] = useState('');
  const [note, setNote] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [items, setItems] = useState([]);

  // New Item State
  const [newItemDay, setNewItemDay] = useState('Thứ Hai');
  const [newItemTime, setNewItemTime] = useState('07:30');
  const [newItemContent, setNewItemContent] = useState('');
  const [newItemLocation, setNewItemLocation] = useState('Sân trường');
  const [newItemChair, setNewItemChair] = useState('BGH');
  const [newItemParticipants, setNewItemParticipants] = useState('Toàn thể GV & HS');

  useEffect(() => {
    fetchSchedules();
  }, []);

  async function fetchSchedules() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_schedules')
        .select('*')
        .order('week_number', { ascending: false });

      if (!error && data) {
        setSchedules(data);
      }
    } catch (err) {
      console.error("Lỗi nạp lịch công tác:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddItem = () => {
    if (!newItemContent.trim()) {
      alert("Vui lòng nhập nội dung công việc!");
      return;
    }
    const newItem = {
      day: newItemDay,
      time: newItemTime,
      content: newItemContent.trim(),
      location: newItemLocation.trim(),
      chair: newItemChair.trim(),
      participants: newItemParticipants.trim()
    };
    setItems([...items, newItem]);
    setNewItemContent('');
  };

  const handleDeleteItem = (index) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleEditSchedule = (s) => {
    setEditingId(s.id);
    setTitle(s.title || '');
    setWeekNumber(s.week_number || 1);
    setStartDate(s.start_date || '');
    setEndDate(s.end_date || '');
    setBghDuty(s.bgh_duty || '');
    setTeacherDuty(s.teacher_duty || '');
    setNote(s.note || '');
    setIsActive(s.is_active ?? true);
    setItems(s.schedule_items || []);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa Lịch công tác tuần này?")) return;
    try {
      const { error } = await supabase.from('cbq_schedules').delete().eq('id', id);
      if (error) throw error;
      fetchSchedules();
    } catch (err) {
      alert("Lỗi khi xóa: " + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title,
        week_number: Number(weekNumber) || 1,
        start_date: startDate,
        end_date: endDate,
        bgh_duty: bghDuty,
        teacher_duty: teacherDuty,
        schedule_items: items,
        note,
        is_active: isActive,
        updated_at: new Date().toISOString()
      };

      if (editingId) {
        const { error } = await supabase.from('cbq_schedules').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cbq_schedules').insert([payload]);
        if (error) throw error;
      }

      alert("🎉 ĐÃ LƯU LỊCH CÔNG TÁC TUẦN THÀNH CÔNG!");
      setShowForm(false);
      setEditingId(null);
      fetchSchedules();
    } catch (err) {
      alert("Lỗi khi lưu lịch: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Quản lý Lịch công tác tuần & Trực BGH">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={24} color="#be123c" /> Quản lý Lịch Công Tác Tuần & Trực BGH
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Phục vụ điều hành nhà trường hằng tuần (BGH duyệt xuất bản)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a 
            href="/lich-cong-tac" 
            target="_blank" 
            rel="noreferrer" 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#0284c7', textDecoration: 'none', padding: '10px 18px' }}
          >
            <Eye size={18} /> Xem Trang Công Khai
          </a>
          <button 
            onClick={() => {
              setEditingId(null);
              setTitle(`LỊCH CÔNG TÁC TUẦN ${schedules.length + 1}`);
              setWeekNumber(schedules.length + 1);
              setItems([]);
              setShowForm(!showForm);
            }} 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 22px', backgroundColor: '#be123c' }}
          >
            <Plus size={18} /> {showForm ? 'Đóng Form' : 'Tạo Lịch Tuần Mới'}
          </button>
        </div>
      </div>

      {/* FORM SECTION */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: 'white', marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
            {editingId ? '📝 Cập nhật Lịch công tác tuần' : '➕ Tạo Lịch công tác tuần mới'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '15px', marginTop: '15px' }}>
            <div>
              <label style={styles.label}>Tiêu đề Lịch tuần (*)</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} style={styles.input} placeholder="VD: LỊCH CÔNG TÁC TUẦN 01" />
            </div>

            <div>
              <label style={styles.label}>Tuần thứ (*)</label>
              <input type="number" required value={weekNumber} onChange={e => setWeekNumber(e.target.value)} style={styles.input} />
            </div>

            <div>
              <label style={styles.label}>Từ Ngày</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={styles.input} />
            </div>

            <div>
              <label style={styles.label}>Đến Ngày</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={styles.input} />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={styles.label}>Trực Ban Giám Hiệu</label>
              <input type="text" value={bghDuty} onChange={e => setBghDuty(e.target.value)} style={styles.input} placeholder="VD: Thầy Lê Văn A - Hiệu trưởng" />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={styles.label}>Trực Ban Giáo Viên</label>
              <input type="text" value={teacherDuty} onChange={e => setTeacherDuty(e.target.value)} style={styles.input} placeholder="VD: Cô Nguyễn Thị B - Trực ban" />
            </div>
          </div>

          {/* SCHEDULE ITEMS BUILDER */}
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>📌 Danh sách Công việc các ngày trong tuần ({items.length} mục)</h4>
            
            {/* Add Item Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'end', marginBottom: '15px' }}>
              <div>
                <label style={styles.label}>Thứ / Ngày</label>
                <input type="text" value={newItemDay} onChange={e => setNewItemDay(e.target.value)} style={styles.input} placeholder="Thứ Hai (01/09)" />
              </div>
              <div>
                <label style={styles.label}>Thời gian</label>
                <input type="text" value={newItemTime} onChange={e => setNewItemTime(e.target.value)} style={styles.input} placeholder="07:30" />
              </div>
              <div>
                <label style={styles.label}>Nội dung công việc (*)</label>
                <input type="text" value={newItemContent} onChange={e => setNewItemContent(e.target.value)} style={styles.input} placeholder="Nội dung họp/hoạt động..." />
              </div>
              <div>
                <label style={styles.label}>Địa điểm</label>
                <input type="text" value={newItemLocation} onChange={e => setNewItemLocation(e.target.value)} style={styles.input} placeholder="Phòng họp" />
              </div>
              <div>
                <label style={styles.label}>Chủ trì</label>
                <input type="text" value={newItemChair} onChange={e => setNewItemChair(e.target.value)} style={styles.input} placeholder="BGH" />
              </div>
              <div>
                <label style={styles.label}>Thành phần</label>
                <input type="text" value={newItemParticipants} onChange={e => setNewItemParticipants(e.target.value)} style={styles.input} placeholder="Toàn trường" />
              </div>
              <button type="button" onClick={handleAddItem} className="btn-primary" style={{ padding: '10px 14px', backgroundColor: '#166534' }}>
                <Plus size={16} /> Thêm
              </button>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#ffffff' }}>
                  <th style={{ padding: '8px' }}>Thứ / Ngày</th>
                  <th style={{ padding: '8px' }}>Giờ</th>
                  <th style={{ padding: '8px' }}>Nội dung</th>
                  <th style={{ padding: '8px' }}>Địa điểm</th>
                  <th style={{ padding: '8px' }}>Chủ trì</th>
                  <th style={{ padding: '8px' }}>Thành phần</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Xóa</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold', color: '#be123c' }}>{it.day}</td>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{it.time}</td>
                    <td style={{ padding: '8px' }}>{it.content}</td>
                    <td style={{ padding: '8px', color: '#0284c7' }}>{it.location}</td>
                    <td style={{ padding: '8px', fontWeight: 'bold', color: '#b45309' }}>{it.chair}</td>
                    <td style={{ padding: '8px', color: '#64748b' }}>{it.participants}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <button type="button" onClick={() => handleDeleteItem(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Hủy</button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '10px 24px', backgroundColor: '#be123c' }}>
              <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu & Xuất Bản'}
            </button>
          </div>
        </form>
      )}

      {/* SCHEDULES LIST TABLE */}
      <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: 'white' }}>
        <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
          📋 Danh sách Lịch công tác tuần đã đăng ({schedules.length})
        </h3>

        {loading ? <p>Đang nạp dữ liệu...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                  <th style={{ padding: '10px' }}>Tuần</th>
                  <th style={{ padding: '10px' }}>Tiêu đề lịch tuần</th>
                  <th style={{ padding: '10px' }}>Trực BGH</th>
                  <th style={{ padding: '10px' }}>Số mục công việc</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s, idx) => (
                  <tr key={s.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#be123c' }}>Tuần {s.week_number}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>{s.title}</td>
                    <td style={{ padding: '10px', color: '#b45309' }}>{s.bgh_duty || 'Chưa phân công'}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{s.schedule_items?.length || 0} mục</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={() => handleEditSchedule(s)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', cursor: 'pointer' }}>
                          <Edit3 size={14} /> Sửa
                        </button>
                        <button type="button" onClick={() => handleDeleteSchedule(s.id)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}>
                          <Trash2 size={14} /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

const styles = {
  label: { display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 'bold', color: '#334155' },
  input: { width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }
};
