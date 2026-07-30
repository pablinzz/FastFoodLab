from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import Estoque

router = APIRouter(prefix="/estoque", tags=["Estoque"])

class EstoqueCreate(BaseModel):
    item_nome: str
    quantidade_geral: float
    quantidade_diaria: float
    unidade: str

class EstoqueUpdate(BaseModel):
    quantidade_geral: Optional[float] = None
    quantidade_diaria: Optional[float] = None

@router.get("/")
def listar_estoque(db: Session = Depends(get_db)):
    return db.query(Estoque).order_by(Estoque.item_nome.asc()).all()

@router.post("/")
def adicionar_item_estoque(item: EstoqueCreate, db: Session = Depends(get_db)):
    novo_item = Estoque(**item.dict())
    db.add(novo_item)
    db.commit()
    db.refresh(novo_item)
    return novo_item

@router.put("/{item_id}")
def atualizar_quantidades(item_id: int, atualizacao: EstoqueUpdate, db: Session = Depends(get_db)):
    item = db.query(Estoque).filter(Estoque.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    if atualizacao.quantidade_geral is not None:
        item.quantidade_geral = atualizacao.quantidade_geral
    if atualizacao.quantidade_diaria is not None:
        item.quantidade_diaria = atualizacao.quantidade_diaria
        
    db.commit()
    return item

@router.delete("/{item_id}")
def deletar_item_estoque(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Estoque).filter(Estoque.id == item_id).first()
    if item:
        db.delete(item)
        db.commit()
    return {"mensagem": "Apagado com sucesso"}