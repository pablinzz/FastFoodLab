from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
import mercadopago
import os

from app.database import get_db
from app.models import Pedido

router = APIRouter(prefix="/webhook", tags=["Webhook"])

sdk = mercadopago.SDK(os.getenv("MP_ACCESS_TOKEN"))


@router.post("/mercadopago")
async def webhook_mp(request: Request, db: Session = Depends(get_db)):
    data = await request.json()

    if data.get("type") == "payment":
        payment_id = data["data"]["id"]
        payment = sdk.payment().get(payment_id)["response"]

        if payment["status"] == "approved":
            pedido_id = int(payment["external_reference"])

            pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
            pedido.status = "PAGO"
            db.commit()

    return {"status": "ok"}