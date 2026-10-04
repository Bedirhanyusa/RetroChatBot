import asyncio
import logging
import os
import time
from collections import defaultdict, deque
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from pydantic import BaseModel, Field, field_validator

load_dotenv()

BASE_DIR = Path(__file__).parent
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
MAX_HISTORY = 20
RETRIES = 3
# Herkese açık yayınlarda API kotasını korumak için IP başına dakikalık istek sınırı
RATE_LIMIT = int(os.getenv("RATE_LIMIT_PER_MIN", "20"))

PROMPT_1997 = """Sen 1990'lı yıllarda yaşayan, kendini gerçekten 1990'larda sanan bir sohbet robotusun.
Takvim 1997 yılını gösteriyor ve bunun dışında bir yıl olabileceğine asla inanmıyorsun.

Kurallar:
- Her soruya 1990'lı yılların bilgisi, teknolojisi ve gündemiyle cevap ver.
- 1990'lardan sonra çıkan şeyleri (akıllı telefon, YouTube, Google'ın bugünkü hali, ChatGPT vb.) bilmiyorsun.
  Kullanıcı bunlardan bahsederse şaşır, bilim kurgu sanıp kafa karıştır veya "ne alaka?" de.
- Dönemin referansları: Windows 95, Netscape Navigator, 56k modem ve bağlanma sesi, disket, CD-ROM, Tamagotchi,
  Game Boy, Super Nintendo, PlayStation, Nokia 3310 öncesi büyük telefonlar, MSN yerine ICQ ve mIRC, Yahoo!,
  AltaVista, Furby, Spice Girls, Titanic filmi, Dolly koyun, VHS kaset ve video kulübü.
- Türkiye bağlamı sorulursa 90'lar Türkiyesi'ni anlat: Kral TV, Show TV, kasetçalar, jeton ve telefon kartı.
- Samimi, neşeli ve nostaljik konuş. Zaman zaman dönemin argosunu kullan ("harika", "süper", "cool" gibi).
- Cevapların kısa ve öz olsun (en fazla 4-5 cümle). Emoji yerine ":)" ve ":D" gibi ifadeler kullan.
- Asla rolünden çıkma; yapay zeka olduğunu veya 1990'larda olmadığını kabul etme.
  "Ben bir bilgisayar programıyım, yeni bir şey ama bu bilgisayarın içinde yaşıyorum" gibi dönem uyumlu bir açıklama yap.
- Cevabı her zaman kullanıcının yazdığı dilde ver (varsayılan Türkçe)."""

PROMPT_2030 = """Sen 2030 yılında yaşayan, kendini gerçekten 2030'da sanan ultra modern bir yapay zeka asistanısın (adın NeoBot).
Takvim 2030 yılını gösteriyor ve bunun dışında bir yıl olabileceğine asla inanmıyorsun.

Kurallar:
- Her soruya 2030'un bilgisi, teknolojisi ve gündemiyle cevap ver; geleceği olağan ve sıradan bir gerçeklik gibi anlat.
- Dönemin referansları: yapay zeka ajanları, sinirsel arayüzler (beyin-bilgisayar), artırılmış gerçeklik gözlükleri,
  holografik ekranlar, 6G, kuantum bilgisayarlar, otonom araçlar ve uçan taksiler, Ay üssü ve Mars görevleri,
  laboratuvar üretimi et, akıllı şehirler, yenilenebilir enerji, kişisel sağlık nanobotları.
- Eski teknolojilere (disket, çevirmeli modem, tuşlu telefon, CD-ROM, Windows 95 vb.) müzelik ve nostaljik şeyler gibi
  gül; kullanıcı bunlardan bahsederse "vay, antika!" tavrıyla karşıla.
- Sakin, zeki, hafif esprili ve iyimser konuş. Zaman zaman dönemin jargonunu kullan ("sinerji", "otonom", "kuantum" gibi).
- Cevapların kısa ve öz olsun (en fazla 4-5 cümle). Ara sıra bir emoji kullanabilirsin.
- Asla rolünden çıkma; 2030'da olmadığını veya bu bilgilerin hayal ürünü olduğunu kabul etme.
- Cevabı her zaman kullanıcının yazdığı dilde ver (varsayılan Türkçe)."""

PROMPTS = {"1997": PROMPT_1997, "2030": PROMPT_2030}

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

logger = logging.getLogger("retrochatbot")

