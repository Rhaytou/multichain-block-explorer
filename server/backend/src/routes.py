"""
server/backend/src/routes.py
============================
Flask route definitions for the Multichain Block Explorer.

Routes:
    GET  /                      — Health check
    GET  /blockchainexplorer    — Serves the React app (index.html)
                                  Issues a session cookie on first visit.
                                  Cookie stores issued_at timestamp.
                                  Session expires after 2 hours.
    GET  /assets/<filename>     — Serves Vite static assets (JS, CSS, images)
    POST /bitcoin               — Validates cookie age, proxies to Bitcoin node
    POST /ethereum              — Validates cookie age, proxies to Ethereum node
"""

import uuid
from datetime import datetime, timezone, timedelta
from functools import wraps
from flask import request, jsonify, send_from_directory, make_response

from .controllers import bitcoin_controller, ethereum_controller


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

FRONTEND_DIST   = "/frontend/dist"
COOKIE_NAME     = "explorer_session"
SESSION_HOURS   = 2
SESSION_SECONDS = SESSION_HOURS * 60 * 60   # 7200 seconds


# ---------------------------------------------------------------------------
# Cookie helpers
# ---------------------------------------------------------------------------

def _issue_cookie(response):
    """Attach a new session cookie to the response.

    The cookie value is: <uuid>|<issued_at_utc_isoformat>
    This lets the server verify session age on every request.
    """
    token      = str(uuid.uuid4())
    issued_at  = datetime.now(timezone.utc).isoformat()
    value      = f"{token}|{issued_at}"

    response.set_cookie(
        COOKIE_NAME,
        value=value,
        max_age=SESSION_SECONDS,
        httponly=True,
        samesite="Lax",
    )


def _is_session_valid(cookie_value):
    """Return True if the cookie exists and was issued less than 2h ago."""
    if not cookie_value:
        return False
    try:
        _, issued_at_str = cookie_value.split("|", 1)
        issued_at = datetime.fromisoformat(issued_at_str)
        elapsed   = datetime.now(timezone.utc) - issued_at
        return elapsed < timedelta(hours=SESSION_HOURS)
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Cookie guard decorator
# Applied to /bitcoin and /ethereum routes.
# Returns 401 if no cookie or session older than 2h.
# ---------------------------------------------------------------------------

def require_session(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        cookie = request.cookies.get(COOKIE_NAME)
        if not _is_session_valid(cookie):
            return jsonify({
                "error": "Session expired or missing. Visit /blockchainexplorer to start a new session."
            }), 401
        return f(*args, **kwargs)
    return decorated


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

def init_routes(app):

    # ------------------------------------------------------------------
    # Health check
    # ------------------------------------------------------------------
    @app.route("/", methods=["GET"])
    def health_check():
        return jsonify({"status": "ok"}), 200


    # ------------------------------------------------------------------
    # Block explorer — serves React app + issues session cookie
    # ------------------------------------------------------------------
    @app.route("/blockchainexplorer", methods=["GET"])
    def blockchainexplorer_route():
        response = make_response(
            send_from_directory(FRONTEND_DIST, "index.html")
        )

        # Issue cookie only on first visit — never reissue
        if not request.cookies.get(COOKIE_NAME):
            _issue_cookie(response)

        return response


    # ------------------------------------------------------------------
    # Serve Vite static assets (JS, CSS, images)
    # Vite outputs all hashed files under /assets/
    # ------------------------------------------------------------------
    @app.route("/assets/<path:filename>", methods=["GET"])
    def assets(filename):
        return send_from_directory(f"{FRONTEND_DIST}/assets", filename)


    # ------------------------------------------------------------------
    # Bitcoin RPC proxy
    # ------------------------------------------------------------------
    @app.route("/bitcoin", methods=["POST"])
    @require_session
    def bitcoin_route():
        return bitcoin_controller(request)


    # ------------------------------------------------------------------
    # Ethereum RPC proxy
    # ------------------------------------------------------------------
    @app.route("/ethereum", methods=["POST"])
    @require_session
    def ethereum_route():
        return ethereum_controller(request)