from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from app.database import engine
from app.models import Base
from starlette.middleware.sessions import SessionMiddleware
from app.routers import carrinho, pagamento, webhook, pedidos, cozinha, totem, produtos, admin

app = FastAPI(
    title="Sistema de Pedidos - Fast Food",
    version="1.0.0"
)

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

Base.metadata.create_all(bind=engine)

app.add_middleware(
    SessionMiddleware,
    secret_key="fastfood-secret-key"
)

app.include_router(produtos.router)
app.include_router(carrinho.router)
app.include_router(pedidos.router)
app.include_router(pagamento.router)
app.include_router(webhook.router)
app.include_router(cozinha.router)
app.include_router(pagamento.router, prefix="/pagamento")
app.include_router(cozinha.router)
app.include_router(totem.router)
app.include_router(admin.router)