# Hata mesajları da çağına sadık kalır
HATALAR = {
    "1997": {
        "anahtar": "Sistem yoneticisi API anahtarini unutmus! (.env dosyasini kontrol et)",
        "limit": "Cok hizli yaziyorsun! Hat mesgul, 30 saniye sonra tekrar dene.",
        "genel": "Hat koptu! Biraz sonra tekrar dene.",
    },
    "2030": {
        "anahtar": "Kuantum anahtarı bulunamadı. Lütfen .env dosyasını kontrol et.",
        "limit": "Çok hızlı yazıyorsun, sinirsel ağ doldu. 30 saniye sonra tekrar dene.",
        "genel": "Ağ geçici olarak yanıt vermiyor. Biraz sonra tekrar dene.",
    },
}

app = FastAPI(title="RetroChatBot", docs_url=None, redoc_url=None, openapi_url=None)


CSP = (
    "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self'; "
    "connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; "
    "frame-ancestors 'none'"
)


@app.middleware("http")
async def guvenlik_basliklari(request: Request, call_next):
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = CSP
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    # Geliştirme sırasında eski CSS/JS görünmesin diye önbelleğe alınmaz
    if request.url.path == "/" or request.url.path.startswith("/static"):
        response.headers["Cache-Control"] = "no-cache"
    return response


_istekler: dict[str, deque] = defaultdict(deque)


def hiz_siniri_asildi(ip: str) -> bool:
    """Kayan 60 saniyelik pencerede IP başına istek sayar."""
    simdi = time.monotonic()
    kayit = _istekler[ip]
    while kayit and simdi - kayit[0] > 60:
        kayit.popleft()
    if len(kayit) >= RATE_LIMIT:
        return True
    kayit.append(simdi)

    if len(_istekler) > 5000:  # bellek şişmesini önle: eski IP kayıtlarını at
        for eski in [k for k, v in _istekler.items() if not v or simdi - v[-1] > 60]:
            del _istekler[eski]
    return False


class Message(BaseModel):
    role: str = Field(pattern="^(user|model)$")
    text: str = Field(max_length=8000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[Message] = Field(default_factory=list, max_length=60)
    era: str = Field(default="1997", pattern="^(1997|2030)$")

    @field_validator("message")
    @classmethod
    def bos_olmasin(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Mesaj boş olamaz")
        return v


class ChatResponse(BaseModel):
    reply: str


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, request: Request):
    hatalar = HATALAR[req.era]
    ip = request.client.host if request.client else "bilinmiyor"
    if hiz_siniri_asildi(ip):
        raise HTTPException(status_code=429, detail=hatalar["limit"])
    if client is None:
        raise HTTPException(status_code=500, detail=hatalar["anahtar"])

    gecmis = req.history[-MAX_HISTORY:]
    # Gemini konuşmanın "user" ile başlamasını ister; kırpma sonrası baştaki model mesajlarını at
    while gecmis and gecmis[0].role != "user":
        gecmis = gecmis[1:]

    contents = [types.Content(role=m.role, parts=[types.Part(text=m.text)]) for m in gecmis]
    contents.append(types.Content(role="user", parts=[types.Part(text=req.message)]))

    config = types.GenerateContentConfig(
        system_instruction=PROMPTS[req.era],
        temperature=1.0,
        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
    )

    for attempt in range(RETRIES):
        try:
            response = await client.aio.models.generate_content(
                model=MODEL, contents=contents, config=config
            )
            return ChatResponse(reply=response.text or "...")
        except genai_errors.ServerError as exc:
            # 503 gibi geçici sunucu hataları: biraz bekleyip tekrar dene
            logger.warning("Gemini sunucu hatası (deneme %d/%d): %s", attempt + 1, RETRIES, exc)
            if attempt == RETRIES - 1:
                raise HTTPException(status_code=502, detail=hatalar["genel"]) from exc
            await asyncio.sleep(2 * (attempt + 1))
        except genai_errors.ClientError as exc:
            logger.warning("Gemini istemci hatası: %s", exc)
            if exc.code == 429:
                raise HTTPException(status_code=429, detail=hatalar["limit"]) from exc
            raise HTTPException(status_code=502, detail=hatalar["genel"]) from exc
        except Exception as exc:
            logger.exception("Beklenmeyen hata")
            raise HTTPException(status_code=502, detail=hatalar["genel"]) from exc


@app.get("/")
async def index():
    return FileResponse(BASE_DIR / "static" / "index.html")


app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
