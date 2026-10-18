import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Video, Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles,
  BookOpen, Brain, GraduationCap, Compass, Heart, Briefcase,
  Clock, Search, Bookmark, BookmarkCheck, ExternalLink, Download,
  CheckCircle2, AlertTriangle, ArrowLeft, Plus, Eye, Share2,
  Sliders, Music, CloudRain, Waves, Flame, Activity, X, ChevronRight,
  Calculator, Award, FileText
} from 'lucide-react';
import { EDU_VIDEOS, VIDEO_CATEGORIES, AMBIENT_SOUNDS } from '../data/eduVideoHubData';
import { ambientSound } from '../utils/ambientSoundEngine';

export default function EduVideoHub() {
  // Navigation Tabs: 'videos' | 'pomodoro' | 'calculator' | 'saved'
  const [activeTab, setActiveTab] = useState('videos');

  // Video State
  const [videos, setVideos] = useState(EDU_VIDEOS);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAudience, setSelectedAudience] = useState('all'); // 'all' | 'student' | 'teacher'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState(null);
  const [savedVideoIds, setSavedVideoIds] = useState([]);

  // Custom Video Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState('study_methods');

  // Video Note State (gắn timestamp)
  const [userNotes, setUserNotes] = useState({});
  const [newNoteText, setNewNoteText] = useState('');

  // Pomodoro State
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 mins
  const [pomodoroInitial, setPomodoroInitial] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState('focus'); // 'focus' | 'short_break' | 'long_break'
  const [completedSessions, setCompletedSessions] = useState(0);

  // Ambient Sound State
  const [activeSound, setActiveSound] = useState(null);
  const [ambientVolume, setAmbientVolume] = useState(0.5);

  // 2+2 Graduation Calculator State
  const [calcForm, setCalcForm] = useState({
    math: 7.5,
    literature: 7.0,
    elective1: 8.0,
    elective2: 8.5,
    gpa10: 7.8,
    gpa11: 8.2,
    gpa12: 8.6,
    bonusPoints: 1.0, // Điểm khuyến khích (Nghề, HSG...)
    priorityPoints: 0.25 // Điểm ưu tiên khu vực / đối tượng
  });

  // Load Saved Videos and Notes from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('cbq_saved_edu_videos') || '[]');
      setSavedVideoIds(saved);
      const notes = JSON.parse(localStorage.getItem('cbq_edu_video_notes') || '{}');
      setUserNotes(notes);
      const customVids = JSON.parse(localStorage.getItem('cbq_custom_edu_videos') || '[]');
      if (customVids.length > 0) {
        setVideos([...customVids, ...EDU_VIDEOS]);
      }
    } catch (e) {}
  }, []);

  // Save changes to localStorage
  const toggleSaveVideo = (id, e) => {
    if (e) e.stopPropagation();
    const isSaved = savedVideoIds.includes(id);
    const updated = isSaved ? savedVideoIds.filter(vId => vId !== id) : [...savedVideoIds, id];
    setSavedVideoIds(updated);
    localStorage.setItem('cbq_saved_edu_videos', JSON.stringify(updated));
  };

  // Add Timestamped Note
  const handleAddNote = () => {
    if (!newNoteText.trim() || !activeVideo) return;
    const currentList = userNotes[activeVideo.id] || [];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const updatedList = [
      ...currentList,
      { id: Date.now(), time: timeStr, text: newNoteText.trim() }
    ];

    const updatedNotes = { ...userNotes, [activeVideo.id]: updatedList };
    setUserNotes(updatedNotes);
    localStorage.setItem('cbq_edu_video_notes', JSON.stringify(updatedNotes));
    setNewNoteText('');
  };

  // Add Custom Video from URL
  const handleAddCustomVideo = (e) => {
    e.preventDefault();
    if (!customUrl.trim() || !customTitle.trim()) return;

    let youtubeId = '';
    const match = customUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match) {
      youtubeId = match[1];
    } else {
      alert('Vui lòng nhập đường link YouTube hợp lệ.');
      return;
    }

    const newVid = {
      id: 'custom_' + Date.now(),
      youtubeId,
      embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
      title: customTitle.trim(),
      channel: 'Người Dùng Tải Lên',
      category: customCategory,
      targetAudience: 'all',
      grade: 'Học Liệu Mở',
      duration: 'Tùy Chỉnh',
      views: 'Mới thêm',
      thumbnail: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
      description: 'Học liệu video số hóa do Thầy Cô hoặc Học sinh chia sẻ.',
      keyTakeaways: ['Video tự chọn hỗ trợ mở rộng tri thức.'],
      recommendedNotes: []
    };

    const customVids = JSON.parse(localStorage.getItem('cbq_custom_edu_videos') || '[]');
    const updatedCustom = [newVid, ...customVids];
    localStorage.setItem('cbq_custom_edu_videos', JSON.stringify(updatedCustom));
    setVideos([newVid, ...videos]);
    setShowAddModal(false);
    setCustomUrl('');
    setCustomTitle('');
    setActiveVideo(newVid);
  };

  // Filtered Videos
  const filteredVideos = useMemo(() => {
    return videos.filter(v => {
      const matchCat = selectedCategory === 'all' || v.category === selectedCategory;
      const matchAud = selectedAudience === 'all' || v.targetAudience === selectedAudience || v.targetAudience === 'all';
      const matchQuery = !searchQuery.trim() || 
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.channel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchAud && matchQuery;
    });
  }, [videos, selectedCategory, selectedAudience, searchQuery]);

  // Pomodoro Timer Effect
  useEffect(() => {
    let interval = null;
    if (pomodoroRunning && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(prev => prev - 1);
      }, 1000);
    } else if (pomodoroTime === 0 && pomodoroRunning) {
      setPomodoroRunning(false);
      if (pomodoroMode === 'focus') {
        setCompletedSessions(prev => prev + 1);
        alert('🎉 Chúc mừng! Bạn đã hoàn thành 1 chu kỳ Pomodoro tập trung cao độ. Hãy nghỉ ngơi 5 phút nhé!');
        setPomodoroMode('short_break');
        setPomodoroTime(5 * 60);
        setPomodoroInitial(5 * 60);
      } else {
        alert('⏰ Hết giờ nghỉ ngơi! Hãy bắt đầu chu kỳ tập trung tiếp theo.');
        setPomodoroMode('focus');
        setPomodoroTime(25 * 60);
        setPomodoroInitial(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [pomodoroRunning, pomodoroTime, pomodoroMode]);

  const togglePomodoro = () => {
    setPomodoroRunning(!pomodoroRunning);
  };

  const resetPomodoro = () => {
    setPomodoroRunning(false);
    setPomodoroTime(pomodoroInitial);
  };

  const switchPomodoroMode = (mode, minutes) => {
    setPomodoroRunning(false);
    setPomodoroMode(mode);
    setPomodoroTime(minutes * 60);
    setPomodoroInitial(minutes * 60);
  };

  // Ambient Sound Play / Pause
  const handleToggleSound = (soundId) => {
    if (activeSound === soundId) {
      ambientSound.stop();
      setActiveSound(null);
    } else {
      ambientSound.play(soundId);
      setActiveSound(soundId);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setAmbientVolume(val);
    ambientSound.setVolume(val);
  };

  // Calculate 2+2 Graduation Result
  const calcResult = useMemo(() => {
    const { math, literature, elective1, elective2, gpa10, gpa11, gpa12, bonusPoints, priorityPoints } = calcForm;
    
    // Kiểm tra điểm liệt (<= 1.0)
    const isLiệt = math <= 1.0 || literature <= 1.0 || elective1 <= 1.0 || elective2 <= 1.0;
    
    // 1. Điểm TB 4 môn thi
    const examAvg = (Number(math) + Number(literature) + Number(elective1) + Number(elective2)) / 4;
    
    // 2. Điểm TB học bạ 3 năm
    const gpaAvg = (Number(gpa10) + Number(gpa11) + Number(gpa12)) / 3;
    
    // 3. Công thức xét tốt nghiệp 2026: (Điểm thi * 0.5) + (Điểm học bạ * 0.5) + (Khuyến khích / 4) + Ưu tiên
    const bonus = Number(bonusPoints) || 0;
    const priority = Number(priorityPoints) || 0;
    const finalScore = (examAvg * 0.5) + (gpaAvg * 0.5) + (bonus / 4) + priority;

    const isPassed = !isLiệt && finalScore >= 5.0;

    let rank = 'Trượt tốt nghiệp';
    if (isPassed) {
      if (finalScore >= 8.5 && examAvg >= 7.0) rank = 'Tốt nghiệp Xuất sắc';
      else if (finalScore >= 7.5 && examAvg >= 6.0) rank = 'Tốt nghiệp Giỏi';
      else if (finalScore >= 6.5) rank = 'Tốt nghiệp Khá';
      else rank = 'Tốt nghiệp Trung bình';
    }

    return {
      examAvg: examAvg.toFixed(2),
      gpaAvg: gpaAvg.toFixed(2),
      finalScore: finalScore.toFixed(2),
      isLiệt,
      isPassed,
      rank
    };
  }, [calcForm]);

  // Export Notes to Word document
  const handleExportNotes = (vid) => {
    const notes = userNotes[vid.id] || [];
    if (notes.length === 0) {
      alert('Chưa có ghi chú nào cho video này để xuất file.');
      return;
    }

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Ghi Chú Bài Học</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; margin: 30px; }
        h1 { font-size: 16pt; color: #1e3a8a; text-align: center; }
        .meta { color: #475569; font-style: italic; margin-bottom: 20px; }
        .note-item { margin-bottom: 12px; padding: 10px; background: #f8fafc; border-left: 4px solid #0284c7; }
        .note-time { font-weight: bold; color: #0369a1; }
      </style>
      </head>
      <body>
        <h1>GHI CHÚ HỌC LIỆU SỐ HÓA - THPT CAO BÁ QUÁT</h1>
        <div class="meta">
          <p><strong>Tên bài giảng:</strong> ${vid.title}</p>
          <p><strong>Kênh/Tổ chuyên môn:</strong> ${vid.channel}</p>
          <p><strong>Ngày xuất file:</strong> ${new Date().toLocaleDateString('vi-VN')}</p>
        </div>
        <hr/>
        <h2>Nội dung ghi chép cá nhân:</h2>
        ${notes.map(n => `<div class="note-item"><span class="note-time">[${n.time}]</span> ${n.text}</div>`).join('')}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = (vid.title || 'Bai_Hoc').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    a.download = `1-Ghi_Chu_Bai_Hoc_${safeTitle}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px', fontFamily: '"Inter", sans-serif' }}>
      
      {/* 1. TOP HEADER & HERO BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #312e81 100%)',
        borderRadius: '24px',
        padding: '32px 28px',
        color: '#ffffff',
        marginBottom: '28px',
        boxShadow: '0 12px 36px rgba(0,0,0,0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background glow */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(99,102,241,0.25)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '20%', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(56,189,248,0.2)', filter: 'blur(50px)' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', marginBottom: '14px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <Sparkles size={16} color="#fbbf24" />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#e0e7ff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                EduHub 4.0 • THPT Cao Bá Quát
              </span>
            </div>
            <h1 style={{ fontSize: '30px', fontWeight: '900', margin: '0 0 10px 0', letterSpacing: '-0.5px', lineHeight: '1.2' }}>
              Trạm Học Liệu & Kỹ Năng Số Trực Quan
            </h1>
            <p style={{ margin: 0, fontSize: '14.5px', color: '#cbd5e1', maxWidth: '680px', lineHeight: '1.6' }}>
              Không gian số hóa bài giảng, chiến thuật ôn thi TN THPT, kỹ năng thế kỷ 21, trạm tập trung Pomodoro tích hợp sóng não Alpha và máy tính điểm tốt nghiệp 2+2.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '12px',
                backgroundColor: '#6366f1',
                color: '#ffffff',
                border: 'none',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                transition: 'transform 0.2s'
              }}
            >
              <Plus size={18} /> Thêm Video Tự Chọn
            </button>
            <Link
              to="/student-dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '12px 18px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.2)',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '14px'
              }}
            >
              <ArrowLeft size={16} /> Cổng Học Sinh
            </Link>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION BAR TABS */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button
          onClick={() => setActiveTab('videos')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'videos' ? '3px solid #4f46e5' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'videos' ? '#4f46e5' : '#64748b',
            fontWeight: '800',
            fontSize: '14.5px',
            cursor: 'pointer'
          }}
        >
          <Video size={18} /> Kho Video & Bài Giảng Số ({filteredVideos.length})
        </button>

        <button
          onClick={() => setActiveTab('pomodoro')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'pomodoro' ? '3px solid #8b5cf6' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'pomodoro' ? '#8b5cf6' : '#64748b',
            fontWeight: '800',
            fontSize: '14.5px',
            cursor: 'pointer'
          }}
        >
          <Clock size={18} /> Trạm Pomodoro & Lofi Chill
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'calculator' ? '3px solid #0284c7' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'calculator' ? '#0284c7' : '#64748b',
            fontWeight: '800',
            fontSize: '14.5px',
            cursor: 'pointer'
          }}
        >
          <Calculator size={18} /> Máy Tính Tốt Nghiệp 2+2
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'saved' ? '3px solid #e11d48' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'saved' ? '#e11d48' : '#64748b',
            fontWeight: '800',
            fontSize: '14.5px',
            cursor: 'pointer'
          }}
        >
          <Bookmark size={18} /> Đã Lưu & Ghi Chú ({savedVideoIds.length})
        </button>
      </div>

      {/* 3. TAB 1: KHO VIDEO HỌC LIỆU SỐ */}
      {activeTab === 'videos' && (
        <div>
          {/* Filters & Search Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '22px' }}>
            
            {/* Search Box */}
            <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '420px' }}>
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Tìm kiếm bài giảng, chủ đề, kỹ năng..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 16px 11px 40px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Target Audience Switcher */}
            <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
              <button
                onClick={() => setSelectedAudience('all')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: selectedAudience === 'all' ? '#ffffff' : 'transparent',
                  color: selectedAudience === 'all' ? '#0f172a' : '#64748b',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: selectedAudience === 'all' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                Mọi người
              </button>
              <button
                onClick={() => setSelectedAudience('student')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: selectedAudience === 'student' ? '#ffffff' : 'transparent',
                  color: selectedAudience === 'student' ? '#0284c7' : '#64748b',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: selectedAudience === 'student' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                🧑‍🎓 Học sinh
              </button>
              <button
                onClick={() => setSelectedAudience('teacher')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: selectedAudience === 'teacher' ? '#ffffff' : 'transparent',
                  color: selectedAudience === 'teacher' ? '#ea580c' : '#64748b',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: selectedAudience === 'teacher' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                👨‍🏫 Giáo viên
              </button>
            </div>
          </div>

          {/* Category Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {VIDEO_CATEGORIES.map(cat => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: isSelected ? `2px solid ${cat.color}` : '1.5px solid #e2e8f0',
                    backgroundColor: isSelected ? cat.color : '#ffffff',
                    color: isSelected ? '#ffffff' : '#334155',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? `0 4px 12px ${cat.color}33` : 'none'
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Videos Grid */}
          {filteredVideos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
              <Video size={48} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '16px', fontWeight: '700', color: '#475569', margin: '0 0 6px 0' }}>Không tìm thấy video nào phù hợp.</p>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Thử tìm từ khóa khác hoặc bấm nút "Thêm Video Tự Chọn" ở góc trên.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '22px' }}>
              {filteredVideos.map(vid => {
                const isSaved = savedVideoIds.includes(vid.id);
                return (
                  <div
                    key={vid.id}
                    onClick={() => setActiveVideo(vid)}
                    style={{
                      background: '#ffffff',
                      borderRadius: '18px',
                      overflow: 'hidden',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.04)';
                    }}
                  >
                    {/* Thumbnail & Badges */}
                    <div style={{ position: 'relative', width: '100%', height: '185px', backgroundColor: '#0f172a' }}>
                      <img
                        src={vid.thumbnail}
                        alt={vid.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
                      />
                      
                      {/* Play overlay button */}
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        color: '#4f46e5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                      }}>
                        <Play size={22} fill="#4f46e5" style={{ marginLeft: '3px' }} />
                      </div>

                      {/* Duration */}
                      <span style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '10px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(0,0,0,0.75)',
                        color: '#ffffff',
                        fontSize: '11.5px',
                        fontWeight: '700'
                      }}>
                        {vid.duration}
                      </span>

                      {/* Grade / Target badge */}
                      <span style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        backgroundColor: vid.targetAudience === 'teacher' ? 'rgba(234,88,12,0.9)' : 'rgba(2,132,199,0.9)',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: '800'
                      }}>
                        {vid.grade}
                      </span>

                      {/* Bookmark button */}
                      <button
                        onClick={e => toggleSaveVideo(vid.id, e)}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isSaved ? '#e11d48' : '#64748b'
                        }}
                        title={isSaved ? 'Bỏ lưu' : 'Lưu xem sau'}
                      >
                        {isSaved ? <BookmarkCheck size={18} fill="#e11d48" /> : <Bookmark size={18} />}
                      </button>
                    </div>

                    {/* Content info */}
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#6366f1', marginBottom: '6px' }}>
                          {vid.channel}
                        </div>
                        <h3 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 8px 0', color: '#1e293b', lineHeight: '1.4' }}>
                          {vid.title}
                        </h3>
                        <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 12px 0', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {vid.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '12px', color: '#94a3b8' }}>
                        <span>👁️ {vid.views} lượt học</span>
                        <span style={{ fontWeight: '700', color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          Xem bài giảng <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: TRẠM POMODORO & ÂM THANH NỀN CHILL */}
      {activeTab === 'pomodoro' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
          
          {/* Cột Trái: Đồng hồ Pomodoro */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '36px 28px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
            textAlign: 'center'
          }}>
            {/* Mode Switcher */}
            <div style={{ display: 'inline-flex', background: '#f8fafc', padding: '6px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '28px' }}>
              <button
                onClick={() => switchPomodoroMode('focus', 25)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: pomodoroMode === 'focus' ? '#4f46e5' : 'transparent',
                  color: pomodoroMode === 'focus' ? '#ffffff' : '#64748b',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                🎯 Tập trung (25p)
              </button>
              <button
                onClick={() => switchPomodoroMode('short_break', 5)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: pomodoroMode === 'short_break' ? '#10b981' : 'transparent',
                  color: pomodoroMode === 'short_break' ? '#ffffff' : '#64748b',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                ☕ Nghỉ ngắn (5p)
              </button>
              <button
                onClick={() => switchPomodoroMode('long_break', 15)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: pomodoroMode === 'long_break' ? '#0284c7' : 'transparent',
                  color: pomodoroMode === 'long_break' ? '#ffffff' : '#64748b',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                🌴 Nghỉ dài (15p)
              </button>
            </div>

            {/* Circular Timer Visual */}
            <div style={{
              width: '240px',
              height: '240px',
              margin: '0 auto 28px auto',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
              border: `8px solid ${pomodoroMode === 'focus' ? '#6366f1' : pomodoroMode === 'short_break' ? '#10b981' : '#0284c7'}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 25px rgba(99,102,241,0.15)'
            }}>
              <span style={{ fontSize: '54px', fontWeight: '900', color: '#1e293b', letterSpacing: '-1px' }}>
                {String(Math.floor(pomodoroTime / 60)).padStart(2, '0')}:{String(pomodoroTime % 60).padStart(2, '0')}
              </span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', marginTop: '4px' }}>
                {pomodoroRunning ? '⚡ Đang tập trung cao độ' : '⏸️ Đang tạm dừng'}
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '24px' }}>
              <button
                onClick={togglePomodoro}
                style={{
                  padding: '14px 32px',
                  borderRadius: '14px',
                  backgroundColor: pomodoroRunning ? '#f59e0b' : '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '800',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(79,70,229,0.3)'
                }}
              >
                {pomodoroRunning ? <Pause size={20} /> : <Play size={20} />}
                {pomodoroRunning ? 'Tạm Dừng' : 'Bắt Đầu Ngay'}
              </button>

              <button
                onClick={resetPomodoro}
                style={{
                  padding: '14px 20px',
                  borderRadius: '14px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1.5px solid #cbd5e1',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer'
                }}
                title="Khôi phục thời gian gốc"
              >
                <RotateCcw size={18} />
              </button>
            </div>

            {/* Session Stats */}
            <div style={{ fontSize: '13.5px', color: '#64748b' }}>
              🏆 Hôm nay bạn đã hoàn thành: <strong style={{ color: '#4f46e5' }}>{completedSessions} chu kỳ</strong> ({completedSessions * 25} phút học sâu).
            </div>
          </div>

          {/* Cột Phải: Bộ Tạo Âm Thanh Môi Trường & Sóng Não */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '32px 28px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 8px 30px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <Music size={24} color="#8b5cf6" />
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#1e293b' }}>
                Âm Thanh Nền & Sóng Não Tập Trung
              </h2>
            </div>
            <p style={{ margin: '0 0 24px 0', fontSize: '13.5px', color: '#64748b', lineHeight: '1.5' }}>
              Bộ tổng hợp âm thanh môi trường bằng Web Audio API thuần. Giúp khử tiếng ồn xung quanh, đưa não bộ vào trạng thái Alpha tiếp thu nhanh.
            </p>

            {/* Sound Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              {AMBIENT_SOUNDS.map(s => {
                const isPlaying = activeSound === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleToggleSound(s.id)}
                    style={{
                      padding: '16px 12px',
                      borderRadius: '16px',
                      border: isPlaying ? `2px solid ${s.color}` : '1.5px solid #e2e8f0',
                      backgroundColor: isPlaying ? `${s.color}15` : '#f8fafc',
                      color: isPlaying ? s.color : '#334155',
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                      boxShadow: isPlaying ? `0 4px 12px ${s.color}33` : 'none'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: isPlaying ? s.color : '#e2e8f0',
                      color: isPlaying ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {s.id === 'rain' && <CloudRain size={20} />}
                      {s.id === 'waves' && <Waves size={20} />}
                      {s.id === 'campfire' && <Flame size={20} />}
                      {s.id === 'alpha' && <Activity size={20} />}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '800' }}>{s.label}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{isPlaying ? '▶️ Đang phát' : 'Tạm dừng'}</span>
                  </button>
                );
              })}
            </div>

            {/* Volume Control */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Volume2 size={16} /> Âm lượng âm thanh nền:
                </span>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#4f46e5' }}>{Math.round(ambientVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ambientVolume}
                onChange={handleVolumeChange}
                style={{ width: '100%', accentColor: '#4f46e5', cursor: 'pointer' }}
              />
            </div>
          </div>

        </div>
      )}

      {/* 5. TAB 3: MÁY TÍNH ĐIỂM XÉT TỐT NGHIỆP THPT 2026 (2+2) */}
      {activeTab === 'calculator' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
          
          {/* Cột Trái: Bảng Nhập Điểm */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: '30px', border: '1.5px solid #e2e8f0', boxShadow: '0 8px 30px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calculator size={22} color="#0284c7" /> Nhập Điểm Dự Đoán (Chuẩn 2+2)
            </h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>
              Công thức Bộ GD&ĐT: 50% Điểm bài thi + 50% Điểm học bạ 3 năm + Điểm ưu tiên/khuyến khích.
            </p>

            {/* 4 Môn thi */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0369a1', marginBottom: '10px', textTransform: 'uppercase' }}>
                1. Điểm 04 Bài Thi Tốt Nghiệp:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569' }}>Toán (Bắt buộc):</label>
                  <input
                    type="number" step="0.1" min="0" max="10"
                    value={calcForm.math}
                    onChange={e => setCalcForm({ ...calcForm, math: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: '700', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569' }}>Ngữ Văn (Bắt buộc):</label>
                  <input
                    type="number" step="0.1" min="0" max="10"
                    value={calcForm.literature}
                    onChange={e => setCalcForm({ ...calcForm, literature: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: '700', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569' }}>Môn Tự Chọn 1:</label>
                  <input
                    type="number" step="0.1" min="0" max="10"
                    value={calcForm.elective1}
                    onChange={e => setCalcForm({ ...calcForm, elective1: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: '700', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569' }}>Môn Tự Chọn 2:</label>
                  <input
                    type="number" step="0.1" min="0" max="10"
                    value={calcForm.elective2}
                    onChange={e => setCalcForm({ ...calcForm, elective2: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: '700', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            {/* Điểm học bạ 3 năm */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0369a1', marginBottom: '10px', textTransform: 'uppercase' }}>
                2. Điểm TB Cả Năm 3 Khối Lớp (Học bạ):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Lớp 10:</label>
                  <input
                    type="number" step="0.1" min="0" max="10"
                    value={calcForm.gpa10}
                    onChange={e => setCalcForm({ ...calcForm, gpa10: e.target.value })}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: '700', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Lớp 11:</label>
                  <input
                    type="number" step="0.1" min="0" max="10"
                    value={calcForm.gpa11}
                    onChange={e => setCalcForm({ ...calcForm, gpa11: e.target.value })}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: '700', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Lớp 12:</label>
                  <input
                    type="number" step="0.1" min="0" max="10"
                    value={calcForm.gpa12}
                    onChange={e => setCalcForm({ ...calcForm, gpa12: e.target.value })}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: '700', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            {/* Điểm khuyến khích & ưu tiên */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0369a1', marginBottom: '10px', textTransform: 'uppercase' }}>
                3. Điểm Khuyến Khích & Ưu Tiên:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Khuyến khích (Nghề, HSG):</label>
                  <input
                    type="number" step="0.25" min="0" max="4"
                    value={calcForm.bonusPoints}
                    onChange={e => setCalcForm({ ...calcForm, bonusPoints: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: '700', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Ưu tiên (Diện 2/3):</label>
                  <input
                    type="number" step="0.25" min="0" max="2"
                    value={calcForm.priorityPoints}
                    onChange={e => setCalcForm({ ...calcForm, priorityPoints: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: '700', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Cột Phải: Thẻ Kết Quả Dự Đoán */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '30px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                DỰ ĐOÁN KẾT QUẢ TỐT NGHIỆP
              </div>

              {/* Big Score Display */}
              <div style={{
                background: calcResult.isPassed ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                padding: '24px',
                borderRadius: '20px',
                border: `2px solid ${calcResult.isPassed ? '#86efac' : '#fca5a5'}`,
                textAlign: 'center',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '48px', fontWeight: '900', color: calcResult.isPassed ? '#15803d' : '#dc2626', lineHeight: 1 }}>
                  {calcResult.finalScore}
                </div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: calcResult.isPassed ? '#166534' : '#991b1b', marginTop: '6px' }}>
                  {calcResult.rank}
                </div>
                {calcResult.isLiệt && (
                  <div style={{ color: '#dc2626', fontSize: '12.5px', fontWeight: '700', marginTop: '6px' }}>
                    ⚠️ Cảnh báo: Có môn bị điểm liệt (&le; 1.0 điểm)!
                  </div>
                )}
              </div>

              {/* Detail Stats Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>ĐTB 4 Bài Thi:</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{calcResult.examAvg} đ</div>
                </div>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>ĐTB Học Bạ 3 Năm:</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{calcResult.gpaAvg} đ</div>
                </div>
              </div>

              {/* Strategic Advice */}
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '16px', borderRadius: '14px', fontSize: '13px', color: '#0369a1', lineHeight: '1.6' }}>
                <strong>💡 Lời khuyên chiến thuật từ AI:</strong><br />
                {calcResult.isPassed ? (
                  <>
                    Điểm học bạ của bạn rất vững ({calcResult.gpaAvg} đ). Hãy tập trung luyện đề câu hỏi Đúng/Sai của 2 môn tự chọn để bứt phá lên mức <strong>{calcResult.rank}</strong> và mở rộng cơ hội xét tuyển Đại học top đầu!
                  </>
                ) : (
                  <>
                    Cần đặc biệt lưu ý cải thiện điểm số các môn tự chọn để tránh điểm liệt và kéo điểm xét tốt nghiệp lên trên mức 5.0 điểm an toàn.
                  </>
                )}
              </div>
            </div>

            <Link
              to="/hoc-sinh/tu-van-to-hop-2-cong-2"
              style={{
                marginTop: '20px',
                display: 'block',
                textAlign: 'center',
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '13.5px'
              }}
            >
              Mở AI Cố Vấn Tuyển Sinh & Khối Thi Đại Học 2+2 &rarr;
            </Link>
          </div>

        </div>
      )}

      {/* 6. TAB 4: ĐÃ LƯU & GHI CHÚ */}
      {activeTab === 'saved' && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '16px' }}>
            Video Đã Lưu & Sổ Ghi Chú Cá Nhân
          </h2>

          {savedVideoIds.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
              <Bookmark size={40} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
              <p style={{ fontWeight: '700', color: '#475569', margin: 0 }}>Bạn chưa lưu video nào.</p>
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>Bấm vào biểu tượng bookmark trên góc các video để lưu xem lại bất cứ lúc nào.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {videos.filter(v => savedVideoIds.includes(v.id)).map(vid => {
                const notes = userNotes[vid.id] || [];
                return (
                  <div key={vid.id} style={{ background: '#ffffff', borderRadius: '16px', padding: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 6px 0', color: '#1e293b' }}>
                      {vid.title}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>{vid.channel}</p>

                    <div style={{ marginBottom: '14px', fontSize: '12.5px', color: '#475569' }}>
                      📝 Đã có <strong>{notes.length}</strong> ghi chú cá nhân.
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setActiveVideo(vid)}
                        style={{
                          flex: 1,
                          padding: '9px 12px',
                          borderRadius: '8px',
                          backgroundColor: '#4f46e5',
                          color: '#ffffff',
                          border: 'none',
                          fontWeight: '700',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        Mở Xem Video
                      </button>
                      {notes.length > 0 && (
                        <button
                          onClick={() => handleExportNotes(vid)}
                          style={{
                            padding: '9px 12px',
                            borderRadius: '8px',
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            fontWeight: '700',
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                          title="Xuất file Word ghi chú"
                        >
                          <Download size={15} /> Xuất Word
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 7. MODAL XEM VIDEO & GHI CHÚ THÔNG MINH */}
      {activeVideo && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            maxWidth: '1000px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            
            {/* Modal Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#4f46e5', textTransform: 'uppercase' }}>
                  {activeVideo.channel} • {activeVideo.grade}
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '4px 0 0 0', color: '#0f172a' }}>
                  {activeVideo.title}
                </h2>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Player + Notes Side-by-side */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', padding: '24px', gap: '24px' }}>
              
              {/* Left Column: Video Embed & Key Takeaways */}
              <div>
                <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#000000', marginBottom: '16px' }}>
                  <iframe
                    src={activeVideo.embedUrl}
                    title={activeVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  />
                </div>

                {/* Key Takeaways Box */}
                {activeVideo.keyTakeaways && activeVideo.keyTakeaways.length > 0 && (
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={16} color="#4f46e5" /> Các Điểm Cốt Lõi Cần Nhớ:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                      {activeVideo.keyTakeaways.map((point, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right Column: Timestamped Notes */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={18} color="#0284c7" /> Sổ Ghi Chép Bài Học
                    </h3>
                    {(userNotes[activeVideo.id] || []).length > 0 && (
                      <button
                        onClick={() => handleExportNotes(activeVideo)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#f0fdf4',
                          color: '#166534',
                          border: '1px solid #bbf7d0',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Download size={13} /> Xuất Word
                      </button>
                    )}
                  </div>

                  {/* Notes List */}
                  <div style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                    {(userNotes[activeVideo.id] || []).length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                        Chưa có ghi chú nào. Hãy ghi lại những kiến thức đắt giá khi xem video ở ô bên dưới!
                      </div>
                    ) : (
                      (userNotes[activeVideo.id] || []).map(note => (
                        <div key={note.id} style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '10px', borderLeft: '3px solid #0284c7', fontSize: '13px', color: '#1e293b', lineHeight: '1.5' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#0369a1', marginRight: '6px' }}>
                            [{note.time}]
                          </span>
                          {note.text}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Input box */}
                <div>
                  <textarea
                    rows={3}
                    placeholder="Nhập ghi chép, bài học hoặc công thức rút ra..."
                    value={newNoteText}
                    onChange={e => setNewNoteText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      marginBottom: '8px'
                    }}
                  />
                  <button
                    onClick={handleAddNote}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '10px',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: '700',
                      fontSize: '13.5px',
                      cursor: 'pointer'
                    }}
                  >
                    + Lưu Ghi Chú Này
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* 8. MODAL THÊM VIDEO TỰ CHỌN */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 6px 0', color: '#0f172a' }}>
              Thêm Học Liệu Video Mới
            </h3>
            <p style={{ margin: '0 0 18px 0', fontSize: '13px', color: '#64748b' }}>
              Dán đường dẫn YouTube bài giảng hoặc video kỹ năng bạn muốn lưu trữ vào trạm học tập.
            </p>

            <form onSubmit={handleAddCustomVideo}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Link YouTube:
                </label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={customUrl}
                  onChange={e => setCustomUrl(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Tên bài giảng / Tiêu đề:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ôn tập Hình học không gian Oxyz..."
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Chuyên mục:
                </label>
                <select
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                >
                  <option value="exam_prep">Ôn Thi TN THPT 2025/2026</option>
                  <option value="study_methods">Phương Pháp Học Tập Khoa Học</option>
                  <option value="career_skills">Kỹ Năng Sống & Hướng Nghiệp</option>
                  <option value="mental_health">Tâm Lý & Chữa Lành Học Đường</option>
                  <option value="teacher_pd">Góc Sư Phạm & Ứng Dụng AI</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, padding: '11px', borderRadius: '10px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', fontWeight: '700', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '11px', borderRadius: '10px', backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', fontWeight: '700', cursor: 'pointer' }}
                >
                  Thêm Vào Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
