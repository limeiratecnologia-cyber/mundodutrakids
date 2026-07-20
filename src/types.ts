export interface ProductSizeStock {
  size: string;
  stock: number;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  cost: number;
  image: string;
  images?: string[]; // Multiple images for products
  categoryId: string;
  sizes: ProductSizeStock[];
  age: string; // e.g., "1 ano", "2 anos", "infantil", "teen"
  status: "ativo" | "inativo";
  description: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  selectedSize: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  code: string;
  date: string;
  clientName: string;
  clientWhatsapp: string;
  paymentMethod: "Pix" | "Cartão de Crédito" | "Cartão de Débito" | "Boleto" | "Dinheiro";
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  shippingType: "bairro" | "combinar" | "fixo" | "retirada";
  shippingDetails: string; // neighborhood or custom notes
  total: number;
  status: "pendente" | "aprovado" | "cancelado";
  observations?: string;
  cashAmountGiven?: number; // Cash given by the customer
  cashChange?: number;       // Change to be returned
  deliveryType?: "retirada" | "entrega"; // Pickup or Delivery
}

export interface Transaction {
  id: string;
  description: string;
  type: "receita" | "despesa";
  amount: number;
  date: string;
  status: "pago" | "pendente";
  dueDate?: string;
}

export interface NeighborhoodShipping {
  id: string;
  neighborhood: string;
  cost: number;
}

export interface Promotion {
  id: string;
  title: string;
  type: "cupom" | "desconto";
  code: string;
  value: number; // percentage or fixed R$
  active: boolean;
  durationSeconds?: number;
  durationValue?: number;
  durationUnit?: "minutos" | "horas" | "dias" | "ilimitado";
  createdAt?: string;
}

export interface Aviso {
  id: string;
  message: string;
  active: boolean;
  displayTimeSeconds: number; // 0 for permanent
  createdAt: string;
  type?: "top_bar" | "centered_popup"; // Option for top banner or centered modal popup
  image?: string; // Optional image URL or base64 for coupon/promo visual
  title?: string; // Optional title for centered popup
}

export interface LandpageConfig {
  heroTitle: string;
  heroSubtitle: string;
  bannerImage: string;
  logoImage: string;
  accentColor: string;
  secondaryColor: string;
  welcomeMessage: string;
  floatingParticles: boolean; // balloons and bubbles
  fontFamily?: string; // Font preset ID
  skin?: string;       // Skin preset ID
  bannerImages?: string[]; // Multiple rotating banners
  faviconImage?: string; // Custom Favicon Base64/URL
  topBadgeText?: string; // Customizable top collection badge
  badge1Icon?: string;
  badge1Text?: string;
  badge2Icon?: string;
  badge2Text?: string;
  badge3Icon?: string;
  badge3Text?: string;
  bannerTagIcon?: string;
  bannerTagText?: string;
}

export interface PrintingConfig {
  headerText: string;
  footerText: string;
  showCouponCode: boolean;
  logoUrl?: string;
}

export interface LiveConfig {
  active: boolean;
  youtubeUrl: string;
  productsIds: string[];
  couponActive: boolean;
  couponCode: string;
  couponValue: string;
  couponTimeLeft: number; // countdown in seconds
  highlightedProductId?: string;
  spectatorsCount?: number;
}

export interface PwaConfig {
  name: string;
  shortName: string;
  logoUrl: string;
  themeColor: string;
  displayMode: "standalone" | "fullscreen" | "browser";
}

export interface SystemState {
  adminPasscode: string;
  products: Product[];
  categories: Category[];
  orders: Order[];
  transactions: Transaction[];
  shippingNeighborhoods: NeighborhoodShipping[];
  shippingType: "bairro" | "combinar" | "fixo";
  shippingFixedCost: number;
  promotions: Promotion[];
  avisos: Aviso[];
  landpage: LandpageConfig;
  printing: PrintingConfig;
  live: LiveConfig;
  pwa?: PwaConfig;
}
