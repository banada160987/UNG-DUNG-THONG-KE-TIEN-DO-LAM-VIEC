import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase, logActivity } from '../lib/supabase';
import { Flame, Sparkles, Radio, Zap, ExternalLink, FastForward, RotateCcw, User, Save } from 'lucide-react';

export default function AdminTorchControl() {
  const [activeStep, setActiveStep] = useState(0);
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [channelStatus, setChannelStatus] = useState('Connecting...');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // 2 PERSONS ON STAGE (LEFT PERSON & RIGHT PERSON)
  const [personsConfig, setPersonsConfig] = useState([
    { id: 1, name: 'Đại diện Thế hệ Đi trước', title: 'Thầy Cô / Ban Giám Hiệu / Cựu HS', sub: 'BÊN TRÁI SÂN SẤU', side: 'LEFT' },
    { id: 2, name: 'Đại diện Thế hệ Tiếp nối', title: 'Học Sinh Hiện Tại (Khóa 2023 - 2026)', sub: 'BÊN PHẢI SÂN SẤU', side: 'RIGHT' }
  ]);

  const stepsList = [
    { step: 0, title: '💤 Màn Hình Chờ Sân Sấu', desc: 'Sẵn sàng 2 vị trí đứng bên TRÁI & bên PHẢI sân khấu.' },
    { step: 1, title: '🔥 1. Thắp Lửa Người BÊN TRÁI', desc: 'Ngọn lửa bùng cháy rực rỡ bên TRÁI + Vinh danh Người 1.' },
    { step: 2, title: '🚀 2. BAY LỬA CAO: TRÁI ➔ PHẢI', desc: 'Cầu lửa thiêng bắn vút bay cao qua bầu trời LED hạ cánh xuống tay Người 2 bên PHẢI!' },
    { step: 3, title: '🔥 3. Thắp Lửa Người BÊN PHẢI', desc: 'Ngọn lửa bên trái tắt, DUY NHẤT ngọn lửa bên PHẢI bùng cháy + Vinh danh Người 2.' },
    { step: 4, title: '🚀 4. CẦU LỬA BAY LÊN TRỜI CAO', desc: 'Cầu lửa từ tay Người 2 bên phải vút bay cao vút lên giữa bầu trời LED.' },
    { step: 5, title: '🎉 5. BÙNG NỔ ĐẠI LỄ KỶ NIỆM 30 NĂM', desc: 'Nổ pháo hoa rực rỡ & Hiện biểu trưng ĐẠI LỄ 30 NĂM THPT CAO BÁ QUÁT!' }
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
        if (Array.isArray(parsedPersons) && parsedPersons.length >= 2) {
          setPersonsConfig(parsedPersons.slice(0, 2));
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

  const savePersonsConfig = async () => {
    try {
      localStorage.setItem('cbq_torch_persons_config', JSON.stringify(personsConfig));
      
      await supabase.channel('cbq_torch_stage_channel').send({
        type: 'broadcast',
        event: 'TORCH_PERSONS_CONFIG_CHANGE',
        payload: { persons: personsConfig }
      });

      setSaveSuccessMsg('✅ Đã lưu Tên 2 Đại Biểu thành công!');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (err) {
      console.warn("Lỗi lưu cấu hình:", err);
    }
  };

  const sendStepTrigger = async (targetStep, title = customTitleInput) => {
    setIsBroadcasting(true);
    setActiveStep(targetStep);

    const payload = { 
      step: targetStep, 
      title: title.trim(),
      persons: personsConfig
    };
    
    localStorage.setItem('cbq_torch_current_step', JSON.stringify(payload));

    try {
      await supabase.channel('cbq_torch_stage_channel').send({
        type: 'broadcast',
        event: 'TORCH_STEP_CHANGE',
        payload
      });

      await logActivity('torch_stage', 'LED_DUAL_STAGE', String(targetStep), 'UPDATE', 'admin', `Điều khiển màn LED 2 người truyền lửa: Step ${targetStep}`);
    } catch (err) {
      console.warn("Lỗi phát sóng:", err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleNextStep = () => {
    if (activeStep < 5) {
      sendStepTrigger(activeStep + 1);
    }
  };

  const handlePersonChange = (index, field, value) => {
    const updated = [...personsConfig];
    updated[index][field] = value;
    setPersonsConfig(updated);
  };

  return (
    <Layout title="Điều Khiển Sân Sấu - 2 Người Truyền Lửa Hai Bên">
      <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
        
        {/* TOP STATUS HEADER */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ margin: 0, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={26} color="#be123c" /> Điều Khiển 2 Người Truyền Lửa Hai Bên Sân Sấu
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                Cầu lửa thiêng bắn bay cao uốn lướt qua bầu trời LED từ tay Người Bên Trái ➔ Đậu chính xác xuống tay Người Bên Phải!
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
              Kênh điều khiển: <strong style={{ color: '#166534' }}>{channelStatus}</strong> | Bước hiện tại: <strong style={{ color: '#be123c', fontSize: '15px' }}>STEP {activeStep} / 5</strong>
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
                disabled={activeStep >= 5 || isBroadcasting}
                style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#166534', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(22, 101, 52, 0.3)' }}
              >
                <FastForward size={16} /> BƯỚC TIẾP THEO (STEP {activeStep + 1}) ➔
              </button>
            </div>
          </div>
        </div>

        {/* FORM CẤU HÌNH TÊN 2 NGƯỜI ĐỨNG HAI BÊN SÂN SẤU */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} color="#be123c" /> Cấu Hình Tên 2 Người Đứng Hai Bên Sân Sấu
            </h3>
            <button 
              onClick={savePersonsConfig}
              style={{ padding: '8px 18px', backgroundColor: '#be123c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Save size={15} /> Lưu & Phát Sóng Lên Màn LED
            </button>
          </div>

          {saveSuccessMsg && (
            <div style={{ padding: '10px 14px', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', marginBottom: '16px', border: '1px solid #bbf7d0' }}>
              {saveSuccessMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* PERSON 1: LEFT */}
            <div style={{ backgroundColor: (activeStep === 1 || activeStep === 2) ? '#fff1f2' : '#f8fafc', border: (activeStep === 1 || activeStep === 2) ? '2px solid #be123c' : '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '900', color: '#be123c', textTransform: 'uppercase', marginBottom: '8px' }}>
                🔴 1. NGUYỄN VĂN A (BÊN TRÁI SÂN SẤU)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', color: '#475569', fontWeight: 'bold' }}>Họ và tên người bên trái:</label>
                  <input 
                    type="text"
                    value={personsConfig[0]?.name || ''}
                    onChange={e => handlePersonChange(0, 'name', e.target.value)}
                    placeholder="VD: Thầy Nguyễn Văn A - Hiệu trưởng..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', color: '#475569', fontWeight: 'bold' }}>Chức danh / Đơn vị:</label>
                  <input 
                    type="text"
                    value={personsConfig[0]?.title || ''}
                    onChange={e => handlePersonChange(0, 'title', e.target.value)}
                    placeholder="VD: Ban Giám Hiệu & Thầy Cô (1996)..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            {/* PERSON 2: RIGHT */}
            <div style={{ backgroundColor: (activeStep === 3 || activeStep === 4) ? '#f0fdf4' : '#f8fafc', border: (activeStep === 3 || activeStep === 4) ? '2px solid #166534' : '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '900', color: '#166534', textTransform: 'uppercase', marginBottom: '8px' }}>
                🟢 2. NGUYỄN VĂN B (BÊN PHẢI SÂN SẤU)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', color: '#475569', fontWeight: 'bold' }}>Họ và tên người bên phải:</label>
                  <input 
                    type="text"
                    value={personsConfig[1]?.name || ''}
                    onChange={e => handlePersonChange(1, 'name', e.target.value)}
                    placeholder="VD: Em Trần Văn B - Lớp 12A1..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', color: '#475569', fontWeight: 'bold' }}>Chức danh / Lớp:</label>
                  <input 
                    type="text"
                    value={personsConfig[1]?.title || ''}
                    onChange={e => handlePersonChange(1, 'title', e.target.value)}
                    placeholder="VD: Học Sinh Hiện Tại (Khóa 2023-2026)..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5 STAGE STEP TRIGGER BUTTONS */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
          <h3 style={{ marginTop: 0, color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={20} color="#f59e0b" /> Kịch Bản Trình Chiếu 2 Người Truyền Lửa (5 Bước Trực Tiếp)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginTop: '16px' }}>
            {stepsList.map((st) => {
              const isActive = activeStep === st.step;
              return (
                <div 
                  key={st.step}
                  onClick={() => sendStepTrigger(st.step)}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: '2px solid',
                    borderColor: isActive ? '#be123c' : '#e2e8f0',
                    backgroundColor: isActive ? '#fff1f2' : '#ffffff',
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
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '800', color: isActive ? '#0f172a' : '#334155' }}>
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
