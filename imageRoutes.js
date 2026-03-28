const express = require('express');
const router = express.Router();
const sql = require('mssql');

// GET: Lấy tất cả ảnh sản phẩm
router.get('/', async (req, res) => {
    try {
        const db = req.app.locals.db;
        if (!db) {
            return res.status(503).json({ 
                error: 'Database đang kết nối, vui lòng thử lại sau' 
            });
        }

        const result = await db.request()
            .query(`
                SELECT TOP 20
                    p.ProductID,
                    p.ProductName,
                    p.Description,
                    p.SellingPrice,
                    p.OriginalPrice,
                    p.Discount,
                    p.StockQuantity,
                    p.ImageURL,
                    p.CategoryID,
                    p.BrandID,
                    p.ClubID,
                    p.SizeID,
                    p.Season,
                    p.IsHomeKit,
                    p.PlayerName,
                    p.Status,
                    c.CategoryName,
                    b.BrandName,
                    ct.ClubName,
                    ps.SizeName
                FROM Products p
                LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
                LEFT JOIN Brand b ON p.BrandID = b.BrandID
                LEFT JOIN ClubTeam ct ON p.ClubID = ct.ClubID
                LEFT JOIN ProductSize ps ON p.SizeID = ps.SizeID
                WHERE p.ImageURL IS NOT NULL 
                AND p.ImageURL != ''
                AND p.Status = 'active'
                ORDER BY p.CreateDate DESC
            `);

        res.json({
            success: true,
            count: result.recordset.length,
            products: result.recordset
        });
    } catch (error) {
        console.error('❌ Lỗi lấy danh sách ảnh:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Lỗi server khi lấy danh sách ảnh' 
        });
    }
});

// GET: Lấy ảnh theo category
router.get('/category/:categoryId', async (req, res) => {
    try {
        const { categoryId } = req.params;
        const db = req.app.locals.db;

        const result = await db.request()
            .input('categoryId', sql.Int, categoryId)
            .query(`
                SELECT TOP 12
                    p.ProductID,
                    p.ProductName,
                    p.ImageURL,
                    p.SellingPrice,
                    p.Discount,
                    p.StockQuantity
                FROM Products p
                WHERE p.CategoryID = @categoryId 
                AND p.ImageURL IS NOT NULL 
                AND p.ImageURL != ''
                AND p.Status = 'active'
                ORDER BY p.ProductName
            `);

        res.json({
            success: true,
            categoryId,
            products: result.recordset
        });
    } catch (error) {
        console.error('❌ Lỗi lấy ảnh theo category:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Lỗi server' 
        });
    }
});

// GET: Lấy ảnh theo club/team
router.get('/club/:clubId', async (req, res) => {
    try {
        const { clubId } = req.params;
        const db = req.app.locals.db;

        const result = await db.request()
            .input('clubId', sql.Int, clubId)
            .query(`
                SELECT 
                    p.ProductID,
                    p.ProductName,
                    p.ImageURL,
                    p.SellingPrice,
                    p.Discount,
                    p.Season,
                    p.IsHomeKit
                FROM Products p
                WHERE p.ClubID = @clubId 
                AND p.ImageURL IS NOT NULL 
                AND p.ImageURL != ''
                AND p.Status = 'active'
                ORDER BY p.Season DESC
            `);

        res.json({
            success: true,
            clubId,
            products: result.recordset
        });
    } catch (error) {
        console.error('❌ Lỗi lấy ảnh theo club:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Lỗi server' 
        });
    }
});

// GET: Tìm kiếm ảnh theo tên
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ 
                success: false, 
                error: 'Thiếu từ khóa tìm kiếm' 
            });
        }

        const db = req.app.locals.db;

        const result = await db.request()
            .input('searchTerm', sql.NVarChar(200), `%${q}%`)
            .query(`
                SELECT 
                    p.ProductID,
                    p.ProductName,
                    p.ImageURL,
                    p.SellingPrice,
                    p.Discount
                FROM Products p
                WHERE p.ProductName LIKE @searchTerm
                AND p.ImageURL IS NOT NULL 
                AND p.ImageURL != ''
                AND p.Status = 'active'
                ORDER BY p.ProductName
            `);

        res.json({
            success: true,
            searchTerm: q,
            count: result.recordset.length,
            products: result.recordset
        });
    } catch (error) {
        console.error('❌ Lỗi tìm kiếm ảnh:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Lỗi server' 
        });
    }
});

// GET: Lấy ảnh sản phẩm nổi bật (có discount)
router.get('/featured', async (req, res) => {
    try {
        const db = req.app.locals.db;

        const result = await db.request()
            .query(`
                SELECT TOP 8
                    p.ProductID,
                    p.ProductName,
                    p.ImageURL,
                    p.SellingPrice,
                    p.Discount,
                    p.OriginalPrice,
                    (p.SellingPrice * (1 - p.Discount/100)) as FinalPrice
                FROM Products p
                WHERE p.ImageURL IS NOT NULL 
                AND p.ImageURL != ''
                AND p.Discount > 0
                AND p.StockQuantity > 0
                AND p.Status = 'active'
                ORDER BY p.Discount DESC, p.CreateDate DESC
            `);

        res.json({
            success: true,
            featured: result.recordset
        });
    } catch (error) {
        console.error('❌ Lỗi lấy sản phẩm nổi bật:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Lỗi server' 
        });
    }
});

module.exports = router;
