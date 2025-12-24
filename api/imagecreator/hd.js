const axios = require("axios");
const FormData = require("form-data");
const { fileTypeFromBuffer } = require("file-type");
const path = require("path");

// ===================== TMPFILES UPLOAD =====================
async function uploadImage(buffer) {
  const { ext, mime } = await fileTypeFromBuffer(buffer);
  const form = new FormData();
  form.append("file", buffer, { filename: `tmp.${ext}`, contentType: mime });

  const { data } = await axios.post(
    "https://tmpfiles.org/api/v1/upload",
    form,
    { headers: form.getHeaders() }
  );

  const match = /https?:\/\/tmpfiles.org\/(.*)/.exec(data.data.url);
  return `https://tmpfiles.org/dl/${match[1]}`;
}

// ===================== ILOVEIMG UPSCALE =====================
class UpscaleImageAPI {
  api = null;
  server = null;
  taskId = null;
  token = null;

  async getTaskId() {
    const { data: html } = await axios.get(
      "https://www.iloveimg.com/upscale-image",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome Mobile Safari/537.36"
        }
      }
    );

    const tokenMatches = html.match(/(ey[a-zA-Z0-9?%-_/]+)/g);
    if (!tokenMatches || tokenMatches.length < 2)
      throw new Error("Token not found");

    this.token = tokenMatches[1];

    const configMatch = html.match(/var ilovepdfConfig = ({.*?});/s);
    if (!configMatch) throw new Error("Config not found");

    const configJson = JSON.parse(configMatch[1]);
    this.server =
      configJson.servers[
        Math.floor(Math.random() * configJson.servers.length)
      ];

    this.taskId =
      html.match(/ilovepdfConfig\.taskId\s*=\s*['"](\w+)['"]/)?.[1];

    this.api = axios.create({
      baseURL: `https://${this.server}.iloveimg.com`,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Origin: "https://www.iloveimg.com",
        Referer: "https://www.iloveimg.com/",
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome Mobile Safari/537.36"
      }
    });

    if (!this.taskId) throw new Error("Task ID not found");
  }

  async uploadFromUrl(imageUrl) {
    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer"
    });

    const fileType = await fileTypeFromBuffer(imageResponse.data);
    if (!fileType || !fileType.mime.startsWith("image/"))
      throw new Error("Invalid image");

    const buffer = Buffer.from(imageResponse.data);
    const fileName = `image.${fileType.ext}`;

    const form = new FormData();
    form.append("name", fileName);
    form.append("chunk", "0");
    form.append("chunks", "1");
    form.append("task", this.taskId);
    form.append("preview", "1");
    form.append("file", buffer, {
      filename: fileName,
      contentType: fileType.mime
    });

    const { data } = await this.api.post("/v1/upload", form, {
      headers: form.getHeaders()
    });

    return data.server_filename;
  }

  async upscale(serverFilename, scale = 4) {
    const form = new FormData();
    form.append("task", this.taskId);
    form.append("server_filename", serverFilename);
    form.append("scale", scale.toString());

    const { data } = await this.api.post("/v1/upscale", form, {
      headers: form.getHeaders(),
      responseType: "arraybuffer"
    });

    return Buffer.from(data);
  }
}

async function upscaleFromUrl(imageUrl, scale = 4) {
  const upscaler = new UpscaleImageAPI();
  await upscaler.getTaskId();
  const serverFile = await upscaler.uploadFromUrl(imageUrl);
  return await upscaler.upscale(serverFile, scale);
}

// ===================== REST API =====================
module.exports = function (app) {
  app.get("/imagecreator/upscale", async (req, res) => {
    try {
      const { apikey, url, scale } = req.query;

      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: "Apikey invalid" });
      }

      if (!url) {
        return res.json({ status: false, error: "URL is required" });
      }

      const resultBuffer = await upscaleFromUrl(url, Number(scale) || 4);
      const imageUrl = await uploadImage(resultBuffer);

      res.json({
        status: true,
        creator: "ItsMeMatt",
        result: imageUrl
      });
    } catch (e) {
      res.json({
        status: false,
        error: e.message
      });
    }
  });
};
