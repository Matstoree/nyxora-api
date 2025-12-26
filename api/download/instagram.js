const axios = require("axios");

module.exports = function (app) {
  app.get("/download/instagram", async (req, res) => {
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
          error: "Url Instagram tidak boleh kosong"
        });
      }

      const { data } = await axios.get(
        "https://api.deline.web.id/downloader/ig",
        {
          params: { url }
        }
      );

      if (!data || !data.status) {
        return res.json({
          status: false,
          error: "Gagal mengambil media Instagram"
        });
      }

      const media = data.result.media;

      res.json({
        status: true,
        creator: "Matstoree",
        result: {
          images: media.images || [],
          videos: media.videos || []
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
