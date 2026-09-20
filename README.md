# PyreWall Web

PyreWall Web is the browser-based edition of PyreWall, separated from the original PyQt6 desktop project.

The browser is the administration interface, while the actual firewall engine runs locally on the Windows host so it can use WinDivert, Windows Firewall, ARP, DNS filtering, SQLite, and PyreWall's packet-processing logic.

## Features

- Start and stop the WinDivert firewall engine from the browser
- Live firewall state and administrator-status monitoring
- Website/domain blocking using DNS, TLS SNI, HTTP Host, and resolved IPs
- Manual IP blocking
- Connected-device discovery through the Windows ARP table
- Device block/unblock through ARP and Windows Firewall rules
- Admin-defined application/service signatures
- Custom IP/port/protocol BLOCK and ALLOW rules
- Live upload/download traffic graph
- Threat-event viewer
- Searchable activity history
- User/admin account management
- SQLite-backed persistence
- Database backups
- Dark/light interface
- CSRF-protected state-changing actions
- Localhost-only binding by default

## Architecture

```text
Browser
   |
   | HTTP
   v
Flask web console
   |
   +-- PyreWall authentication + SQLite
   +-- WinDivert packet filter
   +-- DNS/domain filtering
   +-- ARP device controls
   +-- Windows Firewall / netsh
   +-- Live network telemetry
```

The browser itself does not filter operating-system packets. The privileged Python backend performs firewall enforcement on the Windows computer running PyreWall Web.

## Requirements

- Windows 10 or Windows 11
- Python 3
- Administrator privileges for firewall enforcement
- WinDivert runtime included in `assets/dll/`

Install the Python dependencies:

```powershell
python -m pip install -r requirements-web.txt
```

## Run

The easiest option is:

```text
run_web_admin.bat
```

The launcher requests Administrator privileges and starts the local web console.

Or run it manually from an elevated PowerShell / Command Prompt:

```powershell
python web_app.py
```

Then open:

```text
http://127.0.0.1:8765
```

## Initial Login

On a fresh database, PyreWall creates the default administrator:

```text
Username: admin
Password: admin
```

Change the password immediately after first login from **User Management**.

## Trusted LAN Access

To intentionally manage PyreWall from another device on the same trusted LAN or hotspot:

```powershell
python web_app.py --host 0.0.0.0 --port 8765
```

Then browse to the Windows host's LAN IP on port `8765`.

Do not expose the PyreWall administration console directly to the public internet.

## Why It Is Not a Vercel App

PyreWall Web cannot perform real firewall enforcement from Vercel or a normal serverless host. WinDivert, Windows Firewall, ARP, and the machine's packet stream exist on the Windows host being protected or acting as the network gateway.

The web interface is therefore a **self-hosted local control plane** for the firewall engine.

## Repository Layout

```text
Pyrewall-Web/
├── web_app.py
├── requirements-web.txt
├── run_web_admin.bat
├── assets/
│   └── dll/
├── core/
├── db/
└── web/
    ├── templates/
    └── static/
```

Runtime databases, logs, backups, and Python cache files are excluded from source control.

## Original Desktop PyreWall

The original PyQt6 desktop version remains separately maintained in:

**Sachibara/Pyrewall**

This repository is dedicated only to the browser-based edition.

## Developer

**Jim Rodmark Camus**  
BSIT — Network Technology  
GitHub: [@Sachibara](https://github.com/Sachibara)
