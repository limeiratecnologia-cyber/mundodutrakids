import React, { useState } from "react";
import { 
  LayoutDashboard, ShoppingCart, Scissors, Package, FolderHeart, 
  DollarSign, Store, Radio, BarChart3, Eye, LogOut, Menu, X 
} from "lucide-react";
import { SystemState, Product, Category, Transaction, Order } from "../types";

// Inner views
import AdminDashboard from "./AdminDashboard";
import AdminPedidos from "./AdminPedidos";
import AdminPDV from "./AdminPDV";
import AdminProdutos from "./AdminProdutos";
import AdminCategorias from "./AdminCategorias";
import AdminFinanceiro from "./AdminFinanceiro";
import AdminMinhaLoja from "./AdminMinhaLoja";
import AdminLiveShop from "./AdminLiveShop";
import AdminRelatorios from "./AdminRelatorios";

interface AdminLayoutProps {
  state: SystemState;
  onUpdateState: (newState: Partial<SystemState>) => void;
  onBackToStore: () => void;
}

export default function AdminLayout({ state, onUpdateState, onBackToStore }: AdminLayoutProps) {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { products, categories, transactions, orders } = state;

  // Menu items specification
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "pedidos", label: "Pedidos", icon: ShoppingCart },
    { id: "pdv", label: "PDV (Caixa)", icon: Scissors },
    { id: "produtos", label: "Produtos", icon: Package },
    { id: "categorias", label: "Categorias", icon: FolderHeart },
    { id: "financeiro", label: "Financeiro", icon: DollarSign },
    { id: "minha-loja", label: "Minha Loja", icon: Store },
    { id: "live-shop", label: "Live Shop", icon: Radio },
    { id: "relatorios", label: "Relatórios", icon: BarChart3 },
  ];

  // Helpers to pipe state updates
  const handleAddProduct = (newProduct: Product) => {
    onUpdateState({ products: [...products, newProduct] });
  };

  const handleEditProduct = (updated: Product) => {
    onUpdateState({
      products: products.map(p => p.id === updated.id ? updated : p)
    });
  };

  const handleDeleteProduct = (id: string) => {
    onUpdateState({
      products: products.filter(p => p.id !== id)
    });
  };

  const handleAddCategory = (cat: Category) => {
    onUpdateState({ categories: [...categories, cat] });
  };

  const handleEditCategory = (updated: Category) => {
    onUpdateState({
      categories: categories.map(c => c.id === updated.id ? updated : c)
    });
  };

  const handleDeleteCategory = (id: string) => {
    onUpdateState({
      categories: categories.filter(c => c.id !== id)
    });
  };

  const handleAddTransaction = (t: Transaction) => {
    onUpdateState({ transactions: [...transactions, t] });
  };

  const handleToggleTxStatus = (id: string) => {
    onUpdateState({
      transactions: transactions.map(t => t.id === id ? { ...t, status: t.status === "pago" ? "pendente" : "pago" } : t)
    });
  };

  const handleDeleteTransaction = (id: string) => {
    onUpdateState({
      transactions: transactions.filter(t => t.id !== id)
    });
  };

  const handleUpdateOrderStatus = (id: string, status: "pendente" | "aprovado" | "cancelado") => {
    // If order was approved, deduct stock
    if (status === "aprovado") {
      const order = orders.find(o => o.id === id);
      if (order && order.status !== "aprovado") {
        // Deduct stock safely
        const updatedProducts = products.map(p => {
          let sizes = [...p.sizes];
          order.items.forEach(it => {
            if (it.productId === p.id) {
              sizes = sizes.map(sz => {
                if (sz.size === it.selectedSize && (sz.color || "") === (it.selectedColor || "")) {
                  return { ...sz, stock: Math.max(0, sz.stock - it.quantity) };
                }
                return sz;
              });
            }
          });
          return { ...p, sizes };
        });
        onUpdateState({ products: updatedProducts });
      }
    }

    onUpdateState({
      orders: orders.map(o => o.id === id ? { ...o, status } : o)
    });
  };

  const handleDeleteOrder = (id: string) => {
    onUpdateState({
      orders: orders.filter(o => o.id !== id)
    });
  };

  const handleAddOrder = (newOrder: Order) => {
    // Subtract stock immediately since PDV sales are approved instantly
    const updatedProducts = products.map(p => {
      let sizes = [...p.sizes];
      newOrder.items.forEach(it => {
        if (it.productId === p.id) {
          sizes = sizes.map(sz => {
            if (sz.size === it.selectedSize && (sz.color || "") === (it.selectedColor || "")) {
              return { ...sz, stock: Math.max(0, sz.stock - it.quantity) };
            }
            return sz;
          });
        }
      });
      return { ...p, sizes };
    });

    onUpdateState({
      orders: [newOrder, ...orders],
      products: updatedProducts
    });
  };

  const handleStatePipedUpdates = (updates: Partial<SystemState>) => {
    onUpdateState(updates);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] font-sans text-gray-800 flex flex-col md:flex-row">
      
      {/* Admin navigation Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-[#e0e0d6] flex flex-col justify-between shrink-0 md:h-screen sticky top-0 z-40">
        
        <div className="p-5 border-b border-[#f0f0e8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-[#5A5A40] flex items-center justify-center text-white font-serif font-black text-sm">
              M
            </span>
            <div>
              <h1 className="font-serif font-bold text-[#5A5A40] leading-none text-sm">Mundo Dutra</h1>
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Painel de Controle</span>
            </div>
          </div>

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Menu scroll area */}
        <nav className={`flex-1 p-4 space-y-1.5 overflow-y-auto ${isMobileMenuOpen ? "block" : "hidden md:block"}`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-left transition flex items-center gap-3 ${
                  isSelected 
                    ? "bg-[#5A5A40] text-white shadow-sm" 
                    : "hover:bg-gray-100 text-[#5A5A40]"
                }`}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-4 border-t border-[#f0f0e8] mt-4">
            <button
              onClick={onBackToStore}
              className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-left transition flex items-center gap-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
            >
              <Eye className="w-4.5 h-4.5 shrink-0" />
              <span>Ver Loja</span>
            </button>
          </div>
        </nav>

        {/* Footer info user */}
        <div className="p-4 border-t border-[#f0f0e8] hidden md:flex items-center justify-between text-xs text-gray-400 font-bold bg-[#fbfbfa]">
          <span>Mundo Dutra Admin v1.4</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" title="Sistema Operando" />
        </div>

      </aside>

      {/* Main Content scroll viewport */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        
        {/* Dynamic header route tracker */}
        <header className="mb-6 pb-4 border-b border-[#e0e0d6]/70 flex justify-between items-center">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-widest text-gray-400 block">GERENCIADOR DE LOJA</span>
            <h2 className="text-xl font-serif font-extrabold text-[#5A5A40] capitalize">{activeTab.replace("-", " ")}</h2>
          </div>

          <div className="text-right text-[10px] font-mono text-gray-400">
            <span>Terminal: {new Date().toLocaleDateString("pt-BR")}</span>
          </div>
        </header>

        {/* Tabs switcher viewport */}
        <div className="transition-all duration-200">
          {activeTab === "dashboard" && <AdminDashboard state={state} />}
          {activeTab === "pedidos" && (
            <AdminPedidos 
              state={state} 
              onUpdateStatus={handleUpdateOrderStatus} 
              onDeleteOrder={handleDeleteOrder} 
            />
          )}
          {activeTab === "pdv" && (
            <AdminPDV 
              state={state} 
              onAddOrder={handleAddOrder} 
            />
          )}
          {activeTab === "produtos" && (
            <AdminProdutos 
              products={products} 
              categories={categories} 
              onAddProduct={handleAddProduct} 
              onEditProduct={handleEditProduct} 
              onDeleteProduct={handleDeleteProduct} 
            />
          )}
          {activeTab === "categorias" && (
            <AdminCategorias 
              categories={categories} 
              onAddCategory={handleAddCategory} 
              onEditCategory={handleEditCategory} 
              onDeleteCategory={handleDeleteCategory} 
            />
          )}
          {activeTab === "financeiro" && (
            <AdminFinanceiro 
              transactions={transactions} 
              onAddTransaction={handleAddTransaction} 
              onToggleStatus={handleToggleTxStatus} 
              onDeleteTransaction={handleDeleteTransaction} 
            />
          )}
          {activeTab === "minha-loja" && (
            <AdminMinhaLoja 
              state={state} 
              onUpdateState={handleStatePipedUpdates} 
            />
          )}
          {activeTab === "live-shop" && (
            <AdminLiveShop 
              state={state} 
              onUpdateState={handleStatePipedUpdates} 
            />
          )}
          {activeTab === "relatorios" && <AdminRelatorios state={state} />}
        </div>

      </main>

    </div>
  );
}
