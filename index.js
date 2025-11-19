const express = require('express');
const { connectDB } = require('./db');
const path = require('path');

const app = express();

const cors = require("cors");
app.use(cors());
app.use(express.json());

// Phục vụ file tĩnh từ Admin-FE
app.use(express.static(path.join(__dirname, '../Admin_FE')));

// Kết nối cơ sở dữ liệu
connectDB();

// THÊM CÁC ROUTES MỚI VÀO ĐÂY
app.use('/auth', require('./routes/authRoutes'));
app.use('/product', require('./routes/productRoutes'));
app.use('/order', require('./routes/orderRoutes'));
app.use('/customer', require('./routes/customerRoutes'));
app.use('/dashboard', require('./routes/dashboardRoutes'));
app.use('/stats', require('./routes/statisticsRoutes'));

// Thêm vào index.js - trong phần xử lý trang HTML
app.get('/users.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Admin_FE/users.html'));
});
// Thêm vào index.js - trong phần xử lý trang HTML
app.get('/orders.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Admin_FE/orders.html'));
});

app.get('/products.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Admin_FE/products.html'));
});

// Thêm route cho trang thống kê
app.get('/statistics.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Admin_FE/statistics.html'));
});
// Xử lý các trang HTML
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Admin_FE/login.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Admin_FE/dashboard.html'));
});

// Route mặc định
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Admin_FE/login.html'));
});

// Chạy server
app.listen(3000, () => console.log('🚀 Server running on port 3000'));