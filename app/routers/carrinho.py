from fastapi import APIRouter, Request, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from fastapi.templating import Jinja2Templates

from app.database import get_db
from app.models import Produto

router = APIRouter(
    prefix="/carrinho",
    tags=["Carrinho"]
)

templates = Jinja2Templates(directory="app/templates")


# -----------------------------
# VER CARRINHO
# -----------------------------
@router.get("/")
def ver_carrinho(request: Request):
    carrinho = request.session.get("carrinho", {})
    total = sum(
        item["preco"] * item["quantidade"]
        for item in carrinho.values()
    )

    return templates.TemplateResponse(
        "cliente/carrinho.html",
        {
            "request": request,
            "carrinho": carrinho,
            "total": total
        }
    )


# -----------------------------
# ADICIONAR AO CARRINHO
# -----------------------------
@router.post("/add/{produto_id}")
def adicionar_ao_carrinho(
    produto_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    produto = db.query(Produto).get(produto_id)

    if not produto:
        return {"error": "Produto não encontrado"}

    carrinho = request.session.get("carrinho", {})

    if str(produto_id) in carrinho:
        carrinho[str(produto_id)]["quantidade"] += 1
    else:
        carrinho[str(produto_id)] = {
            "nome": produto.nome,
            "preco": produto.preco,
            "quantidade": 1
        }

    request.session["carrinho"] = carrinho

    return RedirectResponse(
        url="/produtos",
        status_code=303
    )


# -----------------------------
# REMOVER ITEM
# -----------------------------
@router.post("/remover/{produto_id}")
def remover_do_carrinho(produto_id: int, request: Request):
    carrinho = request.session.get("carrinho", {})

    carrinho.pop(str(produto_id), None)
    request.session["carrinho"] = carrinho

    return RedirectResponse(
        url="/carrinho",
        status_code=303
    )