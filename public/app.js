const state = {
  runs: [],
  selectedRunId: null
};

const runsList = document.getElementById('runsList');
const runCount = document.getElementById('runCount');
const detailTitle = document.getElementById('detailTitle');
const detailMeta = document.getElementById('detailMeta');
const detailBody = document.getElementById('detailBody');
const runForm = document.getElementById('runForm');
const runLiveProofButton = document.getElementById('runLiveProofButton');
const runReplayButton = document.getElementById('runReplayButton');
const refreshButton = document.getElementById('refreshButton');
const reviewButton = document.getElementById('reviewButton');
const exportLink = document.getElementById('exportLink');

runForm.addEventListener('submit', handleFormSubmit);
runLiveProofButton.addEventListener('click', () => startLiveProofDemo());
runReplayButton.addEventListener('click', () => startReplayDemo());
refreshButton.addEventListener('click', refreshRuns);
reviewButton.addEventListener('click', reviewSelectedRun);

refreshRuns();
setInterval(refreshRuns, 5000);

async function refreshRuns() {
  const response = await fetch('/v1/runs');
  const payload = await response.json();
  state.runs = payload.data ?? [];
  runCount.textContent = String(state.runs.length);
  if (!state.selectedRunId && state.runs[0]) {
    state.selectedRunId = state.runs[0].runId;
  }
  renderRuns();
  renderDetail();
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const formData = new FormData(runForm);
  const mode = String(formData.get('mode') ?? 'replay');
  const body = {
    mode,
    objective: {
      title: formData.get('title'),
      query: formData.get('query'),
      profile: formData.get('profile'),
      geography: formData.get('geography'),
      sectors: splitCsv(formData.get('sectors')),
      ...resolveModeSelection(mode),
      constraints: splitCsv(formData.get('constraints')),
      fixtureId: formData.get('fixtureId')
    }
  };
  await startRun(body, 'Run failed to start.');
}

