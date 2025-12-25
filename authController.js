const { sql } = require("../config/db");

async function login(req, res) {
  const { username, password } = req.body;

  try {
    const pool = req.app.locals.db;
    
    if (!pool) {
      return res.status(500).json({ error: "Database chưa kết nối" });
    }

    const result = await pool.request()
      .input("username", sql.NVarChar, username)
      .query(`
        SELECT * FROM Account 
        WHERE Username = @username AND Password = @password
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: "Sai tài khoản hoặc mật khẩu" 
      });
    }

    const user = result.recordset[0];

    if (password !== user.Password) {
      return res.status(401).json({ 
        success: false,
        message: "Sai tài khoản hoặc mật khẩu" 
      });
    }

    if (!user.Status) {
      return res.status(403).json({ 
        success: false,
        message: "Tài khoản đã bị khóa" 
      });
    }

    res.cookie('user_data', JSON.stringify({
      id: user.AccountID,
      username: user.Username,
      isSuperAdmin: user.IsSuperAdmin === true || user.IsSuperAdmin === 1
    }), {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: false,
      sameSite: 'lax'
    });

    return res.json({
      success: true,
      message: "Đăng nhập thành công",
      user: {
        id: user.AccountID,
        username: user.Username,
        isSuperAdmin: user.IsSuperAdmin === true || user.IsSuperAdmin === 1
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false,
      message: "Lỗi server: " + err.message 
    });
  }
}

async function checkAuth(req, res) {
  try {
    const userDataCookie = req.cookies.user_data;
    
    if (!userDataCookie) {
      return res.json({ authenticated: false });
    }
    
    const user = JSON.parse(userDataCookie);
    
    res.json({
      authenticated: true,
      user: user
    });
    
  } catch (error) {
    console.error('Check auth error:', error);
    res.json({ authenticated: false });
  }
}

async function logout(req, res) {
  res.clearCookie('user_data');
  res.json({ 
    success: true, 
    message: "Đã đăng xuất" 
  });
}

async function checkEmail(req, res) {
  try {
    const { email } = req.body;
    const pool = req.app.locals.db;
    
    if (!pool) {
      return res.status(500).json({ error: 'Database chưa kết nối' });
    }
    
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT Username, IsSuperAdmin FROM Account WHERE Email = @email');
    
    const exists = result.recordset.length > 0;
    
    res.json({ 
      exists: exists,
      message: exists ? 'Email tồn tại' : 'Email không tồn tại'
    });
    
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
}

async function resetPassword(req, res) {
  try {
    const { email, newPassword } = req.body;
    const pool = req.app.locals.db;
    
    if (!pool) {
      return res.status(500).json({ error: 'Database chưa kết nối' });
    }
    
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .input('newPassword', sql.VarChar, newPassword)
      .query('UPDATE Account SET Password = @newPassword WHERE Email = @email');
    
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
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server' 
    });
  }
}

module.exports = { 
  login, 
  checkAuth, 
  logout, 
  checkEmail, 
  resetPassword 
};
