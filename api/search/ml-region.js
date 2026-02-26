const axios = require("axios");
const cheerio = require("cheerio");
const qs = require("qs");

async function mlregion(userId, zoneId) {
  if (!userId || isNaN(userId)) throw new Error("Invalid user id");
  if (!zoneId || isNaN(zoneId)) throw new Error("Invalid zone id");

  const url = "https://pizzoshop.com/mlchecker/check";

  const payload = qs.stringify({
    user_id: userId,
    zone_id: zoneId
  });

  try {
    const response = await axios({
      method: "POST",
      url: url,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        origin: "https://pizzoshop.com",
        referer: "https://pizzoshop.com/mlchecker"
      },
      data: payload,
      timeout: 15000
    });

    const $ = cheerio.load(response.data);

    const table = $(".table-modern");

    if (!table.length) {
      const errorMsg = $(".alert-danger").text().trim();
      throw new Error(errorMsg || "Data tidak ditemukan atau User ID salah.");
    }

    const result = {
      username: null,
      region: null,
      lastLogin: null,
      createdAt: null
    };

    table.find("tr").each((_, el) => {
      const key = $(el).find("th").text().replace(/\s+/g, " ").trim();
      const value = $(el).find("td").text().trim();

      if (/Nickname/i.test(key)) result.username = value;
      if (/Region ID/i.test(key)) result.region = value;
      if (/Last Login/i.test(key)) result.lastLogin = value;
      if (/Created/i.test(key)) result.createdAt = value;
    });

    if (!result.username) {
      throw new Error("Gagal parsing data (struktur berubah?)");
    }

    return result;

  } catch (err) {
    throw new Error(err.message);
  }
}

module.exports = function (app) {
  app.get("/search/ml-region", async (req, res) => {
    try {
      const { apikey, user_id, zone_id } = req.query;

      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: "Apikey invalid" });
      }

      if (!user_id || !zone_id) {
        return res.json({
          status: false,
          error: "user_id dan zone_id wajib diisi"
        });
      }

      const data = await mlregion(user_id, zone_id);

      return res.json({
        status: true,
        creator: "Matstoree",
        result: {
          user_id,
          zone_id,
          username: data.username,
          region: data.region,
          last_login: data.lastLogin,
          created_at: data.createdAt
        }
      });

    } catch (e) {
      return res.json({
        status: false,
        error: e.message
      });
    }
  });
};
