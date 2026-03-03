"""
server/backend/tests/test_bitcoin_client.py
============================================
Unit tests for BitcoinClient.
All network calls are mocked — no node required.
"""

import pytest
from unittest.mock import patch, MagicMock
from src.blockchain_clients.bitcoin_client import BitcoinClient


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def env_vars(monkeypatch):
    """Inject required env vars for every test."""
    monkeypatch.setenv("BTC_RPC_ENDPOINT", "http://localhost:18443")
    monkeypatch.setenv("BTC_RPC_USER",     "user")
    monkeypatch.setenv("BTC_RPC_PASS",     "pass")


# ---------------------------------------------------------------------------
# Instantiation
# ---------------------------------------------------------------------------

class TestBitcoinClientInit:

    def test_instantiates_with_env_vars(self):
        client = BitcoinClient()
        assert client._endpoint == "http://localhost:18443"
        assert client._user     == "user"
        assert client._password == "pass"

    def test_raises_if_endpoint_missing(self, monkeypatch):
        monkeypatch.delenv("BTC_RPC_ENDPOINT")
        with pytest.raises(EnvironmentError, match="BTC_RPC_ENDPOINT"):
            BitcoinClient()

    def test_raises_if_user_missing(self, monkeypatch):
        monkeypatch.delenv("BTC_RPC_USER")
        with pytest.raises(EnvironmentError, match="BTC_RPC_USER"):
            BitcoinClient()

    def test_raises_if_pass_missing(self, monkeypatch):
        monkeypatch.delenv("BTC_RPC_PASS")
        with pytest.raises(EnvironmentError, match="BTC_RPC_PASS"):
            BitcoinClient()


# ---------------------------------------------------------------------------
# call()
# ---------------------------------------------------------------------------

class TestBitcoinClientCall:

    def _mock_response(self, result=None, error=None):
        mock = MagicMock()
        mock.json.return_value = {"result": result, "error": error}
        mock.raise_for_status = MagicMock()
        return mock

    def test_sends_correct_payload(self):
        client = BitcoinClient()
        with patch.object(client._session, "post", return_value=self._mock_response(result="ok")) as mock_post:
            client.call("getblockchaininfo")
            payload = mock_post.call_args[1]["json"]
            assert payload["jsonrpc"] == "1.0"
            assert payload["method"]  == "getblockchaininfo"
            assert payload["params"]  == []
            assert payload["id"]      == "multichain-explorer"

    def test_sends_params(self):
        client = BitcoinClient()
        with patch.object(client._session, "post", return_value=self._mock_response(result="hash")) as mock_post:
            client.call("getblockhash", [1000])
            payload = mock_post.call_args[1]["json"]
            assert payload["params"] == [1000]

    def test_returns_result(self):
        client = BitcoinClient()
        with patch.object(client._session, "post", return_value=self._mock_response(result={"chain": "regtest"})):
            result = client.call("getblockchaininfo")
            assert result == {"chain": "regtest"}

    def test_raises_runtime_error_on_rpc_error(self):
        client = BitcoinClient()
        with patch.object(client._session, "post", return_value=self._mock_response(error={"code": -32601, "message": "Method not found"})):
            with pytest.raises(RuntimeError):
                client.call("unknownmethod")

    def test_defaults_params_to_empty_list(self):
        client = BitcoinClient()
        with patch.object(client._session, "post", return_value=self._mock_response(result="ok")) as mock_post:
            client.call("getblockcount")
            payload = mock_post.call_args[1]["json"]
            assert payload["params"] == []



