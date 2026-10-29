/**
 * DỊCH VỤ QUẢN LÝ NGÂN HÀNG CÂU HỎI THEO CẤU TRÚC CÂY THƯ MỤC CHƯƠNG - BÀI
 * Phục vụ các Tổ Chuyên môn Trường THPT Cao Bá Quát - GDPT 2018 (2025 - 2028)
 * 
 * Cấu trúc phân cấp 4 tầng:
 * 1. Môn học & Khối lớp
 * 2. Chương / Chủ đề lớn
 * 3. Bài học / Đơn vị kiến thức
 * 4. Mức độ nhận thức (NB, TH, VD, VDC) & Hình thức thi:
 *    - Phần I: Trắc nghiệm 4 lựa chọn (A, B, C, D)
 *    - Phần II: Trắc nghiệm Đúng / Sai 4 ý lũy tiến
 *    - Phần III: Trắc nghiệm Trả lời ngắn
 *    - Phần Tự luận: Câu hỏi tự luận / Bài tập tự luận có Bareme chấm điểm chi tiết
 */

import { DualSupabaseService } from '../lib/supabase';

const STORAGE_KEY_TREE = 'cbq_question_bank_tree_v2';
const STORAGE_KEY_QUESTIONS = 'cbq_question_bank_items_v2';

