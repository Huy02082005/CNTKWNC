const sql = require("mssql");
const config = require("../db");

const productController = {
  // Lấy tất cả sản phẩm
  getAllProducts: async (req, res) => {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT p.*, c.CategoryName, b.BrandName, ct.ClubName, ps.SizeName
        FROM Product p
        LEFT JOIN Category c ON p.CategoryID = c.CategoryID
        LEFT JOIN Brand b ON p.BrandID = b.BrandID
        LEFT JOIN ClubTeam ct ON p.ClubID = ct.ClubID
        LEFT JOIN ProductSize ps ON p.SizeID = ps.SizeID
        ORDER BY p.ProductID DESC
      `);
      res.json(result.recordset);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  // Lấy sản phẩm theo ID
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
          LEFT JOIN ClubTeam ct ON p.ClubID = ct.ClubID
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

  // Thêm sản phẩm mới
  createProduct: async (req, res) => {
    try {
      const {
        ProductName, Description, CategoryID, BrandID, ImageURL,
        ImportPrice, SellingPrice, Discount, StockQuantity, Unit,
        ClubID, SizeID, Season, IsHomeKit, PlayerName
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
        .input('ClubID', sql.Int, ClubID)
        .input('SizeID', sql.Int, SizeID)
        .input('Season', sql.NVarChar, Season)
        .input('IsHomeKit', sql.Bit, IsHomeKit || 1)
        .input('PlayerName', sql.NVarChar, PlayerName)
        .query(`
          INSERT INTO Product (ProductName, Description, CategoryID, BrandID, ImageURL, 
          ImportPrice, SellingPrice, Discount, StockQuantity, Unit, ClubID, SizeID, 
          Season, IsHomeKit, PlayerName, CreateDate, UpdateDate)
          OUTPUT INSERTED.*
          VALUES (@ProductName, @Description, @CategoryID, @BrandID, @ImageURL,
          @ImportPrice, @SellingPrice, @Discount, @StockQuantity, @Unit, @ClubID,
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

  // Cập nhật sản phẩm
  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        ProductName, Description, CategoryID, BrandID, ImageURL,
        ImportPrice, SellingPrice, Discount, StockQuantity, Unit,
        ClubID, SizeID, Season, IsHomeKit, PlayerName, Status
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
        .input('ClubID', sql.Int, ClubID)
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
            ClubID = @ClubID,
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

  // Xóa sản phẩm
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
  }
};

module.exports = productController;