"""
server/backend/tests/test_ethereum_client.py
=============================================
Unit tests for EthereumClient.
All network calls are mocked — no node required.
"""

import pytest
from unittest.mock import patch, MagicMock
from src.blockchain_clients.ethereum_client import EthereumClient


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def env_vars(monkeypatch):
    """Inject required env vars for every test."""
    monkeypatch.setenv("ETH_RPC_ENDPOINT", "http://localhost:8545")


# ---------------------------------------------------------------------------
# Instantiation
# ---------------------------------------------------------------------------

class TestEthereumClientInit:

    def test_instantiates_with_env_vars(self):
        client = EthereumClient()
        assert client._endpoint == "http://localhost:8545"

    def test_raises_if_endpoint_missing(self, monkeypatch):
        monkeypatch.delenv("ETH_RPC_ENDPOINT")
        with pytest.raises(EnvironmentError, match="ETH_RPC_ENDPOINT"):
            EthereumClient()

    def test_no_auth_header(self):
        client = EthereumClient()
        assert "Authorization" not in client._session.headers


# ---------------------------------------------------------------------------
# call()
# ---------------------------------------------------------------------------

class TestEthereumClientCall:

    def _mock_response(self, result=None, error=None):
        mock = MagicMock()
        mock.json.return_value = {"result": result, "error": error}
        mock.raise_for_status = MagicMock()
        return mock

    def test_sends_correct_payload(self):
        client = EthereumClient()
        with patch.object(client._session, "post", return_value=self._mock_response(result="0x1")) as mock_post:
            client.call("eth_blockNumber")
            payload = mock_post.call_args[1]["json"]
            assert payload["jsonrpc"] == "2.0"
            assert payload["method"]  == "eth_blockNumber"
            assert payload["params"]  == []
            assert payload["id"]      == "multichain-explorer"

    def test_sends_params(self):
        client = EthereumClient()
        with patch.object(client._session, "post", return_value=self._mock_response(result="0x0")) as mock_post:
            client.call("eth_getBalance", ["0xabc", "latest"])
            payload = mock_post.call_args[1]["json"]
            assert payload["params"] == ["0xabc", "latest"]

    def test_returns_result(self):
        client = EthereumClient()
        with patch.object(client._session, "post", return_value=self._mock_response(result="0x4b7")):
            result = client.call("eth_blockNumber")
            assert result == "0x4b7"

    def test_raises_runtime_error_on_rpc_error(self):
        client = EthereumClient()
        with patch.object(client._session, "post", return_value=self._mock_response(error={"code": -32601, "message": "Method not found"})):
            with pytest.raises(RuntimeError):
                client.call("eth_unknown")

    def test_defaults_params_to_empty_list(self):
        client = EthereumClient()
        with patch.object(client._session, "post", return_value=self._mock_response(result="0x1")) as mock_post:
            client.call("eth_syncing")
            payload = mock_post.call_args[1]["json"]
            assert payload["params"] == []