// CÂY THƯ MỤC MẪU CHUẨN GDPT 2018 CHO TẤT CẢ CÁC MÔN HỌC BẬC THPT
export const DEFAULT_TAXONOMY_TREE = [
  // 1. MÔN GIÁO DỤC KINH TẾ & PHÁP LUẬT (GDKT & PL) - KHỐI 12
  {
    id: 'gdktpl_12',
    subject: 'GDKT & PL',
    grade: 'Khối 12',
    chapters: [
      {
        id: 'gdktpl_12_c1',
        title: 'Chủ đề 1: Tăng trưởng và phát triển kinh tế',
        lessons: [
          { id: 'gdktpl_12_c1_l1', title: 'Bài 1: Tăng trưởng và phát triển kinh tế' },
          { id: 'gdktpl_12_c1_l2', title: 'Bài 2: Hội nhập kinh tế quốc tế và phát triển bền vững' }
        ]
      },
      {
        id: 'gdktpl_12_c2',
        title: 'Chủ đề 2: Lao động và an sinh xã hội',
        lessons: [
          { id: 'gdktpl_12_c2_l1', title: 'Bài 3: Bảo hiểm và an sinh xã hội' },
          { id: 'gdktpl_12_c2_l2', title: 'Bài 4: Quản lý thu, chi và tài chính gia đình' }
        ]
      },
      {
        id: 'gdktpl_12_c3',
        title: 'Chủ đề 3: Quyền và nghĩa vụ của công dân về kinh tế',
        lessons: [
          { id: 'gdktpl_12_c3_l1', title: 'Bài 5: Quyền và nghĩa vụ của công dân trong kinh doanh' },
          { id: 'gdktpl_12_c3_l2', title: 'Bài 6: Quyền và nghĩa vụ của công dân về nộp thuế' },
          { id: 'gdktpl_12_c3_l3', title: 'Bài 7: Quyền sở hữu tài sản và nghĩa vụ tôn trọng tài sản người khác' }
        ]
      },
      {
        id: 'gdktpl_12_c4',
        title: 'Chủ đề 4: Quyền và nghĩa vụ của công dân trong đời sống xã hội',
        lessons: [
          { id: 'gdktpl_12_c4_l1', title: 'Bài 8: Quyền và nghĩa vụ của công dân về bảo vệ môi trường' },
          { id: 'gdktpl_12_c4_l2', title: 'Bài 9: Quyền và nghĩa vụ của công dân trong hôn nhân và gia đình' },
          { id: 'gdktpl_12_c4_l3', title: 'Bài 10: Quyền con người và pháp luật quốc tế' }
        ]
      }
    ]
  },

  // 2. MÔN TOÁN HỌC - KHỐI 12
  {
    id: 'math_12',
    subject: 'Toán',
    grade: 'Khối 12',
    chapters: [
      {
        id: 'math_12_c1',
        title: 'Chương I: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
        lessons: [
          { id: 'math_12_c1_l1', title: 'Bài 1: Tính đơn điệu và cực trị của hàm số' },
          { id: 'math_12_c1_l2', title: 'Bài 2: Giá trị lớn nhất và giá trị nhỏ nhất của hàm số' },
          { id: 'math_12_c1_l3', title: 'Bài 3: Đường tiệm cận của đồ thị hàm số' },
          { id: 'math_12_c1_l4', title: 'Bài 4: Khảo sát sự biến thiên và vẽ đồ thị hàm số' }
        ]
      },
      {
        id: 'math_12_c2',
        title: 'Chương II: Tọa độ của vectơ trong không gian Oxyz',
        lessons: [
          { id: 'math_12_c2_l1', title: 'Bài 1: Vectơ và các phép toán trong không gian' },
          { id: 'math_12_c2_l2', title: 'Bài 2: Tọa độ của vectơ trong không gian Oxyz' },
          { id: 'math_12_c2_l3', title: 'Bài 3: Biểu thức tọa độ của các phép toán vectơ' }
        ]
      },
      {
        id: 'math_12_c3',
        title: 'Chương III: Các số đặc trưng đo mức độ phân tán cho mẫu số liệu ghép nhóm',
        lessons: [
          { id: 'math_12_c3_l1', title: 'Bài 1: Khoảng biến thiên và khoảng tứ phân vị' },
          { id: 'math_12_c3_l2', title: 'Bài 2: Phương sai và độ lệch chuẩn' }
        ]
      },
      {
        id: 'math_12_c4',
        title: 'Chương IV: Nguyên hàm, tích phân và ứng dụng thực tế',
        lessons: [
          { id: 'math_12_c4_l1', title: 'Bài 1: Khái niệm nguyên hàm và tính chất' },
          { id: 'math_12_c4_l2', title: 'Bài 2: Tích phân và ứng dụng hình học tính diện tích, thể tích' }
        ]
      },
      {
        id: 'math_12_c5',
        title: 'Chương V: Phương pháp tọa độ trong không gian (Mặt phẳng, Đường thẳng, Mặt cầu)',
        lessons: [
          { id: 'math_12_c5_l1', title: 'Bài 1: Phương trình mặt phẳng' },
          { id: 'math_12_c5_l2', title: 'Bài 2: Phương trình đường thẳng trong không gian' },
          { id: 'math_12_c5_l3', title: 'Bài 3: Phương trình mặt cầu' }
        ]
      },
      {
        id: 'math_12_c6',
        title: 'Chương VI: Xác suất có điều kiện và công thức Bayes',
        lessons: [
          { id: 'math_12_c6_l1', title: 'Bài 1: Xác suất có điều kiện' },
          { id: 'math_12_c6_l2', title: 'Bài 2: Công thức xác suất toàn phần và công thức Bayes' }
        ]
      }
    ]
  },

  // 3. MÔN TOÁN HỌC - KHỐI 11
  {
    id: 'math_11',
    subject: 'Toán',
    grade: 'Khối 11',
    chapters: [
      {
        id: 'math_11_c1',
        title: 'Chương I: Hàm số lượng giác và phương trình lượng giác',
        lessons: [
          { id: 'math_11_c1_l1', title: 'Bài 1: Góc lượng giác và giá trị lượng giác của góc lượng giác' },
          { id: 'math_11_c1_l2', title: 'Bài 2: Các công thức lượng giác' },
          { id: 'math_11_c1_l3', title: 'Bài 3: Hàm số lượng giác và đồ thị' },
          { id: 'math_11_c1_l4', title: 'Bài 4: Phương trình lượng giác cơ bản' }
        ]
      },
      {
        id: 'math_11_c2',
        title: 'Chương II: Dãy số, Cấp số cộng và Cấp số nhân',
        lessons: [
          { id: 'math_11_c2_l1', title: 'Bài 1: Dãy số và số hạng tổng quát' },
          { id: 'math_11_c2_l2', title: 'Bài 2: Cấp số cộng và công sai' },
          { id: 'math_11_c2_l3', title: 'Bài 3: Cấp số nhân và công bội' }
        ]
      },
      {
        id: 'math_11_c3',
        title: 'Chương III: Giới hạn và Hàm số liên tục',
        lessons: [
          { id: 'math_11_c3_l1', title: 'Bài 1: Giới hạn của dãy số' },
          { id: 'math_11_c3_l2', title: 'Bài 2: Giới hạn của hàm số' },
          { id: 'math_11_c3_l3', title: 'Bài 3: Hàm số liên tục' }
        ]
      },
      {
        id: 'math_11_c4',
        title: 'Chương IV: Đường thẳng và mặt phẳng trong không gian. Quan hệ song song',
        lessons: [
          { id: 'math_11_c4_l1', title: 'Bài 1: Điểm, đường thẳng và mặt phẳng trong không gian' },
          { id: 'math_11_c4_l2', title: 'Bài 2: Hai đường thẳng song song' },
          { id: 'math_11_c4_l3', title: 'Bài 3: Đường thẳng và mặt phẳng song song' }
        ]
      }
    ]
  },

  // 4. MÔN VẬT LÍ - KHỐI 12
  {
    id: 'physics_12',
    subject: 'Vật lí',
    grade: 'Khối 12',
    chapters: [
      {
        id: 'phy_12_c1',
        title: 'Chương I: Vật lí nhiệt',
        lessons: [
          { id: 'phy_12_c1_l1', title: 'Bài 1: Cấu trúc của chất và sự chuyển thể' },
          { id: 'phy_12_c1_l2', title: 'Bài 2: Nội năng và định luật I của nhiệt động lực học' },
          { id: 'phy_12_c1_l3', title: 'Bài 3: Nhiệt dung riêng và nhiệt nóng chảy riêng' },
          { id: 'phy_12_c1_l4', title: 'Bài 4: Nhiệt hóa hơi riêng' }
        ]
      },
      {
        id: 'phy_12_c2',
        title: 'Chương II: Khí lí tưởng',
        lessons: [
          { id: 'phy_12_c2_l1', title: 'Bài 1: Mô hình động học phân tử chất khí' },
          { id: 'phy_12_c2_l2', title: 'Bài 2: Định luật Boyle và định luật Charles' },
          { id: 'phy_12_c2_l3', title: 'Bài 3: Phương trình trạng thái của khí lí tưởng' }
        ]
      },
      {
        id: 'phy_12_c3',
        title: 'Chương III: Từ trường',
        lessons: [
          { id: 'phy_12_c3_l1', title: 'Bài 1: Từ trường và cảm ứng từ' },
          { id: 'phy_12_c3_l2', title: 'Bài 2: Lực từ tác dụng lên đoạn dây dẫn mang dòng điện' },
          { id: 'phy_12_c3_l3', title: 'Bài 3: Hiện tượng cảm ứng điện từ và định luật Faraday' }
        ]
      },
      {
        id: 'phy_12_c4',
        title: 'Chương IV: Vật lí hạt nhân',
        lessons: [
          { id: 'phy_12_c4_l1', title: 'Bài 1: Cấu tạo hạt nhân và năng lượng liên kết' },
          { id: 'phy_12_c4_l2', title: 'Bài 2: Hiện tượng phóng xạ và an toàn phóng xạ' },
          { id: 'phy_12_c4_l3', title: 'Bài 3: Phản ứng phân hạch và phản ứng nhiệt hạch' }
        ]
      }
    ]
  },

  // 5. MÔN HÓA HỌC - KHỐI 12
  {
    id: 'chemistry_12',
    subject: 'Hóa học',
    grade: 'Khối 12',
    chapters: [
      {
        id: 'chem_12_c1',
        title: 'Chương I: Ester - Lipid',
        lessons: [
          { id: 'chem_12_c1_l1', title: 'Bài 1: Ester và phản ứng xà phòng hóa' },
          { id: 'chem_12_c1_l2', title: 'Bài 2: Lipid, chất béo và acid béo Omega' },
          { id: 'chem_12_c1_l3', title: 'Bài 3: Xà phòng và chất giặt rửa tổng hợp' }
        ]
      },
      {
        id: 'chem_12_c2',
        title: 'Chương II: Carbohydrate',
        lessons: [
          { id: 'chem_12_c2_l1', title: 'Bài 1: Glucose và Fructose' },
          { id: 'chem_12_c2_l2', title: 'Bài 2: Saccharose và Maltose' },
          { id: 'chem_12_c2_l3', title: 'Bài 3: Tinh bột và Cellulose' }
        ]
      },
      {
        id: 'chem_12_c3',
        title: 'Chương III: Hợp chất chứa Nitrogen (Amine - Amino acid - Peptide - Protein)',
        lessons: [
          { id: 'chem_12_c3_l1', title: 'Bài 1: Amine và tính base' },
          { id: 'chem_12_c3_l2', title: 'Bài 2: Amino acid và điểm đẳng điện' },
          { id: 'chem_12_c3_l3', title: 'Bài 3: Peptide, protein và enzyme' }
        ]
      },
      {
        id: 'chem_12_c4',
        title: 'Chương IV: Pin điện và điện phân',
        lessons: [
          { id: 'chem_12_c4_l1', title: 'Bài 1: Thế điện cực chuẩn và pin Galvani' },
          { id: 'chem_12_c4_l2', title: 'Bài 2: Điện phân dung dịch và định luật Faraday' }
        ]
      }
    ]
  },

  // 6. MÔN LỊCH SỬ - KHỐI 12
  {
    id: 'history_12',
    subject: 'Lịch sử',
    grade: 'Khối 12',
    chapters: [
      {
        id: 'his_12_c1',
        title: 'Chủ đề 1: Thế giới trong và sau Chiến tranh lạnh',
        lessons: [
          { id: 'his_12_c1_l1', title: 'Bài 1: Trật tự thế giới hai cực I-an-ta và sự sụp đổ' },
          { id: 'his_12_c1_l2', title: 'Bài 2: Trật tự thế giới đa cực sau Chiến tranh lạnh' }
        ]
      },
      {
        id: 'his_12_c2',
        title: 'Chủ đề 2: ASEAN: Những chặng đường lịch sử',
        lessons: [
          { id: 'his_12_c2_l1', title: 'Bài 3: Quá trình hình thành và phát triển của ASEAN' },
          { id: 'his_12_c2_l2', title: 'Bài 4: Cộng đồng ASEAN: Tầm nhìn và triển vọng' }
        ]
      },
      {
        id: 'his_12_c3',
        title: 'Chủ đề 3: Cách mạng tháng Tám 1945 và cuộc kháng chiến bảo vệ Tổ quốc (1945 - 1975)',
        lessons: [
          { id: 'his_12_c3_l1', title: 'Bài 5: Cách mạng tháng Tám năm 1945 và sự ra đời nước VNDCCH' },
          { id: 'his_12_c3_l2', title: 'Bài 6: Cuộc kháng chiến chống thực dân Pháp (1945 - 1954)' },
          { id: 'his_12_c3_l3', title: 'Bài 7: Cuộc kháng chiến chống Mỹ, cứu nước (1954 - 1975)' }
        ]
      },
      {
        id: 'his_12_c4',
        title: 'Chủ đề 4: Công cuộc Đổi mới ở Việt Nam từ năm 1986 đến nay',
        lessons: [
          { id: 'his_12_c4_l1', title: 'Bài 8: Bối cảnh lịch sử và chủ trương Đổi mới' },
          { id: 'his_12_c4_l2', title: 'Bài 9: Thành tựu và bài học kinh nghiệm của công cuộc Đổi mới' }
        ]
      }
    ]
  },

  // 7. MÔN ĐỊA LÍ - KHỐI 12
  {
    id: 'geo_12',
    subject: 'Địa lí',
    grade: 'Khối 12',
    chapters: [
      {
        id: 'geo_12_c1',
        title: 'Chủ đề 1: Địa lí tự nhiên Việt Nam',
        lessons: [
          { id: 'geo_12_c1_l1', title: 'Bài 1: Vị trí địa lí và phạm vi lãnh thổ' },
          { id: 'geo_12_c1_l2', title: 'Bài 2: Thiên nhiên nhiệt đới ẩm gió mùa và cảnh quan' }
        ]
      },
      {
        id: 'geo_12_c2',
        title: 'Chủ đề 2: Địa lí các ngành kinh tế',
        lessons: [
          { id: 'geo_12_c2_l1', title: 'Bài 3: Địa lí ngành nông nghiệp, lâm nghiệp và thủy sản' },
          { id: 'geo_12_c2_l2', title: 'Bài 4: Địa lí ngành công nghiệp và phát triển năng lượng xanh' },
          { id: 'geo_12_c2_l3', title: 'Bài 5: Địa lí ngành dịch vụ, giao thông và du lịch' }
        ]
      },
      {
        id: 'geo_12_c3',
        title: 'Chủ đề 3: Các vùng kinh tế trọng điểm và biển đảo',
        lessons: [
          { id: 'geo_12_c3_l1', title: 'Bài 6: Khai thác thế mạnh ở vùng Tây Nguyên' },
          { id: 'geo_12_c3_l2', title: 'Bài 7: Phát triển kinh tế biển và bảo vệ chủ quyền biển đảo' }
        ]
      }
    ]
  },

  // 8. MÔN SINH HỌC - KHỐI 12
  {
    id: 'bio_12',
    subject: 'Sinh học',
    grade: 'Khối 12',
    chapters: [
      {
        id: 'bio_12_c1',
        title: 'Chương I: Di truyền phân tử và di truyền nhiễm sắc thể',
        lessons: [
          { id: 'bio_12_c1_l1', title: 'Bài 1: DNA, tái bản DNA và phiên mã' },
          { id: 'bio_12_c1_l2', title: 'Bài 2: Dịch mã, điều hòa biểu hiện gen và đột biến gen' },
          { id: 'bio_12_c1_l3', title: 'Bài 3: Nhiễm sắc thể và đột biến nhiễm sắc thể' }
        ]
      },
      {
        id: 'bio_12_c2',
        title: 'Chương II: Các quy luật di truyền và di truyền học người',
        lessons: [
          { id: 'bio_12_c2_l1', title: 'Bài 4: Quy luật Men-đen và tương tác gen' },
          { id: 'bio_12_c2_l2', title: 'Bài 5: Di truyền liên kết giới tính và phả hệ' }
        ]
      }
    ]
  },

  // 9. MÔN TIN HỌC - KHỐI 12
  {
    id: 'cs_12',
    subject: 'Tin học',
    grade: 'Khối 12',
    chapters: [
      {
        id: 'cs_12_c1',
        title: 'Chủ đề 1: Mạng máy tính và Internet',
        lessons: [
          { id: 'cs_12_c1_l1', title: 'Bài 1: Cơ chế hoạt động của mạng Internet và giao thức TCP/IP' },
          { id: 'cs_12_c1_l2', title: 'Bài 2: An toàn thông tin và bảo mật mạng không dây' }
        ]
      },
      {
        id: 'cs_12_c2',
        title: 'Chủ đề 2: Cơ sở dữ liệu và hệ quản trị CSDL quan hệ (SQL)',
        lessons: [
          { id: 'cs_12_c2_l1', title: 'Bài 3: Khái niệm CSDL quan hệ và khóa chính' },
          { id: 'cs_12_c2_l2', title: 'Bài 4: Truy vấn dữ liệu bằng câu lệnh SQL' }
        ]
      },
      {
        id: 'cs_12_c3',
        title: 'Chủ đề 3: Lập trình Python ứng dụng và Trí tuệ nhân tạo (AI)',
        lessons: [
          { id: 'cs_12_c3_l1', title: 'Bài 5: Lập trình giải thuật và cấu trúc dữ liệu Python' },
          { id: 'cs_12_c3_l2', title: 'Bài 6: Ứng dụng AI và đạo đức trong kỷ nguyên số' }
        ]
      }
    ]
  },

  // 10. MÔN TIẾNG ANH - KHỐI 12
  {
    id: 'english_12',
    subject: 'Tiếng Anh',
    grade: 'Khối 12',
    chapters: [
      {
        id: 'eng_12_c1',
        title: 'Unit 1 - Unit 3: Life Stories & Cultural Diversity',
        lessons: [
          { id: 'eng_12_c1_l1', title: 'Lesson 1: Phonetics (Word stress & Pronunciation)' },
          { id: 'eng_12_c1_l2', title: 'Lesson 2: Vocabulary & Collocations' },
          { id: 'eng_12_c1_l3', title: 'Lesson 3: Grammar (Past Tenses & Articles)' }
        ]
      },
      {
        id: 'eng_12_c2',
        title: 'Unit 4 - Unit 6: Urbanisation & The World of Work',
        lessons: [
          { id: 'eng_12_c2_l1', title: 'Lesson 1: Reading Comprehension (Skimming & Scanning)' },
          { id: 'eng_12_c2_l2', title: 'Lesson 2: Conditional Sentences & Inversion' },
          { id: 'eng_12_c2_l3', title: 'Lesson 3: Sentence Transformation & Error Detection' }
        ]
      }
    ]
  },

  // 11. MÔN NGỮ VĂN - KHỐI 12
  {
    id: 'lit_12',
    subject: 'Ngữ văn',
    grade: 'Khối 12',
    chapters: [
      {
        id: 'lit_12_c1',
        title: 'Chủ đề 1: Đọc hiểu văn bản văn học (Truyện ngắn và Tiểu thuyết hiện đại)',
        lessons: [
          { id: 'lit_12_c1_l1', title: 'Bài 1: Phong cách ngôn ngữ và biện pháp tu từ trong tác phẩm' },
          { id: 'lit_12_c1_l2', title: 'Bài 2: Phân tích tâm lý nhân vật và thông điệp tư tưởng' }
        ]
      },
      {
        id: 'lit_12_c2',
        title: 'Chủ đề 2: Đọc hiểu văn bản thông tin và văn bản nghị luận thời sự',
        lessons: [
          { id: 'lit_12_c2_l1', title: 'Bài 1: Nhận biết luận điểm, luận cứ và cách lập luận' },
          { id: 'lit_12_c2_l2', title: 'Bài 2: Đánh giá quan điểm của tác giả và rút ra bài học' }
        ]
      },
      {
        id: 'lit_12_c3',
        title: 'Chủ đề 3: Kỹ năng viết nghị luận xã hội và nghị luận văn học',
        lessons: [
          { id: 'lit_12_c3_l1', title: 'Bài 1: Viết đoạn văn nghị luận xã hội (khoảng 200 chữ)' },
          { id: 'lit_12_c3_l2', title: 'Bài 2: Viết bài văn nghị luận so sánh, đánh giá tác phẩm' }
        ]
      }
    ]
  }
];

