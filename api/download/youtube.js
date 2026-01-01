const axios = require("axios");
const crypto = require("crypto");

const yt = {
  baseHeaders: {
    accept: "application/json, text/plain, */*",
    "accept-encoding": "gzip, deflate, br, zstd",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
    origin: "https://v2.yt1s.biz"
  },

  extractId(url) {
    try {
      const u = new URL(url);
      if (u.hostname === "youtu.be") return u.pathname.slice(1);
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      if (u.pathname.includes("/shorts/"))
        return u.pathname.split("/shorts/")[1].split(/[?&]/)[0];
      if (u.pathname.includes("/embed/"))
        return u.pathname.split("/embed/")[1].split(/[?&]/)[0];
      return null;
    } catch {
      return null;
    }
  },

  async getSession() {
    const r = await fetch("https://fast.dlsrv.online/", {
      headers: this.baseHeaders
    });
    const token = r.headers.get("x-session-token");
    if (!token) throw Error("Session token kosong");
    return token;
  },

  pow(session, path) {
    let nonce = 0;
    while (true) {
      const h = crypto
        .createHash("sha256")
        .update(`${session}:${path}:${nonce}`)
        .digest("hex");
      if (h.startsWith("0000"))
        return { nonce: String(nonce), powHash: h };
      nonce++;
    }
  },

  sign(session, path, ts) {
    const secret = "a8d4e2456d59b90c8402fc4f060982aa";
    return crypto
      .createHmac("sha256", secret)
      .update(`${session}:${path}:${ts}`)
      .digest("hex");
  },

  async request(path, body) {
    const session = await this.getSession();
    const ts = Date.now().toString();
    const sig = this.sign(session, path, ts);
    const { nonce, powHash } = this.pow(session, path);

    const headers = {
      "content-type": "application/json",
      "x-api-auth":
        "Ig9CxOQPYu3RB7GC21sOcgRPy4uyxFKTx54bFDu07G3eAMkrdVqXY9bBatu4WqTpkADrQ",
      "x-session-token": session,
      "x-signature": sig,
      "x-signature-timestamp": ts,
      nonce,
      powhash: powHash,
      ...this.baseHeaders
    };

    const r = await fetch(`https://fast.dlsrv.online/gateway${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    if (!r.ok) throw Error("Gagal mengambil data");
    return r.json();
  }
};

module.exports = function (app) {

  // ================== YTMP4 (TETAP) ==================
  app.get("/download/ytmp4", async (req, res) => {
    try {
      const { apikey, url, quality = "480p" } = req.query;
      if (!global.apikey.includes(apikey))
        return res.json({ status: false, error: "Apikey invalid" });

      const id = yt.extractId(url);
      if (!id)
        return res.json({ status: false, error: "URL YouTube tidak valid" });

      const q = quality.replace("p", "");
      const data = await yt.request("/video", {
        videoId: id,
        quality: q
      });

      res.json({
        status: true,
        creator: "Matstoree",
        type: "video",
        quality,
        result: data
      });
    } catch (e) {
      res.json({ status: false, error: e.message });
    }
  });

  // ================== YTMP3 (FIXED) ==================
  app.get("/download/ytmp3", async (req, res) => {
    try {
      const { apikey, url } = req.query;

      if (!global.apikey.includes(apikey))
        return res.json({ status: false, error: "Apikey invalid" });

      if (!url)
        return res.json({ status: false, error: "URL YouTube tidak valid" });

      const { data } = await axios.get(
        "https://api.soymaycol.icu/ytdl",
        {
          params: {
            url,
            type: "mp3",
            apikey: "may-79a0a758"
          }
        }
      );

      if (!data.status || !data.result?.url) {
        return res.json({
          status: false,
          error: "Gagal mendapatkan audio"
        });
      }

      res.json({
        status: true,
        creator: "Matstoree",
        type: "audio",
        result: {
          title: data.result.title,
          quality: data.result.quality,
          url: data.result.url
        }
      });
    } catch (e) {
      res.json({ status: false, error: e.message });
    }
  });

};
