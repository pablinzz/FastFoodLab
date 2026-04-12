from fastapi import APIRouter, Depends, Request, Form
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import Produto

router = APIRouter(
    prefix="/produtos",
    tags=["Produtos"]
)

templates = Jinja2Templates(directory="app/templates")

class ProdutoCreate(BaseModel):
    nome: str
    preco: float
    categoria: str | None = None

# -----------------------------
# LISTAR PRODUTOS (MENU)
# -----------------------------
@router.get("/")
def listar_produtos(
    request: Request,
    db: Session = Depends(get_db)
):
    produtos = db.query(Produto).filter(Produto.ativo == True).all()

    return templates.TemplateResponse(
        "cliente/menu.html",
        {
            "request": request,
            "produtos": produtos
        }
    )


# -----------------------------
# FORMULÁRIO DE NOVO PRODUTO
# (uso interno / admin)
# -----------------------------
@router.get("/novo")
def form_novo_produto(request: Request):
    return templates.TemplateResponse(
        "cliente/novo_produto.html",
        {"request": request}
    )


# -----------------------------
# CRIAR PRODUTO
# -----------------------------
@router.post("/")
def criar_produto(produto: ProdutoCreate, db: Session = Depends(get_db)):
    novo_produto = Produto(
        nome=produto.nome,
        preco=produto.preco,
        categoria=produto.categoria
    )
    db.add(novo_produto)
    db.commit()
    db.refresh(novo_produto)
    return novo_produto