const axios = require("axios");

module.exports = function (app) {
  app.get("/imagecreator/editphoto", async (req, res) => {
    try {
      const { apikey, url, prompt } = req.query;

      if (!global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: "Apikey invalid"
        });
      }

      if (!url || !prompt) {
        return res.json({
          status: false,
          error: "Url dan prompt wajib diisi"
        });
      }

      const response = await axios.get(
        "https://api.alyachan.dev/api/ai-edit",
        {
          params: {
            image: url,
            prompt,
            apikey: "umaasa"
          }
        }
      );

      const resultUrl = response.data?.data?.images?.[0]?.url;
      if (!resultUrl) {
        return res.json({
          status: false,
          error: "API tidak mengembalikan hasil"
        });
      }

      const img = await axios.get(resultUrl, {
        responseType: "arraybuffer"
      });

      res.set({
        "Content-Type": "image/png",
        "Content-Disposition": "inline; filename=edit.png"
      });

      res.send(Buffer.from(img.data));
    } catch (e) {
      res.json({
        status: false,
        error: e.message
      });
    }
  });
};