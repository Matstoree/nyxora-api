const axios = require("axios");
const FormData = require("form-data");
const { fileTypeFromBuffer } = require("file-type");

async function uploadBuffer(buffer) {
  const type = await fileTypeFromBuffer(buffer);
  if (!type) throw new Error("File type tidak dikenali");

  const form = new FormData();
  form.append("file", buffer, {
    filename: `spotify.${type.ext}`,
    contentType: type.mime
  });

  const { data } = await axios.post(
    "https://tmpfiles.org/api/v1/upload",
    form,
    { headers: form.getHeaders() }
  );

  const match = /https?:\/\/tmpfiles.org\/(.*)/.exec(data.data.url);
  return `https://tmpfiles.org/dl/${match[1]}`;
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

      const input = url || q;

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
        return res.json({
          status: false,
          error: "Track tidak ditemukan"
        });
      }

      const song = s.songs[0];

      const { data: audioBuffer } = await axios.post(
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

      const audioUrl = await uploadBuffer(Buffer.from(audioBuffer));

      res.json({
        status: true,
        creator: "Matstoree",
        metadata: {
          title: song.title,
          artist: song.artist,
          duration: song.duration,
          cover: song.thumbnail
        },
        audio: audioUrl
      });
    } catch (err) {
      res.json({
        status: false,
        error: err.message
      });
    }
  });
};
