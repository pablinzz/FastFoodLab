const API_URL = "https://fastfoodlab.onrender.com";

let todosProdutos = []; // Memória global
let carrinho = [];
let total = 0;
let produtoSelecionado = null;
let extrasEscolhidos = [];
let pedidoAtualId = null;
let intervaloChecagem = null;

// --- 1. CARREGAR PRODUTOS (COM CORREÇÃO DE ROTA) ---
// A barra final (/produtos/) impede o bloqueio CORS do navegador
fetch(`${API_URL}/produtos/`)
    .then(res => res.json())
    .then(produtos => {
        todosProdutos = produtos;
        renderizarLayoutIfood(produtos);
    })
    .catch(err => {
        console.error("Erro ao carregar produtos:", err);
        document.getElementById("product-feed").innerHTML = "<h2 style='color:red;'>Erro ao ligar ao servidor.</h2>";
    });

// --- 2. DESENHAR LAYOUT IFOOD ---
function renderizarLayoutIfood(produtos) {
    const nav = document.getElementById("category-nav");
    const feed = document.getElementById("product-feed");
    nav.innerHTML = ""; feed.innerHTML = "";

    // Agrupar produtos pelas suas categorias
    const categoriasUnicas = [...new Set(produtos.map(p => p.categoria || "Outros"))];

    categoriasUnicas.forEach(cat => {
        // Link na barra lateral
        nav.innerHTML += `<a href="#cat-${cat}" class="cat-link">${cat}</a>`;

        // Secção de produtos no centro
        let sectionHtml = `
            <section id="cat-${cat}" class="categoria-section">
                <h2>${cat}</h2>
                <div class="grid-ifood">
        `;

        const produtosDaCategoria = produtos.filter(p => (p.categoria || "Outros") === cat);
        
        produtosDaCategoria.forEach(prod => {
            const imgHtml = prod.imagem_url 
                ? `<div class="card-img-wrapper"><img src="${prod.imagem_url}" alt="${prod.nome}"></div>` 
                : '';

            // Ao clicar no cartão, abre o modal enviando o ID do produto
            sectionHtml += `
                <div class="card-ifood" onclick="abrirModalPersonalizar(${prod.id})">
                    <div class="card-info">
                        <h3>${prod.nome}</h3>
                        <p class="desc">Delicioso, preparado na hora para si.</p>
                        <p class="preco">R$ ${prod.preco.toFixed(2)}</p>
                    </div>
                    ${imgHtml}
                </div>
            `;
        });

        sectionHtml += `</div></section>`;
        feed.innerHTML += sectionHtml;
    });
}

// --- 3. MODAL DE PERSONALIZAÇÃO ---
function abrirModalPersonalizar(produtoId) {
    // Procura o produto correto na memória
    produtoSelecionado = todosProdutos.find(p => p.id === produtoId);
    extrasEscolhidos = []; 

    document.getElementById("nome-produto-modal").innerText = produtoSelecionado.nome;
    document.getElementById("preco-base-modal").innerText = `R$ ${produtoSelecionado.preco.toFixed(2)}`;
    
    if(produtoSelecionado.imagem_url) {
        document.getElementById("img-produto-modal").src = produtoSelecionado.imagem_url;
        document.getElementById("img-produto-modal").style.display = "block";
    } else {
        document.getElementById("img-produto-modal").style.display = "none";
    }

    atualizarPrecoModal();

    const listaExtras = document.getElementById("lista-extras");
    listaExtras.innerHTML = "";

    if (produtoSelecionado.ingredientes_disponiveis && produtoSelecionado.ingredientes_disponiveis.length > 0) {
        produtoSelecionado.ingredientes_disponiveis.forEach((extra, index) => {
            listaExtras.innerHTML += `
                <div class="extra-item">
                    <input type="checkbox" id="extra-${index}" onchange="toggleExtra('${extra.nome}', ${extra.preco}, this.checked)">
                    <label for="extra-${index}" class="extra-info">
                        <span>+ ${extra.nome}</span>
                        <span style="color:#4CAF50">R$ ${extra.preco.toFixed(2)}</span>
                    </label>
                </div>
            `;
        });
    } else {
        listaExtras.innerHTML = "<p style='color: #888; padding: 15px;'>Nenhum adicional disponível.</p>";
    }

    document.getElementById("modal-personalizar").style.display = "flex";
}

function fecharModalPersonalizar() {
    document.getElementById("modal-personalizar").style.display = "none";
}

function toggleExtra(nome, preco, estaMarcado) {
    if (estaMarcado) {
        extrasEscolhidos.push({ nome, preco });
    } else {
        extrasEscolhidos = extrasEscolhidos.filter(e => e.nome !== nome);
    }
    atualizarPrecoModal();
}

function atualizarPrecoModal() {
    let precoFinal = produtoSelecionado.preco;
    extrasEscolhidos.forEach(e => precoFinal += e.preco);
    document.getElementById("preco-total-modal").innerText = `R$ ${precoFinal.toFixed(2)}`;
}

