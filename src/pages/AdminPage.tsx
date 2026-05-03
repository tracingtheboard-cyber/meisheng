import { useState, useEffect, useCallback, useRef } from 'react';
import './AdminPage.css';

const API = 'http://localhost:3001';

const WORKFLOW_STEPS = [
  { id: 'name_check',   label: '公司名可用性核查',     desc: '在 ACRA Bizfile 确认名称未被占用' },
  { id: 'kyc_review',   label: '身份证件审查',         desc: '核对护照/NRIC，确认信息一致' },
  { id: 'constitution', label: '公司章程生成',         desc: '生成 Constitution 和董事同意书' },
  { id: 'esign',        label: '发送电子签名邀请',     desc: '向所有董事发送签署链接' },
  { id: 'acra_submit',  label: '提交 ACRA 注册',       desc: '通过 Bizfile 提交公司注册申请' },
  { id: 'bizfile',      label: '收到营业执照 BizFile', desc: '确认 ACRA 审批通过' },
  { id: 'delivered',    label: '执照发送给客户',       desc: '发送证书至客户邮箱，完结' },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  submitted:  { label: '已提交',     color: '#C9952A' },
  processing: { label: '处理中',     color: '#2563EB' },
  filed:      { label: '已递交ACRA', color: '#7C3AED' },
  completed:  { label: '注册完成',   color: '#16A34A' },
  rejected:   { label: '已退回',     color: '#DC2626' },
};

type Shareholder = { name: string; idNumber: string; email: string; docName?: string; docPath?: string };
type Order       = { id: string; created_at: string; company_name: string; ssic_code: string; address_type: string; plan: string; shareholders: Shareholder[]; status: string; checklist: string[]; notes: string };
type DocFile     = { name: string; folder: string; path: string; size?: number };

