/**
 * PROCTOR ENGINE (Orchestrator Service)
 * Layer: Domain Logic / Use Cases
 */

const ProctorEngine = (() => {
    
    // --- PRIVATE SERVICES ---
    const ValidationService = {
        validate(state) {
            const errors = [];
            if (!state.proctors || state.proctors.length < 2) errors.push("Cần ít nhất 2 giám thị.");
            if (!state.sessions || state.sessions.length === 0) errors.push("Chưa có lịch thi.");
            if (!state.rooms || state.rooms.length === 0) errors.push("Chưa có danh sách phòng thi.");
            return { valid: errors.length === 0, errors };
        }
    };

    const AssignmentService = {
        generateStableId(p, idx) {
            const pid = (p.id || "").toString();
            if (pid && !pid.startsWith('PR-') && !pid.startsWith('P-')) return pid;
            const norm = (s) => (s || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]/g, "");
            return `P-${norm(p.name)}-${norm(p.unit) || 'x'}`;
        },

        run(state) {
            const stats = {};
            const logs = [];
            const constraints = state.config?.constraints || {};
            
            // 1. Initialize Proctors
            state.proctors.forEach((p, idx) => {
                p.id = this.generateStableId(p, idx);
                p.assignedSessions = [];
                p.assignedSlots = [];
                stats[p.id] = { total: 0, daily: {}, roomsVisited: new Set(), partners: new Set() };
            });

            // 2. Group Sessions by Slot (Sáng/Chiều - Ngày)
            const sessionsBySlot = {};
            state.sessions.forEach(s => {
                const key = s.slotKey || `${s.date}-${s.slot}`;
                if (!sessionsBySlot[key]) sessionsBySlot[key] = [];
                sessionsBySlot[key].push(s);
            });

            const results = [];
            let lastSlotSessionIds = [];

            // Sort slots chronologically (if possible)
            const sortedSlots = Object.keys(sessionsBySlot).sort();

            sortedSlots.forEach(slotKey => {
                const concurrentSessions = sessionsBySlot[slotKey];
                const sessionAssignments = [];
                const slotOccupiedIds = new Set(); // TRACK OCCUPIED IN THIS SLOT
                
                // Create a list of all rooms in this slot across all concurrent sessions
                const slotRooms = [];
                concurrentSessions.forEach(sess => {
                    const startIdx = sess.roomOffset || 0;
                    const endIdx = startIdx + (sess.roomCount || state.rooms.length);
                    const roomsInSess = state.rooms.slice(startIdx, endIdx);
                    
                    roomsInSess.forEach(r => {
                        slotRooms.push({
                            room: r,
                            session: sess,
                            subjects: sess.subjects 
                        });
                    });
                });

                // Assign rooms in this slot
                slotRooms.forEach(item => {
                    const room = item.room;
                    const session = item.session;
                    const assignedInRoom = [];
                    const needed = 2;

                    for (let level = 0; level <= 4; level++) {
                        if (assignedInRoom.length >= needed) break;

                        const currentConstraints = { ...constraints };
                        if (level >= 1) currentConstraints.strictDailyLimit = false;
                        if (level >= 2) currentConstraints.homeroomConflict = false;
                        if (level >= 3) currentConstraints.subjectConflict = false;

                        while (assignedInRoom.length < needed) {
                            // 1. Filter Pool: Must not be assigned in ANY room of this slot
                            let pool = state.proctors
                                .filter(p => !slotOccupiedIds.has(p.id)) 
                                .filter(p => !assignedInRoom.includes(p))
                                .map(p => ({
                                    proctor: p,
                                    check: ProctorRules.validate(p, session, room, assignedInRoom, stats, currentConstraints)
                                }))
                                .filter(c => c.check.valid);

                            // Absolute fallback
                            if (level === 4 && pool.length === 0 && assignedInRoom.length < needed) {
                                pool = state.proctors
                                    .filter(p => !slotOccupiedIds.has(p.id))
                                    .filter(p => !assignedInRoom.includes(p))
                                    .map(p => ({ proctor: p, check: { valid: true } }));
                            }

                            if (pool.length === 0) break; // Try next relaxation level

                            // 2. Score & Pick
                            const scoredPool = pool.map(c => ({
                                proctor: c.proctor,
                                score: ProctorRules.calculateScore(c.proctor, session, room, stats, assignedInRoom, lastSlotSessionIds, currentConstraints)
                            })).sort((a, b) => b.score - a.score);

                            // --- CƠ CHẾ BẢO VỆ TỐI THƯỢNG ---
                            // Nếu người giỏi nhất vẫn bị điểm âm (dính Killer Penalty trùng tổ/lặp cặp)
                            // Và chưa đến bước đường cùng (level 4), ta thà nới lỏng luật (cho gác nhiều ca)
                            // còn hơn là phải cắn răng chọn người trùng tổ.
                            if (scoredPool.length > 0 && scoredPool[0].score < 0 && level < 4) {
                                break; 
                            }
                            // --------------------------------

                            // --- DEBUG LOGGING ---
                            if (assignedInRoom.length === 1) {
                                console.log(`[DEBUG] Phòng ${room.name} (Ca: ${session.name}) đang chọn GT2. Đã có: ${assignedInRoom[0].name} (${assignedInRoom[0].unit})`);
                                console.log(`   > Top 5 ứng viên:`);
                                scoredPool.slice(0, 5).forEach((x, i) => {
                                    console.log(`     ${i+1}. ${x.proctor.name} (${x.proctor.unit}) | Điểm: ${Math.round(x.score)}`);
                                });
                            }
                            // ---------------------

                            const selected = scoredPool[0].proctor;
                            assignedInRoom.push(selected);
                            slotOccupiedIds.add(selected.id); // LOCK PROCTOR FOR THIS SLOT
                            
                            selected.assignedSessions.push(session.id);
                            selected.assignedSlots.push(slotKey);
                            
                            if (stats[selected.id]) {
                                stats[selected.id].total++;
                                const d = session.date || 'default';
                                stats[selected.id].daily[d] = (stats[selected.id].daily[d] || 0) + 1;
                                stats[selected.id].roomsVisited.add(room.id);
                                assignedInRoom.forEach(other => {
                                    if (other.id !== selected.id) {
                                        stats[selected.id].partners.add(other.id);
                                        stats[other.id].partners.add(selected.id);
                                    }
                                });
                            }
                        }
                    }

                    if (assignedInRoom.length < needed) {
                        logs.push(`[FAIL] Slot ${slotKey}, Phòng ${room.name}: Không đủ GT.`);
                    }

                    sessionAssignments.push({
                        sessionId: session.id,
                        roomId: room.id,
                        roomName: room.name,
                        proctors: assignedInRoom.map(p => ({ id: p.id, name: p.name, unit: p.unit }))
                    });
                });

                // Map results back
                // Map results back
                concurrentSessions.forEach(sess => {
                    const sessRes = { sessionId: sess.id, sessionName: sess.name, rooms: [], reserves: [] };
                    sessRes.rooms = sessionAssignments.filter(a => a.sessionId === sess.id);
                    
                    sessRes.reserves = state.proctors
                        .filter(p => !slotOccupiedIds.has(p.id))
                        .sort((a, b) => (stats[a.id]?.total || 0) - (stats[b.id]?.total || 0))
                        .slice(0, 5)
                        .map(p => ({ id: p.id, name: p.name }));
                    
                    results.push(sessRes);
                });

                // Update lastSlotSessionIds for the NEXT slot
                lastSlotSessionIds = concurrentSessions.map(sess => sess.id);
            });

            return { assignments: results, stats, logs };
        }
    };

    // --- PUBLIC API ---
    return {
        async executeAssignment() {
            const state = ProctorStore.getState();
            
            // 1. Validate
            const v = ValidationService.validate(state);
            if (!v.valid) return { success: false, errors: v.errors };

            // 2. Run Algorithm
            const result = AssignmentService.run(state);
            
            // 3. Update Store
            ProctorStore.setAssignments(result.assignments);
            ProctorStore.saveToLocal();

            return { success: true, ...result };
        }
    };
})();

window.ProctorEngine = ProctorEngine;
