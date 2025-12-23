const axios = require("axios");

module.exports = function (app) {
  app.get("/search/lyrics", async (req, res) => {
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
        `https://lrclib.net/api/search?q=${encodeURIComponent(q)}`,
        {
          headers: {
            referer: `https://lrclib.net/search/${encodeURIComponent(q)}`,
            "user-agent":
              "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36"
          }
        }
      );

      if (!data || data.length === 0) {
        return res.json({
          status: false,
          error: "Lyrics tidak ditemukan"
        });
      }

      res.json({
        status: true,
        creator: "Matstoree",
        query: q,
        result: data
      });
    } catch (err) {
      res.json({
        status: false,
        error: err.message
      });
    }
  });
};
