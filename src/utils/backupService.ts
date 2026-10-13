import { SystemState, AuditLogEntry, PeriodicBackupSnapshot } from "../types";

export const PERIODIC_BACKUPS_KEY = "mundo_dutra_periodic_backups_history";
export const PRODUCTS_BACKUP_KEY = "mundo_dutra_kids_products_backup";
export const MIDNIGHT_BACKUP_LAST_DATE_KEY = "mundo_dutra_last_midnight_backup_date";

/**
 * Strips huge base64 image strings from backup state to keep JSON footprint small
 */
export function sanitizeStateForBackup(state: SystemState): SystemState {
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

  return {
    ...state,
    products: sanitizedProducts,
    auditLogs: (state.auditLogs || []).slice(0, 50)
  };
}

/**
 * Calculates approximate localStorage usage in KB / MB
 */
export function getStorageUsage(): { usedKb: number; usedMb: number; totalMb: number; percent: number } {
  if (typeof window === "undefined" || !window.localStorage) {
    return { usedKb: 0, usedMb: 0, totalMb: 5, percent: 0 };
  }

  try {
    let totalChars = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key) || "";
        totalChars += key.length + val.length;
      }
    }
    const bytes = totalChars * 2; // UTF-16 characters are 2 bytes
    const usedKb = Math.round(bytes / 1024);
    const usedMb = parseFloat((bytes / (1024 * 1024)).toFixed(2));
    const totalMb = 5; // Standard browser localStorage quota
    const percent = Math.min(100, Math.round((usedMb / totalMb) * 100));

    return { usedKb, usedMb, totalMb, percent };
  } catch (_) {
    return { usedKb: 0, usedMb: 0, totalMb: 5, percent: 0 };
  }
}

/**
 * Completely purges all backup caches and history from browser localStorage
 * to ensure 100% free browser memory and prevent QuotaExceededError.
 */
export function clearPeriodicBackups(): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.removeItem(PERIODIC_BACKUPS_KEY);
      localStorage.removeItem(PRODUCTS_BACKUP_KEY);
      localStorage.removeItem(MIDNIGHT_BACKUP_LAST_DATE_KEY);
      console.log("[Storage] Browser backup memory successfully purged.");
    } catch (err) {
      console.warn("[Storage] Error purging browser backup cache:", err);
    }
  }
}

/**
 * Get all available periodic backups from localStorage (if any remain)
 */
export function getPeriodicBackups(): PeriodicBackupSnapshot[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const existingStr = localStorage.getItem(PERIODIC_BACKUPS_KEY);
    return existingStr ? JSON.parse(existingStr) : [];
  } catch (err) {
    return [];
  }
}

/**
 * Manual backup helper: In order to keep browser memory empty,
 * automatic interval backups to localStorage are disabled.
 * If manual backup is triggered, we can create a single lightweight snapshot
 * or clear it to avoid saturating storage.
 */
export function performPeriodicBackup(state: SystemState, isManual: boolean = false): PeriodicBackupSnapshot | null {
  // If not manual, we intentionally do NOT write to localStorage to prevent quota overflow
  if (!isManual) {
    return null;
  }

  if (typeof window === "undefined" || !state) return null;

  try {
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

    // Store only 1 snapshot when manually requested, never accumulating
    try {
      localStorage.setItem(PERIODIC_BACKUPS_KEY, JSON.stringify([snapshot]));
    } catch (_) {
      // If quota error, remove it so browser doesn't choke
      clearPeriodicBackups();
    }

    return snapshot;
  } catch (err) {
    console.warn("[Backup Service] Handled manual backup safely:", err);
    return null;
  }
}

/**
 * Automatic midnight backup check is kept inert to protect browser memory.
 * Firebase Firestore stores the true state in the cloud.
 */
export function checkAndRunMidnightBackup(_state: SystemState): boolean {
  // Disabled to keep browser memory clean and free
  return false;
}

/**
 * Downloads a complete JSON backup file to the user's computer/phone.
 * Consumes 0 bytes of browser memory (localStorage) and preserves entire catalog.
 */
export function downloadBackupJsonFile(state: SystemState): void {
  try {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");
    const filename = `backup-mundo-dutra-${dateStr}-${timeStr}.json`;

    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("[Backup Service] Error generating backup file:", err);
    throw err;
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
