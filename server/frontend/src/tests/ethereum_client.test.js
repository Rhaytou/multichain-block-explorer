/**
 * server/frontend/src/tests/ethereum_client.test.js
 * ==================================================
 * Unit tests for ethereum_client.js — RPC call construction and
 * convenience method routing. No node required. All network calls are mocked.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import EthereumRPC from "../scripts/ethereum_client.js";


// ---------------------------------------------------------------------------
// EthereumRPC.call — request construction
// ---------------------------------------------------------------------------

describe("EthereumRPC.call — request payload", () => {

    let fetchMock;

    beforeEach(() => {
        fetchMock = vi.fn().mockResolvedValue({
            ok:   true,
            json: async () => ({ result: "0x1", error: null }),
        });
        global.fetch = fetchMock;
    });

    it("sends POST to /ethereum", async () => {
        const rpc = new EthereumRPC();
        await rpc.call("eth_blockNumber");
        expect(fetchMock.mock.calls[0][0]).toBe("/ethereum");
        expect(fetchMock.mock.calls[0][1].method).toBe("POST");
    });

    it("sets Content-Type application/json — no Authorization header", async () => {
        const rpc = new EthereumRPC();
        await rpc.call("eth_blockNumber");
        const headers = fetchMock.mock.calls[0][1].headers;
        expect(headers["Content-Type"]).toBe("application/json");
        expect(headers["Authorization"]).toBeUndefined();
    });

    it("sends credentials same-origin", async () => {
        const rpc = new EthereumRPC();
        await rpc.call("eth_blockNumber");
        expect(fetchMock.mock.calls[0][1].credentials).toBe("same-origin");
    });

    it("builds a valid JSON-RPC 2.0 payload", async () => {
        const rpc = new EthereumRPC();
        await rpc.call("eth_chainId");
        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body.method).toBe("eth_chainId");
        expect(body.params).toEqual([]);
        expect(body.id).toBe("multichain-explorer");
    });

    it("passes params correctly", async () => {
        const rpc = new EthereumRPC();
        await rpc.call("eth_getBalance", ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "latest"]);
        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body.params).toEqual(["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "latest"]);
    });

    it("returns the result field", async () => {
        const rpc    = new EthereumRPC();
        const result = await rpc.call("eth_blockNumber");
        expect(result).toBe("0x1");
    });

    it("throws on HTTP error", async () => {
        fetchMock.mockResolvedValueOnce({ ok: false, status: 401, statusText: "Unauthorized" });
        const rpc = new EthereumRPC();
        await expect(rpc.call("eth_blockNumber")).rejects.toThrow("HTTP error: 401");
    });

    it("throws on RPC-level error", async () => {
        fetchMock.mockResolvedValueOnce({
            ok:   true,
            json: async () => ({ result: null, error: { code: -32601, message: "Method not found" } }),
        });
        const rpc = new EthereumRPC();
        await expect(rpc.call("eth_unknown")).rejects.toThrow("Method not found");
    });

});


// ---------------------------------------------------------------------------
// Convenience shortcuts — each method calls the correct RPC method
// ---------------------------------------------------------------------------

describe("EthereumRPC — convenience shortcuts", () => {

    let rpc;

    beforeEach(() => {
        rpc = new EthereumRPC();
        rpc.call = vi.fn().mockResolvedValue("0x0");
    });

    it("web3_clientVersion calls web3_clientVersion",   async () => { await rpc.web3_clientVersion();  expect(rpc.call).toHaveBeenCalledWith("web3_clientVersion"); });
    it("net_version calls net_version",                 async () => { await rpc.net_version();         expect(rpc.call).toHaveBeenCalledWith("net_version"); });
    it("net_listening calls net_listening",             async () => { await rpc.net_listening();        expect(rpc.call).toHaveBeenCalledWith("net_listening"); });
    it("net_peerCount calls net_peerCount",             async () => { await rpc.net_peerCount();        expect(rpc.call).toHaveBeenCalledWith("net_peerCount"); });
    it("eth_protocolVersion calls eth_protocolVersion", async () => { await rpc.eth_protocolVersion();  expect(rpc.call).toHaveBeenCalledWith("eth_protocolVersion"); });
    it("eth_syncing calls eth_syncing",                 async () => { await rpc.eth_syncing();          expect(rpc.call).toHaveBeenCalledWith("eth_syncing"); });
    it("eth_coinbase calls eth_coinbase",               async () => { await rpc.eth_coinbase();         expect(rpc.call).toHaveBeenCalledWith("eth_coinbase"); });
    it("eth_chainId calls eth_chainId",                 async () => { await rpc.eth_chainId();          expect(rpc.call).toHaveBeenCalledWith("eth_chainId"); });
    it("eth_mining calls eth_mining",                   async () => { await rpc.eth_mining();           expect(rpc.call).toHaveBeenCalledWith("eth_mining"); });
    it("eth_hashrate calls eth_hashrate",               async () => { await rpc.eth_hashrate();         expect(rpc.call).toHaveBeenCalledWith("eth_hashrate"); });
    it("eth_gasPrice calls eth_gasPrice",               async () => { await rpc.eth_gasPrice();         expect(rpc.call).toHaveBeenCalledWith("eth_gasPrice"); });
    it("eth_accounts calls eth_accounts",               async () => { await rpc.eth_accounts();         expect(rpc.call).toHaveBeenCalledWith("eth_accounts"); });
    it("eth_blockNumber calls eth_blockNumber",         async () => { await rpc.eth_blockNumber();      expect(rpc.call).toHaveBeenCalledWith("eth_blockNumber"); });

});


// ---------------------------------------------------------------------------
// getMethods — registry completeness
// ---------------------------------------------------------------------------

describe("EthereumRPC.getMethods", () => {

    it("returns an object with all 13 methods", () => {
        const rpc     = new EthereumRPC();
        const methods = rpc.getMethods();
        const expected = [
            "web3_clientVersion", "net_version", "net_listening", "net_peerCount",
            "eth_protocolVersion", "eth_syncing", "eth_coinbase", "eth_chainId",
            "eth_mining", "eth_hashrate", "eth_gasPrice", "eth_accounts", "eth_blockNumber",
        ];
        expected.forEach(name => expect(methods).toHaveProperty(name));
        expect(Object.keys(methods)).toHaveLength(13);
    });

    it("each entry is a function", () => {
        const rpc     = new EthereumRPC();
        const methods = rpc.getMethods();
        Object.values(methods).forEach(fn => expect(typeof fn).toBe("function"));
    });

});







