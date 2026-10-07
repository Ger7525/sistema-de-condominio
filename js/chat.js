/* =========================================================
   PÁGINA — CHAT PORTARIA ↔ MORADOR
   ========================================================= */

const sessaoChat = getSessao();

if (!sessaoChat) {
    window.location.href = "../index.html";
}

const ehPortaria = sessaoChat.tipo === "portaria";
let apartamentoSelecionado = ehPortaria ? null : sessaoChat.apt;
let moradorSelecionado = ehPortaria ? null : sessaoChat.morador;
let ultimoMensagemRecebida = null;

const identidade = document.getElementById("identidade");
const menu = document.getElementById("menu");
const conteudo = document.getElementById("conteudo");

function chaveLeituraChat() {
    return `${sessaoChat.tipo}_${apartamentoSelecionado || "geral"}`;
}

function leiturasChat() {
    return ler(STORAGE.chatLeituras, {});
}

function obterUltimaLeitura() {
    return leiturasChat()[chaveLeituraChat()] || 0;
}

function marcarChatComoLido() {
    if (!apartamentoSelecionado) return;

    const mensagens = ler(STORAGE.mensagens, [])
        .filter((mensagem) => mensagem.apt === apartamentoSelecionado);

    const ultima = mensagens[mensagens.length - 1];
    if (!ultima) return;

    const leituras = leiturasChat();
    leituras[chaveLeituraChat()] = ultima.id;
    salvar(STORAGE.chatLeituras, leituras);
}

function mensagensNaoLidas() {
    const ultimaLeitura = obterUltimaLeitura();

    return ler(STORAGE.mensagens, []).filter((mensagem) => {
        return mensagem.apt &&
            mensagem.id > ultimaLeitura &&
            mensagem.tipo !== sessaoChat.tipo;
    });
}

let contextoAudioChat = null;
let audioChatLiberado = false;

function prepararAudioChat() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        if (!contextoAudioChat) {
            contextoAudioChat = new AudioContext();
        }

        if (contextoAudioChat.state === "suspended") {
            contextoAudioChat.resume();
        }

        audioChatLiberado = contextoAudioChat.state === "running";
    } catch (erro) {
        audioChatLiberado = false;
    }
}

function tocarSomNovaMensagem() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        if (!contextoAudioChat) {
            contextoAudioChat = new AudioContext();
        }

        const executarSom = () => {
            if (!contextoAudioChat || contextoAudioChat.state !== "running") return;

            const agora = contextoAudioChat.currentTime;
            const oscilador = contextoAudioChat.createOscillator();
            const ganho = contextoAudioChat.createGain();

            oscilador.type = "sine";
            oscilador.frequency.setValueAtTime(880, agora);
            oscilador.frequency.setValueAtTime(1174, agora + 0.12);

            ganho.gain.setValueAtTime(0.0001, agora);
            ganho.gain.exponentialRampToValueAtTime(0.18, agora + 0.025);
            ganho.gain.exponentialRampToValueAtTime(0.0001, agora + 0.42);

            oscilador.connect(ganho);
            ganho.connect(contextoAudioChat.destination);
            oscilador.start(agora);
            oscilador.stop(agora + 0.45);
        };

        if (contextoAudioChat.state === "suspended") {
            contextoAudioChat.resume().then(() => {
                audioChatLiberado = true;
                executarSom();
            }).catch(() => {});
            return;
        }

        if (contextoAudioChat.state === "running" && audioChatLiberado) {
            executarSom();
        }
    } catch (erro) {
        /* O navegador pode bloquear áudio até uma interação do usuário. */
    }
}

/*
   Os navegadores modernos bloqueiam áudio automático até que o usuário
   interaja com a página. Estas interações liberam o som para as próximas
   notificações recebidas pelo chat.
*/
function liberarAudioChat() {
    prepararAudioChat();
}

document.addEventListener("pointerdown", liberarAudioChat, { once: true });
document.addEventListener("keydown", liberarAudioChat, { once: true });

function atualizarIndicadorMensagens() {
    const quantidade = mensagensNaoLidas().length;
    const botoesChat = document.querySelectorAll('[data-menu-chat]');

    botoesChat.forEach((botao) => {
        const indicadorExistente = botao.querySelector(".notification-badge");

        if (quantidade > 0) {
            if (indicadorExistente) {
                indicadorExistente.textContent = quantidade > 99 ? "99+" : quantidade;
            } else {
                botao.insertAdjacentHTML(
                    "beforeend",
                    `<span class="notification-badge">${quantidade > 99 ? "99+" : quantidade}</span>`
                );
            }
        } else if (indicadorExistente) {
            indicadorExistente.remove();
        }
    });
}

function verificarNovasMensagens() {
    const novas = mensagensNaoLidas();

    if (!novas.length) {
        atualizarIndicadorMensagens();
        return;
    }

    const ultima = novas[novas.length - 1];

    if (ultimoMensagemRecebida === null) {
        ultimoMensagemRecebida = ultima.id;
    } else if (ultima.id !== ultimoMensagemRecebida) {
        ultimoMensagemRecebida = ultima.id;
        tocarSomNovaMensagem();
    }

    atualizarIndicadorMensagens();
}

