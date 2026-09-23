// src/data/clubSubDisciplines.js
// Cấu hình danh mục Môn phụ / Bộ môn chuyên sâu của từng Câu lạc bộ
// Kèm theo Lịch sinh hoạt, Địa điểm, Giáo viên phụ trách và Nhóm Zalo

export const CLUB_SUB_DISCIPLINES = {
  // 1. Câu lạc bộ Thể dục - Thể thao (Chuẩn theo phân công nhà trường)
  '2) Câu lạc bộ Thể duc - Thể thao': [
    {
      id: 'co_vua',
      code: 'CV',
      name: 'Cờ vua',
      icon: '♟️',
      color: '#4f46e5',
      badgeBg: '#eef2ff',
      location: 'Nhà đa năng',
      schedule: 'Thứ 4 (14h00 – 15h00), Thứ 5 (14h00 – 15h00)',
      coaches: ['Thầy Nguyễn Công Sự'],
      zaloUrl: 'https://zalo.me/g/7t8nckjnip9ejzqkpmas',
      description: 'Rèn luyện tư duy chiến thuật, nước cờ logic và chuẩn bị lực lượng thi đấu giải Hội khỏe Phù Đổng.'
    },
    {
      id: 'bong_da',
      code: 'BD',
      name: 'Bóng đá',
      icon: '⚽',
      color: '#16a34a',
      badgeBg: '#f0fdf4',
      location: 'Sân bóng đá',
      schedule: 'Thứ 2 (15h30 – 16h30), Thứ 3 (15h30 – 16h30)',
      coaches: ['Thầy Huỳnh Thanh Tú', 'Thầy Lê Công Dũng'],
      zaloUrl: 'https://zalo.me/g/p4ammi8kqghprrrwijvs',
      description: 'Huấn luyện kỹ thuật chuyền bóng, phối hợp nhóm, thể lực và thi đấu cọ xát giao hữu.'
    },
    {
      id: 'pickleball',
      code: 'PB',
      name: 'Pickleball',
      icon: '🏓',
      color: '#ea580c',
      badgeBg: '#fff7ed',
      location: 'Nhà đa năng',
      schedule: 'Thứ 3 (15h30 – 16h15), Thứ 4 (15h30 – 17h00)',
      coaches: ['Thầy Lê Ngọc Oanh'],
      zaloUrl: 'https://zalo.me/g/ok3uxtybch9stggbstu',
      description: 'Môn thể thao hiện đại, phát triển phản xạ nhanh nhạy, kỹ thuật dink bóng và phối hợp đôi.'
    },
    {
      id: 'bong_chuyen_nu',
      code: 'BCN',
      name: 'Bóng chuyền nữ',
      icon: '🏐',
      color: '#db2777',
      badgeBg: '#fdf2f8',
      location: 'Sân phía sau dãy nhà 27 phòng',
      schedule: 'Thứ 2 (15h30 – 16h30), Thứ 3 (15h30 – 16h30)',
      coaches: ['Thầy Nguyễn Văn Đại'],
      zaloUrl: 'https://zalo.me/g/rguxx4xqa5i5zxwfx9m0',
      description: 'Tập luyện kỹ thuật đệm bóng, chuyền hai, phát bóng và chiến thuật phối hợp đội hình nữ.'
    },
    {
      id: 'bong_chuyen_nam',
      code: 'BCNAM',
      name: 'Bóng chuyền nam',
      icon: '🏐',
      color: '#0284c7',
      badgeBg: '#f0f9ff',
      location: 'Sân bóng chuyền mới',
      schedule: 'Thứ 2 (15h30 – 16h30), Thứ 5 (15h00 – 16h00)',
      coaches: ['Thầy Hồ Anh Tuấn'],
      zaloUrl: 'https://zalo.me/g/u7kydublqxpgnjsyggjm',
      description: 'Tập luyện kỹ thuật đập bóng trên lưới, bám chắn, phát bóng tấn công và nâng cao thể lực.'
    },
    {
      id: 'cau_long',
      code: 'CL',
      name: 'Cầu lông',
      icon: '🏸',
      color: '#0d9488',
      badgeBg: '#f0fdfa',
      location: 'Nhà đa năng',
      schedule: 'Thứ 2 (15h30 – 17h00), Thứ 3 (15h30 – 17h00)',
      coaches: ['Thầy Phạm Ngọc Triều'],
      zaloUrl: 'https://zalo.me/g/ptqn19shqtcnxvzivwmc',
      description: 'Rèn luyện kỹ thuật đánh cầu cao sâu, đập cầu, bỏ nhỏ và chiến thuật thi đấu đơn / đôi.'
    }
  ],

  // 2. Câu lạc bộ Văn nghệ - Mĩ thuật
  '3) Câu lạc bộ Văn nghệ - Mĩ thuật': [
    {
      id: 'hat_thanh_nhac',
      code: 'HTN',
      name: 'Hát & Thanh nhạc',
      icon: '🎤',
      color: '#9333ea',
      badgeBg: '#faf5ff',
      location: 'Phòng Âm nhạc / Hội trường',
      schedule: 'Thứ 3 & Thứ 5 (15h30 – 17h00)',
      coaches: ['Cô Tổ Âm nhạc - Nghệ thuật'],
      zaloUrl: '',
      description: 'Luyện thanh, kỹ thuật xử lý ca khúc, hát bè và biểu diễn văn nghệ học đường.'
    },
    {
      id: 'nhay_hien_dai_dance',
      code: 'DANCE',
      name: 'Nhảy hiện đại & Dance Cover',
      icon: '💃',
      color: '#e11d48',
      badgeBg: '#fff1f2',
      location: 'Sảnh Hội trường lớn',
      schedule: 'Thứ 4 & Thứ 6 (15h30 – 17h00)',
      coaches: ['Ban Chủ nhiệm Đội Nhảy'],
      zaloUrl: '',
      description: 'Biên đạo vũ đạo, rèn luyện dẻo dai, nhịp điệu và biểu diễn các sự kiện lớn của trường.'
    },
    {
      id: 'mi_thuat_hoi_hoa',
      code: 'MTHH',
      name: 'Mĩ thuật & Hội họa / Thiết kế Poster',
      icon: '🎨',
      color: '#d97706',
      badgeBg: '#fffbeb',
      location: 'Phòng Mỹ thuật & Triển lãm',
      schedule: 'Thứ 5 (14h00 – 16h30)',
      coaches: ['Thầy/Cô Tổ Mỹ thuật'],
      zaloUrl: '',
      description: 'Vẽ tranh cổ động, thiết kế đồ họa số, trang trí bảng tin và triển lãm tranh nghệ thuật.'
    },
    {
      id: 'nhac_cu_guitar_piano',
      code: 'NHACCU',
      name: 'Nhạc cụ (Guitar, Piano, Ukulele, Trống)',
      icon: '🎸',
      color: '#0891b2',
      badgeBg: '#ecfeff',
      location: 'Phòng Nhạc cụ',
      schedule: 'Thứ 7 (14h00 – 16h30)',
      coaches: ['Ban Chủ nhiệm Ban Nhạc CBQ'],
      zaloUrl: '',
      description: 'Học hợp âm, kỹ năng đệm hát, hòa tấu ban nhạc học sinh.'
    }
  ],

  // 3. Câu lạc bộ STEM - STEAM - Khoa học kỹ thuật
  '4) Câu lạc bộ STEM - STEAM - Khoa học kĩ thuật - Khởi nghiệp ': [
    {
      id: 'stem_robotics_iot',
      code: 'ROBOT',
      name: 'Robotics & Lập trình IoT / Arduino',
      icon: '🤖',
      color: '#2563eb',
      badgeBg: '#eff6ff',
      location: 'Phòng Lab STEM / Tin học 1',
      schedule: 'Thứ 4 & Thứ 7 (14h30 – 16h30)',
      coaches: ['Thầy/Cô Tổ Tin học & Vật lí'],
      zaloUrl: '',
      description: 'Chế tạo robot, lập trình vi điều khiển, cảm biến thông minh và tham gia thi KHKT.'
    },
    {
      id: 'stem_khoa_hoc_ung_dung',
      code: 'KHUD',
      name: 'Khoa học Ứng dụng & Dự án Khởi nghiệp',
      icon: '🔬',
      color: '#059669',
      badgeBg: '#ecfdf5',
      location: 'Phòng Thí nghiệm Hóa - Sinh',
      schedule: 'Thứ 5 (14h30 – 16h30)',
      coaches: ['Thầy/Cô Tổ Hóa - Sinh - KHTN'],
      zaloUrl: '',
      description: 'Nghiên cứu dự án khoa học thực tiễn, sản phẩm thân thiện môi trường và đề án khởi nghiệp.'
    }
  ],

  // 4. Câu lạc bộ Tiếng Anh
  '1) Câu lạc bộ Tiếng Anh': [
    {
      id: 'eng_speaking_debate',
      code: 'SPEAK',
      name: 'Speaking & English Debate (Tranh biện tiếng Anh)',
      icon: '🎙️',
      color: '#4338ca',
      badgeBg: '#eef2ff',
      location: 'Phòng Nghe nhìn Ngoại ngữ',
      schedule: 'Thứ 4 (15h30 – 17h00)',
      coaches: ['Thầy/Cô Tổ Ngoại ngữ'],
      zaloUrl: '',
      description: 'Luyện phát âm chuẩn, thuyết trình ý tưởng, phản xạ giao tiếp tự tin và tranh biện học thuật.'
    },
    {
      id: 'eng_ielts_olympic',
      code: 'IELTS',
      name: 'IELTS Preparation & Olympic Tiếng Anh',
      icon: '📚',
      color: '#be123c',
      badgeBg: '#fff1f2',
      location: 'Phòng Đa phương tiện',
      schedule: 'Thứ 7 (14h00 – 16h00)',
      coaches: ['Thầy/Cô Tổ Ngoại ngữ'],
      zaloUrl: '',
      description: 'Chiến thuật làm bài thi quốc tế, mở rộng vốn từ vựng học thuật C1-C2 và giải đề HSG.'
    }
  ],

  // 5. Câu lạc bộ Ứng dụng AI
  '6) Câu lạc bộ Ứng dụng AI': [
    {
      id: 'ai_prompt_coding',
      code: 'AICODE',
      name: 'Prompt Engineering & AI Coding Assistant',
      icon: '⚡',
      color: '#7c3aed',
      badgeBg: '#f5f3ff',
      location: 'Phòng Máy tính AI Lab',
      schedule: 'Thứ 6 (15h00 – 17h00)',
      coaches: ['Thầy Phạm Quang Sáng & Tổ Tin học'],
      zaloUrl: '',
      description: 'Thực hành kỹ nghệ tạo câu lệnh AI, lập trình web/app có AI hỗ trợ và huấn luyện chatbot.'
    },
    {
      id: 'ai_creative_media',
      code: 'AIMEDIA',
      name: 'AI Sáng tạo Nội dung & Thiết kế Đa phương tiện',
      icon: '🎬',
      color: '#c026d3',
      badgeBg: '#fdf4ff',
      location: 'Phòng Máy tính AI Lab',
      schedule: 'Thứ 7 (14h00 – 16h00)',
      coaches: ['Ban Cố vấn Công nghệ AI'],
      zaloUrl: '',
      description: 'Tạo video AI, thiết kế ảnh AI nghệ thuật, làm phim ngắn và podcast số trường học.'
    }
  ],

  // 6. Câu lạc bộ Truyền thông và Cộng đồng
  '5) Câu lạc bộ Truyền thông và Cộng đồng': [
    {
      id: 'media_photography_video',
      code: 'PHOTO',
      name: 'Nhiếp ảnh, Quay phim & Dựng Video Sự kiện',
      icon: '📷',
      color: '#0284c7',
      badgeBg: '#f0f9ff',
      location: 'Studio Truyền thông / Văn phòng Đoàn',
      schedule: 'Thứ 5 (15h30 – 17h00)',
      coaches: ['Ban Truyền thông Đoàn trường'],
      zaloUrl: '',
      description: 'Kỹ thuật chụp ảnh sự kiện trường, vận hành máy quay, chỉnh màu và dựng video highlight.'
    },
    {
      id: 'media_fanpage_content',
      code: 'CONTENT',
      name: 'Biên tập Bài viết, Bản tin & Quản trị Fanpage',
      icon: '✍️',
      color: '#0d9488',
      badgeBg: '#f0fdfa',
      location: 'Văn phòng Đoàn trường',
      schedule: 'Thứ 3 (15h30 – 17h00)',
      coaches: ['Ban Biên tập Website & Fanpage'],
      zaloUrl: '',
      description: 'Viết bài tin tức, sáng tạo nội dung mạng xã hội, phỏng vấn và phát triển ấn phẩm số.'
    }
  ],

  // 7. Câu lạc bộ Phát triển kỹ năng - Khai phá tư duy
  '7) Câu lạc bộ Phát triển kĩ năng - Khai phá tư duy': [
    {
      id: 'skill_mc_presentation',
      code: 'MC',
      name: 'Kỹ năng MC, Dẫn chương trình & Hùng biện',
      icon: '🎙️',
      color: '#d97706',
      badgeBg: '#fffbeb',
      location: 'Hội trường lớn',
      schedule: 'Thứ 4 (15h30 – 17h00)',
      coaches: ['Thầy/Cô Ban Hoạt động Trải nghiệm'],
      zaloUrl: '',
      description: 'Rèn luyện giọng nói truyền cảm, làm chủ sân khấu, xử lý tình huống và dẫn dắt sự kiện.'
    },
    {
      id: 'skill_leadership_teamwork',
      code: 'LEAD',
      name: 'Kỹ năng Lãnh đạo, Tổ chức Sự kiện & Làm việc nhóm',
      icon: '🤝',
      color: '#059669',
      badgeBg: '#ecfdf5',
      location: 'Phòng Hội đồng Sư phạm',
      schedule: 'Thứ 7 (14h00 – 16h30)',
      coaches: ['Bí thư Đoàn trường'],
      zaloUrl: '',
      description: 'Lập kế hoạch sự kiện, kỹ năng điều phối nhóm, giải quyết vấn đề và tư duy phản biện.'
    }
  ]
};

/**
 * Tìm danh sách môn phụ cho một câu lạc bộ
 */
export function getSubDisciplinesForClub(clubName) {
  if (!clubName) return [];
  const cleanName = clubName.trim();
  
  // 1. Thử khớp chính xác theo key
  if (CLUB_SUB_DISCIPLINES[cleanName]) {
    return CLUB_SUB_DISCIPLINES[cleanName];
  }

  // 2. Thử khớp mờ (tên chứa từ khóa)
  for (const [key, list] of Object.entries(CLUB_SUB_DISCIPLINES)) {
    if (key.includes(cleanName) || cleanName.includes(key) || 
        (cleanName.toLowerCase().includes('thể dục') && key.includes('Thể dục')) ||
        (cleanName.toLowerCase().includes('thể thao') && key.includes('Thể thao')) ||
        (cleanName.toLowerCase().includes('văn nghệ') && key.includes('Văn nghệ')) ||
        (cleanName.toLowerCase().includes('tiếng anh') && key.includes('Tiếng Anh')) ||
        (cleanName.toLowerCase().includes('stem') && key.includes('STEM')) ||
        (cleanName.toLowerCase().includes('ai') && key.includes('AI'))) {
      return list;
    }
  }

  return [];
}
