import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import jwt, { Algorithm, JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
app.use(cors());

// レート制限（staging用）
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_PER_MINUTE) || 10,
});
app.use(limiter);

// 疎通確認エンドポイント
app.get('/v1/status/ping', (_req, res) => {
  res.status(200).send('OK');
});

// JWT認証付き intention submit エンドポイント
app.post('/v1/intention/submit', (req, res) => {
  const { intent, details } = req.body;

  // 簡易バリデーション
  if (!intent) {
    return res.status(400).json({ status: 'error', message: 'intent is required' });
  }

  // Authorization ヘッダ確認
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const secret = Buffer.from(process.env.JWT_SECRET_BASE64 || '', 'base64');

  // アルゴリズムを型安全に設定
  const alg: Algorithm = (process.env.JWT_ALG as Algorithm) || 'HS256';

  try {
    // JWT検証
    const decoded = jwt.verify(token, secret, { algorithms: [alg] }) as JwtPayload;

    // 監査IDとリクエストIDを生成
    const auditId = `AUD-${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 12)}-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')}`;
    const requestId = uuidv4();

    // 成功レスポンス
    res.status(200).json({
      status: 'accepted',
      auditId,
      requestId,
      intent,
      details,
      client: decoded.sub || 'unknown',
    });
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Invalid or expired JWT token' });
  }
});

// サーバー起動
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`MoCKA-GATE listening on port ${port}`);
});
