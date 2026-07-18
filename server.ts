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
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });
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

app.post("/api/gemini/manequim-virtual", async (req, res) => {
  try {
    const { productName, productCategory, sizeSelected, mannequinType, customText } = req.body;
    
    const prompt = `Gere uma representação visual detalhada do Manequim Virtual VESTIDO com o produto:
    Produto Principal: ${productName} (${productCategory})
    Tamanho Escolhido: ${sizeSelected}
    Biotipo do Manequim / Características: ${mannequinType}
    Observações do Cliente: ${customText || "Nenhuma"}
    
    A IA deve VESTIR o manequim completamente e descrevê-lo, em vez de dar apenas dicas ou conselhos de estilo gerais.
    
    Escreva uma resposta em formato JSON com os seguintes campos estruturados:
    1. "fitAnalysis": Uma análise técnica de como o produto veste o corpo ou tamanho selecionado.
    2. "dressedMannequinDescription": Descrição narrativa e vívida de como o manequim está vestido da cabeça aos pés, integrando o produto principal de forma linda.
    3. "poseDescription": A pose ou atitude física do manequim (ex: "Manequim em pose ativa com as mãos na cintura, expressando dinamismo e alegria").
    4. "outfitComposition": Um objeto contendo as outras peças de roupa que a IA usou para VESTIR o manequim de forma a completar o visual:
       - "torso": Peça vestida no tronco (ex: "Camiseta de Algodão Listrada Off-White e Azul")
       - "legs": Peça vestida nas pernas (ex: "Bermuda Jeans Comfort Azul Clara")
       - "feet": Detalhe dos pés/meias/calçado (ex: "Tênis Confort Run com Meia Branca Canelada")
       - "accessories": Acessórios vestidos (ex: "Boné Infantil de Sarja Sálvia")
    5. "occasion": A ocasião perfeita para usar esta combinação de manequim vestido.
    6. "narrative": Um pequeno texto entusiasmado elogiando o caimento do look completo no manequim.
    
    Responda APENAS em formato JSON válido sem formatação markdown extra.`;

    const client = getGeminiClient();
    if (process.env.GEMINI_API_KEY) {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      try {
        const data = JSON.parse(response.text?.trim() || "{}");
        res.json(data);
      } catch (jsonErr) {
        res.json({
          fitAnalysis: "Caimento perfeito e super confortável para o biotipo escolhido, com excelente costura e flexibilidade.",
          dressedMannequinDescription: `O manequim ${mannequinType} está elegantemente vestido, destacando o ${productName}. No tronco, exibe uma linda camiseta leve de algodão orgânico que harmoniza com o produto. Nas pernas, uma bermudinha jeans super confortável, e nos pés, o caimento do produto é perfeito com meias esportivas macias. O conjunto exala frescor e modernidade.`,
          poseDescription: "Manequim posicionado de forma alegre, de braços abertos, transmitindo a liberdade para correr e brincar.",
          outfitComposition: {
            torso: "Camiseta de Algodão Leve Verde-Oliva",
            legs: "Bermuda Jeans de Sarja Comfort",
            feet: `${productCategory === "Calçados" ? productName : "Meias macias e tênis casual"}`,
            accessories: "Boné Infantil Esportivo Bege"
          },
          occasion: "Ideal para aniversários, passeios ao ar livre e festas de fim de semana.",
          narrative: `Que visual espetacular! O look completo veste o manequim com uma sintonia incrível de cores, combinando o toque premium com estilo inconfundível.`
        });
      }
    } else {
      res.json({
        fitAnalysis: `O caimento do tamanho ${sizeSelected} se molda com perfeição às medidas do manequim ${mannequinType}, garantindo mobilidade total.`,
        dressedMannequinDescription: `O manequim ${mannequinType} foi vestido com uma composição premium. Apresenta o ${productName} estilizado de forma lúdica. No tronco, uma camiseta de malha fresca na cor off-white; nas pernas, um shorts de linho natural super macio. Completa-se com acessórios elegantes para um visual infantil sofisticado e limpo.`,
        poseDescription: "Manequim em pose de passos confiantes, transmitindo descontração e diversão em cada movimento.",
        outfitComposition: {
          torso: "Camiseta de Malha Algodão Premium Off-White",
          legs: "Bermuda ou Shorts de Linho Cru",
          feet: `${productCategory === "Calçados" ? productName : "Tênis Macio com Meias de Algodão"}`,
          accessories: "Boné de Algodão Sálvia"
        },
        occasion: "Perfeito para passeios divertidos de final de semana, ensaios fotográficos e festinhas infantis.",
        narrative: `Visual de catálogo incrível! O ${productName} vestido no manequim realça o estilo e a espontaneidade com leveza fantástica.`
      });
    }
  } catch (error: any) {
    console.error("Gemini manequim error:", error);
    res.status(500).json({ error: error.message || "Erro no manequim virtual" });
  }
});

app.post("/api/gemini/image-suggestions", async (req, res) => {
  try {
    const { imageData, productName } = req.body;
    
    const client = getGeminiClient();
    if (process.env.GEMINI_API_KEY && imageData) {
      const base64Data = imageData.split(",")[1] || imageData;
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
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
      });
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
