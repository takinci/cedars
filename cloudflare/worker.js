const DEFAULT_ALLOWED_ORIGINS = [
  'https://cedarsleaf.com',
  'https://www.cedarsleaf.com',
  'https://takinci.github.io',
];

function allowedOrigins(env) {
  const configured = String(env.ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean);
  return configured.length ? configured : DEFAULT_ALLOWED_ORIGINS;
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = allowedOrigins(env);
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function json(request, env, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {'Content-Type':'application/json; charset=utf-8', ...corsHeaders(request, env)},
  });
}

function trim(value, max) {
  return String(value || '').trim().slice(0, max);
}

function validEmail(value) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}


async function verifyTurnstile(token, env) {
  if (!env.TURNSTILE_SECRET_KEY) return {ok:false, error:'Turnstile is not configured.'};
  if (!token || typeof token !== 'string' || token.length > 2048) return {ok:false, error:'Anti-spam verification is required.'};
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY, response:token}),
    });
    const result = await response.json();
    if (!result.success) return {ok:false, error:'Anti-spam verification failed.'};
    const allowedHosts = new Set(allowedOrigins(env).map(value => { try { return new URL(value).hostname; } catch { return ''; } }).filter(Boolean));
    if (!result.hostname || !allowedHosts.has(result.hostname)) return {ok:false, error:'Anti-spam hostname verification failed.'};
    if (result.action !== 'cedars-contribution') return {ok:false, error:'Anti-spam action verification failed.'};
    return {ok:true};
  } catch {
    return {ok:false, error:'Anti-spam verification could not be completed.'};
  }
}


function compactAssessmentSummary(assessment) {
  const payload = assessment?.assessment || {};
  const settings = payload.settings || {};
  const scen = payload.scen || {};
  const dept = payload.deptLabel || {};
  const eco = payload.ecoLabel || {};
  return {
    assessmentSavedAt: trim(assessment?.savedAt, 100),
    localRegion: trim(settings.region, 200),
    reportingPeriod: trim(settings.timePeriod, 100),
    departmentName: trim(dept.deptName, 300),
    hospitalName: trim(dept.hospitalName, 300),
    aiProjectName: trim(eco.projectName, 300),
    aiTaskType: trim(eco.taskType, 100),
    aiCloudProvider: trim(scen.cloudProvider || eco.cloudProvider, 200),
    aiComputeRegion: trim(scen.cloudRegion || eco.cloudRegion, 200),
    currentPractices: Array.isArray(dept.activeInterventions) ? dept.activeInterventions.join(' | ').slice(0, 8000) : '',
    scenarioInterventions: Array.isArray(payload.scenarioInterventions) ? payload.scenarioInterventions.join(' | ').slice(0, 8000) : '',
  };
}

async function mirrorToGoogleSheets(record, env) {
  if (!env.GOOGLE_SHEETS_WEBHOOK_URL || !env.GOOGLE_SHEETS_SHARED_SECRET) return;
  const response = await fetch(env.GOOGLE_SHEETS_WEBHOOK_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({...record, sharedSecret: env.GOOGLE_SHEETS_SHARED_SECRET}),
  });
  if (!response.ok) throw new Error(`Google Sheets mirror HTTP ${response.status}`);
  const result = await response.json().catch(() => ({}));
  if (!result.ok) throw new Error(result.error || 'Google Sheets mirror rejected the submission.');
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, {status:204, headers:corsHeaders(request, env)});
    if (request.method !== 'POST') return json(request, env, {error:'Method not allowed.'}, 405);

    const origin = request.headers.get('Origin') || '';
    if (origin && !allowedOrigins(env).includes(origin)) return json(request, env, {error:'Origin not allowed.'}, 403);

    const contentLength = Number(request.headers.get('Content-Length') || 0);
    if (contentLength > 1_000_000) return json(request, env, {error:'Submission is too large.'}, 413);

    let body;
    try { body = await request.json(); }
    catch { return json(request, env, {error:'Invalid JSON.'}, 400); }

    const assessment = body?.assessment;
    const permissions = body?.permissions || {};
    const contributor = body?.contributor || {};
    if (!assessment || assessment.format !== 'CEDARS' || !assessment.assessment) return json(request, env, {error:'Invalid CEDARS assessment.'}, 400);
    if (permissions.assessmentSharing !== true) return json(request, env, {error:'Assessment-sharing consent is required.'}, 400);

    const turnstile = await verifyTurnstile(body?.turnstileToken, env);
    if (!turnstile.ok) return json(request, env, {error:turnstile.error}, 403);

    const email = trim(contributor.email, 320);
    if (!validEmail(email)) return json(request, env, {error:'Invalid email address.'}, 400);
    if (permissions.futureContact && !email) return json(request, env, {error:'Email is required when future contact is requested.'}, 400);

    const submissionId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const assessmentJson = JSON.stringify(assessment);
    if (assessmentJson.length > 900_000) return json(request, env, {error:'Assessment is too large.'}, 413);

    try {
      await env.DB.prepare(`
        INSERT INTO contributions (
          id, created_at, schema_version, app_version, assessment_json,
          name, institution, country, professional_role, email, interests,
          allow_acknowledgment, allow_future_contact, consent_version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        submissionId,
        createdAt,
        Number(assessment.schemaVersion || 0),
        trim(assessment.appVersion, 100),
        assessmentJson,
        trim(contributor.name, 300),
        trim(contributor.institution, 500),
        trim(contributor.country, 200),
        trim(contributor.role, 300),
        email,
        trim(contributor.interests, 4000),
        permissions.acknowledgment ? 1 : 0,
        permissions.futureContact ? 1 : 0,
        trim(body.consentVersion, 100),
      ).run();
    } catch (error) {
      console.error('CEDARS contribution insert failed', error);
      return json(request, env, {error:'The contribution could not be stored.'}, 500);
    }

    // D1 remains the source of truth. If a Google Sheets mirror is configured, copy a compact
    // submission summary there in the background so a temporary Google outage never loses the
    // authoritative D1 record or blocks the contributor's success response.
    if (env.GOOGLE_SHEETS_WEBHOOK_URL && env.GOOGLE_SHEETS_SHARED_SECRET) {
      const sheetRecord = {
        submissionId,
        createdAt,
        schemaVersion: Number(assessment.schemaVersion || 0),
        appVersion: trim(assessment.appVersion, 100),
        name: trim(contributor.name, 300),
        institution: trim(contributor.institution, 500),
        country: trim(contributor.country, 200),
        professionalRole: trim(contributor.role, 300),
        email,
        interests: trim(contributor.interests, 4000),
        allowAcknowledgment: !!permissions.acknowledgment,
        allowFutureContact: !!permissions.futureContact,
        consentVersion: trim(body.consentVersion, 100),
        ...compactAssessmentSummary(assessment),
      };
      ctx.waitUntil(mirrorToGoogleSheets(sheetRecord, env).catch(error => {
        console.error('CEDARS Google Sheets mirror failed', error);
      }));
    }

    return json(request, env, {ok:true, submissionId}, 201);
  },
};
