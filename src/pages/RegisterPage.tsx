import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '../lib/LanguageContext';
import t from '../lib/translations';
import './RegisterPage.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const PLAN_PRICES: Record<string, number> = { starter: 499, growth: 888, pro: 1688 };

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lang, toggleLang } = useLang();
  const _ = (o: { zh: string; en: string }) => o[lang];
  const planKey = (searchParams.get('plan') || 'starter') as 'starter' | 'growth' | 'pro';
  const planPrice = PLAN_PRICES[planKey] || 499;
  const planData = t.register.plans[planKey]?.[lang] || t.register.plans.starter[lang];
  const STEPS = t.register.steps[lang];
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    ssicCode: '',
    addressType: 'virtual',
  });
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [aiKeyword, setAiKeyword] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // 股东/董事 state
  type Shareholder = {
    name: string; idNumber: string; email: string;
    docName?: string; uploading?: boolean; uploadError?: string;
  };
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [newShareholder, setNewShareholder] = useState<{
    name: string; idNumber: string; email: string; docFile: File | null;
  }>({ name: '', idNumber: '', email: '', docFile: null });

  const handleAddShareholder = async () => {
    if (!newShareholder.name) return;
    const sh: Shareholder = {
      name: newShareholder.name,
      idNumber: newShareholder.idNumber,
      email: newShareholder.email,
      uploading: !!newShareholder.docFile,
    };
    setShareholders(prev => [...prev, sh]);
    const idx = shareholders.length;
    setNewShareholder({ name: '', idNumber: '', email: '', docFile: null });

    if (newShareholder.docFile) {
      const file = newShareholder.docFile;
      const uploadForm = new FormData();
      uploadForm.append('file', file);
      uploadForm.append('companyName', formData.companyName || 'unknown');
      uploadForm.append('personName', newShareholder.name);

      try {
        const res = await fetch(`${API}/api/upload-document`, {
          method: 'POST',
          body: uploadForm,
        });
        const result = await res.json();
        setShareholders(prev => prev.map((s, i) =>
          i === idx ? {
            ...s,
            uploading: false,
            docName: result.path ? file.name : undefined,
            docPath: result.path || undefined,
            uploadError: result.error || undefined
          } : s
        ));
      } catch {
        setShareholders(prev => prev.map((s, i) =>
          i === idx ? { ...s, uploading: false, uploadError: _(t.register.step3.uploadFail) } : s
        ));
      }
    }
  };

  const handleAISuggest = async () => {
    if (!aiKeyword.trim()) return;
    setAiLoading(true);
    setAiError('');
    setAiSuggestions([]);
    try {
      const res = await fetch(`${API}/api/suggest-names`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: aiKeyword }),
      });
      const data = await res.json();
      if (data.suggestions) {
        setAiSuggestions(data.suggestions);
      } else {
        setAiError(data.error || 'AI 服务暂时不可用。');
      }
    } catch {
      setAiError('无法连接服务器，请确保后端已启动。');
    } finally {
      setAiLoading(false);
    }
  };

  const handleNameCheck = () => {
    if (!formData.companyName) return;
    setLoading(true);
    setTimeout(() => {
      setNameAvailable(!formData.companyName.toLowerCase().includes('bank'));
      setLoading(false);
    }, 1500);
  };

  const canProceed = () => {
    if (step === 0) return nameAvailable === true;
    if (step === 1) return !!formData.ssicCode;
    return true;
  };

  const handlePayment = async () => {
    setPaying(true);
    setPayError('');
    try {
      // 先保存订单到数据库
      await fetch(`${API}/api/save-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName,
          ssicCode: formData.ssicCode,
          addressType: formData.addressType,
          plan: planKey,
          shareholders,
        }),
      });

      // 然后跳转 Stripe
      const res = await fetch(`${API}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPayError(_(t.register.step4.paying));
      }
    } catch {
      setPayError('Connection error. Please ensure the backend is running.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="register-page">
      {/* 左侧面板 */}
      <aside className="register-aside">
          <div className="aside-logo" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="美生集团" className="logo-img" />
            <div className="logo-brand">
              <span className="logo-en">Meisheng</span>
              <span className="logo-zh">美生集团</span>
            </div>
          </div>
          <button className="lang-toggle-btn" style={{margin:'0 0 16px 0',alignSelf:'flex-start'}} onClick={toggleLang}>
            {_(t.nav.langToggle)}
          </button>

        <div className="aside-steps">
          {STEPS.map((label, i) => (
            <div key={i} className={`aside-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <div className="aside-circle">{i < step ? <i className="fa-solid fa-check"></i> : i + 1}</div>
              <div className="aside-step-info">
                <span className="aside-step-num">{lang === 'zh' ? `第 ${i+1} 步` : `Step ${i+1}`}</span>
                <span className="aside-step-label">{label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="aside-trust">
          {t.register.aside.trust[lang].map((item, i) => (
            <div key={i} className="trust-item"><i className={`fa-solid ${['fa-shield-halved','fa-star','fa-clock'][i]}`}></i> {item}</div>
          ))}
        </div>
      </aside>

      {/* 右侧表单区 */}
      <main className="register-main">
        <div className="register-form-wrapper">

          {/* 第1步：公司核名 */}
          {step === 0 && (
            <div className="form-step slide-in">
              <div className="step-tag">{lang==='zh'?`第 1 步 · 共 4 步`:`Step 1 of 4`}</div>
              <h1>{_(t.register.step1.title)}</h1>
              <p className="step-desc">{_(t.register.step1.desc)}</p>

              <div className="field-group">
                <label>{_(t.register.step1.label)}</label>
                <div className="name-check-row">
                  <input
                    type="text"
                    placeholder={_(t.register.step1.placeholder)}
                    value={formData.companyName}
                    onChange={(e) => { setFormData({ ...formData, companyName: e.target.value }); setNameAvailable(null); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameCheck()}
                  />
                  <button className="check-btn" onClick={handleNameCheck} disabled={loading || !formData.companyName}>
                    {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : _(t.register.step1.checkBtn)}
                  </button>
                </div>
                  {nameAvailable === true && (
                    <div className="status-msg success animate-in">
                      <i className="fa-solid fa-check-circle"></i> <strong>{_(t.register.step1.available)}</strong> "{formData.companyName}" {_(t.register.step1.availableMsg)}
                    </div>
                  )}
                  {nameAvailable === false && (
                    <div className="status-msg error animate-in">
                      <i className="fa-solid fa-circle-exclamation"></i> <strong>{_(t.register.step1.taken)}</strong> {_(t.register.step1.takenMsg)}
                    </div>
                  )}
              </div>

              {/* AI 名称推荐 */}
              <div className="ai-suggest-box">
                <div className="ai-suggest-header">
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  <span>{_(t.register.step1.aiTitle)}</span>
                  <span className="ai-badge">Powered by GPT-4o</span>
                </div>
                <p className="ai-suggest-desc">{_(t.register.step1.aiDesc)}</p>
                <div className="ai-input-row">
                  <input
                    type="text"
                    placeholder={_(t.register.step1.aiPlaceholder)}
                    value={aiKeyword}
                    onChange={(e) => setAiKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAISuggest()}
                  />
                  <button className="ai-btn" onClick={handleAISuggest} disabled={aiLoading || !aiKeyword.trim()}>
                    {aiLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <><i className="fa-solid fa-sparkles"></i> {_(t.register.step1.aiBtn)}</>}
                  </button>
                </div>
                {aiError && <p className="ai-error">{aiError}</p>}
                {aiSuggestions.length > 0 && (
                  <div className="ai-suggestions">
                    {aiSuggestions.map((name, i) => (
                      <div
                        key={i}
                        className={`ai-suggestion-item ${formData.companyName === name ? 'selected' : ''}`}
                        onClick={() => { setFormData({ ...formData, companyName: name }); setNameAvailable(null); }}
                      >
                        <i className="fa-regular fa-circle-dot"></i>
                        <span>{name}</span>
                        <span className="ai-use-btn">{_(t.register.step1.aiUse)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="name-tips">
                <h4><i className="fa-regular fa-lightbulb"></i> {_(t.register.step1.tipsTitle)}</h4>
                <ul>{t.register.step1.tips[lang].map((tip,i)=><li key={i}>{tip}</li>)}</ul>
              </div>
            </div>
          )}

          {/* 第2步：公司详情 */}
          {step === 1 && (
            <div className="form-step slide-in">
              <div className="step-tag">{lang==='zh'?`第 2 步 · 共 4 步`:`Step 2 of 4`}</div>
              <h1>{_(t.register.step2.title)}</h1>
              <p className="step-desc">{_(t.register.step2.desc)}</p>

              <div className="field-group">
                <label>{_(t.register.step2.ssicLabel)}</label>
                <div className="select-wrapper">
                  <select value={formData.ssicCode} onChange={(e) => setFormData({ ...formData, ssicCode: e.target.value })}>
                    <option value="">{_(t.register.step2.ssicDefault)}</option>
                    <optgroup label="🖥️ 科技 Technology">
                      <option value="62011">62011 — 计算机程序开发 Computer programming</option>
                      <option value="62012">62012 — 软件开发与发行 Software development</option>
                      <option value="62020">62020 — IT系统咨询 IT consultancy</option>
                      <option value="62090">62090 — 其他IT服务 Other IT services</option>
                      <option value="63111">63111 — 数据处理与托管 Data processing &amp; hosting</option>
                      <option value="63120">63120 — 网络门户 Web portals</option>
                    </optgroup>
                    <optgroup label="🛍️ 电商与零售 E-Commerce &amp; Retail">
                      <option value="47910">47910 — 网络零售 Retail via internet</option>
                      <option value="47990">47990 — 其他零售业 Other retail trade</option>
                      <option value="46900">46900 — 综合批发贸易 General wholesale trade</option>
                      <option value="46410">46410 — 纺织品批发 Textile wholesale</option>
                      <option value="46499">46499 — 其他消费品批发 Other consumer goods wholesale</option>
                      <option value="47711">47711 — 服装零售 Clothing retail</option>
                    </optgroup>
                    <optgroup label="🍜 餐饮 Food &amp; Beverage">
                      <option value="56101">56101 — 餐馆 Restaurants</option>
                      <option value="56102">56102 — 快餐店 Fast food restaurants</option>
                      <option value="56103">56103 — 咖啡厅 Cafes &amp; coffee houses</option>
                      <option value="56210">56210 — 餐饮配送 Event catering</option>
                    </optgroup>
                    <optgroup label="💼 咨询与专业服务 Consulting">
                      <option value="70221">70221 — 管理咨询 Management consulting</option>
                      <option value="70222">70222 — 商业战略咨询 Business strategy consulting</option>
                      <option value="70100">70100 — 控股公司管理 Holding company management</option>
                      <option value="74100">74100 — 专项设计服务 Specialised design</option>
                      <option value="74909">74909 — 其他专业服务 Other professional services</option>
                      <option value="82110">82110 — 行政管理服务 Administrative services</option>
                    </optgroup>
                    <optgroup label="🏗️ 建筑与工程 Construction &amp; Engineering">
                      <option value="41000">41000 — 建筑开发 Building construction</option>
                      <option value="43210">43210 — 电气安装 Electrical installation</option>
                      <option value="43220">43220 — 管道及空调安装 Plumbing &amp; air-conditioning</option>
                      <option value="43300">43300 — 建筑装修 Building completion &amp; finishing</option>
                      <option value="71121">71121 — 土木工程咨询 Civil engineering consultancy</option>
                    </optgroup>
                    <optgroup label="🏠 房地产 Real Estate">
                      <option value="68100">68100 — 房产开发与销售 Real estate development</option>
                      <option value="68201">68201 — 住宅房产租赁 Residential property rental</option>
                      <option value="68311">68311 — 房产代理 Real estate agency</option>
                      <option value="68320">68320 — 房产管理 Property management</option>
                    </optgroup>
                    <optgroup label="📦 物流与运输 Logistics &amp; Transport">
                      <option value="49400">49400 — 货运运输 Freight transport</option>
                      <option value="52100">52100 — 仓储 Warehousing &amp; storage</option>
                      <option value="52291">52291 — 货运代理 Freight forwarding</option>
                      <option value="53200">53200 — 快递服务 Courier services</option>
                    </optgroup>
                    <optgroup label="💰 金融与投资 Finance &amp; Investment">
                      <option value="64201">64201 — 投资控股公司 Investment holding companies</option>
                      <option value="66190">66190 — 其他金融辅助服务 Other financial auxiliary</option>
                    </optgroup>
                    <optgroup label="🎓 教育与培训 Education &amp; Training">
                      <option value="85491">85491 — 语言培训 Language training</option>
                      <option value="85499">85499 — 其他教育培训 Other education &amp; training</option>
                    </optgroup>
                    <optgroup label="💆 美容与健康 Beauty &amp; Wellness">
                      <option value="96021">96021 — 美发沙龙 Hairdressing salons</option>
                      <option value="96022">96022 — 美容院 Beauty salons</option>
                      <option value="96031">96031 — 健身房 Fitness centres</option>
                      <option value="96099">96099 — 其他个人服务 Other personal services</option>
                    </optgroup>
                    <optgroup label="📱 媒体与营销 Media &amp; Marketing">
                      <option value="73100">73100 — 广告服务 Advertising</option>
                      <option value="73200">73200 — 市场调研 Market research</option>
                      <option value="74200">74200 — 摄影 Photography</option>
                      <option value="59111">59111 — 影视制作 Film &amp; video production</option>
                    </optgroup>
                    <optgroup label="🔧 维修与其他 Repair &amp; Other">
                      <option value="95110">95110 — 电脑维修 Computer repair</option>
                      <option value="95120">95120 — 通讯设备维修 Communication equipment repair</option>
                      <option value="96900">96900 — 其他服务业 Other service activities</option>
                    </optgroup>
                  </select>
                  <i className="fa-solid fa-chevron-down select-arrow"></i>
                </div>
                <p className="field-tip">
                  <i className="fa-solid fa-circle-info"></i> 先选一个最接近的即可，无需纠结。公司注册完成后可随时通过 ACRA Bizfile 修改经营范围，无需重新注册。
                </p>
              </div>

              <div className="field-group">
                <label>{_(t.register.step2.addrLabel)}</label>
                <div className="option-cards">
                  {t.register.step2.addrOptions[lang].map((opt, idx) => (
                    <div key={idx}
                      className={`option-card ${formData.addressType === (idx===0?'virtual':'own') ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, addressType: idx===0?'virtual':'own' })}
                    >
                      <div className={`option-radio ${formData.addressType === (idx===0?'virtual':'own') ? 'checked' : ''}`}></div>
                      <div className="option-icon"><i className={`fa-solid ${idx===0?'fa-building':'fa-house'}`}></i></div>
                      <div className="option-text">
                        <strong>{opt.label}</strong>
                        <span>{opt.sub}</span>
                      </div>
                      {opt.badge && <span className="option-badge">{opt.badge}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 第3步：股东与董事 */}
          {step === 2 && (
            <div className="form-step slide-in">
              <div className="step-tag">第 3 步 · 共 4 步</div>
              <h1>配置董事与股东</h1>
              <p className="step-desc">新加坡法律要求至少有 <strong>1 名本地居民董事</strong>（新加坡公民、永久居民或持有有效工作准证者）。</p>

              <div className="singpass-cta">
                <div className="singpass-logo">
                  <i className="fa-solid fa-fingerprint"></i> Singpass MyInfo
                </div>
                <p>最快速的方式 — 通过政府数字身份一键完成身份核验，无需手动上传任何文件。</p>
                <button className="singpass-btn" onClick={() => alert('Singpass 集成即将上线，请使用手动填写方式。')}>
                  <i className="fa-solid fa-bolt"></i> 通过 Singpass 添加董事
                </button>
              </div>

              <div className="divider"><span>或手动填写并上传证件</span></div>

              {/* 人员列表 */}
              {shareholders.length > 0 && (
                <div className="shareholder-list">
                  {shareholders.map((sh, i) => (
                    <div key={i} className="shareholder-card">
                      <div className="sh-card-left">
                        <div className="sh-avatar"><i className="fa-solid fa-user"></i></div>
                        <div>
                  <div className="sh-name">{sh.name || _(t.register.step3.noName)}</div>
                          <div className="sh-meta">{sh.idNumber} · {sh.email}</div>
                          {sh.docName && (
                            <div className="sh-doc-status success">
                              <i className="fa-solid fa-file-check"></i> {sh.docName}
                            </div>
                          )}
                          {sh.uploading && (
                            <div className="sh-doc-status uploading">
                              <i className="fa-solid fa-circle-notch fa-spin"></i> {_(t.register.step3.uploading)}
                            </div>
                          )}
                          {sh.uploadError && (
                            <div className="sh-doc-status error">{sh.uploadError}</div>
                          )}
                        </div>
                      </div>
                      <button className="sh-remove" onClick={() => setShareholders(shareholders.filter((_, idx) => idx !== i))}>
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 添加人员表单 */}
              <div className="add-person-form">
                <div className="field-group" style={{marginBottom: '16px'}}>
                  <label>{_(t.register.step3.nameLabel)}</label>
                  <input type="text" placeholder={_(t.register.step3.namePh)} value={newShareholder.name}
                    onChange={e => setNewShareholder(prev => ({...prev, name: e.target.value}))} />
                </div>
                <div className="field-group" style={{marginBottom: '16px'}}>
                  <label>{_(t.register.step3.idLabel)}</label>
                  <input type="text" placeholder={_(t.register.step3.idPh)} value={newShareholder.idNumber}
                    onChange={e => setNewShareholder(prev => ({...prev, idNumber: e.target.value}))} />
                </div>
                <div className="field-group" style={{marginBottom: '16px'}}>
                  <label>{_(t.register.step3.emailLabel)}</label>
                  <input type="email" placeholder="example@email.com" value={newShareholder.email}
                    onChange={e => setNewShareholder(prev => ({...prev, email: e.target.value}))} />
                </div>

                {/* 证件上传区 */}
                <div className="field-group" style={{marginBottom: '20px'}}>
                  <label>{_(t.register.step3.docLabel)}</label>
                  <div
                    className={`doc-upload-zone ${newShareholder.docFile ? 'has-file' : ''}`}
                    onClick={() => document.getElementById('doc-upload-input')?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) setNewShareholder(prev => ({...prev, docFile: file}));
                    }}
                  >
                    <input
                      id="doc-upload-input"
                      type="file"
                      accept="image/*,.pdf"
                      style={{display: 'none'}}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) setNewShareholder(prev => ({...prev, docFile: file}));
                      }}
                    />
                    {newShareholder.docFile ? (
                      <div className="upload-preview">
                        <i className="fa-solid fa-file-circle-check"></i>
                        <span>{newShareholder.docFile.name}</span>
                        <button onClick={e => { e.stopPropagation(); setNewShareholder(prev => ({...prev, docFile: null})); }}>
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    ) : (
                      <>
                        <i className="fa-solid fa-cloud-arrow-up"></i>
                        <span>{_(t.register.step3.uploadHint)}</span>
                        <small>{_(t.register.step3.uploadSub)}</small>
                      </>
                    )}
                  </div>
                </div>

                <button className="add-manual-btn accent" onClick={handleAddShareholder} disabled={!newShareholder.name}>
                  <i className="fa-solid fa-plus"></i> {_(t.register.step3.addBtn)}
                </button>
              </div>

              <p className="field-tip" style={{marginTop: '16px'}}>
                <i className="fa-solid fa-shield-halved"></i>
                {_(t.register.step3.privacyNote)}
              </p>
            </div>
          )}

          {/* 第4步：确认与付款 */}
          {step === 3 && (
            <div className="form-step slide-in">
              <div className="step-tag">{lang==='zh'?`第 4 步 · 确认下单`:`Step 4 of 4`}</div>
              <h1>{_(t.register.step4.title)}</h1>
              <p className="step-desc">{_(t.register.step4.desc)}</p>

              <div className="order-summary">
                <div className="summary-row"><span>{_(t.register.step4.companyLabel)}</span><strong>{formData.companyName}</strong></div>
                <div className="summary-row"><span>{_(t.register.step4.ssicLabel)}</span><strong>{formData.ssicCode}</strong></div>
                <div className="summary-row"><span>{_(t.register.step4.addrLabel)}</span>
                  <strong>{formData.addressType === 'virtual' ? _(t.register.step4.virtual) : _(t.register.step4.own)}</strong>
                </div>
              </div>

              <div className="receipt">
                <div className="receipt-row"><span>{_(t.register.step4.acraFee)}</span><span>$315.00</span></div>
                <div className="receipt-row"><span>{_(t.register.step4.serviceFee)}</span><span>$250.00</span></div>
                {formData.addressType === 'virtual' && <div className="receipt-row accent-row"><span>{_(t.register.step4.virtualFee)}</span><span>$299.00</span></div>}
                <div className="receipt-total">
                  <span>{_(t.register.step4.total)}</span>
                  <strong className="total-amount">${formData.addressType === 'virtual' ? '864.00' : '565.00'} SGD</strong>
                </div>
              </div>

              <button className="pay-btn" onClick={handlePayment} disabled={paying}>
                {paying
                  ? <span><i className="fa-solid fa-circle-notch fa-spin"></i> {_(t.register.step4.paying)}</span>
                  : <span><i className="fa-brands fa-stripe"></i> {_(t.register.step4.payBtn)}</span>
                }
              </button>
              {payError && (
                <div className="status-msg error animate-in" style={{marginTop: '12px'}}>
                  <i className="fa-solid fa-circle-exclamation"></i> {payError}
                </div>
              )}
              <p className="pay-note">{_(t.register.step4.payNote)}</p>
            </div>
          )}

          {/* 底部导航 */}
          <div className="form-nav">
            <button className="btn-back" onClick={() => step === 0 ? navigate('/') : setStep(step - 1)}>
              <i className="fa-solid fa-arrow-left"></i> {step === 0 ? _(t.register.nav.back) : _(t.register.nav.prev)}
            </button>
            {step < 3 && (
              <button className="btn-next" disabled={!canProceed()} onClick={() => setStep(step + 1)}>
                {_(t.register.nav.next)} <i className="fa-solid fa-arrow-right"></i>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* 右侧固定价格摘要 */}
      <aside className="order-summary-panel">
        <div className="summary-sticky">
          <div className="summary-plan-badge">{planData.name}</div>
          <div className="summary-items">
            {planData.items.map((item, i) => (
              <div key={i} className="summary-item"><i className="fa-solid fa-check"></i><span>{item}</span></div>
            ))}
          </div>

          <div className="summary-divider"></div>

          {/* 动态费用明细 */}
          <div className="summary-fee-row"><span>{_(t.register.summary.planFee)}</span><span>${planPrice.toLocaleString()}</span></div>
          <div className="summary-fee-row"><span>{_(t.register.summary.acraFee)}</span><span>$315</span></div>
          <div className="summary-total"><span>{_(t.register.summary.total)}</span><strong>${(planPrice + 315).toLocaleString()} SGD</strong></div>

          <div className="summary-divider"></div>

          {/* 信任背书 */}
          <div className="summary-trust">
            {t.register.summary.trust[lang].map((item, i) => (
              <div key={i} className="trust-row">
                <i className={`fa-solid ${['fa-shield-halved','fa-rotate-left','fa-brands fa-weixin'][i]}`}></i>
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* 进度提示 */}
          <div className="summary-progress">
            <div className="progress-label"><span>{_(t.register.summary.progress)}</span><span>{step + 1} / 4</span></div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${((step + 1) / 4) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
