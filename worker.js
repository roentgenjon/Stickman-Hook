// Stickman Hook API - Cloudflare Worker
var corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

function getRankLabel(rankIndex) {
    if (typeof rankIndex !== 'number' || rankIndex < 0) return null;
    var tiers=[
        '🪨 Stein','🥉 Bronze','⚙️ Eisen','🥈 Silber','🥇 Gold','🌿 Jade','💜 Amethyst','💙 Saphir','❤️ Rubin','💚 Smaragd',
        '💎 Diamant','🔮 Kristall','🧊 Eis','🔥 Feuer','⚡ Blitz','🌊 Wasser','☀️ Sonne','🌙 Mond','⭐ Stern','🌟 Supernova',
        '✨ Magie','💫 Komet','🌌 Galaxis','🪐 Planet','🌈 Regenbogen','👑 Platin','🏅 Meister','🎖️ Großmeister','🏆 Champion','🔱 Legende',
        '🌪️ Sturm','🌊 Ozean','🏔️ Gipfel','🌋 Vulkan','❄️ Blizzard','🌩️ Gewitter','🌀 Tornado','🌫️ Dunkel','☄️ Meteor','💥 Nova',
        '🐉 Drache','🦁 Löwe','🦅 Adler','🐺 Wolf','🔥 Phönix','🐯 Tiger','🦈 Hai','🐆 Panther','🦊 Fuchs','🐻 Bär',
        '⚔️ Krieger','🛡️ Ritter','🏹 Jäger','🗡️ Assassine','🧙 Zauberer','🧝 Elf','👁️ Seher','🔮 Mystiker','🧿 Schamane','💀 Geist',
        '💠 Opal','💛 Topas','🖤 Onyx','💙 Türkis','🌕 Bernstein','🟠 Koralle','🔵 Lapislazuli','🟢 Malachit','⚪ Perlmutt','🔴 Granat',
        '🚀 Rakete','🛸 Raumschiff','🌠 Sternschnuppe','🌑 Eclipse','💫 Pulsar','🌐 Universum','🌌 Andromeda','⚡ Quasar','🔭 Teleskop','🌟 Hypernova',
        '🔥 Inferno','🌊 Tsunami','⚡ Plasma','⚛️ Atom','🌈 Aurora','✨ Aura','🌪️ Hurrikan','🌑 Schatten','⚡ Titan','🔮 Götter',
        '👑 Elite','🏛️ Kaiser','🎯 Präzision','💫 Absolut','☀️ Unsterblich','🔱 Mythisch','💎 Ewigkeit','🌌 Transzendenz','⚡ Omega','🔱 Ultima',
        '🌟 Gottheit','⚡ Göttlich','🌌 Kosmisch','💥 Genesis','🌈 Paradies','✨ Heilig','🔮 Weisheit','👁️ Allsehend','🌠 Schöpfer','💫 Uralt',
        '🌌 Überirdisch','💥 Urknall','🔱 Allmächtig','⚡ Donnerer','🏆 Pro','🔮 Orakel','🌈 Himmelsherr','💫 Sternenherrscher','👑 Ewiger König','🌌 Kosmischer Herr',
        '⚡ Zeitlos','🌟 Grenzenlos','💎 Unbesiegbar','🔥 Höllenherr','✨ Himmelsbote','🌌 Jenseits','💫 Transdimensional','🔱 Übermächtig','⚡ Quantumgott','🌟 Multiversum',
        '💥 Urkraft','🌈 Schöpfer des Lichts','🔮 Hüter des Chaos','👁️ Allsehender Gott','✨ Das Absolute','💎 Alexandrit','🔮 Turmalin','💙 Aquamarin II','🌕 Mondstein','🔵 Labradorit',
        '🖤 Obsidian','💠 Zirkon','💚 Fluorit','💜 Azurit','🔴 Rhodonit','🟠 Morganit','💛 Kunzit','🔵 Spinell','🟢 Prehnit','💎 Peridot',
        '⚪ Andalusit','💜 Tansanit','🔴 Chrysoberyll','💙 Kornerupin','🌕 Citrin','🖤 Hämatit','⚙️ Pyrit','🟢 Epidot','🟠 Serpentin','💛 Karneol',
        '🔵 Lazurit','⚪ Selenit','💎 Moldavit','🔮 Charoit','💙 Diopsid','⭐ Neutronenstern','🌑 Schwarzes Loch','⚪ Weißer Zwerg','🔴 Roter Riese','✨ Gasnebel',
        '🌌 Dunkle Materie','💥 Singularität','🔮 Photon','⚡ Neutrino','💫 Antimaterie','⚡ Gammastrahlung','📡 Magnetfeld','🌌 Raumzeit','⏱️ Zeitdilatation','🔭 Relativität',
        '⚛️ Quantenfluktuation','🌟 Pulsarwind','💥 Magnetar','🌌 Ereignishorizont','⭐ Akkretionsscheibe','🌌 Kosmischer Staub','⚡ Plasmawolke','🌟 Protostern','💫 Brauner Zwerg','🌑 Dunkler Nebel',
        '⭐ Kugelhaufen','🌌 Elliptische Galaxis','💥 Supernovarest','🔮 Magnetosphäre','⚡ Koronales Loch','⚡ Zeus','🌊 Poseidon','🔥 Hades','☀️ Apollo','🌙 Artemis',
        '🌿 Demeter','💫 Hermes II','⚔️ Ares II','🔨 Hephaistos','🍇 Dionysos','🏛️ Athena II','💕 Aphrodite II','🌩️ Zeus Donnerer','🌊 Meeresherrscher','💀 Totenherrscher',
        '☀️ Sonnengott','🌙 Mondgöttin','🌿 Erdgöttin','🔨 Schmiedegott','🍇 Weingott','🌈 Freya','🌀 Loki Trickster','☀️ Baldur Strahlend','⚔️ Tyr Tapfer','🌉 Heimdall Wächter',
        '🌸 Frigg Weise','❄️ Skadi Jägerin','🌊 Njord Seegott','🔮 Mimir Wissend','🎵 Bragi Sänger','⚡ Thor II','🔱 Odin II','🌈 Bifrost','🐍 Jörmungandr','🐺 Fenrir',
        '💀 Hel Totengöttin','🌳 Yggdrasil','⚔️ Valkyrje','🏹 Ullr Bogengott','🌊 Aegir Meeresriese','☀️ Ra Sonnengott','🐺 Anubis Totenwächter','🌿 Osiris Unterwelt','🦅 Horus Himmelsgott','🌙 Isis Zauberin',
        '⚡ Seth Sturm','🦉 Thoth Weisheit','🐱 Bastet Schutz','🐊 Sobek Macht','🌟 Amun Schöpfer','☀️ Aten Sonnenscheibe','🌊 Nun Urwasser','🌺 Hathor Liebe','🌙 Khonsu Mond','⚡ Sekhmet Löwin',
        '⚡ Indra Himmelsgott','💙 Vishnu Erhalter','🔱 Shiva Zerstörer','🌺 Brahma Schöpfer','💀 Kali Göttin','🗡️ Durga Kriegerin','🐘 Ganesha Glück','💫 Krishna Hirt','🐒 Hanuman Treue','🏹 Rama Held',
        '🌊 Varuna Wasser','🔥 Agni Feuer','🌬️ Vayu Wind','☀️ Surya Sonne','🌙 Chandra Mond','⚔️ Achilles','🌊 Odysseus','💪 Herakles','🗡️ Perseus','🛡️ Theseus',
        '⚔️ Beowulf','🗡️ Siegfried','🏹 Roland','👑 Artus','⚔️ Lancelot','🔮 Merlin','🏹 Robin Hood','⚔️ Cuchulainn','🗡️ Rostam','🏹 Arjuna',
        '🌟 Gilgamesh','💪 Samson','⭐ David','⚔️ Hektor','🛡️ Ajax','⚔️ Excalibur','🔨 Mjolnir','🗡️ Gungnir','⚔️ Durandal','🗡️ Gram',
        '⚔️ Joyeuse','🗡️ Fragarach','⚔️ Kusanagi','🗡️ Zulfiqar','⚔️ Caliburn','🗡️ Caladbolg','⚔️ Dainsleif','🗡️ Hrunting','⚔️ Tyrfing','🗡️ Skofnung',
        '⚔️ Curtana','🗡️ Hauteclere','⚔️ Nagelring','🌟 Claíomh Solais','⚔️ Durendal','🏺 Ägypten','🏛️ Rom','🌿 Griechenland','🏰 Babylon','⚔️ Assyrien',
        '🌙 Persien','🐉 Altes China','🌸 Altes Japan','☀️ Azteken','🌿 Maya','🌄 Inka','⚡ Wikinger','🚢 Karthago','⚔️ Sparta','🏛️ Athen',
        '🗡️ Troja','🌾 Sumer','📜 Akkad','🌊 Harappa','☀️ Kush','🏺 Pyramide','🏟️ Kolosseum','🏛️ Pantheon','🏛️ Akropolis','🌿 Stonehenge',
        '🏔️ Machu Picchu','🌿 Angkor','🏛️ Parthenon','🏯 Burg','⛩️ Tempel II','⛪ Kathedrale','🏰 Festung','🗼 Zitadelle','🔰 Obelisk','🏺 Ziggurat',
        '💻 Cyber','🌐 Matrix','🔥 Firewall','🔧 Algorithmus','🖥️ Mainframe','💾 Hacker','🤖 Android','🦾 Roboter','🧠 KI','🦠 Virus',
        '🌐 Netzwerk','📡 Interface','⚙️ Protokoll','🖥️ Server','💻 Terminal','💾 Code','🔢 Binary','🔣 Hexadezimal','⚡ Quantencomputer','🔮 Virtuell',
        '🔴 Scharlach','❤️ Karmesin','💜 Purpur','🟣 Violett II','💙 Indigo II','🔵 Kobaltblau','🟢 Smaragdgrün II','🟠 Zinnoberrot','💗 Magenta II','🟡 Ocker',
        '⚪ Elfenbein','🌕 Perlweiß','🔴 Korallrot','💙 Aquamarin III','🟢 Türkisgrün','💛 Goldgelb','🟡 Bernsteingelb','🟤 Kupferbraun','🟤 Bronzebraun','⚪ Silbergrau',
        '🌊 Tiefseegott','🌊 Meereswächter','🌊 Wellenbrecher','🌊 Marianengrab','👑 Ozeankönig','🐉 Leviathan','🦑 Kraken','🌊 Tidenherr','🌊 Abyssus','🐉 Meeresdrache',
        '🪸 Korallenwächter','🧜 Meerjungfrau','🪸 Korallenriff','🌊 Meeresströmung','🌊 Poseidons Thron','🌊 Neptuns Reich','⭐ Seestern','👑 Korallenkönig','💎 Tiefseeperle','🌊 Ozeanwächter',
        '🌲 Waldgeist','🌳 Urwald','🌲 Baumriese','👑 Waldkönig','🌿 Mooswald','🌴 Dschungel','🌿 Sumpfgeist','🌨️ Tundra','🌲 Taiga','🌿 Mangrove',
        '🎋 Bambuswächter','🌸 Pflanzengeist','🌿 Naturkraft','🌿 Grüner Mann','🏰 Waldschloss','🪨 Felsenwächter','🏔️ Berggeist','🌵 Wüstengeist','🌾 Steppenwächter','🌿 Urwaldgeist',
        '🌸 Frühlingserwachen','☀️ Sommerglut','🍂 Herbststurm','❄️ Winterfrost','⛄ Schneesturm','⛈️ Gewitternacht','🌊 Sturmflut','🧊 Eiszeit','🌋 Vulkanwinter','🌡️ Hitzewelle',
        '🌑 Mitternacht','🌅 Morgenrot','🌇 Abenddämmerung','🌫️ Nebelnacht','🌙 Mondnacht','🌩️ Blitzgewitter','🌪️ Superzelle','🌊 Springflut','❄️ Permafrost','☀️ Sonnensturm',
        '🐻 Grizzly','🦊 Polarfuchs','🐆 Schneeleopard','🦎 Komodo','🐊 Krokodil','🐍 Kobra','🦅 Kondor','🦏 Nashornkäfer','🐟 Barrakuda','🐋 Blauwal',
        '🦍 Gorilla','🐆 Jaguar','🐆 Gepard','🦁 Hyäne','🦦 Erdmännchen','🦩 Flamingo','🦅 Pelikan','🦢 Albatros','🦜 Papagei','🦢 Schwan',
        '🐦 Kolibri','🦜 Tucan','🦚 Pfau','🦩 Kranich','🐦 Rabe','🦉 Eule','🦅 Habicht','🦅 Falk','🐦 Lyrenvogel','🦜 Paradiesvogel',
        '🦅 Rotmilan','🦆 Eisvogel','🦅 Seeadler','🦆 Stelzenläufer','🦩 Sichler','🦉 Uhu','🐦 Dohle','🦅 Wespenbussard','🦆 Tauchente','🦜 Kakadu',
        '🔥 Zorn','⚡ Rage','🌪️ Furor','🏆 Ehrgeiz','⚔️ Mut','🛡️ Tapferkeit','🙏 Glaube','🌟 Hoffnung','😊 Freude','🕊️ Frieden',
        '❤️ Leidenschaft','💪 Entschlossenheit','🏃 Beharrlichkeit','🏔️ Ausdauer','☯️ Gleichmut','🧘 Ruhe','🌊 Stille','👁️ Wachheit','💎 Klarheit','🔮 Einsicht',
        '🔮 Stein der Weisen','⚗️ Großes Werk','💊 Elixir','⚗️ Transmutation','💧 Destillation','🔥 Koagulation','⚗️ Kalkination','☁️ Sublimation','🌑 Nigredo','🔴 Rubedo',
        '🛡️ Paladin','⚔️ Barbar','🗡️ Hexer','💀 Nekromant','🎵 Bard','🌿 Druide','⚔️ Berserker','🏟️ Gladiator','🥷 Ninja','⚔️ Samurai',
        '⚔️ Ronin','👑 Shogun','🏛️ Legionär','🏹 Bogenschütze','🗡️ Drachentöter','🔪 Monsterjäger','🧛 Vampirjäger','👻 Geisterjäger','👹 Dämonentöter','🧙 Zaubermeister',
        '👑 König','👸 Königin','🤴 Prinz','👸 Prinzessin','🏰 Herzog','💒 Herzogin','🎖️ Graf','👒 Gräfin','🏅 Baron','🏰 Marquis',
        '⚜️ Fürst','🏰 Zar','👑 Zarin','🏺 Pharao','🌙 Sultan','☪️ Kalif','🌙 Emir','🏹 Khan','⚔️ Shogun II','🗡️ Daimyo',
        '⚛️ Relativitätstheorie','🔬 Quantenphysik','🌡️ Thermodynamik','⚡ Elektromagnetismus','💥 Kernfusion','☢️ Kernspaltung','🌌 Gravitationswellen','🌌 Parallelwelten','🔬 Nanotechnologie','🧬 Biotechnologie',
        '🧬 Genforschung','🧠 Neurowissenschaft','🤖 Kybernetik','🦾 Robotik II','🧠 KI Gott','💻 Quantencomputer II','🚀 Raumfahrt II','🌌 Raumzeitkrümmung','⚛️ Supersymmetrie','🔮 Quantenverschränkung',
        '🎼 Symphonie','🎭 Oper','🎵 Konzert','🎹 Sonate','🎵 Fuge','🎵 Requiem','🎹 Nocturne','🎵 Rhapsodie','🎵 Kantate','🎵 Ballade',
        '🎨 Gemälde','🗿 Skulptur','🎨 Mosaik','🎨 Fresko','✍️ Kalligraphie','🎨 Gravur','📖 Illumination','🖼️ Ikone','🎨 Meisterwerk','✨ Kunstwerk',
        '🐉 Drache II','🦄 Einhorn','🦅 Greif','🐲 Wyvern','🐍 Basilisk','🦁 Manticore','🐍 Hydra','🦁 Chimäre','🗿 Sphinx','👁️ Zyklop',
        '🐂 Minotaurus','🐴 Zentaur','🐐 Satyr','🦅 Harpy','🐍 Gorgon','🧜 Melusine','💧 Nix','🌊 Rusalka','💧 Undine','🌬️ Sylph',
        '🌲 Waldtroll','🗿 Riese','⚡ Titan III','🗿 Golem','🧪 Homunkulus','😱 Banshee','👻 Wraith','💀 Lich','🦇 Vampir','🐺 Werwolf',
        '🌀 Hexerei','🔮 Beschwörung','💀 Nekromantie','🔥 Elementarmagie','⚡ Runenzauber','🔣 Runen','📌 Sigil','🔵 Mandala','🧿 Talisman','💫 Amulett',
        '⭕ Bannkreis','⭐ Pentagramm','🔮 Ritual','📜 Pakt','⏱️ Zeitmagie','🌌 Traummagie','🌊 Wassermagie','🔥 Feuermagie','🌿 Erdmagie','💨 Luftmagie',
        '🌊 Odyssee','🙏 Pilgerfahrt','⚔️ Kreuzzug','🗺️ Entdeckungsreise','⛵ Weltumsegelung','🏔️ Expedition','🐪 Karawane','🏕️ Nomade','🚶 Wanderer','🗺️ Abenteurer',
        '🔭 Erkunder','🌱 Pionier','💡 Visionär','📜 Prophet','👁️ Seher II','📚 Gelehrter','💭 Philosoph','💡 Denker','🔬 Erfinder','🎓 Weiser II',
        '⬇️ Schwerkraft II','🧲 Magnetismus','⚡ Elektrizität','☢️ Atomkraft','☀️ Sonnenkraft','🌬️ Windkraft','💧 Wasserkraft','🌋 Geothermie','💥 Kernfusion II','🔮 Dunkle Kraft',
        '💪 Willenskraft','🧠 Geisteskraft','💪 Körperkraft','❤️ Herzkraft','🔮 Seelenkraft','🌱 Lebenskraft','✨ Schöpferkraft','💥 Zerstörerkraft','💚 Heilende Kraft','🚫 Verbotene Kraft',
        '⛩️ Shinto','🌸 Sakura','🏯 Shogun III','🥷 Kunoichi','🐉 Ryuu','🌊 Umi','🌙 Tsuki','☀️ Taiyou','🌿 Mori','🏔️ Yama',
        '⛩️ Torii','🌸 Hanami','🎋 Bambusgeist','🌊 Wellenmeister','🐉 Ostdrache','🌙 Mondpfad','☀️ Aufgehende Sonne','🌿 Bambuswald','🏯 Burggeist','🗾 Inselgeist',
        '🏴‍☠️ Pirat','⚓ Anker','🗺️ Schatzkarte','⚔️ Entermesser','🌊 Piratenbucht','🏴‍☠️ Totenkopf','⚓ Hochseekapitän','🗺️ Schatzinsel','⚔️ Freibeuter','🌊 Seeräuber',
        '🏴‍☠️ Kaper','⚓ Bukanier','🗺️ Korsair','⚔️ Seefahrer','🌊 Flibustier','🏴‍☠️ Piratenkaiser','⚓ Meeresräuber','🗺️ Schatzjäger','⚔️ Unterwasserschatz','🌊 Meeresstürmer',
        '⚔️ Mittelalter','🏰 Ritterburg','🛡️ Söldner','⚔️ Turnierkämpfer','🏰 Burgherr','🛡️ Kreuzritter','⚔️ Lanzenstecher','🏰 Schlossherr','🛡️ Panzerreiter','⚔️ Schwertmeister',
        '🏰 Burggraf','🛡️ Pferderitter','⚔️ Infanterist','🏰 Kastellan','🛡️ Schildträger','⚔️ Helmschmied','🏰 Mauerbrecher','🛡️ Festungsherr','⚔️ Feldherr','🏰 Belagerungsmeister',
        '📚 Sokrates','📜 Platon','📚 Aristoteles','📜 Konfuzius','📚 Laozi','📜 Epiktet','📚 Marc Aurel','📜 Seneca','📚 Nietzsche','📜 Kant',
        '📚 Descartes','📜 Spinoza','📚 Leibniz','📜 Hegel','📚 Schopenhauer','📜 Kierkegaard','📚 Camus','📜 Sartre','📚 Wittgenstein','📜 Heidegger',
        '📚 Ilias','📖 Odyssee III','📚 Aeneis','📖 Beowulf II','📚 Edda','📖 Nibelungenlied','📚 Faust','📖 Divina Commedia','📚 Paradise Lost','📖 Don Quijote',
        '📚 Gilgamesh II','📖 Mahabharata','📚 Ramayana','📖 Shahnama','📚 Sundiata','📖 Genji Monogatari','📚 Canterbury Tales','📖 Roland II','📚 Artuslegende','📖 Gralssuche',
        '⭐ Orion','⭐ Kassiopeia','⭐ Ursa Major','⭐ Ursa Minor','⭐ Andromeda II','⭐ Perseus II','⭐ Herkules Stern','⭐ Draco','⭐ Leo','⭐ Scorpius',
        '⭐ Aquarius','⭐ Sagittarius','⭐ Gemini','⭐ Taurus','⭐ Virgo','⭐ Libra','⭐ Capricornus','⭐ Aries','⭐ Cancer','⭐ Pisces',
        '🥊 Karate','🥋 Judo','🥊 Kung Fu','🥋 Taekwondo','🥊 BJJ','🥋 Kickboxen','🥊 Muay Thai','🥋 Sumo','🥊 Boxen','🥋 Wrestling',
        '🥊 Capoeira','🥋 Savate','🥊 Ninjutsu','🥋 Aikido','🥊 Krav Maga','🥋 Hapkido','🥊 Wushu','🥋 Silat','🥊 Escrima','🥋 Sambo',
        '🔤 Fehu','🔤 Uruz','🔤 Thurisaz','🔤 Ansuz','🔤 Raidho','🔤 Kenaz','🔤 Gebo','🔤 Wunjo','🔤 Hagalaz','🔤 Nauthiz',
        '🔤 Isa','🔤 Jera','🔤 Eihwaz','🔤 Perthro','🔤 Algiz','🔤 Sowilo','🔤 Tiwaz','🔤 Berkano','🔤 Ehwaz','🔤 Mannaz',
        '♈ Widder','♉ Stier','♊ Zwillinge','♋ Krebs','♌ Löwe II','♍ Jungfrau','♎ Waage','♏ Skorpion','♐ Schütze','♑ Steinbock',
        '♒ Wassermann','♓ Fische','✨ Transzendent','💎 Vollkommen','🌟 Makellos','🔱 Unfehlbar','☀️ Unsterblicher','🔥 Ewige Flamme','🌌 Letzte Grenze','✨ Absolutes Licht',
        '🌑 Ewiger Dunkel','🌌 Unendliches Reich','🌟 Allumfassend','⚡ Uralte Macht','🔮 Primordialer Gott','👑 Kosmischer Kaiser','🌟 Ewiger Wächter','⏱️ Zeitloser Herrscher','👑 Unsterblicher König','🌌 Grenzenloser Geist',
        '✨ Allmächtiger Schöpfer','🔱 Heiliger Kaiser','⚛️ Quanten','🌌 Parallelwelt','💫 Multidimensional','🌟 Jenseits des Lichts','💥 Vor dem Urknall','⏱️ Jenseits der Zeit','🔄 Ewige Wiederkehr','🌌 Zyklisches Universum',
        '💥 Kosmische Katastrophe','🌡️ Waermetod','🔮 Omega Punkt','🔄 Alpha und Omega','🌌 Anfang und Ende','0️⃣ Nullpunkt','🌌 Leeres Reich','💫 Reines Sein','🌑 Absolutes Nichts','🔮 Goettliches Paradox',
        '🌀 Heiliges Chaos','📐 Urordnung','🌌 Urform','⚡ Urprinzip','💥 Urenergie','🔮 Urgeist','⚛️ Urmaterie','🌌 Urraum','⏱️ Urzeit','💥 Urkraft II',
        '🌌 Erste Ursache','🔮 Hoechste Realitaet','🌟 Unvergaenglich','💎 Unzerstoerbar','⚡ Unbesiegbar II','🔮 Unbezwingbar','🌌 Unermesslich','✨ Unaufhaltsam','💫 Undurchdringlich','🌟 Unwandelbar',
        '⚡ Unentrinnbar','🔱 Unergründlich','🌟 Überragend','💥 Überirdisch II','🌌 Übermenschlich','✨ Überwältigend','🔮 Übernatürlich','👑 Allherrschend','🌟 Allwissend','💫 Allgegenwärtig',
        '⚡ Allüberwältigend','✨ Alles','🏆 Unsterbliche Ehre','⭐ Ewiger Ruhm','🥇 Legendärer Rang','🏅 Mythischer Status','🎖️ Kosmische Würde','🏆 Göttlicher Titel','⭐ Heiliger Rang','🥇 Erhabener Status',
        '🏅 Absoluter Meister','🎖️ Ewiger Meister','🏆 Schöpfer der Schöpfer','⭐ Herrscher der Götter','🥇 König der Könige','🏅 Höchster Wächter','🎖️ Das Letzte','🔮 Überseele','🌌 Kosmobewusstsein','💫 Astralkörper',
        '⚡ Ätherisches Wesen','✨ Jenseitiges Wesen','🌟 Lichtgestalt','💥 Dunkelgestalt','🌌 Zwischenraum','⚛️ Voidwatcher','🔱 Grenzwächter','🌟 Dimensionswächter','💫 Zeitreisender','⚡ Parallelläufer',
        '✨ Schattenläufer','🔮 Lichtläufer','🌌 Realitätsbrecher','💥 Weltenzerstörer','🌟 Weltenerschaffer','⚡ Universumshüter','✨ Urwächter','🎮 God Mode','🎯 Perfect Score','🏆 S-Rang',
        '⭐ SSS-Rang','💯 Perfektionist','🎮 Letzter Boss','🏆 Endgame','⭐ Max Level','💯 True Ending','🎮 Ultimate Mode','🏆 Achievement Hunter','⭐ Speedrunner','💯 No-Hit Run',
        '🎮 Completionist','🏆 World Record','🌟 Das Licht','💥 Die Kraft','🌌 Der Geist','⚡ Der Blitz II','✨ Die Schönheit','🔮 Das Wissen','💫 Die Weisheit II','⚛️ Die Seele',
        '🔱 Die Macht','🌟 Das Schicksal','💥 Der Tod','🌌 Das Leben','✨ Die Liebe','🏋️ Gewichtheben','🤸 Akrobat','⛷️ Skiläufer','🏊 Schwimmer','🚴 Radfahrer',
        '🏇 Reiter','🤼 Ringer','🥇 Olympier','🏆 Weltmeister','🎯 Schütze II','⛳ Golfer','🎾 Tennisspieler','🏐 Volleyballer','🏈 Footballer','🎿 Snowboarder'
    ];
    var tierIdx=Math.floor(rankIndex/10);
    if(tierIdx<0||tierIdx>=tiers.length) return null;
    return tiers[tierIdx]+' '+(rankIndex%10+1);
}

