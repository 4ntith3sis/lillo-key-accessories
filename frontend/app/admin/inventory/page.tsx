'use client';

import { useEffect, useState, FormEvent } from 'react';
import AdminNavbar from '@/components/AdminNavbar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  getProducts,
  getCategories,
  getInventory,
  recordStockMovement,
  getInventoryTransactions,
} from '@/lib/api';
import { InventoryTransaction, StockTransactionType } from '@/types/inventory';

interface InventoryRowItem {
  productId: string;
  productName: string;
  categoryName: string;
  stock: number;
  updatedAt?: string;
}

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryRowItem[]>([]);
  const [productMap, setProductMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Stock Modal State
  const [editingItem, setEditingItem] = useState<InventoryRowItem | null>(null);
  const [transactionType, setTransactionType] = useState<StockTransactionType | null>(null);
  const [quantityInput, setQuantityInput] = useState<string>('');
  const [descriptionInput, setDescriptionInput] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyItems, setHistoryItems] = useState<InventoryTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const fetchInventoryData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [products, categories, inventoryList] = await Promise.all([
        getProducts(),
        getCategories(),
        getInventory(),
      ]);

      const pMap = new Map<string, string>();
      products.forEach((p) => {
        pMap.set(p.$id || p.id || '', p.name);
      });
      setProductMap(pMap);

      const catMap = new Map(categories.map((c) => [(c.$id || '').toLowerCase(), c.name]));
      const invMap = new Map(inventoryList.map((i) => [i.productId, i]));

      const rows: InventoryRowItem[] = products.map((p) => {
        const pId = p.$id || p.id || '';
        const catId = (p.categoryId || '').toLowerCase();
        const catName = catMap.get(catId) || p.category || 'COLLECTION';
        const inv = invMap.get(pId);
        return {
          productId: pId,
          productName: p.name,
          categoryName: catName,
          stock: inv ? Math.max(0, Math.floor(inv.stock)) : 0,
          updatedAt: inv?.updatedAt,
        };
      });

      setItems(rows);
    } catch (err: unknown) {
      console.warn('Failed to load inventory data:', err);
      setError('Unable to load inventory data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const openStockModal = (item: InventoryRowItem) => {
    setEditingItem(item);
    setTransactionType(null); // No movement type selected by default
    setQuantityInput('');
    setDescriptionInput('');
    setModalError(null);
  };

  const closeStockModal = () => {
    setEditingItem(null);
    setTransactionType(null);
    setQuantityInput('');
    setDescriptionInput('');
    setModalError(null);
  };

  const handleSaveMovement = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!transactionType) {
      setModalError('Please select a transaction type: STOCK IN or STOCK OUT.');
      return;
    }

    const qty = Number(quantityInput);
    if (isNaN(qty) || !Number.isInteger(qty) || qty <= 0) {
      setModalError('Quantity must be an integer greater than 0.');
      return;
    }

    const cleanDesc = descriptionInput.trim();
    if (!cleanDesc) {
      setModalError('Transaction description is required.');
      return;
    }

    if (transactionType === 'STOCK_OUT' && qty > editingItem.stock) {
      setModalError('Insufficient stock.');
      return;
    }

    setSaving(true);
    setModalError(null);

    try {
      const res = await recordStockMovement({
        productId: editingItem.productId,
        type: transactionType,
        quantity: qty,
        description: cleanDesc,
      });

      const newStockVal = res.inventory.stock;
      setToastMessage(`${transactionType === 'STOCK_IN' ? 'Stock In' : 'Stock Out'} transaction successful! Updated stock for "${editingItem.productName}": ${newStockVal}`);
      setTimeout(() => setToastMessage(null), 4000);

      closeStockModal();
      fetchInventoryData();
    } catch (err: unknown) {
      console.error('Failed to record stock movement:', err);
      const msg = err instanceof Error ? err.message : 'Failed to update stock.';
      setModalError(msg);
    } finally {
      setSaving(false);
    }
  };

  const openHistoryModal = async () => {
    setShowHistoryModal(true);
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const history = await getInventoryTransactions();
      setHistoryItems(history);
    } catch (err: unknown) {
      console.error('Failed to load transaction history:', err);
      setHistoryError('Failed to load stock transaction history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '-';
    try {
      const d = new Date(isoStr);
      return new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return isoStr;
    }
  };

  return (
    <ProtectedRoute>
      <div className="admin-page-wrapper">
        <AdminNavbar />

        <main className="admin-main-content">
          <div className="admin-container">
            <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="admin-small-label">MANUAL INVENTORY MANAGEMENT</span>
                <h1 className="admin-page-title">PRODUCT STOCK LIST</h1>
              </div>
              <button
                type="button"
                onClick={openHistoryModal}
                className="btn btn-secondary"
                style={{ padding: '10px 20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span>📜</span> HISTORY
              </button>
            </div>

            {toastMessage && (
              <div className="admin-success-alert" style={{ marginBottom: '20px' }}>
                ✓ {toastMessage}
              </div>
            )}

            {error ? (
              <div className="admin-error-box">
                <p>{error}</p>
                <button onClick={fetchInventoryData} className="btn btn-secondary">
                  Retry
                </button>
              </div>
            ) : loading ? (
              <div className="admin-loading-box">
                Loading inventory...
              </div>
            ) : items.length === 0 ? (
              <div className="admin-empty-box">
                No inventory data found.
              </div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>PRODUCT</th>
                      <th>CATEGORY</th>
                      <th>CURRENT STOCK</th>
                      <th>STATUS</th>
                      <th style={{ textAlign: 'right' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.productId}>
                        <td style={{ fontWeight: 700 }}>{item.productName}</td>
                        <td>
                          <span className="admin-cat-pill">{item.categoryName.toUpperCase()}</span>
                        </td>
                        <td style={{ fontWeight: 700, fontSize: '1.05rem' }}>{item.stock}</td>
                        <td>
                          {item.stock > 0 ? (
                            <span className="admin-cat-pill" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#16a34a', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                              IN STOCK
                            </span>
                          ) : (
                            <span className="admin-cat-pill" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                              OUT OF STOCK
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => openStockModal(item)}
                            className="btn btn-primary"
                            style={{ padding: '6px 16px', fontSize: '0.8rem', letterSpacing: '0.05em' }}
                          >
                            STOCK
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* STOCK IN / STOCK OUT MODAL */}
            {editingItem && (
              <div className="admin-modal-overlay" onClick={closeStockModal}>
                <div className="admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
                  <h3 className="modal-title" style={{ fontSize: '1.4rem', marginBottom: '4px' }}>MANAGE PRODUCT STOCK</h3>
                  <p className="modal-desc" style={{ marginBottom: '20px' }}>
                    Product: <strong>{editingItem.productName}</strong>
                  </p>

                  <div style={{ background: 'var(--bg-secondary, #F4F0E8)', padding: '16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: 500 }}>Current Stock:</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main, #181818)' }}>{editingItem.stock}</span>
                  </div>

                  {modalError && (
                    <div className="admin-error-box" style={{ padding: '12px 16px', fontSize: '0.85rem', marginBottom: '20px' }}>
                      ⚠️ {modalError}
                    </div>
                  )}

                  <div style={{ marginBottom: '20px' }}>
                    <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>SELECT TRANSACTION TYPE:</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={() => { setTransactionType('STOCK_IN'); setModalError(null); }}
                        className={`btn ${transactionType === 'STOCK_IN' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                          padding: '12px',
                          fontWeight: 700,
                          background: transactionType === 'STOCK_IN' ? '#16a34a' : undefined,
                          borderColor: transactionType === 'STOCK_IN' ? '#16a34a' : undefined,
                          color: transactionType === 'STOCK_IN' ? '#ffffff' : undefined,
                        }}
                      >
                        ➕ STOCK IN
                      </button>

                      <button
                        type="button"
                        onClick={() => { setTransactionType('STOCK_OUT'); setModalError(null); }}
                        className={`btn ${transactionType === 'STOCK_OUT' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                          padding: '12px',
                          fontWeight: 700,
                          background: transactionType === 'STOCK_OUT' ? '#dc2626' : undefined,
                          borderColor: transactionType === 'STOCK_OUT' ? '#dc2626' : undefined,
                          color: transactionType === 'STOCK_OUT' ? '#ffffff' : undefined,
                        }}
                      >
                        ➖ STOCK OUT
                      </button>
                    </div>
                  </div>

                  {transactionType && (
                    <form onSubmit={handleSaveMovement}>
                      <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label className="form-label">
                          Quantity <span className="required-star">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          className="form-input"
                          placeholder="Enter quantity (e.g. 10)"
                          value={quantityInput}
                          onChange={(e) => setQuantityInput(e.target.value)}
                          required
                          autoFocus
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label className="form-label">
                          Transaction Description / Note <span className="required-star">*</span>
                        </label>
                        <textarea
                          className="form-input form-textarea"
                          rows={3}
                          placeholder="Transaction description (e.g. Supplier restock / Damaged goods)"
                          value={descriptionInput}
                          onChange={(e) => setDescriptionInput(e.target.value)}
                          required
                        />
                      </div>

                      <div className="modal-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={closeStockModal}
                          className="btn btn-secondary"
                          disabled={saving}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={saving}
                          style={{
                            background: transactionType === 'STOCK_IN' ? '#16a34a' : '#dc2626',
                            borderColor: transactionType === 'STOCK_IN' ? '#16a34a' : '#dc2626',
                          }}
                        >
                          {saving ? 'Saving...' : `SAVE (${transactionType === 'STOCK_IN' ? '+ ' + (quantityInput || '0') : '- ' + (quantityInput || '0')})`}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* STOCK HISTORY AUDIT MODAL */}
            {showHistoryModal && (
              <div className="admin-modal-overlay" onClick={closeHistoryModal}>
                <div
                  className="admin-modal-card"
                  onClick={(e) => e.stopPropagation()}
                  style={{ maxWidth: '900px', width: '90vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                      <h3 className="modal-title" style={{ fontSize: '1.4rem' }}>INVENTORY TRANSACTIONS HISTORY</h3>
                      <p className="modal-desc">History of all stock movement activity (Stock In / Stock Out)</p>
                    </div>
                    <button
                      type="button"
                      onClick={closeHistoryModal}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    >
                      ✕ CLOSE
                    </button>
                  </div>

                  {historyError ? (
                    <div className="admin-error-box">
                      <p>{historyError}</p>
                    </div>
                  ) : loadingHistory ? (
                    <div className="admin-loading-box">
                      Loading history...
                    </div>
                  ) : historyItems.length === 0 ? (
                    <div className="admin-empty-box">
                      No stock transaction history found.
                    </div>
                  ) : (
                    <div style={{ overflowY: 'auto', flex: 1, border: '1px solid var(--border-color, #E5E1D8)', borderRadius: '8px' }}>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>DATE</th>
                            <th>PRODUCT</th>
                            <th>TYPE</th>
                            <th>QTY</th>
                            <th>DESCRIPTION</th>
                            <th style={{ textAlign: 'right' }}>STOCK MOVEMENT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historyItems.map((tx) => {
                            const pName = productMap.get(tx.productId) || tx.productId;
                            const isStockIn = tx.type === 'STOCK_IN';
                            return (
                              <tr key={tx.id}>
                                <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{formatDate(tx.createdAt)}</td>
                                <td style={{ fontWeight: 700 }}>{pName}</td>
                                <td>
                                  {isStockIn ? (
                                    <span
                                      className="admin-cat-pill"
                                      style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#16a34a', borderColor: 'rgba(34, 197, 94, 0.3)', fontWeight: 700 }}
                                    >
                                      STOCK IN
                                    </span>
                                  ) : (
                                    <span
                                      className="admin-cat-pill"
                                      style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', borderColor: 'rgba(239, 68, 68, 0.3)', fontWeight: 700 }}
                                    >
                                      STOCK OUT
                                    </span>
                                  )}
                                </td>
                                <td style={{ fontWeight: 700, color: isStockIn ? '#16a34a' : '#dc2626' }}>
                                  {isStockIn ? `+${tx.quantity}` : `-${tx.quantity}`}
                                </td>
                                <td style={{ fontSize: '0.88rem', color: '#444' }}>{tx.description}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                  <span style={{ color: '#888' }}>{tx.stockBefore}</span>
                                  <span style={{ margin: '0 6px', color: '#aaa' }}>→</span>
                                  <span style={{ color: isStockIn ? '#16a34a' : '#dc2626' }}>{tx.stockAfter}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
