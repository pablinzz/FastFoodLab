from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.database import engine
from app.models import Base
from app.routers import carrinho, pagamento, webhook, pedidos, cozinha, totem, produtos, admin

app = FastAPI(
    title="Sistema de Pedidos - Fast Food",
    version="1.0.0"
)

# --- Configuração do CORS (ESSENCIAL PARA A VERCEL) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Dica: Quando o site na Vercel estiver pronto, podes trocar "*" pelo link do site (ex: ["https://fastfoodlab.vercel.app"])
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ------------------------------------------------------

# Middleware de Sessão (Para manter o carrinho do cliente)
app.add_middleware(
    SessionMiddleware,
    secret_key="fastfood-secret-key"
)

# Criação das tabelas na nuvem (Supabase)
Base.metadata.create_all(bind=engine)

# Configuração do Jinja2 e Ficheiros Estáticos
templates = Jinja2Templates(directory="app/templates")
app.mount(
    "/static",
    StaticFiles(directory="app/static"),
    name="static"
)

@app.get("/")
def home():
    return {
        "status": "API FastFood rodando",
        "docs": "/docs"
    }

# --- Rotas da Aplicação ---
app.include_router(produtos.router)
app.include_router(carrinho.router)
app.include_router(pedidos.router)
app.include_router(pagamento.router)
app.include_router(webhook.router)
app.include_router(cozinha.router)
app.include_router(totem.router)
app.include_router(admin.router)