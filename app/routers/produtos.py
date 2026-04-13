from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.database import get_db
from app.models import Produto

router = APIRouter(prefix="/produtos", tags=["Produtos"])

# Atualizamos o modelo que o FastAPI espera receber do Frontend
class ProdutoCreate(BaseModel):
    nome: str
    preco: float
    categoria: Optional[str] = None
    imagem_url: Optional[str] = None
    ingredientes_disponiveis: Optional[List[Dict[str, Any]]] = None # Recebe a lista de extras

@router.get("")
def listar_produtos(db: Session = Depends(get_db)):
    produtos = db.query(Produto).filter(Produto.ativo == True).all()
    # Adicionamos os ingredientes no retorno para o Totem poder ler
    return [
        {
            "id": p.id, 
            "nome": p.nome, 
            "preco": p.preco, 
            "categoria": p.categoria, 
            "imagem_url": p.imagem_url,
            "ingredientes_disponiveis": p.ingredientes_disponiveis
        } for p in produtos
    ]

@router.post("")
def criar_produto(produto: ProdutoCreate, db: Session = Depends(get_db)):
    novo_produto = Produto(
        nome=produto.nome, 
        preco=produto.preco, 
        categoria=produto.categoria, 
        imagem_url=produto.imagem_url,
        ingredientes_disponiveis=produto.ingredientes_disponiveis # Grava na base de dados
    )
    db.add(novo_produto)
    db.commit()
    db.refresh(novo_produto)
    return novo_produto