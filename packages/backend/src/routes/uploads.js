const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'data', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir); },
  filename: function (req, file, cb) { cb(null, Date.now() + '-' + file.originalname); }
});
const upload = multer({ storage });

const USE_S3 = !!(process.env.S3_BUCKET && process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
let s3Client = null;
let S3_BUCKET = process.env.S3_BUCKET;
if (USE_S3) {
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
  s3Client = new S3Client({ region: process.env.AWS_REGION });
  router.post('/', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'file required' });
    const key = `uploads/${Date.now()}-${req.file.originalname}`;
    try {
      const fileStream = fs.createReadStream(req.file.path);
      await s3Client.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: fileStream, ContentType: req.file.mimetype }));
      // Optionally remove local file
      fs.unlinkSync(req.file.path);
      const url = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      return res.json({ ok: true, url });
    } catch (e) {
      console.error('S3 upload error', e);
      return res.status(500).json({ error: 'upload failed' });
    }
  });
  // POST /uploads/presign { name, contentType } -> { url, key }
  router.post('/presign', async (req, res) => {
    const { name, contentType } = req.body || {};
    if (!name || !contentType) return res.status(400).json({ error: 'name and contentType required' });
    try {
      const key = `uploads/${Date.now()}-${name}`;
      const command = new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, ContentType: contentType });
      const url = await getSignedUrl(s3Client, command, { expiresIn: 60 * 5 }); // 5 minutes
      return res.json({ ok: true, url, key });
    } catch (e) {
      console.error('presign error', e);
      return res.status(500).json({ error: 'presign failed' });
    }
  });
} else {
  // POST /uploads (form-data) -> { url }
  router.post('/', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'file required' });
    // public URL (dev): /uploads/<filename>
    const url = `/uploads/${req.file.filename}`;
    res.json({ ok: true, url });
  });
}

module.exports = router;
