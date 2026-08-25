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

const ALLOWED_ORIGINS = [
  'https://meisheng.vercel.app',   // 生产前端（硬编码备用）
  'http://localhost:5173',          // 本地开发
  'http://localhost:3000',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(o => o.trim()) : []),
];
console.log('✅ CORS 允许的域名:', [...new Set(ALLOWED_ORIGINS)]);
app.use(cors({
  origin: (origin, callback) => {
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
      success_url: `${process.env.FRONTEND_URL || 'https://meisheng.vercel.app'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.FRONTEND_URL || 'https://meisheng.vercel.app'}/register`,
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

// 根路径首页
app.get('/', (req, res) => {
  const uptime = Math.floor(process.uptime());
  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = uptime % 60;
  res.send(`<!DOCTYPE html><html lang="zh"><head><meta charset="UTF-8">
<title>美生支付后端</title>
<style>
  body{font-family:-apple-system,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:40px;min-height:100vh}
  h1{font-size:1.8rem;color:#38bdf8;margin-bottom:4px}
  .badge{display:inline-block;background:#22c55e;color:#fff;padding:3px 10px;border-radius:20px;font-size:.8rem;margin-left:10px;vertical-align:middle}
  .info{color:#94a3b8;font-size:.9rem;margin-bottom:32px}
  table{width:100%;border-collapse:collapse;max-width:700px}
  th{text-align:left;padding:10px 14px;background:#1e293b;color:#94a3b8;font-size:.8rem;text-transform:uppercase;letter-spacing:.05em}
  td{padding:10px 14px;border-top:1px solid #1e293b;font-size:.9rem}
  .method{background:#1d4ed8;color:#fff;padding:2px 8px;border-radius:4px;font-size:.75rem;font-weight:700;font-family:monospace}
  .method.post{background:#7c3aed}
  .path{color:#38bdf8;font-family:monospace}
  .desc{color:#94a3b8}
</style></head><body>
<h1>🚀 美生支付后端 <span class="badge">● 运行中</span></h1>
<p class="info">运行时间：${h}h ${m}m ${s}s &nbsp;|&nbsp; Node ${process.version} &nbsp;|&nbsp; 环境：${process.env.NODE_ENV || 'development'}</p>
<table>
<tr><th>方法</th><th>路径</th><th>说明</th></tr>
<tr><td><span class="method">GET</span></td><td class="path">/api/health</td><td class="desc">健康检查</td></tr>
<tr><td><span class="method post">POST</span></td><td class="path">/api/check-name</td><td class="desc">ACRA 公司核名（GoBusiness 数据源）</td></tr>
<tr><td><span class="method post">POST</span></td><td class="path">/api/suggest-names</td><td class="desc">AI 公司名称推荐</td></tr>
<tr><td><span class="method post">POST</span></td><td class="path">/api/create-checkout-session</td><td class="desc">创建 Stripe 支付会话</td></tr>
<tr><td><span class="method post">POST</span></td><td class="path">/api/upload-document</td><td class="desc">上传 KYC 文件到 Supabase</td></tr>
<tr><td><span class="method post">POST</span></td><td class="path">/api/save-order</td><td class="desc">保存注册订单</td></tr>
<tr><td><span class="method post">POST</span></td><td class="path">/api/admin/login</td><td class="desc">管理员登录</td></tr>
<tr><td><span class="method">GET</span></td><td class="path">/api/admin/orders</td><td class="desc">获取所有订单（需登录）</td></tr>
<tr><td><span class="method">GET</span></td><td class="path">/api/admin/list-docs</td><td class="desc">列出所有 KYC 文件（需登录）</td></tr>
</table>
</body></html>`);
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '美生支付服务运行中 ✅' });
});

// ── ACRA 核名（via GoBusiness 公开 API，与官网同数据源）──────────────
const RESTRICTED_WORDS = [
  'bank', 'banking', 'finance', 'financial', 'insurance', 'assurance',
  'reinsurance', 'fund', 'trust', 'securities', 'stock exchange',
  'law', 'legal', 'advocate', 'solicitor', 'chamber', 'chartered accountant',
  'building society', 'co-operative', 'credit union', 'royal', 'government',
  'national', 'republic', 'authority', 'council', 'commission',
  'ministry', 'mediacorp', 'temasek', 'dbs', 'ocbc', 'uob',
];
const INVALID_CHARS = /[<>{}[\]\\^~`|]/;

async function queryGoBusiness(searchTerm) {
  const url = 'https://api.eadviser.gobusiness.gov.sg/api/ipos/search?search-term='
    + encodeURIComponent(searchTerm);
  const resp = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Referer': 'https://eadviser.gobusiness.gov.sg/',
      'Origin': 'https://eadviser.gobusiness.gov.sg',
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!resp.ok) throw new Error('GoBusiness API ' + resp.status);
  return resp.json();
}

app.post('/api/check-name', async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Invalid name' });
  }
  const cleanName = name.trim();
  const nameLower = cleanName.toLowerCase();

  if (INVALID_CHARS.test(cleanName)) {
    return res.json({ available: false, reason: 'invalid_chars',
      message: '名称含有不允许的特殊字符，请修改后重试',
      messageEn: 'Name contains invalid characters.' });
  }
  if (!/\bpte\.?\s*ltd\.?\b|\bprivate\s+limited\b/i.test(cleanName)) {
    return res.json({ available: false, reason: 'missing_suffix',
      message: '公司名称必须以 "Pte. Ltd." 或 "Private Limited" 结尾',
      messageEn: 'Name must end with "Pte. Ltd." or "Private Limited".' });
  }
  if (cleanName.length > 180) {
    return res.json({ available: false, reason: 'too_long',
      message: '公司名称不能超过 180 个字符', messageEn: 'Name exceeds 180 characters.' });
  }

  const foundRestricted = RESTRICTED_WORDS.find(w => nameLower.includes(w));
  if (foundRestricted) {
    return res.json({ available: false, reason: 'restricted',
      message: '名称含受限词 "' + foundRestricted + '"，需向相关机构申请特别许可',
      messageEn: 'Name contains restricted word "' + foundRestricted + '", requires special approval.' });
  }

  const searchTerm = cleanName
    .replace(/\bpte\.?\s*ltd\.?\b/gi, '')
    .replace(/\bprivate\s+limited\b/gi, '')
    .replace(/\.+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

  try {
    const data = await queryGoBusiness(searchTerm);
    const records = (data && data.data && data.data.businessNameService && data.data.businessNameService.records) || [];

    // 精确匹配：entityName（大写）应以 searchTerm 开头，后接空格/逗号/结尾
    const exactMatch = records.find(r => {
      const en = (r.entityName || r.name || '').toUpperCase().trim();
      return en === searchTerm ||
        en.startsWith(searchTerm + ' ') ||
        en.startsWith(searchTerm + ',');
    });

    if (exactMatch) {
      const uen = exactMatch.uen || '';
      return res.json({ available: false, reason: 'taken',
        message: '"' + cleanName + '" 已在 ACRA 注册' + (uen ? '（UEN: ' + uen + '）' : '') + '，请换一个名字',
        messageEn: '"' + cleanName + '" is already registered with ACRA' + (uen ? ' (UEN: ' + uen + ')' : '') + '. Please choose a different name.' });
    }

    const similar = records.slice(0, 5).map(r => r.entityName || r.name).filter(Boolean);
    console.log('[GoBusiness] Name check passed: ' + cleanName + ', similar: ' + similar.length);

    return res.json({
      available: true,
      reason: similar.length > 0 ? 'similar_exists' : 'clear',
      message: similar.length > 0
        ? '初步可用，但存在相似名称，最终以 ACRA 审核为准'
        : '"' + cleanName + '" 在 ACRA 数据库中未发现同名，可以申请！',
      messageEn: similar.length > 0
        ? 'Likely available. Similar names exist — final approval subject to ACRA review.'
        : '"' + cleanName + '" not found in ACRA database. Available to apply!',
      similar,
      source: 'gobusiness',
    });

  } catch (err) {
    console.warn('[check-name] GoBusiness failed, local fallback:', err.message);
    return res.json({
      available: true, reason: 'preliminary_pass',
      message: '"' + cleanName + '" 初步检查通过！未发现受限词或格式问题。最终以 ACRA 审核为准（通常 1 个工作日内）。',
      messageEn: '"' + cleanName + '" passed preliminary checks! Final approval subject to ACRA review (typically 1 business day).',
      source: 'local_fallback',
    });
  }
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