// BỘ CÂU HỎI MẪU PHONG PHÚ: TRẮC NGHIỆM PHẦN I, II, III & CÂU HỎI TỰ LUẬN
export const INITIAL_BANK_QUESTIONS = [
  // ==================== 1. MÔN GDKT & PL (KHỐI 12) ====================
  {
    id: 'bank_gdktpl_01',
    subject: 'GDKT & PL',
    grade: 'Khối 12',
    chapterId: 'gdktpl_12_c1',
    lessonId: 'gdktpl_12_c1_l1',
    level: 'Nhận biết',
    part: 'part1',
    content: 'Tăng trưởng kinh tế là sự gia tăng về quy mô sản lượng của một nền kinh tế trong một thời kỳ nhất định, thường được đo lường chủ yếu bằng chỉ tiêu nào sau đây?',
    options: ['Tổng sản phẩm quốc nội (GDP) hoặc Tổng thu nhập quốc gia (GNI)', 'Chỉ số phát triển con người (HDI)', 'Tỷ lệ người dân tham gia bảo hiểm y tế', 'Mức độ hài lòng về chất lượng môi trường'],
    correctAnswerIndex: 0,
    explanation: 'Tăng trưởng kinh tế phản ánh sự gia tăng về lượng của nền kinh tế, đo bằng tốc độ tăng GDP hoặc GNI.',
    author: 'Tổ Sử - Địa - GDKT&PL',
    createdAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'bank_gdktpl_02',
    subject: 'GDKT & PL',
    grade: 'Khối 12',
    chapterId: 'gdktpl_12_c1',
    lessonId: 'gdktpl_12_c1_l1',
    level: 'Thông hiểu',
    part: 'part2',
    content: 'Doanh nghiệp tư nhân H tại Đắk Lắk mở rộng sản xuất cà phê xuất khẩu. Xét tính Đúng / Sai của các mệnh đề sau:',
    subItems: [
      { key: 'a', text: 'Doanh nghiệp H có quyền tự do lựa chọn ngành nghề kinh doanh mà pháp luật không cấm.', isTrue: true },
      { key: 'b', text: 'Doanh nghiệp H có nghĩa vụ nộp thuế thu nhập doanh nghiệp đầy đủ theo quy định của Luật Thuế.', isTrue: true },
      { key: 'c', text: 'Doanh nghiệp H được phép xả chất thải chưa qua xử lý ra môi trường tự nhiên để tiết kiệm chi phí sản xuất.', isTrue: false },
      { key: 'd', text: 'Tăng trưởng kinh tế gắn liền với bảo vệ môi trường là biểu hiện của phát triển kinh tế bền vững.', isTrue: true }
    ],
    explanation: 'Mệnh đề c sai vì pháp luật bảo vệ môi trường nghiêm cấm hành vi xả thải chưa qua xử lý.',
    author: 'Tổ Sử - Địa - GDKT&PL',
    createdAt: '2026-09-01T09:00:00Z'
  },
  // CÂU HỎI TỰ LUẬN MÔN GDKT & PL
  {
    id: 'bank_gdktpl_essay_01',
    subject: 'GDKT & PL',
    grade: 'Khối 12',
    chapterId: 'gdktpl_12_c3',
    lessonId: 'gdktpl_12_c3_l1',
    level: 'Vận dụng',
    part: 'essay',
    title: 'Câu hỏi Tự luận (2.0 điểm) - Xử lý tình huống pháp luật trong kinh doanh',
    content: 'Anh K dự định mở một xưởng chế biến nông sản tại địa phương. Bạn của anh K khuyên: "Cứ hoạt động trước đi, khi nào cơ quan nhà nước đến kiểm tra thì mới làm thủ tục đăng ký kinh doanh và kê khai nộp thuế để đỡ tốn kém ban đầu".\n\na) Căn cứ vào quy định pháp luật về quyền và nghĩa vụ của công dân trong kinh doanh, anh/chị hãy nhận xét lời khuyên của người bạn anh K.\nb) Nếu là anh K, anh/chị sẽ thực hiện các bước pháp lý như thế nào trước khi xưởng chế biến đi vào hoạt động chính thức?',
    maxScore: 2.0,
    rubric: [
      { criteria: 'Khẳng định lời khuyên của người bạn là sai và vi phạm pháp luật (Kinh doanh không đăng ký, trốn thuế)', score: 0.5 },
      { criteria: 'Nêu rõ nghĩa vụ đăng ký kinh doanh và chấp hành pháp luật về thuế, bảo vệ môi trường', score: 0.5 },
      { criteria: 'Đề xuất hành vi đúng đắn: Lập hồ sơ đăng ký kinh doanh tại cơ quan có thẩm quyền', score: 0.5 },
      { criteria: 'Thực hiện cam kết bảo vệ môi trường, an toàn vệ sinh thực phẩm và kê khai nộp thuế đầy đủ', score: 0.5 }
    ],
    explanation: 'Hướng dẫn chấm:\n- Ý a (1.0đ): Khẳng định lời khuyên sai. Mọi chủ thể khi kinh doanh đều có nghĩa vụ đăng ký kinh doanh và nộp thuế theo luật định. Hành vi kinh doanh không đăng ký là kinh doanh trái phép.\n- Ý b (1.0đ): Các bước đúng: Đăng ký thành lập hộ kinh doanh/doanh nghiệp, xin cấp phép ATTP và môi trường, mở mã số thuế và kê khai hóa đơn điện tử.',
    author: 'Tổ Sử - Địa - GDKT&PL',
    createdAt: '2026-09-02T10:00:00Z'
  },

  // ==================== 2. MÔN TOÁN HỌC (KHỐI 12) ====================
  {
    id: 'bank_m12_01',
    subject: 'Toán',
    grade: 'Khối 12',
    chapterId: 'math_12_c1',
    lessonId: 'math_12_c1_l1',
    level: 'Nhận biết',
    part: 'part1',
    content: 'Cho hàm số $y = f(x)$ có bảng xét dấu của đạo hàm $f\'(x)$ như sau. Hàm số đã cho đồng biến trên khoảng nào dưới đây?',
    options: ['$(1; 3)$', '$(-\\infty; 1)$', '$(3; +\\infty)$', '$(-\\infty; 3)$'],
    correctAnswerIndex: 0,
    explanation: 'Dựa vào bảng xét dấu, $f\'(x) > 0$ trên khoảng $(1; 3)$, do đó hàm số đồng biến trên $(1; 3)$.',
    author: 'Tổ Toán - THPT Cao Bá Quát',
    createdAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'bank_m12_02',
    subject: 'Toán',
    grade: 'Khối 12',
    chapterId: 'math_12_c1',
    lessonId: 'math_12_c1_l1',
    level: 'Thông hiểu',
    part: 'part2',
    content: 'Cho hàm số $y = f(x) = \\frac{2x - 1}{x + 1}$. Xét tính Đúng / Sai của các mệnh đề sau:',
    subItems: [
      { key: 'a', text: 'Tập xác định của hàm số là $D = \\mathbb{R} \\setminus \\{-1\\}$.', isTrue: true },
      { key: 'b', text: 'Đạo hàm của hàm số là $y\' = \\frac{3}{(x + 1)^2} > 0, \\forall x \\neq -1$.', isTrue: true },
      { key: 'c', text: 'Hàm số đồng biến trên $\\mathbb{R} \\setminus \\{-1\\}$.', isTrue: false },
      { key: 'd', text: 'Đồ thị hàm số có tiệm cận đứng là $x = -1$.', isTrue: true }
    ],
    explanation: 'Mệnh đề c sai vì tính đơn điệu chỉ xét trên từng khoảng xác định $(-\\infty; -1)$ và $(-1; +\\infty)$.',
    author: 'Tổ Toán - THPT Cao Bá Quát',
    createdAt: '2026-09-02T10:00:00Z'
  },
  {
    id: 'bank_m12_03',
    subject: 'Toán',
    grade: 'Khối 12',
    chapterId: 'math_12_c1',
    lessonId: 'math_12_c1_l1',
    level: 'Vận dụng',
    part: 'part3',
    content: 'Tìm số các giá trị nguyên của tham số $m \\in [-10; 10]$ để hàm số $y = \\frac{1}{3}x^3 - mx^2 + (m + 2)x - 5$ đồng biến trên toàn trục số $\\mathbb{R}$.',
    shortAnswer: '4',
    explanation: 'Ta có $y\' = x^2 - 2mx + (m + 2)$. Để hàm số đồng biến trên $\\mathbb{R}$ thì $\\Delta\' = m^2 - m - 2 \\le 0 \\Leftrightarrow -1 \\le m \\le 2$. Có 4 giá trị nguyên $\\{-1, 0, 1, 2\\}$.',
    author: 'Tổ Toán - THPT Cao Bá Quát',
    createdAt: '2026-09-02T11:00:00Z'
  },
  // CÂU HỎI TỰ LUẬN MÔN TOÁN
  {
    id: 'bank_m12_essay_01',
    subject: 'Toán',
    grade: 'Khối 12',
    chapterId: 'math_12_c1',
    lessonId: 'math_12_c1_l2',
    level: 'Vận dụng',
    part: 'essay',
    title: 'Câu hỏi Tự luận (2.0 điểm) - Bài toán tối ưu hóa chi phí sản xuất thực tế',
    content: 'Một công ty sản xuất bao bì muốn thiết kế một thùng các-tông dạng hình hộp chữ nhật không nắp có đáy là hình vuông và thể tích bằng $500\\text{ dm}^3$. Chi phí làm đáy thùng là $40.000\\text{ đ/dm}^2$, chi phí làm các mặt bên là $20.000\\text{ đ/dm}^2$.\n\na) Hãy lập hàm số biểu diễn tổng chi phí sản xuất thùng theo độ dài cạnh đáy $x\\text{ (dm)}$.\nb) Tìm kích thước của thùng (cạnh đáy $x$ và chiều cao $h$) để tổng chi phí sản xuất là nhỏ nhất. Tính chi phí nhỏ nhất đó.',
    maxScore: 2.0,
    rubric: [
      { criteria: 'Biểu diễn chiều cao $h = \\frac{500}{x^2}$ và diện tích đáy $S_d = x^2$, diện tích 4 mặt bên $S_{xq} = 4xh = \\frac{2000}{x}$', score: 0.5 },
      { criteria: 'Xây dựng hàm chi phí $C(x) = 40.000x^2 + 20.000 \\cdot \\frac{2000}{x} = 40.000(x^2 + \\frac{1000}{x})$', score: 0.5 },
      { criteria: 'Tính đạo hàm $C\'(x) = 40.000(2x - \\frac{1000}{x^2}) = 0 \\Leftrightarrow 2x^3 = 1000 \\Leftrightarrow x = 10\\text{ dm}$', score: 0.5 },
      { criteria: 'Lập bảng biến thiên kết luận kích thước $x = 10\\text{ dm}, h = 5\\text{ dm}$ và chi phí tối thiểu $C_{min} = 12.000.000\\text{ đồng}$', score: 0.5 }
    ],
    explanation: 'Hướng dẫn chấm:\n- Bước 1: $V = x^2 h = 500 \\Rightarrow h = 500/x^2$ ($x > 0$). (0.5đ)\n- Bước 2: Hàm tổng chi phí $C(x) = 40.000 x^2 + 80.000.000/x$. (0.5đ)\n- Bước 3: Đạo hàm $C\'(x) = 80.000 x - 80.000.000/x^2 = 0 \\Leftrightarrow x = 10\\text{ dm}$. (0.5đ)\n- Bước 4: $h = 5\\text{ dm}$, $C(10) = 40.000(100) + 8.000.000 = 12.000.000\\text{ đ}$. (0.5đ)',
    author: 'Tổ Toán - THPT Cao Bá Quát',
    createdAt: '2026-09-03T09:00:00Z'
  },

  // ==================== 3. MÔN VẬT LÍ (KHỐI 12) ====================
  {
    id: 'bank_p12_01',
    subject: 'Vật lí',
    grade: 'Khối 12',
    chapterId: 'phy_12_c1',
    lessonId: 'phy_12_c1_l2',
    level: 'Nhận biết',
    part: 'part1',
    content: 'Nội năng của một vật phụ thuộc vào những thông số trạng thái nào dưới đây?',
    options: ['Nhiệt độ và thể tích của vật', 'Khối lượng và vận tốc của vật', 'Độ cao của vật so với mặt đất', 'Hình dạng và kích thước của vật'],
    correctAnswerIndex: 0,
    explanation: 'Nội năng là tổng động năng và thế năng của các phân tử cấu tạo nên vật, phụ thuộc vào nhiệt độ $T$ và thể tích $V$.',
    author: 'Tổ Vật Lí - THPT Cao Bá Quát',
    createdAt: '2026-09-03T14:00:00Z'
  },
  // CÂU HỎI TỰ LUẬN MÔN VẬT LÍ
  {
    id: 'bank_p12_essay_01',
    subject: 'Vật lí',
    grade: 'Khối 12',
    chapterId: 'phy_12_c1',
    lessonId: 'phy_12_c1_l3',
    level: 'Vận dụng',
    part: 'essay',
    title: 'Câu hỏi Tự luận (2.0 điểm) - Nhiệt động lực học và cân bằng nhiệt thực nghiệm',
    content: 'Một nhiệt lượng kế bằng đồng có khối lượng $m_1 = 200\\text{ g}$ chứa $m_2 = 400\\text{ g}$ nước ở nhiệt độ $t_1 = 20^\\circ\\text{C}$. Người ta thả vào nhiệt lượng kế một thỏi kim loại có khối lượng $m_3 = 500\\text{ g}$ được nung nóng đến nhiệt độ $t_2 = 100^\\circ\\text{C}$. Nhiệt độ của hệ khi cân bằng nhiệt là $t = 28^\\circ\\text{C}$. Bỏ qua nhiệt lượng hao phí ra môi trường xung quanh. Biết nhiệt dung riêng của đồng $c_1 = 380\\text{ J/(kg}\\cdot\\text{K)}$, của nước $c_2 = 4200\\text{ J/(kg}\\cdot\\text{K)}$.\n\na) Tính nhiệt lượng do nước và nhiệt lượng kế thu vào khi tăng nhiệt độ từ $20^\\circ\\text{C}$ lên $28^\\circ\\text{C}$.\nb) Xác định nhiệt dung riêng $c_3$ của thỏi kim loại và đối chiếu với bảng số liệu để dự đoán kim loại đó.',
    maxScore: 2.0,
    rubric: [
      { criteria: 'Viết công thức và tính nhiệt lượng thu vào $Q_{thu} = (m_1 c_1 + m_2 c_2)(t - t_1)$', score: 0.5 },
      { criteria: 'Tính chính xác $Q_{thu} = (0.2 \\cdot 380 + 0.4 \\cdot 4200)(28 - 20) = 14.048\\text{ J}$', score: 0.5 },
      { criteria: 'Viết phương trình cân bằng nhiệt $Q_{toa} = Q_{thu} \\Leftrightarrow m_3 c_3 (t_2 - t) = Q_{thu}$', score: 0.5 },
      { criteria: 'Tính được $c_3 \\approx 390.2\\text{ J/(kg}\\cdot\\text{K)}$ và kết luận thỏi kim loại là Đồng hoặc Hợp kim đồng', score: 0.5 }
    ],
    explanation: 'Hướng dẫn chấm:\n- Ý a (1.0đ): $Q_{thu} = (76 + 1680) \\cdot 8 = 14048\\text{ J}$.\n- Ý b (1.0đ): $Q_{toa} = 0.5 \\cdot c_3 \\cdot (100 - 28) = 36 c_3 = 14048 \\Rightarrow c_3 \\approx 390.2\\text{ J/(kg}\\cdot\\text{K)}$. Thỏi kim loại làm bằng đồng.',
    author: 'Tổ Vật Lí - THPT Cao Bá Quát',
    createdAt: '2026-09-04T10:00:00Z'
  },

  // ==================== 4. MÔN NGỮ VĂN (KHỐI 12) ====================
  {
    id: 'bank_lit_essay_01',
    subject: 'Ngữ văn',
    grade: 'Khối 12',
    chapterId: 'lit_12_c3',
    lessonId: 'lit_12_c3_l1',
    level: 'Vận dụng',
    part: 'essay',
    title: 'Câu hỏi Tự luận (2.0 điểm) - Viết đoạn văn nghị luận xã hội',
    content: 'Viết một đoạn văn (khoảng 200 chữ) trình bày suy nghĩ của anh/chị về ý nghĩa của lòng biết ơn và tinh thần trách nhiệm của thế hệ trẻ đối với quê hương, đất nước trong bối cảnh toàn cầu hóa hiện nay.',
    maxScore: 2.0,
    rubric: [
      { criteria: 'Đảm bảo đúng hình thức đoạn văn khoảng 200 chữ, không gạch đầu dòng, diễn đạt mạch lạc', score: 0.25 },
      { criteria: 'Xác định đúng vấn đề nghị luận: Ý nghĩa của lòng biết ơn và trách nhiệm của tuổi trẻ', score: 0.25 },
      { criteria: 'Triển khai vấn đề: Giải thích khái niệm, phân tích ý nghĩa (bồi dưỡng nhân cách, tạo động lực cống hiến), dẫn chứng thuyết phục', score: 1.0 },
      { criteria: 'Phản biện, mở rộng vấn đề và rút ra bài học nhận thức, hành động cụ thể', score: 0.25 },
      { criteria: 'Sáng tạo, dùng từ giàu hình ảnh, không sai lỗi chính tả và ngữ pháp', score: 0.25 }
    ],
    explanation: 'Yêu cầu: Bài viết cần làm rõ lòng biết ơn là cội nguồn của đạo lý dân tộc, trách nhiệm của thanh niên là học tập, cống hiến xây dựng quê hương Đắk Lắk và đất nước giàu đẹp.',
    author: 'Tổ Ngữ Văn - THPT Cao Bá Quát',
    createdAt: '2026-09-05T08:00:00Z'
  }
];

