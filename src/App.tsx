import React, { useState, useEffect } from "react";
import { getInitialState, saveState } from "./initialState";
import { SystemState, Order } from "./types";
import StoreFront from "./components/StoreFront";
import AdminLayout from "./components/AdminLayout";
import AdminPasscodeModal from "./components/AdminPasscodeModal";
import { saveStateToFirebase, listenToFirebaseState } from "./lib/firebase";
import { RefreshCw } from "lucide-react";
import { AnimatePresence } from "motion/react";

export default function App() {
  const [state, setState] = useState<SystemState>(() => getInitialState());
  const [currentView, setCurrentView] = useState<"store" | "admin">("store");
  const [loading, setLoading] = useState<boolean>(true);
  const [showPasscodeModal, setShowPasscodeModal] = useState<boolean>(false);

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Dynamic Page Title & Favicon sync
  useEffect(() => {
    const title = state.pwa?.name || state.landpage.heroTitle || "Mundo Dutra Kids";
    document.title = title;

    const faviconUrl = state.landpage.faviconImage || state.landpage.logoImage;
    if (faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = faviconUrl;
    }
  }, [state.landpage.faviconImage, state.landpage.logoImage, state.landpage.heroTitle, state.pwa?.name]);

  // Connect to Firebase Firestore for real-time, persistent database sync
  useEffect(() => {
    let isFirstRun = true;
    
    const unsubscribe = listenToFirebaseState((firebaseState) => {
      if (firebaseState) {
        setState(firebaseState as SystemState);
      } else {
        // If Firestore has no database state yet, seed it with our initial state!
        if (isFirstRun) {
          saveStateToFirebase(state);
        }
      }
      isFirstRun = false;
      setLoading(false);
    });

    // Fallback if Firebase takes too long or fails to load
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleUpdateState = (newStateUpdates: Partial<SystemState>) => {
    setState((prev) => {
      const next = { ...prev, ...newStateUpdates };
      saveStateToFirebase(next);
      return next;
    });
  };

  const handlePlaceOrder = (newOrder: Order) => {
    // When customer buys, deduct product stock safely
    const updatedProducts = state.products.map((p) => {
      let sizes = [...p.sizes];
      newOrder.items.forEach((it) => {
        if (it.productId === p.id) {
          sizes = sizes.map((sz) => {
            if (sz.size === it.selectedSize) {
              return { ...sz, stock: Math.max(0, sz.stock - it.quantity) };
            }
            return sz;
          });
        }
      });
      return { ...p, sizes };
    });

    // Automatically record customer purchases into transaction ledger accounts receivable
    const newTx = {
      id: `t-${Date.now()}`,
      description: `Venda Online - Pedido ${newOrder.code}`,
      type: "receita" as const,
      amount: newOrder.total,
      date: new Date().toISOString().split("T")[0],
      status: "pendente" as const, // initially pending approval from merchant
      dueDate: new Date().toISOString().split("T")[0]
    };

    const nextState = {
      ...state,
      orders: [newOrder, ...state.orders],
      products: updatedProducts,
      transactions: [newTx, ...state.transactions]
    };

    setState(nextState);
    saveStateToFirebase(nextState);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex flex-col items-center justify-center p-4">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-full border-4 border-dashed border-[#5A5A40]/30 border-t-[#5A5A40] animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-xl">
            🧸
          </div>
        </div>
        <h3 className="font-bold text-gray-800 text-sm">Carregando Loja...</h3>
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Conectando ao Banco de Dados Seguro (Firebase)
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-[#5A5A40]/30 select-none">
      {currentView === "store" ? (
        <StoreFront
          state={state}
          onPlaceOrder={handlePlaceOrder}
          onBackToAdmin={() => setShowPasscodeModal(true)}
        />
      ) : (
        <AdminLayout
          state={state}
          onUpdateState={handleUpdateState}
          onBackToStore={() => setCurrentView("store")}
        />
      )}

      {/* Admin Passcode Verification Modal */}
      <AnimatePresence>
        {showPasscodeModal && (
          <AdminPasscodeModal
            correctPasscode={state.adminPasscode || "9310"}
            onSuccess={() => {
              setCurrentView("admin");
              setShowPasscodeModal(false);
            }}
            onClose={() => setShowPasscodeModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
