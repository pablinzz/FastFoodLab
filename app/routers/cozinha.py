from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Pedido, ItemPedido, Produto
from pydantic import BaseModel

router = APIRouter(prefix="/cozinha", tags=["Cozinha"])

class StatusUpdate(BaseModel):
    status: str

@router.get("/pedidos")
def listar_pedidos_cozinha(db: Session = Depends(get_db)):
    # AGORA BUSCA PEDIDOS PENDENTES E PAGOS
    status_permitidos = ["AGUARDANDO_PAGAMENTO", "PAGAR_NO_CAIXA", "PAGO", "PREPARANDO"]
    pedidos = db.query(Pedido).filter(Pedido.status.in_(status_permitidos)).order_by(Pedido.id.asc()).all()
    
    resultado = []
    for p in pedidos:
        itens_db = db.query(ItemPedido).filter(ItemPedido.pedido_id == p.id).all()
        itens_formatados = []
        
        for item in itens_db:
            produto = db.query(Produto).filter(Produto.id == item.produto_id).first()
            nome_produto = produto.nome if produto else "Produto Apagado"
            
            itens_formatados.append({
                "nome": nome_produto,
                "quantidade": item.quantidade,
                "observacoes": item.observacoes
            })
            
        resultado.append({
            "id": p.id,
            "status": p.status,
            "nome_cliente": p.nome_cliente or "Cliente",
            "tipo_consumo": p.tipo_consumo or "AQUI",
            "itens": itens_formatados
        })
        
    return resultado

@router.put("/pedidos/{pedido_id}/status")
def atualizar_status(pedido_id: int, req: StatusUpdate, db: Session = Depends(get_db)):
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    
    pedido.status = req.status
    db.commit()
    return {"mensagem": "Status atualizado com sucesso"}