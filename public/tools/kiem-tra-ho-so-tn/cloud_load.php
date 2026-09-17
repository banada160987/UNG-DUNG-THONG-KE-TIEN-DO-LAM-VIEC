<?php
// cloud_load.php - Đọc toàn bộ dữ liệu kỳ thi từ MySQL (Bảng exam_workspaces)
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once 'db_config.php';

$councilCode = isset($_GET['council_code']) && !empty($_GET['council_code']) ? $_GET['council_code'] : 'DEFAULT_COUNCIL';

try {
    $stmt = $pdo->prepare("SELECT workspace_data, last_updated FROM exam_workspaces WHERE council_code = :code");
    $stmt->execute([':code' => $councilCode]);
    $row = $stmt->fetch();

    if ($row && !empty($row['workspace_data'])) {
        $payloadObj = json_decode($row['workspace_data'], true);
        if (!$payloadObj) {
            $payloadObj = $row['workspace_data'];
        }
        echo json_encode([
            'success' => true, 
            'updated_at' => $row['last_updated'], 
            'payload' => $payloadObj
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['success' => false, 'error' => 'Chưa có bản sao lưu trên Cloud Database cho Hội đồng thi này.']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Lỗi tải dữ liệu CSDL: ' . $e->getMessage()]);
}
?>
