(() => {
  "use strict";

  const KEY = "pyrewall_browser_workspace_v1";
  const $ = (id) => document.getElementById(id);
  const qsa = (s, r = document) => [...r.querySelectorAll(s)];
  const pageMeta = {
    overview: ["Firewall policy", "Overview"],
    network: ["Network control", "Network Control"],
    rules: ["Policy management", "Firewall Rules"],
    signatures: ["Application policy", "App Signatures"],
    history: ["Audit trail", "History"],
    settings: ["Configuration", "Settings"]
  };

  const seed = () => ({
    domains: ["example-social.test"],
    ips: ["203.0.113.25"],
    rules: [
      { id: 1, ip: "198.51.100.20", port: "443", protocol: "TCP", action: "BLOCK" },
      { id: 2, ip: "10.0.0.53", port: "53", protocol: "UDP", action: "ALLOW" }
    ],
    signatures: [
      { id: 1, name: "Example Chat", host: "*.chat.example", domain: "chat.example", range: "", protocol: "ANY" }
    ],
    settings: { disable_quic: true, block_doh: false, temp_ip_ttl: 900 },
    history: [
      { at: new Date().toISOString(), action: "Workspace initialized", detail: "Browser-local firewall policy workspace created." }
    ]
  });

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
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
    $("statHistory").textContent = state.history.length;

    $("recentRules").innerHTML = state.rules.slice(-5).reverse().map((r) =>
      '<div class="list-row"><div><strong>' + esc(r.action + " " + r.protocol + " " + r.ip + ":" + r.port) +
      '</strong><small>Browser policy rule</small></div><span class="' +
      (r.action === "BLOCK" ? "action-block" : "action-allow") + '">' + esc(r.action) + "</span></div>"
    ).join("") || '<div class="empty">No rules yet.</div>';

    $("recentHistory").innerHTML = state.history.slice(0, 5).map((h) =>
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
  }

  function renderAll() {
    renderOverview();
    renderNetwork();
    renderRules();
    renderSignatures();
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

  renderAll();
})();