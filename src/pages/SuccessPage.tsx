import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '../lib/LanguageContext';
import t from '../lib/translations';
import './SuccessPage.css';

export default function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { lang } = useLang();
  const _ = (o: { zh: string; en: string }) => o[lang];

  const steps = t.success.steps[lang];

  return (
    <div className="success-page">
      <div className="success-card glass-panel">
        <div className="success-icon">
          <i className="fa-solid fa-circle-check"></i>
        </div>
        <h1>{_(t.success.title)}</h1>
        <p className="success-sub">{_(t.success.subtitle)}</p>

        <div className="next-steps">
          <h3>{_(t.success.nextTitle)}</h3>
          <div className="step-list">
            <div className="ns-item done">
              <i className="fa-solid fa-check"></i>
              <span>{steps[0]}</span>
            </div>
            <div className="ns-item active">
              <i className="fa-regular fa-circle-dot"></i>
              <span>{steps[1]}</span>
            </div>
            <div className="ns-item">
              <i className="fa-regular fa-circle"></i>
              <span>{steps[2]}</span>
            </div>
            <div className="ns-item">
              <i className="fa-regular fa-circle"></i>
              <span>{steps[3]}</span>
            </div>
          </div>
        </div>

        {sessionId && (
          <div className="session-ref">
            <i className="fa-solid fa-receipt"></i> {_(t.success.orderRef)}<code>{sessionId.slice(-12).toUpperCase()}</code>
          </div>
        )}

        <div className="success-actions">
          <a
            className="primary-btn"
            href="https://wa.me/6500000000?text=您好，我已完成注册申请，订单参考号："
            target="_blank"
            rel="noreferrer"
            style={{textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}}
          >
            <i className="fa-brands fa-whatsapp"></i> {_(t.success.whatsapp)}
          </a>
          <button className="secondary-btn" onClick={() => navigate('/')}>
            {_(t.success.backHome)}
          </button>
        </div>
      </div>
    </div>
  );
}
