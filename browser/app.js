(() => {
  "use strict";

  const KEY = "pyrewall_security_center_v2";
  const $ = (id) => document.getElementById(id);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const now = () => new Date().toISOString();
  const uid = (prefix) => prefix + "-" + Math.random().toString(36).slice(2, 9).toUpperCase();

  const pageMeta = {
    overview:["SEC / 01","Unified firewall operations","Command Center"],
    websites:["WEB / 02","Domain and address filtering","Web Control"],
    devices:["DEV / 03","Network access control","Devices"],
    applications:["APP / 04","Application and service policy","Apps & Services"],
    rules:["ACL / 05","Structured firewall policy","Firewall Rules"],
    traffic:["NET / 06","Interface and session telemetry","Traffic Monitor"],
    threats:["THR / 07","Detection and response","Threat Events"],
    history:["AUD / 08","Workspace governance","Audit History"],
    settings:["CFG / 09","Security configuration","Settings & Local Engine"]
  };

  function seed(){
    const t = Date.now();
    const ago = (m) => new Date(t - m * 60000).toISOString();
    const future = (m) => new Date(t + m * 60000).toISOString();
    return {
      version:2,
      createdAt:now(),
      updatedAt:now(),
      domains:[
        {id:"DOM-001",domain:"*.social.example",wildcard:true,enabled:true,source:"Manual",addedAt:ago(180)},
        {id:"DOM-002",domain:"streaming.example",wildcard:false,enabled:true,source:"Manual",addedAt:ago(95)},
        {id:"DOM-003",domain:"games.example",wildcard:false,enabled:true,source:"Manual",addedAt:ago(45)}
      ],
      ips:[
        {id:"IP-001",ip:"203.0.113.25",enabled:true,reason:"Manual policy",permanent:true,domain:"",expiresAt:null},
        {id:"IP-002",ip:"198.51.100.44",enabled:true,reason:"Manual policy",permanent:true,domain:"",expiresAt:null}
      ],
      resolvedIps:[
        {id:"RIP-001",domain:"streaming.example",ip:"203.0.113.80",reason:"A record",expiresAt:future(12)},
        {id:"RIP-002",domain:"streaming.example",ip:"203.0.113.81",reason:"A record",expiresAt:future(12)},
        {id:"RIP-003",domain:"games.example",ip:"198.51.100.91",reason:"A record",expiresAt:future(9)}
      ],
      devices:[
        {id:"DEV-001",name:"Gateway Laptop",ip:"192.168.137.1",mac:"9C:2D:CD:AA:01:10",vendor:"Lenovo",state:"allowed",risk:12,lastSeen:ago(.3),gateway:true},
        {id:"DEV-002",name:"OPPO A16",ip:"192.168.137.101",mac:"38:7A:0E:16:10:A1",vendor:"OPPO",state:"allowed",risk:28,lastSeen:ago(.7),gateway:false},
        {id:"DEV-003",name:"Workstation-01",ip:"192.168.137.102",mac:"A4:BB:6D:20:51:07",vendor:"Lenovo",state:"allowed",risk:18,lastSeen:ago(1.1),gateway:false},
        {id:"DEV-004",name:"Unknown Device",ip:"192.168.137.115",mac:"00:11:22:33:44:55",vendor:"Unknown",state:"blocked",risk:78,lastSeen:ago(4),gateway:false},
        {id:"DEV-005",name:"Smart TV",ip:"192.168.137.120",mac:"84:7B:EB:22:10:20",vendor:"Generic",state:"allowed",risk:36,lastSeen:ago(2.1),gateway:false}
      ],
      signatures:[
        {id:"SIG-001",name:"Example Video",host:"*.video.example",domain:"video.example",range:"",port:"443",protocol:"ANY",action:"BLOCK",enabled:true},
        {id:"SIG-002",name:"Example Chat",host:"*.chat.example",domain:"chat.example",range:"",port:"ANY",protocol:"ANY",action:"MONITOR",enabled:true},
        {id:"SIG-003",name:"Cloud Sync",host:"sync.example",domain:"sync.example",range:"198.51.100.0/24",port:"443",protocol:"TCP",action:"ALLOW",enabled:true}
      ],
      rules:[
        {id:"RULE-001",priority:10,direction:"OUT",ip:"203.0.113.25",port:"443",protocol:"TCP",action:"BLOCK",enabled:true},
        {id:"RULE-002",priority:20,direction:"OUT",ip:"10.0.0.53",port:"53",protocol:"UDP",action:"ALLOW",enabled:true},
        {id:"RULE-003",priority:30,direction:"BOTH",ip:"198.51.100.0/24",port:"ANY",protocol:"ANY",action:"MONITOR",enabled:true}
      ],
      threats:[
        {id:"THR-001",severity:"high",status:"open",type:"Repeated blocked access",source:"192.168.137.115",target:"203.0.113.25:443",detail:"Unknown device repeatedly attempted a destination blocked by firewall policy.",createdAt:ago(7)},
        {id:"THR-002",severity:"medium",status:"open",type:"Possible DoH bypass",source:"192.168.137.101",target:"198.51.100.53:443",detail:"HTTPS session matched a known encrypted-DNS pattern while DoH policy was enabled.",createdAt:ago(12)},
        {id:"THR-003",severity:"low",status:"acknowledged",type:"QUIC attempt",source:"192.168.137.120",target:"203.0.113.90:443/UDP",detail:"UDP/443 session was observed while QUIC visibility policy was enabled.",createdAt:ago(26)}
      ],
      traffic:{
        download:[4.2,5.1,4.6,6.8,8.2,7.3,9.8,12.1,10.4,8.9,11.7,13.8,12.9,15.4,14.1,11.2,10.6,12.8,14.7,13.6,16.1,15.2,14.4,13.8],
        upload:[1.1,1.3,1.0,1.8,2.3,2.1,2.8,3.2,2.6,2.1,2.9,3.5,3.1,4.2,3.7,2.8,2.4,3.0,3.6,3.4,4.1,3.8,3.3,3.2],
        sessions:36,
        blockedEvents:14
      },
      connections:[
        {id:"CON-001",service:"Browser",local:"192.168.137.102:52341",remote:"142.250.72.14:443",protocol:"TCP",state:"ESTABLISHED",policy:"allowed"},
        {id:"CON-002",service:"Example Video",local:"192.168.137.101:49120",remote:"203.0.113.80:443",protocol:"TCP",state:"BLOCKED",policy:"blocked"},
        {id:"CON-003",service:"DNS Client",local:"192.168.137.102:53544",remote:"10.0.0.53:53",protocol:"UDP",state:"ACTIVE",policy:"allowed"},
        {id:"CON-004",service:"Example Chat",local:"192.168.137.101:50922",remote:"198.51.100.44:443",protocol:"TCP",state:"MONITOR",policy:"monitor"},
        {id:"CON-005",service:"Unknown",local:"192.168.137.115:55001",remote:"203.0.113.25:443",protocol:"TCP",state:"BLOCKED",policy:"blocked"}
      ],
      protectedIps:[
        {ip:"127.0.0.1",reason:"Loopback"},
        {ip:"Gateway",reason:"Detected local gateway"},
        {ip:"8.8.8.8",reason:"DNS safeguard"},
        {ip:"1.1.1.1",reason:"DNS safeguard"},
        {ip:"9.9.9.9",reason:"DNS safeguard"},
        {ip:"208.67.222.222",reason:"DNS safeguard"}
      ],
      settings:{
        enable_ip_blocking:true,
        disable_quic:true,
        block_doh:false,
        temp_ip_ttl:900
      },
      history:[
        {id:"AUD-001",at:ago(2),module:"Traffic",action:"Telemetry sampled",detail:"Interface counters refreshed in portfolio simulation."},
        {id:"AUD-002",at:ago(7),module:"Threats",action:"Threat detected",detail:"Repeated blocked access from Unknown Device."},
        {id:"AUD-003",at:ago(12),module:"Threats",action:"Threat detected",detail:"Possible encrypted-DNS bypass pattern recorded."},
        {id:"AUD-004",at:ago(45),module:"Web",action:"Domain added",detail:"games.example added to blocked domain policy."},
        {id:"AUD-005",at:ago(95),module:"Web",action:"Domain added",detail:"streaming.example added to blocked domain policy."},
        {id:"AUD-006",at:ago(180),module:"System",action:"Workspace initialized",detail:"PyreWall Security Center browser workspace created."}
      ]
    };
  }

  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if(raw){
        const parsed = JSON.parse(raw);
        if(parsed && Array.isArray(parsed.domains)) return {...seed(),...parsed,settings:{...seed().settings,...(parsed.settings||{})}};
      }
    }catch(e){console.warn(e);}
    return seed();
  }

  let state = load();

  function save(){
    state.updatedAt = now();
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function esc(v){
    return String(v ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function fmt(v){
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
  }

  function log(module,action,detail){
    state.history.unshift({id:uid("AUD"),at:now(),module,action,detail});
    state.history = state.history.slice(0,400);
    save();
  }

  function toast(title,msg=""){
    const n = document.createElement("div");
    n.className = "toast";
    n.innerHTML = "<strong>"+esc(title)+"</strong><span>"+esc(msg)+"</span>";
    $("toastRegion").appendChild(n);
    setTimeout(()=>n.remove(),3400);
  }

  function badge(text,tone="cyan"){
    return '<span class="badge '+esc(tone)+'">'+esc(text)+'</span>';
  }

  function toneFor(value){
    const v=String(value||"").toLowerCase();
    if(["allowed","allow","active","enabled","acknowledged","resolved"].includes(v))return"green";
    if(["blocked","block","critical","high","open"].includes(v))return"red";
    if(["medium","monitor","warning","unknown"].includes(v))return"amber";
    if(["low"].includes(v))return"blue";
    return"cyan";
  }

  function openPage(page){
    qsa("[data-panel]").forEach(p=>p.classList.toggle("active",p.dataset.panel===page));
    qsa("[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
    if(pageMeta[page]){
      $("pageCode").textContent=pageMeta[page][0];
      $("pageEyebrow").textContent=pageMeta[page][1];
      $("pageTitle").textContent=pageMeta[page][2];
    }
    renderPage(page);
    window.scrollTo({top:0,behavior:"smooth"});
  }

  qsa("[data-page]").forEach(b=>b.addEventListener("click",()=>openPage(b.dataset.page)));
  qsa("[data-go]").forEach(b=>b.addEventListener("click",()=>openPage(b.dataset.go)));

  function renderPage(page){
    if(page==="overview")renderOverview();
    if(page==="websites")renderWebsites();
    if(page==="devices")renderDevices();
    if(page==="applications")renderApplications();
    if(page==="rules")renderRules();
    if(page==="traffic")renderTraffic();
    if(page==="threats")renderThreats();
    if(page==="history")renderHistory();
    if(page==="settings")renderSettings();
  }

  function activePolicyCount(){
    return state.domains.filter(x=>x.enabled).length+
      state.ips.filter(x=>x.enabled).length+
      state.rules.filter(x=>x.enabled).length+
      state.signatures.filter(x=>x.enabled).length;
  }

  function activeThreats(){
    return state.threats.filter(t=>!["resolved","closed"].includes(t.status));
  }

  function postureScore(){
    let score=82;
    if(state.settings.enable_ip_blocking)score+=4;
    if(state.settings.disable_quic)score+=4;
    if(state.settings.block_doh)score+=4;
    score+=Math.min(4,state.rules.filter(r=>r.enabled&&r.action==="ALLOW").length);
    score-=Math.min(18,activeThreats().filter(t=>t.severity==="critical").length*8+activeThreats().filter(t=>t.severity==="high").length*5+activeThreats().filter(t=>t.severity==="medium").length*2);
    score-=state.devices.filter(d=>d.state==="unknown").length*2;
    return Math.max(0,Math.min(100,score));
  }

  function renderOverview(){
    const posture=postureScore();
    $("postureScore").textContent=posture;
    $("postureLabel").textContent=posture>=90?"HARDENED":posture>=78?"STABLE":"ATTENTION";
    $("heroQuic").textContent=state.settings.disable_quic?"ENABLED":"DISABLED";
    $("heroDoh").textContent=state.settings.block_doh?"ENABLED":"DISABLED";

    $("statDomains").textContent=state.domains.filter(x=>x.enabled).length;
    $("statIps").textContent=state.ips.filter(x=>x.enabled).length+state.resolvedIps.length;
    $("statRules").textContent=state.rules.filter(x=>x.enabled).length;
    $("statSigs").textContent=state.signatures.filter(x=>x.enabled).length;
    $("statThreats").textContent=activeThreats().length;

    $("stripPolicies").textContent=activePolicyCount();
    $("stripThreats").textContent=activeThreats().length;
    $("stripDevices").textContent=state.devices.length;
    const latestDown=state.traffic.download.at(-1)||0,latestUp=state.traffic.upload.at(-1)||0;
    $("stripTraffic").textContent=(latestDown+latestUp).toFixed(1)+" Mbps";

    renderTrafficChart("trafficChart","downloadLine","uploadLine","trafficLabels",780,260);
    renderPolicyDonut();

    $("deviceRiskList").innerHTML=state.devices.slice().sort((a,b)=>b.risk-a.risk).slice(0,5).map(d=>{
      const cls=d.risk>=60?"high":d.risk>=30?"med":"low";
      return '<div class="risk-row"><div><b>'+esc(d.name)+'</b><small>'+esc(d.ip+" · "+d.state)+'</small></div><div><div class="risk-meter"><i class="'+cls+'" style="width:'+Math.min(100,d.risk)+'%"></i></div><small>'+d.risk+' risk</small></div></div>';
    }).join("");

    $("overviewThreats").innerHTML=state.threats.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5).map(t=>
      '<div class="threat-mini"><span class="sev '+esc(t.severity)+'"></span><div><b>'+esc(t.type)+'</b><small>'+esc(t.source+" → "+t.target)+'</small></div><time>'+esc(new Date(t.createdAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}))+'</time></div>'
    ).join("");

    $("recentHistory").innerHTML=renderTimeline(state.history.slice(0,7));
  }

  function renderTrafficChart(svgId,downId,upId,labelId,width,height){
    if(!$(svgId))return;
    const down=state.traffic.download.slice(-24),up=state.traffic.upload.slice(-24),max=Math.max(20,...down,...up);
    const x0=52,x1=width-28,y0=28,y1=height-28;
    const points=(arr)=>arr.map((v,i)=>({x:x0+(x1-x0)*i/Math.max(1,arr.length-1),y:y1-(v/max)*(y1-y0),v}));
    const dp=points(down),upPts=points(up);
    $(downId).setAttribute("points",dp.map(p=>p.x.toFixed(1)+","+p.y.toFixed(1)).join(" "));
    $(upId).setAttribute("points",upPts.map(p=>p.x.toFixed(1)+","+p.y.toFixed(1)).join(" "));
    const labels=[0,6,12,18,23].filter(i=>i<dp.length);
    $(labelId).innerHTML=labels.map(i=>'<text x="'+dp[i].x.toFixed(1)+'" y="'+(height-7)+'" text-anchor="middle">'+(i===dp.length-1?"Now":"-"+(dp.length-1-i)+"m")+'</text>').join("");
  }

  function renderPolicyDonut(){
    const items=[
      {label:"Domains",value:state.domains.filter(x=>x.enabled).length,color:"var(--red)"},
      {label:"IPs",value:state.ips.filter(x=>x.enabled).length+state.resolvedIps.length,color:"var(--cyan)"},
      {label:"Rules",value:state.rules.filter(x=>x.enabled).length,color:"var(--amber)"},
      {label:"Apps",value:state.signatures.filter(x=>x.enabled).length,color:"var(--violet)"}
    ];
    const total=Math.max(1,items.reduce((s,x)=>s+x.value,0));let cursor=0;
    const gradient=items.map(x=>{const start=cursor;cursor+=x.value/total*100;return x.color+" "+start.toFixed(1)+"% "+cursor.toFixed(1)+"%";}).join(",");
    $("policyDonut").innerHTML='<div class="donut" style="background:conic-gradient('+gradient+')"><div><strong>'+total+'</strong><span>active objects</span></div></div><div class="donut-key">'+
      items.map(x=>'<div class="donut-key-row"><i style="background:'+x.color+'"></i><span>'+esc(x.label)+'</span><b>'+x.value+'</b></div>').join("")+'</div>';
  }

  function normalizeDomain(value){
    return value.trim().toLowerCase().replace(/^https?:\/\//,"").split("/")[0].replace(/^www\./,"");
  }

  function validIpv4(ip){
    const p=ip.split(".");
    return p.length===4&&p.every(x=>/^\d{1,3}$/.test(x)&&Number(x)>=0&&Number(x)<=255);
  }

  function renderWebsites(){
    $("domainList").innerHTML=state.domains.length?state.domains.map(d=>
      '<div class="policy-row"><div><b>'+esc(d.domain)+'</b><small>'+esc((d.wildcard?"Wildcard · ":"Exact · ")+d.source+" · "+fmt(d.addedAt))+'</small></div><div class="policy-meta">'+
      badge(d.enabled?"Enabled":"Disabled",d.enabled?"green":"amber")+
      '<button class="mini-btn" data-domain-toggle="'+esc(d.id)+'">'+(d.enabled?"Disable":"Enable")+'</button>'+
      '<button class="mini-btn danger" data-domain-remove="'+esc(d.id)+'">Remove</button></div></div>'
    ).join(""):'<div class="empty">No domain policy.</div>';

    $("ipList").innerHTML=state.ips.length?state.ips.map(ip=>
      '<div class="policy-row"><div><b>'+esc(ip.ip)+'</b><small>'+esc(ip.reason+(ip.permanent?" · permanent":""))+'</small></div><div class="policy-meta">'+
      badge(ip.enabled?"Enabled":"Disabled",ip.enabled?"green":"amber")+
      '<button class="mini-btn" data-ip-toggle="'+esc(ip.id)+'">'+(ip.enabled?"Disable":"Enable")+'</button>'+
      '<button class="mini-btn danger" data-ip-remove="'+esc(ip.id)+'">Remove</button></div></div>'
    ).join(""):'<div class="empty">No blocked IP policy.</div>';

    $("resolvedIpRows").innerHTML=state.resolvedIps.length?state.resolvedIps.map(r=>
      '<tr><td>'+esc(r.domain)+'</td><td>'+esc(r.ip)+'</td><td>'+esc(r.reason)+'</td><td>'+esc(fmt(r.expiresAt))+'</td></tr>'
    ).join(""):'<tr><td colspan="4" class="empty">No temporary domain-derived IPs.</td></tr>';

    qsa("[data-domain-toggle]").forEach(b=>b.onclick=()=>{const d=state.domains.find(x=>x.id===b.dataset.domainToggle);if(!d)return;d.enabled=!d.enabled;log("Web","Domain policy toggled",d.domain+" → "+(d.enabled?"enabled":"disabled"));renderAll();});
    qsa("[data-domain-remove]").forEach(b=>b.onclick=()=>{const d=state.domains.find(x=>x.id===b.dataset.domainRemove);state.domains=state.domains.filter(x=>x.id!==b.dataset.domainRemove);if(d)log("Web","Domain removed",d.domain);renderAll();toast("Domain removed",d?.domain||"");});
    qsa("[data-ip-toggle]").forEach(b=>b.onclick=()=>{const ip=state.ips.find(x=>x.id===b.dataset.ipToggle);if(!ip)return;ip.enabled=!ip.enabled;log("Web","IP policy toggled",ip.ip+" → "+(ip.enabled?"enabled":"disabled"));renderAll();});
    qsa("[data-ip-remove]").forEach(b=>b.onclick=()=>{const ip=state.ips.find(x=>x.id===b.dataset.ipRemove);state.ips=state.ips.filter(x=>x.id!==b.dataset.ipRemove);if(ip)log("Web","IP removed",ip.ip);renderAll();toast("IP removed",ip?.ip||"");});
  }

  $("domainForm").addEventListener("submit",e=>{
    e.preventDefault();const domain=normalizeDomain($("domainInput").value);
    if(!domain)return;
    if(state.domains.some(d=>d.domain===domain)){toast("Already listed",domain);return;}
    const record={id:uid("DOM"),domain,wildcard:domain.startsWith("*."),enabled:true,source:"Manual",addedAt:now()};
    state.domains.push(record);$("domainInput").value="";log("Web","Domain added",domain);renderAll();toast("Domain added",domain);
  });

  $("ipForm").addEventListener("submit",e=>{
    e.preventDefault();const ip=$("ipInput").value.trim();
    if(!validIpv4(ip)){toast("Invalid IP","Enter a valid IPv4 address.");return;}
    if(state.ips.some(x=>x.ip===ip)){toast("Already listed",ip);return;}
    state.ips.push({id:uid("IP"),ip,enabled:true,reason:"Manual policy",permanent:true,domain:"",expiresAt:null});
    $("ipInput").value="";log("Web","IP added",ip);renderAll();toast("IP added",ip);
  });

  $("simulateResolveBtn").addEventListener("click",()=>{
    const enabled=state.domains.filter(d=>d.enabled);
    if(!enabled.length){toast("No enabled domains","Add or enable a domain first.");return;}
    const base=80+state.resolvedIps.length;
    enabled.slice(0,3).forEach((d,i)=>{
      const ip=(i%2===0?"203.0.113.":"198.51.100.")+((base+i)%200+20);
      if(!state.resolvedIps.some(x=>x.domain===d.domain&&x.ip===ip)){
        state.resolvedIps.push({id:uid("RIP"),domain:d.domain,ip,reason:"Simulated A record",expiresAt:new Date(Date.now()+state.settings.temp_ip_ttl*1000).toISOString()});
      }
    });
    log("Web","Domain resolution simulated",Math.min(3,enabled.length)+" enabled domain policies resolved to temporary IPs.");
    renderAll();toast("Resolution simulated","Temporary IP cache updated.");
  });

  function renderDevices(){
    const q=$("deviceSearch").value.toLowerCase().trim(),filter=$("deviceStateFilter").value;
    const visible=state.devices.filter(d=>{const hay=[d.name,d.ip,d.mac,d.vendor,d.state].join(" ").toLowerCase();return(!q||hay.includes(q))&&(!filter||d.state===filter);});
    const blocked=state.devices.filter(d=>d.state==="blocked").length,allowed=state.devices.filter(d=>d.state==="allowed").length,unknown=state.devices.filter(d=>d.state==="unknown").length,high=state.devices.filter(d=>d.risk>=60).length;
    $("deviceSummary").innerHTML=[
      ["Observed",state.devices.length,"ARP workspace"],["Allowed",allowed,"policy permits"],["Blocked",blocked,"device policy"],["High risk",high,"risk ≥60"]
    ].map(x=>'<article class="summary-card"><span>'+x[0]+'</span><strong>'+x[1]+'</strong><small>'+x[2]+'</small></article>').join("");

    $("deviceRows").innerHTML=visible.length?visible.map(d=>
      '<tr><td><span class="cell-title">'+esc(d.name)+'</span><span class="cell-sub">'+esc(d.gateway?"Protected gateway":"Observed device")+'</span></td>'+
      '<td>'+esc(d.ip)+'</td><td>'+esc(d.mac)+'</td><td>'+esc(d.vendor)+'</td><td>'+badge(d.state,toneFor(d.state))+'</td><td>'+esc(fmt(d.lastSeen))+'</td>'+
      '<td>'+(d.gateway?badge("Protected","cyan"):'<button class="btn ghost" data-device-action="'+esc(d.id)+'">'+(d.state==="blocked"?"Unblock":"Block")+'</button>')+'</td></tr>'
    ).join(""):'<tr><td colspan="7" class="empty">No devices match current filters.</td></tr>';

    qsa("[data-device-action]").forEach(b=>b.onclick=()=>{
      const d=state.devices.find(x=>x.id===b.dataset.deviceAction);if(!d||d.gateway)return;
      d.state=d.state==="blocked"?"allowed":"blocked";d.lastSeen=now();
      log("Devices",d.state==="blocked"?"Device blocked":"Device unblocked",d.name+" · "+d.ip);
      if(d.state==="blocked"&&d.risk>=60){
        state.threats.unshift({id:uid("THR"),severity:"medium",status:"open",type:"High-risk device contained",source:d.ip,target:"Network access",detail:d.name+" was blocked by device policy.",createdAt:now()});
      }
      renderAll();toast(d.state==="blocked"?"Device blocked":"Device unblocked",d.name);
    });
  }

  $("deviceSearch").addEventListener("input",renderDevices);
  $("deviceStateFilter").addEventListener("change",renderDevices);
  $("scanDevicesBtn").addEventListener("click",()=>{
    state.devices.forEach((d,i)=>{d.lastSeen=now();d.risk=Math.max(4,Math.min(95,d.risk+((i+state.history.length)%7)-3));});
    if(!state.devices.some(d=>d.id==="DEV-DEMO-"+state.history.length)){
      const id="DEV-DEMO-"+state.history.length;
      state.devices.push({id,name:"Guest Device",ip:"192.168.137."+(130+(state.devices.length%40)),mac:"02:00:00:AA:BB:"+String(state.devices.length).padStart(2,"0"),vendor:"Unknown",state:"unknown",risk:44,lastSeen:now(),gateway:false});
    }
    log("Devices","ARP scan simulated","Observed device table refreshed in portfolio mode.");
    renderAll();toast("Device scan complete",state.devices.length+" devices observed.");
  });

  function renderApplications(){
    $("signatureCards").innerHTML=state.signatures.length?state.signatures.map(s=>
      '<article class="signature-card"><h4>'+esc(s.name)+'</h4><p>Administrator-defined service signature</p><div class="signature-data">'+
      '<div><span>Host</span><b>'+esc(s.host||"—")+'</b></div><div><span>Domain</span><b>'+esc(s.domain||"—")+'</b></div>'+
      '<div><span>IP range</span><b>'+esc(s.range||"—")+'</b></div><div><span>Port / protocol</span><b>'+esc((s.port||"ANY")+" / "+s.protocol)+'</b></div>'+
      '</div><div class="signature-actions">'+badge(s.action,toneFor(s.action))+'<div><input class="toggle" type="checkbox" data-sig-toggle="'+esc(s.id)+'" '+(s.enabled?"checked":"")+' aria-label="Toggle signature"><button class="mini-btn danger" data-sig-remove="'+esc(s.id)+'">Remove</button></div></div></article>'
    ).join(""):'<div class="empty">No application signatures.</div>';

    qsa("[data-sig-toggle]").forEach(x=>x.onchange=()=>{const s=state.signatures.find(v=>v.id===x.dataset.sigToggle);if(!s)return;s.enabled=x.checked;log("Applications","Signature toggled",s.name+" → "+(s.enabled?"enabled":"disabled"));renderAll();});
    qsa("[data-sig-remove]").forEach(b=>b.onclick=()=>{const s=state.signatures.find(x=>x.id===b.dataset.sigRemove);state.signatures=state.signatures.filter(x=>x.id!==b.dataset.sigRemove);if(s)log("Applications","Signature removed",s.name);renderAll();toast("Signature removed",s?.name||"");});
  }

  $("sigForm").addEventListener("submit",e=>{
    e.preventDefault();const name=$("sigName").value.trim();if(!name)return;
    state.signatures.push({
      id:uid("SIG"),name,host:$("sigHost").value.trim(),domain:$("sigDomain").value.trim(),
      range:$("sigRange").value.trim(),port:$("sigPort").value.trim()||"ANY",
      protocol:$("sigProtocol").value,action:$("sigAction").value,enabled:true
    });
    ["sigName","sigHost","sigDomain","sigRange","sigPort"].forEach(id=>$(id).value="");
    log("Applications","Signature added",name);renderAll();toast("Signature added",name);
  });

  function renderRules(){
    const sorted=state.rules.slice().sort((a,b)=>a.priority-b.priority);
    $("ruleTable").innerHTML=sorted.length?sorted.map(r=>
      '<tr><td>'+r.priority+'</td><td>'+esc(r.direction)+'</td><td>'+esc(r.ip)+'</td><td>'+esc(r.port)+'</td><td>'+esc(r.protocol)+'</td>'+
      '<td>'+badge(r.action,toneFor(r.action))+'</td><td><input class="toggle" type="checkbox" data-rule-toggle="'+esc(r.id)+'" '+(r.enabled?"checked":"")+'></td>'+
      '<td><button class="mini-btn danger" data-rule-remove="'+esc(r.id)+'">Remove</button></td></tr>'
    ).join(""):'<tr><td colspan="8" class="empty">No firewall rules.</td></tr>';
    qsa("[data-rule-toggle]").forEach(x=>x.onchange=()=>{const r=state.rules.find(v=>v.id===x.dataset.ruleToggle);if(!r)return;r.enabled=x.checked;log("Rules","Rule toggled",r.id+" → "+(r.enabled?"enabled":"disabled"));renderAll();});
    qsa("[data-rule-remove]").forEach(b=>b.onclick=()=>{const r=state.rules.find(x=>x.id===b.dataset.ruleRemove);state.rules=state.rules.filter(x=>x.id!==b.dataset.ruleRemove);if(r)log("Rules","Rule removed",r.id+" · "+r.action+" "+r.ip);renderAll();toast("Rule removed",r?.id||"");});
  }

  $("ruleForm").addEventListener("submit",e=>{
    e.preventDefault();const ip=$("ruleIp").value.trim();if(!ip)return;
    const priority=Math.max(0,...state.rules.map(r=>r.priority))+10;
    const rule={id:uid("RULE"),priority,direction:$("ruleDirection").value,ip,port:$("rulePort").value.trim()||"ANY",protocol:$("ruleProtocol").value,action:$("ruleAction").value,enabled:true};
    state.rules.push(rule);$("ruleIp").value="";$("rulePort").value="ANY";log("Rules","Rule added",rule.action+" "+rule.direction+" "+rule.ip+":"+rule.port+" "+rule.protocol);renderAll();toast("Rule added",rule.action+" "+rule.ip);
  });

  function collectTrafficSample(){
    const lastD=state.traffic.download.at(-1)||8,lastU=state.traffic.upload.at(-1)||2;
    const wave=(state.history.length%9)-4;
    const down=Math.max(.2,Math.min(50,lastD+wave*.45+1.1));
    const up=Math.max(.1,Math.min(20,lastU+wave*.16+.35));
    state.traffic.download.push(Math.round(down*10)/10);
    state.traffic.upload.push(Math.round(up*10)/10);
    state.traffic.download=state.traffic.download.slice(-48);
    state.traffic.upload=state.traffic.upload.slice(-48);
    state.traffic.sessions=Math.max(8,state.traffic.sessions+((state.history.length%5)-2));
    state.traffic.blockedEvents+=state.threats.filter(t=>t.status==="open").length?1:0;
    log("Traffic","Telemetry sampled","Simulated counters refreshed: "+down.toFixed(1)+" Mbps down / "+up.toFixed(1)+" Mbps up.");
  }

  function renderTraffic(){
    const d=state.traffic.download.at(-1)||0,u=state.traffic.upload.at(-1)||0;
    $("trafficDownload").textContent=d.toFixed(1)+" Mbps";
    $("trafficUpload").textContent=u.toFixed(1)+" Mbps";
    $("trafficSessions").textContent=state.traffic.sessions;
    $("trafficBlocked").textContent=state.traffic.blockedEvents;
    renderTrafficChart("trafficChartFull","downloadLineFull","uploadLineFull","trafficLabelsFull",980,320);
    $("connectionRows").innerHTML=state.connections.map(c=>
      '<tr><td><span class="cell-title">'+esc(c.service)+'</span></td><td>'+esc(c.local)+'</td><td>'+esc(c.remote)+'</td><td>'+esc(c.protocol)+'</td><td>'+esc(c.state)+'</td><td class="connection-state '+esc(c.policy)+'">'+esc(c.policy.toUpperCase())+'</td></tr>'
    ).join("");
  }

  $("refreshTrafficBtn").addEventListener("click",()=>{collectTrafficSample();renderAll();toast("Traffic sample collected","Portfolio telemetry updated.");});

  function renderThreats(){
    const active=state.threats.filter(t=>t.status!=="resolved"),critical=active.filter(t=>["critical","high"].includes(t.severity)).length,ack=state.threats.filter(t=>t.status==="acknowledged").length,resolved=state.threats.filter(t=>t.status==="resolved").length;
    $("threatSummary").innerHTML=[
      ["Active",active.length,"open + acknowledged"],["High / Critical",critical,"priority review"],["Acknowledged",ack,"under review"],["Resolved",resolved,"closed events"]
    ].map(x=>'<article class="summary-card"><span>'+x[0]+'</span><strong>'+x[1]+'</strong><small>'+x[2]+'</small></article>').join("");

    $("threatCards").innerHTML=state.threats.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(t=>
      '<article class="threat-card '+esc(t.severity)+'"><div class="threat-top"><div><h4>'+esc(t.type)+'</h4><div class="threat-meta">'+badge(t.severity,toneFor(t.severity))+badge(t.status,toneFor(t.status))+'</div></div><time>'+esc(fmt(t.createdAt))+'</time></div>'+
      '<p>'+esc(t.detail)+'</p><div class="policy-row"><div><b>'+esc(t.source)+'</b><small>source</small></div><div><b>'+esc(t.target)+'</b><small>target</small></div></div>'+
      '<div class="threat-actions">'+(t.status==="open"?'<button class="btn ghost" data-threat-ack="'+esc(t.id)+'">Acknowledge</button>':'')+
      (t.status!=="resolved"?'<button class="btn primary" data-threat-resolve="'+esc(t.id)+'">Resolve</button>':'')+'</div></article>'
    ).join("");

    qsa("[data-threat-ack]").forEach(b=>b.onclick=()=>{const t=state.threats.find(x=>x.id===b.dataset.threatAck);if(!t)return;t.status="acknowledged";log("Threats","Threat acknowledged",t.type+" · "+t.source);renderAll();toast("Threat acknowledged",t.type);});
    qsa("[data-threat-resolve]").forEach(b=>b.onclick=()=>{const t=state.threats.find(x=>x.id===b.dataset.threatResolve);if(!t)return;t.status="resolved";log("Threats","Threat resolved",t.type+" · "+t.source);renderAll();toast("Threat resolved",t.type);});
  }

  $("generateThreatBtn").addEventListener("click",()=>{
    const candidates=[
      ["medium","Possible DoH bypass","192.168.137.101","198.51.100.53:443","Encrypted-DNS pattern observed during policy simulation."],
      ["low","QUIC attempt","192.168.137.120","203.0.113.90:443/UDP","UDP/443 traffic appeared while QUIC visibility policy was active."],
      ["high","Repeated blocked access","192.168.137.115","203.0.113.25:443","Blocked destination was retried repeatedly by an unknown device."]
    ];
    const c=candidates[state.threats.length%candidates.length];
    const t={id:uid("THR"),severity:c[0],status:"open",type:c[1],source:c[2],target:c[3],detail:c[4],createdAt:now()};
    state.threats.unshift(t);log("Threats","Threat generated",t.type+" · "+t.source);renderAll();toast("Threat event generated",t.type);
  });

  function renderTimeline(rows){
    return rows.length?rows.map(h=>
      '<div class="timeline-entry"><time>'+esc(fmt(h.at))+'</time><span class="module">'+esc(h.module||"System")+'</span><div><b>'+esc(h.action)+'</b><small>'+esc(h.detail)+'</small></div></div>'
    ).join(""):'<div class="empty">No history.</div>';
  }

  function renderHistory(){
    const modules=[...new Set(state.history.map(h=>h.module))].sort(),sel=$("historyModuleFilter"),prev=sel.value;
    sel.innerHTML='<option value="">All modules</option>'+modules.map(m=>'<option>'+esc(m)+'</option>').join("");
    if(modules.includes(prev))sel.value=prev;
    const q=$("historySearch").value.toLowerCase().trim();
    const rows=state.history.filter(h=>(!q||[h.module,h.action,h.detail].join(" ").toLowerCase().includes(q))&&(!sel.value||h.module===sel.value));
    $("historyList").innerHTML=renderTimeline(rows);
  }

  $("historySearch").addEventListener("input",renderHistory);
  $("historyModuleFilter").addEventListener("change",renderHistory);
  $("clearHistoryBtn").addEventListener("click",()=>{state.history=[];save();renderAll();toast("History cleared","Browser audit history removed.");});

  function renderSettings(){
    $("ipBlockingToggle").checked=!!state.settings.enable_ip_blocking;
    $("quicToggle").checked=!!state.settings.disable_quic;
    $("dohToggle").checked=!!state.settings.block_doh;
    $("ttlInput").value=state.settings.temp_ip_ttl||900;
    $("protectedIpList").innerHTML=state.protectedIps.map(p=>'<div class="protected-ip"><b>'+esc(p.ip)+'</b><span>'+esc(p.reason)+'</span></div>').join("");
  }

  $("saveSettingsBtn").addEventListener("click",()=>{
    state.settings.enable_ip_blocking=$("ipBlockingToggle").checked;
    state.settings.disable_quic=$("quicToggle").checked;
    state.settings.block_doh=$("dohToggle").checked;
    state.settings.temp_ip_ttl=Math.max(30,Math.min(86400,Number($("ttlInput").value)||900));
    log("Settings","Security settings updated","IP blocking "+(state.settings.enable_ip_blocking?"enabled":"disabled")+
      ", QUIC "+(state.settings.disable_quic?"disabled":"allowed")+", DoH policy "+(state.settings.block_doh?"enabled":"disabled")+".");
    renderAll();toast("Settings saved","Portfolio workspace updated.");
  });

  function renderGlobalSearch(value){
    const q=value.trim().toLowerCase(),box=$("searchResults");
    if(q.length<2){box.hidden=true;box.innerHTML="";return;}
    const hits=[];
    state.domains.forEach(x=>{if(x.domain.toLowerCase().includes(q))hits.push({type:"domain",title:x.domain,detail:"Web policy",page:"websites"});});
    state.ips.forEach(x=>{if(x.ip.includes(q))hits.push({type:"ip",title:x.ip,detail:x.reason,page:"websites"});});
    state.devices.forEach(x=>{if([x.name,x.ip,x.mac,x.vendor].join(" ").toLowerCase().includes(q))hits.push({type:"device",title:x.name,detail:x.ip+" · "+x.state,page:"devices"});});
    state.signatures.forEach(x=>{if([x.name,x.host,x.domain,x.range].join(" ").toLowerCase().includes(q))hits.push({type:"app",title:x.name,detail:x.action+" · "+(x.domain||x.host||x.range),page:"applications"});});
    state.rules.forEach(x=>{if([x.id,x.ip,x.port,x.protocol,x.action].join(" ").toLowerCase().includes(q))hits.push({type:"rule",title:x.id,detail:x.action+" "+x.ip+":"+x.port,page:"rules"});});
    state.threats.forEach(x=>{if([x.type,x.source,x.target,x.detail].join(" ").toLowerCase().includes(q))hits.push({type:"threat",title:x.type,detail:x.source+" → "+x.target,page:"threats"});});
    box.innerHTML=hits.slice(0,10).map((h,i)=>'<button class="search-hit" data-search-hit="'+i+'"><b>'+esc(h.title)+'</b><small>'+esc(h.type+" · "+h.detail)+'</small></button>').join("")||'<div class="empty">No matches.</div>';
    box.hidden=false;
    qsa("[data-search-hit]",box).forEach(b=>b.onclick=()=>{const h=hits[Number(b.dataset.searchHit)];box.hidden=true;$("globalSearch").value="";openPage(h.page);});
  }

  $("globalSearch").addEventListener("input",e=>renderGlobalSearch(e.target.value));
  document.addEventListener("click",e=>{if(!e.target.closest(".global-search-wrap"))$("searchResults").hidden=true;});

  $("resetBtn").addEventListener("click",()=>{
    if(!confirm("Reset the PyreWall Security Center browser workspace?"))return;
    state=seed();save();renderAll();openPage("overview");toast("Workspace reset","Seeded firewall workspace restored.");
  });

  $("exportBtn").addEventListener("click",()=>{
    log("System","Workspace exported","PyreWall Security Center JSON workspace exported.");
    const blob=new Blob([JSON.stringify({schema:"pyrewall-security-center",version:2,exportedAt:now(),workspace:state},null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="pyrewall-security-center.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });

  $("importInput").addEventListener("change",async()=>{
    const file=$("importInput").files?.[0];if(!file)return;
    try{
      const parsed=JSON.parse(await file.text()),next=parsed.workspace||parsed;
      if(!next||!Array.isArray(next.domains)||!Array.isArray(next.rules)||!Array.isArray(next.devices))throw new Error("Invalid PyreWall Security Center workspace.");
      const defaults=seed();
      state={...defaults,...next,settings:{...defaults.settings,...(next.settings||{})}};
      log("System","Workspace imported",file.name);save();renderAll();openPage("overview");toast("Workspace imported",file.name);
    }catch(e){toast("Import failed",e.message);}
    $("importInput").value="";
  });

  function renderAll(){
    renderOverview();
    renderWebsites();
    renderDevices();
    renderApplications();
    renderRules();
    renderTraffic();
    renderThreats();
    renderHistory();
    renderSettings();
  }

  renderAll();
})();