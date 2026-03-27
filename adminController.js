const sql = require('mssql');

const getAllAdmins = async (req, res) => {
    try {
        const pool = req.app.locals.db;
        
        if (!pool) {
            return res.status(500).json({ 
                success: false,
                error: 'Database connection không khả dụng'
            });
        }

        const result = await pool.request()
            .query(`
                SELECT 
                    AccountID,
                    Username,
                    Email,
                    FullName,
                    Phone,
                    Status,
                    CreateDate,
                    LastLogin,
                    IsSuperAdmin
                FROM Account 
                ORDER BY CreateDate DESC
            `);
               
        res.json({
            success: true,
            data: result.recordset
        });
        
    } catch (error) {
        console.error('❌ Lỗi khi tải danh sách admin:', error);
        res.status(500).json({ 
            success: false,
            error: 'Lỗi khi tải danh sách admin',
            details: error.message
        });
    }
};

// Lấy thống kê admin
const getAdminStats = async (req, res) => {
    try {
        const pool = req.app.locals.db;
        
        if (!pool) {
            return res.status(500).json({ 
                success: false,
                error: 'Database connection không khả dụng'
            });
        }

        const result = await pool.request()
            .query(`
                SELECT 
                    COUNT(*) as totalAdmins,
                    SUM(CASE WHEN Status = 1 THEN 1 ELSE 0 END) as activeAdmins,
                    SUM(CASE WHEN IsSuperAdmin = 1 THEN 1 ELSE 0 END) as superAdmins
                FROM Account
            `);
        
        const stats = result.recordset[0];
        
        res.json({
            success: true,
            data: stats
        });
        
    } catch (error) {
        console.error('❌ Lỗi khi tải thống kê admin:', error);
        res.status(500).json({ 
            success: false,
            error: 'Lỗi khi tải thống kê admin',
            details: error.message
        });
    }
};

