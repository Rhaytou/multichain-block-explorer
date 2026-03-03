# Multichain Block Explorer

A self-hosted block explorer for Bitcoin and Ethereum, running entirely in Docker.

---

## Architecture

```
User → Nginx (8001) → Flask (5000) → Bitcoin node (18443)
                                    → Ethereum node (8545)
```

Nginx receives all user requests and proxies them to the Flask backend.
Flask serves the React app, manages session cookies, and forwards RPC calls to the nodes.
No credentials are ever exposed to the frontend.

---

## Requirements

- Docker
- Docker Compose
- `openssl` (for JWT generation)

---

## Setup

### 1. Environment variables

```
cp .env.example .env
```

Fill in `.env` with your values:

```
SECRET_KEY=your_secret_key_here
BTC_RPC_ENDPOINT=http://localhost:18443
BTC_RPC_USER=your_btc_rpc_user
BTC_RPC_PASS=your_btc_rpc_password
ETH_RPC_ENDPOINT=http://localhost:8545
```

### 2. Bitcoin credentials

The `BTC_RPC_USER` and `BTC_RPC_PASS` values in `.env` must match exactly what is set in
`nodes/bitcoin-node/bitcoin.conf`:

```
rpcuser=your_btc_rpc_user
rpcpassword=your_btc_rpc_password
```

Edit `bitcoin.conf` first, then mirror the same values in `.env`.

### 3. Ethereum JWT

The Geth and Prysm nodes authenticate over the Engine API using a shared JWT secret.
Generate it before starting the stack:

```
make gen_jwt
```

This writes a random 32-byte hex secret to `nodes/ethereum-node/jwt/jwt.hex`.
The file is gitignored and must be regenerated on every fresh clone.

### 4. Start the stack

```
make up
```

---

## Usage

Open your browser at:

```
http://localhost:8001/blockchainexplorer
```

The Bitcoin and Ethereum explorers are available from the sidebar.

---

## Makefile

```
make up                 # Start all services
make down               # Stop all services and remove volumes
make docker_clean_all   # Full Docker cleanup

make nlb_start          # Start the load balancer
make nlb_down           # Stop the load balancer
make nlb_restart        # Restart the load balancer
make nlb_logs           # Show load balancer logs
make nlb_bash           # Open shell in load balancer container

make serv_start         # Start the server
make serv_down          # Stop the server
make serv_restart       # Restart the server
make serv_logs          # Show server logs
make serv_bash          # Open shell in server container

make bn_start           # Start the bitcoin node
make bn_down            # Stop the bitcoin node
make bn_restart         # Restart the bitcoin node
make bn_logs            # Show bitcoin node logs
make bn_bash            # Open shell in bitcoin node container

make gen_jwt            # Generate Ethereum JWT secret

make eth-geth_start     # Start the Geth node
make eth-geth_down      # Stop the Geth node
make eth-geth_restart   # Restart the Geth node
make eth-geth_logs      # Show Geth node logs
make eth-geth_bash      # Open shell in Geth container

make eth-prysm_start    # Start the Prysm beacon node
make eth-prysm_down     # Stop the Prysm beacon node
make eth-prysm_restart  # Restart the Prysm beacon node
make eth-prysm_logs     # Show Prysm beacon node logs
make eth-prysm_bash     # Open shell in Prysm container
```

---

## Nodes

### Bitcoin

Running in regtest mode by default. The active network is controlled by `nodes/bitcoin-node/bitcoin.conf`.

Direct RPC call:

```
curl -u your_btc_rpc_user:your_btc_rpc_password \
    -X POST http://localhost:18443 \
    -H "Content-Type: application/json" \
    --data '{"jsonrpc":"1.0","id":"curl","method":"getblockchaininfo","params":[]}'
```

Via Nginx → Flask:

```
curl -X POST http://localhost:8001/bitcoin \
    -H "Content-Type: application/json" \
    -H "Cookie: explorer_session=<your_cookie>" \
    --data '{"method":"getblockchaininfo","params":[]}'
```

Using `bitcoin-cli` inside the container:

```
bitcoin-cli \
    -regtest \
    -datadir=/root/.bitcoin \
    -rpcuser=your_btc_rpc_user \
    -rpcpassword=your_btc_rpc_password \
    getblockchaininfo
```

### Ethereum

Running on the Sepolia testnet. Requires both Geth (execution layer) and Prysm (consensus layer).
Prysm performs checkpoint sync on first start — allow a few minutes before the node is ready.

Direct RPC call:

```
curl -X POST http://localhost:8545 \
    -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_syncing","params":[],"id":1}'
```

Via Nginx → Flask:

```
curl -X POST http://localhost:8001/ethereum \
    -H "Content-Type: application/json" \
    -H "Cookie: explorer_session=<your_cookie>" \
    --data '{"method":"eth_syncing","params":[]}'
```

---

## Server

### Backend

Flask app served by Gunicorn.

Routes:
- `GET  /`                   — Health check
- `GET  /blockchainexplorer` — Serves the React app, issues a 2h session cookie on first visit
- `GET  /assets/<filename>`  — Serves Vite static assets (JS, CSS, images)
- `POST /bitcoin`            — Validates session cookie, proxies to the Bitcoin node
- `POST /ethereum`           — Validates session cookie, proxies to the Ethereum node

Run locally:

```
cd server/backend
pip install -r requirements.txt
python run.py
```

Run tests:

```
cd server/backend
pytest tests/
```

### Frontend

React app built with Vite. Served as a static build by Flask.

Run locally (dev):

```
cd server/frontend
npm install
npm run dev
```

Run tests:

```
cd server/frontend
npm run test
```

Build:

```
cd server/frontend
npm run build
```

---

## Load Balancer

Nginx on port 8001 proxies all user traffic to Flask on port 5000.
Health check available on port 8000 at `/health`.

