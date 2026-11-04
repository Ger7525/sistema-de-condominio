/* ==========================================================
   BASE DE DADOS DO SISTEMA  (único arquivo que você edita)
   ========================================================== */
const DADOS = {

   condominio: "Edifício Laguna Hall",

   /* Número que recebe o relatório do plantão.
      Formato: país + DDD + número, só dígitos. Ex.: "5581999999999"
      Se ficar vazio, o WhatsApp abre para você escolher o contato. */
   whatsappRelatorio: "",

   /* Porteiros (troque pelos nomes reais) */
   porteiros: [
      { valor: "germano-santos", nome: "Germano Santos" },
      { valor: "alexandre-florencio", nome: "Alexandre Florencio" },
      { valor: "luis-carlos", nome: "Luis Carlos" },
      { valor: "jonas-paulo", nome: "Jonas Paulo" }
   ],

   /* Lista de apartamentos do select. Se ficar vazia ([]), o sistema
      monta a lista sozinho a partir dos moradores cadastrados abaixo. */
   apartamentos: [],

   tiposEntrega: ["Encomenda", "Delivery", "Documento", "Outros"],

   /* Tipos da seção Correspondências e avisos.
      Os nomes precisam ser iguais aos modelos de mensagem em whatsapp.js */
   tiposCorrespondencia: [
      "Carta",
      "Envelopes",
      "Boleto do condomínio",
      "Boleto do gás",
      "Boleto Neoenergia",
      "Aviso do condomínio"
   ],

   /* Moradores: apto, nome e telefone (com 55 + DDD).
      Um apartamento pode ter mais de um morador: repita o apto em outra linha.
      Para adicionar, copie uma linha e preencha. */
   moradores: [
      { apto: "101", nome: "Kleber Buarque", telefone: "5581997942579" },
      { apto: "101", nome: "Marcia Buarque", telefone: "5581981330816" },
      { apto: "102", nome: "Reginaldo", telefone: "5581988835898" },
      { apto: "102", nome: "Mauriceia", telefone: "5581988835827" },
      { apto: "102", nome: "Artur", telefone: "5581986216540" },
      { apto: "103", nome: "Silvio", telefone: "5581983001991" },
      { apto: "103", nome: "Eudenice (Nice)", telefone: "5581988124715" },
      { apto: "104", nome: "José Armando", telefone: "5581991044523" },
      { apto: "104", nome: "Ana Cláudia", telefone: "5581973029325" },
      { apto: "201", nome: "Sebastiana", telefone: "5581992336350" },
      { apto: "202", nome: "Danilo", telefone: "5581998048515" },
      { apto: "202", nome: "Nathalia", telefone: "5581998699877" },
      { apto: "203", nome: "David", telefone: "5581999546754" },
      { apto: "203", nome: "Gerson", telefone: "5581997211054" },
      { apto: "203", nome: "Deyverson", telefone: "5581992996837" },
      { apto: "204", nome: "Wilker", telefone: "5581996154986" },
      { apto: "301", nome: "Clecio", telefone: "5581995474759" },
      { apto: "302", nome: "Dayana", telefone: "5581998384045" },
      { apto: "302", nome: "José", telefone: "5581993772000" },
      { apto: "303", nome: "Priscila Cristyne", telefone: "5581993058994" },
      { apto: "303", nome: "Anderson", telefone: "5581996388485" },
      { apto: "303", nome: "Thiago", telefone: "5581999892689" },
      { apto: "303", nome: "Priscila Coutinho", telefone: "558196199296" },  // CONFERIR: telefone com 10 dígitos
      { apto: "304", nome: "Saulo", telefone: "5581984130142" },
      { apto: "401", nome: "Viviane", telefone: "5581997065031" },
      { apto: "402", nome: "José Arnaldo", telefone: "5581979056826" },
      { apto: "403", nome: "Gustavo", telefone: "5581999540122" },
      { apto: "403", nome: "Pietra", telefone: "5581989166666" },
      { apto: "404", nome: "Viviane", telefone: "5581992864065" },
      { apto: "501", nome: "Mauricio", telefone: "5581998929442" },
      { apto: "501", nome: "Larissa", telefone: "5581999470639" },
      { apto: "502", nome: "Edna", telefone: "5581988040802" },
      { apto: "502", nome: "Rosali", telefone: "5581988048020" },
      { apto: "503", nome: "Alexandre", telefone: "5581998842852" },
      { apto: "503", nome: "Gabriela", telefone: "5581994071630" },
      { apto: "504", nome: "Thales", telefone: "5581981036318" },
      { apto: "504", nome: "Rafaela", telefone: "5581999790107" },
      { apto: "601", nome: "Amanda", telefone: "5581981077486" },
      { apto: "601", nome: "Gabriel", telefone: "5581982088900" },
      { apto: "602", nome: "Arlan", telefone: "5581986956775" },
      { apto: "602", nome: "Suhelen", telefone: "5581985768399" },
      { apto: "603", nome: "Raissa", telefone: "5581999064865" },
      { apto: "604", nome: "Marcilia", telefone: "5581997161145" },
      { apto: "701", nome: "Emanuel", telefone: "5581992785516" },
      { apto: "701", nome: "Shirlene", telefone: "5581988541669" },
      { apto: "702", nome: "Danilo Brun", telefone: "5581979139104" },
      { apto: "702", nome: "Daniel Brun", telefone: "5581981033340" },
      { apto: "702", nome: "Eudenice (Nice)", telefone: "5581981156868" },
      { apto: "703", nome: "Josy", telefone: "5581997622478" },
      { apto: "704", nome: "Ana Flora", telefone: "5581988669091" },
      { apto: "704", nome: "Jailson", telefone: "5581998024248" },
      { apto: "704", nome: "José Henrique", telefone: "5581987582555" },
      { apto: "801", nome: "Antonio", telefone: "5581999763416" },
      { apto: "801", nome: "Dadiane", telefone: "5581987737326" },
      { apto: "801", nome: "Darliane (Ananda)", telefone: "5581997029579" },
      { apto: "802", nome: "Edvaldo", telefone: "558199386681" },  // CONFERIR: telefone com 10 dígitos
      { apto: "803", nome: "Bruno", telefone: "5581992184733" },
      { apto: "803", nome: "Flávia", telefone: "5581992741443" },
      { apto: "804", nome: "Romulo", telefone: "5581973224994" },
      { apto: "804", nome: "Amanda", telefone: "5581988884836" },
      { apto: "901", nome: "Ademir", telefone: "5581984127959" },
      { apto: "901", nome: "Caroline", telefone: "5581984472474" },
      { apto: "902", nome: "Gianina", telefone: "5581988261549" },
      { apto: "902", nome: "Gabriel", telefone: "5581997669050" },
      { apto: "902", nome: "Alice", telefone: "5581994181840" },
      { apto: "903", nome: "Ladjane", telefone: "558196166139" },  // CONFERIR: telefone com 10 dígitos
      { apto: "904", nome: "Luiz Fernando", telefone: "5581982372905" },
      { apto: "904", nome: "Joanna", telefone: "5581981214381" },
      { apto: "1001", nome: "Gabriel", telefone: "5581992767111" },
      { apto: "1001", nome: "Karla", telefone: "5581992761357" },
      { apto: "1003", nome: "Joel", telefone: "5581999606066" },
      { apto: "1003", nome: "Nathalia", telefone: "5581998752222" },
      { apto: "1004", nome: "Milena", telefone: "5581988396485" },
      { apto: "1004", nome: "Enio", telefone: "5581988435707" },
      { apto: "1101", nome: "Geofred", telefone: "5581988141245" },
      { apto: "1101", nome: "Tatiana", telefone: "5581987950231" },
      { apto: "1102", nome: "Etiene", telefone: "5581991206752" },
      { apto: "1103", nome: "Debora", telefone: "5581997757073" },
      { apto: "1103", nome: "Géssica", telefone: "5581997892937" },
      { apto: "1104", nome: "Juliana Carla", telefone: "5581984464368" },
      { apto: "1201", nome: "Andre", telefone: "5581991916975" },
      { apto: "1201", nome: "Juliana", telefone: "5581996836112" },
      { apto: "1202", nome: "Rodrigo Brito", telefone: "5581994213383" },
      { apto: "1202", nome: "Luize", telefone: "5581989507868" },
      { apto: "1203", nome: "Gleybson", telefone: "5581991003252" },
      { apto: "1203", nome: "Jeane", telefone: "5581992776477" },
      { apto: "1204", nome: "Janser", telefone: "5581999597414" },
      { apto: "1204", nome: "Shirley", telefone: "5581987297966" },
      { apto: "1204", nome: "Lucas", telefone: "5581981849254" },
      { apto: "1204", nome: "Taina", telefone: "5581981847295" }
   ]
};
