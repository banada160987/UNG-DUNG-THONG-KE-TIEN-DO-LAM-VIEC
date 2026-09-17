/**
 * ZALO COMMUNICATION HUB (v1.0 Production Grade)
 * Unified Premium Messaging for Teachers & Zalo Groups
 */

const ZaloHub = (() => {
    "use strict";

    const STORAGE_KEY = 'vtool_zalo_contacts';
    const escapeHTML = (str) => {
        if (str == null) return '';
        return str.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };
    let contacts = {
        classes: {}, // '12A1': '0912345678'
        groups: {
            'ALL_GVCN': 'https://zalo.me/g/',
            'HOI_DONG': 'https://zalo.me/g/'
        }
    };

    let activeTab = 'contacts';
    let bulkQueue = [];
    let bulkIndex = 0;
    let bulkTimer = null;
    let isPaused = false;

    const getErrorsObj = () => {
        if (typeof window.classGroupedErrors !== 'undefined' && window.classGroupedErrors && Object.keys(window.classGroupedErrors).length > 0) return window.classGroupedErrors;
        if (typeof classGroupedErrors !== 'undefined' && classGroupedErrors && Object.keys(classGroupedErrors).length > 0) return classGroupedErrors;
        if (typeof search === 'function' && typeof excelData !== 'undefined' && excelData.length > 0) {
            try { search(); } catch(e) { console.error("Auto search failed in ZaloHub", e); }
            if (typeof window.classGroupedErrors !== 'undefined' && window.classGroupedErrors) return window.classGroupedErrors;
        }
        return {};
    };

    // --- PERSISTENCE ---
    const loadContacts = () => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                contacts = { ...contacts, ...parsed };
                if (!contacts.classes) contacts.classes = {};
                if (!contacts.groups) contacts.groups = {};
            }
        } catch (e) {
            console.error("ZaloHub: Failed to load contacts", e);
        }
    };

    const saveContacts = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
        } catch (e) {
            console.error("ZaloHub: Failed to save contacts", e);
        }
    };

    // --- PROCTOR RESOLVER UTILITIES ---
    const matchProctor = (ap, tId, tNameNorm, tUnitNorm) => {
        if (ap.id && tId) return ap.id === tId;
        const apName = (ap.name || "").toString().toLowerCase().trim();
        const apUnit = (ap.unit || "").toString().toLowerCase().trim();
        if (ap.unit && tUnitNorm) return apName === tNameNorm && apUnit === tUnitNorm;
        return apName === tNameNorm;
    };

    const attachAssignmentsToProctors = (proctors) => {
        const rooms = (typeof window.generatedRooms !== 'undefined') ? window.generatedRooms : (typeof ProctorStore !== 'undefined' ? ProctorStore.getState().rooms : []);
        let sessions = (typeof ProctorPro !== 'undefined' && ProctorPro.activeSessions && ProctorPro.activeSessions.length > 0) ? ProctorPro.activeSessions : (typeof ProctorStore !== 'undefined' ? ProctorStore.getState().sessions : []);
        
        if ((!sessions || sessions.length === 0) && rooms && rooms.length > 0) {
            const sessionIds = new Set();
            rooms.forEach(r => {
                Object.keys(r).forEach(k => {
                    if (k.startsWith('proctors_')) sessionIds.add(k.replace('proctors_', ''));
                });
            });
            sessions = Array.from(sessionIds).map(id => ({ id, name: id }));
        }

        proctors.forEach(p => {
            p.assignments = [];
            const pId = p.id;
            const pNameNorm = (p.name || "").toString().toLowerCase().trim();
            const pUnitNorm = (p.unit || "").toString().toLowerCase().trim();

            if (rooms && rooms.length > 0 && sessions && sessions.length > 0) {
                rooms.forEach(r => {
                    sessions.forEach(s => {
                        const assigned = r[`proctors_${s.id}`] || r[`proctors_${s.name}`] || [];
                        const isAssigned = assigned.some(ap => matchProctor(ap, pId, pNameNorm, pUnitNorm));
                        if (isAssigned) {
                            let rNum = (r.number || r.name || "").toString();
                            if (rNum.includes('-')) rNum = rNum.split('-').pop();
                            const currentGrade = s.grade || r.grade || "";
                            const finalRoomName = currentGrade ? `${currentGrade}-${rNum}` : rNum;
                            
                            const idxInRoom = assigned.findIndex(ap => matchProctor(ap, pId, pNameNorm, pUnitNorm));
                            const role = idxInRoom === 0 ? "GT1" : (idxInRoom === 1 ? "GT2" : "GT3");

                            p.assignments.push({
                                sessionId: s.id,
                                sessionName: s.name || s.id,
                                roomNumber: finalRoomName,
                                role: role
                            });
                        }
                    });
                });
            }
        });
    };

    const getResolvedProctorList = () => {
        let list = (typeof window.proctorList !== 'undefined') ? window.proctorList : ((typeof proctorList !== 'undefined') ? proctorList : []);
        if (list.length === 0 && typeof ProctorStore !== 'undefined' && ProctorStore.getState()?.proctors) {
            list = ProctorStore.getState().proctors;
        }
        if (list.length > 0) {
            attachAssignmentsToProctors(list);
        }
        return list;
    };

    // --- DISPATCH ENGINE ---
    const dispatchMessage = (destination, message, btnElem = null) => {
        if (!destination) {
            if (typeof showAlert === 'function') showAlert("⚠️ Vui lòng nhập số điện thoại hoặc Link nhóm Zalo!", "warning");
            return false;
        }

        const isGroupLink = destination.startsWith('http://') || destination.startsWith('https://') || destination.startsWith('zalo://');
        const cleanPhone = !isGroupLink ? destination.replace(/[^0-9]/g, '') : '';

        // 1. Copy message to clipboard
        const triggerOpen = () => {
            if (btnElem) showButtonSuccess(btnElem);
            setTimeout(() => {
                if (isGroupLink) {
                    window.open(destination, '_blank');
                } else {
                    // Try desktop protocol
                    window.location.href = `zalo://conversation?phone=${cleanPhone}`;
                    // Backup web open
                    setTimeout(() => {
                        if (document.hasFocus()) {
                            window.open(`https://zalo.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
                        }
                    }, 600);
                }
            }, 300);
        };

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(message).then(triggerOpen).catch(() => {
                fallbackCopy(message);
                triggerOpen();
            });
        } else {
            fallbackCopy(message);
            triggerOpen();
        }
        return true;
    };

    const fallbackCopy = (text) => {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.top = "0";
        ta.style.left = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try { document.execCommand('copy'); } catch(e){}
        document.body.removeChild(ta);
    };

    const showButtonSuccess = (btn) => {
        if (!btn || btn === window) return;
        const origText = btn.innerHTML;
        const origBg = btn.style.background;
        btn.innerHTML = '<i data-lucide="check" style="width:14px"></i> Đã Copy & Mở Zalo';
        btn.style.background = '#10b981';
        btn.style.color = '#fff';
        if (typeof lucide !== 'undefined') lucide.createIcons();
        setTimeout(() => {
            btn.innerHTML = origText;
            btn.style.background = origBg;
            btn.style.color = '';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }, 2500);
    };

    // --- UI INJECTION & RENDERING ---
    const ensureModalContainer = () => {
        let container = document.getElementById('zalo-hub-overlay');
        if (!container) {
            container = document.createElement('div');
            container.id = 'zalo-hub-overlay';
            container.className = 'custom-alert-overlay';
            container.style.zIndex = '999999';
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.style.background = 'rgba(15, 23, 42, 0.75)';
            container.style.backdropFilter = 'blur(12px)';
            container.onclick = (e) => { if (e.target === container) closeModal(); };
            document.body.appendChild(container);
        }
        container.style.display = 'flex';
        return container;
    };

    const openModal = (tab = 'contacts', autoParam = null) => {
        loadContacts();
        activeTab = tab;
        const container = ensureModalContainer();
        container.innerHTML = getModalHTML();
        document.body.style.overflow = 'hidden';

        renderTabContent(autoParam);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const closeModal = () => {
        const container = document.getElementById('zalo-hub-overlay');
        if (container) container.remove();
        document.body.style.overflow = '';
        if (bulkTimer) clearInterval(bulkTimer);
    };

    const getModalHTML = () => `
        <div class="modal-container pro-card shadow-2xl" onclick="event.stopPropagation()" style="max-width: 900px; width: 95%; border-radius: 24px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.5);">
            <div class="modal-header flex justify-between items-center p-6 border-b" style="border-color: #e2e8f0; background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); border-top-left-radius: 24px; border-top-right-radius: 24px; color: white;">
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                        <i data-lucide="message-circle" style="width:28px; height:28px; color: white;"></i>
                    </div>
                    <div>
                        <h2 class="text-xl font-bold" style="margin:0; font-size: 22px;">Trung Tâm Liên Lạc Zalo (Zalo Hub)</h2>
                        <p class="text-xs text-white/80" style="margin:0;">Hệ thống thông báo tự động cho Giáo viên & Nhóm Zalo</p>
                    </div>
                </div>
                <button class="btn-refresh-mini bg-white/20 hover:bg-white/30 text-white rounded-full p-2" onclick="ZaloHub.closeModal()" style="border:none; cursor:pointer;">
                    <i data-lucide="x" style="width:20px; height:20px;"></i>
                </button>
            </div>

            <!-- TABS -->
            <div class="flex border-b bg-slate-50/50 p-2 gap-2 flex-wrap" style="border-color: #e2e8f0;">
                <button class="zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'contacts' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600 hover:bg-slate-100'}" onclick="ZaloHub.switchTab('contacts')" style="border:none; cursor:pointer; transition: all 0.2s; min-width:140px;">
                    <i data-lucide="book-open" style="width:18px"></i> Danh Bạ
                </button>
                <button class="zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'media' ? 'bg-white shadow-md text-purple-600' : 'text-slate-600 hover:bg-slate-100'}" onclick="ZaloHub.switchTab('media')" style="border:none; cursor:pointer; transition: all 0.2s; min-width:140px;">
                    <i data-lucide="image" style="width:18px"></i> Gửi Ảnh (Media)
                </button>
                <button class="zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'errors' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600 hover:bg-slate-100'}" onclick="ZaloHub.switchTab('errors')" style="border:none; cursor:pointer; transition: all 0.2s; min-width:140px;">
                    <i data-lucide="alert-triangle" style="width:18px"></i> Báo Lỗi
                </button>
                <button class="zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'proctor' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600 hover:bg-slate-100'}" onclick="ZaloHub.switchTab('proctor')" style="border:none; cursor:pointer; transition: all 0.2s; min-width:140px;">
                    <i data-lucide="calendar" style="width:18px"></i> Gác Thi
                </button>
                <button class="zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'bulk' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600 hover:bg-slate-100'}" onclick="ZaloHub.switchTab('bulk')" style="border:none; cursor:pointer; transition: all 0.2s; min-width:140px;">
                    <i data-lucide="send" style="width:18px"></i> Hàng Đợi (${bulkQueue.length})
                </button>
            </div>

            <!-- CONTENT BODY -->
            <div id="zalo-hub-content" class="p-6" style="min-height: 420px; max-height: 70vh; overflow-y: auto;">
            </div>
        </div>
    `;

    const switchTab = (tab) => {
        activeTab = tab;
        const btns = document.querySelectorAll('.zalo-tab-btn');
        if (btns.length >= 5) {
            btns[0].className = `zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'contacts' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600 hover:bg-slate-100'} transition-all`;
            btns[1].className = `zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'media' ? 'bg-white shadow-md text-purple-600' : 'text-slate-600 hover:bg-slate-100'} transition-all`;
            btns[2].className = `zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'errors' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600 hover:bg-slate-100'} transition-all`;
            btns[3].className = `zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'proctor' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600 hover:bg-slate-100'} transition-all`;
            btns[4].className = `zalo-tab-btn flex-1 py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${activeTab === 'bulk' ? 'bg-white shadow-md text-blue-600' : 'text-slate-600 hover:bg-slate-100'} transition-all`;
        }
        renderTabContent();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const renderTabContent = (autoParam = null) => {
        const c = document.getElementById('zalo-hub-content');
        if (!c) return;

        if (activeTab === 'contacts') c.innerHTML = getContactsTabHTML();
        else if (activeTab === 'media') c.innerHTML = getMediaTabHTML();
        else if (activeTab === 'errors') c.innerHTML = getErrorsTabHTML(autoParam);
        else if (activeTab === 'proctor') c.innerHTML = getProctorTabHTML(autoParam);
        else if (activeTab === 'bulk') c.innerHTML = getBulkTabHTML();

        if (activeTab === 'errors') setupErrorsListeners(autoParam);
        if (activeTab === 'proctor') setupProctorListeners(autoParam);
        if (activeTab === 'media') setupMediaListeners();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    // --- TAB 1: CONTACTS ---
    const getContactsTabHTML = () => {
        // Auto-detect classes from current error list or excel data
        let detectedClasses = new Set();
        const errObj = getErrorsObj();
        Object.keys(errObj).forEach(cls => detectedClasses.add(cls));

        if (typeof excelData !== 'undefined' && typeof activeFileName !== 'undefined' && dataStore[activeFileName]?.mapping?.lop) {
            const lopKey = dataStore[activeFileName].mapping.lop;
            excelData.forEach(r => {
                if (r[lopKey]) {
                    const cName = typeof normalizeClass === 'function' ? normalizeClass(r[lopKey]) : r[lopKey].toString().trim().toUpperCase();
                    detectedClasses.add(cName);
                }
            });
        }

        detectedClasses.forEach(cls => {
            if (!contacts.classes[cls]) contacts.classes[cls] = '';
        });

        return `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- SĐT GVCN THEO LỚP -->
                <div class="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div class="flex items-center gap-2 mb-4 text-slate-800">
                        <i data-lucide="users" style="width:20px; color:#0ea5e9"></i>
                        <h3 class="font-bold text-lg" style="margin:0">Số Điện Thoại GVCN theo Lớp</h3>
                    </div>
                    <div class="space-y-3 max-h-80 overflow-y-auto pr-2">
                        ${Object.keys(contacts.classes).sort().map(cls => {
                            const escapedCls = escapeHTML(cls);
                            const escapedPhone = escapeHTML(contacts.classes[cls]);
                            const jsEscapedCls = escapedCls.replace(/'/g, "\\'");
                            return `
                            <div class="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                <span class="font-bold text-blue-600 w-16 bg-blue-50 py-1 text-center rounded-lg">Lớp ${escapedCls}</span>
                                <input type="text" class="form-control text-sm flex-1" placeholder="Nhập SĐT Zalo GVCN..." value="${escapedPhone}" onchange="ZaloHub.updateClassPhone('${jsEscapedCls}', this.value)" style="border-radius:10px">
                            </div>
                            `;
                        }).join('')}
                        ${Object.keys(contacts.classes).length === 0 ? '<div class="text-slate-400 italic text-center py-6">Chưa có dữ liệu lớp. Hãy tải file dữ liệu hoặc kiểm tra hồ sơ.</div>' : ''}
                    </div>
                </div>

                <!-- LINK NHÓM ZALO CHUNG -->
                <div class="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div class="flex items-center gap-2 mb-4 text-slate-800">
                        <i data-lucide="link" style="width:20px; color:#10b981"></i>
                        <h3 class="font-bold text-lg" style="margin:0">Đường Dẫn Nhóm Zalo Chung</h3>
                    </div>
                    <div class="space-y-4">
                        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <label class="block text-xs font-bold text-slate-500 mb-1">NHÓM GVCN KHỐI / TOÀN TRƯỜNG</label>
                            <input type="text" class="form-control text-sm w-full mb-2" placeholder="VD: https://zalo.me/g/xxxxxx" value="${contacts.groups['ALL_GVCN'] || ''}" onchange="ZaloHub.updateGroupLink('ALL_GVCN', this.value)" style="border-radius:10px">
                            <span class="text-xs text-slate-400">Dùng để gửi thông báo tổng hợp lỗi hồ sơ của toàn bộ các lớp.</span>
                        </div>

                        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <label class="block text-xs font-bold text-slate-500 mb-1">NHÓM HỘI ĐỒNG COI THI</label>
                            <input type="text" class="form-control text-sm w-full mb-2" placeholder="VD: https://zalo.me/g/yyyyyy" value="${contacts.groups['HOI_DONG'] || ''}" onchange="ZaloHub.updateGroupLink('HOI_DONG', this.value)" style="border-radius:10px">
                            <span class="text-xs text-slate-400">Dùng để gửi thông báo lịch trình & phân công giám thị chung.</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    const updateClassPhone = (cls, val) => {
        contacts.classes[cls] = val.replace(/[^0-9]/g, '');
        saveContacts();
        if (typeof showAlert === 'function') showAlert(`✅ Đã lưu SĐT GVCN lớp ${cls}`, 'success');
    };

    const updateGroupLink = (key, val) => {
        contacts.groups[key] = val.trim();
        saveContacts();
        if (typeof showAlert === 'function') showAlert(`✅ Đã lưu Link Nhóm Zalo`, 'success');
    };

    // --- TAB 2: ERRORS ---
    const getErrorsTabHTML = (autoClass = null) => {
        const errObj = getErrorsObj();
        const errorKeys = Object.keys(errObj).sort();
        if (errorKeys.length === 0) {
            return `<div class="p-12 text-center text-slate-400 italic">⚠️ Không có dữ liệu lỗi hồ sơ. Hãy bấm "Kiểm tra lỗi" trong tab Hồ Sơ trước.</div>`;
        }

        const selectedClass = autoClass || errorKeys[0];

        return `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- CỘT TRÁI: DANH SÁCH LỚP -->
                <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm max-h-96 overflow-y-auto">
                    <div class="text-xs font-bold text-slate-500 mb-3 flex justify-between items-center">
                        <span>CHỌN ĐỐI TƯỢNG GỬI</span>
                        <button class="btn btn-sm bg-blue-600 text-white rounded-lg text-xs py-1 px-2 flex items-center gap-1" onclick="ZaloHub.queueAllErrors()" style="border:none">
                            <i data-lucide="layers" style="width:12px"></i> Gửi Tất Cả (${errorKeys.length})
                        </button>
                    </div>
                    
                    <div class="space-y-2">
                        <div class="p-3 rounded-xl cursor-pointer border flex justify-between items-center transition-all ${selectedClass === 'ALL_GROUP' ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-md' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'}" onclick="ZaloHub.selectErrorTarget('ALL_GROUP')">
                            <div class="flex items-center gap-2">
                                <i data-lucide="users" style="width:18px"></i> Nhóm GVCN Tổng Hợp
                            </div>
                            <span class="text-xs px-2 py-0.5 rounded bg-white/20">Tổng hợp</span>
                        </div>

                        ${errorKeys.map(cls => {
                            const escapedCls = escapeHTML(cls);
                            const jsEscapedCls = escapedCls.replace(/'/g, "\\'");
                            const hasPhone = contacts.classes[cls];
                            const escapedPhoneState = hasPhone ? 'Có SĐT' : 'Thiếu SĐT';
                            const phoneBadgeClass = hasPhone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800';
                            const activeClass = selectedClass === cls ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-md' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200';
                            const errCount = Object.keys(errObj[cls]?.students || {}).length;

                            return `
                            <div class="p-3 rounded-xl cursor-pointer border flex justify-between items-center transition-all ${activeClass}" onclick="ZaloHub.selectErrorTarget('${jsEscapedCls}')">
                                <span>Lớp ${escapedCls}</span>
                                <div class="flex items-center gap-2">
                                    <span class="text-xs px-2 py-0.5 rounded ${phoneBadgeClass}">${escapedPhoneState}</span>
                                    <span class="text-xs font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">${errCount} lỗi</span>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- 2 CỘT PHẢI: KHUNG SOẠN & XEM TRƯỚC -->
                <div class="md:col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <div class="flex justify-between items-center mb-3">
                        <div class="flex items-center gap-2 text-slate-800">
                            <i data-lucide="eye" style="width:20px; color:#2563eb"></i>
                            <h3 class="font-bold text-lg" style="margin:0">Xem Trước Tin Nhắn (Live Preview)</h3>
                        </div>
                        <div id="error-dest-indicator" class="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        </div>
                    </div>

                    <textarea id="error-message-preview" class="form-control flex-1 text-sm font-mono p-4 mb-4 rounded-xl border border-slate-300 bg-white shadow-inner resize-none focus:ring-2 focus:ring-blue-500" style="min-height: 250px; border-radius: 16px;"></textarea>

                    <div class="flex gap-4">
                        <button class="btn btn-outline flex-1 py-3 px-5 rounded-xl font-bold flex items-center justify-center gap-2 border-slate-300 hover:bg-slate-100 text-slate-700" onclick="ZaloHub.copyPreviewText(this)">
                            <i data-lucide="copy" style="width:18px"></i> Chỉ Copy Văn Bản
                        </button>
                        <button id="btn-dispatch-error" class="btn bg-blue-600 hover:bg-blue-700 text-white flex-1 py-3 px-5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30" onclick="ZaloHub.dispatchCurrentErrorTarget(this)" style="border:none">
                            <i data-lucide="send" style="width:18px"></i> Gửi Tin Zalo Ngay
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    let currentTargetKey = '';
    const selectErrorTarget = (target) => {
        currentTargetKey = target;
        // Update selection UI
        const items = document.querySelectorAll('#zalo-hub-content .cursor-pointer');
        items.forEach(el => {
            if (el.innerText.includes(target === 'ALL_GROUP' ? 'Nhóm GVCN' : `Lớp ${target}`)) {
                el.className = 'p-3 rounded-xl cursor-pointer border flex justify-between items-center transition-all bg-blue-600 text-white font-bold border-blue-600 shadow-md';
            } else {
                el.className = 'p-3 rounded-xl cursor-pointer border flex justify-between items-center transition-all bg-white hover:bg-slate-100 text-slate-700 border-slate-200';
            }
        });

        const textarea = document.getElementById('error-message-preview');
        const indicator = document.getElementById('error-dest-indicator');
        if (!textarea || !indicator) return;

        const errObj = getErrorsObj();

        if (target === 'ALL_GROUP') {
            indicator.innerHTML = '<i data-lucide="link" style="width:14px; display:inline"></i> Nhóm Chung Khối/Trường';
            let msg = `📢 BÁO CÁO TỔNG HỢP RÀ SOÁT LỖI HỒ SƠ ĐĂNG KÝ THI TN THPT 2026\n(Ngày ${new Date().toLocaleDateString('vi-VN')})\n\nTổng hợp các lớp đang có học sinh gặp lỗi cần điều chỉnh gấp:\n\n`;
            Object.entries(errObj).sort().forEach(([cls, data]) => {
                const count = Object.keys(data.students).length;
                msg += `🔸 Lớp ${cls}: ${count} học sinh\n`;
            });
            msg += `\nKính đề nghị BGH và các Thầy/Cô chủ nhiệm rà soát, đôn đốc học sinh chỉnh sửa kịp thời hạn!\nTrân trọng thông báo!`;
            textarea.value = msg;
        } else {
            const phone = contacts.classes[target] || '';
            indicator.innerHTML = phone ? `<i data-lucide="phone" style="width:14px; display:inline"></i> SĐT GVCN: ${escapeHTML(phone)}` : '<i data-lucide="alert-circle" style="width:14px; display:inline"></i> GVCN chưa có SĐT';
            
            const data = errObj[target];
            const stdList = data ? Object.values(data.students) : [];
            let listText = stdList.map((s, i) => `${i + 1}. ${s.name}${s.phone ? ` (SĐT: ${s.phone})` : ''}: ${s.errors.join('; ')}`).join('\n');

            textarea.value = `📢 THÔNG BÁO LỖI HỒ SƠ ĐĂNG KÝ THI TN THPT - LỚP ${target}\n\nKính gửi Thầy/Cô chủ nhiệm lớp ${target},\nHệ thống kiểm tra phát hiện các học sinh sau trong lớp có hồ sơ chưa đạt chuẩn:\n\n${listText}\n\nThầy/Cô vui lòng thông báo học sinh kiểm tra và hoàn thiện gấp để nộp về hội đồng.\nTrân trọng cảm ơn!`;
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const setupErrorsListeners = (autoParam = null) => {
        const errObj = getErrorsObj();
        const errorKeys = Object.keys(errObj).sort();
        if (autoParam && (errorKeys.includes(autoParam) || autoParam === 'ALL_GROUP')) {
            selectErrorTarget(autoParam);
        } else if (errorKeys.length > 0) {
            selectErrorTarget(errorKeys[0]);
        }
    };

    const copyPreviewText = (btn) => {
        const text = document.getElementById('error-message-preview')?.value || '';
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => showButtonSuccess(btn));
        } else {
            fallbackCopy(text);
            showButtonSuccess(btn);
        }
    };

    const dispatchCurrentErrorTarget = (btn) => {
        const text = document.getElementById('error-message-preview')?.value || '';
        let dest = currentTargetKey === 'ALL_GROUP' ? contacts.groups['ALL_GVCN'] : contacts.classes[currentTargetKey];
        if (!dest) {
            if (currentTargetKey === 'ALL_GROUP') showAlert("⚠️ Vui lòng cấu hình Link Nhóm Zalo GVCN trong tab Danh Bạ trước!", "warning");
            else showAlert(`⚠️ Chưa có SĐT GVCN của lớp ${currentTargetKey}!`, "warning");
            return;
        }
        dispatchMessage(dest, text, btn);
    };

    const queueAllErrors = () => {
        bulkQueue = [];
        const errObj = getErrorsObj();
        Object.entries(errObj).sort().forEach(([cls, data]) => {
            const phone = contacts.classes[cls];
            if (phone) {
                const stdList = Object.values(data.students);
                const listText = stdList.map((s, i) => `${i + 1}. ${s.name}${s.phone ? ` (SĐT: ${s.phone})` : ''}: ${s.errors.join('; ')}`).join('\n');
                const msg = `📢 THÔNG BÁO LỖI HỒ SƠ ĐĂNG KÝ THI TN THPT - LỚP ${cls}\n\nKính gửi Thầy/Cô chủ nhiệm lớp ${cls},\nHệ thống kiểm tra phát hiện các học sinh sau trong lớp có hồ sơ chưa đạt chuẩn:\n\n${listText}\n\nThầy/Cô vui lòng thông báo học sinh kiểm tra và hoàn thiện gấp.\nTrân trọng cảm ơn!`;
                bulkQueue.push({ id: cls, title: `GVCN Lớp ${cls} (${phone})`, dest: phone, msg });
            }
        });
        if (bulkQueue.length === 0) {
            showAlert("⚠️ Không có lớp nào được thiết lập SĐT GVCN!", "warning");
            return;
        }
        switchTab('bulk');
    };

    // --- TAB 3: PROCTORS ---
    const getProctorTabHTML = () => {
        const list = getResolvedProctorList();

        if (list.length === 0) {
            return `<div class="p-12 text-center text-slate-400 italic">⚠️ Không có danh sách Giám thị. Hãy tải dữ liệu phân công giám thị trong tab Phân Công.</div>`;
        }

        return `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- CỘT TRÁI: DANH SÁCH GIÁM THỊ -->
                <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm max-h-96 overflow-y-auto">
                    <div class="text-xs font-bold text-slate-500 mb-3 flex justify-between items-center">
                        <span>CHỌN GIÁM THỊ CẦN GỬI</span>
                        <button class="btn btn-sm bg-blue-600 text-white rounded-lg text-xs py-1 px-2 flex items-center gap-1" onclick="ZaloHub.queueAllProctors()" style="border:none">
                            <i data-lucide="layers" style="width:12px"></i> Gửi Tất Cả (${list.length})
                        </button>
                    </div>

                    <div class="space-y-2">
                        <div class="p-3 rounded-xl cursor-pointer border flex justify-between items-center transition-all bg-white hover:bg-slate-100 text-slate-700" onclick="ZaloHub.selectProctorTarget('ALL_GROUP')">
                            <div class="flex items-center gap-2 font-bold">
                                <i data-lucide="users" style="width:18px"></i> Nhóm Hội Đồng Coi Thi
                            </div>
                            <span class="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">Nhóm chung</span>
                        </div>

                        ${list.map(p => {
                            const pIdOrName = p.id || p.name || '';
                            const escapedIdOrName = escapeHTML(pIdOrName);
                            const jsEscapedIdOrName = escapedIdOrName.replace(/'/g, "\\'");
                            const escapedName = escapeHTML(p.name || '');
                            const escapedUnit = escapeHTML(p.unit || 'Giáo viên');
                            const escapedPhone = p.phone ? escapeHTML(p.phone) : '<span class="text-amber-600 font-semibold">Chưa có SĐT</span>';
                            
                            return `
                            <div class="p-3 rounded-xl cursor-pointer border flex justify-between items-center transition-all bg-white hover:bg-slate-100 text-slate-700" onclick="ZaloHub.selectProctorTarget('${jsEscapedIdOrName}')">
                                <div>
                                    <div class="font-bold text-sm">${escapedName}</div>
                                    <div class="text-xs text-slate-400">${escapedUnit} | ${escapedPhone}</div>
                                </div>
                                <button class="btn-refresh-mini p-1 text-slate-400 hover:text-blue-600" onclick="event.stopPropagation(); ZaloHub.promptProctorPhone('${jsEscapedIdOrName}')">
                                    <i data-lucide="edit-3" style="width:14px"></i>
                                </button>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- 2 CỘT PHẢI: KHUNG SOẠN & XEM TRƯỚC -->
                <div class="md:col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <div class="flex justify-between items-center mb-3">
                        <div class="flex items-center gap-2 text-slate-800">
                            <i data-lucide="eye" style="width:20px; color:#2563eb"></i>
                            <h3 class="font-bold text-lg" style="margin:0">Xem Trước Thông Báo Gác Thi</h3>
                        </div>
                        <div id="proctor-dest-indicator" class="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        </div>
                    </div>

                    <textarea id="proctor-message-preview" class="form-control flex-1 text-sm font-mono p-4 mb-4 rounded-xl border border-slate-300 bg-white shadow-inner resize-none focus:ring-2 focus:ring-blue-500" style="min-height: 250px; border-radius: 16px;"></textarea>

                    <div class="flex gap-4">
                        <button class="btn btn-outline flex-1 py-3 px-5 rounded-xl font-bold flex items-center justify-center gap-2 border-slate-300 hover:bg-slate-100 text-slate-700" onclick="ZaloHub.copyProctorPreviewText(this)">
                            <i data-lucide="copy" style="width:18px"></i> Chỉ Copy Văn Bản
                        </button>
                        <button id="btn-dispatch-proctor" class="btn bg-blue-600 hover:bg-blue-700 text-white flex-1 py-3 px-5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30" onclick="ZaloHub.dispatchCurrentProctorTarget(this)" style="border:none">
                            <i data-lucide="send" style="width:18px"></i> Gửi Tin Zalo Ngay
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    let currentProctorKey = '';
    const selectProctorTarget = (idOrName) => {
        currentProctorKey = idOrName;
        const items = document.querySelectorAll('#zalo-hub-content .cursor-pointer');
        items.forEach(el => {
            if (el.innerText.includes(idOrName === 'ALL_GROUP' ? 'Hội Đồng' : idOrName)) {
                el.className = 'p-3 rounded-xl cursor-pointer border flex justify-between items-center transition-all bg-blue-600 text-white font-bold border-blue-600 shadow-md';
            } else {
                el.className = 'p-3 rounded-xl cursor-pointer border flex justify-between items-center transition-all bg-white hover:bg-slate-100 text-slate-700 border-slate-200';
            }
        });

        const textarea = document.getElementById('proctor-message-preview');
        const indicator = document.getElementById('proctor-dest-indicator');
        if (!textarea || !indicator) return;

        const list = getResolvedProctorList();
        if (idOrName === 'ALL_GROUP') {
            indicator.innerHTML = '<i data-lucide="link" style="width:14px; display:inline"></i> Nhóm Hội Đồng Coi Thi';
            textarea.value = `📢 THÔNG BÁO LỊCH PHÂN CÔNG GIÁM THỊ KỲ THI TN THPT 2026\n(Hội đồng thi: ${document.getElementById('cfg-school-name')?.value || 'THPT'})\n\nKính gửi toàn thể các Thầy/Cô trong Hội đồng coi thi, lịch trình phân công chi tiết đã được ban chỉ đạo thiết lập thành công trên phần mềm.\nĐề nghị các Thầy/Cô có mặt đúng giờ tham dự phiên họp toàn thể và nhận nhiệm vụ coi thi.\nTrân trọng cảm ơn!`;
        } else {
            const p = list.find(x => (x.id === idOrName || x.name === idOrName));
            if (!p) return;
            indicator.innerHTML = p.phone ? `<i data-lucide="phone" style="width:14px; display:inline"></i> SĐT: ${escapeHTML(p.phone)}` : '<i data-lucide="alert-circle" style="width:14px; display:inline"></i> Giám thị chưa có SĐT';
            
            // Build assigned rooms string
            let assignedStr = "";
            if (p.assignments && p.assignments.length > 0) {
                p.assignments.forEach(a => {
                    assignedStr += `🔹 ${a.sessionName || a.sessionId}: Phòng ${a.roomNumber} (${a.role})\n`;
                });
            } else {
                assignedStr = "🔹 Hiện tại chưa có phân công phòng thi cụ thể.\n";
            }

            textarea.value = `📢 LỊCH PHÂN CÔNG COI THI TN THPT 2026\n\nKính gửi Thầy/Cô: ${p.name}\nĐơn vị: ${p.unit || 'Trường THPT'}\n\nBan chỉ đạo thông báo phân công nhiệm vụ coi thi của Thầy/Cô như sau:\n\n${assignedStr}\nThầy/Cô vui lòng kiểm tra và có mặt tại phòng thi trước giờ gọi thí sinh 30 phút.\nTrân trọng thông báo!`;
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const promptProctorPhone = (idOrName) => {
        const list = getResolvedProctorList();
        const p = list.find(x => (x.id === idOrName || x.name === idOrName));
        if (!p) return;
        const phone = prompt(`Nhập số điện thoại Zalo của Giám thị ${p.name}:`, p.phone || '');
        if (phone !== null) {
            p.phone = phone.replace(/[^0-9]/g, '');
            // Persist
            if (typeof saveAppState === 'function') saveAppState();
            if (typeof ProctorStore !== 'undefined' && typeof ProctorStore.saveToLocal === 'function') ProctorStore.saveToLocal();
            renderTabContent();
            if (typeof showAlert === 'function') showAlert(`✅ Đã lưu SĐT của Giám thị ${p.name}`, 'success');
        }
    };

    const setupProctorListeners = (autoParam = null) => {
        const list = getResolvedProctorList();
        if (autoParam && (autoParam === 'ALL_GROUP' || list.some(x => x.id === autoParam || x.name === autoParam))) {
            selectProctorTarget(autoParam);
        } else if (list.length > 0) {
            selectProctorTarget(list[0].id || list[0].name);
        }
    };

    const copyProctorPreviewText = (btn) => {
        const text = document.getElementById('proctor-message-preview')?.value || '';
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => showButtonSuccess(btn));
        } else {
            fallbackCopy(text);
            showButtonSuccess(btn);
        }
    };

    const dispatchCurrentProctorTarget = (btn) => {
        const text = document.getElementById('proctor-message-preview')?.value || '';
        const list = getResolvedProctorList();
        let dest = '';
        if (currentProctorKey === 'ALL_GROUP') dest = contacts.groups['HOI_DONG'];
        else {
            const p = list.find(x => x.id === currentProctorKey || x.name === currentProctorKey);
            dest = p ? p.phone : '';
        }

        if (!dest) {
            if (currentProctorKey === 'ALL_GROUP') showAlert("⚠️ Vui lòng cấu hình Link Nhóm Zalo Hội Đồng Coi Thi trong tab Danh Bạ trước!", "warning");
            else showAlert(`⚠️ Giám thị này chưa có số điện thoại! Hãy bấm biểu tượng bút chì để bổ sung.`, "warning");
            return;
        }
        dispatchMessage(dest, text, btn);
    };

    const queueAllProctors = () => {
        bulkQueue = [];
        const list = getResolvedProctorList();
        list.forEach(p => {
            if (p.phone) {
                let assignedStr = "";
                if (p.assignments && p.assignments.length > 0) {
                    p.assignments.forEach(a => { assignedStr += `🔹 ${a.sessionName || a.sessionId}: Phòng ${a.roomNumber} (${a.role})\n`; });
                } else assignedStr = "🔹 Chưa có phòng thi.\n";
                const msg = `📢 LỊCH PHÂN CÔNG COI THI TN THPT 2026\n\nKính gửi Thầy/Cô: ${p.name}\nĐơn vị: ${p.unit || 'THPT'}\n\nBan chỉ đạo thông báo nhiệm vụ coi thi của Thầy/Cô như sau:\n\n${assignedStr}\nThầy/Cô vui lòng có mặt tại hội đồng đúng giờ quy định.\nTrân trọng!`;
                bulkQueue.push({ id: p.id || p.name, title: `Giám thị ${p.name} (${p.phone})`, dest: p.phone, msg });
            }
        });
        if (bulkQueue.length === 0) {
            showAlert("⚠️ Không có Giám thị nào có số điện thoại! Hãy nhập SĐT cho giám thị trước.", "warning");
            return;
        }
        switchTab('bulk');
    };

    // --- TAB 4: BULK DISPATCH QUEUE ---
    const getBulkTabHTML = () => {
        return `
            <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
                <div class="w-full max-w-xl flex flex-col items-center text-center">
                    <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <i data-lucide="send" style="width:32px; height:32px;"></i>
                    </div>
                    <h3 class="font-bold text-2xl text-slate-800 mb-1" style="margin:0">Hàng Đợi Gửi Tin Hàng Loạt (Bulk Send)</h3>
                    <p class="text-sm text-slate-500 mb-6" style="margin:0">Hệ thống sẽ tự động sao chép văn bản và lần lượt chuyển tiếp giữa các số điện thoại / nhóm với khoảng nghỉ thông minh 2.5 giây.</p>

                    <!-- PROGRESS BAR -->
                    <div class="w-full bg-slate-200 rounded-full h-4 mb-2 overflow-hidden shadow-inner p-0.5">
                        <div id="bulk-progress-bar" class="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-300" style="width: ${bulkQueue.length ? (bulkIndex / bulkQueue.length * 100) : 0}%"></div>
                    </div>
                    <div class="flex justify-between w-full text-xs font-bold text-slate-600 mb-8">
                        <span id="bulk-status-label">${bulkQueue.length === 0 ? 'Hàng đợi trống' : (bulkIndex >= bulkQueue.length ? 'Đã hoàn tất gửi!' : `Đang chờ gửi... (${bulkIndex}/${bulkQueue.length})`)}</span>
                        <span>${bulkQueue.length ? Math.round(bulkIndex / bulkQueue.length * 100) : 0}%</span>
                    </div>

                    <!-- CONTROLS -->
                    <div class="flex gap-4 w-full justify-center">
                        ${bulkQueue.length === 0 ? `
                            <button class="btn bg-slate-200 text-slate-500 cursor-not-allowed py-3 px-8 rounded-xl font-bold" disabled>Không có dữ liệu gửi</button>
                        ` : (bulkIndex >= bulkQueue.length ? `
                            <button class="btn bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-8 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30" onclick="ZaloHub.resetBulkQueue()" style="border:none">
                                <i data-lucide="rotate-ccw" style="width:18px"></i> Làm Mới Lại
                            </button>
                        ` : `
                            <button id="btn-bulk-toggle" class="btn ${isPaused ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-500 hover:bg-amber-600'} text-white py-3 px-8 rounded-xl font-bold flex items-center gap-2 shadow-lg" onclick="ZaloHub.toggleBulkSend()" style="border:none">
                                <i data-lucide="${isPaused ? 'play' : 'pause'}" style="width:18px"></i> ${isPaused ? 'Tiếp Tục Gửi' : 'Tạm Dừng'}
                            </button>
                            <button id="btn-bulk-step" class="btn bg-slate-700 hover:bg-slate-800 text-white py-3 px-6 rounded-xl font-bold flex items-center gap-2" onclick="ZaloHub.sendNextBulkItem()" style="border:none">
                                Gửi 1 Bước <i data-lucide="chevron-right" style="width:18px"></i>
                            </button>
                        `)}
                    </div>
                </div>

                <!-- QUEUE LIST -->
                <div class="w-full mt-8 bg-white p-4 rounded-xl border border-slate-200 shadow-sm max-h-48 overflow-y-auto space-y-2">
                    <div class="text-xs font-bold text-slate-400 mb-2 uppercase">Danh sách hàng đợi chi tiết</div>
                    ${bulkQueue.map((q, idx) => `
                        <div class="flex items-center justify-between p-2 rounded-lg border text-xs font-mono ${idx < bulkIndex ? 'bg-slate-100 text-slate-400 border-slate-200' : (idx === bulkIndex ? 'bg-blue-50 text-blue-700 font-bold border-blue-300' : 'bg-white text-slate-700 border-slate-100')}">
                            <div class="flex items-center gap-2">
                                <span class="w-6 text-center font-bold">${idx + 1}</span>
                                <span>${escapeHTML(q.title)}</span>
                            </div>
                            <span>${idx < bulkIndex ? '✅ Đã gửi' : (idx === bulkIndex ? '⏳ Đang chờ...' : 'Chờ')}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    };

    const toggleBulkSend = () => {
        isPaused = !isPaused;
        if (!isPaused) {
            sendNextBulkItem();
            bulkTimer = setInterval(() => {
                if (!isPaused && bulkIndex < bulkQueue.length) sendNextBulkItem();
                else clearInterval(bulkTimer);
            }, 2500);
        } else {
            if (bulkTimer) clearInterval(bulkTimer);
        }
        renderTabContent();
    };

    const sendNextBulkItem = () => {
        if (bulkIndex >= bulkQueue.length) {
            if (bulkTimer) clearInterval(bulkTimer);
            renderTabContent();
            showAlert("🎉 Toàn bộ tiến trình gửi Zalo hàng loạt đã hoàn tất!", "success");
            return;
        }

        const item = bulkQueue[bulkIndex];
        dispatchMessage(item.dest, item.msg);
        bulkIndex++;
        renderTabContent();
    };

    const resetBulkQueue = () => {
        bulkIndex = 0;
        isPaused = true;
        if (bulkTimer) clearInterval(bulkTimer);
        renderTabContent();
    };

    const setBulkQueue = (items) => {
        bulkQueue = items || [];
        bulkIndex = 0;
        isPaused = true;
        if (bulkTimer) clearInterval(bulkTimer);
        switchTab('bulk');
    };


    // ==========================================
    // MEDIA BROADCAST ENGINE (0 VND ZALO)
    // ==========================================
    let mediaState = {
        template: 'score', // 'score' or 'cert'
        selectedClass: '',
        students: [],
        currentIndex: 0,
        queue: [], // For bulk
        canvas: null
    };

    const getMediaTabHTML = () => {
        let classList = [];
        let lopKey = null;
        if (typeof activeFileName !== 'undefined' && dataStore[activeFileName] && dataStore[activeFileName].mapping) {
            lopKey = dataStore[activeFileName].mapping.lop;
            if (lopKey && typeof excelData !== 'undefined') {
                const classes = new Set();
                excelData.forEach(r => {
                    if (r[lopKey]) classes.add(typeof normalizeClass === 'function' ? normalizeClass(r[lopKey]) : r[lopKey].toString().trim().toUpperCase());
                });
                classList = Array.from(classes).sort();
            }
        }

        if (classList.length === 0) {
            return `<div class="p-12 text-center text-slate-400 italic">⚠️ Chưa có dữ liệu Lớp/Học sinh. Vui lòng tải lên File Excel Danh sách hoặc Hồ sơ thi trước!</div>`;
        }

        if (!mediaState.selectedClass) mediaState.selectedClass = classList[0];

        return `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- CỘT TRÁI: DANH SÁCH LỚP -->
                <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm max-h-96 flex flex-col">
                    <div class="text-xs font-bold text-slate-500 mb-3">CHỌN LỚP & HỌC SINH</div>
                    
                    <select class="form-control mb-3 rounded-xl border-slate-300 font-bold text-blue-600 bg-white" onchange="ZaloHub.mediaSelectClass(this.value)">
                        ${classList.map(c => `<option value="${c}" ${c === mediaState.selectedClass ? 'selected' : ''}>Lớp ${c}</option>`).join('')}
                    </select>

                    <div class="flex-1 overflow-y-auto space-y-2 pr-1" id="media-student-list">
                        <!-- Populated by JS -->
                    </div>
                </div>

                <!-- CỘT PHẢI: PREVIEW & ACTION -->
                <div class="md:col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
                    <div class="flex w-full justify-between items-center mb-4">
                        <select class="form-control rounded-xl border-slate-300 font-bold text-purple-600 bg-purple-50" onchange="ZaloHub.mediaSelectTemplate(this.value)" style="width: auto;">
                            <option value="score" ${mediaState.template === 'score' ? 'selected' : ''}>🎨 Mẫu: Phiếu Điểm Cá Nhân</option>
                            <option value="cert" ${mediaState.template === 'cert' ? 'selected' : ''}>🎨 Mẫu: Giấy Khen Sang Trọng</option>
                        </select>
                        <button class="btn bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-md shadow-purple-500/30" onclick="ZaloHub.startMediaQueue()">
                            <i data-lucide="play" style="width:16px"></i> Gửi Toàn Lớp (${mediaState.selectedClass})
                        </button>
                    </div>

                    <!-- CANVAS RENDERER -->
                    <div class="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex justify-center items-center w-full relative overflow-hidden" style="min-height: 300px; background: repeating-linear-gradient(45deg, #f8fafc, #f8fafc 10px, #f1f5f9 10px, #f1f5f9 20px);">
                        <canvas id="media-canvas" class="max-w-full rounded shadow-md" style="height: auto; max-height: 400px;"></canvas>
                        
                        <!-- Lớp Overlay gửi tự động -->
                        <div id="media-queue-overlay" class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white hidden z-10 rounded-xl">
                            <h3 class="text-xl font-bold mb-2">Đang gửi: <span id="mq-student-name" class="text-yellow-400">Nguyễn Văn A</span></h3>
                            <p class="text-sm text-slate-300 mb-6">Trạng thái: <span id="mq-status" class="font-mono bg-slate-800 px-2 py-1 rounded">Chờ thao tác...</span></p>
                            
                            <div class="bg-white/10 p-4 rounded-xl border border-white/20 max-w-sm text-center mb-6">
                                <p class="text-sm mb-2 font-bold text-emerald-400">💡 HƯỚNG DẪN DÁN ẢNH (0 ĐỒNG)</p>
                                <p class="text-xs mb-1">1. Hệ thống đã copy ảnh vào bộ nhớ và tự bật Zalo.</p>
                                <p class="text-xs mb-1">2. Bạn chỉ cần nhấn <kbd class="bg-slate-800 px-1 rounded">Ctrl</kbd> + <kbd class="bg-slate-800 px-1 rounded">V</kbd> vào ô chat Zalo rồi nhấn Enter.</p>
                                <p class="text-xs text-yellow-300">3. Quay lại đây bấm "Tiếp Tục".</p>
                            </div>

                            <div class="flex gap-4">
                                <button class="btn bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-6 rounded-xl" onclick="ZaloHub.stopMediaQueue()">Dừng Lại</button>
                                <button class="btn bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-8 rounded-xl shadow-lg shadow-emerald-500/50" onclick="ZaloHub.nextMediaQueue()">Tiếp Tục <i data-lucide="arrow-right" class="inline" style="width:16px"></i></button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-4 flex w-full justify-center">
                        <button class="btn btn-outline py-2 px-4 rounded-xl border-slate-300 text-slate-600 hover:bg-slate-100 flex items-center gap-2 text-sm" onclick="ZaloHub.copyCurrentMedia()">
                            <i data-lucide="copy" style="width:16px"></i> Copy Ảnh Hiện Tại
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    const setupMediaListeners = () => {
        mediaSelectClass(mediaState.selectedClass);
    };

    const mediaSelectClass = (cls) => {
        mediaState.selectedClass = cls;
        if (!cls) return;

        let lopKey = null, nameKey = null, sbdKey = null, phoneKey = null;
        if (typeof activeFileName !== 'undefined' && dataStore[activeFileName] && dataStore[activeFileName].mapping) {
            const map = dataStore[activeFileName].mapping;
            lopKey = map.lop; nameKey = map.ho_ten; sbdKey = map.sbd; phoneKey = map.dien_thoai;
        }

        mediaState.students = [];
        if (lopKey && nameKey && typeof excelData !== 'undefined') {
            excelData.forEach(r => {
                const cName = typeof normalizeClass === 'function' ? normalizeClass(r[lopKey]) : r[lopKey].toString().trim().toUpperCase();
                if (cName === cls) {
                    mediaState.students.push({
                        name: r[nameKey],
                        sbd: sbdKey ? r[sbdKey] : '',
                        phone: phoneKey ? r[phoneKey] : '',
                        raw: r
                    });
                }
            });
        }

        // Sort by name
        mediaState.students.sort((a, b) => {
            const getFirstName = n => n ? n.split(' ').pop() : '';
            return getFirstName(a.name).localeCompare(getFirstName(b.name), 'vi');
        });

        const listEl = document.getElementById('media-student-list');
        if (listEl) {
            listEl.innerHTML = mediaState.students.map((s, idx) => `
                <div class="p-2 rounded-lg cursor-pointer border transition-all ${idx === mediaState.currentIndex ? 'bg-purple-600 text-white font-bold border-purple-600 shadow-md' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'}" onclick="ZaloHub.mediaSelectStudent(${idx})">
                    <div class="text-sm">${idx + 1}. ${escapeHTML(s.name)}</div>
                    ${s.phone ? `<div class="text-[10px] opacity-80"><i data-lucide="phone" class="inline" style="width:10px"></i> ${s.phone}</div>` : `<div class="text-[10px] text-amber-500">Thiếu SĐT (Sẽ gửi GVCN)</div>`}
                </div>
            `).join('');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        mediaSelectStudent(0);
    };

    const mediaSelectStudent = (idx) => {
        if (idx < 0 || idx >= mediaState.students.length) return;
        mediaState.currentIndex = idx;
        
        // Update UI
        const listEl = document.getElementById('media-student-list');
        if (listEl) {
            Array.from(listEl.children).forEach((el, i) => {
                if (i === idx) el.className = 'p-2 rounded-lg cursor-pointer border transition-all bg-purple-600 text-white font-bold border-purple-600 shadow-md';
                else el.className = 'p-2 rounded-lg cursor-pointer border transition-all bg-white hover:bg-slate-100 text-slate-700 border-slate-200';
            });
        }

        renderMediaCanvas();
    };

    const mediaSelectTemplate = (tpl) => {
        mediaState.template = tpl;
        renderMediaCanvas();
    };

    const renderMediaCanvas = () => {
        const canvas = document.getElementById('media-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const student = mediaState.students[mediaState.currentIndex];
        if (!student) return;

        // High resolution setup (1200x800 for Cert, 800x1000 for Score)
        if (mediaState.template === 'cert') {
            canvas.width = 1200; canvas.height = 800;
            drawCertificate(ctx, canvas.width, canvas.height, student);
        } else {
            canvas.width = 800; canvas.height = 1000;
            drawScoreSheet(ctx, canvas.width, canvas.height, student);
        }
    };

    const drawCertificate = (ctx, w, h, student) => {
        // Background
        ctx.fillStyle = '#fffdf5'; // slight yellow tint
        ctx.fillRect(0, 0, w, h);
        
        // Outer Border
        ctx.strokeStyle = '#c49a45'; // Gold
        ctx.lineWidth = 20;
        ctx.strokeRect(30, 30, w-60, h-60);
        ctx.lineWidth = 4;
        ctx.strokeRect(60, 60, w-120, h-120);

        // Header
        ctx.fillStyle = '#b81d13';
        ctx.font = 'bold 36px "Times New Roman"';
        ctx.textAlign = 'center';
        ctx.fillText('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', w/2, 140);
        ctx.font = 'bold 28px "Times New Roman"';
        ctx.fillText('Độc lập - Tự do - Hạnh phúc', w/2, 185);

        ctx.fillStyle = '#c49a45';
        ctx.font = 'bold 70px "Times New Roman"';
        ctx.fillText('GIẤY KHEN', w/2, 320);

        // Content
        ctx.fillStyle = '#1e293b';
        ctx.font = 'italic 32px "Times New Roman"';
        ctx.fillText('Khen tặng sinh viên / học sinh:', w/2, 400);

        ctx.fillStyle = '#b81d13';
        ctx.font = 'bold 55px "Times New Roman"';
        ctx.fillText((student.name || '').toUpperCase(), w/2, 480);

        ctx.fillStyle = '#1e293b';
        ctx.font = '30px "Times New Roman"';
        ctx.fillText(`Lớp: ${mediaState.selectedClass}   -   Khóa học: 2025 - 2026`, w/2, 550);
        
        ctx.font = 'italic 30px "Times New Roman"';
        ctx.fillText('Vì đã có thành tích xuất sắc trong học tập và rèn luyện.', w/2, 620);

        // Footer Sign
        ctx.font = 'italic 24px "Times New Roman"';
        ctx.fillText(`Ngày ${new Date().getDate()} tháng ${new Date().getMonth()+1} năm ${new Date().getFullYear()}`, w - 250, 680);
        ctx.font = 'bold 28px "Times New Roman"';
        ctx.fillText('HIỆU TRƯỞNG', w - 250, 720);
        
        // Fake Stamp & Sign
        ctx.save();
        ctx.translate(w - 250, 740);
        ctx.rotate(-0.1);
        ctx.fillStyle = 'rgba(220, 38, 38, 0.7)';
        ctx.font = '40px "Brush Script MT", cursive';
        ctx.fillText('Đã ký', 0, 0);
        ctx.beginPath();
        ctx.arc(-50, -10, 45, 0, Math.PI*2);
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(220, 38, 38, 0.5)';
        ctx.stroke();
        ctx.restore();
    };

    const drawScoreSheet = (ctx, w, h, student) => {
        // Extract scores if available
        let scores = {};
        const sData = student.raw;
        // Try to guess score columns based on keys (Toan, Van, Anh, or score mappings)
        Object.keys(sData).forEach(k => {
            const kl = k.toLowerCase();
            if (kl.includes('toan') || kl.includes('toán') || kl === 't' || kl.includes('toan_')) scores['Toán'] = sData[k];
            else if (kl.includes('van') || kl.includes('văn') || kl === 'v' || kl.includes('van_')) scores['Ngữ Văn'] = sData[k];
            else if (kl.includes('anh') || kl.includes('ngoai_ngu') || kl === 'nn') scores['Tiếng Anh'] = sData[k];
            else if (kl.includes('ly') || kl.includes('lý') || kl === 'l') scores['Vật Lý'] = sData[k];
            else if (kl.includes('hoa') || kl.includes('hóa') || kl === 'h') scores['Hóa Học'] = sData[k];
            else if (kl.includes('sinh') || kl === 's') scores['Sinh Học'] = sData[k];
            else if (kl.includes('su') || kl.includes('sử')) scores['Lịch Sử'] = sData[k];
            else if (kl.includes('dia') || kl.includes('địa')) scores['Địa Lý'] = sData[k];
            else if (kl.includes('gdcd') || kl === 'cd') scores['GDCD'] = sData[k];
        });

        // Background
        ctx.fillStyle = '#f0f9ff'; // sky-50
        ctx.fillRect(0, 0, w, h);

        // Header Shape
        ctx.fillStyle = '#0284c7'; // sky-600
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(w, 0);
        ctx.lineTo(w, 200);
        ctx.bezierCurveTo(w/2, 280, w/2, 280, 0, 200);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 45px Arial';
        ctx.fillText('PHIẾU ĐIỂM CÁ NHÂN', w/2, 90);
        ctx.font = '24px Arial';
        ctx.fillText(`Kỳ Thi Đánh Giá Năng Lực 2026`, w/2, 140);

        // Student Info Card
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = "rgba(0,0,0,0.1)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 10;
        ctx.beginPath();
        ctx.roundRect(50, 220, w-100, 160, 20);
        ctx.fill();
        ctx.shadowColor = "transparent";

        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'left';
        ctx.font = 'bold 36px Arial';
        ctx.fillText((student.name || 'HỌC SINH').toUpperCase(), 90, 280);
        ctx.font = '24px Arial';
        ctx.fillStyle = '#475569';
        ctx.fillText(`Lớp: ${mediaState.selectedClass}  |  SBD: ${student.sbd || 'N/A'}`, 90, 330);

        // Scores
        let currentY = 450;
        const keys = Object.keys(scores);
        if (keys.length === 0) {
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'center';
            ctx.fillText('(Chưa có dữ liệu điểm chi tiết trong file Excel)', w/2, 600);
        } else {
            ctx.fillStyle = '#0284c7';
            ctx.font = 'bold 28px Arial';
            ctx.fillText('BẢNG ĐIỂM CHI TIẾT', 50, 420);

            keys.forEach((subj, i) => {
                const score = parseFloat(scores[subj]) || 0;
                // Draw bar background
                ctx.fillStyle = '#e2e8f0';
                ctx.beginPath(); ctx.roundRect(250, currentY - 25, 450, 30, 15); ctx.fill();
                // Draw bar value
                const barWidth = Math.max(20, (score / 10) * 450);
                let barColor = score >= 8 ? '#10b981' : (score >= 5 ? '#3b82f6' : '#ef4444');
                ctx.fillStyle = barColor;
                ctx.beginPath(); ctx.roundRect(250, currentY - 25, barWidth, 30, 15); ctx.fill();

                // Text
                ctx.fillStyle = '#1e293b';
                ctx.textAlign = 'left';
                ctx.font = 'bold 24px Arial';
                ctx.fillText(subj, 50, currentY);

                // Score text
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'right';
                ctx.font = 'bold 20px Arial';
                if (barWidth > 40) ctx.fillText(score.toString(), 250 + barWidth - 10, currentY - 3);
                else {
                    ctx.fillStyle = '#0f172a';
                    ctx.fillText(score.toString(), 250 + barWidth + 35, currentY - 3);
                }

                currentY += 60;
            });

            // Calculate total or avg
            const total = keys.reduce((acc, k) => acc + (parseFloat(scores[k]) || 0), 0);
            ctx.fillStyle = '#0f172a';
            ctx.textAlign = 'right';
            ctx.font = 'bold 30px Arial';
            ctx.fillText(`TỔNG ĐIỂM: ${total.toFixed(2)}`, 700, currentY + 40);
        }

        // Footer
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.font = '18px Arial';
        ctx.fillText('Vui lòng phản hồi tin nhắn này nếu có thắc mắc. Trân trọng!', w/2, h - 40);
    };

    const copyCurrentMedia = async () => {
        const canvas = document.getElementById('media-canvas');
        if (!canvas) return;
        try {
            canvas.toBlob(async (blob) => {
                if (navigator.clipboard && window.ClipboardItem) {
                    try {
                        const item = new ClipboardItem({ 'image/png': blob });
                        await navigator.clipboard.write([item]);
                        if (typeof showAlert === 'function') showAlert('✅ Đã copy ảnh vào Bộ nhớ tạm. Vui lòng Ctrl+V vào Zalo!', 'success');
                    } catch(e) {
                        console.warn(e);
                        fallbackMediaCopy();
                    }
                } else {
                    fallbackMediaCopy();
                }
            }, 'image/png');
        } catch(e) {
            console.warn("Media copy failed", e);
        }
    };

    const fallbackMediaCopy = () => {
        if (typeof showAlert === 'function') showAlert('Trình duyệt không hỗ trợ copy ảnh trực tiếp. Vui lòng chuột phải vào ảnh > "Sao chép hình ảnh".', 'warning');
    };

    // --- Media Queue Logic ---
    const startMediaQueue = () => {
        if (mediaState.students.length === 0) return;
        mediaState.queue = [...mediaState.students];
        const overlay = document.getElementById('media-queue-overlay');
        if (overlay) overlay.classList.remove('hidden');
        processNextMedia();
    };

    const processNextMedia = async () => {
        if (mediaState.queue.length === 0) {
            stopMediaQueue();
            if (typeof showAlert === 'function') showAlert('🎉 Đã gửi xong toàn bộ danh sách lớp!', 'success');
            return;
        }

        const student = mediaState.queue[0];
        const origIdx = mediaState.students.findIndex(s => s === student);
        if (origIdx >= 0) {
            mediaState.currentIndex = origIdx;
            renderMediaCanvas();
        }

        document.getElementById('mq-student-name').innerText = student.name;
        document.getElementById('mq-status').innerText = "Đang copy ảnh...";

        // Copy to clipboard
        const canvas = document.getElementById('media-canvas');
        canvas.toBlob(async (blob) => {
            let copied = false;
            if (navigator.clipboard && window.ClipboardItem) {
                try {
                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                    copied = true;
                } catch(e) { console.warn(e); }
            }
            
            if (copied) {
                document.getElementById('mq-status').innerText = "Đã copy! Đang mở Zalo...";
                // Determine destination
                let dest = student.phone ? student.phone.replace(/[^0-9]/g, '') : contacts.classes[mediaState.selectedClass];
                if (!dest) {
                    document.getElementById('mq-status').innerText = "⚠️ Lỗi: Không có SĐT HS & GVCN";
                    return; // Wait for manual override
                }
                
                setTimeout(() => {
                    // Try desktop protocol
                    window.location.href = `zalo://conversation?phone=${dest}`;
                    setTimeout(() => {
                        if (document.hasFocus()) window.open(`https://zalo.me/${dest}`, '_blank');
                    }, 600);
                }, 500);

            } else {
                document.getElementById('mq-status').innerText = "⚠️ Trình duyệt chặn Copy. Hãy Copy tay!";
            }
        }, 'image/png');
    };

    const nextMediaQueue = () => {
        mediaState.queue.shift(); // remove current
        processNextMedia();
    };

    const stopMediaQueue = () => {
        mediaState.queue = [];
        const overlay = document.getElementById('media-queue-overlay');
        if (overlay) overlay.classList.add('hidden');
    };


    // --- PUBLIC EXPORTS ---
    return {
        openModal,
        closeModal,
        switchTab,
        updateClassPhone,
        updateGroupLink,
        selectErrorTarget,
        copyPreviewText,
        dispatchCurrentErrorTarget,
        queueAllErrors,
        selectProctorTarget,
        promptProctorPhone,
        copyProctorPreviewText,
        dispatchCurrentProctorTarget,
        queueAllProctors,
        toggleBulkSend,
        sendNextBulkItem,
        resetBulkQueue,
        setBulkQueue,
        attachAssignmentsToProctors,
        getResolvedProctorList,
        mediaSelectClass,
        mediaSelectStudent,
        mediaSelectTemplate,
        startMediaQueue,
        nextMediaQueue,
        stopMediaQueue,
        copyCurrentMedia
    };
})();

// Attach to Window
window.ZaloHub = ZaloHub;
window.openZaloHub = (tab = 'contacts', autoParam = null) => ZaloHub.openModal(tab, autoParam);
