/* =========================================================
   SISTEMA OPERACIONAL — EDIFÍCIO LAGUNA HALL
   Funções compartilhadas por todas as páginas.
   ========================================================= */

const STORAGE = {
    sessao: "laguna_sessao",
    plantao: "laguna_plantao",
    entregas: "laguna_entregas",
    notificacoes: "laguna_notificacoes",
    mensagens: "laguna_mensagens",
    reservas: "laguna_reservas",
    chatLeituras: "laguna_chat_leituras"
};

function ler(chave, padrao) {
    try {
        const valor = localStorage.getItem(chave);
        return valor ? JSON.parse(valor) : padrao;
    } catch (erro) {
        return padrao;
    }
}

function salvar(chave, valor) {
    localStorage.setItem(chave, JSON.stringify(valor));
}

function limpar(chave) {
    localStorage.removeItem(chave);
}

function dataBR(data = new Date()) {
    return data.toLocaleDateString("pt-BR");
}

function horaBR(data = new Date()) {
    return data.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function agoraISO() {
    return new Date().toISOString();
}

function escapar(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, (caractere) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[caractere]));
}

/* =========================================================
   SESSÃO
   ========================================================= */

function getSessao() {
    return ler(STORAGE.sessao, null);
}

function setSessao(dados) {
    salvar(STORAGE.sessao, dados);
}

function sair() {
    localStorage.removeItem(STORAGE.sessao);
    const caminho = window.location.pathname;
    const base = caminho.includes("/pages/")
        ? caminho.substring(0, caminho.indexOf("/pages/"))
        : caminho.substring(0, caminho.lastIndexOf("/"));
    window.location.href = `${base}/index.html`;
}

/* =========================================================
   WHATSAPP
   ========================================================= */

function normalizarWhatsApp(telefone) {
    let numero = String(telefone || "").replace(/\D/g, "");

    if (numero.startsWith("55")) {
        numero = numero.substring(2);
    }

    return numero;
}

function whatsapp(telefone, mensagem) {
    const numero = normalizarWhatsApp(telefone);

    if (!numero) {
        alert("Informe um número de WhatsApp.");
        return false;
    }

    if (numero.length < 10 || numero.length > 11) {
        alert("Número de WhatsApp inválido. Informe DDD + número.");
        return false;
    }

    const url = `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem || "")}`;

    /*
       Primeiro tenta abrir uma nova aba através de um link real.
       Isso é mais confiável que window.open() em alguns navegadores.
       Se o navegador bloquear a nova aba, abre na própria aba.
    */
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
        if (document.visibilityState === "visible") {
            const confirmar = confirm(
                "O WhatsApp não abriu em uma nova aba. Deseja abrir nesta mesma aba?"
            );

            if (confirmar) {
                window.location.href = url;
            }
        }
    }, 700);

    return true;
}

/* =========================================================
   APARTAMENTOS / MORADORES
   ========================================================= */

function aptos() {
    return Object.keys(APARTAMENTOS_LAGUNA).sort((a, b) => Number(a) - Number(b));
}

function preencherAptos(select, incluirVazio = true) {
    if (!select) return;

    select.innerHTML = incluirVazio
        ? '<option value="">Selecione o apartamento</option>'
        : "";

    aptos().forEach((apartamento) => {
        select.insertAdjacentHTML(
            "beforeend",
            `<option value="${escapar(apartamento)}">${escapar(apartamento)}</option>`
        );
    });
}

function preencherMoradores(apt, select, incluirVazio = true) {
    if (!select) return;

    select.innerHTML = incluirVazio
        ? '<option value="">Selecione o morador</option>'
        : "";

    (APARTAMENTOS_LAGUNA[apt] || []).forEach((morador, indice) => {
        select.insertAdjacentHTML(
            "beforeend",
            `<option value="${indice}">${escapar(morador.nome)}</option>`
        );
    });
}

function getMorador(apt, indice) {
    return (APARTAMENTOS_LAGUNA[apt] || [])[Number(indice)];
}

/* =========================================================
   NOTIFICAÇÕES
   ========================================================= */

function notificar(apt, morador, titulo, mensagem, tipo = "info") {
    const notificacoes = ler(STORAGE.notificacoes, []);

    notificacoes.push({
        id: Date.now() + Math.random(),
        apt,
        morador,
        titulo,
        mensagem,
        tipo,
        lida: false,
        data: agoraISO()
    });

    salvar(STORAGE.notificacoes, notificacoes);
}
