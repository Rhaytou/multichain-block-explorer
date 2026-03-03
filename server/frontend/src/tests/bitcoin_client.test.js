/**
 * server/frontend/src/tests/bitcoin_client.test.js
 * =================================================
 * Unit tests for bitcoin_client.js — query detection logic and RPC call
 * construction. No node required. All network calls are mocked.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import BitcoinRPC from "../scripts/bitcoin_client.js";


// ---------------------------------------------------------------------------
// Query detection — detectAndCall routing
// Replicates the logic from BitcoinBlockExplorer.jsx
// ---------------------------------------------------------------------------

function detectAndCall(rpc, query) {
    const trimmed = query.trim();

    if (/^\d+$/.test(trimmed)) {
        return rpc.call("getblockhash", [parseInt(trimmed)]);
    }

    if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
        return rpc.call("getblock", [trimmed, 2]);
    }

    return rpc.call("scantxoutset", ["start", [`addr(${trimmed})`]]);
}


describe("detectAndCall — query routing", () => {

    let rpc;

    beforeEach(() => {
        rpc = { call: vi.fn() };
    });

    it("routes a plain integer to getblockhash", () => {
        detectAndCall(rpc, "1000");
        expect(rpc.call).toHaveBeenCalledWith("getblockhash", [1000]);
    });

    it("routes a 64-char hex string to getblock", () => {
        const blockhash = "a".repeat(64);
        detectAndCall(rpc, blockhash);
        expect(rpc.call).toHaveBeenCalledWith("getblock", [blockhash, 2]);
    });

    it("routes a Bitcoin address to scantxoutset", () => {
        const address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf";
        detectAndCall(rpc, address);
        expect(rpc.call).toHaveBeenCalledWith("scantxoutset", [
            "start",
            [`addr(${address})`],
        ]);
    });

    it("trims whitespace before routing", () => {
        detectAndCall(rpc, "  500  ");
        expect(rpc.call).toHaveBeenCalledWith("getblockhash", [500]);
    });

    it("does not route a partial hex string as a block hash", () => {
        const partial = "a".repeat(63);
        detectAndCall(rpc, partial);
        expect(rpc.call).toHaveBeenCalledWith("scantxoutset", [
            "start",
            [`addr(${partial})`],
        ]);
    });

    it("routes uppercase hex block hash correctly", () => {
        const blockhash = "A".repeat(64);
        detectAndCall(rpc, blockhash);
        expect(rpc.call).toHaveBeenCalledWith("getblock", [blockhash, 2]);
    });

});


// ---------------------------------------------------------------------------
// BitcoinRPC.call — request construction
// ---------------------------------------------------------------------------

describe("BitcoinRPC.call — request payload", () => {

    let fetchMock;

    beforeEach(() => {
        fetchMock = vi.fn().mockResolvedValue({
            ok:   true,
            json: async () => ({ result: "ok", error: null }),
        });
        global.fetch = fetchMock;
    });

    it("sends POST to /bitcoin", async () => {
        const rpc = new BitcoinRPC();
        await rpc.call("getblockchaininfo");
        expect(fetchMock.mock.calls[0][0]).toBe("/bitcoin");
        expect(fetchMock.mock.calls[0][1].method).toBe("POST");
    });

    it("sets Content-Type application/json — no Authorization header", async () => {
        const rpc = new BitcoinRPC();
        await rpc.call("getblockchaininfo");
        const headers = fetchMock.mock.calls[0][1].headers;
        expect(headers["Content-Type"]).toBe("application/json");
        expect(headers["Authorization"]).toBeUndefined();
    });

    it("sends credentials same-origin", async () => {
        const rpc = new BitcoinRPC();
        await rpc.call("getblockchaininfo");
        expect(fetchMock.mock.calls[0][1].credentials).toBe("same-origin");
    });

    it("builds a valid payload with method and params", async () => {
        const rpc = new BitcoinRPC();
        await rpc.call("getblockhash", [1000]);
        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body.method).toBe("getblockhash");
        expect(body.params).toEqual([1000]);
        expect(body.id).toBe("multichain-explorer");
    });

    it("returns the result field", async () => {
        const rpc = new BitcoinRPC();
        const result = await rpc.call("getblockchaininfo");
        expect(result).toBe("ok");
    });

    it("throws on HTTP error", async () => {
        fetchMock.mockResolvedValueOnce({ ok: false, status: 401, statusText: "Unauthorized" });
        const rpc = new BitcoinRPC();
        await expect(rpc.call("getblockchaininfo")).rejects.toThrow("HTTP error: 401");
    });

    it("throws on RPC-level error", async () => {
        fetchMock.mockResolvedValueOnce({
            ok:   true,
            json: async () => ({ result: null, error: { code: -32601, message: "Method not found" } }),
        });
        const rpc = new BitcoinRPC();
        await expect(rpc.call("unknownmethod")).rejects.toThrow("Method not found");
    });

});


// ---------------------------------------------------------------------------
// getMethods — registry completeness
// ---------------------------------------------------------------------------

describe("BitcoinRPC.getMethods", () => {

    it("returns an object with all 10 methods", () => {
        const rpc     = new BitcoinRPC();
        const methods = rpc.getMethods();
        const expected = [
            "getblockchaininfo", "getdeploymentinfo", "verifychain",
            "getchainstates", "getchaintips", "getdifficulty",
            "getmempoolinfo", "getrawmempool", "getblockcount", "getbestblockhash",
        ];
        expected.forEach(name => expect(methods).toHaveProperty(name));
        expect(Object.keys(methods)).toHaveLength(10);
    });

    it("each entry is a function", () => {
        const rpc     = new BitcoinRPC();
        const methods = rpc.getMethods();
        Object.values(methods).forEach(fn => expect(typeof fn).toBe("function"));
    });

});






