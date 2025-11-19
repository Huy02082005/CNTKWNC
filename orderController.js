const sql = require("mssql");
const config = require("../db");

const orderController = {
  // Lấy tất cả đơn hàng
  getAllOrders: async (req, res) => {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT o.*, c.FullName, c.Email, c.Phone
        FROM [Order] o
        LEFT JOIN Customer c ON o.CustomerID = c.CustomerID
        ORDER BY o.OrderDate DESC
      `);
      res.json(result.recordset);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  // Lấy chi tiết đơn hàng - SỬA HOÀN TOÀN QUERY NÀY
getOrderDetail: async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await sql.connect(config);

    // Lấy thông tin đơn hàng
    const orderResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT o.*, c.FullName, c.Email, c.Phone, c.Address
        FROM [Order] o
        LEFT JOIN Customer c ON o.CustomerID = c.CustomerID
        WHERE o.OrderID = @id
      `);

    if (orderResult.recordset.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    // Lấy chi tiết sản phẩm trong đơn hàng - QUAN TRỌNG: SỬA QUERY NÀY
    const detailResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          od.OrderID,
          od.ProductID,
          od.Quantity,
          od.UnitPrice as Price,  -- QUAN TRỌNG: ĐỔI TÊN UnitPrice thành Price
          od.Discount,
          p.ProductName, 
          p.ImageURL
        FROM OrderDetail od
        LEFT JOIN Product p ON od.ProductID = p.ProductID
        WHERE od.OrderID = @id
      `);

    console.log("💰 DEBUG Order Details:", detailResult.recordset); // Thêm log để debug

    res.json({
      order: orderResult.recordset[0],
      orderDetails: detailResult.recordset
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
},

// Cập nhật trạng thái đơn hàng
updateOrderStatus: async (req, res) => {
  try {
    const { id } = req.params;
    const { Status } = req.body;

    console.log("🔄 UPDATE ORDER STATUS REQUEST:");
    console.log("Order ID:", id);
    console.log("New Status:", Status);

    // Danh sách các status hợp lệ theo CHECK constraint trong database
    const validStatuses = ['pending', 'paid', 'shipping', 'completed', 'cancelled'];
    
    if (!Status) {
      return res.status(400).json({ message: "Thiếu trường Status" });
    }

    // Kiểm tra status có hợp lệ không
    if (!validStatuses.includes(Status)) {
      return res.status(400).json({ 
        message: "Trạng thái không hợp lệ",
        validStatuses: validStatuses,
        receivedStatus: Status
      });
    }

    const pool = await sql.connect(config);
    console.log("✅ Database connected");

    // Kiểm tra xem đơn hàng có tồn tại không
    const checkResult = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT OrderID, Status FROM [Order] WHERE OrderID = @id');

    console.log("📋 Check order exists:", checkResult.recordset);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    console.log("📋 Current order status:", checkResult.recordset[0].Status);

    // Cập nhật trạng thái
    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('Status', sql.NVarChar(50), Status)
      .query(`
        UPDATE [Order] 
        SET Status = @Status
        WHERE OrderID = @id
      `);

    console.log("✅ Update successful, rows affected:", result.rowsAffected[0]);

    res.json({ 
      message: "Cập nhật trạng thái thành công",
      orderId: id,
      newStatus: Status 
    });

  } catch (err) {
    console.error("❌ SERVER ERROR in updateOrderStatus:");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    
    res.status(500).json({ 
      message: "Lỗi server khi cập nhật trạng thái",
      error: err.message
    });
  }
},

  // Lấy thống kê đơn hàng - THÊM FUNCTION NÀY
  getOrderStats: async (req, res) => {
    try {
      const pool = await sql.connect(config);
      
      // Lấy tổng số đơn hàng
      const totalResult = await pool.request().query(`
        SELECT COUNT(*) as TotalOrders FROM [Order]
      `);
      
      // Lấy số đơn hàng theo trạng thái
      const statusResult = await pool.request().query(`
        SELECT 
          COUNT(CASE WHEN Status IN ('pending', 'processing') THEN 1 END) as PendingOrders,
          COUNT(CASE WHEN Status = 'shipping' THEN 1 END) as ShippingOrders,
          COUNT(CASE WHEN Status IN ('completed', 'delivered') THEN 1 END) as CompletedOrders
        FROM [Order]
      `);
      
      // Lấy tổng doanh thu từ các đơn hàng đã hoàn thành
      const revenueResult = await pool.request().query(`
        SELECT ISNULL(SUM(TotalPrice), 0) as TotalRevenue 
        FROM [Order] 
        WHERE Status IN ('completed', 'delivered')
      `);

      res.json({
        totalOrders: totalResult.recordset[0].TotalOrders,
        pendingOrders: statusResult.recordset[0].PendingOrders,
        shippingOrders: statusResult.recordset[0].ShippingOrders,
        completedOrders: statusResult.recordset[0].CompletedOrders,
        totalRevenue: revenueResult.recordset[0].TotalRevenue
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server khi lấy thống kê" });
    }
  }
};

module.exports = orderController;