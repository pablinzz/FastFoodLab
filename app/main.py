from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine
from app.models import Base

# Note que removemos carrinho, pagamento e totem daqui
from app.routers import webhook, pedidos, cozinha, produtos, admin

app = FastAPI(
    title="API Lab85",
    version="1.0.0"
)

# --- Configuração do CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cria as tabelas
Base.metadata.create_all(bind=engine)

@app.get("/")
def home():
    return {"status": "API Lab85 rodando perfeitamente!"}

# --- Rotas Ativas da Aplicação ---
app.include_router(produtos.router)
app.include_router(pedidos.router)
app.include_router(webhook.router)
app.include_router(cozinha.router)
app.include_router(admin.router)