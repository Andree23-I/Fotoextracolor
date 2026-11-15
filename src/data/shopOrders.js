// ============================================================================
// FOTO EXTRACOLOR - E-COMMERCE ORDERS DATA LAYER
// Manages Backoffice Orders, Live Sync, IndexedDB Photo Persistence & Fallback
// ============================================================================

import { saveOrderPhotosToDB, getOrderPhotosFromDB } from "./orderPhotosDB";

export const STORAGE_KEY_ORDERS = "fotoextracolor_shop_orders";

export const ORDER_STATUS_MAP = {
  pending: {
    key: "pending",
    labelIt: "Nuovo / In Attesa",
    badgeClass: "status-pending",
    color: "#f59e0b"
  },
  processing: {
    key: "processing",
    labelIt: "In Lavorazione",
    badgeClass: "status-processing",
    color: "#3b82f6"
  },
  ready: {
    key: "ready",
    labelIt: "Pronto per il Ritiro / Spedizione",
    badgeClass: "status-ready",
    color: "#10b981"
  },
  completed: {
    key: "completed",
    labelIt: "Completato / Consegnato",
    badgeClass: "status-completed",
    color: "#6b7280"
  },
  cancelled: {
    key: "cancelled",
    labelIt: "Annullato",
    badgeClass: "status-cancelled",
    color: "#ef4444"
  }
};

/**
 * Fetch all orders from backend with localStorage fallback
 */
export async function getShopOrders() {
  try {
    let res;
    try {
      res = await fetch("/api.php?action=getOrders");
      if (!res.ok) throw new Error("API HTTP " + res.status);
    } catch {
      res = await fetch("https://fttest.onrender.com/api.php?action=getOrders");
    }
    const data = await res.json();
    if (data && Array.isArray(data.orders)) {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(data.orders));
      return data.orders;
    }
  } catch (err) {
    console.warn("Recupero ordini da server non riuscito, uso fallback locale:", err);
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  return [];
}

/**
 * Retrieve ALL high-resolution photos for an order (from IndexedDB or item attachments)
 */
export async function getOrderAllPhotos(order) {
  if (!order) return [];

  // 1. Check IndexedDB (stores full-resolution photos without size limits)
  try {
    const fromDB = await getOrderPhotosFromDB(order.id);
    if (fromDB && Array.isArray(fromDB) && fromDB.length > 0) {
      return fromDB;
    }
  } catch (e) {
    console.warn("Lettura foto da IndexedDB non riuscita:", e);
  }

  // 2. Fallback to order items
  const photos = [];
  (order.items || []).forEach((item, itemIdx) => {
    const itemPhotos = item.uploadedPhotos || [];
    if (itemPhotos.length > 0) {
      itemPhotos.forEach((ph, pIdx) => {
        const dataUrl = ph?.dataUrl || ph?.src || ph?.url || (typeof ph === 'string' ? ph : null);
        if (dataUrl) {
          photos.push({
            name: ph.name || `foto_${pIdx + 1}.jpg`,
            dataUrl,
            itemTitle: item.title,
            format: item.format || 'Standard'
          });
        }
      });
    } else if (item.previewThumbnail) {
      photos.push({
        name: `${item.title.replace(/\s+/g, '_')}_foto.jpg`,
        dataUrl: item.previewThumbnail,
        itemTitle: item.title,
        format: item.format || 'Standard'
      });
    }
  });

  return photos;
}

/**
 * Save a new incoming customer order
 */
