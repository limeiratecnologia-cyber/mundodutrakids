import { SystemState, AuditLogEntry, PeriodicBackupSnapshot } from "../types";

const PERIODIC_BACKUPS_KEY = "mundo_dutra_periodic_backups_history";
const MIDNIGHT_BACKUP_LAST_DATE_KEY = "mundo_dutra_last_midnight_backup_date";
const MAX_BACKUP_SNAPSHOTS = 2;

/**
 * Checks if a backup for today's date (or midnight transition) has been run.
 * If the current date is different from the last stored midnight backup date,
 * it creates a new snapshot, rotating the slots (Slot 0 -> Slot 1),
 * ensuring daily snapshots at midnight or upon first access of the new day.
 */
export function checkAndRunMidnightBackup(state: SystemState): boolean {
  if (typeof window === "undefined" || !window.localStorage || !state) return false;

  try {
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const lastBackupDate = localStorage.getItem(MIDNIGHT_BACKUP_LAST_DATE_KEY);

    if (lastBackupDate !== todayStr) {
      // Create new daily midnight backup
      performPeriodicBackup(state, true);
      localStorage.setItem(MIDNIGHT_BACKUP_LAST_DATE_KEY, todayStr);
      console.log(`[Backup Service] Daily midnight backup created for date: ${todayStr}`);
      return true;
    }
  } catch (err) {
    console.error("Error executing midnight backup check:", err);
  }
  return false;
}

/**
 * Perform a periodic or manual backup of the state to localStorage.
 * Rotina de rotação de 2 slots:
 * - O novo backup vira o "Último Backup" (Slot 0).
 * - O antigo "Último" passa a ser o "Penúltimo Backup" (Slot 1), sobrescrevendo o penúltimo anterior.
 */
export function performPeriodicBackup(state: SystemState, isManual: boolean = false): PeriodicBackupSnapshot | null {
  if (typeof window === "undefined" || !window.localStorage) return null;

  try {
    const existingStr = localStorage.getItem(PERIODIC_BACKUPS_KEY);
    let history: PeriodicBackupSnapshot[] = existingStr ? JSON.parse(existingStr) : [];

    const now = new Date();
    const formattedDate = now.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const snapshot: PeriodicBackupSnapshot = {
      id: `bkp-${now.getTime()}`,
      timestamp: now.toISOString(),
      formattedDate,
      productCount: state.products?.length || 0,
      orderCount: state.orders?.length || 0,
      categoryCount: state.categories?.length || 0,
      state: state
    };

    // Se for backup automático (não manual) e o último foi há menos de 15s, apenas atualiza o Último Backup existente
    if (!isManual && history.length > 0) {
      const last = new Date(history[0].timestamp).getTime();
      if (now.getTime() - last < 15000) {
        history[0] = snapshot;
        localStorage.setItem(PERIODIC_BACKUPS_KEY, JSON.stringify(history));
        return snapshot;
      }
    }

    // Adiciona o novo como "Último" e empurra o anterior para "Penúltimo", limitando estritamente a 2 itens
    history = [snapshot, ...history].slice(0, MAX_BACKUP_SNAPSHOTS);
    localStorage.setItem(PERIODIC_BACKUPS_KEY, JSON.stringify(history));

    // Atualiza cópia de segurança rápida de produtos
    if (state.products && state.products.length > 0) {
      localStorage.setItem("mundo_dutra_kids_products_backup", JSON.stringify(state.products));
    }

    return snapshot;
  } catch (err) {
    console.error("Error creating periodic backup:", err);
    return null;
  }
}

/**
 * Get all available periodic backups from localStorage
 */
export function getPeriodicBackups(): PeriodicBackupSnapshot[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const existingStr = localStorage.getItem(PERIODIC_BACKUPS_KEY);
    return existingStr ? JSON.parse(existingStr) : [];
  } catch (err) {
    console.error("Error reading periodic backups:", err);
    return [];
  }
}

/**
 * Clear backup history
 */
export function clearPeriodicBackups(): void {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.removeItem(PERIODIC_BACKUPS_KEY);
  }
}

/**
 * Helper to construct an AuditLogEntry
 */
export function createAuditLogEntry(
  action: AuditLogEntry["action"],
  productName: string,
  details: string,
  productId?: string,
  user: string = "Admin"
): AuditLogEntry {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    action,
    productName,
    productId,
    details,
    user
  };
}
