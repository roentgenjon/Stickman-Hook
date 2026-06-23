// Stickman Hook API - Cloudflare Worker
var corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

function getRankLabel(rankIndex) {
    if (typeof rankIndex !== 'number' || rankIndex < 0) return null;
    var tiers=['\u{1FAA8} Stein','\u{1F949} Bronze','⚙️ Eisen','\u{1F948} Silber','\u{1F947} Gold','\u{1F33F} Jade','\u{1F49C} Amethyst','\u{1F499} Saphir','❤️ Rubin','\u{1F49A} Smaragd','\u{1F48E} Diamant','\u{1F52E} Kristall','\u{1F9CA} Eis','\u{1F525} Feuer','⚡ Blitz','\u{1F30A} Wasser','☀️ Sonne','\u{1F319} Mond','⭐ Stern','\u{1F31F} Supernova','✨ Magie','\u{1F4AB} Komet','\u{1F30C} Galaxis','\u{1FA90} Planet','\u{1F308} Regenbogen','\u{1F451} Platin','\u{1F3C5} Meister','\u{1F396}️ Gro\xDFmeister','\u{1F3C6} Champion','\u{1F531} Legende'];
    var tierIdx=Math.floor(rankIndex/10);
    if(tierIdx<0||tierIdx>=tiers.length) return null;
    return tiers[tierIdx]+' '+(rankIndex%10+1);
}

function getUpgradeCost(targetIndex) {
    return Math.ceil(100 * Math.pow(1.08, targetIndex));
}

function respond(data, status) {
    return new Response(JSON.stringify(data), {
        status: status || 200,
        headers: Object.assign({ 'Content-Type': 'application/json' }, corsHeaders)
    });
}

function publicPlayer(player) {
    return {
        name: player.name,
        trophies: player.trophies || 0,
        coins: player.coins || 0,
        maxLevel: player.maxLevel || 0,
        rankIndex: typeof player.rankIndex === 'number' ? player.rankIndex : -1,
        rank: player.rank || null,
        hasPin: !!(player.pin && player.pin.length > 0),
        mainAccount: player.mainAccount || null,
        subAccounts: Array.isArray(player.subAccounts) ? player.subAccounts : [],
        updatedAt: player.updatedAt || 0
    };
}

function validName(name) {
    return name && name.length > 0 && /^[\w\-äöüÄÖÜß ]+$/.test(name);
}

async function updateLeaderboardCache(lb, player) {
    var idx = -1;
    for (var i = 0; i < lb.length; i++) {
        if (lb[i].name.toLowerCase() === player.name.toLowerCase()) { idx = i; break; }
    }
    var entry = {
        name: player.name,
        trophies: player.trophies || 0,
        maxLevel: player.maxLevel || 0,
        rankIndex: typeof player.rankIndex === 'number' ? player.rankIndex : -1,
        rank: player.rank || null
    };
    if (idx >= 0) { lb[idx] = entry; } else { lb.push(entry); }
    lb.sort(function(a, b) { return b.trophies - a.trophies; });
    if (lb.length > 100) lb.length = 100;
    var pos = -1;
    for (var j = 0; j < lb.length; j++) {
        if (lb[j].name.toLowerCase() === player.name.toLowerCase()) { pos = j + 1; break; }
    }
    return { lb: lb, position: pos > 0 ? pos : lb.length + 1 };
}

