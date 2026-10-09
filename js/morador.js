const sessao=getSessao();if(!sessao||sessao.tipo!=="morador")location.href="../index.html";
document.getElementById("moradorTopo").textContent=`${sessao.morador} • Apto ${sessao.apt}`;document.getElementById("boasVindas").textContent=`Olá, ${sessao.morador}!`;document.getElementById("apt").textContent=sessao.apt;
function minhasNotifs(){return ler(STORAGE.notificacoes,[]).filter(x=>x.apt===sessao.apt&&(x.morador===sessao.morador||!x.morador));}
function render(){const n=minhasNotifs().sort((a,b)=>new Date(b.data)-new Date(a.data)),e=ler(STORAGE.entregas,[]).filter(x=>x.apt===sessao.apt&&x.morador===sessao.morador&&x.status==="Pendente"),r=ler(STORAGE.reservas,[]).filter(x=>x.apt===sessao.apt&&x.morador===sessao.morador);document.getElementById("nEntregas").textContent=e.length;document.getElementById("nNotif").textContent=n.filter(x=>!x.lida).length;document.getElementById("nReservas").textContent=r.length;document.getElementById("notificacoes").innerHTML=n.length?n.map(x=>`<div class="notice ${x.lida?"":"unread"}"><b>${escapar(x.titulo)}</b><p>${escapar(x.mensagem)}</p><small>${new Date(x.data).toLocaleString("pt-BR")}</small></div>`).join(""):'<div class="empty">Nenhuma notificação.</div>';document.getElementById("entregas").innerHTML=e.length?"<table><tr><th>Entrega</th><th>Data</th><th>Status</th></tr>"+e.map(x=>`<tr><td>${escapar(x.descricao)}</td><td>${x.data} ${x.hora}</td><td><span class="badge warning">Pendente</span></td></tr>`).join("")+"</table>":'<div class="empty">Nenhuma entrega pendente.</div>';}
function marcarTodas(){const n=ler(STORAGE.notificacoes,[]);n.forEach(x=>{if(x.apt===sessao.apt&&(x.morador===sessao.morador||!x.morador))x.lida=true});salvar(STORAGE.notificacoes,n);render();}
function limparMinhasNotificacoes(){if(!confirm("Limpar suas notificações?"))return;const n=ler(STORAGE.notificacoes,[]).filter(x=>!(x.apt===sessao.apt&&(x.morador===sessao.morador||!x.morador)));salvar(STORAGE.notificacoes,n);render();}
render();setInterval(render,3000);


/* =========================================================
   BOLETOS DO MORADOR
   ========================================================= */
const BOLETOS_KEY_MORADOR = "laguna_boletos";
const DB_NAME_MORADOR = "laguna_hall_arquivos";
const DB_STORE_MORADOR = "boletos";
let dbMorador = null;

function abrirBancoMorador(){
    return new Promise((resolve,reject)=>{
        const req=indexedDB.open(DB_NAME_MORADOR,1);
        req.onupgradeneeded=()=>{const banco=req.result;if(!banco.objectStoreNames.contains(DB_STORE_MORADOR))banco.createObjectStore(DB_STORE_MORADOR,{keyPath:"id"});};
        req.onsuccess=()=>{dbMorador=req.result;resolve(dbMorador);};
        req.onerror=()=>reject(req.error);
    });
}
function obterArquivoMorador(id){
    return new Promise((resolve,reject)=>{
        const tx=dbMorador.transaction(DB_STORE_MORADOR,"readonly"),req=tx.objectStore(DB_STORE_MORADOR).get(id);
        req.onsuccess=()=>resolve(req.result?.arquivo||null);req.onerror=()=>reject(req.error);
    });
}
async function abrirMeuBoleto(id){
    const b=ler(BOLETOS_KEY_MORADOR,[]).find(x=>x.id===id);if(!b)return;
    try{const arq=await obterArquivoMorador(b.arquivo);if(!arq)return alert("Arquivo do boleto não encontrado neste dispositivo.");window.open(URL.createObjectURL(arq),"_blank","noopener,noreferrer");}
    catch(e){alert("Não foi possível abrir o boleto.");}
}
function renderizarMeusBoletos(){
    const el=document.getElementById("boletosMorador");if(!el)return;
    const lista=ler(BOLETOS_KEY_MORADOR,[]).filter(x=>x.apt===sessao.apt).sort((a,b)=>b.id-a.id);
    if(!lista.length){el.innerHTML='<div class="empty">Nenhum boleto disponível para o seu apartamento.</div>';return;}
    el.innerHTML=`<table><thead><tr><th>Competência</th><th>Valor</th><th>Arquivo</th><th>Ação</th></tr></thead><tbody>${lista.map(b=>`<tr><td>${escapar(b.competencia)}</td><td>${b.valor?Number(b.valor).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):"-"}</td><td>${escapar(b.nomeArquivo)}</td><td><button onclick="abrirMeuBoleto(${b.id})">📄 Visualizar PDF</button></td></tr>`).join("")}</tbody></table>`;
}
abrirBancoMorador().then(renderizarMeusBoletos).catch(()=>{});
setInterval(renderizarMeusBoletos,3000);
