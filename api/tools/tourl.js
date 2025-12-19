const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const upload = multer({ storage: multer.memoryStorage() });
const uploadDir = path.join(process.cwd(), "files");

// Buat folder files jika belum ada
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

module.exports = function(app) {
  // Endpoint untuk upload file
  app.post('/tools/tourl', (req, res) => {
    upload.single("file")(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ 
          status: false, 
          error: err.message 
        });
      }

      const { apikey } = req.query;
      
      // Validasi apikey
      if (!global.apikey.includes(apikey)) {
        return res.json({ 
          status: false, 
          error: 'Apikey invalid' 
        });
      }

      // Validasi file
      if (!req.file) {
        return res.status(400).json({ 
          status: false, 
          error: 'No file uploaded' 
        });
      }

      try {
        // Generate random filename
        const randomName = crypto.randomBytes(16).toString("hex") + path.extname(req.file.originalname);
        const filePath = path.join(uploadDir, randomName);
        
        // Simpan file ke disk
        fs.writeFileSync(filePath, req.file.buffer);
        
        // Generate URL file
        const fileUrl = `${req.protocol}://${req.get("host")}/files/${randomName}`;
        
        // Auto delete setelah 5 menit
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`File ${randomName} telah dihapus otomatis`);
          }
        }, 5 * 60 * 1000);
        
        // Response sukses
        res.status(200).json({
          status: true,
          result: {
            url: fileUrl,
            filename: randomName,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            expiresIn: "5 minutes"
          }
        });
        
      } catch (error) {
        res.status(500).json({
          status: false,
          error: error.message || 'Upload failed'
        });
      }
    });
  });

  // Endpoint untuk serve file (tambahkan di app.js jika belum ada)
  // app.use('/files', express.static(uploadDir));
};
