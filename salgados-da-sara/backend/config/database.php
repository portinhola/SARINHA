<?php
class Database {
    private $host = '127.0.0.1';
    private $db_name = 'salgados_da_sara';
    private $username = 'postgres';
    private $password = 'postgres';
    private $port = '5432';
    public $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "pgsql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name;
            $this->conn = new PDO($dsn, $this->username, $this->password);
            
            // Para PostgreSQL, usamos SET client_encoding ao invés de set names utf8
            $this->conn->exec("SET client_encoding TO 'UTF8'");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Definir timezone
            $this->conn->exec("SET timezone TO 'America/Sao_Paulo'");
            
        } catch(PDOException $exception) {
            // Log do erro para debug
            error_log("Database connection error: " . $exception->getMessage());
            echo json_encode([
                'success' => false,
                'message' => 'Erro de conexão com banco de dados: ' . $exception->getMessage()
            ]);
            exit();
        }

        return $this->conn;
    }
}
?>