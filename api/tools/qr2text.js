const axios = require("axios");

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

      const { data } = await axios.get(
        "https://api.qrserver.com/v1/read-qr-code/",
        {
          params: { fileurl: url }
        }
      );

      if (
        !data ||
        !data[0] ||
        !data[0].symbol ||
        !data[0].symbol[0].data
      ) {
        return res.json({
          status: false,
          error: "QR code tidak ditemukan"
        });
      }

      res.json({
        status: true,
        creator: "Matstoree",
        result: {
          text: data[0].symbol[0].data
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
