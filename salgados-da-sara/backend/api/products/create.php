<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../models/Product.php';

$database = new Database();
$db = $database->getConnection();

$product = new Product($db);

// Get posted data
$data = json_decode(file_get_contents("php://input"));

if(!empty($data->name) && !empty($data->price) && !empty($data->category)) {
    
    $product->name = $data->name;
    $product->price = $data->price;
    $product->category = $data->category;
    $product->description = $data->description ?? '';
    $product->is_portioned = $data->is_portioned ?? false;
    $product->is_custom = true;

    if($product->create()) {
        http_response_code(201);
        echo json_encode(array(
            "success" => true,
            "message" => "Produto criado com sucesso!",
            "id" => $product->id
        ));
    } else {
        http_response_code(500);
        echo json_encode(array(
            "success" => false,
            "message" => "Erro ao criar produto"
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