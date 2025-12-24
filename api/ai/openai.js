const axios = require("axios");

module.exports = function (app) {
  app.get("/ai/openai", async (req, res) => {
    try {
      const { apikey, text, prompt } = req.query;

      if (!global.apikey.includes(apikey)) {
        return res.json({
          status: false,
          error: "Apikey invalid"
        });
      }

      if (!text) {
        return res.json({
          status: false,
          error: "Text tidak boleh kosong"
        });
      }

      const response = await axios.get(
        "https://api.deline.web.id/ai/openai",
        {
          params: {
            text,
            prompt
          }
        }
      );

      if (!response.data || !response.data.status) {
        return res.json({
          status: false,
          error: "Gagal mendapatkan respon AI"
        });
      }

      res.json({
        status: true,
        creator: "Matstoree",
        result: response.data.result
      });
    } catch (e) {
      res.json({
        status: false,
        error: e.message
      });
    }
  });
};