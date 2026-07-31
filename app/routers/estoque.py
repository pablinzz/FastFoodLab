from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
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
    
    # Salva o historico de hoje automaticamente
    hoje = datetime.now().strftime("%Y-%m-%d")
    hist = EstoqueHistorico(data=hoje, item_id=novo_item.id, quantidade_geral=item.quantidade_geral, quantidade_diaria=item.quantidade_diaria)
    db.add(hist)
    db.commit()
    return novo_item

@router.get("/dia/{data_str}")
def listar_estoque_dia(data_str: str, db: Session = Depends(get_db)):
    itens = db.query(Estoque).order_by(Estoque.item_nome.asc()).all()
    
    # Calcula qual foi o dia anterior para comparar consumos
    data_obj = datetime.strptime(data_str, "%Y-%m-%d")
    ontem_str = (data_obj - timedelta(days=1)).strftime("%Y-%m-%d")

    resultado = []
    for item in itens:
        reg_hoje = db.query(EstoqueHistorico).filter(EstoqueHistorico.data == data_str, EstoqueHistorico.item_id == item.id).first()
        reg_ontem = db.query(EstoqueHistorico).filter(EstoqueHistorico.data == ontem_str, EstoqueHistorico.item_id == item.id).first()
        
        q_geral = reg_hoje.quantidade_geral if reg_hoje else 0
        q_diaria = reg_hoje.quantidade_diaria if reg_hoje else 0

        # Se houver registro anterior, calcula a diferença (Consumo)
        cons_geral = (reg_ontem.quantidade_geral - q_geral) if reg_ontem else 0
        cons_diario = (reg_ontem.quantidade_diaria - q_diaria) if reg_ontem else 0

        resultado.append({
            "id": item.id,
            "item_nome": item.item_nome,
            "unidade": item.unidade,
            "quantidade_geral": q_geral,
            "quantidade_diaria": q_diaria,
            "consumo_geral": round(cons_geral, 2),
            "consumo_diario": round(cons_diario, 2),
            "status": "REGISTRADO" if reg_hoje else "PENDENTE"
        })
    return resultado

@router.put("/dia/{data_str}/{item_id}")
def atualizar_estoque_dia(data_str: str, item_id: int, atualizacao: EstoqueUpdate, db: Session = Depends(get_db)):
    # Busca se já existe um card deste dia para este produto
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
        # Verifica se já tem algo hoje. Se não tiver, copia de ontem
        existe_hoje = db.query(EstoqueHistorico).filter(EstoqueHistorico.data == data_str, EstoqueHistorico.item_id == reg.item_id).first()
        if not existe_hoje:
            novo_hist = EstoqueHistorico(data=data_str, item_id=reg.item_id, quantidade_geral=reg.quantidade_geral, quantidade_diaria=reg.quantidade_diaria)
            db.add(novo_hist)
            
    db.commit()
    return {"mensagem": "Inventário de ontem copiado para hoje."}

@router.delete("/{item_id}")
def deletar_item_estoque(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Estoque).filter(Estoque.id == item_id).first()
    if item:
        db.delete(item)
        # Apaga o historico desse item tambem
        db.query(EstoqueHistorico).filter(EstoqueHistorico.item_id == item_id).delete()
        db.commit()
    return {"mensagem": "Item apagado de todo o sistema"}