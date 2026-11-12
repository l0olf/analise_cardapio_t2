'use strict';
(() => {
  const key = 't2-cardapio-2026-11-12-v1';
  const statusLabels = { aprovo: 'Aprovo', ajustes: 'Aprovo com ajustes', nao: 'Não aprovo' };
  const articles = [...document.querySelectorAll('.improvement')];
  const prompts = [
    'Aprovação do cadastro único e dias/horários da promoção de cada burger.',
    'Produtos prioritários, ordem desejada e dados para os destaques.',
    'Quantidades, bebidas, preços e condições dos combos Casal e Galera.',
    'Cortesias, quantidades e necessidades da cozinha nas etapas.',
    'Nomes, descrições, receitas atualizadas e preparo do Vienna.',
    'Pesos, unidades, molhos e embalagem dos churros no delivery.',
    'Maionese, modo de envio dos itens para casa e agrupamentos.',
    'Schweppes, peso das chips, volumes, novidades e Burger do Mês.',
    'Fotos originais do Instagram e produtos retratados; fotos das fritas, combos e Burger do Mês.'
  ];
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) || '{}') || {}; }
  catch { saved = {}; }
  articles.forEach((article, i) => {
    const n = i + 1;
    const panel = article.querySelector('.decision');
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = `Sua decisão sobre o ponto ${String(n).padStart(2, '0')}`;
    fieldset.append(legend);
    const choices = document.createElement('div');
    choices.className = 'choices';
    Object.entries(statusLabels).forEach(([value, labelText]) => {
      const label = document.createElement('label');
      label.className = 'choice';
      const input = document.createElement('input');
      input.type = 'radio'; input.name = `decision-${n}`; input.value = value;
      input.checked = saved[`decision-${n}`] === value;
      label.append(input, document.createTextNode(labelText)); choices.append(label);
    });
    fieldset.append(choices); panel.append(fieldset);
    const label = document.createElement('label');
    label.className = 'notes-label'; label.htmlFor = `notes-${n}`;
    label.textContent = 'Ajustes, objeções ou informações para confirmar';
    const textarea = document.createElement('textarea');
    textarea.id = `notes-${n}`; textarea.rows = 2; textarea.placeholder = prompts[i];
    textarea.value = typeof saved[`notes-${n}`] === 'string' ? saved[`notes-${n}`] : '';
    panel.append(label, textarea);
  });
  const general = document.getElementById('general-notes');
  general.value = typeof saved.general === 'string' ? saved.general : '';
  const feedback = document.getElementById('feedback');
  const output = document.getElementById('response');
  const responseArea = document.getElementById('response-area');
  function data() {
    const state = { general: general.value };
    articles.forEach((a, i) => {
      const n = i + 1;
      state[`decision-${n}`] = a.querySelector('input:checked')?.value || '';
      state[`notes-${n}`] = document.getElementById(`notes-${n}`).value;
    });
    return state;
  }
  function text(state) {
    const lines = ['Retorno — Análise do cardápio T2 Burger', 'Proposta de 12/11/2026', ''];
    articles.forEach((a, i) => {
      const n = i + 1;
      lines.push(`${String(n).padStart(2, '0')}. ${a.dataset.title}`);
      lines.push(`Decisão: ${statusLabels[state[`decision-${n}`]] || 'Ainda não avaliado'}`);
      const note = state[`notes-${n}`].trim();
      if (note) lines.push(`Observações: ${note}`);
      lines.push('');
    });
    if (state.general.trim()) lines.push('Complementos gerais:', state.general.trim(), '');
    lines.push('Informações de produto, preços novos e condições que permanecerem em aberto precisam ser confirmados antes da execução.');
    return lines.join('\n');
  }
  function update() {
    const state = data();
    const count = articles.filter((_, i) => state[`decision-${i+1}`]).length;
    document.getElementById('progress-label').textContent = `${count} de ${articles.length} pontos respondidos`;
    document.getElementById('progress-percent').textContent = `${Math.round(count / articles.length * 100)}%`;
    document.getElementById('progress').max = articles.length;
    document.getElementById('progress').value = count;
    try { localStorage.setItem(key, JSON.stringify(state)); }
    catch { document.getElementById('save-note').textContent = 'Este navegador não permitiu salvar as escolhas. Gere e copie sua resposta antes de fechar. Nada é enviado automaticamente.'; }
    if (!responseArea.hidden) output.value = text(state);
  }
  document.addEventListener('input', event => {
    if (event.target.matches('.decision input, .decision textarea, #general-notes')) update();
  });
  document.addEventListener('change', event => {
    if (event.target.matches('.decision input')) update();
  });
  document.getElementById('generate').addEventListener('click', () => {
    const state = data();
    const unanswered = articles.filter((_,i) => !state[`decision-${i+1}`]).length;
    const missingNotes = articles.filter((_,i) => ['ajustes','nao'].includes(state[`decision-${i+1}`]) && !state[`notes-${i+1}`].trim());
    responseArea.hidden = false; output.value = text(state);
    feedback.textContent = missingNotes.length
      ? 'Resposta gerada. Acrescente suas observações nos pontos com ajustes ou objeções para orientar a equipe.'
      : unanswered ? `Resposta gerada. ${unanswered} ponto(s) permanecem como “Ainda não avaliado”.` : 'Resposta gerada. Copie e envie à equipe para seguirmos.';
    output.focus({ preventScroll: true });
    responseArea.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
  });
  document.getElementById('copy').addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(output.value);
      feedback.textContent = 'Resposta copiada. Agora é só colar na conversa com a equipe.';
    } catch {
      output.focus(); output.select();
      feedback.textContent = 'Selecionei a resposta. Use Copiar no seu dispositivo ou baixe o arquivo .txt.';
    }
  });
  document.getElementById('download').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob(['\ufeff' + output.value], {type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a'); link.href = url; link.download = 'Resposta_Rogger_T2_Cardapio.txt';
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    feedback.textContent = 'Arquivo de resposta preparado para download.';
  });
  document.getElementById('reset').addEventListener('click', () => {
    if (!window.confirm('Limpar as decisões e observações salvas neste navegador?')) return;
    document.querySelectorAll('.decision input').forEach(input => input.checked = false);
    document.querySelectorAll('.decision textarea').forEach(input => input.value = '');
    general.value = ''; responseArea.hidden = true; output.value = '';
    update(); feedback.textContent = 'Respostas limpas. Todos os pontos estão sem avaliação.';
  });
  document.getElementById('print').addEventListener('click', () => window.print());
  update();
})();
