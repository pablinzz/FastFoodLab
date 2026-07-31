from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import Estoque, EstoqueHistorico
from datetime import datetime, timedelta

router = APIRouter(prefix="/estoque", tags=["Estoque"])

class EstoqueCreate(BaseModel):
    item_nome: str
    quantidade_geral: float
    quantidade_diaria: float
    unidade: str

class EstoqueUpdate(BaseModel):
    quantidade_geral: float
    quantidade_diaria: float

@router.post("/")
def adicionar_item_estoque(item: EstoqueCreate, db: Session = Depends(get_db)):
    novo_item = Estoque(**item.dict())
    db.add(novo_item)
    db.commit()
    db.refresh(novo_item)
    
    hoje = datetime.now().strftime("%Y-%m-%d")
    hist = EstoqueHistorico(data=hoje, item_id=novo_item.id, quantidade_geral=item.quantidade_geral, quantidade_diaria=item.quantidade_diaria)
    db.add(hist)
    db.commit()
    return novo_item

@router.get("/dia/{data_str}")
def listar_estoque_dia(data_str: str, db: Session = Depends(get_db)):
    itens = db.query(Estoque).order_by(Estoque.item_nome.asc()).all()
    
    resultado = []
    for item in itens:
        reg_hoje = db.query(EstoqueHistorico).filter(EstoqueHistorico.data == data_str, EstoqueHistorico.item_id == item.id).first()
        
        q_inicial = reg_hoje.quantidade_geral if reg_hoje else 0.0
        q_final = reg_hoje.quantidade_diaria if reg_hoje else 0.0

        # MÁGICA: O Consumo é o que havia no Início MENOS o que sobrou no Final do mesmo dia!
        cons_diario = q_inicial - q_final

        resultado.append({
            "id": item.id,
            "item_nome": item.item_nome,
            "unidade": item.unidade,
            "quantidade_geral": q_inicial,
            "quantidade_diaria": q_final,
            "consumo_geral": 0, 
            "consumo_diario": round(cons_diario, 2),
            "status": "REGISTRADO" if reg_hoje else "PENDENTE"
        })
    return resultado

@router.put("/dia/{data_str}/{item_id}")
def atualizar_estoque_dia(data_str: str, item_id: int, atualizacao: EstoqueUpdate, db: Session = Depends(get_db)):
    hist = db.query(EstoqueHistorico).filter(EstoqueHistorico.data == data_str, EstoqueHistorico.item_id == item_id).first()
    
    if hist:
        hist.quantidade_geral = atualizacao.quantidade_geral
        hist.quantidade_diaria = atualizacao.quantidade_diaria
    else:
        hist = EstoqueHistorico(data=data_str, item_id=item_id, quantidade_geral=atualizacao.quantidade_geral, quantidade_diaria=atualizacao.quantidade_diaria)
        db.add(hist)
    db.commit()
    return {"mensagem": "Estoque do dia atualizado"}

@router.post("/copiar-ontem/{data_str}")
def copiar_estoque_de_ontem(data_str: str, db: Session = Depends(get_db)):
    data_obj = datetime.strptime(data_str, "%Y-%m-%d")
    ontem_str = (data_obj - timedelta(days=1)).strftime("%Y-%m-%d")
    
    registros_ontem = db.query(EstoqueHistorico).filter(EstoqueHistorico.data == ontem_str).all()
    if not registros_ontem:
        raise HTTPException(status_code=400, detail="Não existem registros no dia anterior para copiar.")
        
    for reg in registros_ontem:
        existe_hoje = db.query(EstoqueHistorico).filter(EstoqueHistorico.data == data_str, EstoqueHistorico.item_id == reg.item_id).first()
        if not existe_hoje:
            # LÓGICA DE OURO: O "Armazém Inicial" de hoje recebe o "Armazém Final" de ontem
            # E o "Armazém Final" de hoje começa igual, para que o consumo seja 0 até ser atualizado
            novo_hist = EstoqueHistorico(
                data=data_str, 
                item_id=reg.item_id, 
                quantidade_geral=reg.quantidade_diaria, # Inicial = Final de ontem
                quantidade_diaria=reg.quantidade_diaria # Final começa = Inicial
            )
            db.add(novo_hist)
            
    db.commit()
    return {"mensagem": "Final de ontem transformado no Inicial de hoje."}

@router.delete("/{item_id}")
def deletar_item_estoque(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Estoque).filter(Estoque.id == item_id).first()
    if item:
        db.delete(item)
        db.query(EstoqueHistorico).filter(EstoqueHistorico.item_id == item_id).delete()
        db.commit()
    return {"mensagem": "Item apagado de todo o sistema"}