addEventListener('fetch', function(event) {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    var url = new URL(request.url);
    var path = url.pathname;

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    // GET /api/leaderboard
    if (path === '/api/leaderboard' && request.method === 'GET') {
        var lb = await PLAYERS.get('lb_cache', 'json') || [];
        return respond(lb.slice(0, 50));
    }

    // GET /api/player/{name}  — strips PIN, adds hasPin + account metadata
    if (path.startsWith('/api/player/') && request.method === 'GET') {
        var pname = decodeURIComponent(path.slice(12)).slice(0, 20);
        var player = await PLAYERS.get('player:' + pname.toLowerCase(), 'json');
        if (!player) return respond({ error: 'Nicht gefunden' }, 404);
        return respond(publicPlayer(player));
    }

    // POST /api/sync
    if (path === '/api/sync' && request.method === 'POST') {
        var body;
        try { body = await request.json(); } catch(e) { return respond({ error: 'Bad JSON' }, 400); }
        if (!body || !body.name) return respond({ error: 'Name fehlt' }, 400);

        var name = String(body.name).trim().slice(0, 20);
        if (!validName(name)) return respond({ error: 'Ungültiger Name' }, 400);

        var key = 'player:' + name.toLowerCase();
        var existing = await PLAYERS.get(key, 'json') || {};

        var trophies  = Math.max(0, Math.min(999999,  parseInt(body.trophies) || 0));
        var coins     = Math.max(0, Math.min(99999999, parseInt(body.coins)    || 0));
        var maxLevel  = Math.max(0, Math.min(99999,   parseInt(body.maxLevel)  || 0));
        var rankIndex = typeof body.rankIndex === 'number' ? Math.max(-1, Math.min(299, body.rankIndex)) : (existing.rankIndex || -1);

        // Sub-account: transfer earned coins to main account, keep none locally
        if (existing.mainAccount && coins > 0) {
            var mainKey = 'player:' + existing.mainAccount.toLowerCase();
            var mainAcc = await PLAYERS.get(mainKey, 'json');
            if (mainAcc) {
                mainAcc.coins = Math.min(99999999, (mainAcc.coins || 0) + coins);
                mainAcc.updatedAt = Date.now();
                await PLAYERS.put(mainKey, JSON.stringify(mainAcc));
                var mlb = await PLAYERS.get('lb_cache', 'json') || [];
                var mr = await updateLeaderboardCache(mlb, mainAcc);
                await PLAYERS.put('lb_cache', JSON.stringify(mr.lb));
            }
            coins = 0;
        }

        var updated = {
            name: name,
            trophies: trophies,
            coins: coins,
            maxLevel: Math.max(maxLevel, existing.maxLevel || 0),
            rankIndex: Math.max(rankIndex, existing.rankIndex || -1),
            rank: getRankLabel(Math.max(rankIndex, existing.rankIndex || -1)),
            pin: existing.pin || '',
            mainAccount: existing.mainAccount || null,
            subAccounts: existing.subAccounts || [],
            updatedAt: Date.now()
        };

        await PLAYERS.put(key, JSON.stringify(updated));
        var lbData = await PLAYERS.get('lb_cache', 'json') || [];
        var result = await updateLeaderboardCache(lbData, updated);
        await PLAYERS.put('lb_cache', JSON.stringify(result.lb));

        return respond({ ok: true, player: publicPlayer(updated), position: result.position });
    }

    // POST /api/send-coins
    if (path === '/api/send-coins' && request.method === 'POST') {
        var sbody;
        try { sbody = await request.json(); } catch(e) { return respond({ error: 'Bad JSON' }, 400); }
        if (!sbody || !sbody.from || !sbody.to || !sbody.amount) return respond({ error: 'Parameter fehlen' }, 400);
        var amount = parseInt(sbody.amount);
        if (!amount || amount <= 0 || amount > 10000000) return respond({ error: 'Ungültiger Betrag' }, 400);

        var fromKey = 'player:' + String(sbody.from).toLowerCase().slice(0, 20);
        var toKey   = 'player:' + String(sbody.to).toLowerCase().slice(0, 20);
        if (fromKey === toKey) return respond({ error: 'Kannst dir keine Münzen senden' }, 400);

        var sender    = await PLAYERS.get(fromKey, 'json');
        var recipient = await PLAYERS.get(toKey,   'json');
        if (!sender)    return respond({ error: 'Sender nicht gefunden' }, 404);
        if (!recipient) return respond({ error: 'Empfänger nicht gefunden' }, 404);
        if (sender.coins < amount) return respond({ error: 'Nicht genug Münzen' }, 400);

        sender.coins    -= amount;
        recipient.coins += amount;
        sender.updatedAt    = Date.now();
        recipient.updatedAt = Date.now();

        await PLAYERS.put(fromKey, JSON.stringify(sender));
        await PLAYERS.put(toKey,   JSON.stringify(recipient));
        return respond({ ok: true, newBalance: sender.coins });
    }

    // POST /api/upgrade-rank
    if (path === '/api/upgrade-rank' && request.method === 'POST') {
        var ubody;
        try { ubody = await request.json(); } catch(e) { return respond({ error: 'Bad JSON' }, 400); }
        if (!ubody || !ubody.name || typeof ubody.targetIndex !== 'number') return respond({ error: 'Parameter fehlen' }, 400);
        var targetIdx = ubody.targetIndex;
        if (targetIdx < 0 || targetIdx > 299) return respond({ error: 'Ungültiger Rang' }, 400);

        var ukey = 'player:' + String(ubody.name).toLowerCase().slice(0, 20);
        var uplayer = await PLAYERS.get(ukey, 'json');
        if (!uplayer) return respond({ error: 'Spieler nicht gefunden' }, 404);

        var curIdx = typeof uplayer.rankIndex === 'number' ? uplayer.rankIndex : -1;
        if (targetIdx !== curIdx + 1) return respond({ error: 'Nur ein Rang auf einmal upgraden' }, 400);

        var cost = getUpgradeCost(targetIdx);
        if (uplayer.coins < cost) return respond({ error: 'Nicht genug Münzen' }, 400);

        uplayer.coins    -= cost;
        uplayer.rankIndex = targetIdx;
        uplayer.rank      = getRankLabel(targetIdx);
        uplayer.updatedAt = Date.now();

        await PLAYERS.put(ukey, JSON.stringify(uplayer));
        var ulbData = await PLAYERS.get('lb_cache', 'json') || [];
        var uResult = await updateLeaderboardCache(ulbData, uplayer);
        await PLAYERS.put('lb_cache', JSON.stringify(uResult.lb));

        return respond({ ok: true, player: publicPlayer(uplayer) });
    }

    // POST /api/rename
    if (path === '/api/rename' && request.method === 'POST') {
        var rnbody;
        try { rnbody = await request.json(); } catch(e) { return respond({ error: 'Bad JSON' }, 400); }
        if (!rnbody || !rnbody.name || !rnbody.newName) return respond({ error: 'Parameter fehlen' }, 400);

        var oldKey = 'player:' + String(rnbody.name).toLowerCase().slice(0, 20);
        var rnplayer = await PLAYERS.get(oldKey, 'json');
        if (!rnplayer) return respond({ error: 'Account nicht gefunden' }, 404);
        if (rnplayer.pin && rnbody.pin !== rnplayer.pin) return respond({ error: 'Falsche PIN' }, 401);

        var newName = String(rnbody.newName).trim().slice(0, 20);
        if (!validName(newName)) return respond({ error: 'Ungültiger Name' }, 400);

        var newKey = 'player:' + newName.toLowerCase();
        if (newKey !== oldKey) {
            var conflict = await PLAYERS.get(newKey, 'json');
            if (conflict) return respond({ error: 'Name bereits vergeben' }, 409);
        }

        rnplayer.name = newName;
        rnplayer.updatedAt = Date.now();
        await PLAYERS.put(newKey, JSON.stringify(rnplayer));
        if (newKey !== oldKey) await PLAYERS.delete(oldKey);

        // Update sub-accounts' mainAccount pointer
        if (rnplayer.subAccounts && rnplayer.subAccounts.length > 0) {
            for (var si = 0; si < rnplayer.subAccounts.length; si++) {
                var subK = 'player:' + rnplayer.subAccounts[si].toLowerCase();
                var subP = await PLAYERS.get(subK, 'json');
                if (subP) { subP.mainAccount = newName; subP.updatedAt = Date.now(); await PLAYERS.put(subK, JSON.stringify(subP)); }
            }
        }
        // Update parent's subAccounts list entry
        if (rnplayer.mainAccount) {
            var parK = 'player:' + rnplayer.mainAccount.toLowerCase();
            var parP = await PLAYERS.get(parK, 'json');
            if (parP && parP.subAccounts) {
                parP.subAccounts = parP.subAccounts.map(function(s) {
                    return s.toLowerCase() === String(rnbody.name).toLowerCase() ? newName : s;
                });
                parP.updatedAt = Date.now();
                await PLAYERS.put(parK, JSON.stringify(parP));
            }
        }

        var rnlb = await PLAYERS.get('lb_cache', 'json') || [];
        rnlb = rnlb.filter(function(p) { return p.name.toLowerCase() !== String(rnbody.name).toLowerCase(); });
        var rnResult = await updateLeaderboardCache(rnlb, rnplayer);
        await PLAYERS.put('lb_cache', JSON.stringify(rnResult.lb));

        return respond({ ok: true, player: publicPlayer(rnplayer) });
    }

    // POST /api/set-pin
    if (path === '/api/set-pin' && request.method === 'POST') {
        var spbody;
        try { spbody = await request.json(); } catch(e) { return respond({ error: 'Bad JSON' }, 400); }
        if (!spbody || !spbody.name) return respond({ error: 'Parameter fehlen' }, 400);

        var spkey = 'player:' + String(spbody.name).toLowerCase().slice(0, 20);
        var splayer = await PLAYERS.get(spkey, 'json');
        if (!splayer) return respond({ error: 'Account nicht gefunden' }, 404);
        if (splayer.pin && spbody.currentPin !== splayer.pin) return respond({ error: 'Falsche aktuelle PIN' }, 401);

        splayer.pin = spbody.newPin ? String(spbody.newPin).slice(0, 8) : '';
        splayer.updatedAt = Date.now();
        await PLAYERS.put(spkey, JSON.stringify(splayer));
        return respond({ ok: true, hasPin: !!splayer.pin });
    }

    // POST /api/verify-pin
    if (path === '/api/verify-pin' && request.method === 'POST') {
        var vpbody;
        try { vpbody = await request.json(); } catch(e) { return respond({ error: 'Bad JSON' }, 400); }
        if (!vpbody || !vpbody.name) return respond({ error: 'Parameter fehlen' }, 400);

        var vpkey = 'player:' + String(vpbody.name).toLowerCase().slice(0, 20);
        var vplayer = await PLAYERS.get(vpkey, 'json');
        if (!vplayer) return respond({ error: 'Account nicht gefunden' }, 404);
        if (!vplayer.pin) return respond({ ok: true });
        if (vpbody.pin !== vplayer.pin) return respond({ error: 'Falsche PIN' }, 401);
        return respond({ ok: true });
    }

    // POST /api/create-subaccount
    if (path === '/api/create-subaccount' && request.method === 'POST') {
        var csbody;
        try { csbody = await request.json(); } catch(e) { return respond({ error: 'Bad JSON' }, 400); }
        if (!csbody || !csbody.mainName || !csbody.subName) return respond({ error: 'Parameter fehlen' }, 400);

        var mainAccKey = 'player:' + String(csbody.mainName).toLowerCase().slice(0, 20);
        var mainAcc2 = await PLAYERS.get(mainAccKey, 'json');
        if (!mainAcc2) return respond({ error: 'Haupt-Account nicht gefunden' }, 404);
        if (mainAcc2.pin && csbody.pin !== mainAcc2.pin) return respond({ error: 'Falsche PIN' }, 401);

        var subNameRaw = String(csbody.subName).trim().slice(0, 20);
        if (!validName(subNameRaw)) return respond({ error: 'Ungültiger Name' }, 400);

        var subAccKey2 = 'player:' + subNameRaw.toLowerCase();
        var existingSub = await PLAYERS.get(subAccKey2, 'json');
        if (existingSub) return respond({ error: 'Name bereits vergeben' }, 409);

        var subAcc2 = {
            name: subNameRaw,
            coins: 0, trophies: 0, maxLevel: 0, rankIndex: -1, rank: null,
            pin: csbody.subPin ? String(csbody.subPin).slice(0, 8) : '',
            mainAccount: mainAcc2.name,
            subAccounts: [],
            updatedAt: Date.now()
        };
        await PLAYERS.put(subAccKey2, JSON.stringify(subAcc2));

        mainAcc2.subAccounts = mainAcc2.subAccounts || [];
        if (mainAcc2.subAccounts.indexOf(subNameRaw) === -1) mainAcc2.subAccounts.push(subNameRaw);
        mainAcc2.updatedAt = Date.now();
        await PLAYERS.put(mainAccKey, JSON.stringify(mainAcc2));

        return respond({ ok: true, subAccount: publicPlayer(subAcc2) });
    }

    // POST /api/delete-account
    if (path === '/api/delete-account' && request.method === 'POST') {
        var dabody;
        try { dabody = await request.json(); } catch(e) { return respond({ error: 'Bad JSON' }, 400); }
        if (!dabody || !dabody.name) return respond({ error: 'Parameter fehlen' }, 400);

        var dakey = 'player:' + String(dabody.name).toLowerCase().slice(0, 20);
        var daplayer = await PLAYERS.get(dakey, 'json');
        if (!daplayer) return respond({ error: 'Account nicht gefunden' }, 404);
        if (daplayer.pin && dabody.pin !== daplayer.pin) return respond({ error: 'Falsche PIN' }, 401);

        var removedNames = [dabody.name.toLowerCase()];

        if (daplayer.subAccounts && daplayer.subAccounts.length > 0) {
            for (var di = 0; di < daplayer.subAccounts.length; di++) {
                var dsn = daplayer.subAccounts[di].toLowerCase();
                removedNames.push(dsn);
                await PLAYERS.delete('player:' + dsn);
            }
        }

        if (daplayer.mainAccount) {
            var dparK = 'player:' + daplayer.mainAccount.toLowerCase();
            var dparP = await PLAYERS.get(dparK, 'json');
            if (dparP && dparP.subAccounts) {
                dparP.subAccounts = dparP.subAccounts.filter(function(s) { return s.toLowerCase() !== dabody.name.toLowerCase(); });
                dparP.updatedAt = Date.now();
                await PLAYERS.put(dparK, JSON.stringify(dparP));
            }
        }

        await PLAYERS.delete(dakey);
        var dalb = await PLAYERS.get('lb_cache', 'json') || [];
        dalb = dalb.filter(function(p) { return removedNames.indexOf(p.name.toLowerCase()) === -1; });
        await PLAYERS.put('lb_cache', JSON.stringify(dalb));

        return respond({ ok: true });
    }

    // POST /api/reset-player  (wipe stats, keep account)
    if (path === '/api/reset-player' && request.method === 'POST') {
        var rbody;
        try { rbody = await request.json(); } catch(e) { return respond({ error: 'Bad JSON' }, 400); }
        if (!rbody || !rbody.name) return respond({ error: 'Name fehlt' }, 400);

        var rkey = 'player:' + String(rbody.name).toLowerCase().slice(0, 20);
        await PLAYERS.delete(rkey);
        var rlb = await PLAYERS.get('lb_cache', 'json') || [];
        rlb = rlb.filter(function(p) { return p.name.toLowerCase() !== String(rbody.name).toLowerCase(); });
        await PLAYERS.put('lb_cache', JSON.stringify(rlb));

        return respond({ ok: true });
    }

    // GET /api/maps — community map list
    if (path === '/api/maps' && request.method === 'GET') {
        var mapList = await PLAYERS.get('map_list', 'json') || [];
        return respond(mapList.slice(0, 50));
    }

    // GET /api/map/{id} — full map data
    if (path.startsWith('/api/map/') && request.method === 'GET') {
        var mapId = path.slice(9).replace(/[^a-z0-9]/gi, '').slice(0, 24);
        var mapData = await PLAYERS.get('map:' + mapId, 'json');
        if (!mapData) return respond({ error: 'Map nicht gefunden' }, 404);
        return respond(mapData);
    }

    // POST /api/publish-map
    if (path === '/api/publish-map' && request.method === 'POST') {
        var mbody;
        try { mbody = await request.json(); } catch(e) { return respond({ error: 'Bad JSON' }, 400); }
        if (!mbody || !mbody.name || !mbody.data || !mbody.author) return respond({ error: 'Parameter fehlen' }, 400);
        var mapId2 = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        var mapEntry = {
            id: mapId2,
            name: String(mbody.name).slice(0, 40),
            author: String(mbody.author).slice(0, 20),
            createdAt: Date.now(),
            data: mbody.data
        };
        await PLAYERS.put('map:' + mapId2, JSON.stringify(mapEntry));
        var mlist = await PLAYERS.get('map_list', 'json') || [];
        mlist.unshift({ id: mapId2, name: mapEntry.name, author: mapEntry.author, createdAt: mapEntry.createdAt, hooks: (mbody.data.hooks||[]).length, bumpers: (mbody.data.bumpers||[]).length });
        if (mlist.length > 100) mlist.length = 100;
        await PLAYERS.put('map_list', JSON.stringify(mlist));
        return respond({ ok: true, id: mapId2 });
    }

    // DELETE /api/map/{id}
    if (path.startsWith('/api/map/') && request.method === 'DELETE') {
        var delId = path.slice(9).replace(/[^a-z0-9]/gi, '').slice(0, 24);
        var delMap = await PLAYERS.get('map:' + delId, 'json');
        if (!delMap) return respond({ error: 'Map nicht gefunden' }, 404);
        await PLAYERS.delete('map:' + delId);
        var dlist = await PLAYERS.get('map_list', 'json') || [];
        dlist = dlist.filter(function(m) { return m.id !== delId; });
        await PLAYERS.put('map_list', JSON.stringify(dlist));
        return respond({ ok: true });
    }

    // POST /api/admin/reset-all
    if (path === '/api/admin/reset-all' && request.method === 'POST') {
        var abody;
        try { abody = await request.json(); } catch(e) { return respond({ error: 'Bad JSON' }, 400); }
        if (!abody || abody.secret !== 'STICKMANHOOK_RESET_2026') return respond({ error: 'Unauthorized' }, 401);
        await PLAYERS.put('lb_cache', JSON.stringify([]));
        return respond({ ok: true, msg: 'Leaderboard cleared' });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
}
