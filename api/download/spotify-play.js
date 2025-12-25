const axios = require("axios");

async function spotifyPlay(input) {
  if (!input) throw new Error("Input is required");

  const { data } = await axios.get(
    "https://api.nekolabs.web.id/dwn/spotify/play/v1",
    {
      params: { q: input }
    }
  );

  if (!data?.success || !data?.result) {
    throw new Error("Gagal mengambil data spotify");
  }

  return data.result;
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
      const result = await spotifyPlay(input);

      const audioRes = await axios.get(result.downloadUrl, {
        responseType: "arraybuffer"
      });

      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `inline; filename="${result.metadata.title}.mp3"`
      });

      res.send(Buffer.from(audioRes.data));
    } catch (e) {
      res.json({
        status: false,
        error: e.message
      });
    }
  });
};