export default function AdminPage() {
  const [authed, setAuthed]     = useState(false);
  const [pwdInput, setPwdInput] = useState('');
  const [orders, setOrders]     = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [loading, setLoading]   = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [docs, setDocs]             = useState<DocFile[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [previewUrl, setPreviewUrl]   = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [modalOpen, setModalOpen]     = useState(false);
  const [activeStep, setActiveStep]   = useState<string | null>(null);
  const [inlinePreviewUrl, setInlinePreviewUrl]         = useState('');
  const [inlinePreviewLoading, setInlinePreviewLoading] = useState(false);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const h = { 'Content-Type': 'application/json' };
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch(`${API}/api/admin/orders`, { headers: h, credentials: 'include' }); setOrders(await r.json()); }
    finally { setLoading(false); }
  }, []);

  const fetchDocs = useCallback(async () => {
    setDocsLoading(true);
    try { const r = await fetch(`${API}/api/admin/list-docs`, { headers: h, credentials: 'include' }); const d = await r.json(); setDocs(Array.isArray(d) ? d : []); }
    finally { setDocsLoading(false); }
  }, []);

  // 页面加载时检查 session是否已登录
  useEffect(() => {
    fetch(`${API}/api/admin/me`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.authed) setAuthed(true); });
  }, []);

  useEffect(() => { if (authed) { fetchOrders(); fetchDocs(); } }, [authed, fetchOrders, fetchDocs]);

  const patch = (id: string, body: object) =>
    fetch(`${API}/api/admin/orders/${id}`, { method: 'PATCH', headers: h, credentials: 'include', body: JSON.stringify(body) });

  const markStepDone = async (stepId: string) => {
    if (!selected) return;
    if ((selected.checklist||[]).includes(stepId)) return;
    const next = [...(selected.checklist||[]), stepId];
    const updated = { ...selected, checklist: next };
    setSelected(updated); setOrders(p => p.map(o => o.id === selected.id ? updated : o));
    await patch(selected.id, { checklist: next });
  };

  const handleStatusChange = async (status: string) => {
    if (!selected) return;
    const updated = { ...selected, status };
    setSelected(updated); setOrders(p => p.map(o => o.id === selected.id ? updated : o));
    await patch(selected.id, { status });
  };

  const handleNotesChange = (notes: string) => {
    if (!selected) return;
    setSelected(prev => prev ? { ...prev, notes } : null);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    setSavingNotes(true);
    notesTimer.current = setTimeout(async () => { await patch(selected.id, { notes }); setSavingNotes(false); }, 1000);
  };

  const previewDoc = async (path: string) => {
    setPreviewLoading(true); setPreviewUrl(''); setModalOpen(true);
    const r = await fetch(`${API}/api/admin/preview-doc`, { method: 'POST', headers: h, credentials: 'include', body: JSON.stringify({ path }) });
    const { url } = await r.json();
    setPreviewUrl(url); setPreviewLoading(false);
  };

  const downloadDoc = async (path: string, name: string) => {
    const r = await fetch(`${API}/api/admin/download-doc`, { method: 'POST', headers: h, credentials: 'include', body: JSON.stringify({ path }) });
    const { url } = await r.json();
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  };

  // 内联预览（显示在证件列下方，不弹窗）
  const previewDocInline = async (path: string) => {
    setInlinePreviewLoading(true); setInlinePreviewUrl('');
    const r = await fetch(`${API}/api/admin/preview-doc`, { method: 'POST', headers: h, credentials: 'include', body: JSON.stringify({ path }) });
    const { url } = await r.json();
    setInlinePreviewUrl(url); setInlinePreviewLoading(false);
  };

  const progress    = selected ? Math.round(((selected.checklist?.length||0) / WORKFLOW_STEPS.length) * 100) : 0;
  const clientEmail = selected?.shareholders?.find(s => s.email)?.email || '';

  // 按公司分组文件
  const docGroups: Record<string, DocFile[]> = {};
  docs.forEach(doc => { const k = doc.folder||'未分类'; if (!docGroups[k]) docGroups[k]=[]; docGroups[k].push(doc); });

  if (!authed) return (
    <div className="admin-login">
      <div className="admin-login-card">
        <div style={{ fontSize: 36, marginBottom: 12 }}>🏢</div>
        <h2>美生管理后台</h2><p>请输入管理员密码</p>
        <input type="password" placeholder="密码" value={pwdInput}
          onChange={e => setPwdInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') {
            fetch(`${API}/api/admin/login`, { method: 'POST', headers: h, credentials: 'include', body: JSON.stringify({ password: pwdInput }) })
              .then(r => r.json()).then(d => d.ok ? setAuthed(true) : alert('密码错误'));
          }}} />
        <button onClick={() => {
          fetch(`${API}/api/admin/login`, { method: 'POST', headers: h, credentials: 'include', body: JSON.stringify({ password: pwdInput }) })
            .then(r => r.json())
            .then(d => d.ok ? setAuthed(true) : alert('密码错误'));
        }}>进入管理后台</button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── 步骤操作弹窗 ── */}
      {activeStep && selected && (
        <div className="preview-modal-overlay" onClick={() => setActiveStep(null)}>
          <div className="step-modal" onClick={e => e.stopPropagation()}>
            <div className="step-modal-header">
              <div>
                <div className="step-modal-title">
                  {WORKFLOW_STEPS.find(s => s.id === activeStep)?.label}
                </div>
                <div className="step-modal-sub">{selected.company_name}</div>
              </div>
              <button className="preview-modal-close" onClick={() => setActiveStep(null)}>✕</button>
            </div>
            <div className="step-modal-body">

              {/* 1. 公司名核查 */}
              {activeStep === 'name_check' && (
                <>
                  <div className="step-info-row"><span>公司名称</span><strong>{selected.company_name}</strong></div>
                  <div className="step-info-row"><span>SSIC 代码</span><strong>{selected.ssic_code}</strong></div>
                  <a className="step-action-btn acra" href={`https://www.bizfile.gov.sg/ngbbizfileinternet/faces/oracle/webcenter/portalapp/pages/BizfileHomePage.jspx`} target="_blank" rel="noreferrer">
                    <i className="fa-solid fa-arrow-up-right-from-square"></i> 打开 ACRA Bizfile 核名
                  </a>
                  <p className="step-hint">在 Bizfile 搜索确认公司名可用后，点击下方按钮标记完成。</p>
                </>
              )}

              {/* 2. 证件审查 */}
              {activeStep === 'kyc_review' && (
                <>
                  {selected.shareholders?.length === 0 && <p className="step-hint">暂无股东证件记录。</p>}
                  {selected.shareholders?.map((sh, i) => (
                    <div key={i} className="step-sh-row">
                      <div className="step-sh-info">
                        <strong>{sh.name}</strong>
                        {sh.idNumber && <span>{sh.idNumber}</span>}
                      </div>
                      {sh.docPath
                        ? <button className="step-action-btn" onClick={() => { previewDoc(sh.docPath!); setActiveStep(null); }}><i className="fa-solid fa-eye"></i> 预览证件</button>
                        : <span className="step-no-doc">未上传</span>}
                    </div>
                  ))}
                </>
              )}

              {/* 3. 章程生成 */}
              {activeStep === 'constitution' && (
                <>
                  <p className="step-hint">根据股东信息自动生成公司章程草稿（Constitution）及董事同意书（Consent to Act as Director）。</p>
                  <div className="step-info-row"><span>公司</span><strong>{selected.company_name}</strong></div>
                  <div className="step-info-row"><span>董事数量</span><strong>{selected.shareholders?.length || 0} 人</strong></div>
                  <button className="step-action-btn" onClick={() => alert('章程生成功能即将上线，请暂时使用模板手动填写。')}>
                    <i className="fa-solid fa-file-word"></i> 生成章程草稿（即将上线）
                  </button>
                </>
              )}

              {/* 4. 电子签名 */}
              {activeStep === 'esign' && (
                <>
                  <p className="step-hint">向以下所有董事发送电子签名邀请：</p>
                  {selected.shareholders?.map((sh, i) => (
                    <div key={i} className="step-sh-row">
                      <div className="step-sh-info"><strong>{sh.name}</strong><span>{sh.email||'（无邮箱）'}</span></div>
                      {sh.email && (
                        <a className="step-action-btn" href={`mailto:${sh.email}?subject=【美生】公司章程签署邀请 - ${selected.company_name}&body=您好 ${sh.name}，\n\n请点击链接签署公司章程：[链接]\n\n美生企业服务`}>
                          <i className="fa-solid fa-envelope"></i> 发送邮件
                        </a>
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* 5. 提交ACRA */}
              {activeStep === 'acra_submit' && (
                <>
                  <p className="step-hint">所有章程签名收集完毕后，登录 Bizfile 提交注册申请。</p>
                  <div className="step-info-row"><span>公司名</span><strong>{selected.company_name}</strong></div>
                  <a className="step-action-btn acra" href="https://www.bizfile.gov.sg" target="_blank" rel="noreferrer">
                    <i className="fa-solid fa-arrow-up-right-from-square"></i> 登录 ACRA Bizfile 提交
                  </a>
                </>
              )}

              {/* 6. 收到执照 */}
              {activeStep === 'bizfile' && (
                <>
                  <p className="step-hint">ACRA 审批通过后，在此记录执照参考号。</p>
                  <div className="step-info-row">
                    <span>UEN</span>
                    <input className="step-input" placeholder="例：202512345A" />
                  </div>
                  <button className="step-action-btn" onClick={() => markStepDone('bizfile').then(() => setActiveStep(null))}>
                    <i className="fa-solid fa-check"></i> 确认收到执照
                  </button>
                </>
              )}

              {/* 7. 发送给客户 */}
              {activeStep === 'delivered' && (
                <>
                  <p className="step-hint">将营业执照发送给客户，完成整个注册流程。</p>
                  {clientEmail
                    ? <a className="step-action-btn" href={`mailto:${clientEmail}?subject=【美生】您的公司 ${selected.company_name} 已成功注册&body=尊敬的客户，\n\n恭喜！您的公司 ${selected.company_name} 已在 ACRA 成功注册。\n\n附件为营业执照（BizFile）。\n\n如有问题，请随时联系我们。\n\n美生企业服务团队`}>
                        <i className="fa-solid fa-envelope"></i> 发送执照邮件给客户
                      </a>
                    : <p className="step-hint" style={{color:'#DC2626'}}>客户邮箱未登记，请在股东信息中补充。</p>
                  }
                </>
              )}

            </div>
            {/* 标记完成按钮 */}
            {!(selected.checklist||[]).includes(activeStep) && (
              <div className="step-modal-footer">
                <button className="step-done-btn" onClick={() => { markStepDone(activeStep); setActiveStep(null); }}>
                  <i className="fa-solid fa-check-circle"></i> 标记此步骤为完成
                </button>
              </div>
            )}
            {(selected.checklist||[]).includes(activeStep) && (
              <div className="step-modal-footer done">
                <i className="fa-solid fa-check-circle"></i> 此步骤已完成
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 证件预览弹窗 ── */}
      {modalOpen && (
        <div className="preview-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="preview-modal" onClick={e => e.stopPropagation()}>
            <div className="preview-modal-header">
              <span><i className="fa-solid fa-shield-halved"></i> 安全预览（60分钟有效）</span>
              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                {previewUrl && <a href={previewUrl} target="_blank" rel="noreferrer" className="preview-modal-open"><i className="fa-solid fa-arrow-up-right-from-square"></i> 新窗口打开</a>}
                <button className="preview-modal-close" onClick={() => setModalOpen(false)}>✕</button>
              </div>
            </div>
            <div className="preview-modal-body">
              {previewLoading
                ? <div className="preview-modal-loading"><i className="fa-solid fa-circle-notch fa-spin"></i><span>生成安全链接...</span></div>
                : <img src={previewUrl} alt="证件" className="preview-modal-img" />}
            </div>
          </div>
        </div>
      )}
      <div className="admin-layout">

      {/* 左侧导航 */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo"><span style={{ fontSize: 22 }}>🏢</span><span>美生管理后台</span></div>
        <nav>
          <div className="admin-nav-item active">
            <i className="fa-solid fa-file-invoice"></i> 注册申请
            <span className="nav-badge">{orders.filter(o => o.status==='submitted').length}</span>
          </div>
        </nav>
        <div className="admin-sidebar-footer">
          <button onClick={() => {
            fetch(`${API}/api/admin/logout`, { method: 'POST', credentials: 'include' });
            setAuthed(false);
          }}><i className="fa-solid fa-right-from-bracket"></i> 退出</button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="admin-main">
        <div className="admin-header">
          <h1>注册申请管理 <span className="total-count">{orders.length} 条记录</span></h1>
          <button className="admin-refresh" onClick={() => { fetchOrders(); fetchDocs(); }}>
            <i className="fa-solid fa-rotate"></i> 刷新
          </button>
        </div>

        {loading ? (
          <div className="admin-loading"><i className="fa-solid fa-circle-notch fa-spin"></i> 加载中...</div>
        ) : (
          /* 三列并列布局 */
          <div className="admin-3col">

            {/* ── 列1：订单列表 ── */}
            <div className="order-list">
              {orders.length === 0 && <div className="empty-state">暂无申请记录</div>}
              {orders.map(order => {
                const pct = Math.round(((order.checklist?.length||0)/WORKFLOW_STEPS.length)*100);
                return (
                  <div key={order.id} className={`order-card ${selected?.id===order.id?'active':''}`}
                    onClick={() => { setSelected(order); setPreviewUrl(''); }}>
                    <div className="order-card-top">
                      <div className="order-company">{order.company_name||'（未填公司名）'}</div>
                      <span className="order-status-badge"
                        style={{background:(STATUS_LABELS[order.status]?.color||'#888')+'20', color:STATUS_LABELS[order.status]?.color||'#888'}}>
                        {STATUS_LABELS[order.status]?.label||order.status}
                      </span>
                    </div>
                    <div className="order-meta">
                      <span><i className="fa-solid fa-tag"></i> {order.plan||'—'}</span>
                      <span><i className="fa-solid fa-users"></i> {order.shareholders?.length||0} 人</span>
                      <span><i className="fa-solid fa-clock"></i> {new Date(order.created_at).toLocaleDateString('zh-CN')}</span>
                    </div>
                    {pct > 0 && <div className="order-progress-bar"><div className="order-progress-fill" style={{width:`${pct}%`}}></div></div>}
                  </div>
                );
              })}
            </div>

            {/* ── 列2：订单详情 ── */}
            {selected ? (
              <div className="order-detail">
                <div className="detail-top-bar">
                  <div>
                    <div className="detail-company-name">{selected.company_name}</div>
                    <div className="detail-subtitle">{selected.plan?.toUpperCase()} · {selected.address_type==='virtual'?'虚拟办公室':'自有地址'} · SSIC {selected.ssic_code}</div>
                  </div>
                  <div className="detail-top-actions">
                    <select value={selected.status} onChange={e => handleStatusChange(e.target.value)} className="status-select">
                      {Object.entries(STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    {clientEmail && <a href={`mailto:${clientEmail}?subject=您的美生公司注册申请更新`} className="action-btn email-btn"><i className="fa-solid fa-envelope"></i> 发邮件</a>}
                    <a href="https://www.bizfile.gov.sg" target="_blank" rel="noreferrer" className="action-btn acra-btn">
                      <i className="fa-solid fa-arrow-up-right-from-square"></i> ACRA
                    </a>
                  </div>
                </div>

                <div className="workflow-section">
                  <div className="section-title">处理进度 <span className="progress-pct">{progress}%</span></div>
                  <div className="progress-bar-full"><div className="progress-bar-fill" style={{width:`${progress}%`}}></div></div>
                  <div className="workflow-steps">
                    {WORKFLOW_STEPS.map(step => {
                      const checked = selected.checklist?.includes(step.id);
                      return (
                        <div key={step.id} className={`workflow-step ${checked?'done':''}`}
                          onClick={() => setActiveStep(step.id)}>
                          <div className={`step-checkbox ${checked?'checked':''}`}>{checked && <i className="fa-solid fa-check"></i>}</div>
                          <div style={{flex:1}}><div className="step-label">{step.label}</div><div className="step-desc">{step.desc}</div></div>
                          <i className="fa-solid fa-chevron-right" style={{fontSize:11,color:'#ccc',flexShrink:0}}></i>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selected.shareholders?.length > 0 && (
                  <div className="workflow-section">
                    <div className="section-title">股东 / 董事</div>
                    {selected.shareholders.map((sh, i) => (
                      <div key={i} className="sh-detail-card">
                        <div className="sh-detail-left">
                          <div className="sh-avatar-sm">{sh.name.charAt(0).toUpperCase()}</div>
                          <div>
                            <div className="sh-detail-name">{sh.name}</div>
                            <div className="sh-detail-meta">
                              {sh.idNumber && <span><i className="fa-solid fa-id-card"></i> {sh.idNumber}</span>}
                              {sh.email && <span><i className="fa-solid fa-envelope"></i> {sh.email}</span>}
                            </div>
                          </div>
                        </div>
                        {sh.docPath ? (
                          <div className="doc-actions">
                            <button className="doc-btn preview" onClick={() => previewDoc(sh.docPath!)}><i className="fa-solid fa-eye"></i> 预览</button>
                            <button className="doc-btn download" onClick={() => downloadDoc(sh.docPath!, sh.docName||'doc')}><i className="fa-solid fa-download"></i> 下载</button>
                          </div>
                        ) : sh.docName ? (
                          <span className="doc-name-only"><i className="fa-solid fa-file"></i> {sh.docName}</span>
                        ) : (
                          <span className="no-doc">未上传证件</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {(previewLoading || previewUrl) && (
                  <div className="workflow-section">
                    <div className="section-title">证件预览</div>
                    <button className="doc-btn preview" onClick={() => setModalOpen(true)}>
                      <i className="fa-solid fa-eye"></i> 重新打开预览
                    </button>
                  </div>
                )}

                <div className="workflow-section">
                  <div className="section-title">内部备注 {savingNotes && <span className="saving-hint"><i className="fa-solid fa-circle-notch fa-spin"></i> 保存中...</span>}</div>
                  <textarea className="notes-area" placeholder="添加跟进记录、备注..."
                    value={selected.notes||''} onChange={e => handleNotesChange(e.target.value)} />
                </div>
                <div className="detail-footer"><i className="fa-solid fa-clock"></i> {new Date(selected.created_at).toLocaleString('zh-CN')}</div>
              </div>
            ) : (
              <div className="empty-detail"><i className="fa-solid fa-hand-pointer"></i><p>点击左侧订单查看详情</p></div>
            )}

            {/* ── 右侧子网格 ── */}
            <div className="right-panel">

            {/* ── 列3：公司 + 股东完整信息 ── */}
            <div className="docs-panel auto-height col-info">
              <div className="docs-panel-header">
                <i className="fa-solid fa-building"></i>
                <span>申请详情</span>
              </div>
              {selected ? (
                <div className="info-panel-body">

                  {/* 公司基本信息 */}
                  <div className="info-section-label">公司信息</div>
                  <div className="info-card">
                    <div className="info-company-name">{selected.company_name}</div>
                    <div className="info-row"><span>套餐</span><strong>{selected.plan?.toUpperCase()||'—'}</strong></div>
                    <div className="info-row"><span>SSIC</span><strong>{selected.ssic_code||'—'}</strong></div>
                    <div className="info-row"><span>地址类型</span><strong>{selected.address_type==='virtual'?'虚拟办公室':'自有地址'}</strong></div>
                    <div className="info-row"><span>状态</span>
                      <strong style={{color:STATUS_LABELS[selected.status]?.color}}>
                        {STATUS_LABELS[selected.status]?.label}
                      </strong>
                    </div>
                    <div className="info-row"><span>提交时间</span><strong>{new Date(selected.created_at).toLocaleDateString('zh-CN')}</strong></div>
                  </div>

                  {/* 股东/董事详情 */}
                  {selected.shareholders?.length > 0 && (
                    <>
                      <div className="info-section-label">股东 / 董事</div>
                      {selected.shareholders.map((sh, i) => (
                        <div key={i} className="info-card sh-card">
                          <div className="sh-card-avatar">{sh.name.charAt(0).toUpperCase()}</div>
                          <div className="sh-card-body">
                            <div className="sh-card-name">{sh.name}</div>
                            {sh.idNumber && <div className="info-row"><span>证件号</span><strong>{sh.idNumber}</strong></div>}
                            {sh.email    && <div className="info-row"><span>邮箱</span>
                              <a href={`mailto:${sh.email}`} className="info-email-link">{sh.email}</a>
                            </div>}
                            {sh.docName  && <div className="info-row"><span>证件</span><strong className="info-doc-name">{sh.docName}</strong></div>}
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                </div>
              ) : (
                <div className="docs-panel-empty">请选择订单</div>
              )}
            </div>

            {/* ── 列4：证件文件库 ── */}
            <div className="docs-panel auto-height col-docs">
              <div className="docs-panel-header">
                <i className="fa-solid fa-folder-open"></i>
                <span>证件文件</span>
                <span className="docs-count">{docs.length}</span>
                <button className="docs-refresh-btn" onClick={fetchDocs}><i className="fa-solid fa-rotate"></i></button>
              </div>
              <div className="docs-panel-body">
                {docsLoading ? (
                  <div className="docs-panel-loading"><i className="fa-solid fa-circle-notch fa-spin"></i></div>
                ) : docs.length === 0 ? (
                  <div className="docs-panel-empty">暂无文件</div>
                ) : (
                  Object.entries(docGroups).map(([company, files]) => (
                    <div key={company} className="docs-panel-group">
                      <div className="docs-panel-company"><i className="fa-solid fa-building"></i> {company}</div>
                      {files.map((doc, i) => (
                        <div key={i} className="docs-panel-file">
                          <div className="docs-panel-filename" title={doc.name}>{doc.name}</div>
                          <div className="docs-panel-actions">
                            <button className="doc-icon-btn" title="预览" onClick={() => previewDocInline(doc.path)}><i className="fa-solid fa-eye"></i></button>
                            <button className="doc-icon-btn dl" title="下载" onClick={() => downloadDoc(doc.path, doc.name)}><i className="fa-solid fa-download"></i></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── 证件预览（跨两列，紧顶在上方两列下方）── */}
            {(inlinePreviewLoading || inlinePreviewUrl) && (
              <div className="col-preview">
                <div className="inline-preview-box" style={{margin:0}}>
                  <div className="inline-preview-toolbar">
                    <span><i className="fa-solid fa-shield-halved"></i> 证件预览</span>
                    <div style={{display:'flex', gap:8}}>
                      {inlinePreviewUrl && <a href={inlinePreviewUrl} target="_blank" rel="noreferrer" className="inline-preview-link">新窗口打开</a>}
                      <button className="inline-preview-close" onClick={() => setInlinePreviewUrl('')}>✕</button>
                    </div>
                  </div>
                  {inlinePreviewLoading
                    ? <div className="inline-preview-loading"><i className="fa-solid fa-circle-notch fa-spin"></i></div>
                    : <img src={inlinePreviewUrl} alt="证件" className="inline-preview-img" />}
                </div>
              </div>
            )}

            </div>{/* end right-panel */}

          </div>
        )}
      </main>
    </div>
    </>
  );
}
