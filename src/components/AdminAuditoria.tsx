import React, { useState, useRef } from "react";
import { 
  ShieldCheck, Database, History, PlusCircle, Edit3, 
  Trash2, RotateCcw, Search, CheckCircle2, Download, Trash, 
  Upload, HardDrive, Cloud, Sparkles
} from "lucide-react";
import { SystemState, AuditLogEntry, PeriodicBackupSnapshot } from "../types";
import { 
  getPeriodicBackups, 
  clearPeriodicBackups, 
  getStorageUsage, 
  downloadBackupJsonFile,
  performPeriodicBackup 
} from "../utils/backupService";

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
  const [storageInfo, setStorageInfo] = useState(() => getStorageUsage());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const auditLogs: AuditLogEntry[] = state.auditLogs || [];

  const triggerNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleClearBrowserMemory = () => {
    if (window.confirm("Deseja esvaziar toda a memória de backup do navegador? Isso não afeta os produtos salvos na nuvem (Firebase).")) {
      clearPeriodicBackups();
      setBackups([]);
      setStorageInfo(getStorageUsage());
      triggerNotification("Memória do navegador completamente limpa e liberada!");
    }
  };

  const handleDownloadBackup = () => {
    try {
      downloadBackupJsonFile(state);
      triggerNotification("Arquivo de backup baixado com sucesso para seu dispositivo!");
    } catch (e) {
      triggerNotification("Erro ao gerar arquivo de backup.", "error");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed && (parsed.products || parsed.categories || parsed.landpage)) {
          if (window.confirm(`Deseja restaurar a loja com os dados deste arquivo (${parsed.products?.length || 0} produtos encontrados)?`)) {
            onUpdateState({
              ...parsed,
              auditLogs: [
                {
                  id: `log-${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  action: "backup_restore",
                  productName: "Restauração de Arquivo JSON",
                  details: `Dados restaurados do arquivo ${file.name}`,
                  user: "Admin"
                },
                ...(state.auditLogs || [])
              ]
            });
            triggerNotification("Dados da loja restaurados com sucesso a partir do arquivo!");
          }
        } else {
          triggerNotification("Arquivo inválido: Formato de backup não reconhecido.", "error");
        }
      } catch (err) {
        triggerNotification("Erro ao ler arquivo JSON. Verifique o arquivo.", "error");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      {/* Hidden file input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json"
        className="hidden"
      />

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 transition-all ${
          notification.type === "success" 
            ? "bg-emerald-800 text-white border-emerald-700" 
            : "bg-rose-800 text-white border-rose-700"
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#e0e0d6] shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-[#5A5A40]" />
            <h3 className="font-extrabold text-gray-900 text-base">Auditoria, Memória & Backups</h3>
          </div>
          <p className="text-xs text-gray-500">
            Acompanhe alterações em produtos e gerencie o espaço de memória e backups de segurança.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleClearBrowserMemory}
            className="bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            title="Esvazia todo cache de backup local do navegador"
          >
            <Trash className="w-3.5 h-3.5" /> Limpar Memória do Navegador
          </button>

          <button
            onClick={handleDownloadBackup}
            className="bg-[#5A5A40] hover:bg-[#484833] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Baixar Backup (.json)
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#e0e0d6] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase block">Banco de Dados na Nuvem</span>
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Firebase Firestore Ativo
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#e0e0d6] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase block">Memória do Navegador</span>
            <span className="text-xs font-extrabold text-blue-900">
              {storageInfo.usedMb} MB de 5 MB ({100 - storageInfo.percent}% livre)
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
          <History className="w-4 h-4" /> Log de Auditoria ({auditLogs.length})
        </button>

        <button
          onClick={() => setActiveTab("backups")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition border-b-2 flex items-center gap-2 ${
            activeTab === "backups"
              ? "border-[#5A5A40] text-[#5A5A40]"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <Database className="w-4 h-4" /> Memória do Navegador & Backups
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

      {/* TAB 2: BROWSER MEMORY & BACKUPS */}
      {activeTab === "backups" && (
        <div className="space-y-5">
          {/* Status Alert Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-700" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-emerald-950 text-sm">
                Backup na memória do navegador desativado com sucesso
              </h4>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Para garantir que o navegador <strong>nunca fique cheio</strong> e que suas edições e alterações sejam salvas sem nenhum bloqueio ou travamento, o backup automático que ocupava a memória do navegador foi desativado.
              </p>
              <p className="text-[11px] text-emerald-700 font-medium pt-1">
                ☁️ <strong>Seus dados estão 100% seguros na nuvem:</strong> Todas as alterações de produtos, fotos, estoques e pedidos são salvas de forma instantânea e permanente no <strong>Firebase Firestore</strong>, que não possui o limite de 5 MB dos navegadores.
              </p>
            </div>
          </div>

          {/* Memory Management Card */}
          <div className="bg-white rounded-2xl border border-[#e0e0d6] shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-[#f0f0e8]">
              <div>
                <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider">
                  Saúde e Ocupação da Memória do Navegador
                </h4>
                <p className="text-[11px] text-gray-500">
                  O navegador reserva no máximo 5 MB para dados temporários. Mantenha esta barra sempre verde.
                </p>
              </div>

              <button
                onClick={handleClearBrowserMemory}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold transition flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50"
              >
                <Trash className="w-3.5 h-3.5" /> Limpar Toda Memória Local
              </button>
            </div>

            {/* Storage Progress Bar */}
            <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-600">Espaço Utilizado: {storageInfo.usedMb} MB de {storageInfo.totalMb} MB</span>
                <span className={storageInfo.percent > 70 ? "text-rose-600" : "text-emerald-700"}>
                  {storageInfo.percent}% ocupado ({100 - storageInfo.percent}% livre)
                </span>
              </div>
              <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    storageInfo.percent > 80 
                      ? "bg-rose-500" 
                      : storageInfo.percent > 50 
                        ? "bg-amber-500" 
                        : "bg-emerald-500"
                  }`} 
                  style={{ width: `${Math.max(2, storageInfo.percent)}%` }} 
                />
              </div>
            </div>

            {/* File Backup Options (Zero LocalStorage Usage) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-gray-800">
                  <Download className="w-4 h-4 text-[#5A5A40]" />
                  <span>Baixar Backup Completo em Arquivo (.json)</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Baixa um arquivo com todos os dados da loja diretamente para o seu computador ou celular. <strong>Não gasta nenhum byte da memória do navegador!</strong>
                </p>
                <button
                  onClick={handleDownloadBackup}
                  className="w-full bg-[#5A5A40] hover:bg-[#484833] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs mt-2"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar Arquivo JSON de Backup
                </button>
              </div>

              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-gray-800">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Restaurar a Loja a partir de um Arquivo (.json)</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Se você tiver um arquivo de backup baixado anteriormente, você pode restaurá-lo diretamente sem risco de lotar o navegador.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs mt-2"
                >
                  <Upload className="w-3.5 h-3.5" /> Selecionar Arquivo para Restaurar
                </button>
              </div>
            </div>
          </div>

          {/* Any remaining historical snapshots */}
          {backups.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#e0e0d6] shadow-xs p-5 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-[#f0f0e8]">
                <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider">
                  Backups Anteriores Restantes na Memória
                </h4>
                <button
                  onClick={handleClearBrowserMemory}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold transition"
                >
                  Excluir Todos
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {backups.map((snap) => (
                  <div key={snap.id} className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
                    <div className="text-xs space-y-1">
                      <span className="font-mono font-bold text-gray-800">{snap.formattedDate}</span>
                      <div className="text-[11px] text-gray-500">
                        {snap.productCount} produtos · {snap.orderCount} pedidos
                      </div>
                    </div>
                    <button
                      onClick={() => handleRestoreBackupPoint(snap)}
                      className="bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-700" /> Restaurar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
