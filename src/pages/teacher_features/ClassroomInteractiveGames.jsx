import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Confetti from 'react-confetti';
import {
  ArrowLeft, Award, BookOpen, Download, Plus, Trash2, Edit3, Shuffle,
  FileText, CheckCircle2, HelpCircle, Layers, Printer, RefreshCw, Eye, EyeOff,
  CheckSquare, Send, FileSpreadsheet, Sparkles, QrCode, Upload, Image,
  Copy, Search, Filter, Database, Play, Pause, RotateCcw, Volume2, VolumeX,
  Maximize2, Minimize2, Trophy, Users, Flame, Star, Flag, Clock, Zap,
  Gift, Mic, MicOff, AlertTriangle, UserCheck, Heart, ThumbsUp, MessageSquare,
  Monitor, Tv, Settings, X, ChevronRight, ChevronLeft, Sliders
} from 'lucide-react';
import MathView from '../../components/MathView';
import { supabase, DualSupabaseService } from '../../lib/supabase';
import { gameAudio } from '../../utils/gameAudio';
import { HIGH_SCHOOL_SUBJECTS } from '../../services/smartAssessmentService';
import { getTeacherSession } from '../../services/authSessionManager';
import MobileBottomNav from '../../components/MobileBottomNav';
import AiStatusBadge from '../../components/AiStatusBadge';
import { 
  generateClassroomQuestionsAi, 
  explainQuestionAi, 
  getStoredAiKey 
} from '../../services/aiAssistantService';

// BỘ NHẬN DIỆN THẺ ĐÁP ÁN CHUẨN QUỐC TẾ (KAHOOT! / QUIZIZZ / GIMKIT PRO)
export const KAHOOT_THEME = [
  {
    label: 'A',
    shape: '▲',
    shapeName: 'Tam giác',
    color: '#ef4444',
    bg: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
    shadow: '0 8px 24px rgba(239, 68, 68, 0.4)',
    border: '#f87171'
  },
  {
    label: 'B',
    shape: '◆',
    shapeName: 'Hình thoi',
    color: '#3b82f6',
    bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    shadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
    border: '#60a5fa'
  },
  {
    label: 'C',
    shape: '●',
    shapeName: 'Hình tròn',
    color: '#f59e0b',
    bg: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    shadow: '0 8px 24px rgba(245, 158, 11, 0.4)',
    border: '#fbbf24'
  },
  {
    label: 'D',
    shape: '■',
    shapeName: 'Hình vuông',
    color: '#10b981',
    bg: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    shadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
    border: '#34d399'
  }
];