export async function submitCustomerOrder(orderPayload) {
  const timestamp = Date.now();
  const orderId = orderPayload.id || `ORD-${timestamp}-${Math.floor(Math.random() * 900 + 100)}`;
  const orderNumber = orderPayload.orderNumber || `#FE-${Math.floor(timestamp / 1000).toString().slice(-4)}`;

  // 1. Extract ALL full-resolution photos to save into IndexedDB
  const fullResolutionPhotos = [];
  (orderPayload.items || []).forEach((item, itemIdx) => {
    const photos = item.uploadedPhotos || [];
    photos.forEach((ph, pIdx) => {
      const dataUrl = ph?.dataUrl || ph?.src || (typeof ph === 'string' ? ph : null);
      if (dataUrl) {
        fullResolutionPhotos.push({
          name: ph.name || `foto_${itemIdx + 1}_${pIdx + 1}.jpg`,
          dataUrl,
          itemTitle: item.title,
          format: item.format || 'Standard'
        });
      }
    });
    // Fallback if item only had single previewThumbnail
    if (photos.length === 0 && item.previewThumbnail) {
      fullResolutionPhotos.push({
        name: `foto_${itemIdx + 1}_anteprima.jpg`,
        dataUrl: item.previewThumbnail,
        itemTitle: item.title,
        format: item.format || 'Standard'
      });
    }
  });

  // Save full-res photos into IndexedDB (unlimited storage)
  if (fullResolutionPhotos.length > 0) {
    await saveOrderPhotosToDB(orderId, fullResolutionPhotos);
  }

  // 2. Prepare order object.
  // In items, store metadata and thumbnails so localStorage & API payload stays under limits
  const cleanItems = (orderPayload.items || []).map((item) => ({
    ...item,
    photosCount: item.uploadedPhotos?.length || item.photosCount || (item.previewThumbnail ? 1 : 0),
    // Keep names/metadata in uploadedPhotos, but strip massive dataUrls from JSON payload
    uploadedPhotos: (item.uploadedPhotos || []).map((ph, idx) => ({
      name: ph.name || `foto_${idx + 1}.jpg`,
      size: ph.size || 0,
      dataUrl: ph.dataUrl || ph.src || null // Kept if small
    }))
  }));

  const order = {
    ...orderPayload,
    id: orderId,
    orderNumber,
    items: cleanItems,
    createdAt: orderPayload.createdAt || new Date().toISOString(),
    status: orderPayload.status || "pending",
    adminNotes: orderPayload.adminNotes || ""
  };

  // 3. Save to localStorage immediately with quota protection
  try {
    const existingRaw = localStorage.getItem(STORAGE_KEY_ORDERS);
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    const updated = [order, ...existing.filter((o) => o.id !== order.id)];

    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updated));
    } catch (quotaErr) {
      console.warn("Quota localStorage superata, pulizia base64 pesanti:", quotaErr);
      // Strip heavy base64 strings so localStorage fits within 5MB
      const lightUpdated = updated.map((ord) => ({
        ...ord,
        items: (ord.items || []).map((it) => ({
          ...it,
          uploadedPhotos: (it.uploadedPhotos || []).map((p) => ({ name: p.name, size: p.size }))
        }))
      }));
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(lightUpdated));
    }

    window.dispatchEvent(new CustomEvent("shop-orders-updated", { detail: updated }));
  } catch (storageErr) {
    console.warn("Salvataggio locale ordine non riuscito:", storageErr);
  }

  // 4. Sync with backend API
  try {
    let res;
    try {
      res = await fetch("/api.php?action=saveOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order })
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
    } catch {
      res = await fetch("https://fttest.onrender.com/api.php?action=saveOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order })
      });
    }
    const data = await res.json();
    if (data && data.order) {
      return { success: true, order: data.order };
    }
  } catch (netErr) {
    console.warn("Invio ordine al server non riuscito (salvato localmente in IndexedDB):", netErr);
  }

  return { success: true, order };
}

/**
 * Update an existing order status or admin notes
 */
export async function updateOrderStatus(orderId, newStatus, adminNotes = null) {
  // 1. Update localStorage
  try {
    const existingRaw = localStorage.getItem(STORAGE_KEY_ORDERS);
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    const updated = existing.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: newStatus || o.status,
          adminNotes: adminNotes !== null ? adminNotes : o.adminNotes,
          updatedAt: new Date().toISOString()
        };
      }
      return o;
    });
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("shop-orders-updated", { detail: updated }));
  } catch (err) {
    console.warn("Aggiornamento stato ordine locale non riuscito:", err);
  }

  // 2. Sync to backend
  try {
    let res;
    try {
      res = await fetch("/api.php?action=updateOrderStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus, adminNotes })
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
    } catch {
      res = await fetch("https://fttest.onrender.com/api.php?action=updateOrderStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus, adminNotes })
      });
    }
    return await res.json();
  } catch (netErr) {
    console.warn("Sync update ordine server fallito:", netErr);
    return { success: true, offline: true };
  }
}

/**
 * Delete an order permanently
 */
export async function deleteShopOrder(orderId) {
  // 1. Delete from localStorage
  try {
    const existingRaw = localStorage.getItem(STORAGE_KEY_ORDERS);
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    const filtered = existing.filter((o) => o.id !== orderId);
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent("shop-orders-updated", { detail: filtered }));
  } catch (err) {
    console.warn("Eliminazione ordine locale non riuscito:", err);
  }

  // 2. Sync to backend
  try {
    let res;
    try {
      res = await fetch("/api.php?action=deleteOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
    } catch {
      res = await fetch("https://fttest.onrender.com/api.php?action=deleteOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });
    }
    return await res.json();
  } catch (netErr) {
    console.warn("Sync delete ordine server fallito:", netErr);
    return { success: true, offline: true };
  }
}
