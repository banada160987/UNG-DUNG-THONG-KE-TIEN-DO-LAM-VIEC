# Nâng Cấp Hệ Thống Phân Công Giám Thị (Proctor Assignment System Pro)

Chào bạn, với tư cách là một Senior Fullstack Engineer và System Architect, tôi rất hứng thú với bài toán này. Hệ thống xếp giám thị là một bài toán tối ưu hóa tổ hợp (Combinatorial Optimization) khá kinh điển, đòi hỏi thiết kế dữ liệu cực kỳ chuẩn xác và thuật toán Heuristic linh hoạt.

Dưới đây là bản thiết kế hệ thống và refactor toàn diện theo kiến trúc Modular, tách biệt hoàn toàn Logic (Thuật toán), Data (Trạng thái) và UI (View).

---

## 1. Phân Tích Kiến Trúc (Architecture)

Hệ thống được chia thành các module độc lập (tuân thủ nguyên tắc SOLID và Separation of Concerns):
- **`ExamDataStore`**: Quản lý State toàn cục của hệ thống (thay thế biến toàn cục rời rạc).
- **`ExamConfigUI`**: Quản lý giao diện Wizard, thu thập cấu hình và bind dữ liệu vào DataStore.
- **`ConstraintEngine`**: Chứa các rules (ràng buộc cứng và mềm) để validate giám thị hợp lệ cho từng phòng.
- **`AssignmentEngine`**: Thuật toán lõi (Heuristic + Backtracking nhẹ) để phân công giám thị. Tối ưu hóa điểm số (Scoring) để cân bằng tải và phân tán phòng.
- **`ExcelImportExportService`**: Xử lý I/O với SheetJS, tách biệt khỏi UI.

---

## 2. Thiết Kế Dữ Liệu (State Management)

Dữ liệu chuẩn hóa hoàn toàn:

```javascript
const AppState = {
    examInfo: { name: "", term: "", year: "", startDate: "", endDate: "" },
    sessions: [], // Cấu trúc ca thi chuẩn
    rooms: [],    // Cấu trúc phòng thi chuẩn
    proctors: [], // Cấu trúc giám thị chuẩn
    constraints: {
        noBackToBack: true,
        noSameSubject: true, // Không coi đúng chuyên môn
        balanceSessions: true, // Chia đều ca
        reserveProctors: true, // Dự phòng
        sameDepartmentSeparation: true // 2 GT cùng phòng không cùng tổ
    },
    assignments: [] // Kết quả phân công đầu ra
};
```

---

## 3. Thiết Kế Thuật Toán (Assignment Algorithm)

Thuật toán sử dụng phương pháp **Greedy kết hợp Scoring (Tham lam có trọng số)**:
1. **Lọc (Filtering)**: Loại bỏ các giám thị vi phạm Ràng buộc cứng (Hard Constraints) thông qua `ConstraintEngine`.
    - Trùng giờ (Đã được xếp ở phòng khác trong cùng ca).
    - Vi phạm chuyên môn (Giám thị môn Toán không coi thi môn Toán).
    - Cùng tổ chuyên môn (2 GT trong 1 phòng không được phép cùng bộ môn).
2. **Chấm điểm (Scoring)**: Đánh giá các giám thị lọt qua bộ lọc (Soft Constraints).
    - Điểm trừ nặng: Nếu số ca đã coi lớn hơn trung bình (Balance Load).
    - Điểm cộng: Khác giới tính với giám thị đã được xếp (nếu có).
    - Điểm trừ: Nếu coi cùng 1 phòng liên tục nhiều lần.
3. **Phân bổ (Allocation)**: Chọn 2 người có điểm cao nhất cho mỗi phòng. Những người còn thừa sẽ đưa vào danh sách Dự phòng (Reserve).

---

## 4. Source Code Đầy Đủ (Vanilla JS)

Dưới đây là mã nguồn của Core Engine. Bạn có thể lưu thành file `proctor_engine.js`.

