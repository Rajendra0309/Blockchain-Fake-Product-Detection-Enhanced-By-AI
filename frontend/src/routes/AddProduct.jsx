import React, { useState } from 'react'
import QRCode from 'qrcode'
import { useWeb3 } from '../hooks/useWeb3'
import { useToast } from '../hooks/useToast'
import { Page, SectionCard } from '../components/Page'
import { LoadingSpinner, ButtonLoading } from '../components/LoadingSpinner'

export default function AddProduct() {
  const { web3, contract, account, loading: web3Loading } = useWeb3()
  const toast = useToast()
  const [form, setForm] = useState({
    manufacturerID: '', productName: '', productSN: '', productBrand: '', productPrice: ''
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [qrPayload, setQrPayload] = useState('')
  const [lastSN, setLastSN] = useState('')

  const onChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' })
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!form.manufacturerID.trim()) newErrors.manufacturerID = 'Manufacturer ID is required'
    if (!form.productName.trim()) newErrors.productName = 'Product name is required'
    if (!form.productSN.trim()) newErrors.productSN = 'Serial number is required'
    if (!form.productBrand.trim()) newErrors.productBrand = 'Brand is required'
    if (!form.productPrice || Number(form.productPrice) <= 0) {
      newErrors.productPrice = 'Price must be greater than 0'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!validateForm()) {
      toast.error('Please fix the form errors')
      return
    }
    if (!contract || !web3) {
      toast.error('Web3 not connected')
      return
    }

    setSubmitting(true)
    try {
      const { manufacturerID, productName, productSN, productBrand, productPrice } = form
      await contract.methods.addProduct(
        web3.utils.asciiToHex(manufacturerID),
        web3.utils.asciiToHex(productName),
        web3.utils.asciiToHex(productSN),
        web3.utils.asciiToHex(productBrand),
        Number(productPrice)
      ).send({ from: account })

      const payload = {
        v: 1,
        type: 'verify',
        productSN,
        productName,
        productBrand
      }
      const text = JSON.stringify(payload)
      setQrPayload(text)
      const dataUrl = await QRCode.toDataURL(text, { width: 256, margin: 1 })
      setQrDataUrl(dataUrl)
      setLastSN(productSN)

      toast.success('Product registered successfully!')
      setForm({ manufacturerID: '', productName: '', productSN: '', productBrand: '', productPrice: '' })
    } catch (err) {
      console.error(err)
      toast.error('Transaction failed: ' + (err?.message || err))
    } finally {
      setSubmitting(false)
    }
  }

  if (web3Loading) {
    return (
      <Page title="Add Product" description="Register a new product on-chain">
        <div className="text-center py-5">
          <LoadingSpinner size="lg" text="Connecting to blockchain..." />
        </div>
      </Page>
    )
  }

  return (
    <Page title="Add Product" description="Register a new product on-chain and generate its verification QR code for tamper-proof authenticity tracking.">
      <div className="row g-4">
        <div className="col-lg-8">
          <SectionCard title="Product Information" variant="highlight">
            <form className="row gy-4" onSubmit={onSubmit}>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Manufacturer ID</label>
                <input
                  name="manufacturerID"
                  className={`form-control form-control-lg ${errors.manufacturerID ? 'is-invalid' : ''}`}
                  value={form.manufacturerID}
                  onChange={onChange}
                  placeholder="Enter manufacturer ID"
                />
                {errors.manufacturerID && <div className="invalid-feedback">{errors.manufacturerID}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Product Name</label>
                <input
                  name="productName"
                  className={`form-control form-control-lg ${errors.productName ? 'is-invalid' : ''}`}
                  value={form.productName}
                  onChange={onChange}
                  placeholder="Enter product name"
                />
                {errors.productName && <div className="invalid-feedback">{errors.productName}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Product Serial Number</label>
                <input
                  name="productSN"
                  className={`form-control form-control-lg ${errors.productSN ? 'is-invalid' : ''}`}
                  value={form.productSN}
                  onChange={onChange}
                  placeholder="Enter unique serial number"
                />
                {errors.productSN && <div className="invalid-feedback">{errors.productSN}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Product Brand</label>
                <input
                  name="productBrand"
                  className={`form-control form-control-lg ${errors.productBrand ? 'is-invalid' : ''}`}
                  value={form.productBrand}
                  onChange={onChange}
                  placeholder="Enter brand name"
                />
                {errors.productBrand && <div className="invalid-feedback">{errors.productBrand}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Product Price (₹)</label>
                <input
                  name="productPrice"
                  type="number"
                  min="1"
                  className={`form-control form-control-lg ${errors.productPrice ? 'is-invalid' : ''}`}
                  value={form.productPrice}
                  onChange={onChange}
                  placeholder="Enter price"
                />
                {errors.productPrice && <div className="invalid-feedback">{errors.productPrice}</div>}
              </div>
              <div className="col-12">
                <ButtonLoading
                  className="btn btn-primary btn-lg px-4"
                  loading={submitting}
                  disabled={!contract || !account}
                >
                  Register Product
                </ButtonLoading>
              </div>
            </form>

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
          <SectionCard title="How it Works" variant="default">
            <div className="process-steps">
              <div className="process-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h6>Fill Details</h6>
                  <p className="small text-muted">Enter product information and manufacturer details</p>
                </div>
              </div>
              <div className="process-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h6>Blockchain Registration</h6>
                  <p className="small text-muted">Product gets registered on the blockchain</p>
                </div>
              </div>
              <div className="process-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h6>QR Generation</h6>
                  <p className="small text-muted">Tamper-proof QR code is automatically generated</p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      {qrDataUrl && (
        <SectionCard title="Generated QR Code" variant="highlight">
          <div className="row align-items-center g-4">
            <div className="col-md-6 text-center">
              <div className="qr-container">
                <img
                  src={qrDataUrl}
                  alt="Product QR"
                  className="qr-image"
                  style={{ imageRendering: 'crisp-edges' }}
                />
                <p className="mt-3 text-muted small">Blockchain-secured verification code</p>
              </div>
            </div>
            <div className="col-md-6">
              <h5 className="mb-3">Your product is now registered!</h5>
              <p className="text-muted mb-4">
                This QR code contains all the verification data needed to authenticate your product.
              </p>

              <div className="d-grid gap-2">
                <a
                  className="btn btn-primary"
                  href={qrDataUrl}
                  download={`product-${lastSN || 'qr'}.png`}
                >
                  Download QR Code
                </a>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(qrPayload)
                    toast.success('QR payload copied to clipboard!')
                  }}
                >
                  Copy QR Data
                </button>
              </div>

              <div className="mt-4 p-3 bg-light rounded">
                <small className="text-muted">
                  <strong>QR Payload:</strong>
                  <div className="mt-1" style={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                    {qrPayload}
                  </div>
                </small>
              </div>
            </div>
          </div>
        </SectionCard>
      )}
    </Page>
  )
}
