import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  const features = [
    {
      icon: '📦',
      title: 'Add Product',
      description: 'Register a new product on the blockchain with auto-generated tamper-proof QR codes.',
      link: '/add-product',
      color: 'primary'
    },
    {
      icon: '🏪',
      title: 'Add Seller',
      description: 'Onboard authorized sellers and tie them to manufacturers for secure partnerships.',
      link: '/add-seller',
      color: 'success'
    },
    {
      icon: '🔄',
      title: 'Transfer Products',
      description: 'Record secure transfers from manufacturers to sellers and sellers to consumers.',
      link: '/sell-manu',
      color: 'info'
    },
    {
      icon: '🤖',
      title: 'AI Verify Product',
      description: 'Advanced verification combining blockchain and AI image analysis for fake detection.',
      link: '/ai-verify',
      color: 'danger',
      badge: 'NEW'
    },
    {
      icon: '✅',
      title: 'Verify Product',
      description: 'Check product authenticity by scanning QR codes and verify legitimacy instantly.',
      link: '/verify',
      color: 'warning'
    },
    {
      icon: '🔍',
      title: 'Query Products',
      description: 'Search and browse all registered products in the blockchain database.',
      link: '/query-products',
      color: 'secondary'
    },
    {
      icon: '📊',
      title: 'View History',
      description: 'Track complete transaction history and ownership transfers for transparency.',
      link: '/history',
      color: 'dark'
    }
  ];

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="container">
          <div className="row align-items-center min-vh-50">
            <div className="col-lg-6">
              <h1 className="hero-title">Welcome to <span className="brand-gradient">TrueTag.ai</span></h1>
              <p className="hero-description">
                End-to-end authenticity tracking powered by blockchain technology.
                Register products, onboard sellers, transfer ownership, and verify
                legitimacy with tamper-proof QR codes.
              </p>
              <div className="hero-actions" style={{ position: 'relative', zIndex: 10 }}>
                <Link
                  to="/add-product"
                  className="btn btn-primary btn-lg me-3"
                  style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                >
                  Get Started
                </Link>
                <Link
                  to="/verify"
                  className="btn btn-outline-primary btn-lg"
                  style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                >
                  Verify Product
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="hero-visual">
                <div className="floating-card">
                  <div className="qr-mockup">
                    <div className="qr-grid">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div key={i} className={`qr-dot ${Math.random() > 0.5 ? 'active' : ''}`}></div>
                      ))}
                    </div>
                  </div>
                  <p className="text-center mt-3 mb-0 small text-muted">Blockchain-Secured QR Code</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="section-title">Powerful Features</h2>
            <p className="section-description">Everything you need for complete product authenticity management</p>
          </div>

          <div className="row g-4">
            {features.map((feature, index) => (
              <div key={index} className="col-lg-4 col-md-6">
                <Link to={feature.link} className="text-decoration-none">
                  <div className="feature-card h-100">
                    <div className="feature-icon-wrapper">
                      <span className="feature-icon">{feature.icon}</span>
                      {feature.badge && (
                        <span className="badge bg-danger position-absolute top-0 end-0 m-2">{feature.badge}</span>
                      )}
                    </div>
                    <h5 className="feature-title">{feature.title}</h5>
                    <p className="feature-description">{feature.description}</p>
                    <div className="feature-arrow">
                      <span>→</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="stats-section">
        <div className="container">
          <div className="row text-center">
            <div className="col-md-4">
              <div className="stat-item">
                <h3 className="stat-number">100%</h3>
                <p className="stat-label">Secure & Tamper-Proof</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-item">
                <h3 className="stat-number">⚡</h3>
                <p className="stat-label">Instant Verification</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-item">
                <h3 className="stat-number">🔗</h3>
                <p className="stat-label">Blockchain Powered</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
