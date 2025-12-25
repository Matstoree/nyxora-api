const axios = require("axios");

module.exports = function (app) {
  app.get("/download/play", async (req, res) => {
    try {
      const { apikey, q } = req.query;

      if (!global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: "Apikey invalid"
        });
      }

      if (!q) {
        return res.json({
          status: false,
          error: "Query tidak boleh kosong"
        });
      }

      const { data } = await axios.get(
        "https://api.nekolabs.web.id/dwn/youtube/play/v1",
        {
          params: { q }
        }
      );

      if (!data.success || !data.result) {
        return res.json({
          status: false,
          error: "Gagal mengambil data play"
        });
      }

      const { metadata, downloadUrl } = data.result;

      res.json({
        status: true,
        creator: "Matstoree",
        metadata: {
          title: metadata.title,
          channel: metadata.channel,
          duration: metadata.duration,
          cover: metadata.cover,
          url: metadata.url
        },
        audio: downloadUrl
      });
    } catch (e) {
      res.json({
        status: false,
        error: e.message
      });
    }
  });
};
