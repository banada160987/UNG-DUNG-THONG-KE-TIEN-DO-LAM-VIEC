const APP_VERSION = '2026.Final.Pro';

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) {
        sidebar.classList.toggle('active');
        if (overlay) {
            const isActive = sidebar.classList.contains('active');
            overlay.style.display = isActive ? 'block' : 'none';
            setTimeout(() => overlay.style.opacity = isActive ? '1' : '0', 10);
        }
    }
}
window.toggleSidebar = toggleSidebar;

function isSubjectMarked(student, subKey, mapping) {
    if (!student || !subKey || !mapping) return false;
    if (student._resolvedSubjects && student._resolvedSubjects[subKey] !== undefined) {
        return student._resolvedSubjects[subKey];
    }
    let col = mapping[subKey];
    const langMap = { 'anh': 'N1', 'nga': 'N2', 'phap': 'N3', 'trung': 'N4', 'duc': 'N5', 'nhat': 'N6', 'han': 'N7' };
    if (!col && Object.keys(langMap).includes(subKey)) {
        col = mapping['anh'];
    }
    if (!col) return false;
    const val = (student[col] || "").toString().trim().toUpperCase();
    if (val === "" || val === "0" || val === "FALSE" || val === "NULL") return false;
    const looksLikeNCode = /^N[1-7]$/.test(val);
    if (looksLikeNCode) {
        return langMap[subKey] === val;
    }
    if (subKey === 'anh') {
        if (/^N[2-7]$/.test(val)) return false;
    }
    const isGenericMark = val === 'X' || val === '1' || val === 'V' || val === subKey.toUpperCase();
    if (isGenericMark) {
        if (Object.keys(langMap).includes(subKey)) {
            return subKey === 'anh';
        }
        return true;
    }
    if (Object.keys(langMap).includes(subKey)) return false;
    return (val.length <= 5 && !val.includes(' ') && !looksLikeNCode);
}

function splitVietnameseName(fullName) {
    let name = (fullName || "").trim();
    if (!name) return { ho: "", lot: "", ten: "", fullTen: "" };
    const ethnicPrefixes = ["H'", "H`", "H-", "H ", "Y-", "Y'", "Y`", "Y ", "A ", "M'", "K'", "M-", "K-", "Y."];
    let foundPrefix = ethnicPrefixes.filter(p => name.toUpperCase().startsWith(p.toUpperCase())).sort((a, b) => b.length - a.length)[0];
    if (foundPrefix) {
        let rest = name.substring(foundPrefix.length).trim();
        let clanPart = ""; let givenPart = "";
        if (rest.includes("-")) {
            const lastHyphenIndex = rest.lastIndexOf("-");
            givenPart = rest.substring(0, lastHyphenIndex).trim();
            clanPart = rest.substring(lastHyphenIndex + 1).trim();
        } else {
            let parts = rest.split(/\s+/);
            if (parts.length > 1) {
                clanPart = parts.pop();
                givenPart = parts.join(" ");
            } else { givenPart = rest; }
        }
        return { ho: clanPart.trim(), lot: foundPrefix.trim(), ten: givenPart.trim(), fullTen: givenPart.trim() };
    }
    const p = name.split(/\s+/);
    if (p.length === 1) return { ho: "", lot: "", ten: p[0], fullTen: p[0] };
    const ten = p.pop();
    const ho = p.shift();
    const lot = p.join(" ");
    return { ho: ho, lot: lot, ten: ten, fullTen: ten };
}

function checkForUpdate(manual = false) {
    const lastVersion = localStorage.getItem('vtool_app_version');
    if (manual || lastVersion !== APP_VERSION) {
        localStorage.setItem('vtool_app_version', APP_VERSION);
        if (manual) { document.body.style.opacity = '0.5'; }
        setTimeout(() => { window.location.reload(); }, manual ? 500 : 0);
    }
}

function toggleHeaderInputs() {
    const isAuto = document.getElementById('auto-header-priority').checked;
    const groups = document.querySelectorAll('.header-input-group');
    groups.forEach(el => {
        el.style.opacity = isAuto ? '0.5' : '1';
        el.style.pointerEvents = isAuto ? 'none' : 'auto';
    });
}

function showAlert(msg, type = 'info') {
    const overlay = document.getElementById('custom-alert-overlay');
    const iconBox = document.getElementById('alert-icon-container');
    const msgEl = document.getElementById('alert-message');
    const titleEl = document.getElementById('alert-title');
    if (!overlay) return;
    msgEl.innerHTML = msg;
    overlay.style.display = 'flex';
    let color = "var(--primary)", icon = "info";
    if (type === 'success') { color = "var(--success)"; icon = "check-circle"; titleEl.innerText = "Thành công"; }
    else if (type === 'error' || type === 'danger') { color = "var(--danger)"; icon = "x-circle"; titleEl.innerText = "Lỗi hệ thống"; }
    else if (type === 'warning') { color = "var(--warning)"; icon = "alert-triangle"; titleEl.innerText = "Cảnh báo"; }
    else { titleEl.innerText = "Thông báo"; }
    iconBox.style.background = color + "22";
    iconBox.style.color = color;
    iconBox.innerHTML = `<i data-lucide="${icon}" style="width:32px; height:32px"></i>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.alert = function (msg) { showAlert(msg); };
function closeAlert() { document.getElementById('custom-alert-overlay').style.display = 'none'; }
