import React, { useState } from 'react'
import { useWeb3 } from '../hooks/useWeb3'
import { useToast } from '../hooks/useToast'
import { Page, SectionCard, EmptyState } from '../components/Page'
import { LoadingSpinner, ButtonLoading, TableSkeleton } from '../components/LoadingSpinner'

export default function QuerySellers() {
  const { web3, contract, account, loading: web3Loading } = useWeb3()
  const toast = useToast()
  const [manufacturerCode, setManufacturerCode] = useState('')
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
      const res = await contract.methods.querySellersList(web3.utils.asciiToHex(manufacturerCode)).call({ from: account })
      const ids = res[0]
      const sname = res[1].map(x => web3.utils.hexToAscii(x).replace(/\u0000/g, ''))
      const sbrand = res[2].map(x => web3.utils.hexToAscii(x).replace(/\u0000/g, ''))
      const scode = res[3].map(x => web3.utils.hexToAscii(x).replace(/\u0000/g, ''))
      const snum = res[4]
      const smgr = res[5].map(x => web3.utils.hexToAscii(x).replace(/\u0000/g, ''))
      const saddr = res[6].map(x => web3.utils.hexToAscii(x).replace(/\u0000/g, ''))
      const out = []
      for (let i = 0; i < ids.length; i++) {
        if (Number(snum[i]) === 0) break
        out.push({ id: Number(ids[i]), name: sname[i], brand: sbrand[i], code: scode[i], phone: Number(snum[i]), manager: smgr[i], address: saddr[i] })
      }
      setRows(out)
      toast.success(`Found ${out.length} seller(s)`)
    } catch (err) {
      console.error(err)
      toast.error('Query failed: ' + (err?.message || err))
    } finally {
      setLoading(false)
    }
  }

  if (web3Loading) {
    return (
      <Page title="Query Sellers" description="Search sellers">
        <div className="text-center py-5">
          <LoadingSpinner size="lg" text="Connecting to blockchain..." />
        </div>
      </Page>
    )
  }

  return (
    <Page title="Query Sellers" description="List all sellers registered under a manufacturer code.">
      <SectionCard title="Search Sellers" variant="highlight">
        <form className="row gy-3" onSubmit={onSubmit}>
          <div className="col-md-6">
            <label className="form-label fw-semibold">Manufacturer Code</label>
            <input className="form-control form-control-lg" value={manufacturerCode} onChange={e => setManufacturerCode(e.target.value)} placeholder="Enter manufacturer code" required />
          </div>
          <div className="col-12">
            <ButtonLoading className="btn btn-primary btn-lg px-4" loading={loading} disabled={!contract}>
              Search Sellers
            </ButtonLoading>
          </div>
        </form>

        <div className="table-responsive mt-4">
          {loading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : (
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>ID</th><th>Name</th><th>Brand</th><th>Code</th><th>Phone</th><th>Manager</th><th>Address</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && searched && (
                  <tr><td colSpan={7}><EmptyState message="No sellers found for that manufacturer." icon="🏪" /></td></tr>
                )}
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.id}</td><td>{r.name}</td><td>{r.brand}</td><td><code>{r.code}</code></td><td>{r.phone}</td><td>{r.manager}</td><td>{r.address}</td>
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
