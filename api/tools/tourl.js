const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const upload = multer({
  storage: multer.memoryStorage()
});

const uploadDir = path.join(process.cwd(), "files");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

module.exports = function (app) {
  app.post("/tools/tourl", async (req, res) => {
    try {
      const { apikey } = req.query;

      if (!global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: "Apikey invalid"
        });
      }

      await new Promise((resolve, reject) => {
        upload.single("file")(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      if (!req.file) {
        return res.json({
          status: false,
          error: "No file uploaded"
        });
      }

      const filename =
        crypto.randomBytes(16).toString("hex") +
        path.extname(req.file.originalname);

      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);

      const fileUrl = `${req.protocol}://${req.get("host")}/files/${filename}`;

      setTimeout(() => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, 5 * 60 * 1000);

      res.json({
        status: true,
        creator: "Matstoree",
        filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
        expired_in: "5 minutes"
      });
    } catch (e) {
      res.status(500).json({
        status: false,
        error: e.message || "Upload failed"
      });
    }
  });
};