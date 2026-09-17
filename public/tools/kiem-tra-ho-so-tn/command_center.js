/**
 * PREMIUM MODULE 1: LIVE EXAM COMMAND CENTER
 * Handles live countdown, speech announcer synthesis, and instant metrics updates.
 */

(function() {
    "use strict";

    let timerInterval = null;

    // Helper to get rooms
    function getRooms() {
        let list = (typeof window.generatedRooms !== 'undefined') ? window.generatedRooms : [];
        if (!list || list.length === 0) {
            if (typeof window.ProctorStore !== 'undefined' && typeof window.ProctorStore.getState === 'function') {
                list = window.ProctorStore.getState().rooms;
            }
        }
        return list || [];
    }

    // Initialize/Refresh Live Command Center View
    function initCommandCenter() {
        updateCommandCenterStats();
        // Trigger voice list preload
        if ('speechSynthesis' in window) {
            window.speechSynthesis.getVoices();
        }
    }

    // Update Live Metrics Dashboard
    function updateCommandCenterStats() {
        const rooms = getRooms();
        const liveAttendanceState = (window.ExamUltimate && typeof window.ExamUltimate.getLiveAttendanceState === 'function') ? 
                                    window.ExamUltimate.getLiveAttendanceState() : {};
        
        let totalStudents = 0;
        let absentCount = 0;
        
        rooms.forEach(r => {
            (r.students || []).forEach(s => {
                totalStudents++;
                if (liveAttendanceState[s.sbd] && liveAttendanceState[s.sbd].absent) {
                    absentCount++;
                }
            });
        });

        const presentCount = totalStudents - absentCount;
        const proctorsCount = window.proctorList ? window.proctorList.length : 0;
        const roomsCount = rooms.length;

        const elRooms = document.getElementById('live-stat-rooms');
        const elProctors = document.getElementById('live-stat-proctors');
        const elPresent = document.getElementById('live-stat-present');
        const elAbsent = document.getElementById('live-stat-absent');

        if (elRooms) elRooms.textContent = roomsCount;
        if (elProctors) elProctors.textContent = proctorsCount;
        if (elPresent) elPresent.textContent = presentCount;
        if (elAbsent) elAbsent.textContent = absentCount;
    }

    // Speak announcement via Web Speech API
    function speakAnnouncement(type) {
        if (!('speechSynthesis' in window)) {
            if (typeof window.showAlert === 'function') {
                window.showAlert("Trình duyệt của bạn không hỗ trợ loa phát thanh Web Speech API!", "danger");
            } else {
                alert("Trình duyệt của bạn không hỗ trợ loa phát thanh Web Speech API!");
            }
            return;
        }

        // Cancel any active speech
        window.speechSynthesis.cancel();

        let text = "";
        if (type === 'preset-check-rules') {
            text = "Thông báo nhắc nhở quy chế thi và vật dụng. Đề nghị cán bộ coi thi gọi thí sinh vào phòng thi, đối chiếu thẻ dự thi, căn cước công dân và kiểm tra các vật dụng thí sinh được phép mang vào phòng thi theo đúng quy chế thi tốt nghiệp trung học phổ thông quốc gia.";
        } else if (type === 'preset-open-envelope') {
            text = "Thông báo bóc niêm phong đề thi. Đề nghị cán bộ coi thi mời hai thí sinh đại diện trong phòng lên kiểm tra bao bì niêm phong của túi đề thi môn thi hôm nay, xác nhận bao bì còn nguyên vẹn, sau đó tiến hành bóc túi đề thi trước sự chứng kiến của toàn thể thí sinh.";
        } else if (type === 'preset-start-time') {
            text = "Thông báo bắt đầu giờ làm bài. Đã đến thời gian bắt đầu làm bài thi môn thi. Đề nghị cán bộ coi thi ghi rõ thời gian bắt đầu và thời gian thu bài lên bảng viết của phòng thi. Chúc các thí sinh bình tĩnh, tự tin và làm bài đạt kết quả tốt nhất.";
        } else if (type === 'preset-warning-15') {
            text = "Thông báo thời gian làm bài còn lại mười lăm phút. Đề nghị các thí sinh khẩn trương kiểm tra lại thông tin cá nhân, số báo danh, mã đề thi đã ghi trên tờ giấy làm bài và phiếu trả lời trắc nghiệm, nhanh chóng hoàn thành việc tô các đáp án lựa chọn.";
        } else if (type === 'custom') {
            const input = document.getElementById('live-custom-speech-text');
            text = input ? input.value.trim() : "";
            if (!text) {
                if (typeof window.showAlert === 'function') {
                    window.showAlert("Vui lòng nhập nội dung câu thông báo tùy chỉnh tiếng Việt!", "warning");
                } else {
                    alert("Vui lòng nhập nội dung câu thông báo tùy chỉnh tiếng Việt!");
                }
                return;
            }
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        utterance.rate = 0.95; // Slightly slower for administrative clarity
        utterance.pitch = 1.0;

        // Try to match Vietnamese voice
        const voices = window.speechSynthesis.getVoices();
        const viVoice = voices.find(v => v.lang.includes('vi') || v.lang.includes('VI'));
        if (viVoice) {
            utterance.voice = viVoice;
        }

        window.speechSynthesis.speak(utterance);
        if (typeof window.showAlert === 'function') {
            window.showAlert("📢 Đang phát loa thông báo kỹ thuật số...", "success");
        }
    }

    // Generate Zalo quick report content
    function generateLiveZaloReport() {
        const rooms = getRooms();
        const liveAttendanceState = (window.ExamUltimate && typeof window.ExamUltimate.getLiveAttendanceState === 'function') ? 
                                    window.ExamUltimate.getLiveAttendanceState() : {};
        
        let totalStudents = 0;
        let absentList = [];
        
        rooms.forEach(r => {
            (r.students || []).forEach(s => {
                totalStudents++;
                if (liveAttendanceState[s.sbd] && liveAttendanceState[s.sbd].absent) {
                    absentList.push({
                        sbd: s.sbd,
                        hoten: s.hoten,
                        lop: s.lop || '12',
                        room: r.number,
                        reason: liveAttendanceState[s.sbd].reason || 'Không rõ lý do'
                    });
                }
            });
        });

        const absentCount = absentList.length;
        const presentCount = totalStudents - absentCount;

        let report = `📢 *BÁO CÁO SỸ SỐ LIVE - HỘI ĐỒNG THI THPT*\n`;
        report += `-------------------------------------------\n`;
        report += `⏱️ *Thời gian:* ${new Date().toLocaleTimeString('vi-VN')} | Ngày ${new Date().toLocaleDateString('vi-VN')}\n`;
        report += `🏫 *Tổng số phòng thi:* ${rooms.length} phòng\n`;
        report += `👥 *Tổng số thí sinh:* ${totalStudents}\n`;
        report += `✅ *Có mặt:* ${presentCount} | ❌ *Vắng mặt:* ${absentCount}\n\n`;

        if (absentCount > 0) {
            report += `⚠️ *Chi tiết thí sinh vắng mặt:*\n`;
            absentList.forEach((a, idx) => {
                report += `👉 ${idx + 1}. [Phòng ${a.room}] ${a.hoten} - SBD: ${a.sbd} (Lớp: ${a.lop}) | Lý do: ${a.reason}\n`;
            });
        } else {
            report += `✨ *Ghi nhận:* 100% thí sinh tham gia đầy đủ, nghiêm túc và đúng quy chế!`;
        }

        const textarea = document.getElementById('live-zalo-msg-text');
        if (textarea) {
            textarea.value = report;
            if (typeof window.showAlert === 'function') {
                window.showAlert("📊 Đã tổng hợp sỹ số thực tế thành công!", "success");
            }
        }
    }

    // Copy to clipboard & open Zalo Hub
    function sendLiveZaloReport() {
        const textarea = document.getElementById('live-zalo-msg-text');
        if (!textarea || !textarea.value.trim()) {
            if (typeof window.showAlert === 'function') {
                window.showAlert("Vui lòng tổng hợp dữ liệu báo cáo trước khi gửi!", "warning");
            }
            return;
        }

        navigator.clipboard.writeText(textarea.value).then(() => {
            if (typeof window.showAlert === 'function') {
                window.showAlert("📋 Đã sao chép báo cáo sỹ số! Đang chuyển hướng Zalo...", "success");
            }
            setTimeout(() => {
                window.open('https://chat.zalo.me/', '_blank');
            }, 1000);
        }).catch(err => {
            console.error("Lỗi clipboard:", err);
            if (typeof window.showAlert === 'function') {
                window.showAlert("Lỗi sao chép tự động! Vui lòng tự bôi đen và copy.", "warning");
            }
        });
    }

    // Timer Controls
    let timerSecondsLeft = 0;
    function startCommandTimer() {
        if (timerInterval) clearInterval(timerInterval);

        const durationSelect = document.getElementById('live-timer-duration');
        const minutes = parseInt(durationSelect ? durationSelect.value : "90");

        if (timerSecondsLeft <= 0) {
            timerSecondsLeft = minutes * 60;
        }

        const labelEl = document.getElementById('live-timer-label');
        if (labelEl) {
            labelEl.textContent = `ĐANG THI - BẮT ĐẦU (${minutes} PHÚT)`;
            labelEl.style.color = '#f43f5e'; // Pink-500
        }

        updateTimerDisplay();

        timerInterval = setInterval(() => {
            timerSecondsLeft--;
            if (timerSecondsLeft <= 0) {
                timerSecondsLeft = 0;
                clearInterval(timerInterval);
                timerInterval = null;
                
                if (labelEl) {
                    labelEl.textContent = "HẾT GIỜ LÀM BÀI THI";
                    labelEl.style.color = '#ef4444'; // Red-500
                }

                // Play alarm call
                speakAnnouncement('preset-warning-15'); // Or customize speech for exam end
                setTimeout(() => {
                    if ('speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                        const utterance = new SpeechSynthesisUtterance("Thông báo. Đã hết thời gian làm bài thi. Tất cả các thí sinh ngừng làm bài, úp tờ giấy làm bài và phiếu trả lời trắc nghiệm xuống bàn, nghiêm túc ngồi tại vị trí chờ cán bộ coi thi thu đề và bài làm.");
                        utterance.lang = 'vi-VN';
                        const voices = window.speechSynthesis.getVoices();
                        const viVoice = voices.find(v => v.lang.includes('vi') || v.lang.includes('VI'));
                        if (viVoice) utterance.voice = viVoice;
                        window.speechSynthesis.speak(utterance);
                    }
                }, 1000);
            }
            updateTimerDisplay();
        }, 1000);

        if (typeof window.showAlert === 'function') {
            window.showAlert("⏱️ Đã kích hoạt đồng hồ đếm ngược phòng thi!", "info");
        }
    }

    function pauseCommandTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
            const labelEl = document.getElementById('live-timer-label');
            if (labelEl) {
                labelEl.textContent = "ĐỒNG HỒ TẠM DỪNG";
                labelEl.style.color = '#eab308'; // Amber-500
            }
            if (typeof window.showAlert === 'function') {
                window.showAlert("⏱️ Đã tạm dừng đồng hồ đếm ngược.", "warning");
            }
        }
    }

    function resetCommandTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        timerSecondsLeft = 0;
        const digitsEl = document.getElementById('live-countdown-digits');
        const labelEl = document.getElementById('live-timer-label');
        if (digitsEl) digitsEl.textContent = "00:00:00";
        if (labelEl) {
            labelEl.textContent = "ĐANG CHỜ BẮT ĐẦU";
            labelEl.style.color = '#94a3b8'; // Slate-400
        }
        if (typeof window.showAlert === 'function') {
            window.showAlert("⏱️ Đã đặt lại đồng hồ đếm ngược.", "info");
        }
    }

    function updateTimerDisplay() {
        const h = Math.floor(timerSecondsLeft / 3600);
        const m = Math.floor((timerSecondsLeft % 3600) / 60);
        const s = timerSecondsLeft % 60;

        const hStr = h.toString().padStart(2, '0');
        const mStr = m.toString().padStart(2, '0');
        const sStr = s.toString().padStart(2, '0');

        const digitsEl = document.getElementById('live-countdown-digits');
        if (digitsEl) {
            digitsEl.textContent = `${hStr}:${mStr}:${sStr}`;
        }
    }

    // Expose to global scope
    window.initCommandCenter = initCommandCenter;
    window.updateCommandCenterStats = updateCommandCenterStats;
    window.speakAnnouncement = speakAnnouncement;
    window.generateLiveZaloReport = generateLiveZaloReport;
    window.sendLiveZaloReport = sendLiveZaloReport;
    window.startCommandTimer = startCommandTimer;
    window.pauseCommandTimer = pauseCommandTimer;
    window.resetCommandTimer = resetCommandTimer;

})();
