import Web3 from 'web3'

export async function getWeb3() {
  if (window.ethereum) {
    const web3 = new Web3(window.ethereum)
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' })
    } catch (e) {
      console.error('User denied account access')
    }
    return web3
  } else if (window.web3) {
    return new Web3(window.web3.currentProvider)
  } else {
    return new Web3(new Web3.providers.HttpProvider('http://localhost:7545'))
  }
}

export async function getProductContract(web3) {
  const resp = await fetch('/contracts/product.json')
  if (!resp.ok) {
    throw new Error('Failed to load contract artifact from /contracts/product.json')
  }
  const artifact = await resp.json()
  async function resolveAddress(w3) {
    const netId = await w3.eth.net.getId().catch(() => null)
    const chainId = await w3.eth.getChainId().catch(() => null)
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

  let { addr, netId, chainId, known } = await resolveAddress(web3)

  if (!addr && typeof window !== 'undefined') {
    addr = window.__CONTRACT_ADDRESS__ || localStorage.getItem('CONTRACT_ADDRESS_OVERRIDE') || addr
  }

  if (!addr && typeof window !== 'undefined') {
    const local = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'))
    const res = await resolveAddress(local)
    if (res.addr) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Falling back to local Ganache provider at http://localhost:7545')
      }
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

  if (process.env.NODE_ENV !== 'production') {
    console.warn('Using contract address:', addr, 'on netId:', netId, 'chainId:', chainId)
  }

  return new web3.eth.Contract(artifact.abi, addr)
}
