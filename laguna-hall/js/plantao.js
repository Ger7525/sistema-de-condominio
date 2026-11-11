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
   /* Versões usadas dentro do grupo do apartamento (o apto já está no cabeçalho) */
   function tituloItem(r) { return r.nome + (r.avulso ? " (não cadastrado)" : ""); }
   function detalhesItem(r) { return detalhesMorador(r).slice(1); }
   function retiradaLinha(r) { return "Retirado por: " + r.retiradoPor + " · " + r.horaRetirada; }
   function detalhesEntregue(r) { return detalhesMorador(r).concat([retiradaLinha(r)]); }

   const SECOES = {
      /* agrupar: true = um cartão por apartamento, em ordem (ver prioridadeApartamentos em dados.js) */
      entregas:        { agrupar: true, morador: true, entregar: true, titulo: tituloMorador, detalhes: detalhesMorador,
                         tituloItem: tituloItem, detalhesItem: detalhesItem },
      entregues:       { agrupar: true, desfazer: true, titulo: tituloMorador, detalhes: detalhesEntregue,
                         tituloItem: tituloItem, detalhesItem: function (r) { return detalhesItem(r).concat([retiradaLinha(r)]); } },
      correspondencias:{ agrupar: true, morador: true, titulo: tituloMorador, detalhes: detalhesMorador,
                         tituloItem: tituloItem, detalhesItem: detalhesItem },
      /* Sem "morador: true" = sem botão de WhatsApp */
      recolhimentos:   { agrupar: true, titulo: tituloMorador, detalhes: detalhesMorador,
                         tituloItem: tituloItem, detalhesItem: detalhesItem },
      ocorrenciasMoradores: {
         agrupar: true,
         documento: true,
         titulo: function (r) { return "Apto " + r.apto + " · " + r.nome; },
         detalhes: function (r) { return [r.descricao]; },
         tituloItem: function (r) { return r.nome; },
         detalhesItem: function (r) { return [r.descricao]; }
      },
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

   function criarRegistro(secao, r, agrupado) {
      const cfg = SECOES[secao];
      const li = document.createElement("li");
      li.className = "registro";

      const corpo = document.createElement("div");
      corpo.className = "registro__corpo";

      const topo = document.createElement("strong");
      topo.textContent = agrupado ? cfg.tituloItem(r) : cfg.titulo(r);
      const hora = document.createElement("span");
      hora.className = "registro__hora";
      hora.textContent = r.hora;
      topo.appendChild(hora);
      corpo.appendChild(topo);

      (agrupado ? cfg.detalhesItem(r) : cfg.detalhes(r)).forEach(function (linha) {
         const p = document.createElement("p");
         p.textContent = linha;
         corpo.appendChild(p);
      });

      if (r.assinatura) {
         const img = document.createElement("img");
         img.className = "registro__assinatura";
         img.src = r.assinatura;
         img.alt = "Assinatura de " + r.nome;
         corpo.appendChild(img);
      }

      const acoes = document.createElement("div");
      acoes.className = "registro__acoes";
      if (cfg.morador) {
         acoes.appendChild(botao("WhatsApp", "btn--sucesso", function () { enviar(secao, r); }));
      }
      let caixaRetirada = null;
      if (cfg.entregar) {
         caixaRetirada = criarCaixaRetirada(r);
         acoes.appendChild(botao("Entregar", "btn--principal", function () {
            caixaRetirada.hidden = !caixaRetirada.hidden;
            if (!caixaRetirada.hidden) caixaRetirada.querySelector("input").focus();
         }));
      }
      if (cfg.desfazer) {
         acoes.appendChild(botao("Desfazer", "btn--secundario", function () { desfazerEntrega(r); }));
      }
      if (cfg.documento) {
         acoes.appendChild(botao("WhatsApp", "btn--sucesso", function () { enviarOcorrenciaMorador(r); }));
         acoes.appendChild(botao("PDF", "btn--principal", function () { enviarPdfOcorrencia(r); }));
      }
      acoes.appendChild(botao("Remover", "btn--perigo", function () { remover(secao, r.id); }));

      li.append(corpo, acoes);
      if (caixaRetirada) li.appendChild(caixaRetirada);
      return li;
   }

   function criarGrupo(secao, g) {
      const li = document.createElement("li");
      li.className = "grupo";

      const cab = document.createElement("div");
      cab.className = "grupo__cabecalho";
      const titulo = document.createElement("strong");
      titulo.textContent = "Apto " + g.apto;
      const total = document.createElement("span");
      total.className = "grupo__total";
      total.textContent = g.itens.length + (g.itens.length === 1 ? " registro" : " registros");
      cab.append(titulo, total);

      const itens = document.createElement("ul");
      itens.className = "grupo__itens";
      g.itens.forEach(function (r) { itens.appendChild(criarRegistro(secao, r, true)); });

      li.append(cab, itens);
      return li;
   }

   function desenhar(secao) {
      const cfg = SECOES[secao];
      const ul = $("lista-" + secao);
      ul.replaceChildren();

      if (cfg.agrupar) {
         Whats.agruparPorApto(plantao[secao]).forEach(function (g) { ul.appendChild(criarGrupo(secao, g)); });
      } else {
         plantao[secao].slice().reverse().forEach(function (r) { ul.appendChild(criarRegistro(secao, r, false)); });
      }

      $("contador-" + secao).textContent = plantao[secao].length;
   }

   function desenharTudo() { Object.keys(SECOES).forEach(desenhar); }

   function remover(secao, id) {
      plantao[secao] = plantao[secao].filter(function (r) { return r.id !== id; });
      salvar();
      desenhar(secao);
   }

   /* ---------- Entregar: registra quem retirou e move para a lista de retiradas ---------- */
   function criarCaixaRetirada(r) {
      const caixa = document.createElement("div");
      caixa.className = "retirada";
      caixa.hidden = true;

      const campo = document.createElement("div");
      campo.className = "campo";
      const idCampo = "retirada-" + String(r.id).replace(/\D/g, "");
      const rotulo = document.createElement("label");
      rotulo.htmlFor = idCampo;
      rotulo.textContent = "Quem retirou a entrega?";
      const entrada = document.createElement("input");
      entrada.type = "text";
      entrada.id = idCampo;
      entrada.maxLength = 80;
      entrada.placeholder = "Nome de quem retirou";
      entrada.autocomplete = "off";
      campo.append(rotulo, entrada);

      function confirmar() {
         const nome = entrada.value.trim();
         if (!nome) { avisar("Informe o nome de quem retirou."); entrada.focus(); return; }
         entregarItem(r, nome);
      }
      entrada.addEventListener("keydown", function (e) {
         if (e.key === "Enter") { e.preventDefault(); confirmar(); }
      });

      caixa.append(
         campo,
         botao("Confirmar", "btn--sucesso", confirmar),
         botao("Cancelar", "btn--secundario", function () { entrada.value = ""; caixa.hidden = true; })
      );
      return caixa;
   }

   function entregarItem(r, nome) {
      plantao.entregas = plantao.entregas.filter(function (x) { return x.id !== r.id; });
      plantao.entregues.push(Object.assign({}, r, {
         retiradoPor: nome,
         dataRetirada: dataHoje(),
         horaRetirada: horaAgora()
      }));
      salvar();
      desenhar("entregas");
      desenhar("entregues");
      avisar("Entrega registrada como retirada.");
   }

   function desfazerEntrega(r) {
      plantao.entregues = plantao.entregues.filter(function (x) { return x.id !== r.id; });
      const original = Object.assign({}, r);
      delete original.retiradoPor;
      delete original.dataRetirada;
      delete original.horaRetirada;
      plantao.entregas.push(original);
      salvar();
      desenhar("entregas");
      desenhar("entregues");
      avisar("Entrega devolvida para a lista.");
   }

   /* ---------- WhatsApp ---------- */
   function enviar(secao, registro) {
      const texto = secao === "correspondencias"
         ? Whats.mensagemCorrespondencia(registro, operador)
         : Whats.mensagemEntrega(registro, operador);
      Whats.abrir(registro.telefone, texto);
   }

   /* ---------- Ocorrências de moradores (assinatura, mensagem e PDF) ---------- */
   const pad = Assinatura.iniciar($("ocmor-assinatura"));
   const destinoOcorrencias = function () { return DADOS.whatsappOcorrencias || DADOS.whatsappRelatorio; };

   $("ocmor-limpar-assinatura").addEventListener("click", pad.limpar);
   function atualizarContagem() {
      $("ocmor-contagem").textContent = $("ocmor-descricao").value.length + " / 1000";
   }
   $("ocmor-descricao").addEventListener("input", atualizarContagem);
   $("form-ocorrenciasMoradores").addEventListener("reset", function () {
      pad.limpar();
      setTimeout(atualizarContagem, 0);
   });

   function resultadoPdf(resultado) {
      if (resultado === "baixado") avisar("PDF gerado. Anexe o arquivo na conversa do WhatsApp.");
      else if (resultado === "compartilhado") avisar("PDF compartilhado.");
   }

   function enviarOcorrenciaMorador(r) {
      Whats.abrir(destinoOcorrencias(), Whats.mensagemOcorrenciaMorador(r, operador));
   }
   function enviarPdfOcorrencia(r) {
      Documentos.enviar(
         Documentos.ocorrenciaMorador(r, operador),
         "ocorrencia-apto-" + r.apto + "-" + (r.data || dataHoje()) + ".pdf",
         Whats.mensagemOcorrenciaMorador(r, operador),
         destinoOcorrencias()
      ).then(resultadoPdf);
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
      if (secao === "ocorrenciasMoradores") {
         dados.data = dataHoje();
         dados.porteiro = operador.nome;
         dados.assinatura = pad.imagem();
      }
      return Object.assign({ id: Date.now() + Math.random(), hora: horaAgora() }, dados);
   }

   document.querySelectorAll("form[data-secao]").forEach(function (form) {
      const secao = form.dataset.secao;
      iniciarMoradores(form);

      form.addEventListener("submit", function (ev) {
         ev.preventDefault();
         if (secao === "ocorrenciasMoradores" && pad.vazio()) {
            avisar("Peça ao morador para assinar no quadro.");
            enviarApos = false;
            return;
         }
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
         const modo = enviarApos;
         enviarApos = false;
         if (modo) {
            if (secao === "ocorrenciasMoradores") {
               if (modo === "pdf") enviarPdfOcorrencia(registro); else enviarOcorrenciaMorador(registro);
            } else if (SECOES[secao].morador) {
               enviar(secao, registro);
            }
         }
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
         enviarApos = botaoEnviar.dataset.enviar || "whats";
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
   function plantaoPronto() {
      if (!plantao.saindo || !plantao.entrando) {
         avisar("Informe o porteiro saindo e o entrando antes de enviar.");
         $(plantao.saindo ? "porteiro-entrando" : "porteiro-saindo").focus();
         return false;
      }
      if (plantao.saindo === plantao.entrando) {
         avisar("O porteiro saindo e o entrando não podem ser a mesma pessoa.");
         return false;
      }
      return true;
   }

   $("btn-enviar-plantao").addEventListener("click", function () {
      if (!plantaoPronto()) return;
      Whats.abrir(DADOS.whatsappRelatorio, Whats.mensagemPlantao(plantao, operador));
   });

   $("btn-enviar-plantao-pdf").addEventListener("click", function () {
      if (!plantaoPronto()) return;
      Documentos.enviar(
         Documentos.plantao(plantao, operador),
         "plantao-" + plantao.data + ".pdf",
         "Passagem de plantão – " + DADOS.condominio + " – " + Whats.formatarData(plantao.data),
         DADOS.whatsappRelatorio
      ).then(resultadoPdf);
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
