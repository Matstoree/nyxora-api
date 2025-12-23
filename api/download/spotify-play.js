const axios = require("axios");

module.exports = function (app) {
  app.get("/download/spotify-play", async (req, res) => {
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

      const { data: s } = await axios.get(
        `https://spotdown.org/api/song-details?url=${encodeURIComponent(url)}`,
        {
          headers: {
            origin: "https://spotdown.org",
            referer: "https://spotdown.org/",
            "user-agent":
              "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Mobile Safari/537.36"
          }
        }
      );

      const song = s.songs[0];
      if (!song) {
        return res.json({
          status: false,
          error: "Track tidak ditemukan"
        });
      }

      const { data } = await axios.post(
        "https://spotdown.org/api/download",
        { url: song.url },
        {
          headers: {
            origin: "https://spotdown.org",
            referer: "https://spotdown.org/",
            "user-agent":
              "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Mobile Safari/537.36"
          },
          responseType: "arraybuffer"
        }
      );

      res.json({
        status: true,
        creator: "Matstoree",
        metadata: {
          title: song.title,
          artist: song.artist,
          duration: song.duration,
          cover: song.thumbnail,
          url: song.url
        },
        audio: Buffer.from(data).toString("base64")
      });
    } catch (err) {
      res.json({
        status: false,
        error: err.message
      });
    }
  });
};
