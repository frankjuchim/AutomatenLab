'use strict';
// Minimaler ZIP-Schreiber (nur „gespeichert“, ohne Kompression): docx/pptx sind selbst schon komprimiert.
// Für die ZIP-Downloads der Original-Materialien (nur Admin).
const zlib = require('node:zlib');

const CRC_TABELLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = zlib.crc32 || ((buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABELLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
});

/** @param {{name: string, daten: Buffer}[]} eintraege  → ZIP als Buffer */
function zip(eintraege) {
  const teile = [];
  const verzeichnis = [];
  let pos = 0;
  for (const { name, daten } of eintraege) {
    const n = Buffer.from(name, 'utf8');
    const crc = crc32(daten) >>> 0;
    const kopf = Buffer.alloc(30);
    kopf.writeUInt32LE(0x04034b50, 0);
    kopf.writeUInt16LE(20, 4); // Version
    kopf.writeUInt16LE(0x0800, 6); // Dateinamen in UTF-8
    kopf.writeUInt16LE(0, 8); // gespeichert
    kopf.writeUInt16LE(0, 10); // Zeit
    kopf.writeUInt16LE(33, 12); // Datum 1980-01-01 (fest, damit gleiche Dateien gleiche ZIPs ergeben)
    kopf.writeUInt32LE(crc, 14);
    kopf.writeUInt32LE(daten.length, 18);
    kopf.writeUInt32LE(daten.length, 22);
    kopf.writeUInt16LE(n.length, 26);
    kopf.writeUInt16LE(0, 28);
    const zentral = Buffer.alloc(46);
    zentral.writeUInt32LE(0x02014b50, 0);
    zentral.writeUInt16LE(20, 4);
    zentral.writeUInt16LE(20, 6);
    zentral.writeUInt16LE(0x0800, 8);
    zentral.writeUInt16LE(0, 10);
    zentral.writeUInt16LE(0, 12);
    zentral.writeUInt16LE(33, 14);
    zentral.writeUInt32LE(crc, 16);
    zentral.writeUInt32LE(daten.length, 20);
    zentral.writeUInt32LE(daten.length, 24);
    zentral.writeUInt16LE(n.length, 28);
    zentral.writeUInt32LE(pos, 42);
    teile.push(kopf, n, daten);
    verzeichnis.push(zentral, n);
    pos += kopf.length + n.length + daten.length;
  }
  const vz = Buffer.concat(verzeichnis);
  const ende = Buffer.alloc(22);
  ende.writeUInt32LE(0x06054b50, 0);
  ende.writeUInt16LE(eintraege.length, 8);
  ende.writeUInt16LE(eintraege.length, 10);
  ende.writeUInt32LE(vz.length, 12);
  ende.writeUInt32LE(pos, 16);
  return Buffer.concat([...teile, vz, ende]);
}

module.exports = { zip, crc32 };
