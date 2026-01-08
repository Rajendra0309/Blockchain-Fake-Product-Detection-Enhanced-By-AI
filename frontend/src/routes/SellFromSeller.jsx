import React, { useState } from 'react'
import { useWeb3 } from '../hooks/useWeb3'
import { useToast } from '../hooks/useToast'
import { Page, SectionCard } from '../components/Page'
import { LoadingSpinner, ButtonLoading } from '../components/LoadingSpinner'

export default function SellFromSeller() {
  const { web3, contract, account, loading: web3Loading } = useWeb3()
  const toast = useToast()
  const [form, setForm] = useState({ productSN: '', consumerCode: '' })
  const [submitting, setSubmitting] = useState(false)

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  async function onSubmit(e) {
    e.preventDefault()
    if (!contract || !web3) {
      toast.error('Web3 not connected')
      return
    }

    setSubmitting(true)
    try {
      await contract.methods.sellerSellProduct(
        web3.utils.asciiToHex(form.productSN),
        web3.utils.asciiToHex(form.consumerCode)
      ).send({ from: account })
      setForm({ productSN: '', consumerCode: '' })
      toast.success('Product sold to consumer successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Transaction failed: ' + (err?.message || err))
    } finally {
      setSubmitting(false)
    }
  }

  if (web3Loading) {
    return (
      <Page title="Transfer: Seller → Consumer" description="Record final sale">
        <div className="text-center py-5">
          <LoadingSpinner size="lg" text="Connecting to blockchain..." />
        </div>
      </Page>
    )
  }

  return (
    <Page title="Transfer: Seller → Consumer" description="Record final sale of a product to a consumer.">
      <SectionCard title="Sale Details" variant="highlight">
        <form className="row gy-3" onSubmit={onSubmit}>
          <div className="col-md-6">
            <label className="form-label fw-semibold">Product Serial Number</label>
            <input name="productSN" className="form-control form-control-lg" value={form.productSN} onChange={onChange} placeholder="Enter product SN" required />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold">Consumer Code</label>
            <input name="consumerCode" className="form-control form-control-lg" value={form.consumerCode} onChange={onChange} placeholder="Enter consumer code" required />
          </div>
          <div className="col-12">
            <ButtonLoading className="btn btn-primary btn-lg px-4" loading={submitting} disabled={!contract || !account}>
              Complete Sale
            </ButtonLoading>
          </div>
        </form>
        {account && (
          <div className="mt-3 p-3 bg-light rounded">
            <small className="text-muted"><strong>Connected Account:</strong> {account}</small>
          </div>
        )}
      </SectionCard>
    </Page>
  )
}
