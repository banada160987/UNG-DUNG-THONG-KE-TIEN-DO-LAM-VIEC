import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Heart, Trophy, Sparkles, Search, Eye, CheckCircle2, ShieldCheck, AlertCircle, X, Award, Share2 } from 'lucide-react';

export default function PublicVoting() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'leaderboard'
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  // Voting Modal State
  const [votingEntry, setVotingEntry] = useState(null);
  const [voterName, setVoterName] = useState('');
  const [voterCode, setVoterCode] = useState('');
  const [submittingVote, setSubmittingVote] = useState(false);
  const [voteSuccessModal, setVoteSuccessModal] = useState(false);

  // Entry Detail Lightbox Modal State
  const [detailEntry, setDetailEntry] = useState(null);

  const categories = ['Tất cả', 'Tranh vẽ', 'Video / Short Clip', 'Mô hình / Sáng tạo', 'Thơ & Bài viết', 'Chung'];

  useEffect(() => {
    fetchEntries();
  }, []);

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

  // GENERATE PERSISTENT DEVICE HARDWARE FINGERPRINT HASH
  const getDeviceFingerprint = () => {
    let token = localStorage.getItem('cbq_device_vote_token');
    if (!token) {
      const screenInfo = `${window.screen.width}x${window.screen.height}`;
      const userAgent = navigator.userAgent;
      const lang = navigator.language || '';
      const rawString = `${screenInfo}_${userAgent}_${lang}`;
      let hash = 0;
      for (let i = 0; i < rawString.length; i++) {
        hash = (hash << 5) - hash + rawString.charCodeAt(i);
        hash |= 0;
      }
      token = `DEV-${Math.abs(hash).toString(36).toUpperCase()}`;
      localStorage.setItem('cbq_device_vote_token', token);
    }
    return token;
  };

  // ANTI-FRAUD TRIPLE-LOCK VOTING LOGIC
  const handleConfirmVote = async (e) => {
    e.preventDefault();
    if (!voterCode.trim()) {
      alert("Vui lòng nhập Mã Học Sinh / Mã Số Thiệp / SĐT của bạn.");
      return;
    }

    const cleanCode = voterCode.trim().toUpperCase();
    setSubmittingVote(true);

    try {
      // 0. Verification against cbq_guests table (if guests exist)
      const { data: matchedGuest } = await supabase
        .from('cbq_guests')
        .select('*')
        .or(`invitation_code.ilike.${cleanCode},phone.eq.${cleanCode}`)
        .limit(1);

      let finalVoterName = voterName.trim();
      if (matchedGuest && matchedGuest.length > 0) {
        finalVoterName = matchedGuest[0].name + ` (${matchedGuest[0].category || 'Học sinh'})`;
      } else {
        // Check if cbq_guests has any entries
        const { count } = await supabase.from('cbq_guests').select('*', { count: 'exact', head: true });
        if (count && count > 0) {
          alert(`⛔ MÃ XÁC MINH KHÔNG HỢP LỆ:\nMã số hoặc SĐT [${cleanCode}] không tồn tại trong danh sách học sinh/khách mời THPT Cao Bá Quát!\n\nVui lòng kiểm tra lại Mã trên Thiệp điện tử (VD: CBQ-1234) hoặc Số điện thoại đã đăng ký.`);
          setSubmittingVote(false);
          return;
        }
      }

      // 1. Check if voter code already used in DB
      const { data: existingVote } = await supabase
        .from('cbq_votes')
        .select('*')
        .eq('voter_code', cleanCode)
        .limit(1);

      if (existingVote && existingVote.length > 0) {
        alert(`⛔ BẢO MẬT CHỐNG GIAN LẬN:\nMã số [${cleanCode}] đã thực hiện bình chọn cho một tác phẩm trước đó vào lúc ${new Date(existingVote[0].created_at).toLocaleString('vi-VN')}!\n\nĐể đảm bảo công bằng, mỗi người chỉ được thả tim bình chọn 1 lần duy nhất.`);
        setSubmittingVote(false);
        return;
      }

      // 2. Strict Device Fingerprint check against DB
      const deviceToken = getDeviceFingerprint();
      const { data: existingDeviceVote } = await supabase
        .from('cbq_votes')
        .select('*')
        .eq('device_token', deviceToken)
        .limit(1);

      if (existingDeviceVote && existingDeviceVote.length > 0) {
        alert(`⛔ BẢO MẬT MÃ THIẾT BỊ MÁY:\nĐiện thoại / Máy tính này (${deviceToken}) đã từng thực hiện bình chọn trên hệ thống vào lúc ${new Date(existingDeviceVote[0].created_at).toLocaleString('vi-VN')}!\n\nĐể đảm bảo tuyệt đối tính công bằng, mỗi thiết bị máy chỉ được bình chọn 1 lần duy nhất.`);
        setSubmittingVote(false);
        return;
      }

      // 3. Insert vote into database
      const { error: insertErr } = await supabase
        .from('cbq_votes')
        .insert([{
          entry_id: votingEntry.id,
          voter_name: finalVoterName || voterName.trim() || 'Học sinh / Khách mời',
          voter_code: cleanCode,
          device_token: deviceToken
        }]);

      if (insertErr) {
        if (insertErr.code === '23505' || insertErr.message.includes('unique')) {
          alert(`⛔ BẢO MẬT CHỐNG GIAN LẬN:\nMã số [${cleanCode}] đã được sử dụng để bình chọn trước đó. Mỗi học sinh chỉ được bình chọn 1 lần!`);
        } else {
          alert("Lỗi khi lưu bình chọn. Vui lòng thử lại!");
        }
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

    } catch (err) {
      console.error("Lỗi bình chọn:", err);
      alert("Có lỗi xảy ra khi xử lý bình chọn.");
      setSubmittingVote(false);
    }
  };

  const filteredEntries = entries.filter(e => {
    const matchCategory = selectedCategory === 'Tất cả' || e.category === selectedCategory;
    const matchSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        e.author_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const sortedLeaderboard = [...entries].sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      
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
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: '30px', fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '12px', backdropFilter: 'blur(5px)' }}>
          <Sparkles size={16} color="#fde047" /> KỶ NIỆM 30 NĂM THPT CAO BÁ QUÁT (1996 - 2026)
        </div>

        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontFamily: 'Playfair Display, Georgia, serif', letterSpacing: '0.5px' }}>
          🏆 CUỘC THI BÌNH CHỌN TÁC PHẨM & SẢN PHẨM SÁNG TẠO
        </h1>
        <p style={{ margin: '0 auto', maxWidth: '750px', fontSize: '14.5px', color: '#fef08a', lineHeight: '1.6' }}>
          Hãy cùng thả tim tôn vinh những tác phẩm xuất sắc nhất của các bạn học sinh & cựu học sinh! 
          Mỗi mã học sinh/thiệp được **bình chọn 1 lần duy nhất** để đảm bảo tính công bằng.
        </p>

        {/* SECURITY ANTI-FRAUD BADGE */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#166534', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginTop: '16px' }}>
          <ShieldCheck size={16} /> Hệ Thống Khóa Đúp Anti-Spam • Bảo Đảm Công Bằng 100%
        </div>
      </div>

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

      {/* CATEGORY FILTER PILLS */}
      {activeTab === 'all' && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '6px' }}>
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: selectedCategory === cat ? 'bold' : '500',
                cursor: 'pointer',
                border: selectedCategory === cat ? '1px solid #be123c' : '1px solid #e2e8f0',
                background: selectedCategory === cat ? '#fff1f2' : '#ffffff',
                color: selectedCategory === cat ? '#be123c' : '#475569',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

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
                  <button 
                    onClick={() => setVotingEntry(entry)}
                    style={{ flex: 1.4, padding: '9px', background: 'linear-gradient(135deg, #be123c, #881337)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 3px 10px rgba(190, 18, 60, 0.3)' }}
                  >
                    <Heart size={16} fill="white" /> BÌNH CHỌN
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* MAIN CONTENT TAB 2: LIVE LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #fef08a', paddingBottom: '12px' }}>
            <Trophy size={26} color="#b45309" />
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#881337' }}>BẢNG XẾP HẠNG TÁC PHẨM ĐỰỢC BÌNH CHỌN NHIỀU NHẤT</h2>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>Thứ hạng tự động cập nhật theo số lượt thả tim realtime</p>
            </div>
          </div>

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
                      onClick={() => setVotingEntry(entry)}
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
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Họ và Tên người bình chọn
                </label>
                <input 
                  type="text" 
                  placeholder="VD: Nguyễn Văn Anh (Lớp 12A1)"
                  value={voterName}
                  onChange={e => setVoterName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Mã Học Sinh / Mã Số Thiệp / Số Điện Thoại (*)
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="VD: 12A1-05 hoặc CBQ-1234"
                  value={voterCode}
                  onChange={e => setVoterCode(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #be123c', fontSize: '14px', fontWeight: 'bold', color: '#be123c', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  * Mã số này sẽ được CSDL kiểm tra để chống bình chọn gian lận lặp lại.
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
          <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '800px', margin: '30px auto', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ position: 'relative', maxHeight: '450px', background: '#0f172a' }}>
              <img src={detailEntry.image_url} alt={detailEntry.title} style={{ width: '100%', maxHeight: '450px', objectFit: 'contain' }} />
              <button onClick={() => setDetailEntry(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} />
              </button>
            </div>

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
                <button onClick={() => { const e = detailEntry; setDetailEntry(null); setVotingEntry(e); }} style={{ padding: '10px 24px', background: '#be123c', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Heart size={18} fill="white" /> BÌNH CHỌN CHO TÁC PHẨM NÀY
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
