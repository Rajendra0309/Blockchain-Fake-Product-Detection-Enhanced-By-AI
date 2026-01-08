# FraudBlock React Frontend

This React + Bootstrap UI mirrors the existing HTML/JS dApp without changing your Solidity backend. It uses the Truffle artifact in `build/contracts/product.json` and connects via Web3.

## Scripts
- dev: start Vite dev server at http://localhost:5173
- build: production build
- preview: preview built app

## Run
1. Ensure Ganache/Local chain is up and contracts are migrated. The artifact should exist at `build/contracts/product.json` (already in repo).
2. Install deps in the new frontend folder.
3. Start the dev server.

## Notes
- Uses MetaMask if available; falls back to http://localhost:7545.
- All contract calls preserve argument order and types from the old UI.
