import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Tạo thư mục tạm nếu chưa có
const tempDir = 'temp/';
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Cấu hình lưu file vào thư mục tạm
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

// Danh sách định dạng hợp lệ (ảnh + video + audio)
const allowedTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/avi',
  // Thêm các định dạng audio
  'audio/mpeg',     // MP3
  'audio/mp4',      // M4A
  'audio/wav',      // WAV
  'audio/webm',     // WebM Audio
  'audio/ogg',      // OGG
];

export { storage, allowedTypes };
