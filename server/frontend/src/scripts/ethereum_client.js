/**
 * server/frontend/src/scripts/ethereum_client.js
 * ================================================
 * Browser-side client for the Ethereum RPC proxy.
 *
 * Sends requests to the Flask backend via Nginx at /ethereum.
 * The session cookie is attached automatically by the browser.
 * No credentials needed on the frontend.
 *
 * Usage:
 *   import EthereumRPC from "./ethereum_client.js";
 *
 *   const rpc = new EthereumRPC();
 *   const blockNumber = await rpc.eth_blockNumber();
 */

class EthereumRPC {
    /**
     * @param {number} timeout - Request timeout in milliseconds. Default: 30000.
     */
    constructor(timeout = 30000) {
        this._url     = "/ethereum";
        this._timeout = timeout;
        this._headers = {
            "Content-Type": "application/json",
        };
    }

    /**
     * Send a request to the Ethereum RPC proxy.
     *
     * @param {string} method    - Ethereum RPC method name.
     * @param {Array}  params    - Positional parameters. Default: [].
     * @param {string} requestId - Arbitrary ID echoed back by the node.
     * @returns {Promise<*>}     - The result field of the JSON-RPC response.
     * @throws {Error}           - On HTTP errors or RPC-level errors.
     */
    async call(method, params = [], requestId = "multichain-explorer") {
        const payload = {
            method,
            params,
            id: requestId,
        };

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this._timeout);

        let response;
        try {
            response = await fetch(this._url, {
                method:      "POST",
                headers:     this._headers,
                body:        JSON.stringify(payload),
                signal:      controller.signal,
                credentials: "same-origin",
            });
        } finally {
            clearTimeout(timer);
        }

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error != null) {
            throw new Error(JSON.stringify(data.error));
        }

        return data.result;
    }

    // ------------------------------------------------------------------
    // Convenience shortcuts
    // ------------------------------------------------------------------

    async web3_clientVersion()  { return this.call("web3_clientVersion"); }
    async net_version()         { return this.call("net_version"); }
    async net_listening()       { return this.call("net_listening"); }
    async net_peerCount()       { return this.call("net_peerCount"); }
    async eth_protocolVersion() { return this.call("eth_protocolVersion"); }
    async eth_syncing()         { return this.call("eth_syncing"); }
    async eth_coinbase()        { return this.call("eth_coinbase"); }
    async eth_chainId()         { return this.call("eth_chainId"); }
    async eth_mining()          { return this.call("eth_mining"); }
    async eth_hashrate()        { return this.call("eth_hashrate"); }
    async eth_gasPrice()        { return this.call("eth_gasPrice"); }
    async eth_accounts()        { return this.call("eth_accounts"); }
    async eth_blockNumber()     { return this.call("eth_blockNumber"); }

    /**
     * Returns all built-in shortcut methods as callable entries.
     * Useful for dynamic dispatch in the dashboard.
     */
    getMethods() {
        return {
            web3_clientVersion:  () => this.web3_clientVersion(),
            net_version:         () => this.net_version(),
            net_listening:       () => this.net_listening(),
            net_peerCount:       () => this.net_peerCount(),
            eth_protocolVersion: () => this.eth_protocolVersion(),
            eth_syncing:         () => this.eth_syncing(),
            eth_coinbase:        () => this.eth_coinbase(),
            eth_chainId:         () => this.eth_chainId(),
            eth_mining:          () => this.eth_mining(),
            eth_hashrate:        () => this.eth_hashrate(),
            eth_gasPrice:        () => this.eth_gasPrice(),
            eth_accounts:        () => this.eth_accounts(),
            eth_blockNumber:     () => this.eth_blockNumber(),
        };
    }
}

export default EthereumRPC;










