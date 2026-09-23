(() => {
  "use strict";

  const KEY = "pyrewall_desktop_remake_v1";
  const SESSION_KEY = "pyrewall_demo_session_v1";
  const $ = (id) => document.getElementById(id);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const now = () => new Date().toISOString();

  function seedState() {
    const t = Date.now();
    const ago = (min) => new Date(t - min * 60000).toISOString();
    return {
      firewall: { running: false, ready: false },
      domains: ["example-social.test", "*.streaming.example"],
      devices: [
        { id:"D1", ip:"192.168.137.1", mac:"3C:52:82:AA:10:01", vendor:"Microsoft", type:"Gateway / Windows PC", hostname:"JIM-LAPTOP", status:"active", lastSeen:ago(1) },
        { id:"D2", ip:"192.168.137.102", mac:"8A:12:4F:31:B2:19", vendor:"OPPO", type:"Smartphone", hostname:"OPPO-A16", status:"active", lastSeen:ago(2) },
        { id:"D3", ip:"192.168.137.115", mac:"7C:21:9A:CC:55:03", vendor:"Unknown", type:"Unknown Device", hostname:"UNKNOWN-7C21", status:"active", lastSeen:ago(4) },
        { id:"D4", ip:"192.168.137.120", mac:"A2:44:17:21:10:90", vendor:"Unknown", type:"Unknown Device", hostname:"BLOCKED-DEVICE", status:"blocked", lastSeen:ago(18) }
      ],
      signatures: [
        { id:1, name:"Example Chat", pattern:"*.chat.example", ipRange:"", protocol:"ANY" },
        { id:2, name:"Example Stream", pattern:"*.video.example", ipRange:"203.0.113.0/24", protocol:"HTTPS" }
      ],
      rules: [
        { id:1, ip:"198.51.100.20", port:"443", protocol:"TCP", action:"BLOCK" },
        { id:2, ip:"10.0.0.53", port:"53", protocol:"UDP", action:"ALLOW" }
      ],
      threats: [
        { id:1, timestamp:ago(6), src:"192.168.137.115", dst:"198.51.100.44", protocol:"TCP", severity:"HIGH", description:"Blocked destination contact from unknown device." },
        { id:2, timestamp:ago(12), src:"192.168.137.102", dst:"203.0.113.25", protocol:"UDP", severity:"MEDIUM", description:"QUIC traffic matched visibility policy." },
        { id:3, timestamp:ago(32), src:"192.168.137.120", dst:"1.1.1.1", protocol:"HTTPS", severity:"LOW", description:"Possible encrypted DNS endpoint observed." }
      ],
      traffic: {
        download:[3.2,4.1,3.8,4.9,5.5,5.2,6.1,5.7,6.6,7.1,6.4,5.9,6.8,7.2,6.9,7.5,7.0,6.7,7.8,7.2,6.8,7.4,7.0,7.3,7.8,7.4,7.9,8.2,7.6,7.9],
        upload:[1.0,1.4,1.2,1.6,1.8,1.7,2.0,1.9,2.2,2.5,2.1,2.0,2.4,2.6,2.3,2.8,2.6,2.4,2.9,2.7,2.4,2.8,2.6,2.7,3.0,2.8,3.1,3.0,2.9,3.1]
      },
      settings: {
        auto_start:false,
        detailed_logging:false,
        dark_mode:false,
        dns_proxy_enabled:true,
        create_netsh_blocks:true
      },
      users: [
        { username:"admin", password:"admin", role:"admin" },
        { username:"user", password:"user", role:"user" }
      ],
      history: [
        { timestamp:ago(1), username:"admin", action:"Workspace Opened", description:"PyreWall desktop-remake portfolio workspace initialized." },
        { timestamp:ago(6), username:"system", action:"Threat Logged", description:"Blocked destination contact from unknown device." },
        { timestamp:ago(12), username:"system", action:"QUIC Match", description:"UDP/443 traffic matched application visibility policy." },
        { timestamp:ago(30), username:"admin", action:"Block Domain", description:"example-social.test" }
      ],
      archivedHistory:[]
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return seedState();
      const saved = JSON.parse(raw);
      const defaults = seedState();
      return {
        ...defaults,
        ...saved,
        firewall:{...defaults.firewall,...(saved.firewall||{})},
        settings:{...defaults.settings,...(saved.settings||{})},
        users:Array.isArray(saved.users)&&saved.users.length?saved.users:defaults.users,
        archivedHistory:Array.isArray(saved.archivedHistory)?saved.archivedHistory:[]
      };
    } catch (_) {
      return seedState();
    }
  }

  let state = loadState();
  let currentUser = null;
  let selectedDomains = new Set();

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function log(action, description, username = currentUser?.username || "system") {
    state.history.unshift({ timestamp: now(), username, action, description });
    state.history = state.history.slice(0, 500);
    save();
  }

  function esc(v) {
    return String(v ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function toast(title, message = "") {
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = "<strong>" + esc(title) + "</strong><span>" + esc(message) + "</span>";
    $("toastRegion").appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  function setTab(tab) {
    if (tab === "users" && currentUser?.role !== "admin") return;
    qsa("[data-panel]").forEach(p => p.classList.toggle("active", p.dataset.panel === tab));
    qsa("[data-tab]").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
    if (tab === "overview") renderOverview();
    if (tab === "network") renderNetwork();
    if (tab === "threats") renderThreats();
    if (tab === "rules") renderRules();
    if (tab === "history") renderHistory();
    if (tab === "settings") renderSettings();
    if (tab === "users") renderUsers();
  }

  qsa("[data-tab]").forEach(b => b.addEventListener("click", () => setTab(b.dataset.tab)));
  qsa("[data-card-target]").forEach(b => b.addEventListener("click", () => setTab(b.dataset.cardTarget)));

  function applyRoleVisibility() {
    const admin = currentUser?.role === "admin";
    qsa(".admin-only").forEach(el => el.hidden = !admin);
  }

  function showApp(user) {
    currentUser = user;
    $("loginScreen").hidden = true;
    $("desktopApp").hidden = false;
    $("welcomeLabel").textContent = "Welcome, " + user.username + " 👋";
    applyRoleVisibility();
    applyTheme();
    renderAll();
    setTab("overview");
  }

  function doLogin() {
    const username = $("loginUsername").value.trim();
    const password = $("loginPassword").value;
    if (!username || !password) {
      toast("Warning", "Please enter both username and password.");
      return;
    }
    const user = state.users.find(u => u.username === username && u.password === password);
    if (!user) {
      log("Login Failed", "User login attempt failed.", username || "(blank)");
      toast("Login failed", "Invalid username or password.");
      return;
    }
    log("Login Success", "User login (" + user.role + ")", username);
    if ($("rememberMe").checked) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({username:user.username}));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
    $("firstRunBanner").hidden = true;
    showApp(user);
  }

  $("signInBtn").addEventListener("click", doLogin);
  ["loginUsername","loginPassword"].forEach(id => $(id).addEventListener("keydown", e => {
    if (e.key === "Enter") doLogin();
  }));
  $("forgotBtn").addEventListener("click", () => toast("Demo credentials", "Use admin / admin or user / user in the public portfolio remake."));
  $("logoutBtn").addEventListener("click", () => {
    if (!confirm("Are you sure you want to logout? Unsaved changes may be lost.")) return;
    log("Logged out", "Web remake session ended.");
    currentUser = null;
    localStorage.removeItem(SESSION_KEY);
    $("desktopApp").hidden = true;
    $("loginScreen").hidden = false;
    $("loginPassword").value = "";
  });

  function renderStatus() {
    const s = $("statusLabel");
    if (state.firewall.ready) {
      s.textContent = "Status: 🟢 Running";
      s.className = "status-label running";
      $("startFirewallBtn").disabled = true;
      $("stopFirewallBtn").disabled = false;
    } else if (state.firewall.running) {
      s.textContent = "Status: 🟡 Starting…";
      s.className = "status-label starting";
      $("startFirewallBtn").disabled = true;
      $("stopFirewallBtn").disabled = true;
    } else {
      s.textContent = "Status: 🔴 Stopped";
      s.className = "status-label stopped";
      $("startFirewallBtn").disabled = false;
      $("stopFirewallBtn").disabled = true;
    }
  }

  $("startFirewallBtn").addEventListener("click", () => {
    if (state.firewall.running || state.firewall.ready) {
      toast("Firewall", "⚙️ Firewall is already running.");
      return;
    }
    state.firewall.running = true;
    state.firewall.ready = false;
    renderStatus();
    save();
    setTimeout(() => {
      state.firewall.running = true;
      state.firewall.ready = true;
      log("Started firewall", "Portfolio mode simulated firewall start.");
      save();
      renderStatus();
      renderOverview();
      toast("Firewall", "✅ Firewall started successfully. Portfolio simulation only.");
    }, 650);
  });

  $("stopFirewallBtn").addEventListener("click", () => {
    if (!state.firewall.running && !state.firewall.ready) {
      toast("Firewall", "⚠️ Firewall is not currently running.");
      return;
    }
    if (!confirm("Stop the firewall?")) return;
    state.firewall.running = false;
    state.firewall.ready = false;
    log("Stopped firewall", "Portfolio mode simulated firewall stop.");
    save();
    renderStatus();
    renderOverview();
    toast("Firewall", "🛑 Firewall stopped successfully.");
  });

  function renderOverview() {
    $("overviewSites").textContent = state.domains.length;
    $("overviewDevices").textContent = state.devices.filter(d => d.status === "active").length;
    $("overviewSignatures").textContent = state.signatures.length;
    $("overviewUsers").textContent = state.users.length;
    $("overviewRules").textContent = state.rules.length;
    $("overviewThreats").textContent = state.threats.length;
    $("overviewHistoryRows").innerHTML = state.history.slice(0,12).map(h =>
      "<tr><td>" + esc(new Date(h.timestamp).toLocaleTimeString()) + "</td><td>" + esc(h.action) + "</td><td>" + esc(h.description) + "</td></tr>"
    ).join("") || '<tr><td colspan="3">No history entries.</td></tr>';
    renderStatus();
  }

  $("overviewRefreshBtn").addEventListener("click", () => {
    renderOverview();
    toast("Overview", "Summary refreshed.");
  });

  function normalizeDomain(raw) {
    let v = String(raw || "").trim().toLowerCase();
    v = v.replace(/^https?:\/\//,"").split("/")[0].replace(/^www\./,"");
    if (!v || v.includes(" ") || (!v.includes(".") && !v.startsWith("*."))) return "";
    return v;
  }

  function renderDomains() {
    $("domainList").innerHTML = state.domains.map((d,i) =>
      '<label class="check-row"><input type="checkbox" data-domain-index="' + i + '" ' + (selectedDomains.has(d) ? "checked" : "") + '><span>' + esc(d) + '</span></label>'
    ).join("") || '<div class="check-row">⚠️ No blocked domains yet.</div>';
    qsa("[data-domain-index]").forEach(cb => cb.addEventListener("change", () => {
      const d = state.domains[Number(cb.dataset.domainIndex)];
      if (cb.checked) selectedDomains.add(d); else selectedDomains.delete(d);
    }));
  }

  $("addDomainBtn").addEventListener("click", () => {
    const domain = normalizeDomain($("domainInput").value);
    if (!domain) { toast("Invalid", "Enter a valid domain like example.com."); return; }
    if (state.domains.includes(domain)) { toast("Duplicate", domain + " is already listed."); return; }
    state.domains.push(domain);
    $("domainInput").value = "";
    log("Block Domain", domain);
    save();
    renderNetwork();
    renderOverview();
    toast("Block Website", "✅ " + domain + " added to blocked sites.");
  });

  $("removeDomainBtn").addEventListener("click", () => {
    if (!selectedDomains.size) { toast("Unblock Website", "Check one or more domains to remove."); return; }
    const removed = state.domains.filter(d => selectedDomains.has(d));
    state.domains = state.domains.filter(d => !selectedDomains.has(d));
    selectedDomains.clear();
    log("Unblock Website", "Removed " + removed.length + " domain(s): " + removed.slice(0,6).join(", "));
    save();
    renderNetwork();
    renderOverview();
    toast("Unblock Website", "✅ Removed " + removed.length + " domains.");
  });

  $("refreshDomainBtn").addEventListener("click", renderDomains);
  $("selectAllDomainsBtn").addEventListener("click", () => {
    state.domains.forEach(d => selectedDomains.add(d));
    renderDomains();
  });

  function deviceLabel(d) {
    const marker = d.status === "blocked" ? "⛔" : "🟢";
    return marker + " " + d.ip + " (" + d.mac + ") · " + d.vendor + " · " + d.type;
  }

  function renderDevices() {
    const active = state.devices.filter(d => d.status !== "blocked");
    const blocked = state.devices.filter(d => d.status === "blocked");
    $("activeDevices").innerHTML = active.map(d => '<option value="' + esc(d.id) + '">' + esc(deviceLabel(d)) + '</option>').join("");
    $("blockedDevices").innerHTML = blocked.map(d => '<option value="' + esc(d.id) + '">' + esc(deviceLabel(d)) + '</option>').join("");
  }

  $("scanDevicesBtn").addEventListener("click", () => {
    state.devices.forEach((d,i) => d.lastSeen = new Date(Date.now() - i*40000).toISOString());
    const last = state.traffic.download.at(-1) || 0;
    state.traffic.download.push(Math.max(0, +(last + (((state.history.length % 5)-2)*.3)).toFixed(1)));
    state.traffic.upload.push(Math.max(0, +((state.traffic.upload.at(-1)||0) + (((state.history.length % 3)-1)*.15)).toFixed(1)));
    state.traffic.download = state.traffic.download.slice(-30);
    state.traffic.upload = state.traffic.upload.slice(-30);
    log("Scan Devices", "Detected " + state.devices.length + " device(s) on portfolio demo network.");
    save();
    renderNetwork();
    renderOverview();
    toast("Device Scan", "Detected " + state.devices.length + " devices.");
  });

  $("blockDeviceBtn").addEventListener("click", () => {
    const id = $("activeDevices").value;
    if (!id) { toast("Block Device", "Select a device to block."); return; }
    const d = state.devices.find(x => x.id === id);
    d.status = "blocked";
    log("Blocked", d.ip + " (" + d.mac + ")");
    save(); renderNetwork(); renderOverview();
    toast("Block Device", "⛔ " + d.ip + " blocked.");
  });

  $("unblockDeviceBtn").addEventListener("click", () => {
    const id = $("blockedDevices").value;
    if (!id) { toast("Unblock Device", "Select a blocked device."); return; }
    const d = state.devices.find(x => x.id === id);
    d.status = "active";
    log("Unblocked", d.ip + " (" + d.mac + ")");
    save(); renderNetwork(); renderOverview();
    toast("Unblock Device", "✅ " + d.ip + " unblocked.");
  });

  function renderSignatures() {
    $("signatureList").innerHTML = state.signatures.map(s =>
      '<option value="' + s.id + '">' + esc(s.id + " | " + s.name + " | " + (s.pattern || "—") + " | " + (s.ipRange || "—") + " | " + s.protocol) + '</option>'
    ).join("") || '<option disabled>(No app signatures configured)</option>';
  }

  $("addSignatureBtn").addEventListener("click", () => {
    const name = $("appNameInput").value.trim();
    if (!name) { toast("Application Signatures", "Please provide an app name."); return; }
    const next = Math.max(0,...state.signatures.map(s=>s.id))+1;
    state.signatures.push({
      id:next,
      name,
      pattern:$("appPatternInput").value.trim(),
      ipRange:$("appIpRangeInput").value.trim(),
      protocol:$("appProtocolInput").value
    });
    ["appNameInput","appPatternInput","appIpRangeInput"].forEach(id => $(id).value = "");
    log("Add Signature", name);
    save(); renderNetwork(); renderOverview();
    toast("Application Signatures", "✅ Signature added.");
  });

  $("removeSignatureBtn").addEventListener("click", () => {
    const id = Number($("signatureList").value);
    if (!id) { toast("Application Signatures", "Select a signature to remove."); return; }
    const s = state.signatures.find(x=>x.id===id);
    state.signatures = state.signatures.filter(x=>x.id!==id);
    log("Remove Signature", s?.name || String(id));
    save(); renderNetwork(); renderOverview();
  });

  $("refreshSignatureBtn").addEventListener("click", renderSignatures);

  function drawTraffic() {
    const canvas = $("trafficCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(500, Math.round(rect.width * devicePixelRatio));
    const h = Math.max(220, Math.round(rect.height * devicePixelRatio));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    ctx.clearRect(0,0,w,h);
    const pad = 32*devicePixelRatio;
    const max = Math.max(10,...state.traffic.download,...state.traffic.upload);
    ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = devicePixelRatio;
    for (let i=0;i<5;i++) { const y=pad+(h-pad*2)*i/4; ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(w-pad,y); ctx.stroke(); }
    function line(arr,color) {
      ctx.strokeStyle=color; ctx.lineWidth=2*devicePixelRatio; ctx.beginPath();
      arr.forEach((v,i) => {
        const x=pad+(w-pad*2)*i/Math.max(1,arr.length-1);
        const y=h-pad-(v/max)*(h-pad*2);
        if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      });
      ctx.stroke();
    }
    line(state.traffic.download,"#0078d7");
    line(state.traffic.upload,"#28a745");
  }

  function renderNetwork() {
    renderDomains();
    renderDevices();
    renderSignatures();
    drawTraffic();
  }

  function threatText(t) {
    return "[" + new Date(t.timestamp).toLocaleString() + "] " + t.severity + " | " + t.src + " → " + t.dst + " | " + t.protocol + " | " + t.description;
  }

  function renderThreats() {
    $("threatList").innerHTML = state.threats.map(t => '<option value="' + t.id + '">' + esc(threatText(t)) + '</option>').join("") || '<option disabled>(No detected threats yet.)</option>';
  }

  $("refreshThreatsBtn").addEventListener("click", renderThreats);
  $("clearThreatsBtn").addEventListener("click", () => {
    if (currentUser?.role !== "admin") { toast("Threats", "Admin access required."); return; }
    if (!confirm("Are you sure you want to delete all threat alerts?")) return;
    state.threats = [];
    log("Cleared Threats", "All threat alerts cleared.");
    save(); renderThreats(); renderOverview();
    toast("Cleared", "All threat alerts cleared.");
  });

  function ruleText(r) { return r.action + " " + r.protocol + " " + r.ip + ":" + r.port; }
  function renderRules() {
    $("rulesList").innerHTML = state.rules.map(r => '<option value="' + r.id + '">' + esc(ruleText(r)) + '</option>').join("") || '<option disabled>(No custom rules configured)</option>';
  }

  $("addRuleBtn").addEventListener("click", () => {
    const ip = $("ruleIpInput").value.trim();
    let port = $("rulePortInput").value.trim() || "ANY";
    const protocol = $("ruleProtocolInput").value;
    const action = $("ruleActionInput").value;
    if (!ip) { toast("Firewall Rules", "Please enter an IP address."); return; }
    if (port !== "ANY" && !/^\d+$/.test(port)) { toast("Firewall Rules", 'Port must be numeric or "ANY".'); return; }
    if (state.rules.some(r=>r.ip===ip&&r.port===port&&r.protocol===protocol&&r.action===action)) { toast("Firewall Rules","Rule already exists.");return; }
    const id = Math.max(0,...state.rules.map(r=>r.id))+1;
    const rule={id,ip,port,protocol,action};
    state.rules.push(rule);
    $("ruleIpInput").value=""; $("rulePortInput").value="";
    log("Add Rule", ruleText(rule));
    save(); renderRules(); renderOverview();
    toast("Firewall Rules","✅ Rule added: "+ruleText(rule));
  });

  $("removeRuleBtn").addEventListener("click", () => {
    const id=Number($("rulesList").value);
    if(!id){toast("Firewall Rules","Select a rule to remove.");return;}
    const rule=state.rules.find(r=>r.id===id);
    state.rules=state.rules.filter(r=>r.id!==id);
    log("Remove Rule", rule?ruleText(rule):String(id));
    save(); renderRules(); renderOverview();
  });
  $("refreshRulesBtn").addEventListener("click", renderRules);

  function filteredHistory() {
    const q=$("historySearchInput").value.trim().toLowerCase();
    let rows=[...state.history];
    if(q){
      const range=q.match(/^(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})$/);
      if(range){
        const a=new Date(range[1]+"T00:00:00"),b=new Date(range[2]+"T23:59:59");
        rows=rows.filter(h=>{const d=new Date(h.timestamp);return d>=a&&d<=b;});
      } else {
        rows=rows.filter(h=>[h.username,h.action,h.description,h.timestamp.slice(0,10)].join(" ").toLowerCase().includes(q));
      }
    }
    rows.sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp));
    if($("historySort").value==="Descending")rows.reverse();
    return rows;
  }

  function renderHistory() {
    const rows=filteredHistory();
    $("historyList").innerHTML=rows.map((h,i)=>
      '<option value="'+i+'">'+esc("["+new Date(h.timestamp).toLocaleString()+"] 👤 "+h.username.padEnd(12)+" | ⚙️ "+h.action.padEnd(15)+" | 📝 "+h.description)+'</option>'
    ).join("")||'<option disabled>(No logs yet)</option>';
  }
  $("historySearchBtn").addEventListener("click",renderHistory);
  $("historySearchInput").addEventListener("input",()=>{if(!$("historySearchInput").value)renderHistory();});
  $("historySort").addEventListener("change",renderHistory);
  $("archiveLogsBtn").addEventListener("click",()=>{
    const cutoff=Date.now()-60000;
    const old=state.history.filter(h=>new Date(h.timestamp).getTime()<cutoff);
    if(!old.length){toast("Archive","No logs older than 1 minute found to archive.");return;}
    state.archivedHistory.unshift(...old);
    state.history=state.history.filter(h=>new Date(h.timestamp).getTime()>=cutoff);
    log("Archive Logs","🗄️ Archived "+old.length+" log(s) successfully.");
    save();renderHistory();renderOverview();toast("Archive","Archived "+old.length+" log(s).");
  });

  function applyTheme(){
    document.body.classList.toggle("dark-mode",!!state.settings.dark_mode);
  }
  function renderSettings(){
    $("settingAutoStart").checked=!!state.settings.auto_start;
    $("settingDetailedLogging").checked=!!state.settings.detailed_logging;
    $("settingDarkMode").checked=!!state.settings.dark_mode;
    $("settingDnsProxy").checked=!!state.settings.dns_proxy_enabled;
    $("settingNetsh").checked=!!state.settings.create_netsh_blocks;
  }
  $("saveSettingsBtn").addEventListener("click",()=>{
    state.settings={
      auto_start:$("settingAutoStart").checked,
      detailed_logging:$("settingDetailedLogging").checked,
      dark_mode:$("settingDarkMode").checked,
      dns_proxy_enabled:$("settingDnsProxy").checked,
      create_netsh_blocks:$("settingNetsh").checked
    };
    log("Settings Saved","Application settings updated.");
    save();applyTheme();toast("Settings Saved","Configuration saved.");
  });
  $("resetSettingsBtn").addEventListener("click",()=>{
    state.settings={auto_start:false,detailed_logging:false,dark_mode:false,dns_proxy_enabled:true,create_netsh_blocks:true};
    log("Settings Reset","Settings reset to defaults.");
    save();applyTheme();renderSettings();toast("Settings","✅ Settings reset to defaults.");
  });
  $("reloadListsBtn").addEventListener("click",()=>{renderNetwork();log("Reload Firewall Lists","Firewall lists reloaded in demo workspace.");toast("Firewall Lists","✅ Firewall lists reloaded.");});
  $("backupDbsBtn").addEventListener("click",()=>{
    const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download="pyrewall-demo-backup-"+new Date().toISOString().replace(/[:.]/g,"-")+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
    log("Backup DBs","Portfolio workspace backup exported.");
    toast("Backup Complete","Demo workspace backup downloaded.");
  });
  $("openDbFolderBtn").addEventListener("click",()=>toast("Open DB Folder","Available only in the local Windows build."));

  function selectedUserName(){
    const val=$("usersList").value;
    return val||"";
  }
  function renderUsers(){
    $("usersList").innerHTML=state.users.map(u=>'<option value="'+esc(u.username)+'">'+(u.role==="admin"?"⭐":"👤")+" "+esc(u.username)+" ("+esc(u.role)+")</option>").join("")||'<option disabled>(No users found)</option>';
  }
  $("addUserBtn").addEventListener("click",()=>{
    const username=$("newUsernameInput").value.trim(),password=$("newPasswordInput").value,role=$("newRoleInput").value;
    if(!username||!password){toast("Warning","Please fill out username and password.");return;}
    if(state.users.some(u=>u.username===username)){toast("Warning","User already exists.");return;}
    state.users.push({username,password,role});
    log("Add User","Added new user: "+username+" ("+role+")");
    $("newUsernameInput").value="";$("newPasswordInput").value="";
    save();renderUsers();renderOverview();toast("Success","✅ User "+username+" added.");
  });
  $("updatePasswordBtn").addEventListener("click",()=>{
    const username=$("newUsernameInput").value.trim()||selectedUserName(),password=$("newPasswordInput").value;
    if(!username||!password){toast("Update User","Please provide username and new password.");return;}
    const u=state.users.find(x=>x.username===username);
    if(!u){toast("Update User","User not found.");return;}
    u.password=password;log("Update User","Updated password for user: "+username);
    $("newPasswordInput").value="";save();toast("Update User","🔑 Password for "+username+" updated.");
  });
  $("removeUserBtn").addEventListener("click",()=>{
    const username=selectedUserName()||$("newUsernameInput").value.trim();
    if(!username){toast("Remove User","Please select a user to remove.");return;}
    if(username===currentUser?.username){toast("Remove User","You cannot delete the currently logged-in admin.");return;}
    state.users=state.users.filter(u=>u.username!==username);
    log("Remove User","Removed user: "+username);
    save();renderUsers();renderOverview();toast("Remove User","❎ User "+username+" removed.");
  });
  $("refreshUsersBtn").addEventListener("click",renderUsers);

  $("usersList").addEventListener("change",()=>{
    const u=state.users.find(x=>x.username===$("usersList").value);
    if(u){$("newUsernameInput").value=u.username;$("newRoleInput").value=u.role;}
  });

  function renderAll(){
    renderStatus();
    renderOverview();
    renderNetwork();
    renderThreats();
    renderRules();
    renderHistory();
    renderSettings();
    renderUsers();
  }

  window.addEventListener("resize",()=>{if(!$("desktopApp").hidden)drawTraffic();});

  try {
    const saved=JSON.parse(localStorage.getItem(SESSION_KEY)||"null");
    const user=saved&&state.users.find(u=>u.username===saved.username);
    if(user){$("firstRunBanner").hidden=true;showApp(user);}
  } catch (_) {}
})();