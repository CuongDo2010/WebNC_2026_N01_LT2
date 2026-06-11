import { useEffect, useState } from 'react';
import { getOrders, getOrderById, cancelOrder } from '../api/orders';
import { useAuth } from '../context/AuthContext';
import '../components/common/Modal.css';
import './Orders.css';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getOrders()
      .then((r) => setOrders(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (id) => {
    try {
      const res = await getOrderById(id);
      setDetail(res.data);
    } catch {
      alert('Không tải được chi tiết hóa đơn');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Xác nhận hủy hóa đơn này?')) return;
    try {
      await cancelOrder(id);
      setDetail(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Hủy thất bại');
    }
  };

  const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);
  const fmtDate = (d) => new Date(d).toLocaleString('vi-VN');

  if (loading) return <div className="spinner">Đang tải...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Lịch sử hóa đơn</h1>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#ID</th>
                <th>Thời gian</th>
                {user?.role === 'admin' && <th>Nhân viên</th>}
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr><td colSpan={user?.role === 'admin' ? 6 : 5} className="empty-state">Chưa có hóa đơn</td></tr>
              )}
              {orders.map((o) => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 700 }}>#{o.id}</td>
                  <td>{fmtDate(o.createdAt)}</td>
                  {user?.role === 'admin' && <td>{o.user?.name}</td>}
                  <td style={{ fontWeight: 600 }}>{fmt(o.totalAmount)} đ</td>
                  <td>
                    <span className={`badge ${o.status === 'completed' ? 'badge-green' : 'badge-red'}`}>
                      {o.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
                    </span>
                  </td>
                  <td>
                    <button className="icon-btn" onClick={() => openDetail(o.id)} title="Xem chi tiết">👁️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-box order-detail-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Hóa đơn #{detail.id}</h3>
              <button className="modal-close" onClick={() => setDetail(null)}>✕</button>
            </div>

            <div className="order-meta">
              <span>🕐 {fmtDate(detail.createdAt)}</span>
              {user?.role === 'admin' && <span>👤 {detail.user?.name}</span>}
              <span className={`badge ${detail.status === 'completed' ? 'badge-green' : 'badge-red'}`}>
                {detail.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
              </span>
            </div>

            <table className="detail-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Đơn giá</th>
                  <th>SL</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {detail.items?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product?.name || `SP #${item.productId}`}</td>
                    <td>{fmt(item.priceAtTime)} đ</td>
                    <td>{item.quantity}</td>
                    <td>{fmt(item.priceAtTime * item.quantity)} đ</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="order-total-line">
              <span>Tổng cộng:</span>
              <strong>{fmt(detail.totalAmount)} đ</strong>
            </div>

            {detail.status === 'completed' && user?.role === 'admin' && (
              <div className="modal-actions">
                <button className="btn-danger" onClick={() => handleCancel(detail.id)}>
                  Hủy hóa đơn
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
