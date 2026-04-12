import mercadopago
import os
from dotenv import load_dotenv

load_dotenv()
MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN")

if not MP_ACCESS_TOKEN:
    raise RuntimeError("MP_ACCESS_TOKEN não encontrado")

sdk = mercadopago.SDK(MP_ACCESS_TOKEN)

def criar_pagamento_pix(pedido_id: int, total: float):
    payment_data = {
        "transaction_amount": float(total),
        "description": f"Pedido #{pedido_id} - Lab85",
        "payment_method_id": "pix",
        "external_reference": str(pedido_id),
        "payer": {
            "email": "cliente@lab85.com" 
        }
    }
    resposta = sdk.payment().create(payment_data)
    return resposta["response"]