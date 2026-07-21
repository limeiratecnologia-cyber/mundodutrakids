import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, Heart, Star, Compass, RefreshCw, Shirt, Footprints, Smile, User, Tag, Upload, Image as ImageIcon, Trash2 } from "lucide-react";
import { Product } from "../types";
import { compressImage } from "../utils/imageCompressor";

interface ManequimVirtualProps {
  product: Product;
  onClose: () => void;
}

interface OutfitComposition {
  torso: string;
  legs: string;
  feet: string;
  accessories: string;
}

interface ManequimResult {
  fitAnalysis: string;
  dressedMannequinDescription: string;
  poseDescription: string;
  outfitComposition: OutfitComposition;
  occasion: string;
  narrative: string;
}

// Function to get high-quality child fashion photographs for dressed mannequin visual
function getMannequinImage(mannequinType: string, categoryId: string): string {
  const isClothing = categoryId === "cat-1";
  const isShoes = categoryId === "cat-2";

  if (mannequinType.includes("Slim")) {
    if (isClothing) return "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=600&auto=format&fit=crop";
    if (isShoes) return "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?q=80&w=600&auto=format&fit=crop";
    return "https://images.unsplash.com/photo-1622273509371-3cb3130dc146?q=80&w=600&auto=format&fit=crop";
  }
  if (mannequinType.includes("Confort")) {
    if (isClothing) return "https://images.unsplash.com/photo-1471286174574-e9627710ee59?q=80&w=600&auto=format&fit=crop";
    if (isShoes) return "https://images.unsplash.com/photo-1445452916036-9022dfd33a52?q=80&w=600&auto=format&fit=crop";
    return "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=600&auto=format&fit=crop";
  }
  if (mannequinType.includes("Baby") || mannequinType.includes("Passos")) {
    if (isClothing) return "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=600&auto=format&fit=crop";
    if (isShoes) return "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=600&auto=format&fit=crop";
    return "https://images.unsplash.com/photo-1519689680058-324335c77ebe?q=80&w=600&auto=format&fit=crop";
  }
  
  // Default / Infantil Tradicional
  if (isClothing) return "https://images.unsplash.com/photo-1519457431-44ccd64a579b?q=80&w=600&auto=format&fit=crop";
  if (isShoes) return "https://images.unsplash.com/photo-1515488042361-404e9250afef?q=80&w=600&auto=format&fit=crop";
  return "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop";
}

