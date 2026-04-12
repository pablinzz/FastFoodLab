from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter(prefix="/admin")

@router.get("/produtos", response_class=HTMLResponse)
def tela_admin_produtos():
    with open("app/templates/cliente/admin_produtos.html", encoding="utf-8") as f:
        return f.read()