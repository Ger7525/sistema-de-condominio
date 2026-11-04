(function () {
   "use strict";

   /* Sem operador logado, volta para o login */
   const operador = Armazenamento.ler("operador");
   if (!operador) { window.location.replace("../index.html"); return; }

   const $ = function (id) { return document.getElementById(id); };
   document.querySelector(".cabecalho h1").textContent = DADOS.condominio;

   const TIPO_AVISO = "Aviso do condomínio";

   /* Como cada seção aparece na lista.
      "morador: true" = seção com apto, nome e botão de WhatsApp. */
   function detalhesMorador(r) {
      const d = ["Morador: " + r.nome + (r.avulso ? " (não cadastrado)" : "")];
      d.push(r.tipo === TIPO_AVISO ? "Tipo: " + r.tipo : "Tipo: " + r.tipo + " · Qtd: " + (r.qtd || 1));
      if (r.descricao) d.push(r.descricao);
      return d;
   }
   function tituloMorador(r) { return "Apto " + r.apto; }

   const SECOES = {
      entregas:        { morador: true, titulo: tituloMorador, detalhes: detalhesMorador },
      correspondencias:{ morador: true, titulo: tituloMorador, detalhes: detalhesMorador },
      /* Sem "morador: true" = sem botão de WhatsApp */
      recolhimentos:   { titulo: tituloMorador, detalhes: detalhesMorador },
      ocorrencias: {
         titulo: function (r) { return r.tipo; },
         detalhes: function (r) { return [r.descricao]; }
      },
      observacoes: {
         titulo: function (r) { return r.titulo; },
         detalhes: function (r) { return [r.descricao]; }
      },
      prestadores: {
         titulo: function (r) { return r.empresa; },
         detalhes: function (r) { return ["Prestador: " + r.nome, "Serviço: " + r.servico]; }
      },
      avisos: {
         titulo: function (r) { return r.assunto; },
         detalhes: function (r) { return ["Para: " + r.destino, r.descricao]; }
      }
   };

   /* ---------- Estado salvo ---------- */
   function dataHoje() {
      const d = new Date();
      const dois = function (n) { return String(n).padStart(2, "0"); };
      return d.getFullYear() + "-" + dois(d.getMonth() + 1) + "-" + dois(d.getDate());
   }
   function horaAgora() {
      return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
   }
   function plantaoVazio() {
      const p = { data: dataHoje(), saindo: "", entrando: "" };
      Object.keys(SECOES).forEach(function (s) { p[s] = []; });
      return p;
   }

   let plantao = Object.assign(plantaoVazio(), Armazenamento.ler("plantao") || {});
   function salvar() { Armazenamento.salvar("plantao", plantao); }

   /* ---------- Avisos na tela ---------- */
   let temporizador;
   function avisar(texto) {
      const el = $("aviso");
      el.textContent = texto;
      el.hidden = false;
      clearTimeout(temporizador);
      temporizador = setTimeout(function () { el.hidden = true; }, 3000);
   }

   /* ---------- Preenchimento dos selects ---------- */
   function preencher(select, itens, valorDe, textoDe) {
      itens.forEach(function (item) {
         const op = document.createElement("option");
         op.value = valorDe(item);
         op.textContent = textoDe(item);
         select.appendChild(op);
      });
   }

   function iniciarSelects() {
      const porteiro = function (p) { return p.valor; };
      const nome = function (p) { return p.nome; };
      preencher($("porteiro-saindo"), DADOS.porteiros, porteiro, nome);
      preencher($("porteiro-entrando"), DADOS.porteiros, porteiro, nome);

      const igual = function (x) { return x; };
      const aptos = (DADOS.apartamentos && DADOS.apartamentos.length)
         ? DADOS.apartamentos
         : Array.from(new Set(DADOS.moradores.map(function (m) { return m.apto; })))
              .sort(function (a, b) { return a.localeCompare(b, "pt-BR", { numeric: true }); });
      document.querySelectorAll('select[name="apto"]').forEach(function (s) { preencher(s, aptos, igual, igual); });
      document.querySelectorAll("select[data-tipos]").forEach(function (s) {
         preencher(s, DADOS[s.dataset.tipos] || [], igual, igual);
      });
   }

   /* Sugestões de nome conforme o apto (um conjunto por formulário) */
   function iniciarMoradores(form) {
      const lista = form.querySelector("datalist");
      if (!lista) return;
      const apto = form.elements.apto;
      const nome = form.elements.nome;

      function atualizar() {
         lista.replaceChildren();
         const encontrados = DADOS.moradores.filter(function (m) {
            return !apto.value || m.apto === apto.value;
         });
         encontrados.forEach(function (m) {
            const op = document.createElement("option");
            op.value = m.nome;
            lista.appendChild(op);
         });
         if (apto.value && encontrados.length === 1) {
            nome.value = encontrados[0].nome;
         }
      }
      apto.addEventListener("change", atualizar);
      form.addEventListener("reset", function () { setTimeout(atualizar, 0); });
   }

   /* ---------- Desenho das listas ---------- */
   function botao(texto, classe, aoClicar) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn--mini " + classe;
      b.textContent = texto;
      b.addEventListener("click", aoClicar);
      return b;
   }

   function desenhar(secao) {
      const cfg = SECOES[secao];
      const ul = $("lista-" + secao);
      ul.replaceChildren();

      plantao[secao].slice().reverse().forEach(function (r) {
         const li = document.createElement("li");
         li.className = "registro";

         const corpo = document.createElement("div");
         corpo.className = "registro__corpo";

         const topo = document.createElement("strong");
         topo.textContent = cfg.titulo(r);
         const hora = document.createElement("span");
         hora.className = "registro__hora";
         hora.textContent = r.hora;
         topo.appendChild(hora);
         corpo.appendChild(topo);

         cfg.detalhes(r).forEach(function (linha) {
            const p = document.createElement("p");
            p.textContent = linha;
            corpo.appendChild(p);
         });

         const acoes = document.createElement("div");
         acoes.className = "registro__acoes";
         if (cfg.morador) {
            acoes.appendChild(botao("WhatsApp", "btn--sucesso", function () { enviar(secao, r); }));
         }
         acoes.appendChild(botao("Remover", "btn--perigo", function () { remover(secao, r.id); }));

         li.append(corpo, acoes);
         ul.appendChild(li);
      });

      $("contador-" + secao).textContent = plantao[secao].length;
   }

   function desenharTudo() { Object.keys(SECOES).forEach(desenhar); }

   function remover(secao, id) {
      plantao[secao] = plantao[secao].filter(function (r) { return r.id !== id; });
      salvar();
      desenhar(secao);
   }

   /* ---------- WhatsApp ---------- */
   function enviar(secao, registro) {
      const texto = secao === "correspondencias"
         ? Whats.mensagemCorrespondencia(registro, operador)
         : Whats.mensagemEntrega(registro, operador);
      Whats.abrir(registro.telefone, texto);
   }

   /* ---------- Formulários de registro ---------- */
   let enviarApos = false;

   function normalizarTelefone(valor) {
      const numeros = String(valor || "").replace(/\D/g, "");
      return (numeros.length === 10 || numeros.length === 11) ? "55" + numeros : numeros;
   }

   function coletar(secao, form) {
      const dados = Object.fromEntries(new FormData(form));
      Object.keys(dados).forEach(function (k) { dados[k] = String(dados[k]).trim(); });
      if (SECOES[secao].morador) {
         const m = DADOS.moradores.find(function (x) {
            return x.apto === dados.apto &&
                   x.nome.toLowerCase() === dados.nome.toLowerCase();
         });
         if (form.classList.contains("formulario-avulso")) {
            dados.avulso = true;
            dados.telefone = normalizarTelefone(dados.telefone);
         } else {
            dados.telefone = m ? m.telefone : "";
         }
         dados.data = dataHoje();
         dados.porteiro = operador.nome;
      }
      return Object.assign({ id: Date.now() + Math.random(), hora: horaAgora() }, dados);
   }

   document.querySelectorAll("form[data-secao]").forEach(function (form) {
      const secao = form.dataset.secao;
      iniciarMoradores(form);

      form.addEventListener("submit", function (ev) {
         ev.preventDefault();
         const registro = coletar(secao, form);

         if (secao === "correspondencias" && registro.tipo === TIPO_AVISO && !registro.descricao) {
            avisar("Escreva o texto do aviso no campo de descrição.");
            form.elements.descricao.focus();
            enviarApos = false;
            return;
         }

         plantao[secao].push(registro);
         salvar();
         desenhar(secao);
         form.reset();
         if (form.classList.contains("formulario-avulso")) fecharAvulso(form);
         avisar("Registro adicionado.");
         if (enviarApos && SECOES[secao].morador) enviar(secao, registro);
         enviarApos = false;
      });
   });

   document.querySelectorAll("[data-enviar]").forEach(function (botaoEnviar) {
      botaoEnviar.addEventListener("click", function () {
         const form = botaoEnviar.closest("form");
         const tel = form.elements.telefone;
         if (tel && normalizarTelefone(tel.value).length < 12) {
            avisar("Informe o telefone com DDD para enviar pelo WhatsApp.");
            tel.focus();
            return;
         }
         enviarApos = true;
         if (form.checkValidity()) { form.requestSubmit(); }
         else { enviarApos = false; form.reportValidity(); }
      });
   });

   /* Morador não cadastrado: o formulário só aparece ao clicar no botão */
   function botaoDe(form) { return document.querySelector('[aria-controls="' + form.id + '"]'); }

   function abrirAvulso(form) {
      form.hidden = false;
      botaoDe(form).setAttribute("aria-expanded", "true");
      form.elements.apto.focus();
   }
   function fecharAvulso(form) {
      form.reset();
      form.hidden = true;
      botaoDe(form).setAttribute("aria-expanded", "false");
   }

   document.querySelectorAll("[data-abrir]").forEach(function (btn) {
      btn.addEventListener("click", function () {
         const form = $(btn.dataset.abrir);
         if (form.hidden) abrirAvulso(form); else fecharAvulso(form);
      });
   });
   document.querySelectorAll("[data-fechar]").forEach(function (btn) {
      btn.addEventListener("click", function () { fecharAvulso($(btn.dataset.fechar)); });
   });

   /* ---------- Dados da troca de plantão ---------- */
   function iniciarTroca() {
      $("data-plantao").value = plantao.data;
      $("porteiro-saindo").value = plantao.saindo;
      $("porteiro-entrando").value = plantao.entrando;
   }

   $("data-plantao").addEventListener("change", function (e) { plantao.data = e.target.value; salvar(); });
   $("porteiro-saindo").addEventListener("change", function (e) { plantao.saindo = e.target.value; salvar(); });
   $("porteiro-entrando").addEventListener("change", function (e) { plantao.entrando = e.target.value; salvar(); });

   /* ---------- Barra de ações ---------- */
   $("btn-enviar-plantao").addEventListener("click", function () {
      if (!plantao.saindo || !plantao.entrando) {
         avisar("Informe o porteiro saindo e o entrando antes de enviar.");
         $(plantao.saindo ? "porteiro-entrando" : "porteiro-saindo").focus();
         return;
      }
      if (plantao.saindo === plantao.entrando) {
         avisar("O porteiro saindo e o entrando não podem ser a mesma pessoa.");
         return;
      }
      Whats.abrir(DADOS.whatsappRelatorio, Whats.mensagemPlantao(plantao, operador));
   });

   $("btn-limpar").addEventListener("click", function () {
      if (!window.confirm("Apagar todos os registros deste plantão? Essa ação não pode ser desfeita.")) return;
      plantao = plantaoVazio();
      Armazenamento.remover("plantao");
      document.querySelectorAll("form[data-secao]").forEach(function (f) { f.reset(); });
      document.querySelectorAll(".formulario-avulso").forEach(fecharAvulso);
      iniciarTroca();
      desenharTudo();
      avisar("Plantão limpo.");
   });

   $("btn-sair").addEventListener("click", function () {
      Armazenamento.remover("operador");
      window.location.href = "../index.html";
   });

   /* ---------- Início ---------- */
   $("operador-nome").textContent = operador.nome;
   iniciarSelects();
   iniciarTroca();
   desenharTudo();
})();
