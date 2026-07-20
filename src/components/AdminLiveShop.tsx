import React, { useState, useEffect } from "react";
import { Radio, Play, Square, Check, MessageSquare, Users, Link as LinkIcon, Ticket, Tag } from "lucide-react";
import { SystemState, LiveConfig } from "../types";

interface AdminLiveShopProps {
  state: SystemState;
  onUpdateState: (newState: Partial<SystemState>) => void;
}

export default function AdminLiveShop({ state, onUpdateState }: AdminLiveShopProps) {
  const { live, products } = state;

  const [youtubeUrl, setYoutubeUrl] = useState(live.youtubeUrl || "");
  const [highlightedProductId, setHighlightedProductId] = useState(live.highlightedProductId || "");

  // Local coupon states
  const [couponActive, setCouponActive] = useState(live.couponActive);
  const [couponCode, setCouponCode] = useState(live.couponCode || "");
  const [couponValue, setCouponValue] = useState(live.couponValue || "");
  const [couponMinutes, setCouponMinutes] = useState(Math.round((live.couponTimeLeft || 1200) / 60));

  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const triggerNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Sync state changes if they come from another admin tab or Firebase
  useEffect(() => {
    setCouponActive(live.couponActive);
    setCouponCode(live.couponCode);
    setCouponValue(live.couponValue);
    setCouponMinutes(Math.round((live.couponTimeLeft || 1200) / 60));
  }, [live.couponActive, live.couponCode, live.couponValue, live.couponTimeLeft]);

  const handleStartLive = () => {
    if (!youtubeUrl.trim()) {
      triggerNotification("Por favor, cole um link válido do YouTube para iniciar a transmissão!", "error");
      return;
    }
    const update: LiveConfig = {
      ...live,
      active: true,
      youtubeUrl: youtubeUrl.trim(),
      highlightedProductId: highlightedProductId || undefined,
      spectatorsCount: 142
    };
    onUpdateState({ live: update });
    triggerNotification("Live Shop iniciada com sucesso! Os clientes na loja verão a transmissão em tempo real. 🔴");
  };

  const handleStopLive = () => {
    const update: LiveConfig = {
      ...live,
      active: false,
      youtubeUrl: youtubeUrl.trim(),
      highlightedProductId: undefined,
      spectatorsCount: 0
    };
    onUpdateState({ live: update });
    triggerNotification("Live Shop encerrada com sucesso!");
  };

  const handleUpdateHighlight = (prodId: string) => {
    const nextProd = highlightedProductId === prodId ? "" : prodId;
    setHighlightedProductId(nextProd);
    onUpdateState({
      live: {
        ...live,
        highlightedProductId: nextProd || undefined
      }
    });
    triggerNotification(nextProd ? "Produto destacado na transmissão! 🌟" : "Destaque de produto removido.");
  };

  const handleSaveCouponSettings = (activeVal: boolean) => {
    const updated: LiveConfig = {
      ...live,
      couponActive: activeVal,
      couponCode: couponCode.trim().toUpperCase() || "LIVEOFF",
      couponValue: couponValue.trim() || "10% OFF",
      couponTimeLeft: (Number(couponMinutes) || 20) * 60
    };
    onUpdateState({ live: updated });
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-2 border text-xs font-bold transition-all duration-300 ${
          notification.type === "success" 
            ? "bg-green-50 border-green-200 text-green-800" 
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {notification.type === "success" ? "🎉" : "⚠️"} {notification.message}
        </div>
      )}
      
      {/* Configuration panel */}
      <div className="bg-white p-5 rounded-3xl border border-[#e0e0d6] shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-extrabold text-gray-900 text-sm">Painel do Diretor - Live Shop Mundo Dutra</h3>
            <p className="text-xs text-gray-500">Transmita ao vivo do seu YouTube para a loja e destaque produtos da sua grade.</p>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            live.active ? "bg-red-100 text-red-600 animate-pulse" : "bg-gray-100 text-gray-500"
          }`}>
            <Radio className="w-4 h-4" /> {live.active ? "NO AR" : "OFFLINE"}
          </span>
        </div>

        {/* Form URL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase font-bold text-gray-400">Link de Transmissão do YouTube</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                disabled={live.active}
                className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none disabled:opacity-50"
              />
              {live.active ? (
                <button
                  type="button"
                  onClick={handleStopLive}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
                >
                  <Square className="w-4 h-4" /> Parar Live
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartLive}
                  className="bg-[#5A5A40] hover:bg-[#484833] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
                >
                  <Play className="w-4 h-4" /> Iniciar Live
                </button>
              )}
            </div>
          </div>

          {/* Active stats preview */}
          {live.active && (
            <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 flex justify-between items-center">
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-red-600 font-extrabold block">Transmissão em andamento</span>
                <p className="text-xs text-gray-700 font-medium">Os clientes assistem seu vídeo do YouTube enquanto compram.</p>
              </div>

              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-gray-400">Público Estimado</p>
                <div className="flex items-center gap-1 text-red-600 justify-end font-extrabold mt-0.5">
                  <Users className="w-4 h-4" /> {live.spectatorsCount} online
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configure Live Discount Coupon */}
      <div className="bg-white p-5 rounded-3xl border border-[#e0e0d6] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-100 pb-3 gap-2">
          <div>
            <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-pink-500" /> Cupom de Desconto da Live
            </h4>
            <p className="text-xs text-gray-500">Controle a exibição de um cupom promocional exclusivo na loja e no player da Live.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Exibir Cupom:</span>
            <button
              type="button"
              onClick={() => {
                const nextVal = !couponActive;
                setCouponActive(nextVal);
                handleSaveCouponSettings(nextVal);
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                couponActive ? "bg-green-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  couponActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className={`text-xs font-extrabold ${couponActive ? "text-green-600" : "text-gray-400"}`}>
              {couponActive ? "ATIVO" : "INATIVO"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase font-bold text-gray-400">Código do Cupom</label>
            <input
              type="text"
              placeholder="Ex: LIVE15"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none focus:border-[#5A5A40]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase font-bold text-gray-400">Desconto / Valor</label>
            <input
              type="text"
              placeholder="Ex: 15% OFF ou R$ 10"
              value={couponValue}
              onChange={(e) => setCouponValue(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none focus:border-[#5A5A40]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase font-bold text-gray-400">Duração (Minutos)</label>
            <input
              type="number"
              placeholder="Ex: 20"
              value={couponMinutes}
              onChange={(e) => setCouponMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none focus:border-[#5A5A40]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => {
              handleSaveCouponSettings(couponActive);
              triggerNotification("Cupom de desconto salvo e transmitido com sucesso! 🎫");
            }}
            className="bg-[#5A5A40] hover:bg-[#484833] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm hover:scale-102 active:scale-98"
          >
            <Check className="w-4 h-4" /> Salvar Configurações do Cupom
          </button>
        </div>
      </div>

      {/* Select Product to Highlight during the show */}
      <div className="bg-white p-5 rounded-3xl border border-[#e0e0d6] shadow-sm space-y-4">
        <div>
          <h4 className="font-bold text-gray-900 text-sm">Selecione o Produto para Destacar na Tela do Cliente:</h4>
          <p className="text-xs text-gray-500">Ao clicar, um banner flutuante interativo de compra imediata aparecerá por cima do vídeo da Live Shop do cliente.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {products.filter(p => p.status === "ativo").map((prod) => {
            const isHighlighted = highlightedProductId === prod.id;

            return (
              <div
                key={prod.id}
                onClick={() => handleUpdateHighlight(prod.id)}
                className={`p-3 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                  isHighlighted 
                    ? "bg-[#5A5A40]/10 border-[#5A5A40]" 
                    : "bg-gray-50 border-gray-100 hover:border-gray-300"
                }`}
              >
                <img src={prod.image} className="w-10 h-13 rounded-lg object-cover bg-gray-200 shrink-0" alt="" />
                
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate text-gray-900">{prod.name}</p>
                  <p className="text-[10px] text-gray-500 font-medium">R$ {prod.price.toFixed(2)}</p>
                  
                  {isHighlighted && (
                    <span className="inline-block mt-1 bg-[#5A5A40] text-white text-[8px] uppercase tracking-wider px-1.5 py-0.2 rounded font-extrabold animate-bounce">
                      Destacado no Vídeo 🌟
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
