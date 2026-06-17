// Stickman Hook API - Cloudflare Worker (Service Worker format)
// KV binding: PLAYERS (create namespace named STICKMAN_PLAYERS)

var corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

function getRankLabel(rankIndex) {
    if (typeof rankIndex !== 'number' || rankIndex < 0) return null;
    if (rankIndex < 34)  return '\u{1F949} Bronze '  + (rankIndex + 1);
    if (rankIndex < 67)  return '\u{1F48E} Diamant '  + (rankIndex - 33);
    if (rankIndex < 100) return '\u{1F451} Platin '   + (rankIndex - 66);
    return null;
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

    // POST /api/sync - register/update player data
    if (path === '/api/sync' && request.method === 'POST') {
        var body;
        try { body = await request.json(); } catch(e) { return respond({ error: 'Bad JSON' }, 400); }
        if (!body || !body.name) return respond({ error: 'Name fehlt' }, 400);

        var name = String(body.name).trim().slice(0, 20);
        if (!name || !/^[\w\-äöüÄÖÜß ]+$/.test(name)) {
            return respond({ error: 'Ungültiger Name (max. 20 Zeichen, nur Buchstaben/Ziffern/_-)' }, 400);
        }

        var key = 'player:' + name.toLowerCase();
        var existing = await PLAYERS.get(key, 'json') || {};

        var trophies  = Math.max(0, Math.min(999999, parseInt(body.trophies) || 0));
        var coins     = Math.max(0, Math.min(99999999, parseInt(body.coins) || 0));
        var maxLevel  = Math.max(0, Math.min(99999, parseInt(body.maxLevel) || 0));
        var rankIndex = typeof body.rankIndex === 'number' ? Math.max(-1, Math.min(99, body.rankIndex)) : (existing.rankIndex || -1);

        var updated = {
            name: name,
            trophies: Math.max(trophies, existing.trophies || 0),
            coins: coins,
            maxLevel: Math.max(maxLevel, existing.maxLevel || 0),
            rankIndex: Math.max(rankIndex, existing.rankIndex || -1),
            rank: getRankLabel(Math.max(rankIndex, existing.rankIndex || -1)),
            updatedAt: Date.now()
        };

        await PLAYERS.put(key, JSON.stringify(updated));
        var lbData = await PLAYERS.get('lb_cache', 'json') || [];
        var result = await updateLeaderboardCache(lbData, updated);
        await PLAYERS.put('lb_cache', JSON.stringify(result.lb));

        return respond({ ok: true, player: updated, position: result.position });
    }

    // GET /api/player/{name}
    if (path.startsWith('/api/player/') && request.method === 'GET') {
        var pname = decodeURIComponent(path.slice(12)).slice(0, 20);
        var player = await PLAYERS.get('player:' + pname.toLowerCase(), 'json');
        if (!player) return respond({ error: 'Nicht gefunden' }, 404);
        return respond(player);
    }

    // POST /api/send-coins
    if (path === '/api/send-coins' && request.method === 'POST') {
        var sbody;
        try { sbody = await request.json(); } catch(e) { return respond({ error: 'Bad JSON' }, 400); }
        if (!sbody || !sbody.from || !sbody.to || !sbody.amount) {
            return respond({ error: 'Parameter fehlen' }, 400);
        }
        var amount = parseInt(sbody.amount);
        if (!amount || amount <= 0 || amount > 10000000) return respond({ error: 'Ungültiger Betrag' }, 400);

        var fromKey = 'player:' + String(sbody.from).toLowerCase().slice(0, 20);
        var toKey   = 'player:' + String(sbody.to).toLowerCase().slice(0, 20);
        if (fromKey === toKey) return respond({ error: 'Kannst dir keine Münzen senden' }, 400);

        var sender    = await PLAYERS.get(fromKey, 'json');
        var recipient = await PLAYERS.get(toKey, 'json');
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

    // POST /api/upgrade-rank  (linear upgrade only: rankIndex must be currentRank + 1)
    if (path === '/api/upgrade-rank' && request.method === 'POST') {
        var ubody;
        try { ubody = await request.json(); } catch(e) { return respond({ error: 'Bad JSON' }, 400); }
        if (!ubody || !ubody.name || typeof ubody.targetIndex !== 'number') {
            return respond({ error: 'Parameter fehlen' }, 400);
        }
        var targetIdx = ubody.targetIndex;
        if (targetIdx < 0 || targetIdx > 99) return respond({ error: 'Ungültiger Rang' }, 400);

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

        return respond({ ok: true, player: uplayer });
    }

    // POST /api/reset-player  (wipe one player's entry and remove from leaderboard)
    if (path === '/api/reset-player' && request.method === 'POST') {
        var rbody;
        try { rbody = await request.json(); } catch(e) { return respond({ error: 'Bad JSON' }, 400); }
        if (!rbody || !rbody.name) return respond({ error: 'Name fehlt' }, 400);

        var rkey = 'player:' + String(rbody.name).toLowerCase().slice(0, 20);
        await PLAYERS.delete(rkey);

        var rlb = await PLAYERS.get('lb_cache', 'json') || [];
        var rname = String(rbody.name).toLowerCase();
        rlb = rlb.filter(function(p) { return p.name.toLowerCase() !== rname; });
        await PLAYERS.put('lb_cache', JSON.stringify(rlb));

        return respond({ ok: true });
    }

    // POST /api/admin/reset-all  (clear entire leaderboard — for admin use)
    if (path === '/api/admin/reset-all' && request.method === 'POST') {
        var abody;
        try { abody = await request.json(); } catch(e) { return respond({ error: 'Bad JSON' }, 400); }
        if (!abody || abody.secret !== 'STICKMANHOOK_RESET_2026') return respond({ error: 'Unauthorized' }, 401);
        await PLAYERS.put('lb_cache', JSON.stringify([]));
        return respond({ ok: true, msg: 'Leaderboard cleared' });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
}