async function startRun(body, fallbackMessage) {
  const response = await fetch('/v1/runs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const payload = await response.json();
  if (!response.ok) {
    alert(payload.message ?? payload.error ?? fallbackMessage);
    return null;
  }
  state.selectedRunId = payload.run.runId;
  await refreshRuns();
  return payload.run;
}

async function startReplayDemo() {
  await startRun({
    mode: 'replay',
    objective: {
      title: 'AI startup opportunity search',
      query: 'AI startup credits and accelerator programs',
      profile: 'Seed-stage startup building AI developer tools with a small engineering team.',
      geography: 'Global',
      sectors: ['AI', 'developer tools', 'cloud'],
      sourceTypes: ['grant', 'accelerator'],
      sourceIds: [],
      constraints: ['Prefer programs with explicit application or benefit details'],
      fixtureId: 'demo-opportunities'
    }
  }, 'Replay run failed.');
}

async function startLiveProofDemo() {
  await startRun({
    mode: 'live',
    objective: {
      title: 'AI startup live opportunity proof',
      query: 'AI startup cloud credit program with explicit benefits and application details',
      profile: 'Seed-stage startup building AI developer tools with a small engineering team.',
      geography: 'Global',
      sectors: ['AI', 'developer tools', 'cloud'],
      sourceTypes: ['grant'],
      sourceIds: ['aws-activate'],
      constraints: ['Prefer explicit credit amounts, benefits, and application details'],
      fixtureId: 'demo-opportunities'
    }
  }, 'Live proof failed.');
}

function renderRuns() {
  runsList.innerHTML = '';
  for (const run of state.runs) {
    const card = document.createElement('button');
    card.className = `run-card${run.runId === state.selectedRunId ? ' active' : ''}`;
    card.type = 'button';
    card.addEventListener('click', () => {
      state.selectedRunId = run.runId;
      renderRuns();
      renderDetail();
    });
    card.innerHTML = `
      <h3>${escapeHtml(run.objective.title)}</h3>
      <p>${escapeHtml(run.objective.query)}</p>
      <div class="status-row">
        <span>${escapeHtml(formatModeLabel(run))}</span>
        <span>${run.status}</span>
      </div>
    `;
    runsList.appendChild(card);
  }
}

async function renderDetail() {
  const run = state.runs.find((item) => item.runId === state.selectedRunId);
  if (!run) {
    detailTitle.textContent = 'No run selected';
    detailMeta.textContent = 'Run the live TinyFish proof or the judge-safe replay to inspect the shortlist.';
    detailBody.className = 'detail-body empty-state';
    detailBody.textContent = 'Run the live proof or replay to see evidence, ranking, review, and export.';
    exportLink.classList.add('disabled');
    reviewButton.disabled = true;
    return;
  }

  detailTitle.textContent = run.objective.title;
  detailMeta.textContent = `${formatModeLabel(run)} · ${run.status} · ${run.opportunities.length} ranked opportunities`;
  detailBody.className = 'detail-body';
  exportLink.href = `/v1/exports/${run.runId}.md`;
  exportLink.classList.remove('disabled');
  reviewButton.disabled = !run.appServer?.threadId;
  const topOpportunity = run.opportunities[0] ?? null;

  const reviewNotice = run.appServer?.lastReview
    ? `<div class="section-card"><h3>Latest Review</h3><p>${escapeHtml(run.appServer.lastReview)}</p></div>`
    : '';

  const topOpportunitySpotlight = topOpportunity
    ? `
      <div class="section-card spotlight-card">
        <p class="eyebrow-like">Best Match for This Profile</p>
        <h3>${escapeHtml(topOpportunity.title)}</h3>
        <p>${escapeHtml(topOpportunity.fitReason)}</p>
        <div class="spotlight-meta">
          <span>${escapeHtml(topOpportunity.sourceName)}</span>
          <span>score ${topOpportunity.weightedScore.toFixed(3)}</span>
          <span>confidence ${topOpportunity.confidence.toFixed(2)}</span>
        </div>
        ${topOpportunity.applicationLink
          ? `<p class="spotlight-next">Next action: <a href="${escapeHtml(topOpportunity.applicationLink)}" target="_blank" rel="noreferrer">Open application</a></p>`
          : ''
        }
        <ul class="evidence-list">
          ${topOpportunity.evidenceSnippets.map((snippet) => `<li>${escapeHtml(snippet)}</li>`).join('')}
        </ul>
      </div>
    `
    : '';

  detailBody.innerHTML = `
    ${topOpportunitySpotlight}
    <div class="section-card">
      <h3>Ranked Shortlist</h3>
      ${run.opportunities.map(renderOpportunity).join('')}
    </div>
    ${reviewNotice}
    <div class="section-card">
      <h3>Codex Control Plane</h3>
      <p class="muted">Thread: ${escapeHtml(run.appServer.threadId ?? 'not created')} · Kickoff turn: ${escapeHtml(run.appServer.kickoffTurnId ?? 'n/a')}</p>
      ${run.appServer.lastError ? `<p class="notice">${escapeHtml(run.appServer.lastError)}</p>` : ''}
    </div>
    <div class="section-card">
      <h3>Evidence Trail</h3>
      <div class="event-list">
        ${run.events.slice(-14).reverse().map((event) => `<div class="event-row"><strong>${escapeHtml(event.type)}</strong><br />${escapeHtml(event.message)}</div>`).join('')}
      </div>
    </div>
  `;
}

async function reviewSelectedRun() {
  if (!state.selectedRunId) return;
  const response = await fetch(`/v1/runs/${state.selectedRunId}/review`, { method: 'POST' });
  const payload = await response.json();
  if (!response.ok) {
    alert(payload.message ?? payload.error ?? 'Review failed.');
    return;
  }
  await refreshRuns();
}

function renderOpportunity(opportunity) {
  return `
    <article class="opportunity-card">
      <h4>${escapeHtml(opportunity.title)}</h4>
      <p class="muted">${escapeHtml(opportunity.sourceName)} · score ${opportunity.weightedScore.toFixed(3)} · confidence ${opportunity.confidence.toFixed(2)}</p>
      <p>${escapeHtml(opportunity.fitReason)}</p>
      <div class="score-grid">
        ${Object.entries(opportunity.scoreBreakdown).map(([label, value]) => `
          <div class="score-chip">
            <strong>${escapeHtml(label.replaceAll('_', ' '))}</strong>
            <span>${Number(value).toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
      <ul class="evidence-list">
        ${opportunity.evidenceSnippets.map((snippet) => `<li>${escapeHtml(snippet)}</li>`).join('')}
      </ul>
      ${opportunity.uncertaintyNotes?.length
        ? `
          <p class="muted">Open Questions</p>
          <ul class="evidence-list">
            ${opportunity.uncertaintyNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}
          </ul>
        `
        : ''
      }
    </article>
  `;
}

function splitCsv(value) {
  return String(value ?? '').split(',').map((item) => item.trim()).filter(Boolean);
}

function resolveModeSelection(mode) {
  if (mode === 'live') {
    return {
      sourceTypes: ['grant'],
      sourceIds: ['aws-activate']
    };
  }
  return {
    sourceTypes: ['grant', 'accelerator'],
    sourceIds: []
  };
}

function formatModeLabel(run) {
  if (run.mode === 'replay') {
    return 'judge-safe replay';
  }
  if (run.mode === 'live') {
    return 'live TinyFish proof';
  }
  return 'mock fallback';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
