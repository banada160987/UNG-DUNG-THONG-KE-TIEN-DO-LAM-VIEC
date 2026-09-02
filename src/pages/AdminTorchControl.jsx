import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase, logActivity } from '../lib/supabase';
import { Flame, Sparkles, Radio, Zap, RefreshCw, Trophy, ExternalLink, ShieldCheck, Play, Layers } from 'lucide-react';

export default function AdminTorchControl() {
  const [currentState, setCurrentState] = useState('idle');
  const [currentCohort, setCurrentCohort] = useState('ALL');
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [channelStatus, setChannelStatus] = useState('Connecting...');

  // COHORTS FOR STAGE CONTROL
  const cohorts = [
    { key: 'ALL', label: 'Tất cả các Khóa (Tự động)' },
    { key: '1996-2000', label: 'Khóa 1 (1996 - 2000)' },
    { key: '2001-2010', label: 'Thập kỷ Đầu (2001 - 2010)' },
    { key: '2011-2020', label: 'Thập kỷ Thứ hai (2011 - 2020)' },
    { key: '2021-2026', label: 'Khóa Hiện tại (2021 - 2026)' }
  ];

  useEffect(() => {
    // Read local initial
    try {
      const local = localStorage.getItem('cbq_torch_current_state');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.state) setCurrentState(parsed.state);
        if (parsed.cohort) setCurrentCohort(parsed.cohort);
        if (parsed.title) setCustomTitleInput(parsed.title);
      }
    } catch {}

    const channel = supabase.channel('cbq_torch_stage_channel');
    channel.subscribe((status) => {
      setChannelStatus(status === 'SUBSCRIBED' ? 'SẴN SÀNG ĐIỀU KHIỂN (REALTIME)' : status);
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // BROADCAST STATE CHANGE TO STAGE LED SCREEN
  const sendTorchTrigger = async (state, cohort = currentCohort, title = customTitleInput) => {
    setIsBroadcasting(true);
    setCurrentState(state);
    setCurrentCohort(cohort);

    const payload = { state, cohort, title: title.trim() };

    // 1. Save to LocalStorage for persistence
    localStorage.setItem('cbq_torch_current_state', JSON.stringify(payload));

    try {
      // 2. Realtime Supabase Broadcast
      await supabase.channel('cbq_torch_stage_channel').send({
        type: 'broadcast',
        event: 'TORCH_STATE_CHANGE',
        payload
      });

      // 3. Audit Log
      await logActivity('torch_stage', 'LED_STAGE', state, 'UPDATE', 'admin', `Điều khiển màn hình LED ngọn lửa: ${state} (${cohort})`);
    } catch (err) {
      console.warn("Lỗi phát sóng Realtime:", err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <Layout title="Điều Khiển Sân Sấu LED - Nghi Thức Truyền Lửa">
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* HEADER STATUS BANNER */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ margin: 0, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={26} color="#be123c" /> Bàn Điều Khiển Từ Xa Màn Hình LED Sân Sấu
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                Bấm phím điều khiển từ xa để kích hoạt từng giai đoạn nghi thức Truyền Ngọn Lửa Thiêng trên màn hình LED lớn
              </p>
            </div>
            
            <a 
              href="/truyen-lua-led" 
              target="_blank" 
              rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', backgroundColor: '#be123c', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '13.5px' }}
            >
              <ExternalLink size={16} /> Mở Màn Hình LED Sân Sấu (Stage Window)
            </a>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
            <Radio size={16} color="#166534" />
            <span>Trạng thái kết nối Realtime: <strong style={{ color: '#166534' }}>{channelStatus}</strong></span>
          </div>
        </div>

        {/* 4 STAGE TRIGGER BUTTONS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '25px' }}>
          
          {/* STEP 0: IDLE */}
          <div style={{ ...styles.actionCard, borderColor: currentState === 'idle' ? '#94a3b8' : '#e2e8f0', backgroundColor: currentState === 'idle' ? '#f8fafc' : '#ffffff' }}>
            <div style={styles.stepBadge}>BƯỚC 0</div>
            <h3 style={styles.stepTitle}>💤 1. Màn Hình Chờ</h3>
            <p style={styles.stepDesc}>Giao diện khởi động ban đầu với hạt lấp lánh nhẹ nhàng.</p>
            <button 
              onClick={() => sendTorchTrigger('idle')}
              disabled={isBroadcasting}
              style={{ ...styles.triggerBtn, backgroundColor: '#475569' }}
            >
              <Play size={16} /> Kích Hoạt Màn Chờ
            </button>
          </div>

          {/* STEP 1: TEACHERS / BGH */}
          <div style={{ ...styles.actionCard, borderColor: currentState === 'teacher' ? '#b45309' : '#e2e8f0', backgroundColor: currentState === 'teacher' ? '#fffbebfb' : '#ffffff' }}>
            <div style={{ ...styles.stepBadge, backgroundColor: '#f59e0b' }}>BƯỚC 1</div>
            <h3 style={{ ...styles.stepTitle, color: '#b45309' }}>🔥 2. Khởi Nguồn Lửa Thiêng</h3>
            <p style={styles.stepDesc}>Tôn vinh Ban Giám Hiệu & Các Thế hệ Thầy Cô (Khóa 1996).</p>
            <button 
              onClick={() => sendTorchTrigger('teacher', '1996-2000')}
              disabled={isBroadcasting}
              style={{ ...styles.triggerBtn, backgroundColor: '#d97706' }}
            >
              <Flame size={16} /> Thắp Ngọn Lửa Đầu
            </button>
          </div>

          {/* STEP 2: ALUMNI COHORTS */}
          <div style={{ ...styles.actionCard, borderColor: currentState === 'alumni' ? '#2563eb' : '#e2e8f0', backgroundColor: currentState === 'alumni' ? '#eff6ff' : '#ffffff' }}>
            <div style={{ ...styles.stepBadge, backgroundColor: '#2563eb' }}>BƯỚC 2</div>
            <h3 style={{ ...styles.stepTitle, color: '#1d4ed8' }}>⚡ 3. Lan Tỏa Niên Khóa</h3>
            <p style={styles.stepDesc}>Sóng ngọn lửa truyền qua các thế hệ cựu học sinh (1996 - 2020).</p>
            <button 
              onClick={() => sendTorchTrigger('alumni')}
              disabled={isBroadcasting}
              style={{ ...styles.triggerBtn, backgroundColor: '#2563eb' }}
            >
              <Zap size={16} /> Truyền Lửa Các Khóa
            </button>
          </div>

          {/* STEP 3: BURST CELEBRATION */}
          <div style={{ ...styles.actionCard, borderColor: currentState === 'burst' ? '#be123c' : '#e2e8f0', backgroundColor: currentState === 'burst' ? '#fff1f2' : '#ffffff' }}>
            <div style={{ ...styles.stepBadge, backgroundColor: '#be123c' }}>BƯỚC 3 (ĐỈNH CAO)</div>
            <h3 style={{ ...styles.stepTitle, color: '#be123c' }}>🌟 4. BÙNG NỔ 30 NĂM</h3>
            <p style={styles.stepDesc}>Học sinh hiện tại nhận đuốc ➔ Bùng nổ pháo hoa & rực rỡ 30 năm.</p>
            <button 
              onClick={() => sendTorchTrigger('burst', 'ALL')}
              disabled={isBroadcasting}
              style={{ ...styles.triggerBtn, backgroundColor: '#be123c' }}
            >
              <Trophy size={16} /> BÙNG NỔ 30 NĂM 🎉
            </button>
          </div>

        </div>

        {/* OVERRIDE CONTROLS & CUSTOM TITLE */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
            ⚙️ Tùy Chỉnh Nâng Cao Cho Ban Tổ Chức Sân Sấu
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
            <div>
              <label style={styles.label}>Chọn Niên khóa hiển thị cụ thể:</label>
              <select 
                value={currentCohort} 
                onChange={e => {
                  setCurrentCohort(e.target.value);
                  if (currentState === 'alumni') {
                    sendTorchTrigger('alumni', e.target.value);
                  }
                }}
                style={styles.selectInput}
              >
                {cohorts.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>Tiêu đề tùy chỉnh hiển thị trực tiếp lên LED:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Gõ tiêu đề phát biểu hoặc khẩu hiệu sân khấu..."
                  value={customTitleInput}
                  onChange={e => setCustomTitleInput(e.target.value)}
                  style={{ ...styles.selectInput, flex: 1 }}
                />
                <button 
                  onClick={() => sendTorchTrigger(currentState, currentCohort, customTitleInput)}
                  style={{ padding: '8px 16px', backgroundColor: '#166534', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Phát Tiêu Đề
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}

const styles = {
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    padding: '20px',
    border: '2px solid',
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    justify: 'space-between'
  },
  stepBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '12px',
    backgroundColor: '#64748b',
    color: 'white',
    fontSize: '11px',
    fontWeight: 'bold',
    width: 'fit-content',
    marginBottom: '10px'
  },
  stepTitle: {
    margin: '0 0 8px 0',
    fontSize: '17px',
    fontWeight: '800',
    color: '#1e293b'
  },
  stepDesc: {
    margin: '0 0 16px 0',
    fontSize: '13px',
    color: '#64748b',
    lineHeight: '1.45'
  },
  triggerBtn: {
    padding: '12px 16px',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: '6px'
  },
  selectInput: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13.5px',
    backgroundColor: '#ffffff',
    color: '#1e293b'
  }
};
