/* =========================================================
   ADMINISTRADORA — PAINEL
   ========================================================= */
const sessaoAdmin = getSessao();
if (!sessaoAdmin || sessaoAdmin.tipo !== "administradora") location.href = "../../index.html";

function iniciarAdministradora() {
    const reservas = ler(STORAGE.reservas, []);
    const pendentes = reservas.filter(r => r.status === "Solicitada");
    const boletos = ler("laguna_boletos", []);
    document.getElementById("metricas").innerHTML = `
        <div class="metric-card"><div>🏠 Apartamentos</div><div class="metric-number">${aptos().length}</div></div>
        <div class="metric-card"><div>📅 Reservas pendentes</div><div class="metric-number">${pendentes.length}</div></div>
        <div class="metric-card"><div>📄 Boletos cadastrados</div><div class="metric-number">${boletos.length}</div></div>
        <div class="metric-card"><div>⚠️ Ocorrências em plantões</div><div class="metric-number">${contarOcorrencias()}</div></div>`;
    renderizarPendentes(pendentes);
}

function contarOcorrencias() {
    const p = ler(STORAGE.plantao, {});
    return p.ocorrencias && p.ocorrencias.trim() ? 1 : 0;
}

function renderizarPendentes(lista) {
    const el = document.getElementById("reservasPendentes");
    if (!lista.length) { el.innerHTML = '<div class="empty">Nenhuma reserva aguardando aprovação.</div>'; return; }
    el.innerHTML = `<table><thead><tr><th>Apto</th><th>Morador</th><th>Espaço</th><th>Data</th><th>Horário</th><th>Ações</th></tr></thead><tbody>${lista.sort((a,b)=>b.id-a.id).map(r => `<tr><td>${escapar(r.apt)}</td><td>${escapar(r.morador)}</td><td>${escapar(r.espaco)}</td><td>${escapar(r.data)}</td><td>${escapar(r.horario)}</td><td><button class="btn-success" onclick="aprovarReservaAdmin(${r.id})">Aprovar</button> <button class="btn-danger" onclick="recusarReservaAdmin(${r.id})">Recusar</button></td></tr>`).join("")}</tbody></table>`;
}

function alterarReservaAdmin(id, status, mensagem) {
    const reservas = ler(STORAGE.reservas, []);
    const reserva = reservas.find(r => r.id === id);
    if (!reserva) return;
    if (status === "Aprovada" && reservas.some(r => r.id !== id && r.espaco === reserva.espaco && r.data === reserva.data && r.status === "Aprovada")) return alert("Já existe uma reserva aprovada para este espaço e data.");
    reserva.status = status; reserva.atualizadaEm = agoraISO();
    salvar(STORAGE.reservas, reservas);
    notificar(reserva.apt, reserva.morador, status === "Aprovada" ? "📅 Reserva aprovada" : "❌ Reserva recusada", mensagem, "reserva");
    iniciarAdministradora();
}
function aprovarReservaAdmin(id) { const r=ler(STORAGE.reservas,[]).find(x=>x.id===id); if(r) alterarReservaAdmin(id,"Aprovada",`Sua reserva do ${r.espaco}, em ${r.data}, das ${r.horario}, foi aprovada pela Administradora.`); }
function recusarReservaAdmin(id) { const r=ler(STORAGE.reservas,[]).find(x=>x.id===id); if(r) alterarReservaAdmin(id,"Recusada",`Sua solicitação para ${r.espaco}, em ${r.data}, não foi aprovada pela Administradora.`); }

iniciarAdministradora();
setInterval(iniciarAdministradora, 3000);