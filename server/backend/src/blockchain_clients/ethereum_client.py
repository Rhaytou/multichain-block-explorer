"""
server/backend/src/blockchain_clients/ethereum_client.py
=========================================================================
Ethereum JSON-RPC client for the Multichain Block Explorer.

Reads connection config from environment variables.
Used exclusively by controllers.py.

Usage:
    from .blockchain_clients.ethereum_client import EthereumClient

    client = EthereumClient()
    result = client.call("eth_blockNumber")
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()


# ---------------------------------------------------------------------------
# Client
# ---------------------------------------------------------------------------

class EthereumClient:
    """JSON-RPC client for the Ethereum node."""

    def __init__(self):
        self._endpoint = os.getenv("ETH_RPC_ENDPOINT")
        self._timeout  = 30

        if not self._endpoint:
            raise EnvironmentError("Missing ETH_RPC_ENDPOINT in .env")

        self._session = requests.Session()
        self._session.headers.update({"Content-Type": "application/json"})

    def call(self, method: str, params: list = None) -> dict:
        """Send a JSON-RPC 2.0 request to the Ethereum node.

        Args:
            method: Ethereum RPC method name (e.g. "eth_blockNumber").
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
            "jsonrpc": "2.0",
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



