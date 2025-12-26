const axios = require('axios')

async function gptChat(prompt) {
  const { data } = await axios.post(
    'http://138.68.100.17:3000/chatapi/proxies/openai/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are Nyxora, an AI assistant that is friendly, warm, and helpful.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      stream: true
    },
    {
      headers: {
        'content-type': 'application/json'
      },
      responseType: 'text'
    }
  )

  const chunks = data
    .split('\n\n')
    .filter(Boolean)

  let content = ''

  for (const c of chunks) {
    if (c.includes('[DONE]')) continue
    const jsonStr = c.replace(/^data:\s*/, '')

    try {
      const parsed = JSON.parse(jsonStr)
      const delta = parsed.choices?.[0]?.delta?.content
      if (delta) content += delta
    } catch {}
  }

  return content.trim()
}

module.exports = function (app) {
  app.get('/ai/openai', async (req, res) => {
    try {
      const { apikey, text } = req.query

      if (!global.apikey.includes(apikey)) {
        return res.json({ status: false, error: 'Apikey invalid' })
      }

      if (!text) {
        return res.json({ status: false, error: 'Text is required' })
      }

      const reply = await gptChat(text)

      if (!reply) throw new Error('Empty response')

      res.json({
        status: true,
        creator: 'ItsMeMatt',
        result: reply
      })
    } catch (e) {
      res.json({
        status: false,
        error: e.message
      })
    }
  })
}
