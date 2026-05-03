import { useState } from 'react';
import { useLang } from '../lib/LanguageContext';
import './IncorporationWizard.css';

interface WizardProps { onClose: () => void; }

export default function IncorporationWizard({ onClose }: WizardProps) {
  const { lang } = useLang();
  const _ = (zh: string, en: string) => lang === 'zh' ? zh : en;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({ companyName: '', ssicCode: '', addressType: 'virtual', directors: [] as string[] });

  const handleNameCheck = () => {
    if (!formData.companyName) return;
    setLoading(true);
    setTimeout(() => {
      setNameAvailable(!formData.companyName.toLowerCase().includes('bank'));
      setLoading(false);
    }, 1500);
  };

  const stepLabels = lang === 'zh'
    ? ['公司核名', '公司详情', '股东配置', '确认支付']
    : ['Name Check', 'Details', 'Stakeholders', 'Review'];

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

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
          {/* STEP 1: Name Check */}
          {step === 1 && (
            <div className="step-content slide-in">
              <h3>What will your company be called?</h3>
              <p className="step-desc">We will instantly check ACRA database for name availability.</p>
              
              <div className="input-group">
                <div className="search-wrapper">
                  <input 
                    type="text" 
                    placeholder="e.g. Meisheng Tech Pte. Ltd." 
                    value={formData.companyName}
                    onChange={(e) => {
                      setFormData({...formData, companyName: e.target.value});
                      setNameAvailable(null);
                    }}
                  />
                  <button 
                    className="check-btn" 
                    onClick={handleNameCheck}
                    disabled={loading || !formData.companyName}
                  >
                    {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Check Name'}
                  </button>
                </div>
                
                {nameAvailable === true && (
                  <div className="status-msg success">
                    <i className="fa-solid fa-check-circle"></i> Awesome! "{formData.companyName}" is available.
                  </div>
                )}
                {nameAvailable === false && (
                  <div className="status-msg error">
                    <i className="fa-solid fa-circle-exclamation"></i> Sorry, this name is either taken or requires special approval.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Company Details */}
          {step === 2 && (
            <div className="step-content slide-in">
              <h3>Company Details</h3>
              <p className="step-desc">Let's define what your company does and where it's located.</p>
              
              <div className="form-group">
                <label>Principal Activity (SSIC Code)</label>
                <select 
                  value={formData.ssicCode} 
                  onChange={(e) => setFormData({...formData, ssicCode: e.target.value})}
                >
                  <option value="">Select an activity...</option>
                  <option value="62011">62011 - Software Development</option>
                  <option value="70221">70221 - Management Consultancy</option>
                  <option value="46900">46900 - General Wholesale Trade</option>
                </select>
              </div>

              <div className="form-group">
                <label>Registered Office Address</label>
                <div className="radio-cards">
                  <div 
                    className={`radio-card ${formData.addressType === 'virtual' ? 'selected' : ''}`}
                    onClick={() => setFormData({...formData, addressType: 'virtual'})}
                  >
                    <div className="radio-icon"><i className="fa-solid fa-building"></i></div>
                    <div className="radio-info">
                      <h4>Virtual Office (Premium)</h4>
                      <p>+$299/year. Get a prestigious CBD address.</p>
                    </div>
                  </div>
                  <div 
                    className={`radio-card ${formData.addressType === 'own' ? 'selected' : ''}`}
                    onClick={() => setFormData({...formData, addressType: 'own'})}
                  >
                    <div className="radio-icon"><i className="fa-solid fa-house"></i></div>
                    <div className="radio-info">
                      <h4>Provide my own address</h4>
                      <p>Use your own residential or commercial address.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Stakeholders */}
          {step === 3 && (
            <div className="step-content slide-in">
              <h3>Stakeholders</h3>
              <p className="step-desc">Singapore requires at least 1 local resident director.</p>
              
              <div className="stakeholder-box">
                <div className="box-header">
                  <h4><i className="fa-solid fa-user-tie"></i> Directors</h4>
                  <button className="add-btn"><i className="fa-solid fa-plus"></i> Add via Singpass</button>
                </div>
                {formData.directors.length === 0 ? (
                  <div className="empty-state">
                    <p>No directors added yet.</p>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* STEP 4: Review & Payment */}
          {step === 4 && (
            <div className="step-content slide-in">
              <h3>Review & Checkout</h3>
              <p className="step-desc">Review your incorporation package and complete the payment.</p>
              
              <div className="receipt-box">
                <div className="receipt-row">
                  <span>ACRA Incorporation Fee</span>
                  <span>$315.00</span>
                </div>
                <div className="receipt-row">
                  <span>Meisheng Service Fee</span>
                  <span>$250.00</span>
                </div>
                {formData.addressType === 'virtual' && (
                  <div className="receipt-row">
                    <span>Virtual Office (1 Year)</span>
                    <span>$299.00</span>
                  </div>
                )}
                <div className="receipt-total">
                  <span>Total Due</span>
                  <span className="text-accent">${formData.addressType === 'virtual' ? '864.00' : '565.00'}</span>
                </div>
              </div>

              <div className="stripe-mock">
                <i className="fa-brands fa-stripe"></i> Secured Checkout
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
            Back
          </button>
          
          <button 
            className="primary-btn" 
            onClick={nextStep}
            disabled={(step === 1 && nameAvailable !== true) || (step === 2 && !formData.ssicCode)}
          >
            {step === 4 ? 'Pay & Submit' : 'Continue'} <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
