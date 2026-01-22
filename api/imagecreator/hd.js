const axios = require("axios");

/* ===== AI ENHANCER SCRAPER ===== */

async function aienhancer(image, {
  model = 3,
  settings = "kRpBbpnRCD2nL2RxnnuoMo7MBc0zHndTDkWMl9aW+Gw="
} = {}) {

  if (!image) throw new Error("image is required");

  let base64;

  if (/^https?:\/\//.test(image)) {
    const img = await axios.get(image, { responseType: "arraybuffer" });
    base64 = Buffer.from(img.data).toString("base64");
  } else {
    throw new Error("Image harus berupa URL");
  }

  const headers = {
    authority: "aienhancer.ai",
    accept: "*/*",
    "content-type": "application/json",
    origin: "https://aienhancer.ai",
    referer: "https://aienhancer.ai/hd-picture-converter",
    "user-agent":
      "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome Mobile"
  };

  const create = await axios.post(
    "https://aienhancer.ai/api/v1/r/image-enhance/create",
    {
      model,
      image: "data:image/png;base64," + base64,
      settings
    },
    { headers }
  );

  const taskId = create.data?.data?.id;
  if (!taskId) throw new Error("Gagal membuat task");

  while (true) {
    await new Promise(r => setTimeout(r, 2000));

    const result = await axios.post(
      "https://aienhancer.ai/api/v1/r/image-enhance/result",
      { task_id: taskId },
      { headers }
    );

    const status = result.data?.data?.status;

    if (status === "succeeded") {
      return result.data.data.output;
    }

    if (status === "failed") {
      throw new Error("Enhance gagal");
    }
  }
}

/* ===== EXPRESS ENDPOINT (STYLE SC KAMU) ===== */

module.exports = function (app) {
  app.get("/imagecreator/hd", async (req, res) => {
    try {
      const { apikey, url, model } = req.query;

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

      const outputUrl = await aienhancer(url, {
        model: Number(model) || 3
      });

      const img = await axios.get(outputUrl, {
        responseType: "arraybuffer"
      });

      res.set({
        "Content-Type": "image/png",
        "Content-Disposition": "inline; filename=hd.png"
      });

      res.send(Buffer.from(img.data));
    } catch (e) {
      console.error(e);
      res.json({
        status: false,
        error: e.message || "Gagal HD gambar"
      });
    }
  });
};
