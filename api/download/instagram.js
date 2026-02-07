const axios = require("axios");
const FormData = require("form-data");
const cheerio = require("cheerio");

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

      const form = new FormData();
      form.append("url", url);
      form.append("action", "post");

      const response = await axios.post(
        "https://snapinsta.top/action.php",
        form,
        {
          headers: {
            ...form.getHeaders(),
            "user-agent":
              "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/144.0.0.0 Mobile Safari/537.36",
            "origin": "https://snapinsta.top",
            "referer": "https://snapinsta.top/"
          }
        }
      );

      const $ = cheerio.load(response.data);
      const images = [];
      const videos = [];

      $(".download-items__btn a").each((_, el) => {
        let link = $(el).attr("href");
        if (!link) return;
        if (!link.startsWith("http")) link = "https://snapinsta.top" + link;

        if (link.includes(".mp4")) videos.push(link);
        else images.push(link);
      });

      if (!images.length && !videos.length) {
        return res.json({
          status: false,
          error: "Media tidak ditemukan"
        });
      }

      res.json({
        status: true,
        creator: "Matstoree",
        result: {
          images,
          videos
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
