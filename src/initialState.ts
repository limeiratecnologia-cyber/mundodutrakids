import { SystemState, Category, Product } from "./types";

const defaultCategories: Category[] = [
  { id: "cat-1", name: "✨ ROUPAS", description: "Vestuário infantil e juvenil de alto padrão" },
  { id: "cat-2", name: "✨ CALÇADOS", description: "Tênis, sandálias e sapatinhos confortáveis" },
  { id: "cat-3", name: "✨ ACESSÓRIOS", description: "Laços, tiaras, bandanas e cintos" }
];

const defaultProducts: Product[] = [
  {
    id: "prod-1",
    code: "P0001",
    name: "Conjunto Infantil Sol e Mar",
    price: 89.90,
    cost: 45.00,
    image: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?q=80&w=600&auto=format&fit=crop",
    categoryId: "cat-1",
    sizes: [
      { size: "2 anos", stock: 5 },
      { size: "4 anos", stock: 8 },
      { size: "6 anos", stock: 0 },
      { size: "8 anos", stock: 12 }
    ],
    age: "2 a 8 anos",
    status: "ativo",
    description: "Conjunto unissex de camiseta 100% algodão egípcio e bermuda de linho leve. Conforto total para os dias ensolarados.",
    createdAt: new Date().toISOString()
  },
  {
    id: "prod-2",
    code: "P0002",
    name: "Tênis Infantil Confort Run",
    price: 139.90,
    cost: 70.00,
    image: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?q=80&w=600&auto=format&fit=crop",
    categoryId: "cat-2",
    sizes: [
      { size: "22", stock: 3 },
      { size: "24", stock: 4 },
      { size: "26", stock: 5 },
      { size: "28", stock: 2 }
    ],
    age: "1 a 5 anos",
    status: "ativo",
    description: "Tênis ultra flexível com fechamento em velcro facilitado. Palmilha anatômica anti-impacto ideal para os primeiros passos.",
    createdAt: new Date().toISOString()
  },
  {
    id: "prod-3",
    code: "P0003",
    name: "Laço de Cabelo Glitter Glam",
    price: 24.90,
    cost: 8.00,
    image: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=600&auto=format&fit=crop",
    categoryId: "cat-3",
    sizes: [
      { size: "Único", stock: 20 }
    ],
    age: "Livre",
    status: "ativo",
    description: "Laço feito à mão com fita de gorgurão premium e aplique de glitter hipoalergênico. Presilha bico de pato macia.",
    createdAt: new Date().toISOString()
  },
  {
    id: "prod-4",
    code: "P0004",
    name: "Vestido Floral Primavera",
    price: 119.90,
    cost: 55.00,
    image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=80&w=600&auto=format&fit=crop",
    categoryId: "cat-1",
    sizes: [
      { size: "4 anos", stock: 0 },
      { size: "6 anos", stock: 4 }
    ],
    age: "4 a 6 anos",
    status: "inativo",
    description: "Vestido rodado com estampa de flores silvestres em tricoline acetinada. Forro 100% algodão protetor.",
    createdAt: new Date().toISOString()
  }
];

