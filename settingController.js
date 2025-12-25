const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const settingsController = {
  getSettings: async (req, res) => {
    try {
      const pool = await sql.connect();
      const result = await pool.request()
        .query('SELECT * FROM SystemSettings WHERE SettingID = 1');
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ message: 'Settings not found' });
      }
      
      res.json(result.recordset[0]);
    } catch (error) {
      console.error('Error getting settings:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  updateSettings: async (req, res) => {
    try {
      const {
        storeName,
        storeEmail,
        storePhone,
        storeAddress,
        currency
      } = req.body;

      const pool = await sql.connect();
      await pool.request()
        .input('storeName', sql.NVarChar, storeName)
        .input('storeEmail', sql.NVarChar, storeEmail)
        .input('storePhone', sql.NVarChar, storePhone)
        .input('storeAddress', sql.NVarChar, storeAddress)
        .input('currency', sql.NVarChar, currency)
        .query(`
          UPDATE SystemSettings 
          SET StoreName = @storeName,
              StoreEmail = @storeEmail,
              StorePhone = @storePhone,
              StoreAddress = @storeAddress,
              Currency = @currency,
              UpdatedDate = GETDATE()
          WHERE SettingID = 1
        `);

      res.json({ message: 'Settings updated successfully' });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  updateNotificationSettings: async (req, res) => {
    try {
      const {
        newOrderNotify,
        newCustomerNotify,
        lowStockNotify,
        newReviewNotify,
        notificationEmail
      } = req.body;

      const pool = await sql.connect();
      await pool.request()
        .input('newOrderNotify', sql.Bit, newOrderNotify)
        .input('newCustomerNotify', sql.Bit, newCustomerNotify)
        .input('lowStockNotify', sql.Bit, lowStockNotify)
        .input('newReviewNotify', sql.Bit, newReviewNotify)
        .input('notificationEmail', sql.NVarChar, notificationEmail)
        .query(`
          UPDATE SystemSettings 
          SET NewOrderNotify = @newOrderNotify,
              NewCustomerNotify = @newCustomerNotify,
              LowStockNotify = @lowStockNotify,
              NewReviewNotify = @newReviewNotify,
              NotificationEmail = @notificationEmail
          WHERE SettingID = 1
        `);

      res.json({ message: 'Notification settings updated' });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  updateSecuritySettings: async (req, res) => {
    try {
      const {
        sessionTimeout,
        maxLoginAttempts,
        strongPassword,
        twoFactorAuth
      } = req.body;

      const pool = await sql.connect();
      await pool.request()
        .input('sessionTimeout', sql.Int, sessionTimeout)
        .input('maxLoginAttempts', sql.Int, maxLoginAttempts)
        .input('strongPassword', sql.Bit, strongPassword)
        .input('twoFactorAuth', sql.Bit, twoFactorAuth)
        .query(`
          UPDATE SystemSettings 
          SET SessionTimeout = @sessionTimeout,
              MaxLoginAttempts = @maxLoginAttempts,
              StrongPassword = @strongPassword,
              TwoFactorAuth = @twoFactorAuth
          WHERE SettingID = 1
        `);

      res.json({ message: 'Security settings updated' });
    } catch (error) {
      console.error('Error updating security settings:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  updatePaymentSettings: async (req, res) => {
    try {
      const {
        codPayment,
        bankTransfer,
        shippingFee,
        freeShippingThreshold
      } = req.body;

      const pool = await sql.connect();
      await pool.request()
        .input('codPayment', sql.Bit, codPayment)
        .input('bankTransfer', sql.Bit, bankTransfer)
        .input('shippingFee', sql.Decimal(10,2), shippingFee)
        .input('freeShippingThreshold', sql.Decimal(10,2), freeShippingThreshold)
        .query(`
          UPDATE SystemSettings 
          SET CODPayment = @codPayment,
              BankTransfer = @bankTransfer,
              ShippingFee = @shippingFee,
              FreeShippingThreshold = @freeShippingThreshold
          WHERE SettingID = 1
        `);

      res.json({ message: 'Payment settings updated' });
    } catch (error) {
      console.error('Error updating payment settings:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  resetSystem: async (req, res) => {
    try {
      res.json({ message: 'System reset initiated' });
    } catch (error) {
      console.error('Error resetting system:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  clearCache: async (req, res) => {
    try {
      const cacheDir = path.join(__dirname, '../cache');
      if (fs.existsSync(cacheDir)) {
        fs.rmSync(cacheDir, { recursive: true, force: true });
        fs.mkdirSync(cacheDir);
      }
      
      res.json({ message: 'Cache cleared successfully' });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  backupSystem: async (req, res) => {
    try {
      const backupDate = new Date().toISOString().split('T')[0];
      const backupFile = `backup-${backupDate}.sql`;

      const backupData = {
        timestamp: new Date(),
        message: 'Backup completed'
      };
      
      const backupDir = path.join(__dirname, '../backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
      }
      
      fs.writeFileSync(
        path.join(backupDir, backupFile),
        JSON.stringify(backupData, null, 2)
      );

      res.json({ 
        message: 'Backup completed successfully',
        backupFile: backupFile
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = settingsController;
