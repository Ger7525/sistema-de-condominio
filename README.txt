EDIFÍCIO LAGUNA HALL - SISTEMA DE CONDOMÍNIO
================================================

ESTRUTURA
index.html
pages/
  portaria_plantao.html
  portaria_entregas.html
  morador_portal.html
  reservas.html
  chat.html
css/estilo.css
js/
  dados_moradores.js
  sistema.js
  plantao.js
  entregas.js
  morador.js
  reservas.js
  chat.js

COMO USAR
1. Extraia o ZIP mantendo a estrutura de pastas.
2. Abra index.html no navegador.
3. Escolha Portaria ou Morador.
4. Os dados desta primeira versão ficam salvos no localStorage do navegador.

IMPORTANTE
A versão local permite testar todo o fluxo no mesmo navegador. Para sincronização real entre computador da portaria e celulares dos moradores, chat em tempo real e notificações entre dispositivos, será necessário conectar um banco de dados/backend (por exemplo Firebase). A estrutura JavaScript foi separada para facilitar essa evolução.
