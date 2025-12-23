const cheerio = require("cheerio");

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

module.exports = function (app) {
  app.get("/search/pinterest-video", async (req, res) => {
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

      const url = `https://id.pinterest.com/search/videos/?q=${encodeURIComponent(
        q
      )}&rs=content_type_filter`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Mobile Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
        }
      });

      const html = await response.text();
      if (!html || html.length < 1000) {
        return res.json({
          status: false,
          error: "HTML kosong / terblokir"
        });
      }

      const $ = cheerio.load(html);
      const pins = new Set();

      $("[data-test-pin-id]").each((_, el) => {
        const id = $(el).attr("data-test-pin-id");
        if (id && /^\d+$/.test(id)) {
          pins.add(`https://id.pinterest.com/pin/${id}/`);
        }
      });

      if (pins.size === 0) {
        return res.json({
          status: false,
          error: "Video tidak ditemukan"
        });
      }

      res.json({
        status: true,
        creator: "Matstoree",
        query: q,
        result: [...pins]
      });
    } catch (err) {
      res.json({
        status: false,
        error: err.message
      });
    }
  });
};
