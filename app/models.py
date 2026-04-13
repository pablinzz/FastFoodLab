from sqlalchemy import Column, Integer, String, Float, Boolean, JSON
from app.database import Base

class Produto(Base):
    __tablename__ = "produtos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True)
    preco = Column(Float)
    categoria = Column(String, nullable=True)
    ativo = Column(Boolean, default=True)
    imagem_url = Column(String, nullable=True)
    
    # NOVO CAMPO: Guarda a lista de ingredientes extras e preços
    ingredientes_disponiveis = Column(JSON, nullable=True)

class Pedido(Base):
    __tablename__ = "pedidos"
    id = Column(Integer, primary_key=True, index=True)
    total = Column(Float)
    status = Column(String, default="CRIADO")

class ItemPedido(Base):
    __tablename__ = "itens_pedido"
    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer)
    produto_id = Column(Integer)
    quantidade = Column(Integer)
    preco_unitario = Column(Float)
    
    # NOVO CAMPO FUTURO: Para a cozinha saber o que o cliente escolheu ("Sem cebola", etc)
    observacoes = Column(String, nullable=True)