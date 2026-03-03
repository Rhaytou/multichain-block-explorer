"""
server/backend/src/controllers.py
==================================
Controllers for the Multichain Block Explorer.

Each controller receives the Flask request, extracts the JSON-RPC payload,
forwards it to the appropriate node via the blockchain client, and returns
the result to the frontend.
"""

from flask import jsonify

from .blockchain_clients.bitcoin_client import BitcoinClient
from .blockchain_clients.ethereum_client import EthereumClient

# ---------------------------------------------------------------------------
# Bitcoin controller
# ---------------------------------------------------------------------------

def bitcoin_controller(req):
    """Forward a JSON-RPC request to the Bitcoin node.

    Expects a JSON body with at least a 'method' field.
    'params' is optional and defaults to [].

    Returns:
        JSON response with the node result or an error message.
    """
    body = req.get_json(silent=True)
    if not body or "method" not in body:
        return jsonify({"error": "Missing 'method' in request body."}), 400

    method = body["method"]
    params = body.get("params", [])

    try:
        result = BitcoinClient().call(method, params)
        return jsonify({"result": result}), 200
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Bitcoin node unreachable.", "detail": str(e)}), 503


# ---------------------------------------------------------------------------
# Ethereum controller
# ---------------------------------------------------------------------------

def ethereum_controller(req):
    """Forward a JSON-RPC request to the Ethereum node.

    Expects a JSON body with at least a 'method' field.
    'params' is optional and defaults to [].

    Returns:
        JSON response with the node result or an error message.
    """
    body = req.get_json(silent=True)
    if not body or "method" not in body:
        return jsonify({"error": "Missing 'method' in request body."}), 400

    method = body["method"]
    params = body.get("params", [])

    try:
        result = EthereumClient().call(method, params)
        return jsonify({"result": result}), 200
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Ethereum node unreachable.", "detail": str(e)}), 503