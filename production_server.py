from __future__ import annotations

import os
import secrets
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SECRET_FILE = ROOT / "db" / "web_secret.txt"

# Keep Flask sessions valid across service restarts without committing a secret.
if not os.environ.get("PYREWALL_WEB_SECRET"):
    SECRET_FILE.parent.mkdir(parents=True, exist_ok=True)
    if SECRET_FILE.exists():
        secret = SECRET_FILE.read_text(encoding="utf-8").strip()
    else:
        secret = secrets.token_hex(32)
        SECRET_FILE.write_text(secret, encoding="utf-8")
    os.environ["PYREWALL_WEB_SECRET"] = secret

from waitress import serve
from web_app import app, apply_runtime_settings, init_web_schema, load_settings

HOST = os.environ.get("PYREWALL_WEB_HOST", "127.0.0.1")
PORT = int(os.environ.get("PYREWALL_WEB_PORT", "8765"))


def main():
    init_web_schema()
    apply_runtime_settings(load_settings())

    if HOST not in {"127.0.0.1", "localhost", "::1"}:
        print(
            "[PyreWall] WARNING: production console is reachable beyond localhost. "
            "Use only on a trusted LAN."
        )

    print(f"[PyreWall] Production web console: http://{HOST}:{PORT}")
    print("[PyreWall] Administrator privileges are required for firewall enforcement.")
    serve(app, host=HOST, port=PORT, threads=8, channel_timeout=60)


if __name__ == "__main__":
    main()
