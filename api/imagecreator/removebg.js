const axios = require("axios");
const FormData = require("form-data");

module.exports = function (app) {
  app.get("/imagecreator/removebg", async (req, res) => {
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

      const img = await axios.get(url, {
        responseType: "arraybuffer"
      });

      const form = new FormData();
      form.append("format", "png");
      form.append("model", "v1");
      form.append("image", Buffer.from(img.data), {
        filename: "image.png"
      });

      const response = await axios.post(
        "https://api2.pixelcut.app/image/matte/v1",
        form,
        {
          headers: {
            ...form.getHeaders(),
            "x-client-version": "web"
          },
          responseType: "arraybuffer"
        }
      );

      res.set({
        "Content-Type": "image/png",
        "Content-Disposition": "inline; filename=removebg.png"
      });

      res.send(Buffer.from(response.data));
    } catch (err) {
      res.json({
        status: false,
        error: err.message
      });
    }
  });
};