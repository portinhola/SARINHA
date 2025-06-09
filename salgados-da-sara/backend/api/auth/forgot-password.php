<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../models/User.php';

$database = new Database();
$db = $database->getConnection();

$user = new User($db);

// Get posted data
$data = json_decode(file_get_contents("php://input"));

if(!empty($data->phone)) {
    
    $userData = $user->getByPhone($data->phone);
    
    if($userData) {
        // In a real application, you would send an email/SMS here
        // For demo purposes, we'll return a success message
        http_response_code(200);
        echo json_encode(array(
            "success" => true,
            "message" => "Instruções de recuperação de senha foram enviadas para seu telefone"
        ));
    } else {
        http_response_code(404);
        echo json_encode(array(
            "success" => false,
            "message" => "Usuário não encontrado"
        ));
    }
} else {
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => "Telefone é obrigatório"
    ));
}
?>