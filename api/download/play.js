const axios = require("axios");
const yts = require("yt-search");

module.exports = function (app) {

  function randomcookie() {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 26; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `PHPSESSID=${result}`;
  }

  async function fetchYTFullResponse(videoUrl) {

    const params = new URLSearchParams();
    params.append("url", videoUrl);

    const headers = {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.5",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      cookie: randomcookie(),
      origin: "https://app.ytdown.to",
      referer: "https://app.ytdown.to/en16/",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/145.0.0.0 Safari/537.36",
      "x-requested-with": "XMLHttpRequest",
    };

    const response = await axios.post(
      "https://app.ytdown.to/proxy.php",
      params,
      { headers }
    );

    return response.data;
  }

  app.get("/download/play", async (req, res) => {
    try {
      const { apikey, q } = req.query;

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: "Apikey invalid",
        });
      }

      if (!q) {
        return res.json({
          status: false,
          error: "Query tidak boleh kosong",
        });
      }

      const search = await yts(q);

      if (!search.videos.length) {
        return res.json({
          status: false,
          error: "Video tidak ditemukan",
        });
      }

      const video = search.videos[0];

      const scrape = await fetchYTFullResponse(video.url);

      const media = scrape.api.mediaItems;

      const mp3 = media.find(
        (item) =>
          item.type === "Audio" &&
          item.mediaExtension === "MP3"
      );

      if (!mp3) {
        return res.json({
          status: false,
          error: "MP3 tidak ditemukan",
        });
      }

      res.json({
        status: true,
        creator: "Matstoree",
        metadata: {
          title: scrape.api.title,
          channel: scrape.api.userInfo.name,
          duration: video.seconds,
          cover: scrape.api.imagePreviewUrl,
          url: scrape.api.permanentLink,
        },
        audio: mp3.mediaUrl,
      });

    } catch (err) {
      res.json({
        status: false,
        error: err.message,
      });
    }
  });
};
