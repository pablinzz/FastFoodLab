const API_URL = "https://fastfoodlab.onrender.com";

let todosProdutos = []; 
let carrinho = [];
let total = 0;
let produtoSelecionado = null;
let extrasEscolhidos = [];
let pedidoAtualId = null;
let intervaloChecagem = null;
let clienteNome = "";
let clienteConsumo = "";

// --- LÓGICA DA TELA DE BOAS-VINDAS ---
function iniciarAtendimento() {
    document.getElementById("splash-screen").style.display = "none";
    document.getElementById("modal-identificacao").style.display = "flex";
    setTimeout(() => document.getElementById("nome-cliente").focus(), 100);
}

function confirmarIdentificacao(tipoConsumo) {
    const nomeInput = document.getElementById("nome-cliente").value.trim();
    if (!nomeInput) {
        alert("Por favor, diga-nos o seu nome para o podermos chamar quando o pedido estiver pronto!");
        return;
    }
    clienteNome = nomeInput;
    clienteConsumo = tipoConsumo;
    document.getElementById("modal-identificacao").style.display = "none";
}

// --- FUNÇÃO CORRIGIDA DE CANCELAR NO TOTEM ---
function cancelarPedidoTotem() {
    if (carrinho.length === 0) {
        document.getElementById("splash-screen").style.display = "flex";
        clienteNome = "";
        clienteConsumo = "";
        document.getElementById("nome-cliente").value = ""; // LIMPA O TEXTO DO ECRÃ
        return;
    }
    
    if (confirm("Tem a certeza que deseja cancelar o pedido e esvaziar o carrinho?")) {
        carrinho = [];
        total = 0;
        clienteNome = "";
        clienteConsumo = "";
        document.getElementById("nome-cliente").value = ""; // LIMPA O TEXTO DO ECRÃ
        atualizarCarrinho();
        document.getElementById("splash-screen").style.display = "flex";
    }
}

// --- CARREGAR PRODUTOS ---
async function carregarProdutos() {
    try {
        const response = await fetch(`${API_URL}/produtos/`);
        const produtos = await response.json();
        todosProdutos = produtos;
        
        if(produtos.length === 0) {
            document.getElementById("product-feed").innerHTML = "<h2 style='color:#888; text-align:center; margin-top:50px;'>O cardápio está vazio. Cadastre os produtos no painel Admin.</h2>";
            return;
        }
        renderizarLayoutIfood(produtos);
    } catch (err) {
        console.error("Erro de conexão:", err);
        document.getElementById("product-feed").innerHTML = "<h2 style='color:red; text-align:center; margin-top:50px;'>Erro ao carregar o cardápio. Verifique o servidor.</h2>";
    }
}

carregarProdutos();

// --- DESENHAR LAYOUT IFOOD ---
function renderizarLayoutIfood(produtos) {
    const nav = document.getElementById("category-list");
    const feed = document.getElementById("product-feed");
    nav.innerHTML = ""; feed.innerHTML = "";

    const categoriasUnicas = [...new Set(produtos.map(p => p.categoria && p.categoria.trim() !== "" ? p.categoria : "Geral"))];

    categoriasUnicas.forEach((cat, index) => {
        nav.innerHTML += `<div class="cat-link" onclick="document.getElementById('cat-${index}').scrollIntoView({behavior: 'smooth'})">${cat}</div>`;
        let sectionHtml = `
            <section id="cat-${index}" class="categoria-section">
                <h2>${cat}</h2>
                <div class="grid-ifood">
        `;
        const produtosDaCategoria = produtos.filter(p => (p.categoria && p.categoria.trim() !== "" ? p.categoria : "Geral") === cat);
        
        produtosDaCategoria.forEach(prod => {
            const imgSrc = prod.imagem_url ? prod.imagem_url : 'https://via.placeholder.com/150/222222/555555?text=Sem+Foto';
            sectionHtml += `
                <div class="card-ifood" onclick="abrirModalPersonalizar(${prod.id})">
                    <div class="card-info">
                        <h3>${prod.nome}</h3>
                        <p class="desc">Preparado no capricho para matar a sua fome.</p>
                        <p class="preco">R$ ${prod.preco.toFixed(2)}</p>
                    </div>
                    <div class="card-img-wrapper">
                        <img src="${imgSrc}" alt="${prod.nome}">
                    </div>
                </div>
            `;
        });
        sectionHtml += `</div></section>`;
        feed.innerHTML += sectionHtml;
    });
}