// Lấy thông tin chi tiết admin theo ID
const getAdminById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = req.app.locals.db;
        
        const result = await pool.request()
            .input('AccountID', sql.Int, id)
            .query(`
                SELECT 
                    AccountID,
                    Username,
                    Email,
                    FullName,
                    Phone,
                    Status,
                    CreateDate,
                    LastLogin,
                    IsSuperAdmin
                FROM Account 
                WHERE AccountID = @AccountID
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Không tìm thấy admin' 
            });
        }
        
        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Error fetching admin by ID:', error);
        res.status(500).json({ 
            success: false,
            error: 'Lỗi khi tải thông tin admin',
            details: error.message 
        });
    }
};

// Tạo admin mới
const createAdmin = async (req, res) => {
    try {
        const { Username, Password, Email, FullName, Phone, IsSuperAdmin, Status } = req.body;
        
        // Validate dữ liệu
        if (!Username || !Password) {
            return res.status(400).json({ 
                success: false,
                error: 'Tên đăng nhập và mật khẩu là bắt buộc' 
            });
        }
        
        if (Password.length < 6) {
            return res.status(400).json({ 
                success: false,
                error: 'Mật khẩu phải có ít nhất 6 ký tự' 
            });
        }
        
        const pool = req.app.locals.db;
        
        // Kiểm tra username đã tồn tại chưa
        const checkResult = await pool.request()
            .input('Username', sql.NVarChar(50), Username)
            .query('SELECT AccountID FROM Account WHERE Username = @Username');
        
        if (checkResult.recordset.length > 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Tên đăng nhập đã tồn tại' 
            });
        }
        
        // Tạo admin mới
        const insertResult = await pool.request()
            .input('Username', sql.NVarChar(50), Username)
            .input('Password', sql.NVarChar(255), Password)
            .input('Email', sql.VarChar(255), Email || null)
            .input('FullName', sql.NVarChar(100), FullName || null)
            .input('Phone', sql.NVarChar(20), Phone || null)
            .input('IsSuperAdmin', sql.Bit, IsSuperAdmin || false)
            .input('Status', sql.Bit, Status !== undefined ? Status : true)
            .query(`
                INSERT INTO Account (
                    Username, Password, Email, FullName, Phone, 
                    IsSuperAdmin, Status, CreateDate
                ) 
                OUTPUT INSERTED.AccountID, INSERTED.Username, INSERTED.Email, 
                       INSERTED.FullName, INSERTED.Phone, INSERTED.Status,
                       INSERTED.CreateDate, INSERTED.IsSuperAdmin
                VALUES (
                    @Username, @Password, @Email, @FullName, @Phone,
                    @IsSuperAdmin, @Status, GETDATE()
                )
            `);
        
        const newAdmin = insertResult.recordset[0];
        
        res.status(201).json({
            success: true,
            message: 'Tạo admin thành công',
            data: newAdmin
        });
        
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ 
            success: false,
            error: 'Lỗi khi tạo admin',
            details: error.message 
        });
    }
};

// Cập nhật admin
const updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { Username, Password, Email, FullName, Phone, IsSuperAdmin, Status } = req.body;
        
        const pool = req.app.locals.db;
        
        // Kiểm tra admin có tồn tại không
        const checkResult = await pool.request()
            .input('AccountID', sql.Int, id)
            .query('SELECT AccountID FROM Account WHERE AccountID = @AccountID');
        
        if (checkResult.recordset.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Không tìm thấy admin' 
            });
        }
        
        let updateQuery = `
            UPDATE Account 
            SET Email = @Email,
                FullName = @FullName,
                Phone = @Phone,
                IsSuperAdmin = @IsSuperAdmin,
                Status = @Status
        `;
        
        const request = pool.request()
            .input('AccountID', sql.Int, id)
            .input('Email', sql.VarChar(255), Email || null)
            .input('FullName', sql.NVarChar(100), FullName || null)
            .input('Phone', sql.NVarChar(20), Phone || null)
            .input('IsSuperAdmin', sql.Bit, IsSuperAdmin || false)
            .input('Status', sql.Bit, Status !== undefined ? Status : true);
        
        if (Password) {
            if (Password.length < 6) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Mật khẩu phải có ít nhất 6 ký tự' 
                });
            }
            
            updateQuery += ', Password = @Password';
            request.input('Password', sql.NVarChar(255), Password);
        }
        
        updateQuery += ' WHERE AccountID = @AccountID';
        
        await request.query(updateQuery);
        
        const updatedResult = await pool.request()
            .input('AccountID', sql.Int, id)
            .query(`
                SELECT 
                    AccountID,
                    Username,
                    Email,
                    FullName,
                    Phone,
                    Status,
                    CreateDate,
                    LastLogin,
                    IsSuperAdmin
                FROM Account 
                WHERE AccountID = @AccountID
            `);
        
        res.json({
            success: true,
            message: 'Cập nhật admin thành công',
            data: updatedResult.recordset[0]
        });
        
    } catch (error) {
        console.error('Error updating admin:', error);
        res.status(500).json({ 
            success: false,
            error: 'Lỗi khi cập nhật admin',
            details: error.message 
        });
    }
};

// Xóa admin
const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        
        const pool = req.app.locals.db;
        
        const checkResult = await pool.request()
            .input('AccountID', sql.Int, id)
            .query('SELECT AccountID, Username FROM Account WHERE AccountID = @AccountID');
        
        if (checkResult.recordset.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Không tìm thấy admin' 
            });
        }
        
        const superAdminCheck = await pool.request()
            .query('SELECT COUNT(*) as SuperAdminCount FROM Account WHERE IsSuperAdmin = 1');
        
        const adminToDelete = checkResult.recordset[0];
        
        const isSuperAdminResult = await pool.request()
            .input('AccountID', sql.Int, id)
            .query('SELECT IsSuperAdmin FROM Account WHERE AccountID = @AccountID');
        
        const isSuperAdmin = isSuperAdminResult.recordset[0].IsSuperAdmin;
        
        if (isSuperAdmin && superAdminCheck.recordset[0].SuperAdminCount <= 1) {
            return res.status(400).json({ 
                success: false,
                error: 'Không thể xóa super admin cuối cùng' 
            });
        }
        
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ 
                success: false,
                error: 'Không thể xóa tài khoản của chính mình' 
            });
        }
        
        await pool.request()
            .input('AccountID', sql.Int, id)
            .query('DELETE FROM Account WHERE AccountID = @AccountID');
        
        res.json({
            success: true,
            message: 'Xóa admin thành công',
            data: adminToDelete
        });
        
    } catch (error) {
        console.error('Error deleting admin:', error);
        res.status(500).json({ 
            success: false,
            error: 'Lỗi khi xóa admin',
            details: error.message 
        });
    }
};

const searchAdmins = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({ 
                success: false,
                error: 'Thiếu từ khóa tìm kiếm' 
            });
        }
        
        const pool = req.app.locals.db;
        
        const result = await pool.request()
            .input('SearchTerm', sql.NVarChar(100), `%${q}%`)
            .query(`
                SELECT 
                    AccountID,
                    Username,
                    Email,
                    FullName,
                    Phone,
                    Status,
                    CreateDate,
                    LastLogin,
                    IsSuperAdmin
                FROM Account 
                WHERE Username LIKE @SearchTerm 
                   OR Email LIKE @SearchTerm 
                   OR FullName LIKE @SearchTerm
                ORDER BY CreateDate DESC
            `);
        
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error searching admins:', error);
        res.status(500).json({ 
            success: false,
            error: 'Lỗi khi tìm kiếm admin',
            details: error.message 
        });
    }
};

module.exports = {
    getAllAdmins,
    getAdminStats,
    getAdminById,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    searchAdmins
};
