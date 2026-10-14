// Boss-Kämpfe (PR 9, wie die Bosse von Algo Quest): Prüfung auf Zeit am Ende der Welten A–C.
//   #/boss              Übersicht der Bosse
//   #/boss?welt=A       Boss einer Welt: Regeln, Freischaltung, bester Versuch, Start
//   #/boss?kampf=<id>   laufender Kampf bzw. Auswertung
// Während des Kampfes gibt es keine Rückmeldung: Antworten werden nur gespeichert (automatisch nach kurzer Pause und
// beim Wechsel der Aufgabe), gewertet wird am Ende. Die Zeit kommt vom Server (Abweichung der Uhr wird ausgeglichen).

import { h, clear } from '../core/dom.js';
import { api } from '../core/api.js';
import { GraphView } from '../components/graph-view.js';
import { dfa } from '../engine/dfa.js';
import { nfa } from '../engine/nfa.js';
import { mealy } from '../engine/mealy.js';
import { pda } from '../engine/pda.js';
import { toast } from '../components/toast.js';
import { progress } from '../core/progress.js';

const STUFE = { 1: 'Basis', 2: 'Standard', 3: 'Profi' };
const TYP = { mc: 'Multiple Choice', wf: 'Wahr oder falsch – mit Begründung', zuordnung: 'Zuordnung' };
const NORMAL = { dea: dfa, nea: nfa, mealy, nka: pda };
const uhrzeit = (iso) => new Date(iso).toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** Gegenstand der Aufgabe: Automat als Graph oder Grammatik als Text. */
function bildVon(bild) {
  if (!bild) return null;
  if (bild.art === 'grammatik') return h('pre', { class: 'boss-grammatik', 'aria-label': 'Grammatik' }, bild.text);
  const box = h('div', { class: 'boss-bild' });
  try {
    const gv = new GraphView(box, { label: { dea: 'DEA', nea: 'NEA', mealy: 'Mealy-Automat', nka: 'Kellerautomat' }[bild.typ] });
    gv.render(NORMAL[bild.typ](bild.automat));
  } catch (e) { console.error(e); }
  return box;
}

