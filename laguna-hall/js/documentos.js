/* Monta os PDFs (plantão e ocorrência de morador) e envia / baixa. */
const Documentos = (function () {
   "use strict";

   function limpoNome(txt) { return String(txt).replace(/[^\w.-]+/g, "-"); }

   function pdfPlantao(p, operador) {
      const d = Pdf.criar(DADOS.condominio + " · Passagem de plantão");
      d.faixa(DADOS.condominio, "Passagem de plantão");
      d.campos([
         ["Data", Whats.formatarData(p.data)],
         ["Operador", operador.nome],
         ["Porteiro saindo", Whats.nomePorteiro(p.saindo)],
         ["Porteiro entrando", Whats.nomePorteiro(p.entrando)]
      ], 2);
      Whats.estruturaPlantao(p).forEach(function (s, i) {
         d.secao((i + 1) + ". " + s.titulo + " (" + s.total + ")");
         if (!s.total) d.nada("Nenhum registro.");
         s.grupos.forEach(function (g) {
            if (g.rotulo) d.grupo(g.rotulo + "  ·  " + g.itens.length + (g.itens.length === 1 ? " registro" : " registros"));
            g.itens.forEach(function (it) {
               d.registro(it.hora + "  |  " + it.partes.join("  |  "), it.detalhes);
               if (it.assinatura) d.imagem(it.assinatura, 170, 52, 22);
            });
         });
         d.espaco(8);
      });
      return d.gerar();
   }

   function pdfOcorrenciaMorador(r, operador) {
      const d = Pdf.criar(DADOS.condominio + " · Ocorrência de morador");
      d.faixa(DADOS.condominio, "Registro de ocorrência de morador");
      d.campos([
         ["Apartamento", r.apto],
         ["Morador", r.nome],
         ["Data", Whats.formatarData(r.data)],
         ["Hora", r.hora],
         ["Registrado por", r.porteiro || operador.nome]
      ], 2);
      d.secao("Ocorrência");
      d.paragrafo(r.descricao);
      d.espaco(18);
      d.secao("Assinatura do morador");
      if (r.assinatura) d.imagem(r.assinatura, 280, 90, 0);
      d.assinaturaLinha(r.nome + " · Apto " + r.apto);
      return d.gerar();
   }

   function baixar(bytes, nome) {
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url; a.download = nome;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
   }

   /* Celular: abre o compartilhamento (escolha o WhatsApp) com o PDF anexado.
      Computador: baixa o PDF e abre o WhatsApp para você anexá-lo. */
   function enviar(bytes, nomeArquivo, texto, telefone) {
      const nome = limpoNome(nomeArquivo);
      const arquivo = (typeof File === "function") ? new File([bytes], nome, { type: "application/pdf" }) : null;

      function baixarEAbrir() {
         baixar(bytes, nome);
         Whats.abrir(telefone, texto + "\n\nO arquivo " + nome + " foi gerado. Anexe-o a esta conversa.");
         return "baixado";
      }

      if (arquivo && navigator.canShare && navigator.canShare({ files: [arquivo] })) {
         return navigator.share({ files: [arquivo], title: nome, text: texto })
            .then(function () { return "compartilhado"; })
            .catch(function (e) { return (e && e.name === "AbortError") ? "cancelado" : baixarEAbrir(); });
      }
      return Promise.resolve(baixarEAbrir());
   }

   return { plantao: pdfPlantao, ocorrenciaMorador: pdfOcorrenciaMorador, enviar, nomeArquivo: limpoNome };
})();
