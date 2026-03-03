/**
 * server/frontend/src/scripts/bitcoin_client.js
 * ==============================================
 * Browser-side client for the Bitcoin RPC proxy.
 *
 * Sends requests to the Flask backend via Nginx at /bitcoin.
 * The session cookie is attached automatically by the browser.
 * No credentials needed on the frontend.
 *
 * Usage:
 *   import BitcoinRPC from "./bitcoin_client.js";
 *
 *   const rpc = new BitcoinRPC();
 *   const info = await rpc.getblockchaininfo();
 */

class BitcoinRPC {
    /**
     * @param {number} timeout - Request timeout in milliseconds. Default: 30000.
     */
    constructor(timeout = 30000) {
        this._url     = "/bitcoin";
        this._timeout = timeout;
        this._headers = {
            "Content-Type": "application/json",
        };
    }

    /**
     * Send a request to the Bitcoin RPC proxy.
     *
     * @param {string} method    - Bitcoin RPC method name.
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

    async getblockchaininfo() { return this.call("getblockchaininfo"); }
    async getdeploymentinfo()  { return this.call("getdeploymentinfo"); }
    async verifychain()        { return this.call("verifychain"); }
    async getchainstates()     { return this.call("getchainstates"); }
    async getchaintips()       { return this.call("getchaintips"); }
    async getdifficulty()      { return this.call("getdifficulty"); }
    async getmempoolinfo()     { return this.call("getmempoolinfo"); }
    async getrawmempool()      { return this.call("getrawmempool"); }
    async getblockcount()      { return this.call("getblockcount"); }
    async getbestblockhash()   { return this.call("getbestblockhash"); }

    /**
     * Returns all built-in shortcut methods as callable entries.
     * Useful for dynamic dispatch in the dashboard.
     */
    getMethods() {
        return {
            getblockchaininfo: () => this.getblockchaininfo(),
            getdeploymentinfo: () => this.getdeploymentinfo(),
            verifychain:       () => this.verifychain(),
            getchainstates:    () => this.getchainstates(),
            getchaintips:      () => this.getchaintips(),
            getdifficulty:     () => this.getdifficulty(),
            getmempoolinfo:    () => this.getmempoolinfo(),
            getrawmempool:     () => this.getrawmempool(),
            getblockcount:     () => this.getblockcount(),
            getbestblockhash:  () => this.getbestblockhash(),
        };
    }
}

export default BitcoinRPC;





