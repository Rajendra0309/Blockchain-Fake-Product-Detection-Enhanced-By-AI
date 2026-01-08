import { useState, useEffect, createContext, useContext } from 'react'
import Web3 from 'web3'

const Web3Context = createContext(null)

export function Web3Provider({ children }) {
    const [web3, setWeb3] = useState(null)
    const [account, setAccount] = useState('')
    const [contract, setContract] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        initWeb3()
    }, [])

    async function initWeb3() {
        try {
            setLoading(true)
            setError(null)

            let w3
            if (window.ethereum) {
                w3 = new Web3(window.ethereum)
                try {
                    await window.ethereum.request({ method: 'eth_requestAccounts' })
                } catch (e) {
                    console.error('User denied account access')
                }
            } else if (window.web3) {
                w3 = new Web3(window.web3.currentProvider)
            } else {
                w3 = new Web3(new Web3.providers.HttpProvider(import.meta.env.VITE_GANACHE_URL || 'http://localhost:7545'))
            }

            setWeb3(w3)

            const accounts = await w3.eth.getAccounts()
            setAccount(accounts[0] || '')

            const c = await loadContract(w3)
            setContract(c)

            if (window.ethereum) {
                window.ethereum.on('accountsChanged', (accounts) => {
                    setAccount(accounts[0] || '')
                })
            }

        } catch (err) {
            console.error('Web3 initialization error:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function loadContract(w3) {
        const resp = await fetch('/contracts/product.json')
        if (!resp.ok) {
            throw new Error('Failed to load contract artifact from /contracts/product.json')
        }
        const artifact = await resp.json()

        async function resolveAddress(web3Instance) {
            const netId = await web3Instance.eth.net.getId().catch(() => null)
            const chainId = await web3Instance.eth.getChainId().catch(() => null)
            const networks = artifact.networks || {}
            const keys = Object.keys(networks)
            const candidates = []
            if (netId != null) candidates.push(String(netId))
            if (chainId != null) candidates.push(String(chainId))
            candidates.push('5777', '1337')
            for (const k of keys) if (!candidates.includes(k)) candidates.push(k)
            let addr
            for (const id of candidates) {
                const n = networks[id]
                if (n && n.address) { addr = n.address; break }
            }
            return { addr, netId, chainId, known: keys }
        }

        let { addr, netId, chainId, known } = await resolveAddress(w3)

        if (!addr && typeof window !== 'undefined') {
            addr = window.__CONTRACT_ADDRESS__ || localStorage.getItem('CONTRACT_ADDRESS_OVERRIDE') || addr
        }

        if (!addr && typeof window !== 'undefined') {
            const local = new Web3(new Web3.providers.HttpProvider(import.meta.env.VITE_GANACHE_URL || 'http://localhost:7545'))
            const res = await resolveAddress(local)
            if (res.addr) {
                return new local.eth.Contract(artifact.abi, res.addr)
            }
        }

        if (!addr) {
            const knownStr = (known || []).join(', ') || 'none'
            throw new Error(
                `Contract address not found. netId=${netId}, chainId=${chainId}, artifact networks=[${knownStr}]. ` +
                'Switch MetaMask to Ganache, re-migrate, or set window.__CONTRACT_ADDRESS__.'
            )
        }

        return new w3.eth.Contract(artifact.abi, addr)
    }

    const value = {
        web3,
        account,
        contract,
        loading,
        error,
        reload: initWeb3
    }

    return (
        <Web3Context.Provider value={value}>
            {children}
        </Web3Context.Provider>
    )
}

export function useWeb3() {
    const context = useContext(Web3Context)
    if (!context) {
        throw new Error('useWeb3 must be used within a Web3Provider')
    }
    return context
}
