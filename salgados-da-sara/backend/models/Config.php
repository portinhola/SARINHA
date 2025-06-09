<?php
class Config {
    private $conn;
    private $table_name = "app_config";

    public $id;
    public $config_key;
    public $config_value;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Get config value
    function getValue($key) {
        $query = "SELECT config_value FROM " . $this->table_name . " 
                  WHERE config_key = :key";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":key", $key);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row['config_value'];
        }

        return null;
    }

    // Set config value
    function setValue($key, $value) {
        // Check if key exists
        $check_query = "SELECT id FROM " . $this->table_name . " 
                        WHERE config_key = :key";
        $check_stmt = $this->conn->prepare($check_query);
        $check_stmt->bindParam(":key", $key);
        $check_stmt->execute();

        if($check_stmt->rowCount() > 0) {
            // Update existing
            $query = "UPDATE " . $this->table_name . " 
                      SET config_value = :value, updated_at = CURRENT_TIMESTAMP 
                      WHERE config_key = :key";
        } else {
            // Insert new
            $query = "INSERT INTO " . $this->table_name . " 
                      SET config_key = :key, config_value = :value";
        }

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":key", $key);
        $stmt->bindParam(":value", $value);

        return $stmt->execute();
    }

    // Get all config
    function getAll() {
        $query = "SELECT config_key, config_value FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        $config = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $config[$row['config_key']] = $row['config_value'];
        }

        return $config;
    }
}
?>