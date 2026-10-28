import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Video, VideoOff, Mic, MicOff, MonitorUp, PhoneOff,
  Maximize2, Minimize2, Users, Vote, FileText, ExternalLink,
  Radio, Shield, Sparkles, Settings, RefreshCw, CheckCircle2,
  AlertCircle, ChevronRight, ChevronLeft, Volume2, MessageSquare,
  Copy, Check, Clock, UserCheck, UserX, ShieldCheck, ShieldAlert,
  Bell, Lock, Unlock, Play, Server, Info, Headphones, User, HelpCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { OnlineMeetingService, DEFAULT_DEPARTMENTS } from '../services/onlineMeetingService';

/**
 * PHÒNG HỌP TRỰC TUYẾN THÔNG MINH ĐA ĐỘNG CƠ (3-IN-1 SMART MEETING ROOM)
 * TRƯỜNG THPT CAO BÁ QUÁT - ĐẮK LẮK
 * 
 * 1. Chế độ gửi link vào họp trực tiếp: https://domain/diem-danh-hop?id=...&join=1
 * 2. Chế độ Phê duyệt người tham gia (Host Approval / Waiting Room / Lobby):
 *    - Chủ tọa (Admin/BGH) có thể BẬT / TẮT phê duyệt bất cứ lúc nào.
 *    - Duyệt từng người (Admit) hoặc Duyệt tất cả (Admit All) chỉ bằng 1-Click.
 *    - Người tham gia chưa được duyệt sẽ ở màn hình Phòng Chờ sang trọng, kiểm tra trước Cam/Mic.
 * 3. Ba động cơ phòng họp:
 *    - Động cơ 1: Jitsi Meet nhúng (Hội đồng Sư phạm 50-100 người, miễn phí 100%).
 *    - Động cơ 2: WebRTC P2P Nội bộ (BGH, Tổ chuyên môn 2-8 người, siêu bảo mật).
 *    - Động cơ 3: Cầu nối ngoài (Google Meet / Zoom / MS Teams liên kết Sở GD&ĐT).
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
  // Chế độ phòng họp: 'jitsi' (toàn trường) | 'webrtc' (nội bộ BGH/Tổ) | 'external' (Meet/Zoom)
  const defaultEngine = meeting?.meeting_format === 'ONLINE' && !meeting?.meeting_link
    ? 'jitsi'
    : (meeting?.meeting_link?.includes('meet.google.com') || meeting?.meeting_link?.includes('zoom.us') ? 'external' : 'jitsi');

  const [activeEngine, setActiveEngine] = useState(defaultEngine);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  const [activeSideTab, setActiveSideTab] = useState('attendance'); // 'attendance' | 'poll' | 'lobby' | 'minutes'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLinkToast, setCopiedLinkToast] = useState(false);

  // Máy chủ Jitsi chính thức: meet.jit.si (Tốc độ cao toàn cầu, CDN Singapore/VN, hỗ trợ nhúng 100%)
  const [jitsiServer, setJitsiServer] = useState(() => {
    try {
      localStorage.setItem('cbq_jitsi_server', 'meet.jit.si');
    } catch (_) {}
    return 'meet.jit.si';
  });
  const [jitsiReloadKey, setJitsiReloadKey] = useState(0);

  // Hộp thoại Hướng dẫn cấp quyền Camera & Micro trên trình duyệt
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);

  // =========================================================================
  // CẤU HÌNH THỜI GIAN & ĐỒNG HỒ ĐO THỜI LƯỢNG HỌP TRỰC TUYẾN
  // =========================================================================
  const timeConfig = useMemo(() => {
    if (!meeting?.id) return {};
    try {
      return JSON.parse(localStorage.getItem(`cbq_meeting_time_${meeting.id}`) || '{}');
    } catch {
      return {};
    }
  }, [meeting?.id]);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (sec) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // =========================================================================
  // CHẾ ĐỘ PHÊ DUYỆT (LOBBY / WAITING ROOM)
  // =========================================================================
  // Chủ tọa (Admin) có thể bật/tắt chế độ phòng chờ
  const [isLobbyEnabled, setIsLobbyEnabled] = useState(() => {
    if (!meeting?.id) return false;
    try {
      return localStorage.getItem(`cbq_lobby_enabled_${meeting.id}`) === 'true';
    } catch {
      return false;
    }
  });

  // Trạng thái Cổng điểm danh (Mở / Khóa)
  const [isCheckinOpen, setIsCheckinOpen] = useState(() => {
    return meeting?.is_checkin_open !== false;
  });

  // Trạng thái phê duyệt của người dùng hiện tại:
  // 'admitted' (được vào phòng), 'waiting' (đang ở phòng chờ), 'rejected' (bị từ chối)
  const [myAdmissionStatus, setMyAdmissionStatus] = useState(() => {
    if (isAdmin) return 'admitted';
    if (!meeting?.id) return 'admitted';
    try {
      const lobbyOn = localStorage.getItem(`cbq_lobby_enabled_${meeting.id}`) === 'true';
      return lobbyOn ? 'waiting' : 'admitted';
    } catch {
      return 'admitted';
    }
  });

  // Danh sách các giáo viên đang chờ duyệt ở phòng chờ: [{ peerId, peerName, department, timestamp }]
  const [waitingList, setWaitingList] = useState([]);

  // Thông tin người tham gia & Xác nhận danh tính giáo viên
  const [displayNameInput, setDisplayNameInput] = useState(() => {
    try {
      const pref = localStorage.getItem('cbq_attendance_teacher_pref');
      if (pref) {
        const p = JSON.parse(pref);
        if (p.name) return p.name;
      }
    } catch (e) {}
    if (currentUser?.name && !currentUser.name.includes('Giáo viên THPT') && !currentUser.name.includes('Thầy/Cô THPT')) {
      return currentUser.name;
    }
    return '';
  });

  const [departmentInput, setDepartmentInput] = useState(() => {
    try {
      const pref = localStorage.getItem('cbq_attendance_teacher_pref');
      if (pref) {
        const p = JSON.parse(pref);
        if (p.department) return p.department;
      }
    } catch (e) {}
    if (currentUser?.department && currentUser.department !== 'Tổ Chuyên môn') {
      return currentUser.department;
    }
    return DEFAULT_DEPARTMENTS[1] || 'Tổ Toán';
  });

  const userDisplayName = useMemo(() => {
    return (displayNameInput || '').trim() || currentUser?.name || currentUser?.full_name || currentUser?.email || 'Thầy/Cô THPT Cao Bá Quát';
  }, [currentUser, displayNameInput]);

  const userDepartment = useMemo(() => {
    return (departmentInput || '').trim() || currentUser?.department || 'Tổ Chuyên môn';
  }, [currentUser, departmentInput]);

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
    if (!meeting?.id) return '';
    try {
      return localStorage.getItem(`cbq_meeting_notes_${meeting.id}`) || '';
    } catch {
      return '';
    }
  });

  // Unique peer id
  const myPeerId = useRef('peer_' + Math.random().toString(36).substring(2, 9));
  const channelRef = useRef(null);

  // =========================================================================
  // 1. KÊNH BROADCAST DÙNG CHUNG (SIGNALING & LOBBY SYNC)
  // =========================================================================
  useEffect(() => {
    if (!isOpen || !meeting?.id) return;
    const channelName = `meeting-broadcast-${meeting.id.slice(0, 20)}`;
    const ch = supabase.channel(channelName, {
      config: { broadcast: { self: false } }
    });
    channelRef.current = ch;

    ch.on('broadcast', { event: 'signal' }, async ({ payload }) => {
      if (!payload) return;
      const { type, from, to, sdp, candidate, peerName, department, isLobby, targetPeerId } = payload;

      // --- SỰ KIỆN PHÒNG CHỜ (LOBBY) ---
      // 1. Khi có người mới "gõ cửa" xin vào phòng chờ
      if (type === 'lobby-knock') {
        if (isAdmin) {
          setWaitingList(prev => {
            if (prev.some(p => p.peerId === from)) return prev;
            return [...prev, { peerId: from, peerName, department, timestamp: Date.now() }];
          });
        }
      }

      // 2. Chủ tọa duyệt 1 người vào
      else if (type === 'lobby-admit') {
        if (targetPeerId === myPeerId.current) {
          setMyAdmissionStatus('admitted');
        }
        if (isAdmin) {
          setWaitingList(prev => prev.filter(p => p.peerId !== targetPeerId));
        }
      }

      // 3. Chủ tọa duyệt tất cả người đang chờ
      else if (type === 'lobby-admit-all') {
        if (!isAdmin) {
          setMyAdmissionStatus('admitted');
        } else {
          setWaitingList([]);
        }
      }

      // 4. Chủ tọa từ chối 1 người
      else if (type === 'lobby-reject') {
        if (targetPeerId === myPeerId.current) {
          setMyAdmissionStatus('rejected');
        }
        if (isAdmin) {
          setWaitingList(prev => prev.filter(p => p.peerId !== targetPeerId));
        }
      }

      // 5. Thay đổi trạng thái Bật/Tắt phòng chờ từ Chủ tọa
      else if (type === 'lobby-toggle') {
        setIsLobbyEnabled(isLobby);
        if (meeting?.id) {
          localStorage.setItem(`cbq_lobby_enabled_${meeting.id}`, String(isLobby));
        }
        if (!isLobby && !isAdmin) {
          setMyAdmissionStatus('admitted');
        }
      }

      // 6. Thay đổi trạng thái Cổng điểm danh (Mở / Khóa)
      else if (type === 'checkin-gate-toggled') {
        setIsCheckinOpen(payload.isOpen);
        onRefreshAttendances();
      }

      // 7. Có người mới điểm danh thành công -> Cập nhật sĩ số ngay
      else if (type === 'attendance-updated') {
        onRefreshAttendances();
      }

      // --- SỰ KIỆN WEBRTC P2P (KHI ĐÃ ĐƯỢC DUYỆT) ---
      if (activeEngine === 'webrtc' && myAdmissionStatus === 'admitted') {
        if (type === 'peer-join') {
          createAndSendOffer(from, peerName, localStreamRef.current);
        } else if (type === 'offer' && to === myPeerId.current) {
          handleReceiveOffer(from, peerName, sdp, localStreamRef.current);
        } else if (type === 'answer' && to === myPeerId.current) {
          const pc = peerConnections.current[from];
          if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        } else if (type === 'ice-candidate' && to === myPeerId.current) {
          const pc = peerConnections.current[from];
          if (pc && candidate) {
            try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {}
          }
        } else if (type === 'peer-leave') {
          closePeerConnection(from);
        }
      }
    });

    ch.subscribe(status => {
      if (status === 'SUBSCRIBED') {
        // Nếu không phải admin và đang ở trạng thái chờ: Gõ cửa xin vào phòng
        if (!isAdmin && myAdmissionStatus === 'waiting') {
          ch.send({
            type: 'broadcast',
            event: 'signal',
            payload: {
              type: 'lobby-knock',
              from: myPeerId.current,
              peerName: userDisplayName,
              department: userDepartment
            }
          });
        }
      }
    });

    return () => {
      ch.unsubscribe();
      channelRef.current = null;
    };
  }, [meeting?.id, isAdmin, activeEngine, myAdmissionStatus, userDisplayName, userDepartment]);

  // Tự động đồng bộ sĩ số và người tham gia mỗi 4 giây
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      onRefreshAttendances();
    }, 4000);
    return () => clearInterval(timer);
  }, [isOpen, onRefreshAttendances]);

  // Host Bật/Tắt Cổng Điểm Danh Trực Tuyến
  const handleToggleCheckinGate = async () => {
    if (!meeting?.id) return;
    const nextState = !isCheckinOpen;
    setIsCheckinOpen(nextState);
    try {
      await OnlineMeetingService.toggleCheckin(meeting.id, nextState);
      channelRef.current?.send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          type: 'checkin-gate-toggled',
          from: myPeerId.current,
          isOpen: nextState
        }
      });
      onRefreshAttendances();
    } catch (e) {
      console.error('Lỗi chuyển trạng thái cổng điểm danh:', e);
    }
  };

  // Host toggle Bật/Tắt chế độ phê duyệt
  const handleToggleLobby = (newVal) => {
    setIsLobbyEnabled(newVal);
    if (meeting?.id) {
      localStorage.setItem(`cbq_lobby_enabled_${meeting.id}`, String(newVal));
    }

    // Phát tín hiệu cho các máy khác
    channelRef.current?.send({
      type: 'broadcast',
      event: 'signal',
      payload: {
        type: 'lobby-toggle',
        from: myPeerId.current,
        isLobby: newVal
      }
    });

    // Nếu vừa tắt chế độ phê duyệt: Duyệt luôn tất cả mọi người đang đợi
    if (!newVal && waitingList.length > 0) {
      handleAdmitAll();
    }
  };

  // Host duyệt 1 người
  const handleAdmitOne = (targetPeerId) => {
    setWaitingList(prev => prev.filter(p => p.peerId !== targetPeerId));
    channelRef.current?.send({
      type: 'broadcast',
      event: 'signal',
      payload: {
        type: 'lobby-admit',
        from: myPeerId.current,
        targetPeerId
      }
    });
  };

  // Host từ chối 1 người
  const handleRejectOne = (targetPeerId) => {
    setWaitingList(prev => prev.filter(p => p.peerId !== targetPeerId));
    channelRef.current?.send({
      type: 'broadcast',
      event: 'signal',
      payload: {
        type: 'lobby-reject',
        from: myPeerId.current,
        targetPeerId
      }
    });
  };

  // Host duyệt tất cả mọi người trong phòng chờ
  const handleAdmitAll = () => {
    setWaitingList([]);
    channelRef.current?.send({
      type: 'broadcast',
      event: 'signal',
      payload: {
        type: 'lobby-admit-all',
        from: myPeerId.current
      }
    });
  };

  // Sao chép link mời họp trực tiếp kèm lời mời chuẩn mực
  const handleCopyDirectLink = () => {
    const origin = window.location.origin;
    const directUrl = `${origin}/diem-danh-hop?id=${meeting.id}&join=1`;
    const jitsiDirectUrl = `https://meet.jit.si/${cleanRoomName}`;
    const message = `🏛️ TRƯỜNG THPT CAO BÁ QUÁT - ĐẮK LẮK\n📢 THƯ MỜI THAM DỰ CUỘC HỌP TRỰC TUYẾN\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📌 Cuộc họp: ${meeting.title}\n⏰ Thời gian: ${new Date(meeting.meeting_date || Date.now()).toLocaleDateString('vi-VN')}\n📍 Hình thức: Phòng họp trực tuyến thông minh CBQ\n\n🔗 Link vào phòng họp & Tự động điểm danh:\n${directUrl}\n\n🚀 Link vào thẳng phòng họp Video (Không giới hạn thời gian):\n${jitsiDirectUrl}\n\n(Thầy/Cô chỉ cần click vào link để vào họp trực tiếp và tự động điểm danh, không cần cài đặt phần mềm)`;

    navigator.clipboard.writeText(message);
    setCopiedLinkToast(true);
    setTimeout(() => setCopiedLinkToast(false), 3500);
  };

  // =========================================================================
  // 2. WEBRTC P2P NỘI BỘ (CHO NHÓM NHỎ 2 - 8 NGƯỜI)
  // =========================================================================
  const localVideoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const localStreamRef = useRef(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [dismissedMediaWarning, setDismissedMediaWarning] = useState(false);

  const [remotePeers, setRemotePeers] = useState({});
  const peerConnections = useRef({});

  // Phân tích chính xác nguyên nhân lỗi Camera / Micro trên laptop & máy tính
  const parseMediaError = (err, fallbackType = null) => {
    if (!err) return { type: 'warning', text: 'Không thể truy cập thiết bị âm thanh / hình ảnh.' };
    const errName = err.name || '';
    const errMsg = err.message || '';

    // 1. Lỗi xung đột do ứng dụng khác (Google Meet, Zoom, Zalo...) đang chiếm độc quyền camera của laptop
    if (errName === 'NotReadableError' || errName === 'TrackStartError' || errMsg.includes('Could not start')) {
      if (fallbackType === 'cam-only') {
        return {
          type: 'warning',
          isConflict: true,
          text: '⚡ Camera laptop đang bị chiếm giữ bởi tab Google Meet (hoặc Zoom). Đã bật Mic thành công! Thầy/Cô vui lòng tắt camera ở Google Meet để phòng họp nhận diện video.'
        };
      }
      return {
        type: 'warning',
        isConflict: true,
        text: '⚡ Camera/Micro laptop đang bị tab Google Meet (hoặc Zoom) chiếm giữ độc quyền. Thầy/Cô vui lòng tắt Camera ở Google Meet rồi bấm "Thử Lại" để phòng họp nhận diện!'
      };
    }

    // 2. Lỗi quyền bị trình duyệt chặn (mỗi trang web cần cấp quyền riêng, không dùng chung quyền với meet.google.com)
    if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError' || errName === 'SecurityError') {
      return {
        type: 'warning',
        isPermission: true,
        text: '🔒 Trình duyệt đang chặn quyền Camera/Micro của trang web này. (Lưu ý: Google Meet chạy trên meet.google.com được cấp quyền riêng, còn trang này Thầy/Cô cần bấm biểu tượng Ổ khóa 🔒 bên trái địa chỉ web và chọn "Cho phép" - Allow).'
      };
    }

    // 3. Lỗi không tìm thấy thiết bị phần cứng
    if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
      return {
        type: 'info',
        text: '🎧 Không tìm thấy Webcam/Mic. Bạn đang ở chế độ Chỉ Lắng Nghe.'
      };
    }

    // 4. Lỗi tham số cấu hình
    if (errName === 'OverconstrainedError') {
      return {
        type: 'warning',
        text: '⚠️ Độ phân giải camera không tương thích. Đang tự động chuyển về chế độ cơ bản...'
      };
    }

    return {
      type: 'warning',
      text: `⚠️ Chưa thể kết nối Camera/Mic (${errName || 'Lỗi thiết bị'}). Thầy/Cô hãy kiểm tra biểu tượng ổ khóa 🔒 trên thanh URL.`
    };
  };

  // Hàm lấy luồng đa phương tiện thông minh (progressive fallback cho laptop)
  const acquireMediaStream = async () => {
    // Bước 1: Thử xin cả video và audio chuẩn (không ép frameRate cố định để tránh xung đột driver webcam laptop)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      return { stream, error: null };
    } catch (err1) {
      console.warn('[WebRTC] Thử Cam+Mic thất bại:', err1.name, err1.message);

      // Bước 2: Nếu camera bị Google Meet/Zoom chiếm hoặc driver lỗi, thử lấy CHỈ AUDIO (để vẫn nói được)
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        return {
          stream: audioStream,
          error: parseMediaError(err1, 'cam-only')
        };
      } catch (err2) {
        console.warn('[WebRTC] Thử Audio thất bại:', err2.name, err2.message);

        // Bước 3: Thử CHỈ VIDEO (nếu mic bị chiếm)
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          return {
            stream: videoStream,
            error: parseMediaError(err2, 'mic-only')
          };
        } catch (err3) {
          // Bước 4: Kiểm tra xem có phần cứng không
          let hardwareFound = false;
          try {
            if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
              const devices = await navigator.mediaDevices.enumerateDevices();
              hardwareFound = devices.some(d => d.kind === 'audioinput' || d.kind === 'videoinput');
            }
          } catch (e) {}

          if (!hardwareFound) {
            return {
              stream: null,
              error: {
                type: 'info',
                text: '🎧 Bạn đang ở chế độ Chỉ Lắng Nghe (Chưa cắm Mic/Webcam). Thầy/Cô vẫn xem và chia sẻ màn hình bình thường.'
              }
            };
          }

          return {
            stream: null,
            error: parseMediaError(err1)
          };
        }
      }
    }
  };

  // Hàm yêu cầu cấp lại quyền Mic / Webcam chủ động từ người dùng
  const requestMediaAgain = async () => {
    setMediaError(null);
    setDismissedMediaWarning(false);
    const { stream, error } = await acquireMediaStream();

    if (stream) {
      setLocalStream(stream);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsMicMuted(false);
      setIsVideoMuted(false);

      // Cập nhật lại đường truyền cho các đồng nghiệp đang kết nối
      Object.values(peerConnections.current).forEach(pc => {
        stream.getTracks().forEach(track => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === track.kind);
          if (sender) {
            sender.replaceTrack(track);
          } else {
            pc.addTrack(track, stream);
          }
        });
      });
    }

    if (error) {
      setMediaError(error);
      if ((error.isPermission || error.isConflict) && !stream) {
        setShowPermissionGuide(true);
      }
    }
  };

  useEffect(() => {
    if (activeEngine !== 'webrtc' || myAdmissionStatus !== 'admitted') {
      cleanupWebRTC();
      return;
    }

    let isMounted = true;

    async function initWebRTC() {
      try {
        setMediaError(null);
        const { stream, error } = await acquireMediaStream();

        if (!isMounted) {
          if (stream) stream.getTracks().forEach(t => t.stop());
          return;
        }

        if (stream) {
          setLocalStream(stream);
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }

        if (error) {
          setMediaError(error);
        }

        // Báo cho các bạn họp mình đã vào
        channelRef.current?.send({
          type: 'broadcast',
          event: 'signal',
          payload: {
            type: 'peer-join',
            from: myPeerId.current,
            peerName: userDisplayName
          }
        });

      } catch (err) {
        console.error('[WebRTC] Lỗi khởi tạo P2P:', err);
      }
    }

    initWebRTC();

    return () => {
      isMounted = false;
      cleanupWebRTC();
    };
  }, [activeEngine, myAdmissionStatus]);

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
    } catch (e) {}
  };

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
    } catch (e) {}
  };

  const createPeerConnection = (targetPeerId, targetName, stream) => {
    if (peerConnections.current[targetPeerId]) {
      return peerConnections.current[targetPeerId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current[targetPeerId] = pc;

    if (stream) {
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

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

    pc.ontrack = event => {
      const remoteStream = event.streams[0];
      setRemotePeers(prev => ({
        ...prev,
        [targetPeerId]: { peerName: targetName, stream: remoteStream }
      }));
    };

    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        closePeerConnection(targetPeerId);
      }
    };

    return pc;
  };

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

  const cleanupWebRTC = () => {
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      setLocalStream(null);
      localStreamRef.current = null;
    }
    Object.keys(peerConnections.current).forEach(id => {
      try { peerConnections.current[id].close(); } catch (e) {}
    });
    peerConnections.current = {};
    setRemotePeers({});
    setIsScreenSharing(false);
  };

  const toggleMic = () => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicMuted(!audioTrack.enabled);
    }
  };

  const toggleCamera = () => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoMuted(!videoTrack.enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(t => t.stop());
      }
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: !isMicMuted });
        const newVideoTrack = camStream.getVideoTracks()[0];
        Object.values(peerConnections.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender && newVideoTrack) sender.replaceTrack(newVideoTrack);
        });
        if (localVideoRef.current) localVideoRef.current.srcObject = camStream;
        setLocalStream(camStream);
        localStreamRef.current = camStream;
      } catch {
        // Nếu không có webcam thì hoàn tất tắt chia sẻ màn hình
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrack.onended = () => {
          setIsScreenSharing(false);
        };
        Object.values(peerConnections.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          } else {
            pc.addTrack(screenTrack, screenStream);
          }
        });
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        setIsScreenSharing(true);
      } catch (e) {
        console.warn('Đã hủy chia sẻ màn hình hoặc không cấp quyền', e);
      }
    }
  };

  // =========================================================================
  // 3. JITSI MEET NHÚNG (TOÀN TRƯỜNG 50 - 100 NGƯỜI)
  // =========================================================================
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const [jitsiLoading, setJitsiLoading] = useState(true);

  const cleanRoomName = useMemo(() => {
    if (!meeting?.id) return 'CBQ_THPT_Meeting_Room';
    return `CBQ_THPT_Meeting_${meeting.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`;
  }, [meeting?.id]);

  useEffect(() => {
    if (activeEngine !== 'jitsi' || myAdmissionStatus !== 'admitted') {
      if (jitsiApiRef.current) {
        try { jitsiApiRef.current.dispose(); } catch (e) {}
        jitsiApiRef.current = null;
      }
      return;
    }

    setJitsiLoading(true);
    let isCancelled = false;

    const loadJitsiScript = (domain) => {
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve(window.JitsiMeetExternalAPI);
          return;
        }
        const script = document.createElement('script');
        script.src = `https://${domain}/external_api.js`;
        script.async = true;
        script.onload = () => resolve(window.JitsiMeetExternalAPI);
        script.onerror = () => {
          // Dự phòng tải script chính thức meet.jit.si
          const fbScript = document.createElement('script');
          fbScript.src = 'https://meet.jit.si/external_api.js';
          fbScript.async = true;
          fbScript.onload = () => resolve(window.JitsiMeetExternalAPI);
          fbScript.onerror = () => reject(new Error('Không thể tải Jitsi API'));
          document.body.appendChild(fbScript);
        };
        document.body.appendChild(script);
      });
    };

    loadJitsiScript(jitsiServer)
      .then(JitsiAPI => {
        if (isCancelled || !jitsiContainerRef.current) return;
        if (jitsiApiRef.current) {
          try { jitsiApiRef.current.dispose(); } catch (e) {}
          jitsiApiRef.current = null;
        }

        // Dọn dẹp DOM container để không bị chèn trùng lặp iframe
        if (jitsiContainerRef.current) {
          jitsiContainerRef.current.innerHTML = '';
        }

        const domain = jitsiServer;
        const options = {
          roomName: cleanRoomName,
          parentNode: jitsiContainerRef.current,
          width: '100%',
          height: '100%',
          userInfo: {
            displayName: `${userDisplayName} (${userDepartment})`
          },
          configOverwrite: {
            startWithAudioMuted: false,
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

        // LƯU Ý QUAN TRỌNG: KHÔNG gán onClose() vào 'readyToClose' của Jitsi!
        // Sự kiện readyToClose của Jitsi thường xuyên tự kích hoạt khi tải trang, xác thực moderator
        // hoặc khi có gián đoạn mạng, nếu gọi onClose() sẽ làm văng người dùng ra khỏi phòng họp!
        // Người dùng muốn rời phòng chỉ cần bấm nút đỏ [📞 Rời Phòng] ở góc trên cùng của hệ thống.
      })
      .catch(err => {
        console.warn('[Jitsi] Fallback:', err);
        setJitsiLoading(false);
      });

    return () => {
      isCancelled = true;
      if (jitsiApiRef.current) {
        try { jitsiApiRef.current.dispose(); } catch (e) {}
        jitsiApiRef.current = null;
      }
    };
  }, [activeEngine, myAdmissionStatus, cleanRoomName, jitsiServer, jitsiReloadKey]);

  // =========================================================================
  // 4. ĐIỂM DANH TỰ ĐỘNG & BIỂU QUYẾT TỨC THÌ
  // =========================================================================
  const handleAutoCheckin = async () => {
    setCheckingIn(true);
    setCheckinMessage(null);
    try {
      const finalName = (displayNameInput.trim() || userDisplayName).trim();
      const finalDept = (departmentInput.trim() || userDepartment).trim();

      if (!isAdmin && (!finalName || finalName.includes('Giáo viên THPT') || finalName.includes('Thầy/Cô THPT'))) {
        setCheckinMessage({ type: 'error', text: 'Thầy/Cô vui lòng nhập đầy đủ Họ và Tên của mình trước khi bấm điểm danh.' });
        setCheckingIn(false);
        return;
      }

      // Nếu là Admin và cổng đang đóng: Tự động mở cổng luôn
      if (isAdmin && !isCheckinOpen) {
        await OnlineMeetingService.toggleCheckin(meeting.id, true);
        setIsCheckinOpen(true);
        channelRef.current?.send({
          type: 'broadcast',
          event: 'signal',
          payload: { type: 'checkin-gate-toggled', isOpen: true }
        });
      }

      const res = await OnlineMeetingService.submitTeacherCheckin({
        meetingId: meeting.id,
        staffName: finalName,
        department: finalDept,
        checkinCode: meeting.checkin_code || '',
        pollAnswer: selectedPollOption || null,
        deviceInfo: `${navigator.userAgent.slice(0, 50)} | Phòng họp trực tuyến CBQ`,
        isSmartRoom: true,
        isAdminCheckin: isAdmin
      });

      if (res.success) {
        setCheckinMessage({ type: 'success', text: '✅ Đã ghi nhận điểm danh có mặt tại phòng họp!' });
        try {
          localStorage.setItem('cbq_attendance_teacher_pref', JSON.stringify({
            name: finalName,
            department: finalDept
          }));
        } catch (e) {}
        onRefreshAttendances();
        channelRef.current?.send({
          type: 'broadcast',
          event: 'signal',
          payload: { type: 'attendance-updated', from: myPeerId.current }
        });
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
        deviceInfo: 'Biểu quyết trực tiếp trong phòng họp',
        isSmartRoom: true,
        isAdminCheckin: isAdmin
      });
      setVotingStatus('success');
      onRefreshAttendances();
      channelRef.current?.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'attendance-updated', from: myPeerId.current }
      });
    } catch (e) {
      setVotingStatus('error');
    }
  };

  const pollStats = useMemo(() => {
    if (!meeting?.poll_options || meeting.poll_options.length === 0) return [];
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
  }, [meeting?.poll_options, attendances]);

  // =========================================================================
  // 5. XUẤT BIÊN BẢN HỌP NGHỊ ĐỊNH 30/2020/NĐ-CP
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
          @page Section1 { size: 21.0cm 29.7cm; margin: 2.0cm 1.5cm 2.0cm 3.0cm; }
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
          <p>- <strong>Thời gian:</strong> ${new Date(meeting.meeting_date || Date.now()).toLocaleDateString('vi-VN')}.</p>
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
                  <th style="width: 50%;">Phương Án Biểu Quyết</th>
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

  if (!isOpen || !meeting) return null;

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
                {isAdmin && (
                  <span style={styles.badgeHost}>👑 BGH CHỦ TỌA</span>
                )}
              </div>
              <span style={styles.headerSubtitle}>
                Tham gia: <strong>{userDisplayName}</strong> ({userDepartment}) • 
                <span style={{ color: '#38bdf8', marginLeft: '6px' }}>
                  ⏰ {timeConfig.startTime ? `${timeConfig.startTime} - ${timeConfig.endTime || ''}` : 'Giờ họp chuẩn'} ({new Date(meeting.meeting_date || Date.now()).toLocaleDateString('vi-VN')})
                </span> • 
                <span style={{ color: '#4ade80', fontWeight: 'bold', marginLeft: '6px' }}>
                  ⏱️ Đã họp: {formatElapsed(elapsedSeconds)}
                </span>
              </span>
            </div>
          </div>

          {/* CHỌN ĐỘNG CƠ PHÒNG HỌP (3-IN-1 ENGINE SELECTOR) */}
          {myAdmissionStatus === 'admitted' && (
            <div style={styles.engineTabs}>
              <button
                onClick={() => setActiveEngine('jitsi')}
                style={styles.engineBtn(activeEngine === 'jitsi')}
                title="Hội đồng Sư phạm toàn trường (50-100 người, Jitsi Meet nhúng)"
              >
                <Users size={14} /> 1. Jitsi Hội Đồng
              </button>
              <button
                onClick={() => setActiveEngine('webrtc')}
                style={styles.engineBtn(activeEngine === 'webrtc')}
                title="WebRTC P2P Nội bộ (BGH, Tổ CM 2-8 người, siêu bảo mật)"
              >
                <Radio size={14} /> 2. WebRTC P2P
              </button>
              <button
                onClick={() => setActiveEngine('external')}
                style={styles.engineBtn(activeEngine === 'external')}
                title="Cầu nối Google Meet / Zoom / MS Teams ngoài"
              >
                <ExternalLink size={14} /> 3. Meet / Zoom
              </button>
            </div>
          )}

          {/* NÚT THAO TÁC & PHÂN QUYỀN CHỦ TỌA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            
            {/* Nút sao chép link gửi giáo viên */}
            <button
              onClick={handleCopyDirectLink}
              style={styles.btnShareLink}
              title="Sao chép thư mời kèm đường link gửi qua Zalo để giáo viên bấm vào họp ngay"
            >
              {copiedLinkToast ? <Check size={15} color="#22c55e" /> : <Copy size={15} />}
              <span>{copiedLinkToast ? 'Đã Sao Chép Link!' : '📋 Link Mời Họp'}</span>
            </button>

            {/* Chủ tọa: Bật/Tắt chế độ Phê duyệt người tham gia */}
            {isAdmin && (
              <button
                onClick={() => handleToggleLobby(!isLobbyEnabled)}
                style={styles.lobbyToggleBtn(isLobbyEnabled)}
                title={isLobbyEnabled ? "Đang bật chế độ Phê duyệt (Người vào phải qua phòng chờ). Click để Tắt." : "Đang tắt chế độ Phê duyệt (Vào tự do). Click để Bật."}
              >
                {isLobbyEnabled ? <Lock size={15} color="#f59e0b" /> : <Unlock size={15} color="#10b981" />}
                <span>{isLobbyEnabled ? '🛡️ Phê Duyệt: BẬT' : '🔓 Vào Tự Do'}</span>
              </button>
            )}

            {/* Huy hiệu thông báo số người đang chờ duyệt (Dành cho Chủ tọa) */}
            {isAdmin && waitingList.length > 0 && (
              <button
                onClick={() => {
                  setIsSidePanelOpen(true);
                  setActiveSideTab('lobby');
                }}
                style={styles.waitingBadgeBtn}
                title="Có người đang chờ duyệt ở phòng chờ"
              >
                <Bell size={15} />
                <span>Chờ Duyệt ({waitingList.length})</span>
              </button>
            )}

            {myAdmissionStatus === 'admitted' && (
              <button
                onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                style={styles.iconBtn(isSidePanelOpen)}
                title={isSidePanelOpen ? "Thu gọn bảng điều hành" : "Mở bảng hội nghị"}
              >
                {isSidePanelOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Bảng Hội Nghị</span>
              </button>
            )}

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
              <PhoneOff size={15} /> Rời Phòng
            </button>
          </div>
        </div>

        {/* NỘI DUNG CHÍNH (BODY) */}
        <div style={styles.mainLayout}>

          {/* TRƯỜNG HỢP 1: NGƯỜI DÙNG ĐANG Ở PHÒNG CHỜ (CHƯA ĐƯỢC DUYỆT) */}
          {myAdmissionStatus === 'waiting' ? (
            <div style={styles.waitingRoomContainer}>
              <div style={styles.waitingRoomCard}>
                <div style={styles.waitingPulseRing}>
                  <Clock size={40} color="#0284c7" />
                </div>
                
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: '16px 0 8px 0' }}>
                  Bạn Đang Ở Phòng Chờ Của Nhà Trường
                </h3>
                
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 20px auto' }}>
                  Cuộc họp này được bảo vệ bởi chế độ phê duyệt. Vui lòng đợi <strong>Người chủ trì (Ban Giám Hiệu)</strong> xác nhận để vào phòng họp chính thức.
                </p>

                {/* THẺ THÔNG TIN ĐẠI BIỂU */}
                <div style={styles.waitingInfoBox}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Đại biểu:</span>
                    <strong style={{ color: '#0f172a', fontSize: '13px' }}>{userDisplayName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Đơn vị:</span>
                    <strong style={{ color: '#0369a1', fontSize: '13px' }}>Tổ {userDepartment}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Khung giờ họp:</span>
                    <strong style={{ color: '#0f172a', fontSize: '13px' }}>
                      {timeConfig.startTime ? `${timeConfig.startTime} - ${timeConfig.endTime || ''}` : 'Theo lịch BGH'} ({new Date(meeting.meeting_date || Date.now()).toLocaleDateString('vi-VN')})
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Trạng thái:</span>
                    <span style={{ color: '#d97706', fontSize: '13px', fontWeight: 'bold' }}>⏳ Đang chờ BGH phê duyệt...</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <button
                    onClick={handleAutoCheckin}
                    disabled={checkingIn}
                    style={styles.btnCheckinNow}
                  >
                    {checkingIn ? 'Đang xác thực...' : '✨ Điểm Danh Trước Cho Tôi'}
                  </button>
                  <button
                    onClick={onClose}
                    style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                  >
                    Rời Phòng Chờ
                  </button>
                </div>

                {checkinMessage && (
                  <p style={{ marginTop: '12px', fontSize: '12px', color: checkinMessage.type === 'success' ? '#16a34a' : '#dc2626' }}>
                    {checkinMessage.text}
                  </p>
                )}
              </div>
            </div>
          ) : myAdmissionStatus === 'rejected' ? (
            /* TRƯỜNG HỢP 2: BỊ TỪ CHỐI */
            <div style={styles.waitingRoomContainer}>
              <div style={styles.waitingRoomCard}>
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <ShieldAlert size={36} color="#dc2626" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#991b1b', marginBottom: '8px' }}>
                  Yêu Cầu Tham Gia Không Được Chấp Thuận
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, maxWidth: '440px', margin: '0 auto 20px' }}>
                  Người chủ trì cuộc họp đã từ chối yêu cầu vào phòng họp của bạn. Nếu có sự nhầm lẫn, vui lòng liên hệ Ban Giám Hiệu hoặc Thư ký hội đồng.
                </p>
                <button
                  onClick={onClose}
                  style={{ padding: '10px 24px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Đóng Cửa Sổ
                </button>
              </div>
            </div>
          ) : (
            /* TRƯỜNG HỢP 3: ĐÃ ĐƯỢC PHÊ DUYỆT (VÀO PHÒNG HỌP CHÍNH THỨC) */
            <div style={styles.videoStage}>

              {/* ĐỘNG CƠ 1: JITSI MEET NHÚNG */}
              {activeEngine === 'jitsi' && (
                <div style={styles.jitsiWrapper}>
                  {/* THANH ĐIỀU KHIỂN MÁY CHỦ & HƯỚNG DẪN BẢO MẬT JITSI */}
                  <div style={styles.jitsiTopToolbar}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Server size={14} color="#38bdf8" /> Máy chủ: <strong>meet.jit.si</strong> (Jitsi Cloud 8x8)
                      </span>

                      <a
                        href={`https://meet.jit.si/${cleanRoomName}`}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.btnOpenNewTabHighlight}
                        title="Mở phòng họp trong tab mới - Không giới hạn 5 phút, miễn phí 100%, chạy mượt như Google Meet"
                      >
                        <ExternalLink size={14} /> 🚀 Mở Trong Tab Mới (Không Giới Hạn Thời Gian)
                      </a>

                      <button
                        onClick={() => setJitsiReloadKey(k => k + 1)}
                        style={styles.btnSmallGhost}
                        title="Tải lại kết nối Jitsi nếu gặp sự cố mạng"
                      >
                        <RefreshCw size={13} /> Tải lại phòng
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => setShowPermissionGuide(true)}
                        style={styles.btnGuideHighlight}
                        title="Xem hướng dẫn cấp quyền Camera và Micro trên trình duyệt"
                      >
                        <Lock size={13} /> Hướng Dẫn Mở Quyền Cam/Mic
                      </button>
                    </div>
                  </div>

                  {/* BANNER HƯỚNG DẪN DÀNH CHO BGH VÀ GIÁO VIÊN */}
                  <div style={styles.jitsiHostNoticeBanner}>
                    <Info size={16} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '12.5px', color: '#e0f2fe', lineHeight: 1.5 }}>
                      <strong>💡 Họp Hội Đồng Sư Phạm Không Giới Hạn Thời Gian:</strong> Do chính sách thương mại của Jitsi 8x8 hiển thị thông báo giới hạn 5 phút khi nhúng iframe trên web, Thầy/Cô hãy click ngay nút <strong>"🚀 Mở Trong Tab Mới (Không Giới Hạn Thời Gian)"</strong> màu xanh phía trên. Khi mở trên tab riêng, cuộc họp được <strong>HOÀN TOÀN MIỄN PHÍ, KHÔNG BỊ GIỚI HẠN 5 PHÚT</strong> và chạy cực kỳ mượt mà như Google Meet!<br />
                      👉 <em>Mẹo thêm:</em> Tab quản trị này vẫn giữ mở song song để hệ thống tự động ghi nhận điểm danh, biểu quyết và xuất biên bản Word cho Thầy/Cô.
                    </div>
                  </div>

                  {jitsiLoading && (
                    <div style={styles.centerLoading}>
                      <RefreshCw size={36} color="#38bdf8" className="animate-spin" />
                      <p style={{ marginTop: '12px', color: '#cbd5e1', fontSize: '14px' }}>
                        Đang kết nối vào phòng họp Hội Đồng Sư Phạm ({jitsiServer})...
                      </p>
                    </div>
                  )}
                  <div ref={jitsiContainerRef} style={{ width: '100%', height: '100%', flex: 1 }} />
                </div>
              )}

              {/* ĐỘNG CƠ 2: WEBRTC P2P NỘI BỘ */}
              {activeEngine === 'webrtc' && (() => {
                const hasLocalVideo = Boolean(localStream && localStream.getVideoTracks().length > 0 && localStream.getVideoTracks().some(t => t.enabled && t.readyState === 'live') && !isVideoMuted);
                const hasLocalAudio = Boolean(localStream && localStream.getAudioTracks().length > 0 && localStream.getAudioTracks().some(t => t.enabled && t.readyState === 'live') && !isMicMuted);

                return (
                  <div style={styles.webrtcWrapper}>
                    {mediaError && !dismissedMediaWarning && (
                      <div style={mediaError?.type === 'info' ? styles.mediaInfoBanner : styles.mediaWarningBanner}>
                        <AlertCircle size={16} style={{ flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: '12.5px' }}>
                          {typeof mediaError === 'string' ? mediaError : mediaError.text}
                        </span>
                        <button
                          onClick={() => setShowPermissionGuide(true)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: mediaError?.type === 'info' ? '#0369a1' : '#b45309',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontSize: '12px',
                            padding: '2px 8px'
                          }}
                        >
                          Xem Hướng Dẫn Mở Quyền
                        </button>
                        <button
                          onClick={() => setDismissedMediaWarning(true)}
                          style={{
                            background: 'rgba(0, 0, 0, 0.08)',
                            border: 'none',
                            borderRadius: '4px',
                            color: mediaError?.type === 'info' ? '#0369a1' : '#78350f',
                            cursor: 'pointer',
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            marginLeft: '4px'
                          }}
                          title="Đóng thông báo này"
                        >
                          ✕ Đóng
                        </button>
                      </div>
                    )}

                    <div style={styles.videoGrid(Object.keys(remotePeers).length + 1)}>
                      {/* Video hoặc Thẻ Đại Biểu của chính mình */}
                      <div style={styles.videoCard}>
                        {hasLocalVideo || isScreenSharing ? (
                          <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            style={styles.videoElement(true)}
                          />
                        ) : (
                          <div style={styles.delegateCardInner}>
                            <div style={styles.delegateAvatarRing}>
                              <div style={styles.delegateAvatarCircle}>
                                {userDisplayName.split(' ').filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase() || 'CBQ'}
                              </div>
                            </div>
                            <div style={styles.delegateNameText}>{userDisplayName}</div>
                            <div style={styles.delegateDeptText}>Tổ {userDepartment}</div>

                            <div style={styles.delegateStatusPill}>
                              {hasLocalAudio ? (
                                <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Mic size={13} /> Mic Đang Bật
                                </span>
                              ) : isMicMuted ? (
                                <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <MicOff size={13} /> Đang Tắt Mic
                                </span>
                              ) : (
                                <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Headphones size={13} /> Chế Độ Chỉ Lắng Nghe
                                </span>
                              )}
                            </div>

                            {/* Các nút thao tác nhanh ngay trên thẻ */}
                            <div style={styles.delegateActionsRow}>
                              <button
                                onClick={requestMediaAgain}
                                style={styles.delegateActionBtn}
                                title="Bật lại Mic / Camera hoặc xin cấp quyền từ trình duyệt"
                              >
                                <RefreshCw size={12} /> Cấp Quyền Mic / Cam
                              </button>
                              <button
                                onClick={toggleScreenShare}
                                style={styles.delegateActionBtnAccent}
                                title="Chia sẻ slide bài giảng / tài liệu màn hình (hoạt động tốt ngay cả khi không có webcam)"
                              >
                                <MonitorUp size={12} /> Chia Sẻ Màn Hình
                              </button>
                              <button
                                onClick={() => setShowPermissionGuide(true)}
                                style={styles.delegateActionBtnGhost}
                                title="Xem hướng dẫn bấm biểu tượng ổ khóa 🔒 trên thanh URL để cho phép Mic/Cam"
                              >
                                <Lock size={12} /> Hướng Dẫn Mở Quyền
                              </button>
                            </div>
                          </div>
                        )}

                        <div style={styles.videoOverlay}>
                          <span style={styles.videoNameBadge}>
                            👤 Bạn ({userDisplayName}) {isScreenSharing && '🖥️ (Đang phát màn hình)'}
                          </span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {isMicMuted && <span style={styles.badgeMuted}><MicOff size={12} /></span>}
                            {(!hasLocalVideo && !isScreenSharing) && <span style={styles.badgeMuted}><VideoOff size={12} /></span>}
                          </div>
                        </div>
                      </div>

                      {/* Video hoặc Thẻ Đại Biểu của các đồng chí từ xa */}
                      {Object.entries(remotePeers).map(([peerId, peer]) => {
                        const hasRemoteVid = Boolean(peer.stream && peer.stream.getVideoTracks().length > 0 && peer.stream.getVideoTracks().some(t => t.enabled && t.readyState === 'live'));
                        return (
                          <div key={peerId} style={styles.videoCard}>
                            {/* Audio stream để luôn nghe được tiếng */}
                            <audio
                              autoPlay
                              ref={el => { if (el && peer.stream) el.srcObject = peer.stream; }}
                            />
                            {hasRemoteVid ? (
                              <video
                                autoPlay
                                playsInline
                                ref={el => { if (el && peer.stream) el.srcObject = peer.stream; }}
                                style={styles.videoElement(false)}
                              />
                            ) : (
                              <div style={styles.delegateCardInner}>
                                <div style={styles.delegateAvatarRing}>
                                  <div style={styles.delegateAvatarCircle}>
                                    {(peer.peerName || 'CBQ').split(' ').filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase() || 'GV'}
                                  </div>
                                </div>
                                <div style={styles.delegateNameText}>{peer.peerName}</div>
                                <div style={styles.delegateStatusPill}>
                                  <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Volume2 size={13} color="#38bdf8" /> Đại Biểu Trực Tuyến
                                  </span>
                                </div>
                              </div>
                            )}
                            <div style={styles.videoOverlay}>
                              <span style={styles.videoNameBadge}>
                                👤 {peer.peerName}
                              </span>
                            </div>
                          </div>
                        );
                      })}
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

                      <button
                        onClick={() => setShowPermissionGuide(true)}
                        style={styles.controlBtn(false, '#0284c7', '#334155')}
                        title="Xem hướng dẫn cấp quyền Micro / Camera"
                      >
                        <Lock size={18} />
                      </button>
                    </div>
                  </div>
                );
              })()}

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
                        ⚠️ Ban Giám Hiệu chưa gắn đường link phòng họp ngoài. Vui lòng chuyển sang tab <strong>1. Jitsi Hội Đồng</strong> hoặc <strong>2. WebRTC P2P</strong> để họp ngay trên web trường!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BẢNG ĐIỀU HÀNH HỘI NGHỊ ĐỒNG BỘ (SIDE PANEL) */}
          {isSidePanelOpen && myAdmissionStatus === 'admitted' && (
            <div style={styles.sidePanel}>
              
              {/* TABS CỦA BẢNG ĐIỀU HÀNH */}
              <div style={styles.sideNav}>
                <button
                  onClick={() => setActiveSideTab('attendance')}
                  style={styles.sideTabBtn(activeSideTab === 'attendance')}
                >
                  <Users size={14} /> Điểm Danh
                </button>
                <button
                  onClick={() => setActiveSideTab('poll')}
                  style={styles.sideTabBtn(activeSideTab === 'poll')}
                >
                  <Vote size={14} /> Biểu Quyết
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setActiveSideTab('lobby')}
                    style={styles.sideTabBtn(activeSideTab === 'lobby')}
                  >
                    <Shield size={14} /> Duyệt ({waitingList.length})
                  </button>
                )}
                <button
                  onClick={() => setActiveSideTab('minutes')}
                  style={styles.sideTabBtn(activeSideTab === 'minutes')}
                >
                  <FileText size={14} /> Thư Ký
                </button>
              </div>

              {/* TAB 1: ĐIỂM DANH */}
              {activeSideTab === 'attendance' && (
                <div style={styles.tabContent}>
                  {/* QUẢN TRỊ VIÊN: BẬT / TẮT CỔNG ĐIỂM DANH */}
                  {isAdmin && (
                    <div style={{ marginBottom: '14px', padding: '10px 12px', backgroundColor: isCheckinOpen ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isCheckinOpen ? '#bbf7d0' : '#fecaca'}`, borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: isCheckinOpen ? '#16a34a' : '#dc2626' }}>
                          {isCheckinOpen ? '🟢 CỔNG ĐIỂM DANH: ĐANG MỞ' : '🔒 CỔNG ĐIỂM DANH: ĐANG KHÓA'}
                        </span>
                        <button
                          onClick={handleToggleCheckinGate}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: isCheckinOpen ? '#fee2e2' : '#dcfce7',
                            color: isCheckinOpen ? '#b91c1c' : '#15803d',
                            border: `1px solid ${isCheckinOpen ? '#fca5a5' : '#86efac'}`,
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          {isCheckinOpen ? 'Khóa Cổng' : 'Mở Cổng Điểm Danh'}
                        </button>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {isCheckinOpen ? 'Thầy/Cô có thể tự bấm điểm danh có mặt trong hội nghị.' : 'Đang đóng cổng. Thầy/Cô chưa thể điểm danh.'}
                      </div>
                    </div>
                  )}

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
                        <span>Ghi nhận: <strong>{new Date(myAttendance.checkin_time).toLocaleTimeString('vi-VN')}</strong> ({myAttendance.staff_name} - {myAttendance.department})</span>
                      ) : (
                        <span>{isAdmin ? 'Ban Giám Hiệu điều hành phiên họp.' : 'Hệ thống chưa ghi nhận điểm danh của bạn.'}</span>
                      )}
                    </div>

                    {/* NẾU LÀ GIÁO VIÊN VÀ CHƯA ĐIỂM DANH: CHO PHÉP NHẬP / CHỌN TÊN */}
                    {!isAdmin && (!myAttendance || myAttendance.status !== 'PRESENT') && (
                      <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                          Xác nhận danh tính giáo viên:
                        </div>
                        <div style={{ marginBottom: '6px' }}>
                          <label style={{ display: 'block', fontSize: '10.5px', color: '#64748b', marginBottom: '2px' }}>Tổ Chuyên môn:</label>
                          <select
                            value={departmentInput}
                            onChange={e => setDepartmentInput(e.target.value)}
                            style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11.5px', backgroundColor: '#fff' }}
                          >
                            {DEFAULT_DEPARTMENTS.map((d, i) => (
                              <option key={i} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '10.5px', color: '#64748b', marginBottom: '2px' }}>Họ và Tên của Thầy/Cô:</label>
                          <input
                            type="text"
                            placeholder="Nhập đầy đủ Họ và Tên..."
                            value={displayNameInput}
                            onChange={e => setDisplayNameInput(e.target.value)}
                            style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11.5px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                    )}

                    {(!myAttendance || myAttendance.status !== 'PRESENT') && (
                      <button
                        onClick={handleAutoCheckin}
                        disabled={checkingIn || (!isAdmin && !isCheckinOpen)}
                        style={{
                          ...styles.btnCheckinNow,
                          opacity: (!isAdmin && !isCheckinOpen) ? 0.6 : 1,
                          cursor: (!isAdmin && !isCheckinOpen) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {checkingIn ? 'Đang xác thực...' : (isAdmin ? '✨ Điểm Danh Ban Giám Hiệu' : '✨ Điểm Danh Ngay Cho Tôi')}
                      </button>
                    )}

                    {!isAdmin && !isCheckinOpen && (!myAttendance || myAttendance.status !== 'PRESENT') && (
                      <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={13} /> Cổng điểm danh đang tạm khóa. Vui lòng chờ BGH mở cổng!
                      </div>
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
                        Đã Vào Phòng ({attendances.filter(a => a.status === 'PRESENT').length} người)
                      </span>
                      <button onClick={onRefreshAttendances} style={styles.btnRefreshSmall} title="Làm mới">
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

              {/* TAB 3: PHÊ DUYỆT PHÒNG CHỜ (CHỦ TỌA) */}
              {isAdmin && activeSideTab === 'lobby' && (
                <div style={styles.tabContent}>
                  <div style={{ marginBottom: '14px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#166534' }}>Chế Độ Phòng Chờ:</span>
                      <button
                        onClick={() => handleToggleLobby(!isLobbyEnabled)}
                        style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', backgroundColor: isLobbyEnabled ? '#f59e0b' : '#10b981', color: '#fff', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        {isLobbyEnabled ? 'ĐANG BẬT' : 'ĐANG TẮT'}
                      </button>
                    </div>
                    <p style={{ fontSize: '11px', color: '#475569', margin: '4px 0 0 0' }}>
                      {isLobbyEnabled ? 'Giáo viên vào phòng phải đợi bạn duyệt.' : 'Giáo viên có link được vào họp tự do.'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
                      Đang Đợi ({waitingList.length})
                    </span>
                    {waitingList.length > 0 && (
                      <button
                        onClick={handleAdmitAll}
                        style={{ padding: '4px 10px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        ✓ Duyệt Tất Cả
                      </button>
                    )}
                  </div>

                  {waitingList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 10px', color: '#94a3b8' }}>
                      <UserCheck size={32} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
                      <p style={{ fontSize: '13px', margin: 0 }}>Không có ai đang ở phòng chờ</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {waitingList.map((waitUser) => (
                        <div key={waitUser.peerId} style={styles.waitingItemRow}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>{waitUser.peerName}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>Tổ {waitUser.department}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleAdmitOne(waitUser.peerId)}
                              style={styles.btnAdmit}
                              title="Cho phép vào"
                            >
                              <UserCheck size={14} /> Duyệt
                            </button>
                            <button
                              onClick={() => handleRejectOne(waitUser.peerId)}
                              style={styles.btnReject}
                              title="Từ chối"
                            >
                              <UserX size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: THƯ KÝ GHI CHÚ & XUẤT BIÊN BẢN */}
              {activeSideTab === 'minutes' && (
                <div style={styles.tabContent}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '6px' }}>
                      Diễn Biến & Ghi Chú Cuộc Họp:
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
                </div>
              )}
            </div>
          )}

        </div>

        {/* MODAL HƯỚNG DẪN CẤP QUYỀN CAMERA & MICRO */}
        {showPermissionGuide && (
          <div style={styles.guideModalBackdrop} onClick={() => setShowPermissionGuide(false)}>
            <div style={styles.guideModalCard} onClick={e => e.stopPropagation()}>
              <div style={styles.guideModalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={22} color="#0284c7" />
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
                    Hướng Dẫn Bật Camera & Micro Cho Trình Duyệt
                  </h3>
                </div>
                <button
                  onClick={() => setShowPermissionGuide(false)}
                  style={styles.guideModalCloseBtn}
                  title="Đóng hướng dẫn"
                >
                  ✕
                </button>
              </div>

              <div style={styles.guideModalBody}>
                <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px', lineHeight: 1.5 }}>
                  Để phát biểu hoặc bật hình ảnh trong phòng họp trực tuyến, trình duyệt Chrome / Cốc Cốc / Edge cần được cấp quyền sử dụng Micro và Camera:
                </p>

                {/* 3 BƯỚC HƯỚNG DẪN TRỰC QUAN */}
                <div style={styles.guideStepBox}>
                  <div style={styles.guideStepNumber}>1</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={styles.guideStepTitle}>Bấm vào biểu tượng Ổ Khóa 🔒 trên thanh địa chỉ</h4>
                    <p style={styles.guideStepDesc}>
                      Nhìn lên góc trên cùng bên trái của trình duyệt (ngay bên trái chữ <code>localhost</code> hoặc tên miền web trường), Thầy/Cô click vào biểu tượng <strong>Ổ khóa 🔒</strong> hoặc nút <strong>Thông tin trang web</strong>.
                    </p>
                  </div>
                </div>

                <div style={styles.guideStepBox}>
                  <div style={styles.guideStepNumber}>2</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={styles.guideStepTitle}>Chuyển Máy ảnh & Micrô sang "Cho phép" (Allow)</h4>
                    <p style={styles.guideStepDesc}>
                      Tại bảng menu thả xuống, tìm 2 mục: <strong>Máy ảnh (Camera)</strong> và <strong>Micrô (Microphone)</strong>, gạt công tắc sang màu xanh hoặc chọn <strong>"Cho phép"</strong>. (Nếu không thấy, click chọn dòng <em>"Cài đặt trang web / Site settings"</em>).
                    </p>
                  </div>
                </div>

                <div style={styles.guideStepBox}>
                  <div style={styles.guideStepNumber}>3</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={styles.guideStepTitle}>Tải lại trang hoặc Bấm "Thử lại kết nối"</h4>
                    <p style={styles.guideStepDesc}>
                      Sau khi cấp quyền, Thầy/Cô bấm phím <strong>F5</strong> để tải lại hoặc bấm nút <strong>"Thử Lại Ngay"</strong> bên dưới để hệ thống nhận diện thiết bị ngay!
                    </p>
                  </div>
                </div>

                {/* LƯU Ý KHI DÙNG LAPTOP VÀ GOOGLE MEET */}
                <div style={styles.guideConflictBox}>
                  <strong>⚡ LƯU Ý KHI DÙNG LAPTOP & GOOGLE MEET:</strong>
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#713f12', lineHeight: 1.5 }}>
                    1. <strong>Quyền trình duyệt cấp theo từng tên miền:</strong> Google Meet chạy trên trang <code>meet.google.com</code> đã được cấp quyền từ trước, còn trang web trường chạy ở địa chỉ này nên Chrome/Edge cần Thầy/Cô bấm vào Ổ khóa 🔒 và chọn "Cho phép" riêng.<br />
                    2. <strong>Xung đột độc quyền phần cứng:</strong> Nếu Thầy/Cô đang mở tab Google Meet và bật Camera ở đó, hệ điều hành Windows trên Laptop sẽ khóa Camera và không cho trang khác truy cập cùng lúc. Thầy/Cô chỉ cần <strong>Tắt Camera ở tab Google Meet</strong> (hoặc đóng tab Google Meet) rồi quay lại đây bấm <strong>"Thử Lại Ngay"</strong> là Camera của laptop sẽ hiển thị lập tức!
                  </div>
                </div>

                {/* LƯU Ý DÀNH CHO MÁY TÍNH BÀN PC */}
                <div style={styles.guideNoteBox}>
                  <strong>💡 Lưu ý quan trọng cho Máy tính bàn (PC) không có Webcam/Mic:</strong>
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#1e40af', lineHeight: 1.5 }}>
                    Thầy/Cô vẫn tham gia cuộc họp bình thường ở chế độ <strong>"Chỉ lắng nghe"</strong>. Khi cần báo cáo, Thầy/Cô có thể bấm nút <strong>"🖥️ Chia Sẻ Màn Hình"</strong> để trình chiếu slide PowerPoint, file Word hoặc báo cáo tài liệu cho toàn trường xem mà không cần phải có camera!
                  </div>
                </div>
              </div>

              <div style={styles.guideModalFooter}>
                <button
                  onClick={() => {
                    setShowPermissionGuide(false);
                    if (activeEngine === 'webrtc') {
                      requestMediaAgain();
                    } else if (activeEngine === 'jitsi') {
                      setJitsiReloadKey(k => k + 1);
                    }
                  }}
                  style={styles.guideModalPrimaryBtn}
                >
                  <RefreshCw size={14} /> Tôi Đã Cấp Quyền - Thử Lại Ngay
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// =========================================================================
// BẢNG PHONG CÁCH GIAO DIỆN (STYLES)
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
    maxWidth: '320px',
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
    borderRadius: '4px'
  },
  badgeHost: {
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    padding: '2px 6px',
    borderRadius: '4px'
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
    cursor: 'pointer'
  }),
  btnShareLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 12px',
    borderRadius: '8px',
    backgroundColor: '#059669',
    color: '#ffffff',
    border: 'none',
    fontWeight: 'bold',
    fontSize: '12px',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)'
  },
  lobbyToggleBtn: isLobby => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 12px',
    borderRadius: '8px',
    backgroundColor: isLobby ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
    border: isLobby ? '1px solid #f59e0b' : '1px solid #10b981',
    color: isLobby ? '#fbbf24' : '#34d399',
    fontWeight: 'bold',
    fontSize: '12px',
    cursor: 'pointer'
  }),
  waitingBadgeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 12px',
    borderRadius: '8px',
    backgroundColor: '#ea580c',
    color: '#ffffff',
    border: 'none',
    fontWeight: 'bold',
    fontSize: '12px',
    cursor: 'pointer',
    animation: 'pulse 2s infinite'
  },
  iconBtn: active => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 12px',
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
    padding: '7px 12px',
    borderRadius: '8px',
    color: '#ffffff',
    backgroundColor: '#dc2626',
    border: 'none',
    fontWeight: 'bold',
    fontSize: '12px',
    cursor: 'pointer'
  },
  mainLayout: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden'
  },
  waitingRoomContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    padding: '24px'
  },
  waitingRoomCard: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '36px 32px',
    textAlign: 'center',
    maxWidth: '560px',
    width: '100%',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
  },
  waitingPulseRing: {
    width: '76px',
    height: '76px',
    borderRadius: '50%',
    backgroundColor: '#e0f2fe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto'
  },
  waitingInfoBox: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '14px 18px',
    textAlign: 'left',
    margin: '0 auto 20px auto'
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
    border: '1px solid #fcd34d',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  mediaInfoBanner: {
    backgroundColor: '#eff6ff',
    color: '#1e40af',
    border: '1px solid #bfdbfe',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
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
    justifyContent: 'center'
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
    cursor: 'pointer'
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
    maxWidth: '560px'
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
    textDecoration: 'none'
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
    gap: '4px',
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
    padding: '10px 18px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    borderRadius: '8px',
    border: 'none',
    fontWeight: 'bold',
    fontSize: '13px',
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
    cursor: 'pointer'
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
  waitingItemRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  btnAdmit: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    backgroundColor: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '11.5px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  btnReject: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 8px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
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
  },
  jitsiTopToolbar: {
    padding: '8px 16px',
    backgroundColor: '#0f172a',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '8px',
    flexShrink: 0
  },
  serverSelect: {
    padding: '6px 10px',
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '6px',
    fontSize: '12px',
    outline: 'none',
    cursor: 'pointer'
  },
  btnSmallGhost: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    color: '#94a3b8',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    fontSize: '11.5px',
    cursor: 'pointer'
  },
  btnOpenNewTab: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '11.5px',
    fontWeight: 'bold',
    textDecoration: 'none',
    cursor: 'pointer'
  },
  btnOpenNewTabHighlight: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 14px',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 'bold',
    textDecoration: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(22, 163, 74, 0.35)'
  },
  btnGuideHighlight: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    color: '#fbbf24',
    border: '1px solid #f59e0b',
    borderRadius: '6px',
    fontSize: '11.5px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  jitsiHostNoticeBanner: {
    padding: '10px 16px',
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderBottom: '1px solid rgba(2, 132, 199, 0.25)',
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start'
  },
  jitsiFfrnNoticeBanner: {
    padding: '8px 16px',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  delegateCardInner: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    textAlign: 'center',
    boxSizing: 'border-box'
  },
  delegateAvatarRing: {
    width: '84px',
    height: '84px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
    padding: '3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 20px rgba(56, 189, 248, 0.35)',
    marginBottom: '12px'
  },
  delegateAvatarCircle: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    backgroundColor: '#0f172a',
    color: '#38bdf8',
    fontSize: '22px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  delegateNameText: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#ffffff',
    maxWidth: '260px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  delegateDeptText: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '3px'
  },
  delegateStatusPill: {
    marginTop: '8px',
    padding: '4px 12px',
    borderRadius: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    fontSize: '11.5px',
    fontWeight: '500'
  },
  delegateActionsRow: {
    marginTop: '16px',
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  delegateActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    color: '#38bdf8',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    borderRadius: '6px',
    fontSize: '11.5px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  delegateActionBtnAccent: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: '#059669',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '11.5px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  delegateActionBtnGhost: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#cbd5e1',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '6px',
    fontSize: '11.5px',
    cursor: 'pointer'
  },
  guideModalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(5px)',
    zIndex: 10005,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px'
  },
  guideModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    maxWidth: '560px',
    width: '100%',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  guideModalHeader: {
    padding: '14px 20px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc'
  },
  guideModalCloseBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    color: '#64748b',
    cursor: 'pointer',
    padding: '4px 8px'
  },
  guideModalBody: {
    padding: '20px',
    maxHeight: '70vh',
    overflowY: 'auto'
  },
  guideStepBox: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
    padding: '12px 14px',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #e2e8f0'
  },
  guideStepNumber: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  guideStepTitle: {
    fontSize: '13.5px',
    fontWeight: 'bold',
    color: '#0f172a',
    margin: '0 0 4px 0'
  },
  guideStepDesc: {
    fontSize: '12.5px',
    color: '#64748b',
    margin: 0,
    lineHeight: 1.5
  },
  guideNoteBox: {
    padding: '12px 14px',
    backgroundColor: '#eff6ff',
    borderRadius: '10px',
    border: '1px solid #bfdbfe',
    fontSize: '13px',
    color: '#1e40af',
    marginTop: '6px'
  },
  guideConflictBox: {
    padding: '12px 14px',
    backgroundColor: '#fefce8',
    borderRadius: '10px',
    border: '1px solid #fef08a',
    fontSize: '13px',
    color: '#713f12',
    marginTop: '10px'
  },
  guideModalFooter: {
    padding: '12px 20px',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    display: 'flex',
    justifyContent: 'flex-end'
  },
  guideModalPrimaryBtn: {
    padding: '9px 18px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  }
};
