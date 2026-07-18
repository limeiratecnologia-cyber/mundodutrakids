import React, { useState, useEffect } from "react";
import { Smartphone, Download, X, Share, PlusSquare, MoreVertical, Menu } from "lucide-react";
import { PwaConfig } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface PwaInstallPromptProps {
  pwaConfig?: PwaConfig;
  accentColor?: string;
}

export default function PwaInstallPrompt({ pwaConfig, accentColor = "#5A5A40" }: PwaInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [showAndroidFallback, setShowAndroidFallback] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const appName = pwaConfig?.name || "Mundo Dutra Kids";
  const appShortName = pwaConfig?.shortName || "Dutra Kids";
  const appIcon = pwaConfig?.logoUrl || "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=200&auto=format&fit=crop";
  const themeColor = pwaConfig?.themeColor || accentColor;

  // 1. DYNAMIC META AND MANIFEST INJECTION BASED ON ADMIN PWA VALUES
  useEffect(() => {
    const manifestObj = {
      name: appName,
      short_name: appShortName,
      start_url: "/",
      display: pwaConfig?.displayMode || "standalone",
      background_color: "#ffffff",
      theme_color: themeColor,
      icons: [
        {
          src: appIcon,
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: appIcon,
          sizes: "512x512",
          type: "image/png"
        }
      ]
    };

    const manifestString = JSON.stringify(manifestObj);
    const blob = new Blob([manifestString], { type: "application/json" });
    const manifestUrl = URL.createObjectURL(blob);

    let linkTag = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
    if (!linkTag) {
      linkTag = document.createElement("link");
      linkTag.rel = "manifest";
      document.head.appendChild(linkTag);
    }
    linkTag.href = manifestUrl;

    // Apple Meta Tags
    let appleCapable = document.querySelector("meta[name='apple-mobile-web-app-capable']");
    if (!appleCapable) {
      appleCapable = document.createElement("meta");
      appleCapable.setAttribute("name", "apple-mobile-web-app-capable");
      appleCapable.setAttribute("content", "yes");
      document.head.appendChild(appleCapable);
    }

    let appleTitle = document.querySelector("meta[name='apple-mobile-web-app-title']");
    if (!appleTitle) {
      appleTitle = document.createElement("meta");
      appleTitle.setAttribute("name", "apple-mobile-web-app-title");
      document.head.appendChild(appleTitle);
    }
    appleTitle.setAttribute("content", appShortName);

    let appleIconTag = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
    if (!appleIconTag) {
      appleIconTag = document.createElement("link");
      appleIconTag.rel = "apple-touch-icon";
      document.head.appendChild(appleIconTag);
    }
    appleIconTag.href = appIcon;

    // Theme Color Meta Tag
    let themeColorMeta = document.querySelector("meta[name='theme-color']");
    if (!themeColorMeta) {
      themeColorMeta = document.createElement("meta");
      themeColorMeta.setAttribute("name", "theme-color");
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.setAttribute("content", themeColor);

    return () => {
      URL.revokeObjectURL(manifestUrl);
    };
  }, [appName, appShortName, appIcon, themeColor, pwaConfig?.displayMode]);

  // 2. REGISTER SERVICE WORKER AND INITIALIZE PWA INSTALL LISTENER
  useEffect(() => {
    // Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => console.log("PWA Service Worker registered:", reg.scope))
        .catch((err) => console.warn("PWA Service Worker registration failed:", err));
    }

    // Detect if the device is mobile
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const mobileCheck = /android|iphone|ipad|ipod|iemobile|opera mini/i.test(userAgent);
    setIsMobile(mobileCheck);

    // Detect if it's iOS
    const iosCheck = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIos(iosCheck);

    // Detect if running inside standalone PWA mode already
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      console.log("App is already running in standalone PWA mode");
      return; 
    }

    // Check localStorage dismissal so we don't annoy users continuously
    const dismissedAt = localStorage.getItem("pwa_prompt_dismissed_at");
    if (dismissedAt) {
      const timeDiff = Date.now() - parseInt(dismissedAt, 10);
      const cooldownPeriod = 3 * 3600000; // 3 hours cooldown
      if (timeDiff < cooldownPeriod) {
        return;
      }
    }

    if (iosCheck) {
      if (mobileCheck) {
        // Show iOS help sheet tutorial after a brief friendly delay
        const timer = setTimeout(() => {
          setShowIosPrompt(true);
        }, 4000);
        return () => clearTimeout(timer);
      }
    } else {
      // Standard Android / Chrome event
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        if (mobileCheck) {
          setShowAndroidPrompt(true);
        }
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      // Fallback Timer for Android if the browser doesn't trigger standard beforeinstallprompt
      // but they are accessing via mobile (e.g. inside a WebView, custom app, or unsupported browser)
      let fallbackTimer: NodeJS.Timeout;
      if (mobileCheck) {
        fallbackTimer = setTimeout(() => {
          // If neither standard prompt nor iOS prompt is open, and deferredPrompt didn't trigger
          if (!deferredPrompt && !showAndroidPrompt) {
            setShowAndroidFallback(true);
          }
        }, 8000);
      }

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        if (fallbackTimer) clearTimeout(fallbackTimer);
      };
    }
  }, [deferredPrompt, showAndroidPrompt]);

  const handleDismiss = () => {
    localStorage.setItem("pwa_prompt_dismissed_at", Date.now().toString());
    setShowAndroidPrompt(false);
    setShowAndroidFallback(false);
    setShowIosPrompt(false);
  };

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install user outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowAndroidPrompt(false);
  };

  if (!isMobile) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9999] pointer-events-none p-4 flex flex-col items-center">
      <AnimatePresence>
        {/* ANDROID - Standard beforeinstallprompt banner */}
        {showAndroidPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 120, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 120, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="w-full max-w-md bg-white/95 backdrop-blur-md border border-gray-100 rounded-3xl p-4.5 shadow-2xl pointer-events-auto flex flex-col gap-4 relative overflow-hidden"
          >
            {/* Elegant PWA Brand Highlight Bar */}
            <div className="absolute top-0 inset-x-0 h-1.5" style={{ backgroundColor: themeColor }}></div>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0 shadow-sm">
                <img src={appIcon} alt={appShortName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1">
                <span className="bg-[#5A5A40]/10 text-[#5A5A40] text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md">Instalar Aplicativo</span>
                <h4 className="text-xs font-black text-gray-800 leading-tight mt-1">Deseja instalar o App?</h4>
                <p className="text-[10px] text-gray-400 font-bold leading-normal mt-0.5">
                  Acesse a loja diretamente da sua tela de início, offline e muito mais rápido!
                </p>
              </div>
              <button 
                onClick={handleDismiss}
                className="w-7 h-7 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={handleDismiss}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-500 font-black text-[11px] py-3 rounded-xl transition"
              >
                Agora não
              </button>
              <button
                onClick={handleAndroidInstall}
                style={{ backgroundColor: themeColor }}
                className="flex-1 text-white font-black text-[11px] py-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
              >
                <Download className="w-4 h-4" /> Instalar App
              </button>
            </div>
          </motion.div>
        )}

        {/* ANDROID - Fallback Manual Guide Popup (Triggered when browser doesn't support automatic prompt) */}
        {showAndroidFallback && (
          <motion.div
            initial={{ opacity: 0, y: 120 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 120 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="w-full max-w-md bg-white/95 backdrop-blur-md border border-gray-100 rounded-3xl p-5 shadow-2xl pointer-events-auto flex flex-col gap-4 relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1.5" style={{ backgroundColor: themeColor }}></div>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0 shadow-sm">
                  <img src={appIcon} alt={appShortName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <span className="bg-[#5A5A40]/10 text-[#5A5A40] text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md">Adicionar à Tela Inicial</span>
                  <h4 className="text-xs font-black text-gray-800 leading-tight mt-1">Como instalar o Aplicativo</h4>
                  <p className="text-[10px] text-gray-400 font-bold leading-normal mt-0.5">
                    Leve a {appShortName} no seu bolso com estes passos simples:
                  </p>
                </div>
              </div>
              <button 
                onClick={handleDismiss}
                className="w-7 h-7 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                <p className="text-[11px] text-gray-600 font-bold leading-relaxed">
                  Toque nos três pontinhos <MoreVertical className="w-3.5 h-3.5 inline text-gray-700" /> ou no ícone de menu <Menu className="w-3.5 h-3.5 inline text-gray-700" /> no topo ou base do navegador.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                <p className="text-[11px] text-gray-600 font-bold leading-relaxed">
                  Selecione <span className="text-gray-800 font-black">"Instalar aplicativo"</span> ou <span className="text-gray-800 font-black">"Adicionar à tela inicial"</span>.
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              style={{ backgroundColor: themeColor }}
              className="w-full text-white font-black text-xs py-3 rounded-2xl transition shadow-sm active:scale-[0.98]"
            >
              Entendi, obrigado!
            </button>
          </motion.div>
        )}

        {/* IOS / IPHONE / IPAD - Dynamic Share Sheet tutorial */}
        {showIosPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 150 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 150 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="w-full max-w-md bg-white/95 backdrop-blur-md border border-gray-100 rounded-t-[32px] p-6 shadow-2xl pointer-events-auto flex flex-col gap-4 relative overflow-hidden"
          >
            {/* Soft decorative iOS Grab Handle */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-1"></div>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0 shadow-sm">
                  <img src={appIcon} alt={appShortName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <span className="bg-pink-100 text-pink-700 text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md">Dispositivo iOS</span>
                  <h4 className="text-xs font-black text-gray-800 leading-tight mt-1">Instalar no seu iPhone</h4>
                  <p className="text-[10px] text-gray-400 font-bold leading-normal mt-0.5">
                    Adicione o aplicativo da {appShortName} à sua tela de início!
                  </p>
                </div>
              </div>
              <button 
                onClick={handleDismiss}
                className="w-7 h-7 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4.5 border border-gray-100 space-y-3.5">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                <p className="text-[11px] text-gray-600 font-bold leading-relaxed">
                  Toque no ícone de <span className="inline-flex items-center gap-0.5 text-blue-600 font-black">Compartilhar <Share className="w-3.5 h-3.5 inline text-blue-600" /></span> na barra inferior do Safari.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                <p className="text-[11px] text-gray-600 font-bold leading-relaxed">
                  Deslize o menu para baixo e selecione <span className="text-gray-800 font-black">"Adicionar à Tela de Início" <PlusSquare className="w-3.5 h-3.5 inline text-gray-800 ml-0.5" /></span>.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                <p className="text-[11px] text-gray-600 font-bold leading-relaxed">
                  Toque em <span className="text-pink-600 font-black">"Adicionar"</span> no canto superior direito para confirmar e instalar.
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              style={{ backgroundColor: themeColor }}
              className="w-full text-white font-black text-xs py-3 rounded-2xl transition shadow-sm active:scale-[0.98]"
            >
              Entendi, obrigado!
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
