<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../models/Product.php';

$database = new Database();
$db = $database->getConnection();

$product = new Product($db);

$stmt = $product->readAll();
$num = $stmt->rowCount();

if($num > 0) {
    $products_arr = array();
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);
        
        $product_item = array(
            "id" => $id,
            "name" => $name,
            "price" => floatval($price),
            "category" => $category,
            "description" => $description,
            "is_portioned" => $is_portioned,
            "is_custom" => $is_custom,
            "created_at" => $created_at
        );
        
        array_push($products_arr, $product_item);
    }
    
    http_response_code(200);
    echo json_encode(array(
        "success" => true,
        "data" => $products_arr
    ));
} else {
    http_response_code(200);
    echo json_encode(array(
        "success" => true,
        "data" => array()
    ));
}
?>