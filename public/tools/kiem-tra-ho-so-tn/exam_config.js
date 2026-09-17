/**
 * EXAM CONFIGURATION WIZARD (v6.0 - Clean Architecture)
 * Role: Orchestrator / Controller for Proctor Assignment Workflow
 */

const ExamStore = (() => {
    const STORAGE_KEY = 'ExamConfig_v2';
    const _events = new EventTarget();
    
    const _rawState = {
        currentStep: 1,
        info: { name: '', semester: 'Học kỳ II', year: '2025-2026' },
        schedules: [],
        rooms: [],
        constraints: {
            noBackToBack: true,
            genderDiversity: true,
            subjectConflict: true,
            homeroomConflict: true,
            departmentDiversity: false,
            roomRotation: false,
            noRepeatPairing: false,
            strictDailyLimit: false,
            limitPerDay: 2
        }
    };

    const _state = new Proxy(_rawState, {
        set(target, prop, value) {
            target[prop] = value;
            _events.dispatchEvent(new CustomEvent('stateChanged', { detail: { prop, value } }));
            return true;
        }
    });

    return {
        get state() { return _state; },
        get rawState() { return _rawState; },
        get events() { return _events; },
        
        load() {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    Object.keys(parsed).forEach(k => {
                        if (_rawState.hasOwnProperty(k)) _state[k] = parsed[k];
                    });
                }
            } catch (e) {
                console.error("Load state failed", e);
            }
        },
        save() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
                if (typeof ProctorStore !== 'undefined') {
                    ProctorStore.setConfig(_state);
                }
            } catch (e) {
                console.error("Save state failed", e);
            }
        }
    };
})();

const UIUtils = {
    escape: (str) => {
        if (str == null) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },
    showAlert: (msg, type = 'info') => {
        if (typeof window.showAlert === 'function') {
            window.showAlert(msg, type);
        } else {
            alert(msg);
        }
    },
    syncWithGlobals: () => {
        if (typeof window.proctorList === 'undefined' && typeof proctorList !== 'undefined') {
            window.proctorList = proctorList;
        }
        if (typeof window.generatedRooms === 'undefined' && typeof generatedRooms !== 'undefined') {
            window.generatedRooms = generatedRooms;
        }
    }
};

const ExamValidator = {
    validateSchema: (json) => {
        if (!json || typeof json !== 'object' || Array.isArray(json)) return false;
        if (!json.info || typeof json.info !== 'object') return false;
        if (!json.schedules || !Array.isArray(json.schedules)) return false;
        return true;
    }
};

