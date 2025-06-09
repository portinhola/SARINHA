<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../models/Order.php';

$database = new Database();
$db = $database->getConnection();

$order = new Order($db);

// Check if user_id is provided for filtering
$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if($user_id) {
    $stmt = $order->readByUser($user_id);
} else {
    $stmt = $order->readAll();
}

$num = $stmt->rowCount();

if($num > 0) {
    $orders_arr = array();
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);
        
        $order_item = array(
            "id" => $id,
            "order_number" => $order_number,
            "user_id" => $user_id,
            "customer_data" => json_decode($customer_data, true),
            "items" => json_decode($items, true),
            "subtotal" => floatval($subtotal),
            "delivery_fee" => floatval($delivery_fee),
            "total" => floatval($total),
            "is_delivery" => $is_delivery,
            "payment_method" => $payment_method,
            "status" => $status,
            "rejection_reason" => $rejection_reason,
            "created_at" => $created_at
        );
        
        // Add status history
        $order->id = $id;
        $history_stmt = $order->getStatusHistory();
        $status_history = array();
        
        while($history_row = $history_stmt->fetch(PDO::FETCH_ASSOC)) {
            $status_history[] = array(
                "status" => $history_row['status'],
                "description" => $history_row['description'],
                "created_at" => $history_row['created_at']
            );
        }
        
        $order_item["status_history"] = $status_history;
        
        array_push($orders_arr, $order_item);
    }
    
    http_response_code(200);
    echo json_encode(array(
        "success" => true,
        "data" => $orders_arr
    ));
} else {
    http_response_code(200);
    echo json_encode(array(
        "success" => true,
        "data" => array()
    ));
}
?>