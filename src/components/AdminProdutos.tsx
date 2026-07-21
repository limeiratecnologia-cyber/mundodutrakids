import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { 
  Plus, Edit, Trash2, Camera, Sparkles, RefreshCw, 
  Tag, ListPlus, ToggleLeft, ToggleRight, Check, AlertCircle, X 
} from "lucide-react";
import { Product, Category } from "../types";
import { compressImage } from "../utils/imageCompressor";

interface AdminProdutosProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (newProduct: Product) => void;
  onEditProduct: (updatedProduct: Product) => void;
  onDeleteProduct: (id: string) => void;
}

export default function AdminProdutos({ products, categories, onAddProduct, onEditProduct, onDeleteProduct }: AdminProdutosProps) {
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const triggerNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Form Fields
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [image, setImage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [age, setAge] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"ativo" | "inativo">("ativo");
  
  const PALETTE_COLORS = [
    { name: "Rosa Bebê", hex: "#FFC8D6" },
    { name: "Azul Bebê", hex: "#C2E0F9" },
    { name: "Branco", hex: "#FFFFFF" },
    { name: "Preto", hex: "#2B2B2B" },
    { name: "Bege", hex: "#F4EAD4" },
    { name: "Amarelo Claro", hex: "#FFF3B3" },
    { name: "Verde Claro", hex: "#D0ECC5" },
    { name: "Lilás", hex: "#E2D5F3" },
    { name: "Laranja Suave", hex: "#FFD8BE" },
    { name: "Vermelho", hex: "#E25C5C" },
    { name: "Azul Marinho", hex: "#2E4A62" },
    { name: "Cinza", hex: "#D3D3D3" },
  ];

  // Dynamic size grid stock
  const [sizeGrid, setSizeGrid] = useState<{ size: string; stock: number; color?: string; colorHex?: string; }[]>([
    { size: "P", stock: 5 },
    { size: "M", stock: 8 },
    { size: "G", stock: 4 }
  ]);
  const [newSizeName, setNewSizeName] = useState("");
  const [newSizeStock, setNewSizeStock] = useState<number>(5);
  const [newSizeColorName, setNewSizeColorName] = useState("");
  const [newSizeColorHex, setNewSizeColorHex] = useState("");

  // AI helper trigger states
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [aiImageFeedback, setAiImageFeedback] = useState("");
  const [analyzingImage, setAnalyzingImage] = useState(false);

  // Sequence code generator helper
  const nextSequentialCode = useMemo(() => {
    if (products.length === 0) return "P0001";
    // Extract numerical suffix
    const codes = products
      .map(p => {
        const num = parseInt(p.code.replace(/\D/g, ""), 10);
        return isNaN(num) ? 0 : num;
      })
      .filter(num => num > 0);
    const max = codes.length > 0 ? Math.max(...codes) : 0;
    const nextNum = max + 1;
    return `P${nextNum.toString().padStart(4, "0")}`;
  }, [products]);

  // Base64 file converter for main image (with compression)
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedB64 = await compressImage(file, 600, 600, 0.7);
        setImage(compressedB64);
        if (!images.includes(compressedB64)) {
          setImages(prev => [...prev, compressedB64]);
        }
        triggerAiImageAnalysis(compressedB64);
      } catch (err) {
        console.error("Error compressing image:", err);
        triggerNotification("Erro ao processar imagem.", "error");
      }
    }
  };

  // Base64 file converter for multiple images (with compression)
  const handleMultipleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files);
      const loadedImages: string[] = [];
      let count = 0;
      
      for (const file of fileList) {
        try {
          const compressedB64 = await compressImage(file as File, 600, 600, 0.7);
          loadedImages.push(compressedB64);
        } catch (err) {
          console.error("Error compressing image in batch:", err);
        }
        count++;
        if (count === fileList.length) {
          if (loadedImages.length > 0) {
            setImages(prev => {
              const updated = [...prev, ...loadedImages];
              if (updated.length > 0 && !image) {
                setImage(updated[0]);
              }
              return updated;
            });
            triggerAiImageAnalysis(loadedImages[0]);
            triggerNotification(`${loadedImages.length} fotos compactadas e carregadas! 📸`);
          } else {
            triggerNotification("Erro ao processar fotos.", "error");
          }
        }
      }
    }
  };
  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    if (index === 0 && updated.length > 0) {
      setImage(updated[0]);
    } else if (updated.length === 0) {
      setImage("");
    }
  };

  const handleSetMainImage = (index: number) => {
    const updated = [...images];
    const selected = updated.splice(index, 1)[0];
    updated.unshift(selected);
    setImages(updated);
    setImage(selected);
    triggerNotification("Definida como imagem principal!");
  };

  // Trigger Gemini photo analytics (image-suggestions API)
  const triggerAiImageAnalysis = async (base64Image: string) => {
    setAnalyzingImage(true);
    setAiImageFeedback("");
    try {
      const response = await fetch("/api/gemini/image-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageData: base64Image,
          productName: name || "Produto Novo"
        })
      });
      if (response.ok) {
        const data = await response.json();
        setAiImageFeedback(data.suggestion);
      }
    } catch (e) {
      setAiImageFeedback("💡 Dica IA: Ilumine mais a foto e use fundo neutro suave para realçar a peça!");
    } finally {
      setAnalyzingImage(false);
    }
  };

  // Generate perfect descriptions using server side Gemini
  const triggerAiDescriptionGenerator = async () => {
    if (!name.trim()) {
      alert("Por favor, preencha o Nome do produto primeiro para guiar a IA.");
      return;
    }
    setGeneratingDescription(true);
    try {
      const sizesText = sizeGrid.map(g => `${g.size} (Estoque: ${g.stock})`).join(", ");
      const response = await fetch("/api/gemini/describe-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category: categories.find(c => c.id === categoryId)?.name || "Geral",
          sizeGrid: sizesText,
          price,
          extraInfo: age
        })
      });
      if (response.ok) {
        const data = await response.json();
        setDescription(data.description);
      } else {
        throw new Error("Erro");
      }
    } catch (err) {
      setDescription(`✨ Vestuário Premium ${name}. Caimento impecável, toque de algodão extra macio e design clássico para os pequenos brincarem com plena liberdade.`);
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleOpenAddForm = () => {
    setEditingProduct(null);
    setName("");
    setPrice(0);
    setCost(0);
    setImage("https://images.unsplash.com/photo-1519457431-44ccd64a579b?q=80&w=400");
    setImages(["https://images.unsplash.com/photo-1519457431-44ccd64a579b?q=80&w=400"]);
    setCategoryId(categories[0]?.id || "");
    setAge("Livre / Todos");
    setDescription("");
    setStatus("ativo");
    setSizeGrid([
      { size: "P", stock: 5 },
      { size: "M", stock: 8 },
      { size: "G", stock: 4 }
    ]);
    setNewSizeColorName("");
    setNewSizeColorHex("");
    setAiImageFeedback("");
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setPrice(prod.price);
    setCost(prod.cost);
    setImage(prod.image);
    setImages(prod.images && prod.images.length > 0 ? prod.images : [prod.image]);
    setCategoryId(prod.categoryId);
    setAge(prod.age);
    setDescription(prod.description);
    setStatus(prod.status);
    setSizeGrid(prod.sizes || []);
    setNewSizeColorName("");
    setNewSizeColorHex("");
    setAiImageFeedback("");
    setIsFormOpen(true);
  };

  const handleAddSizeOption = () => {
    if (!newSizeName.trim()) return;
    const sizeUpper = newSizeName.trim().toUpperCase();
    const colorUpper = newSizeColorName.trim().toUpperCase();
    if (sizeGrid.some(s => s.size.toUpperCase() === sizeUpper && (s.color || "").toUpperCase() === colorUpper)) {
      triggerNotification("Essa variação de tamanho e cor já está adicionada.", "error");
      return;
    }
    setSizeGrid([
      ...sizeGrid, 
      { 
        size: newSizeName.trim(), 
        stock: newSizeStock,
        color: newSizeColorName.trim() || undefined,
        colorHex: newSizeColorHex || undefined
      }
    ]);
    setNewSizeName("");
    setNewSizeStock(5);
    setNewSizeColorName("");
    setNewSizeColorHex("");
  };

  const handleRemoveSizeOption = (idx: number) => {
    const updated = [...sizeGrid];
    updated.splice(idx, 1);
    setSizeGrid(updated);
  };

  const handleUpdateSizeStock = (idx: number, stock: number) => {
    const updated = [...sizeGrid];
    updated[idx].stock = Math.max(0, stock);
    setSizeGrid(updated);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      triggerNotification("Por favor, digite o nome do produto.", "error");
      return;
    }

    const finalImage = image || (images.length > 0 ? images[0] : "");
    const finalImages = images.length > 0 ? images : (finalImage ? [finalImage] : []);

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        name,
        price,
        cost,
        image: finalImage,
        images: finalImages,
        categoryId,
        age,
        description,
        status,
        sizes: sizeGrid
      };
      onEditProduct(updated);
      triggerNotification("Produto atualizado com sucesso!");
    } else {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        code: nextSequentialCode, // Auto sequential sequence
        name,
        price,
        cost,
        image: finalImage,
        images: finalImages,
        categoryId,
        age,
        description,
        status,
        createdAt: new Date().toISOString(),
        sizes: sizeGrid
      };
      onAddProduct(newProduct);
      triggerNotification(`Produto cadastrado e gerado o código sequencial ${nextSequentialCode}!`);
    }

    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`p-4 rounded-xl text-xs font-bold border transition-all ${
          notification.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
            : "bg-red-50 text-red-800 border-red-200"
        }`}>
          {notification.message}
        </div>
      )}
      
      {/* Header controls */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#e0e0d6] shadow-sm">
        <div>
          <h3 className="font-extrabold text-gray-900 text-sm">Controle de Catálogo de Produtos</h3>
          <p className="text-xs text-gray-500">Cadastre grades, preços, configure estoque e edite com IA.</p>
        </div>
        <button
          onClick={handleOpenAddForm}
          className="bg-[#5A5A40] hover:bg-[#484833] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Cadastrar Novo Produto
        </button>
      </div>

      {/* Form Dialog/Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-[#e0e0d6] max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-[#f0f0e8] pb-3.5 mb-4">
              <h4 className="font-bold text-gray-900 text-sm">
                {editingProduct ? `Editar Produto: ${editingProduct.code}` : "Cadastrar Novo Produto"}
              </h4>
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)} 
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-bold"
              >
                <X className="w-4 h-4" /> Fechar
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Left Inputs */}
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Nome do Produto *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Camiseta Polo Kids Verde"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none focus:border-[#5A5A40]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Preço de Venda (R$) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={price}
                        onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-xs bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Custo de Compra (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={cost}
                        onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-xs bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Categoria *</label>
                      <select
                        value={categoryId}
                        required
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none"
                      >
                        <option value="">Selecione...</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Faixa de Idade/Recomendação</label>
                      <input
                        type="text"
                        placeholder="Ex: 2 a 4 anos"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Status de Visibilidade</label>
                    <div className="flex gap-4 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                      <span className="text-xs text-gray-600 font-medium">Exibir Produto na Loja?</span>
                      <button
                        type="button"
                        onClick={() => setStatus(status === "ativo" ? "inativo" : "ativo")}
                        className="ml-auto"
                      >
                        {status === "ativo" ? (
                          <ToggleRight className="w-9 h-9 text-[#5A5A40]" />
                        ) : (
                          <ToggleLeft className="w-9 h-9 text-gray-300" />
                        )}
                      </button>
                    </div>
                  </div>
                      {/* Right Inputs: Photo and AI Assistant */}
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Fotos do Produto (Várias Imagens)</label>
                    
                    {/* Multi-upload Button */}
                    <div className="bg-gray-50 p-3 rounded-2xl border border-[#e0e0d6] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 font-medium">Selecione uma ou mais fotos de uma vez</span>
                        <label className="cursor-pointer bg-[#5A5A40] hover:bg-[#5A5A40]/90 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl inline-block transition shadow-sm">
                          <Plus className="w-3 h-3 inline mr-1" /> Adicionar Fotos
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleMultipleImagesChange}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Displaying Image Grid */}
                      {images.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2 pt-1">
                          {images.map((img, idx) => {
                            const isMain = img === image;
                            return (
                              <div key={idx} className="relative group aspect-square bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs flex items-center justify-center p-0.5">
                                <img src={img} className="max-w-full max-h-full object-contain" alt="" />
                                
                                {isMain && (
                                  <div className="absolute top-1 left-1 bg-green-500 text-white text-[7px] font-extrabold px-1 rounded-sm uppercase tracking-wider">
                                    Capa
                                  </div>
                                )}

                                {/* Hover controls */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-150 flex flex-col items-center justify-center gap-1 z-10">
                                  {!isMain && (
                                    <button
                                      type="button"
                                      onClick={() => handleSetMainImage(idx)}
                                      className="bg-white/90 hover:bg-white text-[8px] font-bold text-gray-800 px-1.5 py-0.5 rounded transition"
                                    >
                                      Capa
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(idx)}
                                    className="bg-red-600/90 hover:bg-red-600 text-white p-1 rounded-full transition"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-400 text-center py-2">Nenhuma foto adicionada ainda.</p>
                      )}

                      {/* URL main image fallback/direct input */}
                      <div className="pt-2 border-t border-gray-100">
                        <label className="block text-[8px] uppercase font-bold text-gray-400 mb-1">Ou digite a URL da Imagem Principal</label>
                        <input
                          type="text"
                          placeholder="Ex: https://imagens.com/roupa.jpg"
                          value={image}
                          onChange={(e) => {
                            setImage(e.target.value);
                            if (e.target.value && !images.includes(e.target.value)) {
                              setImages(prev => [e.target.value, ...prev]);
                            }
                          }}
                          className="w-full px-2.5 py-1 text-[10px] bg-white border border-gray-200 rounded-lg focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Gemini Vision suggestion response */}
                    {analyzingImage && (
                      <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" /> IA analisando qualidade da imagem...
                      </p>
                    )}
                    {aiImageFeedback && (
                      <div className="mt-1.5 bg-[#5A5A40]/5 p-2 rounded-lg border border-[#5A5A40]/15 text-[10px] text-gray-600 leading-relaxed">
                        {aiImageFeedback}
                      </div>
                    )}
                  </div>             </div>

                  {/* Size Options Grid Stock */}
                  <div className="space-y-2.5 bg-[#fbfbfa] p-3 rounded-2xl border border-[#e0e0d6]/70">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Grade de Tamanhos & Estoque:</span>
                    
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {sizeGrid.map((sz, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-gray-100 text-xs">
                          <div className="flex items-center gap-2">
                            {sz.colorHex && (
                              <span 
                                className="w-3.5 h-3.5 rounded-full border border-black/15 inline-block shadow-xs shrink-0" 
                                style={{ backgroundColor: sz.colorHex }}
                                title={sz.color}
                              />
                            )}
                            <span className="font-bold text-gray-700">{sz.size}</span>
                            {sz.color && (
                              <span className="text-[9px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                                {sz.color}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400">Estoque:</span>
                            <input
                              type="number"
                              value={sz.stock}
                              onChange={(e) => handleUpdateSizeStock(idx, parseInt(e.target.value, 10) || 0)}
                              className="w-12 text-center p-0.5 border border-gray-200 rounded text-xs font-mono font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveSizeOption(idx)}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition"
                              title="Remover tamanho"
                            >
                              <X className="w-3.5 h-3.5 font-bold" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Tam (Ex: G, 4 anos)"
                          value={newSizeName}
                          onChange={(e) => setNewSizeName(e.target.value)}
                          className="flex-1 px-2.5 py-1 text-[11px] bg-white border border-gray-200 rounded-lg focus:outline-none"
                        />
                        <input
                          type="number"
                          placeholder="Estoque"
                          value={newSizeStock}
                          onChange={(e) => setNewSizeStock(parseInt(e.target.value, 10) || 0)}
                          className="w-14 text-center px-1.5 py-1 text-[11px] bg-white border border-gray-200 rounded-lg focus:outline-none"
                        />
                      </div>

                      {/* Color Palette Selector */}
                      <div className="space-y-1 bg-white p-2 rounded-xl border border-gray-100/80">
                        <span className="block text-[9px] uppercase font-bold text-gray-400">Paleta de Cores da Peça (Opcional):</span>
                        <div className="flex flex-wrap gap-1.5 py-1">
                          {PALETTE_COLORS.map((col) => {
                            const isSelected = newSizeColorHex === col.hex;
                            return (
                              <button
                                key={col.hex}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setNewSizeColorHex("");
                                    setNewSizeColorName("");
                                  } else {
                                    setNewSizeColorHex(col.hex);
                                    setNewSizeColorName(col.name);
                                  }
                                }}
                                className="w-8.5 h-8.5 sm:w-6.5 sm:h-6.5 rounded-full border border-black/10 transition relative flex items-center justify-center hover:scale-110 active:scale-95 cursor-pointer shadow-3xs"
                                style={{ backgroundColor: col.hex }}
                                title={col.name}
                              >
                                {isSelected && (
                                  <Check className={`w-4.5 h-4.5 sm:w-3.5 sm:h-3.5 ${col.hex === "#FFFFFF" || col.hex === "#FFF3B3" ? "text-gray-800" : "text-white"} font-black`} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-1.5 pt-1">
                          <input
                            type="text"
                            placeholder="Nome da cor (Ex: Rosa Chiclete)"
                            value={newSizeColorName}
                            onChange={(e) => setNewSizeColorName(e.target.value)}
                            className="flex-1 px-2 py-0.5 text-[10px] bg-gray-50 border border-gray-200 rounded-md focus:outline-none"
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] text-gray-400 font-bold uppercase">Ou:</span>
                            <input
                              type="color"
                              value={newSizeColorHex || "#ffffff"}
                              onChange={(e) => {
                                setNewSizeColorHex(e.target.value);
                                if (!newSizeColorName) setNewSizeColorName("Cor Personalizada");
                              }}
                              className="w-6 h-5 p-0 border border-gray-200 rounded bg-white cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddSizeOption}
                        className="w-full bg-[#5A5A40] text-white text-[10px] py-1.5 rounded-lg font-bold hover:bg-[#484833] transition"
                      >
                        + Adicionar Variação de Tamanho/Cor
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Description & AI generation block */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] uppercase font-bold text-gray-500">Descrição do Produto (Para a Loja)</label>
                  <button
                    type="button"
                    onClick={triggerAiDescriptionGenerator}
                    disabled={generatingDescription}
                    className="text-[10px] font-bold text-[#5A5A40] hover:text-[#484833] flex items-center gap-1 bg-[#5A5A40]/10 px-2 py-1 rounded transition disabled:opacity-50"
                  >
                    {generatingDescription ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" /> Escrevendo...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" /> Gerar Descrição com IA ✨
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  placeholder="Descreva detalhes como material, estilo, ocasiões de uso..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none focus:border-[#5A5A40] h-20 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-[#f0f0e8] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5A5A40] text-white rounded-xl text-xs font-bold hover:bg-[#484833] transition"
                >
                  ✓ Salvar Alterações
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Products Grid list */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {products.map((prod) => {
          const totalStock = prod.sizes.reduce((s, x) => s + x.stock, 0);
          const isInactive = prod.status === "inativo";

          return (
            <div
              key={prod.id}
              className={`rounded-2xl border transition shadow-sm overflow-hidden flex flex-col justify-between ${
                isInactive 
                  ? "bg-[#ffebeb] border-red-200 opacity-80" 
                  : "bg-white border-[#e0e0d6]"
              }`}
            >
              {/* Product top image area */}
              <div className="aspect-[16/11] relative bg-[#f9f9f5] flex items-center justify-center p-2">
                <img src={prod.image} className="max-w-full max-h-full object-contain" alt="" />
                
                {/* Code sequential badge */}
                <span className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-mono px-2 py-0.5 rounded">
                  {prod.code}
                </span>

                {/* Status tag */}
                {isInactive ? (
                  <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded shadow">
                    INATIVO
                  </span>
                ) : (
                  <span className="absolute top-2 right-2 bg-green-600 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow">
                    ATIVO
                  </span>
                )}
              </div>

              {/* Product Details body */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className={`font-extrabold text-sm text-gray-900 ${isInactive ? "line-through text-red-700" : ""}`}>
                    {prod.name}
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Categoria: {categories.find(c => c.id === prod.categoryId)?.name || "Geral"}
                  </p>
                </div>

                {/* Size Stock grid preview */}
                <div className="space-y-1">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Tamanhos e Estoque:</p>
                  <div className="flex flex-wrap gap-1">
                    {prod.sizes.map((sz, i) => (
                      <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${sz.stock === 0 ? "bg-red-100 text-red-500" : "bg-gray-100 text-gray-600"}`}>
                        {sz.size}: {sz.stock}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pricing info */}
                <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-baseline">
                    <div className="text-left">
                      <span className="text-[9px] text-gray-400 block">Custo: R$ {prod.cost.toFixed(2)}</span>
                      <span className="text-xs font-bold text-gray-800">Preço: R$ {prod.price.toFixed(2)}</span>
                    </div>
                    
                    {deleteConfirmId !== prod.id && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleOpenEditForm(prod)}
                          className="p-1 text-[#5A5A40] hover:bg-[#5A5A40]/10 rounded transition"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(prod.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                          title="Deletar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {deleteConfirmId === prod.id && (
                    <div className="flex items-center gap-3 bg-red-50 p-2.5 rounded-xl border border-red-200 justify-between mt-2 shadow-xs">
                      <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">Excluir produto?</span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteProduct(prod.id);
                            setDeleteConfirmId(null);
                            triggerNotification(`Produto ${prod.name} excluído.`);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-[11px] font-bold transition active:scale-95 shadow-2xs cursor-pointer min-h-[36px] min-w-[54px] flex items-center justify-center"
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-[11px] font-bold transition active:scale-95 cursor-pointer min-h-[36px] min-w-[54px] flex items-center justify-center"
                        >
                          Não
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
