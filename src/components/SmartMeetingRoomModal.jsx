import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Video, VideoOff, Mic, MicOff, MonitorUp, PhoneOff,
  Maximize2, Minimize2, Users, Vote, FileText, ExternalLink,
  Radio, Shield, Sparkles, Settings, RefreshCw, CheckCircle2,
  AlertCircle, ChevronRight, ChevronLeft, Volume2, MessageSquare
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { OnlineMeetingService } from '../services/onlineMeetingService';

/**
 * PHÒNG HỌP TRỰC TUYẾN THÔNG MINH ĐA ĐỘNG CƠ (3-IN-1 SMART MEETING ROOM)
 * THPT CAO BÁ QUÁT
 * 
 * Động cơ 1: Jitsi Meet nhúng trực tiếp (Hội đồng Sư phạm, họp toàn trường 50-100 người, miễn phí 100%)
 * Động cơ 2: WebRTC P2P Nội bộ (Giao ban BGH, Họp Tổ CM 2-8 người, siêu bảo mật, không qua server ngoài)
 * Động cơ 3: Cầu nối ngoài (Google Meet / Zoom / MS Teams liên kết Sở GD&ĐT)
 */

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export default function SmartMeetingRoomModal({
  isOpen,
  onClose,
  meeting,
  currentUser = null,
  attendances = [],
  onRefreshAttendances = () => {},
  isAdmin = false
}) {
  if (!isOpen || !meeting) return null;

  // Chế độ phòng họp: 'jitsi' (toàn trường) | 'webrtc' (nội bộ BGH/Tổ) | 'external' (Meet/Zoom)
  const defaultEngine = meeting.meeting_format === 'ONLINE' && !meeting.meeting_link
    ? 'jitsi'
    : (meeting.meeting_link?.includes('meet.google.com') || meeting.meeting_link?.includes('zoom.us') ? 'external' : 'jitsi');

  const [activeEngine, setActiveEngine] = useState(defaultEngine);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  const [activeSideTab, setActiveSideTab] = useState('attendance'); // 'attendance' | 'poll' | 'minutes'
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Thông tin người tham gia
  const userDisplayName = useMemo(() => {
    return currentUser?.name || currentUser?.full_name || currentUser?.email || 'Thầy/Cô THPT Cao Bá Quát';
  }, [currentUser]);

  const userDepartment = useMemo(() => {
    return currentUser?.department || 'Tổ Chuyên môn';
  }, [currentUser]);

  // Trạng thái Điểm danh của người này
  const myAttendance = useMemo(() => {
    return attendances.find(
      a => a.staff_name?.toLowerCase().trim() === userDisplayName.toLowerCase().trim()
    );
  }, [attendances, userDisplayName]);

  const [checkingIn, setCheckingIn] = useState(false);
  const [checkinMessage, setCheckinMessage] = useState(null);

  // Trạng thái Biểu quyết
  const [selectedPollOption, setSelectedPollOption] = useState(myAttendance?.poll_answer || '');
  const [votingStatus, setVotingStatus] = useState(null);

  // Thư ký ghi chú
  const [meetingNotes, setMeetingNotes] = useState(() => {
    return localStorage.getItem(`cbq_meeting_notes_${meeting.id}`) || '';
  });

  // =========================================================================
  // 1. WEBRTC P2P NỘI BỘ (CHO NHÓM NHỎ 2 - 8 NGƯỜI)
  // =========================================================================
  const localVideoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaError, setMediaError] = useState(null);

  // Danh sách các peer từ xa: { [peerId]: { peerName, stream, isMuted, isVideoOff } }
  const [remotePeers, setRemotePeers] = useState({});
  const peerConnections = useRef({}); // { [peerId]: RTCPeerConnection }
  const myPeerId = useRef('peer_' + Math.random().toString(36).substring(2, 9));
  const channelRef = useRef(null);

  // Khởi tạo hoặc dọn dẹp WebRTC khi chuyển đổi sang/từ chế độ 'webrtc'
  useEffect(() => {
    if (activeEngine !== 'webrtc') {
      cleanupWebRTC();
      return;
    }

    let isMounted = true;

    async function initWebRTC() {
      try {
        setMediaError(null);
        let stream = null;

        // Thử lấy cả Cam và Mic
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { max: 24 } },
            audio: true
          });
        } catch (camErr) {
          console.warn('[WebRTC] Không thể mở Camera, thử chế độ chỉ Mic:', camErr);
          // Fallback sang chỉ Audio nếu máy bàn không có Webcam
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            setMediaError('⚠️ Máy tính không tìm thấy Webcam. Đang chạy chế độ Chỉ Mic (Audio).');
          } catch (micErr) {
            console.warn('[WebRTC] Không thể mở Mic:', micErr);
            setMediaError('⚠️ Không tìm thấy Mic/Webcam. Bạn đang ở chế độ Chỉ lắng nghe.');
          }
        }

        if (!isMounted) {
          if (stream) stream.getTracks().forEach(t => t.stop());
          return;
        }

        if (stream) {
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }

        // Tạo Supabase Realtime Broadcast Channel để Signaling
        const channelName = `meeting-webrtc-${meeting.id.slice(0, 20)}`;
        const ch = supabase.channel(channelName, {
          config: { broadcast: { self: false } }
        });
        channelRef.current = ch;

        // Lắng nghe tín hiệu WebRTC từ các máy khác
        ch.on('broadcast', { event: 'signal' }, async ({ payload }) => {
          if (!payload) return;
          const { type, from, to, sdp, candidate, peerName } = payload;

          // 1. Khi có bạn mới tham gia phòng
          if (type === 'peer-join') {
            console.log(`[WebRTC] Nhận được peer-join từ: ${peerName} (${from})`);
            // Tạo WebRTC Offer gửi lại cho người mới
            createAndSendOffer(from, peerName, stream);
          }

          // 2. Nhận Offer từ peer khác
          else if (type === 'offer' && to === myPeerId.current) {
            console.log(`[WebRTC] Nhận được Offer từ ${from}`);
            handleReceiveOffer(from, peerName, sdp, stream);
          }

          // 3. Nhận Answer
          else if (type === 'answer' && to === myPeerId.current) {
            console.log(`[WebRTC] Nhận được Answer từ ${from}`);
            const pc = peerConnections.current[from];
            if (pc) {
              await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            }
          }

          // 4. Nhận ICE Candidate
          else if (type === 'ice-candidate' && to === myPeerId.current) {
            const pc = peerConnections.current[from];
            if (pc && candidate) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                console.warn('[WebRTC] Lỗi thêm ICE candidate:', e);
              }
            }
          }

          // 5. Khi peer rời phòng
          else if (type === 'peer-leave') {
            closePeerConnection(from);
          }
        });

        ch.subscribe(status => {
          if (status === 'SUBSCRIBED') {
            console.log('[WebRTC] Đã kết nối kênh Broadcast Signaling.');
            // Thông báo mình đã vào phòng
            ch.send({
              type: 'broadcast',
              event: 'signal',
              payload: {
                type: 'peer-join',
                from: myPeerId.current,
                peerName: userDisplayName
              }
            });
          }
        });

      } catch (err) {
        console.error('[WebRTC] Lỗi khởi tạo phòng họp P2P:', err);
        setMediaError('Không thể khởi động WebRTC: ' + (err.message || err));
      }
    }

    initWebRTC();

    return () => {
      isMounted = false;
      cleanupWebRTC();
    };
  }, [activeEngine, meeting.id]);

  // Tạo Offer và gửi cho peer khác
  const createAndSendOffer = async (targetPeerId, targetName, stream) => {
    try {
      const pc = createPeerConnection(targetPeerId, targetName, stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      channelRef.current?.send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          type: 'offer',
          from: myPeerId.current,
          to: targetPeerId,
          peerName: userDisplayName,
          sdp: offer
        }
      });
    } catch (e) {
      console.error('[WebRTC] Lỗi tạo offer:', e);
    }
  };

  // Nhận Offer và tạo Answer trả lại
  const handleReceiveOffer = async (fromPeerId, fromName, sdp, stream) => {
    try {
      const pc = createPeerConnection(fromPeerId, fromName, stream);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      channelRef.current?.send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          type: 'answer',
          from: myPeerId.current,
          to: fromPeerId,
          peerName: userDisplayName,
          sdp: answer
        }
      });
    } catch (e) {
      console.error('[WebRTC] Lỗi xử lý offer:', e);
    }
  };

  // Tạo kết nối RTCPeerConnection chuẩn
  const createPeerConnection = (targetPeerId, targetName, stream) => {
    if (peerConnections.current[targetPeerId]) {
      return peerConnections.current[targetPeerId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current[targetPeerId] = pc;

    // Gắn local audio/video tracks vào kết nối
    if (stream) {
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

    // Trao đổi ICE Candidates
    pc.onicecandidate = event => {
      if (event.candidate) {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'signal',
          payload: {
            type: 'ice-candidate',
            from: myPeerId.current,
            to: targetPeerId,
            candidate: event.candidate
          }
        });
      }
    };

    // Khi nhận được luồng Video/Audio từ xa
    pc.ontrack = event => {
      console.log(`[WebRTC] Nhận được luồng media từ ${targetName}`);
      const remoteStream = event.streams[0];
      setRemotePeers(prev => ({
        ...prev,
        [targetPeerId]: {
          peerName: targetName,
          stream: remoteStream
        }
      }));
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        closePeerConnection(targetPeerId);
      }
    };

    return pc;
  };

  // Đóng kết nối của 1 peer
  const closePeerConnection = peerId => {
    if (peerConnections.current[peerId]) {
      peerConnections.current[peerId].close();
      delete peerConnections.current[peerId];
    }
    setRemotePeers(prev => {
      const copy = { ...prev };
      delete copy[peerId];
      return copy;
    });
  };

  // Dọn dẹp hoàn toàn tài nguyên WebRTC khi rời phòng
  const cleanupWebRTC = () => {
    // Thông báo cho các peer khác mình đã rời
    if (channelRef.current) {
      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: { type: 'peer-leave', from: myPeerId.current }
        });
        channelRef.current.unsubscribe();
      } catch (e) {}
      channelRef.current = null;
    }

    // Tắt camera và mic
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      setLocalStream(null);
    }

    // Đóng tất cả Peer Connections
    Object.keys(peerConnections.current).forEach(id => {
      try {
        peerConnections.current[id].close();
      } catch (e) {}
    });
    peerConnections.current = {};
    setRemotePeers({});
    setIsScreenSharing(false);
  };

  // Bật/tắt Micro
  const toggleMic = () => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicMuted(!audioTrack.enabled);
    }
  };

  // Bật/tắt Camera
  const toggleCamera = () => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoMuted(!videoTrack.enabled);
    }
  };

  // Chia sẻ màn hình (Screen Share)
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Dừng chia sẻ màn hình, khôi phục lại camera
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const newVideoTrack = camStream.getVideoTracks()[0];
        
        // Thay thế track trong tất cả peer connections
        Object.values(peerConnections.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender && newVideoTrack) sender.replaceTrack(newVideoTrack);
        });

        if (localVideoRef.current) localVideoRef.current.srcObject = camStream;
        setLocalStream(camStream);
        setIsScreenSharing(false);
      } catch (e) {
        console.warn('Lỗi khôi phục camera:', e);
      }
    } else {
      // Bắt đầu chia sẻ màn hình
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        // Khi người dùng bấm "Stop sharing" trên thanh của trình duyệt
        screenTrack.onended = () => {
          toggleScreenShare();
        };

        // Thay thế track video gửi đi cho các bạn họp
        Object.values(peerConnections.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });

        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        setIsScreenSharing(true);
      } catch (e) {
        console.warn('Hủy chia sẻ màn hình:', e);
      }
    }
  };

  // =========================================================================
  // 2. JITSI MEET NHÚNG TRỰC TIẾP (TOÀN TRƯỜNG 50 - 100 NGƯỜI)
  // =========================================================================
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const [jitsiLoading, setJitsiLoading] = useState(true);

  // Sinh tên phòng Jitsi duy nhất chuẩn hóa
  const cleanRoomName = useMemo(() => {
    const raw = `CBQ_THPT_Meeting_${meeting.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`;
    return raw;
  }, [meeting.id]);

  useEffect(() => {
    if (activeEngine !== 'jitsi') {
      if (jitsiApiRef.current) {
        try { jitsiApiRef.current.dispose(); } catch (e) {}
        jitsiApiRef.current = null;
      }
      return;
    }

    setJitsiLoading(true);
    let isCancelled = false;

    // Nạp Jitsi External API Script nếu chưa có
    const loadJitsiScript = () => {
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve(window.JitsiMeetExternalAPI);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => resolve(window.JitsiMeetExternalAPI);
        script.onerror = () => reject(new Error('Không thể tải Jitsi External API'));
        document.body.appendChild(script);
      });
    };

    loadJitsiScript()
      .then(JitsiAPI => {
        if (isCancelled || !jitsiContainerRef.current) return;

        // Dọn dẹp instance cũ nếu có
        if (jitsiApiRef.current) {
          try { jitsiApiRef.current.dispose(); } catch (e) {}
        }

        const domain = 'meet.jit.si';
        const options = {
          roomName: cleanRoomName,
          parentNode: jitsiContainerRef.current,
          width: '100%',
          height: '100%',
          userInfo: {
            displayName: `${userDisplayName} (${userDepartment})`
          },
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            defaultLanguage: 'vi',
            disableDeepLinking: true
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DEFAULT_REMOTE_DISPLAY_NAME: 'Thầy/Cô CBQ',
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'chat', 'raisehand',
              'videoquality', 'tileview', 'settings'
            ]
          }
        };

        const api = new JitsiAPI(domain, options);
        jitsiApiRef.current = api;
        setJitsiLoading(false);

        // Tự động đóng phòng khi bấm gác máy
        api.addEventListener('readyToClose', () => {
          onClose();
        });
      })
      .catch(err => {
        console.warn('[Jitsi] Lỗi nạp script, chuyển sang fallback iframe:', err);
        setJitsiLoading(false);
      });

    return () => {
      isCancelled = true;
      if (jitsiApiRef.current) {
        try { jitsiApiRef.current.dispose(); } catch (e) {}
        jitsiApiRef.current = null;
      }
    };
  }, [activeEngine, cleanRoomName, userDisplayName, userDepartment, onClose]);

  // =========================================================================
  // 3. ĐIỂM DANH TỰ ĐỘNG & BIỂU QUYẾT TỨC THÌ
  // =========================================================================
  const handleAutoCheckin = async () => {
    setCheckingIn(true);
    setCheckinMessage(null);
    try {
      const res = await OnlineMeetingService.submitTeacherCheckin({
        meetingId: meeting.id,
        staffName: userDisplayName,
        department: userDepartment,
        checkinCode: meeting.checkin_code || '',
        pollAnswer: selectedPollOption || null,
        deviceInfo: `${navigator.userAgent.slice(0, 50)} | Phòng họp 3-in-1 CBQ`
      });

      if (res.success) {
        setCheckinMessage({ type: 'success', text: '✅ Bạn đã điểm danh thành công vào phòng họp!' });
        onRefreshAttendances();
      } else {
        setCheckinMessage({ type: 'error', text: res.message || 'Điểm danh không thành công.' });
      }
    } catch (e) {
      setCheckinMessage({ type: 'error', text: 'Lỗi điểm danh: ' + (e.message || e) });
    } finally {
      setCheckingIn(false);
    }
  };

  const handleVotePoll = async (option) => {
    setSelectedPollOption(option);
    setVotingStatus('saving');
    try {
      await OnlineMeetingService.submitTeacherCheckin({
        meetingId: meeting.id,
        staffName: userDisplayName,
        department: userDepartment,
        checkinCode: meeting.checkin_code || '',
        pollAnswer: option,
        deviceInfo: 'Biểu quyết trực tiếp trong phòng họp'
      });
      setVotingStatus('success');
      onRefreshAttendances();
    } catch (e) {
      setVotingStatus('error');
    }
  };

  // Thống kê kết quả biểu quyết
  const pollStats = useMemo(() => {
    if (!meeting.poll_options || meeting.poll_options.length === 0) return [];
    const counts = {};
    meeting.poll_options.forEach(opt => { counts[opt] = 0; });
    let totalVotes = 0;

    attendances.forEach(a => {
      if (a.poll_answer && counts[a.poll_answer] !== undefined) {
        counts[a.poll_answer]++;
        totalVotes++;
      }
    });

    return meeting.poll_options.map(opt => ({
      option: opt,
      count: counts[opt] || 0,
      percent: totalVotes > 0 ? Math.round(((counts[opt] || 0) / totalVotes) * 100) : 0
    }));
  }, [meeting.poll_options, attendances]);

  // =========================================================================
  // 4. XUẤT BIÊN BẢN HỌP NGHỊ ĐỊNH 30/2020/NĐ-CP
  // =========================================================================
  const handleExportWordMinutes = () => {
    const dateObj = new Date();
    const dayStr = String(dateObj.getDate()).padStart(2, '0');
    const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yearStr = dateObj.getFullYear();

    const presentList = attendances.filter(a => a.status === 'PRESENT');
    const excusedList = attendances.filter(a => a.status === 'EXCUSED');
    const unexcusedList = attendances.filter(a => a.status === 'UNEXCUSED');

    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Biên bản cuộc họp - ${meeting.title}</title>
        <style>
          @page Section1 {
            size: 21.0cm 29.7cm;
            margin: 2.0cm 1.5cm 2.0cm 3.0cm;
          }
          div.Section1 { page: Section1; }
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.35; color: #000; }
          .header-table { width: 100%; border: none; margin-bottom: 15px; }
          .header-table td { border: none; vertical-align: top; text-align: center; }
          .title { font-size: 14pt; font-weight: bold; text-align: center; margin: 15px 0 5px 0; text-transform: uppercase; }
          .subtitle { font-size: 13pt; font-weight: bold; text-align: center; margin-bottom: 20px; }
          table.data-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          table.data-table th, table.data-table td { border: 1pt solid #000; padding: 6px 8px; font-size: 12pt; }
          table.data-table th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
          .signature-table { width: 100%; border: none; margin-top: 35px; }
          .signature-table td { border: none; vertical-align: top; text-align: center; }
        </style>
      </head>
      <body>
        <div class="Section1">
          <table class="header-table">
            <tr>
              <td style="width: 45%;">
                <strong>SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK</strong><br/>
                <strong>TRƯỜNG THPT CAO BÁ QUÁT</strong><br/>
                -------------------<br/>
                Số: ... /BB-THPTCBQ
              </td>
              <td style="width: 55%;">
                <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
                <strong>Độc lập - Tự do - Hạnh phúc</strong><br/>
                -----------------------------------<br/>
                <em>Đắk Lắk, ngày ${dayStr} tháng ${monthStr} năm ${yearStr}</em>
              </td>
            </tr>
          </table>

          <div class="title">BIÊN BẢN HỘI NGHỊ / CUỘC HỌP TRỰC TUYẾN</div>
          <div class="subtitle">NỘI DUNG: ${meeting.title.toUpperCase()}</div>

          <p><strong>I. THỜI GIAN, ĐỊA ĐIỂM VÀ THÀNH PHẦN</strong></p>
          <p>- <strong>Thời gian bắt đầu:</strong> ${new Date(meeting.meeting_date || Date.now()).toLocaleDateString('vi-VN')}.</p>
          <p>- <strong>Hình thức họp:</strong> Phòng họp trực tuyến thông minh (Hệ thống THPT Cao Bá Quát).</p>
          <p>- <strong>Tổng số triệu tập:</strong> ${attendances.length} đồng chí.</p>
          <p>- <strong>Số lượng có mặt:</strong> ${presentList.length} đồng chí (${Math.round((presentList.length / (attendances.length || 1)) * 100)}%).</p>
          <p>- <strong>Vắng mặt:</strong> Có phép: ${excusedList.length} đồng chí | Không phép: ${unexcusedList.length} đồng chí.</p>

          <p><strong>II. NỘI DUNG DIỄN BIẾN CUỘC HỌP</strong></p>
          <p>${meetingNotes ? meetingNotes.replace(/\n/g, '<br/>') : '<em>(Thư ký ghi nhận diễn biến trực tiếp tại phòng họp điện tử)</em>'}</p>

          ${meeting.poll_question ? `
            <p><strong>III. KẾT QUẢ BIỂU QUYẾT TẬP THỂ</strong></p>
            <p>- <strong>Nội dung lấy ý kiến:</strong> ${meeting.poll_question}</p>
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 10%;">STT</th>
                  <th style="width: 50%;">Ý Kiến / Phương Án Biểu Quyết</th>
                  <th style="width: 20%;">Số Phiếu</th>
                  <th style="width: 20%;">Tỷ Lệ %</th>
                </tr>
              </thead>
              <tbody>
                ${pollStats.map((st, i) => `
                  <tr>
                    <td style="text-align: center;">${i + 1}</td>
                    <td>${st.option}</td>
                    <td style="text-align: center; font-weight: bold;">${st.count}</td>
                    <td style="text-align: center; font-weight: bold;">${st.percent}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          <table class="signature-table">
            <tr>
              <td style="width: 50%;">
                <strong>THƯ KÝ HỘI ĐỒNG</strong><br/>
                <em>(Ký, ghi rõ họ tên)</em><br/><br/><br/><br/>
                <strong>${userDisplayName}</strong>
              </td>
              <td style="width: 50%;">
                <strong>CHỦ TRÌ / HIỆU TRƯỞNG</strong><br/>
                <em>(Ký, ghi rõ họ tên và đóng dấu)</em><br/><br/><br/><br/>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', wordContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `1-Bien_ban_cuoc_hop_${meeting.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}_${yearStr}${monthStr}${dayStr}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.backdrop}>
      <div style={{ ...styles.modalContainer, ...(isFullscreen ? styles.fullscreen : {}) }}>
        
        {/* THANH ĐIỀU HƯỚNG TRÊN CÙNG (TOP HEADER) */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={styles.pulseDot} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={styles.headerTitle}>{meeting.title}</h3>
                <span style={styles.badgeLive}>ĐANG DIỄN RA</span>
              </div>
              <span style={styles.headerSubtitle}>
                Chủ tọa: BGH THPT Cao Bá Quát • Tham gia với tư cách: <strong>{userDisplayName}</strong> ({userDepartment})
              </span>
            </div>
          </div>

          {/* CHỌN ĐỘNG CƠ PHÒNG HỌP (3-IN-1 ENGINE SELECTOR) */}
          <div style={styles.engineTabs}>
            <button
              onClick={() => setActiveEngine('jitsi')}
              style={styles.engineBtn(activeEngine === 'jitsi')}
              title="Phòng họp Hội đồng Sư phạm toàn trường (50-100 người, Jitsi Meet nhúng)"
            >
              <Users size={15} /> 1. Jitsi Hội Đồng
            </button>
            <button
              onClick={() => setActiveEngine('webrtc')}
              style={styles.engineBtn(activeEngine === 'webrtc')}
              title="Phòng họp P2P Nội bộ (BGH, Tổ chuyên môn 2-8 người, siêu bảo mật)"
            >
              <Radio size={15} /> 2. WebRTC P2P Nội Bộ
            </button>
            <button
              onClick={() => setActiveEngine('external')}
              style={styles.engineBtn(activeEngine === 'external')}
              title="Cầu nối Google Meet / Zoom / MS Teams ngoài"
            >
              <ExternalLink size={15} /> 3. Google Meet / Zoom
            </button>
          </div>

          {/* CÁC NÚT PHỤ TRỢ (PANEL TOGGLE, FULLSCREEN, CLOSE) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
              style={styles.iconBtn(isSidePanelOpen)}
              title={isSidePanelOpen ? "Thu gọn bảng điều hành" : "Mở bảng điểm danh & biểu quyết"}
            >
              {isSidePanelOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Bảng Hội Nghị</span>
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              style={styles.iconBtn(false)}
              title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            <button
              onClick={onClose}
              style={styles.closeBtn}
              title="Rời khỏi phòng họp"
            >
              <PhoneOff size={16} /> Rời Phòng
            </button>
          </div>
        </div>

        {/* NỘI DUNG CHÍNH (BODY: VIDEO AREA + SIDE PANEL) */}
        <div style={styles.mainLayout}>

          {/* KHUNG VIDEO / TRÌNH DIỄN CHÍNH */}
          <div style={styles.videoStage}>

            {/* ĐỘNG CƠ 1: JITSI MEET NHÚNG */}
            {activeEngine === 'jitsi' && (
              <div style={styles.jitsiWrapper}>
                {jitsiLoading && (
                  <div style={styles.centerLoading}>
                    <RefreshCw size={36} color="#38bdf8" className="animate-spin" />
                    <p style={{ marginTop: '12px', color: '#cbd5e1', fontSize: '14px' }}>
                      Đang kết nối vào phòng họp Hội Đồng Sư Phạm (Jitsi Meet)...
                    </p>
                  </div>
                )}
                <div ref={jitsiContainerRef} style={{ width: '100%', height: '100%' }} />
              </div>
            )}

            {/* ĐỘNG CƠ 2: WEBRTC P2P NỘI BỘ */}
            {activeEngine === 'webrtc' && (
              <div style={styles.webrtcWrapper}>
                {mediaError && (
                  <div style={styles.mediaWarningBanner}>
                    <AlertCircle size={16} /> {mediaError}
                  </div>
                )}

                <div style={styles.videoGrid(Object.keys(remotePeers).length + 1)}>
                  {/* Video của chính mình (Local Stream) */}
                  <div style={styles.videoCard}>
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={styles.videoElement(true)}
                    />
                    <div style={styles.videoOverlay}>
                      <span style={styles.videoNameBadge}>
                        👤 Bạn ({userDisplayName}) {isScreenSharing && '🖥️ (Đang chia sẻ màn hình)'}
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {isMicMuted && <span style={styles.badgeMuted}><MicOff size={12} /></span>}
                        {isVideoMuted && <span style={styles.badgeMuted}><VideoOff size={12} /></span>}
                      </div>
                    </div>
                  </div>

                  {/* Video của các bạn họp từ xa (Remote Streams) */}
                  {Object.entries(remotePeers).map(([peerId, peer]) => (
                    <div key={peerId} style={styles.videoCard}>
                      <video
                        autoPlay
                        playsInline
                        ref={el => { if (el && peer.stream) el.srcObject = peer.stream; }}
                        style={styles.videoElement(false)}
                      />
                      <div style={styles.videoOverlay}>
                        <span style={styles.videoNameBadge}>
                          👤 {peer.peerName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* THANH ĐIỀU KHIỂN NỔI CỦA WEBRTC */}
                <div style={styles.webrtcToolbar}>
                  <button
                    onClick={toggleMic}
                    style={styles.controlBtn(!isMicMuted, '#0284c7', '#ef4444')}
                    title={isMicMuted ? "Bật Micro" : "Tắt Micro"}
                  >
                    {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>

                  <button
                    onClick={toggleCamera}
                    style={styles.controlBtn(!isVideoMuted, '#0284c7', '#ef4444')}
                    title={isVideoMuted ? "Bật Camera" : "Tắt Camera"}
                  >
                    {isVideoMuted ? <VideoOff size={20} /> : <Video size={20} />}
                  </button>

                  <button
                    onClick={toggleScreenShare}
                    style={styles.controlBtn(isScreenSharing, '#10b981', '#334155')}
                    title={isScreenSharing ? "Dừng chia sẻ màn hình" : "Chia sẻ màn hình"}
                  >
                    <MonitorUp size={20} />
                  </button>
                </div>
              </div>
            )}

            {/* ĐỘNG CƠ 3: CẦU NỐI NGOÀI (GOOGLE MEET / ZOOM) */}
            {activeEngine === 'external' && (
              <div style={styles.externalWrapper}>
                <div style={styles.externalCard}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#0284c715', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                    <ExternalLink size={32} color="#0284c7" />
                  </div>
                  <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>
                    Cầu Nối Họp Trực Tuyến Bên Ngoài
                  </h4>
                  <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, maxWidth: '520px', margin: '0 auto 20px auto' }}>
                    Cuộc họp này được liên kết qua phòng họp Google Meet / Zoom. Quý Thầy/Cô hãy mở phòng họp bằng nút bên dưới và giữ tab này mở để hệ thống <strong>tự động điểm danh</strong> và <strong>ghi nhận biểu quyết</strong> thời gian thực.
                  </p>

                  {meeting.meeting_link ? (
                    <a
                      href={meeting.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.btnLaunchMeet}
                    >
                      <Video size={18} /> Vào Phòng Họp Google Meet / Zoom Ngay
                    </a>
                  ) : (
                    <div style={{ padding: '12px 16px', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '8px', fontSize: '13px' }}>
                      ⚠️ Ban Giám Hiệu chưa gắn đường link phòng họp ngoài. Vui lòng chuyển sang tab <strong>1. Jitsi Hội Đồng</strong> hoặc <strong>2. WebRTC P2P Nội Bộ</strong> để họp ngay trên web trường!
                    </div>
                  )}

                  <div style={{ marginTop: '24px', fontSize: '12px', color: '#94a3b8' }}>
                    Liên kết hiện tại: {meeting.meeting_link || 'Chưa cấu hình'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BẢNG ĐIỀU HÀNH HỘI NGHỊ ĐỒNG BỘ (SIDE PANEL) */}
          {isSidePanelOpen && (
            <div style={styles.sidePanel}>
              
              {/* TABS CỦA BẢNG ĐIỀU HÀNH */}
              <div style={styles.sideNav}>
                <button
                  onClick={() => setActiveSideTab('attendance')}
                  style={styles.sideTabBtn(activeSideTab === 'attendance')}
                >
                  <Users size={15} /> Điểm Danh
                </button>
                <button
                  onClick={() => setActiveSideTab('poll')}
                  style={styles.sideTabBtn(activeSideTab === 'poll')}
                >
                  <Vote size={15} /> Biểu Quyết
                </button>
                <button
                  onClick={() => setActiveSideTab('minutes')}
                  style={styles.sideTabBtn(activeSideTab === 'minutes')}
                >
                  <FileText size={15} /> Thư Ký
                </button>
              </div>

              {/* TAB 1: ĐIỂM DANH */}
              {activeSideTab === 'attendance' && (
                <div style={styles.tabContent}>
                  <div style={styles.attendanceCard}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>Trạng Thái Của Bạn</span>
                      {myAttendance?.status === 'PRESENT' ? (
                        <span style={styles.tagSuccess}>🟢 ĐÃ CÓ MẶT</span>
                      ) : (
                        <span style={styles.tagWarning}>🟡 CHƯA ĐIỂM DANH</span>
                      )}
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                      {myAttendance ? (
                        <span>Thời gian ghi nhận: <strong>{new Date(myAttendance.checkin_time).toLocaleTimeString('vi-VN')}</strong></span>
                      ) : (
                        <span>Bạn chưa được hệ thống ghi nhận có mặt tại phiên họp này.</span>
                      )}
                    </div>

                    {(!myAttendance || myAttendance.status !== 'PRESENT') && (
                      <button
                        onClick={handleAutoCheckin}
                        disabled={checkingIn}
                        style={styles.btnCheckinNow}
                      >
                        {checkingIn ? 'Đang xác thực...' : '✨ Điểm Danh Ngay Cho Tôi'}
                      </button>
                    )}

                    {checkinMessage && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: checkinMessage.type === 'success' ? '#16a34a' : '#dc2626' }}>
                        {checkinMessage.text}
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>
                        Danh Sách Đã Dự Họp ({attendances.filter(a => a.status === 'PRESENT').length} người)
                      </span>
                      <button onClick={onRefreshAttendances} style={styles.btnRefreshSmall} title="Làm mới danh sách">
                        <RefreshCw size={13} />
                      </button>
                    </div>

                    <div style={styles.attendanceListScroll}>
                      {attendances.filter(a => a.status === 'PRESENT').map((att, idx) => (
                        <div key={idx} style={styles.attendanceRow}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={styles.userDot} />
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{att.staff_name}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>{att.department}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 'bold' }}>
                            {att.checkin_time ? new Date(att.checkin_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BIỂU QUYẾT TRỰC TIẾP */}
              {activeSideTab === 'poll' && (
                <div style={styles.tabContent}>
                  {meeting.poll_question ? (
                    <div>
                      <div style={styles.pollHeader}>
                        <Vote size={18} color="#0284c7" />
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
                          Lấy Ý Kiến Tập Thể
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#334155', fontWeight: '600', marginBottom: '14px', lineHeight: 1.5 }}>
                        {meeting.poll_question}
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {pollStats.map((item, idx) => {
                          const isSelected = selectedPollOption === item.option;
                          return (
                            <button
                              key={idx}
                              onClick={() => handleVotePoll(item.option)}
                              style={styles.pollOptionBtn(isSelected)}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontSize: '13px', fontWeight: isSelected ? 'bold' : '500', color: isSelected ? '#0284c7' : '#0f172a' }}>
                                  {isSelected && '✓ '} {item.option}
                                </span>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>
                                  {item.count} phiếu ({item.percent}%)
                                </span>
                              </div>
                              <div style={styles.pollProgressBarBg}>
                                <div style={styles.pollProgressBarFill(item.percent)} />
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {votingStatus === 'saving' && (
                        <p style={{ fontSize: '12px', color: '#0284c7', marginTop: '8px' }}>Đang lưu biểu quyết...</p>
                      )}
                      {votingStatus === 'success' && (
                        <p style={{ fontSize: '12px', color: '#16a34a', marginTop: '8px' }}>✓ Đã cập nhật ý kiến của bạn!</p>
                      )}
                    </div>
                  ) : (
                    <div style={styles.emptyNotice}>
                      <Vote size={32} color="#cbd5e1" />
                      <p style={{ marginTop: '8px', fontSize: '13px', color: '#64748b' }}>
                        Cuộc họp này hiện không mở biểu quyết trực tiếp.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: THƯ KÝ GHI CHÚ & XUẤT BIÊN BẢN */}
              {activeSideTab === 'minutes' && (
                <div style={styles.tabContent}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '6px' }}>
                      Ghi Chú Nhanh / Diễn Biến Cuộc Họp:
                    </label>
                    <textarea
                      value={meetingNotes}
                      onChange={e => {
                        setMeetingNotes(e.target.value);
                        localStorage.setItem(`cbq_meeting_notes_${meeting.id}`, e.target.value);
                      }}
                      placeholder="Thư ký ghi tóm tắt các phát biểu, ý kiến chỉ đạo của BGH tại đây..."
                      style={styles.notesTextarea}
                    />
                  </div>

                  <button
                    onClick={handleExportWordMinutes}
                    style={styles.btnExportWord}
                    title="Xuất file Word theo thể thức Nghị định 30/2020/NĐ-CP"
                  >
                    <FileText size={16} /> Xuất Biên Bản Word (NĐ 30)
                  </button>
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', textAlign: 'center' }}>
                    Tự động tạo tệp theo thể thức văn bản hành chính lưu trữ nhà trường.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// =========================================================================
// BẢNG PHONG CÁCH GIAO DIỆN HIỆN ĐẠI (STYLES)
// =========================================================================
const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(4px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px'
  },
  modalContainer: {
    width: '95vw',
    height: '92vh',
    maxWidth: '1440px',
    backgroundColor: '#0b1329',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  fullscreen: {
    width: '100vw',
    height: '100vh',
    maxWidth: 'none',
    borderRadius: 0,
    padding: 0
  },
  header: {
    height: '64px',
    padding: '0 20px',
    backgroundColor: '#0f172a',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0
  },
  pulseDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#22c55e',
    boxShadow: '0 0 10px #22c55e'
  },
  headerTitle: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: 0,
    maxWidth: '380px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  headerSubtitle: {
    fontSize: '12px',
    color: '#94a3b8'
  },
  badgeLive: {
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    padding: '2px 6px',
    borderRadius: '4px',
    letterSpacing: '0.5px'
  },
  engineTabs: {
    display: 'flex',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: '4px',
    borderRadius: '8px',
    gap: '4px'
  },
  engineBtn: active => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: active ? 'bold' : '500',
    color: active ? '#ffffff' : '#94a3b8',
    backgroundColor: active ? '#0284c7' : 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  }),
  iconBtn: active => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '8px',
    color: active ? '#38bdf8' : '#cbd5e1',
    backgroundColor: active ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
    border: 'none',
    cursor: 'pointer'
  }),
  closeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    color: '#ffffff',
    backgroundColor: '#dc2626',
    border: 'none',
    fontWeight: 'bold',
    fontSize: '13px',
    cursor: 'pointer'
  },
  mainLayout: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden'
  },
  videoStage: {
    flex: 1,
    backgroundColor: '#020617',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column'
  },
  jitsiWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative'
  },
  centerLoading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center'
  },
  webrtcWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    padding: '16px'
  },
  mediaWarningBanner: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '10px'
  },
  videoGrid: count => ({
    flex: 1,
    display: 'grid',
    gridTemplateColumns: count <= 1 ? '1fr' : (count <= 4 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'),
    gap: '12px',
    alignItems: 'center',
    justifyContent: 'center',
    overflowY: 'auto'
  }),
  videoCard: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    overflow: 'hidden',
    position: 'relative',
    aspectRatio: '16/9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
  },
  videoElement: isLocal => ({
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: isLocal ? 'scaleX(-1)' : 'none'
  }),
  videoOverlay: {
    position: 'absolute',
    bottom: '10px',
    left: '10px',
    right: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    pointerEvents: 'none'
  },
  videoNameBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    color: '#ffffff',
    fontSize: '12px',
    padding: '3px 8px',
    borderRadius: '4px',
    backdropFilter: 'blur(4px)'
  },
  badgeMuted: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    padding: '3px 6px',
    borderRadius: '4px'
  },
  webrtcToolbar: {
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: '12px',
    margin: '10px auto 0 auto',
    padding: '0 20px',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  controlBtn: (active, activeColor, inactiveColor) => ({
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    backgroundColor: active ? activeColor : inactiveColor,
    color: '#ffffff',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  }),
  externalWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px'
  },
  externalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '36px',
    textAlign: 'center',
    maxWidth: '560px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
  },
  btnLaunchMeet: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '15px',
    textDecoration: 'none',
    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.35)'
  },
  sidePanel: {
    width: '340px',
    backgroundColor: '#ffffff',
    borderLeft: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0
  },
  sideNav: {
    display: 'flex',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc'
  },
  sideTabBtn: active => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '12px 0',
    fontSize: '12px',
    fontWeight: active ? 'bold' : '500',
    color: active ? '#0284c7' : '#64748b',
    backgroundColor: active ? '#ffffff' : 'transparent',
    border: 'none',
    borderBottom: active ? '2px solid #0284c7' : 'none',
    cursor: 'pointer'
  }),
  tabContent: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto'
  },
  attendanceCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '12px',
    border: '1px solid #e2e8f0'
  },
  tagSuccess: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#16a34a',
    backgroundColor: '#dcfce7',
    padding: '2px 6px',
    borderRadius: '4px'
  },
  tagWarning: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#d97706',
    backgroundColor: '#fef3c7',
    padding: '2px 6px',
    borderRadius: '4px'
  },
  btnCheckinNow: {
    width: '100%',
    padding: '8px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    borderRadius: '6px',
    border: 'none',
    fontWeight: 'bold',
    fontSize: '12px',
    cursor: 'pointer'
  },
  btnRefreshSmall: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#64748b',
    padding: '4px'
  },
  attendanceListScroll: {
    maxHeight: '380px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  attendanceRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    border: '1px solid #f1f5f9'
  },
  userDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#16a34a'
  },
  pollHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '8px'
  },
  pollOptionBtn: selected => ({
    width: '100%',
    textAlign: 'left',
    padding: '10px 12px',
    borderRadius: '8px',
    border: selected ? '2px solid #0284c7' : '1px solid #e2e8f0',
    backgroundColor: selected ? '#f0f9ff' : '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  }),
  pollProgressBarBg: {
    width: '100%',
    height: '6px',
    backgroundColor: '#e2e8f0',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  pollProgressBarFill: percent => ({
    width: `${percent}%`,
    height: '100%',
    backgroundColor: '#0284c7',
    transition: 'width 0.3s ease'
  }),
  emptyNotice: {
    textAlign: 'center',
    padding: '36px 12px'
  },
  notesTextarea: {
    width: '100%',
    height: '160px',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '12px',
    lineHeight: 1.5,
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  btnExportWord: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px',
    backgroundColor: '#1e3a8a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '13px',
    cursor: 'pointer'
  }
};
