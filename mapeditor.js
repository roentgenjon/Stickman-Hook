// Stickman Hook - Map Editor v2
(function () {
  'use strict';

  var MAPS_KEY = 'STICKMANHOOK_custmaps';
  var SNAP = 0.025;

  function getMaps() { try { return JSON.parse(localStorage.getItem(MAPS_KEY)) || []; } catch (e) { return []; } }
  function saveMaps(m) { localStorage.setItem(MAPS_KEY, JSON.stringify(m)); }

  function el(tag, css) { var e = document.createElement(tag); if (css) e.style.cssText = css; return e; }
  function mkbtn(html, css, fn) { var b = el('button', css); b.innerHTML = html; b.onclick = fn; return b; }
  function sep(bar) { bar.appendChild(el('div', 'width:1px;height:34px;background:rgba(255,255,255,0.12);flex-shrink:0;margin:0 2px;')); }

  function rrect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ── My Maps Menu ─────────────────────────────────────────────
  function showMapsMenu() {
    var ex = document.getElementById('me-menu');
    if (ex) { ex.remove(); return; }
    var root = el('div', 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,4,60,0.96);z-index:300;display:flex;flex-direction:column;font-family:JUNEGULL,sans-serif;color:white;pointer-events:all;');
    root.id = 'me-menu';

    var hdr = el('div', 'display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(0,0,0,0.5);flex-shrink:0;');
    hdr.appendChild(mkbtn('✕', 'background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:6px;color:white;font-size:15px;width:32px;height:32px;cursor:pointer;font-family:sans-serif;', function () { root.remove(); }));
    var ttl = el('span', 'font-size:15px;flex:1;'); ttl.textContent = '🗺 Meine Maps'; hdr.appendChild(ttl);
    hdr.appendChild(mkbtn('+ Neue Map', 'padding:8px 14px;background:#3498db;border:none;border-radius:8px;color:white;font-family:JUNEGULL,sans-serif;font-size:12px;cursor:pointer;', function () { root.remove(); openEditor(null, null); }));
    root.appendChild(hdr);

    var list = el('div', 'flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:12px;display:flex;flex-direction:column;gap:8px;');
    var maps = getMaps();
    if (!maps.length) {
      var emp = el('div', 'text-align:center;padding:40px;opacity:0.6;font-size:13px;'); emp.textContent = 'Noch keine Maps — erstelle deine erste!'; list.appendChild(emp);
    } else {
      maps.forEach(function (map, idx) {
        var row = el('div', 'background:rgba(255,255,255,0.07);border-radius:8px;padding:11px 13px;display:flex;align-items:center;gap:8px;');
        var nm = el('span', 'flex:1;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;');
        nm.textContent = map.name || ('Map ' + (idx + 1)); row.appendChild(nm);
        var inf = el('span', 'font-size:10px;opacity:0.5;flex-shrink:0;');
        inf.textContent = ((map.data && map.data.hooks) ? map.data.hooks.length : 0) + '🪝 ' + ((map.data && map.data.bumpers) ? map.data.bumpers.length : 0) + '▬'; row.appendChild(inf);
        row.appendChild(mkbtn('▶', 'padding:7px 11px;background:#27ae60;border:none;border-radius:7px;color:white;font-size:14px;cursor:pointer;', function () { root.remove(); if (window._gameAPI) window._gameAPI.playCustomLevel(map.data); }));
        row.appendChild(mkbtn('✏', 'padding:7px 11px;background:#e67e22;border:none;border-radius:7px;color:white;font-size:13px;cursor:pointer;', function () { root.remove(); openEditor(idx, map); }));
        row.appendChild(mkbtn('🗑', 'padding:7px 10px;background:rgba(231,76,60,0.6);border:1px solid rgba(231,76,60,0.4);border-radius:7px;color:white;font-size:13px;cursor:pointer;', function () {
          if (!confirm('Map "' + (map.name || 'Map') + '" löschen?')) return;
          var m = getMaps(); m.splice(idx, 1); saveMaps(m); root.remove(); showMapsMenu();
        }));
        list.appendChild(row);
      });
    }
    root.appendChild(list);
    document.body.appendChild(root);
  }

  // ── Editor ────────────────────────────────────────────────────
  function openEditor(mapIdx, existingMap) {
    var ld = existingMap ? JSON.parse(JSON.stringify(existingMap.data)) : {
      spawnPoint: { x: 0.1, y: 0.4 }, background: 'background_0',
      hooks: [], bumpers: [], obstacles: [], finishLine: 0.65
    };
    var mapName = existingMap ? (existingMap.name || '') : '';

    var viewX = 0;   // world X at left edge of canvas
    var tool = 'hook';
    var bumperW = 0.12, bumperH = 0.04, bumperRot = 0;
    var snapOn = true;
    var hX = 0, hY = 0, hVis = false;
    var pDown = false, pStart = null, pMoved = false, finDrag = false;

    // ── Root ──
    var root = el('div', 'position:fixed;top:0;left:0;right:0;bottom:0;background:#080818;z-index:300;display:flex;flex-direction:column;font-family:JUNEGULL,sans-serif;color:white;pointer-events:all;-webkit-user-select:none;user-select:none;');
    root.id = 'me-editor';

    // ── Toolbar ──
    var bar = el('div', 'display:flex;align-items:center;gap:5px;padding:6px 8px;background:rgba(0,0,0,0.7);flex-shrink:0;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;');

    var TOOLS = [
      { id: 'spawn', i: '👤', l: 'Start',   c: '#2ecc71' },
      { id: 'hook',  i: '🪝', l: 'Haken',   c: '#3498db' },
      { id: 'bumper',i: '▬',  l: 'Bumper',  c: '#e67e22' },
      { id: 'finish',i: '🏁', l: 'Ziel',    c: '#f1c40f' },
      { id: 'delete',i: '🗑', l: 'Löschen', c: '#e74c3c' }
    ];
    var tBtns = {};

    function setTool(id) {
      tool = id;
      TOOLS.forEach(function (t) {
        var b = tBtns[t.id];
        b.style.background = t.id === id ? t.c : 'rgba(255,255,255,0.08)';
        b.style.borderColor = t.id === id ? t.c : 'rgba(255,255,255,0.18)';
        b.style.boxShadow = t.id === id ? ('0 0 8px ' + t.c + '60') : 'none';
      });
    }

    TOOLS.forEach(function (t) {
      var b = el('button', 'padding:4px 8px;border:1px solid rgba(255,255,255,0.18);border-radius:7px;color:white;font-family:JUNEGULL,sans-serif;font-size:10px;cursor:pointer;flex-shrink:0;background:rgba(255,255,255,0.08);line-height:1.5;min-width:42px;');
      b.innerHTML = t.i + '<br><span style="font-size:9px">' + t.l + '</span>';
      b.onclick = function () { setTool(t.id); };
      tBtns[t.id] = b; bar.appendChild(b);
    });

    sep(bar);

    // Background toggle
    var bgB = el('button', 'padding:4px 8px;border:1px solid rgba(155,89,182,0.4);border-radius:7px;color:white;font-family:JUNEGULL,sans-serif;font-size:10px;cursor:pointer;flex-shrink:0;background:rgba(155,89,182,0.25);line-height:1.5;min-width:44px;');
    function updBg() { bgB.innerHTML = '🌅<br><span style="font-size:9px">' + (ld.background === 'background_0' ? 'Nacht' : 'Tag') + '</span>'; }
    updBg(); bgB.onclick = function () { ld.background = ld.background === 'background_0' ? 'background_1' : 'background_0'; updBg(); draw(); };
    bar.appendChild(bgB);

    // Snap toggle
    var snapB = el('button', 'padding:4px 8px;border:1px solid rgba(255,255,255,0.18);border-radius:7px;color:white;font-family:JUNEGULL,sans-serif;font-size:10px;cursor:pointer;flex-shrink:0;line-height:1.5;min-width:44px;');
    function updSnap() {
      snapB.innerHTML = '⊞<br><span style="font-size:9px">' + (snapOn ? 'Raster' : 'Frei') + '</span>';
      snapB.style.background = snapOn ? 'rgba(52,152,219,0.35)' : 'rgba(255,255,255,0.08)';
      snapB.style.borderColor = snapOn ? '#3498db' : 'rgba(255,255,255,0.18)';
    }
    updSnap(); snapB.onclick = function () { snapOn = !snapOn; updSnap(); draw(); };
    bar.appendChild(snapB);

    sep(bar);

    // Bumper sliders
    var bWrap = el('div', 'display:flex;flex-direction:column;gap:2px;flex-shrink:0;');
    function mkSliderRow(lbl, mn, mx, st, val, cb) {
      var row = el('div', 'display:flex;align-items:center;gap:4px;');
      var l = el('span', 'font-size:9px;opacity:0.55;min-width:28px;'); l.textContent = lbl;
      var s = el('input', 'width:68px;');
      s.type = 'range'; s.min = String(mn); s.max = String(mx); s.step = String(st); s.value = String(val);
      s.oninput = function () { cb(parseFloat(s.value)); if (hVis) draw(); };
      row.appendChild(l); row.appendChild(s); return row;
    }
    bWrap.appendChild(mkSliderRow('Breite', 0.03, 0.40, 0.01, bumperW, function (v) { bumperW = v; }));
    bWrap.appendChild(mkSliderRow('Dreh', -1.57, 1.57, 0.05, 0, function (v) { bumperRot = v; }));
    bar.appendChild(bWrap);

    sep(bar);

    // Map length (= finish line X)
    var flWrap = el('div', 'display:flex;flex-direction:column;gap:2px;flex-shrink:0;');
    var flLbl = el('span', 'font-size:9px;opacity:0.55;'); flLbl.textContent = 'Kartenlänge';
    var flSlider = el('input', 'width:80px;accent-color:#f1c40f;');
    flSlider.type = 'range'; flSlider.min = '0.3'; flSlider.max = '5.0'; flSlider.step = '0.025'; flSlider.value = String(ld.finishLine);
    flSlider.oninput = function () { ld.finishLine = parseFloat(flSlider.value); updateSb(); draw(); };
    flWrap.appendChild(flLbl); flWrap.appendChild(flSlider);
    bar.appendChild(flWrap);

    bar.appendChild(el('div', 'flex:1;min-width:6px;'));

    bar.appendChild(mkbtn('▶ Test', 'padding:6px 10px;background:#3498db;border:none;border-radius:7px;color:white;font-family:JUNEGULL,sans-serif;font-size:11px;cursor:pointer;flex-shrink:0;', function () {
      if (!window._gameAPI) { alert('Spiel nicht bereit!'); return; }
      root.remove(); window._gameAPI.playCustomLevel(ld);
    }));

    bar.appendChild(mkbtn('💾', 'padding:6px 10px;background:#27ae60;border:none;border-radius:7px;color:white;font-family:sans-serif;font-size:16px;cursor:pointer;flex-shrink:0;', function () {
      var n = prompt('Map-Name:', mapName || 'Meine Map');
      if (n === null) return;
      mapName = n.trim() || 'Meine Map';
      var maps = getMaps(), entry = { name: mapName, data: ld };
      if (mapIdx !== null && mapIdx !== undefined && mapIdx >= 0 && mapIdx < maps.length) { maps[mapIdx] = entry; } else { maps.push(entry); mapIdx = maps.length - 1; }
      saveMaps(maps); stEl.textContent = '✓ "' + mapName + '" gespeichert!';
    }));

    bar.appendChild(mkbtn('✕', 'padding:6px 10px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:7px;color:white;font-size:14px;cursor:pointer;flex-shrink:0;font-family:sans-serif;', function () { root.remove(); showMapsMenu(); }));

    root.appendChild(bar);
    setTool(tool);

    // ── Canvas wrapper ──
    var wrap = el('div', 'flex:1;position:relative;overflow:hidden;');
    var canvas = el('canvas', 'position:absolute;top:0;left:0;display:block;touch-action:none;cursor:crosshair;');
    wrap.appendChild(canvas);

    var AS = 'position:absolute;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.18);border-radius:8px;color:white;font-size:22px;width:28px;height:52px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;pointer-events:all;padding:0;font-family:sans-serif;';
    wrap.appendChild(mkbtn('‹', AS + 'left:3px;', function () { viewX = Math.max(0, viewX - 0.25); updateSb(); draw(); }));
    wrap.appendChild(mkbtn('›', AS + 'right:3px;', function () { viewX = Math.min(Math.max(0, ld.finishLine - 0.1), viewX + 0.25); updateSb(); draw(); }));
    root.appendChild(wrap);

    // ── Scrollbar ──
    var sbWrap = el('div', 'height:14px;background:rgba(0,0,0,0.45);flex-shrink:0;position:relative;cursor:pointer;border-top:1px solid rgba(255,255,255,0.06);');
    var sbThumb = el('div', 'position:absolute;top:2px;height:10px;background:rgba(255,255,255,0.3);border-radius:5px;min-width:16px;');
    sbWrap.appendChild(sbThumb); root.appendChild(sbWrap);

    function updateSb() {
      var total = ld.finishLine + 0.3;
      sbThumb.style.left = (viewX / total * 100).toFixed(2) + '%';
      sbThumb.style.width = (1.0 / total * 100).toFixed(2) + '%';
    }

    var sbDrag = false;
    function sbMove(e) {
      if (!sbDrag) return;
      var rect = sbWrap.getBoundingClientRect();
      var cx = ((e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX) - rect.left) / rect.width;
      viewX = Math.max(0, Math.min(ld.finishLine, cx * (ld.finishLine + 0.3) - 0.1));
      updateSb(); draw();
    }
    sbWrap.addEventListener('mousedown', function (e) { sbDrag = true; sbMove(e); });
    sbWrap.addEventListener('touchstart', function (e) { e.preventDefault(); sbDrag = true; sbMove(e); }, { passive: false });
    document.addEventListener('mousemove', sbMove);
    document.addEventListener('touchmove', function (e) { if (sbDrag) { e.preventDefault(); sbMove(e); } }, { passive: false });
    document.addEventListener('mouseup', function () { sbDrag = false; });
    document.addEventListener('touchend', function () { sbDrag = false; });

    // ── Status bar ──
    var stEl = el('div', 'padding:3px 10px;background:rgba(0,0,0,0.65);font-size:10px;opacity:0.7;flex-shrink:0;letter-spacing:0.02em;');
    stEl.textContent = 'Werkzeug wählen → auf Map tippen zum Platzieren. Ziehen verschiebt die Ansicht.';
    root.appendChild(stEl);
    document.body.appendChild(root);

    // ── Drawing ──────────────────────────────────────────────────
    var BG = { background_0: ['#0a0928', '#0d1240'], background_1: ['#87CEEB', '#5a8a4a'] };

    function sv(v) { return snapOn ? Math.round(v / SNAP) * SNAP : v; }
    function toSX(wx2) { return (wx2 - viewX) * canvas.width; }
    function toSY(wy2) { return wy2 * canvas.height; }
    function toWX(sx) { return viewX + sx / canvas.width; }
    function toWY(sy) { return sy / canvas.height; }

    function dHook(ctx, sx, sy, a) {
      ctx.save(); ctx.globalAlpha = a;
      ctx.strokeStyle = '#3498db'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(sx, sy - 8, 5, Math.PI, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx + 5, sy - 8); ctx.lineTo(sx + 5, sy + 2); ctx.quadraticCurveTo(sx + 5, sy + 8, sx, sy + 8); ctx.stroke();
      ctx.beginPath(); ctx.arc(sx, sy + 2, 5, 0.5 * Math.PI, 1.5 * Math.PI);
      ctx.fillStyle = 'rgba(52,152,219,0.2)'; ctx.fill();
      ctx.strokeStyle = '#5dade2'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    }

    function dBumper(ctx, sx, sy, pw, ph, rot, a) {
      ctx.save(); ctx.globalAlpha = a;
      ctx.translate(sx, sy); ctx.rotate(rot);
      ctx.fillStyle = 'rgba(230,126,34,0.85)';
      rrect(ctx, -pw / 2, -ph / 2, pw, ph, 3); ctx.fill();
      ctx.strokeStyle = '#f39c12'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    }

    function dSpawn(ctx, sx, sy, a) {
      ctx.save(); ctx.globalAlpha = a;
      ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx, sy - 11, 5, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx, sy - 6); ctx.lineTo(sx, sy + 3);
      ctx.moveTo(sx - 6, sy - 2); ctx.lineTo(sx + 6, sy - 2);
      ctx.moveTo(sx, sy + 3); ctx.lineTo(sx - 5, sy + 11);
      ctx.moveTo(sx, sy + 3); ctx.lineTo(sx + 5, sy + 11);
      ctx.stroke();
      ctx.fillStyle = '#2ecc71'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
      ctx.fillText('START', sx, sy + 22);
      ctx.restore();
    }

    function draw() {
      var cw = canvas.width, ch = canvas.height;
      if (!cw || !ch) return;
      var ctx = canvas.getContext('2d');

      var bg = BG[ld.background] || BG.background_0;
      var gr = ctx.createLinearGradient(0, 0, 0, ch);
      gr.addColorStop(0, bg[0]); gr.addColorStop(1, bg[1]);
      ctx.fillStyle = gr; ctx.fillRect(0, 0, cw, ch);

      // Shade beyond finish line
      var flSX = toSX(ld.finishLine);
      if (flSX < cw) { ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(flSX, 0, cw - flSX, ch); }

      // Major grid (0.25 steps)
      ctx.lineWidth = 1;
      var mgStart = Math.floor(viewX / 0.25) * 0.25;
      for (var gx = mgStart; gx < viewX + 1.05; gx += 0.25) {
        if (gx < -0.001) continue;
        var px = toSX(gx);
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, ch); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '9px monospace'; ctx.textAlign = 'left';
        ctx.fillText(gx.toFixed(2), px + 2, 12);
      }
      for (var gy = 0; gy <= 1.0; gy += 0.25) {
        var py = toSY(gy);
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(cw, py); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '9px monospace';
        ctx.fillText(gy.toFixed(2), 2, py > 10 ? py - 3 : py + 11);
      }
      // Minor grid (SNAP steps)
      ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 1;
      var msStart = Math.floor(viewX / SNAP) * SNAP;
      for (var gx2 = msStart; gx2 < viewX + 1.05; gx2 += SNAP) {
        if (Math.abs(Math.round(gx2 / 0.25) * 0.25 - gx2) < 0.001) continue;
        ctx.beginPath(); ctx.moveTo(toSX(gx2), 0); ctx.lineTo(toSX(gx2), ch); ctx.stroke();
      }
      for (var gy2 = 0; gy2 <= 1.0; gy2 += SNAP) {
        if (Math.abs(Math.round(gy2 / 0.25) * 0.25 - gy2) < 0.001) continue;
        ctx.beginPath(); ctx.moveTo(0, toSY(gy2)); ctx.lineTo(cw, toSY(gy2)); ctx.stroke();
      }

      // Finish line — VERTICAL at x=finishLine
      ctx.save();
      ctx.strokeStyle = tool === 'finish' ? '#f1c40f' : 'rgba(241,196,15,0.75)';
      ctx.lineWidth = tool === 'finish' ? 3 : 2;
      ctx.setLineDash([8, 5]);
      ctx.beginPath(); ctx.moveTo(flSX, 0); ctx.lineTo(flSX, ch); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#f1c40f'; ctx.font = 'bold 10px JUNEGULL,sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('🏁 x=' + ld.finishLine.toFixed(3), flSX + 4, 16);
      // Drag handle at bottom
      ctx.beginPath(); ctx.arc(flSX, ch - 16, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#f1c40f'; ctx.fill();
      ctx.fillStyle = '#000'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('↔', flSX, ch - 12);
      ctx.restore();

      // Placed objects
      ld.hooks.forEach(function (h) {
        var sx = toSX(h.x);
        if (sx > -30 && sx < cw + 30) dHook(ctx, sx, toSY(h.y), 1);
      });
      ld.bumpers.forEach(function (b) {
        var sx = toSX(b.x);
        if (sx > -cw && sx < cw * 2) dBumper(ctx, sx, toSY(b.y), (b.w || 0.12) * cw, (b.h || 0.04) * ch, b.rotation || 0, 1);
      });
      dSpawn(ctx, toSX(ld.spawnPoint.x), toSY(ld.spawnPoint.y), 1);

      // Hover preview
      if (hVis) {
        var hsx = toSX(hX), hsy = toSY(hY);
        switch (tool) {
          case 'hook':   dHook(ctx, hsx, hsy, 0.4); break;
          case 'bumper': dBumper(ctx, hsx, hsy, bumperW * cw, bumperH * ch, bumperRot, 0.4); break;
          case 'spawn':  dSpawn(ctx, hsx, hsy, 0.4); break;
          case 'finish':
            ctx.save(); ctx.strokeStyle = 'rgba(241,196,15,0.4)'; ctx.lineWidth = 2; ctx.setLineDash([8, 5]);
            ctx.beginPath(); ctx.moveTo(hsx, 0); ctx.lineTo(hsx, ch); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
            break;
          case 'delete': {
            var near = nearObj(hX, hY);
            if (near.dist < 0.08) {
              ctx.save(); ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2;
              ctx.beginPath(); ctx.arc(toSX(near.x), toSY(near.y), 16, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
            }
            break;
          }
        }
        // Crosshair
        ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(hsx, 0); ctx.lineTo(hsx, ch); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, hsy); ctx.lineTo(cw, hsy); ctx.stroke();
        ctx.setLineDash([]);
        // Coordinate label
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '10px monospace'; ctx.textAlign = 'left';
        var lx = hsx + 8, ly = hsy - 6;
        if (lx + 110 > cw) lx = hsx - 118;
        if (ly < 14) ly = hsy + 16;
        ctx.fillText('x=' + hX.toFixed(3) + '  y=' + hY.toFixed(3), lx, ly);
        ctx.restore();
      }
    }

    function nearObj(nx, ny) {
      var best = { dist: Infinity, x: 0, y: 0, type: null, idx: -1 };
      ld.hooks.forEach(function (h, i) { var d = Math.hypot(h.x - nx, h.y - ny); if (d < best.dist) { best = { dist: d, x: h.x, y: h.y, type: 'hook', idx: i }; } });
      ld.bumpers.forEach(function (b, i) { var d = Math.hypot(b.x - nx, b.y - ny); if (d < best.dist) { best = { dist: d, x: b.x, y: b.y, type: 'bumper', idx: i }; } });
      var ds = Math.hypot(ld.spawnPoint.x - nx, ld.spawnPoint.y - ny);
      if (ds < best.dist) { best = { dist: ds, x: ld.spawnPoint.x, y: ld.spawnPoint.y, type: 'spawn', idx: 0 }; }
      return best;
    }

    // ── Resize ──
    function resize() { canvas.width = wrap.clientWidth; canvas.height = wrap.clientHeight; updateSb(); draw(); }
    var ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    // ── Input ────────────────────────────────────────────────────
    function getPos(e) {
      var rect = canvas.getBoundingClientRect();
      var src = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]) || e;
      var px = src.clientX - rect.left, py = src.clientY - rect.top;
      return { px: px, py: py, wx: sv(toWX(px)), wy: sv(toWY(py)), rawWX: toWX(px) };
    }

    function nearFinHandle(pos) {
      return Math.abs(toSX(ld.finishLine) - pos.px) < 20 && pos.py > canvas.height - 44;
    }

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('touchstart', onDown, { passive: false });
    function onDown(e) {
      e.preventDefault();
      var pos = getPos(e);
      if (nearFinHandle(pos)) { finDrag = true; return; }
      pDown = true; pStart = { px: pos.px, viewX: viewX }; pMoved = false;
    }

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('touchmove', onMove, { passive: false });
    function onMove(e) {
      e.preventDefault();
      var pos = getPos(e);

      if (finDrag) {
        ld.finishLine = Math.max(0.3, Math.min(5.0, sv(pos.rawWX)));
        flSlider.value = String(ld.finishLine);
        updateSb(); draw();
        stEl.textContent = '🏁 Ziellinie: x=' + ld.finishLine.toFixed(3);
        return;
      }

      hX = pos.wx; hY = pos.wy; hVis = true;

      if (pDown && pStart) {
        var dx = pos.px - pStart.px;
        if (Math.abs(dx) > 5) pMoved = true;
        if (pMoved) {
          viewX = Math.max(0, Math.min(ld.finishLine, pStart.viewX - dx / canvas.width));
          updateSb();
          stEl.textContent = 'Ansicht: x=' + viewX.toFixed(2) + '–' + (viewX + 1).toFixed(2);
          draw(); return;
        }
      }

      stEl.textContent = tool.toUpperCase() + '  x=' + pos.wx.toFixed(3) + '  y=' + pos.wy.toFixed(3);
      draw();
    }

    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('touchend', onUp, { passive: false });
    function onUp(e) {
      e.preventDefault();
      finDrag = false;
      if (pDown && !pMoved) {
        var pos = getPos(e);
        place(pos.wx, pos.wy);
      }
      pDown = false; pStart = null; pMoved = false;
    }

    canvas.addEventListener('mouseleave', function () { hVis = false; draw(); });

    function place(nx, ny) {
      nx = Math.max(0, nx); ny = Math.max(0, Math.min(1, ny));
      switch (tool) {
        case 'spawn':
          ld.spawnPoint = { x: nx, y: ny };
          stEl.textContent = 'Start gesetzt: x=' + nx.toFixed(3) + '  y=' + ny.toFixed(3); break;
        case 'hook':
          ld.hooks.push({ x: nx, y: ny });
          stEl.textContent = 'Haken: x=' + nx.toFixed(3) + '  y=' + ny.toFixed(3) + '  (gesamt: ' + ld.hooks.length + ')'; break;
        case 'bumper':
          ld.bumpers.push({ x: nx, y: ny, w: bumperW, h: bumperH, rotation: bumperRot });
          stEl.textContent = 'Bumper: x=' + nx.toFixed(3) + '  y=' + ny.toFixed(3); break;
        case 'finish':
          ld.finishLine = Math.max(0.3, nx);
          flSlider.value = String(ld.finishLine); updateSb();
          stEl.textContent = '🏁 Ziellinie: x=' + ld.finishLine.toFixed(3); break;
        case 'delete': {
          var near = nearObj(nx, ny);
          if (near.dist < 0.08) {
            if (near.type === 'hook') { ld.hooks.splice(near.idx, 1); stEl.textContent = 'Haken gelöscht.'; }
            else if (near.type === 'bumper') { ld.bumpers.splice(near.idx, 1); stEl.textContent = 'Bumper gelöscht.'; }
            else stEl.textContent = 'Startpunkt kann nicht gelöscht werden.';
          } else stEl.textContent = 'Kein Objekt in der Nähe.';
          break;
        }
      }
      draw();
    }
  }

  window._showMapMenu = showMapsMenu;
})();
