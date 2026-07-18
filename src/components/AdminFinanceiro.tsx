import React, { useState, useMemo } from "react";
import { Plus, Check, Trash2, Calendar, AlertTriangle, ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { Transaction } from "../types";

interface AdminFinanceiroProps {
  transactions: Transaction[];
  onAddTransaction: (t: Transaction) => void;
  onToggleStatus: (id: string) => void;
  onDeleteTransaction: (id: string) => void;
}

export default function AdminFinanceiro({ transactions, onAddTransaction, onToggleStatus, onDeleteTransaction }: AdminFinanceiroProps) {
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"receita" | "despesa">("receita");
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState<"pago" | "pendente">("pendente");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const triggerNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const revenueTotal = useMemo(() => {
    return transactions
      .filter(t => t.type === "receita" && t.status === "pago")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const expenseTotal = useMemo(() => {
    return transactions
      .filter(t => t.type === "despesa" && t.status === "pago")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const balance = useMemo(() => revenueTotal - expenseTotal, [revenueTotal, expenseTotal]);

  const pendingPayables = useMemo(() => {
    return transactions.filter(t => t.type === "despesa" && t.status === "pendente");
  }, [transactions]);

  const pendingReceivables = useMemo(() => {
    return transactions.filter(t => t.type === "receita" && t.status === "pendente");
  }, [transactions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;

    const newTx: Transaction = {
      id: `t-${Date.now()}`,
      description: description.trim(),
      type,
      amount,
      date: new Date().toISOString().split("T")[0],
      status,
      dueDate
    };

    onAddTransaction(newTx);
    
    // Clear
    setDescription("");
    setAmount(0);
    setIsFormOpen(false);
    triggerNotification("Transação lançada com sucesso!");
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`p-4 rounded-xl text-xs font-bold border transition-all ${
          notification.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
            : "bg-red-50 text-red-800 border-red-200"
        }`}>
          {notification.message}
        </div>
      )}
      
      {/* Finance summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Box 1 */}
        <div className="bg-white p-5 rounded-2xl border border-[#e0e0d6] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Receitas Faturadas</p>
            <p className="text-xl font-black text-green-600">R$ {revenueTotal.toFixed(2)}</p>
          </div>
          <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        {/* Box 2 */}
        <div className="bg-white p-5 rounded-2xl border border-[#e0e0d6] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Despesas Pagas</p>
            <p className="text-xl font-black text-red-500">R$ {expenseTotal.toFixed(2)}</p>
          </div>
          <div className="p-2.5 bg-red-50 text-red-500 rounded-xl">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        {/* Box 3 */}
        <div className="bg-white p-5 rounded-2xl border border-[#e0e0d6] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Fluxo Líquido Caixa</p>
            <p className={`text-xl font-black ${balance >= 0 ? "text-[#5A5A40]" : "text-red-600"}`}>
              R$ {balance.toFixed(2)}
            </p>
          </div>
          <div className="p-2.5 bg-[#5A5A40]/10 text-[#5A5A40] rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Alerta de vencimentos */}
      {(pendingPayables.length > 0 || pendingReceivables.length > 0) && (
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-800 text-xs uppercase">Contas a Vencer e Alertas de Caixa</h4>
            <p className="text-xs text-amber-700 mt-1">
              Há {pendingPayables.length} contas a pagar pendentes e {pendingReceivables.length} faturamentos a receber previstos.
            </p>
          </div>
        </div>
      )}

      {/* Lançamento controls */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#e0e0d6]">
        <h3 className="font-extrabold text-gray-900 text-sm">Livro Caixa e Fluxo Financeiro</h3>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-[#5A5A40] hover:bg-[#484833] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold"
        >
          {isFormOpen ? "Fechar Formulário" : "Lançar Conta Manual"}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl border border-[#e0e0d6] max-w-lg grid grid-cols-2 gap-3 shadow-sm">
          <div className="col-span-2">
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">Descrição do Fluxo *</label>
            <input
              type="text"
              required
              placeholder="Ex: Pagamento Fornecedor Tricoline"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-[#e0e0d6] rounded-xl"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">Tipo de Fluxo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-[#e0e0d6] rounded-xl"
            >
              <option value="receita">📈 Receita (Receber)</option>
              <option value="despesa">📉 Despesa (Pagar)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">Valor (R$) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-[#e0e0d6] rounded-xl"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">Vencimento</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-[#e0e0d6] rounded-xl"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-0.5">Status Inicial</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-[#e0e0d6] rounded-xl"
            >
              <option value="pendente">Aguardando / Pendente</option>
              <option value="pago">Quitado / Recebido</option>
            </select>
          </div>

          <div className="col-span-2 text-right pt-2 border-t border-gray-100">
            <button type="submit" className="bg-[#5A5A40] text-white px-4 py-1.5 rounded-lg text-xs font-bold">
              ✓ Lançar no Livro Caixa
            </button>
          </div>
        </form>
      )}

      {/* Bookkeeper table */}
      <div className="bg-white rounded-3xl border border-[#e0e0d6] overflow-hidden shadow-sm">
        <div className="p-4 bg-[#fbfbfa] border-b border-gray-100 flex justify-between items-center text-xs">
          <span className="font-bold text-[#5A5A40]">Histórico de Transações</span>
          <span className="text-gray-400">{transactions.length} fluxos totais</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b border-gray-200 text-[9px] uppercase tracking-wider font-extrabold text-gray-400">
            <tr>
              <th className="p-3">Data / Descrição</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Vencimento</th>
              <th className="p-3">Valor</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="p-3">
                  <p className="font-bold text-gray-800">{tx.description}</p>
                  <p className="text-[10px] text-gray-400">{tx.date}</p>
                </td>
                <td className="p-3">
                  {tx.type === "receita" ? (
                    <span className="text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded">Entrada</span>
                  ) : (
                    <span className="text-red-500 font-semibold bg-red-50 px-2 py-0.5 rounded">Saída</span>
                  )}
                </td>
                <td className="p-3 text-gray-500 font-medium">
                  {tx.dueDate ? new Date(tx.dueDate).toLocaleDateString("pt-BR") : "À Vista"}
                </td>
                <td className="p-3 font-extrabold text-[#5A5A40]">
                  R$ {tx.amount.toFixed(2)}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => onToggleStatus(tx.id)}
                    className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase transition ${
                      tx.status === "pago"
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800 animate-pulse"
                    }`}
                  >
                    {tx.status === "pago" ? "✓ Pago/Quitado" : "⏳ Pendente"}
                  </button>
                </td>
                <td className="p-3 text-right">
                  {deleteConfirmId === tx.id ? (
                    <div className="flex items-center gap-1 justify-end bg-red-50 p-1 rounded border border-red-200 animate-pulse">
                      <span className="text-[9px] font-bold text-red-600">Apagar?</span>
                      <button
                        onClick={() => {
                          onDeleteTransaction(tx.id);
                          setDeleteConfirmId(null);
                          triggerNotification(`Transação "${tx.description}" excluída.`);
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
                      onClick={() => setDeleteConfirmId(tx.id)}
                      className="p-1 hover:text-red-500 text-gray-300 transition"
                      title="Excluir Transação"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
