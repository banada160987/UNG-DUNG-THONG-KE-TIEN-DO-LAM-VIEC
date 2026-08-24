import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType } from "docx";
import { saveAs } from "file-saver";

export const generateParkingWordReport = async (allStudents, parkingData, busData) => {
  // --- 1. PREPARE DATA ---
  const totalSchoolStudents = allStudents.length > 0 ? allStudents.length : (parkingData.length + busData.length) || 1; 
  
  const registeredCodes = new Set();
  parkingData.forEach(p => {
    if (p.student_code) registeredCodes.add(p.student_code);
    else if (p.student_name) registeredCodes.add(p.student_name);
  });
  busData.forEach(b => {
    if (b.student_code) registeredCodes.add(b.student_code);
    else if (b.student_name) registeredCodes.add(b.student_name);
  });

  const totalRegistered = registeredCodes.size;
  const totalUnregistered = totalSchoolStudents - totalRegistered;
  const registrationRate = ((totalRegistered / totalSchoolStudents) * 100).toFixed(1);

  // --- 2. THỐNG KÊ LOẠI PHƯƠNG TIỆN ---
  const vehicleStats = {
    'Xe máy điện': 0,
    'Xe máy 50cc': 0,
    'Xe máy >50cc': 0,
    'Khác': 0
  };

  parkingData.forEach(p => {
    const vType = p.vehicle_type;
    if (vehicleStats[vType] !== undefined) {
      vehicleStats[vType]++;
    } else if (vType && vType.includes('điện')) {
      vehicleStats['Xe máy điện']++;
    } else if (vType && vType.includes('50cc')) {
      vehicleStats['Xe máy 50cc']++;
    } else {
      vehicleStats['Khác']++;
    }
  });

  const totalBus = busData.length;

  // --- 3. THỐNG KÊ THEO LỚP & KHỐI ---
  const classStats = {};
  const gradeStats = {
    '10': { total: 0, registered: 0, parking: 0, bus: 0 },
    '11': { total: 0, registered: 0, parking: 0, bus: 0 },
    '12': { total: 0, registered: 0, parking: 0, bus: 0 }
  };

  const getGradeFromClass = (className) => {
    if (!className) return null;
    const match = className.match(/(10|11|12)/);
    return match ? match[0] : null;
  };

  allStudents.forEach(s => {
    const cName = s.student_class ? s.student_class.trim() : 'Khác';
    if (!classStats[cName]) {
      classStats[cName] = { size: 0, parking: 0, bus: 0, registeredSet: new Set() };
    }
    classStats[cName].size++;

    const grade = getGradeFromClass(cName);
    if (grade && gradeStats[grade]) {
      gradeStats[grade].total++;
    }
  });

  parkingData.forEach(p => {
    const cName = p.student_class ? p.student_class.trim() : 'Khác';
    if (!classStats[cName]) classStats[cName] = { size: 0, parking: 0, bus: 0, registeredSet: new Set() };
    classStats[cName].parking++;
    const key = p.student_code || p.student_name || Math.random().toString();
    classStats[cName].registeredSet.add(key);

    const grade = getGradeFromClass(cName);
    if (grade && gradeStats[grade]) {
      gradeStats[grade].parking++;
      gradeStats[grade].registered++;
    }
  });

  busData.forEach(b => {
    const cName = b.student_class ? b.student_class.trim() : 'Khác';
    if (!classStats[cName]) classStats[cName] = { size: 0, parking: 0, bus: 0, registeredSet: new Set() };
    classStats[cName].bus++;
    const key = b.student_code || b.student_name || Math.random().toString();
    classStats[cName].registeredSet.add(key);

    const grade = getGradeFromClass(cName);
    if (grade && gradeStats[grade]) {
      gradeStats[grade].bus++;
    }
  });

  const classDataArray = Object.keys(classStats).map(cName => {
    const c = classStats[cName];
    const finalSize = Math.max(c.size, c.registeredSet.size); 
    return {
      name: cName,
      size: finalSize,
      registered: c.registeredSet.size,
      parking: c.parking,
      bus: c.bus
    };
  }).filter(c => c.name !== 'Khác').sort((a, b) => a.name.localeCompare(b.name));

  // --- 4. THỐNG KÊ XE BUÝT ---
  let bus1Way = 0;
  let bus2Way = 0;
  const distanceGroups = {
    under3: 0,
    from3to5: 0,
    from5to10: 0,
    over10: 0
  };

  busData.forEach(b => {
    if (b.route_type === '1-way') bus1Way++;
    else bus2Way++;

    const dist = parseFloat(b.distance_km) || 0;
    if (dist < 3) distanceGroups.under3++;
    else if (dist <= 5) distanceGroups.from3to5++;
    else if (dist <= 10) distanceGroups.from5to10++;
    else distanceGroups.over10++;
  });


  // --- HELPERS THIẾT KẾ DOCX ---
  const createParagraph = (text, opts = {}) => {
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 120, after: 120, line: 360 },
      indent: { firstLine: 720 },
      children: [
        new TextRun({ text: text, font: "Times New Roman", size: 28, ...opts }) 
      ]
    });
  };

  const createHeading = (text) => {
    return new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({ text: text, font: "Times New Roman", size: 28, bold: true })
      ]
    });
  };

  const createTable = (headers, rowsData) => {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
        insideVertical: { style: BorderStyle.SINGLE, size: 1 },
      },
      rows: [
        new TableRow({
          children: headers.map(h => new TableCell({
            padding: { top: 100, bottom: 100, left: 100, right: 100 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: h, font: "Times New Roman", size: 24, bold: true })]
              })
            ]
          }))
        }),
        ...rowsData.map(row => new TableRow({
          children: row.map((cellText, idx) => new TableCell({
            padding: { top: 100, bottom: 100, left: 100, right: 100 },
            children: [
              new Paragraph({
                alignment: idx === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
                children: [new TextRun({ text: cellText.toString(), font: "Times New Roman", size: 24 })]
              })
            ]
          }))
        }))
      ]
    });
  };

  // --- TẠO TÀI LIỆU ---
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, right: 850, bottom: 1134, left: 1701 } 
          }
        },
        children: [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SỞ GIÁO DỤC VÀ ĐÀO TẠO", font: "Times New Roman", size: 24 })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "TRƯỜNG THPT CAO BÁ QUÁT", font: "Times New Roman", size: 26, bold: true })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "----------------", font: "Times New Roman", size: 24 })] }),
                    ]
                  }),
                  new TableCell({
                    width: { size: 60, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", font: "Times New Roman", size: 26, bold: true })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", font: "Times New Roman", size: 28, bold: true })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "-----------------------", font: "Times New Roman", size: 24 })] }),
                    ]
                  })
                ]
              })
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "BÁO CÁO", font: "Times New Roman", size: 28, bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [new TextRun({ text: "Tổng kết công tác đăng ký phương tiện di chuyển của học sinh", font: "Times New Roman", size: 28, bold: true })],
          }),

          createParagraph("Căn cứ Kế hoạch tổ chức phân luồng và quản lý an toàn giao thông của Trường THPT Cao Bá Quát;"),
          createParagraph(`Trường THPT Cao Bá Quát báo cáo kết quả tổ chức đăng ký phương tiện di chuyển của học sinh với những số liệu cụ thể như sau:`),

          createHeading("1. Mục đích và tình hình triển khai đăng ký"),
          createParagraph(`- Tổng số học sinh thuộc diện khảo sát: ${totalSchoolStudents} học sinh.`),
          createParagraph(`- Tổng số học sinh đã hoàn thành khai báo: ${totalRegistered} học sinh, đạt tỷ lệ ${registrationRate}%.`),
          createParagraph(`- Tổng số học sinh chưa thực hiện khai báo (Mặc định được phân loại: Đi bộ/Xe đạp/Phụ huynh đưa đón): ${totalUnregistered} học sinh.`),
          createParagraph(`- Hình thức đăng ký: Trực tuyến 100% qua Cổng thông tin Nhà trường.`),

          createHeading("2. Thống kê phương tiện học sinh sử dụng đến trường"),
          createTable(
            ["Loại phương tiện", "Số lượng", "Tỷ lệ (%)"],
            [
              ["Xe máy điện", vehicleStats['Xe máy điện'], totalSchoolStudents > 0 ? ((vehicleStats['Xe máy điện'] / totalSchoolStudents) * 100).toFixed(1) : 0],
              ["Xe máy 50cc", vehicleStats['Xe máy 50cc'], totalSchoolStudents > 0 ? ((vehicleStats['Xe máy 50cc'] / totalSchoolStudents) * 100).toFixed(1) : 0],
              ["Xe máy >50cc (Cần GPLX)", vehicleStats['Xe máy >50cc'], totalSchoolStudents > 0 ? ((vehicleStats['Xe máy >50cc'] / totalSchoolStudents) * 100).toFixed(1) : 0],
              ["Xe đưa đón của trường", totalBus, totalSchoolStudents > 0 ? ((totalBus / totalSchoolStudents) * 100).toFixed(1) : 0],
              ["Khác (Đi bộ, Xe đạp, Phụ huynh đưa đón)", totalUnregistered, totalSchoolStudents > 0 ? ((totalUnregistered / totalSchoolStudents) * 100).toFixed(1) : 0],
            ]
          ),
          createParagraph(`Đánh giá chung: Phần lớn học sinh đã khai báo sử dụng phương tiện cá nhân, đặc biệt là xe máy điện và xe máy 50cc. Nhà trường cần có biện pháp bố trí bãi đỗ xe phù hợp.`),

          createHeading("3. Thống kê theo khối, lớp"),
          createParagraph(`- Khối 10: Tổng ${gradeStats['10'].total} HS. Đã đăng ký xe cá nhân: ${gradeStats['10'].parking}, Đăng ký xe buýt: ${gradeStats['10'].bus}.`),
          createParagraph(`- Khối 11: Tổng ${gradeStats['11'].total} HS. Đã đăng ký xe cá nhân: ${gradeStats['11'].parking}, Đăng ký xe buýt: ${gradeStats['11'].bus}.`),
          createParagraph(`- Khối 12: Tổng ${gradeStats['12'].total} HS. Đã đăng ký xe cá nhân: ${gradeStats['12'].parking}, Đăng ký xe buýt: ${gradeStats['12'].bus}.`),
          new Paragraph({ text: "Chi tiết các lớp:", font: "Times New Roman", size: 28, spacing: { before: 200, after: 100 } }),
          createTable(
            ["Lớp", "Sĩ số", "Đã khai báo", "Xe cá nhân", "Xe đưa đón"],
            classDataArray.map(c => [c.name, c.size, c.registered, c.parking, c.bus])
          ),

          createHeading("4. Đánh giá tình hình sử dụng phương tiện và an toàn giao thông"),
          createParagraph(`- Số lượng học sinh sử dụng xe máy điện: ${vehicleStats['Xe máy điện']} học sinh.`),
          createParagraph(`- Số lượng học sinh sử dụng xe máy 50cc: ${vehicleStats['Xe máy 50cc']} học sinh.`),
          createParagraph(`- Đặc biệt lưu ý: Có ${vehicleStats['Xe máy >50cc']} học sinh khai báo sử dụng Xe máy >50cc. Nhà trường cần tổ chức rà soát giấy phép lái xe và cam kết an toàn giao thông đối với nhóm học sinh này.`),

          createHeading("5. Thống kê nhu cầu sử dụng dịch vụ xe đưa đón"),
          createParagraph(`- Tổng số học sinh đăng ký có nhu cầu đi xe đưa đón: ${totalBus} học sinh (Chiếm tỷ lệ ${((totalBus / totalSchoolStudents) * 100).toFixed(1)}%).`),
          createTable(
            ["Hình thức sử dụng", "Số học sinh", "Tỷ lệ (%)"],
            [
              ["Chỉ đi 1 chiều (Đưa đến hoặc Đón về)", bus1Way, totalBus > 0 ? ((bus1Way / totalBus) * 100).toFixed(1) : 0],
              ["Cả 2 chiều (Đưa và Đón)", bus2Way, totalBus > 0 ? ((bus2Way / totalBus) * 100).toFixed(1) : 0],
            ]
          ),

          createHeading("6. Phân bố nhu cầu theo khu vực và tuyến đường (Xe buýt)"),
          createTable(
            ["Khoảng cách (Ước tính)", "Số lượng học sinh", "Tỷ lệ (%)"],
            [
              ["Dưới 3 km", distanceGroups.under3, totalBus > 0 ? ((distanceGroups.under3 / totalBus) * 100).toFixed(1) : 0],
              ["Từ 3 - 5 km", distanceGroups.from3to5, totalBus > 0 ? ((distanceGroups.from3to5 / totalBus) * 100).toFixed(1) : 0],
              ["Từ 5 - 10 km", distanceGroups.from5to10, totalBus > 0 ? ((distanceGroups.from5to10 / totalBus) * 100).toFixed(1) : 0],
              ["Trên 10 km", distanceGroups.over10, totalBus > 0 ? ((distanceGroups.over10 / totalBus) * 100).toFixed(1) : 0],
            ]
          ),
          
          createHeading("7. Đánh giá khả năng triển khai dịch vụ đưa đón"),
          createParagraph("- Thuận lợi: Ứng dụng quản lý giúp học sinh khai báo chính xác địa điểm và nhu cầu, hỗ trợ trực tiếp công tác xếp tuyến xe buýt."),
          createParagraph("- Khó khăn: Khoảng cách phân bố rải rác. Cần khảo sát thêm số lượng học sinh có lộ trình di chuyển chung tuyến đường trục chính."),

          createHeading("8. Những tồn tại, khó khăn"),
          createParagraph("- Vẫn còn một số lớp chưa hoàn thành 100% việc khai báo phương tiện di chuyển trên hệ thống trực tuyến."),
          createParagraph("- Một số học sinh sử dụng phương tiện phân khối lớn cần có xác nhận chặt chẽ hơn từ phụ huynh và lực lượng CSGT."),

          createHeading("9. Kiến nghị, đề xuất"),
          createParagraph("- Yêu cầu các giáo viên chủ nhiệm đôn đốc các em học sinh thuộc nhóm Chưa khai báo tiếp tục cập nhật thông tin trong thời gian sớm nhất."),
          createParagraph("- Cần tổ chức các buổi tuyên truyền chuyên đề về an toàn giao thông cho học sinh sử dụng xe đạp điện, xe máy điện."),

          createHeading("10. Kết luận"),
          createParagraph("Nhìn chung, công tác thu thập dữ liệu đăng ký xe và xe đưa đón đã được thực hiện tương đối tốt. Nhà trường sẽ sử dụng dữ liệu này làm cơ sở vững chắc cho việc cấp thẻ giữ xe thông minh và xếp tuyến xe buýt hợp lý trong năm học mới."),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ text: "" })]
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Hà Nội, ngày ... tháng ... năm 2026", font: "Times New Roman", size: 28, italics: true })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "NGƯỜI LẬP BÁO CÁO", font: "Times New Roman", size: 28, bold: true })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(Ký, ghi rõ họ tên)", font: "Times New Roman", size: 24, italics: true })] }),
                      new Paragraph({ text: "", spacing: { after: 1200 } }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Ban Giám Hiệu / Ban Tổ Chức", font: "Times New Roman", size: 28, bold: true })] }),
                    ]
                  })
                ]
              })
            ]
          })
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "Bao_Cao_Dang_Ky_Phuong_Tien_Di_Chuyen.docx");
};
