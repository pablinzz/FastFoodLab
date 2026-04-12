from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import Produto

router = APIRouter(prefix="/produtos", tags=["Produtos"])

class ProdutoCreate(BaseModel):
    nome: str
    preco: float
    categoria: str | None = None

@router.get("/")
def listar_produtos(db: Session = Depends(get_db)):
    produtos = db.query(Produto).filter(Produto.ativo == True).all()
    # Retorna uma lista limpa em formato JSON para a Vercel ler
    return [{"id": p.id, "nome": p.nome, "preco": p.preco, "categoria": p.categoria} for p in produtos]

@router.post("/")
def criar_produto(produto: ProdutoCreate, db: Session = Depends(get_db)):
    novo_produto = Produto(nome=produto.nome, preco=produto.preco, categoria=produto.categoria)
    db.add(novo_produto)
    db.commit()
    db.refresh(novo_produto)
    return novo_produto