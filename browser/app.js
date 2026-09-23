(() => {
  "use strict";

  const KEY = "pyrewall_browser_workspace_v1";
  const $ = (id) => document.getElementById(id);
  const qsa = (s, r = document) => [...r.querySelectorAll(s)];
  const pageMeta = {
    overview: ["Unified security operations", "Security Overview"],
    devices: ["Network access control", "Devices"],
    network: ["Website filtering", "Web Control"],
    rules: ["Policy engine", "Firewall Rules"],
    signatures: ["Application control", "Applications"],
    threats: ["Security events", "Threat Center"],
    traffic: ["Network telemetry", "Traffic Analytics"],
    history: ["Audit trail", "Audit History"],
    settings: ["Windows enforcement", "Engine & Settings"]
  };

  const seed = () => {
    const now = Date.now();
    const ago = (minutes) => new Date(now - minutes * 60000).toISOString();
    return {
      domains: ["example-social.test", "*.streaming.example"],
      ips: ["203.0.113.25", "198.51.100.44"],
      rules: [
        { id: 1, ip: "198.51.100.20", port: "443", protocol: "TCP", action: "BLOCK", source: "Manual" },
        { id: 2, ip: "10.0.0.53", port: "53", protocol: "UDP", action: "ALLOW", source: "Infrastructure" },
        { id: 3, ip: "0.0.0.0/0", port: "443", protocol: "UDP", action: "BLOCK", source: "QUIC Policy" }
      ],
      signatures: [
        { id: 1, name: "Example Chat", host: "*.chat.example", domain: "chat.example", range: "", protocol: "ANY" },
        { id: 2, name: "Example Stream", host: "*.video.example", domain: "video.example", range: "203.0.113.0/24", protocol: "TCP" }
      ],
      devices: [
        { id: "D1", hostname: "JIM-LAPTOP", ip: "192.168.137.1", mac: "3C:52:82:AA:10:01", owner: "Administrator", status: "Allowed", lastSeen: ago(1) },
        { id: "D2", hostname: "OPPO-A16", ip: "192.168.137.102", mac: "8A:12:4F:31:B2:19", owner: "Mobile test device", status: "Allowed", lastSeen: ago(2) },
        { id: "D3", hostname: "UNKNOWN-7C21", ip: "192.168.137.115", mac: "7C:21:9A:CC:55:03", owner: "Unassigned", status: "Unknown", lastSeen: ago(4) },
        { id: "D4", hostname: "BLOCKED-DEVICE", ip: "192.168.137.120", mac: "A2:44:17:21:10:90", owner: "Policy test", status: "Blocked", lastSeen: ago(18) }
      ],
      threats: [
        { id: "T1", severity: "Critical", status: "Open", src: "192.168.137.115", dst: "198.51.100.44", protocol: "TCP", title: "Blocked destination contact", description: "Unknown device attempted repeated connections to a blocked destination.", at: ago(6) },
        { id: "T2", severity: "High", status: "Open", src: "192.168.137.102", dst: "203.0.113.25", protocol: "UDP", title: "QUIC bypass attempt", description: "UDP/443 traffic matched the QUIC visibility policy.", at: ago(12) },
        { id: "T3", severity: "Medium", status: "Acknowledged", src: "192.168.137.120", dst: "1.1.1.1", protocol: "HTTPS", title: "Possible DoH usage", description: "Traffic matched a known encrypted-DNS pattern.", at: ago(32) },
        { id: "T4", severity: "Low", status: "Resolved", src: "192.168.137.102", dst: "192.168.137.1", protocol: "ARP", title: "Device identity refreshed", description: "ARP mapping changed and was re-identified.", at: ago(75) }
      ],
      traffic: {
        upload: [1.2,1.6,1.4,1.8,2.1,1.9,2.4,2.2,2.7,3.0,2.5,2.3,2.8,3.1,2.9,3.4,3.2,3.0,3.5,3.1,2.8,3.3,3.0,3.2],
        download: [4.2,4.8,4.5,5.1,5.4,5.0,5.8,5.5,6.2,6.8,6.0,5.7,6.4,6.9,6.6,7.1,6.8,6.5,7.3,6.9,6.4,7.0,6.7,6.9],
        protocols: { HTTPS: 56, DNS: 12, QUIC: 18, Other: 14 },
        destinations: [
          { name: "Cloud services", host: "203.0.113.25", mb: 182 },
          { name: "Software updates", host: "198.51.100.60", mb: 96 },
          { name: "DNS infrastructure", host: "10.0.0.53", mb: 41 },
          { name: "Local gateway", host: "192.168.137.1", mb: 22 }
        ]
      },
      engine: { running: false, ready: false, mode: "demo" },
      settings: { disable_quic: true, block_doh: false, enable_ip_blocking: true, temp_ip_ttl: 900 },
      history: [
        { at: ago(2), action: "Workspace initialized", detail: "PyreWall Unified security workspace created." },
        { at: ago(6), action: "Threat blocked", detail: "Unknown device attempted access to a blocked destination." },
        { at: ago(12), action: "QUIC policy matched", detail: "UDP/443 traffic matched application visibility policy." }
      ]
    };
  };

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const defaults = seed();
        return {
          ...defaults,
          ...parsed,
          devices: Array.isArray(parsed.devices) ? parsed.devices : defaults.devices,
          threats: Array.isArray(parsed.threats) ? parsed.threats : defaults.threats,
          traffic: parsed.traffic || defaults.traffic,
          engine: { ...defaults.engine, ...(parsed.engine || {}) },
          settings: { ...defaults.settings, ...(parsed.settings || {}) }
        };
      }
    } catch (_) {}
    return seed();
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
    renderAll();
  }

  function log(action, detail) {
    state.history.unshift({ at: new Date().toISOString(), action, detail });
    state.history = state.history.slice(0, 200);
  }

  function esc(v) {
    return String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function toast(title, msg = "") {
    const n = document.createElement("div");
    n.className = "toast";
    n.innerHTML = "<strong>" + esc(title) + "</strong><span>" + esc(msg) + "</span>";
    $("toastRegion").appendChild(n);
    setTimeout(() => n.remove(), 3500);
  }

  function openPage(page) {
    qsa("[data-panel]").forEach((p) => p.classList.toggle("active", p.dataset.panel === page));
    qsa("[data-page]").forEach((b) => b.classList.toggle("active", b.dataset.page === page));
    $("pageEyebrow").textContent = pageMeta[page][0];
    $("pageTitle").textContent = pageMeta[page][1];
  }

  qsa("[data-page]").forEach((b) => b.addEventListener("click", () => openPage(b.dataset.page)));
  qsa("[data-go]").forEach((b) => b.addEventListener("click", () => openPage(b.dataset.go)));

  function renderOverview() {
    $("statDomains").textContent = state.domains.length;
    $("statIps").textContent = state.ips.length;
    $("statRules").textContent = state.rules.length;
    $("statSigs").textContent = state.signatures.length;
    $("statThreats").textContent = state.threats.filter((t) => t.status !== "Resolved").length;
    $("securityScore").textContent = securityScore();

    renderTrafficChart("uploadLine", "downloadLine");
    renderThreatBars();

    $("recentThreats").innerHTML = state.threats.filter((t) => t.status !== "Resolved").slice(0, 5).map((t) =>
      '<div class="list-row"><div><strong>' + esc(t.title) + '</strong><small>' +
      esc(t.src + " → " + t.dst + " · " + t.description) +
      '</small></div><span class="' + (t.severity === "Critical" || t.severity === "High" ? "action-block" : "action-allow") + '">' +
      esc(t.severity) + "</span></div>"
    ).join("") || '<div class="empty">No active threats.</div>';

    $("recentHistory").innerHTML = state.history.slice(0, 6).map((h) =>
      '<div class="list-row"><div><strong>' + esc(h.action) + "</strong><small>" + esc(h.detail) +
      '</small></div><small>' + new Date(h.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + "</small></div>"
    ).join("") || '<div class="empty">No history yet.</div>';
  }

  function renderNetwork() {
    $("domainList").innerHTML = state.domains.map((d, i) =>
      '<div class="list-row"><div><strong>' + esc(d) +
      '</strong><small>Browser-persistent domain policy</small></div><button class="mini-btn danger" data-domain-remove="' +
      i + '">Remove</button></div>'
    ).join("") || '<div class="empty">No blocked domains.</div>';

    $("ipList").innerHTML = state.ips.map((ip, i) =>
      '<div class="list-row"><div><strong>' + esc(ip) +
      '</strong><small>Manual browser-persistent IP policy</small></div><button class="mini-btn danger" data-ip-remove="' +
      i + '">Remove</button></div>'
    ).join("") || '<div class="empty">No blocked IPs.</div>';

    qsa("[data-domain-remove]").forEach((b) => b.addEventListener("click", () => {
      const d = state.domains.splice(Number(b.dataset.domainRemove), 1)[0];
      log("Domain removed", d);
      save();
      toast("Domain removed", d);
    }));

    qsa("[data-ip-remove]").forEach((b) => b.addEventListener("click", () => {
      const ip = state.ips.splice(Number(b.dataset.ipRemove), 1)[0];
      log("IP removed", ip);
      save();
      toast("IP removed", ip);
    }));
  }

  function renderRules() {
    $("ruleTable").innerHTML = state.rules.map((r) =>
      "<tr><td>" + r.id + "</td><td>" + esc(r.ip) + "</td><td>" + esc(r.port) + "</td><td>" +
      esc(r.protocol) + '</td><td class="' + (r.action === "BLOCK" ? "action-block" : "action-allow") + '">' +
      esc(r.action) + '</td><td><button class="mini-btn danger" data-rule-remove="' + r.id + '">Remove</button></td></tr>'
    ).join("") || '<tr><td colspan="6" class="empty">No firewall rules.</td></tr>';

    qsa("[data-rule-remove]").forEach((b) => b.addEventListener("click", () => {
      const id = Number(b.dataset.ruleRemove);
      const r = state.rules.find((x) => x.id === id);
      state.rules = state.rules.filter((x) => x.id !== id);
      log("Rule removed", r ? r.action + " " + r.protocol + " " + r.ip + ":" + r.port : "Rule " + id);
      save();
      toast("Rule removed", "Workspace updated.");
    }));
  }

  function renderSignatures() {
    $("sigTable").innerHTML = state.signatures.map((s) =>
      "<tr><td>" + esc(s.name) + "</td><td>" + esc(s.host || "—") + "</td><td>" + esc(s.domain || "—") +
      "</td><td>" + esc(s.range || "—") + "</td><td>" + esc(s.protocol) +
      '</td><td><button class="mini-btn danger" data-sig-remove="' + s.id + '">Remove</button></td></tr>'
    ).join("") || '<tr><td colspan="6" class="empty">No application signatures.</td></tr>';

    qsa("[data-sig-remove]").forEach((b) => b.addEventListener("click", () => {
      const id = Number(b.dataset.sigRemove);
      const s = state.signatures.find((x) => x.id === id);
      state.signatures = state.signatures.filter((x) => x.id !== id);
      log("Signature removed", s ? s.name : "Signature " + id);
      save();
      toast("Signature removed", s ? s.name : "");
    }));
  }

  function renderHistory() {
    $("historyList").innerHTML = state.history.map((h) =>
      '<div class="list-row"><time>' + new Date(h.at).toLocaleString() + "</time><div><strong>" +
      esc(h.action) + "</strong><small>" + esc(h.detail) + "</small></div></div>"
    ).join("") || '<div class="empty">No workspace history.</div>';
  }

  function renderSettings() {
    $("quicToggle").checked = !!state.settings.disable_quic;
    $("dohToggle").checked = !!state.settings.block_doh;
    $("ttlInput").value = state.settings.temp_ip_ttl || 900;
    if ($("ipBlockToggle")) $("ipBlockToggle").checked = state.settings.enable_ip_blocking !== false;
  }

  function securityScore() {
    const active = state.threats.filter((t) => t.status !== "Resolved");
    const penalty = active.reduce((sum, t) => sum + (t.severity === "Critical" ? 12 : t.severity === "High" ? 8 : t.severity === "Medium" ? 4 : 2), 0);
    const unknownPenalty = state.devices.filter((d) => d.status === "Unknown").length * 4;
    let score = 90 - penalty - unknownPenalty;
    if (state.settings.disable_quic) score += 2;
    if (state.settings.enable_ip_blocking !== false) score += 3;
    if (state.settings.block_doh) score += 2;
    return Math.max(35, Math.min(100, score));
  }

  function renderTrafficChart(uploadId, downloadId) {
    if (!$(uploadId) || !$(downloadId)) return;
    const up = state.traffic.upload.slice(-24);
    const down = state.traffic.download.slice(-24);
    const max = Math.max(8, ...up, ...down);
    const x0 = 48, x1 = 742, y0 = 30, y1 = 232;
    const points = (arr) => arr.map((v, i) => ({
      x: x0 + (x1 - x0) * i / Math.max(1, arr.length - 1),
      y: y1 - (v / max) * (y1 - y0)
    }));
    const a = points(up), b = points(down);
    $(uploadId).setAttribute("points", a.map((p) => p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" "));
    $(downloadId).setAttribute("points", b.map((p) => p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" "));
  }

  function renderThreatBars() {
    if (!$("threatBars")) return;
    const levels = ["Critical", "High", "Medium", "Low"];
    const counts = levels.map((s) => state.threats.filter((t) => t.severity === s && t.status !== "Resolved").length);
    const max = Math.max(1, ...counts);
    $("threatBars").innerHTML = levels.map((s, i) =>
      '<div class="threat-row"><span>' + s + '</span><div class="threat-track"><div class="threat-fill sev-' +
      s.toLowerCase() + '" style="width:' + Math.round(counts[i] / max * 100) + '%"></div></div><b>' + counts[i] + '</b></div>'
    ).join("");
  }

  function renderDevices() {
    if (!$("deviceTable")) return;
    const q = $("deviceSearch").value.toLowerCase().trim();
    const f = $("deviceStatusFilter").value;
    const rows = state.devices.filter((d) =>
      (!q || [d.hostname,d.ip,d.mac,d.owner].join(" ").toLowerCase().includes(q)) &&
      (!f || d.status === f)
    );
    $("deviceTable").innerHTML = rows.map((d) =>
      '<tr><td><strong>' + esc(d.hostname) + '</strong><br><small>' + esc(d.owner) + '</small></td><td>' + esc(d.ip) +
      '</td><td>' + esc(d.mac) + '</td><td>' + esc(d.owner) + '</td><td><span class="' +
      (d.status === "Blocked" ? "action-block" : d.status === "Allowed" ? "action-allow" : "") + '">' + esc(d.status) +
      '</span></td><td>' + new Date(d.lastSeen).toLocaleString() + '</td><td><button class="mini-btn ' +
      (d.status === "Blocked" ? "" : "danger") + '" data-device-toggle="' + d.id + '">' +
      (d.status === "Blocked" ? "Unblock" : "Block") + '</button></td></tr>'
    ).join("") || '<tr><td colspan="7" class="empty">No devices match.</td></tr>';
    qsa("[data-device-toggle]").forEach((b) => b.addEventListener("click", () => {
      const d = state.devices.find((x) => x.id === b.dataset.deviceToggle);
      if (!d) return;
      d.status = d.status === "Blocked" ? "Allowed" : "Blocked";
      log("Device " + d.status.toLowerCase(), d.hostname + " · " + d.ip);
      save();
      toast("Device " + d.status, d.hostname);
    }));
  }

  function renderThreats() {
    if (!$("threatList")) return;
    const active = state.threats.filter((t) => t.status !== "Resolved");
    const critical = active.filter((t) => t.severity === "Critical").length;
    const high = active.filter((t) => t.severity === "High").length;
    const acknowledged = active.filter((t) => t.status === "Acknowledged").length;
    $("threatSummary").innerHTML = [
      ["Active", active.length, "unresolved events"],
      ["Critical", critical, "immediate"],
      ["High", high, "elevated"],
      ["Acknowledged", acknowledged, "under review"]
    ].map((x) => '<article class="summary-card"><span>' + x[0] + '</span><strong>' + x[1] + '</strong><small>' + x[2] + '</small></article>').join("");

    $("threatList").innerHTML = state.threats.map((t) =>
      '<div class="threat-card ' + t.severity + '"><div><strong>' + esc(t.severity) + '</strong><br><time>' +
      new Date(t.at).toLocaleString() + '</time></div><div><h4>' + esc(t.title) + '</h4><p>' +
      esc(t.src + " → " + t.dst + " · " + t.protocol + " · " + t.description) + '</p></div><div><span class="' +
      (t.status === "Resolved" ? "action-allow" : "action-block") + '">' + esc(t.status) + '</span>' +
      (t.status !== "Resolved" ? ' <button class="mini-btn" data-threat-ack="' + t.id + '">Ack</button> <button class="mini-btn" data-threat-resolve="' + t.id + '">Resolve</button>' : '') +
      '</div></div>'
    ).join("");

    qsa("[data-threat-ack]").forEach((b) => b.addEventListener("click", () => {
      const t = state.threats.find((x) => x.id === b.dataset.threatAck);
      if (!t) return;
      t.status = "Acknowledged";
      log("Threat acknowledged", t.title);
      save();
    }));
    qsa("[data-threat-resolve]").forEach((b) => b.addEventListener("click", () => {
      const t = state.threats.find((x) => x.id === b.dataset.threatResolve);
      if (!t) return;
      t.status = "Resolved";
      log("Threat resolved", t.title);
      save();
    }));
  }

  function renderTraffic() {
    if (!$("trafficKpis")) return;
    const up = state.traffic.upload.at(-1) || 0;
    const down = state.traffic.download.at(-1) || 0;
    const total = state.traffic.destinations.reduce((s, d) => s + d.mb, 0);
    $("trafficKpis").innerHTML = [
      ["Upload", up.toFixed(1) + " Mbps", "latest sample"],
      ["Download", down.toFixed(1) + " Mbps", "latest sample"],
      ["Modeled", total + " MB", "destinations"],
      ["Samples", state.traffic.upload.length, "retained"]
    ].map((x) => '<article class="summary-card"><span>' + x[0] + '</span><strong>' + x[1] + '</strong><small>' + x[2] + '</small></article>').join("");
    renderTrafficChart("uploadLineLarge", "downloadLineLarge");
    $("protocolMix").innerHTML = Object.entries(state.traffic.protocols).map(([name, value]) =>
      '<div class="protocol-row"><span>' + esc(name) + '</span><div class="protocol-track"><div class="protocol-fill" style="width:' +
      value + '%"></div></div><b>' + value + '%</b></div>'
    ).join("");
    $("topDestinations").innerHTML = state.traffic.destinations.map((d) =>
      '<div class="list-row"><div><strong>' + esc(d.name) + '</strong><small>' + esc(d.host) + '</small></div><b>' + d.mb + ' MB</b></div>'
    ).join("");
  }

  function renderAll() {
    renderOverview();
    renderDevices();
    renderNetwork();
    renderRules();
    renderSignatures();
    renderThreats();
    renderTraffic();
    renderHistory();
    renderSettings();
  }

  $("domainForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const value = $("domainInput").value.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "");
    if (!value) return;
    if (state.domains.includes(value)) {
      toast("Already listed", value);
      return;
    }
    state.domains.push(value);
    $("domainInput").value = "";
    log("Domain added", value);
    save();
    toast("Domain added", value);
  });

  $("ipForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const value = $("ipInput").value.trim();
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) {
      toast("Invalid IP", "Enter an IPv4 address.");
      return;
    }
    if (state.ips.includes(value)) {
      toast("Already listed", value);
      return;
    }
    state.ips.push(value);
    $("ipInput").value = "";
    log("IP added", value);
    save();
    toast("IP added", value);
  });

  $("ruleForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const ip = $("ruleIp").value.trim();
    const port = $("rulePort").value.trim() || "ANY";
    const protocol = $("ruleProtocol").value;
    const action = $("ruleAction").value;
    if (!ip) return;
    const id = Math.max(0, ...state.rules.map((r) => r.id)) + 1;
    state.rules.push({ id, ip, port, protocol, action });
    $("ruleIp").value = "";
    $("rulePort").value = "ANY";
    log("Rule added", action + " " + protocol + " " + ip + ":" + port);
    save();
    toast("Rule added", action + " " + ip);
  });

  $("sigForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("sigName").value.trim();
    if (!name) return;
    const id = Math.max(0, ...state.signatures.map((s) => s.id)) + 1;
    state.signatures.push({
      id,
      name,
      host: $("sigHost").value.trim(),
      domain: $("sigDomain").value.trim(),
      range: $("sigRange").value.trim(),
      protocol: $("sigProtocol").value
    });
    ["sigName", "sigHost", "sigDomain", "sigRange"].forEach((id) => $(id).value = "");
    log("Signature added", name);
    save();
    toast("Signature added", name);
  });

  $("saveSettingsBtn").addEventListener("click", () => {
    state.settings.disable_quic = $("quicToggle").checked;
    state.settings.block_doh = $("dohToggle").checked;
    state.settings.enable_ip_blocking = $("ipBlockToggle") ? $("ipBlockToggle").checked : true;
    state.settings.temp_ip_ttl = Math.max(30, Math.min(86400, Number($("ttlInput").value) || 900));
    log("Settings updated", "Browser policy settings saved.");
    save();
    toast("Settings saved", "Persistent browser workspace updated.");
  });

  $("clearHistoryBtn").addEventListener("click", () => {
    state.history = [];
    save();
    toast("History cleared", "Workspace history removed.");
  });

  $("resetBtn").addEventListener("click", () => {
    if (!confirm("Reset this browser workspace?")) return;
    state = seed();
    save();
    toast("Workspace reset", "Initial policy state restored.");
  });

  $("exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ version: 1, exported_at: new Date().toISOString(), workspace: state }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pyrewall-browser-workspace.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  $("importInput").addEventListener("change", async () => {
    const file = $("importInput").files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const next = parsed.workspace || parsed;
      if (!next || !Array.isArray(next.domains) || !Array.isArray(next.rules)) throw new Error("Invalid workspace file.");
      const defaults = seed();
      state = { ...defaults, ...next, settings: { ...defaults.settings, ...(next.settings || {}) } };
      log("Workspace imported", file.name);
      save();
      toast("Workspace imported", file.name);
    } catch (e) {
      toast("Import failed", e.message);
    }
    $("importInput").value = "";
  });

  if ($("deviceSearch")) $("deviceSearch").addEventListener("input", renderDevices);
  if ($("deviceStatusFilter")) $("deviceStatusFilter").addEventListener("change", renderDevices);
  if ($("discoverBtn")) $("discoverBtn").addEventListener("click", () => {
    state.devices.forEach((d, i) => { d.lastSeen = new Date(Date.now() - i * 45000).toISOString(); });
    log("Device discovery refreshed", "Simulated ARP inventory refresh completed.");
    save();
    toast("Discovery complete", state.devices.length + " devices refreshed.");
  });
  if ($("generateThreatBtn")) $("generateThreatBtn").addEventListener("click", () => {
    const levels = ["Low","Medium","High","Critical"];
    const severity = levels[state.threats.length % levels.length];
    const d = state.devices[state.threats.length % state.devices.length];
    state.threats.unshift({
      id: "T" + Date.now(),
      severity,
      status: "Open",
      src: d.ip,
      dst: "203.0.113." + (50 + state.threats.length),
      protocol: "TCP",
      title: "Simulated security event",
      description: "Portfolio-safe sample threat generated for demonstration.",
      at: new Date().toISOString()
    });
    log("Threat event generated", severity + " sample event from " + d.hostname);
    save();
    toast("Sample threat generated", severity);
  });
  if ($("sampleTrafficBtn")) $("sampleTrafficBtn").addEventListener("click", () => {
    const i = state.history.length;
    const u = state.traffic.upload.at(-1) || 2;
    const d = state.traffic.download.at(-1) || 6;
    state.traffic.upload.push(Math.max(.3, Math.round((u + (((i * 3) % 9) - 4) * .18) * 10) / 10));
    state.traffic.download.push(Math.max(.5, Math.round((d + (((i * 5) % 11) - 5) * .28) * 10) / 10));
    state.traffic.upload = state.traffic.upload.slice(-48);
    state.traffic.download = state.traffic.download.slice(-48);
    log("Traffic sampled", "Demo telemetry sample added.");
    save();
    toast("Traffic sampled", "Telemetry updated.");
  });

  renderAll();
})();