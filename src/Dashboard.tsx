import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';
import IncorporationWizard from './components/IncorporationWizard';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [hasActiveCompany, setHasActiveCompany] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-container" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src="/logo.png" alt="美生集团" className="logo-img" style={{ height: '36px', width: 'auto' }} />
          <div className="logo-brand" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span className="logo-en" style={{ fontWeight: 700, fontSize: '15px' }}>Meisheng</span>
            <span className="logo-zh" style={{ fontSize: '11px', opacity: 0.7 }}>美生集团</span>
          </div>
        </div>

        <nav className="nav-menu">
          <div className="nav-section">
            <span className="section-title">MAIN MENU</span>
            <button className="nav-item active">
              <i className="fa-solid fa-chart-pie"></i>
              <span>Dashboard</span>
            </button>
            <button className="nav-item">
              <i className="fa-solid fa-building"></i>
              <span>Company Profile</span>
            </button>
            <button className="nav-item">
              <i className="fa-solid fa-file-signature"></i>
              <span>Resolutions & Signs</span>
              <span className="badge">3</span>
            </button>
          </div>

          <div className="nav-section">
            <span className="section-title">SERVICES</span>
            <button className="nav-item" onClick={() => setIsWizardOpen(true)}>
              <i className="fa-solid fa-rocket"></i>
              <span style={{ color: 'var(--accent-color)', fontWeight: 600 }}>Register Company</span>
            </button>
            <button className="nav-item">
              <i className="fa-solid fa-calculator"></i>
              <span>Accounting & Tax</span>
            </button>
            <button className="nav-item">
              <i className="fa-solid fa-users"></i>
              <span>HR & Payroll</span>
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <img src="https://i.pravatar.cc/150?img=11" alt="User" className="avatar" />
            <div className="user-info">
              <span className="user-name">Founder</span>
              <span className="user-role">Admin</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <div className="search-bar">
            <i className="fa-solid fa-search"></i>
            <input type="text" placeholder="Search companies, documents, invoices..." />
          </div>
          <div className="topbar-actions">
            <button className="icon-btn" onClick={() => setHasActiveCompany(!hasActiveCompany)} title="Toggle Demo State (Empty/Active)" style={{ color: hasActiveCompany ? '#00ff88' : '#888' }}>
              <i className={`fa-solid ${hasActiveCompany ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
            </button>
            <button className="icon-btn">
              <i className="fa-regular fa-bell"></i>
              <span className="notification-dot"></span>
            </button>
            <button className="primary-btn" onClick={() => setIsPanelOpen(true)}>
              <i className="fa-solid fa-plus"></i> New Request
            </button>
          </div>
        </header>

        <div className="content-area">
          <div className="page-header">
            <h2>Welcome back, <span className="highlight">Founder</span></h2>
            <p>Here's what's happening with your corporate entities today.</p>
          </div>

          {hasActiveCompany ? (
            <>
              <div className="stats-grid">
                <div className="stat-card glass-panel">
                  <div className="stat-icon" style={{ color: '#00ff88', background: 'rgba(0,255,136,0.1)' }}>
                    <i className="fa-solid fa-check-double"></i>
                  </div>
                  <div className="stat-details">
                    <h3>Active Entities</h3>
                    <p className="stat-number" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.6s cubic-bezier(0.4,0,0.2,1)' }}>2</p>
                  </div>
                </div>
                <div className="stat-card glass-panel">
                  <div className="stat-icon" style={{ color: '#ff3366', background: 'rgba(255,51,102,0.1)' }}>
                    <i className="fa-solid fa-signature"></i>
                  </div>
                  <div className="stat-details">
                    <h3>Pending Signatures</h3>
                    <p className="stat-number" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.6s cubic-bezier(0.4,0,0.2,1) 0.1s' }}>3</p>
                  </div>
                </div>
                <div className="stat-card glass-panel">
                  <div className="stat-icon" style={{ color: '#00ccff', background: 'rgba(0,204,255,0.1)' }}>
                    <i className="fa-solid fa-file-invoice-dollar"></i>
                  </div>
                  <div className="stat-details">
                    <h3>Unpaid Invoices</h3>
                    <p className="stat-number" style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.6s cubic-bezier(0.4,0,0.2,1) 0.2s' }}>$1,250</p>
                  </div>
                </div>
              </div>

              <div className="dashboard-sections">
                <div className="section-card glass-panel action-required">
                  <div className="card-header">
                    <h3><i className="fa-solid fa-bolt text-accent"></i> Action Required</h3>
                  </div>
                  <div className="action-list">
                    <div className="action-item">
                      <div className="action-info">
                        <h4>Director's Resolution in Writing</h4>
                        <p>Opening of corporate bank account - Needs 2 signatures</p>
                      </div>
                      <button className="action-btn">Sign Now</button>
                    </div>
                    <div className="action-item">
                      <div className="action-info">
                        <h4>Annual Return Filing</h4>
                        <p>Due in 15 days - Upload management accounts</p>
                      </div>
                      <button className="action-btn">Upload</button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state-container glass-panel" style={{ textAlign: 'center', padding: '80px 20px', marginTop: '20px', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.2)' }}>
              <div style={{ fontSize: '64px', color: 'rgba(255,255,255,0.2)', marginBottom: '20px' }}>
                <i className="fa-solid fa-folder-open"></i>
              </div>
              <h2 style={{ marginBottom: '12px', fontSize: '24px' }}>还没有注册任何公司</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', maxWidth: '400px', margin: '0 auto 30px', lineHeight: '1.6' }}>
                您当前没有任何活跃的公司记录。立即在新加坡开启您的商业征程，全程线上办理，最快 1 小时下证。
              </p>
              <button className="primary-btn" onClick={() => navigate('/register')} style={{ padding: '14px 28px', fontSize: '16px' }}>
                <i className="fa-solid fa-rocket"></i> 注册第一家公司
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Slide-over Panel */}
      <div className={`overlay ${isPanelOpen ? 'active' : ''}`} onClick={() => setIsPanelOpen(false)}></div>
      <div className={`slide-panel ${isPanelOpen ? 'active' : ''}`}>
        <div className="panel-header">
          <h3>Start a New Service Request</h3>
          <button className="close-btn" onClick={() => setIsPanelOpen(false)}><i className="fa-solid fa-times"></i></button>
        </div>
        <div className="panel-content">
          <p className="panel-desc">Select the type of request you want to initiate for your corporate entity.</p>
          <div className="service-category">
            <h4>Compliance & Secretary</h4>
            <div className="service-grid">
              <button className="service-btn">
                <i className="fa-solid fa-users text-accent"></i>
                <span>Change Directors</span>
              </button>
              <button className="service-btn">
                <i className="fa-solid fa-file-signature text-accent"></i>
                <span>Draft Resolution</span>
              </button>
            </div>
          </div>
          <div className="service-category">
            <h4>Accounting & Tax</h4>
            <div className="service-grid">
              <button className="service-btn">
                <i className="fa-solid fa-cloud-arrow-up" style={{ color: '#00ccff' }}></i>
                <span>Upload Invoices</span>
              </button>
            </div>
          </div>
          <div className="service-category">
            <h4>HR & Payroll</h4>
            <div className="service-grid">
              <button className="service-btn">
                <i className="fa-solid fa-user-plus" style={{ color: '#00ff88' }}></i>
                <span>New Employee</span>
              </button>
              <button className="service-btn">
                <i className="fa-solid fa-calculator" style={{ color: '#00ff88' }}></i>
                <span>Run Payroll</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isWizardOpen && <IncorporationWizard onClose={() => setIsWizardOpen(false)} />}
    </div>
  );
}