// --- MODAL DE INGREDIENTES EXTRAS ---
function abrirModalPersonalizar(produtoId) {
    produtoSelecionado = todosProdutos.find(p => p.id === produtoId);
    extrasEscolhidos = []; 

    document.getElementById("nome-produto-modal").innerText = produtoSelecionado.nome;
    
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
                        <span style="color:var(--green)">+ R$ ${extra.preco.toFixed(2)}</span>
                    </label>
                </div>
            `;
        });
    } else {
        listaExtras.innerHTML = "<p style='color: #666; font-style: italic;'>Este produto não possui adicionais.</p>";
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
    let precoBaseComExtras = produtoSelecionado.preco;
    let observacoes = extrasEscolhidos.map(e => `+ ${e.nome}`).join(", ");
    extrasEscolhidos.forEach(e => precoBaseComExtras += e.preco);

    // Verifica se já existe um item idêntico no carrinho
    let itemExistente = carrinho.find(i => i.id === produtoSelecionado.id && i.observacoes === observacoes);

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({
            id: produtoSelecionado.id,
            nome: produtoSelecionado.nome,
            preco: precoBaseComExtras,
            observacoes: observacoes,
            quantidade: 1,
            uniqueId: Date.now() + Math.random()
        });
    }

    total += precoBaseComExtras;
    atualizarCarrinho();
    fecharModalPersonalizar();
    mostrarAnimacaoSucesso();
}

function mostrarAnimacaoSucesso() {
    const animacao = document.createElement("div");
    animacao.innerHTML = "✅<br><span style='font-size: 1.5rem'>Adicionado!</span>";
    animacao.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9); color: var(--green); padding: 40px;
        border-radius: 20px; font-size: 5rem; text-align: center;
        z-index: 9999; animation: popIn 0.3s ease-out; font-weight: bold; border: 2px solid var(--green);
    `;
    document.body.appendChild(animacao);

    const cartSidebar = document.querySelector('.cart-sidebar');
    cartSidebar.style.boxShadow = "0 0 30px var(--green)";
    
    setTimeout(() => {
        animacao.style.opacity = "0";
        animacao.style.transition = "0.3s";
        setTimeout(() => {
            animacao.remove();
            cartSidebar.style.boxShadow = "none";
        }, 300);
    }, 800);
}

// --- CARRINHO E QUANTIDADES ---
function atualizarCarrinho() {
    const lista = document.getElementById("itens-carrinho");
    lista.innerHTML = "";

    if (carrinho.length === 0) {
        lista.innerHTML = `<div style="color: #666; text-align: center; margin-top: 50px;">Seu carrinho está vazio</div>`;
    } else {
        carrinho.forEach(item => {
            const obs = item.observacoes ? `<span class="item-carrinho-obs">${item.observacoes}</span>` : '';
            const precoTotalItem = item.preco * item.quantidade;
            
            lista.innerHTML += `
                <li class="item-carrinho">
                    <div class="item-carrinho-info">
                        <div class="item-carrinho-nome">${item.nome}</div>
                        <div style="color: var(--green); font-weight: bold; margin-top: 5px;">R$ ${precoTotalItem.toFixed(2)}</div>
                        ${obs}
                    </div>
                    <div class="qtd-controles" style="display: flex; align-items: center; background: #333; border-radius: 20px; padding: 5px;">
                        <button style="background: transparent; color: white; border: none; font-size: 1.5rem; width: 30px; cursor: pointer;" onclick="alterarQuantidade(${item.uniqueId}, -1)">-</button>
                        <span style="font-weight: bold; margin: 0 10px; font-size: 1.2rem;">${item.quantidade}</span>
                        <button style="background: transparent; color: white; border: none; font-size: 1.5rem; width: 30px; cursor: pointer;" onclick="alterarQuantidade(${item.uniqueId}, 1)">+</button>
                    </div>
                </li>
            `;
        });
    }
    document.getElementById("total").innerText = total.toFixed(2);
}

