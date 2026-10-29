import mongoose from 'mongoose';

const foodSchema = new mongoose.Schema({
  foodId: { type: String, required: [true, 'Vui lòng nhập mã món ăn'], unique: true, trim: true },
  name: { type: String, required: [true, 'Vui lòng nhập tên món ăn'], trim: true, maxlength: 120 },
  category: { type: String, required: [true, 'Vui lòng nhập loại món ăn'], trim: true },
  cuisine: { type: String, required: [true, 'Vui lòng nhập vùng miền/ẩm thực'], trim: true },
  ingredients: { type: [String], default: [] },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 0, default: 0 },
  description: { type: String, default: '', trim: true },
  imageUrl: { type: String, default: '', trim: true }
}, { timestamps: true });

export default mongoose.model('Food', foodSchema);
