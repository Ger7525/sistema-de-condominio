(function () {
   "use strict";
   document.querySelector(".cabecalho h1").textContent = DADOS.condominio;
   const form = document.getElementById("form-login");
   const select = document.getElementById("porteiro");
   const erro = document.getElementById("erro-login");

   DADOS.porteiros.forEach(function (p) {
      const op = document.createElement("option");
      op.value = p.valor;
      op.textContent = p.nome;
      select.appendChild(op);
   });

   const atual = Armazenamento.ler("operador");
   if (atual) select.value = atual.valor;

   select.addEventListener("change", function () { erro.hidden = true; });

   form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      const porteiro = DADOS.porteiros.find(function (p) { return p.valor === select.value; });
      if (!porteiro) {
         erro.hidden = false;
         select.focus();
         return;
      }
      Armazenamento.salvar("operador", porteiro);
      window.location.href = "pages/plantao.html";
   });
})();
