"""
server/backend/src/blockchain_clients/bitcoin_client.py
=======================================================================
Bitcoin JSON-RPC client for the Multichain Block Explorer.

Reads connection config from environment variables.
Used exclusively by controllers.py.

Usage:
    from .blockchain_clients.bitcoin_client import BitcoinClient

    client = BitcoinClient()
    result = client.call("getblockchaininfo")
"""

import os
import requests
from requests.auth import HTTPBasicAuth
from dotenv import load_dotenv

load_dotenv()


# ---------------------------------------------------------------------------
# Client
# ---------------------------------------------------------------------------

class BitcoinClient:
    """JSON-RPC client for the Bitcoin node."""

    def __init__(self):
        self._endpoint = os.getenv("BTC_RPC_ENDPOINT")
        self._user     = os.getenv("BTC_RPC_USER")
        self._password = os.getenv("BTC_RPC_PASS")
        self._timeout  = 30

        if not self._endpoint:
            raise EnvironmentError("Missing BTC_RPC_ENDPOINT in .env")
        if not self._user:
            raise EnvironmentError("Missing BTC_RPC_USER in .env")
        if not self._password:
            raise EnvironmentError("Missing BTC_RPC_PASS in .env")

        self._session = requests.Session()
        self._session.auth = HTTPBasicAuth(self._user, self._password)
        self._session.headers.update({"Content-Type": "application/json"})

    def call(self, method: str, params: list = None) -> dict:
        """Send a JSON-RPC 1.0 request to the Bitcoin node.

        Args:
            method: Bitcoin RPC method name (e.g. "getblockchaininfo").
            params: List of parameters. Default: [].

        Returns:
            The result field of the JSON-RPC response.

        Raises:
            RuntimeError: On RPC-level errors returned by the node.
            Exception:    On connection or HTTP errors.
        """
        if params is None:
            params = []

        payload = {
            "jsonrpc": "1.0",
            "id":      "multichain-explorer",
            "method":  method,
            "params":  params,
        }

        response = self._session.post(
            self._endpoint,
            json=payload,
            timeout=self._timeout,
        )
        response.raise_for_status()

        data = response.json()
        if data.get("error") is not None:
            raise RuntimeError(data["error"])

        return data["result"]




