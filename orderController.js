const sql = require("mssql");
const config = require("../config/db");

const orderController = {
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

getOrderDetail: async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await sql.connect(config);

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

    res.json({
      order: orderResult.recordset[0],
      orderDetails: detailResult.recordset
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
},

updateOrderStatus: async (req, res) => {
  try {
    const { id } = req.params;
    const { Status } = req.body;

    const validStatuses = ['pending', 'paid', 'shipping', 'completed', 'cancelled'];
    
    if (!Status) {
      return res.status(400).json({ message: "Thiếu trường Status" });
    }

    if (!validStatuses.includes(Status)) {
      return res.status(400).json({ 
        message: "Trạng thái không hợp lệ",
        validStatuses: validStatuses,
        receivedStatus: Status
      });
    }

    const pool = await sql.connect(config);

    const checkResult = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query('SELECT OrderID, Status FROM [Order] WHERE OrderID = @id');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('Status', sql.NVarChar(50), Status)
      .query(`
        UPDATE [Order] 
        SET Status = @Status
        WHERE OrderID = @id
      `);

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

  getOrderStats: async (req, res) => {
    try {
      const pool = await sql.connect(config);

      const totalResult = await pool.request().query(`
        SELECT COUNT(*) as TotalOrders FROM [Order]
      `);

      const statusResult = await pool.request().query(`
        SELECT 
          COUNT(CASE WHEN Status IN ('pending', 'processing') THEN 1 END) as PendingOrders,
          COUNT(CASE WHEN Status = 'shipping' THEN 1 END) as ShippingOrders,
          COUNT(CASE WHEN Status IN ('completed', 'delivered') THEN 1 END) as CompletedOrders
        FROM [Order]
      `);

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