function alterarQuantidade(uniqueId, delta) {
    let item = carrinho.find(i => i.uniqueId === uniqueId);
    if (!item) return;

    if (item.quantidade === 1 && delta === -1) {
        removerDoCarrinho(uniqueId);
        return;
    }

    item.quantidade += delta;
    total += (item.preco * delta);
    atualizarCarrinho();
}

function removerDoCarrinho(uniqueId) {
    let item = carrinho.find(i => i.uniqueId === uniqueId);
    if(item) {
        total = Math.max(0, total - (item.preco * item.quantidade));
        carrinho = carrinho.filter(i => i.uniqueId !== uniqueId);
        atualizarCarrinho();
    }
}

// --- PAGAMENTO ---
function abrirModalPagamento() {
    if(carrinho.length === 0) return alert("Seu carrinho está vazio!");
    document.getElementById("modal-escolha-pagamento").style.display = "flex";
}

function processarPagamento(metodo) {
    document.getElementById("modal-escolha-pagamento").style.display = "none";
    
    document.getElementById("modal-pix").style.display = "flex";
    document.getElementById("modal-pix").innerHTML = `<div class="modal-content" style="padding:40px; text-align:center;"><h2 style="color:var(--yellow);">Conectando ao sistema...</h2></div>`;

    fetch(`${API_URL}/pedido/finalizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            itens: carrinho, 
            metodo_pagamento: metodo,
            nome_cliente: clienteNome,
            tipo_consumo: clienteConsumo
        })
    })
    .then(res => res.json())
    .then(data => {
        pedidoAtualId = data.pedido_id;

        if (data.acao === "MOSTRAR_QR_CODE") {
            document.getElementById("modal-pix").innerHTML = `
                <div class="modal-content" style="padding: 40px; text-align: center; border-color: var(--green);">
                    <h2 style="color: var(--green); font-size: 2rem;">Pague com PIX</h2>
                    <img src="data:image/jpeg;base64,${data.qr_code_base64}" style="width: 250px; height: 250px; margin: 20px auto; background: white; padding: 10px; border-radius: 10px;">
                    <p style="color: var(--yellow); font-weight: bold; font-size: 1.2rem; animation: piscar 1.5s infinite;">⏳ Aguardando pagamento no telemóvel...</p>
                    <button onclick="window.location.reload()" class="btn-cancelar" style="margin-top: 20px;">Cancelar Pedido</button>
                </div>
            `;
            intervaloChecagem = setInterval(checarStatusPagamento, 3000);
        } else if (data.acao === "AGUARDANDO_MAQUININHA") {
            document.getElementById("modal-pix").innerHTML = `
                <div class="modal-content" style="padding: 40px; text-align: center; border-color: var(--yellow);">
                    <h2 style="color: var(--yellow); font-size: 2rem;">Siga as instruções na Máquina</h2>
                    <p style="font-size: 1.2rem; margin-top: 15px; color: #ccc;">Aproxime ou insira o seu cartão na máquina ao lado.</p>
                    <button onclick="window.location.reload()" class="btn-cancelar" style="margin-top: 30px;">Cancelar Pedido</button>
                </div>
            `;
        } else {
            document.getElementById("modal-pix").innerHTML = `
                <div class="modal-content" style="padding: 40px; text-align: center; border-color: white;">
                    <h2 style="color: white; font-size: 2.5rem;">Pedido #${pedidoAtualId} Anotado!</h2>
                    <p style="font-size:1.5rem; margin-top:20px; color: var(--green);">Dirija-se ao caixa para pagar.</p>
                </div>
            `;
            setTimeout(() => window.location.reload(), 6000);
        }
    })
    .catch(err => { alert("Erro de rede. Tente novamente."); window.location.reload(); });
}

function checarStatusPagamento() {
    fetch(`${API_URL}/pedido/${pedidoAtualId}/status`)
    .then(res => res.json())
    .then(data => {
        if (data.status === "PAGO") {
            clearInterval(intervaloChecagem);
            document.getElementById("modal-pix").innerHTML = `
                <div class="modal-content" style="padding: 50px; text-align: center; border-color: var(--green);">
                    <h2 style="color: var(--green); font-size: 3rem;">✅ Pagamento Aprovado!</h2>
                    <p style="font-size:1.5rem; margin-top: 20px;">O seu pedido já está a ser preparado no Boteco do MK.</p>
                </div>
            `;
            setTimeout(() => window.location.reload(), 5000);
        }
    });
}