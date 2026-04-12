const API_URL = "https://fastfoodlab.onrender.com";

let carrinho = [];
let total = 0;
let tempoInatividade;

// --- SISTEMA DE INATIVIDADE (ABANDONO DE TOTEM) ---
function resetarTotem() {
    carrinho = [];
    total = 0;
    atualizarCarrinho();
    window.scrollTo(0, 0); 
}

function reiniciarTemporizador() {
    clearTimeout(tempoInatividade);
    tempoInatividade = setTimeout(resetarTotem, 60000);
}

// Qualquer toque no ecrã reinicia o temporizador
document.body.addEventListener('click', reiniciarTemporizador);
document.body.addEventListener('touchstart', reiniciarTemporizador);
reiniciarTemporizador();
// --------------------------------------------------

fetch(`${API_URL}/produtos`)

// ADICIONAR AO CARRINHO
function adicionarCarrinho(id, nome, preco) {
    const itemUnicoId = Date.now() + Math.random(); 
    carrinho.push({ id, nome, preco, uniqueId: itemUnicoId });
    total += preco;
    atualizarCarrinho();
}

// NOVO: REMOVER DO CARRINHO
function removerDoCarrinho(uniqueId, preco) {
    carrinho = carrinho.filter(item => item.uniqueId !== uniqueId);
    total -= preco;
    // Evitar bugs de arredondamento
    if (total < 0) total = 0; 
    atualizarCarrinho();
}

// ATUALIZAR CARRINHO
function atualizarCarrinho() {
    const lista = document.getElementById("itens-carrinho");
    lista.innerHTML = "";

    carrinho.forEach(item => {
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.marginBottom = "15px";
        li.style.alignItems = "center";
        
        li.innerHTML = `
            <span>${item.nome} - R$ ${item.preco.toFixed(2)}</span>
            <button onclick="removerDoCarrinho(${item.uniqueId}, ${item.preco})" style="background: #e53935; color: white; border: none; padding: 5px 10px; border-radius: 50%; font-weight: bold; cursor: pointer;">X</button>
        `;
        lista.appendChild(li);
    });

    document.getElementById("total").textContent = total.toFixed(2);
}

// FINALIZAR PEDIDO
function finalizarPedido() {
    if (carrinho.length === 0) {
        alert("Adicione itens ao carrinho!");
        return;
    }

    fetch(`${API_URL}/pedido/finalizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itens: carrinho })
    })
    .then(res => res.json())
    .then(data => {
        if (data.checkout_url) {
            window.location.href = data.checkout_url; 
        } else {
            alert("Erro ao gerar pagamento.");
        }
    });
}