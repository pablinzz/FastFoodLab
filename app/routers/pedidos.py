from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Pedido, ItemPedido, Produto

router = APIRouter(
    prefix="/pedido",
    tags=["Pedidos"]
)


@router.post("/finalizar")
def finalizar_pedido(
    request: Request,
    db: Session = Depends(get_db)
):
    carrinho = request.session.get("carrinho")

    if not carrinho:
        raise HTTPException(status_code=400, detail="Carrinho vazio")

    total = 0

    # -----------------------
    # Criar pedido
    # -----------------------
    pedido = Pedido(
        total=0,
        status="AGUARDANDO_PAGAMENTO"
    )

    db.add(pedido)
    db.commit()
    db.refresh(pedido)

    # -----------------------
    # Criar itens do pedido
    # -----------------------
    for produto_id, item in carrinho.items():
        produto = db.query(Produto).filter(
            Produto.id == int(produto_id)
        ).first()

        if not produto:
            raise HTTPException(
                status_code=404,
                detail=f"Produto {produto_id} não encontrado"
            )

        subtotal = produto.preco * item["quantidade"]
        total += subtotal

        item_pedido = ItemPedido(
            pedido_id=pedido.id,
            produto_id=produto.id,
            quantidade=item["quantidade"],
            preco_unitario=produto.preco
        )

        db.add(item_pedido)

    # Atualizar total real
    pedido.total = total

    db.commit()

    # -----------------------
    # Limpar carrinho
    # -----------------------
    request.session["carrinho"] = {}

    # -----------------------
    # Ir para pagamento
    # -----------------------
    return RedirectResponse(
        url=f"/pagamento/{pedido.id}",
        status_code=303
    )