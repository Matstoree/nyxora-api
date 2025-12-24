const axios = require("axios");

async function gptimage(prompt, buffer) {
  if (!prompt) throw new Error("Prompt is required");
  if (!Buffer.isBuffer(buffer)) throw new Error("Image must be a buffer");

  const { data } = await axios.post(
    "https://ghibli-proxy.netlify.app/.netlify/functions/ghibli-proxy",
    {
      image: "data:image/png;base64," + buffer.toString("base64"),
      prompt: prompt,
      model: "gpt-image-1",
      n: 1,
      size: "auto",
      quality: "low"
    },
    {
      headers: {
        origin: "https://overchat.ai",
        referer: "https://overchat.ai/",
        "user-agent":
          "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Mobile Safari/537.36"
      }
    }
  );

  const result = data?.data?.[0]?.b64_json;
  if (!result) throw new Error("No result found");

  return Buffer.from(result, "base64");
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

      const buffer = await gptimage(prompt, Buffer.from(img.data));

      res.set({
        "Content-Type": "image/png",
        "Content-Disposition": "inline; filename=edit.png"
      });

      res.send(buffer);
    } catch (e) {
      res.json({
        status: false,
        error: e.message
      });
    }
  });
};