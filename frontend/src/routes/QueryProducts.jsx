import React, { useState } from 'react'
import { useWeb3 } from '../hooks/useWeb3'
import { useToast } from '../hooks/useToast'
import { Page, SectionCard, EmptyState } from '../components/Page'
import { LoadingSpinner, ButtonLoading, TableSkeleton } from '../components/LoadingSpinner'

export default function QueryProducts() {
  const { web3, contract, account, loading: web3Loading } = useWeb3()
  const toast = useToast()
  const [sellerCode, setSellerCode] = useState('')
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
      const scHex = web3.utils.asciiToHex(sellerCode)
      const res = await contract.methods.queryProductsList(scHex).call({ from: account })
      const ids = res[0]
      const pSNs = res[1].map(x => web3.utils.hexToAscii(x).replace(/\u0000/g, ''))
      const names = res[2].map(x => web3.utils.hexToAscii(x).replace(/\u0000/g, ''))
      const brands = res[3].map(x => web3.utils.hexToAscii(x).replace(/\u0000/g, ''))
      const prices = res[4]
      const statusArr = res[5].map(x => web3.utils.hexToAscii(x).replace(/\u0000/g, ''))
      const out = []
      for (let i = 0; i < ids.length; i++) {
        if (ids[i] === undefined || pSNs[i] === undefined || !pSNs[i].trim()) continue
        out.push({ id: Number(ids[i]), sn: pSNs[i], name: names[i] || '', brand: brands[i] || '', price: Number(prices[i] || 0), status: statusArr[i] || '' })
      }
      setRows(out)
      toast.success(`Found ${out.length} product(s)`)
    } catch (err) {
      console.error(err)
      toast.error('Query failed: ' + (err?.message || err))
    } finally {
      setLoading(false)
    }
  }

  if (web3Loading) {
    return (
      <Page title="Query Products" description="Search products">
        <div className="text-center py-5">
          <LoadingSpinner size="lg" text="Connecting to blockchain..." />
        </div>
      </Page>
    )
  }

  return (
    <Page title="Query Products" description="List products currently associated with a seller code.">
      <SectionCard title="Search Products" variant="highlight">
        <form className="row gy-3" onSubmit={onSubmit}>
          <div className="col-md-6">
            <label className="form-label fw-semibold">Seller Code</label>
            <input className="form-control form-control-lg" value={sellerCode} onChange={e => setSellerCode(e.target.value)} placeholder="Enter seller code" required />
          </div>
          <div className="col-12">
            <ButtonLoading className="btn btn-primary btn-lg px-4" loading={loading} disabled={!contract}>
              Search Products
            </ButtonLoading>
          </div>
        </form>

        <div className="table-responsive mt-4">
          {loading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : (
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>ID</th><th>Serial No</th><th>Name</th><th>Brand</th><th>Price</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && searched && (
                  <tr><td colSpan={6}><EmptyState message="No products found for that seller." icon="📦" /></td></tr>
                )}
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.id}</td>
                    <td><code>{r.sn}</code></td>
                    <td>{r.name}</td>
                    <td>{r.brand}</td>
                    <td>₹{r.price}</td>
                    <td><span className={`badge ${r.status === 'Available' ? 'bg-success' : 'bg-secondary'}`}>{r.status}</span></td>
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
