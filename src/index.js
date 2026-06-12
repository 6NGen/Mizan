import { useState, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────
// MÎZÂN — İslami İlimler Analiz Motoru v2
// Mimari: Her disiplin AYRI API çağrısıyla analiz edilir.
// Böylece hiçbir analiz token limitine takılıp yarım kalmaz.
// ─────────────────────────────────────────────────────────────

const DISCIPLINES = [
  {
    id: "sarf", label: "Sarf", labelAr: "الصرف", icon: "⚙", color: "#C8942A",
    prompt: `SARF (الصرف) analizi yap. Metindeki anahtar kelimelerin her biri için:
- Kök harfleri (الجذر) ve masdar
- Vezin (الوزن) — hangi babdan, hangi kalıpta
- Sıga: mazi/muzari/emir, malum/meçhul, müfred/tesniye/cemi
- İştikak (türetme) zinciri ve aynı kökten türeyen önemli kelimeler
- Varsa i'lal/idgam/ibdal gibi sarf hadiseleri
Tablo halinde değil, akıcı ama sistematik anlat. Her kelimeyi Arapça harekeli yaz.`,
  },
  {
    id: "nahiv", label: "Nahiv", labelAr: "النحو", icon: "⛓", color: "#2A7AC8",
    prompt: `NAHİV (النحو) analizi yap — tam i'rab:
- Cümle türü (isim/fiil cümlesi, haberî/inşaî)
- Her öğenin i'rab konumu: mübteda, haber, fail, mef'ul, hal, temyiz, sıfat, bedel vs.
- Merfu/mansub/mecrur/meczum durumları ve alametleri
- Harf-i cerler, atıf harfleri, te'kid edatlarının işlevleri
- Mahzuf (gizli) öğeler ve takdiri
- İ'rabın anlama etkisi: farklı i'rab vecihleri varsa zikret
Kelime kelime sırayla i'rab yap, klasik "i'rabu'l-Kur'an" üslubunda.`,
  },
  {
    id: "belagat", label: "Belâgat", labelAr: "البلاغة", icon: "✦", color: "#8B2AC8",
    prompt: `BELÂGAT (البلاغة) analizi yap — üç ana dal üzerinden:
1. MEÂNÎ (المعاني): Cümlenin haberî/inşaî oluşu, takdim-tehir, hasr/kasr, îcâz-itnâb-müsâvât, fasıl-vasıl
2. BEYÂN (البيان): Teşbih, istiare (ve türü: tasrihiyye/mekniyye), mecaz-ı mürsel (alakası), kinaye
3. BEDÎ' (البديع): Cinas, seci, tıbâk, mukabele, iltifat, hüsn-i ta'lil vb. lafzî ve manevî sanatlar
Her sanatı metinden delillendirerek göster. Bu üslubun neden seçildiğini, etkisini açıkla. Abdülkâhir el-Cürcânî'nin nazm teorisi perspektifinden değerlendir.`,
  },
  {
    id: "tefsir", label: "Tefsir", labelAr: "التفسير", icon: "📖", color: "#2AC87A",
    prompt: `TEFSİR (التفسير) analizi yap:
- Sebeb-i nüzul (varsa rivayetleriyle), Mekkî/Medenî oluşu
- Sure içindeki bağlamı (siyak-sibak) ve önceki/sonraki ayetlerle münasebeti
- Rivayet tefsiri: Taberî, İbn Kesîr'in naklettiği sahabe/tabiin görüşleri
- Dirayet tefsiri: Râzî, Zemahşerî, Kurtubî, Elmalılı'nın yaklaşımları
- İhtilaf noktaları: Müfessirler hangi konularda ayrışmış, tercih edilen görüş
- Anlam katmanları ve günümüze bakan mesajı
Müfessir isimleriyle ve eser adlarıyla atıf yap.`,
  },
  {
    id: "fikih", label: "Fıkıh", labelAr: "الفقه", icon: "⚖", color: "#C82A2A",
    prompt: `FIKIH (الفقه) analizi yap:
- Metinden çıkan fıkhî hükümler (vücub, nedb, ibaha, kerahet, hurmet)
- Dört mezhebin (Hanefî, Mâlikî, Şâfiî, Hanbelî) konuyla ilgili görüşleri ve delilleri
- İhtilafın sebebi (sebebü'l-ihtilaf): lafzın delaletinden mi, rivayet farkından mı
- İlgili diğer nasslar ve aralarındaki ilişki
- Pratik fetva boyutu: günümüzde nasıl uygulanır
Eğer metin doğrudan ahkâm içermiyorsa, dolaylı fıkhî çıkarımları ve fukahânın bu metni hangi konularda delil aldığını anlat.`,
  },
  {
    id: "hadis", label: "Hadis", labelAr: "الحديث", icon: "📜", color: "#C86A2A",
    prompt: `HADİS (الحديث) ilmi analizi yap:
- Bu metin hadis ise: kaynakları (Buhârî, Müslim, Sünen'ler, Müsned — kitap/bab numarasıyla), sıhhat derecesi
- Ayet ise: bu ayeti açıklayan, tefsir eden sahih hadisler ve kaynakları
- Metnin farklı tarikleri/varyantları varsa lafız farkları
- Hadis şerhlerinden (İbn Hacer Fethu'l-Bârî, Nevevî, Aynî) önemli açıklamalar
- Metinle ilgili meşhur/zayıf/uydurma rivayetler varsa uyarı
Kaynak adlarını net ver.`,
  },
  {
    id: "usul_hadis", label: "Hadis Usûlü", labelAr: "أصول الحديث", icon: "🔍", color: "#2AC8C8",
    prompt: `HADİS USÛLÜ (أصول الحديث / مصطلح الحديث) analizi yap:
- Hadis ise: sened zinciri analizi — raviler, tabakaları, cerh-ta'dil durumları
- Muttasıl/munkatı, merfu/mevkuf/maktu tasnifi
- Mütevatir mi ahad mı; ahad ise meşhur/aziz/garib
- Sıhhat şartları (adalet, zabt, ittisal, şüzuz ve illet yokluğu) açısından değerlendirme
- Ayet ise: bu ayetin tefsirinde kullanılan rivayetlerin usul açısından değerlendirilmesi, israiliyyat uyarıları
Istılahları tanımlarıyla birlikte kullan — okuyucu usûl öğrensin.`,
  },
  {
    id: "usul_fikih", label: "Fıkıh Usûlü", labelAr: "أصول الفقه", icon: "🏛", color: "#7AC82A",
    prompt: `FIKIH USÛLÜ (أصول الفقه) analizi yap:
- Lafzın delaleti: âm/hâs, mutlak/mukayyed, emir/nehiy sıgaları ve delaletleri
- Delalet türleri: ibarenin/işaretin/nassın/iktizanın delaleti (Hanefî tasnifi) veya mantuk/mefhum (mütekellimin tasnifi)
- Nass mı zahir mi müevvel mi; muhkem/müteşabih durumu
- Nesh ilişkisi varsa açıkla
- Bu metinden hüküm istinbat ederken usulcülerin izlediği yöntem
- Kıyasa esas olmuşsa illeti ve fer'leri
Hanefî ve Şâfiî usul ekollerinin yaklaşım farkını göster.`,
  },
  {
    id: "mantik", label: "Mantık", labelAr: "المنطق", icon: "🧠", color: "#C82A8B",
    prompt: `MANTIK (المنطق) analizi yap:
- Metindeki önermelerin yapısı: hamliyye/şartiyye, mucibe/salibe, külliyye/cüz'iyye
- Varsa kıyas yapısı: öncüller, sonuç, kıyasın şekli (şekl-i evvel vb.)
- Kavramların tanımı: had/resm açısından metindeki temel kavramlar
- Delalet türleri: mutabakat, tazammun, iltizam
- Metnin akıl yürütme örgüsü: bürhan mı, hatabe mi, cedel mi
- Kelamcıların ve mantıkçıların (Gazzâlî, Râzî) bu tür metinlere yaklaşımı
Klasik mantık (Îsâgûcî geleneği) terminolojisiyle anlat.`,
  },
  {
    id: "akaid", label: "Akāid", labelAr: "العقيدة", icon: "☪", color: "#6A2AC8",
    prompt: `AKĀİD/KELÂM (العقيدة وعلم الكلام) analizi yap:
- Metnin itikadî boyutları: uluhiyyet, nübüvvet, sem'iyyat hangi alana giriyor
- Ehl-i Sünnet (Mâtürîdî ve Eş'arî) yorumu
- Varsa fırkaların (Mu'tezile, vs.) farklı yorumları ve Ehl-i Sünnet'in cevabı
- Müteşabih ifade varsa selef ve halef metodu (tefviz/te'vil) açısından ele alınışı
- Kelam kitaplarında (Nesefî Akāidi, Şerhu'l-Mevâkıf vb.) bu metnin kullanımı
- İmana ve amele bakan pratik itikadî mesaj
Dengeyi koru: tartışmaları aktar ama Ehl-i Sünnet çizgisini esas al.`,
  },
];

const BASE_SYSTEM = `Sen İslami ilimlerde derin uzmanlığa sahip, klasik medrese formasyonu almış bir âlimsin. Türkçe ve Arapça'ya hâkimsin. Sana verilen ayet-i kerime veya hadis-i şerifi, istenen TEK disiplin perspektifinden derinlemesine analiz edersin.

Üslup kuralları:
- Akademik derinlikte ama anlaşılır Türkçe
- Arapça terimleri parantez içinde orijinal yazımıyla ver
- Klasik kaynaklara isim ve eser adıyla atıf yap
- Markdown kullan: ### alt başlıklar, **kalın** terimler, - listeler
- Başa disiplin adını başlık olarak YAZMA, doğrudan analize başla
- Uydurma bilgi verme; emin olmadığın rivayet/atıfta ihtiyat kaydı düş
- Hedef uzunluk: 400-700 kelime, derinlikli ve doyurucu`;

// ── Status: idle | pending | streaming | done | error
const initialStatus = () => Object.fromEntries(DISCIPLINES.map(d => [d.id, "idle"]));

function ArabicText({ children, size = 22 }) {
  return (
    <span style={{ fontFamily: "'Amiri','Scheherazade New',serif", fontSize: size, lineHeight: 1.9, direction: "rtl" }}>
      {children}
    </span>
  );
}

// ── Lightweight markdown renderer
function renderMd(text) {
  if (!text) return null;
  const out = [];
  const lines = text.split("\n");
  let listBuf = [];
  const flushList = (key) => {
    if (listBuf.length) {
      out.push(
        <ul key={"ul" + key} style={{ margin: "6px 0 12px", paddingLeft: 22 }}>
          {listBuf.map((li, j) => (
            <li key={j} style={{ color: "rgba(240,230,208,0.82)", lineHeight: 1.85, marginBottom: 5 }}>{inline(li)}</li>
          ))}
        </ul>
      );
      listBuf = [];
    }
  };
  const inline = (s) => {
    const parts = [];
    let rest = s, k = 0;
    while (rest.length) {
      const m = rest.match(/\*\*(.+?)\*\*/);
      if (!m) { parts.push(<span key={k++}>{rest}</span>); break; }
      if (m.index > 0) parts.push(<span key={k++}>{rest.slice(0, m.index)}</span>);
      parts.push(<strong key={k++} style={{ color: "#E8C56B", fontWeight: 700 }}>{m[1]}</strong>);
      rest = rest.slice(m.index + m[0].length);
    }
    return parts;
  };
  lines.forEach((line, i) => {
    const t = line.trim();
    if (t.startsWith("### ")) {
      flushList(i);
      out.push(<h3 key={i} style={{ color: "#C8942A", fontFamily: "'Amiri',serif", fontSize: 19, margin: "20px 0 8px", fontWeight: 700 }}>{t.slice(4)}</h3>);
    } else if (t.startsWith("## ")) {
      flushList(i);
      out.push(<h3 key={i} style={{ color: "#C8942A", fontFamily: "'Amiri',serif", fontSize: 20, margin: "22px 0 8px", fontWeight: 700 }}>{t.slice(3)}</h3>);
    } else if (t.startsWith("- ") || t.startsWith("* ")) {
      listBuf.push(t.slice(2));
    } else if (t === "") {
      flushList(i);
    } else {
      flushList(i);
      out.push(<p key={i} style={{ color: "rgba(240,230,208,0.82)", lineHeight: 1.9, margin: "8px 0", fontSize: 15.5 }}>{inline(t)}</p>);
    }
  });
  flushList("end");
  return out;
}

export default function MizanAnaliz() {
  const [input, setInput] = useState("");
  const [inputType, setInputType] = useState("ayet");
  const [selected, setSelected] = useState(DISCIPLINES.map(d => d.id));
  const [results, setResults] = useState({});
  const [status, setStatus] = useState(initialStatus());
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [globalError, setGlobalError] = useState("");
  const abortRef = useRef(false);
  const resultsRef = useRef(null);

  const toggle = (id) =>
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  // ── Tek disiplini analiz et (kendi API çağrısı + streaming + fallback)
  const analyzeOne = useCallback(async (disc, text, type) => {
    const userMsg = `${type === "ayet" ? "Ayet-i Kerime" : "Hadis-i Şerif"}:\n${text}\n\nGörev:\n${disc.prompt}`;
    const body = {
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: BASE_SYSTEM,
      messages: [{ role: "user", content: userMsg }],
    };

    // Önce streaming dene
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, stream: true }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);

      const ct = res.headers.get("content-type") || "";
      if (ct.includes("text/event-stream") && res.body) {
        setStatus(s => ({ ...s, [disc.id]: "streaming" }));
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let acc = "", buf = "";
        while (true) {
          if (abortRef.current) { reader.cancel(); break; }
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() || "";
          for (const ln of lines) {
            if (!ln.startsWith("data: ")) continue;
            const d = ln.slice(6).trim();
            if (!d || d === "[DONE]") continue;
            try {
              const p = JSON.parse(d);
              if (p.type === "content_block_delta" && p.delta?.text) {
                acc += p.delta.text;
                setResults(r => ({ ...r, [disc.id]: acc }));
              }
            } catch {}
          }
        }
        if (acc.trim()) return acc;
        // stream boş döndüyse fallback'e düş
      } else {
        // Sandbox streaming desteklemiyor → JSON olarak gelmiş olabilir
        const data = await res.json();
        const txt = (data.content || []).map(c => c.text || "").join("");
        if (txt.trim()) return txt;
      }
    } catch (e) {
      // streaming başarısız → non-streaming fallback
    }

    // Fallback: normal (non-stream) çağrı
    const res2 = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res2.ok) throw new Error("API hatası: " + res2.status);
    const data2 = await res2.json();
    const txt2 = (data2.content || []).map(c => c.text || "").join("");
    if (!txt2.trim()) throw new Error("Boş yanıt");
    return txt2;
  }, []);

  // ── Tüm seçili disiplinleri sırayla (2'şerli paralel) çalıştır
  const analyzeAll = async () => {
    if (!input.trim()) { setGlobalError("Lütfen bir metin girin."); return; }
    if (!selected.length) { setGlobalError("En az bir disiplin seçin."); return; }

    setGlobalError("");
    setRunning(true);
    abortRef.current = false;
    setResults({});
    const st = initialStatus();
    selected.forEach(id => { st[id] = "pending"; });
    setStatus(st);
    setActiveTab(selected[0]);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 150);

    const queue = DISCIPLINES.filter(d => selected.includes(d.id));
    const CONCURRENCY = 2;
    let idx = 0;

    const worker = async () => {
      while (idx < queue.length && !abortRef.current) {
        const disc = queue[idx++];
        try {
          const txt = await analyzeOne(disc, input.trim(), inputType);
          setResults(r => ({ ...r, [disc.id]: txt }));
          setStatus(s => ({ ...s, [disc.id]: "done" }));
        } catch (e) {
          setStatus(s => ({ ...s, [disc.id]: "error" }));
          setResults(r => ({ ...r, [disc.id]: "⚠ Bu disiplin analiz edilemedi: " + e.message + "\n\nTekrar denemek için sekme başlığındaki ↻ simgesine dokunun." }));
        }
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    setRunning(false);
  };

  const retryOne = async (id) => {
    const disc = DISCIPLINES.find(d => d.id === id);
    setStatus(s => ({ ...s, [id]: "pending" }));
    try {
      const txt = await analyzeOne(disc, input.trim(), inputType);
      setResults(r => ({ ...r, [id]: txt }));
      setStatus(s => ({ ...s, [id]: "done" }));
    } catch (e) {
      setStatus(s => ({ ...s, [id]: "error" }));
    }
  };

  const stopAll = () => { abortRef.current = true; setRunning(false); };

  const copyAll = () => {
    const full = selected
      .map(id => {
        const d = DISCIPLINES.find(x => x.id === id);
        return results[id] ? `═══ ${d.label} / ${d.labelAr} ═══\n\n${results[id]}` : null;
      })
      .filter(Boolean)
      .join("\n\n\n");
    const header = `MÎZÂN — İslami İlimler Analizi\n${inputType === "ayet" ? "Ayet-i Kerime" : "Hadis-i Şerif"}: ${input}\n\n`;
    navigator.clipboard?.writeText(header + full);
  };

  const doneCount = selected.filter(id => status[id] === "done").length;
  const anyResult = Object.keys(results).length > 0;

  const statusIcon = (st) =>
    st === "done" ? "✓" : st === "streaming" ? "◉" : st === "pending" ? "⏳" : st === "error" ? "↻" : "";

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(1200px 600px at 50% -100px, #1A1408 0%, #0C0A06 60%)", fontFamily: "'Crimson Text',Georgia,serif", color: "#F0E6D0", paddingBottom: 80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Crimson+Text:wght@400;600;700&display=swap');
        @keyframes blink { 0%,100%{opacity:.35} 50%{opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        textarea:focus{outline:none}
        textarea::placeholder{color:rgba(240,230,208,.22)}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-thumb{background:rgba(200,148,42,.3);border-radius:3px}
        .tabrow{overflow-x:auto;scrollbar-width:thin}
      `}</style>

      {/* ── Header ── */}
      <header style={{ textAlign: "center", padding: "44px 16px 28px" }}>
        <div style={{ fontFamily: "'Amiri',serif", fontSize: 15, color: "rgba(200,148,42,.55)", marginBottom: 10 }}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>
        <h1 style={{ margin: 0, fontFamily: "'Amiri',serif", fontSize: 42, fontWeight: 700, background: "linear-gradient(135deg,#F0D78C,#C8942A 55%,#8F6516)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 1 }}>
          MÎZÂN
        </h1>
        <div style={{ fontFamily: "'Amiri',serif", fontSize: 17, color: "rgba(200,148,42,.65)", marginTop: 2 }}>الميزان · İslami İlimler Analiz Motoru</div>
        <p style={{ margin: "10px auto 0", maxWidth: 480, fontSize: 13.5, color: "rgba(240,230,208,.38)", fontStyle: "italic" }}>
          Bir ayet veya hadisi on klasik ilmin terazisinde tartın — her disiplin ayrı ve tam analiz edilir, hiçbiri yarım kalmaz.
        </p>
      </header>

      <main style={{ maxWidth: 880, margin: "0 auto", padding: "0 16px" }}>

        {/* ── Tür seçimi ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[["ayet", "🕌 Ayet-i Kerime"], ["hadis", "📜 Hadis-i Şerif"]].map(([t, lbl]) => (
            <button key={t} onClick={() => setInputType(t)} disabled={running}
              style={{ flex: 1, padding: "11px 0", borderRadius: 10, fontFamily: "inherit", fontSize: 15.5, fontWeight: 600, cursor: "pointer", transition: ".2s",
                border: `1.5px solid ${inputType === t ? "#C8942A" : "rgba(255,255,255,.08)"}`,
                background: inputType === t ? "rgba(200,148,42,.13)" : "rgba(255,255,255,.02)",
                color: inputType === t ? "#E8C56B" : "rgba(240,230,208,.4)" }}>
              {lbl}
            </button>
          ))}
        </div>

        {/* ── Metin girişi ── */}
        <div style={{ border: "1.5px solid rgba(200,148,42,.28)", borderRadius: 14, background: "rgba(255,255,255,.02)", marginBottom: 18, overflow: "hidden" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={running}
            placeholder={inputType === "ayet"
              ? "إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ  —  veya Türkçe: Kevser Suresi 1. ayet"
              : "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ  —  veya: Ameller niyetlere göredir hadisi"}
            style={{ width: "100%", minHeight: 92, background: "transparent", border: "none", padding: "16px 18px", color: "#F0E6D0",
              fontFamily: "'Amiri','Crimson Text',serif", fontSize: 20, lineHeight: 1.8, resize: "vertical", direction: "auto", boxSizing: "border-box" }}
          />
        </div>

        {/* ── Disiplin seçimi ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <span style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "rgba(200,148,42,.6)" }}>
              Disiplinler · {selected.length}/{DISCIPLINES.length}
            </span>
            <span>
              <button onClick={() => setSelected(DISCIPLINES.map(d => d.id))} disabled={running} style={{ background: "none", border: "none", color: "rgba(200,148,42,.6)", fontSize: 12, cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}>tümü</button>
              <span style={{ color: "rgba(255,255,255,.15)", margin: "0 6px" }}>·</span>
              <button onClick={() => setSelected([])} disabled={running} style={{ background: "none", border: "none", color: "rgba(255,120,120,.5)", fontSize: 12, cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}>hiçbiri</button>
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 8 }}>
            {DISCIPLINES.map(d => {
              const on = selected.includes(d.id);
              return (
                <button key={d.id} onClick={() => toggle(
