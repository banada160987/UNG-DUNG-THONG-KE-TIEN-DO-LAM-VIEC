<?php
// db_config.php - Cấu hình kết nối MySQL 8.0 (Host fdb1027.biz.nf)
$host = "fdb1027.biz.nf";
$user = "4537759_4537759";
$pass = "09102024a@.CBQ";
$dbname = "4537759_4537759";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);

    // Tự động kiểm tra và khởi tạo bảng người dùng nếu chưa tồn tại
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS system_users (
            username VARCHAR(50) PRIMARY KEY,
            password_hash VARCHAR(255),
            full_name VARCHAR(100),
            role VARCHAR(20),
            council_code VARCHAR(50)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // Tự động kiểm tra và khởi tạo bảng sao lưu dữ liệu kỳ thi nếu chưa tồn tại
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS exam_workspaces (
            council_code VARCHAR(50) PRIMARY KEY,
            council_name VARCHAR(255),
            exam_year INT,
            workspace_data LONGTEXT,
            last_updated DATETIME
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // Chèn sẵn 2 tài khoản mặc định (Mật khẩu md5 của 123456 là e10adc3949ba59abbe56e057f20f883e)
    $pdo->exec("
        INSERT IGNORE INTO system_users (username, password_hash, full_name, role, council_code) VALUES 
        ('admin', 'e10adc3949ba59abbe56e057f20f883e', 'Chủ Tịch Hội Đồng', 'admin', 'THPT_CBQ'),
        ('giamthi', 'e10adc3949ba59abbe56e057f20f883e', 'Cán Bộ Giám Thị 1', 'proctor', 'THPT_CBQ');
    ");
} catch (PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Lỗi kết nối Database CSDL: ' . $e->getMessage()]);
    exit();
}
?>