function montarMenu() {
    identidade.textContent = ehPortaria
        ? sessaoChat.operador
        : `${sessaoChat.morador} • Apto ${sessaoChat.apt}`;

    if (ehPortaria) {
        menu.innerHTML = `
            <a class="btn btn-secondary" href="portaria_plantao.html">🛎️ Plantão</a>
            <a class="btn btn-secondary" href="portaria_entregas.html">📦 Entregas</a>
            <a class="btn btn-secondary" href="reservas.html">📅 Reservas</a>
            <a class="btn" data-menu-chat href="chat.html">💬 Chat</a>
            <button class="btn-danger" type="button" onclick="sair()">Sair</button>
        `;
    } else {
        menu.innerHTML = `
            <a class="btn btn-secondary" href="morador_portal.html">🏠 Portal</a>
            <a class="btn btn-secondary" href="reservas.html">📅 Reservas</a>
            <a class="btn" data-menu-chat href="chat.html">💬 Chat</a>
            <button class="btn-danger" type="button" onclick="sair()">Sair</button>
        `;
    }

    atualizarIndicadorMensagens();
}

function renderizar() {
    if (ehPortaria) {
        renderizarPortaria();
    } else {
        renderizarMorador();
    }

    atualizarIndicadorMensagens();
}

function renderizarMorador() {
    conteudo.innerHTML = `
        <div class="card">
            <h2>💬 Conversa com a Portaria</h2>
            <div id="chat" class="chat"></div>
            <div class="actions">
                <input id="msg" placeholder="Digite sua mensagem..." maxlength="1000">
                <button type="button" onclick="enviarMensagem()">Enviar</button>
            </div>
        </div>
    `;

    desenharChat();
}

function renderizarPortaria() {
    const apartamentos = [
        ...new Set(
            ler(STORAGE.mensagens, [])
                .map((mensagem) => mensagem.apt)
                .filter(Boolean)
        )
    ].sort((a, b) => Number(a) - Number(b));

    conteudo.innerHTML = `
        <div class="grid">
            <div class="card">
                <h2>💬 Conversas</h2>
                ${apartamentos.length
                    ? apartamentos.map((apt) => `
                        <button
                            class="btn btn-light chat-room-button"
                            type="button"
                            onclick="abrirChat('${escapar(apt)}')"
                        >
                            Apto ${escapar(apt)}
                        </button>
                    `).join("")
                    : '<div class="empty">Nenhuma conversa ainda.</div>'
                }
            </div>

            <div class="card">
                <h2>Conversa</h2>
                <div id="chat" class="chat">
                    <div class="empty">Selecione um apartamento.</div>
                </div>
                <div class="actions">
                    <input id="msg" placeholder="Mensagem..." maxlength="1000">
                    <button type="button" onclick="enviarMensagem()">Enviar</button>
                </div>
            </div>
        </div>
    `;
}

function abrirChat(apt) {
    apartamentoSelecionado = apt;

    const moradores = APARTAMENTOS_LAGUNA[apt] || [];
    moradorSelecionado = moradores[0]?.nome || "";

    marcarChatComoLido();
    renderizarPortaria();
    desenharChat();
    atualizarIndicadorMensagens();
}

function desenharChat() {
    const area = document.getElementById("chat");
    if (!area || !apartamentoSelecionado) return;

    const mensagens = ler(STORAGE.mensagens, [])
        .filter((mensagem) => mensagem.apt === apartamentoSelecionado);

    area.innerHTML = mensagens.length
        ? mensagens.map((mensagem) => `
            <div class="msg ${mensagem.tipo === sessaoChat.tipo ? "mine" : ""}">
                <b>${escapar(mensagem.remetente)}</b>
                <div>${escapar(mensagem.mensagem)}</div>
                <div class="meta">${new Date(mensagem.data).toLocaleString("pt-BR")}</div>
            </div>
        `).join("")
        : '<div class="empty">Nenhuma mensagem.</div>';

    area.scrollTop = area.scrollHeight;
}

function enviarMensagem() {
    const campo = document.getElementById("msg");
    const mensagem = campo?.value.trim();

    if (!mensagem || !apartamentoSelecionado) return;

    const mensagens = ler(STORAGE.mensagens, []);

    mensagens.push({
        id: Date.now(),
        apt: apartamentoSelecionado,
        morador: ehPortaria ? moradorSelecionado : sessaoChat.morador,
        remetente: ehPortaria ? sessaoChat.operador : sessaoChat.morador,
        mensagem,
        tipo: sessaoChat.tipo,
        data: agoraISO()
    });

    salvar(STORAGE.mensagens, mensagens);
    campo.value = "";

    marcarChatComoLido();
    desenharChat();
    atualizarIndicadorMensagens();
}

montarMenu();
renderizar();
verificarNovasMensagens();

setInterval(() => {
    const mensagensAntes = mensagensNaoLidas().length;

    verificarNovasMensagens();

    if (ehPortaria && apartamentoSelecionado) {
        desenharChat();
    } else if (!ehPortaria) {
        desenharChat();
    }

    const mensagensDepois = mensagensNaoLidas().length;

    if (mensagensDepois < mensagensAntes) {
        atualizarIndicadorMensagens();
    }
}, 2000);
