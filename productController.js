const sql = require("mssql");
const config = require("../config/db");

const productController = {
    getAllProducts: async (req, res) => {
     try {
      let pool = req.app.locals.db;
      
      if (!pool || !pool.connected) {
        pool = await sql.connect(config);
        req.app.locals.db = pool;
      }

    const result = await pool.request().query(`
      SELECT p.*, c.CategoryName, b.BrandName, l.LeagueName, ps.SizeName
      FROM Product p
      LEFT JOIN Category c ON p.CategoryID = c.CategoryID
      LEFT JOIN Brand b ON p.BrandID = b.BrandID
      LEFT JOIN League l ON p.LeagueID = l.LeagueID
      LEFT JOIN ProductSize ps ON p.SizeID = ps.SizeID
      ORDER BY p.ProductID DESC
    `);
    
      res.json(result.recordset);
      
    } catch (err) {
      console.error('❌ LỖI CHI TIẾT trong getAllProducts:');
      console.error('❌ Error message:', err.message);
      console.error('❌ Error code:', err.code);
      console.error('❌ Error number:', err.number);
      console.error('❌ Error state:', err.state);
      console.error('❌ Error stack:', err.stack);

      res.status(500).json({ 
        success: false,
        message: "Lỗi server khi lấy sản phẩm",
        error: err.message,
        code: err.code,
        details: "Kiểm tra console server để biết thêm chi tiết"
      });
    }
  },

  getProductById: async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await sql.connect(config);
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT p.*, c.CategoryName, b.BrandName, ct.ClubName, ps.SizeName
          FROM Product p
          LEFT JOIN Category c ON p.CategoryID = c.CategoryID
          LEFT JOIN Brand b ON p.BrandID = b.BrandID
          LEFT JOIN League l ON p.LeagueID = l.LeagueID
          LEFT JOIN ProductSize ps ON p.SizeID = ps.SizeID
          WHERE p.ProductID = @id
        `);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      }
      
      res.json(result.recordset[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  createProduct: async (req, res) => {
    try {
      const {
        ProductName, Description, CategoryID, BrandID, ImageURL,
        ImportPrice, SellingPrice, Discount, StockQuantity, Unit,
        LeagueID, SizeID, Season, IsHomeKit, PlayerName
      } = req.body;

      const pool = await sql.connect(config);
      const result = await pool.request()
        .input('ProductName', sql.NVarChar, ProductName)
        .input('Description', sql.NVarChar, Description)
        .input('CategoryID', sql.Int, CategoryID)
        .input('BrandID', sql.Int, BrandID)
        .input('ImageURL', sql.NVarChar, ImageURL)
        .input('ImportPrice', sql.Decimal(12,2), ImportPrice)
        .input('SellingPrice', sql.Decimal(12,2), SellingPrice)
        .input('Discount', sql.Decimal(5,2), Discount || 0)
        .input('StockQuantity', sql.Int, StockQuantity || 0)
        .input('Unit', sql.NVarChar, Unit)
        .input('LeagueID', sql.Int, LeagueID || 1)
        .input('SizeID', sql.Int, SizeID)
        .input('Season', sql.NVarChar, Season)
        .input('IsHomeKit', sql.Bit, IsHomeKit || 1)
        .input('PlayerName', sql.NVarChar, PlayerName)
        .query(`
          INSERT INTO Product (ProductName, Description, CategoryID, BrandID, ImageURL, 
          ImportPrice, SellingPrice, Discount, StockQuantity, Unit, LeagueID, SizeID, 
          Season, IsHomeKit, PlayerName, CreateDate, UpdateDate)
          OUTPUT INSERTED.*
          VALUES (@ProductName, @Description, @CategoryID, @BrandID, @ImageURL,
          @ImportPrice, @SellingPrice, @Discount, @StockQuantity, @Unit, @LeagueID,
          @SizeID, @Season, @IsHomeKit, @PlayerName, GETDATE(), GETDATE())
        `);

      res.status(201).json({
        message: "Thêm sản phẩm thành công",
        product: result.recordset[0]
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        ProductName, Description, CategoryID, BrandID, ImageURL,
        ImportPrice, SellingPrice, Discount, StockQuantity, Unit,
        LeagueID, SizeID, Season, IsHomeKit, PlayerName, Status
      } = req.body;

      const pool = await sql.connect(config);
      const result = await pool.request()
        .input('id', sql.Int, id)
        .input('ProductName', sql.NVarChar, ProductName)
        .input('Description', sql.NVarChar, Description)
        .input('CategoryID', sql.Int, CategoryID)
        .input('BrandID', sql.Int, BrandID)
        .input('ImageURL', sql.NVarChar, ImageURL)
        .input('ImportPrice', sql.Decimal(12,2), ImportPrice)
        .input('SellingPrice', sql.Decimal(12,2), SellingPrice)
        .input('Discount', sql.Decimal(5,2), Discount)
        .input('StockQuantity', sql.Int, StockQuantity)
        .input('Unit', sql.NVarChar, Unit)
        .input('LeagueID', sql.Int, LeagueID || 1)
        .input('SizeID', sql.Int, SizeID)
        .input('Season', sql.NVarChar, Season)
        .input('IsHomeKit', sql.Bit, IsHomeKit)
        .input('PlayerName', sql.NVarChar, PlayerName)
        .input('Status', sql.NVarChar, Status)
        .query(`
          UPDATE Product SET
            ProductName = @ProductName,
            Description = @Description,
            CategoryID = @CategoryID,
            BrandID = @BrandID,
            ImageURL = @ImageURL,
            ImportPrice = @ImportPrice,
            SellingPrice = @SellingPrice,
            Discount = @Discount,
            StockQuantity = @StockQuantity,
            Unit = @Unit,
            LeagueID = @LeagueID,
            SizeID = @SizeID,
            Season = @Season,
            IsHomeKit = @IsHomeKit,
            PlayerName = @PlayerName,
            Status = @Status,
            UpdateDate = GETDATE()
          WHERE ProductID = @id
        `);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      }

      res.json({ message: "Cập nhật sản phẩm thành công" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await sql.connect(config);
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Product WHERE ProductID = @id');

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      }

      res.json({ message: "Xóa sản phẩm thành công" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  getAllCategories: async (req, res) => {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query('SELECT * FROM Category ORDER BY CategoryName');
      res.json(result.recordset);
    } catch (err) {
      console.error('❌ Lỗi khi tải danh mục:', err);
      res.json([
        { CategoryID: 1, CategoryName: "Áo bóng đá" },
        { CategoryID: 2, CategoryName: "Quần bóng đá" },
        { CategoryID: 3, CategoryName: "Giày bóng đá" },
        { CategoryID: 4, CategoryName: "Phụ kiện" },
        { CategoryID: 5, CategoryName: "Áo khoác thể thao" }
      ]);
    }
  },

  getAllBrands: async (req, res) => {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query('SELECT * FROM Brand ORDER BY BrandName');
      res.json(result.recordset);
    } catch (err) {
      console.error('❌ Lỗi khi tải thương hiệu:', err);
      res.json([
        { BrandID: 1, BrandName: "Adidas" },
        { BrandID: 2, BrandName: "Nike" },
        { BrandID: 3, BrandName: "Puma" },
        { BrandID: 4, BrandName: "Mizuno" },
        { BrandID: 5, BrandName: "New Balance" }
      ]);
    }
  },

  getAllClubs: async (req, res) => {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query('SELECT * FROM ClubTeam ORDER BY ClubName');
      res.json(result.recordset);
    } catch (err) {
      console.error('❌ Lỗi khi tải câu lạc bộ:', err);
      res.json([
        { ClubID: 1, ClubName: "Arsenal" },
        { ClubID: 2, ClubName: "Barcelona" },
        { ClubID: 3, ClubName: "Bayern Munich" },
        { ClubID: 4, ClubName: "Chelsea" },
        { ClubID: 5, ClubName: "Inter Miami" },
        { ClubID: 6, ClubName: "Juventus" },
        { ClubID: 7, ClubName: "Liverpool" },
        { ClubID: 8, ClubName: "Manchester City" },
        { ClubID: 9, ClubName: "Manchester United" },
        { ClubID: 10, ClubName: "Paris Saint-Germain" },
        { ClubID: 11, ClubName: "Real Madrid" },
        { ClubID: 12, ClubName: "Tottenham Hotspur" }
      ]);
    }
  },

  getAllSizes: async (req, res) => {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query('SELECT * FROM ProductSize ORDER BY SizeID');
      res.json(result.recordset);
    } catch (err) {
      console.error('❌ Lỗi khi tải kích thước:', err);
      res.json([
        { SizeID: 1, SizeName: "S", SizeType: "Áo" },
        { SizeID: 2, SizeName: "M", SizeType: "Áo" },
        { SizeID: 3, SizeName: "L", SizeType: "Áo" },
        { SizeID: 4, SizeName: "XL", SizeType: "Áo" },
        { SizeID: 5, SizeName: "XXL", SizeType: "Áo" },
        { SizeID: 6, SizeName: "38", SizeType: "Giày" },
        { SizeID: 7, SizeName: "39", SizeType: "Giày" },
        { SizeID: 8, SizeName: "40", SizeType: "Giày" },
        { SizeID: 9, SizeName: "41", SizeType: "Giày" },
        { SizeID: 10, SizeName: "42", SizeType: "Giày" },
        { SizeID: 11, SizeName: "43", SizeType: "Giày" },
        { SizeID: 12, SizeName: "44", SizeType: "Giày" }
      ]);
    }
  }
};

module.exports = productController;
