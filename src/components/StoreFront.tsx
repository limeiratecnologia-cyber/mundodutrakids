import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShoppingBag, Search, Tag, Eye, Heart, HelpCircle, 
  ChevronRight, ChevronLeft, Radio, ShoppingCart, Plus, Minus, X, 
  Send, Sparkles, MessageCircle, AlertCircle, Sparkle, Percent, MapPin, Trash2
} from "lucide-react";
import { SystemState, Product, Order, OrderItem, Aviso } from "../types";
import ManequimVirtual from "./ManequimVirtual";
import YoutubeEmbed from "./YoutubeEmbed";
import FloatingParticles from "./FloatingParticles";
import PwaInstallPrompt from "./PwaInstallPrompt";

interface StoreFrontProps {
  state: SystemState;
  onPlaceOrder: (newOrder: Order) => void;
  onBackToAdmin: () => void;
}

export default function StoreFront({ state, onPlaceOrder, onBackToAdmin }: StoreFrontProps) {
  const { products, categories, landpage, shippingNeighborhoods, shippingType, shippingFixedCost, promotions, avisos, live } = state;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string>("all");
  
  // Cart state
  const [cart, setCart] = useState<{ product: Product; size: string; color?: string; colorHex?: string; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "details">("cart");

  // Client Details Form
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<"Pix" | "Cartão de Crédito" | "Cartão de Débito" | "Boleto">("Pix");
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string>("");
  const [customShippingNotes, setCustomShippingNotes] = useState("");
  const [selectedCouponCode, setSelectedCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; value: number; type: "cupom" | "desconto" } | null>(null);

  // Toast notifications state
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "info" | "warning" }[]>([]);

  const showToast = (message: string, type: "success" | "info" | "warning" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Modal / Interaction States
  const [activeManequimProduct, setActiveManequimProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedDetailSize, setSelectedDetailSize] = useState<string>("");
  const [selectedDetailColor, setSelectedDetailColor] = useState<string>("");
  const [selectedDetailColorHex, setSelectedDetailColorHex] = useState<string>("");
  const [detailQuantity, setDetailQuantity] = useState<number>(1);

  useEffect(() => {
    setSelectedImage(null);
    if (viewingProduct) {
      const firstAvailable = viewingProduct.sizes.find(s => s.stock > 0);
      setSelectedDetailSize(firstAvailable?.size || "");
      setSelectedDetailColor(firstAvailable?.color || "");
      setSelectedDetailColorHex(firstAvailable?.colorHex || "");
    } else {
      setSelectedDetailSize("");
      setSelectedDetailColor("");
      setSelectedDetailColorHex("");
    }
  }, [viewingProduct]);

  // Live Shop dedicated states
  const [activeStoreTab, setActiveStoreTab] = useState<"loja" | "live">("loja");
  const [showLiveSection, setShowLiveSection] = useState(false);
  const [couponRedeemed, setCouponRedeemed] = useState(false);
  const [liveCouponTimer, setLiveCouponTimer] = useState(live.couponTimeLeft);
  const [heartsCount, setHeartsCount] = useState(0);
  const [hearts, setHearts] = useState<{ id: number; style: React.CSSProperties }[]>([]);
  const [liveComments, setLiveComments] = useState<{ id: number; name: string; comment: string; time: string }[]>([
    { id: 1, name: "Fernanda Lima", comment: "Que roupinha linda! Comprei o conjunto rosa", time: "12:02" },
    { id: 2, name: "Thiago Santos", comment: "Tem tamanho 4G do macacão azul?", time: "12:03" },
    { id: 3, name: "Carla Souza", comment: "Toque super macio, recomendo muito!", time: "12:04" },
  ]);

  const liveProductsCarouselRef = useRef<HTMLDivElement>(null);
  const scrollLiveCarousel = (direction: "left" | "right") => {
    if (liveProductsCarouselRef.current) {
      const offset = direction === "left" ? -240 : 240;
      liveProductsCarouselRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  // Active general popup aviso
  const [currentAviso, setCurrentAviso] = useState<string | null>(null);
  const [currentCenteredPopup, setCurrentCenteredPopup] = useState<Aviso | null>(null);

  // Banner slideshow state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const bannerList = useMemo(() => {
    if (landpage.bannerImages && landpage.bannerImages.length > 0) {
      return landpage.bannerImages;
    }
    return landpage.bannerImage ? [landpage.bannerImage] : [];
  }, [landpage.bannerImage, landpage.bannerImages]);

  useEffect(() => {
    if (bannerList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % bannerList.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [bannerList]);

  // Track stock constraints for quantity selects
  const activeDetailProductMaxStock = useMemo(() => {
    if (!viewingProduct || !selectedDetailSize) return 0;
    const sizeStock = viewingProduct.sizes.find(
      s => s.size === selectedDetailSize && (s.color || "") === selectedDetailColor
    );
    return sizeStock ? sizeStock.stock : 0;
  }, [viewingProduct, selectedDetailSize, selectedDetailColor]);

  // Load active notices (Top bar and Centered Popup separately)
  useEffect(() => {
    const activeNotice = avisos.find(a => a.active && (!a.type || a.type === "top_bar"));
    if (activeNotice) {
      setCurrentAviso(activeNotice.message);
      if (activeNotice.displayTimeSeconds > 0) {
        const t = setTimeout(() => {
          setCurrentAviso(null);
        }, activeNotice.displayTimeSeconds * 1000);
        return () => clearTimeout(t);
      }
    } else {
      setCurrentAviso(null);
    }
  }, [avisos]);

  useEffect(() => {
    const activeCenteredNotice = avisos.find(a => a.active && a.type === "centered_popup");
    if (activeCenteredNotice) {
      const closedList = sessionStorage.getItem("closed_popups");
      const closedIds = closedList ? JSON.parse(closedList) : [];
      if (!closedIds.includes(activeCenteredNotice.id)) {
        setCurrentCenteredPopup(activeCenteredNotice);
        if (activeCenteredNotice.displayTimeSeconds > 0) {
          const t = setTimeout(() => {
            setCurrentCenteredPopup(null);
          }, activeCenteredNotice.displayTimeSeconds * 1000);
          return () => clearTimeout(t);
        }
      }
    } else {
      setCurrentCenteredPopup(null);
    }
  }, [avisos]);

  // Live countdown
  useEffect(() => {
    if (live.active && live.couponActive) {
      const interval = setInterval(() => {
        setLiveCouponTimer(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [live]);

  // If live is turned off, auto return to store tab
  useEffect(() => {
    if (!live.active) {
      setActiveStoreTab("loja");
    } else {
      setLiveCouponTimer(live.couponTimeLeft);
    }
  }, [live.active, live.couponTimeLeft]);

  // Periodic simulated buyer comments on Live Shop
  useEffect(() => {
    if (activeStoreTab !== "live" || !live.active) return;
    const names = ["Aline M.", "Bruna Silva", "Carlos Eduardo", "Danielle K.", "Juliana P.", "Gisele F.", "Marcos A.", "Patrícia R.", "Rafael G.", "Mariana T."];
    const comments = [
      "Acabei de garantir o meu! Muito fácil comprar.",
      "Gente, o preço está excelente 😱",
      "Qualidade das roupinhas do Mundo Dutra é incrível!",
      "O frete grátis ativa no cupom?",
      "Chegou super rápido da última vez que comprei 🚚",
      "Meu filho amou o macaquinho de dinossauro!",
      "Hipoalergênico e 100% algodão, o melhor pros bebês ❤️",
      "Lindos demais esses looks de inverno!",
      "Que live incrível, parabéns!",
      "Consigo parcelar no cartão?"
    ];
    
    const interval = setInterval(() => {
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomComment = comments[Math.floor(Math.random() * comments.length)];
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      setLiveComments(prev => [
        ...prev.slice(-12), // keep last 12
        { id: Date.now(), name: randomName, comment: randomComment, time: timeStr }
      ]);
    }, 6000);

    return () => clearInterval(interval);
  }, [activeStoreTab, live.active]);

  // Flying hearts helper
  const handleAddHeart = () => {
    setHeartsCount(prev => prev + 1);
    const id = Date.now();
    const style: React.CSSProperties = {
      left: `${15 + Math.random() * 70}%`,
      bottom: "20px",
      transform: `scale(${0.7 + Math.random() * 0.7})`,
      animationName: "floatUp",
      animationDuration: `${2 + Math.random() * 1.5}s`
    };
    setHearts(prev => [...prev, { id, style }]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== id));
    }, 3500);
  };

  // Format timer
  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  // Size Options derived from products
  const allSizes = useMemo(() => {
    const sizes = new Set<string>();
    products.forEach(p => p.sizes.forEach(s => sizes.add(s.size)));
    return Array.from(sizes);
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Must be active
      if (p.status !== "ativo") return false;

      // Category matching
      if (selectedCategory !== "all" && p.categoryId !== selectedCategory) return false;

      // Size matching
      if (selectedSizeFilter !== "all" && !p.sizes.some(s => s.size === selectedSizeFilter && s.stock > 0)) return false;

      // Search Query (by code, name, age, size)
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesCode = p.code.toLowerCase().includes(query);
        const matchesAge = p.age.toLowerCase().includes(query);
        const matchesSize = p.sizes.some(s => s.size.toLowerCase().includes(query));
        return matchesName || matchesCode || matchesAge || matchesSize;
      }

      return true;
    });
  }, [products, selectedCategory, selectedSizeFilter, searchQuery]);

  // Totals calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "cupom") {
      // Treat as percentage
      return (subtotal * appliedCoupon.value) / 100;
    } else {
      // Treat as fixed
      return Math.min(subtotal, appliedCoupon.value);
    }
  }, [appliedCoupon, subtotal]);

  const shippingCost = useMemo(() => {
    if (shippingType === "fixo") return shippingFixedCost;
    if (shippingType === "bairro") {
      const neigh = shippingNeighborhoods.find(n => n.id === selectedNeighborhoodId);
      return neigh ? neigh.cost : 0;
    }
    return 0; // Combinar com o cliente
  }, [shippingType, selectedNeighborhoodId, shippingNeighborhoods, shippingFixedCost]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + shippingCost);
  }, [subtotal, discountAmount, shippingCost]);

  // Quick Action: Add to Cart
  const handleAddToCart = (product: Product, size: string, qty: number, color?: string, colorHex?: string) => {
    // Validate stock
    const sizeStock = product.sizes.find(s => s.size === size && (s.color || "") === (color || ""));
    const availableStock = sizeStock ? sizeStock.stock : 0;
    
    const existingIndex = cart.findIndex(
      item => item.product.id === product.id && 
              item.size === size && 
              (item.color || "") === (color || "")
    );
    const currentCartQty = existingIndex !== -1 ? cart[existingIndex].quantity : 0;

    if (currentCartQty + qty > availableStock) {
      showToast(`Estoque insuficiente! Disponível: ${availableStock}`, "warning");
      return;
    }

    if (existingIndex !== -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += qty;
      setCart(updated);
    } else {
      setCart([...cart, { product, size, color, colorHex, quantity: qty }]);
    }

    // Reset details
    setViewingProduct(null);
    setSelectedDetailSize("");
    setSelectedDetailColor("");
    setSelectedDetailColorHex("");
    setDetailQuantity(1);
    setIsCartOpen(true);
    showToast(`Produto adicionado à sacola com sucesso! 🛍️`, "success");
  };

  const handleUpdateCartQty = (index: number, delta: number) => {
    const updated = [...cart];
    const item = updated[index];
    const sizeStock = item.product.sizes.find(
      s => s.size === item.size && (s.color || "") === (item.color || "")
    );
    const availableStock = sizeStock ? sizeStock.stock : 0;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
      showToast(`Item removido da sacola.`, "info");
    } else if (newQty > availableStock) {
      showToast(`Quantidade limite em estoque atingida: ${availableStock}`, "warning");
      return;
    } else {
      updated[index].quantity = newQty;
      showToast(`Quantidade atualizada!`, "info");
    }
    setCart(updated);
  };

  const handleApplyCoupon = () => {
    const upperInput = selectedCouponCode.trim().toUpperCase();
    if (!upperInput) {
      showToast("Digite o código do cupom.", "warning");
      return;
    }

    // Dynamic Live coupon matching
    if (live.active && live.couponActive && live.couponCode && upperInput === live.couponCode.toUpperCase()) {
      const isPercent = live.couponValue.includes("%");
      const cleanValStr = live.couponValue.replace(/[^0-9.]/g, "");
      const numVal = parseFloat(cleanValStr) || 10;
      setAppliedCoupon({
        code: live.couponCode,
        value: numVal,
        type: isPercent ? "porcentagem" : "fixo"
      } as any);
      showToast(`Cupom da Live ${live.couponCode} aplicado com sucesso! 🎉`, "success");
      return;
    }

    const promo = promotions.find(p => {
      if (p.code.toUpperCase() !== upperInput || !p.active) return false;
      if (p.durationValue && p.durationUnit && p.durationUnit !== "ilimitado" && p.createdAt) {
        const createdTime = new Date(p.createdAt).getTime();
        let durationMs = 0;
        if (p.durationUnit === "minutos") durationMs = p.durationValue * 60 * 1000;
        else if (p.durationUnit === "horas") durationMs = p.durationValue * 60 * 60 * 1000;
        else if (p.durationUnit === "dias") durationMs = p.durationValue * 24 * 60 * 60 * 1000;

        const isExpired = (createdTime + durationMs) < Date.now();
        if (isExpired) return false;
      }
      return true;
    });
    if (promo) {
      setAppliedCoupon({
        code: promo.code,
        value: promo.value,
        type: promo.type
      });
      showToast(`Cupom ${promo.code} aplicado com sucesso! 🎉`, "success");
    } else {
      showToast("Cupom inválido ou expirado.", "warning");
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!clientName.trim() || !clientPhone.trim()) {
      showToast("Por favor, preencha os dados de nome e WhatsApp.", "warning");
      return;
    }

    // Add +55 if not already present
    let formattedPhone = clientPhone.replace(/\D/g, "");
    if (!formattedPhone.startsWith("55")) {
      formattedPhone = "55" + formattedPhone;
    }
    formattedPhone = "+" + formattedPhone;

    // Generate consecutive sequential order code (will be overwritten/secured at state layer but generated perfectly)
    const code = `PED-${Math.floor(1000 + Math.random() * 9000)}`;

    const items: OrderItem[] = cart.map(item => ({
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
      ? shippingNeighborhoods.find(n => n.id === selectedNeighborhoodId)?.neighborhood || "Desconhecido"
      : "";

    const shippingDetailsText = shippingType === "bairro"
      ? `Bairro: ${neighborhoodName}`
      : shippingType === "combinar"
      ? "A combinar com o lojista"
      : "Frete Fixo";

    const finalNotes = customShippingNotes ? `${shippingDetailsText} | Obs: ${customShippingNotes}` : shippingDetailsText;

    const newOrder: Order = {
      id: `order-${Date.now()}`,
      code,
      date: new Date().toISOString(),
      clientName,
      clientWhatsapp: formattedPhone,
      paymentMethod: selectedPayment,
      items,
      subtotal,
      shippingCost,
      shippingType,
      shippingDetails: finalNotes,
      total,
      status: "pendente",
      observations: finalNotes
    };

    onPlaceOrder(newOrder);

    // Build perfect formatted WhatsApp message
    // Support Android & iOS perfectly
    const itemsText = cart.map(item => `• ${item.product.name} (Tamanho: ${item.size}${item.color ? `, Cor: ${item.color}` : ""}) x${item.quantity} - R$ ${(item.product.price * item.quantity).toFixed(2)}`).join("\n");
    const checkoutSummary = `*NOVO PEDIDO - MUNDO DUTRA KIDS*\n\n` +
      `👤 *Cliente:* ${clientName}\n` +
      `📞 *WhatsApp:* ${formattedPhone}\n` +
      `💳 *Forma de Pagamento:* ${selectedPayment}\n\n` +
      `📦 *Produtos:*\n${itemsText}\n\n` +
      `💵 *Subtotal:* R$ ${subtotal.toFixed(2)}\n` +
      `${appliedCoupon ? `🎟️ *Desconto (${appliedCoupon.code}):* -R$ ${discountAmount.toFixed(2)}\n` : ""}` +
      `🚚 *Frete (${shippingType === 'bairro' ? 'Por Bairro' : shippingType === 'combinar' ? 'A Combinar' : 'Fixo'}):* R$ ${shippingCost.toFixed(2)}\n` +
      `🛍️ *Total Geral:* R$ ${total.toFixed(2)}\n\n` +
      `📝 *Observações/Entrega:* ${finalNotes}\n\n` +
      `_Obrigado por comprar conosco! Por favor, aguarde a confirmação do pagamento._`;

    const encodedText = encodeURIComponent(checkoutSummary);
    const storeWhatsapp = "+5511999998888"; // Configurable or merchant phone
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${storeWhatsapp}&text=${encodedText}`;
    
    // Open WhatsApp link immediately
    window.open(whatsappUrl, "_blank");

    // Clean cart and close
    setCart([]);
    setClientName("");
    setClientPhone("");
    setCustomShippingNotes("");
    setAppliedCoupon(null);
    setSelectedCouponCode("");
    setIsCartOpen(false);
    setCheckoutStep("cart");
    showToast("Compra finalizada com sucesso! Enviando para o WhatsApp... 🚀", "success");
  };

  // Dynamic design overrides: colors, fonts and skins
  const accentColor = landpage.accentColor || "#5A5A40";
  const fontFamily = landpage.fontFamily || "classica";
  const skin = landpage.skin || "default";

  // Compute a darker accent color for hover states
  const accentHover = useMemo(() => {
    if (accentColor.toLowerCase() === "#5a5a40") return "#484833";
    return `${accentColor}d9`; // 85% opacity in hex
  }, [accentColor]);

  const dynamicStyles = useMemo(() => {
    let fontCss = "";
    if (fontFamily === "classica") {
      fontCss = `
        .font-sans, body { font-family: 'Montserrat', sans-serif !important; }
        .serif-font, h1, h2, h3, h4, .serif-font-title { font-family: 'Playfair Display', serif !important; }
      `;
    } else if (fontFamily === "infantil") {
      fontCss = `
        .font-sans, body { font-family: 'Nunito', sans-serif !important; }
        .serif-font, h1, h2, h3, h4, .serif-font-title { font-family: 'Fredoka', sans-serif !important; }
      `;
    } else if (fontFamily === "moderna") {
      fontCss = `
        .font-sans, body { font-family: 'Inter', sans-serif !important; }
        .serif-font, h1, h2, h3, h4, .serif-font-title { font-family: 'Space Grotesk', sans-serif !important; }
      `;
    } else if (fontFamily === "sofisticada") {
      fontCss = `
        .font-sans, body { font-family: 'Montserrat', sans-serif !important; }
        .serif-font, h1, h2, h3, h4, .serif-font-title { font-family: 'Cinzel', serif !important; }
      `;
    } else if (fontFamily === "retro") {
      fontCss = `
        .font-sans, body { font-family: 'Nunito', sans-serif !important; }
        .serif-font, h1, h2, h3, h4, .serif-font-title { font-family: 'Courier Prime', monospace !important; }
      `;
    }

    let skinCss = "";
    if (skin === "nuvem") {
      skinCss = `
        /* Overrides for Bebê Nuvem */
        body, .bg-\\[\\#f5f5f0\\] { background-color: #f0f4f8 !important; }
        .border-\\[\\#e0e0d6\\] { border-color: #d9e2ec !important; }
        .rounded-2xl { border-radius: 24px !important; }
        .rounded-3xl { border-radius: 32px !important; }
        .rounded-xl { border-radius: 18px !important; }
        .shadow-sm { box-shadow: 0 10px 25px -5px rgba(180, 195, 210, 0.45) !important; }
        .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(160, 175, 195, 0.5) !important; }
        .border { border-width: 1px !important; border-style: solid !important; }
      `;
    } else if (skin === "minimal") {
      skinCss = `
        /* Overrides for Modern Minimal */
        body, .bg-\\[\\#f5f5f0\\] { background-color: #fafafa !important; }
        .border-\\[\\#e0e0d6\\] { border-color: #e5e7eb !important; }
        .rounded-2xl { border-radius: 6px !important; }
        .rounded-3xl { border-radius: 10px !important; }
        .rounded-xl { border-radius: 4px !important; }
        .shadow-sm { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
        .shadow-2xl { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important; border-radius: 10px !important; }
        .border { border-width: 1px !important; border-color: #e5e7eb !important; }
      `;
    } else if (skin === "vintage") {
      skinCss = `
        /* Overrides for Sepia Cottage */
        body, .bg-\\[\\#f5f5f0\\] { background-color: #fdfbf7 !important; }
        .border-\\[\\#e0e0d6\\] { border-color: #decbb7 !important; border-style: double !important; border-width: 3px !important; }
        .rounded-2xl { border-radius: 4px !important; }
        .rounded-3xl { border-radius: 6px !important; }
        .rounded-xl { border-radius: 2px !important; }
        .shadow-sm { box-shadow: 3px 3px 0px rgba(139, 126, 102, 0.15) !important; border: 1px solid #decbb7 !important; }
        .shadow-2xl { box-shadow: 6px 6px 0px rgba(139, 126, 102, 0.2) !important; }
      `;
    } else if (skin === "doce") {
      skinCss = `
        /* Overrides for Doce Candy */
        body, .bg-\\[\\#f5f5f0\\] { background-color: #fff0f3 !important; }
        .border-\\[\\#e0e0d6\\] { border-color: #ffd0da !important; }
        .rounded-2xl { border-radius: 28px !important; }
        .rounded-3xl { border-radius: 40px !important; }
        .rounded-xl { border-radius: 20px !important; }
        .shadow-sm { box-shadow: 0 8px 22px rgba(255, 182, 193, 0.4) !important; }
        .shadow-2xl { box-shadow: 0 24px 48px rgba(255, 160, 180, 0.5) !important; }
      `;
    }

    return `
      ${fontCss}
      ${skinCss}

      /* Dynamic Sage replacements */
      .text-\\[\\#5A5A40\\] { color: ${accentColor} !important; }
      .bg-\\[\\#5A5A40\\] { background-color: ${accentColor} !important; }
      .border-\\[\\#5A5A40\\] { border-color: ${accentColor} !important; }
      .hover\\:bg-\\[\\#484833\\]:hover { background-color: ${accentHover} !important; }
      
      .bg-\\[\\#5A5A40\\]\\/10 { background-color: ${accentColor}1a !important; }
      .bg-\\[\\#5A5A40\\]\\/5 { background-color: ${accentColor}0d !important; }
      .hover\\:bg-\\[\\#5A5A40\\]\\/5:hover { background-color: ${accentColor}0d !important; }
      .hover\\:bg-\\[\\#5A5A40\\]\\/10:hover { background-color: ${accentColor}1a !important; }
      .focus\\:border-\\[\\#5A5A40\\]:focus { border-color: ${accentColor} !important; }
      .focus\\:ring-\\[\\#5A5A40\\]:focus { --tw-ring-color: ${accentColor} !important; }

      .text-[#5A5A40] { color: ${accentColor} !important; }
      .bg-[#5A5A40] { background-color: ${accentColor} !important; }
      .border-[#5A5A40] { border-color: ${accentColor} !important; }
      .hover\\:bg-[#484833]:hover { background-color: ${accentHover} !important; }
      .bg-[#5A5A40]/10 { background-color: ${accentColor}1a !important; }
      .bg-[#5A5A40]/5 { background-color: ${accentColor}0d !important; }
      .hover\\:bg-[#5A5A40]/5:hover { background-color: ${accentColor}0d !important; }
      .focus\\:border-[#5A5A40]:focus { border-color: ${accentColor} !important; }

      /* Additional UI adjustments */
      .sidebar-item-hover:hover { background-color: ${accentColor}14 !important; }
      .active-sidebar { background-color: ${accentColor} !important; }

      @keyframes floatUp {
        0% { transform: translateY(0) scale(0.8); opacity: 1; }
        100% { transform: translateY(-280px) scale(1.3) rotate(15deg); opacity: 0; }
      }
      .floating-heart {
        position: absolute;
        pointer-events: none;
        animation: floatUp 3s ease-out forwards;
      }
    `;
  }, [accentColor, fontFamily, skin, accentHover]);

  // Helper to render items inside the cart (desktop compact vs mobile touch)
  const renderCartItems = (isMobile: boolean) => {
    if (cart.length === 0) {
      return (
        <div className="text-center py-20 px-4">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-bold">Sua sacola de compras está vazia.</p>
          <p className="text-xs text-gray-400 mt-1">Navegue pelas nossas roupinhas e adicione mimos!</p>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            className="mt-5 bg-[#5A5A40] hover:bg-[#484833] text-white font-bold px-5 py-2.5 rounded-full text-xs transition active:scale-95 shadow-sm"
          >
            Continuar Navegando 🛍️
          </button>
        </div>
      );
    }

    return (
      <div className={isMobile ? "space-y-4 pb-6" : "space-y-3"}>
        {cart.map((item, idx) => {
          const sizeStock = item.product.sizes.find(s => s.size === item.size)?.stock ?? 0;
          return (
            <div
              key={idx}
              className={`bg-white rounded-2xl border border-[#e0e0d6] flex gap-3 items-center ${
                isMobile ? "p-4 shadow-sm" : "p-3 hover:shadow-sm transition"
              }`}
            >
              <img src={item.product.image} className={`${isMobile ? "w-16 h-20 p-1" : "w-12 h-15 p-0.5"} rounded-xl object-contain shrink-0 bg-gray-50`} alt="" />
              
              <div className="flex-1 min-w-0">
                <h4 className={`font-extrabold text-gray-800 truncate ${isMobile ? "text-sm" : "text-xs"}`}>
                  {item.product.name}
                </h4>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Tam:</span>
                  <span className="bg-[#5A5A40]/10 text-[#5A5A40] text-[10px] font-black px-2 py-0.5 rounded-md">
                    {item.size}
                  </span>
                  {item.color && (
                    <div className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded-md shrink-0">
                      {item.colorHex && (
                        <span 
                          className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block shadow-3xs" 
                          style={{ backgroundColor: item.colorHex }}
                        />
                      )}
                      <span className="text-gray-600 text-[9px] font-bold">{item.color}</span>
                    </div>
                  )}
                </div>
                <p className={`font-black text-gray-950 mt-1.5 ${isMobile ? "text-sm" : "text-xs"}`}>
                  R$ {item.product.price.toFixed(2)}
                </p>
              </div>

              {/* Quantity controls with platform optimization (Mobile is at least 44px touch target) */}
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-gray-50 rounded-full border border-gray-100 p-0.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateCartQty(idx, -1)}
                    className={`rounded-full flex items-center justify-center font-bold hover:bg-gray-200 transition active:scale-90 text-gray-600 ${
                      isMobile ? "w-11 h-11 text-lg bg-gray-100" : "w-7 h-7 text-xs bg-white shadow-xs"
                    }`}
                    aria-label="Diminuir quantidade"
                  >
                    -
                  </button>
                  <span className={`font-mono font-extrabold text-center text-gray-900 ${isMobile ? "w-8 text-sm" : "w-5 text-xs"}`}>
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateCartQty(idx, 1)}
                    className={`rounded-full flex items-center justify-center font-bold hover:bg-gray-200 transition active:scale-90 text-gray-600 ${
                      isMobile ? "w-11 h-11 text-lg bg-gray-100" : "w-7 h-7 text-xs bg-white shadow-xs"
                    }`}
                    aria-label="Aumentar quantidade"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const updated = [...cart];
                    updated.splice(idx, 1);
                    setCart(updated);
                  }}
                  className={`text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center justify-center shrink-0 ${
                    isMobile ? "w-11 h-11 bg-gray-50 border border-gray-100" : "p-1.5"
                  }`}
                  title="Remover item da sacola"
                >
                  <Trash2 className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
                </button>
              </div>
            </div>
          );
        })}

        {/* Apply Promo Coupon inside Cart view */}
        <div className={`bg-white rounded-2xl border border-[#e0e0d6] ${isMobile ? "p-4 mt-6" : "p-3 mt-3"}`}>
          <label className="block text-[10px] uppercase font-black text-gray-400 mb-1.5">
            🏷️ Cupom de Desconto:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: MUNDO10"
              value={selectedCouponCode}
              onChange={(e) => setSelectedCouponCode(e.target.value.toUpperCase())}
              className={`flex-1 px-3.5 text-xs bg-gray-50 border border-[#e0e0d6] rounded-xl uppercase font-mono focus:outline-none focus:border-[#5A5A40] ${
                isMobile ? "text-sm py-2.5" : "text-xs py-1.5"
              }`}
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              className={`bg-[#5A5A40] text-white px-4 rounded-xl text-xs font-bold hover:bg-[#484833] transition-colors ${
                isMobile ? "h-11 px-5 text-sm" : "py-1.5"
              }`}
            >
              Aplicar
            </button>
          </div>
          {appliedCoupon && (
            <p className="text-[11px] text-green-600 font-bold mt-1.5 flex items-center gap-1">
              ✓ Cupom {appliedCoupon.code} aplicado!
            </p>
          )}
        </div>
      </div>
    );
  };

  // Helper to render checkout form
  const renderCheckoutForm = (isMobile: boolean) => {
    return (
      <div className={isMobile ? "space-y-5 pb-6" : "space-y-4"}>
        <div className="bg-white p-4 rounded-2xl border border-[#e0e0d6] space-y-4">
          <h4 className="font-extrabold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-1.5">
            📋 Seus Dados
          </h4>
          
          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold text-gray-400">
              Seu Nome Completo *
            </label>
            <input
              type="text"
              required
              placeholder="Digite seu nome completo"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className={`w-full px-3.5 bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none focus:border-[#5A5A40] ${
                isMobile ? "py-3 text-sm" : "py-2 text-xs"
              }`}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold text-gray-400">
              Seu WhatsApp *
            </label>
            <div className="relative">
              <span className={`absolute left-3 font-semibold text-gray-400 ${isMobile ? "top-3 text-sm" : "top-2.5 text-xs"}`}>+55</span>
              <input
                type="tel"
                required
                placeholder="(11) 99999-9999"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className={`w-full pr-3 bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none focus:border-[#5A5A40] ${
                  isMobile ? "py-3 pl-12 text-sm" : "py-2 pl-11 text-xs"
                }`}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold text-gray-400">
              Forma de Pagamento *
            </label>
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value as any)}
              className={`w-full px-3 bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none focus:border-[#5A5A40] font-semibold text-gray-700 ${
                isMobile ? "py-3 text-sm" : "py-2 text-xs"
              }`}
            >
              <option value="Pix">🔑 Pix (Aprovado na hora)</option>
              <option value="Cartão de Crédito">💳 Cartão de Crédito</option>
              <option value="Cartão de Débito">💳 Cartão de Débito</option>
              <option value="Boleto">📄 Boleto Bancário</option>
            </select>
          </div>
        </div>

        {/* Shipping Option */}
        <div className="bg-white p-4 rounded-2xl border border-[#e0e0d6] space-y-4">
          <h4 className="font-extrabold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-1.5">
            🚚 Entrega e Frete
          </h4>
          
          {shippingType === "bairro" ? (
            <div className="space-y-2">
              <label className="block text-[10px] uppercase font-bold text-gray-400">
                Selecione seu Bairro:
              </label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {shippingNeighborhoods.map((n) => (
                  <button
                    type="button"
                    key={n.id}
                    onClick={() => setSelectedNeighborhoodId(n.id)}
                    className={`w-full rounded-xl border text-left transition flex justify-between items-center ${
                      selectedNeighborhoodId === n.id
                        ? "bg-[#5A5A40]/10 border-[#5A5A40] text-[#5A5A40] font-bold"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700"
                    } ${isMobile ? "p-3.5 text-sm" : "p-2.5 text-xs"}`}
                  >
                    <span>📍 {n.neighborhood}</span>
                    <span className="font-mono font-extrabold">R$ {n.cost.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : shippingType === "combinar" ? (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-800 leading-tight font-medium">
                O valor e as opções de entrega serão combinados diretamente com você pelo nosso atendente no WhatsApp!
              </p>
            </div>
          ) : (
            <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl flex justify-between items-center text-xs font-semibold text-amber-900">
              <span className="flex items-center gap-1">📍 Taxa de Frete Fixa Única:</span>
              <span className="font-mono font-black text-amber-950 text-sm">R$ {shippingFixedCost.toFixed(2)}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold text-gray-400">
              Observações Adicionais:
            </label>
            <textarea
              placeholder="Ex: Referência da casa, apartamento, horário preferido de entrega..."
              value={customShippingNotes}
              onChange={(e) => setCustomShippingNotes(e.target.value)}
              className={`w-full px-3.5 py-2.5 bg-gray-50 border border-[#e0e0d6] rounded-xl focus:outline-none focus:border-[#5A5A40] h-20 resize-none ${
                isMobile ? "text-sm" : "text-xs"
              }`}
            />
          </div>
        </div>
      </div>
    );
  };

  // Helper to render pricing and CTA
  const renderPricingSummary = (isMobile: boolean) => {
    if (cart.length === 0) return null;

    return (
      <div className={`bg-white border-t border-[#e0e0d6] shadow-md space-y-3 pb-safe ${isMobile ? "p-5" : "p-4"}`}>
        <div className="space-y-1.5 text-xs text-gray-600">
          <div className="flex justify-between">
            <span className="font-medium">Subtotal</span>
            <span className="font-mono font-bold">R$ {subtotal.toFixed(2)}</span>
          </div>
          {appliedCoupon && (
            <div className="flex justify-between text-pink-600 font-bold">
              <span>Cupom ({appliedCoupon.code})</span>
              <span className="font-mono">-R$ {discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="font-medium">Entrega</span>
            <span className="font-mono font-bold">
              {shippingCost > 0 ? `R$ ${shippingCost.toFixed(2)}` : "A combinar"}
            </span>
          </div>
          <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-100">
            <span className="text-sm">Total Geral</span>
            <span className={`font-mono ${isMobile ? "text-lg text-pink-600 font-extrabold" : "text-base text-[#5A5A40]"}`}>
              R$ {total.toFixed(2)}
            </span>
          </div>
        </div>

        {checkoutStep === "cart" ? (
          <button
            type="button"
            onClick={() => setCheckoutStep("details")}
            className={`w-full bg-[#5A5A40] hover:bg-[#484833] text-white font-extrabold transition flex items-center justify-center gap-2 rounded-2xl shadow-sm ${
              isMobile ? "py-4 text-sm active:scale-97" : "py-3 text-xs"
            }`}
          >
            Continuar para Entrega 📦
          </button>
        ) : (
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setCheckoutStep("cart")}
              className={`border border-[#e0e0d6] text-gray-600 hover:bg-gray-50 rounded-2xl font-bold transition ${
                isMobile ? "px-5 py-4 text-sm active:scale-97" : "px-3.5 py-3 text-xs"
              }`}
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={handleCheckoutSubmit}
              className={`flex-1 bg-green-600 hover:bg-green-700 text-white font-extrabold transition flex items-center justify-center gap-2 rounded-2xl shadow-sm ${
                isMobile ? "py-4 text-sm active:scale-97" : "py-3 text-xs"
              }`}
            >
              <MessageCircle className="w-4.5 h-4.5 shrink-0" /> Enviar via WhatsApp 📱
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-[#2d2d2d] flex flex-col relative font-sans pb-20 md:pb-0">
      <style>{dynamicStyles}</style>
      
      {/* Toast Notification HUD */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -25, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white/95 backdrop-blur-md border border-pink-100 rounded-2xl p-3.5 shadow-xl flex items-center justify-between gap-3 pointer-events-auto"
            >
              <div className="flex items-center gap-2.5">
                {t.type === "success" ? (
                  <span className="text-xl">🌸</span>
                ) : t.type === "warning" ? (
                  <span className="text-xl">⚠️</span>
                ) : (
                  <span className="text-xl">✨</span>
                )}
                <p className="text-xs font-black text-gray-800 leading-snug">{t.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                className="text-gray-300 hover:text-gray-500 hover:bg-gray-100 p-1 rounded-lg transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Dynamic bubbles and balloons background animation */}
      {landpage.floatingParticles && <FloatingParticles />}

      {/* Floating alert banners inside header */}
      <AnimatePresence>
        {currentAviso && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#5A5A40] text-white text-center py-2 px-4 text-xs font-semibold z-40 relative flex items-center justify-center gap-2 shadow"
          >
            <Sparkle className="w-3.5 h-3.5 text-pink-300 animate-spin" />
            <span>{currentAviso}</span>
            <button 
              onClick={() => setCurrentAviso(null)} 
              className="ml-3 hover:text-gray-300 p-1 hover:bg-white/10 rounded-full transition"
              title="Fechar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#e0e0d6] sticky top-0 z-30 px-4 py-3 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {landpage.logoImage && (
              <img 
                src={landpage.logoImage} 
                alt="Logo" 
                className="w-12 h-12 rounded-full object-contain p-1 bg-white shadow-sm border border-[#e0e0d6]"
                style={{ width: "48px", height: "48px" }}
              />
            )}
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-[#5A5A40] serif-font">
                {landpage.heroTitle}
              </h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">Moda Premium</p>
            </div>
          </div>

          {/* Navigation Tabs (Desktop-only) */}
          <div className="hidden md:flex items-center gap-1 bg-gray-100/80 p-1 rounded-full border border-gray-200">
            <button
              onClick={() => setActiveStoreTab("loja")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                activeStoreTab === "loja"
                  ? "bg-[#5A5A40] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              🧸 Loja Kids
            </button>
            {live.active && (
              <button
                onClick={() => setActiveStoreTab("live")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 relative ${
                  activeStoreTab === "live"
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-red-600 hover:bg-red-50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                🎥 Live ao Vivo
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] px-1 rounded-full">NOVO</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Live Indicator inside store front */}
            {live.active && (
              <button 
                onClick={() => setActiveStoreTab(activeStoreTab === "live" ? "loja" : "live")}
                className={`hover:scale-105 active:scale-95 text-red-600 px-3 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 border animate-pulse transition shadow-sm ${
                  activeStoreTab === "live"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-red-50 hover:bg-red-100 border-red-200"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeStoreTab === "live" ? "bg-white" : "bg-red-600"}`}></span>
                {activeStoreTab === "live" ? "VER LOJA 🧸" : "LIVE NO AR 🔴"}
              </button>
            )}

            <button
              onClick={() => setIsCartOpen(true)}
              className="bg-[#5A5A40] hover:bg-[#484833] text-white p-2.5 rounded-full relative shadow-sm transition flex items-center gap-1"
            >
              <ShoppingBag className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>

            <button
              onClick={onBackToAdmin}
              className="hidden md:flex text-xs bg-[#e0e0d6]/60 hover:bg-[#d0d0c4] text-[#5A5A40] px-3 py-2 rounded-xl font-bold transition items-center gap-1"
            >
              <span>Painel</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area: Conditional Tabs */}
      {activeStoreTab === "live" && live.active ? (
        /* Dedicated Immersive Live Shop Tab (Shopee Style) */
        <section className="py-6 px-4 md:px-8 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Live Video Player and Shopee-style Product Carousel */}
            <div className="lg:col-span-2 space-y-4">
              <div className="relative rounded-[2rem] overflow-hidden border-4 border-white shadow-xl bg-slate-950">
                {/* Floating tags */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse flex items-center gap-1 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    AO VIVO
                  </span>
                  <span className="bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[9px] font-bold flex items-center gap-1 shadow-md">
                    👥 {120 + Math.floor(heartsCount * 0.3) + (Date.now() % 43)} assistindo
                  </span>
                </div>
                
                <YoutubeEmbed url={live.youtubeUrl} />
                
                {/* Float Hearts Overlay */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                  {hearts.map(h => (
                    <span
                      key={h.id}
                      style={h.style}
                      className="floating-heart text-2xl"
                    >
                      {["💖", "🌸", "🧸", "🎈", "✨", "🥰"][h.id % 6]}
                    </span>
                  ))}
                </div>
              </div>

              {/* Horizontal Carousel of products directly under the live player */}
              <div className="bg-gradient-to-br from-pink-500/10 via-white to-blue-50/10 border-2 border-pink-200/50 rounded-3xl p-5 shadow-lg relative">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-gradient-to-r from-pink-500 to-red-500 text-white text-[10px] uppercase font-black px-3 py-1 rounded-full animate-bounce flex items-center gap-1">
                      🛍️ SACOLA DA LIVE
                    </span>
                    <span className="text-xs text-gray-500 font-bold hidden sm:inline">Escolha e compre sem sair da live!</span>
                  </div>
                  
                  {/* Slider Control buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => scrollLiveCarousel("left")}
                      className="w-7 h-7 rounded-full bg-white hover:bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100 shadow-sm transition active:scale-90"
                      title="Anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollLiveCarousel("right")}
                      className="w-7 h-7 rounded-full bg-white hover:bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-100 shadow-sm transition active:scale-90"
                      title="Próximo"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Horizontal slider track */}
                <div 
                  ref={liveProductsCarouselRef}
                  className="flex gap-4 overflow-x-auto no-scrollbar pb-2 scroll-smooth"
                >
                  {products
                    .filter(p => live.productsIds.includes(p.id) && p.status === "ativo")
                    .map((prod, index) => {
                      const totalStock = prod.sizes.reduce((sum, s) => sum + s.stock, 0);
                      return (
                        <motion.div
                          whileHover={{ y: -3 }}
                          key={prod.id}
                          className="w-48 bg-white border border-pink-100/80 rounded-2xl p-3 shrink-0 relative flex flex-col justify-between shadow-sm hover:shadow-md transition"
                        >
                          {/* Number badge */}
                          <div className="absolute top-2 left-2 bg-pink-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow z-10">
                            {index + 1}
                          </div>

                          {/* Product thumbnail */}
                          <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center p-1 relative">
                            <img src={prod.image} className="max-w-full max-h-full object-contain" alt="" />
                            {totalStock === 0 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-1 text-center z-10">
                                <span className="bg-red-600 text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded">Esgotado</span>
                              </div>
                            )}
                          </div>

                          {/* Product details */}
                          <div className="mt-2.5 space-y-1">
                            <h4 className="text-xs font-bold text-gray-800 truncate">{prod.name}</h4>
                            <p className="text-[10px] text-gray-400 font-medium">Idade: {prod.age}</p>
                            
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-sm font-extrabold text-pink-600">R$ {prod.price.toFixed(2)}</span>
                              <button
                                onClick={() => {
                                  setViewingProduct(prod);
                                  const firstAvailableSize = prod.sizes.find(s => s.stock > 0)?.size || "";
                                  setSelectedDetailSize(firstAvailableSize);
                                }}
                                className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl transition shadow-sm hover:scale-105 active:scale-95 flex items-center gap-0.5"
                              >
                                Ver ⚡
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Live Right Side Panel - Coupon, Simulated Chat & Heart buttons */}
            <div className="space-y-4">
              
              {/* Interaction Buttons - send hearts */}
              <div className="bg-white p-4 rounded-3xl border border-[#e0e0d6] shadow-sm flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-gray-400 uppercase font-black">Interagir na Live</p>
                  <p className="text-xs font-bold text-gray-700">{heartsCount} reações enviadas</p>
                </div>
                <button
                  onClick={handleAddHeart}
                  className="bg-pink-100 hover:bg-pink-200 text-pink-600 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-1.5 hover:scale-105 active:scale-95 shadow-sm"
                >
                  ❤️ Mandar Amor!
                </button>
              </div>

              {/* Central Cupom Banner inside live */}
              {live.couponActive && (
                <div className="bg-[#5A5A40] text-white p-5 rounded-3xl border border-[#5A5A40]/10 relative overflow-hidden shadow-md">
                  <div className="absolute right-0 top-0 text-6xl opacity-10">🎫</div>
                  <p className="text-[10px] uppercase tracking-wider text-pink-300 font-bold">Cupom da Live Ativo!</p>
                  <p className="text-xl font-black mt-0.5">{live.couponCode} ({live.couponValue} OFF)</p>
                  
                  <div className="flex items-center justify-between mt-3 bg-black/25 p-2 rounded-xl text-xs">
                    <span className="text-[10px] text-gray-300">Expira em:</span>
                    <span className="font-mono font-bold text-pink-300">{formatTime(liveCouponTimer)}</span>
                  </div>

                  {!couponRedeemed ? (
                    <button
                      onClick={() => {
                        setSelectedCouponCode(live.couponCode);
                        handleApplyCoupon();
                        setCouponRedeemed(true);
                      }}
                      className="w-full mt-3 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold py-2 rounded-xl transition shadow"
                    >
                      Resgatar Cupom de Desconto 🛍️
                    </button>
                  ) : (
                    <div className="w-full mt-3 bg-green-600 text-white text-center text-xs font-bold py-1.5 rounded-xl">
                      ✓ Desconto aplicado na sua sacola!
                    </div>
                  )}
                </div>
              )}

              {/* Simulated Live Chat Feed */}
              <div className="bg-white p-5 rounded-3xl border border-[#e0e0d6] shadow-sm flex flex-col justify-between h-[300px]">
                <div className="border-b border-[#e0e0d6]/70 pb-2.5 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-gray-700 flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-[#5A5A40]" />
                    Chat
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto py-3 space-y-2.5 no-scrollbar scroll-smooth">
                  {liveComments.map(c => (
                    <div key={c.id} className="text-xs leading-relaxed hover:bg-gray-50 p-1.5 rounded-xl transition">
                      <span className="font-extrabold text-pink-600 mr-1">{c.name}</span>
                      <span className="text-gray-400 font-mono text-[9px] mr-1.5">[{c.time}]</span>
                      <span className="text-gray-700 font-medium">{c.comment}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2.5 border-t border-[#e0e0d6]/70 text-[10px] text-gray-400 text-center font-bold">
                  ⚠️ Comentários moderados em tempo real
                </div>
              </div>

              {/* Back button */}
              <button
                onClick={() => setActiveStoreTab("loja")}
                className="w-full bg-[#e0e0d6]/40 hover:bg-[#e0e0d6]/70 text-[#5A5A40] text-xs font-bold py-3 rounded-2xl transition flex items-center justify-center gap-1.5"
              >
                Voltar para a Loja Completa 🧸
              </button>

            </div>

          </div>
        </section>
      ) : (
        <>
          {/* Main Banner Hero - Children's Store Theme */}
          <section className="bg-gradient-to-r from-pink-50/70 via-white to-blue-50/70 border-b border-[#e0e0d6]/70 overflow-hidden relative py-6 md:py-10">
            {/* Playful background design items */}
            <div className="absolute top-4 left-6 text-3xl opacity-20 select-none animate-bounce" style={{ animationDuration: '3s' }}>🎈</div>
            <div className="absolute bottom-6 right-8 text-3xl opacity-20 select-none animate-pulse">🧸</div>
            <div className="absolute top-1/2 left-1/3 text-2xl opacity-15 select-none animate-spin" style={{ animationDuration: '12s' }}>⭐</div>
            <div className="absolute top-8 right-1/4 text-4xl opacity-20 select-none animate-bounce" style={{ animationDuration: '4s' }}>☁️</div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="space-y-5 md:w-1/2">
                <span className="bg-gradient-to-r from-pink-400 to-blue-400 text-white text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-sm">
                  {landpage.topBadgeText || "✨ 🧸 Mundo Feliz Kids • Nova Coleção"}
                </span>
                <h2 className="text-4xl md:text-5.5xl font-extrabold text-gray-900 leading-tight serif-font">
                  {landpage.heroTitle} <span className="inline-block hover:scale-125 transition duration-200">🧸</span>
                </h2>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-md font-medium">
                  {landpage.heroSubtitle}
                </p>
                
                {/* Quick trust badges */}
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {landpage.badge1Text !== "" && (
                    <span className="bg-white/90 border border-pink-100 rounded-full px-3 py-1 text-xs text-pink-600 font-bold flex items-center gap-1 shadow-sm">
                      {landpage.badge1Icon !== "" ? (landpage.badge1Icon || "🌸") : ""} {landpage.badge1Text || "100% Algodão"}
                    </span>
                  )}
                  {landpage.badge2Text !== "" && (
                    <span className="bg-white/90 border border-blue-100 rounded-full px-3 py-1 text-xs text-blue-600 font-bold flex items-center gap-1 shadow-sm">
                      {landpage.badge2Icon !== "" ? (landpage.badge2Icon || "☁️") : ""} {landpage.badge2Text || "Toque Macio"}
                    </span>
                  )}
                  {landpage.badge3Text !== "" && (
                    <span className="bg-white/90 border border-amber-100 rounded-full px-3 py-1 text-xs text-amber-600 font-bold flex items-center gap-1 shadow-sm">
                      {landpage.badge3Icon !== "" ? (landpage.badge3Icon || "🍼") : ""} {landpage.badge3Text || "Hipoalergênico"}
                    </span>
                  )}
                </div>

                <div className="pt-2">
                  <span className="text-xs text-gray-500 font-semibold bg-white/60 backdrop-blur-sm border border-gray-100 px-4 py-2 rounded-2xl inline-flex items-center gap-2 shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                    {landpage.welcomeMessage}
                  </span>
                </div>
              </div>
      
              {bannerList.length > 0 && (
                <div className="md:w-1/2 w-full h-72 md:h-[380px] overflow-hidden relative rounded-[2.5rem] border-4 border-white bg-white shadow-xl hover:shadow-2xl transition duration-300 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.img 
                      key={currentBannerIndex}
                      src={bannerList[currentBannerIndex]} 
                      alt="Banner Real" 
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.5 }}
                      className="max-w-full max-h-full object-contain"
                      style={{ objectFit: "contain" }}
                    />
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                  {/* Adorable little tag */}
                  <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-md border border-gray-100 flex items-center gap-1.5 z-20">
                    <span className="text-base">{landpage.bannerTagIcon || "👗"}</span>
                    <span className="text-[10px] uppercase font-extrabold text-gray-700 tracking-wider">
                      {landpage.bannerTagText || "Moda Infantil Premium"}
                    </span>
                  </div>

                  {/* Indicator dots for multiple banners */}
                  {bannerList.length > 1 && (
                    <div className="absolute bottom-4 left-4 flex gap-1.5 z-20 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">
                      {bannerList.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentBannerIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            currentBannerIndex === idx ? "bg-white scale-125" : "bg-white/40"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

      {/* Catalog Search & Filters */}
      <section className="py-8 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-white p-5 rounded-2xl border border-[#e0e0d6] shadow-sm mb-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Expanded Multi-Field Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar por tamanho, nome do produto, idade ou código sequencial..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#f5f5f0]/50 rounded-xl border border-[#e0e0d6] focus:outline-none focus:border-[#5A5A40] text-sm"
              />
            </div>

            {/* Category selection */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === "all"
                    ? "bg-[#5A5A40] text-white shadow-sm"
                    : "bg-[#e0e0d6]/40 hover:bg-[#e0e0d6]/70 text-[#5A5A40]"
                }`}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                    selectedCategory === cat.id
                      ? "bg-[#5A5A40] text-white shadow-sm"
                      : "bg-[#e0e0d6]/40 hover:bg-[#e0e0d6]/70 text-[#5A5A40]"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Size Filter selection */}
            <div className="relative">
              <select
                value={selectedSizeFilter}
                onChange={(e) => setSelectedSizeFilter(e.target.value)}
                className="text-xs bg-[#e0e0d6]/40 hover:bg-[#e0e0d6]/70 text-[#5A5A40] px-3.5 py-2.5 rounded-xl font-bold border-0 focus:ring-1 focus:ring-[#5A5A40] outline-none"
              >
                <option value="all">Filtrar por Tamanho (Todos)</option>
                {allSizes.map(sz => (
                  <option key={sz} value={sz}>{sz}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        <h3 className="text-xl font-bold text-gray-900 mb-4 serif-font">
          Nossa Coleção Disponível
        </h3>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#e0e0d6] p-8">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h4 className="font-bold text-gray-700">Nenhum produto encontrado</h4>
            <p className="text-xs text-gray-500 mt-1">Tente ajustar seus filtros de busca ou tamanho.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredProducts.map((prod) => {
              const totalStock = prod.sizes.reduce((sum, s) => sum + s.stock, 0);

              return (
                <motion.div
                  layout
                  key={prod.id}
                  className="bg-white rounded-2xl border border-[#e0e0d6] overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  {/* Image container */}
                  <div className="aspect-[4/5] bg-[#f9f9f5] p-2 flex items-center justify-center relative overflow-hidden group">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      onClick={() => {
                        setViewingProduct(prod);
                        const firstAvailableSize = prod.sizes.find(s => s.stock > 0)?.size || "";
                        setSelectedDetailSize(firstAvailableSize);
                      }}
                      className="max-w-full max-h-full object-contain group-hover:scale-105 transition duration-300 cursor-pointer"
                    />

                    {totalStock === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-2 text-center">
                        <span className="bg-red-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-1.5 rounded-lg shadow">
                          Estoque Esgotado ❌
                        </span>
                      </div>
                    )}

                    {/* Stock limit badge */}
                    {totalStock > 0 && totalStock <= 3 && (
                      <div className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        Poucas Unidades! ({totalStock})
                      </div>
                    )}

                    {/* Sequential code tag */}
                    <div className="absolute top-2 right-2 bg-black/65 text-white text-[9px] font-mono px-2 py-0.5 rounded">
                      {prod.code}
                    </div>
                  </div>

                  {/* Body details */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">
                        {categories.find(c => c.id === prod.categoryId)?.name || "Geral"}
                      </p>
                      <h4
                        onClick={() => {
                          setViewingProduct(prod);
                          const firstAvailableSize = prod.sizes.find(s => s.stock > 0)?.size || "";
                          setSelectedDetailSize(firstAvailableSize);
                        }}
                        className="font-bold text-gray-900 text-sm tracking-tight cursor-pointer hover:text-[#5A5A40] transition truncate"
                      >
                        {prod.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5 leading-tight line-clamp-2">
                        Idade: {prod.age}
                      </p>
                      
                      {/* Available colors indicator */}
                      {prod.sizes && prod.sizes.some(s => s.colorHex) && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {Array.from(new Set(prod.sizes.filter(s => s.colorHex).map(s => s.colorHex))).map((hex, i) => (
                            <span
                              key={i}
                              className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block shrink-0 shadow-2xs"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-extrabold text-[#5A5A40]">
                          R$ {prod.price.toFixed(2)}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-1.5">
                        {/* Quick View Button */}
                        <button
                          onClick={() => {
                            setViewingProduct(prod);
                            const firstAvailableSize = prod.sizes.find(s => s.stock > 0)?.size || "";
                            setSelectedDetailSize(firstAvailableSize);
                          }}
                          className="text-[10px] font-bold text-[#5A5A40] border border-[#e0e0d6] py-1.5 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Detalhes
                        </button>

                        {/* Manequim Virtual Action Button */}
                        <button
                          onClick={() => setActiveManequimProduct(prod)}
                          className="text-[10px] font-bold bg-[#5A5A40] hover:bg-[#484833] text-white py-1.5 rounded-lg transition flex items-center justify-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Manequim
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
        </>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-[#e0e0d6] py-8 px-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <h4 className="font-bold text-[#5A5A40] text-sm serif-font">{landpage.heroTitle}</h4>
            <p className="text-xs text-gray-500 mt-1">Conforto premium para seu lojista preferido.</p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1">
            <p className="text-[10px] text-gray-400">
              © 2026 {landpage.heroTitle}. Todos os direitos reservados.
            </p>
            <p className="text-[10px] text-gray-400 font-medium">
              Desenvolvido por <span className="font-semibold text-gray-600">Sidney Limeira (81) 9 9401-1440</span>
            </p>
          </div>
        </div>
      </footer>

      {/* Product Details Modal */}
      <AnimatePresence>
        {viewingProduct && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#e0e0d6]"
            >
              <div className="relative aspect-[16/10] bg-[#f9f9f5] p-3 flex items-center justify-center">
                <img src={selectedImage || viewingProduct.image} className="max-w-full max-h-full object-contain" alt="" />
                <button
                  onClick={() => setViewingProduct(null)}
                  className="absolute top-3 right-3 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Multiple images thumbnail row */}
              {viewingProduct.images && viewingProduct.images.length > 1 && (
                <div className="flex gap-2 px-6 pt-3 overflow-x-auto pb-1">
                  {viewingProduct.images.map((img, index) => {
                    const isSelected = selectedImage ? img === selectedImage : img === viewingProduct.image;
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(img)}
                        className={`w-12 h-12 rounded-lg overflow-hidden border-2 bg-white p-0.5 shrink-0 transition ${
                          isSelected ? "border-[#5A5A40] scale-105" : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={img} className="w-full h-full object-contain" alt="" />
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="p-6 space-y-4">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">
                      {viewingProduct.name}
                    </h3>
                    <span className="bg-[#5A5A40]/10 text-[#5A5A40] text-xs font-mono px-2.5 py-0.5 rounded font-bold">
                      {viewingProduct.code}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Recomendação: {viewingProduct.age}</p>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  {viewingProduct.description || "Sem descrição adicional cadastrada."}
                </p>

                {/* Size choice */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">
                    Selecione o tamanho disponível:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {viewingProduct.sizes.map((sz, idx) => {
                      const isSelected = selectedDetailSize === sz.size && selectedDetailColor === (sz.color || "");
                      return (
                        <button
                          key={idx}
                          disabled={sz.stock <= 0}
                          onClick={() => {
                            setSelectedDetailSize(sz.size);
                            setSelectedDetailColor(sz.color || "");
                            setSelectedDetailColorHex(sz.colorHex || "");
                            setDetailQuantity(1); // reset to 1
                          }}
                          className={`px-3 py-1.5 text-xs rounded-xl font-semibold transition flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-[#5A5A40] text-white shadow-sm"
                              : sz.stock <= 0
                              ? "bg-gray-100 text-gray-300 line-through cursor-not-allowed"
                              : "bg-white border border-[#e0e0d6] text-gray-700 hover:bg-[#5A5A40]/5"
                          }`}
                        >
                          {sz.colorHex && (
                            <span 
                              className="w-2.5 h-2.5 rounded-full border border-white/40 inline-block shrink-0 shadow-3xs" 
                              style={{ backgroundColor: sz.colorHex }}
                            />
                          )}
                          <span>{sz.size} {sz.color ? `(${sz.color})` : ""}</span>
                          <span className="text-[9px] opacity-70 font-mono">({sz.stock})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Control dynamic purchase quantity based strictly on stock */}
                {selectedDetailSize && (
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-[#e0e0d6]/40">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Quantidade</span>
                      <span className="text-xs font-medium text-gray-600">Disponível: {activeDetailProductMaxStock}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        disabled={detailQuantity <= 1}
                        onClick={() => setDetailQuantity(prev => prev - 1)}
                        className="w-8 h-8 rounded-full bg-white border border-[#e0e0d6] flex items-center justify-center font-bold disabled:opacity-40"
                      >
                        <Minus className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                      <span className="font-mono font-bold text-sm w-6 text-center">{detailQuantity}</span>
                      <button
                        disabled={detailQuantity >= activeDetailProductMaxStock}
                        onClick={() => setDetailQuantity(prev => prev + 1)}
                        className="w-8 h-8 rounded-full bg-white border border-[#e0e0d6] flex items-center justify-center font-bold disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button
                    disabled={!selectedDetailSize || activeDetailProductMaxStock === 0}
                    onClick={() => {
                      if (viewingProduct && selectedDetailSize) {
                        handleAddToCart(viewingProduct, selectedDetailSize, detailQuantity, selectedDetailColor, selectedDetailColorHex);
                      }
                    }}
                    className="flex-1 bg-[#5A5A40] hover:bg-[#484833] text-white font-bold py-2.5 rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-45"
                  >
                    <ShoppingCart className="w-4 h-4" /> Adicionar à Sacola • R$ {(viewingProduct.price * detailQuantity).toFixed(2)}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manequim Virtual Modal Trigger */}
      <AnimatePresence>
        {activeManequimProduct && (
          <ManequimVirtual
            product={activeManequimProduct}
            onClose={() => setActiveManequimProduct(null)}
          />
        )}
      </AnimatePresence>

      {/* Shopping Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-end md:items-stretch justify-end">
            
            {/* 1. PC / Desktop Layout */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="hidden md:flex flex-col bg-[#f5f5f0] w-full max-w-md h-full shadow-2xl border-l border-[#e0e0d6] ml-auto relative"
            >
              {/* Header */}
              <div className="p-4 bg-white border-b border-[#e0e0d6] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#5A5A40]" />
                  <h3 className="font-extrabold text-gray-900 serif-font">Sua Sacola</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {checkoutStep === "cart" ? renderCartItems(false) : renderCheckoutForm(false)}
              </div>

              {/* Footer */}
              {renderPricingSummary(false)}
            </motion.div>

            {/* 2. Mobile / Tablet Layout (Premium Slide-up Bottom Sheet) */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="flex md:hidden flex-col bg-[#f5f5f0] w-full h-[92vh] max-h-[92vh] rounded-t-[2.5rem] shadow-[0_-15px_35px_rgba(0,0,0,0.18)] border-t border-pink-100 pb-safe z-50 fixed bottom-0 left-0 right-0 overflow-hidden"
            >
              {/* Native Pill Pull Bar */}
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-3 shrink-0" />

              {/* Mobile Header with large touch targets */}
              <div className="px-5 pb-3 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5.5 h-5.5 text-pink-600" />
                  <h3 className="font-black text-gray-900 text-base">Sua Sacola</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="w-11 h-11 bg-gray-50 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-95 transition"
                  aria-label="Fechar Sacola"
                >
                  <X className="w-5.5 h-5.5 text-gray-500" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {checkoutStep === "cart" ? renderCartItems(true) : renderCheckoutForm(true)}
              </div>

              {/* Bottom Sticky Action Footer */}
              <div className="shrink-0 bg-white shadow-md border-t border-gray-100">
                {renderPricingSummary(true)}
              </div>
            </motion.div>

          </div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation Bar (app-style layout) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-pink-100 py-2 md:hidden flex justify-around items-center shadow-[0_-5px_20px_rgba(0,0,0,0.06)] rounded-t-[1.8rem] pb-safe">
        <button
          type="button"
          onClick={() => setActiveStoreTab("loja")}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors ${
            activeStoreTab === "loja" ? "text-pink-600 font-extrabold" : "text-gray-400 font-bold"
          }`}
        >
          <span className="text-xl">🧸</span>
          <span className="text-[10px]">Loja</span>
        </button>

        {live.active && (
          <button
            type="button"
            onClick={() => setActiveStoreTab("live")}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors relative ${
              activeStoreTab === "live" ? "text-red-600 font-extrabold" : "text-gray-400 font-bold"
            }`}
          >
            <span className="text-xl animate-bounce" style={{ animationDuration: '3s' }}>🎥</span>
            <span className="text-[10px] flex items-center gap-0.5">
              Live
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-3 text-gray-400 font-bold relative"
        >
          <span className="text-xl">🛍️</span>
          <span className="text-[10px]">Sacola</span>
          {cart.length > 0 && (
            <span className="absolute top-0 right-2 bg-red-500 text-white text-[8px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onBackToAdmin}
          className="flex flex-col items-center gap-0.5 py-1 px-3 text-gray-400 font-bold"
        >
          <span className="text-xl">⚙️</span>
          <span className="text-[10px]">Painel</span>
        </button>
      </div>

      {/* Modern custom PWA App install prompt hud */}
      <PwaInstallPrompt pwaConfig={state.pwa} accentColor={accentColor} />

      {/* Centered Notice Popup Modal */}
      <AnimatePresence>
        {currentCenteredPopup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-[#e0e0d6]/50 flex flex-col items-center p-6 text-center space-y-4 relative"
            >
              <button
                onClick={() => {
                  const closedList = sessionStorage.getItem("closed_popups");
                  const closedIds = closedList ? JSON.parse(closedList) : [];
                  sessionStorage.setItem("closed_popups", JSON.stringify([...closedIds, currentCenteredPopup.id]));
                  setCurrentCenteredPopup(null);
                }}
                className="absolute top-3.5 right-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 p-1.5 rounded-full transition"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>

              {currentCenteredPopup.image && (
                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-white p-1 border border-gray-100 flex items-center justify-center">
                  <img src={currentCenteredPopup.image} className="max-w-full max-h-full object-contain" alt="" />
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#5A5A40] bg-[#5A5A40]/10 px-2.5 py-1 rounded-full">
                  {currentCenteredPopup.title || "Aviso da Loja"}
                </span>
                <p className="text-sm font-bold text-gray-900 pt-1 leading-snug">
                  {currentCenteredPopup.message}
                </p>
              </div>

              {/* Action buttons */}
              <div className="w-full pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(currentCenteredPopup.message);
                    showToast("Copiado para a área de transferência! 🎉", "success");
                  }}
                  className="flex-1 bg-[#5A5A40] hover:bg-[#484833] text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Copiar Texto / Cupom
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const closedList = sessionStorage.getItem("closed_popups");
                    const closedIds = closedList ? JSON.parse(closedList) : [];
                    sessionStorage.setItem("closed_popups", JSON.stringify([...closedIds, currentCenteredPopup.id]));
                    setCurrentCenteredPopup(null);
                  }}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs transition"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
