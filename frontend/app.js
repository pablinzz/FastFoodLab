const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:8000' 
    : 'https://fastfoodlab.onrender.com';

let produtos = [];
let carrinho = [];
let total = 0;
let produtoAtual = null;

let clienteNome = "";
let clienteConsumo = "";

function fecharSplashScreen() {
    clienteNome = document.getElementById("cliente-nome").value || "Cliente";
    clienteConsumo = document.getElementById("cliente-consumo").value;
    document.getElementById("splash-screen").style.display = "none";
}

async function carregarProdutos() {
    try {
        const response = await fetch(`${API_URL}/produtos/`);
        produtos = await response.json();
        renderizarProdutos(produtos);
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
    }
}

function renderizarProdutos(lista) {
    const grid = document.getElementById("produtos-grid");
    grid.innerHTML = "";
    lista.forEach(produto => {
        const div = document.createElement("div");
        div.className = "produto";
        div.onclick = () => abrirModal(produto);
        div.innerHTML = `
            <img src="${produto.imagem_url}" alt="${produto.nome}" onerror="this.src='https://via.placeholder.com/150'">
            <h3>${produto.nome}</h3>
            <p>R$ ${produto.preco.toFixed(2)}</p>
        `;
        grid.appendChild(div);
    });
}

function abrirModal(produto) {
    produtoAtual = produto;
    document.getElementById("modal-nome").innerText = produto.nome;
    document.getElementById("modal-preco").innerText = `R$ ${produto.preco.toFixed(2)}`;
    document.getElementById("modal-img").src = produto.imagem_url;
    
    const listaIngredientes = document.getElementById("lista-ingredientes");
    listaIngredientes.innerHTML = "";
    
    if (produto.ingredientes_disponiveis && produto.ingredientes_disponiveis.length > 0) {
        produto.ingredientes_disponiveis.forEach((ing, index) => {
            const div = document.createElement("div");
            div.className = "ingrediente-item";
            div.innerHTML = `
                <input type="checkbox" id="ing_${index}" value="${ing}">
                <label for="ing_${index}">Sem ${ing}</label>
            `;
            listaIngredientes.appendChild(div);
        });
    } else {
        listaIngredientes.innerHTML = "<p>Sem modificações disponíveis.</p>";
    }

    document.getElementById("modal-ingredientes").style.display = "flex";
}

function fecharModal() {
    document.getElementById("modal-ingredientes").style.display = "none";
}

function adicionarAoCarrinho() {
    const checkboxes = document.querySelectorAll(".ingrediente-item input:checked");
    const removidos = Array.from(checkboxes).map(cb => cb.value);
    
    const itemCarrinho = {
        id: produtoAtual.id,
        nome: produtoAtual.nome,
        preco: produtoAtual.preco,
        removidos: removidos,
        quantidade: 1
    };

    carrinho.push(itemCarrinho);
    fecharModal();
    mostrarSucesso();
    
    setTimeout(() => {
        atualizarCarrinho();
    }, 600);
}

function mostrarSucesso() {
    const overlay = document.getElementById("modal-sucesso-overlay");
    overlay.style.display = "flex";
    setTimeout(() => {
        overlay.style.display = "none";
    }, 800);
}

function atualizarCarrinho() {
    const itensContainer = document.getElementById("carrinho-itens");
    itensContainer.innerHTML = "";
    total = 0;
    let qtdTotal = 0;

    carrinho.forEach((item, index) => {
        total += item.preco * item.quantidade;
        qtdTotal += item.quantidade;
        
        let textoRemovidos = item.removidos.length > 0 
            ? `<div class="item-ingredientes">S/ ${item.removidos.join(', ')}</div>` 
            : '';

        const div = document.createElement("div");
        div.className = "item-carrinho";
        div.innerHTML = `
            <div class="item-info">
                <span>${item.nome}</span>
                <span>R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
            </div>
            ${textoRemovidos}
            <div class="item-controles">
                <button class="btn-qtd" onclick="alterarQuantidade(${index}, -1)">-</button>
                <span class="qtd-numero">${item.quantidade}</span>
                <button class="btn-qtd" onclick="alterarQuantidade(${index}, 1)">+</button>
            </div>
        `;
        itensContainer.appendChild(div);
    });

    const spanTotal = document.getElementById("total");
    spanTotal.innerText = total.toFixed(2);
    
    spanTotal.parentElement.classList.add("pulsar");
    setTimeout(() => {
        spanTotal.parentElement.classList.remove("pulsar");
    }, 200);

    // MÁGICA DO BOTÃO FLUTUANTE PARA MOBILE
    const btnFlutuante = document.getElementById("btn-flutuante");
    const spanQtdFlutuante = document.getElementById("qtd-flutuante");
    if(btnFlutuante && spanQtdFlutuante) {
        spanQtdFlutuante.innerText = qtdTotal;
        if(qtdTotal > 0) {
            btnFlutuante.classList.add("ativo");
        } else {
            btnFlutuante.classList.remove("ativo");
        }
    }
}

function alterarQuantidade(index, delta) {
    carrinho[index].quantidade += delta;
    if (carrinho[index].quantidade <= 0) {
        carrinho.splice(index, 1);
    }
    atualizarCarrinho();
}

function abrirModalPagamento() {
    if (carrinho.length === 0) return alert("O carrinho está vazio!");
    document.getElementById("modal-pagamento").style.display = "flex";
}

function fecharModalPagamento() {
    document.getElementById("modal-pagamento").style.display = "none";
}

async function processarPagamento(metodo) {
    const pedido = {
        cliente_nome: clienteNome,
        tipo_consumo: clienteConsumo,
        itens: carrinho.map(item => ({
            produto_id: item.id,
            quantidade: item.quantidade,
            observacao: item.removidos.length > 0 ? "Sem: " + item.removidos.join(', ') : ""
        }))
    };

    try {
        const response = await fetch(`${API_URL}/pedidos/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pedido)
        });

        if (response.ok) {
            alert(`Pedido finalizado! Dirija-se ao caixa.\nNome: ${clienteNome}`);
            carrinho = [];
            total = 0;
            atualizarCarrinho();
            fecharModalPagamento();
            document.getElementById("splash-screen").style.display = "flex";
            document.getElementById("cliente-nome").value = "";
        }
    } catch (error) {
        alert("Erro ao processar pedido.");
    }
}

function cancelarPedidoTotem() {
    if (carrinho.length === 0) {
        document.getElementById("splash-screen").style.display = "flex";
        document.getElementById("cliente-nome").value = "";
        return;
    }
    
    if (confirm("Deseja cancelar o pedido e esvaziar o carrinho?")) {
        carrinho = [];
        total = 0;
        atualizarCarrinho();
        document.getElementById("splash-screen").style.display = "flex";
        document.getElementById("cliente-nome").value = "";
    }
}

carregarProdutos();