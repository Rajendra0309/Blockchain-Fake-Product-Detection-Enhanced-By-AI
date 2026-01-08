# Blockchain Enabled Fake Product Detection Enhanced by AI

## Overview
Dual verification system combining blockchain immutability with AI visual inspection to authenticate products and detect counterfeits.

**Tech Stack:** Ethereum Smart Contracts + React Frontend + Python AI Server

## Prerequisites
- Node.js 16+
- Python 3.8+
- Truffle
- Ganache
- MetaMask extension

## Quick Start

### 1. Blockchain Setup
```bash
npm install
npx truffle compile
npx truffle migrate
npm run copy-contracts
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

### 3. AI Server
```bash
cd ai-server
pip install -r requirements.txt
python app.py
# Runs at http://localhost:5000
```

### 4. MetaMask Configuration
- Network: http://127.0.0.1:7545
- Chain ID: 1337 or 5777
- Import account from Ganache

## Usage Flow

**Manufacturer:** Add Product → Generate QR Code → Attach to Product
**Consumer:** Scan QR → Upload Product Image → Verify (Blockchain + AI)

---