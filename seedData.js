import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Đọc thông tin Supabase từ file .env hoặc cấu hình có sẵn
const supabaseUrl = 'https://pdkiaypqaasqgnlfolfj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBka2lheXBxYWFzcWdubGZvbGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMzIzMzIsImV4cCI6MjA5OTYwODMzMn0.jc7WLD2J2cRwz79gtUpXacXdesECAxQVEor3pFjXDe0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
  console.log('Đang lấy danh sách các tiểu ban...');
  const { data: committees, error: commError } = await supabase.from('cbq_committees').select('*');
  if (commError) {
    console.error('Lỗi lấy tiểu ban:', commError);
    return;
  }

  const getCommitteeId = (keyword) => {
    const found = committees.find(c => c.name.toLowerCase().includes(keyword.toLowerCase()));
    return found ? found.id : null;
  };

  const tasksData = [
    // --- II) Tiểu ban nội dung, biên tập tập san ---
    {
      committee_id: getCommitteeId('nội dung'),
      title: 'Viết lời tựa và lịch sử hình thành, phát triển Nhà trường',
      assignee: 'Lê Thị Thảo',
      responsible: 'Lê Thị Thảo',
      deadline: '2026-08-30T17:00:00+07:00',
      location: 'Trường',
      expected_result: 'Hoàn thành bản thảo',
      progress: 50,
      status: 'pending'
    },
    {
      committee_id: getCommitteeId('nội dung'),
      title: 'Lựa chọn 10 bài thơ để đưa vào tập san',
      assignee: 'Nguyễn Thị Mùi, Trần Thị Quế Quyên',
      responsible: 'Nguyễn Thị Mùi',
      deadline: '2026-08-30T17:00:00+07:00',
      location: 'Trường',
      expected_result: 'Danh sách 10 bài thơ',
      progress: 0,
      status: 'pending'
    },
    {
      committee_id: getCommitteeId('nội dung'),
      title: 'Lựa chọn, biên soạn 15 tác phẩm văn xuôi',
      assignee: 'Phạm Thị Ngọc Lan, Nguyễn Thị Hà, Vũ Thị Lài',
      responsible: 'Phạm Thị Ngọc Lan',
      deadline: '2026-08-30T17:00:00+07:00',
      location: 'Trường',
      expected_result: '15 tác phẩm văn xuôi',
      progress: 0,
      status: 'pending'
    },
    {
      committee_id: getCommitteeId('nội dung'),
      title: 'Lựa chọn 25 hình ảnh đưa vào tập san',
      assignee: 'Võ Thị Minh Lý',
      responsible: 'Võ Thị Minh Lý',
      deadline: '2026-08-30T17:00:00+07:00',
      location: 'Trường',
      expected_result: '25 hình ảnh chất lượng cao',
      progress: 0,
      status: 'pending'
    },
    {
      committee_id: getCommitteeId('nội dung'),
      title: 'Nội dung Phòng Truyền thống Bảng 1: Sứ mạng Tầm nhìn',
      assignee: 'Lê Thị Thảo',
      responsible: 'Lê Thị Thảo',
      deadline: '2026-08-20T17:00:00+07:00',
      location: 'Phòng Truyền thống',
      expected_result: 'Nội dung bảng 1',
      progress: 0,
      status: 'pending'
    },
    {
      committee_id: getCommitteeId('nội dung'),
      title: 'Nội dung Phòng Truyền thống Bảng 2: Lãnh đạo qua các thời kỳ',
      assignee: 'Võ Thị Minh Lý',
      responsible: 'Võ Thị Minh Lý',
      deadline: '2026-08-20T17:00:00+07:00',
      location: 'Phòng Truyền thống',
      expected_result: 'Hình ảnh, in ấn bảng 2',
      progress: 0,
      status: 'pending'
    },
    {
      committee_id: getCommitteeId('nội dung'),
      title: 'Nội dung Bảng 4: Các Tổ chuyên môn hiện nay (Tổ chức chụp hình)',
      assignee: 'Phạm Quang Sáng',
      responsible: 'Phạm Quang Sáng',
      deadline: '2026-08-10T17:00:00+07:00',
      location: 'Trường',
      expected_result: 'Hình ảnh các tổ chuyên môn',
      progress: 0,
      status: 'pending'
    },
    {
      committee_id: getCommitteeId('nội dung'),
      title: 'Nội dung Bảng 5: Bảng vàng thành tích GV, HS',
      assignee: 'Nguyễn Thị Huỳnh Thúy',
      responsible: 'Nguyễn Thị Huỳnh Thúy',
      deadline: '2026-08-20T17:00:00+07:00',
      location: 'Phòng Truyền thống',
      expected_result: 'Danh sách thành tích',
      progress: 0,
      status: 'pending'
    },
    {
      committee_id: getCommitteeId('nội dung'),
      title: 'Nội dung Bảng 6: Lịch sử Nhà trường (tóm tắt)',
      assignee: 'Vũ Thị Lài',
      responsible: 'Vũ Thị Lài',
      deadline: '2026-08-20T17:00:00+07:00',
      location: 'Phòng Truyền thống',
      expected_result: 'Bài tóm tắt lịch sử',
      progress: 0,
      status: 'pending'
    },
    
    // --- III) Tiểu ban tiếp nhận tài trợ ---
    {
      committee_id: getCommitteeId('tài trợ'),
      title: 'Tiếp nhận ủng hộ kỷ niệm 30 năm',
      assignee: 'Các thành viên',
      responsible: 'Nguyễn Hữu Lam',
      deadline: '2026-09-03T17:00:00+07:00',
      location: 'Trường',
      expected_result: 'Tiếp nhận tiền và hiện vật',
      progress: 50,
      status: 'pending'
    },
    {
      committee_id: getCommitteeId('tài trợ'),
      title: 'Gửi thư cảm ơn các mạnh thường quân',
      assignee: 'Đoàn Thị Hải Yến',
      responsible: 'Nguyễn Hữu Lam',
      deadline: '2026-08-20T17:00:00+07:00',
      location: 'Văn phòng',
      expected_result: 'Hoàn thành gửi thư',
      progress: 0,
      status: 'pending'
    },
    {
      committee_id: getCommitteeId('tài trợ'),
      title: 'Ghi chép biên bản tiếp nhận tài trợ và nhập kho',
      assignee: 'Thành viên tiểu ban',
      responsible: 'Nguyễn Hữu Lam',
      deadline: '2026-08-30T17:00:00+07:00',
      location: 'Trường',
      expected_result: 'Hồ sơ, biên bản đầy đủ',
      progress: 0,
      status: 'pending'
    },

    // --- IV) Tiểu ban lễ tân, khánh tiết ---
    {
      committee_id: getCommitteeId('lễ tân'),
      title: 'Tập luyện chương trình nghệ thuật chào mừng, tổng duyệt',
      assignee: 'Phạm Thị Ngọc Thi, Lê Thị Phương',
      responsible: 'Phạm Thị Nguyệt Thơ',
      deadline: '2026-09-01T17:00:00+07:00',
      location: 'Sân khấu',
      expected_result: 'Chương trình sẵn sàng',
      progress: 30,
      status: 'pending'
    },
    {
      committee_id: getCommitteeId('lễ tân'),
      title: 'Chốt số lượng khách mời chính thức (110 dự kiến)',
      assignee: 'Lương Thị Kim Thu',
      responsible: 'Phạm Thị Nguyệt Thơ',
      deadline: '2026-08-08T17:00:00+07:00',
      location: 'Văn phòng',
      expected_result: 'Danh sách khách mời chính thức',
      progress: 80,
      status: 'pending'
    },
    {
      committee_id: getCommitteeId('lễ tân'),
      title: 'Hoàn thiện, in và gửi giấy mời đại biểu',
      assignee: 'Lê Thị Phương, Lương Thị Kim Thu',
      responsible: 'Phạm Thị Nguyệt Thơ',
      deadline: '2026-08-10T17:00:00+07:00',
      location: 'Văn phòng',
      expected_result: 'Đã gửi giấy mời',
      progress: 0,
      status: 'pending'
    },
    {
      committee_id: getCommitteeId('lễ tân'),
      title: 'Tổ chức tập huấn Đội lễ tân học sinh (37 em)',
      assignee: 'Thầy Hoàng',
      responsible: 'Lương Thị Kim Thu',
      deadline: '2026-08-22T17:00:00+07:00',
      location: 'Trường',
      expected_result: 'Đội lễ tân thành thục',
      progress: 0,
      status: 'pending'
    },
    {
      committee_id: getCommitteeId('lễ tân'),
      title: 'Chốt phương án, số lượng quà tặng và đặt in',
      assignee: 'Trần Thị Quỳnh Hoa',
      responsible: 'Phạm Thị Nguyệt Thơ',
      deadline: '2026-08-24T17:00:00+07:00',
      location: 'Trường',
      expected_result: 'Quà tặng sẵn sàng',
      progress: 0,
      status: 'pending'
    },
    {
      committee_id: getCommitteeId('lễ tân'),
      title: 'Trang trí, khánh tiết (sân khấu LED, pano, khẩu hiệu)',
      assignee: 'Lê Ngọc Oanh, Dương Văn Minh',
      responsible: 'Phạm Thị Nguyệt Thơ',
      deadline: '2026-08-25T17:00:00+07:00',
      location: 'Sân trường',
      expected_result: 'Hoàn thiện trang trí',
      progress: 0,
      status: 'pending'
    },

    // --- V) Tiểu ban An ninh, y tế ---
    {
      committee_id: getCommitteeId('an ninh'),
      title: 'Gửi công văn phối hợp với công an địa phương, điện lực',
      assignee: 'Nghiêm Xuân Bảo',
      responsible: 'Nguyễn Hữu Lam',
      deadline: '2026-08-15T17:00:00+07:00',
      location: 'Trường',
      expected_result: 'Công văn được duyệt',
      progress: 0,
      status: 'pending'
    },
    {
      committee_id: getCommitteeId('an ninh'),
      title: 'Triển khai dọn vệ sinh, lao động',
      assignee: 'Thành viên tiểu ban',
      responsible: 'Nguyễn Hữu Lam',
      deadline: '2026-08-30T17:00:00+07:00',
      location: 'Khuôn viên trường',
      expected_result: 'Sạch sẽ',
      progress: 0,
      status: 'pending'
    },
    
    // --- VII) Tiểu ban thi đua khen thưởng ---
    {
      committee_id: getCommitteeId('thi đua'),
      title: 'Hoàn thiện và nộp hồ sơ khen thưởng cấp tỉnh, cấp Sở',
      assignee: 'Nghiêm Xuân Bảo',
      responsible: 'Nguyễn Hữu Lam',
      deadline: '2026-07-30T17:00:00+07:00',
      location: 'Sở GD-ĐT',
      expected_result: 'Đã nộp',
      progress: 100,
      status: 'completed'
    },
    {
      committee_id: getCommitteeId('thi đua'),
      title: 'Trình HT ban hành QĐ khen thưởng cấp trường',
      assignee: 'Nghiêm Xuân Bảo',
      responsible: 'Nguyễn Hữu Lam',
      deadline: '2026-08-30T17:00:00+07:00',
      location: 'Văn phòng',
      expected_result: 'Quyết định được ký',
      progress: 0,
      status: 'pending'
    },
    {
      committee_id: getCommitteeId('thi đua'),
      title: 'Thống kê danh sách cựu GV, HS đăng bảng vàng truyền thống',
      assignee: 'Thành viên tiểu ban',
      responsible: 'Nguyễn Hữu Lam',
      deadline: '2026-08-15T17:00:00+07:00',
      location: 'Trường',
      expected_result: 'Danh sách hoàn thiện',
      progress: 0,
      status: 'pending'
    },
    {
      committee_id: getCommitteeId('thi đua'),
      title: 'Thiết kế cúp lưu niệm/kỷ niệm chương vinh danh',
      assignee: 'Thành viên tiểu ban',
      responsible: 'Nguyễn Hữu Lam',
      deadline: '2026-08-20T17:00:00+07:00',
      location: 'Trường',
      expected_result: 'Thiết kế hoàn thiện',
      progress: 0,
      status: 'pending'
    }
  ];

  console.log(`Tiến hành chèn ${tasksData.length} công việc...`);
  const { data, error } = await supabase.from('cbq_tasks').insert(tasksData);
  
  if (error) {
    console.error('Lỗi chèn dữ liệu:', error);
  } else {
    console.log('Chèn dữ liệu thành công!');
  }
}

seedData();
