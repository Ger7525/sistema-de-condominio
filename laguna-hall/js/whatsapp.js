/* Monta as mensagens e abre o WhatsApp.
   Todas seguem a mesma organização: cabeçalho, blocos com título em negrito
   e rodapé separados por uma linha. */
const Whats = (function () {
   "use strict";

   const LINHA = "--------------------------------";

   function abrir(telefone, texto) {
      const numero = String(telefone || "").replace(/\D/g, "");
      const base = numero ? "https://wa.me/" + numero : "https://wa.me/";
      window.open(base + "?text=" + encodeURIComponent(texto), "_blank", "noopener");
   }

   function formatarData(iso) {
      if (!iso) return "—";
      const p = iso.split("-");
      return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : iso;
   }

   function nomePorteiro(valor) {
      const p = DADOS.porteiros.find(function (x) { return x.valor === valor; });
      return p ? p.nome : "—";
   }

   function quando(item) {
      return item.data ? formatarData(item.data) + " às " + item.hora : item.hora;
   }

   /* ---------- Peças das mensagens ---------- */
   function cabecalho(titulo) {
      return "*" + DADOS.condominio.toUpperCase() + "*\n" + titulo + "\n" + LINHA + "\n\n";
   }
   function bloco(titulo, linhas) {
      return "*" + titulo + "*\n" + linhas.filter(Boolean).join("\n") + "\n\n";
   }
   function rodape(texto) { return LINHA + "\n" + texto; }

   function blocoRegistro(item, operador) {
      return bloco("REGISTRO", [
         "Registrado por: " + (item.porteiro || operador.nome),
         "Data/Hora: " + quando(item)
      ]);
   }

   /* ---------- Aviso de entrega (para o morador) ---------- */
   function mensagemEntrega(item, operador) {
      let msg = cabecalho("Aviso de entrega");
      msg += "Olá, *" + item.nome + "* (Apto " + item.apto + ").\n";
      msg += "Informamos que chegou uma entrega para você na portaria.\n\n";
      msg += bloco("DETALHES", [
         "Tipo: " + item.tipo,
         "Quantidade: " + (item.qtd || 1) + " unidade(s)",
         item.descricao ? "Descrição: " + item.descricao : ""
      ]);
      msg += blocoRegistro(item, operador);
      msg += rodape("Por favor, retire na portaria assim que possível. Tenha um ótimo dia!");
      return msg;
   }

   /* ---------- Correspondências e avisos (para o morador) ----------
      Cada tipo tem a sua mensagem. Os nomes das chaves precisam ser
      iguais aos de tiposCorrespondencia em dados.js. */
   const MODELOS_CORRESPONDENCIA = {
      "Carta": {
         titulo: "Aviso de correspondência",
         texto: "Informamos que chegou uma carta em seu nome na portaria.",
         unidade: "carta(s)",
         fecho: "Por favor, retire na portaria assim que possível."
      },
      "Boleto do condomínio": {
         titulo: "Boleto do condomínio",
         texto: "Informamos que o boleto do condomínio está disponível na portaria para retirada.",
         unidade: "boleto(s)",
         fecho: "Confira o valor e a data de vencimento no próprio boleto. Em caso de dúvidas, procure a administração."
      },
      "Boleto do gás": {
         titulo: "Boleto do gás",
         texto: "Informamos que chegou na portaria o boleto do gás referente à sua unidade.",
         unidade: "boleto(s)",
         fecho: "Por favor, retire na portaria e confira o valor e o vencimento no próprio boleto."
      },
      "Boleto Neoenergia": {
         titulo: "Boleto Neoenergia",
         texto: "Informamos que chegou na portaria a fatura de energia elétrica (Neoenergia) em seu nome.",
         unidade: "fatura(s)",
         fecho: "Por favor, retire na portaria e confira o valor e o vencimento no próprio boleto."
      },
      "Aviso do condomínio": {
         titulo: "Aviso do condomínio",
         texto: "Informamos que há um aviso do condomínio para você.",
         aviso: true,
         fecho: "Em caso de dúvidas, procure a administração."
      }
   };

   const MODELO_PADRAO = {
      titulo: "Aviso de correspondência",
      texto: "Informamos que chegou uma correspondência para você na portaria.",
      unidade: "item(ns)",
      fecho: "Por favor, retire na portaria assim que possível."
   };

   function mensagemCorrespondencia(item, operador) {
      const modelo = MODELOS_CORRESPONDENCIA[item.tipo] || MODELO_PADRAO;
      let msg = cabecalho(modelo.titulo);
      msg += "Olá, *" + item.nome + "* (Apto " + item.apto + ").\n" + modelo.texto + "\n\n";
      if (modelo.aviso) {
         msg += bloco("AVISO", [item.descricao]);
      } else {
         msg += bloco("DETALHES", [
            "Tipo: " + item.tipo,
            "Quantidade: " + (item.qtd || 1) + " " + modelo.unidade,
            item.descricao ? "Descrição: " + item.descricao : ""
         ]);
      }
      msg += blocoRegistro(item, operador);
      msg += rodape(modelo.fecho + " Tenha um ótimo dia!");
      return msg;
   }

   /* ---------- Ocorrência de morador (para a administração) ---------- */
   function mensagemOcorrenciaMorador(r, operador) {
      let msg = cabecalho("Ocorrência de morador");
      msg += bloco("MORADOR", ["Apartamento: " + r.apto, "Nome: " + r.nome]);
      msg += bloco("OCORRÊNCIA", [r.descricao]);
      msg += blocoRegistro(r, operador);
      msg += rodape("Assinatura do morador colhida na portaria.");
      return msg;
   }

   /* ---------- Ordem e agrupamento por apartamento ---------- */
   function posicaoPrioridade(apto) {
      return (DADOS.prioridadeApartamentos || []).map(String).indexOf(String(apto));
   }

   function compararApto(a, b) {
      const pa = posicaoPrioridade(a), pb = posicaoPrioridade(b);
      if (pa >= 0 || pb >= 0) {
         if (pa < 0) return 1;
         if (pb < 0) return -1;
         return pa - pb;
      }
      return String(a).localeCompare(String(b), "pt-BR", { numeric: true });
   }

   /* Junta os registros do mesmo apartamento e ordena os apartamentos.
      Dentro de cada apartamento, mantém a ordem em que foram registrados. */
   function agruparPorApto(itens) {
      const mapa = new Map();
      itens.forEach(function (r) {
         const apto = String(r.apto).trim();
         const chave = apto.toLowerCase();
         if (!mapa.has(chave)) mapa.set(chave, { apto: apto, itens: [] });
         mapa.get(chave).itens.push(r);
      });
      return Array.from(mapa.values()).sort(function (x, y) { return compararApto(x.apto, y.apto); });
   }

   /* ---------- Passagem de plantão ----------
      estruturaPlantao() também alimenta o PDF do plantão. */
   function estruturaPlantao(p) {
      const un = function (r) { return (r.qtd || 1) + " un."; };
      const tipoQtd = function (r) { return r.tipo + " (" + un(r) + ")"; };
      const pacote = function (r) { return [[r.nome], [tipoQtd(r), r.descricao]]; };
      /* [título, lista, como montar cada item, agrupar por apartamento?] */
      const defs = [
         ["ENTREGAS AGUARDANDO RETIRADA", p.entregas, pacote, true],
         ["ENTREGAS RETIRADAS", p.entregues, function (r) {
            return [[r.nome], [tipoQtd(r), r.descricao, "Retirado por: " + r.retiradoPor + " às " + r.horaRetirada]];
         }, true],
         ["ENTREGAS E ENCOMENDAS A RECOLHER", p.recolhimentos, pacote, true],
         ["CORRESPONDÊNCIAS E AVISOS", p.correspondencias, function (r) {
            const aviso = r.tipo === "Aviso do condomínio";
            return [[r.nome], [aviso ? r.tipo : tipoQtd(r), r.descricao]];
         }, true],
         ["OCORRÊNCIAS DE MORADORES", p.ocorrenciasMoradores, function (r) { return [[r.nome], [r.descricao]]; }, true],
         ["OCORRÊNCIAS", p.ocorrencias, function (r) { return [[r.tipo], [r.descricao]]; }, false],
         ["OBSERVAÇÕES", p.observacoes, function (r) { return [[r.titulo], [r.descricao]]; }, false],
         ["PRESTADORES DE SERVIÇO", p.prestadores, function (r) { return [[r.empresa, r.nome], [r.servico]]; }, false],
         ["AVISOS", p.avisos, function (r) { return [[r.assunto], ["Para: " + r.destino, r.descricao]]; }, false]
      ];
      return defs.map(function (d) {
         const lista = d[1] || [];
         const montar = function (r) {
            const partes = d[2](r);
            return { hora: r.hora, partes: partes[0], detalhes: partes[1].filter(Boolean), assinatura: r.assinatura || "" };
         };
         const grupos = d[3]
            ? agruparPorApto(lista).map(function (g) { return { rotulo: "Apto " + g.apto, itens: g.itens.map(montar) }; })
            : [{ rotulo: "", itens: lista.map(montar) }];
         return { titulo: d[0], total: lista.length, grupos: grupos };
      });
   }

   function mensagemPlantao(p, operador) {
      let msg = cabecalho("Passagem de plantão");
      msg += bloco("DADOS DO PLANTÃO", [
         "Data: " + formatarData(p.data),
         "Operador: " + operador.nome,
         "Porteiro saindo: " + nomePorteiro(p.saindo),
         "Porteiro entrando: " + nomePorteiro(p.entrando)
      ]);
      estruturaPlantao(p).forEach(function (s, i) {
         const linhas = [];
         if (!s.total) linhas.push("Nenhum registro.");
         s.grupos.forEach(function (g) {
            if (g.rotulo) linhas.push("*" + g.rotulo + "* (" + g.itens.length + ")");
            const recuo = g.rotulo ? "   " : "";
            g.itens.forEach(function (it, n) {
               const topo = recuo + (n + 1) + ") " + [it.hora].concat(it.partes).join(" | ");
               linhas.push([topo].concat(it.detalhes.map(function (d) { return recuo + "    " + d; })).join("\n"));
            });
         });
         msg += bloco((i + 1) + ". " + s.titulo + " (" + s.total + ")", linhas);
      });
      msg += rodape("Bom plantão a todos!");
      return msg;
   }

   return {
      abrir, formatarData, nomePorteiro, agruparPorApto, estruturaPlantao,
      mensagemEntrega, mensagemCorrespondencia, mensagemOcorrenciaMorador, mensagemPlantao
   };
})();
