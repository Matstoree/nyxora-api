module.exports = function (app) {
  const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))

  class GeminiClient {
    constructor() {
      this.s = null
      this.r = 1
    }

    async init() {
      const res = await fetch('https://gemini.google.com/', {
        headers: {
          'user-agent':
            'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
        },
      })
      const h = await res.text()
      this.s = {
        a: h.match(/"SNlM0e":"(.*?)"/)?.[1] || '',
        b: h.match(/"cfb2h":"(.*?)"/)?.[1] || '',
        c: h.match(/"FdrFJe":"(.*?)"/)?.[1] || '',
      }
      return this.s
    }

    async ask(m) {
      if (!this.s) await this.init()
      const p = [null, JSON.stringify([[m, 0, null, null, null, null, 0]])]
      const q = new URLSearchParams({
        bl: this.s.b,
        'f.sid': this.s.c,
        hl: 'id',
        _reqid: this.r++,
        rt: 'c',
      })

      const res = await fetch(
        `https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?${q}`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'user-agent':
              'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
            'x-same-domain': '1',
          },
          body: `f.req=${encodeURIComponent(JSON.stringify(p))}&at=${this.s.a}`,
        }
      )

      return this.parse(await res.text())
    }

    parse(t) {
      let l = null
      for (const ln of t.split('\n').filter((x) => x.startsWith('[["wrb.fr"'))) {
        try {
          const d = JSON.parse(JSON.parse(ln)[0][2])
          if (d[4]?.[0]?.[1]) {
            l = Array.isArray(d[4][0][1])
              ? d[4][0][1][0]
              : d[4][0][1]
          }
        } catch (e) {}
      }
      return l
    }
  }

  const gemini = new GeminiClient()

  async function Llama(prompt) {
    const res = await gemini.ask(prompt)
    return res || ''
  }

  app.get('/ai/gemini', async (req, res) => {
    try {
      const { text, apikey } = req.query
      if (!global.apikey.includes(apikey))
        return res.json({ status: false, error: 'Apikey invalid' })

      const result = await Llama(text)
      res.status(200).json({
        status: true,
        result: result,
      })
    } catch (error) {
      res.json({ status: false, error: error.message })
    }
  })
}
