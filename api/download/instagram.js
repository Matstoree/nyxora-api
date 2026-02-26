const axios = require("axios");
const FormData = require("form-data");
const cheerio = require("cheerio");

module.exports = function (app) {
  app.get("/download/instagram", async (req, res) => {
    try {
      const { apikey, url } = req.query;

      if (!apikey || !global.apikey || !Array.isArray(global.apikey) || !global.apikey.includes(apikey)) {
        return res.status(401).json({
          status: false,
          error: "Apikey invalid"
        });
      }

      if (!url) {
        return res.status(400).json({
          status: false,
          error: "Url Instagram tidak boleh kosong"
        });
      }

      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch {
        return res.status(400).json({
          status: false,
          error: "Url tidak valid"
        });
      }

      if (!parsedUrl.hostname.includes("instagram.com")) {
        return res.status(400).json({
          status: false,
          error: "Url harus berupa link Instagram yang valid"
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
            origin: "https://snapinsta.top",
            referer: "https://snapinsta.top/"
          },
          timeout: 15000,
          maxRedirects: 5,
          validateStatus: (status) => status >= 200 && status < 500
        }
      );

      if (!response.data || typeof response.data !== "string") {
        return res.status(502).json({
          status: false,
          error: "Gagal mengambil data dari server"
        });
      }

      const $ = cheerio.load(response.data);
      const images = [];
      const videos = [];

      $(".download-items__btn a").each((_, el) => {
        let link = $(el).attr("href");
        if (!link) return;

        try {
          link = new URL(link, "https://snapinsta.top").href;
        } catch {
          return;
        }

        if (link.includes(".mp4")) {
          if (!videos.includes(link)) videos.push(link);
        } else {
          if (!images.includes(link)) images.push(link);
        }
      });

      if (!images.length && !videos.length) {
        return res.status(404).json({
          status: false,
          error: "Media tidak ditemukan"
        });
      }

      res.json({
        status: true,
        creator: "ItsMeMatt",
        result: {
          images,
          videos
        }
      });

    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message || "Internal Server Error"
      });
    }
  });
};
