<?php
// auth_login.php - Xác thực người dùng và phân quyền
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db_config.php';

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!$data || !isset($data['username']) || !isset($data['password'])) {
    echo json_encode(['success' => false, 'error' => 'Vui lòng nhập đầy đủ Tài khoản và Mật khẩu']);
    exit();
}

$user = trim($data['username']);
$pass = trim($data['password']);
$hash = md5($pass);

try {
    $stmt = $pdo->prepare("SELECT username, full_name, role, council_code FROM system_users WHERE username = :u AND password_hash = :p");
    $stmt->execute([':u' => $user, ':p' => $hash]);
    $account = $stmt->fetch();

    if ($account) {
        echo json_encode(['success' => true, 'account' => $account]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Tài khoản hoặc mật khẩu không chính xác.']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Lỗi xác thực CSDL: ' . $e->getMessage()]);
}
?>
