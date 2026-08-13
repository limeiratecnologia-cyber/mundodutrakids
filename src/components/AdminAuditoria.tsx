import React, { useState } from "react";
import { 
  ShieldCheck, Database, RefreshCw, History, PlusCircle, Edit3, 
  Trash2, RotateCcw, Search, CheckCircle2, AlertTriangle, Download, Trash
} from "lucide-react";
import { SystemState, AuditLogEntry, PeriodicBackupSnapshot } from "../types";
import { getPeriodicBackups, performPeriodicBackup, clearPeriodicBackups } from "../utils/backupService";

interface AdminAuditoriaProps {
  state: SystemState;
  onUpdateState: (newState: Partial<SystemState>) => void;
}

export default function AdminAuditoria({ state, onUpdateState }: AdminAuditoriaProps) {
  const [activeTab, setActiveTab] = useState<"logs" | "backups">("logs");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [backups, setBackups] = useState<PeriodicBackupSnapshot[]>(() => getPeriodicBackups());

  const auditLogs: AuditLogEntry[] = state.auditLogs || [];

  const triggerNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleManualBackup = () => {
    const snap = performPeriodicBackup(state, true);
    if (snap) {
      setBackups(getPeriodicBackups());
      triggerNotification("Novo backup criado! O antigo Último virou Penúltimo e o anterior foi sobrescrito.");
    } else {
      triggerNotification("Erro ao criar ponto de restauração.", "error");
    }
  };

  const handleClearBackups = () => {
    if (window.confirm("Deseja realmente limpar o histórico de backups locais?")) {
      clearPeriodicBackups();
      setBackups([]);
      triggerNotification("Histórico de backups limpo.");
    }
  };

  const handleClearLogs = () => {
    if (window.confirm("Deseja limpar todos os logs de auditoria gravados?")) {
      onUpdateState({ auditLogs: [] });
      triggerNotification("Logs de auditoria zerados com sucesso!");
    }
  };

  const handleRestoreBackupPoint = (snap: PeriodicBackupSnapshot) => {
    if (window.confirm(`Deseja restaurar o estado da loja para o ponto de ${snap.formattedDate}? Os dados atuais serão substituídos pelo backup.`)) {
      onUpdateState({
        ...snap.state,
        auditLogs: [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: "backup_restore",
            productName: "Restauração de Backup",
            details: `Estado restaurado para o ponto de ${snap.formattedDate} (${snap.productCount} produtos)`,
            user: "Admin"
          },
          ...(state.auditLogs || [])
        ]
      });
      triggerNotification(`Estado da loja restaurado com sucesso para ${snap.formattedDate}!`);
    }
  };

  // Filter audit logs
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch = 
      (log.productName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === "all" || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: AuditLogEntry["action"]) => {
    switch (action) {
      case "create":
        return (
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
            <PlusCircle className="w-3 h-3 text-emerald-600" /> Criado
          </span>
        );
      case "update":
        return (
          <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
            <Edit3 className="w-3 h-3 text-blue-600" /> Alterado
          </span>
        );
      case "delete":
        return (
          <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
            <Trash2 className="w-3 h-3 text-rose-600" /> Excluído
          </span>
        );
      case "restore":
      case "backup_restore":
        return (
          <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
            <RotateCcw className="w-3 h-3 text-amber-600" /> Restaurado
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 border border-gray-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 transition-all ${
          notification.type === "success" 
            ? "bg-emerald-800 text-white border-emerald-700" 
            : "bg-rose-800 text-white border-rose-700"
        }`}>
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#e0e0d6] shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-[#5A5A40]" />
            <h3 className="font-extrabold text-gray-900 text-base">Auditoria & Backups do Sistema</h3>
          </div>
          <p className="text-xs text-gray-500">
            Acompanhe o histórico de alterações em produtos e gerencie a rotina de backup periódico no navegador.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleManualBackup}
            className="bg-[#5A5A40] hover:bg-[#484833] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Database className="w-3.5 h-3.5" /> Criar Backup Agora
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#e0e0d6] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase block">Status do Backup</span>
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Automático (Diário às 00:00)
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#e0e0d6] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <History className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase block">Logs de Auditoria</span>
            <span className="text-sm font-extrabold text-gray-800">{auditLogs.length} eventos gravados</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#e0e0d6] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase block">Pontos de Restauração</span>
            <span className="text-sm font-extrabold text-gray-800">{backups.length} snapshots salvos</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-gray-200 flex gap-4">
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition border-b-2 flex items-center gap-2 ${
            activeTab === "logs"
              ? "border-[#5A5A40] text-[#5A5A40]"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <History className="w-4 h-4" /> Log de Auditoria de Produtos ({auditLogs.length})
        </button>

        <button
          onClick={() => setActiveTab("backups")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition border-b-2 flex items-center gap-2 ${
            activeTab === "backups"
              ? "border-[#5A5A40] text-[#5A5A40]"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <Database className="w-4 h-4" /> Histórico de Backups Periódicos ({backups.length})
        </button>
      </div>

      {/* TAB 1: AUDIT LOGS */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-2xl border border-[#e0e0d6] shadow-xs overflow-hidden">
          
          {/* Controls Bar */}
          <div className="p-4 border-b border-[#f0f0e8] bg-gray-50/50 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por produto, detalhes ou usuário..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#e0e0d6] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="text-xs bg-white border border-[#e0e0d6] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
              >
                <option value="all">Todas as ações</option>
                <option value="create">Criação</option>
                <option value="update">Alteração</option>
                <option value="delete">Exclusão</option>
                <option value="restore">Restauração</option>
              </select>

              {auditLogs.length > 0 && (
                <button
                  onClick={handleClearLogs}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition"
                  title="Limpar logs"
                >
                  <Trash className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Logs Table */}
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <History className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-500">Nenhum registro de auditoria encontrado.</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Alterações efetuadas nos produtos (criação, edição e exclusão) aparecerão aqui automaticamente.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#e0e0d6] bg-gray-50/80 text-[10px] font-extrabold uppercase text-gray-500 tracking-wider">
                    <th className="p-3.5">Data / Hora</th>
                    <th className="p-3.5">Tipo de Ação</th>
                    <th className="p-3.5">Produto / Item</th>
                    <th className="p-3.5">Detalhes das Alterações</th>
                    <th className="p-3.5">Usuário</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0e8]">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/60 transition">
                      <td className="p-3.5 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString("pt-BR")}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="p-3.5 font-bold text-gray-800">
                        {log.productName}
                      </td>
                      <td className="p-3.5 text-gray-600 max-w-md break-words">
                        {log.details}
                      </td>
                      <td className="p-3.5 font-medium text-gray-500 text-[11px]">
                        {log.user || "Admin"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PERIODIC BACKUPS */}
      {activeTab === "backups" && (
        <div className="bg-white rounded-2xl border border-[#e0e0d6] shadow-xs p-5 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-[#f0f0e8]">
            <div>
              <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider">Pontos de Restauração em Memória Local</h4>
              <p className="text-[11px] text-gray-500">
                O sistema salva uma cópia periódica do estado completo do banco de dados no seu navegador.
              </p>
            </div>

            {backups.length > 0 && (
              <button
                onClick={handleClearBackups}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold transition flex items-center gap-1"
              >
                <Trash className="w-3.5 h-3.5" /> Limpar Histórico
              </button>
            )}
          </div>

          {backups.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Database className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-500">Nenhum ponto de restauração periódico encontrado ainda.</p>
              <button
                onClick={handleManualBackup}
                className="mt-3 bg-[#5A5A40] text-white px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1"
              >
                Gerar Primeiro Backup
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {backups.map((snap, idx) => (
                <div
                  key={snap.id}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-3 shadow-xs transition ${
                    idx === 0 
                      ? "border-emerald-200 bg-emerald-50/40" 
                      : "border-amber-200 bg-amber-50/30"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        idx === 0 
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300" 
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}>
                        {idx === 0 ? "🟢 Último Backup (Mais Recente)" : "🟡 Penúltimo Backup (Anterior)"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="font-mono text-xs font-bold text-gray-800">{snap.formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 font-medium">
                      <span>📦 {snap.productCount} produtos</span>
                      <span>🛒 {snap.orderCount} pedidos</span>
                      <span>📁 {snap.categoryCount} categorias</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRestoreBackupPoint(snap)}
                    className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-700" /> Restaurar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
