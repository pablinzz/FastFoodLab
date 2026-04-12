from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from app.database import get_db
from app.models import Pedido, ItemPedido
from app.services.mercadopago import criar_preferencia

router = APIRouter(prefix="/pedido", tags=["Pedidos"])

# Dicionário do que a Vercel vai nos enviar:
class ItemCarrinho(BaseModel):
    id: int
    nome: str
    preco: float

class PedidoRequest(BaseModel):
    itens: List[ItemCarrinho]

@router.post("/finalizar")
def finalizar_pedido(req: PedidoRequest, db: Session = Depends(get_db)):
    if not req.itens:
        raise HTTPException(status_code=400, detail="Carrinho vazio")

    # Calcula o total
    total = sum(item.preco for item in req.itens)

    # Cria o Pedido
    pedido = Pedido(total=total, status="AGUARDANDO_PAGAMENTO")
    db.add(pedido)
    db.commit()
    db.refresh(pedido)

    # Adiciona os Itens
    for item in req.itens:
        item_pedido = ItemPedido(
            pedido_id=pedido.id,
            produto_id=item.id,
            quantidade=1, 
            preco_unitario=item.preco
        )
        db.add(item_pedido)

    db.commit()

    # Gera link de Checkout e devolve pro Frontend
    try:
        pref = criar_preferencia(pedido.id, float(pedido.total))
        checkout_url = pref.get("sandbox_init_point") or pref.get("init_point")
        return {"pedido_id": pedido.id, "checkout_url": checkout_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro no Mercado Pago")