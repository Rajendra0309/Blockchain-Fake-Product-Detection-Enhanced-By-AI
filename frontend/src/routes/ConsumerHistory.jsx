import React, { useState } from 'react'
import { useWeb3 } from '../hooks/useWeb3'
import { useToast } from '../hooks/useToast'
import { Page, SectionCard, EmptyState } from '../components/Page'
import { LoadingSpinner, ButtonLoading, TableSkeleton } from '../components/LoadingSpinner'

export default function ConsumerHistory() {
  const { web3, contract, account, loading: web3Loading } = useWeb3()
  const toast = useToast()
  const [consumerCode, setConsumerCode] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    if (!contract || !web3) {
      toast.error('Web3 not connected')
      return
    }

    setLoading(true)
    setSearched(true)
    try {
      const res = await contract.methods.getPurchaseHistory(web3.utils.asciiToHex(consumerCode)).call({ from: account })
      const sn = res[0].map(x => web3.utils.hexToAscii(x).replace(/\u0000/g, ''))
      const sc = res[1].map(x => web3.utils.hexToAscii(x).replace(/\u0000/g, ''))
      const mc = res[2].map(x => web3.utils.hexToAscii(x).replace(/\u0000/g, ''))
      const out = []
      for (let i = 0; i < sn.length; i++) {
        if (!sc[i] || sc[i] === '0' || !sn[i].trim()) break
        out.push({ sn: sn[i], seller: sc[i], manufacturer: mc[i] })
      }
      setRows(out)
      toast.success(`Found ${out.length} purchase(s)`)
    } catch (err) {
      console.error(err)
      toast.error('Query failed: ' + (err?.message || err))
    } finally {
      setLoading(false)
    }
  }

  if (web3Loading) {
    return (
      <Page title="Purchase History" description="Look up purchases">
        <div className="text-center py-5">
          <LoadingSpinner size="lg" text="Connecting to blockchain..." />
        </div>
      </Page>
    )
  }

  return (
    <Page title="Purchase History" description="Look up all products purchased by a consumer code.">
      <SectionCard title="Search History" variant="highlight">
        <form className="row gy-3" onSubmit={onSubmit}>
          <div className="col-md-6">
            <label className="form-label fw-semibold">Consumer Code</label>
            <input className="form-control form-control-lg" value={consumerCode} onChange={e => setConsumerCode(e.target.value)} placeholder="Enter consumer code" required />
          </div>
          <div className="col-12">
            <ButtonLoading className="btn btn-primary btn-lg px-4" loading={loading} disabled={!contract}>
              Search History
            </ButtonLoading>
          </div>
        </form>

        <div className="table-responsive mt-4">
          {loading ? (
            <TableSkeleton rows={5} cols={3} />
          ) : (
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Product Serial Number</th><th>Seller Code</th><th>Manufacturer Code</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && searched && (
                  <tr><td colSpan={3}><EmptyState message="No purchase records found for that consumer." icon="📜" /></td></tr>
                )}
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td><code>{r.sn}</code></td><td>{r.seller}</td><td>{r.manufacturer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {account && (
          <div className="mt-3 p-3 bg-light rounded">
            <small className="text-muted"><strong>Connected Account:</strong> {account}</small>
          </div>
        )}
      </SectionCard>
    </Page>
  )
}
