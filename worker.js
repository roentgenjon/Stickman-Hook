// Stickman Hook API - Cloudflare Worker (Service Worker format)
// KV binding: PLAYERS (create namespace named STICKMAN_PLAYERS)

var corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

var RANKS = [
    { id: 'bronze',   label: '\u{1F949} Bronze Ritter',    cost: 100 },
    { id: 'silver',   label: '\u{1F948} Silber Krieger',   cost: 500 },
    { id: 'gold',     label: '\u{1F947} Gold Champion',    cost: 1000 },
    { id: 'diamond',  label: '\u{1F48E} Diamant Legende',  cost: 5000 },
    { id: 'platinum', label: '\u{1F451} Platin Meister',   cost: 10000 }
];

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
    var entry = { name: player.name, trophies: player.trophies, rank: player.rank || null };
    if (idx >= 0) {
        lb[idx] = entry;
    } else {
        lb.push(entry);
    }
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

        var trophies = Math.max(0, Math.min(999999, parseInt(body.trophies) || 0));
        var coins    = Math.max(0, Math.min(99999999, parseInt(body.coins) || 0));

        var updated = {
            name: name,
            trophies: Math.max(trophies, existing.trophies || 0),
            coins: coins,
            rank: body.rank || existing.rank || null,
            ranksOwned: body.ranksOwned || existing.ranksOwned || [],
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

    // POST /api/buy-rank
    if (path === '/api/buy-rank' && request.method === 'POST') {
        var bbody;
        try { bbody = await request.json(); } catch(e) { return respond({ error: 'Bad JSON' }, 400); }
        if (!bbody || !bbody.name || !bbody.rankId) return respond({ error: 'Parameter fehlen' }, 400);

        var rankDef = null;
        for (var ri = 0; ri < RANKS.length; ri++) {
            if (RANKS[ri].id === bbody.rankId) { rankDef = RANKS[ri]; break; }
        }
        if (!rankDef) return respond({ error: 'Ungültiger Rang' }, 400);

        var bkey = 'player:' + String(bbody.name).toLowerCase().slice(0, 20);
        var bplayer = await PLAYERS.get(bkey, 'json');
        if (!bplayer) return respond({ error: 'Spieler nicht gefunden' }, 404);
        if (bplayer.coins < rankDef.cost) return respond({ error: 'Nicht genug Münzen' }, 400);

        bplayer.coins -= rankDef.cost;
        bplayer.rank   = rankDef.label;
        bplayer.ranksOwned = bplayer.ranksOwned || [];
        if (bplayer.ranksOwned.indexOf(bbody.rankId) === -1) bplayer.ranksOwned.push(bbody.rankId);
        bplayer.updatedAt = Date.now();

        await PLAYERS.put(bkey, JSON.stringify(bplayer));

        var blbData = await PLAYERS.get('lb_cache', 'json') || [];
        var bResult = await updateLeaderboardCache(blbData, bplayer);
        await PLAYERS.put('lb_cache', JSON.stringify(bResult.lb));

        return respond({ ok: true, player: bplayer });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
}
