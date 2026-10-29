import { useCallback, useEffect, useMemo, useState } from 'react';

// Có thể đổi địa chỉ API trong frontend/.env bằng VITE_API_URL.
const API = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/+$/, '');
const blank = {
  foodId: '', name: '', category: 'Món chính', cuisine: 'Việt Nam',
  ingredients: '', price: '', quantity: '0', description: '', imageUrl: ''
};
const money = n => new Intl.NumberFormat('vi-VN', {
  style: 'currency', currency: 'VND', maximumFractionDigits: 0
}).format(Number(n || 0));

async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API}${path}`, options);
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error(`Không kết nối được backend tại ${API}. Hãy kiểm tra backend và VITE_API_URL.`);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Giữ thông báo mặc định bên dưới nếu máy chủ không trả JSON.
  }

  if (!response.ok) {
    throw new Error(data?.message || `Yêu cầu thất bại (HTTP ${response.status}).`);
  }
  return data;
}

export default function App() {
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadFoods = useCallback(async (term = '', signal) => {
    setLoading(true);
    setError('');
    try {
      const query = term.trim() ? `?search=${encodeURIComponent(term.trim())}` : '';
      const data = await apiRequest(`/api/foods${query}`, { signal });
      if (!Array.isArray(data)) throw new Error('Dữ liệu danh sách món ăn không hợp lệ.');
      setFoods(data);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  // Tải danh sách lần đầu và tìm kiếm có debounce; hủy request cũ khi từ khóa đổi.
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => loadFoods(search, controller.signal), 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, loadFoods]);

  const stats = useMemo(() => ({
    total: foods.length,
    quantity: foods.reduce((sum, food) => sum + Number(food.quantity || 0), 0),
    value: foods.reduce((sum, food) => sum + Number(food.price || 0) * Number(food.quantity || 0), 0)
  }), [foods]);

  function openCreate() {
    setEditing(null);
    setForm({ ...blank });
    setNotice('');
    setError('');
    setFormOpen(true);
    setDetail(null);
    setDetailOpen(false);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setForm({ ...blank });
  }

  function openEdit(food) {
    setEditing(food._id);
    setForm({
      ...blank,
      ...food,
      ingredients: (food.ingredients || []).join(', '),
      price: String(food.price ?? ''),
      quantity: String(food.quantity ?? 0)
    });
    setNotice('');
    setError('');
    setFormOpen(true);
    setDetail(null);
    setDetailOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function viewDetail(food) {
    // Mở ngay thông tin có sẵn, rồi gọi API chi tiết /api/foods/:id.
    setDetail({ ...food });
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError('');
    try {
      const data = await apiRequest(`/api/foods/${food._id}`);
      setDetail(data);
    } catch (e) {
      setDetailError(e.message);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setDetailOpen(false);
    setDetail(null);
    setDetailLoading(false);
    setDetailError('');
  }

  async function submit(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setNotice('');
    setError('');

    const payload = {
      ...form,
      foodId: String(form.foodId).trim(),
      name: String(form.name).trim(),
      category: String(form.category).trim(),
      cuisine: String(form.cuisine).trim(),
      ingredients: String(form.ingredients || '').split(',').map(s => s.trim()).filter(Boolean),
      price: Number(form.price),
      quantity: Number(form.quantity)
    };

    try {
      const data = await apiRequest(`/api/foods${editing ? `/${editing}` : ''}`, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setNotice(editing ? 'Đã cập nhật món ăn thành công.' : 'Đã thêm món ăn thành công.');
      setForm({ ...blank });
      setEditing(null);
      setFormOpen(false);
      await loadFoods(search);
      return data;
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(food) {
    if (!window.confirm(`Bạn có chắc muốn xóa món “${food.name}” (${food.foodId})?`)) return;
    setError('');
    setNotice('');
    setDeletingId(food._id);
    try {
      await apiRequest(`/api/foods/${food._id}`, { method: 'DELETE' });
      setNotice(`Đã xóa món “${food.name}” thành công.`);
      if (detail?._id === food._id) closeDetail();
      await loadFoods(search);
    } catch (e) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#menu"><span className="brand-mark">味</span><span><b>BẾP NHÀ</b><small>FOOD MANAGEMENT CLOUD</small></span></a>
      <div className="student-tag"><span className="live-dot" /> MSSV 236725 <i>·</i> Lê Phát Huy</div>
    </header>
    <main className="container">
      <section className="hero">
        <div className="hero-copy"><span className="eyebrow">CLOUD KITCHEN / CONTROL CENTER</span>
          <h1>Món ngon, <em>quản lý gọn.</em></h1>
          <p>Một không gian duy nhất để quản lý thực đơn, theo dõi số lượng và cập nhật dữ liệu món ăn.</p>
          <div className="hero-actions"><a href="#menu" className="button button-light">Khám phá thực đơn <span>↘</span></a><span className="hero-note">● DỮ LIỆU TỪ MONGODB ATLAS</span></div>
        </div>
        <div className="hero-art"><div className="sun"></div><div className="plate"><div className="plate-inner"><span>✳</span><b>FRESH<br/>DAILY</b></div></div><div className="art-label label-top">EST. 2026</div><div className="art-label label-bottom">MADE WITH CARE <span>✦</span></div></div>
      </section>

      <section className="stats-grid">
        <article className="stat-card"><span className="stat-icon">◈</span><span className="stat-label">MÓN TRONG THỰC ĐƠN</span><strong>{stats.total.toString().padStart(2, '0')}</strong><small>món ăn đang hiển thị</small></article>
        <article className="stat-card"><span className="stat-icon">▤</span><span className="stat-label">TỔNG SỐ LƯỢNG</span><strong>{stats.quantity.toLocaleString('vi-VN')}</strong><small>đơn vị tồn kho</small></article>
        <article className="stat-card stat-highlight"><span className="stat-icon">↗</span><span className="stat-label">GIÁ TRỊ TỒN KHO</span><strong>{money(stats.value)}</strong><small>tạm tính theo giá bán</small></article>
      </section>

      <section className="workspace" id="menu">
        <div className="section-heading"><div><span className="eyebrow">YOUR COLLECTION</span><h2>Quản lý thực đơn<span>.</span></h2></div><span className="section-count">{foods.length} KẾT QUẢ</span></div>
        <div className="toolbar"><label className="searchbox"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên món, loại món hoặc vùng miền..." aria-label="Tìm món ăn" /><kbd>SEARCH</kbd></label><button type="button" className="button button-dark" onClick={openCreate}>＋ Thêm món mới</button></div>
        {notice && <div className="alert success" role="status">{notice}</div>}
        {error && <div className="alert error" role="alert">{error}</div>}
        {formOpen && <div className="form-panel"><div className="form-heading"><div><span className="eyebrow">{editing ? 'EDIT ITEM' : 'NEW ITEM'}</span><h3>{editing ? 'Cập nhật món ăn' : 'Thêm món ăn mới'}</h3></div><button type="button" className="icon-button" onClick={closeForm} aria-label="Đóng biểu mẫu">×</button></div>
          <form onSubmit={submit} className="food-form">
            <Field label="Mã món ăn *" value={form.foodId} onChange={v => setForm(current => ({...current, foodId:v}))} required maxLength={40} />
            <Field label="Tên món ăn *" value={form.name} onChange={v => setForm(current => ({...current, name:v}))} required maxLength={120} />
            <Field label="Loại món *" value={form.category} onChange={v => setForm(current => ({...current, category:v}))} required />
            <Field label="Ẩm thực / vùng miền *" value={form.cuisine} onChange={v => setForm(current => ({...current, cuisine:v}))} required />
            <Field label="Giá bán (VNĐ) *" type="number" min="0" step="1" value={form.price} onChange={v => setForm(current => ({...current, price:v}))} required />
            <Field label="Số lượng *" type="number" min="0" step="1" value={form.quantity} onChange={v => setForm(current => ({...current, quantity:v}))} required />
            <Field label="Nguyên liệu (cách nhau bằng dấu phẩy)" value={form.ingredients} onChange={v => setForm(current => ({...current, ingredients:v}))} />
            <Field label="URL hình ảnh" type="url" value={form.imageUrl} onChange={v => setForm(current => ({...current, imageUrl:v}))} />
            <label className="field full"><span>Mô tả món ăn</span><textarea rows="3" value={form.description} onChange={e => setForm(current => ({...current, description:e.target.value}))} /></label>
            <div className="form-actions"><button className="button button-dark" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu món ăn →'}</button><button type="button" className="button button-outline" onClick={closeForm}>Hủy</button></div>
          </form>
        </div>}
        {loading ? <div className="empty-state"><div className="spinner"></div><p>Đang tải thực đơn…</p></div> :
        foods.length === 0 ? <div className="empty-state"><div className="empty-icon">✳</div><h3>{search.trim() ? 'Không tìm thấy món ăn phù hợp' : 'Chưa có món ăn trong thực đơn'}</h3><p>{search.trim() ? 'Thử từ khóa khác hoặc xóa nội dung tìm kiếm.' : 'Hãy thêm món mới hoặc chạy lệnh tạo dữ liệu mẫu theo README.md.'}</p><button type="button" className="button button-dark" onClick={openCreate}>＋ Thêm món {search.trim() ? 'mới' : 'đầu tiên'}</button></div> :
        <div className="food-grid">{foods.map((food, i) => <article className="food-card" key={food._id}>
          <div className={`food-visual visual-${i % 4}`}>{food.imageUrl ? <img src={food.imageUrl} alt={food.name} onError={e => {e.currentTarget.style.display='none';}} /> : <div className="food-placeholder"><span>{['✳','❋','✿','✺'][i % 4]}</span><small>FRESH<br/>SELECTION</small></div>}<span className="category-chip">{food.category}</span><span className="food-index">{String(i+1).padStart(2,'0')}</span></div>
          <div className="food-content"><div className="food-meta"><span>⌖ {food.cuisine}</span><span>SL: {food.quantity}</span></div><h3>{food.name}</h3><p>{food.description || 'Món ngon được tuyển chọn cho thực đơn hôm nay.'}</p><div className="food-bottom"><strong>{money(food.price)}</strong><div className="card-actions"><button type="button" title="Xem chi tiết" aria-label={`Xem chi tiết ${food.name}`} onClick={() => viewDetail(food)}>↗</button><button type="button" title="Chỉnh sửa" aria-label={`Sửa ${food.name}`} onClick={() => openEdit(food)}>✎</button><button type="button" title="Xóa món" aria-label={`Xóa ${food.name}`} disabled={deletingId === food._id} onClick={() => remove(food)}>{deletingId === food._id ? '…' : '×'}</button></div></div></div>
        </article>)}</div>}
      </section>
      <footer><div className="footer-brand">BẾP NHÀ <span>✳</span></div><p>HỆ THỐNG QUẢN LÝ MÓN ĂN TRÊN NỀN TẢNG ĐÁM MÂY</p><small>© 2026 · 236725 LÊ PHÁT HUY · REACT / EXPRESS / MONGODB ATLAS</small></footer>
    </main>
    {detailOpen && detail && <div className="modal-backdrop" onClick={closeDetail}><section className="detail-modal" role="dialog" aria-modal="true" aria-label="Chi tiết món ăn" onClick={e => e.stopPropagation()}><button type="button" className="icon-button modal-close" onClick={closeDetail} aria-label="Đóng chi tiết">×</button><span className="eyebrow">FOOD DETAILS / {detail.foodId}</span><h2>{detail.name}</h2>{detailLoading && <p>Đang tải chi tiết từ máy chủ…</p>}{detailError && <div className="alert error" role="alert">{detailError}</div>}<p className="detail-price">{money(detail.price)}</p><div className="detail-grid"><div><small>LOẠI MÓN</small><b>{detail.category}</b></div><div><small>ẨM THỰC</small><b>{detail.cuisine}</b></div><div><small>SỐ LƯỢNG</small><b>{detail.quantity}</b></div></div><p>{detail.description || 'Chưa có mô tả.'}</p><p><b>Nguyên liệu:</b> {(detail.ingredients || []).join(', ') || 'Chưa cập nhật'}</p>{detail.imageUrl && <p><a href={detail.imageUrl} target="_blank" rel="noreferrer">Mở hình ảnh món ăn</a></p>}</section></div>}
  </div>;
}

function Field({ label, value, onChange, type = 'text', ...props }) {
  return <label className="field"><span>{label}</span><input type={type} value={value} onChange={e => onChange(e.target.value)} {...props} /></label>;
}
