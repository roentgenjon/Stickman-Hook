#!/usr/bin/env python3
"""
Gibt einem Spieler Münzen und/oder Trophäen direkt in die Datenbank.
Die Belohnung wird beim nächsten Sync übertragen (Rangliste öffnen,
Quest sammeln etc.). Das Sync-Script wird NICHT verändert.

Voraussetzung: Datei 'rewards_config.json' im selben Ordner:
  {
    "cf_api_token": "cfat_...",
    "kv_namespace": "da60a..."
  }

Verwendung:
  python3 give_rewards.py <Spielername> <Münzen> <Trophäen>

Beispiele:
  python3 give_rewards.py Avocado3seb 2000000 5000
  python3 give_rewards.py MaxMuster   500000  0
  python3 give_rewards.py Anna        0       1000
"""

import sys, json, subprocess, os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def load_config():
    config_path = os.path.join(SCRIPT_DIR, "rewards_config.json")
    if not os.path.exists(config_path):
        print("✗ rewards_config.json nicht gefunden.")
        print("  Erstelle die Datei mit folgendem Inhalt:")
        print('  { "cf_api_token": "cfat_...", "kv_namespace": "da60a..." }')
        sys.exit(1)
    with open(config_path) as f:
        return json.load(f)

def wrangler(args, token):
    env = os.environ.copy()
    env["CLOUDFLARE_API_TOKEN"] = token
    result = subprocess.run(
        ["npx", "wrangler"] + args,
        capture_output=True, text=True, env=env, cwd=SCRIPT_DIR
    )
    return result

def kv_get(key, token, ns):
    r = wrangler(["kv", "key", "get", key, "--namespace-id", ns, "--remote"], token)
    if r.returncode != 0:
        return None, r.stderr
    try:
        return json.loads(r.stdout.strip()), None
    except Exception as e:
        return None, str(e)

def kv_put(key, data, token, ns):
    value = json.dumps(data, ensure_ascii=False)
    r = wrangler(["kv", "key", "put", key, value, "--namespace-id", ns, "--remote"], token)
    if r.returncode != 0:
        return False, r.stderr
    return True, None

def check_limit_error(err):
    s = str(err)
    if "10048" in s or "free usage limit" in s.lower() or "429" in s:
        print("✗ KV-Schreib-Limit erschöpft (1000 Schreibvorgänge/Tag).")
        print("  Limit resettet um 02:00 MESZ (00:00 UTC).")
        print("  Script danach erneut ausführen.")
        sys.exit(1)

def give_rewards(name, coins, trophies):
    cfg = load_config()
    token = cfg["cf_api_token"]
    ns    = cfg["kv_namespace"]
    key   = f"player:{name.lower()}"

    print(f"  Lese Daten für '{name}'...")
    player, err = kv_get(key, token, ns)
    if player is None:
        check_limit_error(err)
        print(f"✗ Spieler '{name}' nicht gefunden oder Lesefehler: {err}")
        sys.exit(1)

    player["pendingCoins"]    = min(99999999, (player.get("pendingCoins", 0) or 0) + coins)
    player["pendingTrophies"] = min(99999999, (player.get("pendingTrophies", 0) or 0) + trophies)

    print(f"  Schreibe Belohnung...")
    ok, err = kv_put(key, player, token, ns)
    if not ok:
        check_limit_error(err)
        print(f"✗ Schreibfehler: {err}")
        sys.exit(1)

    print()
    print("✓ Erfolgreich gespeichert!")
    print(f"  Spieler:              {player.get('name', name)}")
    print(f"  Aktuelle Münzen:      {player.get('coins', 0):,}")
    print(f"  + Ausstehend:         {coins:,}  (gesamt pending: {player['pendingCoins']:,})")
    print(f"  Aktuelle Trophäen:    {player.get('trophies', 0):,}")
    print(f"  + Ausstehend:         {trophies:,}  (gesamt pending: {player['pendingTrophies']:,})")
    print()
    print("  Spieler bekommt Belohnung beim nächsten Sync automatisch.")

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(__doc__)
        sys.exit(1)
    name = sys.argv[1]
    try:
        coins    = int(sys.argv[2])
        trophies = int(sys.argv[3])
    except ValueError:
        print("Fehler: Münzen und Trophäen müssen Ganzzahlen sein.")
        sys.exit(1)
    if coins < 0 or trophies < 0:
        print("Fehler: Keine negativen Werte erlaubt.")
        sys.exit(1)
    print(f"Gebe {coins:,} Münzen und {trophies:,} Trophäen an '{name}' ...")
    give_rewards(name, coins, trophies)
