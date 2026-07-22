import React, { useState, useMemo } from "react";
import { 
  Plus, Minus, X, ShoppingCart, User, MessageSquare, 
  MapPin, Phone, CreditCard, Search, RotateCcw, Check, Sparkles 
} from "lucide-react";
import { Product, SystemState, Order, OrderItem } from "../types";

interface AdminPDVProps {
  state: SystemState;
  onAddOrder: (newOrder: Order) => void;
}

export default function AdminPDV({ state, onAddOrder }: AdminPDVProps) {
  const { products, categories, shippingNeighborhoods, shippingType, shippingFixedCost, promotions } = state;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Cart/PDV register state
  const [pdvCart, setPdvCart] = useState<{ product: Product; size: string; color?: string; colorHex?: string; quantity: number }[]>([]);

  // Client info form
  const [clientName, setClientName] = useState("");
  const [clientWhatsapp, setClientWhatsapp] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Pix" | "Cartão de Crédito" | "Cartão de Débito" | "Boleto" | "Dinheiro">("Pix");
  const [cashAmountGiven, setCashAmountGiven] = useState<string>("");
  const [deliveryType, setDeliveryType] = useState<"retirada" | "entrega">("retirada");
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string>("");
  const [customObservations, setCustomObservations] = useState("");
  const [promoCouponCode, setPromoCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; value: number; type: "cupom" | "desconto" } | null>(null);

  // Filtered searchable items
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (p.status !== "ativo") return false;
      if (selectedCategory !== "all") {
        const isMatch = p.categoryId === selectedCategory || 
                        categories.find(c => c.id === selectedCategory)?.name === p.categoryId ||
                        categories.find(c => c.name === selectedCategory)?.id === p.categoryId;
        if (!isMatch) return false;
      }

      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query);
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  // PDV calculation math
  const subtotal = useMemo(() => {
    return pdvCart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [pdvCart]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "cupom") {
      return (subtotal * appliedCoupon.value) / 100;
    } else {
      return Math.min(subtotal, appliedCoupon.value);
    }
  }, [appliedCoupon, subtotal]);

  const shippingCost = useMemo(() => {
    if (deliveryType === "retirada") return 0;
    if (shippingType === "fixo") return shippingFixedCost;
    if (shippingType === "bairro") {
      const neigh = shippingNeighborhoods.find(n => n.id === selectedNeighborhoodId);
      return neigh ? neigh.cost : 0;
    }
    return 0; // Combinar com o cliente
  }, [deliveryType, shippingType, selectedNeighborhoodId, shippingNeighborhoods, shippingFixedCost]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + shippingCost);
  }, [subtotal, discountAmount, shippingCost]);

  const changeAmount = useMemo(() => {
    if (paymentMethod !== "Dinheiro") return 0;
    const givenNum = parseFloat(cashAmountGiven) || 0;
    return Math.max(0, givenNum - total);
  }, [paymentMethod, cashAmountGiven, total]);

  // Add Item with Size Selection inside PDV register
  const handleAddProductToPdv = (prod: Product, size: string, color?: string, colorHex?: string) => {
    // Check stock for size
    const sizeStock = prod.sizes.find(s => s.size === size && (s.color || "") === (color || ""));
    const availableStock = sizeStock ? sizeStock.stock : 0;

    const existingIndex = pdvCart.findIndex(
      item => item.product.id === prod.id && 
              item.size === size && 
              (item.color || "") === (color || "")
    );
    const currentQty = existingIndex !== -1 ? pdvCart[existingIndex].quantity : 0;

    if (currentQty + 1 > availableStock) {
      alert(`Desculpe! Quantidade excede o estoque disponível para a variação ${size}${color ? ` (${color})` : ""}. Estoque atual: ${availableStock}`);
      return;
    }

    if (existingIndex !== -1) {
      const updated = [...pdvCart];
      updated[existingIndex].quantity += 1;
      setPdvCart(updated);
    } else {
      setPdvCart([...pdvCart, { product: prod, size, color, colorHex, quantity: 1 }]);
    }
  };

  const handleUpdatePdvQty = (index: number, delta: number) => {
    const updated = [...pdvCart];
    const item = updated[index];
    const sizeStock = item.product.sizes.find(
      s => s.size === item.size && (s.color || "") === (item.color || "")
    );
    const availableStock = sizeStock ? sizeStock.stock : 0;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else if (newQty > availableStock) {
      alert(`Erro: Quantidade excede o estoque físico disponível (${availableStock} un).`);
      return;
    } else {
      updated[index].quantity = newQty;
    }
    setPdvCart(updated);
  };

  const handleRemovePdvItem = (index: number) => {
    const updated = [...pdvCart];
    updated.splice(index, 1);
    setPdvCart(updated);
  };

  const handleApplyCoupon = () => {
    const promo = promotions.find(p => p.code.toUpperCase() === promoCouponCode.trim().toUpperCase() && p.active);
    if (promo) {
      setAppliedCoupon({
        code: promo.code,
        value: promo.value,
        type: promo.type
      });
      alert(`Desconto do cupom ${promo.code} aplicado com sucesso!`);
    } else {
      alert("Cupom não encontrado ou está inativo no momento.");
    }
  };

  // Clear current set selection
  const handleClearPdvRegister = () => {
    if (confirm("Deseja mesmo limpar todo o caixa e seleção de produtos atuais?")) {
      setPdvCart([]);
      setClientName("");
      setClientWhatsapp("");
      setCustomObservations("");
      setAppliedCoupon(null);
      setPromoCouponCode("");
      setCashAmountGiven("");
      setDeliveryType("retirada");
      setSelectedNeighborhoodId("");
    }
  };

  // Submit PDV Sale
  const handleCheckoutPdvSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (pdvCart.length === 0) {
      alert("Adicione pelo menos um item ao caixa.");
      return;
    }

    // Auto prepend +55 to phone if not formatted
    let formattedPhone = clientWhatsapp.replace(/\D/g, "");
    if (formattedPhone.length > 0) {
      if (!formattedPhone.startsWith("55")) {
        formattedPhone = "55" + formattedPhone;
      }
      formattedPhone = "+" + formattedPhone;
    } else {
      formattedPhone = "+5500000000000"; // default placeholder
    }

    const orderItems: OrderItem[] = pdvCart.map(item => ({
      id: `oi-${Math.random().toString(36).substr(2, 9)}`,
      productId: item.product.id,
      productName: item.product.name,
      productCode: item.product.code,
      selectedSize: item.size,
      selectedColor: item.color,
      quantity: item.quantity,
      unitPrice: item.product.price
    }));

    const neighborhoodName = shippingType === "bairro"
      ? shippingNeighborhoods.find(n => n.id === selectedNeighborhoodId)?.neighborhood || "Geral"
      : "";

    const shippingText = deliveryType === "retirada"
      ? "Retirada Balcão / Retirada"
      : shippingType === "bairro"
      ? `Entrega Bairro: ${neighborhoodName}`
      : shippingType === "combinar"
      ? "Entrega a Combinar"
      : "Retirada Balcão / Fixo";

    const finalNotes = customObservations ? `${shippingText} | Obs: ${customObservations}` : shippingText;

    const code = `PED-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: `order-${Date.now()}`,
      code,
      date: new Date().toISOString(),
      clientName: clientName.trim() || "Cliente Balcão PDV",
      clientWhatsapp: formattedPhone,
      paymentMethod,
      items: orderItems,
      subtotal,
      shippingCost,
      shippingType: deliveryType === "retirada" ? "retirada" : shippingType,
      shippingDetails: finalNotes,
      total,
      status: "aprovado", // Sales directly in PDV are immediately auto-approved!
      observations: finalNotes,
      cashAmountGiven: paymentMethod === "Dinheiro" ? (parseFloat(cashAmountGiven) || total) : undefined,
      cashChange: paymentMethod === "Dinheiro" ? changeAmount : undefined,
      deliveryType: deliveryType
    };

    onAddOrder(newOrder);

    // Clean up register
    setPdvCart([]);
    setClientName("");
    setClientWhatsapp("");
    setCustomObservations("");
    setAppliedCoupon(null);
    setPromoCouponCode("");
    setCashAmountGiven("");
    setDeliveryType("retirada");
    setSelectedNeighborhoodId("");
    alert(`Venda PDV faturada com sucesso! Código Gerado: ${code}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Catalog Grid Choice (Left 2 Columns) */}
      <div className="md:col-span-2 bg-white rounded-3xl border border-[#e0e0d6] p-5 shadow-sm flex flex-col justify-between">
        
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#f0f0e8] pb-4">
            <h3 className="font-extrabold text-gray-900 flex items-center gap-2 text-sm">
              <ShoppingCart className="w-5 h-5 text-[#5A5A40]" /> Caixa Registradora PDV Fast
            </h3>

            {/* Quick search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Digitar nome ou código do produto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#f5f5f0]/50 rounded-xl border border-[#e0e0d6] focus:outline-none focus:border-[#5A5A40] text-xs"
              />
            </div>
          </div>

          {/* Categories select */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition ${
                selectedCategory === "all"
                  ? "bg-[#5A5A40] text-white shadow-sm"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}
            >
              🏷️ Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition ${
                  selectedCategory === cat.id
                    ? "bg-[#5A5A40] text-white shadow-sm"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Active List of Products */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1 no-scrollbar">
            {filteredProducts.map((prod) => {
              const totalStock = prod.sizes.reduce((s, x) => s + x.stock, 0);

              return (
                <div 
                  key={prod.id} 
                  className="bg-gray-50 border border-gray-100 p-3 rounded-2xl flex gap-3 hover:border-[#5A5A40]/40 transition"
                >
                  <img src={prod.image} className="w-12 h-15 rounded-lg object-contain bg-white p-0.5 border" alt="" />
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <p className="font-extrabold text-xs text-gray-900 truncate leading-tight">{prod.name}</p>
                        <span className="text-[9px] font-mono bg-gray-200 px-1 py-0.2 rounded text-gray-600 shrink-0">{prod.code}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">Preço: R$ {prod.price.toFixed(2)}</p>
                    </div>

                    {/* Choose available sizes grid directly */}
                    <div className="mt-2">
                      <p className="text-[8px] uppercase tracking-wider font-extrabold text-gray-400 mb-1">Selecione o tamanho para vender:</p>
                      <div className="flex flex-wrap gap-1">
                        {prod.sizes.map((s, sIdx) => (
                          <button
                            key={sIdx}
                            disabled={s.stock <= 0}
                            onClick={() => handleAddProductToPdv(prod, s.size, s.color, s.colorHex)}
                            title={`Estoque disponível: ${s.stock}${s.color ? ` (${s.color})` : ""}`}
                            className={`px-2 py-0.5 text-[9px] rounded font-bold border transition flex items-center gap-1 ${
                              s.stock <= 0
                                ? "bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed line-through"
                                : "bg-white border-gray-200 hover:border-[#5A5A40] text-gray-700"
                            }`}
                          >
                            {s.colorHex && (
                              <span 
                                className="w-1.5 h-1.5 rounded-full border border-black/10 shrink-0" 
                                style={{ backgroundColor: s.colorHex }}
                              />
                            )}
                            <span>{s.size}</span>
                            <span className="text-[8px] opacity-60 font-mono">({s.stock})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic bottom checkout alerts */}
        <div className="border-t border-gray-100 pt-4 mt-4 flex justify-between items-center text-xs text-gray-400">
          <span>Selecione tamanhos diretamente para adicionar na sacola de vendas.</span>
          <button
            onClick={handleClearPdvRegister}
            className="text-red-500 hover:text-red-700 underline text-[11px] font-bold flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> APAGAR TODOS OS CONJUNTOS SELEÇÃO
          </button>
        </div>
      </div>

      {/* PDV Customer Checkout details (Right 1 Column) */}
      <div className="bg-white rounded-3xl border border-[#e0e0d6] p-5 shadow-sm flex flex-col justify-between">
        <form onSubmit={handleCheckoutPdvSale} className="space-y-4">
          <div className="border-b border-[#f0f0e8] pb-3 flex justify-between items-center">
            <h4 className="font-bold text-gray-800 text-sm">Resumo da Venda</h4>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded font-extrabold uppercase">
              NOVO CAIXA
            </span>
          </div>

          {/* Cart items list in PDV */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
            {pdvCart.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Nenhum produto selecionado para o caixa.</p>
              </div>
            ) : (
              pdvCart.map((item, idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-100 p-2 rounded-xl flex gap-2 items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-extrabold text-gray-900 truncate">{item.product.name}</p>
                    <p className="text-[9px] text-[#5A5A40] font-bold">Tam: {item.size}{item.color ? ` (${item.color})` : ""} • R$ {item.product.price.toFixed(2)}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdatePdvQty(idx, -1)}
                      className="w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleUpdatePdvQty(idx, 1)}
                      className="w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-xs"
                    >
                      +
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemovePdvItem(idx)}
                      className="p-1 hover:text-red-500 text-gray-300 ml-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Coupon discount codes */}
          {pdvCart.length > 0 && (
            <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex gap-2">
              <input
                type="text"
                placeholder="Código do cupom..."
                value={promoCouponCode}
                onChange={(e) => setPromoCouponCode(e.target.value.toUpperCase())}
                className="flex-1 text-[10px] uppercase font-mono px-2 py-1.5 bg-white border border-[#e0e0d6] rounded-lg focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="bg-[#5A5A40] text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
              >
                Aplicar
              </button>
            </div>
          )}

          {/* Client Info form */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h5 className="font-bold text-gray-700 text-xs">Identificação do Cliente</h5>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] uppercase font-bold text-gray-400 mb-0.5">Nome do Cliente</label>
                <input
                  type="text"
                  placeholder="Ex: Maria"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-gray-400 mb-0.5">WhatsApp (+55 auto)</label>
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={clientWhatsapp}
                  onChange={(e) => setClientWhatsapp(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none"
                />
              </div>
            </div>

            {/* Tipo de Pedido: Retirada ou Entrega */}
            <div>
              <label className="block text-[9px] uppercase font-bold text-gray-400 mb-1">Tipo de Entrega / Retirada</label>
              <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setDeliveryType("retirada")}
                  className={`flex-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all ${
                    deliveryType === "retirada"
                      ? "bg-[#5A5A40] text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  🛍️ Retirada
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType("entrega")}
                  className={`flex-1 py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all ${
                    deliveryType === "entrega"
                      ? "bg-[#5A5A40] text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  🚚 Entrega / Delivery
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[9px] uppercase font-bold text-gray-400 mb-0.5">Método de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none focus:border-[#5A5A40]"
              >
                <option value="Pix">🔑 Pix</option>
                <option value="Dinheiro">💵 Dinheiro</option>
                <option value="Cartão de Crédito">💳 Cartão de Crédito</option>
                <option value="Cartão de Débito">💳 Cartão de Débito</option>
                <option value="Boleto">📄 Boleto Bancário</option>
              </select>
            </div>

            {paymentMethod === "Dinheiro" && (
              <div className="bg-green-50 p-3 rounded-2xl border border-green-100 space-y-2">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-green-700 mb-0.5">Valor em Dinheiro Recebido *</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-green-600">R$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={total.toFixed(2)}
                      value={cashAmountGiven}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setCashAmountGiven(e.target.value.replace(",", "."))}
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-green-200 rounded-xl focus:outline-none text-green-900 font-bold font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-green-700 font-semibold">Troco a Devolver:</span>
                  <span className="text-base font-black text-green-800 font-mono">
                    R$ {changeAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {deliveryType === "entrega" && shippingType === "bairro" && (
              <div>
                <label className="block text-[9px] uppercase font-bold text-gray-400 mb-0.5">Entrega Bairro</label>
                <select
                  value={selectedNeighborhoodId}
                  onChange={(e) => setSelectedNeighborhoodId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none"
                >
                  <option value="">Retirada Balcão (R$ 0.00)</option>
                  {shippingNeighborhoods.map(n => (
                    <option key={n.id} value={n.id}>{n.neighborhood} (+R$ {n.cost.toFixed(2)})</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[9px] uppercase font-bold text-gray-400 mb-0.5">Observações Livres do Pedido / Entrega</label>
              <textarea
                placeholder="Detalhes para entrega, observações do produto..."
                value={customObservations}
                onChange={(e) => setCustomObservations(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none h-12 resize-none"
              />
            </div>
          </div>

          {/* Sum total section */}
          <div className="bg-gray-50 p-3 rounded-2xl space-y-1.5 text-xs text-gray-600 border border-gray-100">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono">R$ {subtotal.toFixed(2)}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-pink-600">
                <span>Cupom ({appliedCoupon.code}):</span>
                <span className="font-mono">-R$ {discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Entrega/Frete:</span>
              <span className="font-mono">R$ {shippingCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-black text-gray-900 text-sm border-t border-gray-200 pt-1.5 mt-1.5">
              <span>TOTAL DO CAIXA:</span>
              <span className="text-[#5A5A40]">R$ {total.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={pdvCart.length === 0}
            className="w-full bg-[#5A5A40] hover:bg-[#484833] text-white py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Check className="w-4 h-4" /> Lançar Venda Aprovada PDV ⚡
          </button>
        </form>
      </div>

    </div>
  );
}
