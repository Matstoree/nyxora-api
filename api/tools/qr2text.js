const axios = require("axios");
const jsQR = require("jsqr");
const { createCanvas, loadImage } = require("canvas");

async function readQrCodeFromUrl(url) {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 30000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
  });

  const image = await loadImage(Buffer.from(response.data));
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height);

  if (!code) {
    throw new Error("QR code tidak ditemukan");
  }

  return code.data;
}

module.exports = function (app) {
  app.get("/tools/qr2text", async (req, res) => {
    try {
      const { apikey, url } = req.query;

      if (!global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: "Apikey invalid"
        });
      }

      if (!url) {
        return res.json({
          status: false,
          error: "Url gambar tidak boleh kosong"
        });
      }

      const text = await readQrCodeFromUrl(url.trim());

      res.json({
        status: true,
        creator: "Matstoree",
        result: {
          text
        }
      });
    } catch (err) {
      res.json({
        status: false,
        error: err.message
      });
    }
  });
};
