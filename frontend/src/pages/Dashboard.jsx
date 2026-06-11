import { useEffect, useState } from 'react';
import { getDashboard } from '../api/dashboard';
import './Dashboard.css';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner">Đang tải...</div>;
  if (!data) return <div className="empty-state">Không có dữ liệu</div>;

  const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

  return (
    <div>
      <div className="page-header">
        <h1>Tổng quan hôm nay</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe' }}>💰</div>
          <div>
            <p className="stat-label">Doanh thu hôm nay</p>
            <p className="stat-value">{fmt(data.totalRevenue)} đ</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7' }}>🧾</div>
          <div>
            <p className="stat-label">Số hóa đơn</p>
            <p className="stat-value">{data.totalOrders}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7' }}>📦</div>
          <div>
            <p className="stat-label">Sản phẩm tồn kho thấp</p>
            <p className="stat-value" style={{ color: data.lowStockCount > 0 ? '#ef4444' : '#22c55e' }}>
              {data.lowStockCount}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f3e8ff' }}>👥</div>
          <div>
            <p className="stat-label">Nhân viên đang hoạt động</p>
            <p className="stat-value">{data.activeStaff}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-bottom">
        <div className="card top-products">
          <h2 className="section-title">Sản phẩm bán chạy hôm nay</h2>
          {data.topProducts?.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Sản phẩm</th>
                  <th>Số lượng bán</th>
                  <th>Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((p, i) => (
                  <tr key={p.productId}>
                    <td>{i + 1}</td>
                    <td>{p.productName}</td>
                    <td>{p.totalQty}</td>
                    <td>{fmt(p.totalRevenue)} đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">Chưa có đơn hàng nào hôm nay</div>
          )}
        </div>

        {data.lowStockProducts?.length > 0 && (
          <div className="card low-stock-card">
            <h2 className="section-title">⚠️ Sản phẩm sắp hết hàng</h2>
            <table>
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Tồn kho</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockProducts.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td><span className="badge badge-red">{p.stock}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
