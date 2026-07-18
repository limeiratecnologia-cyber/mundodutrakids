import React, { useState } from "react";
import { 
  Truck, Tag, AlertOctagon, Printer, LayoutTemplate, 
  Plus, Trash2, Edit, Check, Settings, Eye, Camera, Lock, Smartphone
} from "lucide-react";
import { 
  SystemState, NeighborhoodShipping, Promotion, Aviso, 
  LandpageConfig, PrintingConfig 
} from "../types";

interface AdminMinhaLojaProps {
  state: SystemState;
  onUpdateState: (newState: Partial<SystemState>) => void;
}

export default function AdminMinhaLoja({ state, onUpdateState }: AdminMinhaLojaProps) {
  const { 
    shippingNeighborhoods, shippingType, shippingFixedCost, 
    promotions, avisos, landpage, printing 
  } = state;

  const [activeSubTab, setActiveSubTab] = useState<"frete" | "promocoes" | "avisos" | "impressao" | "landpage" | "seguranca" | "pwa">("landpage");
  const [passcodeInput, setPasscodeInput] = useState(state.adminPasscode || "9310");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

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

  // --- Avisos State ---
  const [newAvisoMsg, setNewAvisoMsg] = useState("");
  const [newAvisoTime, setNewAvisoTime] = useState(10);

  // --- Handlers Frete ---
  const handleAddNeighborhood = () => {
    if (!newNeighborhood.trim()) return;
    const item: NeighborhoodShipping = {
      id: `neigh-${Date.now()}`,
      neighborhood: newNeighborhood.trim(),
      cost: newNeighborhoodCost
    };
    onUpdateState({
      shippingNeighborhoods: [...shippingNeighborhoods, item]
    });
    setNewNeighborhood("");
    setNewNeighborhoodCost(0);
  };

  const handleRemoveNeighborhood = (id: string) => {
    onUpdateState({
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
      active: true
    };
    onUpdateState({
      promotions: [...promotions, item]
    });
    setNewPromoTitle("");
    setNewPromoCode("");
    setNewPromoValue(10);
  };

  const handleTogglePromo = (id: string) => {
    onUpdateState({
      promotions: promotions.map(p => p.id === id ? { ...p, active: !p.active } : p)
    });
  };

  const handleRemovePromo = (id: string) => {
    onUpdateState({
      promotions: promotions.filter(p => p.id !== id)
    });
  };

  // --- Handlers Avisos ---
  const handleAddAviso = () => {
    if (!newAvisoMsg.trim()) return;
    const item: Aviso = {
      id: `aviso-${Date.now()}`,
      message: newAvisoMsg.trim(),
      active: true,
      displayTimeSeconds: newAvisoTime,
      createdAt: new Date().toISOString()
    };
    onUpdateState({
      avisos: [...avisos, item]
    });
    setNewAvisoMsg("");
    setNewAvisoTime(10);
    triggerNotification("Popup aviso cadastrado com sucesso!");
  };

  const handleToggleAviso = (id: string) => {
    onUpdateState({
      avisos: avisos.map(a => a.id === id ? { ...a, active: !a.active } : a)
    });
  };

  const handleRemoveAviso = (id: string) => {
    onUpdateState({
      avisos: avisos.filter(a => a.id !== id)
    });
  };

  // --- Helper to update Landpage sub-fields ---
  const updateLandpageField = (field: keyof LandpageConfig, value: any) => {
    onUpdateState({
      landpage: {
        ...landpage,
        [field]: value
      }
    });
  };

  // --- Helper to update Printing sub-fields ---
  const updatePrintingField = (field: keyof PrintingConfig, value: any) => {
    onUpdateState({
      printing: {
        ...printing,
        [field]: value
      }
    });
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
                  onChange={(e) => updateLandpageField("heroTitle", e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Frase de Boas-vindas</label>
                <input
                  type="text"
                  value={landpage.welcomeMessage}
                  onChange={(e) => updateLandpageField("welcomeMessage", e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-gray-50 border border-[#e0e0d6] rounded-xl"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Slogan Principal (Hero Subtitle)</label>
                <textarea
                  value={landpage.heroSubtitle}
                  onChange={(e) => updateLandpageField("heroSubtitle", e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-gray-50 border border-[#e0e0d6] rounded-xl h-16 resize-none"
                />
              </div>

              {/* Logo / Banner uploads */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Link Foto da Logomarca (Proporção Logo)</label>
                <input
                  type="text"
                  value={landpage.logoImage}
                  onChange={(e) => updateLandpageField("logoImage", e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Link Banner Principal (Exibição Real Sem Cortes)</label>
                <input
                  type="text"
                  value={landpage.bannerImage}
                  onChange={(e) => updateLandpageField("bannerImage", e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none"
                />
              </div>

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
                  onChange={() => onUpdateState({ shippingType: "bairro" })}
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
                  onChange={() => onUpdateState({ shippingType: "fixo" })}
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
                  onChange={() => onUpdateState({ shippingType: "combinar" })}
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
                  onChange={(e) => onUpdateState({ shippingFixedCost: parseFloat(e.target.value) || 0 })}
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

            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-4 rounded-2xl border border-gray-200">
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
              {promotions.map((promo) => (
                <div key={promo.id} className="bg-gray-50 border border-gray-100 p-3 rounded-2xl flex justify-between items-center text-xs">
                  <div>
                    <p className="font-extrabold text-gray-900">{promo.title}</p>
                    <p className="text-[10px] text-gray-400 font-mono">Código: {promo.code} | Desconto: {promo.value}%</p>
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
              ))}
            </div>

          </div>
        )}

        {/* AVISOS E POP-UPS LIST */}
        {activeSubTab === "avisos" && (
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">Avisos no Meio da Tela e Promoções Popups</h4>

            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
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
              {avisos.map((av) => (
                <div key={av.id} className="bg-gray-50 border border-gray-100 p-3 rounded-2xl flex justify-between items-center text-xs">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-medium text-gray-800 text-xs leading-relaxed">"{av.message}"</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">Exibição: {av.displayTimeSeconds === 0 ? "Fixo Permanente" : `${av.displayTimeSeconds} segundos`}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
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
              ))}
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
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              updatePrintingField("logoUrl", reader.result as string);
                            };
                            reader.readAsDataURL(file);
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
                  onChange={(e) => updatePrintingField("headerText", e.target.value)}
                  className="w-full text-xs font-mono p-2.5 bg-gray-50 border border-[#e0e0d6] rounded-xl h-20"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Rodapé do Recibo</label>
                <textarea
                  value={printing.footerText}
                  onChange={(e) => updatePrintingField("footerText", e.target.value)}
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
                      onUpdateState({ adminPasscode: passcodeInput });
                      triggerNotification("Código de acesso atualizado e salvo no banco de dados com sucesso!");
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
                    value={state.pwa?.name || "Mundo Dutra Kids"}
                    onChange={(e) => {
                      const updatedPwa = { ...(state.pwa || {}), name: e.target.value } as any;
                      onUpdateState({ pwa: updatedPwa });
                    }}
                    className="w-full text-xs px-3 py-2 bg-white border border-[#e0e0d6] rounded-xl focus:outline-none focus:border-[#5A5A40]"
                    placeholder="Ex: Mundo Dutra Kids"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Nome Curto (Short Name) *</label>
                  <input
                    type="text"
                    value={state.pwa?.shortName || "Dutra Kids"}
                    onChange={(e) => {
                      const updatedPwa = { ...(state.pwa || {}), shortName: e.target.value } as any;
                      onUpdateState({ pwa: updatedPwa });
                    }}
                    className="w-full text-xs px-3 py-2 bg-white border border-[#e0e0d6] rounded-xl focus:outline-none focus:border-[#5A5A40]"
                    placeholder="Ex: Dutra Kids"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Link para a Logomarca do App (Ícone PWA)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={state.pwa?.logoUrl || ""}
                      onChange={(e) => {
                        const updatedPwa = { ...(state.pwa || {}), logoUrl: e.target.value } as any;
                        onUpdateState({ pwa: updatedPwa });
                      }}
                      className="flex-1 text-xs px-3 py-2 bg-white border border-[#e0e0d6] rounded-xl focus:outline-none focus:border-[#5A5A40]"
                      placeholder="https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=200&auto=format&fit=crop"
                    />
                    {(state.pwa?.logoUrl || state.landpage?.logoImage) && (
                      <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-sm">
                        <img 
                          src={state.pwa?.logoUrl || state.landpage?.logoImage} 
                          className="max-w-full max-h-full object-contain" 
                          alt="PWA Icon Preview" 
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Cor do Tema de Abertura (Theme Color Hex)</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={state.pwa?.themeColor || "#5A5A40"}
                      onChange={(e) => {
                        const updatedPwa = { ...(state.pwa || {}), themeColor: e.target.value } as any;
                        onUpdateState({ pwa: updatedPwa });
                      }}
                      className="w-10 h-9 rounded-xl border border-gray-200 cursor-pointer p-0.5 shrink-0 bg-white"
                    />
                    <input
                      type="text"
                      maxLength={7}
                      value={state.pwa?.themeColor || "#5A5A40"}
                      onChange={(e) => {
                        const updatedPwa = { ...(state.pwa || {}), themeColor: e.target.value } as any;
                        onUpdateState({ pwa: updatedPwa });
                      }}
                      className="flex-1 text-xs px-3 py-2 bg-white border border-[#e0e0d6] rounded-xl focus:outline-none font-mono focus:border-[#5A5A40]"
                      placeholder="#5A5A40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Modo de Exibição (Display Mode)</label>
                  <select
                    value={state.pwa?.displayMode || "standalone"}
                    onChange={(e) => {
                      const updatedPwa = { ...(state.pwa || {}), displayMode: e.target.value } as any;
                      onUpdateState({ pwa: updatedPwa });
                    }}
                    className="w-full text-xs px-3 py-2 bg-white border border-[#e0e0d6] rounded-xl focus:outline-none"
                  >
                    <option value="standalone">Standalone (Sem barras do navegador)</option>
                    <option value="fullscreen">Fullscreen (Tela Cheia Imersiva)</option>
                    <option value="browser">Browser (Abas do Navegador)</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    triggerNotification("Configurações do Aplicativo PWA salvas com sucesso!");
                  }}
                  className="bg-[#5A5A40] hover:bg-[#484833] text-white px-5 py-2 rounded-xl font-bold text-xs transition shadow-sm"
                >
                  Salvar PWA
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
