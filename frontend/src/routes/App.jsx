import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Link, Navigate } from 'react-router-dom'
import { Web3Provider } from '../hooks/useWeb3'
import { ToastProvider } from '../hooks/useToast'
import { ThemeProvider } from '../hooks/useTheme'
import { ErrorBoundary } from '../components/ErrorBoundary'
import Home from './Home.jsx'
import Dashboard from './Dashboard.jsx'
import AddProduct from './AddProduct.jsx'
import AddSeller from './AddSeller.jsx'
import SellFromManufacturer from './SellFromManufacturer.jsx'
import SellFromSeller from './SellFromSeller.jsx'
import QueryProducts from './QueryProducts.jsx'
import QuerySellers from './QuerySellers.jsx'
import VerifyProduct from './VerifyProduct.jsx'
import AIVerifyProduct from './AIVerifyProduct.jsx'
import ConsumerHistory from './ConsumerHistory.jsx'

function AppContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/add-product', label: 'Add Product', icon: '📦' },
    { path: '/add-seller', label: 'Add Seller', icon: '🏪' },
    { path: '/sell-manu', label: 'Manu → Seller', icon: '📤' },
    { path: '/sell-seller', label: 'Seller → Consumer', icon: '🛒' },
    { path: '/query-products', label: 'Products', icon: '🔍' },
    { path: '/query-sellers', label: 'Sellers', icon: '👥' },
    { path: '/verify', label: 'Verify', icon: '✅' },
    { path: '/ai-verify', label: 'AI Verify', icon: '🤖' },
    { path: '/history', label: 'History', icon: '📜' }
  ]

  return (
    <BrowserRouter>
      <nav className="navbar navbar-expand-lg navbar-light sticky-top">
        <div className="container">
          <Link to="/" className="navbar-brand fw-bold d-flex align-items-center">
            <span className="brand-icon me-2">🏷️</span>
            <span className="brand-text">TrueTag.ai</span>
          </Link>

          <button
            className="navbar-toggler border-0"
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`} id="nav">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              {menuItems.map((item) => (
                <li key={item.path} className="nav-item">
                  <NavLink
                    className="nav-link d-flex align-items-center"
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="nav-icon me-1">{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <ErrorBoundary showDetails={import.meta.env.DEV}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add-product" element={<AddProduct />} />
            <Route path="/add-seller" element={<AddSeller />} />
            <Route path="/sell-manu" element={<SellFromManufacturer />} />
            <Route path="/sell-seller" element={<SellFromSeller />} />
            <Route path="/query-products" element={<QueryProducts />} />
            <Route path="/query-sellers" element={<QuerySellers />} />
            <Route path="/verify" element={<VerifyProduct />} />
            <Route path="/ai-verify" element={<AIVerifyProduct />} />
            <Route path="/history" element={<ConsumerHistory />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Web3Provider>
          <AppContent />
        </Web3Provider>
      </ToastProvider>
    </ThemeProvider>
  )
}
