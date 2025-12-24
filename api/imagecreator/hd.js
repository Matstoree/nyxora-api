const axios = require("axios");
const FormData = require("form-data");
const path = require("path");
const { fileTypeFromBuffer } = require("file-type");

class UpscaleImageAPI {
  constructor() {
    this.api = null;
    this.server = null;
    this.taskId = null;
    this.token = null;
  }

  async getTaskId() {
    const { data: html } = await axios.get("https://www.iloveimg.com/upscale-image", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Mobile Safari/537.36"
      }
    });

    const tokenMatches = html.match(/(ey[a-zA-Z0-9?%-_/]+)/g);
    if (!tokenMatches || tokenMatches.length < 2) throw new Error("Token not found");

    this.token = tokenMatches[1];

    const configMatch = html.match(/var ilovepdfConfig = ({.*?});/s);
    if (!configMatch) throw new Error("Server config not found");

    const configJson = JSON.parse(configMatch[1]);
    const servers = configJson.servers;
    if (!servers || !servers.length) throw new Error("Server empty");

    this.server = servers[Math.floor(Math.random() * servers.length)];
    this.taskId = html.match(/ilovepdfConfig\.taskId\s*=\s*['"](\w+)['"]/)?.[1];
    if (!this.taskId) throw new Error("Task ID not found");

    this.api = axios.create({
      baseURL: `https://${this.server}.iloveimg.com`,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Origin: "https://www.iloveimg.com",
        Referer: "https://www.iloveimg.com/",
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Mobile Safari/537.36"
      }
    });
  }

  async uploadFromUrl(imageUrl) {
    const image = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const type = await fileTypeFromBuffer(image.data);
    if (!type || !type.mime.startsWith("image/")) throw new Error("Invalid image");

    const buffer = Buffer.from(image.data);
    const fileName = path.basename(new URL(imageUrl).pathname) || `image.${type.ext}`;

    const form = new FormData();
    form.append("name", fileName);
    form.append("chunk", "0");
    form.append("chunks", "1");
    form.append("task", this.taskId);
    form.append("preview", "1");
    form.append("file", buffer, { filename: fileName, contentType: type.mime });

    const res = await this.api.post("/v1/upload", form, {
      headers: form.getHeaders()
    });

    return res.data.server_filename;
  }

  async upscale(serverFilename) {
    const form = new FormData();
    form.append("task", this.taskId);
    form.append("server_filename", serverFilename);
    form.append("scale", "4");

    const res = await this.api.post("/v1/upscale", form, {
      headers: form.getHeaders(),
      responseType: "arraybuffer"
    });

    return res.data;
  }
}

module.exports = function (app) {
  app.get("/imagecreator/hd", async (req, res) => {
    try {
      const { apikey, url } = req.query;

      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: "Apikey invalid" });
      }

      if (!url) {
        return res.json({ status: false, error: "Url gambar tidak boleh kosong" });
      }

      const up = new UpscaleImageAPI();
      await up.getTaskId();
      const serverFilename = await up.uploadFromUrl(url);
      const buffer = await up.upscale(serverFilename);

      res.set({
        "Content-Type": "image/png",
        "Content-Disposition": "inline; filename=hd.png"
      });

      res.send(Buffer.from(buffer));
    } catch (e) {
      res.json({
        status: false,
        error: e.message
      });
    }
  });
};