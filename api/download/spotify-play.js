const axios = require("axios");

async function spotify(input) {
  if (!input) throw new Error("Input is required");

  const { data: s } = await axios.get(
    `https://spotdown.org/api/song-details?url=${encodeURIComponent(input)}`,
    {
      headers: {
        origin: "https://spotdown.org",
        referer: "https://spotdown.org/",
        "user-agent":
          "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Mobile Safari/537.36"
      }
    }
  );

  if (!s || !s.songs || s.songs.length === 0) {
    throw new Error("Track tidak ditemukan");
  }

  const song = s.songs[0];

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

  return {
    metadata: {
      title: song.title,
      artist: song.artist,
      duration: song.duration,
      cover: song.thumbnail,
      url: song.url
    },
    audio: data
  };
}

module.exports = function (app) {
  app.get("/download/spotify-play", async (req, res) => {
    try {
      const { apikey, url, q } = req.query;

      if (!global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: "Apikey invalid"
        });
      }

      if (!url && !q) {
        return res.json({
          status: false,
          error: "Url atau query tidak boleh kosong"
        });
      }

      const input = url ? url : q;
      const result = await spotify(input);

      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `inline; filename="${result.metadata.title}.mp3"`
      });

      res.send(Buffer.from(result.audio));
    } catch (err) {
      res.json({
        status: false,
        error: err.message
      });
    }
  });
};
