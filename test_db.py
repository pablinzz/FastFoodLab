from sqlalchemy import create_engine

engine = create_engine(
    "postgresql+psycopg://postgres:14108993@localhost:5432/postgres"
)

with engine.connect() as conn:
    print("Conectado com sucesso!")