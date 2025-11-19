const sql = require('mssql');

// Cấu hình kết nối đến SQL Server
const dbConfig = {
  user: 'sa',
  password: '000000', // thay đúng mật khẩu SQL của bạn
  server: 'localhost',
  port: 1433,
  database: 'WebBanDoBongDa',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

// Hàm kết nối database (tái sử dụng ở nhiều file)
async function connectDB() {
  try {
    await sql.connect(dbConfig);
    console.log('✅ Đã kết nối SQL Server thành công!');
  } catch (err) {
    console.error('❌ Lỗi kết nối SQL Server:', err);
  }
}

module.exports = { sql, connectDB };
