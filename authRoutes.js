const express = require('express');
const sql = require('mssql');
const router = express.Router();

// IMPORT dbConfig từ db.js
const { dbConfig } = require('../db'); // hoặc '../db' tùy theo cấu trúc thư mục

// Login API
router.post('/login', async (req, res) => {
  try {
    console.log("📍 API /auth/login được gọi");
    console.log("📝 Body:", req.body);
    
    const { username, password } = req.body;

    // Kết nối database
    const pool = await sql.connect(dbConfig);
    console.log("✅ Database connected");
    
    // Query database
    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .query('SELECT Username, Password, Role FROM Account WHERE Username = @username');

    console.log("📊 Database result:", result.recordset);

    if (result.recordset.length === 0) {
      console.log("❌ User không tồn tại");
      return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
    }

    const user = result.recordset[0];
    
    // So sánh password plain text
    if (password !== user.Password) {
      console.log("❌ Password sai");
      return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
    }

    console.log("✅ Login thành công:", user.Username, user.Role);
    
    res.json({ 
      message: "Đăng nhập thành công",
      role: user.Role,
      username: user.Username
    });

  } catch (error) {
    console.error('❌ Lỗi đăng nhập:', error);
    res.status(500).json({ message: "Lỗi server: " + error.message });
  }
});

// Check email API (cho quên mật khẩu)
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    console.log("📧 Check email:", email);

    const pool = await sql.connect(dbConfig);
    
    // Kiểm tra email trong bảng Account
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT Username, Role FROM Account WHERE Email = @email');

    console.log("📊 Email check result:", result.recordset);

    const exists = result.recordset.length > 0;
    const userType = exists ? result.recordset[0].Role : null;
    
    res.json({ 
      exists: exists,
      type: userType,
      message: exists ? 'Email tồn tại' : 'Email không tồn tại'
    });

  } catch (error) {
    console.error('❌ Lỗi check email:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Reset password API
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    console.log("🔄 Reset password for:", email);
    
    const pool = await sql.connect(dbConfig);
    
    // Cập nhật mật khẩu dựa trên email
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .input('newPassword', sql.VarChar, newPassword)
      .query('UPDATE Account SET Password = @newPassword WHERE Email = @email');
    
    console.log("📊 Reset result:", result.rowsAffected);
    
    if (result.rowsAffected[0] > 0) {
      res.json({ 
        success: true, 
        message: 'Đặt lại mật khẩu thành công' 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy tài khoản' 
      });
    }
  } catch (error) {
    console.error('❌ Lỗi reset password:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server' 
    });
  }
});

module.exports = router;