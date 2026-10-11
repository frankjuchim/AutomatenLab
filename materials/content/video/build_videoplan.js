const __MAT = require('path').resolve(__dirname, '../..'); // Wurzel: materials/
// 00_Videoreihe_Planung.docx – Planung, Bildschirm-Konzept, Ablaufpläne, YouTube-Texte
const D = require((__MAT + '/lib/docstyle.js'));
const A = require('./videos.js');
const B = require('./videos_b.js');
const IDX = require((__MAT + '/out/video/video_index.json'));
const OUT = (__MAT + '/out/video/');
const HOST = 'automatenlab.frankjuchim.de';
const ALL = [A.v1, A.v2, A.v3, A.v4, A.v5, B.v6, B.v7, B.v8, B.v9, B.o1, B.o2];
const name = (v) => (v.id.startsWith('O') ? `Extra ${v.id.slice(1)}` : `Video ${v.id.slice(1)}`);
const mp = (s, o = {}) => D.p(s, { size: 19, after: 30, ...o });
const muted = (s) => D.p(s, { size: 18, color: D.C.muted, after: 20 });
const lab0 = (v) => (v.segs.flatMap((s) => s.lab || [])[0] || {}).route || '#/quiz?welt=C';
const ytTitle = (v) => `${v.title} | Informatik-Abi: Automaten & Sprachen${v.id.startsWith('O') ? ' (Extra)' : ' #' + v.id.slice(1)}`;

function ablauf(v) {
  const ix = IDX[v.id];
  const rows = [['Zeit', 'Szene · Bildschirm', 'Inhalt und Sprechimpulse']];
  v.segs.forEach((sg, i) => {
    const s = ix.segs[i];
    const folien = s.first <= s.last ? (s.first === s.last ? `Folie ${s.first}` : `Folien ${s.first}–${s.last}`) : '';
    let screen;
    if (sg.szene === 'L') screen = [mp(`**B · AutomatenLab**${folien ? ` (vorher ${folien} kurz)` : ''}`), ...sg.lab.map((l) => D.p('`' + l.route + '`', { size: 15, after: 10 })), ...sg.lab.map((l) => muted('→ ' + l.tun))];
    else screen = [mp(`**A · ${folien}**`)];
    rows.push([[mp(`**${s.start}**`), muted(`bis ${s.end}`)], screen, [mp(`**${sg.kapitel}:** ${sg.inhalt}`), ...sg.sprech.filter(Boolean).map((x) => muted('› ' + x))]]);
  });
  return D.table(rows, { widthsCm: [1.5, 5.3, 10.6], size: 19 });
}

function videoSection(v, first) {
  const ix = IDX[v.id];
  const chapters = v.segs.map((sg, i) => `${ix.segs[i].start} ${sg.kapitel}`);
  return [
    first ? [] : D.pageBreak(),
    D.h1(`${name(v)}: ${v.title}`),
    D.table([
      ['Dauer', `ca. ${ix.dauer} min · ${ix.slides} Folien (${v.file}_Folien.pptx)`],
      ['Passt zu', `${v.level} · Merkblatt ${v.mb} · Einsatz: ${v.einsatz}`],
      ['Kurs', v.kurs],
      ['Ziel', v.ziel],
      ['Auf dem Bildschirm', v.material],
      ['Leitfrage (Titelfolie)', v.frage.replace(/\*\*/g, '')],
    ], { header: false, widthsCm: [3.6, 13.8], size: 19, firstColBold: true, firstColFill: true }),
    D.h3('Ablaufplan'),
    ablauf(v),
    ...D.warn('Achtung beim Dreh', [...D.bullets(v.achtung, { size: 19 })]),
    ...D.tip('YouTube', [
      mp(`**Titel:** ${ytTitle(v)}`),
      mp('**Kapitelmarken** (in die Beschreibung kopieren):'),
      ...chapters.map((c) => D.p(c, { size: 18, after: 0 })),
      mp(`**Links:** Übung im AutomatenLab: https://${HOST}/${lab0(v)}  ·  Merkblatt ${v.mb.split(' ')[0]} (im Kurs)`, { before: 60 }),
    ]),
  ];
}

