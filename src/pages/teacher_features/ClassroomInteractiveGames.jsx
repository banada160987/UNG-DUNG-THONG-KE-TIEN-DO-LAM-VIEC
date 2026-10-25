import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Confetti from 'react-confetti';
import {
  ArrowLeft, Award, BookOpen, Download, Plus, Trash2, Edit3, Shuffle,
  FileText, CheckCircle2, HelpCircle, Layers, Printer, RefreshCw, Eye, EyeOff,
  CheckSquare, Send, FileSpreadsheet, Sparkles, QrCode, Upload, Image,
  Copy, Search, Filter, Database, Play, Pause, RotateCcw, Volume2, VolumeX,
  Maximize2, Minimize2, Trophy, Users, Flame, Star, Flag, Clock, Zap,
  Gift, Mic, MicOff, AlertTriangle, UserCheck, Heart, ThumbsUp, MessageSquare
} from 'lucide-react';
import MathView from '../../components/MathView';
import { supabase, DualSupabaseService } from '../../lib/supabase';
import { gameAudio } from '../../utils/gameAudio';
import { HIGH_SCHOOL_SUBJECTS } from '../../services/smartAssessmentService';
import { getTeacherSession } from '../../services/authSessionManager';
import MobileBottomNav from '../../components/MobileBottomNav';

