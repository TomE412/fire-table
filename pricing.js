/* Prices tab: the shop fills in qty and unit price, totals add up, saved on this device, sent back as text. */
(() => {
  const KEY = 'firetable-quote-revB';
  const ITEMS = [
    { id: 'angle', g: 'Steel', d: 'Angle 40×40×3, 6 m length', n: 'Pieces A–H · 14.8 m needed · 3 lengths (Build guide step 2)', q: 3 },
    { id: 'flat', g: 'Steel', d: 'Flat bar 50×6', n: 'Pieces J, K · 0.82 m needed', q: 1 },
    { id: 'round', g: 'Steel', d: 'Round bar 12', n: 'Axle L · 0.92 m needed', q: 1 },
    { id: 'pipe', g: 'Steel', d: 'Steel pipe ½ inch, offcut', n: 'Spacers M · 2 × 38 long', q: 1 },
    { id: 'plate', g: 'Steel', d: 'MS plate 2 mm for fire bin', n: '≈ 0.52 m² · nest fits 1400 × 750', q: 1 },
    { id: 'laser', g: 'Steel', d: 'Laser cut + bend fire bin parts', n: 'P1 ×1, P2 ×2, P3 ×1 · DXF files in Laser files tab', q: 1 },
    { id: 'm12l', g: 'Hardware', d: 'M12×70 bolt, nyloc, 2 washers', n: 'Hinges', q: 2 },
    { id: 'm12s', g: 'Hardware', d: 'M12×40 bolt, nyloc, 2 washers + thick washer', n: 'Middle pivots', q: 2 },
    { id: 'm8', g: 'Hardware', d: 'M8×45 cup-head bolt, nyloc, washer', n: 'Slats to frame', q: 28 },
    { id: 'paint', g: 'Finish & labour', d: 'Paint: zinc primer, enamel, high-temp spray', n: 'High-temp on bin supports E and the bin', q: 1 },
    { id: 'cons', g: 'Finish & labour', d: 'Consumables: rods/wire, gas, discs', n: '', q: 1 },
    { id: 'labour', g: 'Finish & labour', d: 'Labour: cut, drill, weld, paint, assemble', n: 'Build guide steps 2–12', q: 1 },
    { id: 'teak', g: 'Timber (only if you supply it)', d: 'Teak plank 1200 × 100 × 20', n: '3 of the 11 are cut to 2 × 260', q: 11 },
  ];

  const root = document.getElementById('quote');
  if (!root) return;

  let st = { shop: '', notes: '', rows: {}, extra: [] };
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.rows) st = Object.assign(st, s); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };

  const num = (v) => { const x = parseFloat(String(v).replace(/[^0-9.]/g, '')); return isFinite(x) ? x : 0; };
  const money = (x) => '$' + x.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const row = (id) => st.rows[id] || (st.rows[id] = { q: ITEMS.find((i) => i.id === id).q, p: '' });

  function lineHTML(key, d, n, q, p, custom) {
    const desc = custom
      ? `<label class="qd"><span class="sr">Item</span><input type="text" data-k="${key}" data-f="d" value="${esc(d)}" placeholder="Describe the item"></label>`
      : `<div class="qd"><strong>${esc(d)}</strong>${n ? `<small>${esc(n)}</small>` : ''}</div>`;
    return `<div class="qrow">${desc}
<label><span>Qty</span><input type="text" inputmode="decimal" data-k="${key}" data-f="q" value="${esc(q)}"></label>
<label><span>Unit $</span><input type="text" inputmode="decimal" data-k="${key}" data-f="p" value="${esc(p)}" placeholder="0.00"></label>
<output data-t="${key}">—</output>
${custom ? `<button type="button" class="qx" data-del="${key}" aria-label="Remove this line">×</button>` : ''}</div>`;
  }

  function render() {
    let h = '<div class="qhead"><span>Item</span><span>Qty</span><span>Unit $</span><span>Total</span></div>';
    let g = '';
    for (const it of ITEMS) {
      if (it.g !== g) { g = it.g; h += `<h4>${esc(g)}</h4>`; }
      const r = row(it.id);
      h += lineHTML(it.id, it.d, it.n, r.q, r.p, false);
    }
    h += '<h4>Other items</h4>';
    st.extra.forEach((x, i) => { h += lineHTML('x' + i, x.d, '', x.q, x.p, true); });
    h += '<button type="button" class="btn qadd" id="qAdd">+ Add a line</button>';
    document.getElementById('qLines').innerHTML = h;
    document.getElementById('qShop').value = st.shop;
    document.getElementById('qNotes').value = st.notes;
    totals();
  }

  function get(key) { return key[0] === 'x' ? st.extra[+key.slice(1)] : row(key); }

  function totals() {
    let sum = 0, priced = 0;
    root.querySelectorAll('output[data-t]').forEach((o) => {
      const r = get(o.dataset.t);
      const has = String(r.p).trim() !== '';
      const t = num(r.q) * num(r.p);
      o.textContent = has ? money(t) : '—';
      if (has) { sum += t; priced++; }
    });
    document.getElementById('qSum').textContent = money(sum);
    document.getElementById('qCount').textContent = priced + ' of ' + (ITEMS.length + st.extra.length) + ' lines priced';
  }

  function text() {
    const L = ['Fire Pit Table Rev B, quote' + (st.shop ? ' from ' + st.shop : ''), ''];
    let sum = 0;
    const line = (d, r) => {
      const has = String(r.p).trim() !== '';
      const t = num(r.q) * num(r.p);
      if (has) sum += t;
      L.push(`${d}: ${has ? `${r.q} × ${money(num(r.p))} = ${money(t)}` : 'not priced'}`);
    };
    for (const it of ITEMS) line(it.d, row(it.id));
    for (const x of st.extra) if (x.d || x.p) line(x.d || 'Other item', x);
    L.push('', 'TOTAL ' + money(sum));
    if (st.notes.trim()) L.push('', 'Notes: ' + st.notes.trim());
    return L.join('\n');
  }

  root.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'qShop') { st.shop = t.value; save(); return; }
    if (t.id === 'qNotes') { st.notes = t.value; save(); return; }
    if (!t.dataset.k) return;
    get(t.dataset.k)[t.dataset.f] = t.value;
    save(); totals();
  });

  root.addEventListener('click', async (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    const msg = document.getElementById('qMsg');
    if (t.id === 'qAdd') { st.extra.push({ d: '', q: 1, p: '' }); save(); render(); const ins = root.querySelectorAll('.qd input'); if (ins.length) ins[ins.length - 1].focus(); }
    else if (t.dataset.del) { st.extra.splice(+t.dataset.del.slice(1), 1); save(); render(); }
    else if (t.id === 'qSend') {
      const body = text();
      if (navigator.share) { try { await navigator.share({ title: 'Fire table quote', text: body }); return; } catch (err) { if (err && err.name === 'AbortError') return; } }
      location.href = 'https://wa.me/?text=' + encodeURIComponent(body);
    } else if (t.id === 'qCopy') {
      const body = text();
      try { await navigator.clipboard.writeText(body); msg.textContent = 'Copied. Paste it into a message.'; }
      catch (err) { const a = document.createElement('textarea'); a.value = body; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); msg.textContent = 'Copied. Paste it into a message.'; }
    } else if (t.id === 'qClear') {
      if (!confirm('Clear all prices on this phone?')) return;
      st = { shop: st.shop, notes: '', rows: {}, extra: [] }; save(); render(); msg.textContent = 'Cleared.';
    }
  });

  render();
})();
