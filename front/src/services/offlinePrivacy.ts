/** Purge only local match data; public service-worker assets contain no player data. */
export async function clearOfflineMatches(
  onCleared: () => void,
): Promise<boolean> {
  const clear = () => clearMatches(onCleared);
  return navigator.locks
    ? navigator.locks.request("coachflow-terrain-account", clear)
    : clear();
}
async function clearMatches(onCleared: () => void): Promise<boolean> {
  if (!("indexedDB" in window)) {
    onCleared();
    return true;
  }
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("coachflow-terrain", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("matches", { keyPath: "key" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    const records = await new Promise<{ commands: unknown[] }[]>(
      (resolve, reject) => {
        const request = db
          .transaction("matches")
          .objectStore("matches")
          .getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      },
    );
    if (
      records.some((r) => r.commands.length) &&
      !window.confirm(
        "Des actions de match ne sont pas synchronisées. Vous déconnecter effacera les copies locales. Annulez pour les synchroniser ou les exporter avant de partir. Continuer et effacer ?",
      )
    )
      return false;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("matches", "readwrite");
      tx.objectStore("matches").clear();
      tx.oncomplete = () => resolve();
      tx.onerror = tx.onabort = () => reject(tx.error);
    });
    onCleared();
    return true;
  } finally {
    db.close();
  }
}
