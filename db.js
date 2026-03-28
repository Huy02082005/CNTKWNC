const sql = require('mssql');

const dbConfig = {
  user: 'sa',
  password: '000000', 
  server: 'localhost',
  database: 'WebBanDoBongDa',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

let pool;
let isConnecting = false;
const reconnectInterval = 5000;

async function connectDB() {
  if (isConnecting) {
    return pool;
  }
  
  isConnecting = true;
  
  try {

    if (pool) {
      try {
        await pool.close();
      } catch (e) {
        console.log('⚠️ Lỗi khi đóng pool cũ:', e.message);
      }
    }
    
    // Tạo kết nối mới
    pool = await sql.connect(dbConfig);
    
    console.log('✅ Đã kết nối SQL Server thành công!');
    isConnecting = false;
    return pool;
    
  } catch (err) {
    console.error('❌ Lỗi kết nối SQL Server:', err.message);
    isConnecting = false;
    
    // Tự động reconnect sau vài giây
    setTimeout(() => {
      connectDB();
    }, reconnectInterval);
    
    throw err;
  }
}

module.exports = { 
  sql, 
  dbConfig, 
  connectDB 
};
