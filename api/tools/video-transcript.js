const axios = require("axios");

module.exports = function (app) {
  app.get("/tools/video-transcript", async (req, res) => {
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
          error: "Url tidak boleh kosong"
        });
      }

      const { data } = await axios.get(
        "https://api.alyachan.dev/api/transcribe-video",
        {
          params: {
            url,
            apikey: "umaasa"
          }
        }
      );

      if (!data || !data.status) {
        return res.json({
          status: false,
          error: "Gagal mentranskrip video"
        });
      }

      res.json({
        status: true,
        creator: "Matstoree",
        result: data.data.text
      });
    } catch (err) {
      res.json({
        status: false,
        error: err.message
      });
    }
  });
};