/**
 * Lấy toàn bộ cây thư mục Chương - Bài
 */
export function getTaxonomyTree() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TREE);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Lỗi đọc cây thư mục từ storage:", e);
  }
  // Mặc định nạp dữ liệu ban đầu
  saveTaxonomyTree(DEFAULT_TAXONOMY_TREE);
  return DEFAULT_TAXONOMY_TREE;
}

/**
 * Lưu cây thư mục
 */
export function saveTaxonomyTree(tree) {
  try {
    localStorage.setItem(STORAGE_KEY_TREE, JSON.stringify(tree));
  } catch (e) {
    console.error("Lỗi lưu cây thư mục:", e);
  }
}

/**
 * Lấy cây thư mục của một môn học & khối lớp cụ thể (tự động fallback tạo khung nếu chưa có)
 */
export function getTaxonomyForSubject(subject, grade) {
  const all = getTaxonomyTree();
  let found = all.find(item => item.subject === subject && item.grade === grade);
  
  if (!found) {
    // Tìm theo môn học
    found = all.find(item => item.subject === subject);
  }

  if (found) return found;

  // Nếu môn học hoàn toàn chưa có trong cây mặc định, tự động sinh khung cây mẫu chuẩn GDPT 2018
  const fallbackTree = {
    id: `${subject}_${grade}_default`,
    subject,
    grade,
    chapters: [
      {
        id: `ch_1_${Date.now()}`,
        title: `Chương I: Chuyên đề trọng tâm học kỳ I - Môn ${subject}`,
        lessons: [
          { id: `less_1_${Date.now()}`, title: `Bài 1: Kiến thức nền tảng và phương pháp học tập` },
          { id: `less_2_${Date.now()}`, title: `Bài 2: Vận dụng kiến thức vào thực tiễn` }
        ]
      },
      {
        id: `ch_2_${Date.now()}`,
        title: `Chương II: Chuyên đề nâng cao học kỳ II - Môn ${subject}`,
        lessons: [
          { id: `less_3_${Date.now()}`, title: `Bài 3: Kỹ năng tổng hợp và giải quyết vấn đề` },
          { id: `less_4_${Date.now()}`, title: `Bài 4: Ôn tập kiểm tra đánh giá định kỳ` }
        ]
      }
    ]
  };

  // Lưu vào tree để lần sau không bị trắng
  all.push(fallbackTree);
  saveTaxonomyTree(all);
  return fallbackTree;
}

