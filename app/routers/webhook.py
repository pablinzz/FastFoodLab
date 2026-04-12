from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
import mercadopago
import os

from app.database import get_db
from app.models import Pedido

router = APIRouter(prefix="/webhook", tags=["Webhook"])

sdk = mercadopago.SDK(os.getenv("MP_ACCESS_TOKEN"))

@router.post("/mercadopago")
async def mercadopago_webhook(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
        print("Webhook Recebido do MP:", body) # Fica salvo no log do Render

        # O MP avisa que houve um pagamento
        if body.get("type") == "payment" or body.get("topic") == "payment":
            
            # Pega o ID da transação
            if "data" in body and "id" in body["data"]:
                pagamento_id = body["data"]["id"]
            else:
                pagamento_id = body.get("id")

            if pagamento_id:
                # Pergunta ao MP os detalhes desta transação
                resposta = sdk.payment().get(pagamento_id)
                pagamento = resposta["response"]

                # O external_reference tem o ID do nosso Pedido na base de dados
                pedido_id = pagamento.get("external_reference")
                status_mp = pagamento.get("status")

                if pedido_id and status_mp == "approved":
                    pedido = db.query(Pedido).filter(Pedido.id == int(pedido_id)).first()
                    if pedido:
                        pedido.status = "PAGO" # Atualiza para PAGO em maiúsculo (A Cozinha e o Totem precisam disto!)
                        db.commit()
                        print(f"Pedido {pedido_id} foi marcado como PAGO com sucesso!")
        
        return {"status": "sucesso"}

    except Exception as e:
        print(f"Erro ao processar o webhook: {e}")
        # Mesmo com erro, devolvemos 200 pro MP parar de tentar enviar infinitamente
        return {"status": "erro", "detalhe": str(e)}