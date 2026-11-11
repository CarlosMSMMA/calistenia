(function(){
'use strict';

/* ---------- Plano ---------- */
var PHASES = [
  {name:'Fase 1', from:1, to:4, sets:2, ex:[
    {n:'Flexão na parede', r:'8–12 reps', t:'Mãos na altura dos ombros, corpo em linha reta.'},
    {n:'Sentar e levantar da cadeira', r:'8–12 reps', t:'Desça devagar, contando 3 segundos.'},
    {n:'Ponte de glúteo', r:'10–15 reps', t:'Deitado de costas, suba o quadril e aperte o glúteo.'},
    {n:'Bird-dog', r:'6 reps por lado', t:'De quatro apoios, estenda braço e perna opostos sem girar o tronco.'},
    {n:'Prancha na parede', r:'20 s', hold:20, t:'Corpo inclinado e firme, abdômen contraído.'}
  ]},
  {name:'Fase 2', from:5, to:8, sets:3, ex:[
    {n:'Flexão inclinada (bancada ou mesa firme)', r:'6–10 reps', t:'Quanto mais baixo o apoio, mais difícil.'},
    {n:'Agachar até a cadeira', r:'8–12 reps', t:'Sem usar as mãos; toque de leve na cadeira e suba.'},
    {n:'Ponte de glúteo', r:'12–15 reps', t:'Segure 1–2 s no alto de cada repetição.'},
    {n:'Dead bug', r:'8 reps por lado', t:'Lombar colada no chão; estenda braço e perna opostos devagar.'},
    {n:'Step-up em degrau baixo', r:'8 reps por perna', t:'Suba com controle, com o pé inteiro no degrau.'},
    {n:'Prancha inclinada na mesa', r:'20–30 s', hold:20, t:'Use +15 no cronômetro quando ficar fácil.'}
  ]},
  {name:'Fase 3', from:9, to:12, sets:3, ex:[
    {n:'Flexão inclinada mais baixa ou de joelhos', r:'6–10 reps', t:'Escolha a variação em que feche as repetições com boa técnica.'},
    {n:'Agachamento livre', r:'10–15 reps', t:'Pés na largura dos ombros; joelhos acompanham os pés.'},
    {n:'Afundo estático com apoio', r:'6–8 reps por perna', t:'Apoie a mão na parede ou na cadeira para manter o equilíbrio.'},
    {n:'Ponte unilateral', r:'8 reps por perna', t:'Uma perna estendida; suba o quadril sem girar.'},
    {n:'Prancha no chão (de joelhos)', r:'20–30 s', hold:20, t:'Quando ficar fácil, tente com os pés apoiados.'}
  ]}
];
var WD = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'], TRAIN = [1,3,5]; /* dias de treino: seg, qua, sex */
function dname(dt){ return WD[dt.getDay()]; }
var WARM = 'Aquecimento de 5 min: marcha no lugar, círculos de ombros e quadril, sentar e levantar devagar.';
var ALL = [];
for (var w=1; w<=12; w++) for (var d=0; d<3; d++) ALL.push(w+'-'+d);

/* ---------- Estado ---------- */
var LS = 'calistenia-casa-v1';
var state = fresh();
var view = {tab:'hoje', sid:null};
var ref = null, syncMsg = 'Só neste aparelho', writing = false, pending = false, saveT = null;

function fresh(){ return {v:1, start:'2026-11-11', rest:90, prog:{}, done:{}, meas:{}}; }
function mergeState(d){
  var f = fresh(); if(!d || typeof d !== 'object') return f;
  return {v:1, start: typeof d.start==='string' && /^\d{4}-\d{2}-\d{2}$/.test(d.start) ? d.start : f.start,
    rest: [60,90,120].indexOf(d.rest)>=0 ? d.rest : f.rest,
    prog: d.prog && typeof d.prog==='object' ? d.prog : {}, done: d.done && typeof d.done==='object' ? d.done : {},
    meas: d.meas && typeof d.meas==='object' ? d.meas : f.meas};
}
function loadLocal(){ try{ var s = localStorage.getItem(LS); if(s) state = mergeState(JSON.parse(s)); }catch(e){} }
function save(){ clearTimeout(saveT); saveT = setTimeout(persist, 500); setSync(ref ? 'Salvando…' : 'Só neste aparelho'); }
function persist(){
  try{ localStorage.setItem(LS, JSON.stringify(state)); }catch(e){}
  if(!ref) return;
  if(writing){ pending = true; return; }
  writing = true;
  var p; try{ p = Promise.resolve(ref.set(JSON.parse(JSON.stringify(state)))); }catch(e){ p = Promise.reject(e); }
  p.then(function(){ setSync('Salvo'); }, function(){ setSync('Não salvou na nuvem'); })
   .then(function(){ writing = false; if(pending){ pending = false; persist(); } });
}
function setSync(t){ syncMsg = t; var el = document.getElementById('sync'); if(el) el.textContent = t; }

/* ---------- Utilidades ---------- */
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function pad(n){ return n<10 ? '0'+n : ''+n; }
function iso(dt){ return dt.getFullYear()+'-'+pad(dt.getMonth()+1)+'-'+pad(dt.getDate()); }
function startDate(){ var p = state.start.split('-').map(Number); return new Date(p[0], p[1]-1, p[2]); }
/* O treino n (0..35) cai no n-ésimo dia de treino (seg/qua/sex) a partir da data de início. */
function dateOf(w, d){
  var s = startDate(), n = (w-1)*3 + d, dt = new Date(s.getFullYear(), s.getMonth(), s.getDate());
  while(TRAIN.indexOf(dt.getDay()) < 0) dt.setDate(dt.getDate()+1);
  for(var i=0; i<n; i++){ do { dt.setDate(dt.getDate()+1); } while(TRAIN.indexOf(dt.getDay()) < 0); }
  return dt;
}
function fmt(dt){ return pad(dt.getDate())+'/'+pad(dt.getMonth()+1); }
function phaseOf(w){ for(var i=0;i<PHASES.length;i++) if(w>=PHASES[i].from && w<=PHASES[i].to) return PHASES[i]; return PHASES[2]; }
function num(v){ if(v==null || v==='') return null; var n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : null; }
function fmtN(v){ return v.toFixed(1).replace('.', ','); }
function sess(sid){ var p = sid.split('-').map(Number); return {sid:sid, w:p[0], d:p[1], ph:phaseOf(p[0]), date:dateOf(p[0], p[1])}; }
function nextSid(){ for(var i=0;i<ALL.length;i++) if(!state.done[ALL[i]]) return ALL[i]; return ALL[ALL.length-1]; }
function doneCount(){ var n=0; ALL.forEach(function(s){ if(state.done[s]) n++; }); return n; }
function getProg(sid){
  var S = sess(sid), p = state.prog[sid];
  if(!p){ p = state.prog[sid] = {warm:false, sets:{}, effort:null, note:''}; }
  S.ph.ex.forEach(function(e, i){ if(!p.sets[i] || p.sets[i].length !== S.ph.sets){ p.sets[i] = []; for(var k=0;k<S.ph.sets;k++) p.sets[i].push(false); } });
  return p;
}
function setsLeft(sid){ var S = sess(sid), p = getProg(sid), n = 0; S.ph.ex.forEach(function(e,i){ p.sets[i].forEach(function(v){ if(!v) n++; }); }); return n; }
function setsDone(sid){ var S = sess(sid); return S.ph.ex.length*S.ph.sets - setsLeft(sid); }

/* ---------- Cronômetro ---------- */
var T = null, tick = null, ac = null, lock = null;
function unlockAudio(){ try{ ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if(ac.state === 'suspended') ac.resume(); }catch(e){} }
function beep(f, dur, at){
  try{ var o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + at;
    o.frequency.value = f; o.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t+0.02); g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    o.start(t); o.stop(t+dur+0.02); }catch(e){}
}
function alarm(){ [0,0.35,0.7].forEach(function(a){ beep(880, 0.25, a); }); try{ if(navigator.vibrate) navigator.vibrate([250,120,250,120,250]); }catch(e){} }
function wake(on){
  try{
    if(on && navigator.wakeLock && !lock){ navigator.wakeLock.request('screen').then(function(l){ lock = l; l.addEventListener('release', function(){ lock = null; }); }, function(){}); }
    if(!on && lock){ lock.release(); lock = null; }
  }catch(e){}
}
function left(){ if(!T) return 0; return T.paused !== null ? T.paused : Math.max(0, Math.ceil((T.endAt - Date.now())/1000)); }
function clock(s){ return Math.floor(s/60)+':'+pad(s%60); }
function startTimer(label, secs, onDone){
  unlockAudio();
  T = {label:label, total:secs, endAt:Date.now()+secs*1000, paused:null, onDone:onDone||null, fin:false};
  if(!tick) tick = setInterval(timerTick, 250);
  document.getElementById('dock').hidden = false;
  wake(true); timerTick();
}
function stopTimer(){
  T = null; if(tick){ clearInterval(tick); tick = null; }
  document.getElementById('dock').hidden = true; document.title = 'Calistenia em Casa'; wake(false);
}
function timerTick(){
  if(!T) return;
  var l = left(), dock = document.getElementById('dock');
  dock.classList.toggle('fin', T.fin);
  document.getElementById('dl').textContent = T.fin ? 'Pronto. Próxima série.' : T.label;
  document.getElementById('dt').textContent = clock(l);
  document.getElementById('dp').textContent = T.paused !== null ? 'Retomar' : 'Pausar';
  document.getElementById('ds').textContent = T.fin ? 'OK' : 'Parar';
  document.getElementById('db').style.width = (T.fin ? 0 : Math.min(100, 100*l/Math.max(1,T.total))) + '%';
  if(!T.fin) document.title = clock(l) + ' · ' + T.label;
  if(l <= 0 && !T.fin && T.paused === null){
    T.fin = true; alarm(); wake(false); document.title = 'Pronto · Calistenia';
    var cb = T.onDone; T.onDone = null;
    if(cb) cb();
    if(T && T.fin) timerTick();
  }
}
function adjustTimer(n){
  if(!T || T.fin) return;
  if(T.paused !== null){ T.paused = Math.max(1, T.paused + n); }
  else { T.endAt = Math.max(Date.now()+1000, T.endAt + n*1000); }
  T.total = Math.max(T.total, left()); timerTick();
}
function pauseTimer(){
  if(!T || T.fin) return;
  if(T.paused === null){ T.paused = left(); } else { T.endAt = Date.now() + T.paused*1000; T.paused = null; }
  timerTick();
}

/* ---------- Telas ---------- */
function totalSets(){
  var n = 0;
  Object.keys(state.prog).forEach(function(sid){ var p = state.prog[sid]; if(!p || !p.sets) return; Object.keys(p.sets).forEach(function(i){ (p.sets[i]||[]).forEach(function(v){ if(v) n++; }); }); });
  return n;
}
function renderTop(){
  var n = doneCount(), cur = sess(view.sid || nextSid());
  document.getElementById('meter-i').style.width = (100*n/ALL.length) + '%';
  document.getElementById('meter').setAttribute('aria-valuenow', n);
  document.getElementById('k-treinos').textContent = n + '/' + ALL.length;
  document.getElementById('k-semana').textContent = cur.w + '/12';
  document.getElementById('k-series').textContent = totalSets();
  document.getElementById('eyebrow').textContent = cur.ph.name + ' · ' + dname(cur.date) + ' ' + fmt(cur.date);
  document.getElementById('sync').textContent = syncMsg;
  var tabs = document.querySelectorAll('.tab');
  for(var i=0;i<tabs.length;i++){ if(tabs[i].getAttribute('data-tab') === view.tab) tabs[i].setAttribute('aria-current','page'); else tabs[i].removeAttribute('aria-current'); }
}
function render(){
  if(!view.sid) view.sid = nextSid();
  var html = view.tab === 'plano' ? vPlano() : view.tab === 'medidas' ? vMedidas() : vHoje();
  document.getElementById('view').innerHTML = html;
  renderTop();
}

function vHoje(){
  var S = sess(view.sid), p = getProg(S.sid), dn = state.done[S.sid], today = iso(new Date()) === iso(S.date);
  var idx = ALL.indexOf(S.sid), h = '';
  h += '<div class="card"><div class="session-head">'
    + '<button type="button" class="nav" data-act="nav" data-n="-1" aria-label="Treino anterior"' + (idx===0?' disabled':'') + '>‹</button>'
    + '<div style="text-align:center"><h2>' + dname(S.date) + ' · ' + fmt(S.date) + '</h2>'
    + '<div class="row" style="justify-content:center;margin-top:4px"><span class="pill">Semana ' + S.w + '</span><span class="pill">' + S.ph.name + '</span>'
    + (today ? '<span class="pill today">Hoje</span>' : '') + (dn ? '<span class="pill ok">Concluído</span>' : '') + '</div></div>'
    + '<button type="button" class="nav" data-act="nav" data-n="1" aria-label="Próximo treino"' + (idx===ALL.length-1?' disabled':'') + '>›</button></div></div>';

  h += '<div class="card"><div class="small muted" style="margin-bottom:8px">Descanso entre séries</div><div class="chips">'
    + [60,90,120].map(function(s){ return '<button type="button" class="chip" data-act="rest" data-n="'+s+'" aria-pressed="'+(state.rest===s)+'">'+s+' s</button>'; }).join('') + '</div></div>';

  h += '<button type="button" class="warm" data-act="warm" aria-pressed="' + !!p.warm + '"' + (dn?' disabled':'') + '><span class="box">✓</span><span>' + esc(WARM) + '</span></button>';

  S.ph.ex.forEach(function(e, i){
    h += '<div class="card ex' + (p.sets[i].every(function(v){ return v; }) ? ' all' : '') + '"><div class="meta"><h3>' + esc(e.n) + '</h3><span class="reps">' + S.ph.sets + ' × ' + esc(e.r) + '</span></div>'
      + '<div class="small muted">' + esc(e.t) + '</div><div class="sets">';
    p.sets[i].forEach(function(on, k){
      if(e.hold && !on){
        h += '<button type="button" class="set" data-act="hold" data-ex="'+i+'" data-i="'+k+'"' + (dn?' disabled':'') + '>▶ ' + e.hold + ' s</button>';
      } else {
        h += '<button type="button" class="set" data-act="set" data-ex="'+i+'" data-i="'+k+'" aria-pressed="'+on+'"' + (dn?' disabled':'') + '>' + (on ? '✓ ' : '') + 'Série ' + (k+1) + '</button>';
      }
    });
    h += '</div></div>';
  });

  if(dn){
    var nx = nextSid(), last = doneCount() === ALL.length;
    h += '<div class="banner"><b>Treino concluído</b><br>Em ' + esc(dn.at ? dn.at.split('-').reverse().slice(0,2).join('/') : '') + (dn.effort ? ' · esforço ' + dn.effort + '/10' : '')
      + (dn.note ? '<div class="small" style="font-weight:400;margin-top:6px">' + esc(dn.note) + '</div>' : '')
      + '<div class="row">' + (last ? '' : '<button type="button" class="btn" data-act="open" data-sid="'+nx+'">Ir para o próximo treino</button>')
      + '<button type="button" class="btn" data-act="undo">Desfazer conclusão</button></div></div>';
  } else {
    h += '<div class="card stack"><div><div class="small muted" style="margin-bottom:8px">Como foi o esforço? (1 leve · 10 máximo)</div><div class="chips">'
      + [1,2,3,4,5,6,7,8,9,10].map(function(n){ return '<button type="button" class="chip" data-act="effort" data-n="'+n+'" aria-pressed="'+(p.effort===n)+'">'+n+'</button>'; }).join('') + '</div></div>'
      + '<label class="f" for="note">Notas<textarea id="note" placeholder="Dor, energia, o que ficou fácil ou difícil">' + esc(p.note) + '</textarea></label>'
      + '<button type="button" class="btn primary" data-act="finish">Concluir treino · ' + setsDone(S.sid) + '/' + (S.ph.ex.length*S.ph.sets) + ' séries</button></div>';
  }
  return h;
}

function vPlano(){
  var h = '<div class="card legend">' + PHASES.map(function(p){ return '<div><b>' + p.name + '</b> · semanas ' + p.from + '–' + p.to + ' · ' + p.sets + ' séries por exercício</div>'; }).join('')
    + '<div class="muted">Ao chegar no topo das repetições em todas as séries, passe para a variação seguinte.</div></div>';
  h += '<div class="card">';
  var nx = nextSid();
  for(var w=1; w<=12; w++){
    h += '<div class="week"><div><b>Sem ' + w + '</b><div class="small muted">' + phaseOf(w).name + '</div></div><div class="chips">';
    for(var d=0; d<3; d++){
      var sid = w+'-'+d, dn = !!state.done[sid];
      h += '<button type="button" class="chip' + (dn?' done':'') + (sid===nx && !dn?' cur':'') + '" data-act="open" data-sid="'+sid+'">' + dname(dateOf(w,d)) + '<br>' + fmt(dateOf(w,d)) + (dn?' ✓':'') + '</button>';
    }
    h += '</div></div>';
  }
  return h + '</div>';
}

function vMedidas(){
  var h = '<div id="msum" class="card stack">' + medSummary() + '</div>';
  h += '<div class="card"><div class="small muted" style="margin-bottom:10px">Meça uma vez por semana, no dia do primeiro treino, em jejum e no mesmo horário. A semana 0 é a medida inicial.</div>'
    + '<div class="grid-m"><span class="h">Sem</span><span class="h">Peso (kg)</span><span class="h">Cintura (cm)</span><span class="h">Caminhada (min)</span>';
  for(var k=0; k<=12; k++){
    var m = state.meas[k] || {};
    h += '<span><b>' + k + '</b></span>'
      + '<input type="text" inputmode="decimal" aria-label="Peso na semana '+k+'" data-wk="'+k+'" data-f="w" value="' + esc(m.w!=null?String(m.w).replace('.',','):'') + '">'
      + '<input type="text" inputmode="decimal" aria-label="Cintura na semana '+k+'" data-wk="'+k+'" data-f="c" value="' + esc(m.c!=null?String(m.c).replace('.',','):'') + '">'
      + '<input type="text" inputmode="numeric" aria-label="Minutos de caminhada na semana '+k+'" data-wk="'+k+'" data-f="walk" value="' + esc(m.walk!=null?m.walk:'') + '">';
  }
  h += '</div></div>';
  h += '<div class="card"><label class="f" for="start">Data de início (dia do primeiro treino)<input type="date" id="start" value="' + esc(state.start) + '"></label>'
    + '<div class="small muted" style="margin-top:8px">Mudar a data reajusta as datas de todos os treinos.</div></div>';
  return h;
}
function series(f){ var a = []; for(var k=0;k<=12;k++){ var v = num(state.meas[k] && state.meas[k][f]); if(v!=null) a.push([k,v]); } return a; }
function kpi(label, f){
  var a = series(f); if(!a.length) return '<div class="kpi"><span class="small muted">'+label+'</span><b>—</b></div>';
  var first = a[0][1], last = a[a.length-1][1], dlt = last-first;
  return '<div class="kpi"><span class="small muted">'+label+'</span><b>' + fmtN(last) + '</b><span class="small muted">início ' + fmtN(first) + (a.length>1 ? ' · ' + (dlt>0?'+':dlt<0?'−':'') + fmtN(Math.abs(dlt)) : '') + '</span></div>';
}
function medSummary(){
  var walk = 0; for(var k=0;k<=12;k++){ var v = num(state.meas[k] && state.meas[k].walk); if(v!=null) walk += v; }
  return '<div class="kpis">' + kpi('Peso (kg)', 'w') + kpi('Cintura (cm)', 'c') + '</div>'
    + '<div class="small muted">Caminhada acumulada: <b>' + Math.round(walk) + ' min</b></div>' + spark();
}
function spark(){
  var pts = series('w');
  if(pts.length < 2) return '<p class="muted small" style="margin:0">Registre o peso em duas semanas para ver a curva.</p>';
  var W=320, H=100, pl=34, pr=10, pt=10, pb=20, vs = pts.map(function(p){ return p[1]; }), lo = Math.min.apply(null,vs), hi = Math.max.apply(null,vs);
  if(hi-lo < 1){ lo -= 0.5; hi += 0.5; }
  var x = function(k){ return pl + (W-pl-pr)*k/12; }, y = function(v){ return pt + (H-pt-pb)*(1-(v-lo)/(hi-lo)); };
  var line = pts.map(function(p){ return x(p[0]).toFixed(1)+','+y(p[1]).toFixed(1); }).join(' '), lp = pts[pts.length-1];
  return '<svg class="spark" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Peso por semana">'
    + '<line class="gr" x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y(hi).toFixed(1)+'" y2="'+y(hi).toFixed(1)+'"/><line class="gr" x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y(lo).toFixed(1)+'" y2="'+y(lo).toFixed(1)+'"/>'
    + '<text x="'+(pl-4)+'" y="'+(y(hi)+3).toFixed(1)+'" text-anchor="end">'+fmtN(hi)+'</text><text x="'+(pl-4)+'" y="'+(y(lo)+3).toFixed(1)+'" text-anchor="end">'+fmtN(lo)+'</text>'
    + '<text x="'+pl+'" y="'+(H-4)+'" text-anchor="middle">0</text><text x="'+(W-pr)+'" y="'+(H-4)+'" text-anchor="middle">12</text>'
    + '<polyline class="ln" points="'+line+'"/><circle class="dot" cx="'+x(lp[0]).toFixed(1)+'" cy="'+y(lp[1]).toFixed(1)+'" r="4"/></svg>';
}

/* ---------- Eventos ---------- */
document.addEventListener('click', function(ev){
  var el = ev.target.closest ? ev.target.closest('[data-act]') : null; if(!el || el.disabled) return;
  var a = el.getAttribute('data-act'), n = Number(el.getAttribute('data-n')), sid = view.sid, S, p;
  if(a === 'tab'){ view.tab = el.getAttribute('data-tab'); render(); window.scrollTo(0,0); return; }
  if(a === 'tadd'){ adjustTimer(n); return; }
  if(a === 'tpause'){ pauseTimer(); return; }
  if(a === 'tstop'){ stopTimer(); return; }
  if(a === 'nav'){ var i = ALL.indexOf(sid) + n; if(i>=0 && i<ALL.length){ view.sid = ALL[i]; render(); } return; }
  if(a === 'open'){ view.sid = el.getAttribute('data-sid'); view.tab = 'hoje'; render(); window.scrollTo(0,0); return; }
  if(a === 'rest'){ state.rest = n; save(); render(); return; }
  S = sess(sid); p = getProg(sid);
  if(a === 'warm'){ p.warm = !p.warm; save(); render(); return; }
  if(a === 'effort'){ p.effort = p.effort === n ? null : n; save(); render(); return; }
  if(a === 'set'){
    var ex = Number(el.getAttribute('data-ex')), k = Number(el.getAttribute('data-i'));
    p.sets[ex][k] = !p.sets[ex][k]; save(); render();
    if(p.sets[ex][k] && setsLeft(sid) > 0) startTimer('Descanso', state.rest);
    return;
  }
  if(a === 'hold'){
    var ex2 = Number(el.getAttribute('data-ex')), k2 = Number(el.getAttribute('data-i')), e = S.ph.ex[ex2];
    startTimer(e.n + ' · série ' + (k2+1), e.hold, function(){
      var pp = getProg(sid); pp.sets[ex2][k2] = true; save();
      if(view.sid === sid && view.tab === 'hoje') render();
      if(setsLeft(sid) > 0) startTimer('Descanso', state.rest);
    });
    return;
  }
  if(a === 'finish'){ state.done[sid] = {at: iso(new Date()), effort: p.effort, note: p.note}; stopTimer(); save(); render(); window.scrollTo(0,0); return; }
  if(a === 'undo'){ delete state.done[sid]; save(); render(); return; }
});
document.addEventListener('input', function(ev){
  var t = ev.target;
  if(t.id === 'note'){ var p = getProg(view.sid); p.note = t.value; save(); }
});
document.addEventListener('change', function(ev){
  var t = ev.target;
  if(t.id === 'start'){ if(/^\d{4}-\d{2}-\d{2}$/.test(t.value)){ state.start = t.value; save(); render(); } return; }
  var wk = t.getAttribute && t.getAttribute('data-wk');
  if(wk != null){
    var f = t.getAttribute('data-f'), v = num(t.value);
    if(!state.meas[wk]) state.meas[wk] = {};
    if(v == null) delete state.meas[wk][f]; else state.meas[wk][f] = v;
    save();
    var box = document.getElementById('msum'); if(box) box.innerHTML = medSummary();
  }
});

/* ---------- Início ---------- */
loadLocal();
view.sid = nextSid();
render();

function boot(){
  if(typeof claude === 'undefined' || !claude.use){ setSync('Só neste aparelho'); return; }
  var timeout = new Promise(function(res){ setTimeout(function(){ res(null); }, 10000); });
  Promise.race([Promise.all([claude.use('db'), claude.use('user')]), timeout]).then(function(r){
    if(!r || !r[0] || !r[1]){ setSync('Só neste aparelho'); return null; }
    return Promise.resolve(r[1].id()).then(function(id){
      ref = r[0].collection('data/users/' + id).doc('progress');
      return ref.get();
    }).then(function(snap){
      var d = null;
      try{ var ex = typeof snap.exists === 'function' ? snap.exists() : snap.exists; if(ex !== false) d = typeof snap.data === 'function' ? snap.data() : snap; }catch(e){}
      if(d && d.v){ state = mergeState(d); try{ localStorage.setItem(LS, JSON.stringify(state)); }catch(e){} view.sid = view.sid || nextSid(); render(); setSync('Salvo'); }
      else { persist(); }
    });
  }).catch(function(){ ref = null; setSync('Só neste aparelho'); });
}
boot();
})();
