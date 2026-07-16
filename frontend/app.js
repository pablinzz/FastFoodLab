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

// --- 1. CARREGAR PRODUTOS ---
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

// --- 2. DESENHAR LAYOUT IFOOD ---
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

// --- 3. MODAL DE INGREDIENTES EXTRAS ---
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
    let precoFinal = produtoSelecionado.preco;
    let observacoes = extrasEscolhidos.map(e => `+ ${e.nome}`).join(", ");
    extrasEscolhidos.forEach(e => precoFinal += e.preco);

    // VERIFICA SE O ITEM JÁ EXISTE NO CARRINHO (Com os mesmos ingredientes)
    let itemExistente = carrinho.find(i => i.id === produtoSelecionado.id && i.observacoes === observacoes);

    if (itemExistente) {
        itemExistente.quantidade += 1; // Se existir, soma 1 na quantidade
    } else {
        carrinho.push({
            id: produtoSelecionado.id,
            nome: produtoSelecionado.nome,
            preco: precoFinal,
            observacoes: observacoes,
            quantidade: 1, // Novo item começa com 1
            uniqueId: Date.now() + Math.random()
        });
    }

    fecharModalPersonalizar();
    atualizarCarrinho();
}

// --- 4. CARRINHO E QUANTIDADES ---
function atualizarCarrinho() {
    const lista = document.getElementById("itens-carrinho");
    lista.innerHTML = "";
    total = 0; // Recalcula do zero

    if (carrinho.length === 0) {
        lista.innerHTML = `<div style="color: #666; text-align: center; margin-top: 50px;">Seu carrinho está vazio</div>`;
    } else {
        carrinho.forEach(item => {
            total += (item.preco * item.quantidade); // Soma preço x quantidade
            const obs = item.observacoes ? `<span class="item-carrinho-obs">${item.observacoes}</span>` : '';
            
            lista.innerHTML += `
                <li class="item-carrinho">
                    <div class="item-carrinho-info">
                        <div class="item-carrinho-nome">${item.nome}</div>
                        <div style="color: var(--green); font-weight: bold; margin-top: 5px;">R$ ${(item.preco * item.quantidade).toFixed(2)}</div>
                        ${obs}
                    </div>
                    <!-- NOVOS BOTÕES + E - -->
                    <div class="controles-quantidade">
                        <button onclick="alterarQuantidade(${item.uniqueId}, -1)" class="btn-qtd">-</button>
                        <span class="qtd-numero">${item.quantidade}</span>
                        <button onclick="alterarQuantidade(${item.uniqueId}, 1)" class="btn-qtd">+</button>
                    </div>
                </li>
            `;
        });
    }
    document.getElementById("total").innerText = total.toFixed(2);
}

function alterarQuantidade(uniqueId, alteracao) {
    let item = carrinho.find(i => i.uniqueId === uniqueId);
    if (item) {
        item.quantidade += alteracao;
        if (item.quantidade <= 0) {
            // Se chegar a 0, remove do carrinho
            carrinho = carrinho.filter(i => i.uniqueId !== uniqueId);
        }
        atualizarCarrinho();
    }
}

// --- 5. PAGAMENTO ---
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
                    <p style="color: var(--yellow); font-weight: bold; font-size: 1.2rem; animation: piscar 1.5s infinite;">⏳ Aguardando pagamento...</p>
                    <button onclick="window.location.reload()" class="btn-cancelar" style="margin-top: 20px;">Cancelar Pedido</button>
                </div>
            `;
            intervaloChecagem = setInterval(checarStatusPagamento, 3000);
        } else if (data.acao === "AGUARDANDO_MAQUININHA") {
            document.getElementById("modal-pix").innerHTML = `
                <div class="modal-content" style="padding: 40px; text-align: center; border-color: var(--yellow);">
                    <h2 style="color: var(--yellow); font-size: 2rem;">Siga as instruções na Máquina</h2>
                    <p style="font-size: 1.2rem; margin-top: 15px; color: #ccc;">Aproxime ou insira o seu cartão.</p>
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
                    <p style="font-size:1.5rem; margin-top: 20px;">O seu pedido já está a ser preparado.</p>
                </div>
            `;
            setTimeout(() => window.location.reload(), 5000);
        }
    });
}