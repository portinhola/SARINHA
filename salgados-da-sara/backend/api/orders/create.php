<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../models/Order.php';

$database = new Database();
$db = $database->getConnection();

$order = new Order($db);

// Get posted data
$data = json_decode(file_get_contents("php://input"));

if(!empty($data->user_id) && !empty($data->items) && !empty($data->total)) {
    
    $order->user_id = $data->user_id;
    $order->customer_data = $data->customer_data;
    $order->items = $data->items;
    $order->subtotal = $data->subtotal;
    $order->delivery_fee = $data->delivery_fee ?? 0;
    $order->total = $data->total;
    $order->is_delivery = $data->is_delivery ?? false;
    $order->payment_method = $data->payment_method ?? 'cash';
    $order->status = 'pending';

    if($order->create()) {
        http_response_code(201);
        echo json_encode(array(
            "success" => true,
            "message" => "Pedido criado com sucesso!",
            "order_id" => $order->id,
            "order_number" => $order->order_number
        ));
    } else {
        http_response_code(500);
        echo json_encode(array(
            "success" => false,
            "message" => "Erro ao criar pedido"
        ));
    }
} else {
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => "Dados incompletos"
    ));
}
?>