from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from app.database import get_db
from app.models import Pedido, ItemPedido
from app.services.mercadopago import criar_pagamento_pix

router = APIRouter(prefix="/pedido", tags=["Pedidos"])

class ItemCarrinho(BaseModel):
    id: int
    nome: str
    preco: float
    uniqueId: float

class PedidoRequest(BaseModel):
    itens: List[ItemCarrinho]
    metodo_pagamento: str  # Novo campo: "PIX", "DEBITO", "CREDITO", ou "DINHEIRO"

@router.post("/finalizar")
def finalizar_pedido(req: PedidoRequest, db: Session = Depends(get_db)):
    if not req.itens:
        raise HTTPException(status_code=400, detail="Carrinho vazio")

    total = sum(item.preco for item in req.itens)

    # Cria o pedido no banco de dados com base na forma de pagamento
    if req.metodo_pagamento == "DINHEIRO":
        status_inicial = "PAGAR_NO_CAIXA"
    else:
        status_inicial = "AGUARDANDO_PAGAMENTO"

    pedido = Pedido(total=total, status=status_inicial)
    db.add(pedido)
    db.commit()
    db.refresh(pedido)

    # Salva os itens do pedido
    for item in req.itens:
        item_pedido = ItemPedido(
            pedido_id=pedido.id, produto_id=item.id, quantidade=1, preco_unitario=item.preco
        )
        db.add(item_pedido)
    db.commit()

    # --- LÓGICA DE PAGAMENTO ---
    if req.metodo_pagamento == "PIX":
        try:
            pix_response = criar_pagamento_pix(pedido.id, float(pedido.total))
            qr_code_base64 = pix_response["point_of_interaction"]["transaction_data"]["qr_code_base64"]
            return {"pedido_id": pedido.id, "acao": "MOSTRAR_QR_CODE", "qr_code_base64": qr_code_base64}
        except Exception as e:
            raise HTTPException(status_code=500, detail="Erro ao gerar PIX")

    elif req.metodo_pagamento in ["DEBITO", "CREDITO"]:
        # AQUI ENTRA A INTEGRAÇÃO COM A MAQUININHA FÍSICA NO FUTURO
        # Ex: Acordar a maquininha do Mercado Pago Point via API.
        # Por enquanto, retornamos para o Totem ficar aguardando o pagamento.
        return {"pedido_id": pedido.id, "acao": "AGUARDANDO_MAQUININHA"}

    elif req.metodo_pagamento == "DINHEIRO":
        # Finaliza na hora e manda o cliente para o caixa
        return {"pedido_id": pedido.id, "acao": "IR_PARA_CAIXA"}

# Rota para checar status continua igual
@router.get("/{pedido_id}/status")
def checar_status(pedido_id: int, db: Session = Depends(get_db)):
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    return {"status": pedido.status if pedido else "ERRO"}