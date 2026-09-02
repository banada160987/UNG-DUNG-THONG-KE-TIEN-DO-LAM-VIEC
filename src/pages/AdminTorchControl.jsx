import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase, logActivity } from '../lib/supabase';
import { Flame, Sparkles, Radio, Zap, RefreshCw, Trophy, ExternalLink, ShieldCheck, Play, ArrowRight, FastForward, RotateCcw } from 'lucide-react';

export default function AdminTorchControl() {
  const [activeStep, setActiveStep] = useState(0);
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [channelStatus, setChannelStatus] = useState('Connecting...');

  const stepsList = [
    { step: 0, title: '💤 Màn Hình Chờ Sân Sấu', desc: 'Sẵn sàng vị trí 5 người đứng trên sân khấu.' },
    { step: 1, title: '🔥 Thắp Lửa Vị Trí 1 (BGH / Thầy Cô)', desc: 'Ngọn lửa đầu tiên bùng sáng trên tay Người 1.' },
    { step: 2, title: '🚀 Bay Lửa: Vị trí 1 ➔ Vị trí 2', desc: 'Cầu lửa thiêng cuộn vệt hào quang bay từ Người 1 sang Người 2.' },
    { step: 3, title: '🔥 Thắp Lửa Vị Trí 2 (Khóa 1996-2000)', desc: 'Người 2 nhận đuốc & thắp sáng vị trí.' },
    { step: 4, title: '🚀 Bay Lửa: Vị trí 2 ➔ Vị trí 3', desc: 'Cầu lửa thiêng bay tiếp từ Người 2 sang Người 3.' },
    { step: 5, title: '🔥 Thắp Lửa Vị Trí 3 (Khóa 2001-2010)', desc: 'Người 3 nhận đuốc & thắp sáng vị trí.' },
    { step: 6, title: '🚀 Bay Lửa: Vị trí 3 ➔ Vị trí 4', desc: 'Cầu lửa thiêng bay từ Người 3 sang Người 4.' },
    { step: 7, title: '🔥 Thắp Lửa Vị Trí 4 (Khóa 2011-2020)', desc: 'Người 4 nhận đuốc & thắp sáng vị trí.' },
    { step: 8, title: '🚀 Bay Lửa: Vị trí 4 ➔ Vị trí 5', desc: 'Cầu lửa thiêng bay sang Người 5 (Học Sinh Hiện Tại).' },
    { step: 9, title: '🔥 Thắp Lửa Vị Trí 5 (Học Sinh 2023-2026)', desc: 'Đại diện học sinh hiện tại nâng cao ngọn đuốc.' },
    { step: 10, title: '🌟 BÙNG NỔ NGỌN LỬA 30 NĂM TẤT CẢ VỊ TRÍ 🎉', desc: 'Toàn bộ 5 vị trí cùng bùng nổ pháo hoa & chúc mừng!' }
  ];

  useEffect(() => {
    try {
      const local = localStorage.getItem('cbq_torch_current_step');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.step !== undefined) setActiveStep(parsed.step);
        if (parsed.title) setCustomTitleInput(parsed.title);
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

  const sendStepTrigger = async (targetStep, title = customTitleInput) => {
    setIsBroadcasting(true);
    setActiveStep(targetStep);

    const payload = { step: targetStep, title: title.trim() };
    localStorage.setItem('cbq_torch_current_step', JSON.stringify(payload));

    try {
      await supabase.channel('cbq_torch_stage_channel').send({
        type: 'broadcast',
        event: 'TORCH_STEP_CHANGE',
        payload
      });

      await logActivity('torch_stage', 'LED_STAGE_ARC', String(targetStep), 'UPDATE', 'admin', `Kích hoạt bước nghi thức truyền lửa: Step ${targetStep}`);
    } catch (err) {
      console.warn("Lỗi phát sóng:", err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleNextStep = () => {
    if (activeStep < 10) {
      sendStepTrigger(activeStep + 1);
    }
  };

  return (
    <Layout title="Bàn Điều Khiển Sân Sấu LED - Cầu Lửa Bay Nối Tiếp">
      <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
        
        {/* TOP STATUS HEADER */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ margin: 0, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={26} color="#be123c" /> Bàn Điều Khiển Cầu Lửa Bay Nối Tiếp Sân Sấu
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                Điều khiển hiệu ứng Cầu lửa vút bay qua 5 vị trí Thầy Cô & Học sinh đứng trên sân khấu
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

          {/* MAIN STEP NAVIGATION BAR */}
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontSize: '13.5px', color: '#334155' }}>
              <Radio size={16} color="#166534" style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Kênh điều khiển: <strong style={{ color: '#166534' }}>{channelStatus}</strong> | Bước hiện tại: <strong style={{ color: '#be123c', fontSize: '15px' }}>STEP {activeStep} / 10</strong>
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
                disabled={activeStep >= 10 || isBroadcasting}
                style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#166534', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(22, 101, 52, 0.3)' }}
              >
                <FastForward size={16} /> BƯỚC TIẾP THEO (STEP {activeStep + 1}) ➔
              </button>
            </div>
          </div>
        </div>

        {/* 10 DETAILED STAGE STEP BUTTONS */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
          <h3 style={{ marginTop: 0, color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={20} color="#f59e0b" /> Tiến Trình Kịch Bản Truyền Lửa Sân Sấu (10 Bước)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginTop: '16px' }}>
            {stepsList.map((st) => {
              const isActive = activeStep === st.step;
              const isFlyingStep = st.step % 2 === 0 && st.step > 0 && st.step < 10;
              const isBurstStep = st.step === 10;

              return (
                <div 
                  key={st.step}
                  onClick={() => sendStepTrigger(st.step)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '2px solid',
                    borderColor: isActive ? (isBurstStep ? '#be123c' : isFlyingStep ? '#0284c7' : '#f59e0b') : '#e2e8f0',
                    backgroundColor: isActive ? (isBurstStep ? '#fff1f2' : isFlyingStep ? '#f0f9ff' : '#fffbeb') : '#ffffff',
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

        {/* CUSTOM TITLE OVERLAY INPUT */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>
            💬 Tiêu đề / Khẩu hiệu phát biểu tùy chỉnh hiển thị trực tiếp trên Màn hình LED:
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text"
              placeholder="Nhập thông điệp phát biểu (VD: LỄ KỶ NIỆM 30 NĂM THPT CAO BÁ QUÁT)..."
              value={customTitleInput}
              onChange={e => setCustomTitleInput(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
            />
            <button 
              onClick={() => sendStepTrigger(activeStep, customTitleInput)}
              style={{ padding: '10px 20px', backgroundColor: '#166534', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Phát Lên Màn LED
            </button>
          </div>
        </div>

      </div>
    </Layout>
  );
}
