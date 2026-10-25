import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, Plus, Trash2, Save, RotateCcw, X, Users, AlertCircle } from 'lucide-react';
import { 
  getClubAssignments, 
  saveClubAssignments, 
  DEFAULT_CLUB_ASSIGNMENTS,
  getAvailableTeachersList,
  stripTeacherTitle
} from '../services/clubPermissionService';

export default function AdminClubAssignModal({ 
  isOpen, 
  onClose, 
  clubOptions = [],
  onAssignmentsUpdated 
}) {
  const [assignments, setAssignments] = useState({});
  const [selectedTeacherToAdd, setSelectedTeacherToAdd] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const teachersList = getAvailableTeachersList();

  // Load current assignments
  useEffect(() => {
    if (isOpen) {
      setAssignments(getClubAssignments());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Extract clean club names
  const cleanClubName = (rawName) => {
    return String(rawName)
      .replace(/^[0-9]+[.)\s-]+/, '')
      .replace(/\([^)]*\)/g, '')
      .trim();
  };

  // Lấy danh sách câu lạc bộ thực tế cần cấu hình
  const activeClubs = clubOptions.length > 0 
    ? clubOptions.map(c => typeof c === 'string' ? c : c.name)
    : Object.keys(DEFAULT_CLUB_ASSIGNMENTS);

  const handleAddCoachToClub = (clubName, teacherName) => {
    if (!teacherName || !teacherName.trim()) return;
    const cleanClub = cleanClubName(clubName);
    const trimmedTeacher = teacherName.trim();

    setAssignments(prev => {
      const currentList = prev[cleanClub] || prev[clubName] || [];
      if (currentList.some(c => stripTeacherTitle(c) === stripTeacherTitle(trimmedTeacher))) {
        return prev;
      }
      return {
        ...prev,
        [cleanClub]: [...currentList, trimmedTeacher]
      };
    });

    // Reset dropdown
    setSelectedTeacherToAdd(prev => ({ ...prev, [clubName]: '' }));
  };

  const handleRemoveCoachFromClub = (clubName, teacherName) => {
    const cleanClub = cleanClubName(clubName);
    setAssignments(prev => {
      const currentList = prev[cleanClub] || prev[clubName] || [];
      const updated = currentList.filter(c => stripTeacherTitle(c) !== stripTeacherTitle(teacherName));
      return {
        ...prev,
        [cleanClub]: updated
      };
    });
  };

  const handleResetToDefault = () => {
    if (window.confirm("Thầy/Cô có chắc chắn muốn khôi phục về danh sách phân công mặc định của trường?")) {
      setAssignments({ ...DEFAULT_CLUB_ASSIGNMENTS });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveClubAssignments(assignments);
      setSavedSuccess(true);
      if (onAssignmentsUpdated) onAssignmentsUpdated(assignments);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      alert("Lỗi khi lưu phân quyền: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        maxWidth: '860px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(2, 132, 199, 0.25)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                Phân Quyền Chủ Nhiệm & Điểm Danh Câu Lạc Bộ
              </h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#94a3b8' }}>
                Chỉ giáo viên được gán quyền tại đây mới có thể nhìn thấy và thực hiện điểm danh CLB tương ứng.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <AlertCircle size={20} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '13px', color: '#0369a1', lineHeight: '1.5' }}>
              <strong>Quy tắc bảo mật điểm danh:</strong> Giáo viên không được phân công sẽ hoàn toàn không nhìn thấy phần điểm danh CLB trên Bàn làm việc. Giáo viên được phân công chỉ điểm danh đúng thành viên CLB của mình.
            </div>
          </div>

          {/* Danh sách từng CLB */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activeClubs.map((clubRaw, idx) => {
              const cleanClub = cleanClubName(clubRaw);
              const assignedTeachers = assignments[cleanClub] || assignments[clubRaw] || DEFAULT_CLUB_ASSIGNMENTS[cleanClub] || [];

              return (
                <div key={idx} style={{
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '16px 20px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '26px',
                        height: '26px',
                        borderRadius: '8px',
                        backgroundColor: '#e0e7ff',
                        color: '#4338ca',
                        fontWeight: '800',
                        fontSize: '12px'
                      }}>
                        {idx + 1}
                      </span>
                      <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                        {clubRaw}
                      </strong>
                    </div>

                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Đang phân công: <strong>{assignedTeachers.length} Thầy/Cô</strong>
                    </span>
                  </div>

                  {/* Danh sách giáo viên đã được gán */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', minHeight: '36px', alignItems: 'center' }}>
                    {assignedTeachers.length === 0 ? (
                      <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                        (Chưa có giáo viên nào được phân công phụ trách CLB này)
                      </span>
                    ) : (
                      assignedTeachers.map((tName, tIdx) => (
                        <span key={tIdx} style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 12px',
                          borderRadius: '20px',
                          backgroundColor: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          color: '#065f46',
                          fontSize: '13px',
                          fontWeight: '700'
                        }}>
                          <UserCheck size={14} color="#059669" />
                          {tName}
                          <button
                            type="button"
                            onClick={() => handleRemoveCoachFromClub(cleanClub, tName)}
                            title="Xóa giáo viên khỏi CLB này"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '0 2px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            ✕
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Thanh chọn thêm giáo viên */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      value={selectedTeacherToAdd[clubRaw] || ''}
                      onChange={e => setSelectedTeacherToAdd(prev => ({ ...prev, [clubRaw]: e.target.value }))}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        backgroundColor: '#f8fafc',
                        flex: 1,
                        minWidth: '220px'
                      }}
                    >
                      <option value="">-- Chọn Thầy/Cô từ danh sách trường --</option>
                      {teachersList.map((t, i) => (
                        <option key={i} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleAddCoachToClub(cleanClub, selectedTeacherToAdd[clubRaw])}
                      disabled={!selectedTeacherToAdd[clubRaw]}
                      style={{
                        padding: '7px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: selectedTeacherToAdd[clubRaw] ? '#0284c7' : '#cbd5e1',
                        color: '#ffffff',
                        fontWeight: '700',
                        fontSize: '12.5px',
                        cursor: selectedTeacherToAdd[clubRaw] ? 'pointer' : 'not-allowed',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Plus size={15} /> Gán Chủ Nhiệm
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <button
            type="button"
            onClick={handleResetToDefault}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#64748b',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RotateCcw size={15} /> Khôi phục mặc định
          </button>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '9px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: savedSuccess ? '#059669' : '#16a34a',
                color: '#ffffff',
                fontWeight: '800',
                fontSize: '13.5px',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
              }}
            >
              <Save size={16} />
              {savedSuccess ? '✓ Đã Lưu Thành Công!' : (saving ? 'Đang lưu...' : 'Lưu Phân Quyền CLB')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
