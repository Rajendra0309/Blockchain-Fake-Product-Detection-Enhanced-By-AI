import React, { useEffect, useRef, useState } from 'react'
import { getWeb3, getProductContract } from '../lib/web3'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { parseQrText } from '../lib/qr'
import { Page, SectionCard } from '../components/Page'

export default function VerifyProduct() {
  const [web3, setWeb3] = useState(null)
  const [product, setProduct] = useState(null)
  const [account, setAccount] = useState('')
  const [form, setForm] = useState({ productSN: '', consumerCode: '' })
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState('')
  const [scanMode, setScanMode] = useState('camera')
  const dropRef = useRef(null)
  const scannerRef = useRef(null)

  useEffect(() => {
    (async () => {
      const w3 = await getWeb3()
      setWeb3(w3)
      const accounts = await w3.eth.getAccounts()
      setAccount(accounts[0] || '')
      const c = await getProductContract(w3)
      setProduct(c)
    })()
  }, [])

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  async function onSubmit(e) {
    e.preventDefault()
    if (!product || !web3) return
    setStatus('Verifying...')
    try {
      const ok = await product.methods.verifyProduct(
        web3.utils.asciiToHex(form.productSN),
        web3.utils.asciiToHex(form.consumerCode)
      ).call({ from: account })
      setResult(!!ok)
      setStatus('Done')
    } catch (err) {
      console.error(err)
      setStatus('Error: ' + (err?.message || err))
    }
  }

  const parseQrPayload = parseQrText

  useEffect(() => {
    if (scanMode !== 'camera') return
    const id = 'qr-reader'
    const scanner = new Html5QrcodeScanner(id, { fps: 10, qrbox: 250 }, false)
    scannerRef.current = scanner
    scanner.render(
      (decodedText) => {
        const sn = parseQrPayload(decodedText)
        setForm(f => ({ ...f, productSN: sn }))
        setStatus('QR detected')
      },
      () => { }
    )
    return () => {
      try { scanner.clear() } catch { }
    }
  }, [scanMode])

  return (
    <Page title="Verify Product" description="Scan a product QR code or enter details manually to validate authenticity against the blockchain record.">
      <div className="row g-4">
        <div className="col-lg-8">
          <SectionCard title="Product Verification" variant="highlight">

            <div className="mb-4">
              <label className="form-label fw-semibold mb-3" style={{ color: 'black' }}>
                Verification Method
              </label>
              <div className="btn-group w-100" role="group">
                <button
                  type="button"
                  className={`btn ${scanMode === 'camera' ? 'btn-primary' : 'btn-outline-primary'} d-flex align-items-center justify-content-center`}
                  onClick={() => setScanMode('camera')}
                  style={{ color: scanMode === 'camera' ? 'white' : 'black' }}
                >
                  Camera Scan
                </button>
                <button
                  type="button"
                  className={`btn ${scanMode === 'paste' ? 'btn-primary' : 'btn-outline-primary'} d-flex align-items-center justify-content-center`}
                  onClick={() => setScanMode('paste')}
                  style={{ color: scanMode === 'paste' ? 'white' : 'black' }}
                >
                  Paste Code
                </button>
              </div>
            </div>

            {scanMode === 'camera' && (
              <div className="scanner-container mb-4">
                <div className="scanner-wrapper">
                  <div id="qr-reader" />
                </div>
                <p className="text-center text-muted mt-3" style={{ color: 'black' }}>

                  Point your camera at the QR code to scan automatically
                </p>
              </div>
            )}

            {scanMode === 'paste' && (
              <div className="mb-4">
                <label className="form-label fw-semibold" style={{ color: 'black' }}>
                  QR Code Text/JSON
                </label>
                <textarea
                  className="form-control form-control-lg"
                  rows={4}
                  placeholder="Paste the QR code content here..."
                  style={{ color: 'black' }}
                  onChange={e => {
                    const sn = parseQrPayload(e.target.value)
                    setForm(f => ({ ...f, productSN: sn }))
                  }}
                />
              </div>
            )}

            <form className="row gy-4" onSubmit={onSubmit}>
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Product Serial Number
                </label>
                <input
                  name="productSN"
                  className="form-control form-control-lg"
                  value={form.productSN}
                  onChange={onChange}
                  placeholder="Enter or scan product SN"
                  required
                />
                <div className="form-text">
                  <span className="me-1">💡</span>
                  This field auto-fills when you scan a QR code
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Consumer Code
                </label>
                <input
                  name="consumerCode"
                  className="form-control form-control-lg"
                  value={form.consumerCode}
                  onChange={onChange}
                  placeholder="Enter your consumer code"
                  required
                />
                <div className="form-text">
                  Your unique identifier for verification
                </div>
              </div>
              <div className="col-12">
                <button
                  className="btn btn-primary btn-lg px-4"
                  disabled={!product || !account}
                >
                  Verify Authenticity
                </button>
              </div>
            </form>

            {status && status !== 'Done' && (
              <div className={`alert mt-4 ${status.includes('Error') ? 'alert-danger' : 'alert-info'}`}>
                <div className="d-flex align-items-center">
                  <span className="me-2">{status.includes('Error') ? '⚠️' : 'ℹ️'}</span>
                  {status}
                </div>
              </div>
            )}

            {account && (
              <div className="mt-3 p-3 bg-light rounded">
                <small className="text-muted">
                  <strong>Connected Account:</strong> {account}
                </small>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="col-lg-4">
          <SectionCard title="Verification Guide" variant="default">
            <div className="verification-steps">
              <div className="verification-step">
                <div className="step-icon">📱</div>
                <div>
                  <h6>Scan QR Code</h6>
                  <p className="small text-muted">Use your camera to scan the product's QR code</p>
                </div>
              </div>
              <div className="verification-step">
                <div className="step-icon">👤</div>
                <div>
                  <h6>Enter Consumer Code</h6>
                  <p className="small text-muted">Provide your unique consumer identifier</p>
                </div>
              </div>
              <div className="verification-step">
                <div className="step-icon">🔐</div>
                <div>
                  <h6>Blockchain Verification</h6>
                  <p className="small text-muted">System checks authenticity against blockchain records</p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      {result !== null && (
        <SectionCard variant="highlight">
          <div className="verification-result">
            <div className={`result-card ${result ? 'genuine' : 'fake'}`}>
              <div className="result-icon">
                {result ? '✅' : '❌'}
              </div>
              <div className="result-content">
                <h4 className="result-title">
                  {result ? 'Genuine Product Verified!' : 'Warning: Counterfeit Product Detected'}
                </h4>
                <p className="result-description">
                  {result
                    ? 'This product has been successfully verified against our blockchain records. It is an authentic product from an authorized manufacturer.'
                    : 'This product could not be verified in our blockchain records. It may be counterfeit or not properly registered. Please contact the manufacturer for assistance.'
                  }
                </p>
                {result && (
                  <div className="result-actions">
                    <button className="btn btn-outline-primary me-2">
                      <span className="me-2">📄</span>View Certificate
                    </button>
                    <button className="btn btn-outline-secondary">
                      <span className="me-2">📱</span>Share Result
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SectionCard>
      )}
    </Page>
  )
}
