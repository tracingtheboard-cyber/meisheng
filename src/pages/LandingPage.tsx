import { Link } from 'react-router-dom';
import { useLang } from '../lib/LanguageContext';
import t from '../lib/translations';
import './LandingPage.css';

export default function LandingPage() {
  const { lang, toggleLang } = useLang();
  const _ = (o: { zh: string; en: string }) => o[lang];

  const plans = t.pricing.plans[lang];
  const steps = t.how.steps[lang];

  return (
    <div className="landing-page">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="nav-inner">
          <div className="landing-logo">
            <img src="/logo.png" alt="美生集团" className="logo-img" />
            <div className="logo-brand">
              <span className="logo-en">Meisheng</span>
              <span className="logo-zh">美生集团</span>
            </div>
          </div>
          <div className="nav-links">
            <a href="#features">{_(t.nav.features)}</a>
            <a href="#pricing">{_(t.nav.pricing)}</a>
            <a href="#how">{_(t.nav.how)}</a>
          </div>
          <div className="nav-cta">
            <Link to="/dashboard" className="nav-login">{_(t.nav.login)}</Link>
            <button className="lang-toggle-btn" onClick={toggleLang}>{_(t.nav.langToggle)}</button>
            <Link to="/register" className="nav-btn">{_(t.nav.getStarted)}</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">{_(t.hero.badge)}</div>
        <h1 className="hero-title">
          {_(t.hero.title1)}<br />
          <span className="gradient-text">{_(t.hero.title2)}</span>
        </h1>
        <p className="hero-desc">
          {_(t.hero.desc).split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
        </p>
        <div className="hero-actions">
          <Link to="/register" className="hero-btn-primary">
            {_(t.hero.cta)} <i className="fa-solid fa-arrow-right"></i>
          </Link>
          <a href="#how" className="hero-btn-secondary">
            <i className="fa-solid fa-play"></i> {_(t.hero.learnMore)}
          </a>
        </div>
        <div className="hero-social-proof">
          <div className="proof-avatars">
            {[12, 22, 36, 47, 56].map(id => (
              <img key={id} src={`https://i.pravatar.cc/40?img=${id}`} alt="customer" />
            ))}
          </div>
          <span dangerouslySetInnerHTML={{ __html: _(t.hero.proof) }} />
        </div>

        {/* Floating UI preview */}
        <div className="hero-preview">
          <div className="preview-card glass">
            <div className="preview-header">
              <div className="preview-dots"><span></span><span></span><span></span></div>
              <span className="preview-title">ACRA Name Check</span>
            </div>
            <div className="preview-input">
              <span>Meisheng Tech Pte. Ltd.</span>
              <span className="preview-badge available">✓ Available</span>
            </div>
            <div className="preview-steps">
              <div className="preview-step done"><i className="fa-solid fa-check"></i> Name Approved</div>
              <div className="preview-step done"><i className="fa-solid fa-check"></i> Docs Generated</div>
              <div className="preview-step active"><i className="fa-regular fa-circle-dot"></i> e-Signature Sent</div>
              <div className="preview-step"><i className="fa-regular fa-circle"></i> Filed to ACRA</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section" id="features">
        <div className="section-label">{_(t.features.label)}</div>
        <h2>{_(t.features.title)}</h2>
        <div className="features-grid">
          {t.features.items[lang].map(f => (
            <div key={f.title} className="feature-card glass">
              <div className="feature-icon">
                <i className={`fa-solid ${f.icon}`}></i>
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Logos */}
      <section className="logos-strip">
        <span>{_(t.logos.title)}</span>
        <div className="logo-row">
          {t.logos.items[lang].map(l => (
            <span key={l} className="logo-pill">{l}</span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="how-section" id="how">
        <div className="section-label">{_(t.how.label)}</div>
        <h2>{_(t.how.title).split('\n').map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}</h2>
        <div className="steps-grid">
          {steps.map(s => (
            <div key={s.num} className="how-card glass">
              <div className="how-num">{s.num}</div>
              <div className="how-icon"><i className={`fa-solid ${['fa-search','fa-users','fa-file-signature','fa-building-circle-check'][Number(s.num)-1]}`}></i></div>
              <h3>{s.title} <span className="how-sub">{s.sub}</span></h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing-section" id="pricing">
        <div className="section-label">{_(t.pricing.label)}</div>
        <h2>{_(t.pricing.title)}</h2>
        <p className="pricing-sub">{_(t.pricing.subtitle)}</p>
        <div className="pricing-grid three-col">
          {plans.map((plan, idx) => (
            <div key={plan.name} className={`price-card glass${idx === 1 ? ' featured' : ''}`}>
              {idx === 1 && <div className="featured-badge">{_(t.pricing.popular)}</div>}
              <h3>{plan.name} <span className="plan-en">{plan.en}</span></h3>
              <div className="price-tag">{plan.price} <span>{_(t.pricing.perYear)}</span></div>
              <div className="price-compare">{_(t.pricing.market)} {plan.market}</div>
              <ul>
                {plan.features.map(f => (
                  <li key={f}><i className={`fa-solid fa-check${idx === 1 ? ' accent' : ''}`}></i> {f}</li>
                ))}
                {plan.disabled.map(f => (
                  <li key={f} className="muted"><i className="fa-solid fa-minus"></i> {f}</li>
                ))}
              </ul>
              <Link to={`/register?plan=${['starter','growth','pro'][idx]}`} className={`price-btn${idx === 1 ? ' accent-btn' : ''}`}>
                {_(t.pricing.cta)}
              </Link>
            </div>
          ))}
        </div>
        <div className="pricing-note">
          <i className="fa-solid fa-circle-info"></i>
          {_(t.pricing.note)}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>{_(t.cta.title)}</h2>
        <p>{_(t.cta.desc)}<br /><span style={{color: 'var(--text-secondary)', fontSize: '14px'}}>{_(t.cta.sub)}</span></p>
        <Link to="/register" className="hero-btn-primary">
          {_(t.cta.btn)} <i className="fa-solid fa-arrow-right"></i>
        </Link>
      </section>

      <footer className="landing-footer">
        <div className="landing-logo">
          <div className="logo-icon"><i className="fa-solid fa-gem"></i></div>
          <span>Meisheng</span>
        </div>
        <p>{_(t.footer.copy)}</p>
      </footer>
    </div>
  );
}
