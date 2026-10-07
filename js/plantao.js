/* =========================================================
   PÁGINA — PASSAGEM DE PLANTÃO
   ========================================================= */

const sessaoPlantao = getSessao();

if (!sessaoPlantao || sessaoPlantao.tipo !== "portaria") {
    window.location.href = "../index.html";
}

const camposPlantao = [
    "saindo",
    "assumindo",
    "prestadores",
    "ocorrencias",
    "observacoes"
];

const campoSaindo = document.getElementById("saindo");
const campoAssumindo = document.getElementById("assumindo");

function inicializarPlantao() {
    document.getElementById("op").textContent = sessaoPlantao.operador;
    document.getElementById("operadorTopo").textContent = sessaoPlantao.operador;
    document.getElementById("data").textContent = dataBR();

    PORTEIROS_LAGUNA.forEach((nome) => {
        campoSaindo.insertAdjacentHTML(
            "beforeend",
            `<option value="${escapar(nome)}">${escapar(nome)}</option>`
        );

        campoAssumindo.insertAdjacentHTML(
            "beforeend",
            `<option value="${escapar(nome)}">${escapar(nome)}</option>`
        );
    });

    const dadosSalvos = ler(STORAGE.plantao, {});

    camposPlantao.forEach((id) => {
        const campo = document.getElementById(id);
        campo.value = dadosSalvos[id] || "";
        campo.addEventListener("input", salvarPlantao);
        campo.addEventListener("change", salvarPlantao);
    });

    atualizarContadores();
    renderizarPendentes();
}

function salvarPlantao() {
    const dados = ler(STORAGE.plantao, {});

    dados.operador = sessaoPlantao.operador;
    dados.data = dataBR();

    camposPlantao.forEach((id) => {
        dados[id] = document.getElementById(id).value;
    });

    salvar(STORAGE.plantao, dados);
    atualizarContadores();
}

function atualizarContadores() {
    ["prestadores", "ocorrencias", "observacoes"].forEach((id, indice) => {
        const campo = document.getElementById(id);
        const contador = document.getElementById(`c${indice + 1}`);

        contador.textContent = `${campo.value.length} / 1000`;
    });
}

function renderizarPendentes() {
    const entregas = ler(STORAGE.entregas, [])
        .filter((entrega) => entrega.status === "Pendente");

    const area = document.getElementById("pendentes");

    if (!entregas.length) {
        area.innerHTML = '<div class="empty">Nenhuma entrega pendente.</div>';
        return;
    }

    area.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Apartamento</th>
                    <th>Morador</th>
                    <th>Entrega</th>
                    <th>Data/Hora</th>
                </tr>
            </thead>
            <tbody>
                ${entregas.map((entrega) => `
                    <tr>
                        <td>${escapar(entrega.apt)}</td>
                        <td>${escapar(entrega.morador)}</td>
                        <td>${escapar(entrega.descricao)}</td>
                        <td>${escapar(entrega.data)} ${escapar(entrega.hora)}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

function montarRelatorioPlantao() {
    const dados = ler(STORAGE.plantao, {});

    const entregas = ler(STORAGE.entregas, [])
        .filter((entrega) => entrega.status === "Pendente")
        .map((entrega) =>
            `• Apto ${entrega.apt} — ${entrega.morador} — ${entrega.descricao} — ${entrega.data} ${entrega.hora}`
        )
        .join("\n") || "• Nenhuma entrega pendente";

    return `*EDIFÍCIO LAGUNA HALL*
*RELATÓRIO DE PASSAGEM DE PLANTÃO*

*Data:* ${dados.data || dataBR()}
*Operador responsável:* ${dados.operador || sessaoPlantao.operador}
*Porteiro saindo:* ${dados.saindo || "Não informado"}
*Porteiro assumindo:* ${dados.assumindo || "Não informado"}

*ENTREGAS PENDENTES*
${entregas}

*PRESTADORES DE SERVIÇO*
${dados.prestadores || "Nenhum registro."}

*OCORRÊNCIAS*
${dados.ocorrencias || "Nenhuma ocorrência registrada."}

*OBSERVAÇÕES*
${dados.observacoes || "Nenhuma observação registrada."}

*Relatório gerado pelo Sistema Operacional do Edifício Laguna Hall.*`;
}

function enviarWhats() {
    salvarPlantao();

    const numero = prompt(
        "Informe o número do WhatsApp que receberá o relatório.\n\nExemplo: 81999999999"
    );

    if (!numero) return;

    const relatorio = montarRelatorioPlantao();
    whatsapp(numero, relatorio);
}

function limparPlantao() {
    if (!confirm("Deseja realmente limpar todos os dados do plantão salvo?")) {
        return;
    }

    limpar(STORAGE.plantao);

    camposPlantao.forEach((id) => {
        document.getElementById(id).value = "";
    });

    atualizarContadores();
}

inicializarPlantao();

/* Atualiza as entregas pendentes sem apagar os dados digitados. */
setInterval(renderizarPendentes, 3000);
