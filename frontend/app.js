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

// CARREGAR PRODUTOS
fetch(`${API_URL}/produtos`)
    .then(res => res.json())
    .then(produtos => {
        const lista = document.getElementById("lista-produtos");
        lista.innerHTML = ""; // Limpa a lista antes de desenhar

        produtos.forEach(prod => {
            const card = document.createElement("div");
            card.className = "card-produto";

            const imgHtml = prod.imagem_url 
                ? `<img src="${prod.imagem_url}" alt="${prod.nome}" style="width:100%; height:150px; object-fit:cover; border-radius:8px; margin-bottom: 10px;">` 
                : '';

            card.innerHTML = `
                ${imgHtml}
                <h3>${prod.nome}</h3>
                <p>R$ ${prod.preco.toFixed(2)}</p>
                <button onclick="adicionarCarrinho(${prod.id}, '${prod.nome}', ${prod.preco})">
                    Adicionar
                </button>
            `;

            lista.appendChild(card);
        });
    })
    .catch(err => console.error("Erro ao carregar os produtos do Supabase:", err));

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

let pedidoAtualId = null;
let intervaloPix = null;

function finalizarPedido() {
    if (carrinho.length === 0) return;

    document.querySelector('.btn-finalizar').innerText = "GERANDO PIX...";

    fetch(`${API_URL}/pedido/finalizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itens: carrinho })
    })
    .then(res => res.json())
    .then(data => {
        document.querySelector('.btn-finalizar').innerText = "FINALIZAR E PAGAR";
        
        if (data.qr_code_base64) {
            // Mostra o QR Code na tela
            document.getElementById("qr-code-img").src = "data:image/jpeg;base64," + data.qr_code_base64;
            document.getElementById("modal-pix").style.display = "flex";
            
            pedidoAtualId = data.pedido_id;
            
            // Fica checando de 3 em 3 segundos se o Webhook do MP avisou que o Pix caiu
            intervaloPix = setInterval(checarStatusPix, 3000);
        } else {
            alert("Erro ao gerar PIX.");
        }
    });
}

function checarStatusPix() {
    fetch(`${API_URL}/pedido/${pedidoAtualId}/status`)
    .then(res => res.json())
    .then(data => {
        if (data.status === "PAGO") {
            clearInterval(intervaloPix);
            document.getElementById("modal-pix").style.display = "none";
            
            // Tela de Sucesso
            alert("🎉 Pagamento Aprovado! Seu pedido já está na tela da cozinha.");
            resetarTotem();
        }
    });
}

function cancelarPix() {
    clearInterval(intervaloPix);
    document.getElementById("modal-pix").style.display = "none";
}
}