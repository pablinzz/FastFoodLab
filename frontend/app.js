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
let intervaloChecagem = null;

function abrirModalPagamento() {
    if (carrinho.length === 0) {
        alert("Adicione itens ao carrinho primeiro!");
        return;
    }
    document.getElementById("modal-escolha-pagamento").style.display = "flex";
}

function fecharModalPagamento() {
    document.getElementById("modal-escolha-pagamento").style.display = "none";
}

function processarPagamento(metodo) {
    fecharModalPagamento();
    
    // Mostra o modal de status carregando...
    const modalStatus = document.getElementById("modal-status-generico");
    document.getElementById("status-titulo").innerText = "Conectando ao sistema...";
    document.getElementById("status-mensagem").innerText = "Aguarde um instante.";
    document.getElementById("status-animacao").style.display = "block";
    modalStatus.style.display = "flex";

    fetch(`${API_URL}/pedido/finalizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itens: carrinho, metodo_pagamento: metodo })
    })
    .then(res => res.json())
    .then(data => {
        pedidoAtualId = data.pedido_id;

        if (data.acao === "MOSTRAR_QR_CODE") {
            modalStatus.style.display = "none"; // Esconde o genérico
            document.getElementById("qr-code-img").src = "data:image/jpeg;base64," + data.qr_code_base64;
            document.getElementById("modal-pix").style.display = "flex"; // Mostra o do PIX
            intervaloChecagem = setInterval(checarPagamentoAprovado, 3000);
        } 
        else if (data.acao === "AGUARDANDO_MAQUININHA") {
            document.getElementById("status-titulo").innerText = "💳 Insira o Cartão";
            document.getElementById("status-mensagem").innerText = "Siga as instruções na maquininha ao lado do tablet para digitar sua senha.";
            document.getElementById("status-titulo").style.color = "#2196F3";
            intervaloChecagem = setInterval(checarPagamentoAprovado, 3000); // Fica checando se a maquininha aprovou
        }
        else if (data.acao === "IR_PARA_CAIXA") {
            document.getElementById("status-titulo").innerText = "💵 Pedido Anotado!";
            document.getElementById("status-mensagem").innerText = "Dirija-se ao caixa com o número do seu pedido para realizar o pagamento e retirar.";
            document.getElementById("status-titulo").style.color = "#8BC34A";
            document.getElementById("status-animacao").style.display = "none"; // Para de piscar
            
            // Após 6 segundos, reseta o totem para o próximo cliente
            setTimeout(() => {
                modalStatus.style.display = "none";
                resetarTotem();
            }, 6000);
        }
    })
    .catch(err => {
        alert("Erro de conexão. Tente novamente.");
        modalStatus.style.display = "none";
    });
}

function checarPagamentoAprovado() {
    fetch(`${API_URL}/pedido/${pedidoAtualId}/status`)
    .then(res => res.json())
    .then(data => {
        if (data.status === "PAGO") {
            clearInterval(intervaloChecagem);
            document.getElementById("modal-pix").style.display = "none";
            document.getElementById("modal-status-generico").style.display = "none";
            
            alert("🎉 Pagamento Aprovado! Seu pedido já está na tela da cozinha.");
            resetarTotem();
        }
    });
}

function cancelarPedidoAtual() {
    clearInterval(intervaloChecagem);
    document.getElementById("modal-pix").style.display = "none";
    document.getElementById("modal-status-generico").style.display = "none";
    // Opcional no futuro: Enviar rota para a API cancelar o pagamento na maquininha
}

function cancelarPix() {
    cancelarPedidoAtual();
}