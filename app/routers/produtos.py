from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.database import get_db
from app.models import Produto

router = APIRouter(prefix="/produtos", tags=["Produtos"])

class ProdutoCreate(BaseModel):
    nome: str
    preco: float
    categoria: Optional[str] = "Geral"
    imagem_url: Optional[str] = None
    ingredientes_disponiveis: Optional[List[Dict[str, Any]]] = []

@router.get("")
@router.get("/")
def listar_produtos(db: Session = Depends(get_db)):
    produtos = db.query(Produto).filter(Produto.ativo == True).all()
    return produtos

@router.post("")
@router.post("/")
def criar_produto(produto: ProdutoCreate, db: Session = Depends(get_db)):
    novo_produto = Produto(
        nome=produto.nome, 
        preco=produto.preco, 
        categoria=produto.categoria, 
        imagem_url=produto.imagem_url,
        ingredientes_disponiveis=produto.ingredientes_disponiveis
    )
    db.add(novo_produto)
    db.commit()
    db.refresh(novo_produto)
    return novo_produto

# --- ESTA ERA A ROTA QUE FALTAVA PARA A EDIÇÃO FUNCIONAR ---
@router.put("/{produto_id}")
def atualizar_produto(produto_id: int, produto: ProdutoCreate, db: Session = Depends(get_db)):
    prod_db = db.query(Produto).filter(Produto.id == produto_id).first()
    if not prod_db:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    prod_db.nome = produto.nome
    prod_db.preco = produto.preco
    prod_db.categoria = produto.categoria
    prod_db.imagem_url = produto.imagem_url
    prod_db.ingredientes_disponiveis = produto.ingredientes_disponiveis
    
    db.commit()
    db.refresh(prod_db)
    return prod_db

@router.delete("/{produto_id}")
def deletar_produto(produto_id: int, db: Session = Depends(get_db)):
    produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    # "Soft Delete": Fica oculto para não apagar o histórico de vendas
    produto.ativo = False
    db.commit()
    return {"mensagem": "Produto removido com sucesso"}