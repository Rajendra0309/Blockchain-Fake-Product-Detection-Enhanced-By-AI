import React, { useState } from 'react'
import { useWeb3 } from '../hooks/useWeb3'
import { useToast } from '../hooks/useToast'
import { Page, SectionCard } from '../components/Page'
import { LoadingSpinner, ButtonLoading } from '../components/LoadingSpinner'

export default function AddSeller() {
  const { web3, contract, account, loading: web3Loading } = useWeb3()
  const toast = useToast()
  const [form, setForm] = useState({
    ManufacturerId: '', SellerName: '', SellerBrand: '', SellerCode: '',
    SellerPhoneNumber: '', SellerManager: '', SellerAddress: ''
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const onChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' })
    }
  }

  const validateForm = () => {
    const newErrors = {}
    const requiredFields = ['ManufacturerId', 'SellerName', 'SellerBrand', 'SellerCode', 'SellerPhoneNumber', 'SellerManager', 'SellerAddress']
    requiredFields.forEach(field => {
      if (!form[field]?.trim()) {
        newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').trim()} is required`
      }
    })
    if (form.SellerPhoneNumber && !/^\d{10}$/.test(form.SellerPhoneNumber)) {
      newErrors.SellerPhoneNumber = 'Phone number must be 10 digits'
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
      const { ManufacturerId, SellerName, SellerBrand, SellerCode, SellerPhoneNumber, SellerManager, SellerAddress } = form
      await contract.methods.addSeller(
        web3.utils.asciiToHex(ManufacturerId),
        web3.utils.asciiToHex(SellerName),
        web3.utils.asciiToHex(SellerBrand),
        web3.utils.asciiToHex(SellerCode),
        Number(SellerPhoneNumber),
        web3.utils.asciiToHex(SellerManager),
        web3.utils.asciiToHex(SellerAddress)
      ).send({ from: account })

      setForm({ ManufacturerId: '', SellerName: '', SellerBrand: '', SellerCode: '', SellerPhoneNumber: '', SellerManager: '', SellerAddress: '' })
      toast.success('Seller added successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Transaction failed: ' + (err?.message || err))
    } finally {
      setSubmitting(false)
    }
  }

  const fieldLabels = {
    ManufacturerId: 'Manufacturer ID',
    SellerName: 'Seller Name',
    SellerBrand: 'Seller Brand',
    SellerCode: 'Seller Code',
    SellerPhoneNumber: 'Phone Number',
    SellerManager: 'Manager Name',
    SellerAddress: 'Address'
  }

  if (web3Loading) {
    return (
      <Page title="Add Seller" description="Onboard an authorized seller">
        <div className="text-center py-5">
          <LoadingSpinner size="lg" text="Connecting to blockchain..." />
        </div>
      </Page>
    )
  }

  return (
    <Page title="Add Seller" description="Onboard an authorized seller for a manufacturer.">
      <SectionCard title="Seller Information" variant="highlight">
        <form className="row gy-3" onSubmit={onSubmit}>
          {Object.keys(form).map((k) => (
            <div className="col-md-6" key={k}>
              <label className="form-label fw-semibold">{fieldLabels[k]}</label>
              <input
                name={k}
                type={k === 'SellerPhoneNumber' ? 'tel' : 'text'}
                className={`form-control form-control-lg ${errors[k] ? 'is-invalid' : ''}`}
                value={form[k]}
                onChange={onChange}
                placeholder={`Enter ${fieldLabels[k].toLowerCase()}`}
              />
              {errors[k] && <div className="invalid-feedback">{errors[k]}</div>}
            </div>
          ))}
          <div className="col-12">
            <ButtonLoading
              className="btn btn-primary btn-lg px-4"
              loading={submitting}
              disabled={!contract || !account}
            >
              Add Seller
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
    </Page>
  )
}
