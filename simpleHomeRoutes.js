// routes/simpleHomeRoutes.js - Với debug chi tiết
const express = require('express');
const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
    res.json({
        status: 'ok',
        message: 'API đang hoạt động',
        timestamp: new Date().toISOString()
    });
});

// Get products
router.get('/products', async (req, res) => {
 
    try {
        // Kiểm tra database connection
        if (!req.app.locals.db) {
            console.error('❌ Database connection: NULL');
            return res.status(503).json({
                success: false,
                error: 'Database not connected',
                code: 'DB_NOT_CONNECTED'
            });
        }

        // Query đơn giản
        const query = `
            SELECT TOP 8 
                ProductID,
                ProductName,
                ImageURL,
                SellingPrice,
                Discount,
                StockQuantity
            FROM Product 
            ORDER BY ProductID
        `;

        const result = await req.app.locals.db.request().query(query);
        
        res.json({
            success: true,
            count: result.recordset.length,
            products: result.recordset,
            debug: {
                queryTime: new Date().toISOString(),
                rowCount: result.recordset.length
            }
        });
        
    } catch (err) {
        console.error('💥 Lỗi trong /products:', err);
        console.error('💥 Error details:', {
            message: err.message,
            number: err.number,
            state: err.state,
            class: err.class,
            serverName: err.serverName,
            procName: err.procName,
            lineNumber: err.lineNumber
        });
        
        res.status(500).json({
            success: false,
            error: 'Database error',
            message: err.message,
            code: 'SQL_ERROR'
        });
    }
});

module.exports = router;