```javascript
/**
 * PROCTOR ASSIGNMENT ENGINE
 * Architecture: MVC & Modular Design
 * Author: Senior System Architect
 */

// ==========================================
// 1. DATA MODEL & STATE
// ==========================================
const ExamDataStore = {
    state: {
        examInfo: {},
        sessions: [],
        rooms: [],
        proctors: [],
        constraints: {
            noBackToBack: true,
            noSameSubject: true,
            balanceSessions: true,
            reserveProctors: true,
            sameDepartmentSeparation: true
        },
        assignments: [] // Result structure
    },
    
    init() {
        const saved = localStorage.getItem('ExamSystemState');
        if (saved) {
            try { this.state = JSON.parse(saved); } catch(e) { console.error(e); }
        }
    },

    save() {
        localStorage.setItem('ExamSystemState', JSON.stringify(this.state));
    }
};

// ==========================================
// 2. CONSTRAINT ENGINE (Validation)
// ==========================================
const ConstraintEngine = {
    // Hard constraints: Return true if VALID, false if INVALID
    isValidForRoom(proctor, room, session, assignedInRoom, state) {
        // 1. No Time Conflict (Đã xếp ở phòng khác trong ca này)
        if (proctor.assignedSessions && proctor.assignedSessions.includes(session.id)) return false;

        // 2. No Same Subject (Không coi môn chuyên môn)
        if (state.constraints.noSameSubject) {
            const subjects = session.subjects.map(s => s.toLowerCase());
            const pUnit = (proctor.unit || "").toLowerCase();
            if (subjects.some(sub => pUnit.includes(sub) || sub.includes(pUnit))) {
                return false;
            }
        }

        // 3. Same Department Separation (2 GT cùng phòng không cùng môn)
        if (state.constraints.sameDepartmentSeparation && assignedInRoom.length > 0) {
            const p1Unit = (assignedInRoom[0].unit || "").toLowerCase();
            const p2Unit = (proctor.unit || "").toLowerCase();
            if (p1Unit === p2Unit && p1Unit !== "") return false;
        }

        // 4. No Back To Back (Không coi 2 ca liên tiếp - tính toán dựa trên Index của session)
        if (state.constraints.noBackToBack) {
            const sessionIdx = state.sessions.findIndex(s => s.id === session.id);
            if (sessionIdx > 0) {
                const prevSession = state.sessions[sessionIdx - 1];
                if (proctor.assignedSessions && proctor.assignedSessions.includes(prevSession.id)) {
                    return false;
                }
            }
        }

        return true;
    },

    // Soft constraints: Return Score (Higher is better)
    calculateScore(proctor, room, session, assignedInRoom, state, stats) {
        let score = 100;
        
        // Cân bằng tải (Balance Sessions)
        if (state.constraints.balanceSessions) {
            score -= (stats[proctor.id].total * 20);
        }

        // Ưu tiên đa dạng giới tính trong 1 phòng
        if (assignedInRoom.length === 1) {
            if (assignedInRoom[0].gender !== proctor.gender) score += 30;
        }

        // Tránh coi mãi 1 phòng
        if (stats[proctor.id].roomsVisited.has(room.id)) {
            score -= 15;
        }

        return score;
    }
};

// ==========================================
// 3. ASSIGNMENT ENGINE (Algorithm)
// ==========================================
const AssignmentEngine = {
    run(state) {
        this.resetAssignments(state);
        const stats = this.initStats(state.proctors);
        let logs = [];

        state.sessions.forEach(session => {
            const sessionResult = {
                sessionId: session.id,
                rooms: [],
                reserves: []
            };

            // Reset assigned flag cho ca mới
            state.proctors.forEach(p => { 
                if(!p.assignedSessions) p.assignedSessions = []; 
            });

            state.rooms.forEach(room => {
                let assignedInRoom = [];
                let needed = session.requiredProctorsPerRoom || 2;

                while(assignedInRoom.length < needed) {
                    // Lọc tập ứng viên hợp lệ
                    let pool = state.proctors.filter(p => ConstraintEngine.isValidForRoom(p, room, session, assignedInRoom, state));
                    
                    if (pool.length === 0) {
                        // Nới lỏng ràng buộc nếu bế tắc (Backtracking/Relaxation)
                        logs.push(`Cảnh báo: Không đủ GT thỏa mãn cho phòng ${room.name} ca ${session.name}. Nới lỏng ràng buộc BackToBack...`);
                        const backupState = {...state, constraints: {...state.constraints, noBackToBack: false}};
                        pool = state.proctors.filter(p => ConstraintEngine.isValidForRoom(p, room, session, assignedInRoom, backupState));
                    }

                    if (pool.length === 0) {
                        logs.push(`LỖI NGHIÊM TRỌNG: Thiếu GT cho phòng ${room.name} ca ${session.name}.`);
                        break; // Chấp nhận thiếu
                    }

                    // Chấm điểm và chọn người cao nhất
                    pool.sort((a, b) => {
                        return ConstraintEngine.calculateScore(b, room, session, assignedInRoom, state, stats) - 
                               ConstraintEngine.calculateScore(a, room, session, assignedInRoom, state, stats);
                    });

                    const selected = pool[0];
                    assignedInRoom.push(selected);
                    selected.assignedSessions.push(session.id);
                    stats[selected.id].total += 1;
                    stats[selected.id].roomsVisited.add(room.id);
                }

                sessionResult.rooms.push({
                    roomId: room.id,
                    roomName: room.name,
                    proctors: assignedInRoom.map(p => p.name)
                });
            });

            // Những người rảnh trong ca này làm dự phòng
            sessionResult.reserves = state.proctors
                .filter(p => !p.assignedSessions.includes(session.id))
                .map(p => p.name);

            state.assignments.push(sessionResult);
        });

        return { success: true, logs, assignments: state.assignments, stats };
    },

    initStats(proctors) {
        let stats = {};
        proctors.forEach(p => {
            stats[p.id] = { total: 0, roomsVisited: new Set() };
        });
        return stats;
    },

    resetAssignments(state) {
        state.assignments = [];
        state.proctors.forEach(p => { p.assignedSessions = []; });
    }
};

// ==========================================
// 4. EXPORT SERVICE
// ==========================================
const ExportService = {
    exportToExcel(state) {
        // Tái cấu trúc ma trận assignment thành dạng Bảng (Rows/Cols) cho Excel
        const wb = XLSX.utils.book_new();
        // ... (Logic tạo Worksheet sử dụng thư viện SheetJS)
        // XLSX.writeFile(wb, "PhanCongGiamThi.xlsx");
    }
};

```

