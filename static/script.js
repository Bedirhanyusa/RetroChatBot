const $ = (id) => document.getElementById(id);

const mesajlar = $("mesajlar");
const form = $("form");
const girdi = $("girdi");
const gonder = $("gonder");
const sayac = $("sayac");
const saat = $("saat");
const durum = $("durum");
const oneriler = $("oneriler");
const cagButonu = $("cag-butonu");

const azHareket = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Çağa göre değişen metinler
const CAGLAR = {
    "1997": {
        botAdi: "RetroBot",
        kullaniciAdi: "Sen",
        baslik: "RetroChatBot - 1997'nin En Cool Sohbet Robotu!",
        selam: "Selam! Ben RetroBot. Yil 1997 ve internet harika! Bana bir sey sor :)",
        placeholder: "Mesajini yaz...",
        gonderYazi: "GONDER",
        bekle: "modem baglaniyor... *bip bip kssshhh*",
        hataIsim: "HATA",
        hataMetin: (m) => "Baglanti koptu! (" + m + ")",
        durumBos: "Belge: Bitti",
        durumBekle: "www.retrobot.com adresine ulasiliyor... bekleyin",
        yaziHizi: 22,
        oneriler: [
            "Windows 95 nasil bir sey?",
            "Internet'te neler yapiyorsun?",
            "En sevdigin oyun ne?",
            "Tamagotchi'ni besledin mi?",
            "Gelecekte neler olacak sence?",
        ],
    },
    "2030": {
        botAdi: "NeoBot",
        kullaniciAdi: "Sen",
        baslik: "NeoBot 2030 - Geleceğin Yapay Zekası",
        selam: "Merhaba! Ben NeoBot. Yıl 2030 ve gelecek tam burada. Bana her şeyi sorabilirsin. ✨",
        placeholder: "Bir mesaj yaz...",
        gonderYazi: "Gönder",
        bekle: "",
        hataIsim: "Hata",
        hataMetin: (m) => "Bağlantı kesildi. (" + m + ")",
        durumBos: "Sinirsel bağlantı aktif · 0.2 ms",
        durumBekle: "Kuantum ağı işliyor…",
        yaziHizi: 14,
        oneriler: [
            "Uçan taksiyle işe gidebilir miyim?",
            "Mars'ta tatil yapılıyor mu?",
            "Disket nedir?",
            "Beynime internet bağlayabilir miyim?",
            "Bu hafta ne yemeliyim?",
        ],
    },
};

let cag = document.body.classList.contains("modern") ? "2030" : "1997";
let gecmis = [];
let yazimBelirteci = 0; // çağ değişince süren daktilo efektini iptal eder
let cagNo = 0; // her çağ uygulamasında artar; bekleyen isteklerin eski olup olmadığını gösterir
let gecisteMi = false;

function kaydet(anahtar, deger) {
    try { localStorage.setItem(anahtar, deger); } catch (e) { /* önemsiz */ }
}

// ---------- Sayaç ve saat ----------
let ziyaretci = Math.floor(Math.random() * 90000) + 10000;
function sayaciYaz() {
    sayac.textContent = String(ziyaretci).padStart(6, "0");
}
sayaciYaz();
setInterval(() => {
    // 2030'da "çevrimiçi" sayısı canlı dalgalanır
    if (cag === "2030") {
        ziyaretci = Math.max(1000, ziyaretci + Math.floor(Math.random() * 21) - 10);
        sayaciYaz();
    }
}, 2500);

function saatiYaz() {
    const d = new Date();
    const iki = (n) => String(n).padStart(2, "0");
    const tarih = iki(d.getDate()) + "." + iki(d.getMonth() + 1) + "." + cag;
    const zaman = iki(d.getHours()) + ":" + iki(d.getMinutes()) + ":" + iki(d.getSeconds());
    saat.textContent = tarih + " " + zaman;
}
saatiYaz();
setInterval(saatiYaz, 1000);

// ---------- Mesajlar ----------
function mesajEkle(sinif, isim, metin) {
    const p = document.createElement("p");
    p.className = sinif;
    const b = document.createElement("b");
    b.textContent = isim + ": ";
    p.appendChild(b);
    if (metin) p.appendChild(document.createTextNode(metin));
    mesajlar.appendChild(p);
    mesajlar.scrollTop = mesajlar.scrollHeight;
    return p;
}

