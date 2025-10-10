let dados = [];

// Carrega o CSV e obtém a data real de modificação
fetch("dados.csv")
  .then(response => {
    const dataArquivo = new Date(response.headers.get("Last-Modified"));
    if (!isNaN(dataArquivo)) {
      const opcoes = { 
        day: "2-digit", month: "2-digit", year: "numeric", 
        hour: "2-digit", minute: "2-digit"
      };
      document.getElementById("ultimaAtualizacao").textContent =
        "Última atualização: " + dataArquivo.toLocaleString("pt-BR", opcoes);
    }
    return response.text();
  })
  .then(text => {
    dados = text.split("\n").slice(1).map(linha => {
      const [cidade, transportadora, uf, prazo, tipo] = linha.split(",");
      return { cidade, transportadora, uf, prazo, tipo };
    });
  });

// Elementos
const tbody = document.querySelector("#results tbody");
const inputGeral = document.getElementById("searchGeral");
const sugestoes = document.getElementById("suggestionsGeral");
const contador = document.getElementById("contadorResultados");

// Função para remover acentos
function removerAcentos(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Mostrar resultados exatos
function mostrarResultados(filtrados) {
  tbody.innerHTML = "";
  if (filtrados.length === 0) {
    tbody.innerHTML = "<tr><td colspan='5'>Nenhum resultado encontrado.</td></tr>";
    contador.textContent = "";
    return;
  }

  filtrados.forEach(d => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.cidade || ""}</td>
      <td>${d.transportadora || ""}</td>
      <td>${d.uf || ""}</td>
      <td>${d.prazo || ""}</td>
      <td>${d.tipo || ""}</td>
    `;
    tbody.appendChild(tr);
  });

  contador.textContent = `${filtrados.length} resultado${filtrados.length > 1 ? "s" : ""} encontrado${filtrados.length > 1 ? "s" : ""}`;
}

// Busca exata (sem acento)
function buscar(termo) {
  const termoNormalizado = removerAcentos(termo.trim().toLowerCase());

  const filtrados = dados.filter(d => {
    const cidade = removerAcentos(d.cidade?.toLowerCase() || "");
    const transp = removerAcentos(d.transportadora?.toLowerCase() || "");
    const uf = removerAcentos(d.uf?.toLowerCase() || "");
    // Busca exata — precisa ser igual
    return (
      cidade === termoNormalizado ||
      transp === termoNormalizado ||
      uf === termoNormalizado
    );
  });

  mostrarResultados(filtrados);
}

// Sugestões (contém o termo digitado)
inputGeral.addEventListener("input", () => {
  const termo = inputGeral.value.trim().toLowerCase();
  const termoNormalizado = removerAcentos(termo);
  sugestoes.innerHTML = "";
  if (termo.length < 2) return;

  const combinados = dados.flatMap(d => [d.cidade, d.transportadora, d.uf]);
  const unicos = [...new Set(
    combinados.filter(v => removerAcentos(v?.toLowerCase() || "").includes(termoNormalizado))
  )];

  unicos.slice(0, 5).forEach(valor => {
    const li = document.createElement("li");
    li.textContent = valor;
    li.onclick = () => {
      inputGeral.value = valor;
      sugestoes.innerHTML = "";
      buscar(valor);
    };
    sugestoes.appendChild(li);
  });
});

// Pressionar Enter → busca exata
inputGeral.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    sugestoes.innerHTML = "";
    buscar(inputGeral.value);
  }
});

// Fechar sugestões ao clicar fora
document.addEventListener("click", e => {
  if (!sugestoes.contains(e.target) && e.target !== inputGeral) {
    sugestoes.innerHTML = "";
  }
});
