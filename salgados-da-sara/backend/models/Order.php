<?php
class Order {
    private $conn;
    private $table_name = "orders";

    public $id;
    public $order_number;
    public $user_id;
    public $customer_data;
    public $items;
    public $subtotal;
    public $delivery_fee;
    public $total;
    public $is_delivery;
    public $payment_method;
    public $status;
    public $rejection_reason;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Create order
    function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET order_number=:order_number, user_id=:user_id, customer_data=:customer_data, 
                      items=:items, subtotal=:subtotal, delivery_fee=:delivery_fee, total=:total,
                      is_delivery=:is_delivery, payment_method=:payment_method, status=:status";

        $stmt = $this->conn->prepare($query);

        // Generate order number if not provided
        if(empty($this->order_number)) {
            $this->order_number = $this->generateOrderNumber();
        }

        // Sanitize
        $this->order_number = htmlspecialchars(strip_tags($this->order_number));
        $this->payment_method = htmlspecialchars(strip_tags($this->payment_method));
        $this->status = $this->status ?? 'pending';
        $this->is_delivery = $this->is_delivery ?? false;

        // Convert arrays to JSON
        $customer_data_json = json_encode($this->customer_data);
        $items_json = json_encode($this->items);

        // Bind values
        $stmt->bindParam(":order_number", $this->order_number);
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":customer_data", $customer_data_json);
        $stmt->bindParam(":items", $items_json);
        $stmt->bindParam(":subtotal", $this->subtotal);
        $stmt->bindParam(":delivery_fee", $this->delivery_fee);
        $stmt->bindParam(":total", $this->total);
        $stmt->bindParam(":is_delivery", $this->is_delivery, PDO::PARAM_BOOL);
        $stmt->bindParam(":payment_method", $this->payment_method);
        $stmt->bindParam(":status", $this->status);

        if($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            
            // Create status history entry
            $this->createStatusHistory('pending', 'Pedido recebido - Aguardando confirmação');
            
            return true;
        }

        return false;
    }

    // Read all orders
    function readAll() {
        $query = "SELECT o.*, u.name as user_name 
                  FROM " . $this->table_name . " o
                  LEFT JOIN users u ON o.user_id = u.id
                  ORDER BY o.created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt;
    }

    // Read orders by user
    function readByUser($user_id) {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE user_id = :user_id 
                  ORDER BY created_at DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();

        return $stmt;
    }

    // Read one order
    function readOne() {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $this->order_number = $row['order_number'];
            $this->user_id = $row['user_id'];
            $this->customer_data = json_decode($row['customer_data'], true);
            $this->items = json_decode($row['items'], true);
            $this->subtotal = $row['subtotal'];
            $this->delivery_fee = $row['delivery_fee'];
            $this->total = $row['total'];
            $this->is_delivery = $row['is_delivery'];
            $this->payment_method = $row['payment_method'];
            $this->status = $row['status'];
            $this->rejection_reason = $row['rejection_reason'];
            $this->created_at = $row['created_at'];
            return true;
        }

        return false;
    }

    // Update order status
    function updateStatus($new_status, $description = null, $rejection_reason = null) {
        $query = "UPDATE " . $this->table_name . " 
                  SET status=:status";
        
        if($rejection_reason) {
            $query .= ", rejection_reason=:rejection_reason";
        }
        
        $query .= " WHERE id=:id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":status", $new_status);
        $stmt->bindParam(":id", $this->id);
        
        if($rejection_reason) {
            $stmt->bindParam(":rejection_reason", $rejection_reason);
        }

        if($stmt->execute()) {
            // Create status history entry
            $desc = $description ?? $this->getStatusDescription($new_status);
            if($rejection_reason) {
                $desc = "Pedido recusado: " . $rejection_reason;
            }
            $this->createStatusHistory($new_status, $desc);
            
            $this->status = $new_status;
            if($rejection_reason) {
                $this->rejection_reason = $rejection_reason;
            }
            return true;
        }

        return false;
    }

    // Create status history entry
    private function createStatusHistory($status, $description) {
        $query = "INSERT INTO order_status_history 
                  SET order_id=:order_id, status=:status, description=:description";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":order_id", $this->id);
        $stmt->bindParam(":status", $status);
        $stmt->bindParam(":description", $description);
        $stmt->execute();
    }

    // Get status history
    function getStatusHistory() {
        $query = "SELECT * FROM order_status_history 
                  WHERE order_id = :order_id 
                  ORDER BY created_at ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":order_id", $this->id);
        $stmt->execute();

        return $stmt;
    }

    // Generate order number
    private function generateOrderNumber() {
        $query = "SELECT COUNT(*) as count FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $orderNumber = $row['count'] + 1;
        $date = date('dmY');
        
        return sprintf("#%03d-%s", $orderNumber, $date);
    }

    // Get status description
    private function getStatusDescription($status) {
        $descriptions = [
            'pending' => 'Aguardando Confirmação',
            'confirmed' => 'Em Preparação',
            'ready' => 'Pronto',
            'delivered' => 'Entregue',
            'rejected' => 'Recusado'
        ];
        
        return $descriptions[$status] ?? $status;
    }
}
?>