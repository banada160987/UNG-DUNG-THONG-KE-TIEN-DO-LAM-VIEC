import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase, logActivity } from '../lib/supabase';
import { Flame, Sparkles, Radio, Zap, ExternalLink, FastForward, RotateCcw, User, Save, Check } from 'lucide-react';

export default function AdminTorchControl() {
  const [activeStep, setActiveStep] = useState(0);
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [channelStatus, setChannelStatus] = useState('Connecting...');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // CONFIGURABLE PERSON NAMES & TITLES FOR 5 STAGE POSITIONS
  const [personConfig, setPersonConfig] = useState([
    { id: 1, name: 'Đại diện Ban Giám Hiệu', title: 'Thầy Cô & BGH (Khởi nguồn 1996)', sub: 'TRƯỜNG THPT CAO BÁ QUÁT' },
    { id: 2, name: 'Đại diện Cựu Học Sinh Khóa 1', title: 'Khóa 1996 - 2000', sub: 'TIẾP NỐI KHÁT VỌNG' },
    { id: 3, name: 'Đại diện Cựu HS Thập Kỷ Đầu', title: 'Khóa 2001 - 2010', sub: 'THẬP KỶ TRI THỨC' },
    { id: 4, name: 'Đại diện Cựu HS Thập Kỷ Thứ Hai', title: 'Khóa 2011 - 2020', sub: 'VƯƠN XA & TRƯỞNG THÀNH' },
    { id: 5, name: 'Đại diện Học Sinh Hiện Tại', title: 'Khóa 2023 - 2026', sub: 'THẮP SÁNG TƯƠNG LAI' }
  ]);

  const stepsList = [
    { step: 0, title: '💤 Màn Hình Chờ Sân Sấu', desc: 'Sẵn sàng ngọn lửa trung tâm & danh sách đại biểu.' },
    { step: 1, title: '🔥 Bùng Cháy Lửa Vị Trí 1 (BGH)', desc: 'Ngọn lửa trung tâm bùng cháy rực rỡ + Hiện tên Thầy Cô / BGH.' },
    { step: 2, title: '🚀 Bay Lửa: Vị trí 1 ➔ Vị trí 2', desc: 'Cầu lửa thiêng bay cuộn từ Vị trí 1 sang Vị trí 2.' },
    { step: 3, title: '🔥 Bùng Cháy Lửa Vị Trí 2 (Khóa 1996-2000)', desc: 'Ngọn lửa trung tâm bùng cháy + Hiện tên Đại diện Khóa 1.' },
    { step: 4, title: '🚀 Bay Lửa: Vị trí 2 ➔ Vị trí 3', desc: 'Cầu lửa thiêng bay từ Vị trí 2 sang Vị trí 3.' },
    { step: 5, title: '🔥 Bùng Cháy Lửa Vị Trí 3 (Khóa 2001-2010)', desc: 'Ngọn lửa trung tâm bùng cháy + Hiện tên Đại diện 2001-2010.' },
    { step: 6, title: '🚀 Bay Lửa: Vị trí 3 ➔ Vị trí 4', desc: 'Cầu lửa thiêng bay từ Vị trí 3 sang Vị trí 4.' },
    { step: 7, title: '🔥 Bùng Cháy Lửa Vị Trí 4 (Khóa 2011-2020)', desc: 'Ngọn lửa trung tâm bùng cháy + Hiện tên Đại diện 2011-2020.' },
    { step: 8, title: '🚀 Bay Lửa: Vị trí 4 ➔ Vị trí 5', desc: 'Cầu lửa thiêng bay sang Người 5 (Học Sinh Hiện Tại).' },
    { step: 9, title: '🔥 Bùng Cháy Lửa Vị Trí 5 (Học Sinh Hiện Tại)', desc: 'Ngọn lửa trung tâm bùng cháy + Hiện tên Học sinh đại diện.' },
    { step: 10, title: '🚀 BAY LÊN TRỜI CAO (Fireball Soars to Sky)', desc: 'Cầu lửa vút bay cao vút lên giữa bầu trời LED.' },
    { step: 11, title: '🎉 CHÀO MỪNG ĐẠI LỄ KỶ NIỆM 30 NĂM (GRAND CLIMAX)', desc: 'Bùng nổ pháo hoa rực rỡ & Khẩu hiệu Đại lễ 30 Năm!' }
  ];

  useEffect(() => {
    try {
      const local = localStorage.getItem('cbq_torch_current_step');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.step !== undefined) setActiveStep(parsed.step);
        if (parsed.title) setCustomTitleInput(parsed.title);
      }

      const localPersons = localStorage.getItem('cbq_torch_persons_config');
      if (localPersons) {
        const parsedPersons = JSON.parse(localPersons);
        if (Array.isArray(parsedPersons) && parsedPersons.length === 5) {
          setPersonConfig(parsedPersons);
        }
      }
    } catch {}

    const channel = supabase.channel('cbq_torch_stage_channel');
    channel.subscribe((status) => {
      setChannelStatus(status === 'SUBSCRIBED' ? 'ONLINE REALTIME SẴN SÀNG' : status);
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // SAVE PERSON CONFIGURATION & BROADCAST TO STAGE
  const savePersonConfig = async () => {
    try {
      localStorage.setItem('cbq_torch_persons_config', JSON.stringify(personConfig));
      
      // Broadcast configuration update
      await supabase.channel('cbq_torch_stage_channel').send({
        type: 'broadcast',
        event: 'TORCH_PERSONS_CONFIG_CHANGE',
        payload: { persons: personConfig }
      });

      setSaveSuccessMsg('✅ Đã lưu và phát sóng Cấu hình Tên Đại biểu thành công!');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (err) {
      console.warn("Lỗi lưu cấu hình tên:", err);
    }
  };

  const sendStepTrigger = async (targetStep, title = customTitleInput) => {
    setIsBroadcasting(true);
    setActiveStep(targetStep);

    const payload = { 
      step: targetStep, 
      title: title.trim(),
      persons: personConfig
    };
    
    localStorage.setItem('cbq_torch_current_step', JSON.stringify(payload));

    try {
      await supabase.channel('cbq_torch_stage_channel').send({
        type: 'broadcast',
        event: 'TORCH_STEP_CHANGE',
        payload
      });

      await logActivity('torch_stage', 'LED_CENTER_PERSON', String(targetStep), 'UPDATE', 'admin', `Truyền lửa ngọn lửa trung tâm: Step ${targetStep}`);
    } catch (err) {
      console.warn("Lỗi phát sóng:", err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleNextStep = () => {
    if (activeStep < 11) {
      sendStepTrigger(activeStep + 1);
    }
  };

  const handlePersonChange = (index, field, value) => {
    const updated = [...personConfig];
    updated[index][field] = value;
    setPersonConfig(updated);
  };

  return (
    <Layout title="Bàn Điều Khiển Sân Sấu - Ngọn Lửa Trung Tâm & Vinh Danh">
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* TOP STATUS HEADER */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ margin: 0, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={26} color="#be123c" /> Điều Khiển Ngọn Lửa Trung Tâm & Vinh Danh Đại Biểu
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                Ngọn lửa thiêng bùng cháy rực rỡ ở TRUNG TÂM MÀN HÌNH LED + Tỏa sáng TÊN & THÔNG TIN của từng Thầy Cô / Học Sinh
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

          {/* NAVIGATION BAR */}
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontSize: '13.5px', color: '#334155' }}>
              <Radio size={16} color="#166534" style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Kênh điều khiển: <strong style={{ color: '#166534' }}>{channelStatus}</strong> | Trạng thái: <strong style={{ color: '#be123c', fontSize: '15px' }}>STEP {activeStep} / 11</strong>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => sendStepTrigger(0)}
                style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#475569', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RotateCcw size={15} /> Reset Màn Chờ (Step 0)
              </button>

              <button 
                onClick={handleNextStep}
                disabled={activeStep >= 11 || isBroadcasting}
                style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#166534', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(22, 101, 52, 0.3)' }}
              >
                <FastForward size={16} /> BƯỚC TIẾP THEO (STEP {activeStep + 1}) ➔
              </button>
            </div>
          </div>
        </div>

        {/* FORM CẤU HÌNH TÊN 5 NGƯỜI TRONG ĐẠI LỄ */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} color="#be123c" /> Cấu Hình Tên & Chức Danh 5 Người Giữ Lửa Trên Sân Sấu
            </h3>
            <button 
              onClick={savePersonConfig}
              style={{ padding: '8px 18px', backgroundColor: '#be123c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Save size={15} /> Lưu & Cập Nhật Lên Màn LED
            </button>
          </div>

          {saveSuccessMsg && (
            <div style={{ padding: '10px 14px', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', marginBottom: '16px', border: '1px solid #bbf7d0' }}>
              {saveSuccessMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {personConfig.map((p, idx) => (
              <div key={p.id} style={{ backgroundColor: activeStep === (idx * 2 + 1) ? '#fff1f2' : '#f8fafc', border: activeStep === (idx * 2 + 1) ? '2px solid #be123c' : '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: '900', color: '#be123c', textTransform: 'uppercase' }}>
                    🔥 VỊ TRÍ 0{p.id} {activeStep === (idx * 2 + 1) ? '• (ĐANG GIỮ LỬA)' : ''}
                  </span>
                  <button 
                    onClick={() => sendStepTrigger(idx * 2 + 1)}
                    style={{ padding: '4px 10px', backgroundColor: '#1e293b', color: '#fef08a', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Kích Hoạt Ngọn Lửa Vị Trí {p.id}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', color: '#475569', fontWeight: 'bold', display: 'block' }}>Họ và tên người giữ lửa:</label>
                    <input 
                      type="text" 
                      value={p.name}
                      onChange={e => handlePersonChange(idx, 'name', e.target.value)}
                      placeholder="VD: Thầy Nguyễn Văn A - Hiệu trưởng..."
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11.5px', color: '#475569', fontWeight: 'bold', display: 'block' }}>Chức danh / Tiêu đề niên khóa:</label>
                    <input 
                      type="text" 
                      value={p.title}
                      onChange={e => handlePersonChange(idx, 'title', e.target.value)}
                      placeholder="VD: Đại diện Ban Giám Hiệu..."
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 11 STAGE STEP BUTTONS */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
          <h3 style={{ marginTop: 0, color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={20} color="#f59e0b" /> Kịch Bản Trình Chiếu Sân Sấu (11 Bước Trực Tiếp)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginTop: '16px' }}>
            {stepsList.map((st) => {
              const isActive = activeStep === st.step;
              const isFlyingStep = st.step % 2 === 0 && st.step > 0 && st.step < 10;
              const isSoarStep = st.step === 10;
              const isGrandClimax = st.step === 11;

              return (
                <div 
                  key={st.step}
                  onClick={() => sendStepTrigger(st.step)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '2px solid',
                    borderColor: isActive ? (isGrandClimax ? '#be123c' : isSoarStep ? '#d97706' : isFlyingStep ? '#0284c7' : '#f59e0b') : '#e2e8f0',
                    backgroundColor: isActive ? (isGrandClimax ? '#fff1f2' : isSoarStep ? '#fffbebfb' : isFlyingStep ? '#f0f9ff' : '#fffbeb') : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 15px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px', backgroundColor: isActive ? '#be123c' : '#f1f5f9', color: isActive ? 'white' : '#64748b' }}>
                      STEP {st.step}
                    </span>
                    {isActive && <Sparkles size={16} color="#f59e0b" />}
                  </div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '14.5px', fontWeight: '800', color: isActive ? '#0f172a' : '#334155' }}>
                    {st.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
                    {st.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </Layout>
  );
}
