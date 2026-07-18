import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, X, AlertCircle, CheckCircle2 } from "lucide-react";

interface AdminPasscodeModalProps {
  correctPasscode: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function AdminPasscodeModal({ correctPasscode, onSuccess, onClose }: AdminPasscodeModalProps) {
  const [code, setCode] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  // Allow typing from physical keyboard
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (success) return;
      
      if (e.key >= "0" && e.key <= "9") {
        if (code.length < 4) {
          setError(false);
          setCode(prev => prev + e.key);
        }
      } else if (e.key === "Backspace") {
        setError(false);
        setCode(prev => prev.slice(0, -1));
      } else if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [code, success, onClose]);

  // Handle digit click from virtual keypad
  const handleDigitClick = (digit: string) => {
    if (success) return;
    if (code.length < 4) {
      setError(false);
      setCode(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    if (success) return;
    setError(false);
    setCode(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (success) return;
    setError(false);
    setCode("");
  };

  // Verify the code when it reaches 4 digits
  useEffect(() => {
    if (code.length === 4) {
      if (code === correctPasscode) {
        setSuccess(true);
        const timer = setTimeout(() => {
          onSuccess();
        }, 800);
        return () => clearTimeout(timer);
      } else {
        setError(true);
        // Vibrate if supported
        if (navigator.vibrate) {
          navigator.vibrate(100);
        }
        // Reset code after a short delay
        const timer = setTimeout(() => {
          setCode("");
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [code, correctPasscode, onSuccess]);

  return (
    <div className="fixed inset-0 bg-[#1e1e1a]/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 25 }}
        className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-[#e0e0d6] overflow-hidden p-6 flex flex-col items-center relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Icon */}
        <div className="mb-4 mt-2">
          <motion.div
            animate={
              success 
                ? { scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] } 
                : error 
                ? { x: [-10, 10, -10, 10, 0] } 
                : {}
            }
            transition={{ duration: 0.4 }}
            className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${
              success
                ? "bg-green-50 border-green-500 text-green-500"
                : error
                ? "bg-red-50 border-red-400 text-red-500"
                : "bg-[#5A5A40]/10 border-[#5A5A40]/30 text-[#5A5A40]"
            }`}
          >
            {success ? (
              <CheckCircle2 className="w-7 h-7 animate-pulse" />
            ) : (
              <Lock className="w-6 h-6" />
            )}
          </motion.div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 text-center">
          Acesso Restrito
        </h3>
        <p className="text-xs text-gray-500 text-center mt-1 max-w-[240px] leading-relaxed">
          O painel administrativo é protegido. Insira o código de segurança para continuar.
        </p>

        {/* Dots Representation */}
        <div className="flex gap-4 my-6">
          {[0, 1, 2, 3].map((index) => {
            const hasDigit = code.length > index;
            return (
              <motion.div
                key={index}
                animate={hasDigit ? { scale: [1, 1.2, 1] } : {}}
                className={`w-4.5 h-4.5 rounded-full border-2 transition-all duration-200 ${
                  success
                    ? "bg-green-500 border-green-500"
                    : error
                    ? "bg-red-500 border-red-500 animate-bounce"
                    : hasDigit
                    ? "bg-[#5A5A40] border-[#5A5A40]"
                    : "bg-white border-gray-300"
                }`}
              />
            );
          })}
        </div>

        {/* Error / Success Message */}
        <div className="h-6 mb-4 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="text-xs text-red-500 font-bold flex items-center gap-1.5"
              >
                <AlertCircle className="w-3.5 h-3.5" /> Código incorreto. Tente novamente.
              </motion.p>
            )}
            {success && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-green-600 font-bold flex items-center gap-1.5"
              >
                Acesso concedido! Entrando...
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Virtual Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigitClick(digit)}
              className="w-full h-12 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold text-lg active:scale-95 transition-all duration-150 border border-gray-200/50 hover:border-gray-300/80 flex items-center justify-center shadow-sm"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="w-full h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-500 flex items-center justify-center transition"
          >
            Limpar
          </button>
          <button
            onClick={() => handleDigitClick("0")}
            className="w-full h-12 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold text-lg active:scale-95 transition-all duration-150 border border-gray-200/50 hover:border-gray-300/80 flex items-center justify-center shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="w-full h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-500 flex items-center justify-center transition"
          >
            Apagar
          </button>
        </div>

        {/* Info */}
        <p className="text-[9px] text-gray-400 mt-5 tracking-wide text-center uppercase">
          Mundo Dutra Kids • Segurança Protegida
        </p>
      </motion.div>
    </div>
  );
}
