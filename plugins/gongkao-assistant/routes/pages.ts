/**
 * 公考助手 — 主页面路由
 *
 * 提供完整的刷题、申论、知识库、统计界面
 * 使用工厂函数模式，路由直接注册到主 app（无文件名前缀）
 */

export default function register(app: any, ctx: any) {
  // 主页面 HTML
  app.get("/gongkao", (c: any) => {
    return c.html(renderMainPage());
  });

  // Widget 页面
  app.get("/gongkao/widget", (c: any) => {
    return c.html(renderWidgetPage());
  });
}

function renderMainPage(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>公考助手</title>
  <style>
    :root {
      --bg: #1a1a2e;
      --surface: #16213e;
      --surface2: #0f3460;
      --primary: #4361ee;
      --primary-light: #4895ef;
      --accent: #f72585;
      --success: #06d6a0;
      --warning: #ffd166;
      --danger: #ef476f;
      --text: #e8e8e8;
      --text2: #a0a0b0;
      --border: #2a2a4a;
      --radius: 12px;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
    }
    .app { max-width: 900px; margin: 0 auto; padding: 20px; }

    /* 导航标签 */
    .tabs {
      display: flex; gap: 4px; margin-bottom: 24px;
      background: var(--surface); border-radius: var(--radius); padding: 4px;
    }
    .tab {
      flex: 1; padding: 10px 16px; border: none; border-radius: 8px;
      background: transparent; color: var(--text2); cursor: pointer;
      font-size: 14px; font-weight: 500; transition: all 0.2s;
    }
    .tab:hover { color: var(--text); background: var(--surface2); }
    .tab.active { background: var(--primary); color: #fff; }

    /* 面板 */
    .panel { display: none; }
    .panel.active { display: block; }

    /* 卡片 */
    .card {
      background: var(--surface); border-radius: var(--radius);
      padding: 20px; margin-bottom: 16px; border: 1px solid var(--border);
    }
    .card h3 { margin-bottom: 12px; font-size: 16px; color: var(--primary-light); }

    /* 统计卡片 */
    .stats-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px; margin-bottom: 20px;
    }
    .stat-card {
      background: var(--surface); border-radius: var(--radius); padding: 16px;
      text-align: center; border: 1px solid var(--border);
    }
    .stat-card .value { font-size: 28px; font-weight: 700; color: var(--primary-light); }
    .stat-card .label { font-size: 12px; color: var(--text2); margin-top: 4px; }

    /* 按钮 */
    .btn {
      padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer;
      font-size: 14px; font-weight: 500; transition: all 0.2s;
    }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover { background: var(--primary-light); }
    .btn-success { background: var(--success); color: #000; }
    .btn-danger { background: var(--danger); color: #fff; }
    .btn-outline {
      background: transparent; color: var(--primary-light);
      border: 1px solid var(--primary-light);
    }
    .btn-outline:hover { background: var(--surface2); }
    .btn-sm { padding: 6px 12px; font-size: 12px; }

    /* 选择器 */
    select, input[type="number"], input[type="text"] {
      background: var(--surface2); color: var(--text); border: 1px solid var(--border);
      border-radius: 8px; padding: 8px 12px; font-size: 14px; outline: none;
    }
    select:focus, input:focus { border-color: var(--primary); }

    /* 题目 */
    .question-card {
      background: var(--surface); border-radius: var(--radius); padding: 20px;
      margin-bottom: 16px; border: 1px solid var(--border);
    }
    .question-card .q-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 12px;
    }
    .question-card .q-type {
      font-size: 12px; padding: 2px 8px; border-radius: 4px;
      background: var(--surface2); color: var(--text2);
    }
    .question-card .q-content { font-size: 15px; line-height: 1.8; margin-bottom: 16px; }
    .option-list { list-style: none; }
    .option-item {
      padding: 10px 14px; margin-bottom: 8px; border-radius: 8px;
      border: 1px solid var(--border); cursor: pointer; transition: all 0.2s;
    }
    .option-item:hover { border-color: var(--primary); background: var(--surface2); }
    .option-item.selected { border-color: var(--primary); background: rgba(67,97,238,0.15); }
    .option-item.correct { border-color: var(--success); background: rgba(6,214,160,0.15); }
    .option-item.wrong { border-color: var(--danger); background: rgba(239,71,111,0.15); }

    /* 申论 */
    .essay-area {
      width: 100%; min-height: 300px; background: var(--surface2);
      color: var(--text); border: 1px solid var(--border); border-radius: 8px;
      padding: 16px; font-size: 14px; line-height: 2; resize: vertical;
      outline: none; font-family: inherit;
    }
    .essay-area:focus { border-color: var(--primary); }

    /* 评分结果 */
    .score-display {
      text-align: center; padding: 20px;
    }
    .score-display .score {
      font-size: 48px; font-weight: 700;
    }
    .score-display .score.good { color: var(--success); }
    .score-display .score.medium { color: var(--warning); }
    .score-display .score.poor { color: var(--danger); }

    .detail-grid {
      display: grid; grid-template-columns: repeat(2, 1fr);
      gap: 12px; margin-top: 16px;
    }
    .detail-item {
      background: var(--surface2); border-radius: 8px; padding: 12px;
    }
    .detail-item .d-label { font-size: 12px; color: var(--text2); }
    .detail-item .d-score { font-size: 18px; font-weight: 600; }

    /* 进度条 */
    .progress-bar {
      height: 6px; background: var(--surface2); border-radius: 3px;
      overflow: hidden; margin-top: 8px;
    }
    .progress-bar .fill {
      height: 100%; border-radius: 3px; transition: width 0.3s;
    }

    /* 知识库 */
    .knowledge-item {
      background: var(--surface); border-radius: var(--radius);
      padding: 16px; margin-bottom: 12px; border: 1px solid var(--border);
      cursor: pointer; transition: all 0.2s;
    }
    .knowledge-item:hover { border-color: var(--primary); }
    .knowledge-item h4 { margin-bottom: 6px; color: var(--primary-light); }
    .knowledge-item p { font-size: 13px; color: var(--text2); line-height: 1.6; }

    /* 加载动画 */
    .loading { text-align: center; padding: 40px; color: var(--text2); }
    .spinner {
      display: inline-block; width: 24px; height: 24px;
      border: 3px solid var(--border); border-top-color: var(--primary);
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* 响应式 */
    @media (max-width: 600px) {
      .app { padding: 12px; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .detail-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
<div class="app">
  <div class="tabs">
    <button class="tab active" onclick="switchTab('practice')">刷题</button>
    <button class="tab" onclick="switchTab('essay')">申论</button>
    <button class="tab" onclick="switchTab('wrong')">错题本</button>
    <button class="tab" onclick="switchTab('knowledge')">知识库</button>
    <button class="tab" onclick="switchTab('stats')">统计</button>
  </div>

  <!-- 刷题面板 -->
  <div id="panel-practice" class="panel active">
    <div class="card">
      <h3>智能组卷</h3>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:end;">
        <div>
          <label style="font-size:12px;color:var(--text2);">科目</label>
          <select id="practice-subject">
            <option value="xingce">行测</option>
            <option value="shenlun">申论</option>
          </select>
        </div>
        <div>
          <label style="font-size:12px;color:var(--text2);">难度</label>
          <select id="practice-difficulty">
            <option value="">不限</option>
            <option value="easy">简单</option>
            <option value="medium">中等</option>
            <option value="hard">困难</option>
          </select>
        </div>
        <div>
          <label style="font-size:12px;color:var(--text2);">题数</label>
          <input type="number" id="practice-count" value="10" min="5" max="100" style="width:70px;">
        </div>
        <button class="btn btn-primary" onclick="generatePaper()">开始练习</button>
        <button class="btn btn-outline" onclick="generatePaper(true)">侧重薄弱项</button>
      </div>
    </div>
    <div id="practice-area"></div>
  </div>

  <!-- 申论面板 -->
  <div id="panel-essay" class="panel">
    <div class="card">
      <h3>申论练习</h3>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:end;margin-bottom:16px;">
        <div>
          <label style="font-size:12px;color:var(--text2);">题型</label>
          <select id="essay-module">
            <option value="guina">归纳概括</option>
            <option value="tichu">提出对策</option>
            <option value="zonghe">综合分析</option>
            <option value="guanche">贯彻执行</option>
            <option value="dawen">大作文</option>
          </select>
        </div>
        <button class="btn btn-primary" onclick="loadEssayPrompt()">获取题目</button>
      </div>
    </div>
    <div id="essay-prompt-area"></div>
    <div id="essay-input-area" style="display:none;">
      <div class="card">
        <h3>作答区</h3>
        <textarea id="essay-text" class="essay-area" placeholder="在此输入你的申论作答..."></textarea>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;">
          <span id="essay-word-count" style="font-size:12px;color:var(--text2);">0 字</span>
          <button class="btn btn-primary" onclick="submitEssay()">提交阅卷</button>
        </div>
      </div>
    </div>
    <div id="essay-result-area"></div>
  </div>

  <!-- 错题本面板 -->
  <div id="panel-wrong" class="panel">
    <div class="card">
      <h3>错题本</h3>
      <div style="display:flex;gap:12px;align-items:end;">
        <select id="wrong-subject" onchange="loadWrongQuestions()">
          <option value="">全部科目</option>
          <option value="1">行测</option>
          <option value="2">申论</option>
        </select>
        <button class="btn btn-outline btn-sm" onclick="loadWrongQuestions()">刷新</button>
      </div>
    </div>
    <div id="wrong-questions-area"></div>
  </div>

  <!-- 知识库面板 -->
  <div id="panel-knowledge" class="panel">
    <div class="card">
      <h3>知识库</h3>
      <div style="display:flex;gap:12px;align-items:end;">
        <select id="knowledge-subject" onchange="loadKnowledge()">
          <option value="">全部科目</option>
          <option value="1">行测</option>
          <option value="2">申论</option>
        </select>
        <input type="text" id="knowledge-search" placeholder="搜索..." style="flex:1;">
        <button class="btn btn-primary btn-sm" onclick="loadKnowledge()">搜索</button>
      </div>
    </div>
    <div id="knowledge-area"></div>
  </div>

  <!-- 统计面板 -->
  <div id="panel-stats" class="panel">
    <div id="stats-area"><div class="loading"><div class="spinner"></div><br>加载中...</div></div>
  </div>
</div>

<script>
const API_BASE = '/api/plugins/gongkao-assistant';

// ── 工具函数 ──────────────────────────────────────────────────────────
async function api(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error('API error: ' + res.status);
  return res.json();
}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('panel-' + name).classList.add('active');
  if (name === 'stats') loadStats();
  if (name === 'wrong') loadWrongQuestions();
  if (name === 'knowledge') loadKnowledge();
}

// ── 刷题 ──────────────────────────────────────────────────────────────
let currentQuestions = [];
let currentAnswers = {};
let practiceSubmitted = false;

async function generatePaper(weakFocus = false) {
  const area = document.getElementById('practice-area');
  area.innerHTML = '<div class="loading"><div class="spinner"></div><br>组卷中...</div>';

  const subject = document.getElementById('practice-subject').value;
  const difficulty = document.getElementById('practice-difficulty').value;
  const count = parseInt(document.getElementById('practice-count').value) || 10;

  try {
    const data = await api('/papers/generate', {
      method: 'POST',
      body: JSON.stringify({ subject, difficulty, count, focusWeakAreas: weakFocus }),
    });
    currentQuestions = data.paper.questions || [];
    currentAnswers = {};
    practiceSubmitted = false;
    renderQuestions();
  } catch (e) {
    area.innerHTML = '<div class="card"><p>组卷失败：' + e.message + '</p></div>';
  }
}

function renderQuestions() {
  const area = document.getElementById('practice-area');
  if (currentQuestions.length === 0) {
    area.innerHTML = '<div class="card"><p>暂无题目，请先导入题库</p></div>';
    return;
  }

  let html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">';
  html += '<span style="color:var(--text2);font-size:13px;">共 ' + currentQuestions.length + ' 题</span>';
  html += '<button class="btn btn-primary" onclick="submitPractice()" id="submit-btn">提交答案</button>';
  html += '</div>';

  currentQuestions.forEach((q, i) => {
    html += '<div class="question-card" id="q-' + q.id + '">';
    html += '<div class="q-header"><span style="font-weight:600;">第 ' + (i+1) + ' 题</span>';
    html += '<span class="q-type">' + ({single_choice:'单选',multi_choice:'多选',judge:'判断',fill:'填空',essay_prompt:'申论'}[q.type]||q.type) + '</span></div>';
    html += '<div class="q-content">' + q.content + '</div>';

    if (q.options && Array.isArray(q.options)) {
      html += '<ul class="option-list">';
      q.options.forEach((opt, j) => {
        const letter = String.fromCharCode(65 + j);
        html += '<li class="option-item" data-qid="' + q.id + '" data-val="' + letter + '" onclick="selectOption(this,' + q.id + ',\'' + letter + '\')">';
        html += letter + '. ' + opt;
        html += '</li>';
      });
      html += '</ul>';
    }
    html += '</div>';
  });

  area.innerHTML = html;
}

function selectOption(el, qid, val) {
  if (practiceSubmitted) return;
  document.querySelectorAll('[data-qid="' + qid + '"]').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  currentAnswers[qid] = val;
}

async function submitPractice() {
  if (practiceSubmitted) return;
  practiceSubmitted = true;

  const answers = Object.entries(currentAnswers).map(([qid, ans]) => ({
    question_id: parseInt(qid),
    user_answer: ans,
    time_spent_ms: 0,
  }));

  try {
    const data = await api('/practice/batch', {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });

    // 显示结果
    data.results.forEach(r => {
      const card = document.getElementById('q-' + r.question_id);
      if (!card) return;
      document.querySelectorAll('[data-qid="' + r.questionId + '"]').forEach(el => {
        if (el.dataset.val === r.correctAnswer) el.classList.add('correct');
        else if (el.dataset.val === currentAnswers[r.questionId]) el.classList.add('wrong');
      });
      const resultHtml = '<div style="margin-top:12px;padding:12px;border-radius:8px;background:' +
        (r.isCorrect ? 'rgba(6,214,160,0.1)' : 'rgba(239,71,111,0.1)') + ';">' +
        '<strong>' + (r.isCorrect ? '正确' : '错误') + '</strong>' +
        (r.explanation ? '<p style="margin-top:8px;font-size:13px;color:var(--text2);">' + r.explanation + '</p>' : '') +
        '</div>';
      card.insertAdjacentHTML('beforeend', resultHtml);
    });

    const btn = document.getElementById('submit-btn');
    btn.textContent = '正确率: ' + data.accuracy + '%';
    btn.disabled = true;
  } catch (e) {
    alert('提交失败：' + e.message);
    practiceSubmitted = false;
  }
}

// ── 申论 ──────────────────────────────────────────────────────────────
let currentEssayTopic = null;

async function loadEssayPrompt() {
  const moduleCode = document.getElementById('essay-module').value;
  const area = document.getElementById('essay-prompt-area');
  area.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const data = await api('/essay/prompts?moduleCode=' + moduleCode);
    if (data.prompts && data.prompts.length > 0) {
      currentEssayTopic = data.prompts[0];
      area.innerHTML = '<div class="card"><h3>题目</h3><p style="line-height:1.8;">' +
        currentEssayTopic.content + '</p></div>';
      document.getElementById('essay-input-area').style.display = 'block';
      document.getElementById('essay-result-area').innerHTML = '';
    } else {
      area.innerHTML = '<div class="card"><p>暂无该题型题目，请先导入题库</p></div>';
    }
  } catch (e) {
    area.innerHTML = '<div class="card"><p>加载失败</p></div>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const essayText = document.getElementById('essay-text');
  if (essayText) {
    essayText.addEventListener('input', () => {
      document.getElementById('essay-word-count').textContent = essayText.value.length + ' 字';
    });
  }
});

async function submitEssay() {
  const essay = document.getElementById('essay-text').value.trim();
  if (!essay) { alert('请输入申论作答'); return; }

  const resultArea = document.getElementById('essay-result-area');
  resultArea.innerHTML = '<div class="card"><div class="loading"><div class="spinner"></div><br>AI阅卷中，请稍候...</div></div>';

  const moduleCode = document.getElementById('essay-module').value;
  const moduleMap = {guina:6,tichu:7,zonghe:8,guanche:9,dawen:10};

  try {
    const data = await api('/essay/submit', {
      method: 'POST',
      body: JSON.stringify({
        module_id: moduleMap[moduleCode],
        topic: currentEssayTopic?.content || '自由练习',
        requirements: currentEssayTopic?.requirements || '',
        essay,
      }),
    });

    if (data.score !== null) {
      const scoreClass = data.score >= 70 ? 'good' : data.score >= 50 ? 'medium' : 'poor';
      let html = '<div class="card">';
      html += '<div class="score-display"><div class="score ' + scoreClass + '">' + data.score + '</div><div style="color:var(--text2);">/ 100</div></div>';
      if (data.feedback) {
        html += '<div style="margin-top:16px;padding:16px;background:var(--surface2);border-radius:8px;line-height:1.8;">' + data.feedback + '</div>';
      }
      if (data.details) {
        html += '<div class="detail-grid">';
        const labels = {content:'内容',structure:'结构',language:'语言',logic:'逻辑'};
        for (const [k,v] of Object.entries(data.details)) {
          if (v && v.score !== undefined) {
            html += '<div class="detail-item"><div class="d-label">' + (labels[k]||k) + '</div>';
            html += '<div class="d-score">' + v.score + '/' + v.max + '</div>';
            html += '<div style="font-size:12px;color:var(--text2);margin-top:4px;">' + (v.comment||'') + '</div></div>';
          }
        }
        html += '</div>';
      }
      html += '</div>';
      resultArea.innerHTML = html;
    } else {
      resultArea.innerHTML = '<div class="card"><p>阅卷失败：' + (data.scoringError||'未知错误') + '</p></div>';
    }
  } catch (e) {
    resultArea.innerHTML = '<div class="card"><p>提交失败：' + e.message + '</p></div>';
  }
}

// ── 错题本 ────────────────────────────────────────────────────────────
async function loadWrongQuestions() {
  const area = document.getElementById('wrong-questions-area');
  area.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  const subjectId = document.getElementById('wrong-subject').value;
  let url = '/practice/wrong-questions?limit=20&mastered=0';
  if (subjectId) url += '&subjectId=' + subjectId;

  try {
    const data = await api(url);
    if (data.wrongQuestions.length === 0) {
      area.innerHTML = '<div class="card"><p style="text-align:center;color:var(--text2);">暂无错题，继续保持！</p></div>';
      return;
    }

    let html = '';
    data.wrongQuestions.forEach(wq => {
      const q = wq.question || wq;
      html += '<div class="question-card">';
      html += '<div class="q-header"><span>错题 #' + (q.id||wq.question_id) + '</span>';
      html += '<span class="q-type">复习 ' + (wq.review_count||0) + ' 次</span></div>';
      html += '<div class="q-content">' + (q.content||'') + '</div>';
      if (q.options) {
        try {
          const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
          if (Array.isArray(opts)) {
            html += '<ul class="option-list">';
            opts.forEach((opt, j) => {
              const letter = String.fromCharCode(65 + j);
              const isCorrect = q.answer && q.answer.includes(letter);
              html += '<li class="option-item' + (isCorrect ? ' correct' : '') + '">' + letter + '. ' + opt + '</li>';
            });
            html += '</ul>';
          }
        } catch {}
      }
      html += '<div style="margin-top:12px;padding:12px;background:var(--surface2);border-radius:8px;font-size:13px;color:var(--text2);">';
      html += '<strong style="color:var(--success);">正确答案：</strong>' + (q.answer||'') + '<br>';
      if (q.explanation) html += '<strong style="color:var(--primary-light);">解析：</strong>' + q.explanation;
      html += '</div>';
      html += '<div style="margin-top:8px;display:flex;gap:8px;">';
      html += '<button class="btn btn-success btn-sm" onclick="markMastered(' + wq.id + ')">已掌握</button>';
      html += '</div></div>';
    });
    area.innerHTML = html;
  } catch (e) {
    area.innerHTML = '<div class="card"><p>加载失败</p></div>';
  }
}

async function markMastered(id) {
  try {
    await api('/practice/wrong-questions/' + id + '/review', {
      method: 'POST',
      body: JSON.stringify({ mastered: true }),
    });
    loadWrongQuestions();
  } catch (e) {}
}

// ── 知识库 ────────────────────────────────────────────────────────────
async function loadKnowledge() {
  const area = document.getElementById('knowledge-area');
  area.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  const subjectId = document.getElementById('knowledge-subject').value;
  const search = document.getElementById('knowledge-search').value;
  let url = '/knowledge?limit=30';
  if (subjectId) url += '&subjectId=' + subjectId;
  if (search) url += '&search=' + encodeURIComponent(search);

  try {
    const data = await api(url);
    if (data.entries.length === 0) {
      area.innerHTML = '<div class="card"><p style="text-align:center;color:var(--text2);">暂无知识条目</p></div>';
      return;
    }
    let html = '';
    data.entries.forEach(e => {
      html += '<div class="knowledge-item">';
      html += '<h4>' + e.title + '</h4>';
      html += '<p>' + (e.content.length > 200 ? e.content.substring(0,200) + '...' : e.content) + '</p>';
      html += '</div>';
    });
    area.innerHTML = html;
  } catch (e) {
    area.innerHTML = '<div class="card"><p>加载失败</p></div>';
  }
}

// ── 统计 ──────────────────────────────────────────────────────────────
async function loadStats() {
  const area = document.getElementById('stats-area');
  area.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const data = await api('/stats/overview');
    const s = data;
    let html = '<div class="stats-grid">';
    html += '<div class="stat-card"><div class="value">' + (s.total?.practiced||0) + '</div><div class="label">总做题数</div></div>';
    html += '<div class="stat-card"><div class="value">' + (s.xingce?.accuracy||0) + '%</div><div class="label">行测正确率</div></div>';
    html += '<div class="stat-card"><div class="value">' + (s.total?.wrongCount||0) + '</div><div class="label">待复习错题</div></div>';
    html += '<div class="stat-card"><div class="value">' + (s.recent7Days?.total||0) + '</div><div class="label">近7天做题</div></div>';
    html += '</div>';

    // 行测模块统计
    try {
      const moduleData = await api('/stats/by-module?subjectId=1');
      if (moduleData.moduleStats && moduleData.moduleStats.length > 0) {
        html += '<div class="card"><h3>行测模块正确率</h3>';
        moduleData.moduleStats.forEach(m => {
          const color = m.accuracy >= 70 ? 'var(--success)' : m.accuracy >= 50 ? 'var(--warning)' : 'var(--danger)';
          html += '<div style="margin-bottom:12px;">';
          html += '<div style="display:flex;justify-content:space-between;font-size:13px;">';
          html += '<span>' + m.moduleName + '</span><span style="color:' + color + ';">' + m.accuracy + '%</span></div>';
          html += '<div class="progress-bar"><div class="fill" style="width:' + m.accuracy + '%;background:' + color + ';"></div></div>';
          html += '</div>';
        });
        html += '</div>';
      }
    } catch {}

    // 每日趋势
    try {
      const dailyData = await api('/stats/daily?days=14');
      if (dailyData.dailyStats && dailyData.dailyStats.length > 0) {
        html += '<div class="card"><h3>近14天做题趋势</h3>';
        html += '<div style="display:flex;align-items:end;gap:4px;height:120px;">';
        const maxTotal = Math.max(...dailyData.dailyStats.map(d => d.total), 1);
        dailyData.dailyStats.reverse().forEach(d => {
          const h = Math.max((d.total / maxTotal) * 100, 4);
          const color = d.accuracy >= 70 ? 'var(--success)' : d.accuracy >= 50 ? 'var(--warning)' : 'var(--danger)';
          html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;">';
          html += '<div style="width:100%;height:' + h + 'px;background:' + color + ';border-radius:3px 3px 0 0;min-height:4px;"></div>';
          html += '<span style="font-size:10px;color:var(--text2);margin-top:4px;">' + d.date.slice(5) + '</span></div>';
        });
        html += '</div></div>';
      }
    } catch {}

    area.innerHTML = html;
  } catch (e) {
    area.innerHTML = '<div class="card"><p>加载统计失败</p></div>';
  }
}

// 初始化加载统计
loadStats();
</script>
</body>
</html>`;
}

function renderWidgetPage(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>今日刷题</title>
  <style>
    :root {
      --bg: #1a1a2e; --surface: #16213e; --primary: #4361ee;
      --primary-light: #4895ef; --success: #06d6a0; --danger: #ef476f;
      --text: #e8e8e8; --text2: #a0a0b0; --border: #2a2a4a; --radius: 8px;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, sans-serif; background: var(--bg); color: var(--text); padding: 12px; }
    .card { background: var(--surface); border-radius: var(--radius); padding: 14px; margin-bottom: 10px; border: 1px solid var(--border); }
    .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }
    .btn-primary { background: var(--primary); color: #fff; }
    .option-item { padding: 8px 12px; margin-bottom: 6px; border-radius: 6px; border: 1px solid var(--border); cursor: pointer; font-size: 13px; }
    .option-item:hover { border-color: var(--primary); }
    .option-item.selected { border-color: var(--primary); background: rgba(67,97,238,0.15); }
    .option-item.correct { border-color: var(--success); background: rgba(6,214,160,0.15); }
    .option-item.wrong { border-color: var(--danger); background: rgba(239,71,111,0.15); }
  </style>
</head>
<body>
  <div id="widget-content"><div class="card" style="text-align:center;color:var(--text2);">加载中...</div></div>
  <script>
  const API_BASE = '/api/plugins/gongkao-assistant';
  async function api(path, options = {}) {
    const res = await fetch(API_BASE + path, { headers: { 'Content-Type': 'application/json', ...options.headers }, ...options });
    return res.json();
  }

  let currentQ = null, selected = null, answered = false;

  async function loadNext() {
    selected = null; answered = false;
    const data = await api('/papers/generate', {
      method: 'POST',
      body: JSON.stringify({ subject: 'xingce', count: 1, difficulty: 'medium' }),
    });
    currentQ = data.paper?.questions?.[0];
    render();
  }

  function render() {
    const el = document.getElementById('widget-content');
    if (!currentQ) { el.innerHTML = '<div class="card" style="text-align:center;color:var(--text2);">暂无题目</div>'; return; }
    let html = '<div class="card"><div style="font-size:14px;line-height:1.7;margin-bottom:12px;">' + currentQ.content + '</div>';
    if (currentQ.options) {
      currentQ.options.forEach((opt, i) => {
        const letter = String.fromCharCode(65+i);
        html += '<div class="option-item" onclick="pick(this,\\''+letter+'\\')">' + letter + '. ' + opt + '</div>';
      });
    }
    html += '<div style="margin-top:10px;"><button class="btn btn-primary" onclick="submit()">提交</button></div></div>';
    el.innerHTML = html;
  }

  function pick(el, val) { if(answered) return; selected=val; document.querySelectorAll('.option-item').forEach(e=>e.classList.remove('selected')); el.classList.add('selected'); }

  async function submit() {
    if(!selected||answered) return; answered=true;
    const data = await api('/practice/submit', {
      method:'POST', body: JSON.stringify({ question_id: currentQ.id, user_answer: selected }),
    });
    document.querySelectorAll('.option-item').forEach(el => {
      if(el.textContent.startsWith(data.correctAnswer)) el.classList.add('correct');
      else if(el.classList.contains('selected')) el.classList.add('wrong');
    });
    setTimeout(loadNext, 2000);
  }

  loadNext();
  </script>
</body>
</html>`;
}
