import React, { useState } from "react";
import { 
  Truck, Tag, AlertOctagon, Printer, LayoutTemplate, 
  Plus, Trash2, Edit, Check, Settings, Eye, Camera, Lock, Smartphone, Upload
} from "lucide-react";
import { 
  SystemState, NeighborhoodShipping, Promotion, Aviso, 
  LandpageConfig, PrintingConfig 
} from "../types";
import { compressImage } from "../utils/imageCompressor";

interface AdminMinhaLojaProps {
  state: SystemState;
  onUpdateState: (newState: Partial<SystemState>) => void;
}

export default function AdminMinhaLoja({ state, onUpdateState }: AdminMinhaLojaProps) {
  // Use a local state to prevent real-time Firebase sync from interrupting edits
  const [localState, setLocalState] = React.useState<SystemState>(state);
  const [hasChanges, setHasChanges] = React.useState(false);

  React.useEffect(() => {
    if (!hasChanges) {
      setLocalState(state);
    }
  }, [state, hasChanges]);

  const updateLocalState = (newStateUpdates: Partial<SystemState>, isTyping = false) => {
    setLocalState((prev) => {
      const next = { ...prev, ...newStateUpdates };
      if (!isTyping) {
        onUpdateState(newStateUpdates);
        setHasChanges(false);
      } else {
        setHasChanges(true);
      }
      return next;
    });
  };

  const handleBlurSave = () => {
    if (hasChanges) {
      onUpdateState(localState);
      setHasChanges(false);
      triggerNotification("Alterações salvas automaticamente! ⚡", "success");
    }
  };

  const handleDiscardChanges = () => {
    setLocalState(state);
    setHasChanges(false);
    triggerNotification("Alterações de rascunho descartadas!");
  };

  const handleSaveChanges = () => {
    onUpdateState(localState);
    setHasChanges(false);
    triggerNotification("Todas as configurações foram salvas com sucesso! 🎉", "success");
  };

  const { 
    shippingNeighborhoods, shippingType, shippingFixedCost, 
    promotions, avisos, landpage, printing, pwa, adminPasscode 
  } = localState;

  const [activeSubTab, setActiveSubTab] = React.useState<"frete" | "promocoes" | "avisos" | "impressao" | "landpage" | "seguranca" | "pwa">("landpage");
  const [passcodeInput, setPasscodeInput] = React.useState(adminPasscode || "9310");

  React.useEffect(() => {
    if (!hasChanges) {
      setPasscodeInput(adminPasscode || "9310");
    }
  }, [adminPasscode, hasChanges]);

  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
  const [notification, setNotification] = React.useState<{ message: string; type: "success" | "error" } | null>(null);

  const triggerNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // --- Frete State ---
  const [newNeighborhood, setNewNeighborhood] = useState("");
  const [newNeighborhoodCost, setNewNeighborhoodCost] = useState(0);

  // --- Promoções State ---
  const [newPromoTitle, setNewPromoTitle] = useState("");
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoValue, setNewPromoValue] = useState(10);
  const [newPromoType, setNewPromoType] = useState<"cupom" | "desconto">("cupom");
  const [newPromoDurationValue, setNewPromoDurationValue] = useState<number>(0);
  const [newPromoDurationUnit, setNewPromoDurationUnit] = useState<"minutos" | "horas" | "dias" | "ilimitado">("ilimitado");

  // --- Banner State ---
  const [newBannerLinkInput, setNewBannerLinkInput] = useState("");

  // --- Avisos State ---
  const [newAvisoMsg, setNewAvisoMsg] = useState("");
  const [newAvisoTime, setNewAvisoTime] = useState(10);
  const [newAvisoType, setNewAvisoType] = useState<"top_bar" | "centered_popup">("top_bar");
  const [newAvisoImage, setNewAvisoImage] = useState("");
  const [newAvisoTitle, setNewAvisoTitle] = useState("");
  const [editingAvisoId, setEditingAvisoId] = useState<string | null>(null);
  const [editingAvisoMsg, setEditingAvisoMsg] = useState("");
  const [editingAvisoTime, setEditingAvisoTime] = useState(10);
  const [editingAvisoType, setEditingAvisoType] = useState<"top_bar" | "centered_popup">("top_bar");
  const [editingAvisoImage, setEditingAvisoImage] = useState("");
  const [editingAvisoTitle, setEditingAvisoTitle] = useState("");

  // --- Handlers Frete ---
  const handleAddNeighborhood = () => {
    if (!newNeighborhood.trim()) return;
    const item: NeighborhoodShipping = {
      id: `neigh-${Date.now()}`,
      neighborhood: newNeighborhood.trim(),
      cost: newNeighborhoodCost
    };
    updateLocalState({
      shippingNeighborhoods: [...shippingNeighborhoods, item]
    });
    setNewNeighborhood("");
    setNewNeighborhoodCost(0);
  };

  const handleRemoveNeighborhood = (id: string) => {
    updateLocalState({
      shippingNeighborhoods: shippingNeighborhoods.filter(n => n.id !== id)
    });
  };

  // --- Handlers Promoções ---
  const handleAddPromotion = () => {
    if (!newPromoTitle.trim() || !newPromoCode.trim()) return;
    const item: Promotion = {
      id: `promo-${Date.now()}`,
      title: newPromoTitle.trim(),
      code: newPromoCode.trim().toUpperCase(),
      value: newPromoValue,
      type: newPromoType,
      active: true,
      durationValue: newPromoDurationUnit === "ilimitado" ? undefined : newPromoDurationValue,
      durationUnit: newPromoDurationUnit,
      createdAt: new Date().toISOString()
    };
    updateLocalState({
      promotions: [...promotions, item]
    });
    setNewPromoTitle("");
    setNewPromoCode("");
    setNewPromoValue(10);
    setNewPromoDurationValue(0);
    setNewPromoDurationUnit("ilimitado");
  };

  const handleTogglePromo = (id: string) => {
    updateLocalState({
      promotions: promotions.map(p => p.id === id ? { ...p, active: !p.active } : p)
    });
  };

  const handleRemovePromo = (id: string) => {
    updateLocalState({
      promotions: promotions.filter(p => p.id !== id)
    });
  };

  // --- Handlers Avisos ---
  const handleAvisoImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "new" | "edit") => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 500, 500, 0.7);
        if (target === "new") {
          setNewAvisoImage(compressed);
        } else {
          setEditingAvisoImage(compressed);
        }
        triggerNotification("Imagem do aviso processada com sucesso! 📸");
      } catch (err) {
        console.error(err);
        triggerNotification("Erro ao processar imagem", "error");
      }
    }
  };

  const handlePwaIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 256, 256, 0.7);
        const updatedPwa = { ...(localState.pwa || {}), logoUrl: compressed } as any;
        updateLocalState({ pwa: updatedPwa });
        triggerNotification("Ícone do PWA atualizado! 📱");
      } catch (err) {
        console.error(err);
        triggerNotification("Erro ao processar imagem", "error");
      }
    }
  };

  const handleAddAviso = () => {
    if (!newAvisoMsg.trim()) return;
    const item: Aviso = {
      id: `aviso-${Date.now()}`,
      message: newAvisoMsg.trim(),
      active: true,
      displayTimeSeconds: newAvisoTime,
      type: newAvisoType,
      image: newAvisoImage || undefined,
      title: newAvisoTitle.trim() || undefined,
      createdAt: new Date().toISOString()
    };
    updateLocalState({
      avisos: [...avisos, item]
    });
    setNewAvisoMsg("");
    setNewAvisoTime(10);
    setNewAvisoType("top_bar");
    setNewAvisoImage("");
    setNewAvisoTitle("");
    triggerNotification("Popup aviso cadastrado no rascunho!");
  };

  const handleToggleAviso = (id: string) => {
    updateLocalState({
      avisos: avisos.map(a => a.id === id ? { ...a, active: !a.active } : a)
    });
  };

  const handleRemoveAviso = (id: string) => {
    updateLocalState({
      avisos: avisos.filter(a => a.id !== id)
    });
  };

  const handleSaveAviso = (id: string) => {
    if (!editingAvisoMsg.trim()) return;
    updateLocalState({
      avisos: avisos.map(a => a.id === id ? { 
        ...a, 
        message: editingAvisoMsg.trim(), 
        displayTimeSeconds: editingAvisoTime,
        type: editingAvisoType,
        image: editingAvisoImage || undefined,
        title: editingAvisoTitle.trim() || undefined
      } : a)
    });
    setEditingAvisoId(null);
    setEditingAvisoMsg("");
    setEditingAvisoTime(10);
    setEditingAvisoType("top_bar");
    setEditingAvisoImage("");
    setEditingAvisoTitle("");
    triggerNotification("Aviso popup atualizado no rascunho!");
  };

  // --- Helper to update Landpage sub-fields ---
  const updateLandpageField = (field: keyof LandpageConfig, value: any, isTyping = false) => {
    updateLocalState({
      landpage: {
        ...landpage,
        [field]: value
      }
    }, isTyping);
  };

  // --- Helper to update Printing sub-fields ---
  const updatePrintingField = (field: keyof PrintingConfig, value: any, isTyping = false) => {
    updateLocalState({
      printing: {
        ...printing,
        [field]: value
      }
    }, isTyping);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#e0e0d6] overflow-hidden shadow-sm flex flex-col md:flex-row min-h-[500px]">
      
      {/* Sidebar sub-menus for Minha Loja configuration */}
      <aside className="w-full md:w-56 bg-[#fbfbfa] border-r border-[#e0e0d6] p-4 flex flex-col gap-1 shrink-0">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Painel de Configuração</p>
        
        <button
          onClick={() => setActiveSubTab("landpage")}
          className={`px-3 py-2 text-xs font-semibold rounded-xl text-left transition flex items-center gap-2 ${
            activeSubTab === "landpage" ? "bg-[#5A5A40] text-white shadow-sm" : "hover:bg-gray-100 text-gray-600"
          }`}
        >
          <LayoutTemplate className="w-4 h-4" /> Personalizar Loja / LP
        </button>

        <button
          onClick={() => setActiveSubTab("frete")}
          className={`px-3 py-2 text-xs font-semibold rounded-xl text-left transition flex items-center gap-2 ${
            activeSubTab === "frete" ? "bg-[#5A5A40] text-white shadow-sm" : "hover:bg-gray-100 text-gray-600"
          }`}
        >
          <Truck className="w-4 h-4" /> Configuração Frete
        </button>

        <button
          onClick={() => setActiveSubTab("promocoes")}
          className={`px-3 py-2 text-xs font-semibold rounded-xl text-left transition flex items-center gap-2 ${
            activeSubTab === "promocoes" ? "bg-[#5A5A40] text-white shadow-sm" : "hover:bg-gray-100 text-gray-600"
          }`}
        >
          <Tag className="w-4 h-4" /> Promoções & Cupons
        </button>

        <button
          onClick={() => setActiveSubTab("avisos")}
          className={`px-3 py-2 text-xs font-semibold rounded-xl text-left transition flex items-center gap-2 ${
            activeSubTab === "avisos" ? "bg-[#5A5A40] text-white shadow-sm" : "hover:bg-gray-100 text-gray-600"
          }`}
        >
          <AlertOctagon className="w-4 h-4" /> Avisos & Pop-ups
        </button>

        <button
          onClick={() => setActiveSubTab("impressao")}
          className={`px-3 py-2 text-xs font-semibold rounded-xl text-left transition flex items-center gap-2 ${
            activeSubTab === "impressao" ? "bg-[#5A5A40] text-white shadow-sm" : "hover:bg-gray-100 text-gray-600"
          }`}
        >
          <Printer className="w-4 h-4" /> Cupom de Impressão
        </button>

        <button
          onClick={() => setActiveSubTab("seguranca")}
          className={`px-3 py-2 text-xs font-semibold rounded-xl text-left transition flex items-center gap-2 ${
            activeSubTab === "seguranca" ? "bg-[#5A5A40] text-white shadow-sm" : "hover:bg-gray-100 text-gray-600"
          }`}
        >
          <Lock className="w-4 h-4" /> Senha do Painel
        </button>

        <button
          onClick={() => setActiveSubTab("pwa")}
          className={`px-3 py-2 text-xs font-semibold rounded-xl text-left transition flex items-center gap-2 ${
            activeSubTab === "pwa" ? "bg-[#5A5A40] text-white shadow-sm" : "hover:bg-gray-100 text-gray-600"
          }`}
        >
          <Smartphone className="w-4 h-4" /> Configurar PWA App
        </button>
      </aside>

      {/* Detail options viewport */}
      <main className="flex-1 p-6 overflow-y-auto">
        {notification && (
          <div className={`p-4 mb-4 rounded-xl text-xs font-bold border transition-all ${
            notification.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
              : "bg-red-50 text-red-800 border-red-200"
          }`}>
            {notification.message}
          </div>
        )}
        
        {/* LANDING PAGE CUSTOMIZER */}
        {activeSubTab === "landpage" && (
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">Personalização da Loja do Cliente (Landing page)</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Título do Header (Logo Nome) *</label>
                <input
                  type="text"
                  value={landpage.heroTitle}
                  onChange={(e) => updateLandpageField("heroTitle", e.target.value, true)}
                  onBlur={handleBlurSave}
                  className="w-full text-xs px-3 py-2 bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Frase de Boas-vindas</label>
                <input
                  type="text"
                  value={landpage.welcomeMessage}
                  onChange={(e) => updateLandpageField("welcomeMessage", e.target.value, true)}
                  onBlur={handleBlurSave}
                  className="w-full text-xs px-3 py-2 bg-gray-50 border border-[#e0e0d6] rounded-xl"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Slogan Principal (Hero Subtitle)</label>
                <textarea
                  value={landpage.heroSubtitle}
                  onChange={(e) => updateLandpageField("heroSubtitle", e.target.value, true)}
                  onBlur={handleBlurSave}
                  className="w-full text-xs px-3 py-2 bg-gray-50 border border-[#e0e0d6] rounded-xl h-16 resize-none"
                />
                      {/* --- LOGO, FAVICON & BANNER UPLOADS --- */}
              <div className="col-span-2 border-t border-gray-100 pt-4 mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Logo Section */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-gray-800 text-xs">🛍️ Logomarca da Loja</h5>
                    {landpage.logoImage && (
                      <img src={landpage.logoImage} alt="Preview Logo" className="h-8 w-8 rounded-full object-cover border border-gray-200" />
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400">Insira a imagem de identificação que aparece no topo da landing page.</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Link da imagem da Logo..."
                      value={landpage.logoImage}
                      onChange={(e) => updateLandpageField("logoImage", e.target.value)}
                      className="flex-1 text-xs px-3 py-1.5 bg-white border border-[#e0e0d6] rounded-xl focus:outline-none"
                    />
                    <label className="cursor-pointer bg-[#5A5A40] text-white hover:bg-[#484833] px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await compressImage(file, 300, 300, 0.7);
                              updateLandpageField("logoImage", compressed);
                              triggerNotification("Logo atualizada via upload! 🛍️");
                            } catch (err) {
                              console.error(err);
                              triggerNotification("Erro ao processar imagem", "error");
                            }
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Favicon Section */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-gray-800 text-xs">🌐 Ícone de Favorito (Favicon)</h5>
                    {landpage.faviconImage && (
                      <img src={landpage.faviconImage} alt="Preview Favicon" className="h-6 w-6 rounded object-cover border border-gray-200" />
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400">Ícone mostrado na aba do navegador do cliente e no app instalado (PWA).</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Link do Favicon..."
                      value={landpage.faviconImage || ""}
                      onChange={(e) => updateLandpageField("faviconImage", e.target.value)}
                      className="flex-1 text-xs px-3 py-1.5 bg-white border border-[#e0e0d6] rounded-xl focus:outline-none"
                    />
                    <label className="cursor-pointer bg-[#5A5A40] text-white hover:bg-[#484833] px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await compressImage(file, 64, 64, 0.7);
                              updateLandpageField("faviconImage", compressed);
                              triggerNotification("Favicon atualizado via upload! 🌐");
                            } catch (err) {
                              console.error(err);
                              triggerNotification("Erro ao processar imagem", "error");
                            }
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Multiple Banners Slide Section */}
                <div className="col-span-1 md:col-span-2 bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-gray-800 text-xs">📸 Banners Rotativos (Slide de 2 segundos)</h5>
                      <p className="text-[10px] text-gray-400">Envie mais de um banner para que fiquem passando a cada 2 segundos na loja.</p>
                    </div>
                  </div>

                  {/* Existing banner list */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {(landpage.bannerImages || [landpage.bannerImage]).map((banner, index) => (
                      <div key={index} className="relative aspect-[16/9] rounded-xl overflow-hidden border border-gray-200 bg-white flex items-center justify-center p-1 group">
                        <img src={banner} alt={`Banner ${index + 1}`} className="max-w-full max-h-full object-contain" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              const list = landpage.bannerImages || [landpage.bannerImage];
                              const nextList = list.filter((_, i) => i !== index);
                              updateLocalState({
                                landpage: {
                                  ...landpage,
                                  bannerImages: nextList,
                                  bannerImage: nextList[0] || ""
                                }
                              });
                              triggerNotification("Banner removido do rascunho!");
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-lg text-xs font-bold transition shadow-md"
                            title="Remover este banner"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded">
                          Slide {index + 1}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Add Banner Block */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        placeholder="Adicionar banner por Link..."
                        value={newBannerLinkInput}
                        onChange={(e) => setNewBannerLinkInput(e.target.value)}
                        className="flex-1 text-xs px-3 py-1.5 bg-white border border-[#e0e0d6] rounded-xl focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newBannerLinkInput.trim()) return;
                          const list = landpage.bannerImages || [landpage.bannerImage];
                          const nextList = [...list, newBannerLinkInput.trim()];
                          updateLocalState({
                            landpage: {
                              ...landpage,
                              bannerImages: nextList,
                              bannerImage: nextList[0]
                            }
                          });
                          setNewBannerLinkInput("");
                          triggerNotification("Banner adicionado ao rascunho!");
                        }}
                        className="bg-[#5A5A40] text-white hover:bg-[#484833] px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar
                      </button>
                    </div>

                    <label className="cursor-pointer bg-white border border-[#e0e0d6] hover:bg-gray-100 px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shrink-0">
                      <Upload className="w-3.5 h-3.5 text-gray-500" />
                      Upload Novo Banner
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await compressImage(file, 800, 800, 0.7);
                              const list = landpage.bannerImages || [landpage.bannerImage];
                              const nextList = [...list, compressed];
                              updateLocalState({
                                landpage: {
                                  ...landpage,
                                  bannerImages: nextList,
                                  bannerImage: nextList[0]
                                }
                              });
                              triggerNotification("Banner adicionado via upload! 📸");
                            } catch (err) {
                              console.error(err);
                              triggerNotification("Erro ao processar banner", "error");
                            }
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Customizable Badges & Icons (Deixar a página editável) */}
                <div className="col-span-1 md:col-span-2 bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4 mt-1">
                  <div className="border-b border-gray-100 pb-2">
                    <h5 className="font-bold text-gray-800 text-xs">🏷️ Ícones, Selos e Etiquetas da Loja</h5>
                    <p className="text-[10px] text-gray-400">Personalize os badges de destaque, etiquetas do banner e informações de qualidade.</p>
                  </div>

                  {/* Banner Tag Customization with cute clothing icon selector */}
                  <div className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#5A5A40]">
                      <span>✨</span> Etiqueta Suspensa do Banner Principal
                    </div>
                    <p className="text-[10px] text-gray-400">Customize o selinho flutuante que aparece por cima do seu banner.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[8px] uppercase font-bold text-gray-400 mb-1">Ícone / Emoji da Etiqueta</label>
                        <input
                          type="text"
                          placeholder="👗"
                          value={landpage.bannerTagIcon || ""}
                          onChange={(e) => updateLandpageField("bannerTagIcon", e.target.value, true)}
                          onBlur={handleBlurSave}
                          className="w-full text-xs px-3 py-1.5 bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none text-center font-bold"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[8px] uppercase font-bold text-gray-400 mb-1">Texto da Etiqueta</label>
                        <input
                          type="text"
                          placeholder="Moda Infantil Premium"
                          value={landpage.bannerTagText || ""}
                          onChange={(e) => updateLandpageField("bannerTagText", e.target.value, true)}
                          onBlur={handleBlurSave}
                          className="w-full text-xs px-3 py-1.5 bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Children clothes Quick Icon selector */}
                    <div className="space-y-1.5 pt-1">
                      <label className="block text-[8px] uppercase font-bold text-gray-400">Sugestões de Ícones (Tema Infantil & Roupas)</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { emoji: "👗", name: "Vestido" },
                          { emoji: "👕", name: "Camiseta" },
                          { emoji: "🩳", name: "Shorts" },
                          { emoji: "🧥", name: "Casaco" },
                          { emoji: "👟", name: "Tênis" },
                          { emoji: "👶", name: "Bebê" },
                          { emoji: "🧸", name: "Ursinho" },
                          { emoji: "🍼", name: "Mamadeira" },
                          { emoji: "👑", name: "Realeza" },
                          { emoji: "🎀", name: "Laço" },
                          { emoji: "🧢", name: "Boné" },
                          { emoji: "🧦", name: "Meia" },
                          { emoji: "🎒", name: "Mochila" },
                          { emoji: "🦕", name: "Dino" },
                          { emoji: "🎈", name: "Balão" }
                        ].map((item) => (
                          <button
                            key={item.emoji}
                            type="button"
                            onClick={() => {
                              updateLandpageField("bannerTagIcon", item.emoji);
                              triggerNotification(`Ícone "${item.emoji} ${item.name}" selecionado!`);
                            }}
                            className={`px-2 py-1 rounded-lg text-xs border transition flex items-center gap-1 ${
                              landpage.bannerTagIcon === item.emoji
                                ? "bg-[#5A5A40]/10 border-[#5A5A40] text-[#5A5A40] font-bold"
                                : "bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-700"
                            }`}
                            title={item.name}
                          >
                            <span>{item.emoji}</span>
                            <span className="text-[8px] font-medium text-gray-500">{item.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="col-span-1 sm:col-span-3">
                      <label className="block text-[8px] uppercase font-bold text-gray-400 mb-1">Badge de Coleção Superior (Header)</label>
                      <input
                        type="text"
                        placeholder="Ex: ✨ 🧸 Mundo Feliz Kids • Nova Coleção"
                        value={landpage.topBadgeText || ""}
                        onChange={(e) => updateLandpageField("topBadgeText", e.target.value, true)}
                        onBlur={handleBlurSave}
                        className="w-full text-xs px-3 py-1.5 bg-white border border-[#e0e0d6] rounded-xl focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] uppercase font-bold text-gray-400 mb-1">Selo 1 - Ícone / Emoji</label>
                      <input
                        type="text"
                        placeholder="🌸"
                        value={landpage.badge1Icon || ""}
                        onChange={(e) => updateLandpageField("badge1Icon", e.target.value, true)}
                        onBlur={handleBlurSave}
                        className="w-full text-xs px-3 py-1.5 bg-white border border-[#e0e0d6] rounded-xl focus:outline-none text-center font-bold"
                      />
                      <label className="block text-[8px] uppercase font-bold text-gray-400 mt-1.5 mb-1">Selo 1 - Texto</label>
                      <input
                        type="text"
                        placeholder="100% Algodão"
                        value={landpage.badge1Text || ""}
                        onChange={(e) => updateLandpageField("badge1Text", e.target.value, true)}
                        onBlur={handleBlurSave}
                        className="w-full text-xs px-3 py-1.5 bg-white border border-[#e0e0d6] rounded-xl focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] uppercase font-bold text-gray-400 mb-1">Selo 2 - Ícone / Emoji</label>
                      <input
                        type="text"
                        placeholder="☁️"
                        value={landpage.badge2Icon || ""}
                        onChange={(e) => updateLandpageField("badge2Icon", e.target.value, true)}
                        onBlur={handleBlurSave}
                        className="w-full text-xs px-3 py-1.5 bg-white border border-[#e0e0d6] rounded-xl focus:outline-none text-center font-bold"
                      />
                      <label className="block text-[8px] uppercase font-bold text-gray-400 mt-1.5 mb-1">Selo 2 - Texto</label>
                      <input
                        type="text"
                        placeholder="Toque Macio"
                        value={landpage.badge2Text || ""}
                        onChange={(e) => updateLandpageField("badge2Text", e.target.value, true)}
                        onBlur={handleBlurSave}
                        className="w-full text-xs px-3 py-1.5 bg-white border border-[#e0e0d6] rounded-xl focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] uppercase font-bold text-gray-400 mb-1">Selo 3 - Ícone / Emoji</label>
                      <input
                        type="text"
                        placeholder="🍼"
                        value={landpage.badge3Icon || ""}
                        onChange={(e) => updateLandpageField("badge3Icon", e.target.value, true)}
                        onBlur={handleBlurSave}
                        className="w-full text-xs px-3 py-1.5 bg-white border border-[#e0e0d6] rounded-xl focus:outline-none text-center font-bold"
                      />
                      <label className="block text-[8px] uppercase font-bold text-gray-400 mt-1.5 mb-1">Selo 3 - Texto</label>
                      <input
                        type="text"
                        placeholder="Hipoalergênico"
                        value={landpage.badge3Text || ""}
                        onChange={(e) => updateLandpageField("badge3Text", e.target.value, true)}
                        onBlur={handleBlurSave}
                        className="w-full text-xs px-3 py-1.5 bg-white border border-[#e0e0d6] rounded-xl focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>            </div>

              {/* Floating particles options */}
              <div className="col-span-2 bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-gray-800 text-xs">Efeitos Visuais Flutuantes</h5>
                  <p className="text-[10px] text-gray-500 mt-0.5">Ative animações de balões e bolhas de sabão subindo pela tela do cliente.</p>
                </div>
                <button
                  onClick={() => updateLandpageField("floatingParticles", !landpage.floatingParticles)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    landpage.floatingParticles ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {landpage.floatingParticles ? "Ativado" : "Desativado"}
                </button>
              </div>

              {/* --- Identidade Visual (Cor de Destaque) --- */}
              <div className="col-span-2 border-t border-gray-100 pt-4 mt-2">
                <h5 className="font-bold text-gray-800 text-xs mb-3">🎨 Identidade Visual (Cor de Destaque)</h5>
                <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex flex-wrap gap-1.5 flex-1 min-w-[240px]">
                    {[
                      { hex: "#5A5A40", label: "Sálvia" },
                      { hex: "#E07A5F", label: "Terracota" },
                      { hex: "#3D5A80", label: "Oceano" },
                      { hex: "#70A288", label: "Menta" },
                      { hex: "#D4A373", label: "Mostarda" },
                      { hex: "#E29578", label: "Coral" },
                      { hex: "#8338EC", label: "Roxo" },
                      { hex: "#E63946", label: "Cereja" },
                      { hex: "#ec4899", label: "Rosa" },
                      { hex: "#222222", label: "Preto" },
                    ].map((item) => (
                      <button
                        key={item.hex}
                        type="button"
                        onClick={() => updateLandpageField("accentColor", item.hex)}
                        className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${
                          landpage.accentColor?.toLowerCase() === item.hex.toLowerCase()
                            ? "border-gray-900 bg-white shadow-sm ring-1 ring-gray-900"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: item.hex }} />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2 border-l pl-3 border-gray-200">
                    <div className="relative">
                      <input
                        type="color"
                        value={landpage.accentColor || "#5A5A40"}
                        onChange={(e) => updateLandpageField("accentColor", e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-gray-300 overflow-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] uppercase font-bold text-gray-400">Customizado</label>
                      <input
                        type="text"
                        value={landpage.accentColor || "#5A5A40"}
                        onChange={(e) => updateLandpageField("accentColor", e.target.value)}
                        placeholder="#5A5A40"
                        className="w-20 text-[10px] font-mono font-bold uppercase border-b border-gray-300 focus:outline-none focus:border-gray-500 bg-transparent py-0.5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Tipografia da Loja (Fontes) --- */}
              <div className="col-span-2 border-t border-gray-100 pt-4">
                <h5 className="font-bold text-gray-800 text-xs mb-3">🔤 Tipografia da Loja (Par de Fontes)</h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {[
                    { id: "classica", title: "Clássica Elegante", font: "Playfair & Montserrat", desc: "Moda premium tradicional" },
                    { id: "infantil", title: "Infantil Fofa", font: "Fredoka & Nunito", desc: "Arredondada e alegre" },
                    { id: "moderna", title: "Moderna Clean", font: "Space Grotesk & Inter", desc: "Design minimalista e jovem" },
                    { id: "sofisticada", title: "Sofisticada Premium", font: "Cinzel & Montserrat", desc: "Grife e alta costura" },
                    { id: "retro", title: "Retro Vintage", font: "Courier Prime & Nunito", desc: "Estilo rústico e artesanal" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => updateLandpageField("fontFamily", f.id)}
                      className={`flex flex-col text-left p-3 rounded-2xl border transition-all ${
                        (landpage.fontFamily || "classica") === f.id
                          ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                      }`}
                    >
                      <span className="text-[10px] font-bold text-gray-800">{f.title}</span>
                      <span className="text-[9px] text-gray-400 font-mono mt-0.5">{f.font}</span>
                      <span className="text-[8px] text-gray-400 mt-1 leading-normal">{f.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* --- Skin da Loja (Temas Visuais) --- */}
              <div className="col-span-2 border-t border-gray-100 pt-4">
                <h5 className="font-bold text-gray-800 text-xs mb-3">🎨 Skin da Loja (Estilo e Layout)</h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {[
                    { id: "default", title: "Sálvia & Algodão", desc: "Fundo rústico sálvia com linhas finas e bordas aconchegantes." },
                    { id: "nuvem", title: "Bebê Nuvem", desc: "Bordas extra arredondadas, sombras suaves e tons pastéis sonhadores." },
                    { id: "minimal", title: "Modern Minimal", desc: "Fundo cinza claro puro, linhas retas, design limpo e moderno." },
                    { id: "vintage", title: "Sepia Cottage", desc: "Bordas de linha dupla, fundos creme amarelados e visual nostálgico." },
                    { id: "doce", title: "Doce Candy", desc: "Degradê suave rosa-pastel, detalhes redondos e estilo super fofo." },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => updateLandpageField("skin", s.id)}
                      className={`flex flex-col text-left p-3 rounded-2xl border transition-all ${
                        (landpage.skin || "default") === s.id
                          ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                      }`}
                    >
                      <span className="text-[10px] font-bold text-gray-800">{s.title}</span>
                      <span className="text-[8px] text-gray-400 mt-1 leading-normal">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* FRETE OPTIONS */}
        {activeSubTab === "frete" && (
          <div className="space-y-4">
            <h4 className="font-bold text-[#5A5A40] text-sm border-b border-gray-100 pb-2">Gerenciamento de Entregas e Fretes</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <label className="flex flex-col gap-1 items-center justify-center p-3 border rounded-xl cursor-pointer bg-white">
                <input
                  type="radio"
                  name="shippingType"
                  value="bairro"
                  checked={shippingType === "bairro"}
                  onChange={() => updateLocalState({ shippingType: "bairro" })}
                  className="text-[#5A5A40]"
                />
                <span className="text-xs font-bold mt-1 text-gray-700">Por Bairro</span>
              </label>

              <label className="flex flex-col gap-1 items-center justify-center p-3 border rounded-xl cursor-pointer bg-white">
                <input
                  type="radio"
                  name="shippingType"
                  value="fixo"
                  checked={shippingType === "fixo"}
                  onChange={() => updateLocalState({ shippingType: "fixo" })}
                  className="text-[#5A5A40]"
                />
                <span className="text-xs font-bold mt-1 text-gray-700">Fixo Único</span>
              </label>

              <label className="flex flex-col gap-1 items-center justify-center p-3 border rounded-xl cursor-pointer bg-white">
                <input
                  type="radio"
                  name="shippingType"
                  value="combinar"
                  checked={shippingType === "combinar"}
                  onChange={() => updateLocalState({ shippingType: "combinar" })}
                  className="text-[#5A5A40]"
                />
                <span className="text-xs font-bold mt-1 text-gray-700">A Combinar (WhatsApp)</span>
              </label>
            </div>

            {shippingType === "fixo" && (
              <div className="max-w-xs space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-gray-400">Valor do Frete Fixo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={shippingFixedCost}
                  onChange={(e) => updateLocalState({ shippingFixedCost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-gray-50 border border-[#e0e0d6] rounded-xl text-xs"
                />
              </div>
            )}

            {shippingType === "bairro" && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Nome do bairro..."
                    value={newNeighborhood}
                    onChange={(e) => setNewNeighborhood(e.target.value)}
                    className="col-span-2 px-3 py-2 bg-gray-50 border border-[#e0e0d6] rounded-xl text-xs focus:outline-none"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Custo"
                    value={newNeighborhoodCost}
                    onChange={(e) => setNewNeighborhoodCost(parseFloat(e.target.value) || 0)}
                    className="px-3 py-2 bg-gray-50 border border-[#e0e0d6] rounded-xl text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddNeighborhood}
                    className="col-span-3 bg-[#5A5A40] text-white py-1.5 rounded-lg text-xs font-bold"
                  >
                    Adicionar Bairro Frete
                  </button>
                </div>

                {/* List of active neighborhoods */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                  {shippingNeighborhoods.map((n) => (
                    <div key={n.id} className="bg-gray-50 border border-gray-100 p-2.5 rounded-xl flex justify-between items-center text-xs">
                      <span className="font-bold">📍 {n.neighborhood}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#5A5A40]">R$ {n.cost.toFixed(2)}</span>
                        
                        {deleteConfirmId === n.id ? (
                          <div className="flex items-center gap-1 bg-red-50 p-1 rounded border border-red-200 animate-pulse">
                            <span className="text-[9px] font-bold text-red-600">Apagar?</span>
                            <button
                              type="button"
                              onClick={() => {
                                handleRemoveNeighborhood(n.id);
                                setDeleteConfirmId(null);
                                triggerNotification(`Bairro "${n.neighborhood}" removido.`);
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-1.5 py-0.5 rounded text-[8px] font-bold transition"
                            >
                              Sim
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-1.5 py-0.5 rounded text-[8px] font-bold transition"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(n.id)}
                            className="p-1 hover:text-red-500 text-gray-400 hover:bg-red-50 rounded transition"
                            title="Excluir Bairro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* PROMOÇÕES AND CUPONS */}
        {activeSubTab === "promocoes" && (
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">Cadastrar Cupons de Desconto</h4>

            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <div className="col-span-2">
                <label className="block text-[9px] uppercase font-bold text-gray-400">Título / Apelido Promoção *</label>
                <input
                  type="text"
                  placeholder="Ex: CUPOM DE BENVINDO"
                  value={newPromoTitle}
                  onChange={(e) => setNewPromoTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#e0e0d6] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-gray-400">Cupom de Código *</label>
                <input
                  type="text"
                  placeholder="Ex: BENVINDO10"
                  value={newPromoCode}
                  onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#e0e0d6] rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-gray-400">Valor (% ou Fixo R$)</label>
                <input
                  type="number"
                  value={newPromoValue}
                  onChange={(e) => setNewPromoValue(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#e0e0d6] rounded-xl text-xs"
                />
              </div>

              {/* Duração do Cupom (Melhoria do Cupom) */}
              <div>
                <label className="block text-[9px] uppercase font-bold text-gray-400">Unidade de Duração</label>
                <select
                  value={newPromoDurationUnit}
                  onChange={(e) => setNewPromoDurationUnit(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#e0e0d6] rounded-xl text-xs focus:outline-none"
                >
                  <option value="ilimitado">Ilimitado (Sem expiração)</option>
                  <option value="minutos">Minutos</option>
                  <option value="horas">Horas</option>
                  <option value="dias">Dias</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-[#5A5A40] disabled:text-gray-300">Tempo de Duração</label>
                <input
                  type="number"
                  min={1}
                  disabled={newPromoDurationUnit === "ilimitado"}
                  value={newPromoDurationValue}
                  onChange={(e) => setNewPromoDurationValue(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#e0e0d6] disabled:bg-gray-100 disabled:text-gray-400 rounded-xl text-xs"
                  placeholder="Ex: 30"
                />
              </div>

              <div className="col-span-2">
                <button
                  type="button"
                  onClick={handleAddPromotion}
                  className="w-full bg-[#5A5A40] text-white py-2 rounded-xl text-xs font-bold"
                >
                  ✓ Cadastrar Cupom Ativo
                </button>
              </div>
            </div>

            {/* List */}
            <div className="space-y-2">
              {promotions.map((promo) => {
                // Helper inside map for clean localized rendering
                const getPromoDurationLabel = () => {
                  if (!promo.durationValue || promo.durationUnit === "ilimitado" || !promo.createdAt) {
                    return "Ilimitado / Sem Expiração ✨";
                  }
                  const createdTime = new Date(promo.createdAt).getTime();
                  let durationMs = 0;
                  if (promo.durationUnit === "minutos") durationMs = promo.durationValue * 60 * 1000;
                  else if (promo.durationUnit === "horas") durationMs = promo.durationValue * 60 * 60 * 1000;
                  else if (promo.durationUnit === "dias") durationMs = promo.durationValue * 24 * 60 * 60 * 1000;

                  const expirationTime = createdTime + durationMs;
                  const timeLeftMs = expirationTime - Date.now();

                  if (timeLeftMs <= 0) {
                    return "Expirado ❌";
                  }

                  const mins = Math.floor(timeLeftMs / 60000);
                  const hrs = Math.floor(mins / 60);
                  const days = Math.floor(hrs / 24);

                  if (days > 0) {
                    return `Expira em ${days}d e ${hrs % 24}h ⏰`;
                  }
                  if (hrs > 0) {
                    return `Expira em ${hrs}h e ${mins % 60}m ⏰`;
                  }
                  return `Expira em ${mins}m ⏰`;
                };

                return (
                  <div key={promo.id} className="bg-gray-50 border border-gray-100 p-3 rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-extrabold text-gray-900">{promo.title}</p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        Código: <b className="text-gray-700">{promo.code}</b> | Desconto: <b className="text-gray-700">{promo.value}%</b>
                      </p>
                      <p className="text-[9px] text-[#5A5A40] mt-0.5 font-medium flex items-center gap-1">
                        {getPromoDurationLabel()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePromo(promo.id)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold ${
                        promo.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {promo.active ? "ATIVO" : "INATIVO"}
                    </button>
                    
                    {deleteConfirmId === promo.id ? (
                      <div className="flex items-center gap-1 bg-red-50 p-1 rounded border border-red-200 animate-pulse">
                        <span className="text-[9px] font-bold text-red-600">Apagar?</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleRemovePromo(promo.id);
                            setDeleteConfirmId(null);
                            triggerNotification(`Cupom "${promo.code}" removido.`);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-1.5 py-0.5 rounded text-[8px] font-bold transition"
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-1.5 py-0.5 rounded text-[8px] font-bold transition"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(promo.id)}
                        className="p-1.5 hover:text-red-500 text-gray-400 hover:bg-red-50 rounded-lg transition"
                        title="Excluir Cupom"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
              })}
            </div>

          </div>
        )}

        {/* AVISOS E POP-UPS LIST */}
        {activeSubTab === "avisos" && (
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">Avisos no Meio da Tela e Promoções Popups</h4>

            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              {/* Seleção do Tipo de Aviso */}
              <div>
                <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Tipo de Aviso</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewAvisoType("top_bar")}
                    className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-semibold transition ${
                      newAvisoType === "top_bar"
                        ? "bg-[#5A5A40] text-white border-[#5A5A40]"
                        : "bg-white text-gray-700 border-[#e0e0d6] hover:bg-[#5A5A40]/5"
                    }`}
                  >
                    Barra Superior (Top Bar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAvisoType("centered_popup")}
                    className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-semibold transition ${
                      newAvisoType === "centered_popup"
                        ? "bg-[#5A5A40] text-white border-[#5A5A40]"
                        : "bg-white text-gray-700 border-[#e0e0d6] hover:bg-[#5A5A40]/5"
                    }`}
                  >
                    Popup Centralizado (Promoções / Cupons)
                  </button>
                </div>
              </div>

              {newAvisoType === "centered_popup" && (
                <>
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Título do Popup (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: CUPOM EXCLUSIVO 🌸"
                      value={newAvisoTitle}
                      onChange={(e) => setNewAvisoTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#e0e0d6] rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Imagem do Popup (Upload ou URL)</label>
                    <div className="flex gap-3 items-center bg-white p-2.5 rounded-xl border border-[#e0e0d6]">
                      {newAvisoImage ? (
                        <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border shrink-0">
                          <img src={newAvisoImage} className="w-full h-full object-cover" alt="" />
                          <button
                            type="button"
                            onClick={() => setNewAvisoImage("")}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[8px] hover:bg-black/60 font-bold"
                          >
                            Excluir
                          </button>
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 shrink-0">
                          <Camera className="w-4 h-4" />
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          placeholder="Ou insira a URL da imagem..."
                          value={newAvisoImage}
                          onChange={(e) => setNewAvisoImage(e.target.value)}
                          className="w-full px-2 py-0.5 text-[10px] border border-gray-200 rounded"
                        />
                        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 text-[9px] font-bold px-2 py-0.5 rounded inline-block transition">
                          Fazer Upload Imagem
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleAvisoImageUpload(e, "new")}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[9px] uppercase font-bold text-gray-400">Texto do Aviso popup *</label>
                <input
                  type="text"
                  placeholder="Ex: Aproveite Frete Grátis acima de R$200 reais!"
                  value={newAvisoMsg}
                  onChange={(e) => setNewAvisoMsg(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#e0e0d6] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-gray-400">Tempo de Exibição Ativo (Segundos - 0 para permanente)</label>
                <input
                  type="number"
                  value={newAvisoTime}
                  onChange={(e) => setNewAvisoTime(parseInt(e.target.value, 10) || 0)}
                  className="w-full max-w-xs px-2.5 py-1.5 bg-white border border-[#e0e0d6] rounded-xl text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleAddAviso}
                className="bg-[#5A5A40] text-white px-4 py-2 rounded-xl text-xs font-bold"
              >
                Cadastrar Novo Aviso Popup
              </button>
            </div>

            {/* List */}
            <div className="space-y-2">
              {avisos.map((av) => {
                const isEditing = editingAvisoId === av.id;
                if (isEditing) {
                  return (
                    <div key={av.id} className="bg-gray-50 border border-[#5A5A40]/30 p-4 rounded-2xl space-y-3 text-xs">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Texto do Aviso popup / Barra de Aviso</label>
                        <input
                          type="text"
                          value={editingAvisoMsg}
                          onChange={(e) => setEditingAvisoMsg(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#e0e0d6] rounded-xl text-xs"
                        />
                      </div>

                      {/* Seleção de Tipo em Modo Edição */}
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Tipo de Aviso</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingAvisoType("top_bar")}
                            className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-semibold transition ${
                              editingAvisoType === "top_bar"
                                ? "bg-[#5A5A40] text-white border-[#5A5A40]"
                                : "bg-white text-gray-700 border-[#e0e0d6] hover:bg-[#5A5A40]/5"
                            }`}
                          >
                            Barra Superior (Top Bar)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingAvisoType("centered_popup")}
                            className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-semibold transition ${
                              editingAvisoType === "centered_popup"
                                ? "bg-[#5A5A40] text-white border-[#5A5A40]"
                                : "bg-white text-gray-700 border-[#e0e0d6] hover:bg-[#5A5A40]/5"
                            }`}
                          >
                            Popup Centralizado (Promoções / Cupons)
                          </button>
                        </div>
                      </div>

                      {editingAvisoType === "centered_popup" && (
                        <>
                          <div>
                            <label className="block text-[9px] uppercase font-bold text-gray-400">Título do Popup (Opcional)</label>
                            <input
                              type="text"
                              placeholder="Ex: CUPOM EXCLUSIVO 🌸"
                              value={editingAvisoTitle}
                              onChange={(e) => setEditingAvisoTitle(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-[#e0e0d6] rounded-xl text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Imagem do Popup (Upload ou URL)</label>
                            <div className="flex gap-3 items-center bg-white p-2.5 rounded-xl border border-[#e0e0d6]">
                              {editingAvisoImage ? (
                                <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border shrink-0">
                                  <img src={editingAvisoImage} className="w-full h-full object-cover" alt="" />
                                  <button
                                    type="button"
                                    onClick={() => setEditingAvisoImage("")}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[8px] hover:bg-black/60 font-bold"
                                  >
                                    Excluir
                                  </button>
                                </div>
                              ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 shrink-0">
                                  <Camera className="w-4 h-4" />
                                </div>
                              )}
                              <div className="flex-1 space-y-1">
                                <input
                                  type="text"
                                  placeholder="Ou insira a URL da imagem..."
                                  value={editingAvisoImage}
                                  onChange={(e) => setEditingAvisoImage(e.target.value)}
                                  className="w-full px-2 py-0.5 text-[10px] border border-gray-200 rounded"
                                />
                                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 text-[9px] font-bold px-2 py-0.5 rounded inline-block transition">
                                  Fazer Upload Imagem
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleAvisoImageUpload(e, "edit")}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
                        <div className="flex-1">
                          <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Tempo de Exibição Ativo (Segundos - 0 para permanente)</label>
                          <input
                            type="number"
                            value={editingAvisoTime}
                            onChange={(e) => setEditingAvisoTime(parseInt(e.target.value, 10) || 0)}
                            className="w-full px-2.5 py-1.5 bg-white border border-[#e0e0d6] rounded-xl text-xs"
                          />
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSaveAviso(av.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingAvisoId(null)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={av.id} className="bg-gray-50 border border-gray-100 p-3 rounded-2xl flex justify-between items-center text-xs">
                    {av.image && (
                      <img src={av.image} className="w-10 h-10 rounded-lg object-cover border border-gray-200 mr-2.5 shrink-0" alt="" />
                    )}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex flex-wrap items-center gap-1">
                        {av.title && (
                          <span className="text-[8px] uppercase font-bold text-[#5A5A40] bg-[#5A5A40]/10 px-1.5 py-0.5 rounded">
                            {av.title}
                          </span>
                        )}
                        <span className="text-[8px] uppercase font-bold bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                          {av.type === "centered_popup" ? "Popup Central" : "Barra Superior"}
                        </span>
                      </div>
                      <p className="font-medium text-gray-800 text-xs leading-relaxed mt-1">"{av.message}"</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">Exibição: {av.displayTimeSeconds === 0 ? "Fixo Permanente" : `${av.displayTimeSeconds} segundos`}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setEditingAvisoId(av.id);
                          setEditingAvisoMsg(av.message);
                          setEditingAvisoTime(av.displayTimeSeconds);
                          setEditingAvisoType(av.type || "top_bar");
                          setEditingAvisoImage(av.image || "");
                          setEditingAvisoTitle(av.title || "");
                        }}
                        className="p-1.5 hover:text-[#5A5A40] text-gray-400 hover:bg-[#5A5A40]/10 rounded-lg transition"
                        title="Editar Aviso"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleToggleAviso(av.id)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold ${
                          av.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {av.active ? "ATIVO" : "INATIVO"}
                      </button>
                      
                      {deleteConfirmId === av.id ? (
                        <div className="flex items-center gap-1 bg-red-50 p-1 rounded border border-red-200 animate-pulse">
                          <span className="text-[9px] font-bold text-red-600">Apagar?</span>
                          <button
                            type="button"
                            onClick={() => {
                              handleRemoveAviso(av.id);
                              setDeleteConfirmId(null);
                              triggerNotification(`Aviso popup removido.`);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white px-1.5 py-0.5 rounded text-[8px] font-bold transition"
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-1.5 py-0.5 rounded text-[8px] font-bold transition"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(av.id)}
                          className="p-1.5 hover:text-red-500 text-gray-400 hover:bg-red-50 rounded-lg transition"
                          title="Excluir Aviso"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* PRINTING CONFIGURATION */}
        {activeSubTab === "impressao" && (
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">Layout de Impressão de Cupons Térmicos</h4>

            <div className="grid grid-cols-1 gap-3 max-w-md">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                <label className="block text-[10px] uppercase font-bold text-gray-400">Logomarca do Recibo</label>
                
                {printing.logoUrl ? (
                  <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-100">
                    <img
                      src={printing.logoUrl}
                      alt="Logo Recibo"
                      className="w-16 h-16 object-contain bg-gray-50 rounded-lg p-1 border"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-700">Logo carregada</p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {printing.logoUrl.startsWith("data:") ? "Imagem Base64" : printing.logoUrl}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updatePrintingField("logoUrl", "")}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition"
                      title="Remover Logo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center bg-white hover:border-gray-300 transition">
                    <Camera className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-xs font-bold text-gray-600 text-center">Fazer upload da logo do recibo</p>
                    <p className="text-[10px] text-gray-400 text-center mt-1">Recomendado: PNG/JPG quadrado ou horizontal pequeno</p>
                    <label className="mt-3 cursor-pointer bg-[#5A5A40] text-white hover:bg-[#484833] px-3 py-1.5 rounded-lg text-xs font-bold transition">
                      Selecionar Arquivo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await compressImage(file, 300, 300, 0.7);
                              updatePrintingField("logoUrl", compressed);
                              triggerNotification("Logo do recibo atualizada! 🖨️");
                            } catch (err) {
                              console.error(err);
                              triggerNotification("Erro ao processar logo do recibo", "error");
                            }
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Cabeçalho do Recibo (TIRAR CABEÇALHO can be done by blanking this)</label>
                <textarea
                  value={printing.headerText}
                  onChange={(e) => updatePrintingField("headerText", e.target.value, true)}
                  onBlur={handleBlurSave}
                  className="w-full text-xs font-mono p-2.5 bg-gray-50 border border-[#e0e0d6] rounded-xl h-20"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Rodapé do Recibo</label>
                <textarea
                  value={printing.footerText}
                  onChange={(e) => updatePrintingField("footerText", e.target.value, true)}
                  onBlur={handleBlurSave}
                  className="w-full text-xs font-mono p-2.5 bg-gray-50 border border-[#e0e0d6] rounded-xl h-20"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-xs font-bold text-gray-700">Exibir Cupom de código no recibo?</span>
                <button
                  onClick={() => updatePrintingField("showCouponCode", !printing.showCouponCode)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg ${
                    printing.showCouponCode ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {printing.showCouponCode ? "Sim" : "Não"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECURITY & PASSCODE */}
        {activeSubTab === "seguranca" && (
          <div className="space-y-4 max-w-md">
            <h4 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#5A5A40]" /> Segurança & Código de Acesso
            </h4>
            <p className="text-xs text-gray-500 leading-normal">
              Defina o código de segurança de 4 dígitos para restringir o acesso ao painel de gerenciamento da sua loja. O padrão é <b className="text-gray-700">9310</b>.
            </p>

            <div className="bg-[#fbfbfa] border border-[#e0e0d6] rounded-2xl p-5 space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                  Código de Acesso Atual / Novo Código (4 dígitos):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={passcodeInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setPasscodeInput(val);
                    }}
                    placeholder="Ex: 9310"
                    className="flex-1 text-center font-bold tracking-widest text-lg p-2.5 bg-white border border-[#e0e0d6] rounded-xl focus:outline-none focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40]"
                  />
                  <button
                    onClick={() => {
                      if (passcodeInput.length !== 4) {
                        triggerNotification("O código de acesso precisa ter exatamente 4 dígitos numéricos!", "error");
                        return;
                      }
                      updateLocalState({ adminPasscode: passcodeInput });
                      onUpdateState({ ...localState, adminPasscode: passcodeInput });
                      setHasChanges(false);
                      triggerNotification("Código de acesso atualizado e salvo com sucesso! 🎉");
                    }}
                    className="bg-[#5A5A40] hover:bg-[#484833] text-white px-5 rounded-xl font-bold text-xs transition shadow-sm"
                  >
                    Salvar Código
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 italic">
                  Apenas números são permitidos. Qualquer alteração atualizará o banco de dados e será exigida no próximo acesso.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PWA CONFIGURATION VIEW */}
        {activeSubTab === "pwa" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#5A5A40]" /> Configuração do Aplicativo PWA (Celular)
              </h4>
              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">Ativo</span>
            </div>
            <p className="text-xs text-gray-500 leading-normal">
              O PWA (Progressive Web App) transforma sua loja em um aplicativo instalável diretamente no celular Android ou iOS. Personalize as informações visuais de instalação:
            </p>

            <div className="bg-[#fbfbfa] border border-[#e0e0d6] rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Nome do Aplicativo (PWA Name) *</label>
                  <input
                    type="text"
                    value={pwa?.name || "Mundo Dutra Kids"}
                    onChange={(e) => {
                      const updatedPwa = { ...(pwa || {}), name: e.target.value } as any;
                      updateLocalState({ pwa: updatedPwa }, true);
                    }}
                    onBlur={handleBlurSave}
                    className="w-full text-xs px-3 py-2 bg-white border border-[#e0e0d6] rounded-xl focus:outline-none focus:border-[#5A5A40]"
                    placeholder="Ex: Mundo Dutra Kids"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Nome Curto (Short Name) *</label>
                  <input
                    type="text"
                    value={pwa?.shortName || "Dutra Kids"}
                    onChange={(e) => {
                      const updatedPwa = { ...(pwa || {}), shortName: e.target.value } as any;
                      updateLocalState({ pwa: updatedPwa }, true);
                    }}
                    onBlur={handleBlurSave}
                    className="w-full text-xs px-3 py-2 bg-white border border-[#e0e0d6] rounded-xl focus:outline-none focus:border-[#5A5A40]"
                    placeholder="Ex: Dutra Kids"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Ícone / Logomarca do App (PWA)</label>
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white p-3 rounded-2xl border border-[#e0e0d6]">
                    {(pwa?.logoUrl || landpage?.logoImage) ? (
                      <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-sm">
                        <img 
                          src={pwa?.logoUrl || landpage?.logoImage} 
                          className="max-w-full max-h-full object-contain" 
                          alt="PWA Icon Preview" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 shrink-0">
                        <Camera className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="text"
                        value={pwa?.logoUrl || ""}
                        onChange={(e) => {
                          const updatedPwa = { ...(pwa || {}), logoUrl: e.target.value } as any;
                          updateLocalState({ pwa: updatedPwa });
                        }}
                        className="w-full text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                        placeholder="Cole a URL do ícone ou faça upload..."
                      />
                      <div className="flex gap-2">
                        <label className="cursor-pointer bg-[#5A5A40] hover:bg-[#484833] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition">
                          <Upload className="w-3 h-3" /> Fazer Upload do Ícone
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePwaIconUpload}
                            className="hidden"
                          />
                        </label>
                        {pwa?.logoUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              const updatedPwa = { ...(pwa || {}), logoUrl: "" } as any;
                              updateLocalState({ pwa: updatedPwa });
                            }}
                            className="bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-red-200 transition"
                          >
                            Remover Ícone Customizado
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Cor do Tema de Abertura (Theme Color Hex)</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={pwa?.themeColor || "#5A5A40"}
                      onChange={(e) => {
                        const updatedPwa = { ...(pwa || {}), themeColor: e.target.value } as any;
                        updateLocalState({ pwa: updatedPwa });
                      }}
                      className="w-10 h-9 rounded-xl border border-gray-200 cursor-pointer p-0.5 shrink-0 bg-white"
                    />
                    <input
                      type="text"
                      maxLength={7}
                      value={pwa?.themeColor || "#5A5A40"}
                      onChange={(e) => {
                        const updatedPwa = { ...(pwa || {}), themeColor: e.target.value } as any;
                        updateLocalState({ pwa: updatedPwa });
                      }}
                      className="flex-1 text-xs px-3 py-2 bg-white border border-[#e0e0d6] rounded-xl focus:outline-none font-mono focus:border-[#5A5A40]"
                      placeholder="#5A5A40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Modo de Exibição (Display Mode)</label>
                  <select
                    value={pwa?.displayMode || "standalone"}
                    onChange={(e) => {
                      const updatedPwa = { ...(pwa || {}), displayMode: e.target.value } as any;
                      updateLocalState({ pwa: updatedPwa });
                    }}
                    className="w-full text-xs px-3 py-2 bg-white border border-[#e0e0d6] rounded-xl focus:outline-none"
                  >
                    <option value="standalone">Standalone (Sem barras do navegador)</option>
                    <option value="fullscreen">Fullscreen (Tela Cheia Imersiva)</option>
                    <option value="browser">Browser (Abas do Navegador)</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-4">
                {hasChanges && (
                  <button
                    type="button"
                    onClick={handleDiscardChanges}
                    className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl text-xs font-bold transition"
                  >
                    Descartar Rascunho
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  className="bg-[#5A5A40] hover:bg-[#484833] text-white px-5 py-2 rounded-xl font-bold text-xs transition shadow-sm flex items-center gap-1.5"
                >
                  💾 Salvar Configurações
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Floating Draft State Footer */}
        {hasChanges && (
          <div className="sticky bottom-4 left-4 right-4 bg-amber-50 border border-amber-200 shadow-xl rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 z-50 mt-6 animate-pulse-subtle">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-xs font-bold text-amber-900">Você tem alterações não salvas!</p>
                <p className="text-[10px] text-amber-700">As alterações estão salvas localmente como rascunho temporário.</p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleDiscardChanges}
                className="flex-1 sm:flex-none text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-4 py-2 rounded-xl transition"
              >
                Descartar Rascunho
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                className="flex-1 sm:flex-none text-xs font-bold text-white bg-[#5A5A40] hover:bg-[#484833] px-5 py-2 rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                💾 Salvar Todas as Configurações
              </button>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
