const sql = require("mssql");
const config = require("../db");

async function login(req, res) {
  const { username, password } = req.body;

  try {
    const pool = await sql.connect(config);

    const result = await pool.request()
      .input("username", sql.NVarChar, username)
      .input("password", sql.NVarChar, password)
      .query(`
        SELECT * FROM Account 
        WHERE Username = @username AND Password = @password
      `);

    // Không tìm thấy tài khoản
    if (result.recordset.length === 0) {
      return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
    }

    const user = result.recordset[0];

    // Chặn customer truy cập admin
    if (user.Role !== "admin") {
      return res.status(403).json({ message: "Không có quyền truy cập admin" });
    }

    // Admin hợp lệ
    return res.json({
      message: "Đăng nhập thành công",
      accountID: user.AccountID,
      role: user.Role
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Lỗi server");
  }
}

module.exports = { login };
