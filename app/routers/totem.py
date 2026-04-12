from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter(
    prefix="/totem",
    tags=["Totem"]
)

@router.get("/", response_class=HTMLResponse)
def tela_totem():
    with open("app/templates/cliente/totem.html", "r", encoding="utf-8") as f:
        return f.read()