const ExamConfig = (() => {
    "use strict";

    const _state = ExamStore.state;
    const _rawState = ExamStore.rawState;
    const Utils = UIUtils;
    Utils.validateSchema = ExamValidator.validateSchema;

    const STEPS = [
        { id: 1, label: "Thông tin", icon: "info" },
        { id: 2, label: "Lịch thi", icon: "calendar" },
        { id: 3, label: "Phòng thi", icon: "door-open" },
        { id: 4, label: "Giám thị", icon: "users" },
        { id: 5, label: "Thiết lập", icon: "settings" }
    ];

    const injectUI = () => {
        const sidebarNav = document.querySelector('.sidebar-nav') || document.querySelector('.sidebar ul');
        if (sidebarNav && !document.getElementById('btn-tab-exam-config')) {
            const li = document.createElement('li');
            li.innerHTML = `
                <a href="javascript:void(0)" class="nav-item" id="btn-tab-exam-config" onclick="switchTab('exam-config')">
                    <i data-lucide="shield-check"></i>
                    <span>Cấu hình Kỳ thi</span>
                </a>
            `;
            sidebarNav.appendChild(li);
        }

        const mainContent = document.querySelector('main') || document.querySelector('.main-container');
        if (mainContent && !document.getElementById('view-exam-config')) {
            const section = document.createElement('section');
            section.id = 'view-exam-config';
            section.className = 'section-view';
            section.innerHTML = `
                <div class="page-header flex justify-between items-center">
                    <div>
                        <h1 class="page-title">Cấu hình & Phân công Giám thị</h1>
                        <p class="page-subtitle">Trình điều hướng thiết lập kỳ thi thông minh v6.0 (Clean Architecture)</p>
                    </div>
                    <div id="wizard-header-actions">
                        <div class="flex gap-2">
                            <button class="btn btn-outline btn-sm" data-action="triggerImport">
                                <i data-lucide="file-input" style="width:14px"></i> NHẬP CẤU HÌNH
                            </button>
                            <button class="btn btn-outline btn-sm" data-action="exportConfig">
                                <i data-lucide="file-output" style="width:14px"></i> XUẤT CẤU HÌNH
                            </button>
                            <button class="btn btn-primary btn-sm bg-gradient-to-r from-blue-600 to-indigo-600 border-none px-6" data-action="runAssignment">
                                <i data-lucide="sparkles" style="width:14px"></i> XẾP GIÁM THỊ
                            </button>
                            <input type="file" id="wiz-import-file" hidden accept=".json" data-action="handleImport">
                        </div>
                    </div>
                </div>
                <div class="pro-card shadow-2xl border-none overflow-hidden" style="border-radius: 24px; background: #fff;">
                    <div id="wizard-progress-bar" class="p-8 bg-gray-50 border-b"></div>
                    <div id="wizard-content" class="p-8 min-h-[450px]"></div>
                    <div class="p-6 bg-gray-50 border-t flex justify-between items-center">
                        <button id="wiz-prev-btn" class="btn btn-outline px-8" data-action="prevStep">
                            <i data-lucide="chevron-left"></i> QUAY LẠI
                        </button>
                        <button id="wiz-next-btn" class="btn btn-primary px-10 bg-blue-600 hover:bg-blue-700 shadow-lg" data-action="nextStep">
                            TIẾP TỤC <i data-lucide="chevron-right"></i>
                        </button>
                    </div>
                </div>
            `;
            mainContent.appendChild(section);
        }
    };

    const Renderers = {
        step1: () => `
            <div class="pro-section-title text-xl mb-4">1. Thông tin chung Kỳ thi</div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="form-group">
                    <label class="block text-sm font-bold text-gray-600 mb-1">Tên Kỳ thi</label>
                    <input type="text" class="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500" value="${UIUtils.escape(_state.info.name)}" 
                           placeholder="VD: Kiểm tra cuối kỳ II" data-action="updateInfo" data-key="name">
                </div>
                <div class="form-group">
                    <label class="block text-sm font-bold text-gray-600 mb-1">Học kỳ</label>
                    <select class="w-full border rounded p-2" data-action="updateInfo" data-key="semester">
                        <option ${_state.info.semester === 'Học kỳ I' ? 'selected' : ''}>Học kỳ I</option>
                        <option ${_state.info.semester === 'Học kỳ II' ? 'selected' : ''}>Học kỳ II</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="block text-sm font-bold text-gray-600 mb-1">Năm học</label>
                    <input type="text" class="w-full border rounded p-2" value="${UIUtils.escape(_state.info.year)}" data-action="updateInfo" data-key="year">
                </div>
            </div>
        `,
        step2: () => `
            <div class="flex justify-between items-center mb-4">
                <div class="pro-section-title text-xl mb-0">2. Lịch thi & Phân ca</div>
                <button class="btn btn-primary btn-sm" data-action="addScheduleRow">
                    <i data-lucide="plus" style="width:14px"></i> THÊM BUỔI THI
                </button>
            </div>
            <div class="overflow-x-auto border rounded bg-white">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50 border-b">
                        <tr>
                            <th class="p-2 text-left">Ngày thi</th>
                            <th class="p-2 text-left">Buổi</th>
                            <th class="p-2 text-left">Khối</th>
                            <th class="p-2 text-left">Môn thi (Cách nhau dấu phẩy)</th>
                            <th class="p-2 text-center">Số phòng</th>
                            <th class="p-2 text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${_state.schedules.length === 0 ? 
                            '<tr><td colspan="6" class="p-8 text-center text-gray-400 italic">Chưa có lịch thi. Bấm nút để thêm.</td></tr>' :
                            _state.schedules.map((s, i) => `
                            <tr class="border-b hover:bg-gray-50">
                                <td class="p-1"><input type="date" class="w-full border-none bg-transparent" value="${s.date}" data-action="updateSchedule" data-idx="${i}" data-key="date"></td>
                                <td class="p-1">
                                    <select class="w-full border-none bg-transparent" data-action="updateSchedule" data-idx="${i}" data-key="session">
                                        <option ${s.session === 'Sáng' ? 'selected' : ''}>Sáng</option>
                                        <option ${s.session === 'Chiều' ? 'selected' : ''}>Chiều</option>
                                    </select>
                                </td>
                                <td class="p-1"><input type="text" class="w-full border-none bg-transparent p-1" value="${UIUtils.escape(s.grade)}" data-action="updateSchedule" data-idx="${i}" data-key="grade" placeholder="K12"></td>
                                <td class="p-1"><input type="text" class="w-full border-none bg-transparent p-1 font-semibold" value="${UIUtils.escape(s.subjects)}" data-action="updateSchedule" data-idx="${i}" data-key="subjects" placeholder="Toán, Lý..."></td>
                                <td class="p-1 text-center"><input type="number" class="w-16 border-none bg-transparent p-1 text-center" value="${s.roomCount}" data-action="updateSchedule" data-idx="${i}" data-key="roomCount"></td>
                                <td class="p-1 text-center"><button class="text-red-500 p-2" data-action="removeScheduleRow" data-idx="${i}"><i data-lucide="trash-2" style="width:16px"></i></button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `,
        step3: () => `
            <div class="flex justify-between items-center mb-4">
                <div class="pro-section-title text-xl mb-0">3. Danh sách Phòng thi</div>
                <div class="flex gap-2">
                    <button class="btn btn-outline btn-sm" data-action="generateRooms">
                        <i data-lucide="refresh-cw" style="width:14px"></i> SINH TỰ ĐỘNG
                    </button>
                    <button class="btn btn-primary btn-sm" data-action="addRoomRow">
                        <i data-lucide="plus" style="width:14px"></i> THÊM PHÒNG
                    </button>
                </div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[400px] overflow-y-auto p-2 border rounded bg-gray-50" id="wiz-room-list">
                <!-- DocumentFragment will append here via renderStep -->
            </div>
        `,
        step4: () => {
            const list = (typeof window.proctorList !== 'undefined') ? window.proctorList : (typeof proctorList !== 'undefined' ? proctorList : []);
            return `
            <div class="flex justify-between items-center mb-4">
                <div class="pro-section-title text-xl mb-0">4. Quản lý Giám thị</div>
                <div class="flex gap-2">
                    <button class="btn btn-outline btn-sm bg-emerald-50 text-emerald-700 border-emerald-300 font-bold hover:bg-emerald-100" data-action="addNewProctor">
                        <i data-lucide="user-plus" style="width:14px"></i> THÊM GIÁM THỊ
                    </button>
                    <button class="btn btn-outline btn-sm bg-red-50 text-red-600 border-red-300 font-bold hover:bg-red-100" data-action="removeAllProctors">
                        <i data-lucide="trash-2" style="width:14px"></i> XÓA TẤT CẢ
                    </button>
                    <button class="btn btn-outline btn-sm" data-action="downloadProctorSample">
                        <i data-lucide="download" style="width:14px"></i> FILE MẪU
                    </button>
                    <button class="btn btn-primary btn-sm shadow-md" data-action="triggerImportProctor">
                        <i data-lucide="upload" style="width:14px"></i> IMPORT EXCEL
                    </button>
                    <input type="file" id="indep-proctor-import" hidden accept=".xlsx, .xls" data-action="handleExcelImport">
                </div>
            </div>
            <div class="overflow-x-auto border rounded max-h-[400px]">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50 border-b sticky top-0 z-10">
                        <tr>
                            <th class="p-2 text-center w-12">STT</th>
                            <th class="p-2 text-left">Họ và Tên</th>
                            <th class="p-2 text-center w-32">SĐT Zalo</th>
                            <th class="p-2 text-left">Đơn vị / Chuyên môn</th>
                            <th class="p-2 text-center w-20">Giới tính</th>
                            <th class="p-2 text-center w-24">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody id="wiz-proctor-list">
                        <!-- DocumentFragment will append here via renderStep -->
                    </tbody>
                </table>
            </div>
            `;
        },
        step5: () => {
            const c = _state.constraints;
            const proctorsCount = (typeof window.proctorList !== 'undefined' ? window.proctorList : []).length;
            const maxRoomsPerSession = Math.max(0, ...(_state.schedules.map(s => parseInt(s.roomCount) || 0)));
            const isInsufficient = proctorsCount < (maxRoomsPerSession * 2);

            return `
            <div class="pro-section-title text-xl mb-4">5. Thiết lập & Kiểm tra</div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div class="space-y-4">
                    <h3 class="font-bold text-gray-700 uppercase text-xs tracking-wider">Ràng buộc hệ thống</h3>
                    <label class="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" class="w-5 h-5 rounded" ${c.noBackToBack ? 'checked' : ''} data-action="toggleConstraint" data-key="noBackToBack">
                        <div>
                            <div class="font-semibold">Tránh gác ca liên tiếp</div>
                            <div class="text-xs text-gray-400">Giảm thiểu việc giám thị phải gác Sáng - Chiều cùng ngày.</div>
                        </div>
                    </label>
                    <label class="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" class="w-5 h-5 rounded" ${c.genderDiversity ? 'checked' : ''} data-action="toggleConstraint" data-key="genderDiversity">
                        <div>
                            <div class="font-semibold">Đa dạng giới tính</div>
                            <div class="text-xs text-gray-400">Ưu tiên mỗi phòng có 1 Nam - 1 Nữ.</div>
                        </div>
                    </label>
                    <label class="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" class="w-5 h-5 rounded" ${c.subjectConflict ? 'checked' : ''} data-action="toggleConstraint" data-key="subjectConflict">
                        <div>
                            <div class="font-semibold">Chặn trùng chuyên môn</div>
                            <div class="text-xs text-gray-400">Giám thị không gác môn mình đang giảng dạy.</div>
                        </div>
                    </label>
                    <label class="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" class="w-5 h-5 rounded" ${c.homeroomConflict ? 'checked' : ''} data-action="toggleConstraint" data-key="homeroomConflict">
                        <div>
                            <div class="font-semibold">Tránh gác lớp chủ nhiệm</div>
                            <div class="text-xs text-gray-400">Không phân công giám thị gác chính lớp mình chủ nhiệm.</div>
                        </div>
                    </label>
                    <label class="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" class="w-5 h-5 rounded" ${c.departmentDiversity ? 'checked' : ''} data-action="toggleConstraint" data-key="departmentDiversity">
                        <div>
                            <div class="font-semibold">Cân bằng tổ chuyên môn</div>
                            <div class="text-xs text-gray-400">Ưu tiên 2 giám thị trong 1 phòng không cùng tổ chuyên môn.</div>
                        </div>
                    </label>
                    <label class="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" class="w-5 h-5 rounded" ${c.roomRotation ? 'checked' : ''} data-action="toggleConstraint" data-key="roomRotation">
                        <div>
                            <div class="font-semibold">Xoay vòng phòng thi</div>
                            <div class="text-xs text-gray-400">Đảm bảo giám thị không gác lại phòng cũ đã từng gác.</div>
                        </div>
                    </label>
                    <label class="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" class="w-5 h-5 rounded" ${c.noRepeatPairing ? 'checked' : ''} data-action="toggleConstraint" data-key="noRepeatPairing">
                        <div>
                            <div class="font-semibold">Chặn cặp đôi lặp lại</div>
                            <div class="text-xs text-gray-400">Tránh việc 2 người cùng gác chung với nhau quá 1 lần.</div>
                        </div>
                    </label>
                    <label class="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" class="w-5 h-5 rounded" ${c.strictDailyLimit ? 'checked' : ''} data-action="toggleConstraint" data-key="strictDailyLimit">
                        <div>
                            <div class="font-semibold">Giới hạn 1 ca/ngày</div>
                            <div class="text-xs text-gray-400">Ép buộc mỗi giám thị chỉ được trực tối đa 1 buổi mỗi ngày.</div>
                        </div>
                    </label>
                </div>

                <div class="bg-gray-50 p-6 rounded-xl border-2 border-dashed">
                    <h3 class="font-bold text-gray-700 mb-4">Thống kê sẵn sàng</h3>
                    <div class="space-y-3">
                        <div class="flex justify-between items-center text-sm">
                            <span>Số phòng tối đa/ca:</span>
                            <span class="font-bold">${maxRoomsPerSession}</span>
                        </div>
                        <div class="flex justify-between items-center text-sm">
                            <span>Giám thị hiện có:</span>
                            <span class="font-bold ${isInsufficient ? 'text-red-500' : 'text-green-600'}">${proctorsCount}</span>
                        </div>
                        <div class="flex justify-between items-center text-sm">
                            <span>Cần tối thiểu/ca (x2):</span>
                            <span class="font-bold text-blue-600">${maxRoomsPerSession * 2}</span>
                        </div>
                    </div>

                    ${isInsufficient ? `
                        <div class="mt-4 p-3 bg-red-100 text-red-700 rounded text-xs leading-relaxed">
                            ⚠️ <strong>Cảnh báo:</strong> Số lượng giám thị hiện tại không đủ để bao phủ ca thi có nhiều phòng nhất (${maxRoomsPerSession} phòng). Vui lòng thêm ít nhất ${ (maxRoomsPerSession * 2) - proctorsCount } giám thị nữa.
                        </div>
                    ` : `
                        <div class="mt-4 p-3 bg-green-100 text-green-700 rounded text-xs flex items-center gap-2">
                            <i data-lucide="check-circle" style="width:16px"></i> Hệ thống đã sẵn sàng phân công cho mọi ca thi!
                        </div>
                    `}
                </div>
            </div>
            `;
        }
    };

    return {
        init() {
            injectUI();
            Utils.syncWithGlobals();
            ExamStore.load();
            
            ExamStore.events.addEventListener('stateChanged', () => {
                ExamStore.save();
            });
            
            // Event Delegation Pattern
            const container = document.body; // Listen globally for the wizard
            container.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-action]');
                if (!btn) return;
                
                const action = btn.dataset.action;
                const idx = btn.dataset.idx;
                
                switch(action) {
                    case 'triggerImport': document.getElementById('wiz-import-file').click(); break;
                    case 'exportConfig': ExamConfig.exportConfig(); break;
                    case 'runAssignment': ExamConfig.runAssignment(); break;
                    case 'prevStep': ExamConfig.prevStep(); break;
                    case 'nextStep': ExamConfig.nextStep(); break;
                    case 'addScheduleRow': ExamConfig.addScheduleRow(); break;
                    case 'removeScheduleRow': ExamConfig.removeScheduleRow(idx); break;
                    case 'generateRooms': ExamConfig.generateRooms(); break;
                    case 'addRoomRow': ExamConfig.addRoomRow(); break;
                    case 'removeRoomRow': ExamConfig.removeRoomRow(idx); break;
                    case 'addNewProctor': ExamConfig.addNewProctor(); break;
                    case 'removeAllProctors': ExamConfig.removeAllProctors(); break;
                    case 'downloadProctorSample': ExamConfig.downloadProctorSample(); break;
                    case 'triggerImportProctor': document.getElementById('indep-proctor-import').click(); break;
                    case 'editProctor': ExamConfig.editProctorModal(idx); break;
                    case 'removeProctor': ExamConfig.removeProctor(idx); break;
                    case 'closeModal': btn.closest('.custom-alert-overlay').remove(); break;
                    case 'saveProctorEdit': ExamConfig.saveProctorEdit(idx); break;
                }
            });

            container.addEventListener('change', (e) => {
                const el = e.target.closest('[data-action]');
                if (!el) return;
                
                const action = el.dataset.action;
                const idx = el.dataset.idx;
                const key = el.dataset.key;
                const val = el.type === 'checkbox' ? el.checked : el.value;
                
                switch(action) {
                    case 'handleImport': ExamConfig.handleImport(e); break;
                    case 'updateInfo': ExamConfig.updateInfo(key, val); break;
                    case 'updateSchedule': ExamConfig.updateSchedule(idx, key, val); break;
                    case 'updateRoom': ExamConfig.updateRoom(idx, val); break;
                    case 'handleExcelImport': ExamConfig.handleExcelImport(e); break;
                    case 'toggleConstraint': ExamConfig.toggleConstraint(key); break;
                }
            });
            
            this.renderStep();
        },

        saveState() { ExamStore.save(); },
        loadState() { ExamStore.load(); },

        renderStep() {
            const step = _state.currentStep;
            const content = document.getElementById('wizard-content');
            const progress = document.getElementById('wizard-progress-bar');
            if (!content || !progress) return;

            progress.innerHTML = `
                <div class="flex justify-between relative">
                    <div class="absolute top-5 left-0 w-full h-0.5 bg-gray-100 -z-10"></div>
                    <div class="absolute top-5 left-0 h-0.5 bg-blue-500 -z-10 transition-all duration-500" style="width: ${ (step-1)/(STEPS.length-1)*100 }%"></div>
                    ${STEPS.map((s, i) => `
                        <div class="flex flex-col items-center">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 
                                ${i+1 < step ? 'bg-green-500 text-white' : (i+1 === step ? 'bg-blue-600 text-white scale-110 shadow-lg' : 'bg-white border-2 text-gray-300')}">
                                ${i+1 < step ? '<i data-lucide="check" style="width:18px"></i>' : i+1}
                            </div>
                            <span class="text-[10px] mt-2 font-semibold uppercase tracking-tighter ${i+1 === step ? 'text-blue-600' : 'text-gray-400'}">${s.label}</span>
                        </div>
                    `).join('')}
                </div>
            `;

            const renderFn = Renderers[`step${step}`];
            if (renderFn) content.innerHTML = renderFn();
            
            // Diff-rendering / DocumentFragment population
            if (step === 3) {
                const container = content.querySelector('#wiz-room-list');
                if (container) {
                    if (_state.rooms.length === 0) {
                        container.innerHTML = '<div class="col-span-full py-12 text-center text-gray-400">Bấm "Sinh tự động" để tạo danh sách phòng thi dựa trên lịch thi.</div>';
                    } else {
                        const frag = document.createDocumentFragment();
                        _state.rooms.forEach((r, i) => {
                            const div = document.createElement('div');
                            div.className = 'bg-white p-2 border rounded shadow-sm flex justify-between items-center group';
                            div.innerHTML = `
                                <input type="text" class="w-full border-none text-sm font-bold focus:ring-0" value="${UIUtils.escape(r.name)}" data-action="updateRoom" data-idx="${i}">
                                <button class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity" data-action="removeRoomRow" data-idx="${i}">
                                    <i data-lucide="x" style="width:14px"></i>
                                </button>
                            `;
                            frag.appendChild(div);
                        });
                        container.appendChild(frag);
                    }
                }
            } else if (step === 4) {
                const tbody = content.querySelector('#wiz-proctor-list');
                if (tbody) {
                    const list = (typeof window.proctorList !== 'undefined') ? window.proctorList : (typeof proctorList !== 'undefined' ? proctorList : []);
                    if (list.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="6" class="p-12 text-center text-gray-400 italic">Vui lòng Import danh sách giám thị.</td></tr>';
                    } else {
                        const frag = document.createDocumentFragment();
                        list.forEach((p, i) => {
                            const tr = document.createElement('tr');
                            tr.className = 'border-b hover:bg-blue-50 transition-colors';
                            tr.innerHTML = `
                                <td class="text-center p-2 text-gray-400">${i+1}</td>
                                <td class="p-2 font-bold text-blue-900">${UIUtils.escape(p.name)}</td>
                                <td class="text-center p-2 font-mono text-xs ${p.phone ? 'text-slate-800 font-semibold' : 'text-amber-500'}">${UIUtils.escape(p.phone || 'Chưa nhập')}</td>
                                <td class="p-2 text-gray-600">${UIUtils.escape(p.unit)}</td>
                                <td class="text-center p-2">${UIUtils.escape(p.gender || 'Nam')}</td>
                                <td class="text-center p-2">
                                    <div class="flex items-center justify-center gap-2">
                                        <button class="btn-refresh-mini p-1 text-blue-500 hover:text-blue-700 bg-white shadow-sm border border-slate-200 rounded-lg" data-action="editProctor" data-idx="${i}" title="Sửa thông tin">
                                            <i data-lucide="edit" style="width:14px"></i>
                                        </button>
                                        <button class="btn-refresh-mini p-1 text-red-500 hover:text-red-700 bg-white shadow-sm border border-slate-200 rounded-lg" data-action="removeProctor" data-idx="${i}" title="Xóa">
                                            <i data-lucide="trash-2" style="width:14px"></i>
                                        </button>
                                    </div>
                                </td>
                            `;
                            frag.appendChild(tr);
                        });
                        tbody.appendChild(frag);
                    }
                }
            }

            const prevBtn = document.getElementById('wiz-prev-btn');
            const nextBtn = document.getElementById('wiz-next-btn');
            if (prevBtn) prevBtn.style.visibility = step === 1 ? 'hidden' : 'visible';
            if (nextBtn) nextBtn.textContent = step === STEPS.length ? 'HOÀN TẤT & LƯU' : 'TIẾP TỤC';

            if (typeof lucide !== 'undefined') lucide.createIcons();
        },

        nextStep() {
            if (_state.currentStep < STEPS.length) {
                _state.currentStep++;
                this.renderStep();
            } else {
                ExamStore.save();
                UIUtils.showAlert("✅ Cấu hình đã được lưu thành công!", "success");
            }
        },

        prevStep() {
            if (_state.currentStep > 1) {
                _state.currentStep--;
                this.renderStep();
            }
        },

        updateInfo(key, val) {
            _state.info[key] = val;
            ExamStore.save();
        },

        updateSchedule(idx, key, val) {
            _state.schedules[idx][key] = val;
            ExamStore.save();
        },

        addScheduleRow() {
            _state.schedules.push({ date: new Date().toISOString().split('T')[0], session: 'Sáng', grade: '12', subjects: '', roomCount: 24 });
            ExamStore.save();
            this.renderStep();
        },

        removeScheduleRow(idx) {
            _state.schedules.splice(idx, 1);
            ExamStore.save();
            this.renderStep();
        },

        generateRooms() {
            if (_state.schedules.length === 0) {
                UIUtils.showAlert("⚠️ Chưa có lịch thi. Vui lòng thiết lập tại Bước 1!", "warning");
                return;
            }
            const gradeMaxRooms = {};
            _state.schedules.forEach(s => {
                const grade = s.grade || 'K';
                const count = parseInt(s.roomCount) || 0;
                if (count > (gradeMaxRooms[grade] || 0)) {
                    gradeMaxRooms[grade] = count;
                }
            });

            const newRooms = [];
            let globalIdx = 1;
            const sortedGrades = Object.keys(gradeMaxRooms).sort();
            
            sortedGrades.forEach(grade => {
                const rawPrefix = grade.replace(/\s+/g, '');
                const gradeNum = rawPrefix.match(/^(\d+)$/);
                const prefix = gradeNum ? `K${rawPrefix}` : rawPrefix;
                const count = gradeMaxRooms[grade];
                for (let i = 1; i <= count; i++) {
                    newRooms.push({
                        id: `R${globalIdx++}`,
                        name: `${prefix}-P${i.toString().padStart(2, '0')}`,
                        grade: grade
                    });
                }
            });
            
            _state.rooms = newRooms;
            ExamStore.save();
            this.renderStep();
            UIUtils.showAlert(`✅ Đã sinh ${newRooms.length} phòng thi mẫu.`, 'success');
        },

        updateRoom(idx, val) {
            _state.rooms[idx].name = val;
            ExamStore.save();
        },

        addRoomRow() {
            const next = _state.rooms.length + 1;
            _state.rooms.push({ id: `R${next}`, name: `P-${next.toString().padStart(2, '0')}` });
            ExamStore.save();
            this.renderStep();
        },

        removeRoomRow(idx) {
            _state.rooms.splice(idx, 1);
            ExamStore.save();
            this.renderStep();
        },

        removeProctor(idx) {
            const list = (typeof window.proctorList !== 'undefined') ? window.proctorList : (typeof proctorList !== 'undefined' ? proctorList : []);
            if (confirm(`Bạn có chắc chắn muốn xóa giám thị ${list[idx].name}?`)) {
                list.splice(idx, 1);
                ExamStore.save();
                this.renderStep();
            }
        },

        removeAllProctors() {
            const list = (typeof window.proctorList !== 'undefined') ? window.proctorList : (typeof proctorList !== 'undefined' ? proctorList : []);
            if (list.length === 0) {
                UIUtils.showAlert("⚠️ Danh sách giám thị đang trống!", "warning");
                return;
            }
            if (confirm("⚠️ CẢNH BÁO: Bạn có chắc chắn muốn xóa TOÀN BỘ danh sách giám thị hiện tại?")) {
                list.length = 0;
                window.proctorList = list;
                if (typeof proctorList !== 'undefined') proctorList = list;
                ExamStore.save();
                this.renderStep();
                UIUtils.showAlert("🗑️ Đã xóa toàn bộ danh sách giám thị!", "success");
            }
        },

        addNewProctor() {
            const list = (typeof window.proctorList !== 'undefined') ? window.proctorList : (typeof proctorList !== 'undefined' ? proctorList : []);
            const name = prompt("Nhập Họ và Tên giám thị mới:");
            if (!name) return;
            const phone = prompt("Nhập Số điện thoại Zalo (tùy chọn):", "") || "";
            const unit = prompt("Nhập Đơn vị / Tổ bộ môn (tùy chọn):", "Toán") || "Chung";
            const gender = confirm(`Giám thị ${name} là Nữ? (Bấm OK = Nữ, Hủy = Nam)`) ? "Nữ" : "Nam";
            const classesStr = prompt("Nhập Lớp chủ nhiệm (cách nhau dấu phẩy, nếu có):", "") || "";
            const classes = classesStr ? classesStr.split(/[,;]/).map(s => s.trim()) : [];
            
            const newP = {
                id: `P-${Date.now()}-${list.length}`,
                name: name.trim(),
                phone: phone.replace(/[^0-9]/g, ''),
                unit: unit.trim(),
                gender: gender,
                classes: classes
            };
            list.push(newP);
            window.proctorList = list;
            if (typeof proctorList !== 'undefined') proctorList = list;
            ExamStore.save();
            this.renderStep();
            UIUtils.showAlert(`✅ Đã thêm giám thị mới: ${newP.name}`, "success");
        },

        editProctorModal(idx) {
            const list = (typeof window.proctorList !== 'undefined') ? window.proctorList : (typeof proctorList !== 'undefined' ? proctorList : []);
            const p = list[idx];
            if (!p) return;

            const modalId = 'modal-edit-proctor';
            let overlay = document.getElementById(modalId);
            if (overlay) overlay.remove();

            overlay = document.createElement('div');
            overlay.id = modalId;
            overlay.className = 'custom-alert-overlay';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.background = 'rgba(15, 23, 42, 0.75)';
            overlay.style.backdropFilter = 'blur(12px)';
            overlay.style.zIndex = '999999';

            overlay.innerHTML = `
                <div class="bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden border border-slate-200 p-8" onclick="event.stopPropagation()">
                    <div class="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                        <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shadow-inner">
                            <i data-lucide="user-check" style="width:24px; height:24px;"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-xl text-slate-800" style="margin:0">Chỉnh Sửa Thông Tin Giám Thị</h3>
                            <p class="text-xs text-slate-400" style="margin:0">Cập nhật hồ sơ và phương thức liên lạc Zalo</p>
                        </div>
                    </div>

                    <div class="space-y-4 mb-8">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Họ và Tên</label>
                            <input type="text" id="edit-p-name" class="form-control text-sm w-full font-semibold text-slate-800" value="${UIUtils.escape(p.name || '')}" style="border-radius:12px">
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Số Điện Thoại Zalo</label>
                                <input type="text" id="edit-p-phone" class="form-control text-sm w-full font-mono text-blue-600 font-bold" placeholder="VD: 0912..." value="${UIUtils.escape(p.phone || '')}" style="border-radius:12px">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Giới Tính</label>
                                <select id="edit-p-gender" class="form-control text-sm w-full font-semibold text-slate-800" style="border-radius:12px">
                                    <option value="Nam" ${p.gender === 'Nam' ? 'selected' : ''}>Nam</option>
                                    <option value="Nữ" ${p.gender === 'Nữ' ? 'selected' : ''}>Nữ</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Đơn vị / Tổ Bộ Môn</label>
                            <input type="text" id="edit-p-unit" class="form-control text-sm w-full font-semibold text-slate-800" value="${UIUtils.escape(p.unit || '')}" style="border-radius:12px">
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Lớp Chủ Nhiệm (Cách nhau dấu phẩy)</label>
                            <input type="text" id="edit-p-classes" class="form-control text-sm w-full font-semibold text-slate-800" placeholder="VD: 12A1, 12A2" value="${UIUtils.escape((p.classes || []).join(', '))}" style="border-radius:12px">
                        </div>
                    </div>

                    <div class="flex gap-4">
                        <button class="btn btn-outline flex-1 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 border-slate-300 cursor-pointer" data-action="closeModal">HỦY BỎ</button>
                        <button class="btn bg-blue-600 hover:bg-blue-700 text-white flex-1 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 cursor-pointer" data-action="saveProctorEdit" data-idx="${idx}" style="border:none">LƯU THAY ĐỔI</button>
                    </div>
                </div>
            `;

            overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
            document.body.appendChild(overlay);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        },

        saveProctorEdit(idx) {
            const list = (typeof window.proctorList !== 'undefined') ? window.proctorList : (typeof proctorList !== 'undefined' ? proctorList : []);
            const p = list[idx];
            if (!p) return;

            const name = document.getElementById('edit-p-name')?.value || '';
            if (!name.trim()) {
                UIUtils.showAlert("⚠️ Họ và Tên không được để trống!", "warning");
                return;
            }
            const phone = document.getElementById('edit-p-phone')?.value || '';
            const gender = document.getElementById('edit-p-gender')?.value || 'Nam';
            const unit = document.getElementById('edit-p-unit')?.value || '';
            const classesStr = document.getElementById('edit-p-classes')?.value || '';

            p.name = name.trim();
            p.phone = phone.replace(/[^0-9]/g, '');
            p.gender = gender;
            p.unit = unit.trim();
            p.classes = classesStr ? classesStr.split(/[,;]/).map(s => s.trim()).filter(Boolean) : [];

            document.getElementById('modal-edit-proctor')?.remove();
            ExamStore.save();
            this.renderStep();
            if (typeof ProctorStore !== 'undefined' && typeof ProctorStore.saveToLocal === 'function') ProctorStore.saveToLocal();
            UIUtils.showAlert(`✅ Đã cập nhật thông tin giám thị: ${p.name}`, "success");
        },

        downloadProctorSample() {
            try {
                const data = [
                    ["STT", "Họ và Tên", "Số điện thoại Zalo", "Đơn vị / Chuyên môn", "Giới tính", "Ghi chú (Lớp CN)"],
                    [1, "Nguyễn Văn A", "0912345678", "Toán", "Nam", "12A1, 12A5"],
                    [2, "Trần Thị B", "0987654321", "Văn", "Nữ", "12A2"],
                    [3, "Lê Văn C", "0901112233", "Anh", "Nam", ""]
                ];
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.aoa_to_sheet(data);
                ws['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 20 }];
                XLSX.utils.book_append_sheet(wb, ws, "DS_GIAM_THI");
                XLSX.writeFile(wb, "Mau_Danh_Sach_Giam_Thi.xlsx");
            } catch (err) {
                console.error(err);
                UIUtils.showAlert("❌ Lỗi xuất file mẫu!", "danger");
            }
        },

        downloadRoomSample() {
            try {
                const data = [
                    ["STT", "Tên Phòng", "Danh sách lớp (cách nhau dấu phẩy)", "Ghi chú"],
                    [1, "Phòng 01", "12A1, 12A2", "Dãy A tầng 1"],
                    [2, "Phòng 02", "12A3, 12A4", "Dãy A tầng 1"]
                ];
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.aoa_to_sheet(data);
                ws['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: 30 }, { wch: 20 }];
                XLSX.utils.book_append_sheet(wb, ws, "Mau_Phong_Thi");
                XLSX.writeFile(wb, "Mau_Danh_Sach_Phong_Thi.xlsx");
            } catch (err) {
                UIUtils.showAlert("❌ Lỗi xuất file mẫu!", "danger");
            }
        },

        toggleConstraint(key) {
            _state.constraints[key] = !_state.constraints[key];
            ExamStore.save();
            this.renderStep();
        },

        async handleExcelImport(event) {
            const target = event.target;
            const file = target.files[0];
            if (!file) return;
            
            // Show loading status
            Utils.showAlert("⏳ Đang xử lý file Excel, vui lòng đợi...", "info");
            
            try {
                const data = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(new Uint8Array(e.target.result));
                    reader.onerror = (err) => reject(new Error("Không thể đọc file Excel."));
                    reader.readAsArrayBuffer(file);
                });

                const wb = XLSX.read(data, { type: 'array' });
                if (!wb || !wb.SheetNames.length) throw new Error("File Excel không hợp lệ hoặc trống.");
                
                const ws = wb.Sheets[wb.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
                
                if (!json || json.length < 1) throw new Error("Không tìm thấy dữ liệu trong Sheet đầu tiên.");

                // Header detection: Find the first row that contains "Họ tên" or "Giám thị"
                let headerIdx = -1;
                for (let i = 0; i < Math.min(json.length, 30); i++) {
                    const row = (json[i] || []).map(c => c?.toString().toLowerCase().trim() || '');
                    if (row.some(c => c.includes('họ') || c.includes('tên') || c.includes('giám thị') || c.includes('gv') || c.includes('giao vien'))) {
                        headerIdx = i;
                        break;
                    }
                }

                if (headerIdx === -1) {
                    Utils.showAlert("❌ Không tìm thấy dòng tiêu đề (Họ tên, Giám thị...) trong 30 dòng đầu tiên!", "danger");
                    return;
                }

                const headers = json[headerIdx].map(h => h?.toString().toLowerCase().trim() || '');
                const idxName = headers.findIndex(h => h.includes('họ') || h.includes('tên') || h.includes('giám thị') || h.includes('gv'));
                const idxPhone = headers.findIndex(h => h.includes('sđt') || h.includes('sdt') || h.includes('điện thoại') || h.includes('phone') || h.includes('dt'));
                const idxUnit = headers.findIndex(h => h.includes('đơn vị') || h.includes('tổ') || h.includes('môn') || h.includes('trường') || h.includes('khoa'));
                const idxGender = headers.findIndex(h => h.includes('giới tính') || h.includes('g.tính') || h.includes('phái') || h.includes('nữ'));
                const idxClasses = headers.findIndex(h => h.includes('lớp') || h.includes('chủ nhiệm') || h.includes('lcn'));

                if (idxName === -1) {
                    Utils.showAlert("❌ Không tìm thấy cột 'Họ và Tên'!", "danger");
                    return;
                }

                const newList = json.slice(headerIdx + 1)
                    .filter(row => row[idxName] && row[idxName].toString().trim() !== "")
                    .map((row, i) => {
                        const name = row[idxName]?.toString().trim();
                        const phone = idxPhone !== -1 ? (row[idxPhone]?.toString().replace(/[^0-9]/g, '') || '') : '';
                        const unit = idxUnit !== -1 ? row[idxUnit]?.toString().trim() : 'Chưa rõ';
                        const genderVal = idxGender !== -1 ? row[idxGender]?.toString().toLowerCase() : '';
                        const gender = (genderVal.includes('nữ') || genderVal === '1' || genderVal === 'f') ? 'Nữ' : 'Nam';
                        const classes = idxClasses !== -1 && row[idxClasses] ? row[idxClasses].toString().split(/[,;]/).map(s => s.trim()) : [];
                        
                        return {
                            id: `P-${Date.now()}-${i}-${Math.floor(Math.random()*1000)}`,
                            name,
                            phone,
                            unit,
                            gender,
                            classes
                        };
                    });

                if (newList.length === 0) {
                    Utils.showAlert("⚠️ Không tìm thấy dữ liệu giám thị hợp lệ sau dòng tiêu đề!", "warning");
                    return;
                }

                // Force sync to global proctorList and window object
                const currentList = (typeof window.proctorList !== 'undefined') ? window.proctorList : (typeof proctorList !== 'undefined' ? proctorList : []);
                const mergedList = [...currentList, ...newList];
                
                // Update both for maximum compatibility
                window.proctorList = mergedList;
                if (typeof proctorList !== 'undefined') {
                    // eslint-disable-next-line no-global-assign
                    proctorList = mergedList;
                }
                
                this.saveState();
                this.renderStep();
                Utils.showAlert(`✅ Thành công! Đã nhập thêm ${newList.length} giám thị vào danh sách.`, "success");
            } catch (err) {
                console.error("Excel Import Error:", err);
                Utils.showAlert(`❌ Lỗi hệ thống: ${err.message}`, "danger");
            }
            // Clear input so the same file can be imported again if needed
            target.value = '';
        },

        exportConfig() {
            const data = JSON.stringify(_state, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ExamConfig_${_state.info.name || 'Untitled'}.json`;
            a.click();
            URL.revokeObjectURL(url);
        },

        async handleImport(event) {
            const file = event.target.files[0];
            if (!file) return;
            try {
                const text = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = (err) => reject(new Error("Không thể đọc file cấu hình."));
                    reader.readAsText(file);
                });

                const json = JSON.parse(text);
                
                // Schema Validation
                if (!Utils.validateSchema(json)) {
                    throw new Error("Cấu trúc file cấu hình JSON không hợp lệ.");
                }
                
                Object.keys(json).forEach(k => {
                    if (_rawState.hasOwnProperty(k)) _state[k] = json[k];
                });
                
                _state.currentStep = 1; // reset step
                this.renderStep();
                Utils.showAlert("✅ Đã nạp cấu hình tệp!", "success");
            } catch (err) {
                console.error("Config Import Error:", err);
                Utils.showAlert(`❌ Tệp không đúng định dạng hoặc bị lỗi: ${err.message}`, "danger");
            }
            event.target.value = '';
        },

        // --- THE "BIG ONE": RUN ASSIGNMENT ---
        async runAssignment() {
            try {
                Utils.syncWithGlobals();
                
                // 1. Synchronize Rooms
                const activeRooms = (typeof generatedRooms !== 'undefined' && generatedRooms.length > 0) 
                                    ? generatedRooms.map(r => ({ id: r.number, name: r.number })) 
                                    : _state.rooms;

                if (activeRooms.length === 0) {
                    Utils.showAlert("⚠️ Chưa có danh sách phòng thi. Vui lòng 'Sinh phòng thi' hoặc 'Xếp phòng' trước!", "warning");
                    return;
                }

                // If global generatedRooms is empty, sync from wizard
                if (typeof generatedRooms !== 'undefined' && generatedRooms.length === 0 && _state.rooms.length > 0) {
                    _state.rooms.forEach(r => {
                        generatedRooms.push({
                            number: r.name,
                            name: r.name,
                            students: []
                        });
                    });
                }

                // 2. Synchronize Proctors (Force to window object)
                const activeProctors = (typeof window.proctorList !== 'undefined') ? window.proctorList : (typeof proctorList !== 'undefined' ? proctorList : []);
                if (activeProctors.length === 0) {
                    Utils.showAlert("⚠️ Danh sách giám thị đang trống. Vui lòng Import tại Bước 4!", "warning");
                    return;
                }

                // Ensure IDs and update global reference
                const proctorsWithIds = activeProctors.map((p, i) => ({ ...p, id: p.id || `P${i}` }));
                window.proctorList = proctorsWithIds;
                if (typeof proctorList !== 'undefined') {
                    // eslint-disable-next-line no-global-assign
                    proctorList = proctorsWithIds;
                }

                // 3. Build Engine State
                const sessions = [];
                _state.schedules.forEach((s, i) => {
                    const date = s.date || 'unknown';
                    const slot = s.session || 'ca';
                    const slotKey = `${date}_${slot}`;
                    const grade = s.grade || 'K';
                    
                    // Tìm vị trí bắt đầu của khối này trong danh sách phòng tổng thể
                    const gradePrefix = (grade || "").toString().replace(/\s+/g, '');
                    const offset = activeRooms.findIndex(r => {
                        const rName = (r.name || r.number || "").toString();
                        return rName.startsWith(gradePrefix);
                    });
                    const rCount = parseInt(s.roomCount);
                    const count = (!isNaN(rCount) && rCount > 0) ? rCount : (activeRooms.filter(r => {
                        const rName = (r.name || r.number || "").toString();
                        return rName.startsWith(gradePrefix);
                    }).length || activeRooms.length);
                    
                    sessions.push({
                        id: `S${i+1}`,
                        name: `${grade} - ${s.subjects || 'Môn thi'}`,
                        date: date,
                        slot: slot,
                        slotKey: slotKey,
                        grade: grade,
                        subjects: s.subjects ? s.subjects.split(',').map(sub => sub.trim()) : [],
                        roomCount: count,
                        roomOffset: offset >= 0 ? offset : 0
                    });
                });

                if (sessions.length === 0) {
                    Utils.showAlert("⚠️ Chưa có lịch thi. Vui lòng thiết lập tại Bước 2!", "warning");
                    return;
                }

                // 4. Execute Engine
                if (typeof ProctorStore !== 'undefined' && typeof ProctorEngine !== 'undefined') {
                    const activeRooms = _state.rooms || [];
                    if (activeRooms.length === 0) {
                        Utils.showAlert("⚠️ Chưa có danh sách phòng thi. Vui lòng quay lại Bước 3 để sinh phòng!", "warning");
                        return;
                    }
                    
                    ProctorStore.setProctors(window.proctorList);
                    ProctorStore.setRooms(activeRooms);
                    ProctorStore.setSessions(sessions);
                    
                    // Sync constraints to Store
                    if (ProctorStore.setConfig) {
                        ProctorStore.setConfig({ constraints: _state.constraints });
                    }

                    const result = await ProctorEngine.executeAssignment();
                    if (!result.success) {
                        Utils.showAlert(`❌ Lỗi phân công: ${result.errors.join(', ')}`, "danger");
                        return;
                    }

                    // 5. Sync to Global generatedRooms (Force sync from Wizard state)
                    const globalRoomsRef = (typeof window.generatedRooms !== 'undefined') ? window.generatedRooms : (typeof generatedRooms !== 'undefined' ? generatedRooms : []);
                    
                    // Helper: normalize room identifier for robust matching
                    // e.g., 'K12-P01', '12-P01', 'P01' all extract numeric key '12-01'
                    const normalizeRoomId = (name) => {
                        if (!name) return '';
                        return (name + '').replace(/^K/i, '').replace(/\s+/g, '').toLowerCase();
                    };

                    // Merge Wizard rooms (which have student lists) with existing global rooms (which may have proctor assignments)
                    const currentRooms = _state.rooms || [];
                    const syncedRooms = currentRooms.map(r => {
                        const rId = normalizeRoomId(r.name || r.number);
                        // Find matching global room by normalized name
                        const existing = globalRoomsRef.find(gr => {
                            const grId = normalizeRoomId(gr.name || gr.number);
                            return grId === rId;
                        });
                        // Merge: start from existing (which has students[]), overlay r (which has room config)
                        // But preserve the existing students array if wizard room has no students
                        const merged = { ...(existing || {}), ...r };
                        if (existing && existing.students && existing.students.length > 0 && (!r.students || r.students.length === 0)) {
                            merged.students = existing.students;
                        }
                        return merged;
                    });

                    window.generatedRooms = syncedRooms;
                    if (typeof generatedRooms !== 'undefined') {
                        // eslint-disable-next-line no-global-assign
                        generatedRooms = syncedRooms;
                    }

                    if (typeof ProctorStore !== 'undefined') {
                        ProctorStore.setProctors(window.proctorList);
                        ProctorStore.setRooms(syncedRooms);
                        ProctorStore.saveToLocal();
                    }

                    const globalRooms = syncedRooms;
                    let totalAssigned = 0;
                    result.assignments.forEach(assign => {
                        assign.rooms.forEach(ar => {
                            const targetName = (ar.roomName || "").toString().trim().toLowerCase();
                            const room = globalRooms.find(r => {
                                const rName = (r.name || "").toString().trim().toLowerCase();
                                const rNum = (r.number || "").toString().trim().toLowerCase();
                                return rName === targetName || rNum === targetName;
                            });
                            
                            if (room) {
                                const sessKey = `proctors_${assign.sessionId}`;
                                const nameKey = `proctors_${assign.sessionName}`;
                                room[sessKey] = ar.proctors;
                                if (assign.sessionName) room[nameKey] = ar.proctors;
                                totalAssigned += (ar.proctors ? ar.proctors.length : 0);
                            }
                        });
                    });
                    
                    // Persist to IndexedDB
                    if (typeof saveToDB === 'function') saveToDB();

                    // 6. Navigate and Render with Diagnostics
                    if (typeof window.ProctorPro !== 'undefined') {
                        window.ProctorPro.activeSessions = ProctorStore.getState().sessions;
                        
                        setTimeout(() => {
                            window.ProctorPro.renderBoard();
                            if (typeof window.switchTab === 'function') window.switchTab('proctor-board');
                            
                            // Show Summary Alert
                            if (totalAssigned > 0) {
                                const failCount = result.logs.filter(l => l.includes('[FAIL]')).length;
                                const relaxCount = result.logs.filter(l => l.includes('[Relax')).length;
                                
                                let summaryMsg = `✅ Phân công thành công ${totalAssigned} lượt giám thị!`;
                                if (failCount > 0) summaryMsg += `<br/>⚠️ Có ${failCount} phòng không tìm đủ người.`;
                                if (relaxCount > 0) summaryMsg += `<br/>ℹ️ Đã nới lỏng ràng buộc tại ${relaxCount} vị trí để đảm bảo đủ người trực.`;
                                
                                Utils.showAlert(summaryMsg, failCount > 0 ? 'warning' : 'success');
                                
                                if (result.logs.length > 0) {
                                    console.log("=== PROCTOR ASSIGNMENT LOGS ===");
                                    result.logs.forEach(l => console.warn(l));
                                }
                            } else {
                                Utils.showAlert("⚠️ Thuật toán không thể phân công được ai. Hãy kiểm tra lại danh sách giám thị!", "warning");
                            }
                        }, 200);
                    }
                } else {
                    Utils.showAlert("❌ Lỗi: Thiếu Engine hoặc Store!", "danger");
                }
            } catch (err) {
                console.error("Assignment Execution Error:", err);
                const msg = err.message || "Có lỗi hệ thống xảy ra!";
                Utils.showAlert(`❌ Lỗi hệ thống: ${msg}`, "danger");
            }
        },

        saveConfig() { this.saveState(); }
    };
})();

// Initialize on load
document.addEventListener('DOMContentLoaded', () => ExamConfig.init());
window.ExamConfig = ExamConfig;
window.exportProctorTemplate = () => ExamConfig.downloadProctorSample();
window.downloadRoomSample = () => ExamConfig.downloadRoomSample();
window.importProctorsFromExcel = (e) => ExamConfig.handleExcelImport(e);
