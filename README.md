# RetroChatBot

Kendini **1997**'de sanan bir sohbet robotu. Tek tuşla **2030**'a geçer, hem kişiliği hem de arayüzü değişir.
Eğitim amaçlı bir projedir.

- **Backend:** Python + FastAPI
- **Yapay zeka:** Google Gemini (`google-genai` SDK)
- **Frontend:** Düz HTML, CSS ve JavaScript (kütüphane yok)

## Özellikler

- 1997 görünümü: Windows 95 pencere çerçevesi, çevirmeli modem açılışı, durum çubuğu, 88x31 rozetler, fare izi.
- 2030 görünümü: koyu cam arayüz, hareketli aurora arka plan, imleç ışığı, akıcı animasyonlar.
- Çağlar arası geçiş animasyonu: ileri giderken ışık hızı, geri dönerken VHS geri sarma.
- Cevaplar harf harf yazılır, örnek sorulara tıklanabilir, seçilen çağ hatırlanır.

## Kurulum

```bash
git clone <repo-adresi>
cd RetroChatBot
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

`.env` dosyasını açıp kendi Gemini API anahtarını yaz. Anahtarı [Google AI Studio](https://aistudio.google.com/apikey)
üzerinden ücretsiz alabilirsin.

```bash
uvicorn main:app --reload
```

Sonra tarayıcıda <http://127.0.0.1:8000> adresini aç.
`http://127.0.0.1:8000/?cag=2030` ile doğrudan 2030'da başlayabilirsin.

## Yapılandırma (`.env`)

| Değişken | Açıklama | Varsayılan |
|---|---|---|
| `GEMINI_API_KEY` | Gemini API anahtarı (zorunlu) | – |
| `GEMINI_MODEL` | Kullanılacak model | `gemini-3.8-flash` |
| `RATE_LIMIT_PER_MIN` | IP başına dakikalık istek sınırı | `20` |

## Güvenlik notları

- **API anahtarı asla koda yazılmaz.** Yalnızca `.env` dosyasında durur ve `.gitignore` bu dosyayı dışarıda tutar.
  Anahtarını yanlışlıkla paylaşırsan hemen Google AI Studio'dan sil ve yenisini oluştur.
- Anahtar sunucuda kalır, tarayıcıya hiçbir zaman gönderilmez.
- Sunucu IP başına istek sınırı uygular, sohbet geçmişi boyutunu ve mesaj uzunluğunu sınırlar.
- Güvenlik başlıkları ve sıkı bir Content-Security-Policy gönderilir. Arayüz kullanıcı metnini yalnızca
  `textContent` ile ekler (XSS'e karşı).
- `/docs` ve `/openapi.json` kapalıdır.
- Gemini'nin ham hata metinleri kullanıcıya gösterilmez, yalnızca sunucu log'una yazılır.

> Bu proje bir eğitim örneğidir. İnternete açacaksan kimlik doğrulama eklemeyi ve bir ters vekil
> (reverse proxy) arkasında HTTPS ile çalıştırmayı düşün. Aksi hâlde herkes senin API kotanı kullanabilir.
> Sınır, IP başına uygulanır; proxy arkasında doğru istemci IP'sini iletmen gerekir.

## Proje yapısı

```
main.py              FastAPI uygulaması ve Gemini isteği
static/index.html    Sayfa iskeleti
static/style.css     1997 ve 2030 temaları
static/script.js     Sohbet, geçiş animasyonu, efektler
static/erken.js      Kayıtlı çağı sayfa boyanmadan uygular
requirements.txt     Bağımlılıklar
.env.example         Ortam değişkenleri şablonu
```
