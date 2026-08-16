import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Heart, Search, Eye, Trophy, Award, Sparkles, Filter, X, ShieldCheck, CheckCircle2, RefreshCw, KeyRound, AlertCircle } from 'lucide-react';
import InteractiveProductViewer from '../components/InteractiveProductViewer';

export default function PublicVoting() {
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get('code') || '';

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'leaderboard'

  // MY CURRENT VOTE STATE
  const [myCurrentVote, setMyCurrentVote] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'compact'
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  // Voting Modal State
  const [votingEntry, setVotingEntry] = useState(null);
  const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false);
  const [voterName, setVoterName] = useState('');
  const [voterCode, setVoterCode] = useState('');
  const [submittingVote, setSubmittingVote] = useState(false);
  const [voteSuccessModal, setVoteSuccessModal] = useState(false);
  const isVotingLocked = localStorage.getItem('cbq_voting_locked') === 'true';

  const handleVoteClick = (entry) => {
    const currentStudent = JSON.parse(localStorage.getItem('cbq_current_student') || 'null');
    if (!currentStudent) {
      setShowAuthRequiredModal(true);
      return;
    }
    setVotingEntry(entry);
  };

  // Entry Detail Lightbox Modal State
  const [detailEntry, setDetailEntry] = useState(null);

  const categories = ['Tất cả', 'Tranh vẽ', 'Video / Short Clip', 'Mô hình / Sáng tạo', 'Thơ & Bài viết', 'Chung'];

  useEffect(() => {
    fetchEntries();
    fetchMyVote();
    if (codeFromUrl) {
      setVoterCode(codeFromUrl.toUpperCase());
    }
  }, [codeFromUrl]);

  const fetchMyVote = async () => {
    const currentStudent = JSON.parse(localStorage.getItem('cbq_current_student') || 'null');
    const voterKey = currentStudent ? `USER-${currentStudent.username}` : getDeviceFingerprint();

    const { data } = await supabase
      .from('cbq_votes')
      .select('*, cbq_voting_entries(title, author_name)')
      .or(`device_token.eq.${voterKey},voter_code.eq.${voterKey}`)
      .limit(1);

    if (data && data.length > 0) {
      setMyCurrentVote(data[0]);
    } else {
      setMyCurrentVote(null);
    }
  };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_voting_entries')
        .select('*')
        .eq('is_active', true)
        .order('votes_count', { ascending: false });

      if (!error && data) {
        setEntries(data);
      } else {
        setEntries(getSampleEntries());
      }
    } catch (err) {
      console.error("Lỗi tải bài dự thi:", err);
      setEntries(getSampleEntries());
    } finally {
      setLoading(false);
    }
  };

  const getSampleEntries = () => [
    {
      id: 'sample-1',
      title: 'Bức Tranh Thư Pháp "Mái Trường 30 Năm Chắp Cánh"',
      author_name: 'Tập thể Lớp 12A1 (Niên khóa 2023 - 2026)',
      category: 'Tranh vẽ',
      image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
      description: 'Tác phẩm được vẽ bằng màu nước và nét bút thư pháp tinh xảo, phác họa hình ảnh tượng Cao Bá Quát rạng rỡ cùng hàng cây lâu năm trường mình.',
      votes_count: 245
    },
    {
      id: 'sample-2',
      title: 'Video Clip "Ký Ức Tuổi Học Trò & Thầy Cô"',
      author_name: 'Cựu HS Nguyễn Văn Nam (Khóa 2002 - 2005)',
      category: 'Video / Short Clip',
      image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
      description: 'Đoạn phim ngắn 3 phút tổng hợp những bức ảnh tư liệu quý giá qua 30 năm thành lập trường THPT Cao Bá Quát với những nụ cười ngây thơ tuổi học trò.',
      votes_count: 198
    },
    {
      id: 'sample-3',
      title: 'Mô Hình Gỗ "Cổng Trường Kỷ Nguyên Mới"',
      author_name: 'CLB Sáng Tạo Trẻ Cao Bá Quát',
      category: 'Mô hình / Sáng tạo',
      image_url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
      description: 'Mô hình được làm thủ công bằng gỗ tăm ghép tinh xảo mô phỏng lại cổng trường THPT Cao Bá Quát lung linh ánh đèn kỷ niệm 30 năm.',
      votes_count: 172
    }
  ];

  // CLASS NAME NORMALIZER
  const normalizeClassName = (rawClass) => {
    if (!rawClass) return 'KHÁC';
    let clean = rawClass.trim().toUpperCase().replace(/\s+/g, '');
    if (clean.startsWith('LOP')) clean = clean.replace('LOP', 'LỚP ');
    else if (clean.startsWith('LỚP')) clean = clean.replace('LỚP', 'LỚP ');
    else if (!clean.startsWith('LỚP') && !clean.startsWith('KHÓA')) clean = 'LỚP ' + clean;
    return clean;
  };

  // HARDWARE DEVICE FINGERPRINT (RESISTANT TO INCOGNITO & CACHE CLEARING)
  const getDeviceFingerprint = () => {
    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const hardware = `${navigator.hardwareConcurrency || 2}_${navigator.maxTouchPoints || 0}`;
    const userAgent = navigator.userAgent || '';
    const tz = new Date().getTimezoneOffset();
    const rawString = `${screenInfo}_${hardware}_${userAgent}_${tz}`;
    let hash = 0;
    for (let i = 0; i < rawString.length; i++) {
      hash = (hash << 5) - hash + rawString.charCodeAt(i);
      hash |= 0;
    }
    const deviceHash = `DEV-${Math.abs(hash).toString(36).toUpperCase()}`;
    localStorage.setItem('cbq_device_vote_token', deviceHash);
    return deviceHash;
  };

  // ANTI-FRAUD DEVICE-BASED VOTING LOGIC
  const handleConfirmVote = async (e) => {
    e.preventDefault();
    if (isVotingLocked) {
      alert("🔒 CỔNG BÌNH CHỌN ĐÃ KHÓA!\n\nBan Tổ Chức đã chốt kết quả đợt bình chọn.");
      return;
    }
    if (submittingVote) return;

    const currentStudent = JSON.parse(localStorage.getItem('cbq_current_student') || 'null');
    let fullName = voterName.trim();
    let studentClass = normalizeClassName(voterCode);

    if (currentStudent) {
      fullName = currentStudent.full_name;
      studentClass = currentStudent.student_class;
    } else if (!fullName || !studentClass) {
      alert("Vui lòng ĐĂNG NHẬP tài khoản học sinh hoặc điền Họ tên & Lớp trước khi bình chọn!");
      return;
    }

    const voterCodeGenerated = currentStudent ? `USER-${currentStudent.username}` : `${studentClass}-${fullName.toUpperCase()}`;
    const deviceToken = currentStudent ? `USER-${currentStudent.username}` : getDeviceFingerprint();

    setSubmittingVote(true);

    try {
      // 1. Strict Device Fingerprint check against DB (1 device = 1 vote)
      const { data: existingDeviceVote } = await supabase
        .from('cbq_votes')
        .select('*, cbq_voting_entries(title)')
        .eq('device_token', deviceToken)
        .limit(1);

      if (existingDeviceVote && existingDeviceVote.length > 0) {
        const existingVoteObj = existingDeviceVote[0];
        const isSameEntry = existingVoteObj.entry_id === votingEntry.id;

        if (isSameEntry) {
          // USER CLICKED VOTE ON THE SAME ENTRY THEY ALREADY VOTED FOR
          const confirmCancel = window.confirm(
            `💖 THÔNG BÁO BÌNH CHỌN:\n\nQuý vị đã bình chọn cho tác phẩm: "${votingEntry.title}".\n\nQuý vị có muốn HỦY lượt bình chọn này để chuyển sang bình chọn tác phẩm khác không?`
          );

          if (confirmCancel) {
            await handleCancelMyVote();
          }
          setSubmittingVote(false);
          setVotingEntry(null);
          return;
        } else {
          // USER IS SWITCHING VOTE TO A DIFFERENT ENTRY
          const oldTitle = existingVoteObj.cbq_voting_entries?.title || 'tác phẩm trước';
          const confirmSwitch = window.confirm(
            `💡 CHUYỂN LƯỢT BÌNH CHỌN:\n\nQuý vị hiện đang bình chọn cho tác phẩm: "${oldTitle}".\n\nQuý vị có muốn CHUYỂN LƯỢT BÌNH CHỌN sang tác phẩm mới "${votingEntry.title}" không?`
          );

          if (confirmSwitch) {
            await handleSwitchVote(existingVoteObj, votingEntry);
          }
          setSubmittingVote(false);
          setVotingEntry(null);
          return;
        }
      }

      // 2. Check if name+class code already used
      const { data: existingNameVote } = await supabase
        .from('cbq_votes')
        .select('*')
        .eq('voter_code', voterCodeGenerated)
        .limit(1);

      if (existingNameVote && existingNameVote.length > 0) {
        alert(`⛔ HỆ THỐNG GHI NHẬN:\nHọ tên [${fullName}] thuộc [${studentClass}] đã thực hiện bình chọn trước đó.\n\nĐể bảo đảm tính khách quan, mỗi cá nhân chỉ bình chọn 01 lần duy nhất.`);
        setSubmittingVote(false);
        return;
      }

      // 3. Insert vote into database
      const { error: insertErr } = await supabase
        .from('cbq_votes')
        .insert([{
          entry_id: votingEntry.id,
          voter_name: `${fullName} (${studentClass})`,
          voter_code: voterCodeGenerated,
          device_token: deviceToken
        }]);

      if (insertErr) {
        console.error(insertErr);
        alert("Có lỗi khi lưu bình chọn. Vui lòng thử lại!");
        setSubmittingVote(false);
        return;
      }

      // 4. Increment votes_count in voting_entries
      const newCount = (votingEntry.votes_count || 0) + 1;
      await supabase
        .from('cbq_voting_entries')
        .update({ votes_count: newCount })
        .eq('id', votingEntry.id);

      // Update local state
      setEntries(prev => prev.map(item => item.id === votingEntry.id ? { ...item, votes_count: newCount } : item));
      setSubmittingVote(false);
      setVotingEntry(null);
      setVoterCode('');
      setVoteSuccessModal(true);
      fetchMyVote();

    } catch (err) {
      console.error("Lỗi bình chọn:", err);
      alert("Có lỗi xảy ra khi xử lý bình chọn.");
      setSubmittingVote(false);
    }
  };

  // CANCEL MY VOTE FUNCTION
  const handleCancelMyVote = async () => {
    if (!myCurrentVote) return;
    const oldTitle = myCurrentVote.cbq_voting_entries?.title || 'tác phẩm';

    if (!window.confirm(`Quý vị có chắc chắn muốn HỦY lượt bình chọn cho tác phẩm "${oldTitle}" không?`)) return;

    try {
      // 1. Delete vote record
      await supabase.from('cbq_votes').delete().eq('id', myCurrentVote.id);

      // 2. Decrement votes_count in target entry
      const targetEntry = entries.find(e => e.id === myCurrentVote.entry_id);
      if (targetEntry && targetEntry.votes_count > 0) {
        const newCount = targetEntry.votes_count - 1;
        await supabase
          .from('cbq_voting_entries')
          .update({ votes_count: newCount })
          .eq('id', targetEntry.id);

        setEntries(prev => prev.map(e => e.id === targetEntry.id ? { ...e, votes_count: newCount } : e));
      }

      setMyCurrentVote(null);
      alert(`Đã hủy lượt bình chọn cho tác phẩm "${oldTitle}". Quý vị có thể chọn bình chọn cho tác phẩm khác.`);
    } catch (err) {
      console.error("Lỗi khi hủy bình chọn:", err);
      alert("Không thể hủy bình chọn. Vui lòng thử lại sau!");
    }
  };

  // SWITCH VOTE FUNCTION
  const handleSwitchVote = async (oldVoteRecord, newEntry) => {
    try {
      // 1. Decrement old entry count
      const oldEntry = entries.find(e => e.id === oldVoteRecord.entry_id);
      if (oldEntry && oldEntry.votes_count > 0) {
        await supabase
          .from('cbq_voting_entries')
          .update({ votes_count: oldEntry.votes_count - 1 })
          .eq('id', oldEntry.id);
      }

      // 2. Increment new entry count
      const newCount = (newEntry.votes_count || 0) + 1;
      await supabase
        .from('cbq_voting_entries')
        .update({ votes_count: newCount })
        .eq('id', newEntry.id);

      // 3. Update vote record entry_id
      await supabase
        .from('cbq_votes')
        .update({
          entry_id: newEntry.id,
          created_at: new Date().toISOString()
        })
        .eq('id', oldVoteRecord.id);

      setEntries(prev => prev.map(e => {
        if (e.id === oldVoteRecord.entry_id) return { ...e, votes_count: Math.max(0, (e.votes_count || 0) - 1) };
        if (e.id === newEntry.id) return { ...e, votes_count: newCount };
        return e;
      }));

      setVotingEntry(null);
      fetchMyVote();
      alert(`🎉 CHUYỂN BÌNH CHỌN THÀNH CÔNG!\n\nHệ thống đã chuyển lượt bình chọn của Quý vị sang tác phẩm "${newEntry.title}".`);
    } catch (err) {
      console.error("Lỗi chuyển bình chọn:", err);
      alert("Không thể chuyển bình chọn. Vui lòng thử lại!");
    }
  };

  const filteredEntries = entries.filter(e => {
    const matchCategory = selectedCategory === 'Tất cả' || e.category === selectedCategory;
    const matchSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        e.author_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const sortedLeaderboard = [...entries].sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0));

  const currentStudent = JSON.parse(localStorage.getItem('cbq_current_student') || 'null');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 16px' }}>
      
      {/* BANNER HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #881337 0%, #be123c 50%, #b45309 100%)',
        borderRadius: '20px',
        padding: '35px 25px',
        color: '#ffffff',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(190, 18, 60, 0.25)',
        marginBottom: '30px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '4px 16px', borderRadius: '30px', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '12px' }}>
          <Sparkles size={16} color="#fde047" /> KỶ NIỆM 30 NĂM THPT CAO BÁ QUÁT (1996 - 2026)
        </div>

        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontFamily: 'Playfair Display, Georgia, serif', color: '#fde047', textShadow: '0 2px 12px rgba(0,0,0,0.7)', fontWeight: '800', letterSpacing: '0.5px' }}>
          🏆 CUỘC THI BÌNH CHỌN TÁC PHẨM & SẢN PHẨM SÁNG TẠO
        </h1>
        <p style={{ margin: '0 auto 16px auto', maxWidth: '750px', fontSize: '14.5px', color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.5)', fontWeight: '500', lineHeight: '1.6' }}>
          Hãy cùng thả tim tôn vinh những tác phẩm xuất sắc nhất của các bạn học sinh & cựu học sinh! Kết quả 100% dựa trên bình chọn công khai.
        </p>

        {/* STUDENT AUTH STATE BAR INSIDE VOTING PAGE */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {currentStudent ? (
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(4px)', padding: '8px 18px', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13.5px' }}>
              <span>🎓 Tài Khoản: <strong>{currentStudent.full_name}</strong> ({currentStudent.student_class})</span>
              <button 
                onClick={() => {
                  localStorage.removeItem('cbq_current_student');
                  window.location.reload();
                }}
                style={{ background: '#ffffff', color: '#be123c', border: 'none', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                🚪 Đăng Xuất & Cho Bạn Tiếp Theo
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to="/dang-nhap" style={{ padding: '8px 20px', background: '#ffffff', color: '#be123c', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                🔐 Đăng Nhập
              </Link>
              <Link to="/dang-ky" style={{ padding: '8px 20px', background: 'rgba(255,255,255,0.25)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none' }}>
                👤 Đăng Ký
              </Link>
            </div>
          )}
        </div>

        {/* SECURITY ANTI-FRAUD BADGE */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#166534', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginTop: '16px' }}>
          <ShieldCheck size={16} /> Hệ Thống Khóa Đúp Anti-Spam • Bảo Đảm Công Bằng 100%
        </div>
      </div>

      {/* MY ACTIVE VOTE CALLOUT BANNER */}
      {myCurrentVote && (
        <div style={{ background: '#fef2f2', border: '2px dashed #be123c', borderRadius: '16px', padding: '16px 20px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#be123c', color: 'white', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={22} fill="white" />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#be123c', textTransform: 'uppercase' }}>
                💖 BẠN ĐÃ THẢ TIM BÌNH CHỌN CHO TÁC PHẨM:
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginTop: '2px' }}>
                "{myCurrentVote.cbq_voting_entries?.title || 'Tác phẩm'}" • {myCurrentVote.voter_name}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Bạn có thể Hủy lượt tim này bất cứ lúc nào hoặc bấm nút [BÌNH CHỌN] ở bài thi khác để chuyển tim sang bài mới!
              </div>
            </div>
          </div>

          <button 
            onClick={handleCancelMyVote}
            style={{ padding: '8px 16px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
          >
            💔 Hủy Lượt Bình Chọn Này
          </button>
        </div>
      )}

      {/* NAVIGATION TABS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setActiveTab('all')} 
            style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', border: 'none', background: activeTab === 'all' ? '#be123c' : '#f1f5f9', color: activeTab === 'all' ? 'white' : '#475569' }}
          >
            🖼️ Tất Cả Bài Dự Thi ({entries.length})
          </button>
          <button 
            onClick={() => setActiveTab('leaderboard')} 
            style={{ padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', border: 'none', background: activeTab === 'leaderboard' ? '#b45309' : '#f1f5f9', color: activeTab === 'leaderboard' ? 'white' : '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Trophy size={18} color="#fde047" /> Bảng Xếp Hạng Top 1-2-3
          </button>
        </div>

        {/* SEARCH BOX */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Tìm tên bài thi, lớp, tác giả..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 38px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

            {/* CATEGORY FILTER BUTTONS */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '24px' }}>
          {categories.map(cat => {
            const count = cat === 'Tất cả' ? entries.length : entries.filter(e => e.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  border: isSelected ? 'none' : '1px solid #cbd5e1',
                  background: isSelected ? '#be123c' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#475569',
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? '0 4px 12px rgba(190, 18, 60, 0.25)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {cat} <span style={{ background: isSelected ? 'rgba(255,255,255,0.25)' : '#f1f5f9', color: isSelected ? 'white' : '#64748b', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>{count}</span>
              </button>
            );
          })}
        </div>

      {/* MAIN CONTENT TAB 1: ENTRY GRID */}
      {activeTab === 'all' && (
        loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Đang tải bài dự thi...</div>
        ) : filteredEntries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
            <p style={{ fontSize: '16px', color: '#64748b' }}>Không tìm thấy bài dự thi nào phù hợp.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '22px' }}>
            {filteredEntries.map((entry, idx) => (
              <div 
                key={entry.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div>
                  {/* ENTRY THUMBNAIL */}
                  <div style={{ position: 'relative', height: '210px', overflow: 'hidden', background: '#f8fafc' }}>
                    <img 
                      src={entry.image_url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80'} 
                      alt={entry.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />

                    {/* CATEGORY TAG */}
                    <span style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(15, 23, 42, 0.75)', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '20px', backdropFilter: 'blur(4px)' }}>
                      {entry.category || 'Tác phẩm'}
                    </span>

                    {/* VOTES COUNTER BADGE */}
                    <span style={{ position: 'absolute', bottom: '12px', right: '12px', background: '#be123c', color: 'white', fontSize: '12.5px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                      <Heart size={14} fill="white" /> {entry.votes_count || 0} Tim
                    </span>
                  </div>

                  {/* ENTRY CONTENT */}
                  <div style={{ padding: '16px 18px 10px 18px' }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16.5px', color: '#0f172a', fontWeight: 'bold', lineHeight: '1.4' }}>
                      {entry.title}
                    </h3>
                    <div style={{ fontSize: '13px', color: '#be123c', fontWeight: 'bold', marginBottom: '8px' }}>
                      👤 {entry.author_name}
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {entry.description || 'Không có mô tả chi tiết.'}
                    </p>
                  </div>
                </div>

                {/* ENTRY CARD ACTIONS */}
                <div style={{ padding: '12px 18px 18px 18px', display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => setDetailEntry(entry)}
                    style={{ flex: 1, padding: '9px', background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                  >
                    <Eye size={15} /> Chi Tiết
                  </button>
                  {myCurrentVote?.entry_id === entry.id ? (
                    <button 
                      onClick={handleCancelMyVote}
                      style={{ flex: 1.4, padding: '9px', background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fca5a5', borderRadius: '10px', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                      title="Bấm để Hủy lượt bình chọn này"
                    >
                      <Heart size={16} fill="#dc2626" /> ĐÃ THẢ TIM
                    </button>
                  ) : isVotingLocked ? (
                    <button 
                      disabled
                      style={{ flex: 1.4, padding: '9px', background: '#e2e8f0', color: '#64748b', border: 'none', borderRadius: '10px', fontSize: '12.5px', fontWeight: 'bold', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      🔒 ĐÃ KHÓA BÌNH CHỌN
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleVoteClick(entry)}
                      style={{ flex: 1.4, padding: '9px', background: 'linear-gradient(135deg, #be123c, #881337)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 3px 10px rgba(190, 18, 60, 0.3)' }}
                    >
                      <Heart size={16} fill="white" /> BÌNH CHỌN
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* MAIN TAB 2: LEADERBOARD WITH 3D PODIUM */}
      {activeTab === 'leaderboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* TOP 3 WINNERS PODIUM */}
          {sortedLeaderboard.length >= 3 && (
            <div style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)', borderRadius: '24px', padding: '30px 20px 20px 20px', color: 'white', textAlign: 'center', boxShadow: '0 15px 35px rgba(15, 23, 42, 0.3)' }}>
              <div style={{ fontSize: '13px', color: '#fde047', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
                ✨ VINH DANH TOP 3 TÁC PHẨM DẪN ĐẦU BÌNH CHỌN
              </div>
              <h2 style={{ margin: '0 0 25px 0', fontFamily: 'Playfair Display, serif', fontSize: '24px', color: '#ffffff' }}>
                👑 BỤC VINH DANH SÁNG TẠO 30 NĂM
              </h2>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '15px', maxWidth: '700px', margin: '0 auto' }}>
                
                {/* RANK 2 (SILVER - LEFT) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img src={sortedLeaderboard[1]?.image_url} alt="" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #94a3b8', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />
                  <div style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '6px', color: '#e2e8f0', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{sortedLeaderboard[1]?.title}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{sortedLeaderboard[1]?.author_name}</div>
                  <div style={{ background: 'linear-gradient(180deg, #64748b, #334155)', width: '100%', height: '90px', borderRadius: '12px 12px 0 0', marginTop: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '24px' }}>🥈</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'white' }}>HẠNG NHÌ</div>
                    <div style={{ fontSize: '12px', color: '#fef08a', fontWeight: 'bold' }}>❤️ {sortedLeaderboard[1]?.votes_count}</div>
                  </div>
                </div>

                {/* RANK 1 (GOLD - CENTER - HIGHEST) */}
                <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: '22px', marginBottom: '-6px' }}>👑</div>
                  <img src={sortedLeaderboard[0]?.image_url} alt="" style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #fde047', boxShadow: '0 0 20px rgba(253, 224, 71, 0.5)' }} />
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '6px', color: '#fde047', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{sortedLeaderboard[0]?.title}</div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1' }}>{sortedLeaderboard[0]?.author_name}</div>
                  <div style={{ background: 'linear-gradient(180deg, #b45309, #78350f)', width: '100%', height: '120px', borderRadius: '14px 14px 0 0', marginTop: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderTop: '3px solid #fde047' }}>
                    <div style={{ fontSize: '28px' }}>🥇</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fde047' }}>GIẢI NHẤT</div>
                    <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 'bold' }}>❤️ {sortedLeaderboard[0]?.votes_count} Tim</div>
                  </div>
                </div>

                {/* RANK 3 (BRONZE - RIGHT) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img src={sortedLeaderboard[2]?.image_url} alt="" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #fdba74', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />
                  <div style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '6px', color: '#e2e8f0', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{sortedLeaderboard[2]?.title}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{sortedLeaderboard[2]?.author_name}</div>
                  <div style={{ background: 'linear-gradient(180deg, #c2410c, #7c2d12)', width: '100%', height: '75px', borderRadius: '12px 12px 0 0', marginTop: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '22px' }}>🥉</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'white' }}>HẠNG BA</div>
                    <div style={{ fontSize: '12px', color: '#fef08a', fontWeight: 'bold' }}>❤️ {sortedLeaderboard[2]?.votes_count}</div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* FULL RANKINGS LIST */}
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={20} color="#b45309" /> BẢNG THỐNG KÊ XẾP HẠNG CHI TIẾT
            </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sortedLeaderboard.map((entry, rankIdx) => {
              let rankBadge = null;
              let bgStyle = '#ffffff';

              if (rankIdx === 0) {
                rankBadge = <span style={{ fontSize: '20px' }}>🥇</span>;
                bgStyle = 'linear-gradient(135deg, #fefce8 0%, #fff7ed 100%)';
              } else if (rankIdx === 1) {
                rankBadge = <span style={{ fontSize: '20px' }}>🥈</span>;
                bgStyle = '#f8fafc';
              } else if (rankIdx === 2) {
                rankBadge = <span style={{ fontSize: '20px' }}>🥉</span>;
                bgStyle = '#fff7ed';
              } else {
                rankBadge = <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#64748b', width: '24px', textAlign: 'center' }}>#{rankIdx + 1}</span>;
              }

              return (
                <div 
                  key={entry.id}
                  style={{
                    background: bgStyle,
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: rankIdx < 3 ? '2px solid #fde047' : '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    gap: '15px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {rankBadge}
                    <img src={entry.image_url} alt="" style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>{entry.title}</h4>
                      <div style={{ fontSize: '12.5px', color: '#be123c', fontWeight: 'bold', marginTop: '2px' }}>
                        👤 {entry.author_name} ({entry.category || 'Tác phẩm'})
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#be123c', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Heart size={18} fill="#be123c" /> {entry.votes_count || 0} Lượt Tim
                    </div>
                    <button 
                      onClick={() => handleVoteClick(entry)}
                      style={{ padding: '7px 14px', background: '#be123c', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Bình chọn
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )}

      {/* ANTI-FRAUD VOTING CONFIRMATION MODAL */}
      {votingEntry && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#be123c', fontWeight: 'bold', fontSize: '17px' }}>
                <Heart size={20} fill="#be123c" /> XÁC NHẬN BÌNH CHỌN
              </div>
              <button onClick={() => setVotingEntry(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
            </div>

            <div style={{ background: '#fff1f2', padding: '12px', borderRadius: '12px', border: '1px solid #fecdd3', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#9f1239' }}>Tác phẩm: {votingEntry.title}</div>
              <div style={{ fontSize: '12px', color: '#881337', marginTop: '2px' }}>Tác giả: {votingEntry.author_name}</div>
            </div>

            {/* ANTI FRAUD NOTICE */}
            <div style={{ background: '#f0fdf4', padding: '10px 14px', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '16px', fontSize: '12px', color: '#166534', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Bảo vệ tính công bằng:</strong> Mỗi học sinh/khách mời chỉ được sử dụng Mã số của mình để bình chọn 1 lần duy nhất trong toàn bộ cuộc thi.
              </div>
            </div>

            <form onSubmit={handleConfirmVote}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                  Họ và Tên Học Sinh / Khách Mời (*)
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="VD: Nguyễn Văn Anh"
                  value={voterName}
                  onChange={e => setVoterName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                  Tên Lớp / Niên Khóa (*)
                </label>
                <input 
                  type="text" 
                  required
                  list="class-suggestions"
                  placeholder="VD: Lớp 12A1 hoặc Khóa 2002-2005"
                  value={voterCode}
                  onChange={e => setVoterCode(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #be123c', fontSize: '14px', fontWeight: 'bold', color: '#be123c', boxSizing: 'border-box' }}
                />
                <datalist id="class-suggestions">
                  <option value="Lớp 12A1" />
                  <option value="Lớp 12A2" />
                  <option value="Lớp 12A3" />
                  <option value="Lớp 12A4" />
                  <option value="Lớp 12A5" />
                  <option value="Lớp 11A1" />
                  <option value="Lớp 11A2" />
                  <option value="Lớp 10A1" />
                  <option value="Khóa 2023-2026" />
                  <option value="Cựu Học Sinh" />
                </datalist>
                <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  * Mã thiết bị điện thoại/máy tính của bạn được tự động mã hóa phần cứng (Chống Ẩn Danh & Chống Spam).
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setVotingEntry(null)} style={{ flex: 1, padding: '10px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Hủy
                </button>
                <button type="submit" disabled={submittingVote} style={{ flex: 1.5, padding: '10px', background: '#be123c', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Heart size={16} fill="white" /> {submittingVote ? 'Đang xác minh...' : 'XÁC NHẬN GỬI TIM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOTE SUCCESS CONFETTI MODAL */}
      {voteSuccessModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '420px', width: '100%', padding: '28px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ width: '60px', height: '60px', background: '#dcfce7', color: '#15803d', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={36} />
            </div>
            <h2 style={{ margin: '0 0 8px 0', color: '#166534', fontSize: '20px' }}>BÌNH CHỌN THÀNH CÔNG!</h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
              Cảm ơn bạn đã đóng góp 1 tim bình chọn công bằng cho tác phẩm dự thi Kỷ Niệm 30 Năm THPT Cao Bá Quát!
            </p>
            <button onClick={() => setVoteSuccessModal(false)} style={{ padding: '10px 24px', background: '#166534', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
              Đóng & Xem Bảng Xếp Hạng
            </button>
          </div>
        </div>
      )}

      {/* ENTRY DETAIL LIGHTBOX MODAL */}
      {detailEntry && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, overflowY: 'auto', padding: '20px', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '850px', margin: '30px auto', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', position: 'relative' }}>
            <button onClick={() => setDetailEntry(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
              <X size={20} />
            </button>

            {/* INTERACTIVE 360 / 3D PRODUCT VIEWER */}
            <InteractiveProductViewer entry={detailEntry} />

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <span style={{ background: '#fff1f2', color: '#be123c', fontSize: '12px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '15px' }}>
                    {detailEntry.category || 'Tác phẩm dự thi'}
                  </span>
                  <h2 style={{ margin: '8px 0 4px 0', fontSize: '22px', color: '#0f172a' }}>{detailEntry.title}</h2>
                  <div style={{ fontSize: '14px', color: '#be123c', fontWeight: 'bold' }}>👤 Tác giả / Tập thể: {detailEntry.author_name}</div>
                </div>

                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#be123c', display: 'flex', alignItems: 'center', gap: '6px', background: '#fff1f2', padding: '8px 16px', borderRadius: '12px' }}>
                  <Heart size={20} fill="#be123c" /> {detailEntry.votes_count || 0} Tim
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#334155', fontSize: '15px' }}>📝 Bài Thuyết Minh & Ý Nghĩa Tác Phẩm:</h4>
                <p style={{ margin: 0, fontSize: '14.5px', color: '#475569', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                  {detailEntry.description || 'Không có mô tả chi tiết.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setDetailEntry(null)} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Đóng
                </button>
                <button onClick={() => { const e = detailEntry; setDetailEntry(null); handleVoteClick(e); }} style={{ padding: '10px 24px', background: '#be123c', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Heart size={18} fill="white" /> BÌNH CHỌN CHO TÁC PHẨM NÀY
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* AUTH REQUIRED POPUP MODAL */}
      {showAuthRequiredModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(6px)' }}>
          <div style={{ background: '#ffffff', borderRadius: '24px', maxWidth: '460px', width: '100%', padding: '30px 24px', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', position: 'relative' }}>
            <button onClick={() => setShowAuthRequiredModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              <X size={20} />
            </button>

            <div style={{ width: '64px', height: '64px', background: '#fff1f2', color: '#be123c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <KeyRound size={32} />
            </div>

            <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '20px', fontFamily: 'Playfair Display, Georgia, serif' }}>
              🔒 YÊU CẦU ĐĂNG NHẬP
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
              Để bảo đảm tính công bằng 100%, bạn vui lòng Đăng Nhập hoặc Đăng Ký Tài Khoản trước khi thả tim bình chọn cho sản phẩm!
            </p>

            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
              <Link 
                to="/dang-nhap"
                style={{ padding: '11px', background: 'linear-gradient(135deg, #be123c, #881337)', color: 'white', borderRadius: '10px', fontWeight: 'bold', fontSize: '14.5px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                🔐 ĐĂNG NHẬP NGAY
              </Link>
              <Link 
                to="/dang-ky"
                style={{ padding: '11px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 'bold', fontSize: '14.5px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                👤 ĐĂNG KÝ TÀI KHOẢN MỚI
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
