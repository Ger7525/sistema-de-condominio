/* Monta as mensagens e abre o WhatsApp. */
const Whats = (function () {
   "use strict";


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

   /* ---------- Aviso de entrega (para o morador) ---------- */
   function mensagemEntrega(item, operador) {
      const qtd = item.qtd || 1;
      const quando = item.data ? formatarData(item.data) + " às " + item.hora : item.hora;

      let msg = `*AVISO DE ENTREGA*\n`;
      msg += `*${DADOS.condominio}*\n\n`;
      msg += `Olá, *${item.nome}* (Apto ${item.apto})!\n`;
      msg += `Informamos que chegou uma entrega para você na portaria:\n\n`;
      msg += `*Tipo:* ${item.tipo}\n`;
      msg += `*Quantidade:* ${qtd} unidade(s)\n`;
      if (item.descricao) msg += `*Detalhes:* ${item.descricao}\n`;
      msg += `*Registrado por:* ${item.porteiro || operador.nome}\n`;
      msg += `*Data/Hora:* ${quando}\n\n`;
      msg += `Por favor, retire na portaria assim que possível. Tenha um ótimo dia!`;
      return msg;
   }

   /* ---------- Correspondências e avisos (para o morador) ----------
      Cada tipo tem a sua mensagem. Os nomes das chaves precisam ser
      iguais aos de tiposCorrespondencia em dados.js. */
   const MODELOS_CORRESPONDENCIA = {
      "Carta": {
         assunto: "AVISO DE CORRESPONDÊNCIA",
         texto: "Informamos que chegou uma carta em seu nome na portaria.",
         unidade: "carta(s)",
         fecho: "Por favor, retire na portaria assim que possível."
      },
      "Boleto do condomínio": {
         assunto: "BOLETO DO CONDOMÍNIO",
         texto: "Informamos que o boleto do condomínio está disponível na portaria para retirada.",
         unidade: "boleto(s)",
         fecho: "Confira o valor e a data de vencimento no próprio boleto. Em caso de dúvidas, procure a administração."
      },
      "Boleto do gás": {
         assunto: "BOLETO DO GÁS",
         texto: "Informamos que chegou na portaria o boleto do gás referente à sua unidade.",
         unidade: "boleto(s)",
         fecho: "Por favor, retire na portaria e confira o valor e o vencimento no próprio boleto."
      },
      "Boleto Neoenergia": {
         assunto: "BOLETO NEOENERGIA",
         texto: "Informamos que chegou na portaria a fatura de energia elétrica (Neoenergia) em seu nome.",
         unidade: "fatura(s)",
         fecho: "Por favor, retire na portaria e confira o valor e o vencimento no próprio boleto."
      },
      "Aviso do condomínio": {
         assunto: "AVISO DO CONDOMÍNIO",
         texto: "Informamos que há um aviso do condomínio para você:",
         aviso: true,
         fecho: "Em caso de dúvidas, procure a administração."
      }
   };

   const MODELO_PADRAO = {
      assunto: "AVISO DE CORRESPONDÊNCIA",
      texto: "Informamos que chegou uma correspondência para você na portaria.",
      unidade: "item(ns)",
      fecho: "Por favor, retire na portaria assim que possível."
   };

   function mensagemCorrespondencia(item, operador) {
      const modelo = MODELOS_CORRESPONDENCIA[item.tipo] || MODELO_PADRAO;
      const quando = item.data ? formatarData(item.data) + " às " + item.hora : item.hora;

      let msg = `*${modelo.assunto}*\n`;
      msg += `*${DADOS.condominio}*\n\n`;
      msg += `Olá, *${item.nome}* (Apto ${item.apto})!\n`;
      msg += `${modelo.texto}\n\n`;
      if (modelo.aviso) {
         msg += `${item.descricao}\n\n`;
      } else {
         msg += `*Tipo:* ${item.tipo}\n`;
         msg += `*Quantidade:* ${item.qtd || 1} ${modelo.unidade}\n`;
         if (item.descricao) msg += `*Detalhes:* ${item.descricao}\n`;
      }
      msg += `*Registrado por:* ${item.porteiro || operador.nome}\n`;
      msg += `*Data/Hora:* ${quando}\n\n`;
      msg += `${modelo.fecho} Tenha um ótimo dia!`;
      return msg;
   }

   /* ---------- Passagem de plantão (relatório completo) ---------- */
   function secao(titulo, itens, formatar) {
      let msg = `\n*${titulo} (${itens.length})*\n`;
      if (!itens.length) return msg + `Nenhum registro.\n`;
      itens.forEach(function (item, i) {
         msg += `${i + 1}. ${item.hora} – ${formatar(item)}\n`;
      });
      return msg;
   }

   function mensagemPlantao(p, operador) {
      let msg = `*PASSAGEM DE PLANTÃO*\n`;
      msg += `*${DADOS.condominio}*\n\n`;
      msg += `*Data:* ${formatarData(p.data)}\n`;
      msg += `*Operador:* ${operador.nome}\n`;
      msg += `*Porteiro saindo:* ${nomePorteiro(p.saindo)}\n`;
      msg += `*Porteiro entrando:* ${nomePorteiro(p.entrando)}\n`;

      msg += secao("ENTREGAS", p.entregas, function (e) {
         return `*Apto ${e.apto}* – ${e.nome} – ${e.tipo} (${e.qtd || 1} un.)` +
            (e.descricao ? ` – ${e.descricao}` : "");
      });
      msg += secao("CORRESPONDÊNCIAS E AVISOS", p.correspondencias || [], function (c) {
         const aviso = c.tipo === "Aviso do condomínio";
         return `*Apto ${c.apto}* – ${c.nome} – ${c.tipo}` +
            (aviso ? "" : ` (${c.qtd || 1} un.)`) +
            (c.descricao ? ` – ${c.descricao}` : "");
      });
      msg += secao("ENTREGAS E ENCOMENDAS A RECOLHER", p.recolhimentos || [], function (r) {
         return `*Apto ${r.apto}* – ${r.nome} – ${r.tipo} (${r.qtd || 1} un.)` +
            (r.descricao ? ` – ${r.descricao}` : "");
      });
      msg += secao("OCORRÊNCIAS", p.ocorrencias, function (o) {
         return `*${o.tipo}:* ${o.descricao}`;
      });
      msg += secao("OBSERVAÇÕES", p.observacoes, function (o) {
         return `*${o.titulo}:* ${o.descricao}`;
      });
      msg += secao("PRESTADORES DE SERVIÇO", p.prestadores, function (s) {
         return `*${s.empresa}* – ${s.nome} – ${s.servico}`;
      });
      msg += secao("AVISOS", p.avisos || [], function (a) {
         return `*${a.assunto}* (para: ${a.destino}): ${a.descricao}`;
      });

      msg += `\nBom plantão a todos!`;
      return msg;
   }

   return { abrir, formatarData, nomePorteiro, mensagemEntrega, mensagemCorrespondencia, mensagemPlantao };
})();
