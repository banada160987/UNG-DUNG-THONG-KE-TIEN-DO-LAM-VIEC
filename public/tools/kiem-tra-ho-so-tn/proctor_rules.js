/**
 * PROCTOR RULES ENGINE (v5.0 - Ultimate Stability)
 * Implementation of all School-level Constraints
 */

const ProctorRules = (() => {
    
    // Unified Robust Normalize Function
    const normalize = (str) => {
        if (!str) return '';
        return str.toString().toLowerCase().normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove tone marks
            .replace(/đ/g, "d")
            .replace(/[^a-z0-9]/g, " ") // Non-alphanumeric to space
            .replace(/\s+/g, " ")       // Collapse spaces
            .trim();
    };

    const HardRules = {
        // 1. Slot Conflict
        noTimeConflict(proctor, session) {
            if (!proctor || !session) return true;
            const slotKey = session.slotKey || session.id;
            return !(proctor.assignedSlots && proctor.assignedSlots.includes(slotKey));
        },

        // 2. Subject Conflict (Detects if proctor teaches the exam subject)
        noSubjectConflict(proctor, session) {
            if (!proctor || !session || !session.subjects || session.subjects.length === 0) return true;
            const normUnit = normalize(proctor.unit);
            if (!normUnit) return true;

            const unitWords = normUnit.split(" ").filter(w => w.length > 1 && !['hoc', 'va', 'mon', 'giao', 'vien', 'to'].includes(w));
            
            return !session.subjects.some(sub => {
                const normSub = normalize(sub);
                // If any significant word from unit is in subject name or vice-versa
                if (unitWords.some(uw => normSub.includes(uw) || uw.includes(normSub))) return true;
                // Direct overlap check
                return normUnit === normSub || normUnit.includes(normSub) || normSub.includes(normUnit);
            });
        },

        // 3. Homeroom Conflict (Proctor gác lớp mình chủ nhiệm)
        noHomeroomConflict(proctor, room) {
            if (!proctor || !room || !proctor.classes || proctor.classes.length === 0) return true;
            const normRoom = normalize(room.name);
            return !proctor.classes.some(cls => {
                const normCls = normalize(cls);
                return normRoom.includes(normCls) || normCls.includes(normRoom);
            });
        },

        // 4. Same Department (For pairing)
        differentDepartment(p1, p2) {
            if (!p1 || !p2 || !p1.unit || !p2.unit) return true;
            const norm1 = normalize(p1.unit);
            const norm2 = normalize(p2.unit);
            
            // If either department is generic/unknown, do not penalize them
            const genericTerms = ['chung', 'chuaro', 'chuaxacdinh', 'khongco'];
            const clean1 = norm1.replace(/\s+/g, '');
            const clean2 = norm2.replace(/\s+/g, '');
            if (genericTerms.includes(clean1) || genericTerms.includes(clean2)) {
                return true;
            }

            const getCore = (s) => s.split(" ").filter(w => w.length > 1 && !['hoc', 'va', 'mon', 'giao', 'vien', 'to'].includes(w)).join("");
            
            const core1 = getCore(norm1);
            const core2 = getCore(norm2);
            
            if (!core1 || !core2) return true;
            if (core1 === core2) return false;
            if (core1.includes(core2) || core2.includes(core1)) return false; 
            
            return true;
        },

        // 5. Total Quotas
        withinQuotas(proctor, stats) {
            const limit = 12; // Safety ceiling
            return (stats[proctor.id]?.total || 0) < limit;
        }
    };

    const ScoringRules = {
        // Higher score = More likely to be picked
        fairnessScore: (p, stats) => (100 - (stats[p.id]?.total || 0)) * 10,
        backToBackPenalty: (p, session, lastSlotSessionIds) => {
            if (!lastSlotSessionIds || !Array.isArray(lastSlotSessionIds)) return 0;
            const isBackToBack = lastSlotSessionIds.some(sessId => p.assignedSessions?.includes(sessId));
            return isBackToBack ? -1000 : 0;
        },

        // 3. Gender Diversity (Ưu tiên cặp 1 Nam - 1 Nữ)
        genderDiversityScore: (p, assignedInRoom) => {
            if (assignedInRoom.length === 0 || !p.gender) return 0;
            // Nếu đã có 1 người và khác giới tính với người đang xét => Thưởng điểm
            return p.gender !== assignedInRoom[0].gender ? 2000 : 0;
        },
    };

    return {
        validate(proctor, session, room, assignedInRoom, stats, constraints = {}) {
            const results = { valid: true, logs: [] };

            // Hard constraints (Mandatory unless relaxed by Level)
            if (!HardRules.noTimeConflict(proctor, session)) {
                results.valid = false;
                results.logs.push("Trùng lịch trực");
            }
            if (constraints.subjectConflict !== false && !HardRules.noSubjectConflict(proctor, session)) {
                results.valid = false;
                results.logs.push("Trùng chuyên môn");
            }
            if (constraints.homeroomConflict !== false && !HardRules.noHomeroomConflict(proctor, room)) {
                results.valid = false;
                results.logs.push("Gác lớp chủ nhiệm");
            }
            if (constraints.withinQuotas !== false && !HardRules.withinQuotas(proctor, stats)) {
                results.valid = false;
                results.logs.push("Vượt định mức");
            }
            if (constraints.strictDailyLimit === true && (stats[proctor.id]?.daily[session.date || 'default'] || 0) >= 1) {
                results.valid = false;
                results.logs.push("Đã gác trong ngày");
            }
            return results;
        },

        calculateScore: (p, session, room, stats, assignedInRoom, lastSlotSessionIds, constraints = {}) => {
            let score = 20000; // High base to prevent negative scores
            score += ScoringRules.fairnessScore(p, stats);

            // 1. ABSOLUTE KILLER PENALTY for Same Department (Tổ chuyên môn)
            if (assignedInRoom.length > 0 && !HardRules.differentDepartment(p, assignedInRoom[0])) {
                score -= 50000; // Đảm bảo điểm số trở thành số âm cực lớn
            }

            // 2. KILLER PENALTY for Repeat Pairing (Cặp đôi lặp lại)
            if (assignedInRoom.some(other => stats[p.id]?.partners?.has(other.id))) {
                score -= 50000;
            }

            // 3. Penalty for Room Rotation (Phòng cũ)
            if (stats[p.id]?.roomsVisited?.has(room.id)) {
                score -= 1000; 
            }

            if (constraints.noBackToBack !== false) {
                score += ScoringRules.backToBackPenalty(p, session, lastSlotSessionIds);
            }
            if (constraints.genderDiversity !== false) {
                score += ScoringRules.genderDiversityScore(p, assignedInRoom);
            }

            // 4. Random Jitter (Breaks ties and pairing loops)
            score += Math.random() * 200;

            return score;
        }
    };
})();

window.ProctorRules = ProctorRules;
