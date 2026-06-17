(function () {
  // ─── helpers ───────────────────────────────────────────────────────────────

  function makeMilestones(start, end, count) {
    var result = [];
    for (var i = 0; i < count; i++) {
      var v = Math.round(start * Math.pow(end / start, i / (count - 1)));
      if (result.length === 0 || v !== result[result.length - 1]) result.push(v);
    }
    while (result.length < count) result.push(result[result.length - 1] + 1);
    return result;
  }

  function fmtNum(n) {
    if (n >= 1000000) return (Math.floor(n / 100000) / 10) + 'M';
    if (n >= 1000) return (Math.floor(n / 100) / 10) + 'K';
    return '' + n;
  }

  // ─── RANKS ─────────────────────────────────────────────────────────────────

  var RANKS = [
    { id: 'bronze',   label: '🥉 Bronze Ritter',    cost: 100   },
    { id: 'silver',   label: '🥈 Silber Krieger',   cost: 500   },
    { id: 'gold',     label: '🥇 Gold Champion',    cost: 1000  },
    { id: 'diamond',  label: '💎 Diamant Legende',  cost: 5000  },
    { id: 'platinum', label: '👑 Platin Meister',   cost: 10000 }
  ];

  // ─── CATS ──────────────────────────────────────────────────────────────────

  var CATS = [
    { id: 'explorer',  label: '🗺️ Abenteurer', color: '#e67e22' },
    { id: 'collector', label: '💰 Sammler',          color: '#f1c40f' },
    { id: 'champion',  label: '🏆 Champion',         color: '#9b59b6' },
    { id: 'master',    label: '⚡ Meister',                color: '#e74c3c' },
    { id: 'social',    label: '🤝 Sozial',           color: '#3498db' }
  ];

  // ─── QUEST GENERATION ──────────────────────────────────────────────────────

  var QUESTS = [];

  // ── Category 0: explorer (level milestones) ──────────────────────────────
  var levelTargets = makeMilestones(1, 5000, 100);
  for (var i = 0; i < 100; i++) {
    var t = levelTargets[i];
    QUESTS.push({
      id:              'exp_' + i,
      cat:             0,
      title:           'Level ' + t + ' erreichen',
      desc:            'Erreiche Level ' + t + ' im Spiel.',
      type:            'level',
      target:          t,
      reward_coins:    Math.ceil(10 * Math.pow(1.05, i)),
      reward_trophies: Math.floor(i / 10) + 1
    });
  }

  // ── Category 1: collector (coins earned) ──────────────────────────────────
  var coinTargets = makeMilestones(10, 2000000, 100);
  for (var i = 0; i < 100; i++) {
    var t = coinTargets[i];
    QUESTS.push({
      id:              'col_' + i,
      cat:             1,
      title:           fmtNum(t) + ' Coins verdienen',
      desc:            'Verdiene insgesamt ' + fmtNum(t) + ' Coins.',
      type:            'coins_earned',
      target:          t,
      reward_coins:    Math.ceil(15 * Math.pow(1.04, i)),
      reward_trophies: Math.floor(i / 12) + 1
    });
  }

  // ── Category 2: champion (trophies) ──────────────────────────────────────
  var trophyTargets = makeMilestones(1, 500, 100);
  for (var i = 0; i < 100; i++) {
    var t = trophyTargets[i];
    QUESTS.push({
      id:              'cha_' + i,
      cat:             2,
      title:           fmtNum(t) + ' Trophäen sammeln',
      desc:            'Sammle insgesamt ' + fmtNum(t) + ' Trophäen.',
      type:            'trophies',
      target:          t,
      reward_coins:    Math.ceil(30 * Math.pow(1.06, i)),
      reward_trophies: 0
    });
  }

  // ── Category 3: master (quests completed) ─────────────────────────────────
  var questTargets = makeMilestones(1, 499, 100);
  for (var i = 0; i < 100; i++) {
    var t = questTargets[i];
    QUESTS.push({
      id:              'mas_' + i,
      cat:             3,
      title:           t + ' Quests abschließen',
      desc:            'Schließe ' + t + ' Quests ab.',
      type:            'quests_done',
      target:          t,
      reward_coins:    Math.ceil(20 * Math.pow(1.05, i)),
      reward_trophies: Math.floor(i / 8) + 1
    });
  }

  // ── Category 4: social (100 quests) ──────────────────────────────────────
  // 1 has_name
  QUESTS.push({
    id:              's_name',
    cat:             4,
    title:           'Namen registrieren',
    desc:            'Registriere deinen Spielernamen.',
    type:            'has_name',
    target:          1,
    reward_coins:    50,
    reward_trophies: 2
  });

  // 14 lb_views
  var lbViewTargets = [1, 2, 3, 5, 7, 10, 15, 20, 25, 30, 40, 50, 75, 100];
  for (var i = 0; i < lbViewTargets.length; i++) {
    var t = lbViewTargets[i];
    QUESTS.push({
      id:              'soc_lb_' + i,
      cat:             4,
      title:           'Rangliste ' + t + 'x anschauen',
      desc:            'Öffne die Rangliste ' + t + ' Mal.',
      type:            'lb_views',
      target:          t,
      reward_coins:    10 + i * 15,
      reward_trophies: Math.floor(i / 4) + 1
    });
  }

  // 15 sent_coins milestones
  var sentCoinTargets = makeMilestones(1, 100000, 15);
  for (var i = 0; i < sentCoinTargets.length; i++) {
    var t = sentCoinTargets[i];
    QUESTS.push({
      id:              'soc_sc_' + i,
      cat:             4,
      title:           fmtNum(t) + ' Coins senden',
      desc:            'Sende insgesamt ' + fmtNum(t) + ' Coins an andere Spieler.',
      type:            'sent_coins',
      target:          t,
      reward_coins:    Math.ceil(20 * Math.pow(1.08, i)),
      reward_trophies: Math.floor(i / 5) + 1
    });
  }

  // 15 recv_coins milestones
  var recvCoinTargets = makeMilestones(1, 100000, 15);
  for (var i = 0; i < recvCoinTargets.length; i++) {
    var t = recvCoinTargets[i];
    QUESTS.push({
      id:              'soc_rc_' + i,
      cat:             4,
      title:           fmtNum(t) + ' Coins empfangen',
      desc:            'Empfange insgesamt ' + fmtNum(t) + ' Coins von anderen Spielern.',
      type:            'recv_coins',
      target:          t,
      reward_coins:    Math.ceil(20 * Math.pow(1.08, i)),
      reward_trophies: Math.floor(i / 5) + 1
    });
  }

  // 12 unique_sent milestones
  var uniqueSentTargets = [1, 2, 3, 5, 7, 10, 15, 20, 25, 30, 40, 50];
  for (var i = 0; i < uniqueSentTargets.length; i++) {
    var t = uniqueSentTargets[i];
    QUESTS.push({
      id:              'soc_us_' + i,
      cat:             4,
      title:           'An ' + t + ' Spieler senden',
      desc:            'Sende Coins an ' + t + ' verschiedene Spieler.',
      type:            'unique_sent',
      target:          t,
      reward_coins:    25 + i * 20,
      reward_trophies: Math.floor(i / 4) + 1
    });
  }

  // 10 unique_recv milestones
  var uniqueRecvTargets = [1, 2, 3, 5, 7, 10, 15, 20, 25, 50];
  for (var i = 0; i < uniqueRecvTargets.length; i++) {
    var t = uniqueRecvTargets[i];
    QUESTS.push({
      id:              'soc_ur_' + i,
      cat:             4,
      title:           'Von ' + t + ' Spielern empfangen',
      desc:            'Erhalte Coins von ' + t + ' verschiedenen Spielern.',
      type:            'unique_recv',
      target:          t,
      reward_coins:    25 + i * 20,
      reward_trophies: Math.floor(i / 4) + 1
    });
  }

  // 7 lb_position milestones (must be <= target)
  var lbPosTargets = [100, 50, 25, 10, 5, 3, 1];
  for (var i = 0; i < lbPosTargets.length; i++) {
    var t = lbPosTargets[i];
    QUESTS.push({
      id:              'soc_lp_' + i,
      cat:             4,
      title:           'Top ' + t + ' in der Rangliste',
      desc:            'Erreiche Platz ' + t + ' oder besser in der Rangliste.',
      type:            'lb_position',
      target:          t,
      reward_coins:    50 + i * 75,
      reward_trophies: i + 1
    });
  }

  // 5 rank purchase quests (has_rank: number of ranks owned)
  for (var i = 0; i < 5; i++) {
    var rankCount = i + 1;
    QUESTS.push({
      id:              'soc_rk_' + i,
      cat:             4,
      title:           rankCount + ' Rang' + (rankCount > 1 ? '\xE4nge' : '') + ' besitzen',
      desc:            'Kaufe ' + rankCount + ' Rang' + (rankCount > 1 ? '\xE4nge' : '') + ' im Shop.',
      type:            'has_rank',
      target:          rankCount,
      reward_coins:    100 * rankCount,
      reward_trophies: rankCount
    });
  }

  // 1 all_ranks quest
  QUESTS.push({
    id:              'soc_all_ranks',
    cat:             4,
    title:           'Alle Ränge besitzen',
    desc:            'Kaufe alle verfügbaren Ränge im Shop.',
    type:            'all_ranks',
    target:          5,
    reward_coins:    5000,
    reward_trophies: 10
  });

  // Count social quests so far
  // 1 + 14 + 15 + 15 + 12 + 10 + 7 + 5 + 1 = 80
  // Fill remaining 20 with extra sent_coins big milestones (200000 to 10000000)
  var extraSentTargets = makeMilestones(200000, 10000000, 20);
  for (var i = 0; i < 20; i++) {
    var t = extraSentTargets[i];
    QUESTS.push({
      id:              'soc_xsc_' + i,
      cat:             4,
      title:           fmtNum(t) + ' Coins senden (Experte)',
      desc:            'Sende insgesamt ' + fmtNum(t) + ' Coins an andere Spieler.',
      type:            'sent_coins',
      target:          t,
      reward_coins:    Math.ceil(500 * Math.pow(1.12, i)),
      reward_trophies: i + 2
    });
  }

  // ─── DEFAULT STATE ─────────────────────────────────────────────────────────

  function makeDefaultState() {
    return {
      coins:           0,
      coinsEarned:     0,
      trophies:        0,
      questsDone:      0,
      done:            {},
      progress:        {},
      playerName:      '',
      playerRank:      null,
      ranksOwned:      [],
      lbViews:         0,
      sentCoins:       0,
      recvCoins:       0,
      sentToPlayers:   [],
      recvFromPlayers: [],
      lbPosition:      999999
    };
  }

  var state = makeDefaultState();

  // ─── SAVE / LOAD ───────────────────────────────────────────────────────────

  var STORAGE_KEY = 'STICKMANHOOK_qs';

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // storage unavailable or full – silently ignore
    }
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        // Start from defaults so new fields always exist
        var defaults = makeDefaultState();
        for (var k in parsed) {
          if (Object.prototype.hasOwnProperty.call(parsed, k)) {
            defaults[k] = parsed[k];
          }
        }
        // Mutate in-place so external references (window._QS.state) stay valid
        for (var k in defaults) {
          if (Object.prototype.hasOwnProperty.call(defaults, k)) {
            state[k] = defaults[k];
          }
        }
      }
    } catch (e) {
      // parse / access error – keep defaults
    }
  }

  // ─── checkQuests ───────────────────────────────────────────────────────────

  function checkQuests(callback) {
    var currentLevel = (typeof window._QS.getLevel === 'function') ? window._QS.getLevel() : 0;
    var newly = [];

    for (var q = 0; q < QUESTS.length; q++) {
      var quest = QUESTS[q];
      if (state.done[quest.id]) continue;

      var met = false;
      var prog = 0;

      if (quest.type === 'level') {
        prog = currentLevel;
        met  = prog >= quest.target;

      } else if (quest.type === 'coins_earned') {
        prog = state.coinsEarned;
        met  = prog >= quest.target;

      } else if (quest.type === 'trophies') {
        prog = state.trophies;
        met  = prog >= quest.target;

      } else if (quest.type === 'quests_done') {
        prog = state.questsDone;
        met  = prog >= quest.target;

      } else if (quest.type === 'has_name') {
        met  = (state.playerName && state.playerName.length > 0);
        prog = met ? 1 : 0;

      } else if (quest.type === 'lb_views') {
        prog = state.lbViews;
        met  = prog >= quest.target;

      } else if (quest.type === 'sent_coins') {
        prog = state.sentCoins;
        met  = prog >= quest.target;

      } else if (quest.type === 'recv_coins') {
        prog = state.recvCoins;
        met  = prog >= quest.target;

      } else if (quest.type === 'unique_sent') {
        prog = state.sentToPlayers.length;
        met  = prog >= quest.target;

      } else if (quest.type === 'unique_recv') {
        prog = state.recvFromPlayers.length;
        met  = prog >= quest.target;

      } else if (quest.type === 'lb_position') {
        prog = state.lbPosition;
        met  = state.lbPosition <= quest.target;

      } else if (quest.type === 'has_rank') {
        prog = state.ranksOwned.length;
        met  = prog >= quest.target;

      } else if (quest.type === 'all_ranks') {
        prog = state.ranksOwned.length;
        met  = prog >= RANKS.length;
      }

      // Store progress
      state.progress[quest.id] = prog;

      if (met) {
        state.done[quest.id]    = true;
        state.coins            += quest.reward_coins;
        state.coinsEarned      += quest.reward_coins;
        state.trophies         += quest.reward_trophies;
        state.questsDone       += 1;
        newly.push(quest);
      }
    }

    save();

    if (typeof callback === 'function') {
      callback(newly);
    }
  }

  // ─── isValidWorkerUrl ──────────────────────────────────────────────────────

  function isValidWorkerUrl(url) {
    return url && url.length > 0 && url.indexOf('PLACEHOLDER') === -1;
  }

  // ─── syncToCloud ───────────────────────────────────────────────────────────

  function syncToCloud(workerUrl, callback) {
    if (!isValidWorkerUrl(workerUrl)) {
      if (typeof callback === 'function') callback('no worker url', null);
      return;
    }
    fetch(workerUrl + '/api/sync', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        playerName: state.playerName,
        coins:      state.coins,
        coinsEarned: state.coinsEarned,
        trophies:   state.trophies,
        questsDone: state.questsDone,
        playerRank: state.playerRank,
        ranksOwned: state.ranksOwned
      })
    }).then(function (res) {
      return res.json();
    }).then(function (data) {
      if (data && typeof data.recvCoins === 'number') {
        if (data.recvCoins > 0) {
          state.coins     += data.recvCoins;
          state.recvCoins += data.recvCoins;
        }
      }
      if (data && data.senderName && state.recvFromPlayers.indexOf(data.senderName) === -1) {
        state.recvFromPlayers.push(data.senderName);
      }
      save();
      if (typeof callback === 'function') callback(null, data);
    }).catch(function (err) {
      if (typeof callback === 'function') callback(err, null);
    });
  }

  // ─── fetchLeaderboard ──────────────────────────────────────────────────────

  function fetchLeaderboard(workerUrl, callback) {
    if (!isValidWorkerUrl(workerUrl)) {
      if (typeof callback === 'function') callback('no worker url', null);
      return;
    }
    state.lbViews += 1;
    save();
    fetch(workerUrl + '/api/leaderboard', {
      method: 'GET'
    }).then(function (res) {
      return res.json();
    }).then(function (data) {
      // Try to locate our position in the leaderboard
      if (data && data.entries && state.playerName) {
        for (var i = 0; i < data.entries.length; i++) {
          if (data.entries[i].name === state.playerName) {
            state.lbPosition = i + 1;
            break;
          }
        }
        save();
      }
      if (typeof callback === 'function') callback(null, data);
    }).catch(function (err) {
      if (typeof callback === 'function') callback(err, null);
    });
  }

  // ─── sendCoins ─────────────────────────────────────────────────────────────

  function sendCoins(workerUrl, toName, amount, callback) {
    if (!isValidWorkerUrl(workerUrl)) {
      if (typeof callback === 'function') callback('no worker url', null);
      return;
    }
    if (!toName || amount <= 0) {
      if (typeof callback === 'function') callback('invalid args', null);
      return;
    }
    if (state.coins < amount) {
      if (typeof callback === 'function') callback('not enough coins', null);
      return;
    }
    state.coins     -= amount;
    state.sentCoins += amount;
    if (state.sentToPlayers.indexOf(toName) === -1) {
      state.sentToPlayers.push(toName);
    }
    save();
    fetch(workerUrl + '/api/send-coins', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        fromName: state.playerName,
        toName:   toName,
        amount:   amount
      })
    }).then(function (res) {
      return res.json();
    }).then(function (data) {
      if (typeof callback === 'function') callback(null, data);
    }).catch(function (err) {
      if (typeof callback === 'function') callback(err, null);
    });
  }

  // ─── buyRank ───────────────────────────────────────────────────────────────

  function buyRank(workerUrl, rankId, callback) {
    if (!isValidWorkerUrl(workerUrl)) {
      if (typeof callback === 'function') callback('no worker url', null);
      return;
    }
    var rank = null;
    for (var r = 0; r < RANKS.length; r++) {
      if (RANKS[r].id === rankId) { rank = RANKS[r]; break; }
    }
    if (!rank) {
      if (typeof callback === 'function') callback('unknown rank', null);
      return;
    }
    if (state.ranksOwned.indexOf(rankId) !== -1) {
      if (typeof callback === 'function') callback('already owned', null);
      return;
    }
    if (state.coins < rank.cost) {
      if (typeof callback === 'function') callback('not enough coins', null);
      return;
    }
    state.coins     -= rank.cost;
    state.ranksOwned.push(rankId);
    state.playerRank = rankId;
    save();
    fetch(workerUrl + '/api/buy-rank', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        playerName: state.playerName,
        rankId:     rankId
      })
    }).then(function (res) {
      return res.json();
    }).then(function (data) {
      if (typeof callback === 'function') callback(null, data);
    }).catch(function (err) {
      if (typeof callback === 'function') callback(err, null);
    });
  }

  // ─── Default getLevel stub (caller must override) ─────────────────────────

  function defaultGetLevel() { return 0; }

  // ─── Expose ────────────────────────────────────────────────────────────────

  window._QS = {
    QUESTS:           QUESTS,
    CATS:             CATS,
    RANKS:            RANKS,
    state:            state,
    getLevel:         defaultGetLevel,
    checkQuests:      checkQuests,
    syncToCloud:      syncToCloud,
    fetchLeaderboard: fetchLeaderboard,
    sendCoins:        sendCoins,
    buyRank:          buyRank,
    fmtNum:           fmtNum,
    load:             load,
    save:             save
  };

  // Auto-load persisted state on injection
  load();

})();
