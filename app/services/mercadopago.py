import mercadopago
import os
from dotenv import load_dotenv

load_dotenv()

MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN")
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000") # Puxa do .env, se não achar usa localhost

if not MP_ACCESS_TOKEN:
    raise RuntimeError("MP_ACCESS_TOKEN não encontrado no ambiente")

sdk = mercadopago.SDK(MP_ACCESS_TOKEN)

def criar_preferencia(pedido_id: int, total: float):
    preference_data = {
        "items": [
            {
                "title": f"Pedido #{pedido_id}",
                "quantity": 1,
                "currency_id": "BRL",
                "unit_price": float(total)
            }
        ],
        "external_reference": str(pedido_id),
        "back_urls": {
            "success": f"{BASE_URL}/pagamento/sucesso",
            "failure": f"{BASE_URL}/pagamento/erro",
            "pending": f"{BASE_URL}/pagamento/pendente"
        },
        "auto_return": "approved"
    }

    preference = sdk.preference().create(preference_data)
    return preference["response"]