/* Quadro de assinatura: o morador assina com dedo, caneta ou mouse. */
const Assinatura = (function () {
   "use strict";

   function iniciar(canvas) {
      const ctx = canvas.getContext("2d");
      let desenhando = false, vazio = true, ultimo = null;

      function fundo() {
         ctx.fillStyle = "#FFFFFF";
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         ctx.strokeStyle = "#C8D0DA";           /* linha-guia */
         ctx.lineWidth = 2;
         ctx.beginPath();
         ctx.moveTo(40, canvas.height * 0.78);
         ctx.lineTo(canvas.width - 40, canvas.height * 0.78);
         ctx.stroke();
         ctx.strokeStyle = "#0A1F44";           /* traço da caneta */
         ctx.lineWidth = 4;
         ctx.lineCap = "round";
         ctx.lineJoin = "round";
      }

      function posicao(e) {
         const r = canvas.getBoundingClientRect();
         return { x: (e.clientX - r.left) * canvas.width / r.width, y: (e.clientY - r.top) * canvas.height / r.height };
      }

      canvas.addEventListener("pointerdown", function (e) {
         e.preventDefault();
         canvas.setPointerCapture(e.pointerId);
         desenhando = true;
         ultimo = posicao(e);
         ctx.beginPath();
         ctx.moveTo(ultimo.x, ultimo.y);
         ctx.lineTo(ultimo.x + 0.1, ultimo.y);
         ctx.stroke();
         vazio = false;
      });
      canvas.addEventListener("pointermove", function (e) {
         if (!desenhando) return;
         e.preventDefault();
         const p = posicao(e);
         ctx.beginPath();
         ctx.moveTo(ultimo.x, ultimo.y);
         ctx.lineTo(p.x, p.y);
         ctx.stroke();
         ultimo = p;
      });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) {
         canvas.addEventListener(ev, function () { desenhando = false; });
      });

      fundo();
      return {
         limpar: function () { fundo(); vazio = true; },
         vazio: function () { return vazio; },
         imagem: function () { return canvas.toDataURL("image/jpeg", 0.92); }
      };
   }

   return { iniciar };
})();