/**
 * Thêm hoặc Cập nhật một Chương vào cây thư mục
 */
export function upsertChapter(subject, grade, chapterData) {
  const allTree = getTaxonomyTree();
  let subTree = allTree.find(item => item.subject === subject && item.grade === grade);
  
  if (!subTree) {
    subTree = {
      id: `${subject}_${grade}_${Date.now()}`,
      subject,
      grade,
      chapters: []
    };
    allTree.push(subTree);
  }

  const existingIdx = subTree.chapters.findIndex(c => c.id === chapterData.id);
  if (existingIdx >= 0) {
    subTree.chapters[existingIdx] = { ...subTree.chapters[existingIdx], ...chapterData };
  } else {
    subTree.chapters.push({
      id: chapterData.id || `ch_${Date.now()}`,
      title: chapterData.title || 'Chương mới',
      lessons: chapterData.lessons || []
    });
  }

  saveTaxonomyTree(allTree);
  return subTree;
}

/**
 * Thêm hoặc Cập nhật một Bài học vào một Chương
 */
export function upsertLesson(subject, grade, chapterId, lessonData) {
  const allTree = getTaxonomyTree();
  let subTree = allTree.find(item => item.subject === subject && item.grade === grade);
  if (!subTree) return null;

  const chapter = subTree.chapters.find(c => c.id === chapterId);
  if (!chapter) return null;

  if (!chapter.lessons) chapter.lessons = [];

  const existingIdx = chapter.lessons.findIndex(l => l.id === lessonData.id);
  if (existingIdx >= 0) {
    chapter.lessons[existingIdx] = { ...chapter.lessons[existingIdx], ...lessonData };
  } else {
    chapter.lessons.push({
      id: lessonData.id || `less_${Date.now()}`,
      title: lessonData.title || 'Bài học mới'
    });
  }

  saveTaxonomyTree(allTree);
  return chapter;
}

