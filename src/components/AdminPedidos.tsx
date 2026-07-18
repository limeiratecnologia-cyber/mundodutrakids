import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, Eye, Printer, Trash2, Send, CheckCircle, 
  XCircle, Clock, AlertCircle, ShoppingBag, X, FileText 
} from "lucide-react";
import { Order, SystemState, PrintingConfig } from "../types";

interface AdminPedidosProps {
  state: SystemState;
  onUpdateStatus: (id: string, status: "pendente" | "aprovado" | "cancelado") => void;
  onDeleteOrder: (id: string) => void;
}

export default function AdminPedidos({ state, onUpdateStatus, onDeleteOrder }: AdminPedidosProps) {
  const { orders, printing } = state;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pendente" | "aprovado" | "cancelado">("all");
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const triggerNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Filter status
      if (statusFilter !== "all" && o.status !== statusFilter) return false;

      // Filter search (client, whatsapp, sequential code)
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesClient = o.clientName.toLowerCase().includes(query);
        const matchesCode = o.code.toLowerCase().includes(query);
        const matchesPhone = o.clientWhatsapp.toLowerCase().includes(query);
        return matchesClient || matchesCode || matchesPhone;
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  // Format WhatsApp Link
  const handleSendWhatsApp = (order: Order) => {
    let rawPhone = order.clientWhatsapp.replace(/\D/g, "");
    if (!rawPhone.startsWith("55")) {
      rawPhone = "55" + rawPhone;
    }
    rawPhone = "+" + rawPhone;

    const itemsText = order.items.map(item => `• ${item.productName} (Tamanho: ${item.selectedSize}) x${item.quantity}`).join("\n");
    const text = `Olá, ${order.clientName}! Aqui é do Mundo Dutra Kids.\n\n` +
      `Confirmamos o recebimento do seu pedido *${order.code}* no total de *R$ ${order.total.toFixed(2)}*!\n\n` +
      `*Itens do Pedido:*\n${itemsText}\n\n` +
      `Forma de pagamento selecionada: *${order.paymentMethod}*.\n` +
      `Status do Pedido: *${order.status.toUpperCase()}*.\n\n` +
      `Entraremos em contato em breve para prosseguir com o envio! Obrigado! ✨`;

    // iOS supports raw send better or standard api URL. This works seamlessly across mobile platforms.
    const url = `https://api.whatsapp.com/send?phone=${rawPhone}&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // Trigger Local Browser Print View of Receipt
  const handlePrintReceipt = (order: Order) => {
    setSelectedOrderForPrint(order);
  };

  const executePrint = () => {
    const printContent = document.getElementById("receipt-print-area");
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Recibo - ${selectedOrderForPrint?.code}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4; color: #000; padding: 20px; width: 280px; margin: 0 auto; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; }
            .receipt-header { margin-bottom: 15px; }
            .receipt-footer { margin-top: 20px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="center receipt-header">
            ${printing.logoUrl ? `
              <img src="${printing.logoUrl}" style="max-height: 60px; max-width: 150px; margin-bottom: 10px; object-fit: contain; display: block; margin-left: auto; margin-right: auto;" />
            ` : ""}
            <span class="bold">${printing.headerText.replace(/\n/g, "<br>")}</span>
            <div class="divider"></div>
          </div>
          <div>
            <div><strong>Cupom:</strong> ${selectedOrderForPrint?.code}</div>
            <div><strong>Data:</strong> ${selectedOrderForPrint ? new Date(selectedOrderForPrint.date).toLocaleString("pt-BR") : ""}</div>
            <div><strong>Cliente:</strong> ${selectedOrderForPrint?.clientName}</div>
            <div><strong>WhatsApp:</strong> ${selectedOrderForPrint?.clientWhatsapp}</div>
          </div>
          <div class="divider"></div>
          <div class="bold">ITENS:</div>
          ${selectedOrderForPrint?.items.map(item => `
            <div class="row">
              <span>${item.productName.substring(0, 18)} (${item.selectedSize})</span>
              <span>x${item.quantity}</span>
            </div>
            <div class="row" style="font-size: 11px; margin-bottom: 4px;">
              <span>R$ ${item.unitPrice.toFixed(2)} cada</span>
              <span>R$ ${(item.unitPrice * item.quantity).toFixed(2)}</span>
            </div>
          `).join("")}
          <div class="divider"></div>
          <div class="row font-bold">
            <span>Subtotal:</span>
            <span>R$ ${selectedOrderForPrint?.subtotal.toFixed(2)}</span>
          </div>
          <div class="row font-bold">
            <span>Frete:</span>
            <span>R$ ${selectedOrderForPrint?.shippingCost.toFixed(2)}</span>
          </div>
          <div class="row font-bold" style="font-size: 14px;">
            <span>TOTAL:</span>
            <span>R$ ${selectedOrderForPrint?.total.toFixed(2)}</span>
          </div>
          <div class="divider"></div>
          <div><strong>Forma Pgto:</strong> ${selectedOrderForPrint?.paymentMethod}</div>
          <div><strong>Status:</strong> ${selectedOrderForPrint?.status.toUpperCase()}</div>
          <div class="divider"></div>
          <div class="center receipt-footer">
            ${printing.footerText.replace(/\n/g, "<br>")}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setSelectedOrderForPrint(null);
  };

  return (
    <div className="space-y-4">
      {notification && (
        <div className={`p-4 rounded-xl text-xs font-bold border transition-all ${
          notification.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
            : "bg-red-50 text-red-800 border-red-200"
        }`}>
          {notification.message}
        </div>
      )}
      {/* Search & Filter Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#e0e0d6] shadow-sm flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, telefone ou código do pedido..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#f5f5f0]/50 rounded-xl border border-[#e0e0d6] focus:outline-none focus:border-[#5A5A40] text-xs"
          />
        </div>

        {/* Status Pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {(["all", "pendente", "aprovado", "cancelado"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition ${
                statusFilter === st
                  ? "bg-[#5A5A40] text-white shadow-sm"
                  : "bg-[#e0e0d6]/40 text-[#5A5A40] hover:bg-[#e0e0d6]/70"
              }`}
            >
              {st === "all" ? "Todos" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List Container */}
      <div className="bg-white rounded-3xl border border-[#e0e0d6] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#f0f0e8] bg-[#fbfbfa] flex justify-between items-center">
          <h3 className="font-bold text-[#5A5A40] text-sm">Controle de Pedidos de Clientes</h3>
          <span className="text-[10px] bg-indigo-50 text-[#5A5A40] font-bold px-2.5 py-1 rounded">
            {filteredOrders.length} registros
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <h4 className="font-bold text-gray-700">Nenhum pedido correspondente</h4>
            <p className="text-xs text-gray-400 mt-1">Nenhum pedido foi encontrado com os filtros ativos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-[#e0e0d6] text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="p-4">Pedido / Data</th>
                  <th className="p-4">Cliente / WhatsApp</th>
                  <th className="p-4">Produtos</th>
                  <th className="p-4">Valor Total</th>
                  <th className="p-4">Forma / Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  
                  const statusColors = {
                    pendente: "bg-amber-50 text-amber-700 border-amber-200",
                    aprovado: "bg-green-50 text-green-700 border-green-200",
                    cancelado: "bg-red-50 text-red-600 border-red-200 line-through"
                  };

                  return (
                    <tr key={order.id} className="hover:bg-[#fbfbfa] transition">
                      <td className="p-4">
                        <p className="font-extrabold text-gray-900">{order.code}</p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {new Date(order.date).toLocaleDateString("pt-BR")} às {new Date(order.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-gray-800">{order.clientName}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{order.clientWhatsapp}</p>
                      </td>
                      <td className="p-4">
                        <div className="space-y-0.5 max-w-xs">
                          {order.items.map((item, i) => (
                            <p key={i} className="text-[11px] text-gray-700 leading-tight">
                              • <span className="font-bold">{item.productName}</span> ({item.selectedSize}) <span className="text-gray-400">x{item.quantity}</span>
                            </p>
                          ))}
                          {order.observations && (
                            <p className="text-[10px] text-amber-600 bg-amber-50/50 p-1 rounded mt-1 italic font-medium">
                              📝 Obs: {order.observations}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-extrabold text-[#5A5A40]">
                        R$ {order.total.toFixed(2)}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[9px] font-bold uppercase">
                            {order.paymentMethod}
                          </span>
                          <div>
                            <span className={`inline-block px-2 py-0.5 border rounded text-[9px] font-bold uppercase ${statusColors[order.status]}`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-1.5 justify-end">
                          {/* Quick Approval Actions */}
                          {order.status === "pendente" && (
                            <button
                              onClick={() => onUpdateStatus(order.id, "aprovado")}
                              title="Aprovar Pedido"
                              className="p-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition border border-green-200"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          {order.status !== "cancelado" && (
                            <button
                              onClick={() => onUpdateStatus(order.id, "cancelado")}
                              title="Cancelar Pedido"
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition border border-red-200"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* WhatsApp dispatch */}
                          <button
                            onClick={() => handleSendWhatsApp(order)}
                            title="Enviar Comprovante WhatsApp"
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition border border-blue-200"
                          >
                            <Send className="w-4 h-4" />
                          </button>

                          {/* Print Receipt */}
                          <button
                            onClick={() => handlePrintReceipt(order)}
                            title="Visualizar Recibo e Imprimir"
                            className="p-1.5 bg-[#5A5A40]/10 hover:bg-[#5A5A40]/25 text-[#5A5A40] rounded-lg transition border border-[#5A5A40]/20"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Permanent Exclusion */}
                          {deleteConfirmId === order.id ? (
                            <div className="flex items-center gap-1 bg-red-50 p-1 rounded border border-red-200 animate-pulse">
                              <span className="text-[9px] font-bold text-red-600">Apagar?</span>
                              <button
                                onClick={() => {
                                  onDeleteOrder(order.id);
                                  setDeleteConfirmId(null);
                                  triggerNotification(`Pedido ${order.code} excluído.`);
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white px-1.5 py-0.5 rounded text-[8px] font-bold transition"
                              >
                                Sim
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-1.5 py-0.5 rounded text-[8px] font-bold transition"
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(order.id)}
                              title="Excluir Pedido"
                              className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Local Print Review Dialog */}
      <AnimatePresence>
        {selectedOrderForPrint && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#e0e0d6]"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                <h4 className="font-bold text-gray-900 text-sm">Visualização do Cupom Térmico</h4>
                <button onClick={() => setSelectedOrderForPrint(null)}>
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Virtual Receipt preview box */}
              <div id="receipt-print-area" className="bg-[#fcfcfa] p-4 border border-dashed border-gray-400 font-mono text-[11px] leading-relaxed text-black max-h-[300px] overflow-y-auto">
                <div className="text-center font-bold flex flex-col items-center">
                  {printing.logoUrl && (
                    <img
                      src={printing.logoUrl}
                      alt="Logo Recibo"
                      className="max-h-12 max-w-[120px] object-contain mb-2"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  {printing.headerText.split("\n").map((line, idx) => (
                    <p key={idx} className="m-0">{line}</p>
                  ))}
                </div>
                <div className="border-b border-dashed border-black my-2"></div>
                
                <p><strong>CUPOM:</strong> {selectedOrderForPrint.code}</p>
                <p><strong>DATA:</strong> {new Date(selectedOrderForPrint.date).toLocaleString("pt-BR")}</p>
                <p><strong>CLIENTE:</strong> {selectedOrderForPrint.clientName}</p>
                <p><strong>FONE:</strong> {selectedOrderForPrint.clientWhatsapp}</p>
                <div className="border-b border-dashed border-black my-2"></div>

                <p className="font-bold">ITENS:</p>
                {selectedOrderForPrint.items.map((it, i) => (
                  <div key={i} className="mb-1.5">
                    <div className="flex justify-between">
                      <span>• {it.productName.substring(0, 15)} ({it.selectedSize})</span>
                      <span>x{it.quantity}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-600">
                      <span>R$ {it.unitPrice.toFixed(2)} cada</span>
                      <span>R$ {(it.unitPrice * it.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                <div className="border-b border-dashed border-black my-2"></div>

                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {selectedOrderForPrint.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete:</span>
                  <span>R$ {selectedOrderForPrint.shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm">
                  <span>TOTAL GERAL:</span>
                  <span>R$ {selectedOrderForPrint.total.toFixed(2)}</span>
                </div>
                
                <div className="border-b border-dashed border-black my-2"></div>
                <p><strong>PAGTO:</strong> {selectedOrderForPrint.paymentMethod}</p>
                <p><strong>STATUS:</strong> {selectedOrderForPrint.status.toUpperCase()}</p>
                
                <div className="border-b border-dashed border-black my-2"></div>
                <div className="text-center text-[10px]">
                  {printing.footerText.split("\n").map((line, idx) => (
                    <p key={idx} className="m-0">{line}</p>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setSelectedOrderForPrint(null)}
                  className="flex-1 border border-gray-200 text-gray-500 hover:bg-gray-50 py-2 rounded-xl text-xs font-semibold"
                >
                  Fechar
                </button>
                <button
                  onClick={executePrint}
                  className="flex-1 bg-[#5A5A40] hover:bg-[#484833] text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Enviar p/ Impressora
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
