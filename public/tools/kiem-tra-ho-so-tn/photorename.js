/**
 * PHOTO RENAME MODULE - PRO VERSION
 * Logic for bulk renaming photos with Drag & Drop, Gallery Mode, and AI Audit.
 */

let selectedPhotos = []; // { file, id, audit: { width, height, ratio, size, ok } }
const escapeHTML = (str) => {
    if (str == null) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};
let renameMapping = [];
let photoViewMode = 'table'; // 'table' or 'grid'
let sortableInstance = null;

function updatePhotoFileSelector() {
    const selector = document.getElementById('photo-excel-selector');
    if (!selector) return;

    const files = Object.keys(dataStore);
    selector.innerHTML = '<option value="">--- Chọn tệp ---</option>' +
        files.map(f => `<option value="${f}" ${f === activeFileName ? 'selected' : ''}>${f}</option>`).join('');
    
    updatePhotoColumnSelector();
}

function updatePhotoColumnSelector() {
    const fileName = document.getElementById('photo-excel-selector').value;
    const colSelector = document.getElementById('photo-column-selector');
    if (!colSelector) return;

    if (!fileName || !dataStore[fileName]) {
        colSelector.innerHTML = '<option value="">--- Chọn cột ---</option>';
        return;
    }

    const cols = dataStore[fileName].columns;
    const mapping = dataStore[fileName].mapping || {};
    const cccdCol = mapping['cccd'] || "";

    colSelector.innerHTML = cols.map(c => 
        `<option value="${c}" ${c === cccdCol ? 'selected' : ''}>${c}</option>`
    ).join('');
}

async function handlePhotoSelection(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    showAlert(`🔍 Đang kiểm tra ${files.length} ảnh...`, 'info');

    // Sắp xếp mặc định theo tên tệp
    const sortedFiles = files.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: 'base'}));
    
    selectedPhotos = [];
    
    for (let file of sortedFiles) {
        const audit = await auditImage(file);
        selectedPhotos.push({
            file: file,
            id: Math.random().toString(36).substr(2, 9),
            audit: audit
        });
    }
    
    showAlert(`📸 Đã tải ${selectedPhotos.length} ảnh. Sẵn sàng đối chiếu.`, 'success');
    generateRenamePreview();
}

async function auditImage(file) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const ratio = img.width / img.height;
            const is3x4 = Math.abs(ratio - 0.75) < 0.1;
            const is4x6 = Math.abs(ratio - 0.66) < 0.1;
            const isGoodRes = img.width >= 600;
            
            resolve({
                width: img.width,
                height: img.height,
                ratioText: is3x4 ? "3:4" : (is4x6 ? "4:6" : "Khác"),
                sizeMB: (file.size / (1024 * 1024)).toFixed(2),
                ok: (is3x4 || is4x6) && isGoodRes
            });
        };
        img.onerror = () => resolve({ ok: false, error: true });
        img.src = URL.createObjectURL(file);
    });
}

