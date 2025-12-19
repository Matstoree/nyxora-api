const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // Max 50MB
  }
});

const uploadDir = path.join(process.cwd(), "files");

// Buat folder files jika belum ada
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

module.exports = function(app) {
  app.post('/tools/tourl', (req, res) => {
    // Validasi apikey dari query parameter
    const { apikey } = req.query;
    if (!global.apikey.includes(apikey)) {
      return res.json({ status: false, error: 'Apikey invalid' });
    }

    // Proses upload file
    upload.single("file")(req, res, async (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            status: false, 
            error: 'File terlalu besar, maksimal 50MB' 
          });
        }
        return res.status(500).send(`Error: ${err.message}`);
      }

      // Validasi file ada atau tidak
      if (!req.file) {
        return res.json({ 
          status: false, 
          error: 'No file uploaded. Use form-data with key "file"' 
        });
      }

      try {
        // Generate random filename
        const ext = path.extname(req.file.originalname);
        const randomName = crypto.randomBytes(16).toString("hex") + ext;
        const filePath = path.join(uploadDir, randomName);
        
        // Simpan file ke disk
        fs.writeFileSync(filePath, req.file.buffer);
        
        // Generate URL file
        const fileUrl = `${req.protocol}://${req.get("host")}/files/${randomName}`;
        
        // Auto delete setelah 5 menit
        setTimeout(() => {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`[AUTO DELETE] File ${randomName} berhasil dihapus`);
            }
          } catch (delErr) {
            console.error(`[ERROR] Gagal menghapus file:`, delErr.message);
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
        res.status(500).send(`Error: ${error.message}`);
      }
    });
  });
};