function confirmarPersonalizacao() {
    let precoFinal = produtoSelecionado.preco;
    let observacoes = extrasEscolhidos.map(e => `+ ${e.nome}`).join(", ");
    extrasEscolhidos.forEach(e => precoFinal += e.preco);

    carrinho.push({
        id: produtoSelecionado.id,
        nome: produtoSelecionado.nome,
        preco: precoFinal,
        observacoes: observacoes,
        uniqueId: Date.now() + Math.random()
    });

    total += precoFinal;
    atualizarCarrinho();
    fecharModalPersonalizar();
}

// --- 4. CARRINHO E PAGAMENTO ---
function atualizarCarrinho() {
    const lista = document.getElementById("itens-carrinho");
    lista.innerHTML = "";

    carrinho.forEach(item => {
        const obs = item.observacoes ? `<span class="item-carrinho-obs">${item.observacoes}</span>` : '';
        lista.innerHTML += `
            <li class="item-carrinho">
                <div class="item-carrinho-info">
                    <div class="item-carrinho-nome">${item.nome}</div>
                    <div style="color: #4CAF50; font-weight: bold;">R$ ${item.preco.toFixed(2)}</div>
                    ${obs}
                </div>
                <button onclick="removerDoCarrinho(${item.uniqueId}, ${item.preco})" class="btn-remover">X</button>
            </li>
        `;
    });
    document.getElementById("total").innerText = total.toFixed(2);
}

function removerDoCarrinho(uniqueId, preco) {
    carrinho = carrinho.filter(i => i.uniqueId !== uniqueId);
    total = Math.max(0, total - preco);
    atualizarCarrinho();
}

function abrirModalPagamento() {
    if(carrinho.length === 0) return alert("Carrinho vazio!");
    document.getElementById("modal-escolha-pagamento").style.display = "flex";
}

function processarPagamento(metodo) {
    document.getElementById("modal-escolha-pagamento").style.display = "none";
    
    // Mostra Carregando
    document.getElementById("modal-pix").style.display = "flex";
    document.getElementById("modal-pix").innerHTML = `<div class="modal-content" style="padding:40px; text-align:center;"><h2 style="color:white;">Aguarde...</h2></div>`;

    fetch(`${API_URL}/pedido/finalizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itens: carrinho, metodo_pagamento: metodo })
    })
    .then(res => res.json())
    .then(data => {
        pedidoAtualId = data.pedido_id;

        if (data.acao === "MOSTRAR_QR_CODE") {
            document.getElementById("modal-pix").innerHTML = `
                <div class="modal-content" style="padding: 40px; text-align: center;">
                    <h2 style="color: #4CAF50; font-size: 2rem;">Pague com PIX</h2>
                    <img src="data:image/jpeg;base64,${data.qr_code_base64}" style="width: 250px; height: 250px; margin: 20px auto; background: white; padding: 10px; border-radius: 10px;">
                    <p style="color: #FF5E00; font-weight: bold; animation: piscar 1.5s infinite;">⏳ Aguardando pagamento...</p>
                    <button onclick="location.reload()" class="btn-cancelar" style="margin-top: 20px;">Cancelar</button>
                </div>
            `;
            intervaloChecagem = setInterval(checarStatusPagamento, 3000);
        } else if (data.acao === "AGUARDANDO_MAQUININHA") {
            document.getElementById("modal-pix").innerHTML = `
                <div class="modal-content" style="padding: 40px; text-align: center;">
                    <h2 style="color: #2196F3;">Siga as instruções na Maquininha</h2>
                    <p>Aproxime ou insira o seu cartão ao lado.</p>
                    <button onclick="location.reload()" class="btn-cancelar" style="margin-top: 20px;">Cancelar</button>
                </div>
            `;
        } else {
            document.getElementById("modal-pix").innerHTML = `
                <div class="modal-content" style="padding: 40px; text-align: center;">
                    <h2 style="color: #8BC34A;">Pedido #${pedidoAtualId} Anotado!</h2>
                    <p style="font-size:1.5rem; margin-top:20px;">Vá ao caixa para pagar.</p>
                </div>
            `;
            setTimeout(() => location.reload(), 5000);
        }
    })
    .catch(err => { alert("Erro de rede."); location.reload(); });
}

function checarStatusPagamento() {
    fetch(`${API_URL}/pedido/${pedidoAtualId}/status`)
    .then(res => res.json())
    .then(data => {
        if (data.status === "PAGO") {
            clearInterval(intervaloChecagem);
            document.getElementById("modal-pix").innerHTML = `
                <div class="modal-content" style="padding: 40px; text-align: center;">
                    <h2 style="color: #4CAF50; font-size: 3rem;">✅ Aprovado!</h2>
                    <p style="font-size:1.5rem;">O seu pedido já está a ser preparado.</p>
                </div>
            `;
            setTimeout(() => location.reload(), 4000);
        }
    });
}