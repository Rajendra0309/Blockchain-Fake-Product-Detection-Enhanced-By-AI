import React, { useEffect, useRef, useState } from 'react'
import { getWeb3, getProductContract } from '../lib/web3'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { parseQrText } from '../lib/qr'
import { Page, SectionCard } from '../components/Page'

const AI_SERVER_URL = 'http://localhost:5000'

export default function AIVerifyProduct() {
  const [web3, setWeb3] = useState(null)
  const [product, setProduct] = useState(null)
  const [account, setAccount] = useState('')
  const [form, setForm] = useState({ productSN: '', consumerCode: '' })
  const [blockchainResult, setBlockchainResult] = useState(null)
  const [aiResult, setAiResult] = useState(null)
  const [status, setStatus] = useState('')
  const [scanMode, setScanMode] = useState('camera')
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [aiServerStatus, setAiServerStatus] = useState('checking')
  const [verificationStep, setVerificationStep] = useState(1)
  const scannerRef = useRef(null)
  const fileInputRef = useRef(null)

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

  useEffect(() => {
    checkAiServerStatus()
  }, [])

  const checkAiServerStatus = async () => {
    try {
      const response = await fetch(`${AI_SERVER_URL}/api/health`)
      const data = await response.json()
      if (data.status === 'healthy' && data.model_loaded) {
        setAiServerStatus('online')
      } else {
        setAiServerStatus('model_not_loaded')
      }
    } catch (error) {
      setAiServerStatus('offline')
    }
  }

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  async function verifyOnBlockchain(e) {
    e.preventDefault()
    if (!product || !web3) return
    setStatus('Verifying on blockchain...')
    try {
      const ok = await product.methods.verifyProduct(
        web3.utils.asciiToHex(form.productSN),
        web3.utils.asciiToHex(form.consumerCode)
      ).call({ from: account })

      setBlockchainResult({
        verified: !!ok,
        productSN: form.productSN,
        consumerCode: form.consumerCode
      })

      if (ok) {
        setStatus('✓ Blockchain verification successful! Now upload product image for AI verification.')
        setVerificationStep(2)
      } else {
        setStatus('✗ Blockchain verification failed. Product not found or not owned by this consumer.')
        setBlockchainResult({ verified: false })
      }
    } catch (err) {
      console.error(err)
      setStatus('Error: ' + (err?.message || err))
      setBlockchainResult({ verified: false, error: err.message })
    }
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const verifyWithAI = async () => {
    if (!selectedImage) {
      setStatus('Please select an image first')
      return
    }

    if (aiServerStatus !== 'online') {
      setStatus('AI server is not available. Please start the AI server.')
      return
    }

    setStatus('Analyzing product image with AI...')

    const formData = new FormData()
    formData.append('image', selectedImage)

    try {
      const response = await fetch(`${AI_SERVER_URL}/api/verify-image`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setAiResult(data)
        setVerificationStep(3)
        setStatus('AI verification complete!')
      } else {
        setStatus('AI verification failed: ' + (data.error || 'Unknown error'))
        setAiResult({ error: data.error })
      }
    } catch (error) {
      console.error('AI verification error:', error)
      setStatus('Error connecting to AI server: ' + error.message)
      setAiResult({ error: error.message })
    }
  }

  const resetVerification = () => {
    setForm({ productSN: '', consumerCode: '' })
    setBlockchainResult(null)
    setAiResult(null)
    setSelectedImage(null)
    setImagePreview(null)
    setVerificationStep(1)
    setStatus('')
  }

  const parseQrPayload = parseQrText

  useEffect(() => {
    if (scanMode !== 'camera' || verificationStep !== 1) return
    const id = 'qr-reader'
    const scanner = new Html5QrcodeScanner(id, { fps: 10, qrbox: 250 }, false)
    scannerRef.current = scanner
    scanner.render(
      (decodedText) => {
        const sn = parseQrPayload(decodedText)
        setForm(f => ({ ...f, productSN: sn }))
        setStatus('QR code detected!')
      },
      () => { }
    )
    return () => {
      try { scanner.clear() } catch { }
    }
  }, [scanMode, verificationStep])

  const getFinalVerdict = () => {
    if (!blockchainResult?.verified) {
      return { status: 'invalid', message: 'Product not verified on blockchain', color: 'danger' }
    }
    if (!aiResult?.success) {
      return { status: 'partial', message: 'Blockchain verified, AI check pending', color: 'warning' }
    }
    if (blockchainResult.verified && aiResult.is_genuine) {
      return { status: 'genuine', message: 'GENUINE PRODUCT - Both blockchain and AI verified', color: 'success' }
    }
    if (blockchainResult.verified && !aiResult.is_genuine) {
      return { status: 'suspicious', message: 'WARNING: Blockchain verified but AI detected potential fake', color: 'danger' }
    }
    return { status: 'unknown', message: 'Verification incomplete', color: 'secondary' }
  }

  const verdict = getFinalVerdict()

  return (
    <Page title="AI-Powered Product Verification" description="Verify product authenticity using blockchain and AI image analysis.">
      <div className="row g-4">
        <div className="col-12">
          <div className={`alert alert-${aiServerStatus === 'online' ? 'success' : 'warning'} d-flex align-items-center`}>
            <span className="me-2">
              {aiServerStatus === 'online' ? '🟢' : aiServerStatus === 'offline' ? '🔴' : '🟡'}
            </span>
            <div>
              <strong>AI Server Status:</strong>{' '}
              {aiServerStatus === 'online' && 'Online and ready'}
              {aiServerStatus === 'offline' && 'Offline - Please start the AI server (python ai-server/app.py)'}
              {aiServerStatus === 'model_not_loaded' && 'Model not loaded properly'}
              {aiServerStatus === 'checking' && 'Checking...'}
            </div>
            <button className="btn btn-sm btn-outline-dark ms-auto" onClick={checkAiServerStatus}>
              🔄 Refresh
            </button>
          </div>
        </div>

        <div className="col-12">
          <div className="d-flex justify-content-between mb-3">
            <div className={`text-center flex-fill ${verificationStep >= 1 ? 'text-primary fw-bold' : 'text-muted'}`}>
              <div className={`rounded-circle d-inline-flex align-items-center justify-content-center ${verificationStep >= 1 ? 'bg-primary text-white' : 'bg-light'}`} style={{ width: '40px', height: '40px' }}>1</div>
              <div className="small mt-1">Scan QR & Blockchain</div>
            </div>
            <div className="flex-fill" style={{ borderTop: '2px solid #dee2e6', marginTop: '20px' }}></div>
            <div className={`text-center flex-fill ${verificationStep >= 2 ? 'text-primary fw-bold' : 'text-muted'}`}>
              <div className={`rounded-circle d-inline-flex align-items-center justify-content-center ${verificationStep >= 2 ? 'bg-primary text-white' : 'bg-light'}`} style={{ width: '40px', height: '40px' }}>2</div>
              <div className="small mt-1">Upload Product Image</div>
            </div>
            <div className="flex-fill" style={{ borderTop: '2px solid #dee2e6', marginTop: '20px' }}></div>
            <div className={`text-center flex-fill ${verificationStep >= 3 ? 'text-primary fw-bold' : 'text-muted'}`}>
              <div className={`rounded-circle d-inline-flex align-items-center justify-content-center ${verificationStep >= 3 ? 'bg-primary text-white' : 'bg-light'}`} style={{ width: '40px', height: '40px' }}>3</div>
              <div className="small mt-1">View Results</div>
            </div>
          </div>
        </div>

        {verificationStep === 1 && (
          <div className="col-lg-8">
            <SectionCard title="Step 1: Scan QR Code & Verify on Blockchain" variant="highlight">
              <div className="mb-4">
                <label className="form-label fw-semibold mb-3" style={{ color: 'black' }}>
                  QR Code Scanning Method
                </label>
                <div className="btn-group w-100" role="group">
                  <button
                    type="button"
                    className={`btn ${scanMode === 'camera' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setScanMode('camera')}
                  >
                    📷 Camera Scan
                  </button>
                  <button
                    type="button"
                    className={`btn ${scanMode === 'paste' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setScanMode('paste')}
                  >
                    ⌨️ Manual Entry
                  </button>
                </div>
              </div>

              {scanMode === 'camera' ? (
                <div className="mb-4">
                  <div id="qr-reader" style={{ border: '2px solid #dee2e6', borderRadius: '8px' }}></div>
                </div>
              ) : (
                <div className="alert alert-info">
                  <strong>Manual Entry:</strong> Enter the product serial number and consumer code below.
                </div>
              )}

              <form onSubmit={verifyOnBlockchain}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Product Serial Number</label>
                    <input
                      className="form-control form-control-lg"
                      name="productSN"
                      value={form.productSN}
                      onChange={onChange}
                      required
                      placeholder="Enter or scan product SN"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Consumer Code</label>
                    <input
                      className="form-control form-control-lg"
                      name="consumerCode"
                      value={form.consumerCode}
                      onChange={onChange}
                      required
                      placeholder="Your consumer code"
                    />
                  </div>
                  <div className="col-12">
                    <button className="btn btn-primary btn-lg w-100" type="submit">
                      🔗 Verify on Blockchain
                    </button>
                  </div>
                </div>
              </form>

              {blockchainResult && (
                <div className={`alert alert-${blockchainResult.verified ? 'success' : 'danger'} mt-4`}>
                  <strong>{blockchainResult.verified ? '✓ Blockchain Verified' : '✗ Verification Failed'}</strong>
                  <p className="mb-0 mt-2">{status}</p>
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {verificationStep === 2 && (
          <div className="col-lg-8">
            <SectionCard title="Step 2: Upload Product Image for AI Analysis" variant="highlight">
              <div className="alert alert-success mb-4">
                <strong>✓ Blockchain Verified</strong>
                <div className="small mt-1">Product SN: {blockchainResult?.productSN}</div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold mb-3">Select Product Image</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="form-control form-control-lg"
                  accept="image/*"
                  onChange={handleImageSelect}
                />
                <div className="form-text">
                  📸 Take a clear photo of the product. Supported formats: JPG, PNG, WEBP
                </div>
              </div>

              {imagePreview && (
                <div className="mb-4">
                  <label className="form-label fw-semibold">Image Preview</label>
                  <div className="border rounded p-3 text-center bg-light">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                    />
                  </div>
                </div>
              )}

              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary btn-lg flex-fill"
                  onClick={verifyWithAI}
                  disabled={!selectedImage || aiServerStatus !== 'online'}
                >
                  🤖 Analyze with AI
                </button>
                <button
                  className="btn btn-outline-secondary btn-lg"
                  onClick={() => setVerificationStep(1)}
                >
                  ← Back
                </button>
              </div>
            </SectionCard>
          </div>
        )}

        {verificationStep === 3 && (
          <div className="col-lg-10">
            <SectionCard title="Verification Results" variant="highlight">
              <div className={`alert alert-${verdict.color} border-3 mb-4`}>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h4 className="mb-1">
                      {verdict.status === 'genuine' && '✅ GENUINE PRODUCT'}
                      {verdict.status === 'suspicious' && '⚠️ SUSPICIOUS PRODUCT'}
                      {verdict.status === 'invalid' && '❌ INVALID PRODUCT'}
                    </h4>
                    <p className="mb-0">{verdict.message}</p>
                  </div>
                  <div className="fs-1">
                    {verdict.status === 'genuine' && '🎉'}
                    {verdict.status === 'suspicious' && '⚠️'}
                    {verdict.status === 'invalid' && '❌'}
                  </div>
                </div>
              </div>

              <div className="row g-4">
                <div className="col-md-6">
                  <div className="card h-100">
                    <div className="card-body">
                      <h5 className="card-title">
                        🔗 Blockchain Verification
                        <span className={`badge bg-${blockchainResult?.verified ? 'success' : 'danger'} ms-2`}>
                          {blockchainResult?.verified ? 'VERIFIED' : 'FAILED'}
                        </span>
                      </h5>
                      <hr />
                      <div className="mb-2">
                        <strong>Product SN:</strong> {blockchainResult?.productSN}
                      </div>
                      <div className="mb-2">
                        <strong>Consumer Code:</strong> {blockchainResult?.consumerCode}
                      </div>
                      <div className="mb-2">
                        <strong>Status:</strong>{' '}
                        <span className={blockchainResult?.verified ? 'text-success' : 'text-danger'}>
                          {blockchainResult?.verified ? 'Ownership verified on blockchain' : 'Not found or not owned'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="card h-100">
                    <div className="card-body">
                      <h5 className="card-title">
                        🤖 AI Image Analysis
                        <span className={`badge bg-${aiResult?.is_genuine ? 'success' : 'danger'} ms-2`}>
                          {aiResult?.is_genuine ? 'GENUINE' : 'FAKE DETECTED'}
                        </span>
                      </h5>
                      <hr />
                      <div className="mb-2">
                        <strong>Prediction:</strong>{' '}
                        <span className={aiResult?.is_genuine ? 'text-success' : 'text-danger'}>
                          {aiResult?.prediction?.toUpperCase()}
                        </span>
                      </div>
                      <div className="mb-2">
                        <strong>Confidence:</strong> {aiResult?.confidence}%
                      </div>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-success">Real: {aiResult?.probabilities?.real}%</span>
                          <span className="text-danger">Fake: {aiResult?.probabilities?.fake}%</span>
                        </div>
                        <div className="progress" style={{ height: '20px' }}>
                          <div
                            className="progress-bar bg-success"
                            style={{ width: `${aiResult?.probabilities?.real}%` }}
                          >
                          </div>
                          <div
                            className="progress-bar bg-danger"
                            style={{ width: `${aiResult?.probabilities?.fake}%` }}
                          >
                          </div>
                        </div>
                      </div>
                      <div className="small text-muted">
                        Model: EfficientNetB3 (Transfer Learning)
                      </div>
                    </div>
                  </div>
                </div>

                {imagePreview && (
                  <div className="col-12">
                    <div className="card">
                      <div className="card-body">
                        <h5 className="card-title">📸 Analyzed Image</h5>
                        <div className="text-center bg-light p-3 rounded">
                          <img
                            src={imagePreview}
                            alt="Analyzed product"
                            style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 d-flex gap-2">
                <button className="btn btn-primary btn-lg" onClick={resetVerification}>
                  🔄 Verify Another Product
                </button>
                <button className="btn btn-outline-secondary btn-lg" onClick={() => window.print()}>
                  🖨️ Print Report
                </button>
              </div>
            </SectionCard>
          </div>
        )}

        <div className="col-lg-4">
          <SectionCard title="ℹ️ How It Works">
            <div className="small">
              <div className="mb-3">
                <strong>Step 1: Blockchain Verification</strong>
                <p className="text-muted mb-0">Scan the QR code to verify product ownership and authenticity on the blockchain.</p>
              </div>
              <div className="mb-3">
                <strong>Step 2: AI Image Analysis</strong>
                <p className="text-muted mb-0">Upload a photo of the product for AI-powered fake detection using deep learning.</p>
              </div>
              <div className="mb-3">
                <strong>Step 3: Results</strong>
                <p className="text-muted mb-0">Get comprehensive verification results combining blockchain and AI analysis.</p>
              </div>
              <hr />
              <div className="alert alert-info small mb-0">
                <strong>💡 Tips:</strong>
                <ul className="mb-0 mt-2 ps-3">
                  <li>Take clear, well-lit photos</li>
                  <li>Ensure the product is clearly visible</li>
                  <li>Avoid blurry or dark images</li>
                  <li>Include product logos and details</li>
                </ul>
              </div>
            </div>
          </SectionCard>

          {status && (
            <div className="mt-3">
              <div className="alert alert-info small">
                <strong>Status:</strong> {status}
              </div>
            </div>
          )}

          {account && (
            <div className="mt-3">
              <div className="small text-muted">
                <strong>Connected Account:</strong><br />
                <code className="small">{account}</code>
              </div>
            </div>
          )}
        </div>
      </div>
    </Page>
  )
}
