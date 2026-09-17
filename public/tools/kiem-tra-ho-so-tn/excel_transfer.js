
// IndexedDB Wrapper for caching Excel files
const ETDatabase = {
    dbName: 'ExcelTransferToolDB',
    storeName: 'files',
    db: null,

    init: function() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                console.warn("Trình duyệt không hỗ trợ IndexedDB.");
                return resolve(false);
            }
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id' });
                }
            };
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(true);
            };
            request.onerror = (event) => {
                console.error("IndexedDB error:", event.target.error);
                resolve(false);
            };
        });
    },

    saveFile: function(id, arrayBuffer, fileName) {
        return new Promise((resolve, reject) => {
            if (!this.db) return resolve(false);
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put({ id: id, data: arrayBuffer, name: fileName });
            request.onsuccess = () => resolve(true);
            request.onerror = () => resolve(false);
        });
    },

    getFile: function(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) return resolve(null);
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => resolve(null);
        });
    },

    clear: function() {
        return new Promise((resolve, reject) => {
            if (!this.db) return resolve(false);
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();
            request.onsuccess = () => resolve(true);
            request.onerror = () => resolve(false);
        });
    }
};

/**
 * Excel Transfer Module
 * Reads two Excel files using ExcelJS, matches records by an ID column, 
 * and copies specified mapped columns from Source to Target while preserving Target's formatting.
 */

