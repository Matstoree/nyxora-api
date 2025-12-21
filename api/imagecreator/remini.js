const axios = require('axios');
const FormData = require('form-data');
const { fromBuffer } = require('file-type');
const path = require('path');

// ===================== REMOVEBG SCRAPER =====================
async function removeBg(buffer) {
    try {
        const form = new FormData();
        form.append('format', 'png');
        form.append('model', 'v1');
        form.append('image', buffer, { filename: 'image.png' });

        const res = await axios.post('https://api2.pixelcut.app/image/matte/v1', form, {
            headers: {
                'x-client-version': 'web',
                ...form.getHeaders()
            },
            responseType: 'arraybuffer'
        });

        return Buffer.from(res.data);
    } catch (error) {
        throw new Error('Failed to remove background: ' + error.message);
    }
}

// ===================== UPSCALE SCRAPER (iLoveImg) =====================
class UpscaleImageAPI {
    api = null;
    server = null;
    taskId = null;
    token = null;

    async getTaskId() {
        const { data: html } = await axios.get("https://www.iloveimg.com/upscale-image", {
            headers: { 
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36" 
            }
        });

        const tokenMatches = html.match(/(ey[a-zA-Z0-9?%\-_/]+)/g);
        if (!tokenMatches || tokenMatches.length < 2) throw new Error("Token not found.");
        this.token = tokenMatches[1];

        const configMatch = html.match(/var ilovepdfConfig = ({.*?});/s);
        if (!configMatch) throw new Error("Server configuration not found.");
        const configJson = JSON.parse(configMatch[1]);
        const servers = configJson.servers;
        if (!Array.isArray(servers) || servers.length === 0) throw new Error("Server list is empty.");

        this.server = servers[Math.floor(Math.random() * servers.length)];
        this.taskId = html.match(/ilovepdfConfig\.taskId\s*=\s*['"](\w+)['"]/)?.[1];

        this.api = axios.create({
            baseURL: `https://${this.server}.iloveimg.com`,
            headers: {
                "Authorization": `Bearer ${this.token}`,
                "Origin": "https://www.iloveimg.com",
                "Referer": "https://www.iloveimg.com/",
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36"
            }
        });

        if (!this.taskId) throw new Error("Task ID not found!");
        return { taskId: this.taskId, server: this.server, token: this.token };
    }

    async uploadFromBuffer(buffer) {
        if (!this.taskId || !this.api) throw new Error("Run getTaskId() first.");
        
        const fileType = await fromBuffer(buffer);
        if (!fileType || !fileType.mime.startsWith("image/")) throw new Error("Unsupported file type.");

        const fileName = `image.${fileType.ext}`;

        const form = new FormData();
        form.append("name", fileName);
        form.append("chunk", "0");
        form.append("chunks", "1");
        form.append("task", this.taskId);
        form.append("preview", "1");
        form.append("file", buffer, { filename: fileName, contentType: fileType.mime });

        const response = await this.api.post("/v1/upload", form, { 
            headers: form.getHeaders() 
        });
        return response.data;
    }

    async upscaleImage(serverFilename, scale = 4) {
        if (!this.taskId || !this.api) throw new Error("Run getTaskId() first.");
        if (scale !== 2 && scale !== 4) throw new Error("Scale must be 2 or 4.");

        const form = new FormData();
        form.append("task", this.taskId);
        form.append("server_filename", serverFilename);
        form.append("scale", scale.toString());

        const response = await this.api.post("/v1/upscale", form, { 
            headers: form.getHeaders(), 
            responseType: "arraybuffer" 
        });
        return Buffer.from(response.data);
    }
}

async function upscaleImage(buffer, scale = 4) {
    try {
        const upscaler = new UpscaleImageAPI();
        await upscaler.getTaskId();
        const uploadResult = await upscaler.uploadFromBuffer(buffer);
        if (!uploadResult || !uploadResult.server_filename) {
            throw new Error("Failed to upload image.");
        }
        return await upscaler.upscaleImage(uploadResult.server_filename, scale);
    } catch (error) {
        throw new Error('Failed to upscale image: ' + error.message);
    }
}

// ===================== HELPER FUNCTION =====================
async function getBuffer(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    } catch (error) {
        throw new Error('Failed to fetch image: ' + error.message);
    }
}

// Upload ke temporary storage (tmpfiles.org)
async function uploadImage(buffer) {
    try {
        const { ext, mime } = await fromBuffer(buffer);
        const form = new FormData();
        form.append('file', buffer, { filename: `tmp.${ext}`, contentType: mime });

        const { data } = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
            headers: form.getHeaders()
        });

        const match = /https?:\/\/tmpfiles.org\/(.*)/.exec(data.data.url);
        return `https://tmpfiles.org/dl/${match[1]}`;
    } catch (error) {
        throw new Error('Failed to upload image: ' + error.message);
    }
}

// ===================== REST API ROUTES =====================
module.exports = function(app) {
    // Remove Background API
    app.get('/imagecreator/removebg', async (req, res) => {
        const { apikey, url } = req.query;
        if (!global.apikey.includes(apikey)) {
            return res.json({ status: false, error: 'Apikey invalid' });
        }
        if (!url) {
            return res.json({ status: false, error: 'URL is required' });
        }
        try {
            const imageBuffer = await getBuffer(url);
            const resultBuffer = await removeBg(imageBuffer);
            
            // Upload ke tmpfiles untuk dapat URL
            const imageUrl = await uploadImage(resultBuffer);
            
            res.status(200).json({
                status: true,
                creator: 'ItsMeMatt',
                result: imageUrl
            });
        } catch (error) {
            res.status(500).json({ 
                status: false, 
                error: error.message 
            });
        }
    });

    // Upscale Image API
    app.get('/imagecreator/upscale', async (req, res) => {
        const { apikey, url } = req.query;
        if (!global.apikey.includes(apikey)) {
            return res.json({ status: false, error: 'Apikey invalid' });
        }
        if (!url) {
            return res.json({ status: false, error: 'URL is required' });
        }
        try {
            const imageBuffer = await getBuffer(url);
            const resultBuffer = await upscaleImage(imageBuffer, 4);
            
            // Upload ke tmpfiles untuk dapat URL
            const imageUrl = await uploadImage(resultBuffer);
            
            res.status(200).json({
                status: true,
                creator: 'ItsMeMatt',
                result: imageUrl
            });
        } catch (error) {
            res.status(500).json({ 
                status: false, 
                error: error.message 
            });
        }
    });
};
