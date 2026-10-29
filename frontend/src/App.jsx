import { useCallback, useEffect, useMemo, useState } from 'react';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const blank = { foodId: '', name: '', category: 'Món chính', cuisine: 'Việt Nam', ingredients: '', price: '', quantity: '0', description: '', imageUrl: '' };
const money = n => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(n || 0));

export default function App() {
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const loadFoods = useCallback(async (term = search) => {
    setLoading(true); setError('');
    try {
      const response = await fetch(`${API}/api/foods${term.trim() ? `?search=${encodeURIComponent(term.trim())}` : ''}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Không tải được danh sách món ăn.');
      setFoods(data);
    } catch (e) { setError(`${e.message}. Kiểm tra backend và cấu hình VITE_API_URL.`); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { loadFoods(''); }, []);
  useEffect(() => {
    const timer = setTimeout(() => loadFoods(search), 300);
    return () => clearTimeout(timer);
  }, [search, loadFoods]);

  const stats = useMemo(() => ({
    total: foods.length,
    quantity: foods.reduce((sum, food) => sum + Number(food.quantity || 0), 0),
    value: foods.reduce((sum, food) => sum + Number(food.price || 0) * Number(food.quantity || 0), 0)
  }), [foods]);

  function openCreate() { setEditing(null); setForm(blank); setNotice(''); }
  function openEdit(food) {
    setEditing(food._id);
    setForm({ ...food, ingredients: (food.ingredients || []).join(', '), price: String(food.price), quantity: String(food.quantity) });
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit(e) {
    e.preventDefault(); setSaving(true); setNotice(''); setError('');
    const payload = { ...form, ingredients: form.ingredients.split(',').map(s => s.trim()).filter(Boolean), price: Number(form.price), quantity: Number(form.quantity) };
    try {
      const response = await fetch(`${API}/api/foods${editing ? `/${editing}` : ''}`, {
        method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Không thể lưu món ăn.');
      setNotice(editing ? 'Đã cập nhật món ăn thành công.' : 'Đã thêm món ăn thành công.');
      setForm(blank); setEditing(null); await loadFoods(search);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function remove(food) {
    if (!window.confirm(`Bạn có chắc muốn xóa món “${food.name}”?`)) return;
    setError(''); setNotice('');
    try {
      const response = await fetch(`${API}/api/foods/${food._id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Không thể xóa món ăn.');
      setNotice('Đã xóa món ăn.'); await loadFoods(search);
    } catch (e) { setError(e.message); }
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#"><span className="brand-mark">味</span><span><b>BẾP NHÀ</b><small>FOOD MANAGEMENT CLOUD</small></span></a>
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
        <div className="toolbar"><label className="searchbox"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên món, loại món hoặc vùng miền..." /><kbd>SEARCH</kbd></label><button className="button button-dark" onClick={openCreate}>＋ Thêm món mới</button></div>
        {notice && <div className="alert success">{notice}</div>}
        {error && <div className="alert error">{error}</div>}
        {editing !== null && <div className="form-panel"><div className="form-heading"><div><span className="eyebrow">{editing ? 'EDIT ITEM' : 'NEW ITEM'}</span><h3>{editing ? 'Cập nhật món ăn' : 'Thêm món ăn mới'}</h3></div><button className="icon-button" onClick={openCreate} aria-label="Đóng biểu mẫu">×</button></div>
          <form onSubmit={submit} className="food-form">
            <Field label="Mã món ăn *" value={form.foodId} onChange={v => setForm({...form, foodId:v})} required />
            <Field label="Tên món ăn *" value={form.name} onChange={v => setForm({...form, name:v})} required />
            <Field label="Loại món *" value={form.category} onChange={v => setForm({...form, category:v})} required />
            <Field label="Ẩm thực / vùng miền *" value={form.cuisine} onChange={v => setForm({...form, cuisine:v})} required />
            <Field label="Giá bán (VNĐ) *" type="number" min="0" value={form.price} onChange={v => setForm({...form, price:v})} required />
            <Field label="Số lượng *" type="number" min="0" value={form.quantity} onChange={v => setForm({...form, quantity:v})} required />
            <Field label="Nguyên liệu (cách nhau bằng dấu phẩy)" value={form.ingredients} onChange={v => setForm({...form, ingredients:v})} />
            <Field label="URL hình ảnh" value={form.imageUrl} onChange={v => setForm({...form, imageUrl:v})} />
            <label className="field full"><span>Mô tả món ăn</span><textarea rows="3" value={form.description} onChange={e => setForm({...form, description:e.target.value})} /></label>
            <div className="form-actions"><button className="button button-dark" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu món ăn →'}</button><button type="button" className="button button-outline" onClick={openCreate}>Hủy</button></div>
          </form>
        </div>}
        {loading ? <div className="empty-state"><div className="spinner"></div><p>Đang tải thực đơn…</p></div> :
        foods.length === 0 ? <div className="empty-state"><div className="empty-icon">✳</div><h3>Chưa tìm thấy món ăn</h3><p>Hãy thêm món mới hoặc thử một từ khóa khác.</p><button className="button button-dark" onClick={openCreate}>＋ Thêm món đầu tiên</button></div> :
        <div className="food-grid">{foods.map((food, i) => <article className="food-card" key={food._id}>
          <div className={`food-visual visual-${i % 4}`}>{food.imageUrl ? <img src={food.imageUrl} alt={food.name} onError={e => {e.currentTarget.style.display='none';}} /> : <div className="food-placeholder"><span>{['✳','❋','✿','✺'][i % 4]}</span><small>FRESH<br/>SELECTION</small></div>}<span className="category-chip">{food.category}</span><span className="food-index">{String(i+1).padStart(2,'0')}</span></div>
          <div className="food-content"><div className="food-meta"><span>⌖ {food.cuisine}</span><span>SL: {food.quantity}</span></div><h3>{food.name}</h3><p>{food.description || 'Món ngon được tuyển chọn cho thực đơn hôm nay.'}</p><div className="food-bottom"><strong>{money(food.price)}</strong><div className="card-actions"><button title="Xem chi tiết" onClick={() => setDetail(food)}>↗</button><button title="Chỉnh sửa" onClick={() => openEdit(food)}>✎</button><button title="Xóa món" onClick={() => remove(food)}>×</button></div></div></div>
        </article>)}</div>}
      </section>
      <footer><div className="footer-brand">BẾP NHÀ <span>✳</span></div><p>HỆ THỐNG QUẢN LÝ MÓN ĂN TRÊN NỀN TẢNG ĐÁM MÂY</p><small>© 2026 · 236725 LÊ PHÁT HUY · REACT / EXPRESS / MONGODB ATLAS</small></footer>
    </main>
    {detail && <div className="modal-backdrop" onClick={() => setDetail(null)}><section className="detail-modal" onClick={e => e.stopPropagation()}><button className="icon-button modal-close" onClick={() => setDetail(null)}>×</button><span className="eyebrow">FOOD DETAILS / {detail.foodId}</span><h2>{detail.name}</h2><p className="detail-price">{money(detail.price)}</p><div className="detail-grid"><div><small>LOẠI MÓN</small><b>{detail.category}</b></div><div><small>ẨM THỰC</small><b>{detail.cuisine}</b></div><div><small>SỐ LƯỢNG</small><b>{detail.quantity}</b></div></div><p>{detail.description || 'Chưa có mô tả.'}</p><p><b>Nguyên liệu:</b> {(detail.ingredients || []).join(', ') || 'Chưa cập nhật'}</p></section></div>}
  </div>;
}

function Field({ label, value, onChange, type = 'text', ...props }) {
  return <label className="field"><span>{label}</span><input type={type} value={value} onChange={e => onChange(e.target.value)} {...props} /></label>;
}
