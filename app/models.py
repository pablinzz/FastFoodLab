from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


# -------------------------
# PRODUTO
# -------------------------
class Produto(Base):
    __tablename__ = "produtos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    preco = Column(Float, nullable=False)
    categoria = Column(String(50), nullable=False)
    ativo = Column(Boolean, default=True)
    imagem_url = Column(String, nullable=True)

    itens_pedido = relationship("ItemPedido", back_populates="produto")


# -------------------------
# PEDIDO
# -------------------------
class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(String(30), default="CRIADO")
    total = Column(Float, default=0.0)
    criado_em = Column(DateTime, default=datetime.utcnow)

    itens = relationship(
        "ItemPedido",
        back_populates="pedido",
        cascade="all, delete-orphan"
    )


# -------------------------
# ITEM DO PEDIDO
# -------------------------
class ItemPedido(Base):
    __tablename__ = "itens_pedido"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), nullable=False)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=False)

    quantidade = Column(Integer, nullable=False)
    preco_unitario = Column(Float, nullable=False)

    pedido = relationship("Pedido", back_populates="itens")
    produto = relationship("Produto", back_populates="itens_pedido")
