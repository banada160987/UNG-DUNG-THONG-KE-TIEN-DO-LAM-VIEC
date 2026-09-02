import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase, logActivity } from '../lib/supabase';
import { Flame, Sparkles, Radio, Zap, ExternalLink, FastForward, RotateCcw, User, Save, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

export default function AdminTorchControl() {
  const [activeStep, setActiveStep] = useState(0);
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [channelStatus, setChannelStatus] = useState('Connecting...');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // UNLIMITED DYNAMIC MULTI-GENERATION PERSONS LIST
  const [personsList, setPersonsList] = useState([
    { id: 1, name: 'Đại diện Ban Giám Hiệu', title: 'Ban Giám Hiệu & Thầy Cô (1996)', sub: 'THẾ HỆ KHỞI NGUỒN' },
    { id: 2, name: 'Đại diện Cựu HS Khóa 1', title: 'Khóa 1996 - 2000', sub: 'THẮP SÁNG KHÁT VỌNG' },
    { id: 3, name: 'Đại diện Cựu HS Khóa 2', title: 'Khóa 2001 - 2005', sub: 'THẬP KỶ TRI THỨC' },
    { id: 4, name: 'Đại diện Cựu HS Khóa 3', title: 'Khóa 2006 - 2010', sub: 'VƯƠN XA & TRƯỞNG THÀNH' },
    { id: 5, name: 'Đại diện Cựu HS Khóa 4', title: 'Khóa 2011 - 2015', sub: 'KẾ THỪA & PHÁT TRIỂN' },
    { id: 6, name: 'Đại diện Cựu HS Khóa 5', title: 'Khóa 2016 - 2020', sub: 'HỘI NHẬP & TỎA SÁNG' },
    { id: 7, name: 'Đại diện Học Sinh Hiện Tại', title: 'Khóa 2023 - 2026', sub: 'THẮP SÁNG TƯƠNG LAI' }
  ]);

  // Calculate total steps dynamically based on number of persons
  const totalTransfers = Math.max(1, personsList.length - 1);
  const soarStep = totalTransfers * 2 + 1;
  const grandFinaleStep = soarStep + 1;

  useEffect(() => {
    try {
      const localStep = localStorage.getItem('cbq_torch_current_step');
      if (localStep) {
        const parsed = JSON.parse(localStep);
        if (parsed.step !== undefined) setActiveStep(parsed.step);
        if (parsed.title) setCustomTitleInput(parsed.title);
      }

      const localPersons = localStorage.getItem('cbq_torch_persons_list');
      if (localPersons) {
        const parsedList = JSON.parse(localPersons);
        if (Array.isArray(parsedList) && parsedList.length >= 2) {
          setPersonsList(parsedList);
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

  const savePersonsList = async (updatedList = personsList) => {
    try {
      localStorage.setItem('cbq_torch_persons_list', JSON.stringify(updatedList));
      
      await supabase.channel('cbq_torch_stage_channel').send({
        type: 'broadcast',
        event: 'TORCH_PERSONS_LIST_CHANGE',
        payload: { persons: updatedList }
      });

      setSaveSuccessMsg(`✅ Đã lưu danh sách ${updatedList.length} Thế hệ thành công!`);
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (err) {
      console.warn("Lỗi lưu danh sách:", err);
    }
  };

  const sendStepTrigger = async (targetStep, title = customTitleInput) => {
    setIsBroadcasting(true);
    setActiveStep(targetStep);

    const payload = { 
      step: targetStep, 
      title: title.trim(),
      persons: personsList
    };
    
    localStorage.setItem('cbq_torch_current_step', JSON.stringify(payload));

    try {
      await supabase.channel('cbq_torch_stage_channel').send({
        type: 'broadcast',
        event: 'TORCH_STEP_CHANGE',
        payload
      });

      await logActivity('torch_stage', 'LED_MULTI_RELAY', String(targetStep), 'UPDATE', 'admin', `Truyền lửa xoay vòng nhiều thế hệ: Step ${targetStep}`);
    } catch (err) {
      console.warn("Lỗi phát sóng:", err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleNextStep = () => {
    if (activeStep < grandFinaleStep) {
      sendStepTrigger(activeStep + 1);
    }
  };

  // Add new person
  const handleAddPerson = () => {
    const newId = personsList.length + 1;
    const newPerson = {
      id: newId,
      name: `Đại diện Thế hệ ${newId}`,
      title: `Niên khóa thứ ${newId}`,
      sub: 'KẾ THỪA & NỐI TÍẾP'
    };
    const updated = [...personsList, newPerson];
    setPersonsList(updated);
    savePersonsList(updated);
  };

  // Remove person
  const handleRemovePerson = (idx) => {
    if (personsList.length <= 2) {
      alert("Cần tối thiểu 2 người để thực hiện nghi thức truyền lửa!");
      return;
    }
    const updated = personsList.filter((_, i) => i !== idx);
    setPersonsList(updated);
    savePersonsList(updated);
  };

  // Edit person field
  const handlePersonChange = (idx, field, val) => {
    const updated = [...personsList];
    updated[idx][field] = val;
    setPersonsList(updated);
  };

  // Move person up/down
  const handleMovePerson = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= personsList.length) return;
    const updated = [...personsList];
    const temp = updated[idx];
    updated[idx] = updated[newIdx];
    updated[newIdx] = temp;
    setPersonsList(updated);
    savePersonsList(updated);
  };

  return (
    <Layout title="Bàn Điều Khiển Sân Sấu - Truyền Lửa Xoay Vòng Nhiều Thế Hệ">
      <div style={{ maxWidth: '1150px', margin: '0 auto' }}>
        
        {/* TOP STATUS HEADER */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ margin: 0, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={26} color="#be123c" /> Điều Khiển Truyền Lửa Xoay Vòng Nhiều Thế Hệ
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                Cầu lửa bay từ Trái sang Phải ➔ Khi ngọn lửa bùng cháy bên Phải, thẻ tự động trượt sang Trái để nhường bên Phải cho Thế hệ tiếp theo!
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
              Kênh điều khiển: <strong style={{ color: '#166534' }}>{channelStatus}</strong> | Tổng số thế hệ: <strong style={{ color: '#be123c' }}>{personsList.length} Người</strong> | Bước: <strong style={{ color: '#be123c', fontSize: '15px' }}>STEP {activeStep} / {grandFinaleStep}</strong>
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
                disabled={activeStep >= grandFinaleStep || isBroadcasting}
                style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#166534', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(22, 101, 52, 0.3)' }}
              >
                <FastForward size={16} /> BƯỚC TIẾP THEO (STEP {activeStep + 1}) ➔
              </button>
            </div>
          </div>
        </div>

        {/* DYNAMIC LIST OF MULTI-GENERATIONS PERSONS */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} color="#be123c" /> Danh Sách {personsList.length} Thế Hệ Truyền Lửa Xoay Vòng
            </h3>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleAddPerson}
                style={{ padding: '8px 16px', backgroundColor: '#166534', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={15} /> Thêm Thế Hệ Mới
              </button>
              <button 
                onClick={() => savePersonsList(personsList)}
                style={{ padding: '8px 18px', backgroundColor: '#be123c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Save size={15} /> Lưu Tất Cả
              </button>
            </div>
          </div>

          {saveSuccessMsg && (
            <div style={{ padding: '10px 14px', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', marginBottom: '16px', border: '1px solid #bbf7d0' }}>
              {saveSuccessMsg}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {personsList.map((p, idx) => {
              const transferStep = idx * 2 + 1;
              const isCurrentHolder = activeStep === transferStep || activeStep === (transferStep + 1);

              return (
                <div 
                  key={idx} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: isCurrentHolder ? '#fff1f2' : '#f8fafc',
                    border: isCurrentHolder ? '2px solid #be123c' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '12px 16px'
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: '900', color: '#be123c', minWidth: '85px' }}>
                    #0{idx + 1} {idx === 0 ? '(BGH)' : idx === personsList.length - 1 ? '(Cuối)' : ''}
                  </span>

                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px' }}>
                    <input 
                      type="text" 
                      value={p.name}
                      onChange={e => handlePersonChange(idx, 'name', e.target.value)}
                      placeholder="Họ và tên..."
                      style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                    <input 
                      type="text" 
                      value={p.title}
                      onChange={e => handlePersonChange(idx, 'title', e.target.value)}
                      placeholder="Niên khóa / Chức danh..."
                      style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                    <input 
                      type="text" 
                      value={p.sub}
                      onChange={e => handlePersonChange(idx, 'sub', e.target.value)}
                      placeholder="Thông điệp / Khẩu hiệu..."
                      style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button 
                      onClick={() => handleMovePerson(idx, -1)} 
                      disabled={idx === 0}
                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer' }}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button 
                      onClick={() => handleMovePerson(idx, 1)} 
                      disabled={idx === personsList.length - 1}
                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer' }}
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button 
                      onClick={() => sendStepTrigger(transferStep)}
                      style={{ padding: '6px 12px', backgroundColor: '#1e293b', color: '#fef08a', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Kích Hoạt
                    </button>
                    <button 
                      onClick={() => handleRemovePerson(idx)}
                      style={{ padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: '#fee2e2', color: '#ef4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AUTOMATED STEP CONTROLS */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
          <h3 style={{ marginTop: 0, color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
            ⚡ Các Bước Kịch Bản Truyền Lửa Tự Động ({grandFinaleStep} Bước)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', marginTop: '14px' }}>
            <button 
              onClick={() => sendStepTrigger(0)}
              style={{ padding: '12px', borderRadius: '10px', border: activeStep === 0 ? '2px solid #94a3b8' : '1px solid #e2e8f0', backgroundColor: activeStep === 0 ? '#f1f5f9' : '#ffffff', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
            >
              Step 0: Màn Chờ Sân Sấu
            </button>

            {Array.from({ length: totalTransfers }).map((_, i) => {
              const p1 = personsList[i];
              const p2 = personsList[i + 1];
              const stepLit = i * 2 + 1;
              const stepFly = i * 2 + 2;

              return (
                <div key={i} style={{ display: 'contents' }}>
                  <button 
                    onClick={() => sendStepTrigger(stepLit)}
                    style={{ padding: '12px', borderRadius: '10px', border: activeStep === stepLit ? '2px solid #be123c' : '1px solid #e2e8f0', backgroundColor: activeStep === stepLit ? '#fff1f2' : '#ffffff', fontWeight: 'bold', fontSize: '12.5px', cursor: 'pointer', textAlign: 'left' }}
                  >
                    🔥 Step {stepLit}: Thắp Lửa #{i + 1} ({p1?.name})
                  </button>

                  <button 
                    onClick={() => sendStepTrigger(stepFly)}
                    style={{ padding: '12px', borderRadius: '10px', border: activeStep === stepFly ? '2px solid #0284c7' : '1px solid #e2e8f0', backgroundColor: activeStep === stepFly ? '#f0f9ff' : '#ffffff', fontWeight: 'bold', fontSize: '12.5px', cursor: 'pointer', textAlign: 'left' }}
                  >
                    🚀 Step {stepFly}: Bay Lửa #{i + 1} ➔ #{i + 2} ({p2?.name})
                  </button>
                </div>
              );
            })}

            <button 
              onClick={() => sendStepTrigger(soarStep)}
              style={{ padding: '12px', borderRadius: '10px', border: activeStep === soarStep ? '2px solid #d97706' : '1px solid #e2e8f0', backgroundColor: activeStep === soarStep ? '#fffbebfb' : '#ffffff', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
            >
              Step {soarStep}: 🚀 Bay Lên Trời Cao
            </button>

            <button 
              onClick={() => sendStepTrigger(grandFinaleStep)}
              style={{ padding: '12px', borderRadius: '10px', border: activeStep === grandFinaleStep ? '2px solid #be123c' : '1px solid #e2e8f0', backgroundColor: activeStep === grandFinaleStep ? '#fff1f2' : '#ffffff', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', color: '#be123c' }}
            >
              Step {grandFinaleStep}: 🎉 BÙNG NỔ 30 NĂM ĐẠI LỄ
            </button>
          </div>
        </div>

      </div>
    </Layout>
  );
}
