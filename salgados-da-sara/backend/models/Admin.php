<?php
class Admin {
    private $conn;
    private $table_name = "admin_users";

    public $id;
    public $username;
    public $password;
    public $role;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Create admin
    function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET username=:username, password=:password, role=:role";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->username = htmlspecialchars(strip_tags($this->username));
        $this->password = password_hash($this->password, PASSWORD_DEFAULT);
        $this->role = htmlspecialchars(strip_tags($this->role));

        // Bind values
        $stmt->bindParam(":username", $this->username);
        $stmt->bindParam(":password", $this->password);
        $stmt->bindParam(":role", $this->role);

        if($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    // Login admin
    function login($username, $password) {
        $query = "SELECT id, username, password, role, created_at 
                  FROM " . $this->table_name . " 
                  WHERE username = :username";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":username", $username);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if(password_verify($password, $row['password'])) {
                $this->id = $row['id'];
                $this->username = $row['username'];
                $this->role = $row['role'];
                $this->created_at = $row['created_at'];
                return true;
            }
        }

        return false;
    }

    // Get all admins
    function readAll() {
        $query = "SELECT id, username, role, created_at 
                  FROM " . $this->table_name . " 
                  ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    // Delete admin
    function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);

        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Check if username exists
    function usernameExists() {
        $query = "SELECT id FROM " . $this->table_name . " 
                  WHERE username = :username";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":username", $this->username);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }
}
?>