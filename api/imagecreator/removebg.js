const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

async function getToken() {
  const { data } = await axios.get(
    "https://removal.ai/wp-admin/admin-ajax.php?action=ajax_get_webtoken&security=1cf5632768"
  );
  return data.data.webtoken;
}

async function removeBgFromUrl(imageUrl) {
  const tmpPath = path.join(__dirname, "tmp_removebg.png");

  const img = await axios.get(imageUrl, { responseType: "stream" });
  const writer = fs.createWriteStream(tmpPath);
  img.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  const form = new FormData();
  form.append("image_file", fs.createReadStream(tmpPath));

  const token = await getToken();

  const { data } = await axios.post(
    "https://api.removal.ai/3.0/remove",
    form,
    {
      headers: {
        ...form.getHeaders(),
        "user-agent":
          "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Mobile Safari/537.36",
        origin: "https://removal.ai",
        accept: "*/*",
        "web-token": token
      }
    }
  );

  fs.unlinkSync(tmpPath);

  return {
    url: data.url,
    low_resolusi: data.low_resolution || null,
    demo: data.preview_demo || null,
    extra: data.extra || null,
    original: data.original
  };
}

module.exports = function (app) {
  app.get("/imagecreator/removebg", async (req, res) => {
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
          error: "Url gambar tidak boleh kosong"
        });
      }

      const result = await removeBgFromUrl(url);

      res.json({
        status: true,
        creator: "Matstoree",
        result
      });
    } catch (err) {
      res.json({
        status: false,
        error: err.message
      });
    }
  });
};