export const getInitialState = (): SystemState => {
  const stored = localStorage.getItem("mundo_dutra_kids_state");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Ensure key sections exist if structure evolved
      if (parsed.products && parsed.categories && parsed.orders) {
        if (!parsed.adminPasscode) {
          parsed.adminPasscode = "9310";
        }
        if (!parsed.pwa) {
          parsed.pwa = {
            name: "Mundo Dutra Kids",
            shortName: "Dutra Kids",
            logoUrl: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=200&auto=format&fit=crop",
            themeColor: "#5A5A40",
            displayMode: "standalone"
          };
        }
        return parsed as SystemState;
      }
    } catch (e) {
      console.error("Error reading localStorage state:", e);
    }
  }

  // Create standard seed
  const initialState: SystemState = {
    adminPasscode: "9310",
    products: defaultProducts,
    categories: defaultCategories,
    orders: [
      {
        id: "order-1",
        code: "PED-0001",
        date: new Date(Date.now() - 3600000 * 4).toISOString(),
        clientName: "Mariana Souza",
        clientWhatsapp: "+5511999998888",
        paymentMethod: "Pix",
        items: [
          {
            id: "oi-1",
            productId: "prod-1",
            productName: "Conjunto Infantil Sol e Mar",
            productCode: "P0001",
            selectedSize: "4 anos",
            quantity: 1,
            unitPrice: 89.90
          }
        ],
        subtotal: 89.90,
        shippingCost: 15.00,
        shippingType: "bairro",
        shippingDetails: "Jardins",
        total: 104.90,
        status: "aprovado",
        observations: "Embalar para presente de aniversário."
      },
      {
        id: "order-2",
        code: "PED-0002",
        date: new Date(Date.now() - 3600000 * 24).toISOString(),
        clientName: "Rodrigo Alencar",
        clientWhatsapp: "+5521988887777",
        paymentMethod: "Cartão de Crédito",
        items: [
          {
            id: "oi-2",
            productId: "prod-2",
            productName: "Tênis Infantil Confort Run",
            productCode: "P0002",
            selectedSize: "24",
            quantity: 1,
            unitPrice: 139.90
          }
        ],
        subtotal: 139.90,
        shippingCost: 0,
        shippingType: "combinar",
        shippingDetails: "A combinar com o lojista",
        total: 139.90,
        status: "pendente",
        observations: "Solicitou envio via motoboy à tarde."
      }
    ],
    transactions: [
      { id: "t-1", description: "Venda - Pedido PED-0001", type: "receita", amount: 104.90, date: new Date().toISOString().split("T")[0], status: "pago" },
      { id: "t-2", description: "Compra de Tecidos - Coleção Verão", type: "despesa", amount: 350.00, date: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0], status: "pendente" },
      { id: "t-3", description: "Venda Balcão PDV", type: "receita", amount: 24.90, date: new Date().toISOString().split("T")[0], status: "pago" },
      { id: "t-4", description: "Serviço de Costura e Acabamento", type: "despesa", amount: 180.00, date: new Date().toISOString().split("T")[0], status: "pago" }
    ],
    shippingNeighborhoods: [
      { id: "n-1", neighborhood: "Centro", cost: 10.00 },
      { id: "n-2", neighborhood: "Jardins", cost: 15.00 },
      { id: "n-3", neighborhood: "Vila Olímpia", cost: 18.00 },
      { id: "n-4", neighborhood: "Pinheiros", cost: 15.00 }
    ],
    shippingType: "bairro",
    shippingFixedCost: 12.00,
    promotions: [
      { id: "promo-1", title: "CUPOM DE BENVINDO", type: "cupom", code: "BENVINDO10", value: 10, active: true },
      { id: "promo-2", title: "DESCONTO DE INVERNO", type: "desconto", code: "WINTER15", value: 15, active: false }
    ],
    avisos: [
      { id: "aviso-1", message: "✨ Aproveite nossa promoção de Frete Grátis acima de R$ 200 para todo o estado! ✨", active: true, displayTimeSeconds: 15, createdAt: new Date().toISOString() },
      { id: "aviso-2", message: "🔥 Nossa Live Shop está programada para hoje às 19h com descontos exclusivos! 🔥", active: false, displayTimeSeconds: 0, createdAt: new Date().toISOString() }
    ],
    landpage: {
      heroTitle: "Mundo Dutra Kids",
      heroSubtitle: "O melhor da moda infantil e infanto-juvenil com conforto, qualidade e sofisticação premium.",
      bannerImage: "https://images.unsplash.com/photo-1471286174574-e9627710ee59?q=80&w=1200&auto=format&fit=crop",
      logoImage: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=200&auto=format&fit=crop",
      accentColor: "#5A5A40", // Sage/Olive default
      secondaryColor: "#ec4899", // pink
      welcomeMessage: "Bem-vindo à nossa loja! Toque para ver nossa coleção exclusiva.",
      floatingParticles: true,
      fontFamily: "classica",
      skin: "default",
      bannerImages: ["https://images.unsplash.com/photo-1471286174574-e9627710ee59?q=80&w=1200&auto=format&fit=crop"],
      faviconImage: "",
      topBadgeText: "✨ 🧸 Mundo Feliz Kids • Nova Coleção",
      badge1Icon: "🌸",
      badge1Text: "100% Algodão",
      badge2Icon: "☁️",
      badge2Text: "Toque Macio",
      badge3Icon: "🍼",
      badge3Text: "Hipoalergênico",
      bannerTagIcon: "👗",
      bannerTagText: "Moda Infantil Premium"
    },
    printing: {
      headerText: "MUNDO DUTRA KIDS\nObrigado pela preferência!",
      footerText: "Siga-nos no Instagram: @mundodutrakids\nSuporte: (11) 99999-8888",
      showCouponCode: true,
      logoUrl: ""
    },
    live: {
      active: true,
      youtubeUrl: "https://www.youtube.com/watch?v=5qap5aO4i9A", // beautiful synth/relax music loop
      productsIds: ["prod-1", "prod-2", "prod-3"],
      couponActive: true,
      couponCode: "LIVESHOP20",
      couponValue: "20%",
      couponTimeLeft: 600
    },
    pwa: {
      name: "Mundo Dutra Kids",
      shortName: "Dutra Kids",
      logoUrl: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=200&auto=format&fit=crop",
      themeColor: "#5A5A40",
      displayMode: "standalone"
    }
  };

  localStorage.setItem("mundo_dutra_kids_state", JSON.stringify(initialState));
  return initialState;
};

export const saveState = (state: SystemState) => {
  localStorage.setItem("mundo_dutra_kids_state", JSON.stringify(state));
};
