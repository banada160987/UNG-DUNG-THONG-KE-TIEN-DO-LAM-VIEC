/**
 * SmartTest Formatter
 * Chuẩn hóa đề thi thô thành định dạng SmartTest, giữ nguyên hình ảnh, MathType và màu sắc đáp án (đỏ/gạch chân).
 */

const SmartTestFormatter = (() => {

    const renderUI = () => {
        const container = document.getElementById('view-smarttest-formatter');
        if (!container) return;

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Chuẩn hóa Định dạng Đề thi (SmartTest)</h1>
                <p class="page-subtitle">Dọn dẹp khoảng trắng, định dạng lại cấu trúc câu hỏi và đáp án cho chuẩn SmartTest. Tương thích 100% với công cụ Trộn Đề (Word).</p>
            </div>
            
            <div class="card mb-4" style="background-color: #fffbeb; border: 1px solid #fde68a;">
                <div class="flex items-start gap-3">
                    <i data-lucide="info" style="color: #d97706; margin-top: 3px;"></i>
                    <div>
                        <h3 style="color: #92400e; font-weight: bold; margin-bottom: 4px;">Hướng dẫn sử dụng:</h3>
                        <ul style="color: #b45309; font-size: 13px; margin-left: 20px; list-style-type: disc;">
                            <li>Copy đề thi từ MS Word (hoặc mạng) và <b>Dán (Ctrl + V)</b> vào ô "Đề thi gốc" bên dưới.</li>
                            <li>Hệ thống sẽ giữ nguyên các Công thức Toán học (MathType), Hình ảnh và Màu sắc (Đỏ/Gạch chân) của đáp án đúng.</li>
                            <li>Bấm <b>Tiến hành Chuẩn hóa</b> để định dạng lại thành cấu trúc <code>#</code> và <code>A. B. C. D.</code></li>
                            <li>Bấm <b>Copy Kết quả</b> và dán ngược lại vào file Word để lưu thành <code>.docx</code> rồi sử dụng trong Tool Trộn Đề.</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 20px; min-height: 500px;">
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h3 style="font-weight: bold; color: var(--primary);"><i data-lucide="file-input" style="width:18px; display:inline"></i> Đề thi gốc (Dán vào đây)</h3>
                        <button class="btn btn-sm btn-outline" onclick="document.getElementById('smarttest-input').innerHTML = ''">Xóa trắng</button>
                    </div>
                    <div id="smarttest-input" contenteditable="true" 
                        style="flex: 1; border: 2px dashed #cbd5e1; padding: 20px; background: white; border-radius: 8px; overflow-y: auto; outline: none; font-family: 'Times New Roman', serif; font-size: 16px; line-height: 1.5;"
                        placeholder="Dán nội dung từ Word vào đây...">
                    </div>
                </div>
                
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h3 style="font-weight: bold; color: #10b981;"><i data-lucide="file-output" style="width:18px; display:inline"></i> Kết quả Chuẩn hóa</h3>
                        <button onclick="SmartTestFormatter.copyOutput()" class="btn btn-sm" style="background: #10b981; color: white; border: none;">
                            <i data-lucide="copy" style="width:16px"></i> Copy Kết quả (Word)
                        </button>
                    </div>
                    <div id="smarttest-output" contenteditable="true" 
                        style="flex: 1; border: 2px solid #10b981; padding: 20px; background: #f0fdf4; border-radius: 8px; overflow-y: auto; outline: none; font-family: 'Times New Roman', serif; font-size: 16px; line-height: 1.5;"
                        readonly>
                    </div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; margin-bottom: 40px;">
                <button onclick="SmartTestFormatter.process()" class="btn" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 12px 30px; font-size: 16px; font-weight: bold; border-radius: 30px; border: none; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4); cursor: pointer;">
                    <i data-lucide="wand-2" style="width:20px"></i> TIẾN HÀNH CHUẨN HÓA ĐỀ THI
                </button>
            </div>
        `;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    };

    const process = () => {
        const inputDiv = document.getElementById('smarttest-input');
        const outputDiv = document.getElementById('smarttest-output');
        
        if (!inputDiv.innerHTML.trim() || inputDiv.innerHTML === '<br>') {
            if (typeof showAlert === 'function') showAlert("Vui lòng dán nội dung đề thi vào khung Đề thi gốc!", "warning");
            else alert("Vui lòng dán nội dung đề thi vào khung Đề thi gốc!");
            return;
        }

        // B1: Clone toàn bộ DOM để không làm hỏng dữ liệu gốc
        outputDiv.innerHTML = inputDiv.innerHTML;

        // B2: Dọn dẹp khoảng trắng và thẻ rỗng
        cleanEmptyTags(outputDiv);

        // B3: Xử lý Text Nodes để format "Câu 1:" -> "#" và tách "A. B. C. D."
        processTextNodes(outputDiv);

        if (typeof showAlert === 'function') showAlert("Chuẩn hóa thành công! Hãy kiểm tra lại kết quả và bấm Copy.", "success");
        else alert("Chuẩn hóa thành công!");
    };

    const cleanEmptyTags = (container) => {
        // Xóa các thẻ <p> rỗng (chỉ chứa khoảng trắng hoặc &nbsp;)
        const ps = container.querySelectorAll('p, div, span');
        ps.forEach(p => {
            // Nếu thẻ không có img và chỉ chứa khoảng trắng
            if (!p.querySelector('img') && p.textContent.trim() === '') {
                // Không xóa thẻ span hoặc div nếu nó đang bọc một cái gì đó có ý nghĩa, chỉ xóa p rỗng
                if (p.tagName === 'P') {
                    p.remove();
                }
            }
        });
    };

    const processTextNodes = (container) => {
        // Sử dụng TreeWalker để duyệt qua tất cả các Text Node an toàn
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        textNodes.forEach(textNode => {
            let text = textNode.nodeValue;
            
            // Nếu text rỗng thì bỏ qua
            if (!text.trim()) return;

            // 1. Chuyển đổi "Câu 1:", "Bài 2." thành "# "
            // Chỉ bắt ở đầu đoạn (có thể sau khoảng trắng)
            text = text.replace(/^\s*(Câu|Bài)\s*\d+[\.:]?\s*/gi, '# ');

            // 2. Chuyển đổi các chữ nằm giữa đoạn văn (trường hợp bị dính chùm)
            // Ví dụ: "...nội dung câu hỏi. Câu 2: ..." -> "...nội dung câu hỏi. <br># "
            // Tuy nhiên TreeWalker đang lấy textNode, nếu ta thêm <br> vào TextNode thì HTML sẽ bị encode thành &lt;br&gt;!
            // Do đó, với TextNode, ta chỉ đổi chuỗi Text. Việc chèn thẻ <br> phải làm trên parent Node.
            // Để đơn giản, ta format chuẩn A., B., C., D. trước
            
            // Format A., B., C., D. chuẩn:
            // Sửa "A." (có thể không có dấu cách) thành "A. "
            text = text.replace(/\b([A-D])[\.:](?!\s)/g, '$1. ');

            textNode.nodeValue = text;
        });

        // 3. Xử lý tách dòng cho A. B. C. D. bằng Regex an toàn trên innerHTML
        // Bây giờ innerHTML đã sạch sẽ thẻ rỗng và có format chuẩn "A. "
        let html = container.innerHTML;

        // Tách A. B. C. D. xuống dòng nếu đằng trước nó là dấu cách (tức là bị dính chùm)
        // Lưu ý: bỏ qua nếu đằng trước là thẻ đóng hoặc mở block
        // Regex: (khoảng trắng) (A|B|C|D)\.
        html = html.replace(/(&nbsp;|\s)+([A-D])\.\s/g, '<br>$2. ');

        // Chuẩn hóa nốt "Câu 1:" bị kẹt ở giữa đoạn văn
        html = html.replace(/(&nbsp;|\s)+(Câu|Bài)\s*\d+[\.:]?\s/gi, '<br># ');

        container.innerHTML = html;
    };

    const copyOutput = () => {
        const outputDiv = document.getElementById('smarttest-output');
        if (!outputDiv.innerHTML.trim() || outputDiv.innerHTML === '<br>') {
            if (typeof showAlert === 'function') showAlert("Không có kết quả để copy!", "warning");
            else alert("Không có kết quả để copy!");
            return;
        }

        // Tạo một vùng chọn (Selection) để copy toàn bộ HTML (giữ nguyên hình ảnh, MathType, màu đỏ)
        const range = document.createRange();
        range.selectNodeContents(outputDiv);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        try {
            document.execCommand('copy');
            if (typeof showAlert === 'function') showAlert("Đã copy thành công! Hãy dán (Ctrl+V) vào MS Word.", "success");
            else alert("Đã copy thành công! Hãy dán (Ctrl+V) vào MS Word.");
        } catch (err) {
            console.error('Lỗi khi copy:', err);
            alert("Trình duyệt không hỗ trợ copy tự động. Vui lòng bấm Ctrl+A trong khung Kết quả và ấn Ctrl+C.");
        }

        selection.removeAllRanges(); // Xóa vùng chọn
    };

    // Khởi tạo UI khi load
    document.addEventListener("DOMContentLoaded", () => {
        renderUI();
    });

    return {
        process,
        copyOutput,
        renderUI
    };

})();

// Gắn vào window để gọi từ HTML
window.SmartTestFormatter = SmartTestFormatter;
