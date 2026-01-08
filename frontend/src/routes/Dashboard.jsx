import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWeb3 } from '../hooks/useWeb3'
import { useToast } from '../hooks/useToast'
import { Page, SectionCard } from '../components/Page'
import { LoadingSpinner, CardSkeleton } from '../components/LoadingSpinner'

export default function Dashboard() {
    const { web3, contract, account, loading: web3Loading, error: web3Error } = useWeb3()
    const toast = useToast()
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalSellers: 0,
        availableProducts: 0,
        soldProducts: 0
    })
    const [loading, setLoading] = useState(true)
    const [recentProducts, setRecentProducts] = useState([])
    const [dataError, setDataError] = useState(null)

    useEffect(() => {
        if (contract && web3 && account && !web3Loading) {
            loadDashboardData()
        } else if (!web3Loading && !contract) {
            setLoading(false)
            setDataError('Contract not connected. Please ensure Ganache is running and contracts are deployed.')
        }
    }, [contract, web3, web3Loading, account])

    async function loadDashboardData() {
        try {
            setLoading(true)
            setDataError(null)

            const productResult = await contract.methods.viewProductItems().call({ from: account })
            const sellerResult = await contract.methods.viewSellers().call({ from: account })

            const productIds = productResult[0] || []
            const productSNs = (productResult[1] || []).map(x => web3.utils.hexToAscii(x).replace(/\u0000/g, ''))
            const productNames = (productResult[2] || []).map(x => web3.utils.hexToAscii(x).replace(/\u0000/g, ''))
            const productBrands = (productResult[3] || []).map(x => web3.utils.hexToAscii(x).replace(/\u0000/g, ''))
            const productPrices = productResult[4] || []
            const productStatus = (productResult[5] || []).map(x => web3.utils.hexToAscii(x).replace(/\u0000/g, ''))

            const sellerIds = sellerResult[0] || []

            let available = 0
            let sold = 0
            const products = []

            for (let i = 0; i < productIds.length; i++) {
                if (productSNs[i] && productSNs[i].trim() !== '') {
                    products.push({
                        id: Number(productIds[i]),
                        sn: productSNs[i],
                        name: productNames[i],
                        brand: productBrands[i],
                        price: Number(productPrices[i]),
                        status: productStatus[i]
                    })

                    if (productStatus[i] === 'Available') {
                        available++
                    } else {
                        sold++
                    }
                }
            }

            let sellerCount = 0
            for (let i = 0; i < sellerIds.length; i++) {
                if (Number(sellerIds[i]) > 0 || i === 0) {
                    sellerCount++
                }
            }

            setStats({
                totalProducts: products.length,
                totalSellers: sellerCount,
                availableProducts: available,
                soldProducts: sold
            })

            setRecentProducts(products.slice(-5).reverse())

        } catch (err) {
            console.error('Error loading dashboard:', err)
            setDataError('Unable to load blockchain data. Check your MetaMask connection.')
        } finally {
            setLoading(false)
        }
    }

    if (web3Loading) {
        return (
            <Page title="Dashboard" description="Overview of your product verification system">
                <div className="text-center py-5">
                    <LoadingSpinner size="lg" text="Connecting to blockchain..." />
                </div>
            </Page>
        )
    }

    return (
        <Page title="Dashboard" description="Overview of your product verification system">
            {dataError && (
                <div className="alert alert-warning mb-4 d-flex align-items-center">
                    <span className="me-2">⚠️</span>
                    <div>
                        <strong>Connection Issue:</strong> {dataError}
                    </div>
                    <button className="btn btn-sm btn-outline-warning ms-auto" onClick={loadDashboardData}>
                        🔄 Retry
                    </button>
                </div>
            )}

            <div className="row g-4 mb-4">
                <div className="col-md-6 col-lg-3">
                    <div className="stat-card stat-primary">
                        <div className="stat-card-icon">📦</div>
                        <div className="stat-card-content">
                            <h3 className="stat-card-number">{loading ? '...' : stats.totalProducts}</h3>
                            <p className="stat-card-label">Total Products</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 col-lg-3">
                    <div className="stat-card stat-success">
                        <div className="stat-card-icon">🏪</div>
                        <div className="stat-card-content">
                            <h3 className="stat-card-number">{loading ? '...' : stats.totalSellers}</h3>
                            <p className="stat-card-label">Total Sellers</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 col-lg-3">
                    <div className="stat-card stat-info">
                        <div className="stat-card-icon">✅</div>
                        <div className="stat-card-content">
                            <h3 className="stat-card-number">{loading ? '...' : stats.availableProducts}</h3>
                            <p className="stat-card-label">Available</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 col-lg-3">
                    <div className="stat-card stat-warning">
                        <div className="stat-card-icon">🛒</div>
                        <div className="stat-card-content">
                            <h3 className="stat-card-number">{loading ? '...' : stats.soldProducts}</h3>
                            <p className="stat-card-label">Sold</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-lg-8">
                    <SectionCard title="Recent Products" variant="highlight">
                        {loading ? (
                            <CardSkeleton />
                        ) : recentProducts.length === 0 ? (
                            <div className="text-center py-4">
                                <div className="mb-3" style={{ fontSize: '3rem' }}>📦</div>
                                <p className="text-muted mb-3">No products registered yet</p>
                                <Link to="/add-product" className="btn btn-primary">Add First Product</Link>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead>
                                        <tr>
                                            <th>Serial No</th>
                                            <th>Name</th>
                                            <th>Brand</th>
                                            <th>Price</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentProducts.map((p, i) => (
                                            <tr key={i}>
                                                <td><code>{p.sn}</code></td>
                                                <td>{p.name}</td>
                                                <td>{p.brand}</td>
                                                <td>₹{p.price}</td>
                                                <td>
                                                    <span className={`badge ${p.status === 'Available' ? 'bg-success' : 'bg-secondary'}`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </SectionCard>
                </div>

                <div className="col-lg-4">
                    <SectionCard title="Quick Actions">
                        <div className="d-grid gap-2">
                            <Link to="/add-product" className="btn btn-outline-primary">
                                📦 Add New Product
                            </Link>
                            <Link to="/add-seller" className="btn btn-outline-success">
                                🏪 Add New Seller
                            </Link>
                            <Link to="/verify" className="btn btn-outline-info">
                                ✅ Verify Product
                            </Link>
                            <Link to="/ai-verify" className="btn btn-outline-danger">
                                🤖 AI Verification
                            </Link>
                        </div>
                    </SectionCard>

                    <SectionCard title="Connection Status">
                        <div className="d-flex align-items-center mb-2">
                            <span className={`status-dot ${account ? 'status-connected' : 'status-disconnected'} me-2`}></span>
                            <span className={account ? 'text-success' : 'text-danger'}>
                                {account ? 'Connected' : 'Not Connected'}
                            </span>
                        </div>
                        {account ? (
                            <p className="small text-muted mb-0" style={{ wordBreak: 'break-all' }}>
                                <strong>Account:</strong><br />
                                <code>{account}</code>
                            </p>
                        ) : (
                            <p className="small text-muted mb-0">
                                Please connect MetaMask or ensure Ganache is running.
                            </p>
                        )}
                    </SectionCard>
                </div>
            </div>
        </Page>
    )
}