const ExcelTransfer = {
    // Font Decoders
    decodeTCVN3: function(str) {
        const tcvn3 = "µ¸¶·¹¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ";
        const unicode = "àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬĐÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ";
        let map = {};
        for (let i = 0; i < tcvn3.length; i++) {
            map[tcvn3[i]] = unicode[i] || tcvn3[i];
        }
        return str.split('').map(c => map[c] || c).join('');
    },
    
    decodeVNI: function(str) {
        const vniMaps = {
            "aù": "á", "aø": "à", "aû": "ả", "aõ": "ã", "aï": "ạ",
            "aâ": "â", "aá": "ấ", "aà": "ầ", "aå": "ẩ", "aã": "ẫ", "aä": "ậ",
            "aê": "ă", "aé": "ắ", "aè": "ằ", "aú": "ẳ", "aø": "ẵ", "aë": "ặ", // Note: VNI encoding mapping is very complex, this is simplified. We use string replace.
            "eù": "é", "eø": "è", "eû": "ẻ", "eõ": "ẽ", "eï": "ẹ",
            "eâ": "ê", "eá": "ế", "eà": "ề", "eå": "ể", "eã": "ễ", "eä": "ệ",
            "iù": "í", "iø": "ì", "iû": "ỉ", "iõ": "ĩ", "iï": "ị",
            "où": "ó", "oø": "ò", "oû": "ỏ", "oõ": "õ", "oï": "ọ",
            "oâ": "ô", "oá": "ố", "oà": "ồ", "oå": "ổ", "oã": "ỗ", "oä": "ộ",
            "oê": "ơ", "oé": "ớ", "oè": "ờ", "oú": "ở", "oø": "ỡ", "oë": "ợ",
            "uù": "ú", "uø": "ù", "uû": "ủ", "uõ": "ũ", "uï": "ụ",
            "uê": "ư", "ué": "ứ", "uè": "ừ", "uú": "ử", "uø": "ữ", "uë": "ự",
            "yù": "ý", "yø": "ỳ", "yû": "ỷ", "yõ": "ỹ", "yï": "ỵ",
            "d9": "đ", "D9": "Đ"
        };
        let res = str;
        for (let key in vniMaps) {
            res = res.replaceAll(key, vniMaps[key]);
        }
        return res;
    },
    sourceHeaders: [],
    targetHeaders: [],
    sourceWb: null,
    targetWb: null,
    transformRules: [],
    emptyFallback: 'skip',
    emptyCustomValue: '',
    conflictsMap: {},
    valEnableRange: false,
    valMin: '',
    valMax: '',
    valEnableNotEmpty: false,
    pendingErrors: 0,

    downloadMergedSource: async function() {
        if (!this.sourceData || this.sourceData.length === 0 || !this.sourceHeaders) {
            alert("Chưa có dữ liệu gộp!");
            return;
        }
        
        try {
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('DuLieuGop');
            
            // Reconstruct headers array for row 1
            let headersList = [];
            this.sourceHeaders.forEach(h => {
                headersList[h.colNumber] = h.name;
            });
            for(let i=1; i<headersList.length; i++) {
                if(!headersList[i]) headersList[i] = `Cột ${i}`;
            }
            headersList.shift();
            ws.addRow(headersList);
            
            // Add data rows
            this.sourceData.forEach(sourceRow => {
                let rowData = [];
                sourceRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    let val = cell.value;
                    if (val && typeof val === 'object') {
                        if (val.richText) val = val.richText.map(t => t.text).join('');
                        else if (val.result !== undefined) val = val.result;
                    }
                    rowData[colNumber] = val;
                });
                rowData.shift();
                ws.addRow(rowData);
            });
            
            ws.getRow(1).font = { bold: true };
            
            const buffer = await wb.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Du_Lieu_Nguon_Da_Gop_${new Date().getTime()}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
        } catch(e) {
            console.error(e);
            alert("Có lỗi khi tạo file gộp: " + e.message);
        }
    },

    init: function() {
        console.log("Excel Transfer Module Initialized");
        this.setupDragAndDrop();
        this.loadTransformRules();
    },

    
    setupDragAndDrop: function() {
        ['source', 'target'].forEach(type => {
            const dropZone = document.getElementById(`et-${type}-drop-zone`);
            if (!dropZone) return;
            
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.style.borderColor = 'var(--success)';
                dropZone.style.background = 'var(--bg-hover)';
            });
            dropZone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                dropZone.style.borderColor = 'var(--primary)';
                dropZone.style.background = 'var(--bg-secondary)';
            });
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.style.borderColor = 'var(--primary)';
                dropZone.style.background = 'var(--bg-secondary)';
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const fileInput = document.getElementById(`et-${type}-file`);
                    fileInput.files = e.dataTransfer.files;
                    this.handleFileSelect({ target: fileInput }, type);
                }
            });
        });
    },

        handleFileSelect: async function(event, type, bypassEvent = false, cachedBuffer = null, cachedName = null) {
        let files = [];
        if (!bypassEvent && event && event.target && event.target.files) {
            files = Array.from(event.target.files);
        }
        
        if (bypassEvent && cachedBuffer) {
            files = [{ 
                name: cachedName, 
                arrayBuffer: async () => cachedBuffer 
            }];
        }
        
        if (files.length > 0) {
            const fileName = files[0].name;
            if (type === 'target' && fileName.toLowerCase().endsWith('.xls')) {
                alert('⚠️ CẢNH BÁO: Không thể dùng file .xls làm File Đích!\n\nĐể giữ nguyên định dạng, màu sắc và cấu trúc của biểu mẫu gốc, File Đích bắt buộc phải là định dạng Excel mới (.xlsx).\n\nGiải pháp:\nVui lòng mở file này bằng Microsoft Excel, nhấn F12 (Save As) và lưu lại dưới định dạng "Excel Workbook (*.xlsx)" rồi mới kéo vào đây.');
                if(event && event.target) event.target.value = '';
                return;
            }
            
            // LƯU CACHE VÀO INDEXEDDB nếu là upload thật
            if (!bypassEvent) {
                try {
                    const data = await files[0].arrayBuffer();
                    if (ETDatabase && ETDatabase.db) {
                        ETDatabase.saveFile(type, data, fileName);
                    }
                } catch(e) { console.error("Cache error", e); }
            }

            const filenameDiv = document.getElementById(`et-${type}-filename`);
            if (filenameDiv) {
                filenameDiv.innerText = fileName + (files.length > 1 ? ` (và ${files.length - 1} file khác)` : '');
                filenameDiv.style.display = 'block';
            }
            
            if (type === 'source') {
                this.cachedSourceFiles = files;
            } else {
                this.cachedTargetFiles = files;
            }
            
            this.loadSheets(type);
        }
    },

    openTransformModal: function() {
        const container = document.getElementById('et-transform-rules-container');
        container.innerHTML = '';
        if (this.transformRules.length === 0) {
            this.addTransformRule('', '');
        } else {
            this.transformRules.forEach(r => this.addTransformRule(r.from, r.to));
        }
        document.getElementById('et-transform-empty-fallback').value = this.emptyFallback;
        const customValInput = document.getElementById('et-transform-empty-custom-value');
        customValInput.value = this.emptyCustomValue;
        customValInput.style.display = this.emptyFallback === 'custom' ? 'block' : 'none';
        
        document.getElementById('et-val-enable-range').checked = this.valEnableRange;
        document.getElementById('et-val-min').value = this.valMin;
        document.getElementById('et-val-max').value = this.valMax;
        document.getElementById('et-val-enable-notempty').checked = this.valEnableNotEmpty;
        
        document.getElementById('et-transform-modal').style.display = 'flex';
    },

    addTransformRule: function(fromVal, toVal) {
        const container = document.getElementById('et-transform-rules-container');
        const ruleDiv = document.createElement('div');
        ruleDiv.style.display = 'flex';
        ruleDiv.style.gap = '10px';
        ruleDiv.innerHTML = `
            <input type="text" class="form-control tf-from" placeholder="Tìm (VD: đạt)" value="${fromVal}" style="flex: 1;">
            <i data-lucide="arrow-right" style="width:16px; margin-top:8px; color:var(--text-muted);"></i>
            <input type="text" class="form-control tf-to" placeholder="Thay bằng (VD: Đ)" value="${toVal}" style="flex: 1;">
            <button class="btn btn-outline btn-sm" style="color:var(--danger); border-color:var(--danger);" onclick="this.parentElement.remove()"><i data-lucide="trash-2" style="width:14px"></i></button>
        `;
        container.appendChild(ruleDiv);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    saveTransformRules: function() {
        const container = document.getElementById('et-transform-rules-container');
        const rows = container.querySelectorAll('div');
        this.transformRules = [];
        rows.forEach(row => {
            const from = row.querySelector('.tf-from').value.trim();
            const to = row.querySelector('.tf-to').value.trim();
            if (from) {
                this.transformRules.push({ from, to });
            }
        });
        
        this.emptyFallback = document.getElementById('et-transform-empty-fallback').value;
        this.emptyCustomValue = document.getElementById('et-transform-empty-custom-value').value;
        
        this.valEnableRange = document.getElementById('et-val-enable-range').checked;
        this.valMin = document.getElementById('et-val-min').value;
        this.valMax = document.getElementById('et-val-max').value;
        this.valEnableNotEmpty = document.getElementById('et-val-enable-notempty').checked;
        
        localStorage.setItem('etTransformRules', JSON.stringify({
            rules: this.transformRules,
            fallback: this.emptyFallback,
            customVal: this.emptyCustomValue,
            valEnableRange: this.valEnableRange,
            valMin: this.valMin,
            valMax: this.valMax,
            valEnableNotEmpty: this.valEnableNotEmpty
        }));
        
        document.getElementById('et-transform-modal').style.display = 'none';
        alert('✅ Đã lưu cấu hình biến đổi dữ liệu!');
    },

    loadTransformRules: function() {
        try {
            const saved = JSON.parse(localStorage.getItem('etTransformRules'));
            if (saved) {
                this.transformRules = saved.rules || [];
                this.emptyFallback = saved.fallback || 'skip';
                this.emptyCustomValue = saved.customVal || '';
                this.valEnableRange = saved.valEnableRange || false;
                this.valMin = saved.valMin || '';
                this.valMax = saved.valMax || '';
                this.valEnableNotEmpty = saved.valEnableNotEmpty || false;
            }
        } catch(e) {}
    },

    applyTransformation: function(val, oldVal) {
        if (val === null || val === undefined || val === '') {
            if (this.emptyFallback === 'skip') return oldVal;
            if (this.emptyFallback === 'blank') return '';
            if (this.emptyFallback === 'custom') return this.emptyCustomValue;
            return oldVal;
        }
        
        let strVal = val.toString();
        let lowerVal = strVal.trim().toLowerCase();
        
        if (this.transformRules.length > 0) {
            for (let rule of this.transformRules) {
                if (lowerVal === rule.from.toLowerCase()) {
                    strVal = rule.to;
                    break;
                }
            }
        } else {
            // Legacy hardcoded behavior
            if (lowerVal === 'đạt') strVal = 'Đ';
            else if (lowerVal === 'chưa đạt') strVal = 'CĐ';
            else if (lowerVal === 'tốt') strVal = 'T';
            else if (lowerVal === 'khá') strVal = 'K';
        }
        return strVal;
    },


    validateData: function(val) {
        if (val === null || val === undefined || val === '') {
            if (this.valEnableNotEmpty) return "Lỗi: Không được để trống";
            return null;
        }
        if (this.valEnableRange) {
            let num = parseFloat(val);
            let min = parseFloat(this.valMin);
            let max = parseFloat(this.valMax);
            if (isNaN(num)) return "Lỗi: Phải là một số";
            if (!isNaN(min) && num < min) return `Lỗi: Giá trị nhỏ hơn ${min}`;
            if (!isNaN(max) && num > max) return `Lỗi: Giá trị lớn hơn ${max}`;
        }
        return null;
    },

    updateDownloadBtnState: function() {
        const dlBtn = document.querySelector('button[onclick="ExcelTransfer.downloadFinal()"]');
        if (!dlBtn) return;
        if (this.pendingErrors > 0) {
            dlBtn.disabled = true;
            dlBtn.style.backgroundColor = '#94a3b8';
            dlBtn.style.cursor = 'not-allowed';
            dlBtn.innerHTML = `<i data-lucide="lock" style="width: 18px; margin-right: 5px;"></i> CÒN ${this.pendingErrors} LỖI - SỬA ĐỂ TẢI`;
        } else {
            dlBtn.disabled = false;
            dlBtn.style.backgroundColor = '#22c55e';
            dlBtn.style.cursor = 'pointer';
            dlBtn.innerHTML = `<i data-lucide="download" style="width: 18px; margin-right: 5px;"></i> TẢI XUỐNG FILE CHÍNH THỨC`;
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },
    updateCellValue: function(targetRowNum, colTargetIndex, newValueStr) {
        if (!this.targetWb) return;
        const targetSheetName = document.getElementById('et-target-sheet').value;
        const targetWs = this.targetWb.getWorksheet(targetSheetName);
        if (!targetWs) return;
        const row = targetWs.getRow(targetRowNum);
        row.getCell(colTargetIndex).value = newValueStr;
        
        const inputEl = document.getElementById(`et-inline-${targetRowNum}-${colTargetIndex}`);
        if (inputEl) {
            const errorMsg = this.validateData(newValueStr);
            const hadError = inputEl.getAttribute('data-error') === 'true';
            
            if (errorMsg) {
                inputEl.style.border = '1px solid #ef4444';
                inputEl.style.background = '#fef2f2';
                inputEl.style.color = '#b91c1c';
                inputEl.title = errorMsg;
                if (!hadError) {
                    this.pendingErrors++;
                    inputEl.setAttribute('data-error', 'true');
                }
            } else {
                inputEl.style.border = '1px solid transparent';
                inputEl.style.background = 'transparent';
                inputEl.style.color = '#15803d';
                inputEl.title = '';
                if (hadError) {
                    this.pendingErrors--;
                    inputEl.setAttribute('data-error', 'false');
                }
            }
            this.updateDownloadBtnState();
        }
    },
    
    resolveConflict: function(targetRowNum, sourceRowNum) {
        // Called when user selects a different source row in conflict dropdown
        if (!this.targetWb || !this.sourceWb) return;
        const sourceSheetName = document.getElementById('et-source-sheet').value;
        const sourceWs = this.sourceWb.getWorksheet(sourceSheetName);
        const targetSheetName = document.getElementById('et-target-sheet').value;
        const targetWs = this.targetWb.getWorksheet(targetSheetName);
        
        const sRow = sourceWs.getRow(sourceRowNum);
        const tRow = targetWs.getRow(targetRowNum);
        
        const mappingRows = document.querySelectorAll('.et-mapping-row');
        mappingRows.forEach(row => {
            const sCol = parseInt(row.querySelector('.et-mapping-source').value);
            const tCol = parseInt(row.querySelector('.et-mapping-target').value);
            if (sCol && tCol) {
                let oldVal = tRow.getCell(tCol).value;
                if (oldVal && typeof oldVal === 'object' && oldVal.result !== undefined) oldVal = oldVal.result;
                let val = sRow.getCell(sCol).value;
                if (val && typeof val === 'object') {
                    if (val.result !== undefined) val = val.result;
                    else if (val.richText) val = val.richText.map(rt => rt.text).join('');
                }
                
                let transformedVal = this.applyTransformation(val, oldVal);
                
                const copyStyle = document.getElementById('et-copy-style') ? document.getElementById('et-copy-style').checked : false;
                if (copyStyle && sRow.getCell(sCol).style) {
                    try {
                        const sStyle = sRow.getCell(sCol).style;
                        const tCell = tRow.getCell(tCol);
                        if (sStyle.fill && sStyle.fill.type === 'pattern') {
                            tCell.fill = JSON.parse(JSON.stringify(sStyle.fill));
                        }
                        if (sStyle.font) {
                            let newFont = tCell.font ? JSON.parse(JSON.stringify(tCell.font)) : {};
                            if (sStyle.font.color) newFont.color = JSON.parse(JSON.stringify(sStyle.font.color));
                            if (sStyle.font.bold) newFont.bold = sStyle.font.bold;
                            if (sStyle.font.italic) newFont.italic = sStyle.font.italic;
                            if (Object.keys(newFont).length > 0) tCell.font = newFont;
                        }
                    } catch(e) {}
                }
                tRow.getCell(tCol).value = transformedVal;
                
                // Update UI visually
                const inputEl = document.getElementById(`et-inline-${targetRowNum}-${tCol}`);
                if (inputEl) {
                    inputEl.value = transformedVal !== null && transformedVal !== undefined ? transformedVal : '';
                    this.updateCellValue(targetRowNum, tCol, transformedVal); // To trigger validation check
                }
                
                const srcEl = document.getElementById(`et-src-val-${targetRowNum}-${sCol}`);
                if (srcEl) {
                    srcEl.innerText = val !== null && val !== undefined ? val.toString() : '';
                }
            }
        });
        alert('✅ Đã cập nhật dữ liệu từ dòng mới chọn!');
    },

    // 
    normalizeString: function(str) {
        if (!str) return "";
        let n = str.toLowerCase();
        n = n.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
        n = n.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
        n = n.replace(/ì|í|ị|ỉ|ĩ/g, "i");
        n = n.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
        n = n.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
        n = n.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
        n = n.replace(/đ/g, "d");
        return n.replace(/[^a-z0-9]/g, "");
    },

    colIndexToLetter: function(index) {
        let temp, letter = '';
        while (index > 0) {
            temp = (index - 1) % 26;
            letter = String.fromCharCode(temp + 65) + letter;
            index = (index - temp - 1) / 26;
        }
        return letter;
    },

    removeVietnameseAccents: function(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
    },
    
    levenshteinDistance: function(s, t) {
        if (!s.length) return t.length;
        if (!t.length) return s.length;
        const arr = [];
        for (let i = 0; i <= t.length; i++) { arr[i] = [i]; }
        for (let j = 0; j <= s.length; j++) { arr[0][j] = j; }
        for (let i = 1; i <= t.length; i++) {
            for (let j = 1; j <= s.length; j++) {
                arr[i][j] = Math.min(
                    arr[i - 1][j] + 1,
                    arr[i][j - 1] + 1,
                    arr[i - 1][j - 1] + (t[i - 1] === s[j - 1] ? 0 : 1)
                );
            }
        }
        return arr[t.length][s.length];
    },

    normalizeForComparison: function(val) {
        if (val === null || val === undefined) return '';
        // Use normalize('NFC') to handle Vietnamese Unicode decomposed vs precomposed characters
        let s = val.toString().normalize('NFC').toLowerCase().trim().replace(/\s+/g, ' ');
        
        // Normalize Date strings: dd/mm/yy or dd/mm/yyyy -> dd/mm/yyyy
        const dateMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2}|\d{4})$/);
        if (dateMatch) {
            let d = dateMatch[1].padStart(2, '0');
            let m = dateMatch[2].padStart(2, '0');
            let y = dateMatch[3];
            if (y.length === 2) {
                let yNum = parseInt(y, 10);
                y = (yNum > 50 ? 1900 + yNum : 2000 + yNum).toString();
            }
            return `${d}/${m}/${y}`;
        }
        
        // Strip leading zeros for numeric-only strings (like IDs "00123" -> "123")
        if (/^0+[1-9]\d*$/.test(s)) {
            return s.replace(/^0+/, '');
        }
        
        // Remove all spaces, punctuation, and special quotes (like curly apostrophes ’)
        // [^\p{L}\p{N}] removes everything that is NOT a Unicode letter or number
        s = s.replace(/[^\p{L}\p{N}]/gu, '');
        
        return s;
    },
    
    getCellValueString: function(cell) {
        if (!cell) return "";
        let val = cell.value;
        if (val && typeof val === 'object') {
            if (val.richText) val = val.richText.map(t => t.text).join('');
            else if (val.result !== undefined) val = val.result;
            else val = val.toString();
        } else if (val !== null && val !== undefined) {
            val = val.toString().trim();
        } else {
            val = "";
        }
        return val.trim().toLowerCase();
    },

    loadSheets: async function(type) {
        const fileInput = document.getElementById(`et-${type}-file`);
        const sheetContainer = document.getElementById(`et-${type}-sheet-container`);
        const sheetSelect = document.getElementById(`et-${type}-sheet`);
        const statusDiv = document.getElementById(`et-${type}-status`);

        let files = fileInput.files && fileInput.files.length > 0 ? Array.from(fileInput.files) : (type === 'source' ? this.cachedSourceFiles : this.cachedTargetFiles);
        if (!files || files.length === 0) {
            sheetContainer.style.display = 'none';
            return;
        }

        statusDiv.innerText = "Đang đọc danh sách Sheet...";
        statusDiv.style.color = "var(--text-muted)";
        sheetSelect.innerHTML = '<option value="">-- Đang tải... --</option>';
        sheetContainer.style.display = 'block';

        try {
            const file = files[0];
            let buffer = await file.arrayBuffer();
            
            if (file.name.toLowerCase().endsWith('.xls')) {
                if (typeof XLSX === 'undefined') {
                    throw new Error("Không tìm thấy thư viện SheetJS để đọc file .xls cũ.");
                }
                statusDiv.innerText = "Đang chuyển đổi định dạng...";
                const wbSheetJS = XLSX.read(buffer, { type: 'array' });
                buffer = XLSX.write(wbSheetJS, { bookType: 'xlsx', type: 'array' });
            }

            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);

            if (type === 'source') {
                this.sourceWb = workbook;
                this.sourceFiles = files; // Lưu lại danh sách files
            }
            else {
                this.targetWb = workbook;
            }

            sheetSelect.innerHTML = '';
            if (type === 'source') {
                sheetSelect.innerHTML = '<option value="ALL_SHEETS" style="font-weight:bold; color:#d97706;">-- TẤT CẢ CÁC SHEET (Gộp chung) --</option>';
            }
            workbook.worksheets.forEach(ws => {
                const opt = document.createElement('option');
                opt.value = ws.name;
                opt.innerText = ws.name;
                sheetSelect.appendChild(opt);
            });

            statusDiv.innerText = `File có ${workbook.worksheets.length} sheets. Vui lòng chọn Sheet và Đọc Tiêu Đề.`;
            statusDiv.style.color = "var(--primary)";
            
            // Auto trigger loadHeaders right after loading sheets
            let btn = document.getElementById('et-download-merged-btn');
            if(btn && type === 'source') btn.style.display = 'none';
            this.loadHeaders(type);
        } catch (error) {
            console.error(error);
            statusDiv.innerText = "Lỗi đọc file!";
            statusDiv.style.color = "red";
            sheetContainer.style.display = 'none';
        }
    },

    loadHeaders: async function(type) {
        const fileInput = document.getElementById(`et-${type}-file`);
        const sheetSelect = document.getElementById(`et-${type}-sheet`);
        const rowInput = document.getElementById(`et-${type}-header-row`);
        const statusDiv = document.getElementById(`et-${type}-status`);

        if (type === 'target') {
            if (!this.targetWb) return;
            const sheetName = sheetSelect.value;
            const worksheet = this.targetWb.getWorksheet(sheetName);
            if (!worksheet) return;
            
            const rowNum = parseInt(rowInput.value) || 1;
            const mergeHeaderCheckbox = document.getElementById(`et-target-header-merge`);
            const mergeHeader = mergeHeaderCheckbox ? mergeHeaderCheckbox.checked : false;
            
            this.targetData = worksheet;
            
            try {
                const headerRow = worksheet.getRow(rowNum);
                let headers = [];
                let mergeHeaderRow = mergeHeader ? worksheet.getRow(rowNum - 1) : null;

                headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    // Similar to existing target logic
                    const letter = worksheet.getColumn(colNumber).letter;
                    let pVal = cell.value;
                    if (pVal && typeof pVal === 'object') {
                        if (pVal.richText) pVal = pVal.richText.map(t => t.text).join('');
                        else if (pVal.result !== undefined) pVal = pVal.result;
                    }
                    let finalName = pVal ? pVal.toString().replace(/\r?\n/g, " ").trim() : "";

                    if (mergeHeader && mergeHeaderRow) {
                        let mergedCell = mergeHeaderRow.getCell(colNumber);
                        let mVal = mergedCell.value;
                        if (mVal && typeof mVal === 'object') {
                            if (mVal.richText) mVal = mVal.richText.map(t => t.text).join('');
                            else if (mVal.result !== undefined) mVal = mVal.result;
                        }
                        mVal = mVal ? mVal.toString().replace(/\r?\n/g, " ").trim() : "";
                        if (mVal && finalName && mVal !== finalName) finalName = mVal + " - " + finalName;
                        else if (mVal && !finalName) finalName = mVal;
                    }
                    if (!finalName) finalName = `Cột ${letter}`;
                    headers.push({ colNumber: colNumber, letter: letter, name: finalName });
                });
                
                while(headers.length > 0 && headers[headers.length - 1].name.startsWith('Cột ')) headers.pop();
                
                this.targetHeaders = headers;
                
                const selectHtml = '<option value="">-- Bỏ qua --</option>' + headers.map(h => `<option value="${h.colNumber}">[${h.letter}] ${h.name}</option>`).join('');
                for (let i = 1; i <= 3; i++) {
                    const selectId = document.getElementById(`et-target-id-${i}`);
                    if(selectId) {
                        selectId.innerHTML = selectHtml;
                        selectId.disabled = false;
                        if (i === 1) selectId.options[0].text = "-- Chọn Khóa chính --";
                    }
                }
                statusDiv.innerText = `Đã đọc ${headers.length} cột từ dòng ${rowNum}.`;
                statusDiv.style.color = "green";
                
                // Smart Detect
                const idRegex = /cccd|cmnd|sbd|báo danh|mã|id/i;
                for (let h of headers) {
                    if (idRegex.test(h.name)) {
                        document.getElementById(`et-target-id-1`).value = h.colNumber;
                        break;
                    }
                }
                this.updateMappingOptions();
            } catch (error) { console.error(error); }
            
        } else if (type === 'source') {
            if (!this.sourceFiles || this.sourceFiles.length === 0) return;
            statusDiv.innerText = `Đang gom dữ liệu từ các file nguồn...`;
            statusDiv.style.color = "blue";
            
            try {
                this.sourceData = [];
                this.sourceHeaders = null;
                let totalRows = 0;
                const rowNum = parseInt(rowInput.value) || 1;
                const sheetSelection = sheetSelect.value;
                const mergeHeaderCheckbox = document.getElementById(`et-source-header-merge`);
                const mergeHeader = mergeHeaderCheckbox ? mergeHeaderCheckbox.checked : false;

                for (let i = 0; i < this.sourceFiles.length; i++) {
                    const file = this.sourceFiles[i];
                    let arrayBuffer = await file.arrayBuffer();
                    
                    if (file.name.toLowerCase().endsWith('.xls')) {
                        if (typeof XLSX !== 'undefined') {
                            const wbSheetJS = XLSX.read(arrayBuffer, { type: 'array' });
                            arrayBuffer = XLSX.write(wbSheetJS, { bookType: 'xlsx', type: 'array' });
                        } else {
                            console.warn("Không tìm thấy thư viện SheetJS để đọc file .xls");
                        }
                    }

                    const workbook = new ExcelJS.Workbook();
                    await workbook.xlsx.load(arrayBuffer);
                    
                    let sheetsToProcess = [];
                    if (sheetSelection === 'ALL_SHEETS') {
                        workbook.eachSheet(function(worksheet, sheetId) {
                            sheetsToProcess.push(worksheet);
                        });
                    } else {
                        const ws = workbook.getWorksheet(sheetSelection);
                        if (ws) sheetsToProcess.push(ws);
                    }
                    
                    for (let ws of sheetsToProcess) {
                        // Extract headers from the very first sheet we process
                        if (!this.sourceHeaders) {
                            const headerRow = ws.getRow(rowNum);
                            let headers = [];
                            let mergeHeaderRow = mergeHeader ? ws.getRow(rowNum - 1) : null;
                            
                            headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                                const letter = ws.getColumn(colNumber).letter;
                                let pVal = cell.value;
                                if (pVal && typeof pVal === 'object') {
                                    if (pVal.richText) pVal = pVal.richText.map(t => t.text).join('');
                                    else if (pVal.result !== undefined) pVal = pVal.result;
                                }
                                let finalName = pVal ? pVal.toString().replace(/\r?\n/g, " ").trim() : "";
                                if (mergeHeader && mergeHeaderRow) {
                                    let mVal = mergeHeaderRow.getCell(colNumber).value;
                                    mVal = mVal ? mVal.toString().replace(/\r?\n/g, " ").trim() : "";
                                    if (mVal && finalName && mVal !== finalName) finalName = mVal + " - " + finalName;
                                    else if (mVal && !finalName) finalName = mVal;
                                }
                                if (!finalName) finalName = `Cột ${letter}`;
                                headers.push({ colNumber: colNumber, letter: letter, name: finalName });
                            });
                            while(headers.length > 0 && headers[headers.length - 1].name.startsWith('Cột ')) headers.pop();
                            this.sourceHeaders = headers;
                        }
                        
                        // Push data rows
                        ws.eachRow((row, rowNumber) => {
                            if (rowNumber > rowNum) {
                                let nonEmptyCount = 0;
                                let rowText = "";
                                row.eachCell((cell) => {
                                    if(cell.value !== null && cell.value !== undefined && cell.value !== '') {
                                        let val = cell.value;
                                        if (val && typeof val === 'object') {
                                            if (val.richText) val = val.richText.map(t => t.text).join('');
                                            else if (val.result !== undefined) val = val.result;
                                        }
                                        val = val.toString().trim();
                                        if (val !== '') {
                                            nonEmptyCount++;
                                            rowText += val.toLowerCase() + " | ";
                                        }
                                    }
                                });
                                
                                let isGarbage = false;
                                if (nonEmptyCount === 0) {
                                    isGarbage = true;
                                } else {
                                    const garbageRegex = /giáo viên chủ nhiệm|người lập|cán bộ coi thi|cán bộ chấm thi|ký, ghi rõ|ký và ghi rõ|danh sách này có|ngày\s*\.+\s*tháng|ngày\s*_{2,}\s*tháng|hiệu trưởng/i;
                                    if (garbageRegex.test(rowText)) {
                                        isGarbage = true;
                                    }
                                    if (nonEmptyCount <= 2 && /ngày.*tháng.*năm/i.test(rowText)) {
                                        isGarbage = true;
                                    }
                                }

                                if (!isGarbage) {
                                    this.sourceData.push(row);
                                    totalRows++;
                                }
                            }
                        });
                    }
                }
                
                const selectHtml = '<option value="">-- Bỏ qua --</option>' + this.sourceHeaders.map(h => `<option value="${h.colNumber}">[${h.letter}] ${h.name}</option>`).join('');
                for (let i = 1; i <= 3; i++) {
                    const selectId = document.getElementById(`et-source-id-${i}`);
                    if(selectId) {
                        selectId.innerHTML = selectHtml;
                        selectId.disabled = false;
                        if (i === 1) selectId.options[0].text = "-- Chọn Khóa chính --";
                    }
                }
                
                statusDiv.innerText = `Đã gộp ${totalRows} dòng dữ liệu từ ${this.sourceFiles.length} file.`;
                statusDiv.style.color = "green";
                
                let btn = document.getElementById('et-download-merged-btn');
                if (btn) {
                    if (this.sourceFiles.length > 1 || sheetSelection === 'ALL_SHEETS') {
                        btn.style.display = 'inline-flex';
                    } else {
                        btn.style.display = 'none';
                    }
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
                
                // Smart Detect
                const idRegex = /cccd|cmnd|sbd|báo danh|mã|id/i;
                for (let h of this.sourceHeaders) {
                    if (idRegex.test(h.name)) {
                        document.getElementById(`et-source-id-1`).value = h.colNumber;
                        break;
                    }
                }
                this.updateMappingOptions();
                
            } catch (error) { 
                console.error(error); 
                statusDiv.innerText = "Lỗi khi đọc file nguồn.";
                statusDiv.style.color = "red";
            }
        }
    },

    updateMappingOptions: function() {
        const selectsSource = document.querySelectorAll('.et-mapping-source');
        const selectsTarget = document.querySelectorAll('.et-mapping-target');

        selectsSource.forEach(select => {
            const val = select.value;
            select.innerHTML = '<option value="">-- Chọn Cột Nguồn --</option>' + 
                this.sourceHeaders.map(h => `<option value="${h.colNumber}">[${h.letter}] ${h.name}</option>`).join('');
            select.value = val;
        });

        selectsTarget.forEach(select => {
            const val = select.value;
            select.innerHTML = '<option value="">-- Chọn Cột Đích --</option>' + 
                this.targetHeaders.map(h => `<option value="${h.colNumber}">[${h.letter}] ${h.name}</option>`).join('');
            select.value = val;
        });

        // Cập nhật dropdown Đối chiếu chéo
        ['et-cc-source-1', 'et-cc-source-2', 'et-cc-logic-col', 'et-cc-logic-gender', 'et-cc-logic-dob'].forEach(id => {
            const sel = document.getElementById(id);
            if (sel) {
                const val = sel.value;
                sel.innerHTML = '<option value="">-- Bỏ qua --</option>' + 
                    this.sourceHeaders.map(h => `<option value="${h.colNumber}">[${h.letter}] ${h.name}</option>`).join('');
                sel.value = val;
                sel.disabled = false;
            }
        });

        ['et-cc-target-1', 'et-cc-target-2'].forEach(id => {
            const sel = document.getElementById(id);
            if (sel) {
                const val = sel.value;
                sel.innerHTML = '<option value="">-- Bỏ qua --</option>' + 
                    this.targetHeaders.map(h => `<option value="${h.colNumber}">[${h.letter}] ${h.name}</option>`).join('');
                sel.value = val;
                sel.disabled = false;
            }
        });
    },

    updateRowSTT: function() {
        const rows = document.querySelectorAll('.et-mapping-row');
        rows.forEach((row, index) => {
            const sttDiv = row.querySelector('.row-stt');
            if (sttDiv) sttDiv.innerText = `${index + 1}.`;
        });
    },

    // --- Tự động ánh xạ ---
    autoMapColumns: function() {
        if (!this.sourceHeaders || !this.targetHeaders) {
            alert('Vui lòng tải đủ file Nguồn và Đích trước.');
            return;
        }
        
        // Clear old mappings
        document.getElementById('et-mapping-container').innerHTML = '';
        
        const normalizeName = (name) => {
            let n = name.toLowerCase().replace(/[\s\_\-]/g, '');
            // Xử lý các từ đồng nghĩa
            if (n.includes('họvàtên') || n.includes('họtên') || n.includes('hoten')) return 'name';
            if (n.includes('cccd') || n.includes('cmnd') || n.includes('căn cước')) return 'idcard';
            if (n.includes('ngày sinh') || n.includes('ngaysinh')) return 'dob';
            if (n.includes('giới tính') || n.includes('gioitinh') || n.includes('nữ')) return 'gender';
            return n;
        };

        const targetMapList = this.targetHeaders.map(th => ({ ...th, norm: normalizeName(th.name) }));
        const sourceMapList = this.sourceHeaders.map(sh => ({ ...sh, norm: normalizeName(sh.name) }));

        let added = 0;
        targetMapList.forEach(th => {
            // Find best match in source
            const match = sourceMapList.find(sh => sh.norm === th.norm);
            if (match) {
                this.addMappingRow();
                const rows = document.querySelectorAll('.et-mapping-row');
                const lastRow = rows[rows.length - 1];
                lastRow.querySelector('.et-mapping-source').value = match.colNumber;
                lastRow.querySelector('.et-mapping-target').value = th.colNumber;
                added++;
            }
        });
        
        if (this.saveStateToLocal) this.saveStateToLocal();
        if (added > 0) alert(`✅ Auto-Map đã ghép thành công ${added} cặp cột!`);
        else alert('⚠️ Auto-Map không tìm thấy cột nào trùng tên để ghép tự động.');
    },

    // --- Lưu / Tải Cấu hình ---
    refreshProfileList: function() {
        const list = document.getElementById('et-profile-list');
        if(!list) return;
        const profiles = JSON.parse(localStorage.getItem('et_profiles') || '{}');
        list.innerHTML = '<option value="">-- Chọn Mẫu --</option>';
        Object.keys(profiles).forEach(k => {
            list.innerHTML += `<option value="${k}">${k}</option>`;
        });
    },
    
    saveProfile: function() {
        const name = document.getElementById('et-profile-name').value.trim();
        if(!name) { alert('Vui lòng nhập tên cấu hình!'); return; }
        
        const state = {
            s1: document.getElementById('et-source-id-1').value,
            s2: document.getElementById('et-source-id-2').value,
            s3: document.getElementById('et-source-id-3').value,
            s4: document.getElementById('et-source-id-4').value,
            t1: document.getElementById('et-target-id-1').value,
            t2: document.getElementById('et-target-id-2').value,
            t3: document.getElementById('et-target-id-3').value,
            t4: document.getElementById('et-target-id-4').value,
            mappings: [],
            cc_s1: document.getElementById('et-cc-source-1') ? document.getElementById('et-cc-source-1').value : '',
            cc_t1: document.getElementById('et-cc-target-1') ? document.getElementById('et-cc-target-1').value : '',
            cc_s2: document.getElementById('et-cc-source-2') ? document.getElementById('et-cc-source-2').value : '',
            cc_t2: document.getElementById('et-cc-target-2') ? document.getElementById('et-cc-target-2').value : '',
            
            cc_logic_enable: document.getElementById('et-cc-logic-enable') ? document.getElementById('et-cc-logic-enable').checked : false,
            cc_logic_col: document.getElementById('et-cc-logic-col') ? document.getElementById('et-cc-logic-col').value : '',
            cc_logic_gender: document.getElementById('et-cc-logic-gender') ? document.getElementById('et-cc-logic-gender').value : '',
            cc_logic_dob: document.getElementById('et-cc-logic-dob') ? document.getElementById('et-cc-logic-dob').value : '',
        };
        
        document.querySelectorAll('.et-mapping-row').forEach(row => {
            state.mappings.push({
                s: row.querySelector('.et-mapping-source').value,
                t: row.querySelector('.et-mapping-target').value,
                trans: row.querySelector('.et-mapping-transform') ? row.querySelector('.et-mapping-transform').value : ''
            });
        });
        
        const profiles = JSON.parse(localStorage.getItem('et_profiles') || '{}');
        profiles[name] = state;
        localStorage.setItem('et_profiles', JSON.stringify(profiles));
        
        this.refreshProfileList();
        document.getElementById('et-profile-list').value = name;
        alert(`✅ Đã lưu cấu hình "${name}" thành công!`);
    },
    
    loadProfile: function() {
        const name = document.getElementById('et-profile-list').value;
        if(!name) return;
        const profiles = JSON.parse(localStorage.getItem('et_profiles') || '{}');
        const state = profiles[name];
        if(!state) return;
        
        const setVal = (id, val) => { const el = document.getElementById(id); if(el && val) el.value = val; };
        setVal('et-source-id-1', state.s1); setVal('et-source-id-2', state.s2);
        setVal('et-source-id-3', state.s3); setVal('et-source-id-4', state.s4);
        setVal('et-target-id-1', state.t1); setVal('et-target-id-2', state.t2);
        setVal('et-target-id-3', state.t3); setVal('et-target-id-4', state.t4);
        setVal('et-cc-source-1', state.cc_s1); setVal('et-cc-target-1', state.cc_t1);
        setVal('et-cc-source-2', state.cc_s2); setVal('et-cc-target-2', state.cc_t2);
        
        if (document.getElementById('et-cc-logic-enable')) {
            document.getElementById('et-cc-logic-enable').checked = state.cc_logic_enable || false;
            document.getElementById('et-cc-logic-config').style.display = state.cc_logic_enable ? 'flex' : 'none';
        }
        setVal('et-cc-logic-col', state.cc_logic_col);
        setVal('et-cc-logic-gender', state.cc_logic_gender);
        setVal('et-cc-logic-dob', state.cc_logic_dob);
        
        document.getElementById('et-mapping-container').innerHTML = '';
        state.mappings.forEach(m => {
            this.addMappingRow();
            const rows = document.querySelectorAll('.et-mapping-row');
            const lastRow = rows[rows.length - 1];
            lastRow.querySelector('.et-mapping-source').value = m.s;
            lastRow.querySelector('.et-mapping-target').value = m.t;
            if (lastRow.querySelector('.et-mapping-transform')) lastRow.querySelector('.et-mapping-transform').value = m.trans || '';
        });
        alert(`✅ Đã tải cấu hình "${name}"!`);
    },

    addMappingRow: function() {
        const container = document.getElementById('et-mapping-container');
        
        const emptyMsg = container.querySelector('div[style*="italic"]');
        if (emptyMsg) emptyMsg.remove();

        const rowDiv = document.createElement('div');
        rowDiv.className = 'grid et-mapping-row';
        rowDiv.style.gridTemplateColumns = 'auto 1fr auto 1fr auto auto';
        rowDiv.style.gap = '10px';
        rowDiv.style.alignItems = 'center';
        rowDiv.style.background = 'var(--bg-secondary)';
        rowDiv.style.padding = '10px';
        rowDiv.style.borderRadius = '8px';
        rowDiv.style.border = '1px dashed var(--border)';

        const sourceSelectHTML = '<select class="form-control et-mapping-source"><option value="">-- Chọn Cột Nguồn --</option>' + 
            this.sourceHeaders.map(h => `<option value="${h.colNumber}">[${h.letter}] ${h.name}</option>`).join('') + '</select>';
        
        const targetSelectHTML = '<select class="form-control et-mapping-target"><option value="">-- Chọn Cột Đích --</option>' + 
            this.targetHeaders.map(h => `<option value="${h.colNumber}">[${h.letter}] ${h.name}</option>`).join('') + '</select>';

        rowDiv.innerHTML = `
            <div class="row-stt" style="font-weight: bold; width: 25px; text-align: right; color: var(--primary);"></div>
            ${sourceSelectHTML}
            <i data-lucide="arrow-right" style="color: var(--text-muted); width: 16px;"></i>
            ${targetSelectHTML}
            <select class="form-control et-mapping-transform" style="font-size: 11px; padding: 2px 4px; max-width: 150px;">
                <option value="">-- Biến đổi --</option>
                <option value="UPPER">IN HOA</option>
                <option value="TITLE">Viết Hoa Chữ Đầu</option>
                <option value="VALID_CCCD">Kiểm tra CCCD (12 số)</option>
                <option value="VALID_PHONE">Kiểm tra SĐT</option>
                <option value="VALID_GRADE">Kiểm tra Điểm (0-10)</option>
                <optgroup label="Cắt Tên">
                    <option value="EXTRACT_LASTNAME">Tách lấy HỌ VÀ ĐỆM</option>
                    <option value="EXTRACT_FIRSTNAME">Tách lấy TÊN</option>
                </optgroup>
                <optgroup label="Sửa Lỗi Font">
                    <option value="DECODE_TCVN3">Dịch TCVN3 (.VnTime) -> Unicode</option>
                    <option value="DECODE_VNI">Dịch VNI (VNI-Times) -> Unicode</option>
                </optgroup>
            </select>
            <button class="btn btn-outline btn-sm" style="color: var(--danger); border-color: var(--danger);" onclick="this.parentElement.remove(); ExcelTransfer.updateRowSTT();">
                <i data-lucide="trash-2" style="width: 14px;"></i>
            </button>
        `;
        
        container.appendChild(rowDiv);
        this.updateRowSTT();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    autoMapAI: function() {
        if (!this.sourceHeaders || !this.targetHeaders) {
            alert('Vui lòng Đọc Tiêu Đề cả 2 file Nguồn và Đích trước.');
            return;
        }
        
        const normalizeName = (name) => {
            let n = name.toLowerCase().replace(/[\s\_\-]/g, '');
            if (n.includes('họvàtên') || n.includes('họtên') || n.includes('hoten')) return 'name';
            if (n.includes('cccd') || n.includes('cmnd') || n.includes('căn cước')) return 'idcard';
            if (n.includes('ngày sinh') || n.includes('ngaysinh')) return 'dob';
            if (n.includes('giới tính') || n.includes('gioitinh') || n.includes('nữ') || n.includes('phái')) return 'gender';
            if (n.includes('dântộc') || n.includes('dantoc')) return 'ethnic';
            if (n.includes('nơisinh') || n.includes('noisinh')) return 'pob';
            return n;
        };

        const targetMapList = this.targetHeaders.map(th => ({ ...th, norm: normalizeName(th.name) }));
        const sourceMapList = this.sourceHeaders.map(sh => ({ ...sh, norm: normalizeName(sh.name) }));

        let added = 0;
        targetMapList.forEach(th => {
            // Find best match in source
            const match = sourceMapList.find(sh => sh.norm === th.norm);
            if (match) {
                // Check if already mapped
                let alreadyMapped = false;
                document.querySelectorAll('.et-mapping-row').forEach(row => {
                    const tVal = row.querySelector('.et-mapping-target').value;
                    if (parseInt(tVal) === th.colNumber) alreadyMapped = true;
                });
                if (!alreadyMapped) {
                    this.addMappingRow();
                    const rows = document.querySelectorAll('.et-mapping-row');
                    const lastRow = rows[rows.length - 1];
                    lastRow.querySelector('.et-mapping-source').value = match.colNumber;
                    lastRow.querySelector('.et-mapping-target').value = th.colNumber;
                    added++;
                }
            }
        });
        
        if (this.saveStateToLocal) this.saveStateToLocal();
        if (added > 0) alert(`✅ AI Auto-Map đã tự động bắt cặp ${added} cột tương đồng!`);
        else alert('⚠️ AI không tìm thấy thêm cột nào tương đồng để ghép tự động.');
    },

    autoGenerateMapping: function(type) {
        if (this.targetHeaders.length === 0) {
            alert('⚠️ Vui lòng Đọc Tiêu Đề của File Đích trước khi sử dụng tính năng tự động lọc!');
            return;
        }
        
        let added = 0;
        const container = document.getElementById('et-mapping-container');
        const emptyMsg = container.querySelector('div[style*="italic"]');
        if (emptyMsg) emptyMsg.remove();
        this.targetHeaders.forEach(h => {
            let raw = this.normalizeString(h.name);

            let match = false;
            
            if (type === 'hki') {
                if (raw.includes('hk1') || raw.includes('hki') || raw.includes('hocky1') || raw.includes('hockyi') || raw.includes('ky1') || raw.includes('kyi')) {
                    if (!raw.includes('hkii') && !raw.includes('hockyii') && !raw.includes('kyii')) {
                        match = true;
                    }
                }
            }
            if (type === 'hkii') {
                if (raw.includes('hk2') || raw.includes('hkii') || raw.includes('hocky2') || raw.includes('hockyii') || raw.includes('ky2') || raw.includes('kyii')) {
                    match = true;
                }
            }
            if (type === 'cn') {
                if (raw.includes('cn') || raw.includes('canam') || raw.includes('cuoinam') || raw.includes('chung')) {
                    match = true;
                }
            }

            if (match) {
                this.addMappingRow();
                const rows = container.querySelectorAll('.et-mapping-row');
                const lastRow = rows[rows.length - 1];
                lastRow.querySelector('.et-mapping-target').value = h.colNumber;
                
                // Smart Fuzzy Matching Cột Nguồn
                if (this.sourceHeaders && this.sourceHeaders.length > 0) {
                    let bestMatchCol = null;
                    let bestScore = 0;
                    this.sourceHeaders.forEach(sh => {
                        let sRaw = this.normalizeString(sh.name);
                        if (raw === sRaw && raw !== "") {
                            bestMatchCol = sh.colNumber;
                            bestScore = 100;
                        } else if (bestScore < 50 && raw.includes(sRaw) && sRaw.length >= 3) {
                            bestMatchCol = sh.colNumber;
                            bestScore = 50;
                        } else if (bestScore < 50 && sRaw.includes(raw) && raw.length >= 3) {
                            bestMatchCol = sh.colNumber;
                            bestScore = 50;
                        }
                    });
                    if (bestMatchCol) {
                        lastRow.querySelector('.et-mapping-source').value = bestMatchCol;
                    }
                }
                
                added++;
            }
        });

        if (this.saveStateToLocal) this.saveStateToLocal();
        if (added === 0) {
            alert(`❌ Tính năng Lọc Cột báo lỗi: Không tìm thấy cột nào ở File Đích có chứa chữ thuộc ${type.toUpperCase()} (HK1/HK2/CN).\nVui lòng kiểm tra lại dòng chứa tiêu đề!`);
        }
    },

        clearDBCache: async function() {
        if (confirm('Bạn có chắc chắn muốn xóa bộ nhớ đệm (Cache) của 2 file Excel này không?')) {
            await ETDatabase.clear();
            localStorage.removeItem('et-auto-save-state');
            location.reload();
        }
    },
    
    saveStateToLocal: function() {
        try {
            const state = {
                s1: document.getElementById('et-source-id-1') ? document.getElementById('et-source-id-1').value : '',
                s2: document.getElementById('et-source-id-2') ? document.getElementById('et-source-id-2').value : '',
                s3: document.getElementById('et-source-id-3') ? document.getElementById('et-source-id-3').value : '',
                t1: document.getElementById('et-target-id-1') ? document.getElementById('et-target-id-1').value : '',
                t2: document.getElementById('et-target-id-2') ? document.getElementById('et-target-id-2').value : '',
                t3: document.getElementById('et-target-id-3') ? document.getElementById('et-target-id-3').value : '',
                mappings: [],
                cc_s1: document.getElementById('et-cc-source-1') ? document.getElementById('et-cc-source-1').value : '',
                cc_t1: document.getElementById('et-cc-target-1') ? document.getElementById('et-cc-target-1').value : '',
                cc_s2: document.getElementById('et-cc-source-2') ? document.getElementById('et-cc-source-2').value : '',
                cc_t2: document.getElementById('et-cc-target-2') ? document.getElementById('et-cc-target-2').value : '',
            };
            document.querySelectorAll('.et-mapping-row').forEach(row => {
                state.mappings.push({
                    s: row.querySelector('.et-mapping-source').value,
                    t: row.querySelector('.et-mapping-target').value,
                    trans: row.querySelector('.et-mapping-transform') ? row.querySelector('.et-mapping-transform').value : ''
                });
            });
            localStorage.setItem('et-auto-save-state', JSON.stringify(state));
        } catch(e) {}
    },
    
    autoRestoreFromCache: async function() {
        await ETDatabase.init();
        const sourceCache = await ETDatabase.getFile('source');
        const targetCache = await ETDatabase.getFile('target');
        
        let loaded = 0;
        if (sourceCache) {
            await this.handleFileSelect(null, 'source', true, sourceCache.data, sourceCache.name);
            loaded++;
        }
        if (targetCache) {
            await this.handleFileSelect(null, 'target', true, targetCache.data, targetCache.name);
            loaded++;
        }
        
        if (loaded > 0) {
            // Restore state
            setTimeout(() => {
                try {
                    const stateStr = localStorage.getItem('et-auto-save-state');
                    if (stateStr) {
                        const state = JSON.parse(stateStr);
                        const setVal = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
                        setVal('et-source-id-1', state.s1); setVal('et-source-id-2', state.s2); setVal('et-source-id-3', state.s3);
                        setVal('et-target-id-1', state.t1); setVal('et-target-id-2', state.t2); setVal('et-target-id-3', state.t3);
                        setVal('et-cc-source-1', state.cc_s1); setVal('et-cc-target-1', state.cc_t1);
                        setVal('et-cc-source-2', state.cc_s2); setVal('et-cc-target-2', state.cc_t2);
                        
                        document.getElementById('et-mapping-container').innerHTML = '';
                        if (state.mappings && state.mappings.length > 0) {
                            state.mappings.forEach(m => {
                                this.addMappingRow();
                                const rows = document.querySelectorAll('.et-mapping-row');
                                const lastRow = rows[rows.length - 1];
                                lastRow.querySelector('.et-mapping-source').value = m.s;
                                lastRow.querySelector('.et-mapping-target').value = m.t;
                                if (lastRow.querySelector('.et-mapping-transform')) lastRow.querySelector('.et-mapping-transform').value = m.trans || '';
                            });
                        }
                    }
                } catch(e) { console.error(e); }
                if(window.lucide) window.lucide.createIcons();
            }, 1000); // give time for headers to render
        }
    },

    clearMapping: function() {
        if(confirm("Bạn có chắc chắn muốn xóa toàn bộ các dòng ánh xạ hiện tại?")) {
            const container = document.getElementById('et-mapping-container');
            container.innerHTML = '<div style="font-size: 13px; color: var(--text-muted); text-align: center; font-style: italic;">Vui lòng Đọc Tiêu Đề cả 2 file trước khi thêm ánh xạ.</div>';
        }
    },
    loadMapProfiles: function() {
        const select = document.getElementById('et-map-profile-select');
        if (!select) return;
        
        // Upgrade legacy config if exists
        const legacyData = localStorage.getItem('excelTransferMapConfig');
        let profiles = JSON.parse(localStorage.getItem('excelTransferMapProfiles') || '{}');
        
        if (legacyData && Object.keys(profiles).length === 0) {
            profiles['Mặc định'] = JSON.parse(legacyData);
            localStorage.setItem('excelTransferMapProfiles', JSON.stringify(profiles));
            localStorage.removeItem('excelTransferMapConfig');
        }

        select.innerHTML = '';
        const names = Object.keys(profiles);
        if (names.length === 0) {
            select.innerHTML = '<option value="">-- Chưa có Map --</option>';
            select.disabled = true;
        } else {
            names.forEach(name => {
                const opt = document.createElement('option');
                opt.value = name;
                opt.innerText = name;
                select.appendChild(opt);
            });
            select.disabled = false;
        }
    },

    saveMap: function() {
        const sourceIdCols = [
            document.getElementById('et-source-id-1').value,
            document.getElementById('et-source-id-2').value,
            document.getElementById('et-source-id-3').value
        ];
        const targetIdCols = [
            document.getElementById('et-target-id-1').value,
            document.getElementById('et-target-id-2').value,
            document.getElementById('et-target-id-3').value
        ];
        const mappingRows = document.querySelectorAll('.et-mapping-row');
        const mappings = [];
        mappingRows.forEach(row => {
            const sCol = row.querySelector('.et-mapping-source').value;
            const tCol = row.querySelector('.et-mapping-target').value;
            mappings.push({ source: sCol, target: tCol });
        });

        const config = {
            sourceIdCols,
            targetIdCols,
                mappings,
            sourceHeaderRow: document.getElementById('et-source-header-row').value,
            targetHeaderRow: document.getElementById('et-target-header-row').value
        };

        const name = prompt("Nhập tên để lưu cấu hình này (Ví dụ: HK1, HK2, CaNam):", "HK1");
        if (!name || name.trim() === "") return;

        let profiles = JSON.parse(localStorage.getItem('excelTransferMapProfiles') || '{}');
        profiles[name.trim()] = config;
        localStorage.setItem('excelTransferMapProfiles', JSON.stringify(profiles));
        
        this.loadMapProfiles();
        const select = document.getElementById('et-map-profile-select');
        if (select) select.value = name.trim();
        
        alert(`💾 Đã lưu cấu hình Map thành công với tên: ${name.trim()}`);
    },

    loadMap: function() {
        if (this.sourceHeaders.length === 0 || this.targetHeaders.length === 0) {
            alert('⚠️ Vui lòng tải file và Bấm "Đọc Tiêu Đề" cho cả 2 file trước khi Tải cấu hình Map!');
            return;
        }

        const select = document.getElementById('et-map-profile-select');
        if (!select || !select.value) {
            alert('⚠️ Không có cấu hình Map nào được chọn.');
            return;
        }

        const profileName = select.value;
        const profiles = JSON.parse(localStorage.getItem('excelTransferMapProfiles') || '{}');
        const config = profiles[profileName];

        if (!config) {
            alert(`⚠️ Không tìm thấy cấu hình Map mang tên: ${profileName}`);
            return;
        }

        try {
            document.getElementById('et-source-header-row').value = config.sourceHeaderRow || 1;
            document.getElementById('et-target-header-row').value = config.targetHeaderRow || 1;

            if (config.sourceIdCols && config.sourceIdCols.length === 3) {
                document.getElementById('et-source-id-1').value = config.sourceIdCols[0];
                document.getElementById('et-source-id-2').value = config.sourceIdCols[1];
                document.getElementById('et-source-id-3').value = config.sourceIdCols[2];
            }
            if (config.targetIdCols && config.targetIdCols.length === 3) {
                document.getElementById('et-target-id-1').value = config.targetIdCols[0];
                document.getElementById('et-target-id-2').value = config.targetIdCols[1];
                document.getElementById('et-target-id-3').value = config.targetIdCols[2];
            }

            const container = document.getElementById('et-mapping-container');
            container.innerHTML = '';

            if (config.mappings && config.mappings.length > 0) {
                config.mappings.forEach(m => {
                    this.addMappingRow();
                    const rows = container.querySelectorAll('.et-mapping-row');
                    const lastRow = rows[rows.length - 1];
                    lastRow.querySelector('.et-mapping-source').value = m.source;
                    lastRow.querySelector('.et-mapping-target').value = m.target;
                });
            } else {
                container.innerHTML = '<div style="font-size: 13px; color: var(--text-muted); text-align: center; font-style: italic;">Vui lòng Đọc Tiêu Đề cả 2 file trước khi thêm ánh xạ.</div>';
            }
            if (this.saveStateToLocal) this.saveStateToLocal();
            alert(`✅ Đã tải cấu hình Map [${profileName}] thành công!`);
        } catch (e) {
            console.error(e);
            alert('❌ Lỗi khi tải cấu hình Map.');
        }
    },

    
    handleSplitFileSelect: async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const statusDiv = document.getElementById('et-split-file-status');
            statusDiv.style.display = 'block';
            statusDiv.innerText = 'Đang đọc file...';
            
            const data = await file.arrayBuffer();
            this.splitWb = new ExcelJS.Workbook();
            await this.splitWb.xlsx.load(data);
            
            const sheetSelect = document.getElementById('et-split-sheet');
            sheetSelect.innerHTML = '';
            this.splitWb.eachSheet((worksheet, sheetId) => {
                sheetSelect.innerHTML += `<option value="${worksheet.name}">${worksheet.name}</option>`;
            });
            
            statusDiv.innerText = `Đã đọc thành công file với ${this.splitWb.worksheets.length} sheet.`;
            this.loadSplitHeaders();
        } catch (error) {
            console.error(error);
            alert("Lỗi khi đọc file. File có thể bị hỏng hoặc có mật khẩu.");
        }
    },
    
    loadSplitHeaders: function() {
        if (!this.splitWb) return;
        const sheetName = document.getElementById('et-split-sheet').value;
        const headerRowIndex = parseInt(document.getElementById('et-split-header-row').value) || 6;
        
        const worksheet = this.splitWb.getWorksheet(sheetName);
        if (!worksheet) return;
        
        const headerRow = worksheet.getRow(headerRowIndex);
        const colSelect = document.getElementById('et-split-group-col');
        colSelect.innerHTML = '';
        
        let hasHeaders = false;
        headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            let colName = cell.value ? cell.value.toString().trim() : '';
            if (colName) {
                const letter = worksheet.getColumn(colNumber).letter;
                colSelect.innerHTML += `<option value="${colNumber}">[${letter}] ${colName}</option>`;
                hasHeaders = true;
            }
        });
        
        if (!hasHeaders) {
            colSelect.innerHTML = '<option value="">(Không tìm thấy tiêu đề ở dòng này)</option>';
        }
    },
    
    executeSplit: async function() {
        if (!this.splitWb) {
            alert('Vui lòng chọn file trước!');
            return;
        }
        
        const sheetName = document.getElementById('et-split-sheet').value;
        const headerRowIndex = parseInt(document.getElementById('et-split-header-row').value) || 6;
        const groupColIndex = parseInt(document.getElementById('et-split-group-col').value);
        
        if (!groupColIndex) {
            alert('Vui lòng chọn cột để nhóm!');
            return;
        }
        
        const btn = document.getElementById('et-split-execute-btn');
        btn.disabled = true;
        btn.innerHTML = '<i class="lucide lucide-loader animate-spin" style="width: 18px; margin-right: 5px;"></i> ĐANG XỬ LÝ...';
        
        try {
            const worksheet = this.splitWb.getWorksheet(sheetName);
            
            // 1. Determine groups
            const groups = {}; // { '12A1': [rowIdx, rowIdx] }
            let maxRow = worksheet.rowCount;
            
            for (let r = headerRowIndex + 1; r <= maxRow; r++) {
                const row = worksheet.getRow(r);
                let groupVal = row.getCell(groupColIndex).value;
                if (groupVal && typeof groupVal === 'object') {
                    if (groupVal.result !== undefined) groupVal = groupVal.result;
                    else if (groupVal.richText) groupVal = groupVal.richText.map(rt => rt.text).join('');
                }
                
                let groupKey = groupVal ? groupVal.toString().trim() : '';
                if (!groupKey) continue; // skip empty rows
                
                // Exclude common footer rows
                if (groupKey.toLowerCase().includes('tổng số') || groupKey.toLowerCase().includes('giáo viên')) continue;
                
                if (!groups[groupKey]) groups[groupKey] = [];
                groups[groupKey].push(r);
            }
            
            if (Object.keys(groups).length === 0) {
                alert('Không tìm thấy dữ liệu nhóm nào để tách!');
                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="file-archive" style="width: 18px; margin-right: 5px;"></i> TIẾN HÀNH TÁCH VÀ TẢI ZIP';
                if (typeof lucide !== 'undefined') lucide.createIcons();
                return;
            }
            
            // 2. We use JSZip to bundle the generated files
            const zip = new JSZip();
            const folder = zip.folder("File_Da_Tach");
            
            // 3. Generate a workbook for each group
            for (let groupName in groups) {
                // Clone the original workbook using arrayBuffer serialization
                const originalBuffer = await this.splitWb.xlsx.writeBuffer();
                const newWb = new ExcelJS.Workbook();
                await newWb.xlsx.load(originalBuffer);
                
                const newWs = newWb.getWorksheet(sheetName);
                
                // Keep only headers and the rows belonging to THIS group
                // It is easier to delete rows backwards from maxRow to headerRow+1
                let rowsToKeep = new Set(groups[groupName]);
                
                for (let r = maxRow; r > headerRowIndex; r--) {
                    if (!rowsToKeep.has(r)) {
                        newWs.spliceRows(r, 1);
                    }
                }
                
                // Write new workbook to buffer
                const groupBuffer = await newWb.xlsx.writeBuffer();
                
                // Add to Zip with safe filename
                let safeName = groupName.replace(/[\/\?<>\:\*\|":]/g, "_");
                folder.file(`${safeName}.xlsx`, groupBuffer);
            }
            
            // 4. Download the ZIP file
            const zipContent = await zip.generateAsync({type:"blob"});
            saveAs(zipContent, `TachFile_${sheetName}_${new Date().getTime()}.zip`);
            
            alert(`Tách thành công ${Object.keys(groups).length} file! Đã tải về file ZIP.`);
            document.getElementById('et-split-modal').style.display = 'none';
            
        } catch (error) {
            console.error("Error splitting files:", error);
            alert("Đã xảy ra lỗi khi tách file: " + error.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="file-archive" style="width: 18px; margin-right: 5px;"></i> TIẾN HÀNH TÁCH VÀ TẢI ZIP';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    },

    deleteMap: function() {
        const select = document.getElementById('et-map-profile-select');
        if (!select || !select.value) {
            alert('⚠️ Không có cấu hình Map nào được chọn.');
            return;
        }
        
        const profileName = select.value;
        if(confirm(`Bạn có chắc chắn muốn xóa cấu hình Map "${profileName}" vĩnh viễn không?`)) {
            let profiles = JSON.parse(localStorage.getItem('excelTransferMapProfiles') || '{}');
            delete profiles[profileName];
            localStorage.setItem('excelTransferMapProfiles', JSON.stringify(profiles));
            this.loadMapProfiles();
            alert(`🗑️ Đã xóa cấu hình Map "${profileName}".`);
        }
    },

    exportMapProfiles: function() {
        const profiles = localStorage.getItem('excelTransferMapProfiles');
        if (!profiles || Object.keys(JSON.parse(profiles)).length === 0) {
            alert('⚠️ Chưa có cấu hình Map nào để xuất!');
            return;
        }
        const blob = new Blob([profiles], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cauhinh_anhxa_excel_${new Date().getTime()}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
    },

    importMapProfiles: function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const newProfiles = JSON.parse(ev.target.result);
                    if (typeof newProfiles !== 'object' || newProfiles === null) throw new Error("File không đúng định dạng");
                    
                    let currentProfiles = JSON.parse(localStorage.getItem('excelTransferMapProfiles') || '{}');
                    
                    if (confirm("Bạn có muốn ghi đè nếu trùng tên cấu hình không? (OK: Ghi đè, Cancel: Bỏ qua các cấu hình trùng tên)")) {
                        currentProfiles = { ...currentProfiles, ...newProfiles };
                    } else {
                        currentProfiles = { ...newProfiles, ...currentProfiles }; // Giữ cái cũ nếu trùng
                    }
                    
                    localStorage.setItem('excelTransferMapProfiles', JSON.stringify(currentProfiles));
                    this.loadMapProfiles();
                    alert('✅ Đã nhập cấu hình thành công!');
                } catch (err) {
                    alert('❌ Lỗi khi đọc file cấu hình: File không hợp lệ.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },

    
    executeCrosscheck: async function() {
        if (!this.sourceData || !this.targetWb) {
            alert('Vui lòng tải lên cả 2 file Nguồn (File A) và Đích (File B).');
            return;
        }

        const sourceIdCols = [
            document.getElementById('et-source-id-1').value,
            document.getElementById('et-source-id-2').value,
            document.getElementById('et-source-id-3').value
        ].filter(v => v !== "").map(v => parseInt(v));

        const targetIdCols = [
            document.getElementById('et-target-id-1').value,
            document.getElementById('et-target-id-2').value,
            document.getElementById('et-target-id-3').value
        ].filter(v => v !== "").map(v => parseInt(v));

        if (sourceIdCols.length === 0 || targetIdCols.length === 0) {
            alert('Vui lòng chọn ít nhất Khóa chính 1 cho cả 2 file.');
            return;
        }
        
        if (sourceIdCols.length !== targetIdCols.length) {
            alert('Số lượng Khóa chính được chọn ở 2 file phải bằng nhau!');
            return;
        }

        const mappings = [];
        const container = document.getElementById('et-mapping-container');
        container.querySelectorAll('.et-mapping-row').forEach(row => {
            const sCol = row.querySelector('.et-mapping-source').value;
            const tCol = row.querySelector('.et-mapping-target').value;
            if (sCol && tCol) {
                mappings.push({ source: parseInt(sCol), target: parseInt(tCol) });
            }
        });

        if (mappings.length === 0) {
            alert('Vui lòng thêm ít nhất 1 dòng Ánh xạ cột (Cột Nguồn -> Cột Đích) để đối chiếu.');
            return;
        }

        const enableFuzzy = document.getElementById('et-enable-fuzzy') && document.getElementById('et-enable-fuzzy').checked;

        // Build target index using ExcelJS methods
        const targetIndex = {};
        const targetHeaderRow = parseInt(document.getElementById('et-target-header-row').value) || 1;
        
        this.targetData.eachRow((row, rowNumber) => {
            if (rowNumber <= targetHeaderRow) return;
            const keys = [];
            for (let col of targetIdCols) {
                let rawVal = ExcelTransfer.getCellValueString(row.getCell(parseInt(col)));
                keys.push(ExcelTransfer.normalizeForComparison(rawVal));
            }
            let keyStr = keys.join('||');
            if (keyStr !== "||" && keyStr !== "") {
                targetIndex[keyStr] = row;
            }
        });

        // Fuzzy setup
        let fuse = null;
        if (enableFuzzy) {
            const listForFuse = Object.keys(targetIndex).map(k => ({ key: k }));
            // We use standard fuzzing without window.Fuse if it is not available, or assume it's available.
            if (window.Fuse) {
                fuse = new window.Fuse(listForFuse, {
                    keys: ['key'],
                    includeScore: true,
                    threshold: 0.15
                });
            }
        }

        const reportData = [];
        let mismatchCount = 0;
        
        const normalize = (val) => {
            if (val === undefined || val === null) return "";
            val = val.toString().trim().toLowerCase();
            let numVal = val.replace(',', '.');
            if (!isNaN(parseFloat(numVal)) && isFinite(numVal)) {
                return parseFloat(numVal).toString(); 
            }
            return val;
        };

        this.sourceData.forEach(sRow => {
            const keys = [];
            for (let col of sourceIdCols) {
                let rawVal = ExcelTransfer.getCellValueString(sRow.getCell(parseInt(col)));
                keys.push(ExcelTransfer.normalizeForComparison(rawVal));
            }
            let keyStr = keys.join('||');
            
            if (keyStr === "||" || keyStr === "") return; // Skip empty keys
            
            let matchKey = keyStr;
            let tRow = targetIndex[matchKey];

            if (!tRow && enableFuzzy && fuse) {
                const results = fuse.search(keyStr);
                if (results.length > 0 && results[0].score < 0.15) {
                    matchKey = results[0].item.key;
                    tRow = targetIndex[matchKey];
                }
            }

            if (!tRow) {
                // Missing in Target
                const reportRow = {};
                sourceIdCols.forEach(c => {
                    const sName = (this.sourceHeaders.find(h => h.colNumber == c) || {}).name || `Cột ${c}`;
                    reportRow[sName] = ExcelTransfer.getCellValueString(sRow.getCell(c));
                });
                reportRow["Trạng thái"] = "⚠️ Không tìm thấy trong File Đích";
                reportData.push(reportRow);
                mismatchCount++;
                return;
            }

            // Both exist, let's compare
            let hasMismatch = false;
            const reportRow = {};
            sourceIdCols.forEach(c => {
                const sName = (this.sourceHeaders.find(h => h.colNumber == c) || {}).name || `Cột ${c}`;
                reportRow[sName] = ExcelTransfer.getCellValueString(sRow.getCell(c));
            });
            reportRow["Trạng thái"] = "❌ Bị Lệch";

            mappings.forEach(map => {
                const valA = ExcelTransfer.getCellValueString(sRow.getCell(map.source));
                const valB = ExcelTransfer.getCellValueString(tRow.getCell(map.target));
                
                const sName = (this.sourceHeaders.find(h => h.colNumber == map.source) || {}).name || `Cột ${map.source}`;
                const tName = (this.targetHeaders.find(h => h.colNumber == map.target) || {}).name || `Cột ${map.target}`;
                
                const normA = normalize(valA);
                const normB = normalize(valB);

                if (normA !== normB) {
                    hasMismatch = true;
                    reportRow[`[LỆCH] ${sName} ➔ ${tName}`] = `Nguồn: ${valA}  ➔  Đích: ${valB}`;
                } else {
                    reportRow[`${sName}`] = valA;
                }
            });

            if (hasMismatch) {
                reportData.push(reportRow);
                mismatchCount++;
            }
        });

        // Store report data for download
        this.crosscheckReportData = reportData;
        this.crosscheckMismatchCount = mismatchCount;

        // Render Preview
        const previewContainer = document.getElementById('et-preview-container');
        const previewWrapper = document.getElementById('et-preview-table-wrapper');
        const previewStatus = document.getElementById('et-preview-status');
        
        previewContainer.style.display = 'block';
        
        // Update download button behavior
        const btn = document.getElementById('et-preview-download-btn');
        if (btn) {
            btn.onclick = () => this.downloadCrosscheckReport();
            btn.innerHTML = `<i data-lucide="download" style="width: 18px; margin-right: 5px;"></i> TẢI XUỐNG BÁO CÁO (${mismatchCount} Lỗi)`;
            btn.className = "btn btn-danger";
            btn.style.backgroundColor = "#e11d48";
            btn.style.color = "white";
            btn.style.display = 'inline-flex';
        }

        if (mismatchCount === 0) {
            previewStatus.innerHTML = '<span style="color: #10b981;"><i data-lucide="check-circle" style="width:14px; margin-right:4px;"></i> Tuyệt vời! Không phát hiện sai lệch.</span>';
            previewWrapper.innerHTML = '<div style="padding: 20px; text-align: center; color: #64748b;">Dữ liệu khớp 100%.</div>';
            if(btn) btn.style.display = 'none';
        } else {
            previewStatus.innerHTML = `<span style="color: #ef4444;"><i data-lucide="alert-circle" style="width:14px; margin-right:4px;"></i> Phát hiện ${mismatchCount} bản ghi bị lệch</span>`;
            if(btn) btn.style.display = 'inline-flex';
            
            // Build simple HTML table
            let html = '<table class="data-table" style="width: 100%; border-collapse: collapse;"><thead><tr>';
            
            // Collect all unique keys from reportData
            const allKeys = new Set();
            reportData.forEach(row => Object.keys(row).forEach(k => allKeys.add(k)));
            const headers = Array.from(allKeys);
            
            headers.forEach(h => {
                html += `<th style="padding: 8px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 12px; white-space: nowrap;">${h}</th>`;
            });
            html += '</tr></thead><tbody>';
            
            // Show up to 50 rows in preview
            const previewRows = reportData.slice(0, 50);
            previewRows.forEach(row => {
                html += '<tr>';
                headers.forEach(h => {
                    const val = row[h] || "";
                    const isErr = h.includes('[LỆCH]') || (h === 'Trạng thái' && val.includes('Lệch'));
                    const isWarn = h === 'Trạng thái' && val.includes('Không tìm thấy');
                    let color = '';
                    if (isErr) color = 'color: #ef4444; font-weight: bold; background: #fef2f2;';
                    else if (isWarn) color = 'color: #f59e0b; font-weight: bold; background: #fffbeb;';
                    html += `<td style="padding: 8px; border: 1px solid #e2e8f0; font-size: 12px; white-space: nowrap; ${color}">${val}</td>`;
                });
                html += '</tr>';
            });
            
            html += '</tbody></table>';
            if (reportData.length > 50) {
                html += `<div style="text-align: center; padding: 10px; color: #64748b; font-size: 12px; font-style: italic;">... và ${reportData.length - 50} dòng khác (Tải xuống để xem đầy đủ)</div>`;
            }
            previewWrapper.innerHTML = html;
        }
        
        if(window.lucide) window.lucide.createIcons();
        previewContainer.scrollIntoView({ behavior: 'smooth' });
    },
    
    downloadCrosscheckReport: function() {
        if (!this.crosscheckReportData || this.crosscheckReportData.length === 0) return;
        
        const ws = XLSX.utils.json_to_sheet(this.crosscheckReportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bao_Cao_Sai_Lech");
        XLSX.writeFile(wb, "Bao_Cao_Sai_Lech_Diem.xlsx");
        
        showAlert(`Đã tải xuống báo cáo lỗi (${this.crosscheckMismatchCount} dòng)`, 'success');
    },

    executeTransfer: async function() {
        if (!this.sourceData || !this.targetWb) {
            alert('Vui lòng tải lên cả 2 file Nguồn và Đích.');
            return;
        }

        const sourceIdCols = [
            document.getElementById('et-source-id-1').value,
            document.getElementById('et-source-id-2').value,
            document.getElementById('et-source-id-3').value
        ].filter(v => v !== "").map(v => parseInt(v));

        const targetIdCols = [
            document.getElementById('et-target-id-1').value,
            document.getElementById('et-target-id-2').value,
            document.getElementById('et-target-id-3').value
        ].filter(v => v !== "").map(v => parseInt(v));

        if (sourceIdCols.length === 0 || targetIdCols.length === 0) {
            alert('Vui lòng chọn ít nhất Khóa chính 1 cho cả 2 file.');
            return;
        }

        if (sourceIdCols.length !== targetIdCols.length) {
            alert(`Lưu ý: Số lượng cột Khóa chính hai bên không bằng nhau (${sourceIdCols.length} nguồn vs ${targetIdCols.length} đích). Có thể việc đối chiếu sẽ sai lệch.`);
        }

        const mappingRows = document.querySelectorAll('.et-mapping-row');
        const mappings = [];
        mappingRows.forEach(row => {
            const sCol = row.querySelector('.et-mapping-source').value;
            const tCol = row.querySelector('.et-mapping-target').value;
            const transform = row.querySelector('.et-mapping-transform') ? row.querySelector('.et-mapping-transform').value : '';
            if (sCol && tCol) {
                mappings.push({ source: parseInt(sCol), target: parseInt(tCol), transform: transform });
            }
        });

        if (mappings.length === 0) {
            alert('Vui lòng Thêm ít nhất 1 Cặp cột ánh xạ.');
            return;
        }

        this.pendingErrors = 0;
        const btn = document.getElementById('et-execute-btn');
        let originalText = '';
        if (btn) {
            originalText = btn.innerHTML;
            
            btn.innerHTML = '<i data-lucide="loader-2" class="lucide-spin" style="width:20px; height:20px; margin-right:8px;"></i> ĐANG XỬ LÝ...';
            btn.disabled = true;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        try {
            // Processing Source (Multi-file support)
            const sourceMap = new Map();
            const sourceDuplicates = new Set();
            
            this.sourceData.forEach((row) => {
                const keys = [];
                for (let col of sourceIdCols) {
                    let rawVal = ExcelTransfer.getCellValueString(row.getCell(parseInt(col)));
                    keys.push(ExcelTransfer.normalizeForComparison(rawVal));
                }
                let keyStr = keys.join('_');
                
                if (keyStr.length > 0 && keyStr !== '_') {
                    if (!sourceMap.has(keyStr)) {
                        sourceMap.set(keyStr, []);
                    } else {
                        sourceDuplicates.add(keyStr);
                    }
                    sourceMap.get(keyStr).push(row);
                }
            });

            const targetSheetName = document.getElementById('et-target-sheet').value;
            const targetWs = this.targetWb.getWorksheet(targetSheetName);
            const targetHeaderRow = parseInt(document.getElementById('et-target-header-row').value) || 1;

            const sourceHeadersMap = {};
            this.sourceHeaders.forEach(h => sourceHeadersMap[h.colNumber] = h.name);
            const targetHeadersMap = {};
            this.targetHeaders.forEach(h => targetHeadersMap[h.colNumber] = h.name);

            const reportWb = new ExcelJS.Workbook();
            const sheet1 = reportWb.addWorksheet('Dữ liệu cập nhật');
            sheet1.columns = [
                { header: 'Khóa đối chiếu (ID)', key: 'id', width: 30 },
                { header: 'Cột cập nhật', key: 'col', width: 25 },
                { header: 'Giá trị cũ', key: 'old', width: 15 },
                { header: 'Giá trị mới', key: 'new', width: 15 }
            ];
            const sheet2 = reportWb.addWorksheet('Lệch ID (Thừa - Thiếu)');
            sheet2.columns = [
                { header: 'Khóa đối chiếu (ID)', key: 'id', width: 30 },
                { header: 'Tình trạng', key: 'status', width: 55 }
            ];

            let matchedCount = 0;
            const matchedSourceKeys = new Set();
            let previewRowCount = 0;

            let previewHTML = `<table class="table table-sm table-bordered" style="width: 100%; font-size: 13px; min-width: 600px; margin-bottom: 0;">
                                <thead><tr>
                                    <th style="position: sticky; top: 0; left: 0; z-index: 10; background: #fff; width: 40px;">STT</th>
                                    <th style="position: sticky; top: 0; left: 40px; z-index: 10; background: #fff; width: 100px;">Khóa (ID)</th>`;
            
            mappings.forEach(m => {
                const sName = sourceHeadersMap[m.source] || `Cột ${m.source}`;
                const tName = targetHeadersMap[m.target] || `Cột ${m.target}`;
                previewHTML += `<th style="position: sticky; top: 0; background-color: #f1f5f9; color: #475569; min-width: 100px;">${sName}<br/><span style="font-size:11px;font-weight:normal">(Nguồn)</span></th>`;
                previewHTML += `<th style="position: sticky; top: 0; background-color: #dcfce7; color: #166534; min-width: 100px;">${tName}<br/><span style="font-size:11px;font-weight:normal">(Đích)</span></th>`;
            });
            previewHTML += `</tr></thead><tbody>`;

            const ccSource1 = document.getElementById('et-cc-source-1') ? parseInt(document.getElementById('et-cc-source-1').value) : 0;
            const ccTarget1 = document.getElementById('et-cc-target-1') ? parseInt(document.getElementById('et-cc-target-1').value) : 0;
            const ccSource2 = document.getElementById('et-cc-source-2') ? parseInt(document.getElementById('et-cc-source-2').value) : 0;
            const ccTarget2 = document.getElementById('et-cc-target-2') ? parseInt(document.getElementById('et-cc-target-2').value) : 0;
            
            const ccLogicEnable = document.getElementById('et-cc-logic-enable') ? document.getElementById('et-cc-logic-enable').checked : false;
            const ccLogicCol = document.getElementById('et-cc-logic-col') ? parseInt(document.getElementById('et-cc-logic-col').value) : 0;
            const ccLogicGender = document.getElementById('et-cc-logic-gender') ? parseInt(document.getElementById('et-cc-logic-gender').value) : 0;
            const ccLogicDob = document.getElementById('et-cc-logic-dob') ? parseInt(document.getElementById('et-cc-logic-dob').value) : 0;

            targetWs.eachRow((row, rowNumber) => {
                if (rowNumber <= targetHeaderRow) return;

                const keys = [];
                for (let col of targetIdCols) {
                    let rawVal = ExcelTransfer.getCellValueString(row.getCell(parseInt(col)));
                    keys.push(ExcelTransfer.normalizeForComparison(rawVal));
                }
                let keyStr = keys.join('_');

                if (keyStr.length > 0 && keyStr !== '_') {
                    let matchedSourceKey = keyStr;
                    let isFuzzyMatch = false;
                    let enableFuzzy = document.getElementById('et-enable-fuzzy') ? document.getElementById('et-enable-fuzzy').checked : true;
                    
                    if (!sourceMap.has(keyStr) && enableFuzzy) {
                        let targetNoAccent = ExcelTransfer.removeVietnameseAccents(keyStr);
                        let bestMatchKey = null;
                        
                        for (let sKey of sourceMap.keys()) {
                            let sKeyNoAccent = ExcelTransfer.removeVietnameseAccents(sKey);
                            
                            // 1. Same without accents
                            if (targetNoAccent === sKeyNoAccent) {
                                bestMatchKey = sKey;
                                break;
                            }
                            
                            // 2. Levenshtein distance <= 2 for strings > 5 chars
                            if (targetNoAccent.length > 5 && sKeyNoAccent.length > 5) {
                                if (Math.abs(targetNoAccent.length - sKeyNoAccent.length) <= 2) {
                                    if (ExcelTransfer.levenshteinDistance(targetNoAccent, sKeyNoAccent) <= 2) {
                                        bestMatchKey = sKey;
                                        break;
                                    }
                                }
                            }
                        }
                        
                        if (bestMatchKey) {
                            matchedSourceKey = bestMatchKey;
                            isFuzzyMatch = true;
                        }
                    }

                    if (sourceMap.has(matchedSourceKey)) {
                        const possibleRows = sourceMap.get(matchedSourceKey);
                        let sourceRow = possibleRows[0];

                        let isConflict = false;
                        let conflictHTML = '';
                        if (possibleRows.length > 1) {
                            isConflict = true;
                            let bestRow = possibleRows[0];
                            let maxScore = -1;
                            
                            const targetValues = new Set();
                            row.eachCell(c => {
                                const v = ExcelTransfer.getCellValueString(c).toLowerCase().trim();
                                if (v.length > 3) targetValues.add(v);
                            });

                            possibleRows.forEach(sRow => {
                                let score = 0;
                                sRow.eachCell(c => {
                                    const v = ExcelTransfer.getCellValueString(c).toLowerCase().trim();
                                    if (v.length > 3 && targetValues.has(v)) score++;
                                });
                                if (score > maxScore) {
                                    maxScore = score;
                                    bestRow = sRow;
                                }
                            });
                            
                            sourceRow = bestRow;
                            sheet2.addRow({ id: keyStr, status: '⚠️ Trùng ID - Đã tự động gợi ý chọn dòng phù hợp nhất' });
                            
                            if (previewRowCount < 20) {
                                let optionsHTML = '';
                                possibleRows.forEach((sRow, idx) => {
                                    let sInfo = '';
                                    sRow.eachCell((c, colNum) => { if (colNum <= 5) sInfo += ExcelTransfer.getCellValueString(c) + ' | '; });
                                    let isSel = (sRow === bestRow) ? 'selected' : '';
                                    optionsHTML += `<option value="${sRow.number}" ${isSel}>Dòng ${sRow.number}: ${sInfo.substring(0, 30)}...</option>`;
                                });
                                conflictHTML = `<div style="margin-top:4px;"><select class="form-control" style="font-size:10px; padding:2px; height:auto;" onchange="ExcelTransfer.resolveConflict(${rowNumber}, this.value)">${optionsHTML}</select></div>`;
                            }
                        }
                        
                        let ccWarn = '';
                        let ccWarnStyle = '';
                        let ccWarnText = '';
                        
                        if (ccSource1 && ccTarget1) {
                            let sv = ExcelTransfer.getCellValueString(sourceRow.getCell(ccSource1));
                            let tv = ExcelTransfer.getCellValueString(row.getCell(ccTarget1));
                            if (ExcelTransfer.normalizeForComparison(sv) !== ExcelTransfer.normalizeForComparison(tv)) {
                                ccWarnText += `Sai lệch 1: Nguồn '${sv}' khác Đích '${tv}'.\n`;
                            }
                        }
                        if (ccSource2 && ccTarget2) {
                            let sv = ExcelTransfer.getCellValueString(sourceRow.getCell(ccSource2));
                            let tv = ExcelTransfer.getCellValueString(row.getCell(ccTarget2));
                            if (ExcelTransfer.normalizeForComparison(sv) !== ExcelTransfer.normalizeForComparison(tv)) {
                                ccWarnText += `Sai lệch 2: Nguồn '${sv}' khác Đích '${tv}'.\n`;
                            }
                        }
                        
                        if (ccWarnText) {
                            ExcelTransfer.pendingErrors++;
                            ccWarnStyle = 'background: #fef08a;'; // Bright yellow
                            ccWarn = `<i data-lucide="shield-alert" style="width:14px; color:#b45309; cursor:help; margin-right:4px;" title="${ccWarnText.replace(/"/g, '&quot;')}"></i>`;
                            sheet2.addRow({ id: keyStr, status: `⚠️ Sai lệch thông tin chéo: ${ccWarnText.replace(/\n/g, ' - ')}` });
                        }

                        let rowHTML = '';
                        if (previewRowCount < 20) {
                            let warnStyle = isConflict ? "background: #fffbeb;" : "background: #fff;";
                            if (ccWarnStyle) warnStyle = ccWarnStyle;
                            if (isFuzzyMatch) warnStyle = "background: #f3e8ff;"; // Purple-50
                            
                            let icon = isConflict ? '<i data-lucide="alert-triangle" style="width:12px; color:var(--warning);"></i>' : '';
                            if (isFuzzyMatch) icon += `<i data-lucide="wand-2" style="width:14px; color:#7c3aed; cursor:help; margin-right:4px;" title="Ghép mờ tự động do sai chính tả: ${keyStr} ≈ ${matchedSourceKey}"></i>`;
                            
                            let displayKey = isFuzzyMatch ? `<span style="color:#7c3aed;">${matchedSourceKey}</span>` : keyStr;
                            
                            rowHTML = `<tr>
                                        <td style="position: sticky; left: 0; border-right: 1px solid #e2e8f0; ${warnStyle}">${previewRowCount + 1}</td>
                                        <td style="position: sticky; left: 40px; border-right: 1px solid #e2e8f0; font-weight: bold; color: #3b82f6; ${warnStyle}">${icon}${ccWarn} ${displayKey} ${conflictHTML}</td>`;
                        }

                        mappings.forEach(m => {
                            const sValCell = sourceRow.getCell(m.source);
                            const tValCell = row.getCell(m.target);
                            
                            const targetColName = targetHeadersMap[m.target] || m.target;
                            let oldVal = tValCell.value;
                            if (oldVal && typeof oldVal === 'object' && oldVal.result !== undefined) oldVal = oldVal.result;
                            
                            let val = sValCell.value;
                            if (val && typeof val === 'object') {
                                if (val.result !== undefined) val = val.result;
                                else if (val.richText) val = val.richText.map(rt => rt.text).join('');
                            }
                            
                            val = ExcelTransfer.applyTransformation(val, oldVal);
                            
                            const skipNotEmpty = document.getElementById('et-skip-not-empty') ? document.getElementById('et-skip-not-empty').checked : false;
                            let oldValString = oldVal !== null && oldVal !== undefined ? oldVal.toString().trim() : '';
                            
                            // Tính năng 1: Không ghi đè
                            if (skipNotEmpty && oldValString !== '') {
                                return; // Bỏ qua cập nhật ô này
                            }

                            let sourceStrRaw = val !== null && val !== undefined ? val.toString() : '';

                            // Tính năng 3: Data Cleansing & Validation
                            let errorMsg = null;
                            if (val !== null && val !== undefined && m.transform) {
                                let sStr = val.toString().trim();
                                if (m.transform === 'UPPER') {
                                    val = sStr.toUpperCase();
                                }
                                else if (m.transform === 'TITLE') {
                                    val = sStr.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                                }
                                else if (m.transform === 'VALID_CCCD') {
                                    val = sStr.replace(/\s+/g, '');
                                    if (!/^\d{12}$/.test(val)) errorMsg = "CCCD phải đúng 12 chữ số";
                                }
                                else if (m.transform === 'VALID_PHONE') {
                                    val = sStr.replace(/[^\d]/g, '');
                                    if (val.length === 9) val = '0' + val; // Auto pad 0
                                    if (val.length !== 10) errorMsg = "SĐT phải đúng 10 chữ số";
                                }
                                else if (m.transform === 'VALID_GRADE') {
                                    val = sStr.replace(',', '.');
                                    let grade = parseFloat(val);
                                    if (isNaN(grade) || grade < 0 || grade > 10) errorMsg = "Điểm phải là số từ 0 đến 10";
                                    else val = grade; // Use float directly
                                }
                                else if (m.transform === 'EXTRACT_LASTNAME') {
                                    let parts = sStr.split(/\s+/);
                                    if (parts.length > 1) {
                                        parts.pop();
                                        val = parts.join(' ');
                                    } else val = sStr;
                                }
                                else if (m.transform === 'EXTRACT_FIRSTNAME') {
                                    let parts = sStr.split(/\s+/);
                                    val = parts.length > 0 ? parts[parts.length - 1] : sStr;
                                }
                                else if (m.transform === 'DECODE_TCVN3') {
                                    val = ExcelTransfer.decodeTCVN3(sStr);
                                }
                                else if (m.transform === 'DECODE_VNI') {
                                    val = ExcelTransfer.decodeVNI(sStr);
                                }
                            }
                            
                            // CCCD Logic Check
                            if (ccLogicEnable && ccLogicCol && ccLogicGender && ccLogicDob && m.source === ccLogicCol) {
                                let cccdRaw = val ? val.toString().trim() : '';
                                let genderRaw = ExcelTransfer.getCellValueString(sourceRow.getCell(ccLogicGender)).trim().toLowerCase();
                                let dobRaw = ExcelTransfer.getCellValueString(sourceRow.getCell(ccLogicDob)).trim();
                                
                                if (cccdRaw.length === 12) {
                                    let centuryGenderCode = parseInt(cccdRaw.charAt(3));
                                    let birthYearCode = cccdRaw.substring(4, 6);
                                    
                                    // Map Gender and Century
                                    // 20th century (1900-1999): Nam 0, Nữ 1
                                    // 21st century (2000-2099): Nam 2, Nữ 3
                                    let expectedGenderStr = "";
                                    let expectedYearStr = birthYearCode;
                                    
                                    if (centuryGenderCode === 0 || centuryGenderCode === 2 || centuryGenderCode === 4 || centuryGenderCode === 6) expectedGenderStr = "nam";
                                    else if (centuryGenderCode === 1 || centuryGenderCode === 3 || centuryGenderCode === 5 || centuryGenderCode === 7) expectedGenderStr = "nữ";
                                    
                                    let genderMismatch = expectedGenderStr !== "" && genderRaw !== "" && !genderRaw.includes(expectedGenderStr);
                                    let dobMismatch = dobRaw !== "" && dobRaw.length >= 4 && !dobRaw.includes(expectedYearStr);
                                    
                                    if (genderMismatch || dobMismatch) {
                                        errorMsg = "Lỗi Logic CCCD! Sai Giới tính hoặc Năm sinh.";
                                        // Also add to Lệch ID sheet
                                        sheet2.addRow({ id: keyStr, status: `🚨 Lỗi Logic CCCD: ${cccdRaw} - Giới tính [${genderRaw}] hoặc Năm sinh [${dobRaw}] không hợp lệ!` });
                                    }
                                }
                            }
                            
                            if (errorMsg) ExcelTransfer.pendingErrors++;
                            
                            if (oldVal !== val) {
                                sheet1.addRow({
                                    id: keyStr,
                                    col: targetColName,
                                    old: oldVal !== null && oldVal !== undefined ? oldVal.toString() : '(trống)',
                                    new: val !== null && val !== undefined ? val.toString() : '(trống)'
                                });
                            }
                            
                            if (previewRowCount < 20) {
                                let normValStr = val !== null && val !== undefined ? val.toString() : '';
                                
                                let inputStyle = errorMsg ? 
                                    "border: 1px solid #ef4444; background: #fef2f2; color: #b91c1c;" : 
                                    "border: 1px solid transparent; background: transparent; color: #15803d;";
                                let titleAttr = errorMsg ? `title="${errorMsg}"` : '';
                                let dataErr = errorMsg ? 'true' : 'false';
                                
                                rowHTML += `<td style="background-color: #f8fafc; color: #64748b;" id="et-src-val-${rowNumber}-${m.source}">${sourceStrRaw}</td>`;
                                rowHTML += `<td style="background-color: #f0fdf4; font-weight: 500;">
                                    <input type="text" id="et-inline-${rowNumber}-${m.target}" value="${normValStr.replace(/"/g, '&quot;')}" ${titleAttr} data-error="${dataErr}"
                                        onchange="ExcelTransfer.updateCellValue(${rowNumber}, ${m.target}, this.value)"
                                        style="width: 100%; padding: 2px 4px; font-weight: 500; border-radius: 4px; outline: none; transition: all 0.2s; ${inputStyle}"
                                        onfocus="if(this.getAttribute('data-error') !== 'true') { this.style.border='1px solid #22c55e'; this.style.background='#fff'; }"
                                        onblur="if(this.getAttribute('data-error') !== 'true') { this.style.border='1px solid transparent'; this.style.background='transparent'; }">
                                </td>`;
                            }
                            
                            const copyStyle = document.getElementById('et-copy-style') ? document.getElementById('et-copy-style').checked : false;
                            if (copyStyle && sValCell.style) {
                                try {
                                    if (sValCell.style.fill && sValCell.style.fill.type === 'pattern') {
                                        tValCell.fill = JSON.parse(JSON.stringify(sValCell.style.fill));
                                    }
                                    if (sValCell.style.font) {
                                        let newFont = tValCell.font ? JSON.parse(JSON.stringify(tValCell.font)) : {};
                                        if (sValCell.style.font.color) newFont.color = JSON.parse(JSON.stringify(sValCell.style.font.color));
                                        if (sValCell.style.font.bold) newFont.bold = sValCell.style.font.bold;
                                        if (sValCell.style.font.italic) newFont.italic = sValCell.style.font.italic;
                                        if (Object.keys(newFont).length > 0) tValCell.font = newFont;
                                    }
                                } catch(e) {}
                            }

                            tValCell.value = val; 
                        });

                        if (previewRowCount < 20) {
                            rowHTML += `</tr>`;
                            previewHTML += rowHTML;
                            previewRowCount++;
                        }
                        
                        matchedCount++;
                        matchedSourceKeys.add(keyStr);
                    } else {
                        sheet2.addRow({ id: keyStr, status: 'Có trong File ĐÍCH nhưng KHÔNG TÌM THẤY trong File NGUỒN' });
                    }
                }
            });
            
            for (const key of sourceMap.keys()) {
                if (!matchedSourceKeys.has(key)) {
                    sheet2.addRow({ id: key, status: 'Có trong File NGUỒN nhưng BỊ DƯ (Không có trong File Đích)' });
                }
            }

            previewHTML += `</tbody></table>`;
            if (matchedCount > 20) {
                previewHTML += `<div style="text-align: center; padding: 12px; color: #64748b; background: #f8fafc; font-style: italic; border-top: 1px solid #e2e8f0;">... Và ${matchedCount - 20} dòng khác đã được cập nhật thành công ...</div>`;
            } else if (matchedCount === 0) {
                previewHTML = `<div style="text-align: center; padding: 25px; color: #ef4444; font-weight: 500;">Không có học sinh nào khớp Khóa (ID) để gán!</div>`;
            }

            let lechKhoaCount = sheet2.rowCount - 1;
            
            let dashboardHTML = `
            <div style="display:flex; justify-content:space-around; background:#f8fafc; padding:20px; border-radius:8px; margin-bottom:15px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="text-align:center">
                    <h3 style="color:#16a34a; margin:0; font-size:28px; font-weight:700;">${matchedCount}</h3>
                    <p style="margin:0; font-size:14px; color:#475569; font-weight:500;">✅ Ghép thành công</p>
                </div>
                <div style="border-left: 1px solid #cbd5e1;"></div>
                <div style="text-align:center">
                    <h3 style="color:#eab308; margin:0; font-size:28px; font-weight:700;">${ExcelTransfer.pendingErrors}</h3>
                    <p style="margin:0; font-size:14px; color:#475569; font-weight:500;">⚠️ Cảnh báo sai lệch</p>
                </div>
                <div style="border-left: 1px solid #cbd5e1;"></div>
                <div style="text-align:center">
                    <h3 style="color:#ef4444; margin:0; font-size:28px; font-weight:700;">${lechKhoaCount}</h3>
                    <p style="margin:0; font-size:14px; color:#475569; font-weight:500;">❌ Lệch Khóa (Dư/Thiếu)</p>
                </div>
            </div>`;
            
            document.getElementById('et-preview-table-wrapper').innerHTML = dashboardHTML + previewHTML;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            
            document.getElementById('et-preview-status').innerHTML = '';
            this.updateDownloadBtnState();
            document.getElementById('et-preview-container').style.display = 'block';

            // Prepare memory blobs
            const targetFile = document.getElementById('et-target-file').files[0];
            const buffer = await this.targetWb.xlsx.writeBuffer();
            window.etFinalTargetBlob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            let finalName = targetFile.name;
            if (finalName.toLowerCase().endsWith('.xls')) {
                finalName += 'x';
            }
            window.etFinalTargetName = `[Da_Ghi_Du_Lieu]_${finalName}`;

            if (sheet1.rowCount > 1 || sheet2.rowCount > 1) {
                const reportBuffer = await reportWb.xlsx.writeBuffer();
                window.etFinalReportBlob = new Blob([reportBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            } else {
                window.etFinalReportBlob = null;
            }

            setTimeout(() => {
                document.getElementById('et-preview-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);

        } catch (error) {
            console.error(error);
            alert("❌ Đã xảy ra lỗi khi xử lý dữ liệu: " + error.message);
        } finally {
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }
    },

    downloadFinal: function() {
        if (!window.etFinalTargetBlob) return;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(window.etFinalTargetBlob);
        link.download = window.etFinalTargetName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (window.etFinalReportBlob) {
            const rLink = document.createElement('a');
            rLink.href = URL.createObjectURL(window.etFinalReportBlob);
            rLink.download = `[Bao_Cao_Ghi_Nhan]_${new Date().getTime()}.xlsx`;
            document.body.appendChild(rLink);
            setTimeout(() => rLink.click(), 1000);
            setTimeout(() => document.body.removeChild(rLink), 2000);
        }
    }
};
document.addEventListener('DOMContentLoaded', () => { ExcelTransfer.init(); ExcelTransfer.loadMapProfiles(); });

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('view-excel-transfer').addEventListener('change', () => {
        if (ExcelTransfer.saveStateToLocal) ExcelTransfer.saveStateToLocal();
    });
    if (ExcelTransfer.autoRestoreFromCache) ExcelTransfer.autoRestoreFromCache();
});
