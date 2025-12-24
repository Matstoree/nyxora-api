const axios = require("axios");

module.exports = function (app) {
  app.get("/ai/openai", async (req, res) => {
    try {
      const { apikey, text } = req.query;

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

      const response = await axios.post(
        "https://theturbochat.com/chat",
        {
          message: text,
          model: "gpt-3.5-turbo",
          language: "en"
        },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      const reply =
        response.data?.choices?.[0]?.message?.content;

      if (!reply) {
        return res.json({
          status: false,
          error: "Jawaban kosong"
        });
      }

      res.json({
        status: true,
        creator: "Matstoree",
        result: reply.trim()
      });
    } catch (e) {
      res.json({
        status: false,
        error: e.response?.data || e.message
      });
    }
  });
};