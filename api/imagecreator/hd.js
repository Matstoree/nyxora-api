const axios = require("axios");
const cheerio = require("cheerio");
const FormData = require("form-data");

/* ===== ILOVEIMG SCRAPER ===== */

async function getToken() {
  const html = await axios.get(
    "https://www.iloveimg.com/upscale-image",
    { headers: { "User-Agent": "Mozilla/5.0" } }
  );

  const $ = cheerio.load(html.data);

  const script = $("script")
    .filter((i, el) =>
      $(el).html() && $(el).html().includes("ilovepdfConfig =")
    )
    .html();

  if (!script) throw new Error("Token tidak ditemukan");

  const json = JSON.parse(
    script.split("ilovepdfConfig = ")[1].split(";")[0]
  );

  const csrf = $('meta[name="csrf-token"]').attr("content");

  return { token: json.token, csrf };
}

async function uploadImage(server, headers, buffer, task) {
  const form = new FormData();
  form.append("file", buffer, "image.jpg");
  form.append("task", task);
  form.append("chunk", "0");
  form.append("chunks", "1");
  form.append("preview", "1");

  const res = await axios.post(
    `https://${server}.iloveimg.com/v1/upload`,
    form,
    { headers: { ...headers, ...form.getHeaders() } }
  );

  return res.data;
}

async function hd(buffer, scale = 4) {
  const { token, csrf } = await getToken();

  const servers = [
    "api1g","api2g","api3g","api8g","api9g","api10g",
    "api11g","api12g","api13g","api14g","api15g"
  ];

  const server = servers[Math.floor(Math.random() * servers.length)];

  const task =
    "r68zl88mq72xq94j2d5p66bn2z9lrbx20njsbw2qsAvgmzr11lvfhAx9kl87pp6y";

  const headers = {
    Authorization: "Bearer " + token,
    Origin: "https://www.iloveimg.com",
    Cookie: "_csrf=" + csrf,
    "User-Agent": "Mozilla/5.0"
  };

  const upload = await uploadImage(server, headers, buffer, task);

  const form = new FormData();
  form.append("task", task);
  form.append("server_filename", upload.server_filename);
  form.append("scale", scale);

  const res = await axios.post(
    `https://${server}.iloveimg.com/v1/upscale`,
    form,
    {
      headers: { ...headers, ...form.getHeaders() },
      responseType: "arraybuffer"
    }
  );

  return res.data;
}

/* ===== EXPRESS ENDPOINT ===== */

module.exports = function (app) {
  app.get("/imagecreator/hd", async (req, res) => {
    try {
      const { apikey, url, scale } = req.query;

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

      const img = await axios.get(url, {
        responseType: "arraybuffer"
      });

      const result = await hd(
        Buffer.from(img.data),
        Number(scale) || 4
      );

      res.set({
        "Content-Type": "image/jpeg",
        "Content-Disposition": "inline; filename=hd.jpg"
      });

      res.send(Buffer.from(result));
    } catch (e) {
      console.error(e);
      res.json({
        status: false,
        error: "Gagal HD gambar"
      });
    }
  });
};
