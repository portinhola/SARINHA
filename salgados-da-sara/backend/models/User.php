<?php
class User {
    private $conn;
    private $table_name = "users";

    public $id;
    public $name;
    public $phone;
    public $email;
    public $address;
    public $number;
    public $complement;
    public $city;
    public $password;
    public $is_admin;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Create user
    function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET name=:name, phone=:phone, email=:email, address=:address, 
                      number=:number, complement=:complement, city=:city, 
                      password=:password, is_admin=:is_admin";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->address = htmlspecialchars(strip_tags($this->address));
        $this->number = htmlspecialchars(strip_tags($this->number));
        $this->complement = htmlspecialchars(strip_tags($this->complement));
        $this->city = htmlspecialchars(strip_tags($this->city));
        $this->password = password_hash($this->password, PASSWORD_DEFAULT);
        $this->is_admin = $this->is_admin ?? false;

        // Bind values
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":address", $this->address);
        $stmt->bindParam(":number", $this->number);
        $stmt->bindParam(":complement", $this->complement);
        $stmt->bindParam(":city", $this->city);
        $stmt->bindParam(":password", $this->password);
        $stmt->bindParam(":is_admin", $this->is_admin, PDO::PARAM_BOOL);

        if($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    // Login user
    function login($phone, $password) {
        $query = "SELECT id, name, phone, email, address, number, complement, city, password, is_admin, created_at 
                  FROM " . $this->table_name . " 
                  WHERE phone = :phone";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":phone", $phone);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if(password_verify($password, $row['password'])) {
                $this->id = $row['id'];
                $this->name = $row['name'];
                $this->phone = $row['phone'];
                $this->email = $row['email'];
                $this->address = $row['address'];
                $this->number = $row['number'];
                $this->complement = $row['complement'];
                $this->city = $row['city'];
                $this->is_admin = $row['is_admin'];
                $this->created_at = $row['created_at'];
                return true;
            }
        }

        return false;
    }

    // Check if user exists
    function userExists() {
        $query = "SELECT id FROM " . $this->table_name . " 
                  WHERE phone = :phone OR email = :email";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":email", $this->email);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }

    // Get user by ID
    function readOne() {
        $query = "SELECT id, name, phone, email, address, number, complement, city, is_admin, created_at 
                  FROM " . $this->table_name . " 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $this->name = $row['name'];
            $this->phone = $row['phone'];
            $this->email = $row['email'];
            $this->address = $row['address'];
            $this->number = $row['number'];
            $this->complement = $row['complement'];
            $this->city = $row['city'];
            $this->is_admin = $row['is_admin'];
            $this->created_at = $row['created_at'];
            return true;
        }

        return false;
    }

    // Get user by phone for password recovery
    function getByPhone($phone) {
        $query = "SELECT id, name, phone, email FROM " . $this->table_name . " 
                  WHERE phone = :phone";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":phone", $phone);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }

        return false;
    }
}
?>