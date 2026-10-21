const DB = "coachflow-terrain";
export async function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("matches", { keyPath: "key" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          "Le stockage local est indisponible. Aucun match hors ligne ne peut être garanti.",
        ),
      );
  });
}
async function transaction(mode, action) {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("matches", mode);
      const request = action(tx.objectStore("matches"));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = tx.onabort = () =>
        reject(
          new Error(
            "Enregistrement local impossible. Libérez de l’espace puis réessayez.",
          ),
        );
    });
  } finally {
    db.close();
  }
}
export const read = (key) => transaction("readonly", (store) => store.get(key));
export const write = (record) =>
  transaction("readwrite", (store) => store.put(record));
export const remove = (key) =>
  transaction("readwrite", (store) => store.delete(key));
export const all = () => transaction("readonly", (store) => store.getAll());
export const lock = (key, action) => {
  if (!navigator.locks)
    throw new Error(
      "Ce navigateur ne permet pas de protéger les saisies entre onglets. Utilisez un navigateur récent.",
    );
  return navigator.locks.request("coachflow-terrain-account", () =>
    navigator.locks.request("coachflow-terrain:" + key, action),
  );
};