function bekleMesaji() {
    const c = CAGLAR[cag];
    const p = mesajEkle("bot yaziyor", c.botAdi, c.bekle);
    const noktalar = document.createElement("span");
    noktalar.className = "noktalar";
    for (let i = 0; i < 3; i++) noktalar.appendChild(document.createElement("i"));
    p.appendChild(noktalar);
    return p;
}

// Bot cevabını harf harf yazar (1997'de daktilo, 2030'da akıcı)
function yazarakEkle(metin) {
    const c = CAGLAR[cag];
    const p = mesajEkle("bot", c.botAdi, "");
    if (azHareket) {
        p.appendChild(document.createTextNode(metin));
        mesajlar.scrollTop = mesajlar.scrollHeight;
        return Promise.resolve();
    }

    const benimBelirtecim = ++yazimBelirteci;
    const dugum = document.createTextNode("");
    const imlec = document.createElement("span");
    imlec.className = "imlec";
    p.appendChild(dugum);
    p.appendChild(imlec);

    const adim = Math.max(1, Math.ceil(metin.length / 160));
    let i = 0;

    return new Promise((bitti) => {
        const tikla = () => {
            if (benimBelirtecim !== yazimBelirteci) { imlec.remove(); return bitti(); }
            i = Math.min(metin.length, i + adim);
            dugum.nodeValue = metin.slice(0, i);
            mesajlar.scrollTop = mesajlar.scrollHeight;
            if (i < metin.length) {
                setTimeout(tikla, c.yaziHizi);
            } else {
                imlec.remove();
                bitti();
            }
        };
        tikla();
    });
}

function durumYaz(metin) {
    durum.textContent = metin;
}

// ---------- Örnek sorular ----------
function onerileriCiz() {
    oneriler.textContent = "";
    for (const soru of CAGLAR[cag].oneriler) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "oneri";
        btn.textContent = soru;
        btn.addEventListener("click", () => {
            btn.classList.add("ziyaret-edildi");
            mesajGonder(soru);
        });
        oneriler.appendChild(btn);
    }
}

// ---------- Çağı uygula ----------
function cagiUygula(yeniCag) {
    cag = yeniCag;
    const c = CAGLAR[cag];
    yazimBelirteci++;
    cagNo++;

    document.body.classList.toggle("modern", cag === "2030");
    document.title = c.baslik;
    girdi.placeholder = c.placeholder;
    gonder.value = c.gonderYazi;
    kaydet("cag", cag);
    // ?cag= parametresi, sonradan yapılan seçimi yeniden yüklemede ezmesin
    if (location.search.includes("cag=")) history.replaceState(null, "", location.pathname);

    // Bot kişilik değiştirdiği için önceki konuşmayı sıfırla
    gecmis = [];
    mesajlar.textContent = "";
    mesajEkle("bot", c.botAdi, c.selam);
    onerileriCiz();
    durumYaz(c.durumBos);
    saatiYaz();
}

// ---------- Mesaj gönderme ----------
async function mesajGonder(metin) {
    metin = metin.trim();
    if (!metin || gonder.disabled || gecisteMi) return;

    const c = CAGLAR[cag];
    const istekCagi = cag;
    const istekNo = cagNo; // çağ A→B→A değişse bile eski cevabı ayırt etmek için

    mesajEkle("kullanici", c.kullaniciAdi, metin);
    girdi.value = "";
    gonder.disabled = true;
    durumYaz(c.durumBekle);
    const bekle = bekleMesaji();

    try {
        const yanit = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: metin, history: gecmis, era: istekCagi }),
        });

        let veri = {};
        try { veri = await yanit.json(); } catch (e) { /* JSON olmayan hata sayfası */ }
        if (!yanit.ok) {
            throw new Error(typeof veri.detail === "string" ? veri.detail : "Sunucu hatasi (" + yanit.status + ")");
        }

        // Cevap beklenirken çağ değiştiyse eski çağın cevabını gösterme
        if (istekNo !== cagNo) return;

        bekle.remove();
        gecmis.push({ role: "user", text: metin });
        gecmis.push({ role: "model", text: veri.reply });
        await yazarakEkle(veri.reply);
    } catch (err) {
        if (istekNo !== cagNo) return;
        bekle.remove();
        mesajEkle("hata", c.hataIsim, c.hataMetin(err.message));
    } finally {
        if (istekNo === cagNo) {
            gonder.disabled = false;
            durumYaz(CAGLAR[cag].durumBos);
            if (!gecisteMi) girdi.focus();
        }
    }
}