export default {
  title: 'Boss-Kampf',
  mount(el, ctx) {
    let aktiv = true;
    let timer = null;
    const aufraeumen = [];
    const welt = (ctx.params.get('welt') ?? '').toUpperCase();
    const kampfId = ctx.params.get('kampf');
    const fehler = (e) => { if (aktiv) clear(el, h('section', { class: 'page boss-page' }, h('h1', null, '⚔️ Boss-Kampf'), h('p', { class: 'notice notice-error' }, e.message), h('p', null, h('a', { class: 'btn', href: ctx.link('boss') }, 'Zu den Bossen')))); };
    clear(el, h('section', { class: 'page boss-page' }, h('h1', null, '⚔️ Boss-Kampf'), h('p', { class: 'muted' }, 'Lade …')));
    if (kampfId) api('GET', `/api/boss/kampf/${encodeURIComponent(kampfId)}`).then(zeigeKampf).catch(fehler);
    else if (welt) api('GET', `/api/boss/${encodeURIComponent(welt)}`).then(zeigeBoss).catch(fehler);
    else api('GET', '/api/boss').then(zeigeUebersicht).catch(fehler);
    return () => { aktiv = false; clearInterval(timer); aufraeumen.forEach((f) => f()); };

    function seite(...inhalt) {
      clear(el, h('section', { class: 'page boss-page' },
        h('a', { class: 'back-link', href: welt || kampfId ? ctx.link('boss') : '#/' }, h('span', { 'aria-hidden': 'true' }, '‹ '), welt || kampfId ? 'Alle Bosse' : 'Übersicht'),
        ...inhalt));
    }

    /* ───── Übersicht ───── */
    function zeigeUebersicht(d) {
      if (!aktiv) return;
      seite(h('h1', null, '⚔️ Boss-Kämpfe'),
        h('p', { class: 'lead' }, 'Am Ende jeder Welt wartet ein Boss: zufällig gezogene Aufgaben im Abitur-Stil, auf Zeit und ohne Rückmeldung während des Kampfes. Ab 50 % der Punkte ist der Boss besiegt. Es zählt dein bester Versuch.'),
        h('ul', { class: 'boss-karten' }, d.bosse.map((b) => h('li', null, h('a', { class: ['panel', 'boss-karte', b.bester?.besiegt && 'is-besiegt'], href: ctx.link('boss', { welt: b.welt }) },
          h('span', { class: 'boss-karte-welt' }, `Welt ${b.welt}`),
          h('strong', { class: 'boss-karte-titel' }, b.titel.replace(/^Boss der Welt .: /, '')),
          h('span', { class: 'muted' }, `${b.anzahl} Aufgaben · ${b.dauerMin} Minuten`),
          h('span', { class: 'boss-karte-stand' }, b.laufend ? '⏳ Kampf läuft' : b.bester ? `${b.bester.besiegt ? '🏆 besiegt' : 'bester Versuch'}: ${b.bester.punkte} / ${b.bester.maxPunkte}` : b.frei ? 'bereit' : '🔒 noch verschlossen'))))));
    }

    /* ───── Boss einer Welt ───── */
    function zeigeBoss(s) {
      if (!aktiv) return;
      const startBtn = h('button', { type: 'button', class: 'btn btn-primary', onclick: async () => {
        if (!window.confirm(`Kampf starten? Du hast ${s.dauerMin} Minuten für ${s.anzahl} Aufgaben. Danach ist 12 Stunden Pause.`)) return;
        startBtn.disabled = true;
        try { const k = await api('POST', `/api/boss/${s.welt}/start`, {}); ctx.navigate('boss', { kampf: String(k.id) }); } catch (e) { startBtn.disabled = false; toast(e.message, { type: 'error' }); }
      } }, '⚔️ Kampf starten');
      const aktion = s.laufend
        ? h('p', null, h('a', { class: 'btn btn-primary', href: ctx.link('boss', { kampf: String(s.laufend.id) }) }, '⏳ Zum laufenden Kampf'))
        : !s.frei ? h('p', { class: 'notice' }, '🔒 ', s.grund)
          : s.gesperrtBis ? h('p', { class: 'notice' }, `Der Boss erholt sich noch. Nächster Kampf ab ${uhrzeit(s.gesperrtBis)} Uhr.`)
            : h('p', null, startBtn);
      seite(h('h1', null, `⚔️ ${s.titel}`),
        s.niveau === 'eA' && s.grundkurs ? h('p', { class: 'notice' }, 'Freiwillig: Dieser Boss gehört zum Leistungskurs (eA).') : null,
        h('div', { class: 'panel lk-karte' },
          h('h2', null, 'Regeln'),
          h('ul', null,
            h('li', null, `${s.anzahl} Aufgaben, leichte zuerst – zufällig gezogen aus dem Pool der Welt ${s.welt}.`),
            h('li', null, `${s.dauerMin} Minuten Zeit. Deine Antworten werden automatisch gespeichert; die Zeit läuft auch, wenn du die Seite schließt.`),
            h('li', null, 'Während des Kampfes gibt es keine Rückmeldung – die Auswertung mit Lösungen kommt am Ende.'),
            h('li', null, 'Punkte je Aufgabe: Basis 10, Standard 20, Profi 30 (Wahr/Falsch und Zuordnung auch zur Hälfte). Ab 50 % ist der Boss besiegt.'),
            h('li', null, 'Nach jedem Kampf ist 12 Stunden Pause. Es zählt dein bester Versuch.')),
          aktion),
        s.bester ? h('div', { class: 'panel lk-karte' },
          h('h2', null, s.bester.besiegt ? '🏆 Besiegt!' : 'Bester Versuch'),
          h('p', { class: 'result-big' }, `${s.bester.punkte} / ${s.bester.maxPunkte}`),
          h('p', { class: 'muted' }, `${Math.round(s.bester.anteil * 100)} % der Punkte`)) : null,
        s.versuche.length ? h('div', { class: 'panel lk-karte' },
          h('h2', null, 'Deine Versuche'),
          h('ul', { class: 'boss-versuche' }, s.versuche.map((v) => h('li', null,
            h('a', { href: ctx.link('boss', { kampf: String(v.id) }) }, uhrzeit(v.start)),
            ' · ', v.ende ? `${v.punkte} / ${v.maxPunkte} Punkte` : 'läuft')))) : null);
    }

    /* ───── Kampf ───── */
    function zeigeKampf(k) {
      if (!aktiv) return;
      if (!k.laeuft) { zeigeErgebnis(k); return; }
      const versatz = Date.parse(k.serverZeit) - Date.now();
      const deadline = Date.parse(k.deadline);
      const antworten = new Map(k.aufgaben.map((a) => [a.id, a.antwort]));
      const offen = new Set(); // noch nicht gespeicherte Aufgaben
      let i = 0;
      let speichernTimer = null;
      let beendet = false;

      const uhr = h('span', { class: 'boss-uhr', role: 'timer', 'aria-live': 'off' });
      const reiter = h('nav', { class: 'boss-reiter', 'aria-label': 'Aufgaben' });
      const bereich = h('div', { class: 'panel boss-aufgabe' });
      const status = h('p', { class: 'boss-status muted', 'aria-live': 'polite' });

      async function speichern(id) {
        if (!offen.has(id) || beendet) return;
        offen.delete(id);
        try {
          await api('PUT', `/api/boss/kampf/${k.id}/antwort`, { aufgabeId: id, antwort: antworten.get(id) });
          status.textContent = 'Gespeichert.';
        } catch (e) {
          if (e.status === 409) { beenden(true); return; }
          offen.add(id);
          status.textContent = `Nicht gespeichert: ${e.message}`;
        }
      }
      const speichereBald = (id) => { offen.add(id); status.textContent = 'Speichere …'; clearTimeout(speichernTimer); speichernTimer = setTimeout(() => speichern(id), 700); };
      const speichereAlle = async () => { clearTimeout(speichernTimer); for (const id of [...offen]) await speichern(id); };
      aufraeumen.push(() => { clearTimeout(speichernTimer); speichereAlle(); });

      async function beenden(automatisch = false) {
        if (beendet) return;
        if (!automatisch) {
          const leer = k.aufgaben.filter((a) => !beantwortet(a)).length;
          if (!window.confirm(leer ? `Noch ${leer} Aufgabe(n) ohne Antwort. Trotzdem abgeben?` : 'Kampf abgeben und auswerten?')) return;
        }
        await speichereAlle();
        beendet = true;
        clearInterval(timer);
        try { zeigeErgebnis(await api('POST', `/api/boss/kampf/${k.id}/beenden`, {})); } catch (e) { fehler(e); }
      }

      const beantwortet = (a) => { const x = antworten.get(a.id); return !!x && (x.wahl || (typeof x.wahr === 'boolean' && x.begruendung) || (x.zuordnung && x.zuordnung.every(Boolean))); };
      function zeichneReiter() {
        clear(reiter, k.aufgaben.map((a, j) => h('button', { type: 'button', class: ['boss-reiter-knopf', beantwortet(a) && 'is-beantwortet'], 'aria-current': j === i ? 'step' : null,
          'aria-label': `Aufgabe ${j + 1}${beantwortet(a) ? ', beantwortet' : ''}`, onclick: () => { speichereAlle(); i = j; zeige(); } }, String(j + 1))));
      }

      function zeige() {
        zeichneReiter();
        const a = k.aufgaben[i];
        const f = a.frage;
        const setze = (x) => { antworten.set(a.id, x); speichereBald(a.id); zeichneReiter(); };
        let eingabe;
        if (f.typ === 'mc') {
          const jetzt = () => antworten.get(a.id)?.wahl;
          eingabe = h('ul', { class: 'option-list' }, f.optionen.map((o, j) => h('li', null, h('button', { type: 'button', class: 'option', 'aria-pressed': String(jetzt() === o.id), onclick: (e) => {
            setze({ wahl: o.id });
            e.currentTarget.closest('ul').querySelectorAll('.option').forEach((b, n) => b.setAttribute('aria-pressed', String(f.optionen[n].id === o.id)));
          } }, h('span', { class: 'option-key', 'aria-hidden': 'true' }, 'ABCD'[j]), h('span', { class: 'option-text' }, o.text)))));
        } else if (f.typ === 'wf') {
          const x = () => antworten.get(a.id) ?? {};
          const wahl = h('div', { class: 'decide-row quiz-wf' }, [false, true].map((v) => h('button', { type: 'button', class: ['decide', v ? 'decide-yes' : 'decide-no', 'decide-small'], 'aria-pressed': String(x().wahr === v), onclick: (e) => {
            setze({ ...x(), wahr: v });
            e.currentTarget.parentElement.querySelectorAll('button').forEach((b, n) => b.setAttribute('aria-pressed', String((n === 1) === v)));
          } }, v ? 'Wahr' : 'Falsch')));
          const begr = h('ul', { class: 'option-list' }, f.begruendungen.map((o, j) => h('li', null, h('button', { type: 'button', class: 'option', 'aria-pressed': String(x().begruendung === o.id), onclick: (e) => {
            setze({ ...x(), begruendung: o.id });
            e.currentTarget.closest('ul').querySelectorAll('.option').forEach((b, n) => b.setAttribute('aria-pressed', String(f.begruendungen[n].id === o.id)));
          } }, h('span', { class: 'option-key', 'aria-hidden': 'true' }, 'ABC'[j]), h('span', { class: 'option-text' }, o.text)))));
          eingabe = h('div', null, wahl, h('p', null, h('strong', null, 'Begründung:')), begr);
        } else {
          const z = antworten.get(a.id)?.zuordnung ?? f.links.map(() => '');
          const selects = f.links.map((l, j) => h('select', { class: 'quiz-select', 'aria-label': l, onchange: () => setze({ zuordnung: selects.map((s) => s.value) }) },
            h('option', { value: '' }, '– wählen –'), f.rechts.map((r) => h('option', { value: r, selected: z[j] === r }, r))));
          eingabe = h('ul', { class: 'zuordnung-list' }, f.links.map((l, j) => h('li', null, h('span', { class: 'zu-left' }, l), selects[j])));
        }
        clear(bereich,
          h('p', { class: 'muted' }, `Aufgabe ${i + 1} von ${k.aufgaben.length} · ${STUFE[a.stufe]} · ${a.punkte} Punkte · ${TYP[f.typ]}`),
          bildVon(a.bild),
          h('h2', { class: 'question' }, f.frage ?? f.aussage),
          eingabe,
          h('div', { class: 'start-actions boss-weiter' },
            i > 0 ? h('button', { type: 'button', class: 'btn', onclick: () => { speichereAlle(); i -= 1; zeige(); } }, '‹ Zurück') : null,
            i < k.aufgaben.length - 1 ? h('button', { type: 'button', class: 'btn btn-primary', onclick: () => { speichereAlle(); i += 1; zeige(); } }, 'Weiter ›') : null));
      }

      function tick() {
        const rest = Math.max(0, deadline - (Date.now() + versatz));
        const m = Math.floor(rest / 60000); const s = Math.floor((rest % 60000) / 1000);
        uhr.textContent = `⏱ ${m}:${String(s).padStart(2, '0')}`;
        uhr.classList.toggle('is-knapp', rest < 60000);
        if (rest === 0) beenden(true);
      }

      seite(
        h('div', { class: 'boss-kopf' }, h('h1', null, `⚔️ ${k.titel}`), uhr),
        reiter, bereich,
        h('div', { class: 'boss-fuss' }, status, h('button', { type: 'button', class: 'btn btn-primary', onclick: () => beenden(false) }, 'Abgeben und auswerten')));
      zeige();
      tick();
      timer = setInterval(tick, 500);
    }

    /* ───── Auswertung ───── */
    function zeigeErgebnis(k) {
      if (!aktiv) return;
      clearInterval(timer);
      api('GET', '/api/lernstand').then((ls) => progress._server(ls)).catch(() => {}); // Punkte in der Kopfzeile
      progress._abzeichen(k.neueAbzeichen); // Toast wie bei allen Aufgaben
      const deine = (a) => {
        const x = a.antwort; const f = a.frage;
        if (!x) return 'keine Antwort';
        if (f.typ === 'mc') return f.optionen.find((o) => o.id === x.wahl)?.text ?? '–';
        if (f.typ === 'wf') return `${x.wahr === true ? 'wahr' : x.wahr === false ? 'falsch' : '–'} – ${f.begruendungen.find((o) => o.id === x.begruendung)?.text ?? 'ohne Begründung'}`;
        return f.links.map((l, j) => `${l} → ${x.zuordnung?.[j] || '–'}`).join('; ');
      };
      const richtig = (a) => {
        const l = a.loesung; const f = a.frage;
        if (f.typ === 'mc') return l.richtigText;
        if (f.typ === 'wf') return `${l.wahr ? 'wahr' : 'falsch'} – ${l.richtigText}`;
        return f.links.map((x, j) => `${x} → ${l.loesung[j]}`).join('; ');
      };
      const prozent = Math.round(k.anteil * 100);
      seite(
        h('h1', null, `⚔️ ${k.titel}`),
        h('div', { class: ['panel', 'boss-ergebnis', k.besiegt && 'is-besiegt'] },
          h('p', { class: 'boss-ergebnis-titel' }, k.besiegt ? '🏆 Boss besiegt!' : 'Der Boss hält stand.'),
          h('p', { class: 'result-big' }, `${k.punkte} / ${k.maxPunkte}`),
          h('span', { class: 'lk-balken', role: 'img', 'aria-label': `${prozent} Prozent` }, h('span', { class: 'lk-balken-fuellung', style: { width: `${prozent}%` } })),
          h('p', { class: 'muted' }, `${prozent} % · ab 50 % ist der Boss besiegt. Es zählt dein bester Versuch; der nächste Kampf ist in 12 Stunden möglich.`),
          h('p', null, h('a', { class: 'btn', href: ctx.link('boss', { welt: k.welt }) }, 'Zum Boss der Welt ' + k.welt))),
        h('ol', { class: 'boss-auswertung' }, k.aufgaben.map((a, j) => h('li', null, h('details', { class: ['panel', a.wert === 1 ? 'is-yes' : a.wert > 0 ? 'is-half' : 'is-no'] },
          h('summary', null, h('span', { class: 'quiz-log-mark', 'aria-label': a.wert === 1 ? 'richtig' : a.wert > 0 ? 'teilweise' : 'falsch' }, a.wert === 1 ? '✓' : a.wert > 0 ? '½' : '✗'),
            ` Aufgabe ${j + 1}: ${a.erreicht} / ${a.punkte} Punkte – `, h('span', null, a.frage.frage ?? a.frage.aussage)),
          bildVon(a.bild),
          h('p', null, h('strong', null, 'Deine Antwort: '), deine(a)),
          h('p', null, h('strong', null, 'Richtig: '), richtig(a)),
          a.loesung.erklaerung ? h('p', { class: 'muted' }, a.loesung.erklaerung) : null)))));
    }
  },
};
