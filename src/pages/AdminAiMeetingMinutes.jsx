import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  Mic, MicOff, Square, Play, Pause, RefreshCw, Sparkles, 
  FileText, Download, Save, CheckCircle2, AlertCircle, Clock, 
  Upload, ChevronRight, Edit3, 
  Volume2, Eye, Copy, X,
  ChevronDown, ChevronUp, Maximize2, Minimize2,
  ExternalLink, SlidersHorizontal
} from 'lucide-react';
import { 
  synthesizeMeetingMinutesAi, 
  transcribeAudioFileWithAi,
  exportMeetingMinutesToWord, 
  generateHeuristicMinutes,
  saveMeetingMinutesToDb, 
  PRESET_MEETING_SCENARIOS 
} from '../services/aiMeetingMinutesService';
import { 
  getStoredAiKey, 
  getStoredAiModel, 
  AI_MODELS, 
  testGeminiConnection 
} from '../services/aiAssistantService';
import { OnlineMeetingService } from '../services/onlineMeetingService';

export default function AdminAiMeetingMinutes() {
  const defaultScenario = PRESET_MEETING_SCENARIOS[0];

  // Trạng thái ghi âm
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcript, setTranscript] = useState(defaultScenario.sampleTranscript);
  const [liveInterimText, setLiveInterimText] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [showMicrophoneGuide, setShowMicrophoneGuide] = useState(false);
  const [micErrorInfo, setMicErrorInfo] = useState(null);

  // Trạng thái AI
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [selectedModel, setSelectedModel] = useState(getStoredAiModel());
  const [aiStatus, setAiStatus] = useState({ tested: false, success: false, message: '' });
  const [activeTab, setActiveTab] = useState('minutes'); // 'minutes' | 'action_items' | 'transcript'
  const [mobileViewTab, setMobileViewTab] = useState('studio'); // 'studio' | 'minutes'
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);
  const [transcribingStatusMsg, setTranscribingStatusMsg] = useState('');
  const [uploadedAudioInfo, setUploadedAudioInfo] = useState(null);

  // Thông tin cuộc họp
  const [meetingsList, setMeetingsList] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [meetingTitle, setMeetingTitle] = useState(defaultScenario.title);
  const [meetingType, setMeetingType] = useState(defaultScenario.meetingType);
  const [location, setLocation] = useState(defaultScenario.location);
  const [chairPerson, setChairPerson] = useState(defaultScenario.chairPerson);
  const [secretary, setSecretary] = useState(defaultScenario.secretary);
  const [attendeesCount, setAttendeesCount] = useState('86/88 cán bộ, giáo viên (Vắng 02 có phép)');

  // Dữ liệu biên bản sau tổng hợp (mặc định sẵn sàng 100% để xem và xuất Word ngay)
  const [generatedMinutes, setGeneratedMinutes] = useState(() => 
    generateHeuristicMinutes(defaultScenario.sampleTranscript, {
      title: defaultScenario.title,
      meetingType: defaultScenario.meetingType,
      location: defaultScenario.location,
      chairPerson: defaultScenario.chairPerson,
      secretary: defaultScenario.secretary
    })
  );
  const [copiedToast, setCopiedToast] = useState(false);
  const [isSavedDb, setIsSavedDb] = useState(false);
  const [wordExportToast, setWordExportToast] = useState(null);

  // Chế độ xem & Thu gọn tinh ý (Compact Mode / Collapsible Panels)
  const [isCompactMode, setIsCompactMode] = useState(true); // Mặc định chế độ gọn gàng tinh ý
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false); // Header thu gọn mặc định để tiết kiệm diện tích
  const [isPresetsExpanded, setIsPresetsExpanded] = useState(false); // Kịch bản mẫu (thu gọn thành hàng chip)
  const [isMetaExpanded, setIsMetaExpanded] = useState(false); // Thông tin hành chính (thu gọn thành tóm tắt 1 chạm)
  const [isFullScreenMinutes, setIsFullScreenMinutes] = useState(false); // Phóng to toàn màn hình biên bản

  // Audio & Speech Recognition Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const speechRecognitionRef = useRef(null);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load danh sách cuộc họp có sẵn
  useEffect(() => {
    loadInitialMeetings();
    checkAiKeyStatus();
  }, []);

  const loadInitialMeetings = async () => {
    try {
      const allMeetings = await OnlineMeetingService.getAllMeetings();
      setMeetingsList(allMeetings);
      if (allMeetings.length > 0) {
        setSelectedMeetingId(allMeetings[0].id);
        setMeetingTitle(allMeetings[0].title);
        setLocation(allMeetings[0].location || 'Hội trường lớn - Trường THPT Cao Bá Quát');
      }
    } catch (e) {
      console.warn('Lỗi đọc danh sách cuộc họp:', e);
    }
  };

  const checkAiKeyStatus = async () => {
    const key = getStoredAiKey();
    if (!key) {
      setAiStatus({
        tested: true,
        success: false,
        message: 'Đang chạy chế độ Trợ lý AI Nội bộ (Chưa gán Gemini Key)'
      });
      return;
    }
    const res = await testGeminiConnection(key, selectedModel);
    setAiStatus({
      tested: true,
      success: res.success,
      message: res.success ? `Kết nối Google Gemini ${selectedModel} sẵn sàng (${res.latencyMs}ms)` : res.error
    });
  };

  // ==================== QUẢN LÝ BỘ ĐẾM THỜI GIAN GHI ÂM ====================
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  // Định dạng thời gian MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ==================== BẮT ĐẦU GHI ÂM & NHẬN DIỆN GIỌNG NÓI ====================
  const startRecording = async () => {
    // 0. Kiểm tra hỗ trợ của trình duyệt & Secure Context (HTTPS / localhost)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicErrorInfo({
        code: 'NOT_SUPPORTED',
        title: 'Trình Duyệt Hoặc Kết Nối Chưa Hỗ Trợ Micro',
        message: window.isSecureContext === false
          ? 'Trình duyệt yêu cầu kết nối bảo mật HTTPS hoặc http://localhost để mở Micro. Nếu Thầy/Cô đang mở trang bằng IP mạng LAN (ví dụ: http://192.168.x.x:5173), vui lòng truy cập bằng http://localhost:5173 trên máy chủ hoặc cấu hình HTTPS.'
          : 'Trình duyệt hiện tại không hỗ trợ API ghi âm MediaDevices. Thầy/Cô vui lòng sử dụng Google Chrome, Cốc Cốc hoặc Microsoft Edge mới nhất.'
      });
      setShowMicrophoneGuide(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // 1. Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start(250); // Thu thập dữ liệu mỗi 250ms
      setIsRecording(true);
      setIsPaused(false);
      setRecordingSeconds(0);
      setShowMicrophoneGuide(false);
      setMicErrorInfo(null);

      // 2. Setup Web Speech Recognition API (Tiếng Việt vi-VN)
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          let interim = '';
          let finalChunk = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalChunk += event.results[i][0].transcript + ' ';
            } else {
              interim += event.results[i][0].transcript;
            }
          }

          if (finalChunk) {
            setTranscript(prev => {
              const prefix = prev.trim().length > 0 ? prev.trim() + '\n' : '';
              return prefix + finalChunk.trim();
            });
          }
          setLiveInterimText(interim);
        };

        recognition.onerror = (err) => {
          console.warn('Speech recognition warning:', err.error);
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
      }
    } catch (err) {
      console.error('Lỗi khởi tạo micro ghi âm:', err);
      let errorData = {
        code: err.name || 'UNKNOWN',
        title: 'Không Thể Truy Cập Microphone Của Thiết Bị',
        message: 'Trình duyệt hoặc hệ điều hành Windows chưa cho phép trang web sử dụng Micro.'
      };

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorData = {
          code: 'PERMISSION_DENIED',
          title: 'Quyền Truy Cập Micro Đang Bị Chặn',
          message: 'Trình duyệt hoặc hệ điều hành Windows đang chặn quyền ghi âm. Vui lòng làm theo 3 bước bên dưới để mở lại quyền chỉ trong 30 giây.'
        };
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorData = {
          code: 'NO_DEVICE',
          title: 'Không Tìm Thấy Thiết Bị Micro Cắm Vào Máy',
          message: 'Máy tính chưa nhận diện được micro hoặc tai nghe có mic cắm vào cổng âm thanh USB / 3.5mm.'
        };
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorData = {
          code: 'CONFLICT',
          title: 'Micro Đang Bị Ứng Dụng Khác Chiếm Dụng',
          message: 'Micro đang được sử dụng độc quyền bởi Google Meet, Zoom, Zalo Call hoặc ứng dụng khác. Thầy/Cô vui lòng ngắt cuộc gọi trên ứng dụng đó rồi thử lại.'
        };
      }

      setMicErrorInfo(errorData);
      setShowMicrophoneGuide(true);
    }
  };

  // Tạm dừng ghi âm
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch (e) {}
      }
      setIsPaused(true);
    }
  };

  // Tiếp tục ghi âm
  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.start(); } catch (e) {}
      }
      setIsPaused(false);
    }
  };

  // Kết thúc ghi âm
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch (e) {}
      }
      setIsRecording(false);
      setIsPaused(false);
      setLiveInterimText('');
    }
  };

  // ==================== BÓC BĂNG FILE ÂM THANH BẰNG AI ====================
  const handleTranscribeCurrentAudio = async (fileToTranscribe = null) => {
    const file = fileToTranscribe || audioBlob;
    if (!file) {
      alert("Chưa có tệp âm thanh nào được nạp!");
      return null;
    }

    setIsTranscribingAudio(true);
    setTranscribingStatusMsg('🤖 AI Gemini 2.5 Flash đang đọc và bóc băng âm thanh tiếng Việt...');
    try {
      const transcribedText = await transcribeAudioFileWithAi(file, {
        model: selectedModel,
        onProgress: (msg) => setTranscribingStatusMsg(msg)
      });

      if (transcribedText) {
        setTranscript(transcribedText);
        // Tự động gán tiêu đề nếu chưa sửa
        if (file.name && (!meetingTitle || meetingTitle.includes('Triển Khai Nhiệm Vụ'))) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
          setMeetingTitle(`Cuộc họp: ${cleanName}`);
        }
        alert(`🎉 AI Gemini đã đọc & bóc băng thành công!\n• Tệp: ${file.name || 'Ghi âm'}\n• Độ dài văn bản: ${transcribedText.length} ký tự.\n\nĐã nạp toàn bộ lời thoại vào hệ thống! Thầy/Cô hãy nhấn "Tổng Hợp Biên Bản Bằng AI" để hoàn tất biên bản.`);
        return transcribedText;
      }
    } catch (err) {
      console.error("Lỗi bóc băng audio:", err);
      alert(`⚠️ Không thể bóc băng tự động từ file âm thanh này: ${err.message}\n\nThầy/Cô có thể bấm nạp "Phiên họp sư phạm mẫu" hoặc gõ/dán ghi chú vào khung thoại.`);
      return null;
    } finally {
      setIsTranscribingAudio(false);
      setTranscribingStatusMsg('');
    }
  };

  // ==================== TẢI FILE ÂM THANH CÓ SẴN (NGOÀI MÁY) ====================
  const handleUploadAudioFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setAudioBlob(file);
    setUploadedAudioInfo({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: file.type || file.name.split('.').pop()
    });

    // Tự động kích hoạt AI bóc băng file âm thanh ngay lập tức
    await handleTranscribeCurrentAudio(file);
  };

  // ==================== CHỌN KỊCH BẢN MẪU (1-CLICK DEMO) ====================
  const handleSelectPresetScenario = (scenario) => {
    setMeetingTitle(scenario.title);
    setMeetingType(scenario.meetingType);
    setLocation(scenario.location);
    setChairPerson(scenario.chairPerson);
    setSecretary(scenario.secretary);
    setTranscript(scenario.sampleTranscript);
    setLiveInterimText('');
    const minutesData = generateHeuristicMinutes(scenario.sampleTranscript, {
      title: scenario.title,
      meetingType: scenario.meetingType,
      location: scenario.location,
      chairPerson: scenario.chairPerson,
      secretary: scenario.secretary
    });
    setGeneratedMinutes(minutesData);
    setIsSavedDb(false);
  };

  // ==================== GỌI AI TỔNG HỢP BIÊN BẢN CUỘC HỌP ====================
  const handleSynthesizeAi = async () => {
    let currentTranscript = transcript ? transcript.trim() : '';

    // Nếu chưa có transcript nhưng đã nạp file âm thanh -> Tự động bóc băng trước!
    if (!currentTranscript && audioBlob) {
      const transcribed = await handleTranscribeCurrentAudio(audioBlob);
      if (transcribed) {
        currentTranscript = transcribed.trim();
      } else {
        return;
      }
    }

    if (!currentTranscript || currentTranscript.length < 20) {
      alert('Vui lòng ghi âm giọng nói, tải file âm thanh hoặc chọn Kịch bản mẫu trước khi tổng hợp biên bản!');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const meetingInfo = {
        title: meetingTitle,
        meetingType,
        location,
        chairPerson,
        secretary,
        attendeesCount
      };

      const result = await synthesizeMeetingMinutesAi({
        transcript: currentTranscript,
        meetingInfo,
        model: selectedModel
      });

      setGeneratedMinutes(result);
      setActiveTab('minutes');
      setMobileViewTab('minutes'); // Tự động chuyển tab sang biên bản trên màn hình điện thoại!
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setIsSavedDb(false);
    } catch (err) {
      console.error('Lỗi tổng hợp biên bản AI:', err);
      alert('Đã xảy ra lỗi khi tổng hợp biên bản: ' + err.message);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // ==================== XUẤT FILE MICROSOFT WORD (NGHỊ ĐỊNH 30) ====================
  const handleExportWord = () => {
    try {
      let targetMinutes = generatedMinutes;
      // Nếu chưa có biên bản AI nhưng đã có văn bản ghi âm -> Tự động sinh biên bản thông minh ngay!
      if (!targetMinutes) {
        const textToUse = transcript.trim() || defaultScenario.sampleTranscript;
        targetMinutes = generateHeuristicMinutes(textToUse, {
          title: meetingTitle,
          meetingType,
          location,
          chairPerson,
          secretary,
          attendeesCount
        });
        setGeneratedMinutes(targetMinutes);
      }

      const res = exportMeetingMinutesToWord(targetMinutes);
      if (res?.success) {
        setWordExportToast({
          type: 'success',
          fileName: res.fileName,
          message: `Đã xuất tệp Word "${res.fileName}" thành công!`
        });
        setTimeout(() => setWordExportToast(null), 8000);
      }
    } catch (err) {
      console.error('Lỗi xuất file Word:', err);
      setWordExportToast({
        type: 'error',
        message: 'Lỗi xuất file Word: ' + err.message
      });
      setTimeout(() => setWordExportToast(null), 8000);
    }
  };

  // ==================== LƯU BIÊN BẢN VÀO KHO SỔ SÁCH ĐIỆN TỬ ====================
  const handleSaveToDb = async () => {
    if (!generatedMinutes) return;
    const meetingKey = selectedMeetingId || `hop_${Date.now()}`;
    const res = await saveMeetingMinutesToDb(meetingKey, generatedMinutes);
    if (res?.success) {
      setIsSavedDb(true);
      alert('✅ Đã lưu thành công biên bản cuộc họp vào CSDL Hồ Sơ Sổ Sách Điện Tử của nhà trường!');
    }
  };

  // Sao chép toàn bộ văn bản biên bản
  const handleCopyMinutes = () => {
    if (!generatedMinutes) return;
    const text = `
${generatedMinutes.title}
Thời gian: ${generatedMinutes.openingTime}
Địa điểm: ${generatedMinutes.location}
Chủ trì: ${generatedMinutes.chairPerson}
Thư ký: ${generatedMinutes.secretary}
Thành phần: ${generatedMinutes.attendeesCount}

I. DIỄN BIẾN CUỘC HỌP:
${generatedMinutes.proceedings.map(p => `- ${p.speaker} (${p.role}): ${p.summary}`).join('\n')}

II. KẾT LUẬN CỦA CHỦ TRÌ:
${generatedMinutes.conclusions.join('\n')}

III. PHÂN CÔNG NHIỆM VỤ:
${generatedMinutes.actionItems.map(a => `${a.stt}. ${a.task} | Phụ trách: ${a.assignee} | Hạn: ${a.deadline}`).join('\n')}

Biểu quyết: ${generatedMinutes.votingResult}
Bế mạc: ${generatedMinutes.closingTime}
    `.trim();

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  return (
    <Layout title="Trợ Lý Thư Ký AI: Ghi Âm Trực Tuyến & Soạn Thảo Biên Bản Cuộc Họp">
      <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px', paddingBottom: '90px' }}>
        
        {/* ================= HEADER BANNER THU GỌN TINH Ý ================= */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0369a1 100%)',
          borderRadius: '16px',
          padding: isHeaderExpanded ? '22px 24px' : '14px 20px',
          color: '#ffffff',
          boxShadow: '0 8px 25px rgba(15, 23, 42, 0.18)',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Sparkles size={20} color="#facc15" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h1 style={{ margin: 0, fontSize: isHeaderExpanded ? '22px' : '16.5px', fontWeight: '900', letterSpacing: '0.2px' }}>
                    Thư Ký AI: Ghi Âm & Soạn Thảo Biên Bản Cuộc Họp
                  </h1>
                  <span style={{ fontSize: '11px', background: 'rgba(250, 204, 21, 0.2)', color: '#fef08a', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                    Nghị Định 30/2020
                  </span>
                </div>
                {!isHeaderExpanded && (
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#cbd5e1' }}>
                    Ghi âm trực tuyến • Bóc băng giọng nói • Trích xuất ma trận việc & Xuất file Word (1-...)
                  </p>
                )}
              </div>
            </div>

            {/* THANH ĐIỀU KHIỂN: CHỌN MÔ HÌNH AI & NÚT CHI TIẾT */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* BADGE TRẠNG THÁI AI & CHỌN MODEL GỌN GÀNG */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(15, 23, 42, 0.6)', padding: '5px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: aiStatus.success ? '#22c55e' : '#eab308' }} />
                <select
                  value={selectedModel}
                  onChange={(e) => {
                    setSelectedModel(e.target.value);
                    testGeminiConnection(null, e.target.value).then(res => {
                      setAiStatus({
                        tested: true,
                        success: res.success,
                        message: res.success ? `Đã kết nối Gemini ${e.target.value}` : res.error
                      });
                    });
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '11.5px',
                    fontWeight: 'bold',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {AI_MODELS.map(m => (
                    <option key={m.id} value={m.id} style={{ background: '#0f172a', color: '#ffffff' }}>
                      {m.name.split('(')[0].trim()}
                    </option>
                  ))}
                </select>
              </div>

              {/* NÚT BẬT/TẮT THÔNG TIN CHI TIẾT */}
              <button
                onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                style={{
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title={isHeaderExpanded ? 'Thu gọn phần giới thiệu' : 'Mở rộng hướng dẫn chi tiết'}
              >
                {isHeaderExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                <span>{isHeaderExpanded ? 'Thu gọn' : 'Chi tiết'}</span>
              </button>
            </div>
          </div>

          {/* NỘI DUNG MỞ RỘNG KHI BẤM 'CHI TIẾT' */}
          {isHeaderExpanded && (
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.15)', fontSize: '12.5px', color: '#e2e8f0', lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 10px' }}>
                Module chuyển đổi số sư phạm năm học 2026 - 2027 phục vụ Ban Giám Hiệu, Thư ký Hội đồng và các Tổ Chuyên Môn Trường THPT Cao Bá Quát:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                <div style={{ background: 'rgba(255,255,255,0.06)', padding: '8px 10px', borderRadius: '8px' }}>
                  🎙️ <strong>Ghi âm trực tuyến:</strong> Nhận diện giọng nói thời gian thực và tự động tạo phụ đề.
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', padding: '8px 10px', borderRadius: '8px' }}>
                  🤖 <strong>AI Bóc Băng Tự Động:</strong> Tách biệt phát biểu của Chủ tọa, Thư ký và từng Tổ trưởng.
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', padding: '8px 10px', borderRadius: '8px' }}>
                  🎯 <strong>Ma Trận Nhiệm Vụ:</strong> Trích xuất việc cần làm, người phụ trách và hạn chót (Deadline).
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', padding: '8px 10px', borderRadius: '8px' }}>
                  📄 <strong>Xuất Word Nghị Định 30:</strong> File .doc chuẩn thể thức có tiền tố <code>1-...</code>.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= THANH ĐIỀU KHIỂN CHẾ ĐỘ THÔNG MINH (COMPACT / FULL) ================= */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          background: '#ffffff',
          padding: '10px 16px',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          {/* CÔNG TẮC CHẾ ĐỘ GỌN GÀNG TINH Ý */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <SlidersHorizontal size={14} color="#0284c7" /> Bố cục giao diện:
            </span>
            <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <button
                onClick={() => {
                  setIsCompactMode(true);
                  setIsPresetsExpanded(false);
                  setIsMetaExpanded(false);
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  backgroundColor: isCompactMode ? '#2563eb' : 'transparent',
                  color: isCompactMode ? '#ffffff' : '#64748b',
                  boxShadow: isCompactMode ? '0 1px 4px rgba(37,99,235,0.25)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s'
                }}
                title="Bố cục siêu gọn, thu nhỏ biểu mẫu để xem nhanh và xuất Word tức thì"
              >
                ⚡ Gọn Gàng
              </button>
              <button
                onClick={() => {
                  setIsCompactMode(false);
                  setIsPresetsExpanded(true);
                  setIsMetaExpanded(true);
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11.5px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  backgroundColor: !isCompactMode ? '#2563eb' : 'transparent',
                  color: !isCompactMode ? '#ffffff' : '#64748b',
                  boxShadow: !isCompactMode ? '0 1px 4px rgba(37,99,235,0.25)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s'
                }}
                title="Mở rộng đầy đủ tất cả các ô nhập liệu và danh sách kịch bản mẫu"
              >
                📐 Mở Rộng
              </button>
            </div>
          </div>

          {/* LIÊN KẾT NHANH SANG THƯ VIỆN MẪU LATENDOC */}
          <Link
            to="/can-chinh-nghi-dinh-30"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: '#eff6ff',
              color: '#1d4ed8',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              textDecoration: 'none',
              border: '1px solid #bfdbfe'
            }}
            title="Mở Thư viện 20+ mẫu văn bản A4 và bóc ảnh sang Word OCR"
          >
            <span>📑 Thư Viện Mẫu A4 (Latendoc)</span>
            <ExternalLink size={13} />
          </Link>
        </div>

        {/* RESPONSIVE STYLESHEET */}
        <style>{`
          .meeting-minutes-grid {
            display: grid;
            grid-template-columns: ${isFullScreenMinutes ? '1fr' : 'minmax(350px, 1fr) minmax(420px, 1.4fr)'};
            gap: 22px;
            align-items: start;
          }
          .mobile-tab-bar {
            display: none;
          }
          .mobile-only-back {
            display: none;
          }
          .spin-animation {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @media (max-width: 900px) {
            .meeting-minutes-grid {
              display: block !important;
            }
            .mobile-tab-bar {
              display: flex !important;
              position: sticky !important;
              top: 8px !important;
              z-index: 45 !important;
              backdrop-filter: blur(12px) !important;
              background: rgba(241, 245, 249, 0.95) !important;
              box-shadow: 0 4px 14px rgba(0,0,0,0.08) !important;
              border: 1px solid #cbd5e1 !important;
            }
            .mobile-only-back {
              display: block !important;
            }
            .left-panel-meeting {
              display: ${mobileViewTab === 'studio' && !isFullScreenMinutes ? 'flex' : 'none'} !important;
              width: 100% !important;
            }
            .right-panel-meeting {
              display: ${mobileViewTab === 'minutes' || isFullScreenMinutes ? 'flex' : 'none'} !important;
              width: 100% !important;
            }
          }
          ${isFullScreenMinutes ? `
            .left-panel-meeting {
              display: none !important;
            }
            .right-panel-meeting {
              width: 100% !important;
              max-width: 960px !important;
              margin: 0 auto !important;
            }
          ` : ''}
        `}</style>

        {/* THANH CHUYỂN TAB TRÊN DI ĐỘNG (STICKY MOBILE TAB BAR) */}
        <div className="mobile-tab-bar" style={{
          backgroundColor: '#e2e8f0',
          padding: '5px',
          borderRadius: '12px',
          gap: '6px',
          marginBottom: '12px'
        }}>
          <button
            onClick={() => {
              setMobileViewTab('studio');
              if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '9px',
              border: 'none',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              backgroundColor: mobileViewTab === 'studio' ? '#2563eb' : 'transparent',
              color: mobileViewTab === 'studio' ? '#ffffff' : '#475569',
              boxShadow: mobileViewTab === 'studio' ? '0 2px 8px rgba(37,99,235,0.25)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Mic size={16} /> 1. Phòng Thu & Nạp File
          </button>

          <button
            onClick={() => {
              setMobileViewTab('minutes');
              if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '9px',
              border: 'none',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              backgroundColor: mobileViewTab === 'minutes' ? '#2563eb' : 'transparent',
              color: mobileViewTab === 'minutes' ? '#ffffff' : '#475569',
              boxShadow: mobileViewTab === 'minutes' ? '0 2px 8px rgba(37,99,235,0.25)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <FileText size={16} /> 2. Biên Bản NĐ 30 {generatedMinutes ? '✨' : ''}
          </button>
        </div>

        {/* ================= BỐ CỤC 2 CỘT CHÍNH ================= */}
        <div className="meeting-minutes-grid">
          
          {/* ================= CỘT TRÁI: STUDIO GHI ÂM & THIẾT LẬP CUỘC HỌP ================= */}
          <div className="left-panel-meeting" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* THẺ STUDIO GHI ÂM TRỰC TUYẾN */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: isRecording ? '2px solid #ef4444' : '1px solid #e2e8f0',
              padding: '22px',
              boxShadow: isRecording ? '0 0 25px rgba(239, 68, 68, 0.2)' : '0 4px 16px rgba(0,0,0,0.04)',
              transition: 'all 0.3s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: isRecording ? '#fee2e2' : '#eff6ff',
                    color: isRecording ? '#dc2626' : '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Mic size={18} className={isRecording ? 'animate-pulse' : ''} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                      Phòng Thu Âm Cuộc Họp
                    </h3>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                      {isRecording 
                        ? (isPaused ? '⏸️ Tạm dừng thu âm' : '🔴 Đang ghi âm thời gian thực...') 
                        : 'Sẵn sàng ghi âm giọng nói diễn giả'}
                    </span>
                  </div>
                </div>

                {/* ĐỒNG HỒ ĐẾM THỜI GIAN */}
                <div style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: isRecording ? '#fef2f2' : '#f8fafc',
                  border: isRecording ? '1px solid #fecaca' : '1px solid #e2e8f0',
                  color: isRecording ? '#dc2626' : '#334155',
                  fontFamily: 'monospace',
                  fontSize: '18px',
                  fontWeight: '900',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Clock size={16} />
                  {formatTime(recordingSeconds)}
                </div>
              </div>

              {/* THANH ĐIỀU KHIỂN NÚT GHI ÂM */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    style={{
                      flex: 1,
                      padding: '12px 18px',
                      background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    <Mic size={17} /> Bắt Đầu Ghi Âm Trực Tuyến
                  </button>
                ) : (
                  <>
                    {isPaused ? (
                      <button
                        onClick={resumeRecording}
                        style={{
                          flex: 1,
                          padding: '11px 16px',
                          background: '#10b981',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Play size={16} /> Tiếp Tục
                      </button>
                    ) : (
                      <button
                        onClick={pauseRecording}
                        style={{
                          flex: 1,
                          padding: '11px 16px',
                          background: '#f59e0b',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Pause size={16} /> Tạm Dừng
                      </button>
                    )}

                    <button
                      onClick={stopRecording}
                      style={{
                        flex: 1,
                        padding: '11px 16px',
                        background: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Square size={16} /> Kết Thúc Ghi Âm
                    </button>
                  </>
                )}

                {/* NÚT TẢI FILE ÂM THANH CÓ SẴN TỪ MÁY */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadAudioFile}
                  accept="audio/*"
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '11px 14px',
                    background: '#f8fafc',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Nạp file âm thanh (.mp3, .m4a, .wav) từ máy ghi âm hoặc điện thoại"
                >
                  <Upload size={16} /> Tải File Âm Thanh
                </button>
              </div>

              {/* NGHE LẠI AUDIO & BÓC BĂNG BẰNG AI */}
              {audioUrl && (
                <div style={{
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Volume2 size={18} color="#2563eb" />
                      <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a' }}>
                        {uploadedAudioInfo?.name || 'Bản ghi âm cuộc họp'}
                      </span>
                      {uploadedAudioInfo?.size && (
                        <span style={{ fontSize: '11px', color: '#64748b', background: '#e2e8f0', padding: '1px 6px', borderRadius: '4px' }}>
                          {uploadedAudioInfo.size}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleTranscribeCurrentAudio()}
                      disabled={isTranscribingAudio}
                      style={{
                        padding: '6px 12px',
                        background: isTranscribingAudio ? '#94a3b8' : '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: isTranscribingAudio ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      {isTranscribingAudio ? <RefreshCw size={13} className="spin-animation" /> : <Sparkles size={13} />}
                      {isTranscribingAudio ? 'AI Đang Bóc Băng...' : '⚡ Bóc Băng Lại Bằng AI'}
                    </button>
                  </div>

                  <audio src={audioUrl} controls style={{ width: '100%', height: '36px', marginBottom: '8px' }} />

                  {isTranscribingAudio && (
                    <div style={{
                      backgroundColor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#1d4ed8',
                      fontSize: '12.5px',
                      fontWeight: '600'
                    }}>
                      <RefreshCw size={16} className="spin-animation" />
                      <span>{transcribingStatusMsg || 'AI Gemini 2.5 Flash đang nghe và nhận diện giọng nói...'}</span>
                    </div>
                  )}

                  {!isTranscribingAudio && transcript && (
                    <div style={{
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#15803d',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      <CheckCircle2 size={15} color="#16a34a" />
                      <span>Đã bóc băng thành công <strong>{transcript.length}</strong> ký tự lời thoại! Sẵn sàng tổng hợp biên bản.</span>
                    </div>
                  )}
                </div>
              )}

              {/* 3 KỊCH BẢN MẪU THỰC TẾ TRƯỜNG THPT (THU GỌN TINH Ý) */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#64748b' }}>
                    ⚡ KỊCH BẢN MẪU SƯ PHẠM (1-CHẠM):
                  </div>
                  <button
                    onClick={() => setIsPresetsExpanded(!isPresetsExpanded)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284c7',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    {isPresetsExpanded ? 'Thu gọn ▲' : 'Xem dạng danh sách ▼'}
                  </button>
                </div>

                {!isPresetsExpanded ? (
                  /* DẠNG CHIPS NGANG GỌN GÀNG (1 DÒNG DUY NHẤT) */
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {PRESET_MEETING_SCENARIOS.map(sc => {
                      const isSelected = meetingTitle === sc.title;
                      const shortLabel = sc.id === 'scenario_su_pham_thang' 
                        ? '🏫 Sơ kết 20/11' 
                        : (sc.id === 'scenario_giao_ban_bgh' ? '👔 Giao ban BGH' : '📚 Sinh hoạt tổ');
                      return (
                        <button
                          key={sc.id}
                          onClick={() => handleSelectPresetScenario(sc)}
                          style={{
                            padding: '6px 10px',
                            background: isSelected ? '#eff6ff' : '#f8fafc',
                            border: isSelected ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '11.5px',
                            fontWeight: isSelected ? 'bold' : '500',
                            color: isSelected ? '#1d4ed8' : '#334155',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            flexShrink: 0,
                            boxShadow: isSelected ? '0 1px 4px rgba(59,130,246,0.2)' : 'none',
                            transition: 'all 0.15s'
                          }}
                          title={`Áp dụng kịch bản: ${sc.title}`}
                        >
                          <span>{shortLabel}</span>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>({sc.audioDuration})</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* DẠNG DANH SÁCH CHI TIẾT ĐẦY ĐỦ */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {PRESET_MEETING_SCENARIOS.map(sc => (
                      <button
                        key={sc.id}
                        onClick={() => handleSelectPresetScenario(sc)}
                        style={{
                          padding: '8px 12px',
                          background: meetingTitle === sc.title ? '#eff6ff' : '#f8fafc',
                          border: meetingTitle === sc.title ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                          borderRadius: '8px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '12px',
                          color: '#1e293b',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0284c7'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = meetingTitle === sc.title ? '#3b82f6' : '#e2e8f0'}
                      >
                        <span><strong>{sc.title}</strong> ({sc.audioDuration})</span>
                        <ChevronRight size={14} color="#0284c7" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* THẺ THIẾT LẬP THÔNG TIN CUỘC HỌP (CHẾ ĐỘ THU GỌN TINH Ý) */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: isMetaExpanded ? '18px 20px' : '12px 16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMetaExpanded ? '12px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  <Edit3 size={16} color="#0284c7" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#0f172a' }}>
                        Thông Tin Phiên Họp
                      </span>
                      <span style={{ fontSize: '10.5px', background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                        Hành chính NĐ 30
                      </span>
                    </div>
                    {!isMetaExpanded && (
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <strong>{meetingTitle}</strong> • Chủ trì: {chairPerson} • Thư ký: {secretary}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setIsMetaExpanded(!isMetaExpanded)}
                  style={{
                    padding: '5px 10px',
                    background: isMetaExpanded ? '#f1f5f9' : '#eff6ff',
                    border: isMetaExpanded ? '1px solid #cbd5e1' : '1px solid #bfdbfe',
                    borderRadius: '8px',
                    color: isMetaExpanded ? '#475569' : '#1d4ed8',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0
                  }}
                  title={isMetaExpanded ? 'Thu gọn form để giao diện gọn gàng' : 'Mở rộng để chỉnh sửa chi tiết các trường'}
                >
                  {isMetaExpanded ? 'Thu gọn ▲' : 'Sửa form ✏️'}
                </button>
              </div>

              {isMetaExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px', marginTop: '8px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                  <div>
                    <label style={{ display: 'block', color: '#475569', fontWeight: 'bold', marginBottom: '3px' }}>Tiêu đề phiên họp (*)</label>
                    <input
                      type="text"
                      value={meetingTitle}
                      onChange={(e) => setMeetingTitle(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', fontWeight: 'bold', marginBottom: '3px' }}>Chủ tọa / Chủ trì</label>
                      <input
                        type="text"
                        value={chairPerson}
                        onChange={(e) => setChairPerson(e.target.value)}
                        style={{ width: '100%', padding: '7px 9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#475569', fontWeight: 'bold', marginBottom: '3px' }}>Thư ký ghi chép</label>
                      <input
                        type="text"
                        value={secretary}
                        onChange={(e) => setSecretary(e.target.value)}
                        style={{ width: '100%', padding: '7px 9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', fontWeight: 'bold', marginBottom: '3px' }}>Địa điểm tổ chức</label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        style={{ width: '100%', padding: '7px 9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#475569', fontWeight: 'bold', marginBottom: '3px' }}>Sĩ số đại biểu</label>
                      <input
                        type="text"
                        value={attendeesCount}
                        onChange={(e) => setAttendeesCount(e.target.value)}
                        style={{ width: '100%', padding: '7px 9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* NÚT KÍCH HOẠT TỔNG HỢP BIÊN BẢN BẰNG AI */}
            <button
              onClick={handleSynthesizeAi}
              disabled={isGeneratingAi || isTranscribingAudio || (!transcript.trim() && !audioBlob)}
              style={{
                padding: '14px 20px',
                background: (isGeneratingAi || isTranscribingAudio || (!transcript.trim() && !audioBlob)) ? '#94a3b8' : 'linear-gradient(135deg, #0284c7 0%, #1e40af 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '900',
                fontSize: '15px',
                cursor: (isGeneratingAi || isTranscribingAudio || (!transcript.trim() && !audioBlob)) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: (isGeneratingAi || isTranscribingAudio || (!transcript.trim() && !audioBlob)) ? 'none' : '0 6px 20px rgba(2, 132, 199, 0.35)',
                transition: 'all 0.2s'
              }}
            >
              <Sparkles size={20} color="#facc15" />
              {isGeneratingAi 
                ? '⏳ AI Đang Phân Tích & Soạn Thảo Biên Bản...' 
                : (isTranscribingAudio 
                    ? '🤖 AI Đang Bóc Băng File Âm Thanh...' 
                    : (!transcript.trim() && audioBlob 
                        ? '⚡ AI Bóc Băng & Tổng Hợp Biên Bản (NĐ 30)' 
                        : '✨ Tổng Hợp Biên Bản Bằng AI (Nghị Định 30)'))}
            </button>

            {/* THẺ XEM NHANH & THAO TÁC BIÊN BẢN TRÊN DI ĐỘNG (LOẠI BỎ TRIỆT ĐỂ KHOẢNG TRẮNG) */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #bfdbfe',
              padding: '16px',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={18} color="#16a34a" />
                  <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>
                    {generatedMinutes ? 'Bản Thảo Biên Bản NĐ 30 Sẵn Sàng' : 'Bản Thảo Biên Bản'}
                  </span>
                </div>
                <span style={{ fontSize: '11px', background: '#f0fdf4', color: '#166534', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', border: '1px solid #bbf7d0' }}>
                  Chuẩn NĐ 30
                </span>
              </div>

              {generatedMinutes ? (
                <>
                  {/* MÔ PHỎNG TỜ GIẤY A4 THU NHỎ PHONG CÁCH LATENDOC */}
                  <div 
                    onClick={() => {
                      setMobileViewTab('minutes');
                      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      fontFamily: '"Times New Roman", Times, serif',
                      lineHeight: 1.3,
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.03)'
                    }}
                    title="Bấm để mở toàn màn hình Biên Bản"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', borderBottom: '0.5px solid #94a3b8', paddingBottom: '4px', marginBottom: '6px' }}>
                      <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
                        <div>SỞ GD&ĐT ĐẮK LẮK</div>
                        <div>TRƯỜNG THPT CAO BÁ QUÁT</div>
                        <div style={{ fontWeight: 'normal', fontSize: '8px' }}>Số: {generatedMinutes.docNumber}</div>
                      </div>
                      <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
                        <div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                        <div style={{ fontWeight: 'normal' }}>Độc lập - Tự do - Hạnh phúc</div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11.5px', textTransform: 'uppercase', color: '#1e3a8a', margin: '4px 0' }}>
                      {generatedMinutes.title}
                    </div>

                    <div style={{ fontSize: '10px', color: '#334155', marginTop: '6px', lineHeight: '1.4' }}>
                      <div>• <strong>Chủ trì:</strong> {generatedMinutes.chairPerson}</div>
                      <div>• <strong>Thư ký:</strong> {generatedMinutes.secretary}</div>
                      <div>• <strong>Kết luận cốt lõi:</strong> {generatedMinutes.conclusions?.[0] || 'Toàn thể hội đồng nhất trí thông qua nội dung.'}</div>
                      <div>• <strong>Ma trận nhiệm vụ:</strong> {generatedMinutes.actionItems?.length || 0} việc cần làm (phân công cụ thể)</div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '11px', color: '#2563eb', fontWeight: 'bold' }}>
                      👉 Nhấn vào đây để xem toàn văn & biên tập biên bản →
                    </div>
                  </div>

                  {/* CÁC NÚT THAO TÁC NHANH TRÊN DI ĐỘNG */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setMobileViewTab('minutes');
                        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        padding: '11px 12px',
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '9px',
                        fontWeight: 'bold',
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(37,99,235,0.25)'
                      }}
                    >
                      <Eye size={15} /> Xem Bản Đầy Đủ
                    </button>

                    <button
                      onClick={handleExportWord}
                      style={{
                        padding: '11px 12px',
                        background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '9px',
                        fontWeight: 'bold',
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(22,163,74,0.25)'
                      }}
                      title="Xuất file Word chuẩn Nghị định 30 với tiền tố 1-... GEMINI.md"
                    >
                      <Download size={15} /> Tải Word (1-...)
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '12.5px', color: '#64748b', textAlign: 'center', padding: '16px' }}>
                  <FileText size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                  <div>Thầy/Cô hãy bấm ghi âm giọng nói, nạp file âm thanh hoặc chọn Phiên họp mẫu để xem trước biên bản tại đây.</div>
                </div>
              )}

              {/* LIÊN KẾT SANG THƯ VIỆN MẪU LATENDOC */}
              <Link
                to="/can-chinh-nghi-dinh-30"
                style={{
                  padding: '10px 14px',
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '10px',
                  color: '#0284c7',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s'
                }}
              >
                <span>📑 Khám phá Thư Viện Mẫu Văn Bản Hành Chính (Latendoc)</span>
                <ChevronRight size={14} />
              </Link>
            </div>

          </div>

          {/* ================= CỘT PHẢI: XEM & BIÊN TẬP BIÊN BẢN CHUẨN NGHỊ ĐỊNH 30 ================= */}
          <div className="right-panel-meeting" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* NÚT QUAY LẠI PHÒNG THU CHO DI ĐỘNG */}
            <div className="mobile-only-back">
              <button
                onClick={() => {
                  setMobileViewTab('studio');
                  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '800',
                  color: '#1e40af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                }}
              >
                ← Quay lại Phòng Thu Âm & Nạp Tệp Âm Thanh
              </button>
            </div>
            
            {/* THANH TABS CHUYỂN ĐỔI CHẾ ĐỘ XEM */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '6px', background: '#e2e8f0', padding: '4px', borderRadius: '10px' }}>
                <button
                  onClick={() => setActiveTab('minutes')}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    background: activeTab === 'minutes' ? '#ffffff' : 'transparent',
                    color: activeTab === 'minutes' ? '#0f172a' : '#64748b',
                    boxShadow: activeTab === 'minutes' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  📄 Biên Bản Chính Thức
                </button>
                <button
                  onClick={() => setActiveTab('action_items')}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    background: activeTab === 'action_items' ? '#ffffff' : 'transparent',
                    color: activeTab === 'action_items' ? '#0f172a' : '#64748b',
                    boxShadow: activeTab === 'action_items' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  🎯 Ma Trận Việc Cần Làm ({generatedMinutes?.actionItems?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('transcript')}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    background: activeTab === 'transcript' ? '#ffffff' : 'transparent',
                    color: activeTab === 'transcript' ? '#0f172a' : '#64748b',
                    boxShadow: activeTab === 'transcript' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  🎙️ Bản Ghi Âm Thô ({transcript.length} ký tự)
                </button>
              </div>

              {/* NÚT HÀNH ĐỘNG XUẤT WORD & LƯU & TOÀN MÀN HÌNH */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setIsFullScreenMinutes(!isFullScreenMinutes)}
                  style={{
                    padding: '8px 12px',
                    background: isFullScreenMinutes ? '#eff6ff' : '#ffffff',
                    border: isFullScreenMinutes ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: isFullScreenMinutes ? '#1d4ed8' : '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  title={isFullScreenMinutes ? 'Thu nhỏ lại bố cục 2 cột' : 'Phóng to toàn màn hình để đọc biên bản rõ nét'}
                >
                  {isFullScreenMinutes ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                  <span>{isFullScreenMinutes ? 'Thu Nhỏ' : 'Toàn Màn Hình'}</span>
                </button>

                <button
                  onClick={handleCopyMinutes}
                  disabled={!generatedMinutes}
                  style={{
                    padding: '8px 12px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: generatedMinutes ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  title="Sao chép toàn bộ nội dung"
                >
                  <Copy size={13} /> {copiedToast ? 'Đã chép!' : 'Chép'}
                </button>

                <button
                  onClick={handleSaveToDb}
                  disabled={!generatedMinutes}
                  style={{
                    padding: '8px 14px',
                    background: isSavedDb ? '#f0fdf4' : '#eff6ff',
                    border: isSavedDb ? '1px solid #86efac' : '1px solid #bfdbfe',
                    color: isSavedDb ? '#166534' : '#1d4ed8',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: generatedMinutes ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Save size={13} /> {isSavedDb ? 'Đã Lưu Sổ Số' : 'Lưu Sổ Điện Tử'}
                </button>

                <button
                  onClick={handleExportWord}
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 3px 10px rgba(22, 163, 74, 0.25)'
                  }}
                  title="Xuất file Word chuẩn Nghị định 30 theo quy tắc tiền tố 1-... GEMINI.md"
                >
                  <Download size={14} /> Xuất Word (1-...)
                </button>
              </div>
            </div>

            {/* NỘI DUNG HIỂN THỊ THEO TABS */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '24px 28px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              minHeight: '520px'
            }}>
              
              {/* TAB 1: BIÊN BẢN CHÍNH THỨC NGHỊ ĐỊNH 30 */}
              {activeTab === 'minutes' && (
                <div>
                  {!generatedMinutes ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                      <FileText size={48} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                      <h4 style={{ margin: '0 0 6px', fontSize: '16px', color: '#0f172a' }}>
                        Chưa Có Bản Soạn Thảo Biên Bản
                      </h4>
                      <p style={{ margin: '0 auto', fontSize: '13px', maxWidth: '420px', lineHeight: 1.5 }}>
                        Thầy/Cô hãy bấm <strong>"Bắt Đầu Ghi Âm Trực Tuyến"</strong> khi đang họp, hoặc bấm chọn <strong>"Phiên họp sư phạm mẫu"</strong> ở cột bên trái và nhấn nút <strong>"Tổng Hợp Biên Bản Bằng AI"</strong>.
                      </p>
                    </div>
                  ) : (
                    <div style={{ fontFamily: '"Times New Roman", Times, serif', color: '#000000', lineHeight: 1.4, fontSize: '14.5px' }}>
                      
                      {/* BANNER THAO TÁC NHANH: XUẤT FILE WORD 1-CHẠM */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        marginBottom: '18px',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CheckCircle2 size={18} color="#16a34a" />
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534' }}>
                            Biên bản đã sẵn sàng xuất bản Word chuẩn Nghị định 30/2020/NĐ-CP
                          </span>
                        </div>
                        <button
                          onClick={handleExportWord}
                          style={{
                            padding: '7px 16px',
                            backgroundColor: '#16a34a',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '12.5px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)'
                          }}
                        >
                          <Download size={14} /> Xuất Tệp Word Ngay (1-...)
                        </button>
                      </div>

                      {/* TIÊU NGỮ HÀNH CHÍNH NGHỊ ĐỊNH 30 */}
                      <div style={{ display: 'grid', gridTemplateColumns: '45% 55%', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '12px', textTransform: 'uppercase' }}>SỞ GD&ĐT ĐẮK LẮK</div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>TRƯỜNG THPT CAO BÁ QUÁT</div>
                          <div style={{ fontSize: '12px' }}>Số: {generatedMinutes.docNumber}</div>
                          <div style={{ width: '80px', height: '1px', background: '#000', margin: '4px auto' }} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '12.5px', fontWeight: 'bold', textTransform: 'uppercase' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold' }}>Độc lập - Tự do - Hạnh phúc</div>
                          <div style={{ width: '120px', height: '1.5px', background: '#000', margin: '4px auto 6px' }} />
                          <div style={{ fontSize: '12px', fontStyle: 'italic' }}>
                            Cư M'gar, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                          </div>
                        </div>
                      </div>

                      {/* TIÊU ĐỀ BIÊN BẢN */}
                      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <h2 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 'bold', textTransform: 'uppercase', color: '#1e3a8a' }}>
                          {generatedMinutes.title}
                        </h2>
                        <div style={{ fontStyle: 'italic', fontSize: '13.5px', color: '#334155' }}>
                          Năm học {generatedMinutes.academicYear} • Thể loại: {generatedMinutes.meetingType}
                        </div>
                      </div>

                      {/* MỤC I */}
                      <div style={{ marginBottom: '14px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 6px' }}>
                          I. THỜI GIAN, ĐỊA ĐIỂM VÀ THÀNH PHẦN THAM DỰ
                        </h3>
                        <div style={{ paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div>• <strong>Thời gian:</strong> Khai mạc vào lúc {generatedMinutes.openingTime}.</div>
                          <div>• <strong>Địa điểm:</strong> {generatedMinutes.location}.</div>
                          <div>• <strong>Chủ tọa:</strong> {generatedMinutes.chairPerson}.</div>
                          <div>• <strong>Thư ký:</strong> {generatedMinutes.secretary}.</div>
                          <div>• <strong>Thành phần:</strong> {generatedMinutes.attendeesCount}. ({generatedMinutes.absentDetails}).</div>
                        </div>
                      </div>

                      {/* MỤC II */}
                      <div style={{ marginBottom: '14px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 6px' }}>
                          II. NỘI DUNG VÀ CHƯƠNG TRÌNH LÀM VIỆC
                        </h3>
                        <div style={{ paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {generatedMinutes.agenda.map((ag, i) => (
                            <div key={i}>{ag}</div>
                          ))}
                        </div>
                      </div>

                      {/* MỤC III */}
                      <div style={{ marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 6px' }}>
                          III. DIỄN BIẾN VÀ CÁC Ý KIẾN THẢO LUẬN
                        </h3>
                        <div style={{ paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {generatedMinutes.proceedings.map((p, idx) => (
                            <div key={idx} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #0284c7' }}>
                              <strong style={{ color: '#0369a1' }}>* {p.speaker} ({p.role}):</strong>
                              <div style={{ marginTop: '3px', textAlign: 'justify', color: '#1e293b' }}>{p.summary}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* MỤC IV: MA TRẬN NHIỆM VỤ */}
                      {generatedMinutes.actionItems.length > 0 && (
                        <div style={{ marginBottom: '18px' }}>
                          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 8px' }}>
                            IV. MA TRẬN PHÂN CÔNG NHIỆM VỤ & THỜI HẠN THỰC HIỆN
                          </h3>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }} border="1" cellPadding="6">
                            <thead>
                              <tr style={{ background: '#f1f5f9', textAlign: 'center', fontWeight: 'bold' }}>
                                <th style={{ width: '8%' }}>STT</th>
                                <th style={{ width: '42%' }}>Nhiệm vụ cụ thể</th>
                                <th style={{ width: '20%' }}>Người / Tổ phụ trách</th>
                                <th style={{ width: '15%' }}>Hạn chót</th>
                                <th style={{ width: '15%' }}>Sản phẩm</th>
                              </tr>
                            </thead>
                            <tbody>
                              {generatedMinutes.actionItems.map(item => (
                                <tr key={item.stt}>
                                  <td style={{ textAlign: 'center' }}>{item.stt}</td>
                                  <td><strong>{item.task}</strong></td>
                                  <td style={{ textAlign: 'center' }}>{item.assignee}</td>
                                  <td style={{ textAlign: 'center', color: '#b91c1c', fontWeight: 'bold' }}>{item.deadline}</td>
                                  <td>{item.expectedOutput}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* MỤC V: KẾT LUẬN */}
                      <div style={{ marginBottom: '18px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 6px' }}>
                          V. KẾT LUẬN CỦA CHỦ TRÌ & BIỂU QUYẾT
                        </h3>
                        <div style={{ paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {generatedMinutes.conclusions.map((c, i) => (
                            <div key={i} style={{ textAlign: 'justify' }}>{c}</div>
                          ))}
                          <div style={{ marginTop: '6px' }}>
                            <strong>Biểu quyết thông qua:</strong> {generatedMinutes.votingResult}
                          </div>
                          <div style={{ fontStyle: 'italic', marginTop: '4px' }}>
                            Biên bản kết thúc vào lúc {generatedMinutes.closingTime}.
                          </div>
                        </div>
                      </div>

                      {/* CHỮ KÝ */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center', marginTop: '30px', paddingTop: '10px' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '13.5px' }}>THƯ KÝ CUỘC HỌP</div>
                          <div style={{ fontStyle: 'italic', fontSize: '11.5px', color: '#64748b' }}>(Ký và ghi rõ họ tên)</div>
                          <div style={{ height: '55px' }} />
                          <div style={{ fontWeight: 'bold' }}>{generatedMinutes.secretary}</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '13.5px' }}>CHỦ TỌA / HIỆU TRƯỞNG</div>
                          <div style={{ fontStyle: 'italic', fontSize: '11.5px', color: '#64748b' }}>(Ký, đóng dấu và ghi rõ họ tên)</div>
                          <div style={{ height: '55px' }} />
                          <div style={{ fontWeight: 'bold' }}>{generatedMinutes.chairPerson}</div>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MA TRẬN NHIỆM VỤ TRACKER */}
              {activeTab === 'action_items' && (
                <div>
                  <h3 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                    🎯 Bảng Theo Dõi Tiến Độ Phân Công Nhiệm Vụ (Action Items)
                  </h3>
                  {(!generatedMinutes?.actionItems || generatedMinutes.actionItems.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      Chưa có danh sách nhiệm vụ được trích xuất.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {generatedMinutes.actionItems.map(item => (
                        <div
                          key={item.stt}
                          style={{
                            background: '#f8fafc',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '14px 18px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}>
                              {item.stt}
                            </span>
                            <div>
                              <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>
                                {item.task}
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                Phụ trách: <strong style={{ color: '#0369a1' }}>{item.assignee}</strong> • Sản phẩm: {item.expectedOutput}
                              </div>
                            </div>
                          </div>

                          <div style={{ fontSize: '12px', background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold' }}>
                            ⏰ Hạn: {item.deadline}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: BẢN GHI ÂM THÔ (RAW TRANSCRIPT) */}
              {activeTab === 'transcript' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>
                      🎙️ Nội Dung Ghi Âm Giọng Nói Trực Tiếp (Transcript)
                    </h3>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Có thể chỉnh sửa hoặc bổ sung ý kiến trực tiếp vào ô bên dưới
                    </span>
                  </div>

                  {liveInterimText && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '8px', fontSize: '12.5px', color: '#b91c1c', fontStyle: 'italic', marginBottom: '10px' }}>
                      🎤 Đang nhận diện: "{liveInterimText}..."
                    </div>
                  )}

                  <textarea
                    rows={16}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Nội dung lời nói sẽ tự động hiển thị tại đây khi Thầy/Cô nói vào Micro..."
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      lineHeight: 1.6,
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>
              )}

            </div>

          </div>

        </div>

        {/* ==================== MODAL HƯỚNG DẪN MỞ QUYỀN MICROPHONE ==================== */}
        {showMicrophoneGuide && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setShowMicrophoneGuide(false)}
          >
            <div 
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '620px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                animation: 'fadeIn 0.2s ease-out'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{
                padding: '18px 24px',
                backgroundColor: '#fff1f2',
                borderBottom: '1px solid #fecdd3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#ffe4e6',
                    color: '#e11d48',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <MicOff size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#9f1239' }}>
                      {micErrorInfo?.title || 'Hướng Dẫn Cấp Quyền Microphone'}
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#be123c' }}>
                      Mở Micro trên trình duyệt Chrome, Cốc Cốc, Edge hoặc Windows
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowMicrophoneGuide(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9f1239',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '6px'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '22px 24px', maxHeight: '70vh', overflowY: 'auto' }}>
                {/* Thông báo lỗi cụ thể */}
                <div style={{
                  padding: '12px 14px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: '#991b1b',
                  marginBottom: '18px',
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Chi tiết: </strong>
                    {micErrorInfo?.message || 'Trình duyệt chưa được cấp quyền sử dụng Microphone.'}
                  </div>
                </div>

                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                  🛠️ CÁC BƯỚC KHẮC PHỤC NHANH (TRONG 30 GIÂY):
                </h4>

                {/* BƯỚC 1: TRÌNH DUYỆT */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '14px',
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px'
                }}>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: '#0284c7',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>1</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                      Bấm vào biểu tượng Ổ Khóa 🔒 bên trái thanh địa chỉ
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                      Tại góc trên bên trái trình duyệt (ngay trước chữ <code>localhost</code> hoặc tên miền web), nhấp vào biểu tượng <strong>Ổ khóa 🔒</strong> hoặc <strong>Cài đặt trang web</strong> $\rightarrow$ Chuyển mục <strong>Micro (Microphone)</strong> từ <em>"Chặn"</em> sang <strong>"Cho phép" (Allow)</strong>.
                    </div>
                  </div>
                </div>

                {/* BƯỚC 2: WINDOWS PRIVACY */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '14px',
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px'
                }}>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: '#0284c7',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>2</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                      Kiểm tra Cài đặt Quyền riêng tư của Windows 10/11
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                      Nhấn phím <strong>Windows + I</strong> $\rightarrow$ Vào <strong>Privacy & Security</strong> (Quyền riêng tư) $\rightarrow$ <strong>Microphone</strong> $\rightarrow$ Đảm bảo bật công tắc <strong>"Microphone access"</strong> và <strong>"Let desktop apps access your microphone"</strong> sang <strong>ON</strong>.
                    </div>
                  </div>
                </div>

                {/* BƯỚC 3: GIẢI PHÁP THAY THẾ KHUYÊN DÙNG */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px'
                }}>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>3</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#15803d', marginBottom: '4px' }}>
                      💡 Mẹo Thực Chiến: Dùng Điện Thoại Thu Âm Rõ Nét Hơn
                    </div>
                    <div style={{ fontSize: '12px', color: '#166534', lineHeight: 1.5 }}>
                      Thầy/Cô có thể đặt điện thoại trên bàn họp bật app <strong>Ghi Âm</strong>. Sau cuộc họp, tải file âm thanh (.mp3, .m4a, .wav) lên hệ thống để AI tự động bóc tách và soạn biên bản ngay lập tức mà không cần micro máy tính!
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 24px',
                backgroundColor: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => {
                    setShowMicrophoneGuide(false);
                    fileInputRef.current?.click();
                  }}
                  style={{
                    padding: '9px 16px',
                    backgroundColor: '#f1f5f9',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Upload size={15} /> 📁 Tải Tệp Âm Thanh (.mp3, .m4a)
                </button>

                <button
                  onClick={() => {
                    loadPresetScenario(PRESET_MEETING_SCENARIOS[0]);
                    setShowMicrophoneGuide(false);
                  }}
                  style={{
                    padding: '9px 16px',
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={15} /> ⚡ Dùng Kịch Bản Mẫu (Demo)
                </button>

                <button
                  onClick={() => {
                    setShowMicrophoneGuide(false);
                    startRecording();
                  }}
                  style={{
                    padding: '9px 18px',
                    backgroundColor: '#e11d48',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(225, 29, 72, 0.3)'
                  }}
                >
                  <RefreshCw size={15} /> Thử Cấp Quyền Lại
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TOAST THÔNG BÁO XUẤT FILE WORD THÀNH CÔNG KHÔNG BỊ CHẶN POPUP */}
        {wordExportToast && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            maxWidth: '90vw',
            width: '420px',
            backgroundColor: wordExportToast.type === 'error' ? '#ef4444' : '#15803d',
            color: '#ffffff',
            padding: '14px 18px',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 9999,
            animation: 'slideUp 0.3s ease-out'
          }}>
            {wordExportToast.type === 'error' ? (
              <AlertCircle size={24} style={{ flexShrink: 0 }} />
            ) : (
              <CheckCircle2 size={24} style={{ flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, fontSize: '13px', lineHeight: 1.4 }}>
              <div style={{ fontWeight: 'bold' }}>{wordExportToast.message}</div>
              {wordExportToast.fileName && (
                <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px', wordBreak: 'break-all' }}>
                  📁 Tệp tải về: <strong>{wordExportToast.fileName}</strong>
                </div>
              )}
            </div>
            <button 
              onClick={() => setWordExportToast(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Đóng"
            >
              <X size={18} />
            </button>
          </div>
        )}

      </div>
    </Layout>
  );
}
