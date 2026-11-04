/* Salva, lê e apaga dados no navegador (localStorage). */
const Armazenamento = (function () {
   "use strict";
   const PREFIXO = "lagunaHall:";

   function ler(chave) {
      try {
         const bruto = localStorage.getItem(PREFIXO + chave);
         return bruto ? JSON.parse(bruto) : null;
      } catch (e) {
         return null;
      }
   }

   function salvar(chave, valor) {
      try {
         localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
         return true;
      } catch (e) {
         return false;
      }
   }

   function remover(chave) {
      try { localStorage.removeItem(PREFIXO + chave); } catch (e) { /* ignora */ }
   }

   return { ler, salvar, remover };
})();
