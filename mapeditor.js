// Stickman Hook - Map Editor
(function () {
  'use strict';

  var MAPS_KEY = 'STICKMANHOOK_custmaps';

  function getMaps() {
    try { return JSON.parse(localStorage.getItem(MAPS_KEY)) || []; } catch (e) { return []; }
  }
  function saveMaps(maps) {
    localStorage.setItem(MAPS_KEY, JSON.stringify(maps));
  }

  // ── helpers ──────────────────────────────────────────────────
  function el(tag, css, attrs) {
    var e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (attrs) Object.keys(attrs).forEach(function (k) { e[k] = attrs[k]; });
    return e;
  }
  function btn(label, css, onclick) {
    var b = el('button', css);
    b.textContent = label;
    b.onclick = onclick;
    return b;
  }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
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
    var existing = document.getElementById('me-menu');
    if (existing) { existing.remove(); return; }

    var root = el('div', 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,4,60,0.96);z-index:300;display:flex;flex-direction:column;font-family:JUNEGULL,sans-serif;color:white;pointer-events:all;-webkit-user-select:none;user-select:none;');
    root.id = 'me-menu';

    // Header
    var hdr = el('div', 'display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(0,0,0,0.5);flex-shrink:0;');
    hdr.appendChild(btn('✕', 'background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:6px;color:white;font-size:15px;width:32px;height:32px;cursor:pointer;font-family:sans-serif;flex-shrink:0;', function () { root.remove(); }));
    var titleSpan = el('span', 'font-size:15px;flex:1;');
    titleSpan.textContent = '🗺 Meine Maps';
    hdr.appendChild(titleSpan);
    hdr.appendChild(btn('+ Neue Map', 'padding:8px 14px;background:#3498db;border:none;border-radius:8px;color:white;font-family:JUNEGULL,sans-serif;font-size:12px;cursor:pointer;flex-shrink:0;', function () {
      root.remove();
      openEditor(null, null);
    }));
    root.appendChild(hdr);

    // List
    var list = el('div', 'flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:12px;display:flex;flex-direction:column;gap:8px;');
    var maps = getMaps();

    if (maps.length === 0) {
      var emp = el('div', 'text-align:center;padding:40px 20px;opacity:0.6;font-size:13px;line-height:1.6;');
      emp.textContent = 'Noch keine Maps.\nErstelle deine erste mit "+ Neue Map"!';
      list.appendChild(emp);
    } else {
      maps.forEach(function (map, idx) {
        var row = el('div', 'background:rgba(255,255,255,0.07);border-radius:8px;padding:11px 13px;display:flex;align-items:center;gap:8px;');

        var nameSpan = el('span', 'flex:1;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;');
        nameSpan.textContent = map.name || ('Map ' + (idx + 1));
        row.appendChild(nameSpan);

        var hookCount = (map.data && map.data.hooks) ? map.data.hooks.length : 0;
        var bumpCount = (map.data && map.data.bumpers) ? map.data.bumpers.length : 0;
        var info = el('span', 'font-size:10px;opacity:0.5;flex-shrink:0;');
        info.textContent = hookCount + '🪝 ' + bumpCount + '▬';
        row.appendChild(info);

        row.appendChild(btn('▶', 'padding:7px 11px;background:#27ae60;border:none;border-radius:7px;color:white;font-family:sans-serif;font-size:14px;cursor:pointer;flex-shrink:0;', function () {
          root.remove();
          if (window._gameAPI) window._gameAPI.playCustomLevel(map.data);
        }));
        row.appendChild(btn('✏', 'padding:7px 11px;background:#e67e22;border:none;border-radius:7px;color:white;font-family:sans-serif;font-size:13px;cursor:pointer;flex-shrink:0;', function () {
          root.remove();
          openEditor(idx, map);
        }));
        row.appendChild(btn('🗑', 'padding:7px 10px;background:rgba(231,76,60,0.6);border:1px solid rgba(231,76,60,0.5);border-radius:7px;color:white;font-family:sans-serif;font-size:13px;cursor:pointer;flex-shrink:0;', function () {
          if (!confirm('Map "' + (map.name || 'Map') + '" löschen?')) return;
          var m = getMaps(); m.splice(idx, 1); saveMaps(m);
          root.remove(); showMapsMenu();
        }));

        list.appendChild(row);
      });
    }

    root.appendChild(list);
    document.body.appendChild(root);
  }

  // ── Map Editor ───────────────────────────────────────────────
  function openEditor(mapIdx, existingMap) {
    var ld = existingMap ? JSON.parse(JSON.stringify(existingMap.data)) : {
      spawnPoint: { x: 0.1, y: 0.4 },
      background: 'background_0',
      hooks: [],
      bumpers: [],
      obstacles: [],
      finishLine: 0.65
    };
    var mapName = existingMap ? (existingMap.name || '') : '';

    var root = el('div', 'position:fixed;top:0;left:0;right:0;bottom:0;background:#080818;z-index:300;display:flex;flex-direction:column;font-family:JUNEGULL,sans-serif;color:white;pointer-events:all;-webkit-user-select:none;user-select:none;touch-action:none;');
    root.id = 'me-editor';

    // ── Toolbar ──────────────────────────────────────────
    var bar = el('div', 'display:flex;align-items:center;gap:6px;padding:7px 8px;background:rgba(0,0,0,0.65);flex-shrink:0;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;');

    var TOOLS = [
      { id: 'spawn',  icon: '👤', label: 'Start',   color: '#2ecc71' },
      { id: 'hook',   icon: '🪝', label: 'Haken',   color: '#3498db' },
      { id: 'bumper', icon: '▬',  label: 'Bumper',  color: '#e67e22' },
      { id: 'finish', icon: '🏁', label: 'Ziel',    color: '#f1c40f' },
      { id: 'delete', icon: '🗑', label: 'Löschen', color: '#e74c3c' }
    ];
    var activeTool = 'hook';
    var toolBtns = {};

    function setTool(id) {
      activeTool = id;
      TOOLS.forEach(function (t) {
        toolBtns[t.id].style.background = t.id === id ? t.color : 'rgba(255,255,255,0.1)';
        toolBtns[t.id].style.borderColor = t.id === id ? t.color : 'rgba(255,255,255,0.2)';
      });
    }

    TOOLS.forEach(function (tool) {
      var b = el('button', 'padding:5px 9px;border:1px solid rgba(255,255,255,0.2);border-radius:7px;color:white;font-family:JUNEGULL,sans-serif;font-size:10px;cursor:pointer;flex-shrink:0;white-space:nowrap;background:rgba(255,255,255,0.1);line-height:1.4;');
      b.innerHTML = tool.icon + '<br><span style="font-size:9px">' + tool.label + '</span>';
      b.onclick = function () { setTool(tool.id); };
      toolBtns[tool.id] = b;
      bar.appendChild(b);
    });

    // Background toggle
    var bgBtn = el('button', 'padding:5px 9px;border:1px solid rgba(155,89,182,0.6);border-radius:7px;color:white;font-family:JUNEGULL,sans-serif;font-size:10px;cursor:pointer;flex-shrink:0;background:rgba(155,89,182,0.35);margin-left:2px;white-space:nowrap;line-height:1.4;');
    function updateBgBtn() {
      bgBtn.innerHTML = '🌅<br><span style="font-size:9px">' + (ld.background === 'background_0' ? 'Nacht' : 'Tag') + '</span>';
    }
    updateBgBtn();
    bgBtn.onclick = function () {
      ld.background = ld.background === 'background_0' ? 'background_1' : 'background_0';
      updateBgBtn();
      draw();
    };
    bar.appendChild(bgBtn);

    // Bumper size slider
    var bumperW = 0.12, bumperH = 0.04, bumperRot = 0;

    var sliderWrap = el('div', 'display:flex;flex-direction:column;gap:2px;flex-shrink:0;margin-left:4px;');
    var wLabel = el('span', 'font-size:9px;opacity:0.6;');
    wLabel.textContent = 'Breite';
    var wSlider = el('input', 'width:70px;', { type: 'range', min: '0.03', max: '0.40', step: '0.01', value: String(bumperW) });
    wSlider.oninput = function () { bumperW = parseFloat(wSlider.value); };
    sliderWrap.appendChild(wLabel);
    sliderWrap.appendChild(wSlider);

    var rLabel = el('span', 'font-size:9px;opacity:0.6;margin-top:2px;');
    rLabel.textContent = 'Dreh';
    var rSlider = el('input', 'width:70px;', { type: 'range', min: '-1.57', max: '1.57', step: '0.05', value: '0' });
    rSlider.oninput = function () { bumperRot = parseFloat(rSlider.value); };
    sliderWrap.appendChild(rLabel);
    sliderWrap.appendChild(rSlider);
    bar.appendChild(sliderWrap);

    // Spacer
    var spacer = el('div', 'flex:1;flex-shrink:0;min-width:4px;');
    bar.appendChild(spacer);

    // Test button
    bar.appendChild(btn('▶ Test', 'padding:6px 11px;background:#3498db;border:none;border-radius:7px;color:white;font-family:JUNEGULL,sans-serif;font-size:11px;cursor:pointer;flex-shrink:0;', function () {
      if (!window._gameAPI) { alert('Spiel nicht bereit!'); return; }
      root.remove();
      window._gameAPI.playCustomLevel(ld);
    }));

    // Save
    bar.appendChild(btn('💾', 'padding:6px 10px;background:#27ae60;border:none;border-radius:7px;color:white;font-family:sans-serif;font-size:16px;cursor:pointer;flex-shrink:0;', function () {
      var n = prompt('Map-Name:', mapName || 'Meine Map');
      if (n === null) return;
      mapName = (n.trim()) || 'Meine Map';
      var maps = getMaps();
      var entry = { name: mapName, data: ld };
      if (mapIdx !== null && mapIdx !== undefined && mapIdx >= 0 && mapIdx < maps.length) {
        maps[mapIdx] = entry;
      } else {
        maps.push(entry);
        mapIdx = maps.length - 1;
      }
      saveMaps(maps);
      status.textContent = '✓ "' + mapName + '" gespeichert!';
    }));

    // Close
    bar.appendChild(btn('✕', 'background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);border-radius:7px;color:white;font-size:14px;padding:6px 10px;cursor:pointer;flex-shrink:0;font-family:sans-serif;', function () {
      root.remove();
      showMapsMenu();
    }));

    root.appendChild(bar);
    setTool(activeTool);

    // ── Canvas area ───────────────────────────────────────
    var wrap = el('div', 'flex:1;position:relative;overflow:hidden;');
    var canvas = el('canvas', 'position:absolute;top:0;left:0;display:block;touch-action:none;cursor:crosshair;');
    wrap.appendChild(canvas);
    root.appendChild(wrap);

    // ── Status bar ────────────────────────────────────────
    var status = el('div', 'padding:4px 10px;background:rgba(0,0,0,0.5);font-size:10px;opacity:0.65;flex-shrink:0;pointer-events:none;');
    status.textContent = 'Wähle ein Werkzeug, tippe auf die Map um Objekte zu platzieren.';
    root.appendChild(status);

    document.body.appendChild(root);

    // ── Draw ─────────────────────────────────────────────
    var BG = {
      background_0: ['#0a0928', '#0d1240'],
      background_1: ['#87CEEB', '#5a8a4a']
    };

    function toX(n) { return n * canvas.width; }
    function toY(n) { return n * canvas.height; }

    function draw() {
      var cw = canvas.width, ch = canvas.height;
      if (!cw || !ch) return;
      var ctx = canvas.getContext('2d');
      var bg = BG[ld.background] || BG.background_0;
      var gr = ctx.createLinearGradient(0, 0, 0, ch);
      gr.addColorStop(0, bg[0]);
      gr.addColorStop(1, bg[1]);
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, cw, ch);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      for (var gx = 0; gx <= 10; gx++) {
        ctx.beginPath(); ctx.moveTo(gx * cw / 10, 0); ctx.lineTo(gx * cw / 10, ch); ctx.stroke();
      }
      for (var gy = 0; gy <= 10; gy++) {
        ctx.beginPath(); ctx.moveTo(0, gy * ch / 10); ctx.lineTo(cw, gy * ch / 10); ctx.stroke();
      }

      // Finish line
      var flY = toY(ld.finishLine);
      ctx.save();
      ctx.strokeStyle = 'rgba(241,196,15,0.85)';
      ctx.lineWidth = activeTool === 'finish' ? 4 : 2;
      ctx.setLineDash([10, 6]);
      ctx.beginPath(); ctx.moveTo(0, flY); ctx.lineTo(cw, flY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#f1c40f';
      ctx.font = 'bold 10px JUNEGULL,sans-serif';
      ctx.fillText('🏁 ZIEL', 6, flY - 5);
      // drag handle
      ctx.beginPath();
      ctx.arc(cw - 14, flY, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(241,196,15,0.9)';
      ctx.fill();
      ctx.restore();

      // Hooks
      ld.hooks.forEach(function (h) {
        var hx = toX(h.x), hy = toY(h.y);
        ctx.save();
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(hx, hy - 7, 5, Math.PI, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(hx + 5, hy - 7);
        ctx.lineTo(hx + 5, hy + 2);
        ctx.quadraticCurveTo(hx + 5, hy + 7, hx, hy + 7);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(hx, hy + 3, 5, 0.5 * Math.PI, 1.5 * Math.PI);
        ctx.fillStyle = 'rgba(52,152,219,0.3)';
        ctx.fill();
        ctx.strokeStyle = '#5dade2';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      });

      // Bumpers
      ld.bumpers.forEach(function (b) {
        var bx = toX(b.x), by = toY(b.y);
        var bw = (b.w || 0.12) * cw;
        var bh = (b.h || 0.04) * ch;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(b.rotation || 0);
        ctx.fillStyle = 'rgba(230,126,34,0.85)';
        rrect(ctx, -bw / 2, -bh / 2, bw, bh, 3);
        ctx.fill();
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      });

      // Spawn point
      var sx = toX(ld.spawnPoint.x), sy = toY(ld.spawnPoint.y);
      ctx.save();
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 2;
      // head
      ctx.beginPath(); ctx.arc(sx, sy - 10, 5, 0, Math.PI * 2); ctx.stroke();
      // body
      ctx.beginPath();
      ctx.moveTo(sx, sy - 5); ctx.lineTo(sx, sy + 4);
      ctx.moveTo(sx - 6, sy - 2); ctx.lineTo(sx + 6, sy - 2);
      ctx.moveTo(sx, sy + 4); ctx.lineTo(sx - 4, sy + 11);
      ctx.moveTo(sx, sy + 4); ctx.lineTo(sx + 4, sy + 11);
      ctx.stroke();
      ctx.fillStyle = '#2ecc71';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('START', sx, sy + 21);
      ctx.restore();
    }

    // ── Resize ───────────────────────────────────────────
    function resize() {
      canvas.width = wrap.clientWidth;
      canvas.height = wrap.clientHeight;
      draw();
    }
    var ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    // ── Pointer/touch input ───────────────────────────────
    var draggingFinish = false;
    var lastPos = null;

    function evPos(e) {
      var rect = canvas.getBoundingClientRect();
      var cx, cy;
      if (e.touches && e.touches.length > 0) {
        cx = e.touches[0].clientX; cy = e.touches[0].clientY;
      } else {
        cx = e.clientX; cy = e.clientY;
      }
      return { nx: (cx - rect.left) / rect.width, ny: (cy - rect.top) / rect.height };
    }

    function nearFinishHandle(pos) {
      var dY = Math.abs(pos.ny - ld.finishLine);
      var dX = Math.abs(pos.nx - 1.0);
      return dY < 0.04 && dX < 0.08;
    }

    function nearestObject(nx, ny) {
      var best = { dist: Infinity, type: null, idx: -1 };
      ld.hooks.forEach(function (h, i) {
        var d = Math.hypot(h.x - nx, h.y - ny);
        if (d < best.dist) { best.dist = d; best.type = 'hook'; best.idx = i; }
      });
      ld.bumpers.forEach(function (b, i) {
        var d = Math.hypot(b.x - nx, b.y - ny);
        if (d < best.dist) { best.dist = d; best.type = 'bumper'; best.idx = i; }
      });
      var ds = Math.hypot(ld.spawnPoint.x - nx, ld.spawnPoint.y - ny);
      if (ds < best.dist) { best.dist = ds; best.type = 'spawn'; best.idx = 0; }
      return best;
    }

    function place(nx, ny) {
      nx = Math.max(0, Math.min(1, nx));
      ny = Math.max(0, Math.min(1, ny));
      switch (activeTool) {
        case 'spawn':
          ld.spawnPoint = { x: nx, y: ny };
          status.textContent = 'Startpunkt gesetzt (' + nx.toFixed(2) + ', ' + ny.toFixed(2) + ')';
          break;
        case 'hook':
          ld.hooks.push({ x: nx, y: ny });
          status.textContent = 'Haken gesetzt — gesamt: ' + ld.hooks.length;
          break;
        case 'bumper':
          ld.bumpers.push({ x: nx, y: ny, w: bumperW, h: bumperH, rotation: bumperRot });
          status.textContent = 'Bumper gesetzt — gesamt: ' + ld.bumpers.length;
          break;
        case 'finish':
          ld.finishLine = ny;
          status.textContent = 'Ziellinie gesetzt bei y=' + ny.toFixed(2);
          break;
        case 'delete': {
          var near = nearestObject(nx, ny);
          if (near.dist < 0.06) {
            if (near.type === 'hook') {
              ld.hooks.splice(near.idx, 1);
              status.textContent = 'Haken gelöscht.';
            } else if (near.type === 'bumper') {
              ld.bumpers.splice(near.idx, 1);
              status.textContent = 'Bumper gelöscht.';
            } else {
              status.textContent = 'Startpunkt kann nicht gelöscht werden.';
            }
          } else {
            status.textContent = 'Nichts in der Nähe zum Löschen.';
          }
          break;
        }
      }
      draw();
    }

    function onStart(e) {
      e.preventDefault();
      var pos = evPos(e);
      lastPos = pos;
      if (nearFinishHandle(pos)) { draggingFinish = true; return; }
      place(pos.nx, pos.ny);
    }

    function onMove(e) {
      e.preventDefault();
      if (!draggingFinish) return;
      var pos = evPos(e);
      ld.finishLine = Math.max(0.05, Math.min(0.95, pos.ny));
      draw();
    }

    function onEnd(e) {
      e.preventDefault();
      draggingFinish = false;
    }

    canvas.addEventListener('mousedown', onStart);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onEnd);
    canvas.addEventListener('touchstart', onStart, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onEnd, { passive: false });
  }

  window._showMapMenu = showMapsMenu;
})();
