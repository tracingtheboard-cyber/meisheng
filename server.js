// server.js - 美生支付后端（Express + Stripe + OpenAI + Supabase）
import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import session from 'express-session';
import rateLimit from 'express-rate-limit';


dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  'https://lhlxidkzqiokyhmflgho.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || ''
);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const ALLOWED_ORIGINS = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',').map(o => o.trim());
console.log('✅ CORS 允许的域名:', ALLOWED_ORIGINS);
app.use(cors({
  origin: (origin, callback) => {
    // 允许无 origin 的请求（如 curl、服务端调用）
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'meisheng-session-secret-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,      // JS 无法读取
    secure: process.env.NODE_ENV === 'production',  // 生产环境自动开启 HTTPS
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',  // 跨域 Cookie
    maxAge: 8 * 60 * 60 * 1000  // 8小时自动失效
  }
}));

// 证件上传（服务端代理，使用 service key 绕过 RLS）
app.post('/api/upload-document', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未收到文件' });
  const { companyName, personName } = req.body;
  const ext = req.file.originalname.split('.').pop();
  const safeName = personName?.replace(/[^a-zA-Z0-9-_]/g, '_') || 'unknown';
  const safeCompany = companyName?.replace(/[^a-zA-Z0-9-_]/g, '_') || 'unknown';
  const path = `${safeCompany}/${safeName}_${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from('kyc-documents')
    .upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: false });

  if (error) {
    console.error('Supabase upload error:', error);
    return res.status(500).json({ error: '上传失败：' + error.message });
  }

  console.log(`✅ 证件上传成功: ${data.path}`);
  res.json({ path: data.path, fullPath: data.fullPath });
});


// 创建 Stripe Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
  const { companyName, ssicCode, addressType } = req.body;

  const isVirtual = addressType === 'virtual';

  const lineItems = [
    {
      price_data: {
        currency: 'sgd',
        product_data: {
          name: 'ACRA 政府注册费',
          description: `新加坡公司注册 - ${companyName}`,
        },
        unit_amount: 31500, // $315.00 (in cents)
      },
      quantity: 1,
    },
    {
      price_data: {
        currency: 'sgd',
        product_data: {
          name: '美生服务费',
          description: '公司注册代办服务',
        },
        unit_amount: 25000, // $250.00
      },
      quantity: 1,
    },
  ];

  if (isVirtual) {
    lineItems.push({
      price_data: {
        currency: 'sgd',
        product_data: {
          name: 'CBD 虚拟办公室地址',
          description: '一年期虚拟注册地址服务',
        },
        unit_amount: 29900, // $299.00
      },
      quantity: 1,
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register`,
      metadata: {
        company_name: companyName,
        ssic_code: ssicCode,
        address_type: addressType,
      },
      invoice_creation: { enabled: true },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI 公司名称推荐（OpenAI GPT-4o-mini）
app.post('/api/suggest-names', async (req, res) => {
  const { keyword } = req.body;
  if (!keyword) return res.status(400).json({ error: '请输入关键词' });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '你是新加坡公司注册专家，专门帮助华人创业者起合规的英文公司名称。',
        },
        {
          role: 'user',
          content: `用户输入了这个中文概念或名称：「${keyword}」

请生成 5 个符合新加坡 ACRA 注册规范的英文公司名称建议，要求：
1. 每个名称必须以 "Pte. Ltd." 结尾
2. 名称必须是英文（可含少量拼音），商业感强，简洁易记
3. 体现用户输入的核心语义或行业方向
4. 不含 "Bank"、"Finance"、"Insurance" 等受限词
5. 风格多样：直译、意译、创意造词各有不同

只返回 JSON，格式如下，不要有任何额外说明：
{"suggestions": ["Name1 Pte. Ltd.", "Name2 Pte. Ltd.", "Name3 Pte. Ltd.", "Name4 Pte. Ltd.", "Name5 Pte. Ltd."]}`,
        },
      ],
      temperature: 0.85,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    res.json(parsed);
  } catch (err) {
    console.error('OpenAI error:', err);
    res.status(500).json({ error: 'AI 服务暂时不可用，请手动输入名称。' });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '美生支付服务运行中 ✅' });
});

// 保存订单（注册提交时调用）
app.post('/api/save-order', async (req, res) => {
  const { companyName, ssicCode, addressType, plan, shareholders } = req.body;
  const { data, error } = await supabase
    .from('orders')
    .insert([{ company_name: companyName, ssic_code: ssicCode, address_type: addressType, plan, shareholders, status: 'submitted' }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ orderId: data.id });
});

// ── Admin 接口（Session 验证）──
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'meisheng2025';

// 登录限流：10分钟内最多5次尝试
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { error: '尝试次数过多，请10分钟后重试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 登录
app.post('/api/admin/login', loginLimiter, (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: '密码错误' });
  }
  req.session.isAdmin = true;
  res.json({ ok: true });
});

// 登出
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

// 检查登录状态
app.get('/api/admin/me', (req, res) => {
  res.json({ authed: !!req.session.isAdmin });
});

function adminAuth(req, res, next) {
  if (!req.session.isAdmin) return res.status(401).json({ error: '未登录' });
  next();
}

// 获取所有订单
app.get('/api/admin/orders', adminAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 更新订单（状态 / 清单 / 备注）
app.patch('/api/admin/orders/:id', adminAuth, async (req, res) => {
  const { status, checklist, notes } = req.body;
  const updates = {};
  if (status !== undefined) updates.status = status;
  if (checklist !== undefined) updates.checklist = checklist;
  if (notes !== undefined) updates.notes = notes;
  const { error } = await supabase.from('orders').update(updates).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// 生成证件下载签名 URL（10分钟有效）
app.post('/api/admin/download-doc', adminAuth, async (req, res) => {
  const { path } = req.body;
  const { data, error } = await supabase.storage
    .from('kyc-documents')
    .createSignedUrl(path, 600, { download: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ url: data.signedUrl });
});

// 生成证件预览签名 URL（60分钟有效）
app.post('/api/admin/preview-doc', adminAuth, async (req, res) => {
  const { path } = req.body;
  const { data, error } = await supabase.storage
    .from('kyc-documents')
    .createSignedUrl(path, 3600);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ url: data.signedUrl });
});


// 列出 bucket 所有文件（递归）
app.get('/api/admin/list-docs', adminAuth, async (req, res) => {
  const { data: folders } = await supabase.storage.from('kyc-documents').list('', { limit: 100 });
  const allFiles = [];
  for (const folder of (folders || [])) {
    if (folder.id === null) {
      const { data: files } = await supabase.storage.from('kyc-documents').list(folder.name, { limit: 100 });
      for (const f of (files || [])) {
        if (f.id) allFiles.push({ name: f.name, folder: folder.name, path: `${folder.name}/${f.name}`, size: f.metadata?.size, updated: f.updated_at });
      }
    } else {
      allFiles.push({ name: folder.name, folder: '', path: folder.name, size: folder.metadata?.size, updated: folder.updated_at });
    }
  }
  res.json(allFiles);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 美生支付后端已启动: http://localhost:${PORT}`);
  console.log(`📡 前端地址: http://localhost:5173\n`);
});
