from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi.responses import RedirectResponse

from app.database import get_db
from app.models import Pedido
from app.services.mercadopago import criar_preferencia

router = APIRouter(prefix="/pagamento", tags=["Pagamento"])

@router.get("/checkout/{pedido_id}")
def abrir_checkout(pedido_id: int, db: Session = Depends(get_db)):
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()

    if not pedido:
        return {"error": "Pedido não encontrado"}

    pref = criar_preferencia(pedido.id, float(pedido.total))

    init_point = pref.get("sandbox_init_point") or pref.get("init_point")

    if not init_point:
            return {"error": "Checkout não gerado"}
    
    return RedirectResponse(init_point)