form.addEventListener("submit", (e) => {
    e.preventDefault();
    mesajGonder(girdi.value);
});

// ---------- Çağlar arası geçiş animasyonu ----------
const gecis = $("gecis");
const tuval = $("gecis-tuval");
const ctx = tuval.getContext("2d");
const gecisYil = $("gecis-yil");
const gecisEtiket = $("gecis-etiket");

function tuvaliBoyutlandir(kucult) {
    const oran = Math.min(window.devicePixelRatio || 1, 1.5) / kucult;
    tuval.width = Math.max(2, Math.floor(window.innerWidth * oran));
    tuval.height = Math.max(2, Math.floor(window.innerHeight * oran));
}

// İleri sarma: yıldızlar merkezden ışık hızıyla akar
function isikHiziHazirla() {
    const yildizlar = [];
    for (let i = 0; i < 260; i++) {
        yildizlar.push({ a: Math.random() * Math.PI * 2, r: Math.random() * 40, h: 0.4 + Math.random() });
    }
    return yildizlar;
}

function isikHiziCiz(yildizlar, p, e) {
    const w = tuval.width, h = tuval.height;
    const cx = w / 2, cy = h / 2;
    const maks = Math.hypot(cx, cy);

    ctx.fillStyle = p < 0.05 ? "rgb(5,6,20)" : "rgba(5,6,20,0.28)";
    ctx.fillRect(0, 0, w, h);

    const hiz = (4 + e * 70) * (w / 800);
    ctx.lineCap = "round";
    for (const s of yildizlar) {
        const onceki = s.r;
        s.r += hiz * s.h * (0.3 + s.r / maks);
        if (s.r > maks) { s.r = Math.random() * 30; s.a = Math.random() * Math.PI * 2; continue; }
        const x0 = cx + Math.cos(s.a) * onceki, y0 = cy + Math.sin(s.a) * onceki;
        const x1 = cx + Math.cos(s.a) * s.r, y1 = cy + Math.sin(s.a) * s.r;
        const g = ctx.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, "rgba(110,231,255,0)");
        g.addColorStop(1, s.h > 0.9 ? "#ff7ad9" : "#a8e8ff");
        ctx.strokeStyle = g;
        ctx.lineWidth = 1 + (s.r / maks) * 2.5 * (w / 800);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }

    // Tema değişirken beyaz parlama
    const parla = Math.max(0, 1 - Math.abs(p - 0.55) / 0.14);
    // Beyaz zeminde okunmayan yazıyı parlama sırasında soluklaştır
    gecisYil.parentElement.style.opacity = (1 - parla * 0.9).toFixed(2);
    if (parla > 0) {
        ctx.fillStyle = "rgba(255,255,255," + (parla * 0.95).toFixed(3) + ")";
        ctx.fillRect(0, 0, w, h);
    }
}

// Geri sarma: VHS parazit, takip çizgisi ve renk kayması
let takipY = 0;
function vhsCiz(p) {
    const w = tuval.width, h = tuval.height;
    const goruntu = ctx.createImageData(w, h);
    const veri = goruntu.data;
    const parlaklik = 70 + 120 * Math.sin(Math.min(1, p) * Math.PI);
    for (let i = 0; i < veri.length; i += 4) {
        const v = Math.random() * parlaklik;
        veri[i] = veri[i + 1] = veri[i + 2] = v;
        veri[i + 3] = 255;
    }
    ctx.putImageData(goruntu, 0, 0);

    // Yatay glitch şeritleri
    for (let i = 0; i < 6; i++) {
        const y = Math.random() * h;
        const kalin = 2 + Math.random() * (h / 25);
        ctx.fillStyle = Math.random() < 0.5 ? "rgba(255,0,200,0.35)" : "rgba(0,240,255,0.35)";
        ctx.fillRect(0, y, w, kalin);
    }

    // Aşağıdan yukarı kayan takip çizgisi
    takipY = (takipY - h * 0.03 + h) % h;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillRect(0, takipY, w, Math.max(2, h / 40));

    // Tarama çizgileri
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
}

