<?php
class Product {
    private $conn;
    private $table_name = "products";

    public $id;
    public $name;
    public $price;
    public $category;
    public $description;
    public $is_portioned;
    public $is_custom;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Create product
    function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET name=:name, price=:price, category=:category, 
                      description=:description, is_portioned=:is_portioned, is_custom=:is_custom";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->category = htmlspecialchars(strip_tags($this->category));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->is_portioned = $this->is_portioned ?? false;
        $this->is_custom = $this->is_custom ?? true;

        // Bind values
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":price", $this->price);
        $stmt->bindParam(":category", $this->category);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":is_portioned", $this->is_portioned, PDO::PARAM_BOOL);
        $stmt->bindParam(":is_custom", $this->is_custom, PDO::PARAM_BOOL);

        if($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    // Read all products
    function readAll() {
        $query = "SELECT id, name, price, category, description, is_portioned, is_custom, created_at 
                  FROM " . $this->table_name . " 
                  ORDER BY category, name";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    // Read one product
    function readOne() {
        $query = "SELECT id, name, price, category, description, is_portioned, is_custom, created_at 
                  FROM " . $this->table_name . " 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $this->name = $row['name'];
            $this->price = $row['price'];
            $this->category = $row['category'];
            $this->description = $row['description'];
            $this->is_portioned = $row['is_portioned'];
            $this->is_custom = $row['is_custom'];
            $this->created_at = $row['created_at'];
            return true;
        }

        return false;
    }

    // Update product
    function update() {
        $query = "UPDATE " . $this->table_name . " 
                  SET name=:name, price=:price, category=:category, 
                      description=:description, is_portioned=:is_portioned 
                  WHERE id=:id";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->category = htmlspecialchars(strip_tags($this->category));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->is_portioned = $this->is_portioned ?? false;

        // Bind values
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":price", $this->price);
        $stmt->bindParam(":category", $this->category);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":is_portioned", $this->is_portioned, PDO::PARAM_BOOL);
        $stmt->bindParam(":id", $this->id);

        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Delete product
    function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id AND is_custom = true";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);

        if($stmt->execute()) {
            return true;
        }

        return false;
    }
}
?>