/**
 * Xóa một Chương khỏi cây thư mục
 */
export function deleteChapter(subject, grade, chapterId) {
  const allTree = getTaxonomyTree();
  const subTree = allTree.find(item => item.subject === subject && item.grade === grade);
  if (!subTree || !subTree.chapters) return false;

  subTree.chapters = subTree.chapters.filter(c => c.id !== chapterId);
  saveTaxonomyTree(allTree);
  return true;
}

/**
 * Xóa một Bài học khỏi một Chương
 */
export function deleteLesson(subject, grade, chapterId, lessonId) {
  const allTree = getTaxonomyTree();
  const subTree = allTree.find(item => item.subject === subject && item.grade === grade);
  if (!subTree || !subTree.chapters) return false;

  const chapter = subTree.chapters.find(c => c.id === chapterId);
  if (!chapter || !chapter.lessons) return false;

  chapter.lessons = chapter.lessons.filter(l => l.id !== lessonId);
  saveTaxonomyTree(allTree);
  return true;
}

/**
 * Đổi tên một Chương
 */
export function renameChapter(subject, grade, chapterId, newTitle) {
  const allTree = getTaxonomyTree();
  const subTree = allTree.find(item => item.subject === subject && item.grade === grade);
  if (!subTree || !subTree.chapters) return false;

  const chapter = subTree.chapters.find(c => c.id === chapterId);
  if (!chapter) return false;

  chapter.title = newTitle;
  saveTaxonomyTree(allTree);
  return true;
}

