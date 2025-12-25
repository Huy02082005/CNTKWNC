const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const { connectDB } = require('./config/db');
const simpleHomeRoutes = require('./routes/simpleHomeRoutes');

const app = express();

app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use('/api/products', require('./routes/userProductRoutes'));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../Admin_FE')));
app.use('/api/simple', simpleHomeRoutes);
app.use('/user', express.static(path.join(__dirname, '../User_FE')));
app.use('/api/images', require('./routes/imageRoutes'));
app.use('/user/js', express.static(path.join(__dirname, '../User_FE')));
app.use('/api/products', require('./routes/userProductRoutes'));

app.get('/api/test-simple', (req, res) => {
    console.log('✅ /api/test-simple called');
    res.json({
        success: true,
        message: 'Simple API test endpoint is working',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/products/test', async (req, res) => {
    console.log('🧪 /api/products/test called');
    
    try {
        // Kiểm tra database connection
        if (!req.app.locals.db) {
            return res.json({
                success: false,
                message: 'Database not connected',
                dbStatus: 'disconnected'
            });
        }
        
        // Test query đơn giản
        const result = await req.app.locals.db.request().query('SELECT TOP 3 ProductID, ProductName FROM Product');
        
        res.json({
            success: true,
            message: 'Products API is working',
            dbStatus: 'connected',
            testData: result.recordset,
            count: result.recordset.length
        });
        
    } catch (error) {
        console.error('Test error:', error);
        res.json({
            success: false,
            message: 'Test failed',
            error: error.message,
            dbStatus: 'error'
        });
    }
});

// Route để xem tất cả routes đã đăng ký
app.get('/api/routes', (req, res) => {
    const routes = [];
    
    app._router.stack.forEach(middleware => {
        if (middleware.route) { // routes registered directly on the app
            routes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            });
        } else if (middleware.name === 'router') { // router middleware
            middleware.handle.stack.forEach(handler => {
                if (handler.route) {
                    routes.push({
                        path: handler.route.path,
                        methods: Object.keys(handler.route.methods),
                        router: true
                    });
                }
            });
        }
    });
    
    res.json({
        success: true,
        totalRoutes: routes.length,
        routes: routes
    });
});

// Thêm endpoint để debug database
app.get('/api/debug/products', async (req, res) => {
    try {
        if (!req.app.locals.db) {
            return res.json({
                success: false,
                message: 'Database not connected'
            });
        }
        
        // Lấy tổng số sản phẩm
        const countResult = await req.app.locals.db.request().query('SELECT COUNT(*) as total FROM Product');
        const totalProducts = countResult.recordset[0].total;
        
        // Lấy 50 sản phẩm đầu tiên
        const result = await req.app.locals.db.request().query(`
            SELECT TOP 50 
                ProductID, 
                ProductName, 
                Status,
                CategoryID,
                BrandID
            FROM Product 
            ORDER BY ProductID DESC
        `);
        
        res.json({
            success: true,
            totalProducts: totalProducts,
            sampledProducts: result.recordset.length,
            products: result.recordset,
            message: `Database có ${totalProducts} sản phẩm`
        });
        
    } catch (error) {
        console.error('Debug error:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

app.get('/home.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../User_FE/home.html'));
});

app.get('/home.css', (req, res) => {
    res.sendFile(path.join(__dirname, '../User_FE/home.css'));
});

app.get('/home.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../User_FE/home.js'));
});

app.get('/fetch-images.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../User_FE/fetch-images.js'));
});

// Thêm route cho see_all.html
app.get('/see_all.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../User_FE/see_all.html'));
});

// Route cho các file CSS/JS liên quan
app.get('/see_all.css', (req, res) => {
    res.sendFile(path.join(__dirname, '../User_FE/see_all.css'));
});

app.get('/see_all.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../User_FE/see_all.js'));
});

// Thêm route cho product_display.js
app.get('/product_display.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../User_FE/product_display.js'));
});

app.use('/image', express.static(path.join(__dirname, '../User_FE/image')));

app.get('/', (req, res) => {
    if (req.cookies.authToken) {
        res.redirect('/admin.html');
    } else {
        res.redirect('/home.html');
    }
});

async function initializeDatabase() {
    try {
        const pool = await connectDB();
        app.locals.db = pool;
    } catch (err) {
        console.error('❌ Lỗi kết nối SQL Server:', err.message);
        app.locals.db = null;
    }
}

initializeDatabase();

app.use((req, res, next) => {
  if ((req.path.startsWith('/auth') || req.path.startsWith('/account')) && !req.app.locals.db) {
    initializeDatabase().then(() => {
      next();
    }).catch(err => {
      console.error('❌ Failed to reconnect database');
      res.status(503).json({ 
        error: 'Database đang kết nối, vui lòng thử lại sau',
        retry: true
      });
    });
  } else {
    next();
  }
});

async function checkAndReconnectDB() {
  try {
    if (!app.locals.db || !app.locals.db.connected) {
      const pool = await connectDB();
      app.locals.db = pool;
    }
  } catch (error) {
    console.error('❌ Failed to reconnect database:', error.message);
  }
}

app.use(async (req, res, next) => {
  if (req.path.startsWith('/product') || 
      req.path.startsWith('/order') || 
      req.path.startsWith('/api/')) {
    await checkAndReconnectDB();
  }
  next();
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/product', require('./routes/productRoutes'));
app.use('/order', require('./routes/orderRoutes'));
app.use('/customer', require('./routes/customerRoutes'));
app.use('/dashboard', require('./routes/dashboardRoutes'));
app.use('/stats', require('./routes/statisticsRoutes'));
app.use('/settings', require('./routes/settingsRoutes'));

app.use(express.static(`${__dirname}/User_FE/image`));

app.get('/user.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Admin_FE/html/user.html'));
});

app.get('/orders.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Admin_FE/html/orders.html'));
});

app.get('/products.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Admin_FE/html/products.html'));
});

app.get('/statistics.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Admin_FE/html/statistics.html'));
});

app.get('/settings.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Admin_FE/html/settings.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Admin_FE/html/admin.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Admin_FE/html/login.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Admin_FE/html/dashboard.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Admin_FE/html/login.html'));
});

app.listen(3000, () => console.log('🚀 Server running on port 3000'));