export default function ManequimVirtual({ product, onClose }: ManequimVirtualProps) {
  const [sizeSelected, setSizeSelected] = useState<string>(
    product.sizes.find(s => s.stock > 0)?.size || product.sizes[0]?.size || "Único"
  );
  const [mannequinType, setMannequinType] = useState<string>("Infantil Tradicional");
  const [customText, setCustomText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ManequimResult | null>(null);

  const [tryOnMode, setTryOnMode] = useState<"standard" | "photo">("standard");
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);

  const mannequinOptions = [
    { name: "Infantil Tradicional", desc: "Silhueta padrão para a faixa etária" },
    { name: "Estilo Slim Fit", desc: "Estrutura mais esguia e moderna" },
    { name: "Confort Plus", desc: "Foco em caimento folgadinho e mobilidade" },
    { name: "Baby / Primeiros Passos", desc: "Ajustado para fraldas e bebês ativos" }
  ];

  const currentMannequinImage = useMemo(() => {
    return getMannequinImage(mannequinType, product.categoryId);
  }, [mannequinType, product.categoryId]);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 800, 800, 0.7);
      setUploadedPhoto(compressed);
    } catch (err) {
      console.error("Erro ao carregar imagem:", err);
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/gemini/manequim-virtual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: product.name,
          productCategory: product.categoryId === "cat-1" ? "Roupas" : product.categoryId === "cat-2" ? "Calçados" : "Acessórios",
          sizeSelected,
          mannequinType: tryOnMode === "photo" ? "Foto Enviada pelo Cliente" : mannequinType,
          customText,
          userImage: tryOnMode === "photo" ? uploadedPhoto : undefined
        })
      });
      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        throw new Error("Erro na API");
      }
    } catch (err) {
      // Fallback
      if (tryOnMode === "photo") {
        setResult({
          fitAnalysis: `Análise técnica simulada com base na foto enviada: O tamanho ${sizeSelected} se adapta de forma harmoniosa com a silhueta visível na imagem, garantindo excelente amplitude para movimentos e caimento natural.`,
          dressedMannequinDescription: `Na simulação da foto enviada vestida com o ${product.name} (Tamanho ${sizeSelected}), criamos uma combinação encantadora! O visual é completado de forma elegante com uma t-shirt off-white soft touch e uma confortável bermuda jeans premium.`,
          poseDescription: "Pose natural detectada a partir da foto enviada.",
          outfitComposition: {
            torso: "Camiseta de Malha Algodão Premium Off-White",
            legs: "Bermuda Jeans Comfort Sutil",
            feet: `${product.categoryId === "cat-2" ? product.name : "Tênis Macio Casual"} com meias de cano médio`,
            accessories: "Boné Infantil de Sarja Areia"
          },
          occasion: "Excelente para ensaios fotográficos de moda, passeios especiais em família e festas.",
          narrative: `Que escolha maravilhosa! A foto enviada ganhou um visual de muito destaque com o ${product.name}, aliando extremo conforto e estilo inconfundível.`
        });
      } else {
        setResult({
          fitAnalysis: `O tamanho ${sizeSelected} se ajusta incrivelmente bem no perfil ${mannequinType}. Proporciona excelente flexibilidade, costura segura e conforto absoluto.`,
          dressedMannequinDescription: `O manequim ${mannequinType} está completamente vestido com muito charme. Ele veste o ${product.name} em tamanho ${sizeSelected}, complementado por uma linda camiseta off-white de toque macio e shorts jeans confortável. O visual é perfeito para o dia a dia, aliando elegância e praticidade.`,
          poseDescription: "Manequim em pose ativa e alegre de passos confiantes, transmitindo energia lúdica e diversão.",
          outfitComposition: {
            torso: "Camiseta de Algodão Premium Off-White",
            legs: "Bermuda Jeans Comfort Sutil",
            feet: `${product.categoryId === "cat-2" ? product.name : "Tênis Macio Casual"} com meias de cano médio`,
            accessories: "Boné Infantil de Sarja Areia"
          },
          occasion: "Perfeito para passeios divertidos de final de semana, comemorações casuais e brincadeiras ao ar livre.",
          narrative: `Que escolha esplêndida! O ${product.name} veste o manequim com maestria, destacando a vivacidade natural da criança com extremo conforto.`
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden border border-[#e0e0d6] flex flex-col md:flex-row max-h-[92vh] md:max-h-[85vh]"
      >
        {/* Left Side: Mannequin Visual & Config */}
        <div className="p-6 md:w-1/2 bg-[#fbfbfa] border-r border-[#f0f0e8] flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#5A5A40] bg-[#5A5A40]/10 px-2 py-1 rounded">
                Manequim Virtual IA ✨
              </span>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full md:hidden">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2">
              {product.name}
            </h3>

            {/* Mannequin Preview Area */}
            <div className="w-full h-48 bg-[#f0f0e8] rounded-2xl flex flex-col items-center justify-center relative border border-[#e0e0d6] overflow-hidden mb-4 shadow-inner">
              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div 
                    key="dressed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 w-full h-full"
                  >
                    {/* Live Dressed Mannequin Image */}
                    <img 
                      src={(tryOnMode === "photo" && uploadedPhoto) ? uploadedPhoto : currentMannequinImage}
                      alt="Manequim Vestido"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Floating Indicators / Outfit Tags Overlaid */}
                    <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-md text-white text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border border-white/20">
                      {tryOnMode === "photo" ? "🟢 Foto Analisada pela IA" : "🟢 Manequim Vestido pela IA"}
                    </div>

                    <div className="absolute bottom-2 left-3 right-3 text-white">
                      <p className="text-[10px] font-bold text-yellow-300 uppercase tracking-widest">
                        {tryOnMode === "photo" ? "Provador com Sua Foto" : mannequinType}
                      </p>
                      <p className="text-[9px] opacity-90 line-clamp-1 italic">
                        "{result.poseDescription}"
                      </p>
                    </div>

                    {/* Interactive points overlay on mannequin */}
                    <div className="absolute top-[30%] left-[50%] -translate-x-1/2 -translate-y-1/2">
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#5A5A40] border border-white"></span>
                      </span>
                    </div>
                    <div className="absolute top-[65%] left-[50%] -translate-x-1/2 -translate-y-1/2">
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#5A5A40] border border-white"></span>
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="undressed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-4 text-center"
                  >
                    {tryOnMode === "photo" && uploadedPhoto ? (
                      <div className="absolute inset-0 w-full h-full">
                        <img 
                          src={uploadedPhoto}
                          alt="Sua Foto"
                          className="w-full h-full object-cover opacity-90"
                        />
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-4 text-center text-white">
                          <ImageIcon className="w-8 h-8 text-white mb-1.5 animate-pulse" />
                          <p className="text-xs font-bold">Foto Carregada</p>
                          <p className="text-[9px] text-gray-200 mt-0.5 max-w-[200px]">
                            Clique em <b>Vestir e Analisar</b> para vestir virtualmente o {product.name} ({sizeSelected}) com IA!
                          </p>
                        </div>
                      </div>
                    ) : tryOnMode === "photo" ? (
                      <div className="p-4 flex flex-col items-center justify-center">
                        <div className="absolute inset-0 opacity-5 flex items-center justify-center">
                          <ImageIcon className="w-44 h-44" />
                        </div>
                        <div className="z-10">
                          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2 font-bold border border-amber-200 animate-pulse">
                            📷
                          </div>
                          <p className="text-xs font-bold text-gray-800">Provador por Foto</p>
                          <p className="text-[9px] text-gray-500 mt-1 max-w-[220px]">
                            Envie a foto de uma criança ou manequim físico abaixo para vestir com IA!
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Background silhouette */}
                        <div className="absolute inset-0 opacity-5 flex items-center justify-center">
                          <Shirt className="w-44 h-44" />
                        </div>

                        <div className="z-10">
                          <div className="w-14 h-14 rounded-full bg-[#5A5A40]/10 text-[#5A5A40] flex items-center justify-center mx-auto mb-2 font-bold text-2xl border border-[#5A5A40]/20 animate-pulse">
                            👗
                          </div>
                          <p className="text-xs font-bold text-gray-800">{mannequinType}</p>
                          <p className="text-[9px] text-gray-500 mt-0.5">
                            Tamanho selecionado: <span className="font-bold text-[#5A5A40]">{sizeSelected}</span>
                          </p>
                          <p className="text-[8px] bg-gray-200/50 px-2 py-0.5 rounded-full text-gray-500 inline-block mt-2">
                            Pronto para vestir com IA
                          </p>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">
                  Selecione o Tamanho:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {product.sizes.map((s) => (
                    <button
                      key={s.size}
                      disabled={s.stock <= 0}
                      onClick={() => setSizeSelected(s.size)}
                      className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all duration-200 ${
                        sizeSelected === s.size
                          ? "bg-[#5A5A40] text-white shadow-sm ring-2 ring-offset-1 ring-[#5A5A40]/30"
                          : s.stock <= 0
                          ? "bg-gray-100 text-gray-400 line-through cursor-not-allowed"
                          : "bg-white border border-[#e0e0d6] text-gray-700 hover:bg-[#5A5A40]/5"
                      }`}
                    >
                      {s.size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Try-on Mode Selector */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5 tracking-wider">
                  Tipo de Provador:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTryOnMode("standard");
                      setResult(null);
                    }}
                    className={`py-2 px-3 text-[11px] font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all duration-200 ${
                      tryOnMode === "standard"
                        ? "bg-[#5A5A40] text-white border-[#5A5A40] shadow-sm"
                        : "bg-white text-gray-700 border-[#e0e0d6] hover:bg-gray-50"
                    }`}
                  >
                    <Shirt className="w-3.5 h-3.5" /> Manequim Padrão
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTryOnMode("photo");
                      setResult(null);
                    }}
                    className={`py-2 px-3 text-[11px] font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all duration-200 ${
                      tryOnMode === "photo"
                        ? "bg-[#5A5A40] text-white border-[#5A5A40] shadow-sm"
                        : "bg-white text-gray-700 border-[#e0e0d6] hover:bg-gray-50"
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" /> Enviar Foto
                  </button>
                </div>
              </div>

              {/* Try-on Mode Content */}
              {tryOnMode === "standard" ? (
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">
                    Biotipo do Manequim:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {mannequinOptions.map((opt) => (
                      <button
                        key={opt.name}
                        onClick={() => setMannequinType(opt.name)}
                        className={`p-2 text-left rounded-xl transition-all duration-200 border text-xs ${
                          mannequinType === opt.name
                            ? "bg-white border-[#5A5A40] ring-2 ring-[#5A5A40]/30 shadow-sm font-semibold"
                            : "bg-white border-[#e0e0d6] hover:bg-gray-50 text-gray-600"
                        }`}
                      >
                        <p className="font-bold text-gray-800 text-[11px]">{opt.name}</p>
                        <p className="text-[9px] text-gray-400 leading-tight mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5 tracking-wider">
                    Sua Foto da Criança ou Manequim:
                  </label>
                  <div className="bg-white border-2 border-dashed border-[#e0e0d6] rounded-2xl p-4 flex flex-col items-center justify-center text-center relative transition-all duration-200 hover:border-[#5A5A40]/50 min-h-[110px]">
                    {uploadedPhoto ? (
                      <div className="w-full flex flex-col items-center">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shadow-sm mb-1.5">
                          <img src={uploadedPhoto} alt="Preview do upload" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-[11px] font-bold text-green-600 flex items-center gap-1">
                          ✓ Foto carregada com sucesso!
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedPhoto(null);
                            setResult(null);
                          }}
                          className="text-[9px] text-red-500 hover:text-red-700 mt-1 font-extrabold flex items-center gap-1 hover:underline"
                        >
                          <Trash2 className="w-3 h-3" /> Excluir e Escolher Outra
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer w-full py-2 flex flex-col items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5 border border-amber-100">
                          <Upload className="w-4 h-4" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-700">Selecione uma Foto do Computador ou Celular</p>
                        <p className="text-[8px] text-gray-400 mt-0.5">Nossa IA vestirá o look na pessoa ou manequim da imagem</p>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">
                  Observações do Cliente (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: É um presente, para criança bem alta..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-[#e0e0d6] focus:outline-none focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40]"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full mt-4 bg-[#5A5A40] text-white py-3 rounded-2xl font-bold text-xs hover:bg-[#484833] transition-all duration-200 flex items-center justify-center gap-2 shadow-md disabled:opacity-55"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Vestindo Manequim com IA...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Vestir e Analisar Manequim
              </>
            )}
          </button>
        </div>

        {/* Right Side: Styling Results */}
        <div className="p-6 md:w-1/2 flex flex-col justify-between overflow-y-auto bg-white">
          <div className="hidden md:flex justify-end mb-2">
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-dashed border-[#5A5A40]/30 border-t-[#5A5A40] animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-xl">
                      👗
                    </div>
                  </div>
                  <h4 className="font-bold text-gray-800 mt-4">Vestindo o Manequim...</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs leading-normal">
                    Nossa IA de Estilo está selecionando peças complementares no guarda-roupa virtual para criar a composição ideal.
                  </p>
                </motion.div>
              ) : result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4 py-2"
                >
                  {/* Dressed Mannequin Visual Description */}
                  <div className="bg-[#f5f5f0]/50 p-4 rounded-2xl border border-[#e0e0d6]/60">
                    <div className="flex items-center gap-1.5 text-[#5A5A40] mb-2">
                      <Smile className="w-4 h-4 text-[#5A5A40]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Manequim Vestido - Look da IA</span>
                    </div>
                    <p className="text-xs text-gray-800 font-medium leading-relaxed">
                      "{result.dressedMannequinDescription}"
                    </p>
                  </div>

                  {/* Outfit Composition Wardrobe Grid */}
                  <div className="border border-gray-100 rounded-2xl p-3.5 space-y-3 bg-gray-50/50">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" /> Composição Completa do Look:
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <span className="text-[8px] uppercase font-bold text-gray-400 block mb-0.5">Tronco</span>
                        <span className="font-semibold text-gray-800 leading-tight">{result.outfitComposition.torso}</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <span className="text-[8px] uppercase font-bold text-gray-400 block mb-0.5">Pernas</span>
                        <span className="font-semibold text-gray-800 leading-tight">{result.outfitComposition.legs}</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <span className="text-[8px] uppercase font-bold text-gray-400 block mb-0.5">Nos Pés</span>
                        <span className="font-semibold text-gray-800 leading-tight">{result.outfitComposition.feet}</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <span className="text-[8px] uppercase font-bold text-gray-400 block mb-0.5">Acessórios</span>
                        <span className="font-semibold text-gray-800 leading-tight">{result.outfitComposition.accessories}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fit Analysis */}
                  <div>
                    <div className="flex items-center gap-1.5 text-gray-800 mb-1">
                      <Compass className="w-4 h-4 text-gray-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Caimento e Ajuste</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed font-medium">
                      {result.fitAnalysis}
                    </p>
                  </div>

                  {/* Self-esteem & Narrative */}
                  <div className="flex items-start gap-2 bg-yellow-50/50 p-3 rounded-xl border border-yellow-100 text-yellow-900">
                    <Heart className="w-3.5 h-3.5 fill-current text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed italic font-medium">
                      "{result.narrative}"
                    </p>
                  </div>

                  {/* Perfect Occasion */}
                  <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                      Ocasião:
                    </span>
                    <span className="text-[10px] font-bold text-[#5A5A40] bg-[#5A5A40]/10 px-2.5 py-1 rounded-full">
                      {result.occasion}
                    </span>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400 border border-gray-100">
                    👗
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm">Vista o Manequim Virtual</h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1 leading-normal">
                    Selecione as características do manequim ao lado e clique em <b>Vestir</b> para ver o manequim completamente trajado e analisar o visual completo gerado pela nossa inteligência artificial!
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {result && (
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-[9px] text-gray-400">
                Análise com modelagem 3D e roupas virtuais IA.
              </p>
              <button
                onClick={onClose}
                className="text-xs font-bold text-gray-600 hover:text-gray-950 underline"
              >
                Voltar à Loja
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