/**
 * Đổi tên một Bài học
 */
export function renameLesson(subject, grade, chapterId, lessonId, newTitle) {
  const allTree = getTaxonomyTree();
  const subTree = allTree.find(item => item.subject === subject && item.grade === grade);
  if (!subTree || !subTree.chapters) return false;

  const chapter = subTree.chapters.find(c => c.id === chapterId);
  if (!chapter || !chapter.lessons) return false;

  const lesson = chapter.lessons.find(l => l.id === lessonId);
  if (!lesson) return false;

  lesson.title = newTitle;
  saveTaxonomyTree(allTree);
  return true;
}

/**
 * Lấy toàn bộ danh sách câu hỏi trong ngân hàng
 */
export function getAllBankQuestions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUESTIONS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Lỗi đọc ngân hàng câu hỏi:", e);
  }
  saveAllBankQuestions(INITIAL_BANK_QUESTIONS);
  return INITIAL_BANK_QUESTIONS;
}

/**
 * Lưu danh sách câu hỏi trong ngân hàng
 */
export function saveAllBankQuestions(questions) {
  try {
    localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(questions));
  } catch (e) {
    console.error("Lỗi lưu ngân hàng câu hỏi:", e);
  }
}

/**
 * Thêm hoặc cập nhật một câu hỏi vào ngân hàng
 */
