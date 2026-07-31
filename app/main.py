from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import produtos, pedidos, cozinha, admin, webhook, estoque

# Cria as tabelas automaticamente
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Boteco do MK API")

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registar todas as rotas
app.include_router(produtos.router)
app.include_router(pedidos.router)
app.include_router(cozinha.router)
app.include_router(admin.router)
app.include_router(webhook.router)
app.include_router(estoque.router) # <- Esta linha faz a magia acontecer!

@app.get("/")
def root():
    return {"mensagem": "API do Boteco do MK está online!"}