function getUpgradeCost(targetIndex) {
    return (targetIndex+1)*250;
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

        var pendingCoins     = existing.pendingCoins    || 0;
        var pendingTrophies  = existing.pendingTrophies || 0;
        var coins     = Math.min(99999999, (parseInt(body.coins)    || 0) + pendingCoins);
        var trophies  = Math.min(99999999, (parseInt(body.trophies) || 0) + pendingTrophies);
        var maxLevel  = Math.max(0, Math.min(99999,   parseInt(body.maxLevel)  || 0));
        var rankIndex = typeof body.rankIndex === 'number' ? Math.max(-1, Math.min(1149, body.rankIndex)) : (existing.rankIndex || -1);

        var effectiveMaxLevel = Math.max(maxLevel, existing.maxLevel || 0);
        var effectiveRankIndex = Math.max(rankIndex, existing.rankIndex || -1);
        var hasBonus = pendingCoins > 0 || pendingTrophies > 0;

        // Skip all KV writes if nothing changed and no bonus pending
        if (!hasBonus && existing.name &&
            coins === (existing.coins || 0) &&
            trophies === (existing.trophies || 0) &&
            effectiveMaxLevel === (existing.maxLevel || 0) &&
            effectiveRankIndex === (existing.rankIndex || -1) &&
            !existing.mainAccount) {
            var lbCacheRO = await PLAYERS.get('lb_cache', 'json') || [];
            var posRO = -1;
            for (var pi = 0; pi < lbCacheRO.length; pi++) {
                if (lbCacheRO[pi].name.toLowerCase() === name.toLowerCase()) { posRO = pi + 1; break; }
            }
            return respond({ ok: true, player: publicPlayer(existing), position: posRO > 0 ? posRO : 999999, bonusCoins: 0, bonusTrophies: 0 });
        }

        try {
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
                maxLevel: effectiveMaxLevel,
                rankIndex: effectiveRankIndex,
                rank: getRankLabel(effectiveRankIndex),
                pin: existing.pin || '',
                mainAccount: existing.mainAccount || null,
                subAccounts: existing.subAccounts || [],
                pendingCoins: 0,
                pendingTrophies: 0,
                updatedAt: Date.now()
            };

            await PLAYERS.put(key, JSON.stringify(updated));

            // Only update lb_cache if ranking-relevant data changed
            var lbRelevantChanged = !existing.name ||
                trophies !== (existing.trophies || 0) ||
                effectiveMaxLevel !== (existing.maxLevel || 0) ||
                effectiveRankIndex !== (existing.rankIndex || -1);
            var lbData, result;
            if (lbRelevantChanged) {
                lbData = await PLAYERS.get('lb_cache', 'json') || [];
                result = await updateLeaderboardCache(lbData, updated);
                await PLAYERS.put('lb_cache', JSON.stringify(result.lb));
            } else {
                lbData = await PLAYERS.get('lb_cache', 'json') || [];
                var posOnly = -1;
                for (var pj = 0; pj < lbData.length; pj++) {
                    if (lbData[pj].name.toLowerCase() === name.toLowerCase()) { posOnly = pj + 1; break; }
                }
                result = { position: posOnly > 0 ? posOnly : 999999 };
            }

            return respond({ ok: true, player: publicPlayer(updated), position: result.position, bonusCoins: pendingCoins, bonusTrophies: pendingTrophies });
        } catch(e) {
            return respond({ error: 'Server überlastet, bitte später versuchen' }, 503);
        }
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

        try {
            await PLAYERS.put(fromKey, JSON.stringify(sender));
            await PLAYERS.put(toKey,   JSON.stringify(recipient));
        } catch(e) {
            return respond({ error: 'Server überlastet, bitte später versuchen' }, 503);
        }
        return respond({ ok: true, newBalance: sender.coins });
    }

    // POST /api/upgrade-rank
    if (path === '/api/upgrade-rank' && request.method === 'POST') {
        var ubody;
        try { ubody = await request.json(); } catch(e) { return respond({ error: 'Bad JSON' }, 400); }
        if (!ubody || !ubody.name || typeof ubody.targetIndex !== 'number') return respond({ error: 'Parameter fehlen' }, 400);
        var targetIdx = ubody.targetIndex;
        if (targetIdx < 0 || targetIdx > 1149) return respond({ error: 'Ungültiger Rang' }, 400);

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

        try {
            await PLAYERS.put(ukey, JSON.stringify(uplayer));
            var ulbData = await PLAYERS.get('lb_cache', 'json') || [];
            var uResult = await updateLeaderboardCache(ulbData, uplayer);
            await PLAYERS.put('lb_cache', JSON.stringify(uResult.lb));
        } catch(e) {
            return respond({ error: 'Server überlastet, bitte später versuchen' }, 503);
        }

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

    // POST /api/admin/migrate-ranks
    if (path === '/api/admin/migrate-ranks' && request.method === 'POST') {
        var mibody;
        try { mibody = await request.json(); } catch(e) { return respond({ error: 'Bad JSON' }, 400); }
        if (!mibody || mibody.secret !== 'STICKMANHOOK_RESET_2026') return respond({ error: 'Unauthorized' }, 401);
        var miCursor = undefined, miUpdated = 0, miChecked = 0;
        do {
            var listed = await PLAYERS.list({ prefix: 'player:', cursor: miCursor, limit: 100 });
            for (var ki = 0; ki < listed.keys.length; ki++) {
                var kname = listed.keys[ki].name;
                var mp = await PLAYERS.get(kname, 'json');
                if (!mp || typeof mp.rankIndex !== 'number' || mp.rankIndex < 0) continue;
                miChecked++;
                var n = mp.rankIndex;
                var oldCum = 5000 * (Math.pow(1.02, n + 1) - 1);
                var k2 = (-1 + Math.sqrt(1 + 4 * oldCum / 50)) / 2;
                var m = Math.min(1149, Math.max(n, Math.floor(k2) - 1));
                if (m > n) {
                    mp.rankIndex = m;
                    mp.rank = getRankLabel(m);
                    mp.updatedAt = Date.now();
                    await PLAYERS.put(kname, JSON.stringify(mp));
                    miUpdated++;
                }
            }
            miCursor = listed.cursor;
        } while (!listed.list_complete);
        // Rebuild lb_cache from all players
        var newLb = [];
        var rbCursor = undefined;
        do {
            var rblisted = await PLAYERS.list({ prefix: 'player:', cursor: rbCursor, limit: 100 });
            for (var ri = 0; ri < rblisted.keys.length; ri++) {
                var rbp = await PLAYERS.get(rblisted.keys[ri].name, 'json');
                if (rbp && rbp.name) {
                    newLb.push({ name: rbp.name, trophies: rbp.trophies || 0, maxLevel: rbp.maxLevel || 0, rankIndex: typeof rbp.rankIndex === 'number' ? rbp.rankIndex : -1, rank: rbp.rank || null });
                }
            }
            rbCursor = rblisted.cursor;
        } while (!rblisted.list_complete);
        newLb.sort(function(a, b) { return b.trophies - a.trophies; });
        if (newLb.length > 100) newLb.length = 100;
        await PLAYERS.put('lb_cache', JSON.stringify(newLb));
        return respond({ ok: true, checked: miChecked, updated: miUpdated });
    }

    // POST /api/admin/add-coins  { secret, name, coins, trophies }
    if (path === '/api/admin/add-coins' && request.method === 'POST') {
        var acbody;
        try { acbody = await request.json(); } catch(e) { return respond({ error: 'Bad JSON' }, 400); }
        if (!acbody || acbody.secret !== 'STICKMANHOOK_RESET_2026') return respond({ error: 'Unauthorized' }, 401);
        var acKey = 'player:' + (acbody.name || '').toLowerCase();
        var acRaw = await PLAYERS.get(acKey);
        if (!acRaw) return respond({ error: 'Player not found' }, 404);
        var acData = JSON.parse(acRaw);
        var addCoins = parseInt(acbody.coins) || 0;
        var addTrophies = parseInt(acbody.trophies) || 0;
        acData.pendingCoins = Math.min(99999999, (acData.pendingCoins || 0) + addCoins);
        acData.pendingTrophies = Math.min(99999999, (acData.pendingTrophies || 0) + addTrophies);
        acData.updatedAt = Date.now();
        await PLAYERS.put(acKey, JSON.stringify(acData));
        return respond({ ok: true, player: acbody.name, pendingCoins: acData.pendingCoins, pendingTrophies: acData.pendingTrophies });
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