function cagDegistir(hedef) {
    if (gecisteMi || hedef === cag) return;
    gecisteMi = true;
    cagButonu.disabled = true;
    gonder.disabled = true;

    if (azHareket) {
        cagiUygula(hedef);
        gecisteMi = false;
        cagButonu.disabled = false;
        gonder.disabled = false;
        return;
    }

    const ileri = hedef === "2030";
    const yil0 = ileri ? 1997 : 2030;
    const yil1 = ileri ? 2030 : 1997;
    const SURE = 2600;
    const yildizlar = ileri ? isikHiziHazirla() : null;

    tuvaliBoyutlandir(ileri ? 1 : 4);
    gecis.className = "gecis " + (ileri ? "ileri" : "geri");
    gecisEtiket.textContent = ileri ? "ZAMAN ATLAMASI  ▶▶" : "◀◀  GERI SARIYOR";
    gecisYil.textContent = yil0;
    gecisYil.parentElement.style.opacity = "";
    gecis.hidden = false;
    void gecis.offsetWidth; // yeniden boyamayı zorla ki solma geçişi gerçekten çalışsın
    gecis.classList.add("acik");

    const baslangic = performance.now();
    let degisti = false;

    function kare(t) {
        const p = Math.min(1, (t - baslangic) / SURE);
        const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        gecisYil.textContent = Math.round(yil0 + (yil1 - yil0) * e);

        if (ileri) isikHiziCiz(yildizlar, p, e);
        else vhsCiz(p);

        // Ekran tamamen örtülüyken temayı değiştir
        if (!degisti && p >= 0.55) {
            degisti = true;
            cagiUygula(hedef);
        }

        if (p < 1) {
            requestAnimationFrame(kare);
        } else {
            gecis.classList.remove("acik");
            setTimeout(() => {
                gecis.hidden = true;
                gecisteMi = false;
                cagButonu.disabled = false;
                gonder.disabled = false;
                girdi.focus();
            }, 450);
        }
    }
    requestAnimationFrame(kare);
}

cagButonu.addEventListener("click", () => {
    cagDegistir(cag === "1997" ? "2030" : "1997");
});

// ---------- 1997 açılış: çevirmeli bağlantı penceresi ----------
function girisCalistir() {
    if (!document.body.classList.contains("giris-var")) return;
    try { sessionStorage.setItem("giris", "1"); } catch (e) { /* önemsiz */ }

    const metin = $("giris-metin");
    const dolgu = $("ilerleme-dolgu");
    const adimlar = [
        [0, "Numara cevriliyor: 0212 555 0197"],
        [25, "Modem el sikisiyor... *bip bip kssshhh*"],
        [60, "Kullanici adi ve sifre dogrulaniyor..."],
        [92, "Baglandi! 56000 bps"],
    ];

    let yuzde = 0;
    const bitir = () => {
        clearInterval(zamanlayici);
        document.body.classList.remove("giris-var");
        document.removeEventListener("keydown", bitir);
        $("giris").removeEventListener("click", bitir);
        girdi.focus();
    };
    const zamanlayici = setInterval(() => {
        yuzde += 1.4;
        dolgu.style.width = Math.min(100, yuzde) + "%";
        for (const [esik, yazi] of adimlar) {
            if (yuzde >= esik) metin.textContent = yazi;
        }
        if (yuzde >= 108) bitir();
    }, 40);

    $("giris").addEventListener("click", bitir);
    document.addEventListener("keydown", bitir);
}

// ---------- İmleç efektleri ----------
const aura = $("aura");
let sonIz = 0;
const IZ_RENKLERI = ["#ffff00", "#ff00ff", "#00ffff", "#ff0000", "#00ff00"];

if (!azHareket) {
    document.addEventListener("mousemove", (e) => {
        if (cag === "2030") {
            aura.style.transform = "translate(" + (e.clientX - 150) + "px," + (e.clientY - 150) + "px)";
            return;
        }
        const simdi = performance.now();
        if (simdi - sonIz < 35) return;
        sonIz = simdi;
        const iz = document.createElement("span");
        iz.className = "iz";
        iz.textContent = "*";
        iz.style.left = e.clientX + "px";
        iz.style.top = e.clientY + "px";
        iz.style.color = IZ_RENKLERI[Math.floor(Math.random() * IZ_RENKLERI.length)];
        document.body.appendChild(iz);
        setTimeout(() => iz.remove(), 700);
    });
}

// ---------- Başlangıç ----------
cagiUygula(cag);
girisCalistir();
