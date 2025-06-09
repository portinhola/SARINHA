<?php
// Habilitar exibição de erros para debug
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Headers CORS primeiro
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Verificar se é requisição OPTIONS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Testar conexão com banco
    include_once '../config/database.php';
    
    $database = new Database();
    $db = $database->getConnection();
    
    if ($db) {
        $response = [
            'success' => true,
            'message' => 'Backend PHP está funcionando!',
            'database' => 'Conexão com PostgreSQL OK',
            'timestamp' => date('Y-m-d H:i:s'),
            'php_version' => phpversion()
        ];
    } else {
        $response = [
            'success' => false,
            'message' => 'Erro na conexão com o banco de dados',
            'timestamp' => date('Y-m-d H:i:s'),
            'php_version' => phpversion()
        ];
    }
} catch (Exception $e) {
    $response = [
        'success' => false,
        'message' => 'Erro: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s'),
        'php_version' => phpversion()
    ];
}

echo json_encode($response, JSON_PRETTY_PRINT);
?>