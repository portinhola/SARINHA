<?php
// Headers primeiro para evitar problemas
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Habilitar debug temporariamente
error_reporting(E_ALL);
ini_set('display_errors', 0); // Não mostrar erros na saída para não quebrar JSON

try {
    include_once '../../config/database.php';
    include_once '../../models/User.php';

    $database = new Database();
    $db = $database->getConnection();

    if (!$db) {
        throw new Exception('Falha na conexão com banco de dados');
    }

    $user = new User($db);

    // Get posted data
    $input = file_get_contents("php://input");
    $data = json_decode($input);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('JSON inválido recebido');
    }

    // Validate required fields
    $required_fields = ['name', 'phone', 'email', 'address', 'number', 'city', 'password', 'confirmPassword'];
    $errors = array();

    foreach($required_fields as $field) {
        if(empty($data->$field)) {
            $errors[$field] = ucfirst($field) . " é obrigatório";
        }
    }

    // Validate email format
    if(!empty($data->email) && !filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = "Email inválido";
    }

    // Validate password length
    if(!empty($data->password) && strlen($data->password) < 6) {
        $errors['password'] = "Senha deve ter pelo menos 6 caracteres";
    }

    // Validate password confirmation
    if(!empty($data->password) && !empty($data->confirmPassword) && $data->password !== $data->confirmPassword) {
        $errors['confirmPassword'] = "Senhas não coincidem";
    }

    // Check if user already exists
    if(empty($errors)) {
        $user->phone = $data->phone;
        $user->email = $data->email;
        
        if($user->userExists()) {
            $errors['general'] = "Usuário já cadastrado com este telefone ou email";
        }
    }

    if(!empty($errors)) {
        http_response_code(400);
        echo json_encode(array(
            "success" => false,
            "errors" => $errors
        ));
    } else {
        // Set user properties
        $user->name = $data->name;
        $user->phone = $data->phone;
        $user->email = $data->email;
        $user->address = $data->address;
        $user->number = $data->number;
        $user->complement = $data->complement ?? '';
        $user->city = $data->city;
        $user->password = $data->password;
        $user->is_admin = false;

        if($user->create()) {
            // Get the created user data
            $user->readOne();
            
            $response = array(
                "success" => true,
                "message" => "Conta criada com sucesso!",
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
            
            http_response_code(201);
            echo json_encode($response);
        } else {
            http_response_code(500);
            echo json_encode(array(
                "success" => false,
                "message" => "Erro ao criar conta"
            ));
        }
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erro interno: ' . $e->getMessage()
    ]);
}
?>