export default function ClassroomInteractiveGames() {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. DATA STATE (NẠP TRỰC TIẾP TỪ DATABASE)
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('Tất cả môn');
  const [selectedGrade, setSelectedGrade] = useState('Tất cả khối');
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // Học sinh từ Database `cbq_students`
  const [classesList, setClassesList] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [classStudents, setClassStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);

  // TOP TAB CHÍNH: 'games' (Trò chơi lớp học) HOẶC 'tools' (Tiện ích trợ giảng)
  const [mainTab, setMainTab] = useState('games');

  // GAME SUB-MODES:
  // 'arena' (Rung chuông vàng) | 'wheel' (Vòng quay may mắn) | 'team_battle' (Đại chiến 4 tổ) |
  // 'puzzle' (Mảnh ghép bí mật) | 'mystery_box' (Hộp quà may mắn) | 'speed_streak' (Đua tốc độ liên hoàn)
  const [gameMode, setGameMode] = useState('arena');

  // TOOL SUB-MODES:
  // 'timer' (Đồng hồ sư phạm) | 'group_generator' (Chia nhóm thông minh) |
  // 'noise_meter' (Đo độ ồn lớp học) | 'behavior_tracker' (Tích điểm thái độ)
  const [toolMode, setToolMode] = useState('timer');

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // CHẾ ĐỘ SÂN KHẤU TRÌNH CHIẾU PRO (KAHOOT / QUIZIZZ STADIUM PRESENTATION MODE)
  const [isStageMode, setIsStageMode] = useState(false);
  const [showQuickSettings, setShowQuickSettings] = useState(false);

  // Timer State chung
  const [timerDuration, setTimerDuration] = useState(20);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Arena Mode State
  const [showAnswer, setShowAnswer] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState([]); // Trợ giúp 50:50
  const [audienceVotes, setAudienceVotes] = useState(null); // Trợ giúp biểu quyết

  // Wheel Mode State
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelWinner, setWheelWinner] = useState(null);
  const [wheelStudentQuestion, setWheelStudentQuestion] = useState(null);
  const canvasRef = useRef(null);
  const currentRotationRef = useRef(0);

  // Team Battle State (4 Tổ)
  const [teams, setTeams] = useState([
    { id: 1, name: 'Tổ 1 (Khởi Động)', color: '#2563eb', bg: '#eff6ff', score: 0 },
    { id: 2, name: 'Tổ 2 (Bứt Phá)', color: '#ea580c', bg: '#fff7ed', score: 0 },
    { id: 3, name: 'Tổ 3 (Tiên Phong)', color: '#16a34a', bg: '#f0fdf4', score: 0 },
    { id: 4, name: 'Tổ 4 (Chiến Thắng)', color: '#9333ea', bg: '#faf5ff', score: 0 }
  ]);
  const [buzzedTeam, setBuzzedTeam] = useState(null);

  // Puzzle Mode State (6 Mảnh ghép bí mật)
  const [puzzleKeyword, setPuzzleKeyword] = useState('CAO BÁ QUÁT');
  const [openedTiles, setOpenedTiles] = useState([]);
  const [activeTileIndex, setActiveTileIndex] = useState(null);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);

  // Mystery Box State (8 Hộp quà điểm số)
  const [mysteryBoxes, setMysteryBoxes] = useState([
    { id: 1, points: 10, label: 'Hộp 1', icon: '🎁', opened: false, type: 'points' },
    { id: 2, points: 20, label: 'Hộp 2', icon: '⭐', opened: false, type: 'points' },
    { id: 3, points: 30, label: 'Hộp 3', icon: '🌟', opened: false, type: 'points' },
    { id: 4, points: 50, label: 'Hộp 4 (Jackpot)', icon: '🏆', opened: false, type: 'jackpot' },
    { id: 5, points: -5, label: 'Hộp 5 (Thử Thách)', icon: '💣', opened: false, type: 'bomb' },
    { id: 6, points: 20, label: 'Hộp 6', icon: '💎', opened: false, type: 'points' },
    { id: 7, points: 10, label: 'Hộp 7', icon: '🎉', opened: false, type: 'points' },
    { id: 8, points: 40, label: 'Hộp 8 (May Mắn x2)', icon: '🔥', opened: false, type: 'double' }
  ]);
  const [selectedBox, setSelectedBox] = useState(null);

  // Speed Streak State (Đua tốc độ liên hoàn)
  const [streakCount, setStreakCount] = useState(0);
  const [streakScore, setStreakScore] = useState(0);
  const [speedAnswered, setSpeedAnswered] = useState(null);

  // ==========================================
  // TIỆN ÍCH TRỢ GIẢNG STATES
  // ==========================================
  // 1. Đồng Hồ Sư Phạm (Classroom Smart Timer)
  const [toolTimerSeconds, setToolTimerSeconds] = useState(300); // Mặc định 5 phút
  const [toolTimerRunning, setToolTimerRunning] = useState(false);
  const [toolStopwatchRunning, setToolStopwatchRunning] = useState(false);
  const [toolStopwatchTime, setToolStopwatchTime] = useState(0);

  // 2. Chia Nhóm Thông Minh (Group Generator)
  const [numGroups, setNumGroups] = useState(4);
  const [generatedGroups, setGeneratedGroups] = useState([]);

  // 3. Đo Độ Ồn Lớp Học (Noise Level Monitor)
  const [noiseMonitoring, setNoiseMonitoring] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(25); // 0 - 100%
  const [noiseThreshold, setNoiseThreshold] = useState(70);
  const [noiseAlert, setNoiseAlert] = useState(false);
  const audioContextRef = useRef(null);
  const micStreamRef = useRef(null);
  const analyserRef = useRef(null);
  const noiseRafRef = useRef(null);

  // 4. Bảng Tích Điểm Thái Độ Học Sinh (Behavior Tracker)
  const [studentPointsMap, setStudentPointsMap] = useState({});

  // Session Scoreboard (Lưu điểm thưởng xuất file Excel)
  const [sessionScores, setSessionScores] = useState([]);

  // Modal Thêm Câu Hỏi Mới vào CSDL
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQSubject, setNewQSubject] = useState('Toán');
  const [newQTitle, setNewQTitle] = useState('');
  const [newQContent, setNewQContent] = useState('');
  const [newQOptions, setNewQOptions] = useState(['', '', '', '']);
  const [newQCorrect, setNewQCorrect] = useState(0);
  const [newQExplanation, setNewQExplanation] = useState('');
  const [savingNewQ, setSavingNewQ] = useState(false);

  // Trợ lý AI Soạn Câu Hỏi & Giải Thích Sư Phạm
  const [showAiGenModal, setShowAiGenModal] = useState(false);
  const [aiSubject, setAiSubject] = useState('Toán');
  const [aiGrade, setAiGrade] = useState('10');
  const [aiTopic, setAiTopic] = useState('');
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState('Vừa sức (Khởi động)');
  const [aiRawContext, setAiRawContext] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState([]);
  const [aiGenError, setAiGenError] = useState(null);
  const [aiExplaining, setAiExplaining] = useState(false);
  const [aiExplanationText, setAiExplanationText] = useState(null);

  // ==========================================
  // NẠP DỮ LIỆU TỪ SUPABASE
  // ==========================================
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Nạp danh sách Đề thi / Gói câu hỏi từ `cbq_smart_assessments`
      const { data: asmData } = await DualSupabaseService.selectSmart('cbq_smart_assessments', q =>
        q.select('id, title, subject, grade, duration_minutes, questions, teacher_name')
         .eq('status', 'active')
         .order('created_at', { ascending: false })
      );

      // 2. Nạp thêm câu hỏi trắc nghiệm từ `cbq_quiz_questions`
      const { data: quizQData } = await DualSupabaseService.selectSmart('cbq_quiz_questions', q =>
        q.select('*').order('order_index', { ascending: true })
      );

      let allPacks = Array.isArray(asmData) ? [...asmData] : [];

      if (Array.isArray(quizQData) && quizQData.length > 0) {
        const quizPack = {
          id: 'quiz-questions-db',
          title: 'Đố Vui Tri Thức & Lịch Sử Trường THPT Cao Bá Quát',
          subject: 'Truyền thống nhà trường',
          grade: 'Tất cả khối',
          teacher_name: 'Đoàn trường',
          questions: quizQData.map((q, idx) => {
            let opts = [];
            try {
              opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
            } catch (_) {
              opts = ['A', 'B', 'C', 'D'];
            }
            return {
              id: q.id || `qq_${idx}`,
              title: `Câu ${idx + 1}`,
              content: q.question_text,
              options: Array.isArray(opts) ? opts : ['A', 'B', 'C', 'D'],
              correctAnswerIndex: q.correct_option_index !== undefined ? q.correct_option_index : 0,
              explanation: q.points ? `Điểm chuẩn câu hỏi: ${q.points} điểm` : ''
            };
          })
        };
        allPacks.unshift(quizPack);
      }

      setAssessments(allPacks);

      let combinedQuestions = [];
      allPacks.forEach(pack => {
        if (pack.questions && Array.isArray(pack.questions)) {
          pack.questions.forEach(q => {
            combinedQuestions.push({
              ...q,
              packId: pack.id,
              packTitle: pack.title,
              subject: pack.subject,
              grade: pack.grade
            });
          });
        }
      });
      setQuestions(combinedQuestions);

      // 3. Nạp danh sách Học sinh từ cbq_students (Phân trang để tải đủ 1.441 học sinh của toàn bộ 34 lớp)
      let allLoadedStudents = [];
      try {
        let from = 0;
        const step = 1000;
        while (true) {
          const { data, error } = await supabase
            .from('cbq_students')
            .select('id, student_code, student_name, student_class, grade_level')
            .range(from, from + step - 1)
            .order('student_class', { ascending: true })
            .order('student_name', { ascending: true });

          if (error) {
            console.warn('Lỗi nạp học sinh Supabase range:', from, error);
            break;
          }
          if (!data || data.length === 0) break;

          allLoadedStudents.push(...data);
          if (data.length < step) break;
          from += step;
        }
      } catch (err) {
        console.warn('Lỗi phân trang nạp học sinh:', err);
      }

      // Fallback qua DualSupabaseService nếu trực tiếp chưa nạp được
      if (allLoadedStudents.length === 0) {
        try {
          const { data: fallbackData } = await DualSupabaseService.selectSmart('cbq_students', q =>
            q.order('student_class', { ascending: true })
          );
          if (Array.isArray(fallbackData) && fallbackData.length > 0) {
            allLoadedStudents = fallbackData;
          }
        } catch (e) {
          console.warn('Lỗi fallback nạp học sinh qua DualSupabaseService:', e);
        }
      }

      // Chuẩn hóa tên học sinh (đồng bộ full_name và student_name cho toàn bộ trò chơi & tiện ích)
      const normalizedStudents = allLoadedStudents.map(s => ({
        ...s,
        full_name: s.student_name || s.full_name || 'Học sinh',
        student_name: s.student_name || s.full_name || 'Học sinh'
      }));

      if (normalizedStudents.length > 0) {
        setAllStudents(normalizedStudents);
        const classes = [...new Set(normalizedStudents.map(s => s.student_class).filter(Boolean))].sort();
        setClassesList(classes);

        // 1. Ưu tiên lớp được truyền từ Thời khóa biểu (location.state.classId)
        // 2. Tiếp theo là lớp chủ nhiệm của giáo viên
        // 3. Mặc định là lớp đầu tiên
        const teacherSess = getTeacherSession();
        const incomingClass = location.state?.classId;
        const preferredClass = (incomingClass && classes.includes(incomingClass))
          ? incomingClass
          : (teacherSess?.homeroomClass && classes.includes(teacherSess.homeroomClass)
              ? teacherSess.homeroomClass
              : classes[0]);

        if (classes.length > 0) {
          setSelectedClass(preferredClass);
          const initialClassStudents = normalizedStudents.filter(s => s.student_class === preferredClass);
          setClassStudents(initialClassStudents);
        }

        // Tự động nhận môn học từ Thời khóa biểu nếu có
        if (location.state?.subject) {
          const incSub = String(location.state.subject).trim();
          const matchedSub = HIGH_SCHOOL_SUBJECTS.find(s => 
            s.toLowerCase().includes(incSub.toLowerCase()) || incSub.toLowerCase().includes(s.toLowerCase())
          );
          if (matchedSub) {
            setSelectedSubject(matchedSub);
          }
        }
      }
    } catch (err) {
      console.error('Lỗi nạp dữ liệu trò chơi từ DB:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật học sinh khi đổi Lớp
  useEffect(() => {
    if (selectedClass && allStudents.length > 0) {
      const filtered = allStudents.filter(s => s.student_class === selectedClass);
      setClassStudents(filtered);
    }
  }, [selectedClass, allStudents]);

  // Lọc câu hỏi theo Môn & Khối
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchSubject = selectedSubject === 'Tất cả môn' || q.subject === selectedSubject;
      const matchGrade = selectedGrade === 'Tất cả khối' || q.grade === selectedGrade;
      const matchPack = selectedAssessmentId === 'all' || q.packId === selectedAssessmentId;
      return matchSubject && matchGrade && matchPack;
    });
  }, [questions, selectedSubject, selectedGrade, selectedAssessmentId]);

  const currentQuestion = filteredQuestions[currentQIndex] || filteredQuestions[0] || null;

  // ==========================================
  // BỘ ĐẾM THỜI GIAN TRÒ CHƠI (ARENA TIMER)
  // ==========================================
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            gameAudio.playWrong();
            return 0;
          }
          if (prev <= 6) gameAudio.playTick();
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const resetTimer = (newDuration = timerDuration) => {
    setTimeLeft(newDuration);
    setIsTimerRunning(false);
  };

  const startTimer = () => {
    if (timeLeft === 0) resetTimer();
    setIsTimerRunning(true);
    gameAudio.init();
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  // PHÍM TẮT BÀN PHÍM & BÚT TRÌNH CHIẾU (CLICKER) CHUYÊN NGHIỆP CHO GIÁO VIÊN
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsTimerRunning(prev => {
          if (prev) {
            gameAudio.playTick();
            return false;
          } else {
            gameAudio.init();
            return true;
          }
        });
      } else if (e.key === 'ArrowRight' || e.code === 'PageDown') {
        e.preventDefault();
        handleNextQuestion();
      } else if (e.key === 'ArrowLeft' || e.code === 'PageUp') {
        e.preventDefault();
        handlePrevQuestion();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleRevealAnswer();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape' && isStageMode) {
        setIsStageMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStageMode, currentQIndex, filteredQuestions.length]);

  // Chuyển câu hỏi
  const handleNextQuestion = () => {
    if (currentQIndex < filteredQuestions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      setCurrentQIndex(0);
    }
    setShowAnswer(false);
    setShowExplanation(false);
    setEliminatedOptions([]);
    setAudienceVotes(null);
    setBuzzedTeam(null);
    setSpeedAnswered(null);
    resetTimer();
  };

  const handlePrevQuestion = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(prev => prev - 1);
    } else {
      setCurrentQIndex(filteredQuestions.length - 1);
    }
    setShowAnswer(false);
    setShowExplanation(false);
    setEliminatedOptions([]);
    setAudienceVotes(null);
    setBuzzedTeam(null);
    setSpeedAnswered(null);
    resetTimer();
  };

  // Trợ giúp 50:50
  const handle5050 = () => {
    if (!currentQuestion || eliminatedOptions.length > 0) return;
    const correctIdx = currentQuestion.correctAnswerIndex ?? 0;
    const wrongIndices = [0, 1, 2, 3].filter(i => i !== correctIdx && i < (currentQuestion.options || []).length);
    const shuffled = [...wrongIndices].sort(() => 0.5 - Math.random());
    setEliminatedOptions(shuffled.slice(0, 2));
    gameAudio.playTick();
  };

  // Trợ giúp Biểu quyết
  const handleAudienceHelp = () => {
    if (!currentQuestion) return;
    const correctIdx = currentQuestion.correctAnswerIndex ?? 0;
    const correctPct = Math.floor(Math.random() * 15) + 60;
    const remaining = 100 - correctPct;
    const p1 = Math.floor(remaining * 0.45);
    const p2 = Math.floor(remaining * 0.35);
    const p3 = remaining - p1 - p2;
    const otherPcts = [p1, p2, p3];

    let votes = [0, 0, 0, 0];
    votes[correctIdx] = correctPct;
    let oIdx = 0;
    for (let i = 0; i < 4; i++) {
      if (i !== correctIdx) {
        votes[i] = otherPcts[oIdx++] || 5;
      }
    }
    setAudienceVotes(votes);
    gameAudio.playTick();
  };

  // Tiết lộ đáp án
  const handleRevealAnswer = () => {
    setShowAnswer(true);
    gameAudio.playCorrect();
    setIsTimerRunning(false);
  };

  // ==========================================
  // VÒNG QUAY MAY MẮN (CANVAS ANIMATION)
  // ==========================================
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#6366f1'
  ];

  const drawWheel = (rotationAngle = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const count = classStudents.length || 10;
    const arc = (2 * Math.PI) / count;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = centerX - 12;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < count; i++) {
      const angle = rotationAngle + i * arc;
      ctx.beginPath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + arc);
      ctx.lineTo(centerX, centerY);
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12.5px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 3;
      const studentName = classStudents[i]?.full_name || `Học sinh ${i + 1}`;
      const displayName = studentName.length > 18 ? studentName.substring(0, 16) + '...' : studentName;
      ctx.fillText(displayName, radius - 20, 4);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, 32, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#facc15';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CBQ', centerX, centerY + 4);

    ctx.beginPath();
    ctx.moveTo(centerX + radius + 8, centerY);
    ctx.lineTo(centerX + radius - 16, centerY - 14);
    ctx.lineTo(centerX + radius - 16, centerY + 14);
    ctx.closePath();
    ctx.fillStyle = '#dc2626';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  useEffect(() => {
    if (mainTab === 'games' && gameMode === 'wheel') {
      drawWheel(currentRotationRef.current);
    }
  }, [mainTab, gameMode, classStudents]);

  const spinWheel = () => {
    if (isSpinning || classStudents.length === 0) return;
    setIsSpinning(true);
    setWheelWinner(null);
    setWheelStudentQuestion(null);
    gameAudio.init();

    const count = classStudents.length;
    const arc = (2 * Math.PI) / count;
    const winnerIndex = Math.floor(Math.random() * count);
    const extraRounds = 5 + Math.floor(Math.random() * 3);
    const targetAngle = extraRounds * 2 * Math.PI + (2 * Math.PI - (winnerIndex * arc + arc / 2));

    const startAngle = currentRotationRef.current % (2 * Math.PI);
    const totalRotation = targetAngle;
    const duration = 4000;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startAngle + totalRotation * easeOut;
      currentRotationRef.current = currentAngle;
      drawWheel(currentAngle);

      if (Math.floor(elapsed / 100) % 2 === 0 && progress < 0.95) {
        gameAudio.playWheelClick();
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        const winner = classStudents[winnerIndex];
        setWheelWinner(winner);
        setShowConfetti(true);
        gameAudio.playVictory();
        setTimeout(() => setShowConfetti(false), 4500);

        if (filteredQuestions.length > 0) {
          const randomQ = filteredQuestions[Math.floor(Math.random() * filteredQuestions.length)];
          setWheelStudentQuestion(randomQ);
        }
      }
    };

    requestAnimationFrame(animate);
  };

  const handleAwardStudent = (points, studentToAward = wheelWinner) => {
    if (!studentToAward) return;
    const record = {
      id: Date.now(),
      studentName: studentToAward.full_name,
      studentCode: studentToAward.student_code || '---',
      studentClass: selectedClass,
      points,
      reason: `Trả lời trò chơi: ${wheelStudentQuestion?.title || 'Câu hỏi may mắn'}`,
      time: new Date().toLocaleTimeString('vi-VN')
    };
    setSessionScores(prev => [record, ...prev]);
    gameAudio.playCorrect();
    alert(`🎉 Đã cộng +${points} điểm cho học sinh ${studentToAward.full_name} (${selectedClass})!`);
  };

  // ==========================================
  // ĐẠI CHIẾN 4 TỔ (TEAM BATTLE)
  // ==========================================
  const handleTeamScore = (teamId, delta) => {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, score: Math.max(0, t.score + delta) } : t));
    if (delta > 0) gameAudio.playCorrect();
    else gameAudio.playWrong();
  };

  const handleTeamBuzz = (team) => {
    setBuzzedTeam(team);
    gameAudio.playBuzzer();
  };

  const handleFinishTeamBattle = () => {
    setShowConfetti(true);
    gameAudio.playVictory();
    setTimeout(() => setShowConfetti(false), 5000);
  };

  // ==========================================
  // MẢNH GHÉP BÍ MẬT (PUZZLE FLIP)
  // ==========================================
  const handleOpenTile = (index) => {
    if (openedTiles.includes(index)) return;
    setActiveTileIndex(index);
    setShowAnswer(false);
  };

  const handleSolveTileQuestion = (correct) => {
    if (correct && activeTileIndex !== null) {
      setOpenedTiles(prev => [...prev, activeTileIndex]);
      gameAudio.playCorrect();
      if (openedTiles.length + 1 >= 6) {
        setIsPuzzleSolved(true);
        setShowConfetti(true);
        gameAudio.playVictory();
      }
    } else {
      gameAudio.playWrong();
    }
    setActiveTileIndex(null);
  };

  // ==========================================
  // HỘP QUÀ BÍ MẬT / MA TRẬN ĐIỂM SỐ (MYSTERY BOX)
  // ==========================================
  const handleOpenMysteryBox = (box) => {
    if (box.opened) return;
    gameAudio.playBoxOpen();
    setMysteryBoxes(prev => prev.map(b => b.id === box.id ? { ...b, opened: true } : b));
    setSelectedBox(box);
  };

  // ==========================================
  // ĐUA TỐC ĐỘ LIÊN HOÀN (SPEED STREAK)
  // ==========================================
  const handleSpeedAnswer = (optIndex) => {
    if (speedAnswered !== null) return;
    const isCorrect = optIndex === currentQuestion.correctAnswerIndex;
    setSpeedAnswered(optIndex);

    if (isCorrect) {
      const newStreak = streakCount + 1;
      setStreakCount(newStreak);
      const points = 10 * (newStreak >= 5 ? 3 : (newStreak >= 3 ? 2 : 1));
      setStreakScore(prev => prev + points);
      gameAudio.playCombo(newStreak);
    } else {
      setStreakCount(0);
      gameAudio.playWrong();
    }
  };

  // ==========================================
  // TIỆN ÍCH TRỢ GIẢNG 1: ĐỒNG HỒ SƯ PHẠM
  // ==========================================
  useEffect(() => {
    let timerInterval = null;
    if (toolTimerRunning && toolTimerSeconds > 0) {
      timerInterval = setInterval(() => {
        setToolTimerSeconds(prev => {
          if (prev <= 1) {
            setToolTimerRunning(false);
            gameAudio.playAlarm();
            alert('⏰ HẾT THỜI GIAN LÀM BÀI / THẢO LUẬN NHÓM!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [toolTimerRunning, toolTimerSeconds]);

  useEffect(() => {
    let swInterval = null;
    if (toolStopwatchRunning) {
      swInterval = setInterval(() => {
        setToolStopwatchTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(swInterval);
  }, [toolStopwatchRunning]);

  // ==========================================
  // TIỆN ÍCH TRỢ GIẢNG 2: CHIA NHÓM THÔNG MINH
  // ==========================================
  const handleGenerateGroups = () => {
    if (classStudents.length === 0) {
      alert('Vui lòng chọn lớp có học sinh để tiến hành chia nhóm!');
      return;
    }
    const shuffled = [...classStudents].sort(() => 0.5 - Math.random());
    const groupNames = [
      '🚀 Nhóm Sáng Tạo', '⭐ Nhóm Tiên Phong', '🔥 Nhóm Bứt Phá',
      '🌟 Nhóm Xuất Sắc', '💎 Nhóm Thông Thái', '🎯 Nhóm Chiến Lược',
      '🌈 Nhóm Khát Vọng', '🏆 Nhóm Vô Địch'
    ];
    const groupColors = ['#2563eb', '#ea580c', '#16a34a', '#9333ea', '#06b6d4', '#e11d48', '#d97706', '#4f46e5'];

    const groups = [];
    for (let i = 0; i < numGroups; i++) {
      groups.push({
        id: i + 1,
        name: groupNames[i % groupNames.length],
        color: groupColors[i % groupColors.length],
        members: []
      });
    }

    shuffled.forEach((student, index) => {
      groups[index % numGroups].members.push(student);
    });

    setGeneratedGroups(groups);
    gameAudio.playCorrect();
  };

  const handleExportGroupsExcel = () => {
    if (generatedGroups.length === 0) {
      alert('Chưa có danh sách chia nhóm!');
      return;
    }
    const rows = [];
    generatedGroups.forEach(grp => {
      grp.members.forEach((m, mIdx) => {
        rows.push({
          'Tên Nhóm': grp.name,
          'STT Trong Nhóm': mIdx + 1,
          'Họ và tên học sinh': m.full_name,
          'Mã học sinh': m.student_code || '---',
          'Lớp': selectedClass
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh_Sach_Nhom');
    const fileName = `1-Danh_sach_chia_nhom_hoc_tap_lop_${selectedClass || 'CBQ'}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // ==========================================
  // TIỆN ÍCH TRỢ GIẢNG 3: ĐO ĐỘ ỒN LỚP HỌC
  // ==========================================
  const startNoiseMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      setNoiseMonitoring(true);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setNoiseLevel(normalized);

        if (normalized >= noiseThreshold) {
          setNoiseAlert(true);
          gameAudio.playNoiseWarning();
        } else {
          setNoiseAlert(false);
        }

        noiseRafRef.current = requestAnimationFrame(checkVolume);
      };
      checkVolume();
    } catch (err) {
      console.warn('Không thể truy cập Microphone:', err);
      alert('Không thể kết nối Microphone. Hệ thống sẽ bật chế độ cảm biến giả lập để thầy/cô trải nghiệm!');
      setNoiseMonitoring(true);
    }
  };

  const stopNoiseMonitoring = () => {
    if (noiseRafRef.current) cancelAnimationFrame(noiseRafRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setNoiseMonitoring(false);
    setNoiseAlert(false);
    setNoiseLevel(20);
  };

  // ==========================================
  // TIỆN ÍCH TRỢ GIẢNG 4: BẢNG TÍCH ĐIỂM THÁI ĐỘ
  // ==========================================
  const handleAddBehaviorPoint = (student, delta, reason) => {
    const prev = studentPointsMap[student.id] || 0;
    const nextVal = Math.max(0, prev + delta);
    setStudentPointsMap(prevMap => ({ ...prevMap, [student.id]: nextVal }));

    const record = {
      id: Date.now(),
      studentName: student.full_name,
      studentCode: student.student_code || '---',
      studentClass: selectedClass,
      points: delta,
      reason,
      time: new Date().toLocaleTimeString('vi-VN')
    };
    setSessionScores(prevScores => [record, ...prevScores]);
    if (delta > 0) gameAudio.playCorrect();
    else gameAudio.playWrong();
  };

  const handleExportBehaviorExcel = () => {
    if (sessionScores.length === 0) {
      alert('Chưa có dữ liệu tích điểm trong tiết này!');
      return;
    }
    const rows = sessionScores.map((s, idx) => ({
      'STT': idx + 1,
      'Họ và tên học sinh': s.studentName,
      'Mã học sinh': s.studentCode,
      'Lớp': s.studentClass,
      'Điểm cộng/trừ': s.points > 0 ? `+${s.points}` : `${s.points}`,
      'Nội dung đánh giá': s.reason,
      'Thời gian': s.time
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Diem_Thai_Do');
    const fileName = `1-Bao_cao_tich_diem_tiet_hoc_lop_${selectedClass || 'CBQ'}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // ==========================================
  // LƯU CÂU HỎI MỚI VÀO CSDL
  // ==========================================
  const handleSaveNewQuestionToDB = async (e) => {
    e.preventDefault();
    if (!newQContent.trim() || newQOptions.some(opt => !opt.trim())) {
      alert('Vui lòng nhập đầy đủ nội dung câu hỏi và 4 phương án lựa chọn!');
      return;
    }

    setSavingNewQ(true);
    try {
      const payload = {
        question_text: newQContent.trim(),
        question_type: 'multiple_choice',
        options: JSON.stringify(newQOptions.map(o => o.trim())),
        correct_option_index: Number(newQCorrect),
        points: 10,
        order_index: (questions.length || 0) + 1,
        created_at: new Date().toISOString()
      };

      const { data, error } = await DualSupabaseService.insertSmart('cbq_quiz_questions', payload);
      if (error) throw error;

      alert('✅ Đã lưu câu hỏi thành công vào Cơ sở dữ liệu trường THPT Cao Bá Quát!');
      setShowAddModal(false);
      setNewQContent('');
      setNewQOptions(['', '', '', '']);
      setNewQExplanation('');
      fetchInitialData();
    } catch (err) {
      console.error('Lỗi lưu câu hỏi:', err);
      alert('Không thể lưu câu hỏi vào CSDL: ' + (err.message || 'Lỗi kết nối'));
    } finally {
      setSavingNewQ(false);
    }
  };

  // ==========================================
  // TRỢ GIẢNG AI: TẠO CÂU HỎI & GIẢI THÍCH
  // ==========================================
  const handleGenerateQuestionsWithAi = async (e) => {
    e.preventDefault();
    if (!aiTopic.trim() && !aiRawContext.trim()) {
      setAiGenError('Vui lòng nhập Chủ đề bài học hoặc dán đoạn tài liệu tham khảo.');
      return;
    }
    setIsGeneratingAi(true);
    setAiGenError(null);
    try {
      const generated = await generateClassroomQuestionsAi({
        subject: aiSubject,
        grade: aiGrade,
        topic: aiTopic || 'Khởi động tiết học',
        count: Number(aiQuestionCount) || 5,
        difficulty: aiDifficulty,
        rawContext: aiRawContext
      });
      setAiGeneratedQuestions(generated);
      gameAudio.playVictory();
    } catch (err) {
      console.error('Lỗi sinh câu hỏi AI:', err);
      setAiGenError(err?.message || 'Có lỗi phát sinh khi sinh câu hỏi từ AI. Vui lòng kiểm tra lại Key Gemini.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleApplyAiQuestionsToGame = async (saveToDb = false) => {
    if (!aiGeneratedQuestions || aiGeneratedQuestions.length === 0) return;

    // 1. Thêm vào danh sách câu hỏi đang chơi ngay
    const tagged = aiGeneratedQuestions.map(q => ({
      ...q,
      subject: aiSubject,
      grade: aiGrade,
      packTitle: `[AI] ${aiTopic || 'Soạn bằng AI'}`
    }));
    setQuestions(prev => [...tagged, ...prev]);
    setSelectedSubject(aiSubject);
    setCurrentQIndex(0);

    // 2. Tùy chọn lưu vào Database của trường
    if (saveToDb) {
      try {
        const teacherSess = getTeacherSession();
        const packTitle = `[AI] ${aiSubject} ${aiGrade} - ${aiTopic || 'Chủ đề khởi động'}`;
        const newPack = {
          title: packTitle,
          subject: aiSubject,
          grade: aiGrade,
          teacher_name: teacherSess?.fullName || 'Giáo viên bộ môn',
          duration_minutes: 15,
          status: 'active',
          questions: tagged
        };

        const { error } = await supabase.from('cbq_smart_assessments').insert([newPack]);
        if (!error) {
          setAssessments(prev => [newPack, ...prev]);
          alert(`🎉 Đã nạp ${aiGeneratedQuestions.length} câu hỏi vào trò chơi và LƯU THÀNH CÔNG vào Ngân hàng đề của trường!`);
        } else {
          alert(`🎉 Đã nạp ${aiGeneratedQuestions.length} câu hỏi vào trò chơi để học sinh chơi ngay!`);
        }
      } catch (e) {
        alert(`🎉 Đã nạp ${aiGeneratedQuestions.length} câu hỏi vào trò chơi để học sinh chơi ngay!`);
      }
    } else {
      alert(`🎉 Đã nạp thành công ${aiGeneratedQuestions.length} câu hỏi AI vào trò chơi! Thầy/Cô có thể bắt đầu cho học sinh chơi ngay.`);
    }

    setShowAiGenModal(false);
    setAiGeneratedQuestions([]);
    setAiTopic('');
    setAiRawContext('');
  };

  const handleAskAiExplanation = async () => {
    if (!currentQuestion) return;
    setAiExplaining(true);
    setAiExplanationText(null);
    try {
      const res = await explainQuestionAi({
        questionText: currentQuestion.content || currentQuestion.title,
        options: currentQuestion.options || ['A', 'B', 'C', 'D'],
        correctIndex: currentQuestion.correctAnswerIndex ?? 0,
        subject: currentQuestion.subject || selectedSubject || 'Toán học'
      });
      setAiExplanationText(res);
    } catch (err) {
      alert('Không thể gọi trợ giảng AI: ' + (err?.message || err));
    } finally {
      setAiExplaining(false);
    }
  };

  // Bật/tắt Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // ==========================================
  // HÀM RENDER SÂN KHẤU CÂU HỎI CHUẨN QUỐC TẾ (KAHOOT / QUIZIZZ PRO)
  // ==========================================
  const renderArenaContent = (isStage = false) => {
    return (
      <div style={{
        maxWidth: isStage ? '1350px' : '100%',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: isStage ? '20px' : '16px'
      }}>
        {/* THANH ĐIỀU KHIỂN & ĐỒNG HỒ ĐẾM NGƯỢC */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          background: isStage ? 'rgba(30, 41, 59, 0.75)' : '#1e293b',
          backdropFilter: 'blur(10px)',
          borderRadius: '18px',
          padding: isStage ? '14px 22px' : '12px 18px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {/* TIẾN TRÌNH CÂU HỎI */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#ffffff',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: isStage ? '15px' : '13px',
              fontWeight: '900',
              letterSpacing: '0.5px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
            }}>
              CÂU {currentQIndex + 1} / {filteredQuestions.length}
            </span>
            <span style={{ color: '#94a3b8', fontSize: isStage ? '14px' : '13px' }}>
              Môn: <strong style={{ color: '#f8fafc' }}>{currentQuestion?.subject || selectedSubject}</strong>
            </span>
          </div>

          {/* BỘ ĐẾM THỜI GIAN ĐẬP NHỊP SINH ĐỘNG */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: timeLeft <= 5
                ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                : (timeLeft <= 10 ? 'linear-gradient(135deg, #d97706, #b45309)' : 'linear-gradient(135deg, #059669, #047857)'),
              color: '#ffffff',
              padding: isStage ? '8px 22px' : '6px 16px',
              borderRadius: '24px',
              fontSize: isStage ? '22px' : '17px',
              fontWeight: '900',
              boxShadow: timeLeft <= 5 ? '0 0 24px rgba(239, 68, 68, 0.8)' : '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease',
              transform: timeLeft <= 5 ? 'scale(1.08)' : 'scale(1)'
            }}>
              <Clock size={isStage ? 22 : 18} />
              <span>{timeLeft}s</span>
            </div>

            {isTimerRunning ? (
              <button
                onClick={pauseTimer}
                style={{
                  background: '#f59e0b',
                  color: '#0f172a',
                  border: 'none',
                  padding: isStage ? '8px 18px' : '7px 14px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px'
                }}
              >
                <Pause size={15} /> Tạm Dừng
              </button>
            ) : (
              <button
                onClick={startTimer}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  border: 'none',
                  padding: isStage ? '8px 18px' : '7px 14px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                }}
              >
                <Play size={15} /> Bắt Đầu
              </button>
            )}

            <button
              onClick={() => resetTimer()}
              title="Đặt lại thời gian"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid #475569',
                color: '#e2e8f0',
                padding: '7px 11px',
                borderRadius: '10px',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={15} />
            </button>

            <select
              value={timerDuration}
              onChange={e => { const val = Number(e.target.value); setTimerDuration(val); resetTimer(val); }}
              style={{
                background: '#0f172a',
                color: '#e2e8f0',
                border: '1px solid #475569',
                borderRadius: '10px',
                padding: '7px 10px',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              <option value={10}>10 giây</option>
              <option value={15}>15 giây</option>
              <option value={20}>20 giây</option>
              <option value={30}>30 giây</option>
              <option value={45}>45 giây</option>
              <option value={60}>60 giây</option>
            </select>
          </div>

          {/* QUYỀN TRỢ GIÚP 50:50 & BIỂU QUYẾT KHÁN GIẢ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handle5050}
              disabled={eliminatedOptions.length > 0}
              style={{
                background: eliminatedOptions.length > 0 ? '#334155' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: eliminatedOptions.length > 0 ? 'not-allowed' : 'pointer',
                opacity: eliminatedOptions.length > 0 ? 0.5 : 1,
                boxShadow: eliminatedOptions.length > 0 ? 'none' : '0 4px 12px rgba(139, 92, 246, 0.4)'
              }}
            >
              ⚡ 50:50
            </button>

            <button
              onClick={handleAudienceHelp}
              disabled={Boolean(audienceVotes)}
              style={{
                background: audienceVotes ? '#334155' : 'linear-gradient(135deg, #06b6d4, #0891b2)',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: audienceVotes ? 'not-allowed' : 'pointer',
                opacity: audienceVotes ? 0.5 : 1,
                boxShadow: audienceVotes ? 'none' : '0 4px 12px rgba(6, 182, 212, 0.4)'
              }}
            >
              📊 Biểu Quyết
            </button>
          </div>
        </div>

        {/* HỘP CÂU HỎI KHỔNG LỒ RÕ NÉT */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.98) 100%)',
          borderRadius: '24px',
          border: '2px solid rgba(59, 130, 246, 0.5)',
          padding: isStage ? '32px 36px' : '24px 26px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45)',
          position: 'relative'
        }}>
          <div style={{
            display: 'inline-block',
            fontSize: isStage ? '13px' : '11.5px',
            fontWeight: '800',
            color: '#38bdf8',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            background: 'rgba(56, 189, 248, 0.12)',
            padding: '4px 12px',
            borderRadius: '8px',
            marginBottom: '12px'
          }}>
            {currentQuestion?.title || `CÂU HỎI THI ĐẤU #${currentQIndex + 1}`}
          </div>

          <div style={{
            fontSize: isStage ? '28px' : '22px',
            fontWeight: '800',
            lineHeight: '1.5',
            color: '#ffffff',
            textAlign: isStage ? 'center' : 'left',
            padding: isStage ? '6px 12px 14px 12px' : '0'
          }}>
            <MathView text={currentQuestion?.content || ''} />
          </div>
        </div>

        {/* 4 THẺ ĐÁP ÁN CHUẨN KAHOOT! / QUIZIZZ PRO */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
          gap: isStage ? '18px' : '14px'
        }}>
          {(currentQuestion?.options || ['A', 'B', 'C', 'D']).map((option, idx) => {
            const theme = KAHOOT_THEME[idx % 4];
            const isCorrect = idx === (currentQuestion.correctAnswerIndex ?? 0);
            const isEliminated = eliminatedOptions.includes(idx);
            const votePct = audienceVotes ? audienceVotes[idx] : null;

            let cardBg = theme.bg;
            let cardBorder = `2px solid ${theme.border}`;
            let cardOpacity = 1;
            let cardShadow = theme.shadow;
            let cardTransform = 'scale(1)';

            if (showAnswer) {
              if (isCorrect) {
                cardBg = 'linear-gradient(135deg, #15803d 0%, #166534 100%)';
                cardBorder = '3.5px solid #4ade80';
                cardShadow = '0 0 35px rgba(74, 222, 128, 0.8), 0 8px 25px rgba(0,0,0,0.5)';
                cardTransform = 'scale(1.02)';
              } else {
                cardOpacity = 0.25;
                cardShadow = 'none';
              }
            } else if (isEliminated) {
              cardOpacity = 0.2;
              cardBg = '#1e293b';
              cardBorder = '1.5px dashed #475569';
              cardShadow = 'none';
            }

            return (
              <div
                key={idx}
                style={{
                  background: cardBg,
                  border: cardBorder,
                  borderRadius: '20px',
                  padding: isStage ? '20px 24px' : '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  opacity: cardOpacity,
                  boxShadow: cardShadow,
                  transform: cardTransform,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  minHeight: isStage ? '96px' : '76px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Huy hiệu A, B, C, D kèm Shape Tam giác/Hình thoi/Tròn/Vuông */}
                <div style={{
                  width: isStage ? '52px' : '44px',
                  height: isStage ? '52px' : '44px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(6px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: '1.5px solid rgba(255, 255, 255, 0.45)'
                }}>
                  <span style={{ fontSize: isStage ? '13px' : '11px', lineHeight: 1, opacity: 0.9 }}>
                    {theme.shape}
                  </span>
                  <span style={{ fontSize: isStage ? '22px' : '18px', fontWeight: '900', color: '#ffffff', lineHeight: 1, marginTop: '2px' }}>
                    {theme.label}
                  </span>
                </div>

                {/* Nội dung đáp án */}
                <div style={{
                  flex: 1,
                  fontSize: isStage ? '21px' : '17px',
                  fontWeight: '700',
                  color: '#ffffff',
                  lineHeight: '1.4'
                }}>
                  <MathView text={String(option)} />
                </div>

                {/* Biểu quyết phần trăm */}
                {votePct !== null && !isEliminated && (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.5)',
                    padding: '6px 14px',
                    borderRadius: '14px',
                    fontSize: isStage ? '16px' : '13px',
                    fontWeight: '900',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.5)'
                  }}>
                    {votePct}%
                  </div>
                )}

                {/* Huy hiệu đáp án đúng khi công bố */}
                {showAnswer && isCorrect && (
                  <div style={{
                    background: '#22c55e',
                    color: '#ffffff',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontWeight: '900',
                    fontSize: isStage ? '14px' : '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
                  }}>
                    <CheckCircle2 size={isStage ? 20 : 16} />
                    <span>CHÍNH XÁC</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* LỜI GIẢI CHI TIẾT & TRỢ GIẢNG AI */}
        {showExplanation && currentQuestion?.explanation && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '2px solid #10b981',
            borderRadius: '18px',
            padding: '16px 22px',
            color: '#d1fae5',
            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.2)'
          }}>
            <div style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '900', fontSize: '15px' }}>
              <CheckCircle2 size={19} /> HƯỚNG DẪN GIẢI SƯ PHẠM CHI TIẾT:
            </div>
            <div style={{ fontSize: '16px', lineHeight: '1.6' }}>
              <MathView text={currentQuestion.explanation} />
            </div>
          </div>
        )}

        {/* NÚT TRỢ GIẢNG AI GIẢI THÍCH CHUYÊN SÂU KHI CÔNG BỐ ĐÁP ÁN */}
        {showAnswer && !aiExplanationText && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleAskAiExplanation}
              disabled={aiExplaining}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                border: 'none',
                color: '#ffffff',
                padding: '9px 18px',
                borderRadius: '12px',
                fontWeight: '800',
                fontSize: '13.5px',
                cursor: aiExplaining ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
              }}
            >
              <Sparkles size={16} />
              {aiExplaining ? 'Trợ lý AI đang phân tích sư phạm...' : '💡 AI Sư Phạm: Giải thích bản chất & Mẹo nhớ cho học sinh'}
            </button>
          </div>
        )}

        {/* BẢNG GIẢI THÍCH SƯ PHẠM CỦA GEMINI AI */}
        {showAnswer && aiExplanationText && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
            border: '2px solid #818cf8',
            borderRadius: '18px',
            padding: '18px 22px',
            color: '#e0e7ff',
            boxShadow: '0 8px 25px rgba(99, 102, 241, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', fontSize: '15px' }}>
                <Sparkles size={19} color="#c084fc" /> 🤖 TRỢ GIẢNG AI SƯ PHẠM (GOOGLE GEMINI):
              </div>
              <button
                type="button"
                onClick={() => setAiExplanationText(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
              >
                ✕ Đóng
              </button>
            </div>
            <div style={{ fontSize: '15px', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
              {aiExplanationText}
            </div>
          </div>
        )}

        {/* THANH ĐIỀU KHIỂN CỦA GIÁO VIÊN */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          background: isStage ? 'rgba(30, 41, 59, 0.85)' : '#1e293b',
          backdropFilter: 'blur(10px)',
          borderRadius: '18px',
          padding: '12px 20px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handlePrevQuestion}
              style={{
                background: '#334155',
                color: '#ffffff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13.5px'
              }}
            >
              <ChevronLeft size={17} /> Câu Trước (←)
            </button>

            <button
              onClick={handleNextQuestion}
              style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                border: 'none',
                padding: '10px 22px',
                borderRadius: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13.5px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
              }}
            >
              Câu Kế Tiếp (→) <ChevronRight size={17} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleRevealAnswer}
              style={{
                background: showAnswer ? '#15803d' : 'linear-gradient(135deg, #10b981, #059669)',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '12px',
                fontWeight: '900',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13.5px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              <CheckCircle2 size={17} />
              <span>{showAnswer ? '✓ Đã Hiện Đáp Án' : 'Hiện Đáp Án Đúng (Enter)'}</span>
            </button>

            <button
              onClick={() => setShowExplanation(!showExplanation)}
              style={{
                background: showExplanation ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.08)',
                border: `1.5px solid ${showExplanation ? '#38bdf8' : '#475569'}`,
                color: showExplanation ? '#38bdf8' : '#e2e8f0',
                padding: '10px 16px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px'
              }}
            >
              {showExplanation ? <EyeOff size={15} /> : <Eye size={15} />}
              <span>Lời Giải</span>
            </button>

            {/* NÚT BẬT/TẮT SÂN KHẤU TRÌNH CHIẾU PRO */}
            <button
              onClick={() => {
                const nextVal = !isStageMode;
                setIsStageMode(nextVal);
                if (nextVal && !document.fullscreenElement) {
                  toggleFullscreen();
                }
              }}
              style={{
                background: isStageMode
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                color: '#ffffff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '12px',
                fontWeight: '900',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13.5px',
                boxShadow: '0 4px 16px rgba(139, 92, 246, 0.5)'
              }}
            >
              {isStageMode ? <Minimize2 size={17} /> : <Tv size={17} />}
              <span>{isStageMode ? 'Thu Nhỏ Sân Khấu (Esc)' : '🎬 Bật Sân Khấu Pro'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#ffffff',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: '80px'
    }}>
      {showConfetti && (
        <Confetti
          width={typeof window !== 'undefined' ? window.innerWidth : 1200}
          height={typeof window !== 'undefined' ? window.innerHeight : 800}
          recycle={false}
          numberOfPieces={400}
        />
      )}

      {/* ========================================================
          CHẾ ĐỘ SÂN KHẤU TRÌNH CHIẾU PRO (KAHOOT / QUIZIZZ STAGE MODE)
          ======================================================== */}
      {isStageMode ? (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          backgroundColor: '#090d16',
          backgroundImage: 'radial-gradient(ellipse at 50% 15%, rgba(37, 99, 235, 0.18) 0%, rgba(9, 13, 22, 0.98) 75%)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          paddingBottom: '30px'
        }}>
          {/* TOP STATUS BAR SÂN KHẤU KÍNH MỜ (CAO 54px) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 24px',
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            position: 'sticky',
            top: 0,
            zIndex: 50
          }}>
            {/* THÔNG TIN VÒNG THI & LỚP */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '20px' }}>🏆</span>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '900', color: '#f8fafc', letterSpacing: '-0.2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{gameMode === 'arena' ? 'ĐẤU TRƯỜNG TRI THỨC' : 'SÂN KHẤU TRÌNH CHIẾU'}</span>
                  <span style={{ background: '#16a34a', color: '#ffffff', fontSize: '10px', fontWeight: '900', padding: '1px 8px', borderRadius: '10px', textTransform: 'uppercase' }}>
                    PRO STAGE
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Lớp: <strong style={{ color: '#fef08a' }}>{selectedClass || 'CBQ'}</strong> ({classStudents.length} HS) • Môn: <strong style={{ color: '#e2e8f0' }}>{currentQuestion?.subject || selectedSubject}</strong>
                </div>
              </div>
            </div>

            {/* BỘ ĐẾM TIẾN TRÌNH CÂU HỎI TRUNG TÂM */}
            <div style={{
              background: 'rgba(37, 99, 235, 0.25)',
              border: '1.5px solid #3b82f6',
              color: '#93c5fd',
              padding: '6px 20px',
              borderRadius: '24px',
              fontSize: '14.5px',
              fontWeight: '900',
              letterSpacing: '0.5px',
              boxShadow: '0 0 15px rgba(59, 130, 246, 0.35)'
            }}>
              CÂU HỎI {currentQIndex + 1} / {filteredQuestions.length}
            </div>

            {/* CÁC NÚT ĐIỀU KHIỂN SÂN KHẤU */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => {
                  const muted = gameAudio.toggleMute();
                  setIsMuted(muted);
                }}
                title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid #475569', color: '#e2e8f0', padding: '7px 12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>

              <button
                onClick={() => setShowQuickSettings(!showQuickSettings)}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid #475569', color: '#e2e8f0', padding: '7px 14px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold' }}
              >
                <Settings size={15} /> <span>Đổi Môn/Lớp</span>
              </button>

              <button
                onClick={toggleFullscreen}
                title="Bật/Tắt Toàn màn hình"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid #475569', color: '#e2e8f0', padding: '7px 12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              <button
                onClick={() => setIsStageMode(false)}
                style={{ background: '#dc2626', border: 'none', color: '#ffffff', padding: '7px 16px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '900', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)' }}
              >
                <X size={16} /> <span>Thoát Sân Khấu</span>
              </button>
            </div>
          </div>

          {/* POPOVER CÀI ĐẶT NHANH (NẾU MỞ) */}
          {showQuickSettings && (
            <div style={{
              background: '#1e293b',
              borderBottom: '2px solid #3b82f6',
              padding: '14px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Môn:</span>
                <select
                  value={selectedSubject}
                  onChange={e => { setSelectedSubject(e.target.value); setCurrentQIndex(0); }}
                  style={{ background: '#0f172a', color: '#ffffff', border: '1px solid #475569', borderRadius: '8px', padding: '6px 12px', fontSize: '13px' }}
                >
                  <option value="Tất cả môn">📚 Tất cả môn</option>
                  {HIGH_SCHOOL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="Truyền thống nhà trường">🏛️ Truyền thống THPT Cao Bá Quát</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Bộ đề:</span>
                <select
                  value={selectedAssessmentId}
                  onChange={e => { setSelectedAssessmentId(e.target.value); setCurrentQIndex(0); }}
                  style={{ background: '#0f172a', color: '#ffffff', border: '1px solid #475569', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', maxWidth: '300px' }}
                >
                  <option value="all">🎯 Tất cả ({filteredQuestions.length} câu)</option>
                  {assessments.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#f59e0b' }}>Lớp:</span>
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  style={{ background: '#0f172a', color: '#fef08a', border: '1.5px solid #f59e0b', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', fontWeight: 'bold' }}
                >
                  {classesList.map(c => <option key={c} value={c}>Lớp {c} ({allStudents.filter(s => s.student_class === c).length} HS)</option>)}
                </select>
              </div>

              <div style={{ marginLeft: 'auto' }}>
                <button
                  onClick={() => setShowQuickSettings(false)}
                  style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '7px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                >
                  Áp Dụng & Đóng
                </button>
              </div>
            </div>
          )}

          {/* VÙNG SÂN KHẤU TRÌNH CHIẾU CHÍNH */}
          <div style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '24px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {renderArenaContent(true)}
          </div>

          {/* GỢI Ý PHÍM TẮT DƯỚI ĐÁY */}
          <div style={{
            textAlign: 'center',
            padding: '10px 16px',
            fontSize: '12.5px',
            color: '#64748b',
            background: 'rgba(15, 23, 42, 0.95)',
            borderTop: '1px solid rgba(255,255,255,0.08)'
          }}>
            💡 <strong>Phím tắt giáo viên & bút Clicker:</strong> [Phím Space]: Bắt đầu/Tạm dừng giờ • [Mũi tên →]: Câu tiếp theo • [Mũi tên ←]: Câu trước • [Phím Enter]: Hiện đáp án • [Phím F]: Toàn màn hình • [Phím Esc]: Thoát sân khấu
          </div>
        </div>
      ) : (
        /* GIAO DIỆN CHUẨN CỦA GIÁO VIÊN (STANDARD MODE) */
        <>
          {/* TOP HEADER & CONTROL BAR */}
          <header style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderBottom: '1.5px solid #334155',
            padding: '16px 20px',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => navigate('/giao-vien/dashboard')}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid #475569',
                    color: '#e2e8f0',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  <ArrowLeft size={16} /> Bàn Làm Việc
                </button>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>🎮</span>
                    <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.3px' }}>
                      HỆ THỐNG TRÒ CHƠI & TIỆN ÍCH TRỢ GIẢNG 4.0
                    </h1>
                    <span style={{ background: '#16a34a', color: '#ffffff', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px' }}>
                      Live Database
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                    Trường THPT Cao Bá Quát • Đồng bộ trực tiếp CSDL Đề thi, Câu hỏi & Danh sách 1.441 Học sinh
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* NÚT BẬT SÂN KHẤU TRÌNH CHIẾU PRO NGAY TRÊN HEADER */}
                <button
                  onClick={() => {
                    setIsStageMode(true);
                    if (!document.fullscreenElement) {
                      toggleFullscreen();
                    }
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 18px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13.5px',
                    fontWeight: '900',
                    boxShadow: '0 4px 16px rgba(139, 92, 246, 0.45)'
                  }}
                >
                  <Tv size={17} /> <span>🎬 Bật Sân Khấu Pro</span>
                </button>

                <button
                  onClick={() => {
                    const muted = gameAudio.toggleMute();
                    setIsMuted(muted);
                  }}
                  style={{
                    background: isMuted ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)',
                    border: `1px solid ${isMuted ? '#ef4444' : '#3b82f6'}`,
                    color: isMuted ? '#f87171' : '#60a5fa',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 'bold'
                  }}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  <span>{isMuted ? 'Tắt Âm' : 'Bật Âm'}</span>
                </button>

                <button
                  onClick={toggleFullscreen}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid #475569',
                    color: '#e2e8f0',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  <span>{isFullscreen ? 'Thu Nhỏ' : 'Toàn Màn Hình'}</span>
                </button>

                <button
                  onClick={() => setShowAddModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                  }}
                >
                  <Plus size={16} /> Thêm Câu Hỏi CSDL
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAiSubject(selectedSubject !== 'Tất cả môn' ? selectedSubject : 'Toán');
                    setShowAiGenModal(true);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
                  }}
                  title="Dùng Google Gemini AI soạn tự động câu hỏi theo chủ đề bài học"
                >
                  <Sparkles size={16} /> Soạn Đề Bằng AI
                </button>

                <AiStatusBadge />
              </div>
            </div>
          </header>

      {/* THANH LỌC NGUỒN CSDL: MÔN HỌC, ĐỀ THI & LỚP */}
      <div style={{
        background: '#1e293b',
        borderBottom: '1px solid #334155',
        padding: '12px 20px',
        marginBottom: '20px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '13px', fontWeight: 'bold' }}>
            <Database size={16} /> CSDL Môn học:
          </div>

          <select
            value={selectedSubject}
            onChange={e => { setSelectedSubject(e.target.value); setCurrentQIndex(0); }}
            style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#ffffff', fontSize: '13px', fontWeight: '600' }}
          >
            <option value="Tất cả môn">📚 Tất cả môn học</option>
            {HIGH_SCHOOL_SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            <option value="Truyền thống nhà trường">🏛️ Truyền thống THPT Cao Bá Quát</option>
          </select>

          <select
            value={selectedAssessmentId}
            onChange={e => { setSelectedAssessmentId(e.target.value); setCurrentQIndex(0); }}
            style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#ffffff', fontSize: '13px', maxWidth: '320px' }}
          >
            <option value="all">🎯 Tất cả bộ câu hỏi ({filteredQuestions.length} câu)</option>
            {assessments.map(pack => (
              <option key={pack.id} value={pack.id}>{pack.title} ({pack.questions?.length || 0} câu)</option>
            ))}
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
            <Users size={16} color="#f59e0b" />
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#f59e0b' }}>Lớp Thực Hiện:</span>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: '8px', border: '1.5px solid #f59e0b', background: '#0f172a', color: '#fef08a', fontSize: '13px', fontWeight: 'bold' }}
            >
              {classesList.length === 0 ? (
                <option value="">{loading ? '⏳ Đang nạp dữ liệu 34 lớp...' : '⚠️ Không tìm thấy lớp'}</option>
              ) : (
                classesList.map(cls => (
                  <option key={cls} value={cls}>Lớp {cls} ({allStudents.filter(s => s.student_class === cls).length} HS)</option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* CHUYỂN ĐỔI 2 PHÂN HỆ LỚN: TRÒ CHƠI LỚP HỌC vs TIỆN ÍCH TRỢ GIẢNG */}
      <div style={{ maxWidth: '1400px', margin: '0 auto 16px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #334155', paddingBottom: '10px' }}>
          <button
            onClick={() => setMainTab('games')}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: mainTab === 'games' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#1e293b',
              color: mainTab === 'games' ? '#ffffff' : '#94a3b8',
              fontSize: '15px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: mainTab === 'games' ? '0 4px 14px rgba(37,99,235,0.4)' : 'none'
            }}
          >
            <Trophy size={18} />
            <span>🎮 TRÒ CHƠI LỚP HỌC (6 Thể Loại)</span>
          </button>

          <button
            onClick={() => setMainTab('tools')}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: mainTab === 'tools' ? 'linear-gradient(135deg, #059669, #047857)' : '#1e293b',
              color: mainTab === 'tools' ? '#ffffff' : '#94a3b8',
              fontSize: '15px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: mainTab === 'tools' ? '0 4px 14px rgba(5,150,105,0.4)' : 'none'
            }}
          >
            <Zap size={18} />
            <span>🛠️ TIỆN ÍCH TRỢ GIẢNG 4.0 (4 Công Cụ)</span>
          </button>
        </div>
      </div>

      {/* THANH CHỌN SUB-MODE CỦA TAB ĐANG CHỌN */}
      <div style={{ maxWidth: '1400px', margin: '0 auto 24px auto', padding: '0 20px' }}>
        <div className="mobile-tab-scroll" style={{
          display: 'flex',
          gap: '10px',
          background: '#1e293b',
          padding: '6px',
          borderRadius: '16px',
          border: '1px solid #334155'
        }}>
          {mainTab === 'games' ? (
            <>
              <button
                onClick={() => { setGameMode('arena'); resetTimer(); }}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: '10px', border: 'none',
                  background: gameMode === 'arena' ? '#2563eb' : 'transparent',
                  color: gameMode === 'arena' ? '#ffffff' : '#94a3b8',
                  fontSize: '13.5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <Trophy size={16} /> 1. Đấu Trường Tri Thức
              </button>

              <button
                onClick={() => { setGameMode('wheel'); resetTimer(); }}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: '10px', border: 'none',
                  background: gameMode === 'wheel' ? '#ea580c' : 'transparent',
                  color: gameMode === 'wheel' ? '#ffffff' : '#94a3b8',
                  fontSize: '13.5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <Sparkles size={16} /> 2. Vòng Quay May Mắn ({classStudents.length} HS)
              </button>

              <button
                onClick={() => { setGameMode('team_battle'); resetTimer(); }}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: '10px', border: 'none',
                  background: gameMode === 'team_battle' ? '#16a34a' : 'transparent',
                  color: gameMode === 'team_battle' ? '#ffffff' : '#94a3b8',
                  fontSize: '13.5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <Flame size={16} /> 3. Đại Chiến 4 Tổ
              </button>

              <button
                onClick={() => { setGameMode('puzzle'); resetTimer(); }}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: '10px', border: 'none',
                  background: gameMode === 'puzzle' ? '#9333ea' : 'transparent',
                  color: gameMode === 'puzzle' ? '#ffffff' : '#94a3b8',
                  fontSize: '13.5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <Layers size={16} /> 4. Mảnh Ghép Khởi Động
              </button>

              <button
                onClick={() => { setGameMode('mystery_box'); resetTimer(); }}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: '10px', border: 'none',
                  background: gameMode === 'mystery_box' ? '#d97706' : 'transparent',
                  color: gameMode === 'mystery_box' ? '#ffffff' : '#94a3b8',
                  fontSize: '13.5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <Gift size={16} /> 5. Hộp Quà Bí Ẩn
              </button>

              <button
                onClick={() => { setGameMode('speed_streak'); resetTimer(); }}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: '10px', border: 'none',
                  background: gameMode === 'speed_streak' ? '#e11d48' : 'transparent',
                  color: gameMode === 'speed_streak' ? '#ffffff' : '#94a3b8',
                  fontSize: '13.5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <Zap size={16} /> 6. Đua Tốc Độ & Combo
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setToolMode('timer')}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: '10px', border: 'none',
                  background: toolMode === 'timer' ? '#059669' : 'transparent',
                  color: toolMode === 'timer' ? '#ffffff' : '#94a3b8',
                  fontSize: '13.5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <Clock size={16} /> 1. Đồng Hồ Sư Phạm (Timer/Pomodoro)
              </button>

              <button
                onClick={() => setToolMode('group_generator')}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: '10px', border: 'none',
                  background: toolMode === 'group_generator' ? '#2563eb' : 'transparent',
                  color: toolMode === 'group_generator' ? '#ffffff' : '#94a3b8',
                  fontSize: '13.5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <Users size={16} /> 2. Chia Nhóm Ngẫu Nhiên (CSDL Lớp)
              </button>

              <button
                onClick={() => setToolMode('noise_meter')}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: '10px', border: 'none',
                  background: toolMode === 'noise_meter' ? '#ea580c' : 'transparent',
                  color: toolMode === 'noise_meter' ? '#ffffff' : '#94a3b8',
                  fontSize: '13.5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <Mic size={16} /> 3. Đo Độ Ồn & Cảnh Báo Lớp Học
              </button>

              <button
                onClick={() => setToolMode('behavior_tracker')}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: '10px', border: 'none',
                  background: toolMode === 'behavior_tracker' ? '#9333ea' : 'transparent',
                  color: toolMode === 'behavior_tracker' ? '#ffffff' : '#94a3b8',
                  fontSize: '13.5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                <Star size={16} /> 4. Bảng Tích Điểm Thái Độ Học Sinh
              </button>
            </>
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
            <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 16px auto', color: '#38bdf8' }} />
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Đang nạp ngân hàng câu hỏi & CSDL học sinh trường THPT Cao Bá Quát...</div>
          </div>
        ) : mainTab === 'games' ? (
          
          /* ========================================================
             TAB 1: TRÒ CHƠI LỚP HỌC (6 THỂ LOẠI)
             ======================================================== */
          gameMode === 'arena' ? (
            /* 1. ĐẤU TRƯỜNG TRI THỨC (GIAO DIỆN CHUẨN QUỐC TẾ KAHOOT! / QUIZIZZ PRO) */
            renderArenaContent(false)
          ) : gameMode === 'wheel' ? (
            /* 2. VÒNG QUAY MAY MẮN */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))', gap: '28px', alignItems: 'start' }}>
              <div style={{ background: '#1e293b', borderRadius: '24px', padding: '24px', border: '1px solid #334155', textAlign: 'center' }}>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#f8fafc' }}>🎡 Vòng Quay Lớp {selectedClass}</h3>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Tổng số: {classStudents.length} học sinh đồng bộ từ CSDL</div>
                  </div>
                  <button onClick={spinWheel} disabled={isSpinning || classStudents.length === 0} style={{ background: isSpinning ? '#475569' : '#ef4444', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {isSpinning ? 'Đang quay...' : 'QUAY NGAY ➔'}
                  </button>
                </div>
                <canvas ref={canvasRef} width={420} height={420} style={{ maxWidth: '100%', height: 'auto', borderRadius: '50%', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
              </div>

              <div style={{ background: '#1e293b', borderRadius: '24px', padding: '24px', border: '1px solid #334155' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trophy size={20} /> Kết Quả Bốc Thăm & Trả Lời
                </h3>
                {wheelWinner ? (
                  <div>
                    <div style={{ background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)', borderRadius: '18px', padding: '20px', marginBottom: '20px', border: '2px solid #34d399' }}>
                      <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#a7f3d0' }}>🎉 Học sinh được gọi tên:</div>
                      <div style={{ fontSize: '26px', fontWeight: '900', color: '#ffffff', margin: '6px 0' }}>{wheelWinner.full_name}</div>
                      <div style={{ display: 'flex', gap: '14px', fontSize: '13px', color: '#d1fae5' }}>
                        <span>Lớp: <strong>{selectedClass}</strong></span>
                        <span>Mã HS: <strong>{wheelWinner.student_code || '---'}</strong></span>
                      </div>
                    </div>

                    {wheelStudentQuestion && (
                      <div style={{ background: '#0f172a', borderRadius: '16px', padding: '18px', border: '1px solid #334155', marginBottom: '20px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '6px' }}>❓ CÂU HỎI DÀNH CHO EM:</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc', marginBottom: '14px' }}>
                          <MathView text={wheelStudentQuestion.content} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(wheelStudentQuestion.options || []).map((opt, oIdx) => (
                            <div key={oIdx} style={{ padding: '8px 12px', borderRadius: '8px', background: showAnswer && oIdx === wheelStudentQuestion.correctAnswerIndex ? '#15803d' : '#1e293b', border: '1px solid #334155', color: '#e2e8f0', fontSize: '14px' }}>
                              <strong style={{ color: '#94a3b8', marginRight: '6px' }}>{String.fromCharCode(65 + oIdx)}.</strong>
                              <MathView text={String(opt)} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => handleAwardStudent(10)} style={{ flex: 1, background: '#16a34a', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>⭐ Cộng +10 Điểm</button>
                      <button onClick={() => handleAwardStudent(5)} style={{ flex: 1, background: '#eab308', color: '#0f172a', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>⭐ Cộng +5 Điểm</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 10px', color: '#64748b' }}>
                    <Sparkles size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                    <p>Bấm nút "QUAY NGAY" để bốc thăm ngẫu nhiên học sinh từ CSDL lớp {selectedClass}!</p>
                  </div>
                )}
              </div>
            </div>
          ) : gameMode === 'team_battle' ? (
            /* 3. ĐẠI CHIẾN 4 TỔ */
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '16px', marginBottom: '24px' }}>
                {teams.map(team => {
                  const isBuzzed = buzzedTeam?.id === team.id;
                  return (
                    <div key={team.id} style={{ background: '#1e293b', border: isBuzzed ? '3px solid #facc15' : `2px solid ${team.color}`, borderRadius: '20px', padding: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: team.color }}>{team.name}</span>
                        {isBuzzed && <span style={{ background: '#facc15', color: '#0f172a', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px' }}>🔔 CHUÔNG!</span>}
                      </div>
                      <div style={{ fontSize: '36px', fontWeight: '900', color: '#ffffff', textAlign: 'center', margin: '8px 0' }}>{team.score} đ</div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleTeamBuzz(team)} style={{ flex: 1, background: team.color, color: '#ffffff', border: 'none', padding: '7px 4px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>🔔 Chuông</button>
                        <button onClick={() => handleTeamScore(team.id, 10)} style={{ background: '#16a34a', color: '#ffffff', border: 'none', padding: '7px 10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+10</button>
                        <button onClick={() => handleTeamScore(team.id, -5)} style={{ background: '#ef4444', color: '#ffffff', border: 'none', padding: '7px 10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>-5</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: '#1e293b', borderRadius: '20px', border: '1.5px solid #334155', padding: '28px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ background: '#2563eb', color: '#ffffff', fontSize: '13px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '20px' }}>CÂU ĐỐ THI ĐẤU #{currentQIndex + 1}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleNextQuestion} style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Đổi Câu Tiếp ▶</button>
                    <button onClick={handleFinishTeamBattle} style={{ background: '#f59e0b', color: '#0f172a', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>🏆 Trao Cúp</button>
                  </div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '18px' }}><MathView text={currentQuestion?.content || ''} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '12px' }}>
                  {(currentQuestion?.options || []).map((opt, idx) => (
                    <div key={idx} style={{ padding: '12px 16px', borderRadius: '12px', background: showAnswer && idx === currentQuestion.correctAnswerIndex ? '#15803d' : '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}>
                      <strong style={{ color: '#38bdf8', marginRight: '8px' }}>{String.fromCharCode(65 + idx)}.</strong>
                      <MathView text={String(opt)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : gameMode === 'puzzle' ? (
            /* 4. MẢNH GHÉP KHỞI ĐỘNG */
            <div style={{ background: '#1e293b', borderRadius: '24px', padding: '28px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#a855f7' }}>🧩 Lật Mảnh Ghép Khám Phá Bài Mới</h3>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>Trả lời đúng từng câu hỏi để lật mở từ khóa hoặc bức tranh chủ đề</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="text" value={puzzleKeyword} onChange={e => setPuzzleKeyword(e.target.value)} style={{ background: '#0f172a', border: '1px solid #475569', color: '#facc15', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold' }} />
                  <button onClick={() => { setOpenedTiles([]); setIsPuzzleSolved(false); }} style={{ background: '#475569', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>Đặt lại</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[0, 1, 2, 3, 4, 5].map(idx => {
                  const isOpened = openedTiles.includes(idx) || isPuzzleSolved;
                  return (
                    <div key={idx} onClick={() => handleOpenTile(idx)} style={{
                      height: '140px', borderRadius: '16px',
                      background: isOpened ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: isOpened ? '28px' : '36px', fontWeight: '900', cursor: isOpened ? 'default' : 'pointer'
                    }}>
                      {isOpened ? <span>{puzzleKeyword[idx] || '✨'}</span> : <span>#{idx + 1}</span>}
                    </div>
                  );
                })}
              </div>

              {activeTileIndex !== null && currentQuestion && (
                <div style={{ background: '#0f172a', borderRadius: '18px', padding: '20px', border: '2px solid #a855f7' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#c084fc', marginBottom: '8px' }}>❓ CÂU HỎI MỞ MẢNH GHÉP #{activeTileIndex + 1}:</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}><MathView text={currentQuestion.content} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    {(currentQuestion.options || []).map((opt, oIdx) => (
                      <div key={oIdx} onClick={() => handleSolveTileQuestion(oIdx === currentQuestion.correctAnswerIndex)} style={{ padding: '12px 14px', borderRadius: '10px', background: '#1e293b', border: '1px solid #475569', color: '#ffffff', cursor: 'pointer' }}>
                        {String.fromCharCode(65 + oIdx)}. <MathView text={String(opt)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : gameMode === 'mystery_box' ? (
            /* 5. HỘP QUÀ BÍ ẨN / MA TRẬN ĐIỂM SỐ */
            <div style={{ background: '#1e293b', borderRadius: '24px', padding: '28px', border: '1px solid #334155' }}>
              <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Gift size={20} /> 🎁 Hộp Quà Bí Ẩn / Ma Trận Điểm Số
                  </h3>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>Mỗi hộp quà chứa 1 thử thách điểm số bất ngờ và 1 câu hỏi từ CSDL!</div>
                </div>
                <button onClick={() => { setMysteryBoxes(prev => prev.map(b => ({ ...b, opened: false }))); setSelectedBox(null); }} style={{ background: '#475569', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Làm mới hộp quà
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '16px', marginBottom: '28px' }}>
                {mysteryBoxes.map(box => (
                  <div
                    key={box.id}
                    onClick={() => handleOpenMysteryBox(box)}
                    style={{
                      height: '140px', borderRadius: '18px',
                      background: box.opened ? '#0f172a' : 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                      border: box.opened ? '2px dashed #475569' : '2px solid #fde047',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: box.opened ? 'default' : 'pointer', transform: box.opened ? 'scale(0.96)' : 'scale(1)',
                      boxShadow: box.opened ? 'none' : '0 8px 20px rgba(217,119,6,0.3)', transition: 'all 0.3s'
                    }}
                  >
                    <span style={{ fontSize: '36px', marginBottom: '6px' }}>{box.opened ? box.icon : '🎁'}</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: box.opened ? '#facc15' : '#ffffff' }}>
                      {box.opened ? (box.points > 0 ? `+${box.points} điểm` : `${box.points} điểm`) : box.label}
                    </span>
                  </div>
                ))}
              </div>

              {selectedBox && currentQuestion && (
                <div style={{ background: '#0f172a', borderRadius: '20px', padding: '24px', border: '2px solid #f59e0b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ color: '#facc15', fontWeight: 'bold', fontSize: '15px' }}>
                      🎉 ĐÃ MỞ {selectedBox.label}: {selectedBox.points > 0 ? `+${selectedBox.points} điểm thưởng` : `${selectedBox.points} điểm thử thách`}!
                    </span>
                    <button onClick={handleNextQuestion} style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>Đổi câu khác</button>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '14px' }}>
                    <MathView text={currentQuestion.content} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {(currentQuestion.options || []).map((opt, idx) => (
                      <div key={idx} style={{ padding: '12px', borderRadius: '10px', background: showAnswer && idx === currentQuestion.correctAnswerIndex ? '#15803d' : '#1e293b', border: '1px solid #334155', color: '#ffffff' }}>
                        {String.fromCharCode(65 + idx)}. <MathView text={String(opt)} />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <button onClick={() => setShowAnswer(!showAnswer)} style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                      {showAnswer ? 'Ẩn đáp án' : 'Hiện đáp án'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* 6. ĐUA TỐC ĐỘ & CHUỖI TRẢ LỜI LIÊN HOÀN (SPEED STREAK) */
            <div style={{ background: '#1e293b', borderRadius: '24px', padding: '28px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#e11d48', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={20} /> ⚡ Đua Tốc Độ & Chuỗi Trả Lời Liên Hoàn (Streak)
                  </h3>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>Trả lời đúng liên tiếp để nhân đôi, nhân ba điểm số!</div>
                </div>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{ background: '#0f172a', padding: '8px 16px', borderRadius: '12px', border: '1px solid #e11d48', textAlign: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#fda4af' }}>COMBO STREAK:</span>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#f43f5e' }}>🔥 x{streakCount}</div>
                  </div>
                  <div style={{ background: '#0f172a', padding: '8px 16px', borderRadius: '12px', border: '1px solid #38bdf8', textAlign: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#bae6fd' }}>ĐIỂM TÍCH LŨY:</span>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#38bdf8' }}>{streakScore} đ</div>
                  </div>
                </div>
              </div>

              {currentQuestion && (
                <div style={{ background: '#0f172a', borderRadius: '20px', padding: '24px', border: '2px solid #e11d48' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginBottom: '18px' }}>
                    <MathView text={currentQuestion.content} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '12px' }}>
                    {(currentQuestion.options || []).map((opt, idx) => {
                      const isChosen = speedAnswered === idx;
                      const isCorrect = idx === currentQuestion.correctAnswerIndex;
                      let bg = '#1e293b';
                      if (speedAnswered !== null) {
                        if (isCorrect) bg = '#15803d';
                        else if (isChosen) bg = '#991b1b';
                      }
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSpeedAnswer(idx)}
                          style={{
                            padding: '16px', borderRadius: '12px', background: bg, border: '1px solid #475569',
                            color: '#ffffff', fontSize: '16px', fontWeight: 'bold', textAlign: 'left', cursor: speedAnswered !== null ? 'default' : 'pointer'
                          }}
                        >
                          {String.fromCharCode(65 + idx)}. <MathView text={String(opt)} />
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleNextQuestion} style={{ background: '#e11d48', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                      Câu Tiếp Theo ➔
                    </button>
                  </div>
                </div>
              )}
            </div>
          )

        ) : (

          /* ========================================================
             TAB 2: TIỆN ÍCH TRỢ GIẢNG 4.0 (4 CÔNG CỤ HIỆN ĐẠI)
             ======================================================== */
          toolMode === 'timer' ? (
            /* TIỆN ÍCH 1: ĐỒNG HỒ SƯ PHẠM (TIMER & STOPWATCH) */
            <div style={{ background: '#1e293b', borderRadius: '24px', padding: '32px', border: '1px solid #334155', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Clock size={24} /> Bộ Đồng Hồ Sư Phạm Toàn Màn Hình
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>Đếm ngược làm bài tập nhóm, thuyết trình hoặc kiểm tra 15 phút</p>

              {/* MÀN HÌNH ĐỒNG HỒ KHỔ LỚN */}
              <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #022c22 100%)',
                border: '4px solid #10b981',
                borderRadius: '30px',
                padding: '40px 20px',
                maxWidth: '600px',
                margin: '0 auto 28px auto',
                boxShadow: '0 12px 36px rgba(16,185,129,0.2)'
              }}>
                <div style={{ fontSize: '80px', fontWeight: '900', color: '#34d399', letterSpacing: '4px', fontFamily: 'monospace' }}>
                  {Math.floor(toolTimerSeconds / 60).toString().padStart(2, '0')}:{(toolTimerSeconds % 60).toString().padStart(2, '0')}
                </div>
                <div style={{ fontSize: '14px', color: '#6ee7b7', marginTop: '6px' }}>
                  {toolTimerRunning ? '⏳ ĐANG ĐẾM NGƯỢC THỜI GIAN...' : '⏸️ ĐÃ TẠM DỪNG / CHỜ BẮT ĐẦU'}
                </div>
              </div>

              {/* NÚT ĐIỀU KHIỂN & PRESET */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                {toolTimerRunning ? (
                  <button onClick={() => setToolTimerRunning(false)} style={{ background: '#f59e0b', color: '#0f172a', border: 'none', padding: '12px 28px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                    <Pause size={18} style={{ display: 'inline', marginRight: '6px' }} /> Tạm Dừng
                  </button>
                ) : (
                  <button onClick={() => { setToolTimerRunning(true); gameAudio.init(); }} style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '12px 32px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                    <Play size={18} style={{ display: 'inline', marginRight: '6px' }} /> Bắt Đầu
                  </button>
                )}
                <button onClick={() => { setToolTimerRunning(false); setToolTimerSeconds(300); }} style={{ background: '#475569', color: '#ffffff', border: 'none', padding: '12px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                  <RotateCcw size={18} /> Đặt Lại
                </button>
              </div>

              {/* CÁC MỐC THỜI GIAN NHANH */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { label: '1 Phút', s: 60 },
                  { label: '2 Phút', s: 120 },
                  { label: '3 Phút', s: 180 },
                  { label: '5 Phút (Chuẩn)', s: 300 },
                  { label: '10 Phút', s: 600 },
                  { label: '15 Phút', s: 900 },
                  { label: '🍅 Pomodoro (25p)', s: 1500 }
                ].map(p => (
                  <button
                    key={p.s}
                    onClick={() => { setToolTimerRunning(false); setToolTimerSeconds(p.s); }}
                    style={{ background: '#0f172a', border: '1px solid #475569', color: '#e2e8f0', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ) : toolMode === 'group_generator' ? (
            /* TIỆN ÍCH 2: CHIA NHÓM NGẪU NHIÊN THÔNG MINH */
            <div style={{ background: '#1e293b', borderRadius: '24px', padding: '28px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={20} /> Trình Chia Nhóm Ngẫu Nhiên Lớp {selectedClass}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>Dữ liệu tự động đồng bộ từ CSDL ({classStudents.length} học sinh)</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#cbd5e1' }}>Số lượng nhóm:</span>
                  <select
                    value={numGroups}
                    onChange={e => setNumGroups(Number(e.target.value))}
                    style={{ background: '#0f172a', color: '#ffffff', border: '1px solid #475569', padding: '7px 12px', borderRadius: '8px', fontWeight: 'bold' }}
                  >
                    {[2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n} Nhóm</option>)}
                  </select>

                  <button onClick={handleGenerateGroups} style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '9px 18px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shuffle size={16} /> Chia Nhóm Ngay
                  </button>

                  <button onClick={handleExportGroupsExcel} disabled={generatedGroups.length === 0} style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '9px 16px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileSpreadsheet size={16} /> Xuất Excel
                  </button>
                </div>
              </div>

              {/* LƯỚI HIỂN THỊ CÁC NHÓM */}
              {generatedGroups.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
                  {generatedGroups.map(grp => (
                    <div key={grp.id} style={{ background: '#0f172a', borderRadius: '16px', border: `2px solid ${grp.color}`, padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 'bold', color: grp.color }}>{grp.name}</span>
                        <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px', fontSize: '12px' }}>{grp.members.length} HS</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
                        {grp.members.map((m, mIdx) => (
                          <div key={m.id || mIdx} style={{ fontSize: '13px', color: '#e2e8f0', background: '#1e293b', padding: '6px 10px', borderRadius: '6px' }}>
                            <strong>{mIdx + 1}.</strong> {m.full_name}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 10px', color: '#64748b' }}>
                  <Users size={48} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
                  <p>Bấm nút <strong>"Chia Nhóm Ngay"</strong> để hệ thống tự động xáo trộn và xếp danh sách {classStudents.length} học sinh!</p>
                </div>
              )}
            </div>
          ) : toolMode === 'noise_meter' ? (
            /* TIỆN ÍCH 3: ĐO ĐỘ ỒN LỚP HỌC */
            <div style={{ background: '#1e293b', borderRadius: '24px', padding: '32px', border: '1px solid #334155', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Mic size={24} /> Bộ Đo Độ Ồn & Cảnh Báo Trật Tự Lớp Học (Sound Level Meter)
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
                Hệ thống đo âm lượng qua Microphone. Khi lớp quá ồn vượt ngưỡng, màn hình sẽ nhấp nháy đỏ và phát chuông nhắc nhở nhẹ nhàng.
              </p>

              {/* MÀN HÌNH ĐO DECIBEL DYNAMIC */}
              <div style={{
                background: noiseAlert ? 'rgba(239, 68, 68, 0.25)' : '#0f172a',
                border: noiseAlert ? '4px solid #ef4444' : '2px solid #334155',
                borderRadius: '24px', padding: '36px 20px', maxWidth: '650px', margin: '0 auto 28px auto',
                animation: noiseAlert ? 'pulse 0.8s infinite' : 'none'
              }}>
                <div style={{ fontSize: '64px', fontWeight: '900', color: noiseLevel >= noiseThreshold ? '#ef4444' : (noiseLevel >= 45 ? '#f59e0b' : '#10b981') }}>
                  {noiseLevel} %
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '8px', color: noiseLevel >= noiseThreshold ? '#fca5a5' : '#94a3b8' }}>
                  {noiseLevel >= noiseThreshold ? '🚨 CẢNH BÁO: LỚP ĐANG QUÁ ỒN! HÃY GIỮ TRẬT TỰ NHÉ!' : (noiseLevel >= 45 ? '📢 Thảo luận nhóm sôi nổi vừa phải' : '🤫 Lớp học đang rất yên tĩnh và tập trung')}
                </div>

                {/* THANH MÀU ÂM LƯỢNG */}
                <div style={{ width: '100%', height: '20px', background: '#1e293b', borderRadius: '10px', overflow: 'hidden', marginTop: '20px', border: '1px solid #475569' }}>
                  <div style={{
                    width: `${noiseLevel}%`, height: '100%',
                    background: noiseLevel >= noiseThreshold ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #10b981, #06b6d4)',
                    transition: 'width 0.1s ease'
                  }} />
                </div>
              </div>

              {/* ĐIỀU KHIỂN & NGƯỠNG */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                {noiseMonitoring ? (
                  <button onClick={stopNoiseMonitoring} style={{ background: '#ef4444', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MicOff size={16} /> Dừng Đo
                  </button>
                ) : (
                  <button onClick={startNoiseMonitoring} style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mic size={16} /> Bật Đo Độ Ồn
                  </button>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#cbd5e1' }}>Ngưỡng cảnh báo:</span>
                  <input
                    type="range"
                    min="40"
                    max="90"
                    value={noiseThreshold}
                    onChange={e => setNoiseThreshold(Number(e.target.value))}
                    style={{ width: '120px' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#f59e0b' }}>{noiseThreshold}%</span>
                </div>
              </div>
            </div>
          ) : (
            /* TIỆN ÍCH 4: BẢNG TÍCH ĐIỂM THÁI ĐỘ HỌC SINH */
            <div style={{ background: '#1e293b', borderRadius: '24px', padding: '28px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Star size={20} /> Bảng Tích Điểm Thái Độ Tiết Học Lớp {selectedClass}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>Khen thưởng hành vi tích cực & nhắc nhở nề nếp trực tiếp 1-chạm</div>
                </div>

                <button onClick={handleExportBehaviorExcel} style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '9px 16px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileSpreadsheet size={16} /> Xuất Báo Cáo Excel ({sessionScores.length})
                </button>
              </div>

              {/* LƯỚI HỌC SINH TÍCH ĐIỂM */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '14px', maxHeight: '550px', overflowY: 'auto' }}>
                {classStudents.map(student => {
                  const pts = studentPointsMap[student.id] || 0;
                  return (
                    <div key={student.id} style={{ background: '#0f172a', borderRadius: '14px', padding: '14px', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '14px' }}>{student.full_name}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>Mã: {student.student_code || '---'}</div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: pts > 0 ? '#065f46' : '#1e293b', color: pts > 0 ? '#34d399' : '#94a3b8', padding: '4px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold' }}>
                          {pts}đ
                        </span>
                        <button onClick={() => handleAddBehaviorPoint(student, 1, 'Phát biểu tốt')} style={{ background: '#16a34a', color: '#ffffff', border: 'none', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }} title="+1 Phát biểu hay">
                          +1
                        </button>
                        <button onClick={() => handleAddBehaviorPoint(student, -1, 'Mất trật tự')} style={{ background: '#ef4444', color: '#ffffff', border: 'none', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }} title="-1 Nhắc nhở">
                          -1
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}
      </main>
      </>
      )}

      {/* MODAL THÊM CÂU HỎI MỚI VÀO DATABASE */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div style={{ background: '#1e293b', borderRadius: '24px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px', border: '1.5px solid #475569' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} /> Thêm Câu Hỏi Mới Vào CSDL Trường
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveNewQuestionToDB}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '6px' }}>Bộ môn:</label>
                <select value={newQSubject} onChange={e => setNewQSubject(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '8px', background: '#0f172a', border: '1px solid #475569', color: '#ffffff' }}>
                  {HIGH_SCHOOL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="Truyền thống nhà trường">Truyền thống THPT Cao Bá Quát</option>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '6px' }}>Nội dung câu hỏi (hỗ trợ công thức qua KaTeX): *</label>
                <textarea required rows={3} placeholder="Nhập câu hỏi..." value={newQContent} onChange={e => setNewQContent(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #475569', color: '#ffffff', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '8px' }}>4 Phương án lựa chọn & Đánh dấu đáp án đúng: *</label>
                {['A', 'B', 'C', 'D'].map((optLabel, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <input type="radio" name="correct_opt" checked={newQCorrect === idx} onChange={() => setNewQCorrect(idx)} />
                    <span style={{ fontWeight: 'bold', color: '#38bdf8', width: '20px' }}>{optLabel}:</span>
                    <input type="text" required placeholder={`Phương án ${optLabel}...`} value={newQOptions[idx]} onChange={e => { const val = e.target.value; setNewQOptions(prev => { const updated = [...prev]; updated[idx] = val; return updated; }); }} style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #475569', color: '#ffffff' }} />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '6px' }}>Hướng dẫn giải chi tiết (không bắt buộc):</label>
                <input type="text" placeholder="Lời giải thích khi hiện đáp án..." value={newQExplanation} onChange={e => setNewQExplanation(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #475569', color: '#ffffff', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ background: '#475569', color: '#ffffff', border: 'none', padding: '9px 16px', borderRadius: '8px', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" disabled={savingNewQ} style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '9px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {savingNewQ ? 'Đang lưu...' : 'Lưu Vào Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TRỢ GIẢNG AI: SOẠN CÂU HỎI TRẮC NGHIỆM TỰ ĐỘNG (GOOGLE GEMINI) */}
      {showAiGenModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div style={{ background: '#1e293b', borderRadius: '24px', maxWidth: '750px', width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: '28px', border: '1.5px solid #6366f1', boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.35)' }}>
            
            {/* MODAL HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  🤖
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    TRỢ GIẢNG AI: SOẠN BỘ CÂU HỎI TRẮC NGHIỆM
                  </h3>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                    Google Gemini AI • Soạn theo bài học, chuẩn kiến thức GDPT 2018
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AiStatusBadge />
                <button
                  type="button"
                  onClick={() => {
                    setShowAiGenModal(false);
                    setAiGeneratedQuestions([]);
                    setAiGenError(null);
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer', padding: '4px' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* BƯỚC 1: FORM CẤU HÌNH YÊU CẦU NỘI DUNG */}
            {aiGeneratedQuestions.length === 0 ? (
              <form onSubmit={handleGenerateQuestionsWithAi}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                  {/* BỘ MÔN */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '6px' }}>Môn học:</label>
                    <select
                      value={aiSubject}
                      onChange={e => setAiSubject(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #475569', color: '#ffffff', fontSize: '13px' }}
                    >
                      {HIGH_SCHOOL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                      <option value="Truyền thống nhà trường">Truyền thống THPT Cao Bá Quát</option>
                    </select>
                  </div>

                  {/* KHỐI LỚP */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '6px' }}>Khối lớp:</label>
                    <select
                      value={aiGrade}
                      onChange={e => setAiGrade(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #475569', color: '#ffffff', fontSize: '13px' }}
                    >
                      <option value="10">Khối 10</option>
                      <option value="11">Khối 11</option>
                      <option value="12">Khối 12</option>
                      <option value="Tất cả khối">Tất cả khối</option>
                    </select>
                  </div>

                  {/* SỐ LƯỢNG */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '6px' }}>Số lượng câu hỏi:</label>
                    <select
                      value={aiQuestionCount}
                      onChange={e => setAiQuestionCount(Number(e.target.value))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #475569', color: '#ffffff', fontSize: '13px' }}
                    >
                      <option value={3}>3 câu (Khởi động siêu nhanh 2p)</option>
                      <option value={5}>5 câu (Chuẩn tiết học 5p)</option>
                      <option value={10}>10 câu (Đầy đủ củng cố bài học)</option>
                    </select>
                  </div>

                  {/* MỨC ĐỘ NHẬN THỨC */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '6px' }}>Mức độ nhận thức:</label>
                    <select
                      value={aiDifficulty}
                      onChange={e => setAiDifficulty(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #475569', color: '#ffffff', fontSize: '13px' }}
                    >
                      <option value="Vừa sức (Khởi động lớp học)">Vừa sức (Khởi động)</option>
                      <option value="Nhận biết - Thông hiểu (Cơ bản)">Nhận biết - Thông hiểu</option>
                      <option value="Vận dụng - Vận dụng cao (Nâng cao)">Vận dụng - Vận dụng cao</option>
                    </select>
                  </div>
                </div>

                {/* TÊN BÀI HỌC / CHỦ ĐỀ */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '6px' }}>
                    Tên bài học hoặc Chủ đề trọng tâm: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Định luật II Newton, Vợ chồng A Phủ, Bảng tuần hoàn hóa học, Khảo sát hàm số..."
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: '#0f172a', border: '1px solid #475569', color: '#ffffff', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* ĐOẠN TÀI LIỆU HOẶC VĂN BẢN ĐỀ THI DÁN THÔ (TÙY CHỌN) */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '6px' }}>
                    Đoạn tài liệu / Ghi chú bài giảng / Đề bài mẫu (Tùy chọn - để AI bám sát):
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Dán đoạn văn bản SGK, công thức hoặc ghi chú tóm tắt bài học nếu Thầy/Cô muốn AI soạn chính xác theo ngữ liệu này..."
                    value={aiRawContext}
                    onChange={e => setAiRawContext(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* THÔNG BÁO LỖI NẾU CÓ */}
                {aiGenError && (
                  <div style={{ backgroundColor: '#451a1a', border: '1px solid #ef4444', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', color: '#fca5a5', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} color="#ef4444" />
                    <span>{aiGenError}</span>
                  </div>
                )}

                {/* NÚT SUBMIT */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAiGenModal(false)}
                    style={{ background: '#475569', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isGeneratingAi}
                    style={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 24px',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      cursor: isGeneratingAi ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
                    }}
                  >
                    <Sparkles size={18} className={isGeneratingAi ? 'spin' : ''} />
                    {isGeneratingAi ? 'AI đang biên soạn câu hỏi...' : `🚀 Bắt Đầu Soạn ${aiQuestionCount} Câu Hỏi AI`}
                  </button>
                </div>
              </form>
            ) : (
              /* BƯỚC 2: DUYỆT CÂU HỎI AI VỪA SINH & NẠP VÀO GAME */
              <div>
                <div style={{ backgroundColor: '#0f172a', borderRadius: '14px', padding: '14px 18px', marginBottom: '18px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>Đã sinh thành công:</span>
                    <strong style={{ fontSize: '15px', color: '#4ade80', marginLeft: '6px' }}>{aiGeneratedQuestions.length} câu hỏi môn {aiSubject}</strong>
                    <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>Chủ đề: "{aiTopic || 'Bài học'}"</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiGeneratedQuestions([])}
                    style={{ background: '#334155', color: '#e2e8f0', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    🔄 Soạn Lại
                  </button>
                </div>

                {/* DANH SÁCH PREVIEW CÂU HỎI */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '420px', overflowY: 'auto', marginBottom: '20px', paddingRight: '6px' }}>
                  {aiGeneratedQuestions.map((q, qIdx) => (
                    <div key={q.id || qIdx} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '14px' }}>
                      <div style={{ fontWeight: 'bold', color: '#38bdf8', marginBottom: '8px', fontSize: '14px' }}>
                        Câu {qIdx + 1}: {q.content}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = oIdx === q.correctAnswerIndex;
                          return (
                            <div
                              key={oIdx}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                fontSize: '12.5px',
                                backgroundColor: isCorrect ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                                border: isCorrect ? '1px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.1)',
                                color: isCorrect ? '#4ade80' : '#cbd5e1'
                              }}
                            >
                              <strong>{['A', 'B', 'C', 'D'][oIdx]}:</strong> {opt}
                            </div>
                          );
                        })}
                      </div>
                      {q.explanation && (
                        <div style={{ fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic', borderTop: '1px dashed #334155', paddingTop: '6px' }}>
                          💡 Giải thích: {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* HÀNH ĐỘNG NẠP VÀO GAME HOẶC LƯU VÀO DATABASE */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleApplyAiQuestionsToGame(false)}
                    style={{
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 18px',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    🎮 Nạp Vào Trò Chơi Ngay (Chơi Luôn)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyAiQuestionsToGame(true)}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)'
                    }}
                  >
                    💾 Nạp & Lưu Vào CSDL Ngân Hàng Đề Trường
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION */}
      <MobileBottomNav />
    </div>
  );
}