(async () => {
  const total = ALL.filter((v) => v.id.startsWith('V')).reduce((a, v) => { const [m, s] = IDX[v.id].dauer.split(':').map(Number); return a + 60 * m + s; }, 0);
  const body = [
    D.h2('1  Die Reihe auf einen Blick'),
    D.p(`Neun Erklärvideos (zusammen ca. ${Math.round(total / 60)} Minuten) begleiten den Pflichtweg der Einheit, zwei Extras die Vertiefung. Jedes Video ist ein **„bewegtes Merkblatt“**: Es erklärt genau ein Merkblatt mit denselben Beispielen, zeigt eine Live-Sequenz im AutomatenLab und endet mit einer Pausenaufgabe und einem QR-Code zum Weiterüben. So passen Video, Merkblatt, App und Arbeitsblatt zusammen – ohne die Lösungen der Arbeitsblätter vorwegzunehmen.`, { size: 21 }),
    D.table([
      ['Nr.', 'Titel', 'Dauer', 'Level · Merkblatt', 'Kurs'],
      ...ALL.map((v) => [name(v), v.title, IDX[v.id].dauer, `${v.level} · ${v.mb}`, v.kurs]),
    ], { widthsCm: [2.0, 7.4, 1.5, 4.0, 2.5], size: 18, center: [2] }),
    D.small('gA-Kurse: Videos 1–4 (und Extra 1) decken alles ab, was auf grundlegendem Niveau verlangt wird; Video 9 Typ 1–3 ebenfalls nutzbar.'),
    D.h3('Empfohlene Drehreihenfolge'),
    ...D.numbered([
      '**Video 5 (Kellerautomaten)** – hier unterscheidet sich die Notation 2025 am stärksten von den alten Videos (Ablage-Schreibweise, Akzeptanz über Endzustand, Abi-Tabelle).',
      '**Video 9 (Abi-Check)** – größter Nutzen für die aktuellen Abiturkurse.',
      '**Videos 1–4** – Welt A und Grenzen, auch für gA-Kurse.',
      '**Videos 6–8** – Grammatiken; danach die Extras.',
    ], { size: 20 }),
    D.p('Zeitbedarf je Video (Erfahrungswert): 10 min Probelauf mit Referentenansicht, 2–3 Aufnahmen à 7 min, 20 min Schnitt (Versprecher, Pausen), 10 min Upload mit Kapitelmarken – zusammen etwa **60–90 Minuten**.', { size: 20 }),

    D.h2('2  Bildschirm-Konzept: zwei Szenen'),
    D.p('Du bist wie gewohnt klein in der Ecke eingeblendet, der Inhalt groß. Damit die Kamera nie etwas verdeckt, gibt es zwei feste Szenen (z. B. in OBS Studio):', { size: 20 }),
    D.table([[
      [...D.img(OUT + 'Skizzen/szene_A.png', { widthCm: 8.2 }), mp('**Szene A „Folien + Kamera“**'), muted('PowerPoint im Vollbild. Alle Videofolien halten unten rechts eine **Kamerafläche** frei (bei 1920 × 1080: ab x = 1383 px, y = 720 px; Kamera max. 504 × 324 px, z. B. 480 × 270). Vier helle „Sucher-Ecken“ rahmen die Kamera; ist sie kleiner, bleibt der Rahmen als Gestaltungselement stehen.')],
      [...D.img(OUT + 'Skizzen/szene_B.png', { widthCm: 8.2 }), mp('**Szene B „AutomatenLab + Seitenleiste“**'), muted('Browserfenster 1440 × 1080 links, rechts die Seitenleiste als PNG-Overlay (Ordner OBS, je Video mit Titel und QR-Code). Kamera in den Rahmen unten (x = 1460, y = 790, 440 × 247 px).')],
    ]], { header: false, widthsCm: [8.7, 8.7], size: 18 }),
    ...D.info('Warum eine eigene Lab-Szene?', [D.p('Ein Test aller im Video genutzten App-Ansichten hat gezeigt: Eingabefelder, „Prüfen“-Knöpfe und der Kellerspeicher liegen in der App oft **unten rechts** – genau dort, wo sonst die Kamera säße. In Szene B ist der Browser schmaler und die Kamera sitzt in der Seitenleiste, sodass nichts verdeckt wird.', { size: 19 })]),
    D.h3('Einrichtung (einmalig)'),
    ...D.bullets([
      '**OBS:** Szene A = Bildschirmaufnahme (Folienmonitor) + Kamera (unten rechts, Maske/Zuschnitt 16:9). Szene B = Fensteraufnahme Browser (Position 0/0) + Bild „Vx_Seitenleiste.png“ darüber + Kamera im Rahmen. Hotkeys für den Szenenwechsel (z. B. F1/F2); optional Szene C „Kamera groß“ für Begrüßung/Abschluss.',
      '**PowerPoint:** Bildschirmpräsentation auf dem Aufnahmemonitor, **Referentenansicht** auf dem zweiten Bildschirm oder Tablet. In den Notizen steht auf der ersten Folie jedes Kapitels die Zeitmarke und die Sprechimpulse. Die Schritt-Folien (z. B. „Zeichen 1: X“) ersetzen Animationen – einfach weiterschalten.',
      '**Browser:** eigenes Profil „Video“ (sauberer Fortschritt, keine Erweiterungen), Lesezeichenleiste aus, Fenster genau 1440 × 1080, Zoom 100–125 %, in der App ggf. Großansicht „A A“. Alle Routen des Videos vorher als Tabs öffnen (siehe Ablaufplan).',
      '**Ton und Bild:** 1920 × 1080, 30 fps; Systembenachrichtigungen aus; Mauszeiger-Hervorhebung einschalten (z. B. OBS-Plugin oder Bedienungshilfen).',
    ], { size: 19 }),

    D.h2('3  Aufbau jedes Videos'),
    D.table([
      ['Phase', 'Dauer', 'Zweck'],
      ['Einstieg / Hook', '≤ 25 s', 'Alltagsbezug oder Rückblick, Leitfrage auf der Titelfolie, Versprechen („Am Ende kannst du …“) – kein langes Intro.'],
      ['Kernidee', '40–70 s', 'Begriffe und Notation an einem Beispiel, das auch auf dem Merkblatt steht.'],
      ['Schritt für Schritt', '60–80 s', 'Lauf, Ableitung oder Verfahren in Einzelschritten (Folienwechsel = Animation).'],
      ['Live im AutomatenLab', '55–75 s', 'Übergangsfolie mit QR-Code (2–3 s), dann Szene B. Laut mitdenken, einen Fehler bewusst zeigen.'],
      ['Abi-Bezug / typischer Fehler', '30–45 s', 'Operator, Antwortmuster, häufiger Punktverlust.'],
      ['Jetzt du', '25–45 s', '„Pausiere jetzt!“-Folie, danach sofort die Auflösung.'],
      ['Zusammenfassung', '25 s', 'Vier Kernsätze, QR „Weiter üben“, Merkblatt, nächstes Video. Die beiden Karten unten links sind der Platz für YouTube-Endbildschirm-Elemente.'],
    ], { widthsCm: [4.0, 1.8, 11.6], size: 18, firstColBold: true }),
    ...D.tip('Sprechen', [...D.bullets(['Du-Form, eine Person ansprechen („Du siehst hier …“).', 'Pro Folie ein Gedanke; lieber zweimal weiterschalten als einmal lange reden.', 'Fachbegriffe exakt wie in den Merkblättern (Ergänzende Hinweise 2025): Zustandsfolge, Endzustand, Fehlerzustand, Kellerspeicher, Startsymbol …', 'Versprecher stehen lassen und Satz neu beginnen – im Schnitt wird nur die Lücke entfernt.'], { size: 19 })]),

    D.h2('4  Ablaufpläne'),
    D.p('Zeiten sind Richtwerte (≈ 130 Wörter pro Minute). „A“ = Szene Folien + Kamera, „B“ = Szene AutomatenLab + Seitenleiste. Die Folien-Nummern beziehen sich auf die jeweilige PPTX-Datei. Alle Beispiele (Läufe, Tabellen, Ableitungen) sind mit dem Prüfskript der Einheit verifiziert.', { size: 19 }),
    ...ALL.map((v, i) => videoSection(v, i === 0)),

    D.pageBreak(),
    D.h2('5  YouTube, Verknüpfung und Rechte'),
    D.h3('Playlist und Beschreibung'),
    D.p('Playlist: **„Maschinen, die Sprache verstehen – Automaten & formale Sprachen (Informatik Abitur)“**. Vorlage für die Beschreibung:', { size: 19 }),
    D.box([
      D.p('[Ein Satz zum Inhalt, z. B. „Wie liest man einen deterministischen endlichen Automaten (DEA)?“]', { size: 18 }),
      D.p(`→ Selbst üben im AutomatenLab: https://${HOST}/[Route]`, { size: 18 }),
      D.p('→ Notation nach den Ergänzenden Hinweisen 2025 zum Kerncurriculum Informatik (Niedersachsen).', { size: 18 }),
      D.p('→ Reihe: Video 1 DEA lesen · 2 DEA entwickeln · 3 Mealy · 4 Grenzen · 5 Kellerautomaten · 6 Grammatiken · 7 Reguläre Grammatik · 8 Kontextfreie Grammatiken · 9 Abi-Check', { size: 18 }),
      D.p('Kapitel:', { size: 18 }), D.p('[Kapitelmarken aus dem Ablaufplan]', { size: 18 }),
    ], { fill: D.C.tealTint2, border: D.C.tealTint }),
    D.spacer(140),
    D.h3('Hinweis unter den alten Videos (angepinnter Kommentar)'),
    D.box([D.p('Hinweis: Seit den Ergänzenden Hinweisen 2025 (verbindlich ab dem Abitur 2027) gilt teilweise eine andere Notation – vor allem bei Kellerautomaten: Übergänge werden als „(oberstes Kellerzeichen, Eingabe) : Ablage“ notiert, akzeptiert wird über einen Endzustand nach vollständig gelesener Eingabe, und die Abi-Tabelle hat die Spalten Zustand | Belegung Kellerspeicher | oberstes Kellersymbol | verarbeitetes Eingabezeichen. Die neue Videoreihe findest du hier: [Playlist-Link]', { size: 18, italics: true })], { fill: D.C.ockerTint, border: D.C.ocker }),
    D.spacer(140),
    D.h3('Nach dem Upload'),
    ...D.bullets([
      'Endbildschirm: „Nächstes Video“ und „Playlist“ auf die beiden Karten unten links der letzten Folie legen; Abo-Element über die QR-Karte vermeiden (QR muss sichtbar bleiben).',
      'Kapitelmarken: Die erste Marke muss 0:00 sein, mindestens drei Kapitel, jedes ≥ 10 s – die Ablaufpläne erfüllen das.',
      'Thumbnails liegen fertig im Ordner „Thumbnails“ (1280 × 720); bei Bedarf ein Foto von dir rechts einfügen.',
      'Wenn die Links feststehen, können QR-Codes zu den Videos auf die Merkblätter und ein „Erklärvideo“-Knopf in die passenden App-Module ergänzt werden.',
    ], { size: 19 }),
    D.h3('Rechte und Datenschutz'),
    ...D.bullets([
      'Keine Original-Abituraufgaben einblenden – die Videos nutzen eigene, angelehnte Beispiele.',
      'Keine Schülerinnen und Schüler und keine Kursdaten im Bild; das AutomatenLab speichert nichts auf einem Server.',
      'Das Profil „Video“ im Browser verhindert, dass Lesezeichen, Verlauf oder Tabs mit privaten Inhalten sichtbar werden.',
    ], { size: 19 }),
    D.h2('6  Checkliste vor jeder Aufnahme'),
    ...D.checklist(['Folien geöffnet, Referentenansicht läuft, Notizen lesbar', 'Browser-Profil „Video“, Fenster 1440 × 1080, alle Routen des Videos als Tabs', 'Richtige Seitenleiste (Vx_Seitenleiste.png) in Szene B', 'Kamera sitzt in Szene A und B im Rahmen, Licht von vorn', 'Mikrofon-Pegel geprüft, Benachrichtigungen aus', 'Pausenaufgabe einmal selbst gelöst (Auflösung stimmt mit Folie überein)', 'Szenenwechsel per Hotkey geübt'], { size: 20 }),
    D.h2('7  Dateien'),
    D.table([
      ['Ordner / Datei', 'Inhalt'],
      ['Folien/Vx_…_Folien.pptx', 'Videofolien (16:9) mit Kamerafläche unten rechts, Sprechimpulse in den Notizen'],
      ['OBS/Vx_Seitenleiste.png', '1920 × 1080, links transparent: Overlay für Szene B mit Titel, QR-Code und Kamerarahmen'],
      ['Thumbnails/…_Thumbnail.png', '1280 × 720, im Design der Einheit'],
      ['00_Videoreihe_Planung.docx', 'dieses Dokument'],
    ], { widthsCm: [5.6, 11.8], size: 19, firstColBold: true }),
  ];
  const f = await D.save(D.doc({ kind: 'PL', title: 'Erklärvideo-Reihe', subtitle: 'Planung, Bildschirm-Konzept und Ablaufpläne · 9 Videos + 2 Extras · je 5–7 Minuten', metaText: 'Videoreihe zur Einheit', code: '00 · Videoreihe', rightNote: 'Informatik eA / gA', body }), OUT + '00_Videoreihe_Planung.docx');
  console.log(f);
})();
