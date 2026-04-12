from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from fastapi.responses import HTMLResponse
from app.database import get_db
from app.models import Pedido, ItemPedido, Produto

router = APIRouter(
    prefix="/cozinha",
    tags=["Cozinha"]
)

@router.get("/", response_class=HTMLResponse)
def tela_cozinha(request: Request):
    with open("app/templates/cozinha/cozinha.html", "r", encoding="utf-8") as f:
        return f.read()


# -----------------------
# Listar pedidos ativos
# -----------------------
@router.get("/pedidos")
def listar_pedidos(db: Session = Depends(get_db)):
    pedidos = (
        db.query(Pedido)
        .options(
            joinedload(Pedido.itens)
            .joinedload(ItemPedido.produto)
        )
        .filter(Pedido.status.in_(["PAGO", "EM_PREPARO"]))
        .order_by(Pedido.id.asc())
        .all()
    )

    return pedidos


# -----------------------
# Atualizar status
# -----------------------
@router.put("/pedido/{pedido_id}/status")
def atualizar_status(
    pedido_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()

    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")

    if status not in ["EM_PREPARO", "PRONTO"]:
        raise HTTPException(status_code=400, detail="Status inválido")

    pedido.status = status
    db.commit()

    return {"message": "Status atualizado"}