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
  paymentMethod: "Pix" | "Cartão de Crédito" | "Cartão de Débito" | "Boleto";
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  shippingType: "bairro" | "combinar" | "fixo";
  shippingDetails: string; // neighborhood or custom notes
  total: number;
  status: "pendente" | "aprovado" | "cancelado";
  observations?: string;
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
}

export interface Aviso {
  id: string;
  message: string;
  active: boolean;
  displayTimeSeconds: number; // 0 for permanent
  createdAt: string;
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
