const sql = require("mssql");
const config = require("../db");

const customerController = {
  // Lấy tất cả khách hàng
  getAllCustomers: async (req, res) => {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT 
          c.CustomerID,
          c.FullName,
          c.Email, 
          c.Phone,
          c.Address,
          c.RegisterDate,
          a.Username,
          ISNULL(a.Role, 'customer') as Role,  -- Nếu NULL thì mặc định là customer
          ISNULL(a.Status, 1) as AccountStatus -- Nếu NULL thì mặc định là active (1)
        FROM Customer c
        LEFT JOIN Account a ON c.CustomerID = a.CustomerID
        ORDER BY c.RegisterDate DESC
      `);
      
      console.log("📊 Customers data:", result.recordset);
      res.json(result.recordset);
      
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  // Lấy thống kê khách hàng
  getCustomerStats: async (req, res) => {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT 
          COUNT(*) as TotalCustomers,
          COUNT(CASE WHEN a.Role = 'admin' THEN 1 END) as TotalAdmins,
          COUNT(CASE WHEN a.Status = 0 THEN 1 END) as InactiveAccounts,
          FORMAT(MAX(RegisterDate), 'dd/MM/yyyy') as LatestRegistration
        FROM Customer c
        LEFT JOIN Account a ON c.CustomerID = a.CustomerID
      `);
      res.json(result.recordset[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  createCustomer: async (req, res) => {
  try {
    console.log("🎯 CREATE CUSTOMER được gọi!");
    const { FullName, Email, Phone, Address, Role } = req.body;
    console.log("📦 Body data:", req.body);

    const pool = await sql.connect(config);
    console.log("✅ Database connected");

    // Kiểm tra email đã tồn tại chưa
    const checkEmail = await pool.request()
      .input('Email', sql.NVarChar, Email)
      .query('SELECT CustomerID FROM Customer WHERE Email = @Email');
    
    if (checkEmail.recordset.length > 0) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    // Thêm khách hàng
    const customerResult = await pool.request()
      .input('FullName', sql.NVarChar, FullName)
      .input('Email', sql.NVarChar, Email)
      .input('Phone', sql.NVarChar, Phone)
      .input('Address', sql.NVarChar, Address)
      .query(`
        INSERT INTO Customer (FullName, Email, Phone, Address, RegisterDate)
        OUTPUT INSERTED.*
        VALUES (@FullName, @Email, @Phone, @Address, GETDATE())
      `);

    const newCustomer = customerResult.recordset[0];
    console.log("✅ Customer created:", newCustomer);

    res.status(201).json({
      message: "Thêm người dùng thành công",
      customer: newCustomer
    });

  } catch (err) {
    console.error("💥 Lỗi trong createCustomer:", err);
    res.status(500).json({ 
      message: "Lỗi server: " + err.message 
    });
  }
},

  // CẬP NHẬT NGƯỜI DÙNG - XÓA PHẦN STATUS
updateCustomer: async (req, res) => {
  try {
    const { id } = req.params;
    const { FullName, Email, Phone, Address, Role } = req.body; // XÓA Status

    console.log("🎯 UPDATE CUSTOMER được gọi - ID:", id);
    console.log("📦 Data nhận được:", { FullName, Email, Phone, Address, Role });

    const pool = await sql.connect(config);
    
    // Cập nhật Customer
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('FullName', sql.NVarChar, FullName)
      .input('Email', sql.NVarChar, Email)
      .input('Phone', sql.NVarChar, Phone)
      .input('Address', sql.NVarChar, Address)
      .query(`
        UPDATE Customer 
        SET FullName = @FullName, 
            Email = @Email, 
            Phone = @Phone, 
            Address = @Address
        WHERE CustomerID = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // CHỈ CẬP NHẬT ROLE, KHÔNG CẬP NHẬT STATUS
    if (Role !== undefined) {
      // Kiểm tra xem account đã tồn tại chưa
      const accountCheck = await pool.request()
        .input('CustomerID', sql.Int, id)
        .query('SELECT AccountID FROM Account WHERE CustomerID = @CustomerID');

      if (accountCheck.recordset.length > 0) {
        // Update existing account - CHỈ CẬP NHẬT ROLE
        await pool.request()
          .input('CustomerID', sql.Int, id)
          .input('Role', sql.NVarChar, Role)
          .query('UPDATE Account SET Role = @Role WHERE CustomerID = @CustomerID');
        console.log("✅ Account Role updated");
      } else if (Role && Role !== 'customer') {
        // Create new account if doesn't exist and role is not customer
        await pool.request()
          .input('CustomerID', sql.Int, id)
          .input('Username', sql.NVarChar, Email.split('@')[0])
          .input('Password', sql.NVarChar, 'default123')
          .input('Role', sql.NVarChar, Role)
          .input('Status', sql.Bit, 1) // MẶC ĐỊNH LÀ ACTIVE
          .query(`
            INSERT INTO Account (CustomerID, Username, Password, Role, Status)
            VALUES (@CustomerID, @Username, @Password, @Role, @Status)
          `);
        console.log("✅ New account created");
      }
    }

    res.json({ message: "Cập nhật người dùng thành công" });

  } catch (err) {
    console.error("💥 Lỗi trong updateCustomer:", err);
    res.status(500).json({ message: "Lỗi server: " + err.message });
  }
},

  // XÓA NGƯỜI DÙNG
  deleteCustomer: async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await sql.connect(config);

      // Xóa account trước (vì có foreign key constraint)
      await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Account WHERE CustomerID = @id');

      // Xóa customer
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Customer WHERE CustomerID = @id');

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }

      res.json({ message: "Xóa người dùng thành công" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server" });
    }
  }
};


module.exports = customerController;