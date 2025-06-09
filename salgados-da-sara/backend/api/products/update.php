<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../models/Product.php';

$database = new Database();
$db = $database->getConnection();

$product = new Product($db);

// Get posted data
$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id) && !empty($data->name) && !empty($data->price) && !empty($data->category)) {
    
    $product->id = $data->id;
    $product->name = $data->name;
    $product->price = $data->price;
    $product->category = $data->category;
    $product->description = $data->description ?? '';
    $product->is_portioned = $data->is_portioned ?? false;

    if($product->update()) {
        http_response_code(200);
        echo json_encode(array(
            "success" => true,
            "message" => "Produto atualizado com sucesso!"
        ));
    } else {
        http_response_code(500);
        echo json_encode(array(
            "success" => false,
            "message" => "Erro ao atualizar produto"
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