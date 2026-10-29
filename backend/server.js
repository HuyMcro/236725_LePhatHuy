import express from 'express';
import dns from 'node:dns/promises';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Food from './models/Food.js';

dotenv.config();

// Workaround DNS SRV khi mạng Windows không phân giải được MongoDB Atlas.
// Nếu mạng của bạn chặn DNS công cộng, hãy bỏ dòng setServers này.
dns.setServers(['1.1.1.1', '8.8.8.8']);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: (origin, callback) => {
    const allowed = process.env.FRONTEND_URL;
    if (!origin || !allowed || origin === allowed || allowed.split(',').map(x => x.trim()).includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin không được phép bởi CORS'));
  }
}));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.get('/api/foods', async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim();
    // Escape ký tự đặc biệt để từ khóa tìm kiếm được hiểu như văn bản thông thường.
    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filter = safeSearch ? { $or: [
      { name: { $regex: safeSearch, $options: 'i' } },
      { category: { $regex: safeSearch, $options: 'i' } },
      { cuisine: { $regex: safeSearch, $options: 'i' } }
    ] } : {};
    const foods = await Food.find(filter).sort({ createdAt: -1 });
    res.json(foods);
  } catch (error) { next(error); }
});

app.get('/api/foods/:id', async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ message: 'Không tìm thấy món ăn.' });
    res.json(food);
  } catch (error) { next(error); }
});

function validateFood(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Dữ liệu gửi lên không hợp lệ.';
  const required = ['foodId', 'name', 'category', 'cuisine'];
  for (const key of required) {
    if (typeof body[key] !== 'string' || !body[key].trim()) return `Trường ${key} là bắt buộc.`;
  }
  if (body.price === '' || !Number.isFinite(Number(body.price)) || Number(body.price) < 0) return 'Giá phải là số không âm.';
  if (body.quantity === '' || !Number.isFinite(Number(body.quantity)) || Number(body.quantity) < 0) return 'Số lượng phải là số không âm.';
  if (body.ingredients !== undefined && !Array.isArray(body.ingredients)) return 'ingredients phải là một danh sách.';
  return null;
}

app.post('/api/foods', async (req, res, next) => {
  try {
    const issue = validateFood(req.body);
    if (issue) return res.status(400).json({ message: issue });
    const food = await Food.create({
      ...req.body, price: Number(req.body.price), quantity: Number(req.body.quantity),
      ingredients: (req.body.ingredients || []).map(String)
    });
    res.status(201).json(food);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Mã foodId đã tồn tại.' });
    next(error);
  }
});

app.put('/api/foods/:id', async (req, res, next) => {
  try {
    const issue = validateFood(req.body);
    if (issue) return res.status(400).json({ message: issue });
    const food = await Food.findByIdAndUpdate(req.params.id, {
      ...req.body, price: Number(req.body.price), quantity: Number(req.body.quantity),
      ingredients: (req.body.ingredients || []).map(String)
    }, { new: true, runValidators: true });
    if (!food) return res.status(404).json({ message: 'Không tìm thấy món ăn.' });
    res.json(food);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Mã foodId đã tồn tại.' });
    next(error);
  }
});

app.delete('/api/foods/:id', async (req, res, next) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);
    if (!food) return res.status(404).json({ message: 'Không tìm thấy món ăn.' });
    res.json({ message: 'Đã xóa món ăn.' });
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  console.error(error.message);
  if (error instanceof SyntaxError && Object.prototype.hasOwnProperty.call(error, 'body')) {
    return res.status(400).json({ message: 'JSON gửi lên không hợp lệ.' });
  }
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ message: 'Dữ liệu không hợp lệ.', detail: error.message });
  }
  if (error.message?.includes('CORS')) return res.status(403).json({ message: error.message });
  if (error.name === 'MongoServerSelectionError' || error.name === 'MongoNetworkError') {
    return res.status(503).json({ message: 'Không thể kết nối MongoDB. Hãy kiểm tra MONGODB_URI và quyền truy cập.' });
  }
  res.status(500).json({ message: 'Lỗi máy chủ.', detail: process.env.NODE_ENV === 'production' ? undefined : error.message });
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Không tìm thấy endpoint API.' });
});

async function start() {
  if (!process.env.MONGODB_URI) {
    console.error('Thiếu MONGODB_URI. Hãy tạo tệp .env từ .env.example.');
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || '236725_LePhatHuy' });
    console.log('Đã kết nối MongoDB Atlas.');
    app.listen(PORT, () => console.log(`Backend đang chạy tại cổng ${PORT}`));
  } catch (error) {
    console.error('Không thể kết nối MongoDB:', error.message);
    process.exit(1);
  }
}
start();
