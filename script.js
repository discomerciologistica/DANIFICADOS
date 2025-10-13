let dados = [];

// Carrega o CSV e mostra data de atualização
fetch("danificados.csv")
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
    const linhas = text.split("\n").slice(1); // ignora cabeçalho
    dados = linhas.map(linha => {
      // Quebra CSV corretamente mesmo com vírgulas dentro de aspas
      const valores = linha.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
      const [
        pedido, os, fabricante, status, descricao, cod,
        btus, nf_fabricante, liquidacao, setor, fotos, defeito, alerta
      ] = valores.map(v => v.replace(/^"|"$/g, "")); // remove aspas externas

      return {
        pedido, os, fabricante, status, descricao, cod,
        btus, nf_fabricante, liquidacao, setor, fotos, defeito, alerta
      };
    });
  });

// Elementos
const tbody = document.querySelector("#results tbody");
const inputGeral = document.getElementById("searchGeral");
const sugestoes = document.getElementById("suggestionsGeral");
const contador = document.getElementById("contadorResultados");

// Remove acentos
function removerAcentos(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Exibir resultados
function mostrarResultados(filtrados) {
  const thead = document.querySelector("#results thead");
  const tbody = document.querySelector("#results tbody");

  // Remove cabeçalho extra anterior (se existir)
  const oldCountRow = document.querySelector(".count-row");
  if (oldCountRow) oldCountRow.remove();

  tbody.innerHTML = "";

  if (filtrados.length === 0) {
    tbody.innerHTML = "<tr><td colspan='13'>Nenhum resultado encontrado.</td></tr>";
    contador.textContent = "";
    return;
  }

  // Cria linha de contagem
  const countRow = document.createElement("tr");
  countRow.classList.add("count-row");
  countRow.innerHTML = `<th colspan="13" style="text-align:left; color: #ffeb3b;">
    ${filtrados.length} registro${filtrados.length > 1 ? "s" : ""} encontrado${filtrados.length > 1 ? "s" : ""}
  </th>`;
  thead.prepend(countRow);

  // Monta linhas da tabela
  filtrados.forEach(d => {
    const fotosTexto = d.fotos || "";
    const fotosFormatado = /sem\s*foto/i.test(fotosTexto)
      ? `<span class="sem-foto">${fotosTexto}</span>`
      : fotosTexto;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.pedido || ""}</td>
      <td>${d.os || ""}</td>
      <td>${d.fabricante || ""}</td>
      <td>${d.status || ""}</td>
      <td>${d.descricao || ""}</td>
      <td>${d.cod || ""}</td>
      <td>${d.btus || ""}</td>
      <td>${d.nf_fabricante || ""}</td>
      <td>${d.liquidacao || ""}</td>
      <td>${d.setor || ""}</td>
      <td>${fotosFormatado}</td>
      <td>${d.defeito || ""}</td>
      <td>
        ${
          d.alerta
            ? /separar/i.test(d.alerta)
              ? `<span class="separar">${d.alerta}</span>`
              : /encerrar/i.test(d.alerta)
                ? `<span class="encerrar">${d.alerta}</span>`
                : d.alerta
            : ""
        }
      </td>
    `;
    tbody.appendChild(tr);
  });

  contador.textContent = `${filtrados.length} registro${filtrados.length > 1 ? "s" : ""} encontrado${filtrados.length > 1 ? "s" : ""}`;
}

// Busca (corrigida para includes)
function buscar(termo) {
  const termoNormalizado = removerAcentos(termo.trim().toLowerCase());
  const filtrados = dados.filter(d => {
    return Object.values(d)
      .some(v => removerAcentos(v?.toLowerCase() || "").includes(termoNormalizado));
  });
  mostrarResultados(filtrados);
}

// Sugestões de busca
inputGeral.addEventListener("input", () => {
  const termo = inputGeral.value.trim().toLowerCase();
  const termoNormalizado = removerAcentos(termo);
  sugestoes.innerHTML = "";
  if (termo.length < 2) return;

  const combinados = dados.flatMap(d => Object.values(d));
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

// Enter → buscar
inputGeral.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    sugestoes.innerHTML = "";
    buscar(inputGeral.value);
  }
});

// Clicar fora → fecha sugestões
document.addEventListener("click", e => {
  if (!sugestoes.contains(e.target) && e.target !== inputGeral) {
    sugestoes.innerHTML = "";
  }
});
