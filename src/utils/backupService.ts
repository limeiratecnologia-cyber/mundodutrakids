import { SystemState, AuditLogEntry, PeriodicBackupSnapshot } from "../types";

const PERIODIC_BACKUPS_KEY = "mundo_dutra_periodic_backups_history";
const MIDNIGHT_BACKUP_LAST_DATE_KEY = "mundo_dutra_last_midnight_backup_date";
const MAX_BACKUP_SNAPSHOTS = 2;

/**
 * Strips huge base64 image strings from backup state to keep localStorage footprint tiny (~10-50KB)
 * while preserving 100% of product data (IDs, prices, stock, sizes, categories, codes, description).
 */
function sanitizeStateForBackup(state: SystemState): SystemState {
  if (!state) return state;

  const fallbackImg = "https://images.unsplash.com/photo-1519457431-44ccd64a579b?q=80&w=400";

  const sanitizedProducts = (state.products || []).map((p) => {
    const isLargeBase64 = typeof p.image === "string" && p.image.startsWith("data:") && p.image.length > 2000;
    const cleanImage = isLargeBase64 ? fallbackImg : (p.image || fallbackImg);

    const cleanImages = Array.isArray(p.images)
      ? p.images
          .map((img) => (typeof img === "string" && img.startsWith("data:") && img.length > 2000 ? fallbackImg : img))
          .filter(Boolean)
          .slice(0, 3)
      : [cleanImage];

    return {
      ...p,
      image: cleanImage,
      images: cleanImages.length > 0 ? cleanImages : [cleanImage]
    };
  });

  const sanitizedLandpage = state.landpage
    ? {
        ...state.landpage,
        bannerImage:
          typeof state.landpage.bannerImage === "string" &&
          state.landpage.bannerImage.startsWith("data:") &&
          state.landpage.bannerImage.length > 2000
            ? fallbackImg
            : state.landpage.bannerImage,
        bannerImages: Array.isArray(state.landpage.bannerImages)
          ? state.landpage.bannerImages
              .filter((img) => !(typeof img === "string" && img.startsWith("data:") && img.length > 2000))
              .slice(0, 4)
          : []
      }
    : state.landpage;

  return {
    ...state,
    products: sanitizedProducts,
    landpage: sanitizedLandpage,
    auditLogs: (state.auditLogs || []).slice(0, 25)
  };
}

/**
 * Safe localStorage setter with automatic quota management and fallback eviction
 */
function safeStorageSetItem(key: string, value: string): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    const isQuota =
      err?.name === "QuotaExceededError" ||
      err?.code === 22 ||
      err?.code === 1014 ||
      (typeof err?.message === "string" && err.message.toLowerCase().includes("quota"));

    if (!isQuota) {
      console.warn(`[Storage] Failed to save key "${key}":`, err);
      return false;
    }

    console.warn(`[Storage] Storage quota reached while setting "${key}". Freeing non-essential cache...`);

    // 1. Evict temporary / duplicate backup caches
    try {
      localStorage.removeItem("mundo_dutra_kids_products_backup");
    } catch (_) {}

    // 2. If trying to store backup history, try reducing to just 1 snapshot
    if (key === PERIODIC_BACKUPS_KEY) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed) && parsed.length > 1) {
          const singleSnapshot = [parsed[0]];
          localStorage.setItem(key, JSON.stringify(singleSnapshot));
          return true;
        }
      } catch (_) {}

      // If still failing, purge older backups key so application flow is never disrupted
      try {
        localStorage.removeItem(PERIODIC_BACKUPS_KEY);
      } catch (_) {}
      return false;
    }

    // 3. Retry setting after cache eviction
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (_) {
      return false;
    }
  }
}

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
      performPeriodicBackup(state, true);
      safeStorageSetItem(MIDNIGHT_BACKUP_LAST_DATE_KEY, todayStr);
      return true;
    }
  } catch (err) {
    console.warn("[Backup Service] Non-critical error checking midnight backup:", err);
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
  if (typeof window === "undefined" || !window.localStorage || !state) return null;

  try {
    const existingStr = localStorage.getItem(PERIODIC_BACKUPS_KEY);
    let history: PeriodicBackupSnapshot[] = [];
    if (existingStr) {
      try {
        const parsed = JSON.parse(existingStr);
        if (Array.isArray(parsed)) {
          history = parsed;
        }
      } catch (_) {
        history = [];
      }
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const sanitizedState = sanitizeStateForBackup(state);

    const snapshot: PeriodicBackupSnapshot = {
      id: `bkp-${now.getTime()}`,
      timestamp: now.toISOString(),
      formattedDate,
      productCount: state.products?.length || 0,
      orderCount: state.orders?.length || 0,
      categoryCount: state.categories?.length || 0,
      state: sanitizedState
    };

    // Se for backup automático (não manual) e o último foi há menos de 30s, apenas atualiza o Último Backup existente
    if (!isManual && history.length > 0) {
      const last = new Date(history[0].timestamp).getTime();
      if (now.getTime() - last < 30000) {
        history[0] = snapshot;
        safeStorageSetItem(PERIODIC_BACKUPS_KEY, JSON.stringify(history));
        return snapshot;
      }
    }

    // Adiciona o novo como "Último" e empurra o anterior para "Penúltimo", limitando estritamente a 2 itens
    history = [snapshot, ...history].slice(0, MAX_BACKUP_SNAPSHOTS);
    safeStorageSetItem(PERIODIC_BACKUPS_KEY, JSON.stringify(history));

    return snapshot;
  } catch (err) {
    console.warn("[Backup Service] Handled backup creation without interrupting application:", err);
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
    console.warn("[Backup Service] Error reading periodic backups:", err);
    return [];
  }
}

/**
 * Clear backup history
 */
export function clearPeriodicBackups(): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.removeItem(PERIODIC_BACKUPS_KEY);
      localStorage.removeItem("mundo_dutra_kids_products_backup");
    } catch (_) {}
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
