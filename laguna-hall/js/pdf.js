/* Gerador de PDF simples (sem bibliotecas, funciona offline).
   Texto em Helvetica (acentos do português) e imagens JPEG (assinatura). */
const Pdf = (function () {
   "use strict";

   const LARG = 595.28, ALT = 841.89, M = 48;           // A4 em pontos
   const AZUL = [0.03, 0.10, 0.22], DESTAQUE = [0.03, 0.40, 0.85];
   const TEXTO = [0.10, 0.13, 0.18], CINZA = [0.42, 0.46, 0.52];
   const MAPA = { 0x2013: 0x96, 0x2014: 0x97, 0x2022: 0x95, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2026: 0x85 };

   let ctxMedida = null;
   function medir(txt, tam, neg) {
      if (typeof document !== "undefined") {
         if (!ctxMedida) ctxMedida = document.createElement("canvas").getContext("2d");
         ctxMedida.font = (neg ? "bold " : "") + tam + "px Helvetica, Arial, sans-serif";
         return ctxMedida.measureText(txt).width * 1.02;
      }
      return txt.length * tam * 0.52 * (neg ? 1.08 : 1);
   }

   function codificar(s) {
      let o = "";
      for (const ch of String(s)) {
         let c = ch.codePointAt(0);
         if (MAPA[c]) c = MAPA[c]; else if (c > 255 || c < 32) c = (c === 9 ? 32 : 63);
         const t = String.fromCharCode(c);
         o += (t === "\\" || t === "(" || t === ")") ? "\\" + t : t;
      }
      return o;
   }

   function quebrar(txt, tam, neg, larg) {
      const saida = [];
      String(txt).replace(/\r/g, "").split("\n").forEach(function (par) {
         if (!par.trim()) { saida.push(""); return; }
         let linha = "";
         par.split(/\s+/).filter(Boolean).forEach(function (pal) {
            const teste = linha ? linha + " " + pal : pal;
            if (medir(teste, tam, neg) <= larg) { linha = teste; return; }
            if (linha) { saida.push(linha); linha = ""; }
            while (medir(pal, tam, neg) > larg && pal.length > 1) {
               let i = pal.length;
               while (i > 1 && medir(pal.slice(0, i), tam, neg) > larg) i--;
               saida.push(pal.slice(0, i));
               pal = pal.slice(i);
            }
            linha = pal;
         });
         if (linha) saida.push(linha);
      });
      return saida;
   }

   function lerJpeg(dataUrl) {
      const bin = atob(dataUrl.split(",")[1]);
      const b = function (i) { return bin.charCodeAt(i); };
      let i = 2;
      while (i < bin.length) {
         if (b(i) !== 0xFF) { i++; continue; }
         const m = b(i + 1);
         if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
            return { bin: bin, h: (b(i + 5) << 8) | b(i + 6), w: (b(i + 7) << 8) | b(i + 8), comps: b(i + 9) };
         }
         i += 2 + ((b(i + 2) << 8) | b(i + 3));
      }
      throw new Error("JPEG inválido");
   }

   function criar(rodapeTexto) {
      const paginas = [[]];
      const imagens = [];
      let y = M;

      const pag = function () { return paginas[paginas.length - 1]; };
      function novaPagina() { paginas.push([]); y = M; }
      function garantir(h) { if (y + h > ALT - M - 20) novaPagina(); }

      function opTexto(x, base, s, tam, neg, cor) {
         const c = cor || TEXTO;
         return "BT " + c.join(" ") + " rg /" + (neg ? "F2" : "F1") + " " + tam + " Tf " +
            x.toFixed(2) + " " + (ALT - base).toFixed(2) + " Td (" + codificar(s) + ") Tj ET";
      }
      function texto(x, base, s, tam, neg, cor) { pag().push(opTexto(x, base, s, tam, neg, cor)); }
      function retangulo(x, topo, w, h, cor) {
         pag().push(cor.join(" ") + " rg " + x.toFixed(2) + " " + (ALT - topo - h).toFixed(2) + " " + w.toFixed(2) + " " + h.toFixed(2) + " re f");
      }
      function traco(x1, x2, yy, cor, esp) {
         pag().push(cor.join(" ") + " RG " + (esp || 0.6) + " w " + x1.toFixed(2) + " " + (ALT - yy).toFixed(2) + " m " + x2.toFixed(2) + " " + (ALT - yy).toFixed(2) + " l S");
      }

      function linhas(txt, tam, neg, indent, cor) {
         const larg = LARG - 2 * M - indent;
         const lh = tam * 1.4;
         quebrar(txt, tam, neg, larg).forEach(function (l) {
            garantir(lh);
            if (l) texto(M + indent, y + tam, l, tam, neg, cor);
            y += lh;
         });
      }

      const api = {
         faixa: function (titulo, sub) {
            retangulo(0, 0, LARG, 78, AZUL);
            texto(M, 36, titulo, 17, true, [1, 1, 1]);
            texto(M, 58, sub, 11, false, [0.66, 0.72, 0.79]);
            y = 78 + 24;
         },
         campos: function (pares, colunas) {
            const col = colunas || 2, w = (LARG - 2 * M) / col;
            for (let i = 0; i < pares.length; i += col) {
               garantir(38);
               pares.slice(i, i + col).forEach(function (p, k) {
                  const x = M + k * w;
                  texto(x, y + 8, String(p[0]).toUpperCase(), 7.5, false, CINZA);
                  const v = quebrar(p[1] || "—", 10.5, true, w - 12)[0] || "—";
                  texto(x, y + 23, v, 10.5, true);
               });
               y += 36;
            }
            y += 4;
         },
         secao: function (titulo) {
            garantir(70);
            retangulo(M, y, LARG - 2 * M, 22, [0.90, 0.94, 0.98]);
            retangulo(M, y, 3, 22, DESTAQUE);
            texto(M + 12, y + 15, titulo, 10.5, true, AZUL);
            y += 32;
         },
         registro: function (titulo, detalhes) {
            garantir(40);
            linhas(titulo, 10, true, 6);
            (detalhes || []).filter(Boolean).forEach(function (d) { linhas(d, 10, false, 22); });
            y += 6;
         },
         grupo: function (titulo) {
            garantir(60);
            texto(M + 4, y + 12, titulo, 10.5, true, DESTAQUE);
            traco(M + 4, LARG - M, y + 18, [0.80, 0.86, 0.93], 0.6);
            y += 26;
         },
         paragrafo: function (txt, tam) { linhas(txt, tam || 10.5, false, 0); },
         nada: function (txt) { linhas(txt, 10, false, 6, CINZA); y += 4; },
         espaco: function (h) { y += h; },
         imagem: function (dataUrl, maxW, maxH, indent) {
            const img = lerJpeg(dataUrl);
            const esc = Math.min(maxW / img.w, maxH / img.h, 1 * maxW / img.w);
            const w = img.w * esc, h = img.h * esc;
            garantir(h + 8);
            imagens.push(img);
            pag().push("q " + w.toFixed(2) + " 0 0 " + h.toFixed(2) + " " + (M + (indent || 0)).toFixed(2) + " " + (ALT - y - h).toFixed(2) + " cm /Im" + imagens.length + " Do Q");
            y += h + 6;
         },
         assinaturaLinha: function (nome) {
            garantir(30);
            traco(M, M + 260, y + 2, TEXTO, 0.8);
            texto(M, y + 16, nome, 9.5, false, CINZA);
            y += 26;
         },
         gerar: function () {
            const total = paginas.length;
            paginas.forEach(function (ops, i) {
               ops.push(opTexto(M, ALT - 30, rodapeTexto, 8, false, CINZA));
               const t = "Página " + (i + 1) + " de " + total;
               ops.push(opTexto(LARG - M - medir(t, 8, false), ALT - 30, t, 8, false, CINZA));
            });

            const partes = [], offs = [];
            let pos = 0;
            const add = function (s) { partes.push(s); pos += s.length; };
            const obj = function (n, corpo) { offs[n] = pos; add(n + " 0 obj\n" + corpo + "\nendobj\n"); };
            const stream = function (n, dic, dados) {
               offs[n] = pos;
               add(n + " 0 obj\n<< " + dic + " /Length " + dados.length + " >>\nstream\n" + dados + "\nendstream\nendobj\n");
            };

            const k = imagens.length, primeiraPag = 5 + k;
            add("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
            obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
            const kids = paginas.map(function (_, i) { return (primeiraPag + 2 * i) + " 0 R"; }).join(" ");
            obj(2, "<< /Type /Pages /Kids [" + kids + "] /Count " + paginas.length + " >>");
            obj(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
            obj(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
            imagens.forEach(function (img, i) {
               stream(5 + i, "/Type /XObject /Subtype /Image /Width " + img.w + " /Height " + img.h +
                  " /ColorSpace /" + (img.comps === 1 ? "DeviceGray" : "DeviceRGB") + " /BitsPerComponent 8 /Filter /DCTDecode", img.bin);
            });
            let xobj = "";
            if (k) xobj = " /XObject << " + imagens.map(function (_, i) { return "/Im" + (i + 1) + " " + (5 + i) + " 0 R"; }).join(" ") + " >>";
            const recursos = "<< /Font << /F1 3 0 R /F2 4 0 R >>" + xobj + " >>";
            paginas.forEach(function (ops, i) {
               const n = primeiraPag + 2 * i;
               obj(n, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + LARG + " " + ALT + "] /Resources " + recursos + " /Contents " + (n + 1) + " 0 R >>");
               stream(n + 1, "", ops.join("\n"));
            });

            const total2 = primeiraPag + 2 * paginas.length;
            const xref = pos;
            let x = "xref\n0 " + total2 + "\n0000000000 65535 f \n";
            for (let n = 1; n < total2; n++) x += ("0000000000" + offs[n]).slice(-10) + " 00000 n \n";
            add(x + "trailer\n<< /Size " + total2 + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF");

            const s = partes.join("");
            const bytes = new Uint8Array(s.length);
            for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i) & 255;
            return bytes;
         }
      };
      return api;
   }

   return { criar };
})();
