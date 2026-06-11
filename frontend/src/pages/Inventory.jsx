import { useEffect, useState } from 'react';
import { getProducts, addStock } from '../api/products';
import '../components/common/Modal.css';
import './Inventory.css';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => {
    getProducts(false).then((r) => setProducts(r.data)).catch(console.error);
  };

  useEffect(() => { load(); }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAddStock = (p) => {
    setSelected(p);
    setQuantity('');
    setError('');
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    const qty = parseInt(quantity);
    if (!qty || qty < 1) { setError('Số lượng phải lớn hơn 0'); return; }
    setLoading(true);
    try {
      await addStock(selected.id, qty);
      setSelected(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Thất bại');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

  return (
    <div>
      <div className="page-header">
        <h1>Quản lý kho hàng</h1>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="search-bar">
            <span>🔍</span>
            <input
              placeholder="Tìm sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="inv-legend">
            <span className="badge badge-red">Dưới 10</span>
            <span className="badge badge-yellow">10 - 20</span>
            <span className="badge badge-green">Đủ hàng</span>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th>Tồn kho</th>
                <th>Giá vốn</th>
                <th>Giá trị tồn</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="empty-state">Không có sản phẩm</td></tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>{p.category?.name || '-'}</td>
                  <td>
                    <span className={`badge ${p.stock < 10 ? 'badge-red' : p.stock < 20 ? 'badge-yellow' : 'badge-green'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td>{fmt(p.costPrice)} đ</td>
                  <td>{fmt(p.stock * p.costPrice)} đ</td>
                  <td>
                    <button className="btn-add-stock" onClick={() => openAddStock(p)}>
                      + Nhập kho
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📦 Nhập kho</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <p style={{ marginBottom: 16, color: '#64748b' }}>
              Sản phẩm: <strong style={{ color: '#1e293b' }}>{selected.name}</strong> — Tồn hiện tại: <strong>{selected.stock}</strong>
            </p>
            <form onSubmit={handleAddStock}>
              <div className="form-group">
                <label>Số lượng nhập thêm</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              {error && <div className="form-error">{error}</div>}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setSelected(null)}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Xác nhận nhập kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
