<?php
// cloud_save.php - Ghi toàn bộ dữ liệu hệ thống kỳ thi lên MySQL (Bảng exam_workspaces)
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

if (!$data || !isset($data['payload'])) {
    echo json_encode(['success' => false, 'error' => 'Dữ liệu tải lên không hợp lệ']);
    exit();
}

$councilCode = isset($data['council_code']) && !empty($data['council_code']) ? $data['council_code'] : 'DEFAULT_COUNCIL';
$councilName = isset($data['council_name']) ? $data['council_name'] : 'THPT CAO BÁ QUÁT';
$examYear = 2026;
$payloadStr = is_string($data['payload']) ? $data['payload'] : json_encode($data['payload'], JSON_UNESCAPED_UNICODE);

try {
    $stmt = $pdo->prepare("
        INSERT INTO exam_workspaces (council_code, council_name, exam_year, workspace_data, last_updated)
        VALUES (:code, :name, :year, :data, NOW())
        ON DUPLICATE KEY UPDATE 
            council_name = VALUES(council_name),
            exam_year = VALUES(exam_year),
            workspace_data = VALUES(workspace_data),
            last_updated = NOW()
    ");

    $stmt->execute([
        ':code' => $councilCode,
        ':name' => $councilName,
        ':year' => $examYear,
        ':data' => $payloadStr
    ]);

    echo json_encode(['success' => true, 'message' => 'Đã đồng bộ thành công dữ liệu kỳ thi lên Cloud MySQL (Bảng exam_workspaces)!']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Lỗi lưu trữ Cloud CSDL: ' . $e->getMessage()]);
}
?>
