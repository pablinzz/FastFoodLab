// Aponta para a tua API no Render
const API_URL = "https://fastfoodlab.onrender.com";

let carrinho = [];
let total = 0;

// CARREGAR PRODUTOS
fetch(`${API_URL}/produtos`)
    .then(res => res.json())
    .then(produtos => {
        const lista = document.getElementById("lista-produtos");

        produtos.forEach(prod => {
            const card = document.createElement("div");
            card.className = "card-produto";

            const imgHtml = prod.imagem_url ? `<img src="${prod.imagem_url}" alt="${prod.nome}" style="width:100%; height:150px; object-fit:cover; border-radius:8px; margin-bottom: 10px;">` : '';

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
    });

// ADICIONAR AO CARRINHO
function adicionarCarrinho(id, nome, preco) {
    carrinho.push({ id, nome, preco });
    total += preco;
    atualizarCarrinho();
}

// ATUALIZAR CARRINHO
function atualizarCarrinho() {
    const lista = document.getElementById("itens-carrinho");
    lista.innerHTML = "";

    carrinho.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.nome} - R$ ${item.preco.toFixed(2)}`;
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