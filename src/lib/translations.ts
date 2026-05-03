// src/lib/translations.ts
// 中英双语文案库

export type Lang = 'zh' | 'en';

const t = {
  // ── Register Page ──
  register: {
    steps: {
      zh: ['公司核名', '公司详情', '股东与董事', '确认与付款'],
      en: ['Name Check', 'Company Details', 'Shareholders', 'Review & Pay'],
    },
    stepOf: { zh: '步', en: 'of' },   // "第 1 步 · 共 4 步" / "Step 1 of 4"
    aside: {
      trust: {
        zh: ['256位SSL全程加密', '客户评分 4.9/5', '平均完成时间：47分钟'],
        en: ['256-bit SSL Encryption', 'Customer Rating 4.9/5', 'Avg. Completion: 47 mins'],
      },
    },
    step1: {
      title:   { zh: '您的公司想叫什么名字？', en: 'What will your company be called?' },
      desc:    { zh: '我们将实时连接ACRA数据库核查名称可用性。新加坡私人有限公司名称须以"Pte. Ltd."结尾。',
                 en: 'We will instantly check the ACRA database for name availability. Singapore private limited companies must end with "Pte. Ltd.".' },
      label:   { zh: '拟注册公司名称', en: 'Proposed Company Name' },
      placeholder: { zh: '例如：美生科技 Pte. Ltd.', en: 'e.g. Meisheng Tech Pte. Ltd.' },
      checkBtn:{ zh: '核查 →', en: 'Check →' },
      available:{ zh: '名称可用！', en: 'Name available!' },
      availableMsg: { zh: '可以注册。', en: 'is available for registration.' },
      taken:   { zh: '名称不可用。', en: 'Name unavailable.' },
      takenMsg:{ zh: '该名称已被占用，或含有需MAS特批的敏感词。', en: 'This name is either taken or contains words requiring MAS special approval.' },
      aiTitle: { zh: 'AI 智能推荐名称', en: 'AI Name Generator' },
      aiDesc:  { zh: '输入中文关键词，AI 将为您推荐 5 个符合 ACRA 规范的英文公司名。',
                 en: 'Enter keywords and AI will suggest 5 ACRA-compliant company names for you.' },
      aiPlaceholder: { zh: '例如：美好生活、云端科技、绿色健康...', en: 'e.g. wellness, cloud technology, green energy...' },
      aiBtn:   { zh: '生成', en: 'Generate' },
      aiUse:   { zh: '使用', en: 'Use' },
      tipsTitle:{ zh: '命名规则', en: 'Naming Rules' },
      tips: {
        zh: ['须以"Pte. Ltd."或"Private Limited"结尾', '不得与现有公司名称完全相同', '含"Bank"、"Finance"、"Insurance"等词须MAS特别批准'],
        en: ['Must end with "Pte. Ltd." or "Private Limited"', 'Must not be identical to an existing company name', 'Words like "Bank", "Finance", "Insurance" require MAS approval'],
      },
    },
    step2: {
      title:  { zh: '您的公司主要从事什么行业？', en: 'What does your company do?' },
      desc:   { zh: '请选择主要经营范围，这将决定您的新加坡标准产业分类代码（SSIC Code），并在ACRA档案中公示。',
                en: 'Select your principal activity. This determines your SSIC code which will be publicly listed on ACRA BizFile.' },
      ssicLabel:   { zh: '主要经营范围（SSIC Code）', en: 'Principal Activity (SSIC Code)' },
      ssicDefault: { zh: '搜索并选择经营范围...', en: 'Search and select an activity...' },
      ssicTip:{ zh: '先选一个最接近的即可，无需纠结。公司注册完成后可随时通过 ACRA Bizfile 修改经营范围，无需重新注册。',
                en: 'Pick the closest match for now. You can update your SSIC code at any time after incorporation via ACRA BizFile.' },
      addrLabel: { zh: '注册办公地址', en: 'Registered Office Address' },
      addrOptions: {
        zh: [
          { label: '虚拟办公室地址（推荐）', sub: '+$299/年 — 新加坡CBD核心地段地址，专业形象首选', badge: '热门' },
          { label: '使用我自己的地址', sub: '使用您的住宅或商业地址（免费）', badge: '' },
        ],
        en: [
          { label: 'Virtual Office Address (Recommended)', sub: '+$299/yr — Prestigious CBD address for a professional image', badge: 'Popular' },
          { label: 'Use my own address', sub: 'Use your own residential or commercial address (free)', badge: '' },
        ],
      },
    },
    step3: {
      title:  { zh: '配置董事与股东', en: 'Directors & Shareholders' },
      desc:   { zh: '新加坡法律要求至少有 1 名本地居民董事（新加坡公民、永久居民或持有有效工作准证者）。',
                en: 'Singapore law requires at least 1 locally resident director (Singapore citizen, PR, or valid Employment Pass holder).' },
      singpassDesc: { zh: '最快速的方式 — 通过政府数字身份一键完成身份核验，无需手动上传任何文件。',
                      en: 'Fastest method — use your government digital identity to auto-fill details. No document uploads needed.' },
      singpassBtn:{ zh: '通过 Singpass 添加董事', en: 'Add Director via Singpass' },
      orManual:   { zh: '或手动填写并上传证件', en: 'Or fill in manually and upload documents' },
      nameLabel:  { zh: '法定全名', en: 'Legal Full Name' },
      namePh:     { zh: '与护照/NRIC完全一致', en: 'Exactly as shown on passport/NRIC' },
      idLabel:    { zh: 'NRIC / FIN / 护照号码', en: 'NRIC / FIN / Passport Number' },
      idPh:       { zh: '例如：S9812381D 或护照号', en: 'e.g. S9812381D or passport number' },
      emailLabel: { zh: '电子邮箱（用于接收电子签名）', en: 'Email (for e-signature invitation)' },
      docLabel:   { zh: '身份证件（护照主页 / NRIC 正反面）', en: 'Identity Document (Passport bio page / NRIC front & back)' },
      uploadHint: { zh: '点击上传或拖拽文件至此处', en: 'Click to upload or drag & drop' },
      uploadSub:  { zh: '支持 JPG、PNG、PDF，单文件不超过 10MB', en: 'JPG, PNG, PDF up to 10MB' },
      addBtn:     { zh: '添加此人员', en: 'Add Person' },
      uploading:  { zh: '上传中...', en: 'Uploading...' },
      uploadFail: { zh: '上传失败，请重试', en: 'Upload failed, please try again' },
      noName:     { zh: '（未填写姓名）', en: '(No name entered)' },
      privacyNote:{ zh: '所有证件文件经过加密存储，仅用于 ACRA 注册审核，不作任何其他用途。',
                   en: 'All documents are encrypted and used solely for ACRA registration purposes. We never share your data.' },
    },
    step4: {
      title:   { zh: '确认您的订单', en: 'Review Your Order' },
      desc:    { zh: '一切就绪后，完成支付，剩余的全部交给我们处理。', en: 'Once you complete payment, we handle everything else.' },
      companyLabel: { zh: '公司名称', en: 'Company Name' },
      ssicLabel:    { zh: '经营范围（SSIC）', en: 'Principal Activity (SSIC)' },
      addrLabel:    { zh: '注册地址', en: 'Registered Address' },
      virtual:      { zh: 'CBD虚拟办公室地址', en: 'CBD Virtual Office Address' },
      own:          { zh: '自有地址', en: 'Own Address' },
      acraFee:   { zh: 'ACRA 政府注册费', en: 'ACRA Government Fee' },
      serviceFee:{ zh: '美生服务费', en: 'Meisheng Service Fee' },
      virtualFee:{ zh: '虚拟办公室地址（1年）', en: 'Virtual Office Address (1 Year)' },
      total:     { zh: '合计', en: 'Total Due' },
      payBtn:    { zh: '通过 Stripe 安全付款', en: 'Pay Securely via Stripe' },
      paying:    { zh: '正在跳转至支付页...', en: 'Redirecting to payment...' },
      payNote:   { zh: '🔒 支持 Stripe 国际信用卡 / PayNow 扫码付款。支付由 Stripe 加密保障，我们不存储您的卡片信息。',
                  en: '🔒 Stripe credit card & PayNow accepted. Your payment is encrypted by Stripe. We never store card details.' },
    },
    nav: {
      back:     { zh: '返回首页', en: 'Back to Home' },
      prev:     { zh: '上一步', en: 'Previous' },
      next:     { zh: '下一步', en: 'Next Step' },
    },
    summary: {
      progress: { zh: '注册进度', en: 'Progress' },
      planFee:  { zh: '套餐服务费', en: 'Package Fee' },
      acraFee:  { zh: 'ACRA 政府注册费', en: 'ACRA Gov. Fee' },
      total:    { zh: '合计', en: 'Total' },
      trust: {
        zh: ['Stripe 安全加密支付', '7天无理由退款保障', '微信客服即时在线'],
        en: ['Secured by Stripe Encryption', '7-Day Money-Back Guarantee', 'Live WeChat Support'],
      },
    },
    plans: {
      starter: {
        zh: { name: '起步版 Starter', items: ['ACRA 公司注册代办', '1年法定秘书服务', '公司章程自动生成', '全程中文客户服务'] },
        en: { name: 'Starter', items: ['ACRA company registration', '1-year company secretary', 'Auto-generated constitution', 'Bilingual customer support'] },
      },
      growth: {
        zh: { name: '成长版 Growth', items: ['起步版全部服务', 'CBD 虚拟办公室地址', '月度记账（≤50笔）', 'ECI 税务申报', '3名员工薪酬管理'] },
        en: { name: 'Growth', items: ['Everything in Starter', 'CBD virtual office address', 'Monthly bookkeeping (≤50 txns)', 'ECI tax filing', 'Payroll for 3 staff'] },
      },
      pro: {
        zh: { name: '全能版 Pro', items: ['成长版全部服务', '完整记账（不限笔数）', '企业所得税年度申报（Form C-S）', '10名员工薪酬管理', '专属客户经理'] },
        en: { name: 'Pro', items: ['Everything in Growth', 'Full bookkeeping (unlimited)', 'Annual corporate tax (Form C-S)', 'Payroll for 10 staff', 'Dedicated account manager'] },
      },
    },
  },

  // ── Nav ──
  nav: {
    features:   { zh: '功能特色', en: 'Features' },
    pricing:    { zh: '套餐价格', en: 'Pricing' },
    how:        { zh: '注册流程', en: 'How it works' },
    login:      { zh: '登录', en: 'Log in' },
    getStarted: { zh: '立即开始 →', en: 'Get Started →' },
    langToggle: { zh: 'EN', en: '中文' },
  },

  // ── Hero ──
  hero: {
    badge:    { zh: '🇸🇬 助力美好生活 · Empowering a Better Life', en: '🇸🇬 Empowering a Better Life · 助力美好生活' },
    title1:   { zh: '公司注册，从未如此', en: 'Company Incorporation,' },
    title2:   { zh: '简单与美好', en: 'Simple & Beautiful' },
    desc:     { zh: '从核名到营业执照，全程线上、全自动化处理。\n无需繁琐文书，无需奔波，60分钟内完成新加坡公司注册。',
                en: 'From name check to BizFile, fully online and automated.\nNo paperwork, no hassle. Singapore company registered in 60 minutes.' },
    cta:      { zh: '立即开始注册', en: 'Start Registration' },
    learnMore:{ zh: '了解流程', en: 'Learn More' },
    proof:    { zh: '已服务 <strong>1,200+</strong> 位新加坡创业者', en: 'Trusted by <strong>1,200+</strong> Singapore entrepreneurs' },
  },

  // ── Features ──
  features: {
    label: { zh: 'FEATURES · 功能特色', en: 'FEATURES · 功能特色' },
    title: { zh: '一站式注册，全程无忧', en: 'All-in-One Incorporation, Zero Hassle' },
    items: {
      zh: [
        { icon: 'fa-bolt', title: '60分钟极速注册', desc: '全自动化流程，从提交资料到递交ACRA，最快60分钟完成，告别漫长等待。' },
        { icon: 'fa-shield-halved', title: '合规安全有保障', desc: '严格遵循新加坡公司法，所有文件由执业秘书审核，数据经银行级加密保护。' },
        { icon: 'fa-file-signature', title: '电子签名一键完成', desc: '公司章程与同意书自动生成，董事无需见面，通过邮件在线完成法律签署。' },
        { icon: 'fa-language', title: '全程中英双语服务', desc: '从咨询到交付，全程提供普通话与英文支持，跨境创业无语言障碍。' },
        { icon: 'fa-credit-card', title: '透明定价·一价全含', desc: '无隐藏收费，含ACRA注册费S$315，支持Stripe信用卡与PayNow扫码付款。' },
        { icon: 'fa-headset', title: '专属顾问全程跟进', desc: '成长版及以上套餐配备专属微信客服，注册全程有人跟进，随时解答疑问。' },
      ],
      en: [
        { icon: 'fa-bolt', title: '60-Minute Incorporation', desc: 'Fully automated workflow — from form submission to ACRA filing in as little as 60 minutes.' },
        { icon: 'fa-shield-halved', title: 'Fully Compliant & Secure', desc: 'Adheres strictly to Singapore company law. All documents reviewed by licensed secretaries. Bank-grade data encryption.' },
        { icon: 'fa-file-signature', title: 'e-Signature in One Click', desc: 'Constitution and Consent forms auto-generated. Directors sign online via email — no in-person meetings needed.' },
        { icon: 'fa-language', title: 'Bilingual Support', desc: 'Full Mandarin and English support from consultation to delivery. Incorporate across borders without language barriers.' },
        { icon: 'fa-credit-card', title: 'Transparent, All-Inclusive Pricing', desc: 'No hidden fees. Includes S$315 ACRA government fee. Pay by Stripe credit card or PayNow.' },
        { icon: 'fa-headset', title: 'Dedicated Account Manager', desc: 'Growth plan and above comes with a dedicated WeChat support contact to guide you through every step.' },
      ],
    },
  },

  // ── Logos strip ──
  logos: {
    title: { zh: '深受各行业创业者信赖', en: 'Trusted across industries' },
    items: {
      zh: ['科技创业', '餐饮零售', '贸易进出口', '咨询顾问', '电商跨境', '专业服务'],
      en: ['Tech Startups', 'F&B & Retail', 'Import/Export', 'Consulting', 'E-Commerce', 'Professional Services'],
    },
  },

  // ── How it works ──
  how: {
    label: { zh: 'HOW IT WORKS · 注册流程', en: 'HOW IT WORKS · 注册流程' },
    title: { zh: '从零到营业执照\n只需四个简单步骤', en: 'From Zero to BizFile\nIn Just 4 Simple Steps' },
    steps: {
      zh: [
        { num: '01', title: '公司核名', sub: 'Name Check', desc: '实时查询ACRA数据库，秒级确认公司名称是否可注册，告别漫长等待。' },
        { num: '02', title: '配置股东与董事', sub: 'Stakeholders', desc: '通过Singpass MyInfo一键调取身份信息，外籍创始人可上传护照完成KYC验证。' },
        { num: '03', title: '电子签名', sub: 'e-Signature', desc: '公司章程与董事同意书自动生成，所有董事收到邮件后在线完成签名，无需打印。' },
        { num: '04', title: '领取营业执照', sub: 'Get BizFile', desc: '我们代您递交ACRA，营业执照（BizFile）通过邮件发至您的收件箱。' },
      ],
      en: [
        { num: '01', title: 'Name Check', sub: '公司核名', desc: 'Search the ACRA database in real-time. Confirm your company name availability in seconds.' },
        { num: '02', title: 'Shareholders & Directors', sub: '股东配置', desc: 'Use Singpass MyInfo to auto-fill identity details. Foreign founders can upload passports for KYC.' },
        { num: '03', title: 'e-Signature', sub: '电子签名', desc: 'Constitution and Director Consent forms are auto-generated. All directors sign online — no printing needed.' },
        { num: '04', title: 'Receive BizFile', sub: '营业执照', desc: 'We file with ACRA on your behalf. Your BizFile is delivered straight to your inbox.' },
      ],
    },
  },

  // ── Pricing ──
  pricing: {
    label:    { zh: 'PRICING · 套餐价格', en: 'PRICING · 套餐价格' },
    title:    { zh: '透明定价，无隐藏收费', en: 'Transparent Pricing, No Hidden Fees' },
    subtitle: { zh: '首年一价全含，告别繁琐报价', en: 'All-inclusive first-year price. No surprises.' },
    popular:  { zh: '🔥 最受欢迎', en: '🔥 Most Popular' },
    perYear:  { zh: '首年', en: '/ year' },
    market:   { zh: '市场同类服务均价', en: 'Market average' },
    cta:      { zh: '立即注册', en: 'Get Started' },
    note:     { zh: '以上价格均含 ACRA 政府注册费 S$315。所有套餐均提供中英双语服务，支持 Stripe 国际信用卡 / PayNow 扫码付款。',
                en: 'All prices include the S$315 ACRA government registration fee. Bilingual support included. Stripe credit card & PayNow accepted.' },
    plans: {
      zh: [
        { name: '起步版', en: 'Starter', price: '$499', market: '$650+',
          features: ['ACRA 公司注册代办', '1年法定秘书服务', '公司章程自动生成', '全程中文客户服务'],
          disabled: ['虚拟办公室地址', '记账与报税'] },
        { name: '成长版', en: 'Growth', price: '$888', market: '$1,100+',
          features: ['起步版全部服务', 'CBD 虚拟办公室地址', '月度记账（≤50笔）', 'ECI 税务申报', '3名员工薪酬管理（免费）', '微信专属客服'],
          disabled: [] },
        { name: '全能版', en: 'Pro', price: '$1,688', market: '$2,000+',
          features: ['成长版全部服务', '完整记账（不限笔数）', '企业所得税年度申报（Form C-S）', '10名员工薪酬管理', '专属客户经理', '银行开户引荐'],
          disabled: [] },
      ],
      en: [
        { name: 'Starter', en: '起步版', price: '$499', market: '$650+',
          features: ['ACRA company registration', '1-year company secretary', 'Auto-generated constitution', 'Bilingual customer support'],
          disabled: ['Virtual office address', 'Bookkeeping & tax filing'] },
        { name: 'Growth', en: '成长版', price: '$888', market: '$1,100+',
          features: ['Everything in Starter', 'CBD virtual office address', 'Monthly bookkeeping (≤50 txns)', 'ECI tax filing', 'Payroll for 3 staff (free)', 'WeChat dedicated support'],
          disabled: [] },
        { name: 'Pro', en: '全能版', price: '$1,688', market: '$2,000+',
          features: ['Everything in Growth', 'Full bookkeeping (unlimited)', 'Annual corporate tax (Form C-S)', 'Payroll for 10 staff', 'Dedicated account manager', 'Bank account referral'],
          disabled: [] },
      ],
    },
  },

  // ── CTA section ──
  cta: {
    title: { zh: '准备好开启您的创业之路了吗？', en: 'Ready to Start Your Business Journey?' },
    desc:  { zh: '加入 1,200+ 位选择了更智慧方式注册公司的创业者。', en: 'Join 1,200+ entrepreneurs who chose the smarter way to incorporate.' },
    sub:   { zh: '助力美好生活，从第一家公司开始。', en: 'Empowering a better life, one company at a time.' },
    btn:   { zh: '立即开始注册', en: 'Start Registration' },
  },

  // ── Footer ──
  footer: {
    copy: { zh: '© 2025 Meisheng Pte. Ltd. · Singapore', en: '© 2025 Meisheng Pte. Ltd. · Singapore' },
  },

  // ── Success Page ──
  success: {
    title:      { zh: '支付成功！🎉', en: 'Payment Successful! 🎉' },
    subtitle:   { zh: '恭喜您！您的公司注册申请已提交成功。', en: 'Congratulations! Your company registration application has been submitted.' },
    nextTitle:  { zh: '接下来我们会为您：', en: 'Here\'s what happens next:' },
    steps: {
      zh: [
        '生成公司章程 (Constitution) 和董事同意书',
        '向所有董事发送电子签名邀请',
        '收集全部签名后，代您递交 ACRA',
        '将营业执照 (BizFile) 发至您的邮箱',
      ],
      en: [
        'Generate your Constitution and Directors\' Consent forms',
        'Send e-signature invitations to all directors',
        'Submit your application to ACRA after all signatures are collected',
        'Deliver your BizFile to your inbox',
      ],
    },
    orderRef:  { zh: '订单参考号：', en: 'Order reference:' },
    whatsapp:  { zh: '通过 WhatsApp 联系顾问', en: 'Contact us via WhatsApp' },
    backHome:  { zh: '返回首页', en: 'Back to Home' },
  },
  // ── Dashboard ──
  dashboard: {
    welcome:    { zh: '欢迎回来，', en: 'Welcome back, ' },
    subtitle:   { zh: '以下是您今日的企业动态。', en: "Here's what's happening with your corporate entities today." },
    empty: {
      title:  { zh: '还没有注册任何公司', en: 'No companies yet' },
      desc:   { zh: '您当前没有任何活跃的公司记录。立即在新加坡开启您的商业征程，全程线上办理，最快 1 小时下证。',
                en: 'You have no active companies yet. Start your Singapore business journey today — fully online, BizFile issued in as little as 60 minutes.' },
      btn:    { zh: '注册第一家公司', en: 'Register Your First Company' },
    },
  },
};

export default t;

// Helper: get string by lang
export function tx(obj: { zh: string; en: string }, lang: Lang): string {
  return obj[lang];
}
