const axios = require("axios");

async function editImage(buffer, prompt) {
  if (!Buffer.isBuffer(buffer)) throw new Error("Image buffer invalid");
  if (!prompt) throw new Error("Prompt is required");

  const { data } = await axios.post(
    "https://ai-studio.anisaofc.my.id/api/edit-image",
    {
      image: buffer.toString("base64"),
      prompt
    },
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "*/*",
        "Content-Type": "application/json",
        Origin: "https://ai-studio.anisaofc.my.id",
        Referer: "https://ai-studio.anisaofc.my.id/"
      }
    }
  );

  return data;
}

module.exports = function (app) {
  app.get("/imagecreator/editphoto", async (req, res) => {
    try {
      const { apikey, url, prompt } = req.query;

      if (!global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: "Apikey invalid"
        });
      }

      if (!url || !prompt) {
        return res.json({
          status: false,
          error: "Url dan prompt wajib diisi"
        });
      }

      const img = await axios.get(url, {
        responseType: "arraybuffer"
      });

      const result = await editImage(Buffer.from(img.data), prompt);

      const imageUrl = result?.imageUrl;
      if (!imageUrl) {
        return res.json({
          status: false,
          error: "API tidak mengembalikan hasil"
        });
      }

      const finalImg = await axios.get(imageUrl, {
        responseType: "arraybuffer"
      });

      res.set({
        "Content-Type": "image/png",
        "Content-Disposition": "inline; filename=edit.png"
      });

      res.send(Buffer.from(finalImg.data));
    } catch (e) {
      res.json({
        status: false,
        error: e.message
      });
    }
  });
};