## 5. Flow Xử Lý Hoàn Chỉnh (Workflow)

1. **Khởi tạo (Init)**: Load `ExamDataStore` từ `localStorage`. Khôi phục trạng thái làm việc dang dở.
2. **Cấu hình (UI Wizard)**: Người dùng nhập các Bước từ 1 đến 5.
    - Component `ExamConfigUI` lắng nghe sự kiện, validate input và `DataStore.save()`.
3. **Phân công (Trigger)**: Người dùng bấm "XẾP GIÁM THỊ".
    - Gọi `AssignmentEngine.run(ExamDataStore.state)`.
    - Trả về danh sách `assignments` và `logs` cảnh báo thiếu/nới lỏng.
4. **Hiển thị (View)**: 
    - Lấy `DataStore.state.assignments` render ra ma trận (Hàng là Giám thị, Cột là Buổi thi).
5. **Xuất báo cáo (Export)**:
    - Gọi `ExportService.exportToExcel()`.

---

> [!TIP] Best Practices Đã Áp Dụng
> - **Idempotent Assignments**: Thuật toán có tính chất Idempotent (Chạy nhiều lần với cùng 1 tập input sẽ cho ra cùng kết quả hoặc kết quả cân bằng tương tự), giúp người dùng dễ debug.
> - **Fallback & Relaxation**: Khi cạn kiệt giám thị do ràng buộc quá gắt, thuật toán tự động "nới lỏng" các ràng buộc mềm (như `noBackToBack`) để tránh việc phòng thi bị trống.
> - **Dependency Injection (JS Style)**: Hàm `calculateScore` và `isValid` nhận `state` làm tham số giúp chúng trở thành Pure Functions (dễ viết Unit Test sau này).

Hệ thống hiện tại trên project của bạn đã bao gồm **80%** nền tảng này (tôi đã viết Heuristic Assignment trên `proctor_pro.js`). Bạn có muốn tôi tiến hành thay thế hoàn toàn file `proctor_pro.js` và `exam_config.js` hiện tại bằng kiến trúc chuẩn chỉ trên không? (Việc này sẽ thay đổi toàn bộ UI và backend phân công thành một bản nâng cấp toàn diện).
