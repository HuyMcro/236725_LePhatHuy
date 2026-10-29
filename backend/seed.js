import dns from 'node:dns/promises';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Food from './models/Food.js';

dotenv.config();
// Giữ đồng bộ với cấu hình DNS dùng khi kết nối MongoDB Atlas trên máy Windows.
dns.setServers(['1.1.1.1', '8.8.8.8']);

const sampleFoods = [
  {
    foodId: 'MON001', name: 'Phở bò', category: 'Món chính', cuisine: 'Việt Nam',
    ingredients: ['Bánh phở', 'Thịt bò', 'Hành', 'Nước dùng'], price: 65000, quantity: 25,
    description: 'Phở bò truyền thống với nước dùng thơm và đậm đà.'
  },
  {
    foodId: 'MON002', name: 'Bún thịt nướng', category: 'Món chính', cuisine: 'Miền Nam',
    ingredients: ['Bún', 'Thịt nướng', 'Rau sống', 'Nước mắm'], price: 50000, quantity: 18,
    description: 'Bún thịt nướng ăn kèm rau tươi và nước mắm chua ngọt.'
  },
  {
    foodId: 'MON003', name: 'Gỏi cuốn tôm thịt', category: 'Món khai vị', cuisine: 'Việt Nam',
    ingredients: ['Bánh tráng', 'Tôm', 'Thịt heo', 'Bún', 'Rau sống'], price: 35000, quantity: 30,
    description: 'Gỏi cuốn tươi, ăn kèm nước chấm.'
  }
];

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Thiếu MONGODB_URI. Hãy cấu hình backend/.env trước khi tạo dữ liệu mẫu.');
  }
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB || '236725_LePhatHuy'
  });

  let inserted = 0;
  for (const food of sampleFoods) {
    const result = await Food.updateOne(
      { foodId: food.foodId },
      { $setOnInsert: food },
      { upsert: true, setDefaultsOnInsert: true }
    );
    if (result.upsertedCount) inserted += 1;
  }
  console.log(`Đã tạo ${inserted} món mẫu mới; món có sẵn được giữ nguyên.`);
  console.log('Mã mẫu: MON001, MON002, MON003. Mở giao diện để kiểm tra CRUD.');
}

main()
  .catch(error => {
    console.error('Không thể tạo dữ liệu mẫu:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
