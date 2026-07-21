import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize GoogleGenAI client lazy / safely
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY is not defined. AI features will fallback to high-quality simulated modes.");
    }
    ai = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

/**
 * Resilient wrapper around client.models.generateContent that tries multiple models in sequence
 * if one fails (e.g. 503 Service Unavailable or 429 Rate Limit), with exponential backoff retries.
 */
async function callGeminiWithFallback(
  params: {
    contents: any;
    config?: any;
  },
  preferredModel?: string
): Promise<any> {
  const modelsToTry = [
    preferredModel || "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
  ];

  // Remove duplicates
  const uniqueModels = Array.from(new Set(modelsToTry));
  let lastError: any = null;

  for (const model of uniqueModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Attempting Gemini Content call with model: ${model} (attempt ${attempt}/2)...`);
        const client = getGeminiClient();
        const response = await client.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        
        if (response) {
          console.log(`Successfully completed Gemini call using model: ${model}`);
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err.message || JSON.stringify(err);
        console.warn(`Gemini content generation failed for model ${model} on attempt ${attempt}:`, errMsg);
        
        // If it is a 400 Bad Request (not 503 or 429), don't waste time retrying this model
        if (errMsg.includes("400") && !errMsg.includes("503") && !errMsg.includes("429")) {
          break;
        }
        
        // Wait 500ms before second attempt
        if (attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }
  }

  throw lastError || new Error("All Gemini models failed to respond");
}

/**
 * Resilient wrapper around client.models.generateImages that tries multiple image models
 * in sequence, with retries.
 */
async function callGeminiImageWithFallback(params: {
  prompt: string;
  config?: any;
}): Promise<any> {
  const modelsToTry = [
    "gemini-3.1-flash-lite-image",
    "gemini-3.1-flash-image",
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Attempting Gemini Image generation with model: ${model} (attempt ${attempt}/2)...`);
        const client = getGeminiClient();
        const response = await client.models.generateImages({
          model,
          prompt: params.prompt,
          config: params.config,
        });
        
        if (response?.generatedImages?.[0]?.image?.imageBytes) {
          console.log(`Successfully completed Gemini Image generation using model: ${model}`);
          return response;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini image generation failed for model ${model} on attempt ${attempt}:`, err.message || err);
        
        if (attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }
  }

  throw lastError || new Error("All Gemini image generation models failed");
}

// API Routes
app.post("/api/gemini/describe-product", async (req, res) => {
  try {
    const { name, category, sizeGrid, price, extraInfo } = req.body;
    
    const prompt = `Crie uma descrição atraente, moderna e de alta conversão para o seguinte produto de moda:
    Nome: ${name}
    Categoria: ${category}
    Tamanhos: ${sizeGrid || "Não especificado"}
    Preço: R$ ${price || "Sob consulta"}
    Detalhes adicionais: ${extraInfo || "Nenhum"}
    
    A descrição deve ser escrita em português, focar nos benefícios e estilo, incluir sugestões de uso e ser formatada de forma limpa em parágrafos e marcadores. Mantenha um tom caloroso e profissional ideal para redes sociais ou loja virtual infantil e infanto-juvenil.`;

    const client = getGeminiClient();
    if (process.env.GEMINI_API_KEY) {
      const response = await callGeminiWithFallback({
        contents: prompt,
      }, "gemini-3.5-flash");
      res.json({ description: response.text });
    } else {
      // Simulate high quality description when API Key is missing (e.g. initial dev preview)
      const simulated = `✨ **Nova Coleção: ${name}** ✨

O item perfeito para renovar o guarda-roupa com muito estilo e conforto! Desenvolvido com materiais de alta durabilidade e toque extremamente macio na pele, ideal para qualquer ocasião.

**Por que escolher este produto?**
- 🌟 **Conforto Absoluto:** Tecido respirável de alta qualidade que se adapta perfeitamente aos movimentos.
- 📐 **Ajuste Perfeito:** Disponível na grade de tamanhos (${sizeGrid || "único"}) para vestir perfeitamente.
- 🎨 **Estilo Versátil:** Combina facilmente com acessórios da categoria ${category}, permitindo looks criativos de passeio ou festa.

*Garanta já o seu! Estoque limitado.*`;
      res.json({ description: simulated });
    }
  } catch (error: any) {
    console.error("Gemini describe product error:", error);
    res.status(500).json({ error: error.message || "Erro ao gerar descrição com IA" });
  }
});

app.post("/api/gemini/image-suggestions", async (req, res) => {
  try {
    const { imageData, productName } = req.body;
    
    const client = getGeminiClient();
    if (process.env.GEMINI_API_KEY && imageData) {
      const base64Data = imageData.split(",")[1] || imageData;
      const response = await callGeminiWithFallback({
        contents: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data,
            }
          },
          {
            text: `Analise a imagem deste produto chamado "${productName || "Produto"}" e sugira melhorias visuais para o fundo, iluminação, além de sugerir tags/palavras-chave em português que destaquem este item na loja.`
          }
        ]
      }, "gemini-3.5-flash");
      res.json({ suggestion: response.text });
    } else {
      res.json({
        suggestion: `💡 **Sugestões da IA para a Foto de ${productName || "Produto"}:**\n- 📸 **Fundo:** Experimente usar um fundo infinito branco ou em tons pastéis suaves para destacar as cores da peça.\n- ☀️ **Iluminação:** Utilize luz natural difusa (próximo a uma janela) para revelar a textura real do tecido sem sombras duras.\n- 🏷️ **Tags sugeridas:** #ModaInfantil, #ConfortoPremium, #EstiloKids, #TendenciaModa`
      });
    }
  } catch (error: any) {
    console.error("Gemini image suggestions error:", error);
    res.status(500).json({ error: error.message || "Erro ao analisar imagem" });
  }
});

// Service Worker for PWA requirements
app.get("/sw.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.send(`
    const CACHE_NAME = 'dutra-kids-pwa-v1';
    self.addEventListener('install', (event) => {
      self.skipWaiting();
    });
    self.addEventListener('activate', (event) => {
      event.waitUntil(clients.claim());
    });
    self.addEventListener('fetch', (event) => {
      // Basic fetch handler to satisfy PWA criteria
      event.respondWith(fetch(event.request));
    });
  `);
});

// Setup Vite Dev Server / Production Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Mounted Vite development middleware");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from", distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