export default function ClassroomInteractiveGames() {
  const navigate = useNavigate();

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

        // Ưu tiên chọn lớp chủ nhiệm của giáo viên nếu có trong phiên
        const teacherSess = getTeacherSession();
        const preferredClass = teacherSess?.homeroomClass && classes.includes(teacherSess.homeroomClass)
          ? teacherSess.homeroomClass
          : classes[0];

        if (classes.length > 0) {
          setSelectedClass(preferredClass);
          const initialClassStudents = normalizedStudents.filter(s => s.student_class === preferredClass);
          setClassStudents(initialClassStudents);
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
            /* 1. ĐẤU TRƯỜNG TRI THỨC */
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
                marginBottom: '20px', background: '#1e293b', padding: '14px 20px', borderRadius: '16px', border: '1px solid #334155'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ background: '#2563eb', color: '#ffffff', padding: '6px 14px', borderRadius: '20px', fontSize: '14px', fontWeight: '800' }}>
                    CÂU {currentQIndex + 1} / {filteredQuestions.length}
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>Bộ môn: <strong style={{ color: '#e2e8f0' }}>{currentQuestion?.subject || 'Chung'}</strong></span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: timeLeft <= 5 ? '#dc2626' : (timeLeft <= 10 ? '#d97706' : '#047857'),
                    color: '#ffffff', padding: '6px 16px', borderRadius: '20px', fontSize: '18px', fontWeight: '900'
                  }}>
                    <Clock size={20} /> <span>{timeLeft}s</span>
                  </div>

                  {isTimerRunning ? (
                    <button onClick={pauseTimer} style={{ background: '#f59e0b', color: '#0f172a', border: 'none', padding: '7px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px' }}>
                      <Pause size={14} /> Tạm Dừng
                    </button>
                  ) : (
                    <button onClick={startTimer} style={{ background: '#22c55e', color: '#0f172a', border: 'none', padding: '7px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px' }}>
                      <Play size={14} /> Bắt Đầu
                    </button>
                  )}

                  <button onClick={() => resetTimer()} style={{ background: '#475569', color: '#ffffff', border: 'none', padding: '7px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}><RotateCcw size={14} /></button>
                  
                  <select
                    value={timerDuration}
                    onChange={e => { const val = Number(e.target.value); setTimerDuration(val); resetTimer(val); }}
                    style={{ background: '#0f172a', color: '#e2e8f0', border: '1px solid #475569', borderRadius: '8px', padding: '6px 10px', fontSize: '12.5px' }}
                  >
                    <option value={10}>10 giây</option>
                    <option value={15}>15 giây</option>
                    <option value={20}>20 giây</option>
                    <option value={30}>30 giây</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={handle5050} disabled={eliminatedOptions.length > 0} style={{ background: eliminatedOptions.length > 0 ? '#334155' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#ffffff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer' }}>
                    ⚡ 50:50
                  </button>
                  <button onClick={handleAudienceHelp} disabled={Boolean(audienceVotes)} style={{ background: audienceVotes ? '#334155' : 'linear-gradient(135deg, #06b6d4, #0891b2)', color: '#ffffff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer' }}>
                    📊 Biểu Quyết
                  </button>
                </div>
              </div>

              {/* KHỐI CÂU HỎI */}
              <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '24px', border: '2px solid #3b82f6', padding: '36px 32px', marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#60a5fa', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {currentQuestion?.title || `Câu hỏi số ${currentQIndex + 1}`}
                </div>
                <div style={{ fontSize: '22px', fontWeight: '700', lineHeight: '1.6', color: '#f8fafc', marginBottom: '20px' }}>
                  <MathView text={currentQuestion?.content || ''} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '16px' }}>
                  {(currentQuestion?.options || ['A', 'B', 'C', 'D']).map((option, idx) => {
                    const isCorrect = idx === (currentQuestion.correctAnswerIndex ?? 0);
                    const isEliminated = eliminatedOptions.includes(idx);
                    const votePct = audienceVotes ? audienceVotes[idx] : null;
                    const optionLabels = ['A', 'B', 'C', 'D'];
                    const optionColors = ['#2563eb', '#dc2626', '#d97706', '#16a34a'];

                    return (
                      <div
                        key={idx}
                        style={{
                          background: showAnswer && isCorrect ? 'linear-gradient(135deg, #15803d 0%, #166534 100%)' : '#1e293b',
                          border: showAnswer && isCorrect ? '3px solid #4ade80' : (isEliminated ? '1px dashed #475569' : '1.5px solid #334155'),
                          borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px',
                          opacity: isEliminated ? 0.25 : 1, transition: 'all 0.3s ease'
                        }}
                      >
                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: showAnswer && isCorrect ? '#22c55e' : optionColors[idx % 4], color: '#ffffff', fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {optionLabels[idx]}
                        </div>
                        <div style={{ flex: 1, fontSize: '17px', fontWeight: '600', color: showAnswer && isCorrect ? '#ffffff' : '#f1f5f9' }}>
                          <MathView text={String(option)} />
                        </div>
                        {votePct !== null && !isEliminated && <div style={{ background: 'rgba(0,0,0,0.4)', padding: '4px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', color: '#38bdf8' }}>{votePct}%</div>}
                        {showAnswer && isCorrect && <CheckCircle2 size={24} color="#4ade80" />}
                      </div>
                    );
                  })}
                </div>

                {showExplanation && currentQuestion?.explanation && (
                  <div style={{ marginTop: '20px', background: 'rgba(16, 185, 129, 0.1)', border: '1.5px solid #10b981', borderRadius: '14px', padding: '16px 20px', color: '#a7f3d0' }}>
                    <strong style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}><CheckCircle2 size={18} /> HƯỚNG DẪN GIẢI SƯ PHẠM:</strong>
                    <MathView text={currentQuestion.explanation} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handlePrevQuestion} style={{ background: '#334155', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>◀ Câu Trước</button>
                  <button onClick={handleNextQuestion} style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '10px 22px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Câu Kế Tiếp ▶</button>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleRevealAnswer} style={{ background: showAnswer ? '#15803d' : '#10b981', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={18} /> <span>{showAnswer ? '✓ Đã Hiện Đáp Án' : 'Hiện Đáp Án Đúng'}</span>
                  </button>
                  <button onClick={() => setShowExplanation(!showExplanation)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid #475569', color: '#e2e8f0', padding: '10px 16px', borderRadius: '12px', cursor: 'pointer' }}>
                    {showExplanation ? <EyeOff size={16} /> : <Eye size={16} />} Lời Giải Chi Tiết
                  </button>
                </div>
              </div>
            </div>
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

      {/* MOBILE BOTTOM NAVIGATION */}
      <MobileBottomNav />
    </div>
  );
}
