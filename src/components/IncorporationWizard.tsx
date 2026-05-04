import { useState } from 'react';
import { useLang } from '../lib/LanguageContext';
import './IncorporationWizard.css';

interface WizardProps { onClose: () => void; }

const API_BASE = import.meta.env.VITE_API_URL || 'https://meisheng-production.up.railway.app';

interface NameCheckResult {
  available: boolean | null;
  reason: 'clear' | 'similar_exists' | 'taken' | 'restricted' | 'unavailable';
  message: string;
  messageEn: string;
  similar?: string[];
}

export default function IncorporationWizard({ onClose }: WizardProps) {
  const { lang } = useLang();
  const _ = (zh: string, en: string) => lang === 'zh' ? zh : en;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [nameResult, setNameResult] = useState<NameCheckResult | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    ssicCode: '',
    addressType: 'virtual',
    directors: [] as string[],
  });

  // 真实 ACRA 核名
  const handleNameCheck = async () => {
    if (!formData.companyName.trim()) return;
    setLoading(true);
    setNameResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/check-name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.companyName.trim() }),
      });
      const data: NameCheckResult = await res.json();
      setNameResult(data);
    } catch {
      setNameResult({
        available: null,
        reason: 'unavailable',
        message: '网络错误，请稍后重试',
        messageEn: 'Network error, please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = lang === 'zh'
    ? ['公司核名', '公司详情', '股东配置', '确认支付']
    : ['Name Check', 'Details', 'Stakeholders', 'Review'];

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  // Step 1 进入下一步条件：名称未被拒绝（可用或暂时无法判断）
  const canProceedStep1 = nameResult !== null && nameResult.available !== false;

  return (
    <div className="wizard-overlay">
      <div className="wizard-modal glass-panel">
        <div className="wizard-header">
          <div>
            <h2>{_('开始公司注册', 'Start Your Company Incorporation')}</h2>
            <p className="wizard-subtitle">{_('四步完成新加坡公司注册', '4 simple steps to launch your business in Singapore')}</p>
          </div>
          <button className="wizard-close" onClick={onClose}><i className="fa-solid fa-times"></i></button>
        </div>

        <div className="wizard-progress">
          {[1,2,3,4].map(num => (
            <div key={num} className={`progress-step ${step >= num ? 'active' : ''} ${step > num ? 'completed' : ''}`}>
              <div className="step-circle">{step > num ? <i className="fa-solid fa-check"></i> : num}</div>
              <span className="step-label">{stepLabels[num-1]}</span>
            </div>
          ))}
        </div>

        <div className="wizard-body">

          {/* STEP 1: ACRA Name Check */}
          {step === 1 && (
            <div className="step-content slide-in">
              <h3>{_('您的公司叫什么名字？', 'What will your company be called?')}</h3>
              <p className="step-desc">
                {_('我们将实时查询 ACRA 数据库，验证名称是否可用。', 'We will instantly query the ACRA database to verify name availability.')}
              </p>

              <div className="input-group">
                <div className="search-wrapper">
                  <input
                    type="text"
                    placeholder={_('例如：Meisheng Tech Pte. Ltd.', 'e.g. Meisheng Tech Pte. Ltd.')}
                    value={formData.companyName}
                    onChange={(e) => {
                      setFormData({ ...formData, companyName: e.target.value });
                      setNameResult(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameCheck()}
                  />
                  <button
                    className="check-btn"
                    onClick={handleNameCheck}
                    disabled={loading || !formData.companyName.trim()}
                  >
                    {loading
                      ? <><i className="fa-solid fa-circle-notch fa-spin"></i> {_('查询中…', 'Checking…')}</>
                      : <><i className="fa-solid fa-magnifying-glass"></i> {_('核名', 'Check')}</>
                    }
                  </button>
                </div>

                {/* 核名结果 */}
                {nameResult && (
                  <div className={`status-msg ${
                    nameResult.available === true ? 'success' :
                    nameResult.available === false ? 'error' : 'warning'
                  }`}>
                    <i className={`fa-solid ${
                      nameResult.available === true ? 'fa-circle-check' :
                      nameResult.available === false ? 'fa-circle-xmark' : 'fa-triangle-exclamation'
                    }`}></i>
                    <span>{lang === 'zh' ? nameResult.message : nameResult.messageEn}</span>

                    {/* 相似已注册名称 */}
                    {nameResult.similar && nameResult.similar.length > 0 && (
                      <div className="similar-names">
                        <p className="similar-label">{_('相似已注册名称：', 'Similar registered names:')}</p>
                        {nameResult.similar.map((n, i) => (
                          <span key={i} className="similar-tag">{n}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <p className="name-hint">
                  <i className="fa-solid fa-circle-info"></i>{' '}
                  {_('提示：新加坡公司名必须以 "Pte. Ltd." 结尾，最终以 ACRA 审核结果为准。', 'Note: Singapore companies must end with "Pte. Ltd." Final approval is subject to ACRA review.')}
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Company Details */}
          {step === 2 && (
            <div className="step-content slide-in">
              <h3>{_('公司详情', 'Company Details')}</h3>
              <p className="step-desc">{_('设定公司的主要经营范围和注册地址。', "Let's define what your company does and where it's located.")}</p>

              <div className="form-group">
                <label>{_('主要经营活动（SSIC 代码）', 'Principal Activity (SSIC Code)')}</label>
                <select
                  value={formData.ssicCode}
                  onChange={(e) => setFormData({...formData, ssicCode: e.target.value})}
                >
                  <option value="">{_('选择经营范围…', 'Select an activity...')}</option>
                  <option value="62011">62011 - {_('软件开发', 'Software Development')}</option>
                  <option value="70221">70221 - {_('管理咨询', 'Management Consultancy')}</option>
                  <option value="46900">46900 - {_('综合贸易批发', 'General Wholesale Trade')}</option>
                  <option value="74909">74909 - {_('其他专业服务', 'Other Professional Services')}</option>
                  <option value="56101">56101 - {_('餐馆', 'Restaurant')}</option>
                  <option value="47910">47910 - {_('电商零售', 'E-commerce Retail')}</option>
                </select>
              </div>

              <div className="form-group">
                <label>{_('注册地址', 'Registered Office Address')}</label>
                <div className="radio-cards">
                  <div
                    className={`radio-card ${formData.addressType === 'virtual' ? 'selected' : ''}`}
                    onClick={() => setFormData({...formData, addressType: 'virtual'})}
                  >
                    <div className="radio-icon"><i className="fa-solid fa-building"></i></div>
                    <div className="radio-info">
                      <h4>{_('CBD 虚拟办公地址（推荐）', 'Virtual Office (Premium)')}</h4>
                      <p>{_('+$299/年，使用乌节路 CBD 地址', '+$299/year. Get a prestigious CBD address.')}</p>
                    </div>
                  </div>
                  <div
                    className={`radio-card ${formData.addressType === 'own' ? 'selected' : ''}`}
                    onClick={() => setFormData({...formData, addressType: 'own'})}
                  >
                    <div className="radio-icon"><i className="fa-solid fa-house"></i></div>
                    <div className="radio-info">
                      <h4>{_('使用自有地址', 'Provide my own address')}</h4>
                      <p>{_('使用您自己的住宅或商业地址', 'Use your own residential or commercial address.')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Stakeholders */}
          {step === 3 && (
            <div className="step-content slide-in">
              <h3>{_('股东与董事', 'Stakeholders')}</h3>
              <p className="step-desc">{_('新加坡要求至少 1 名本地居民董事。', 'Singapore requires at least 1 local resident director.')}</p>

              <div className="stakeholder-box">
                <div className="box-header">
                  <h4><i className="fa-solid fa-user-tie"></i> {_('董事', 'Directors')}</h4>
                  <button className="add-btn"><i className="fa-solid fa-plus"></i> {_('通过 Singpass 添加', 'Add via Singpass')}</button>
                </div>
                {formData.directors.length === 0 ? (
                  <div className="empty-state">
                    <p>{_('暂无董事，请点击上方添加。', 'No directors added yet.')}</p>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* STEP 4: Review & Payment */}
          {step === 4 && (
            <div className="step-content slide-in">
              <h3>{_('确认 & 支付', 'Review & Checkout')}</h3>
              <p className="step-desc">{_('确认您的注册套餐并完成支付。', 'Review your incorporation package and complete the payment.')}</p>

              <div className="receipt-box">
                <div className="receipt-row">
                  <span>{_('ACRA 政府注册费', 'ACRA Incorporation Fee')}</span>
                  <span>$315.00</span>
                </div>
                <div className="receipt-row">
                  <span>{_('美生服务费', 'Meisheng Service Fee')}</span>
                  <span>$250.00</span>
                </div>
                {formData.addressType === 'virtual' && (
                  <div className="receipt-row">
                    <span>{_('CBD 虚拟办公地址（1年）', 'Virtual Office (1 Year)')}</span>
                    <span>$299.00</span>
                  </div>
                )}
                <div className="receipt-total">
                  <span>{_('合计', 'Total Due')}</span>
                  <span className="text-accent">${formData.addressType === 'virtual' ? '864.00' : '565.00'} SGD</span>
                </div>
              </div>

              <div className="stripe-mock">
                <i className="fa-brands fa-stripe"></i> {_('安全支付', 'Secured Checkout')}
              </div>
            </div>
          )}
        </div>

        <div className="wizard-footer">
          <button
            className="secondary-btn"
            onClick={prevStep}
            disabled={step === 1}
          >
            <i className="fa-solid fa-arrow-left"></i> {_('上一步', 'Back')}
          </button>

          <button
            className="primary-btn"
            onClick={nextStep}
            disabled={
              (step === 1 && !canProceedStep1) ||
              (step === 2 && !formData.ssicCode)
            }
          >
            {step === 4
              ? <>{_('支付 & 提交', 'Pay & Submit')} <i className="fa-solid fa-lock"></i></>
              : <>{_('继续', 'Continue')} <i className="fa-solid fa-arrow-right"></i></>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
