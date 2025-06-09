<?php
include_once '../../config/cors.php';
include_once '../../config/database.php';
include_once '../../models/User.php';

$database = new Database();
$db = $database->getConnection();

$user = new User($db);

// Get posted data
$data = json_decode(file_get_contents("php://input"));

if(!empty($data->phone) && !empty($data->password)) {
    
    if($user->login($data->phone, $data->password)) {
        
        // Create response array
        $response = array(
            "success" => true,
            "message" => "Login realizado com sucesso!",
            "user" => array(
                "id" => $user->id,
                "name" => $user->name,
                "phone" => $user->phone,
                "email" => $user->email,
                "address" => $user->address,
                "number" => $user->number,
                "complement" => $user->complement,
                "city" => $user->city,
                "is_admin" => $user->is_admin,
                "created_at" => $user->created_at
            )
        );
        
        http_response_code(200);
        echo json_encode($response);
    } else {
        http_response_code(401);
        echo json_encode(array(
            "success" => false,
            "message" => "Telefone ou senha incorretos"
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