function setPhotoViewMode(mode) {
    photoViewMode = mode;
    document.querySelectorAll('.btn-view-mode').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-view-${mode}`).classList.add('active');
    
    generateRenamePreview();
}

function generateRenamePreview() {
    const fileName = document.getElementById('photo-excel-selector').value;
    const colName = document.getElementById('photo-column-selector').value;
    const placeholder = document.getElementById('photo-placeholder');
    const badge = document.getElementById('photo-count-badge');
    const actionBar = document.getElementById('photo-action-bar');

    if (!fileName || !dataStore[fileName] || !colName || selectedPhotos.length === 0) {
        placeholder.style.display = 'block';
        document.getElementById('photo-preview-container').style.display = 'none';
        document.getElementById('photo-grid-container').style.display = 'none';
        actionBar.style.display = 'none';
        return;
    }

    placeholder.style.display = 'none';
    actionBar.style.display = 'flex';
    badge.innerText = `${selectedPhotos.length} ảnh`;
    badge.style.display = 'inline-block';

    const excelRows = dataStore[fileName].data;
    const mapping = dataStore[fileName].mapping || {};
    const nameCol = mapping['hoten'] || "";
    
    renameMapping = [];
    const count = Math.min(selectedPhotos.length, excelRows.length);

    if (photoViewMode === 'table') {
        renderTableView(count, excelRows, colName, nameCol);
    } else {
        renderGridView(count, excelRows, colName, nameCol);
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderTableView(count, excelRows, colName, nameCol) {
    const body = document.getElementById('photo-preview-body');
    document.getElementById('photo-preview-container').style.display = 'block';
    document.getElementById('photo-grid-container').style.display = 'none';
    body.innerHTML = "";

    for (let i = 0; i < count; i++) {
        const item = selectedPhotos[i];
        const rowData = excelRows[i];
        const newName = (rowData[colName] || "").toString().trim();
        const fullName = nameCol ? (rowData[nameCol] || "").toString().trim() : "---";
        
        const ext = item.file.name.split('.').pop();
        const finalName = `${newName}.${ext}`;

        renameMapping.push({ oldFile: item.file, oldName: item.file.name, newName: finalName });

        const tr = document.createElement('tr');
        tr.dataset.id = item.id;
        const imgUrl = URL.createObjectURL(item.file);
        
        const auditClass = item.audit.ok ? 'text-success' : 'text-danger';
        const auditIcon = item.audit.ok ? 'check-circle' : 'alert-circle';

        const escapedFileName = escapeHTML(item.file.name);
        const escapedFullName = escapeHTML(fullName);
        const escapedNewName = escapeHTML(newName);
        const escapedFinalName = escapeHTML(finalName);
        const clickTitle = `${escapedFullName} - ${escapedFinalName}`.replace(/'/g, "\\'");

        tr.innerHTML = `
            <td style="text-align:center; font-weight:700; cursor:move" class="drag-handle"><i data-lucide="grip-vertical" style="width:14px"></i> ${i + 1}</td>
            <td style="font-size:12px; color:var(--text-muted)">${escapedFileName}</td>
            <td style="text-align:center">
                <div class="photo-mini-preview" onclick="openPhotoPreview('${imgUrl}', '${clickTitle}')">
                    <img src="${imgUrl}">
                    ${!item.audit.ok ? '<div class="audit-warning-mini">!</div>' : ''}
                </div>
            </td>
            <td>
                <div style="font-weight:600">${escapedFullName}</div>
                <div style="font-size:10px; color:var(--text-muted)">${item.audit.width}x${item.audit.height} (${item.audit.ratioText})</div>
            </td>
            <td style="color:var(--text-muted); font-family:monospace">${escapedNewName}</td>
            <td style="text-align:center"><i data-lucide="arrow-right" style="width:16px; color:var(--primary)"></i></td>
            <td style="font-weight:700; color:var(--success)">${escapedFinalName}</td>
        `;
        body.appendChild(tr);
    }
    
    initSortable('photo-preview-body');
}

function renderGridView(count, excelRows, colName, nameCol) {
    const gallery = document.getElementById('photo-gallery');
    document.getElementById('photo-preview-container').style.display = 'none';
    document.getElementById('photo-grid-container').style.display = 'block';
    gallery.innerHTML = "";

    for (let i = 0; i < count; i++) {
        const item = selectedPhotos[i];
        const rowData = excelRows[i];
        const fullName = nameCol ? (rowData[nameCol] || "").toString().trim() : "---";
        const newName = (rowData[colName] || "").toString().trim();
        const ext = item.file.name.split('.').pop();
        const finalName = `${newName}.${ext}`;

        renameMapping.push({ oldFile: item.file, oldName: item.file.name, newName: finalName });

        const imgUrl = URL.createObjectURL(item.file);
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.dataset.id = item.id;
        
        const escapedFullName = escapeHTML(fullName);
        const escapedNewName = escapeHTML(newName);
        const clickTitle = escapedFullName.replace(/'/g, "\\'");

        div.innerHTML = `
            <div class="gallery-card ${!item.audit.ok ? 'audit-fail' : ''}">
                <div class="gallery-img-wrapper" onclick="openPhotoPreview('${imgUrl}', '${clickTitle}')">
                    <img src="${imgUrl}">
                    <div class="gallery-index">${i + 1}</div>
                </div>
                <div class="gallery-info">
                    <div class="gallery-name">${escapedFullName}</div>
                    <div class="gallery-cccd">${escapedNewName}</div>
                    <div class="gallery-audit">
                        <span class="${item.audit.ok ? 'text-success' : 'text-danger'}">
                            ${item.audit.width}x${item.audit.height} | ${item.audit.sizeMB}MB
                        </span>
                    </div>
                </div>
            </div>
        `;
        gallery.appendChild(div);
    }
    
    initSortable('photo-gallery');
}

function initSortable(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    
    if (sortableInstance) sortableInstance.destroy();
    
    sortableInstance = new Sortable(el, {
        animation: 150,
        handle: photoViewMode === 'table' ? '.drag-handle' : null,
        onEnd: function() {
            const newOrder = sortableInstance.toArray();
            reorderPhotos(newOrder);
        }
    });
}

function reorderPhotos(idList) {
    const newPhotos = [];
    idList.forEach(id => {
        const item = selectedPhotos.find(p => p.id === id || p.id === id.replace('grid-', ''));
        if (item) newPhotos.push(item);
    });
    selectedPhotos = newPhotos;
    generateRenamePreview();
}

async function downloadRenamedZip() {
    if (renameMapping.length === 0) return;
    const fileName = document.getElementById('photo-excel-selector').value;
    const baseName = fileName ? fileName.replace(/\.[^/.]+$/, "") : "anh_the_doi_ten";
    
    const zip = new JSZip();
    const folder = zip.folder(baseName);
    
    const aiEnabled = document.getElementById('ai-photo-enable') && document.getElementById('ai-photo-enable').checked;
    
    if (aiEnabled) {
        const bg = document.getElementById('ai-photo-bg').value;
        const size = document.getElementById('ai-photo-size').value;
        const options = { bg, size };
        
        // Show progress UI (overlay)
        let overlay = document.getElementById('ai-progress-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'ai-progress-overlay';
            overlay.style = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-family: sans-serif;';
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
        
        try {
            for (let i = 0; i < renameMapping.length; i++) {
                const item = renameMapping[i];
                overlay.innerHTML = `
                    <div style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">🤖 AI Đang Xử Lý Ảnh Thẻ...</div>
                    <div style="font-size: 18px; color: #60a5fa;">Đang xử lý: ${item.newName} (${i + 1}/${renameMapping.length})</div>
                    <div style="width: 300px; height: 10px; background: #333; border-radius: 5px; margin-top: 20px; overflow: hidden;">
                        <div style="width: ${((i) / renameMapping.length) * 100}%; height: 100%; background: #3b82f6; transition: width 0.3s;"></div>
                    </div>
                `;
                
                // Process image with AI
                const processedBlob = await window.AIPhoto.processImage(item.oldFile, options);
                
                // Replace extension with .jpg or .png depending on background
                let finalName = item.newName;
                if (bg !== 'transparent') {
                    finalName = finalName.replace(/\.[^/.]+$/, ".jpg");
                } else {
                    finalName = finalName.replace(/\.[^/.]+$/, ".png");
                }
                
                folder.file(finalName, processedBlob);
            }
            
            overlay.innerHTML = `
                <div style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #4ade80;">🤖 Hoàn tất xử lý AI!</div>
                <div style="font-size: 18px;">Đang nén file Zip, vui lòng chờ...</div>
                <div style="width: 300px; height: 10px; background: #333; border-radius: 5px; margin-top: 20px; overflow: hidden;">
                    <div style="width: 100%; height: 100%; background: #4ade80;"></div>
                </div>
            `;
            
        } catch (error) {
            console.error(error);
            alert("Đã xảy ra lỗi trong quá trình xử lý AI: " + error.message);
        } finally {
            setTimeout(() => { if (overlay) overlay.style.display = 'none'; }, 2000);
        }
    } else {
        showAlert("⏳ Đang nén ảnh... Vui lòng đợi trong giây lát.", 'info');
        renameMapping.forEach(item => {
            folder.file(item.newName, item.oldFile);
        });
    }

    const content = await zip.generateAsync({type: "blob"});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `${baseName}_photos.zip`;
    link.click();
    showAlert("✅ Đã tạo tệp Zip thành công!", 'success');
}

function generatePowerShellScript() {
    if (renameMapping.length === 0) return;
    const fileName = document.getElementById('photo-excel-selector').value;
    const baseName = fileName ? fileName.replace(/\.[^/.]+$/, "") : "doi_ten_anh";

    let script = "# PowerShell Script để đổi tên ảnh hàng loạt\n";
    script += `# Nguồn dữ liệu: ${fileName}\n`;
    script += "# Vui lòng copy file này vào thư mục chứa ảnh và chạy nó\n\n";
    
    renameMapping.forEach(item => {
        const oldN = item.oldName.replace(/'/g, "''");
        const newN = item.newName.replace(/'/g, "''");
        script += `Rename-Item -Path '${oldN}' -NewName '${newN}' -ErrorAction SilentlyContinue\n`;
    });

    const blob = new Blob([script], {type: "text/plain;charset=utf-8"});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `script_rename_${baseName}.ps1`;
    link.click();
    showAlert("✅ Đã xuất Script PowerShell!", 'success');
}

// --- PHOTO PREVIEW MODAL ---
let photoZoomState = { scale: 1, x: 0, y: 0, isDragging: false, startX: 0, startY: 0 };

function openPhotoPreview(url, name) {
    const modal = document.getElementById('photo-modal');
    const img = document.getElementById('photo-modal-img');
    const cap = document.getElementById('photo-modal-caption');
    const wrapper = document.getElementById('photo-drag-wrapper');
    
    if (modal && img && wrapper) {
        img.src = url;
        cap.innerText = name;
        modal.style.display = 'flex';
        resetZoom();

        wrapper.onwheel = (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            adjustZoom(delta);
        };

        wrapper.onmousedown = (e) => {
            photoZoomState.isDragging = true;
            photoZoomState.startX = e.clientX - photoZoomState.x;
            photoZoomState.startY = e.clientY - photoZoomState.y;
            wrapper.style.cursor = 'grabbing';
        };

        window.onmousemove = (e) => {
            if (!photoZoomState.isDragging) return;
            photoZoomState.x = e.clientX - photoZoomState.startX;
            photoZoomState.y = e.clientY - photoZoomState.startY;
            updatePhotoTransform();
        };

        window.onmouseup = () => {
            photoZoomState.isDragging = false;
            if (wrapper) wrapper.style.cursor = 'grab';
        };

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

function adjustZoom(delta) {
    const newScale = photoZoomState.scale + delta;
    if (newScale >= 0.5 && newScale <= 10) {
        photoZoomState.scale = newScale;
        updatePhotoTransform();
    }
}

function resetZoom() {
    photoZoomState = { scale: 1, x: 0, y: 0, isDragging: false, startX: 0, startY: 0 };
    updatePhotoTransform();
}

function updatePhotoTransform() {
    const wrapper = document.getElementById('photo-drag-wrapper');
    if (wrapper) {
        wrapper.style.transform = `translate(${photoZoomState.x}px, ${photoZoomState.y}px) scale(${photoZoomState.scale})`;
    }
}

function closePhotoModal() {
    const modal = document.getElementById('photo-modal');
    if (modal) modal.style.display = 'none';
    window.onmousemove = null;
    window.onmouseup = null;
}