export function upsertBankQuestion(question) {
  const all = getAllBankQuestions();
  const qId = question.id || `bank_q_${Date.now()}`;
  const prepared = {
    ...question,
    id: qId,
    updatedAt: new Date().toISOString()
  };

  const existingIdx = all.findIndex(q => q.id === qId);
  if (existingIdx >= 0) {
    all[existingIdx] = prepared;
  } else {
    all.unshift(prepared);
  }

  saveAllBankQuestions(all);
  return prepared;
}

/**
 * Thêm hoặc cập nhật hàng loạt câu hỏi vào ngân hàng
 */
export function bulkUpsertBankQuestions(newQuestions) {
  const all = getAllBankQuestions();
  const preparedList = newQuestions.map((q, idx) => ({
    ...q,
    id: q.id || `bank_q_${Date.now()}_${idx}`,
    status: q.status || 'approved',
    updatedAt: new Date().toISOString()
  }));

  const map = new Map(all.map(q => [q.id, q]));
  preparedList.forEach(q => map.set(q.id, q));

  const updatedAll = Array.from(map.values());
  saveAllBankQuestions(updatedAll);
  return preparedList;
}

/**
 * Cập nhật trạng thái duyệt/thẩm định của Tổ chuyên môn cho một câu hỏi
 */
export function setQuestionApprovalStatus(questionId, status = 'approved') {
  const all = getAllBankQuestions();
  const idx = all.findIndex(q => q.id === questionId);
  if (idx >= 0) {
    all[idx] = { ...all[idx], status, updatedAt: new Date().toISOString() };
    saveAllBankQuestions(all);
    return all[idx];
  }
  return null;
}

/**
 * Duyệt toàn bộ câu hỏi trong một bài học
 */
export function bulkApproveQuestionsInLesson(lessonId) {
  const all = getAllBankQuestions();
  let updatedCount = 0;
  const updated = all.map(q => {
    if (q.lessonId === lessonId && q.status !== 'approved') {
      updatedCount++;
      return { ...q, status: 'approved', updatedAt: new Date().toISOString() };
    }
    return q;
  });
  saveAllBankQuestions(updated);
  return updatedCount;
}

/**
 * Xóa một câu hỏi khỏi ngân hàng
 */
export function deleteBankQuestion(questionId) {
  const all = getAllBankQuestions();
  const filtered = all.filter(q => q.id !== questionId);
  saveAllBankQuestions(filtered);
  return filtered;
}

/**
 * Lọc câu hỏi theo Chương / Bài / Mức độ / Hình thức / Trạng thái duyệt
 */
export function queryBankQuestions({ subject, grade, chapterId, lessonId, level, part, status, search }) {
  const all = getAllBankQuestions();
  return all.filter(q => {
    if (subject && q.subject !== subject) return false;
    if (grade && q.grade !== grade) return false;
    if (chapterId && q.chapterId !== chapterId) return false;
    if (lessonId && q.lessonId !== lessonId) return false;
    if (level && level !== 'all' && q.level !== level) return false;
    if (part && part !== 'all' && q.part !== part) return false;
    if (status && status !== 'all' && (q.status || 'approved') !== status) return false;
    if (search && search.trim()) {
      const s = search.toLowerCase();
      const inContent = q.content?.toLowerCase().includes(s);
      const inTitle = q.title?.toLowerCase().includes(s);
      if (!inContent && !inTitle) return false;
    }
    return true;
  });
}

/**
 * Thống kê số lượng câu hỏi trong một bài học hoặc chương theo mức độ & dạng câu hỏi
 */
export function getQuestionStatsForNode(lessonOrChapterId) {
  const all = getAllBankQuestions();
  const matched = all.filter(q => q.lessonId === lessonOrChapterId || q.chapterId === lessonOrChapterId);
  return {
    total: matched.length,
    nb: matched.filter(q => q.level === 'Nhận biết').length,
    th: matched.filter(q => q.level === 'Thông hiểu').length,
    vd: matched.filter(q => q.level === 'Vận dụng').length,
    vdc: matched.filter(q => q.level === 'Vận dụng cao').length,
    part1: matched.filter(q => q.part === 'part1').length,
    part2: matched.filter(q => q.part === 'part2').length,
    part3: matched.filter(q => q.part === 'part3').length,
    essay: matched.filter(q => q.part === 'essay').length
  };
}

/**
 * Thuật toán bốc đề ngẫu nhiên từ Khung Ma Trận (Hỗ trợ cả bốc câu hỏi Tự luận)
 */
export function generateExamFromMatrix(matrixSpecs, subject, grade) {
  const allQuestions = getAllBankQuestions().filter(q => {
    if (subject && q.subject !== subject) return false;
    if (grade && q.grade !== grade) return false;
    return true;
  });

  const selectedQuestions = [];
  const missingLogs = [];

  const shuffleArray = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const levels = [
    { key: 'nb', label: 'Nhận biết' },
    { key: 'th', label: 'Thông hiểu' },
    { key: 'vd', label: 'Vận dụng' },
    { key: 'vdc', label: 'Vận dụng cao' }
  ];

  matrixSpecs.forEach(spec => {
    const { lessonId, lessonTitle } = spec;
    
    // Bốc trắc nghiệm theo 4 mức độ
    levels.forEach(lvl => {
      const requestedCount = Number(spec[lvl.key]) || 0;
      if (requestedCount <= 0) return;

      const candidates = allQuestions.filter(q => 
        q.lessonId === lessonId && 
        q.level === lvl.label &&
        q.part !== 'essay' &&
        !selectedQuestions.some(sq => sq.id === q.id)
      );

      const shuffled = shuffleArray(candidates);
      const picked = shuffled.slice(0, requestedCount);
      selectedQuestions.push(...picked);

      if (picked.length < requestedCount) {
        missingLogs.push({
          lessonTitle: lessonTitle || lessonId,
          level: lvl.label,
          type: 'Trắc nghiệm',
          requested: requestedCount,
          found: picked.length,
          missing: requestedCount - picked.length
        });
      }
    });

    // Bốc câu hỏi tự luận (nếu có yêu cầu trong ma trận)
    const requestedEssay = Number(spec.essay) || 0;
    if (requestedEssay > 0) {
      const essayCandidates = allQuestions.filter(q =>
        q.lessonId === lessonId &&
        q.part === 'essay' &&
        !selectedQuestions.some(sq => sq.id === q.id)
      );
      const shuffledEssay = shuffleArray(essayCandidates);
      const pickedEssay = shuffledEssay.slice(0, requestedEssay);
      selectedQuestions.push(...pickedEssay);

      if (pickedEssay.length < requestedEssay) {
        missingLogs.push({
          lessonTitle: lessonTitle || lessonId,
          level: 'Tự luận',
          type: 'Câu hỏi Tự luận',
          requested: requestedEssay,
          found: pickedEssay.length,
          missing: requestedEssay - pickedEssay.length
        });
      }
    }
  });

  return {
    selectedQuestions,
    missingLogs
  };
}
