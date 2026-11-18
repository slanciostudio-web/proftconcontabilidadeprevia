/* Proftcon Contabilidade — comportamento do site (sem dependências, vale para todas as páginas) */
(function () {
  'use strict';
  var C = window.PROFTCON_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var brl = function (v) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); };
  var pct = function (v, d) { return (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }); };
  var hoje = new Date();

  /* ---------- menu móvel ---------- */
  var burger = $('.burger'), menu = $('#menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var aberto = menu.classList.toggle('aberto');
      burger.setAttribute('aria-expanded', aberto);
    });
  }

  /* ---------- configuração: troca os itens marcados com * pelos dados do config.js ---------- */
  var preencher = function (el, texto, href) {
    el.classList.remove('pend');
    if (texto !== undefined) el.textContent = texto;
    if (href) el.href = href;
  };
  var zapLink = function (msg) { return 'https://wa.me/' + C.whatsapp + '?text=' + encodeURIComponent(msg || 'Olá, Proftcon! Vim pelo site e gostaria de falar com vocês.'); };

  if (C.telefone) $$('[data-tel]').forEach(function (a) { a.href = 'tel:+55' + C.telefone; });
  $$('[data-falar]').forEach(function (a) {
    if (C.whatsapp) { a.href = zapLink(a.getAttribute('data-msg')); a.target = '_blank'; a.rel = 'noopener'; }
    else if (C.telefone && !/contato\//.test(a.getAttribute('href'))) a.href = 'tel:+55' + C.telefone;
  });
  if (C.whatsapp) {
    var zap = $('.zap'); if (zap) zap.hidden = false;
    var n = C.whatsapp.replace(/^55/, '');
    $$('[data-zap-texto]').forEach(function (a) {
      preencher(a, '(' + n.slice(0, 2) + ') ' + n.slice(2, -4) + '-' + n.slice(-4), zapLink());
      a.target = '_blank'; a.rel = 'noopener';
    });
  }
  if (C.email) $$('[data-email]').forEach(function (a) { preencher(a, C.email, 'mailto:' + C.email); });
  if (C.horario) $$('[data-horario]').forEach(function (el) { preencher(el, C.horario); });
  if (C.crc) $$('[data-crc]').forEach(function (el) { preencher(el, C.crc); });
  ['facebook', 'instagram', 'linkedin'].forEach(function (r) {
    $$('[data-rede="' + r + '"]').forEach(function (a) {
      if (C[r] === '-') a.parentNode.hidden = true;            /* "-" = a Proftcon não usa essa rede */
      else if (C[r]) preencher(a, undefined, C[r]);
      else if (!a.classList.contains('pend')) a.parentNode.hidden = true;
    });
  });
  $$('[data-ano-atual]').forEach(function (el) { el.textContent = hoje.getFullYear(); });

  /* legenda do asterisco: só aparece enquanto houver item a preencher */
  var leg = $('[data-legenda-pend]');
  if (leg && $('.pend')) leg.hidden = false;

  /* ---------- formulário (página Contato): monta a mensagem no WhatsApp ou e-mail ---------- */
  var form = $('#contatoForm');
  if (form && (C.whatsapp || C.email)) {
    form.hidden = false; $('#semForm').hidden = true;
    if (!C.whatsapp) $('[data-canal]', form).textContent = 'e-mail';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nome = $('#fNome').value.trim();
      if (!nome) { $('#fNome').focus(); return; }
      var emp = $('#fEmpresa').value.trim(), cid = $('#fCidade').value.trim(), msg = $('#fMsg').value.trim();
      var txt = 'Olá, Proftcon! Sou ' + nome + (emp ? ', da ' + emp : '') + (cid ? ' (' + cid + ')' : '') +
        '.\nAssunto: ' + $('#fAssunto').value + (msg ? '\n' + msg : '');
      if (C.whatsapp) window.open(zapLink(txt), '_blank', 'noopener');
      else location.href = 'mailto:' + C.email + '?subject=' + encodeURIComponent('Contato pelo site: ' + $('#fAssunto').value) + '&body=' + encodeURIComponent(txt);
    });
  }

  /* ---------- simulador do Simples Nacional (LC 123/2006, Anexos I a V) ---------- */
  if ($('#simForm')) {
    var LIM = [180000, 360000, 720000, 1800000, 3600000, 4800000];
    var ANEXOS = {
      I:   [[.04, 0], [.073, 5940], [.095, 13860], [.107, 22500], [.143, 87300], [.19, 378000]],
      II:  [[.045, 0], [.078, 5940], [.10, 13860], [.112, 22500], [.147, 85500], [.30, 720000]],
      III: [[.06, 0], [.112, 9360], [.135, 17640], [.16, 35640], [.21, 125640], [.33, 648000]],
      IV:  [[.045, 0], [.09, 8100], [.102, 12420], [.14, 39780], [.22, 183780], [.33, 828000]],
      V:   [[.155, 0], [.18, 4500], [.195, 9900], [.205, 17100], [.23, 62100], [.305, 540000]]
    };
    var num = function (s) {
      s = String(s || '').replace(/[^\d,.-]/g, '');
      if (s.indexOf(',') > -1) s = s.replace(/\./g, '').replace(',', '.');
      else if ((s.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(s)) s = s.replace(/\./g, '');
      var v = parseFloat(s); return isNaN(v) ? 0 : v;
    };
    var anexoSel = $('#anexo'), campoFolha = $('#campoFolha');
    var simular = function () {
      var tipo = anexoSel.value, rbt = num($('#rbt12').value), mes = num($('#mes').value), folha = num($('#folha').value);
      campoFolha.hidden = tipo !== 'R';
      var alerta = $('#rAlerta'); alerta.hidden = true;
      var limpa = function () { $('#rEfetiva').innerHTML = '–<small> %</small>'; ['#rDas', '#rAnexo', '#rFaixa', '#rNominal'].forEach(function (s) { $(s).textContent = '–'; }); };
      if (!rbt) { limpa(); return; }
      if (rbt > 4800000) {
        limpa(); alerta.hidden = false;
        alerta.textContent = 'Acima de R$ 4,8 milhões em 12 meses a empresa sai do Simples Nacional. Fale com a Proftcon para planejar o novo regime.';
        return;
      }
      var anexo = tipo, nota = '';
      if (tipo === 'R') {
        var fr = folha / rbt;
        anexo = fr >= 0.28 ? 'III' : 'V';
        nota = folha ? 'Fator R de ' + pct(fr, 1) + '%: ' + (anexo === 'III' ? 'acima de 28%, a empresa usa o Anexo III.' :
          'abaixo de 28%, a empresa fica no Anexo V. Com folha de ' + brl(rbt * 0.28) + ' ela iria para o Anexo III.') : 'Informe a folha para calcular o Fator R. Sem ela, vale o Anexo V.';
      }
      var f = 0; while (rbt > LIM[f]) f++;
      var t = ANEXOS[anexo][f], ef = (rbt * t[0] - t[1]) / rbt;
      $('#rEfetiva').innerHTML = pct(ef, 2) + '<small> %</small>';
      $('#rDas').textContent = mes ? brl(mes * ef) : 'informe o mês';
      $('#rAnexo').textContent = 'Anexo ' + anexo;
      $('#rFaixa').textContent = (f + 1) + 'ª · até ' + brl(LIM[f]).replace(',00', '');
      $('#rNominal').textContent = pct(t[0], 1) + '% / ' + brl(t[1]).replace(',00', '');
      if (rbt > 3600000) nota += (nota ? ' ' : '') + 'Acima de R$ 3,6 milhões, ICMS e ISS são pagos fora do DAS (sublimite estadual).';
      if (nota) { alerta.hidden = false; alerta.textContent = nota; }
    };
    $$('#simForm input, #simForm select').forEach(function (el) { el.addEventListener('input', simular); el.addEventListener('change', simular); });
    $('#simForm').addEventListener('submit', function (e) { e.preventDefault(); });
    simular();
  }

  /* ---------- agenda fiscal do mês ---------- */
  if ($('#agendaLista')) {
    // Vencimentos gerais (mês seguinte ao fato gerador). util: n-ésimo dia útil; ultimo: último dia útil.
    var AGENDA = [
      { util: 5, sabado: true, t: 'Salários', d: 'Pagamento do salário do mês anterior até o 5º dia útil; para isso, o sábado conta como dia útil (CLT, art. 459).' },
      { dia: 15, t: 'eSocial: fechamento da folha', d: 'Envio dos eventos de remuneração e pagamentos do mês anterior.' },
      { dia: 20, t: 'DAS do Simples Nacional', d: 'Guia única do Simples sobre o faturamento do mês anterior.' },
      { dia: 20, t: 'FGTS Digital', d: 'Depósito do FGTS sobre a folha do mês anterior.' },
      { dia: 20, t: 'INSS e IRRF da folha', d: 'Contribuições previdenciárias (DCTFWeb) e imposto retido dos salários.' },
      { dia: 25, t: 'PIS e COFINS (Lucro Presumido)', d: 'Apuração mensal sobre o faturamento do mês anterior.' },
      { ultimo: true, meses: [0, 3, 6, 9], t: 'IRPJ e CSLL trimestrais (Presumido)', d: 'Cota única ou 1ª cota do trimestre encerrado.' },
      { dia: 31, meses: [2], t: 'DEFIS', d: 'Declaração anual das empresas do Simples Nacional, até 31 de março.' },
      { dia: 31, meses: [4], t: 'DASN-SIMEI', d: 'Declaração anual do MEI, até 31 de maio.' }
    ];
    var DS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    var fds = function (d) { return d.getDay() === 0 || d.getDay() === 6; };
    // feriados nacionais fixos (Lei 662/1949, Lei 6.802/1980 e Lei 14.759/2023); móveis ficam para o aviso geral
    var FERIADOS = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25'];
    var feriado = function (d) { return FERIADOS.indexOf(String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')) > -1; };
    var naoUtil = function (d, sab) { return d.getDay() === 0 || (!sab && d.getDay() === 6) || feriado(d); };
    var ref = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    var render = function () {
      var a = ref.getFullYear(), m = ref.getMonth(), ultimoDia = new Date(a, m + 1, 0).getDate();
      $('#mesNome').textContent = ref.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      var itens = AGENDA.filter(function (x) { return !x.meses || x.meses.indexOf(m) > -1; }).map(function (x) {
        var d;
        if (x.util) { var c = 0; d = new Date(a, m, 0); while (c < x.util) { d.setDate(d.getDate() + 1); if (!naoUtil(d, x.sabado)) c++; } }
        else if (x.ultimo) { d = new Date(a, m + 1, 0); while (naoUtil(d)) d.setDate(d.getDate() - 1); }
        else d = new Date(a, m, Math.min(x.dia, ultimoDia));
        return { d: d, x: x };
      }).sort(function (p, q) { return p.d - q.d; });
      var ul = $('#agendaLista'); ul.innerHTML = '';
      var zero = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      itens.forEach(function (i) {
        var li = document.createElement('li');
        if (i.d < zero) li.className = 'passou';
        li.innerHTML = '<div class="dia"><b>' + String(i.d.getDate()).padStart(2, '0') + '</b><span>' + DS[i.d.getDay()] + '</span></div>' +
          '<div><h3></h3><p></p>' + (i.x.util || i.x.ultimo ? '' : feriado(i.d) ? '<span class="fds">Cai em feriado: confirme a data</span>' : fds(i.d) ? '<span class="fds">Cai no fim de semana: confirme a data</span>' : '') + '</div>';
        $('h3', li).textContent = i.x.t; $('p', li).textContent = i.x.d;
        ul.appendChild(li);
      });
    };
    $('#mesAnt').addEventListener('click', function () { ref.setMonth(ref.getMonth() - 1); render(); });
    $('#mesProx').addEventListener('click', function () { ref.setMonth(ref.getMonth() + 1); render(); });
    render();
  }

  /* ---------- linha do tempo: destaca o ano atual ---------- */
  var ano = hoje.getFullYear();
  $$('.tempo li').forEach(function (li) {
    var y = li.getAttribute('data-ano');
    if (y === String(ano) || (y === '2029' && ano >= 2029 && ano <= 2032)) li.classList.add('agora');
  });
})();
