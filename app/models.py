from sqlalchemy import Column, Integer, String, Float, Boolean, JSON
from app.database import Base

class Produto(Base):
    __tablename__ = "produtos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True)
    preco = Column(Float)
    categoria = Column(String, nullable=True, default="Geral")
    ativo = Column(Boolean, default=True)
    imagem_url = Column(String, nullable=True)
    ingredientes_disponiveis = Column(JSON, nullable=True, default=[])

class Pedido(Base):
    __tablename__ = "pedidos"
    id = Column(Integer, primary_key=True, index=True)
    total = Column(Float)
    status = Column(String, default="CRIADO")
    nome_cliente = Column(String, nullable=True)
    tipo_consumo = Column(String, nullable=True)

class ItemPedido(Base):
    __tablename__ = "itens_pedido"
    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer)
    produto_id = Column(Integer)
    quantidade = Column(Integer, default=1)
    preco_unitario = Column(Float)
    observacoes = Column(String, nullable=True)

class Estoque(Base):
    __tablename__ = "estoque"
    id = Column(Integer, primary_key=True, index=True)
    item_nome = Column(String, index=True)
    quantidade_geral = Column(Float, default=0.0)
    quantidade_diaria = Column(Float, default=0.0)
    unidade = Column(String, default="un")

# ADICIONE ISTO NO FINAL DO ARQUIVO:
class EstoqueHistorico(Base):
    __tablename__ = "estoque_historico"
    id = Column(Integer, primary_key=True, index=True)
    data = Column(String, index=True) # Guarda o dia (YYYY-MM-DD)
    item_id = Column(Integer)
    quantidade_geral = Column(Float, default=0.0)
    quantidade_diaria = Column(Float, default=0.0)