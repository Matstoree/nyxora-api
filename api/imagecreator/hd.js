const axios = require("axios");

module.exports = function (app) {
  app.get("/imagecreator/hd", async (req, res) => {
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

      const response = await axios.get(
        "https://api.deline.web.id/tools/hd",
        {
          params: { url },
          responseType: "arraybuffer"
        }
      );

      res.set({
        "Content-Type": "image/png",
        "Content-Disposition": "inline; filename=hd.png"
      });

      res.send(Buffer.from(response.data));
    } catch (e) {
      res.json({
        status: false,
        error: e.message
      });
    }
  });
};