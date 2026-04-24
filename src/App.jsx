import { useState, useEffect, useRef } from "react";
import { 
  Home, Syringe, Utensils, Activity, TrendingUp, 
  Flame, Droplet, Dumbbell, Ruler, Camera, CheckCircle, 
  Search, ShoppingCart, ChefHat, PlusCircle, ArrowRight,
  Frown, Meh, Smile, AlertCircle, Lightbulb, Target, X, Plus, Minus
} from "lucide-react";

const INJECTION_SITES = ["Barriga Direita", "Barriga Esquerda", "Coxa Direita", "Coxa Esquerda", "Braço Direito", "Braço Esquerdo"];
const DOSES = ["2mg", "2.5mg", "5mg", "7.5mg", "10mg", "12.5mg", "15mg"];
const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentário", desc: "Pouco ou nenhum exercício", multiplier: 1.2 },
  { value: "light", label: "Leve", desc: "Exercício 1-3x por semana", multiplier: 1.375 },
  { value: "moderate", label: "Moderado", desc: "Exercício 4-5x por semana", multiplier: 1.55 },
  { value: "intense", label: "Intenso", desc: "Exercício diário ou pesado", multiplier: 1.725 },
];
const SYMPTOMS = ["Náusea", "Dor de cabeça", "Fadiga", "Intestino preso", "Tontura", "Boca seca"];
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function loadData(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function saveData(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function calcBMI(weight, height) {
  if (!weight || !height) return null;
  const h = height / 100;
  return (weight / (h * h)).toFixed(1);
}

function calcTDEE(profile) {
  if (!profile.weight || !profile.height || !profile.age) return null;
  const bmr = profile.gender === "female"
    ? 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161
    : 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
  const act = ACTIVITY_LEVELS.find(a => a.value === profile.activityLevel);
  return Math.round(bmr * (act?.multiplier ?? 1.375));
}

function calcProtein(weight) {
  return weight ? Math.round(weight * 2) : null;
}

function calcWater(weight) {
  return weight ? (weight * 35 / 1000).toFixed(1) : null;
}

// ─── COMPONENTE DE BUSCA DE API E BANCO LOCAL ─────────────────────────────
function BuscaAlimento({ onSelectFood }) {
  const [busca, setBusca] = useState('');
  const [resultadosAPI, setResultadosAPI] = useState([]);
  const [resultadosLocais, setResultadosLocais] = useState([]);
  const [carregando, setCarregando] = useState(false);

  const ALIMENTOS_CASEIROS = [
    { id: 'c1', name: "Arroz branco (cozido)", calories: "130", protein: "2.5", carbs: "28", fat: "0.2" },
    { id: 'c2', name: "Feijão carioca (cozido)", calories: "76", protein: "4.8", carbs: "13.6", fat: "0.5" },
    { id: 'c3', name: "Ovo de galinha (frito)", calories: "240", protein: "15.6", carbs: "1.2", fat: "18.9" },
    { id: 'c4', name: "Ovo de galinha (cozido)", calories: "146", protein: "13.3", carbs: "0.6", fat: "9.5" },
    { id: 'c5', name: "Peito de frango (grelhado)", calories: "159", protein: "32", carbs: "0", fat: "2.5" },
    { id: 'c6', name: "Carne moída / Patinho (cozido)", calories: "219", protein: "28.8", carbs: "0", fat: "10.5" },
    { id: 'c7', name: "Bife de contrafilé (grelhado)", calories: "278", protein: "29.3", carbs: "0", fat: "16.9" },
    { id: 'c8', name: "Batata inglesa (cozida)", calories: "52", protein: "1.2", carbs: "11.9", fat: "0.1" },
    { id: 'c9', name: "Batata doce (cozida)", calories: "77", protein: "0.6", carbs: "18.4", fat: "0.1" },
    { id: 'c10', name: "Cuscuz de milho (cozido)", calories: "113", protein: "2.2", carbs: "25.3", fat: "0.7" },
    { id: 'c11', name: "Tapioca (goma hidratada)", calories: "336", protein: "0", carbs: "82", fat: "0" },
    { id: 'c12', name: "Pão francês", calories: "300", protein: "8", carbs: "58", fat: "3" },
    { id: 'c13', name: "Banana prata (crua)", calories: "98", protein: "1.3", carbs: "26", fat: "0.1" },
    { id: 'c14', name: "Maçã (crua)", calories: "52", protein: "0.3", carbs: "13.8", fat: "0.2" },
    { id: 'c15', name: "Alface / Salada verde", calories: "14", protein: "1.3", carbs: "2.4", fat: "0.2" },
    { id: 'c16', name: "Aveia em flocos", calories: "394", protein: "13.9", carbs: "66.6", fat: "8.5" },
    { id: 'c17', name: "Macarrão (cozido)", calories: "157", protein: "5.8", carbs: "31", fat: "0.9" },
    { id: 'c18', name: "Leite integral", calories: "62", protein: "3.2", carbs: "4.8", fat: "3.2" },
  ];

  const buscarNaApiELocal = async () => {
    if (!busca) return;
    setCarregando(true);
    
    const termo = busca.toLowerCase();
    const filtrados = ALIMENTOS_CASEIROS.filter(item => item.name.toLowerCase().includes(termo));
    setResultadosLocais(filtrados);

    try {
      const url = `https://br.openfoodfacts.org/cgi/search.pl?search_terms=${busca}&search_simple=1&action=process&json=1&page_size=5`;
      const resposta = await fetch(url);
      const dados = await resposta.json();
      setResultadosAPI(dados.products || []);
    } catch (erro) {
      console.error("Erro na busca da API:", erro);
    } finally {
      setCarregando(false);
    }
  };

  const selecionarItem = (alimento) => {
    onSelectFood(alimento);
    setResultadosLocais([]);
    setResultadosAPI([]);
    setBusca('');
  };

  return (
    <div className="api-search-card">
      <h3 style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
        <Search size={16} /> Buscar Alimento
      </h3>
      <p className="ob-subtitle" style={{fontSize:"0.75rem", marginBottom:"0.8rem", textAlign:"left"}}>
        Busque alimentos para preencher os dados (valores base para 100g).
      </p>
      <div className="api-search-row">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Ex: ovo, frango, aveia..."
          className="meal-input"
          style={{marginBottom: 0}}
          onKeyDown={(e) => e.key === 'Enter' && buscarNaApiELocal()}
        />
        <button onClick={buscarNaApiELocal} className="register-btn" style={{width: 'auto', padding: '0.65rem 1rem'}}>
          {carregando ? '...' : 'Ir'}
        </button>
      </div>

      {(resultadosLocais.length > 0 || resultadosAPI.length > 0) && (
        <div className="api-results">
          
          {resultadosLocais.length > 0 && (
            <p style={{fontSize: '0.75rem', color: '#059669', marginTop: '0.5rem', marginBottom: '0.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px'}}>
              <ChefHat size={14} /> Alimentos Caseiros (TACO)
            </p>
          )}
          {resultadosLocais.map((produto) => (
            <div key={produto.id} className="api-result-item" style={{borderColor: '#a7f3d0', background: '#ecfdf5'}} onClick={() => selecionarItem({...produto})}>
              <strong style={{color: '#065f46'}}>{produto.name}</strong>
              <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{display: 'flex', alignItems: 'center', gap: '2px'}}><Flame size={12}/> {produto.calories} kcal</span>
                <span style={{display: 'flex', alignItems: 'center', gap: '2px'}}><Dumbbell size={12}/> {produto.protein}g prot</span>
              </span>
              <div className="api-add-btn" style={{color: '#059669', background: '#d1fae5'}}><PlusCircle size={14} /> Usar</div>
            </div>
          ))}

          {resultadosAPI.length > 0 && (
            <p style={{fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.8rem', marginBottom: '0.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px'}}>
              <ShoppingCart size={14} /> Produtos de Mercado (Open Food)
            </p>
          )}
          {resultadosAPI.map((produto) => {
            const kcal = produto.nutriments?.['energy-kcal_100g'] || 0;
            const prot = produto.nutriments?.proteins_100g || 0;
            const carb = produto.nutriments?.carbohydrates_100g || 0;
            const fat = produto.nutriments?.fat_100g || 0;
            const nome = produto.product_name_pt || produto.product_name || 'Produto sem nome';

            return (
              <div key={produto._id} className="api-result-item" onClick={() => selecionarItem({ 
                  name: nome, calories: Math.round(kcal).toString(), protein: Math.round(prot).toString(), 
                  carbs: Math.round(carb).toString(), fat: Math.round(fat).toString() })}>
                <strong>{nome}</strong>
                <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <span style={{display: 'flex', alignItems: 'center', gap: '2px'}}><Flame size={12}/> {Math.round(kcal)} kcal</span>
                  <span style={{display: 'flex', alignItems: 'center', gap: '2px'}}><Dumbbell size={12}/> {Math.round(prot)}g prot</span>
                </span>
                <div className="api-add-btn"><PlusCircle size={14} /> Usar</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    name: "", age: "", gender: "female", height: "", weight: "",
    activityLevel: "light", goalWeight: "", focus: "weight_loss",
    dose: "2mg", 
    injectionDay: 1, injectionTime: "08:00",
  });

  const set = (k, v) => setProfile(p => ({ ...p, [k]: v }));

  const steps = [
    <div key="welcome" className="ob-step">
      <div className="ob-icon-wrapper"><Syringe size={48} color="#3b82f6" /></div>
      <h1>Mounjaro<span>Track</span></h1>
      <p className="ob-subtitle">Seu companheiro inteligente para acompanhar sua jornada com tirzepatida.</p>
      <input className="ob-input" placeholder="Como você se chama?" value={profile.name} onChange={e => set("name", e.target.value)} />
      <button className="ob-btn" onClick={() => setStep(1)} disabled={!profile.name.trim()}>
        Começar <ArrowRight size={18} style={{marginLeft: '6px'}} />
      </button>
    </div>,

    <div key="bio" className="ob-step">
      <div className="ob-step-header">
        <span className="ob-step-num">1 / 3</span>
        <h2>Seus dados</h2>
        <p>Para calcular seu IMC e metas automaticamente</p>
      </div>
      <div className="ob-row">
        <div className="ob-field"><label>Idade</label><input type="number" placeholder="25" value={profile.age} onChange={e => set("age", e.target.value)} /></div>
        <div className="ob-field"><label>Gênero</label><select value={profile.gender} onChange={e => set("gender", e.target.value)}><option value="female">Feminino</option><option value="male">Masculino</option></select></div>
      </div>
      <div className="ob-row">
        <div className="ob-field"><label>Altura (cm)</label><input type="number" placeholder="165" value={profile.height} onChange={e => set("height", e.target.value)} /></div>
        <div className="ob-field"><label>Peso atual (kg)</label><input type="number" placeholder="80" value={profile.weight} onChange={e => set("weight", e.target.value)} /></div>
      </div>
      <div className="ob-field"><label>Peso meta (kg)</label><input type="number" placeholder="65" value={profile.goalWeight} onChange={e => set("goalWeight", e.target.value)} /></div>
      
      <div className="ob-field">
        <label>Nível de atividade física</label>
        <div className="ob-grid2">
          {ACTIVITY_LEVELS.map(a => (
            <button key={a.value} className={`ob-card ${profile.activityLevel === a.value ? "selected" : ""}`} onClick={() => set("activityLevel", a.value)}>
              <strong>{a.label}</strong><span>{a.desc}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="ob-field">
        <label>Foco principal</label>
        <div className="ob-grid2">
          {[
            { value: "weight_loss", label: "Emagrecimento", desc: "Foco em perder gordura", icon: <Flame size={16} /> },
            { value: "measures", label: "Medidas", desc: "Reduzir circunferências", icon: <Ruler size={16} /> },
            { value: "health", label: "Saúde geral", desc: "Bem-estar e qualidade", icon: <Activity size={16} /> },
            { value: "lean", label: "Massa magra", desc: "Emagrecer e definir", icon: <Dumbbell size={16} /> },
          ].map(f => (
            <button key={f.value} className={`ob-card ${profile.focus === f.value ? "selected" : ""}`} onClick={() => set("focus", f.value)}>
              <strong style={{display: 'flex', alignItems: 'center', gap: '6px'}}>{f.icon} {f.label}</strong>
              <span>{f.desc}</span>
            </button>
          ))}
        </div>
      </div>
      <button className="ob-btn" onClick={() => setStep(2)}>Próximo <ArrowRight size={18} style={{marginLeft: '6px'}} /></button>
    </div>,

    <div key="med" className="ob-step">
      <div className="ob-step-header"><span className="ob-step-num">2 / 3</span><h2>Sua medicação</h2><p>Configure seu cronograma de Mounjaro</p></div>
      <div className="ob-field"><label>Dose atual</label><div className="ob-doses">{DOSES.map(d => (<button key={d} className={`ob-dose ${profile.dose === d ? "selected" : ""}`} onClick={() => set("dose", d)}>{d}</button>))}</div></div>
      <div className="ob-field"><label>Dia da aplicação</label><div className="ob-weekdays">{WEEKDAYS.map((d, i) => (<button key={i} className={`ob-day ${profile.injectionDay === i ? "selected" : ""}`} onClick={() => set("injectionDay", i)}>{d}</button>))}</div></div>
      <div className="ob-field"><label>Horário da aplicação</label><input type="time" value={profile.injectionTime} onChange={e => set("injectionTime", e.target.value)} /></div>
      <button className="ob-btn" onClick={() => setStep(3)}>Próximo <ArrowRight size={18} style={{marginLeft: '6px'}} /></button>
    </div>,

    <div key="done" className="ob-step ob-done">
      <div className="ob-check"><CheckCircle size={40} color="#fff" /></div>
      <h2>Tudo pronto, {profile.name.split(" ")[0]}!</h2>
      {profile.weight && profile.height && (
        <div className="ob-summary">
          <div className="ob-sum-item"><span>IMC</span><strong>{calcBMI(Number(profile.weight), Number(profile.height))}</strong></div>
          <div className="ob-sum-item"><span>Meta calórica</span><strong>{calcTDEE(profile) ? calcTDEE(profile) + " kcal" : "—"}</strong></div>
          <div className="ob-sum-item"><span>Proteína diária</span><strong>{calcProtein(Number(profile.weight))}g</strong></div>
          <div className="ob-sum-item"><span>Água diária</span><strong>{calcWater(Number(profile.weight))}L</strong></div>
        </div>
      )}
      <button className="ob-btn" onClick={() => onComplete(profile)}>Entrar no app <ArrowRight size={18} style={{marginLeft: '6px'}} /></button>
    </div>,
  ];

  return (
    <div className="onboarding">
      <div className="ob-progress">{[0,1,2,3].map(i => <div key={i} className={`ob-dot ${i <= step ? "active" : ""}`} />)}</div>
      {steps[step]}
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "home", icon: <Home size={22} />, label: "Início" },
  { id: "meds", icon: <Syringe size={22} />, label: "Medicação" },
  { id: "nutrition", icon: <Utensils size={22} />, label: "Nutrição" },
  { id: "health", icon: <Activity size={22} />, label: "Saúde" },
  { id: "progress", icon: <TrendingUp size={22} />, label: "Progresso" },
];

// ─── HOME TAB ─────────────────────────────────────────────────────────────────
function HomeTab({ profile, logs, todayLog, setTodayLog }) {
  const today = new Date();
  const tdee = calcTDEE(profile);
  const protein = calcProtein(Number(profile.weight));
  const water = calcWater(Number(profile.weight));
  const bmi = calcBMI(Number(profile.weight), Number(profile.height));

  const weightLogs = logs.filter(l => l.weight).sort((a,b) => new Date(a.date)-new Date(b.date));
  const currentWeight = weightLogs.length ? weightLogs[weightLogs.length-1].weight : Number(profile.weight);
  const lostKg = (Number(profile.weight) - currentWeight).toFixed(1);
  const toGoKg = (currentWeight - Number(profile.goalWeight)).toFixed(1);

  const nextInjection = (() => {
    const now = new Date();
    const day = now.getDay();
    const diff = (profile.injectionDay - day + 7) % 7;
    const next = new Date(now);
    next.setDate(now.getDate() + (diff === 0 ? 7 : diff));
    next.setHours(...profile.injectionTime.split(":").map(Number), 0);
    return next;
  })();

  const daysUntil = Math.ceil((nextInjection - today) / (1000*60*60*24));

  const satieties = [
    { level: 1, icon: <Frown size={20} /> },
    { level: 2, icon: <Frown size={20} style={{opacity: 0.6}} /> },
    { level: 3, icon: <Meh size={20} /> },
    { level: 4, icon: <Smile size={20} style={{opacity: 0.8}} /> },
    { level: 5, icon: <Smile size={20} /> }
  ];

  return (
    <div className="tab-content">
      <div className="home-header">
        <div>
          <p className="greeting">Olá, {profile.name.split(" ")[0]}</p>
          <p className="date-label">{today.toLocaleDateString("pt-BR", { weekday:"long", day:"numeric", month:"long" })}</p>
        </div>
        <div className="bmi-badge"><span>IMC</span><strong>{bmi}</strong></div>
      </div>

      <div className="next-injection-card">
        <div className="inj-icon"><Syringe size={32} color="#3b82f6" /></div>
        <div>
          <p className="inj-label">Próxima aplicação</p>
          <p className="inj-date">{nextInjection.toLocaleDateString("pt-BR", { weekday:"long", day:"numeric" })}</p>
          <p className="inj-dose">{profile.dose} · {daysUntil === 0 ? "Hoje!" : `em ${daysUntil} dias`}</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card green"><span>Perdidos</span><strong>{lostKg > 0 ? lostKg : 0}kg</strong></div>
        <div className="stat-card orange"><span>Faltam</span><strong>{toGoKg > 0 ? toGoKg : 0}kg</strong></div>
        <div className="stat-card blue"><span>Calorias/dia</span><strong>{tdee} kcal</strong></div>
        <div className="stat-card purple"><span>Proteína</span><strong>{protein}g</strong></div>
      </div>

      <div className="quick-log-card">
        <h3>Registro rápido de hoje</h3>
        <div className="quick-row">
          <label>Peso hoje (kg)</label>
          <input type="number" placeholder={currentWeight} value={todayLog.weight || ""} onChange={e => setTodayLog(p => ({...p, weight: e.target.value}))} />
        </div>
        <div className="quick-row">
          <label>Nível de Saciedade</label>
          <div className="hunger-scale">
            {satieties.map(s => (
              <button key={s.level} className={`hunger-btn ${todayLog.satiety === s.level ? "selected" : ""}`} onClick={() => setTodayLog(p => ({...p, satiety: s.level}))}>
                {s.icon} {s.level}
              </button>
            ))}
          </div>
        </div>
        <div className="quick-row">
          <label>Água hoje ({water}L meta)</label>
          <div className="water-btns">
            <button onClick={() => setTodayLog(p => ({...p, water: Math.max(0,(p.water||0)-0.25)}))}><Minus size={16}/></button>
            <span>{(todayLog.water||0).toFixed(2)}L</span>
            <button onClick={() => setTodayLog(p => ({...p, water: (p.water||0)+0.25}))}><Plus size={16}/></button>
          </div>
          <div className="water-bar"><div className="water-fill" style={{width: `${Math.min(100, ((todayLog.water||0)/Number(water))*100)}%`}} /></div>
        </div>
      </div>
    </div>
  );
}

// ─── MEDS TAB ─────────────────────────────────────────────────────────────────
function MedsTab({ profile, setProfile, logs, setLogs }) {
  const [lastSite, setLastSite] = useState(loadData("lastSite", null));
  const [history, setHistory] = useState(loadData("injHistory", []));
  const [dose, setDose] = useState(profile.dose);

  const lastIdx = lastSite ? INJECTION_SITES.indexOf(lastSite) : -1;
  const nextIdx = (lastIdx + 1) % INJECTION_SITES.length;

  const registerInjection = () => {
    const site = INJECTION_SITES[nextIdx];
    const entry = { date: new Date().toISOString(), site, dose };
    const newHistory = [entry, ...history].slice(0, 20);
    setLastSite(site);
    setHistory(newHistory);
    saveData("lastSite", site);
    saveData("injHistory", newHistory);
    if (dose !== profile.dose) setProfile(p => ({...p, dose}));
    alert(`Aplicação registrada!\nLocal: ${site}\nDose: ${dose}`);
  };

  return (
    <div className="tab-content">
      <h2 className="tab-title">Medicação</h2>

      <div className="med-card">
        <h3>Dose atual</h3>
        <div className="ob-doses">
          {DOSES.map(d => (<button key={d} className={`ob-dose ${dose === d ? "selected" : ""}`} onClick={() => setDose(d)}>{d}</button>))}
        </div>
      </div>

      <div className="med-card rotation">
        <h3>Rodízio de aplicação</h3>
        <p className="rotation-subtitle">Sempre alterne os locais para melhor absorção</p>
        <div className="rotation-grid">
          {INJECTION_SITES.map((site, i) => (
            <div key={site} className={`rotation-site ${lastSite === site ? "last" : ""} ${i === nextIdx ? "next" : ""}`}>
              <div className="site-icon"><Target size={24} color={i === nextIdx ? "#10b981" : lastSite === site ? "#f87171" : "#9ca3af"} /></div>
              <span>{site}</span>
              {lastSite === site && <div className="site-badge last-badge">Última</div>}
              {i === nextIdx && <div className="site-badge next-badge">Próxima</div>}
            </div>
          ))}
        </div>
        <button className="register-btn" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'}} onClick={registerInjection}>
          <CheckCircle size={18} /> Registrar aplicação de hoje
        </button>
      </div>

      <div className="med-card">
        <h3>Histórico de aplicações</h3>
        {history.length === 0 ? (
          <p className="empty">Nenhuma aplicação registrada ainda</p>
        ) : (
          <div className="inj-history">
            {history.map((h, i) => (
              <div key={i} className="inj-row">
                <span className="inj-site">{h.site}</span>
                <span className="inj-dose-tag">{h.dose}</span>
                <span className="inj-date-small">{new Date(h.date).toLocaleDateString("pt-BR")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── NUTRITION TAB ────────────────────────────────────────────────────────────
function NutritionTab({ profile, todayLog, setTodayLog }) {
  const tdee = calcTDEE(profile);
  const protein = calcProtein(Number(profile.weight));
  const water = Number(calcWater(Number(profile.weight)));
  
  const waterConsumed = todayLog.water || 0;

  const [meals, setMeals] = useState(loadData("meals_today", []));
  
  const [newMeal, setNewMeal] = useState({ 
    name: "", amount: "100", calories: "", protein: "", carbs: "", fat: "", baseKcal: "", baseProt: "", baseCarb: "", baseFat: "" 
  });

  const totalCal = meals.reduce((s, m) => s + Number(m.calories||0), 0);
  const totalProt = meals.reduce((s, m) => s + Number(m.protein||0), 0);

  const addMeal = () => {
    if (!newMeal.name) return;
    const finalName = (newMeal.amount && newMeal.amount !== "100" && newMeal.baseKcal) ? `${newMeal.name} (${newMeal.amount}g)` : newMeal.name;
    const updated = [...meals, { id: Date.now(), name: finalName, calories: newMeal.calories, protein: newMeal.protein, carbs: newMeal.carbs, fat: newMeal.fat }];
    setMeals(updated);
    saveData("meals_today", updated);
    setNewMeal({ name: "", amount: "100", calories: "", protein: "", carbs: "", fat: "", baseKcal: "", baseProt: "", baseCarb: "", baseFat: "" });
  };

  const removeMeal = (id) => {
    const updated = meals.filter(m => m.id !== id);
    setMeals(updated);
    saveData("meals_today", updated);
  };

  const preencherFormulario = (alimento) => {
    setNewMeal({ ...alimento, amount: "100", baseKcal: alimento.calories, baseProt: alimento.protein, baseCarb: alimento.carbs, baseFat: alimento.fat });
  };

  const handleAmountChange = (e) => {
    const val = e.target.value;
    const amount = Number(val);
    setNewMeal(prev => {
      const next = { ...prev, amount: val };
      if (prev.baseKcal) next.calories = amount ? Math.round((Number(prev.baseKcal) * amount) / 100).toString() : "";
      if (prev.baseProt) next.protein = amount ? Math.round((Number(prev.baseProt) * amount) / 100).toString() : "";
      if (prev.baseCarb) next.carbs = amount ? Math.round((Number(prev.baseCarb) * amount) / 100).toString() : "";
      if (prev.baseFat) next.fat = amount ? Math.round((Number(prev.baseFat) * amount) / 100).toString() : "";
      return next;
    });
  };

  const calPct = tdee ? Math.min(100, Math.round((totalCal/tdee)*100)) : 0;
  const protPct = protein ? Math.min(100, Math.round((totalProt/protein)*100)) : 0;

  return (
    <div className="tab-content">
      <h2 className="tab-title">Nutrição</h2>

      <div className="macro-overview">
        <div className="macro-item">
          <div className="macro-ring" style={{"--pct": calPct}}><span>{calPct}%</span></div>
          <div><strong>{totalCal} / {tdee} kcal</strong><span>Calorias</span></div>
        </div>
        <div className="macro-item">
          <div className="macro-ring protein" style={{"--pct": protPct}}><span>{protPct}%</span></div>
          <div><strong>{totalProt} / {protein}g</strong><span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>Proteína <Dumbbell size={12}/></span></div>
        </div>
      </div>

      <div className="water-card">
        <div className="water-header">
          <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}><Droplet size={18} color="#3b82f6" /> Água</span>
          <span>{waterConsumed.toFixed(2)}L / {water}L</span>
        </div>
        <div className="water-track"><div className="water-fill-big" style={{width: `${Math.min(100,(waterConsumed/water)*100)}%`}} /></div>
        <div className="water-quick-btns">
          {[0.2, 0.3, 0.5].map(v => (
            <button key={v} className="water-quick" onClick={() => setTodayLog(p => ({...p, water: Math.min(water+0.5, (p.water||0)+v)}))}>
              +{v*1000}ml
            </button>
          ))}
          <button className="water-quick reset" onClick={() => setTodayLog(p => ({...p, water: 0}))}>Reset</button>
        </div>
      </div>

      <BuscaAlimento onSelectFood={preencherFormulario} />

      <div className="meal-add-card">
        <h3>Adicionar refeição</h3>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.7rem" }}>
          <input className="meal-input" style={{ flex: 2, marginBottom: 0 }} placeholder="Nome" value={newMeal.name} onChange={e => setNewMeal(p => ({...p, name: e.target.value}))} />
          <input type="number" className="meal-input" style={{ flex: 1, marginBottom: 0 }} placeholder="Qtd (g)" value={newMeal.amount} onChange={handleAmountChange} />
        </div>
        <div className="meal-macros-row">
          <input type="number" placeholder="Kcal" value={newMeal.calories} onChange={e => setNewMeal(p => ({...p, calories: e.target.value, baseKcal: ""}))} />
          <input type="number" placeholder="Prot (g)" value={newMeal.protein} onChange={e => setNewMeal(p => ({...p, protein: e.target.value, baseProt: ""}))} />
          <input type="number" placeholder="Carb (g)" value={newMeal.carbs} onChange={e => setNewMeal(p => ({...p, carbs: e.target.value, baseCarb: ""}))} />
          <input type="number" placeholder="Gord (g)" value={newMeal.fat} onChange={e => setNewMeal(p => ({...p, fat: e.target.value, baseFat: ""}))} />
        </div>
        <button className="register-btn" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'}} onClick={addMeal}>
          <PlusCircle size={18} /> Adicionar à lista
        </button>
      </div>

      <div className="meals-list">
        <h3>Refeições de hoje</h3>
        {meals.length === 0 ? <p className="empty">Nenhuma refeição registrada</p> : (
          meals.map(m => (
            <div key={m.id} className="meal-row">
              <div className="meal-info">
                <strong>{m.name}</strong>
                <span>{m.calories} kcal · {m.protein}g prot</span>
              </div>
              <button className="meal-del" onClick={() => removeMeal(m.id)}><X size={16} /></button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── HEALTH TAB ───────────────────────────────────────────────────────────────
function HealthTab() {
  const [symptoms, setSymptoms] = useState([]);
  const [workout, setWorkout] = useState({ type: "", duration: "", notes: "" });
  const [workouts, setWorkouts] = useState(loadData("workouts", []));
  const [measures, setMeasures] = useState(loadData("measures", { waist: "", hip: "", arm: "" }));
  const [photos, setPhotos] = useState(loadData("photos", []));
  const photoInput = useRef();

  const toggleSymptom = (s) => setSymptoms(p => p.includes(s) ? p.filter(x=>x!==s) : [...p,s]);

  const addWorkout = () => {
    if (!workout.type) return;
    const entry = { ...workout, date: new Date().toISOString(), id: Date.now() };
    const updated = [entry, ...workouts].slice(0, 30);
    setWorkouts(updated);
    saveData("workouts", updated);
    setWorkout({ type: "", duration: "", notes: "" });
  };

  const saveMeasures = () => { saveData("measures", measures); alert("Medidas salvas!"); };

  const addPhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const entry = { src: ev.target.result, date: new Date().toISOString(), id: Date.now() };
      const updated = [entry, ...photos].slice(0, 20);
      setPhotos(updated);
      saveData("photos", updated);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="tab-content">
      <h2 className="tab-title">Saúde</h2>

      <div className="health-card">
        <h3>Sintomas de hoje</h3>
        <div className="symptoms-grid">
          {SYMPTOMS.map(s => (<button key={s} className={`symptom-btn ${symptoms.includes(s) ? "active" : ""}`} onClick={() => toggleSymptom(s)}>{s}</button>))}
        </div>
        {symptoms.length > 0 && (
          <div className="symptom-note" style={{display: 'flex', gap: '8px', alignItems: 'flex-start'}}>
            <AlertCircle size={16} style={{flexShrink: 0, marginTop: '2px'}} />
            <p>Registrados: {symptoms.join(", ")}. Informe seu médico se persistirem.</p>
          </div>
        )}
      </div>

      <div className="health-card">
        <h3 style={{display: 'flex', alignItems: 'center', gap: '6px'}}><Dumbbell size={18} /> Treino de hoje</h3>
        <div className="workout-types">
          {["Musculação", "Caminhada", "Cardio", "Yoga", "Ciclismo", "Natação"].map(t => (
            <button key={t} className={`workout-type-btn ${workout.type === t ? "selected" : ""}`} onClick={() => setWorkout(p => ({...p, type: t}))}>{t}</button>
          ))}
        </div>
        <div className="ob-row">
          <div className="ob-field"><label>Duração (min)</label><input type="number" value={workout.duration} onChange={e => setWorkout(p => ({...p, duration: e.target.value}))} /></div>
        </div>
        <input className="meal-input" placeholder="Observações (exercícios, carga...)" value={workout.notes} onChange={e => setWorkout(p => ({...p, notes: e.target.value}))} />
        <button className="register-btn" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'}} onClick={addWorkout}>
          <PlusCircle size={18} /> Registrar treino
        </button>
        {workout.type?.includes("Musculação") && (
          <div className="muscle-tip" style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
            <Lightbulb size={16} style={{flexShrink: 0}} />
            <span>Musculação preserva músculo e acelera perda de gordura. Continue!</span>
          </div>
        )}
        <div className="workouts-list">
          {workouts.slice(0,5).map(w => (
            <div key={w.id} className="workout-row"><span>{w.type}</span><span>{w.duration ? w.duration+"min" : ""}</span><span>{new Date(w.date).toLocaleDateString("pt-BR")}</span></div>
          ))}
        </div>
      </div>

      <div className="health-card">
        <h3 style={{display: 'flex', alignItems: 'center', gap: '6px'}}><Ruler size={18} /> Medidas corporais</h3>
        <div className="ob-row">
          {[["waist","Cintura (cm)"],["hip","Quadril (cm)"],["arm","Braço (cm)"]].map(([k,l]) => (
            <div key={k} className="ob-field"><label>{l}</label><input type="number" value={measures[k]} onChange={e => setMeasures(p => ({...p, [k]: e.target.value}))} /></div>
          ))}
        </div>
        <button className="register-btn" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'}} onClick={saveMeasures}>
          <CheckCircle size={18} /> Salvar medidas
        </button>
      </div>

      <div className="health-card">
        <h3 style={{display: 'flex', alignItems: 'center', gap: '6px'}}><Camera size={18} /> Fotos de evolução</h3>
        <p className="ob-subtitle" style={{fontSize:"0.8rem",marginBottom:"1rem"}}>Suas fotos ficam salvas apenas neste dispositivo</p>
        <button className="register-btn" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'}} onClick={() => photoInput.current.click()}>
          <PlusCircle size={18} /> Adicionar foto
        </button>
        <input ref={photoInput} type="file" accept="image/*" style={{display:"none"}} onChange={addPhoto} />
        <div className="photo-grid">
          {photos.map(p => (
            <div key={p.id} className="photo-item"><img src={p.src} alt="evolução" /><span>{new Date(p.date).toLocaleDateString("pt-BR")}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PROGRESS TAB ─────────────────────────────────────────────────────────────
function ProgressTab({ profile, logs }) {
  const weightLogs = [...logs].filter(l=>l.weight).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const currentWeight = weightLogs.length ? weightLogs[weightLogs.length-1].weight : Number(profile.weight);
  const startWeight = Number(profile.weight);
  const goalWeight = Number(profile.goalWeight);
  const totalToLose = startWeight - goalWeight;
  const lostSoFar = startWeight - currentWeight;
  const pct = totalToLose > 0 ? Math.min(100, Math.round((lostSoFar/totalToLose)*100)) : 0;
  const bmi = calcBMI(currentWeight, Number(profile.height));

  const bmiCategory = () => {
    const b = Number(bmi);
    if (b < 18.5) return { label: "Abaixo do peso", color: "#3b82f6" };
    if (b < 25) return { label: "Peso normal", color: "#10b981" };
    if (b < 30) return { label: "Sobrepeso", color: "#f59e0b" };
    return { label: "Obesidade", color: "#ef4444" };
  };

  const bmiFocus = bmiCategory();

  return (
    <div className="tab-content">
      <h2 className="tab-title">Progresso</h2>

      <div className="progress-hero">
        <div className="progress-weights">
          <div className="pw-item"><span>Inicial</span><strong>{startWeight}kg</strong></div>
          <div className="pw-arrow"><ArrowRight size={18} /></div>
          <div className="pw-item current"><span>Atual</span><strong>{currentWeight}kg</strong></div>
          <div className="pw-arrow"><ArrowRight size={18} /></div>
          <div className="pw-item goal"><span>Meta</span><strong>{goalWeight}kg</strong></div>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-label"><span>Progresso</span><span>{pct}% — {lostSoFar > 0 ? lostSoFar.toFixed(1) : 0}kg perdidos</span></div>
          <div className="progress-bar-track"><div className="progress-bar-fill" style={{width:`${pct}%`}} /></div>
        </div>
      </div>

      <div className="bmi-card">
        <div className="bmi-value">{bmi}</div>
        <div>
          <p className="bmi-cat" style={{color: bmiFocus.color, display: 'flex', alignItems: 'center', gap: '4px'}}>
            {bmiFocus.label} {b => b >= 18.5 && b < 25 && <CheckCircle size={16} />}
          </p>
          <p className="bmi-label">Índice de Massa Corporal</p>
        </div>
        <div className="bmi-scale">
          <div className="bmi-seg" style={{background:"#60a5fa"}} />
          <div className="bmi-seg" style={{background:"#10b981"}} />
          <div className="bmi-seg" style={{background:"#fcd34d"}} />
          <div className="bmi-seg" style={{background:"#f87171"}} />
        </div>
      </div>

      <div className="weight-history">
        <h3>Histórico de peso</h3>
        {weightLogs.length < 2 ? (
          <p className="empty">Registre seu peso diariamente para ver a evolução aqui</p>
        ) : (
          <div className="mini-chart">
            {weightLogs.slice(-10).map((l, i, arr) => {
              const min = Math.min(...arr.map(x=>x.weight)) - 1;
              const max = Math.max(...arr.map(x=>x.weight)) + 1;
              const h = ((l.weight - min) / (max - min)) * 80;
              return (
                <div key={i} className="chart-col">
                  <div className="chart-bar-wrap"><div className="chart-bar" style={{height:`${h}%`}}><span className="chart-val">{l.weight}</span></div></div>
                  <span className="chart-label">{new Date(l.date).toLocaleDateString("pt-BR",{day:"numeric",month:"short"})}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [profile, setProfile] = useState(loadData("profile", null));
  const [tab, setTab] = useState("home");
  const [logs, setLogs] = useState(loadData("logs", []));
  const [todayLog, setTodayLog] = useState({ weight: "", satiety: null, water: 0 });

  const saveLog = () => {
    if (!todayLog.weight && !todayLog.satiety) return;
    const today = new Date().toDateString();
    const existing = logs.findIndex(l => new Date(l.date).toDateString() === today);
    const entry = { ...todayLog, date: new Date().toISOString() };
    const updated = existing >= 0 ? logs.map((l, i) => i === existing ? entry : l) : [...logs, entry];
    setLogs(updated);
    saveData("logs", updated);
  };

  useEffect(() => { saveLog(); }, [todayLog]);

  const handleOnboardingComplete = (p) => { setProfile(p); saveData("profile", p); };

  if (!profile) return (
    <>
      <style>{styles}</style>
      <Onboarding onComplete={handleOnboardingComplete} />
    </>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="content">
          {tab === "home" && <HomeTab profile={profile} logs={logs} todayLog={todayLog} setTodayLog={setTodayLog} />}
          {tab === "meds" && <MedsTab profile={profile} setProfile={setProfile} logs={logs} setLogs={setLogs} />}
          {tab === "nutrition" && <NutritionTab profile={profile} todayLog={todayLog} setTodayLog={setTodayLog} />}
          {tab === "health" && <HealthTab />}
          {tab === "progress" && <ProgressTab profile={profile} logs={logs} />}
        </div>
        <nav className="bottom-nav">
          {TABS.map(t => (
            <button key={t.id} className={`nav-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              <div className="nav-icon">{t.icon}</div>
              <span className="nav-label">{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}

// ─── STYLES (MODO CLARO - SAÚDE) ────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&family=Space+Mono:wght@400;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body, #root { background: #f3f4f6; color: #1f2937; font-family: 'Sora', sans-serif; min-height: 100dvh; }

  .app { display: flex; flex-direction: column; height: 100dvh; background: #f3f4f6; max-width: 430px; margin: 0 auto; box-shadow: 0 0 20px rgba(0,0,0,0.05); }
  .content { flex: 1; overflow-y: auto; padding-bottom: 80px; }

  /* ── ONBOARDING ── */
  .onboarding { min-height: 100dvh; background: #ffffff; padding: 1.5rem; display: flex; flex-direction: column; }
  .ob-progress { display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 2rem; padding-top: 1rem; }
  .ob-dot { width: 8px; height: 8px; border-radius: 50%; background: #e5e7eb; transition: all 0.3s; }
  .ob-dot.active { background: #3b82f6; width: 24px; border-radius: 4px; }

  .ob-step { display: flex; flex-direction: column; gap: 1.2rem; animation: fadeUp 0.4s ease; }
  .ob-icon-wrapper { display: flex; justify-content: center; align-items: center; background: #eff6ff; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto; }
  .ob-step h1 { font-size: 2.2rem; font-weight: 700; text-align: center; color: #111827; }
  .ob-step h1 span { color: #3b82f6; }
  .ob-subtitle { color: #6b7280; text-align: center; font-size: 0.95rem; line-height: 1.5; }
  .ob-step-header { margin-bottom: 0.5rem; }
  .ob-step-num { font-family: 'Space Mono', monospace; font-size: 0.75rem; color: #3b82f6; letter-spacing: 0.1em; }
  .ob-step-header h2 { font-size: 1.6rem; font-weight: 700; margin: 0.3rem 0; color: #111827;}
  .ob-step-header p { color: #6b7280; font-size: 0.85rem; }

  .ob-field { display: flex; flex-direction: column; gap: 0.4rem; }
  .ob-field label { font-size: 0.8rem; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em; }
  .ob-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .ob-input, .ob-field input, .ob-field select, input[type="time"] {
    background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 12px;
    color: #1f2937; padding: 0.75rem 1rem; font-size: 1rem; font-family: 'Sora',sans-serif;
    outline: none; transition: border-color 0.2s; width: 100%;
  }
  .ob-input:focus, .ob-field input:focus, .ob-field select:focus { border-color: #3b82f6; background: #ffffff; }

  .ob-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
  .ob-card { background: #ffffff; border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 0.7rem; text-align: left; cursor: pointer; transition: all 0.2s; color: #1f2937; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
  .ob-card strong { font-size: 0.85rem; margin-bottom: 0.2rem; }
  .ob-card span { font-size: 0.72rem; color: #6b7280; }
  .ob-card.selected { border-color: #3b82f6; background: #eff6ff; }
  .ob-card.selected strong { color: #1d4ed8; }

  .ob-doses { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .ob-dose { background: #ffffff; border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 0.5rem 0.8rem; font-size: 0.85rem; cursor: pointer; color: #1f2937; transition: all 0.2s; font-family: 'Space Mono', monospace; }
  .ob-dose.selected { border-color: #3b82f6; background: #3b82f6; color: #fff; }

  .ob-weekdays { display: flex; gap: 0.4rem; flex-wrap: wrap; }
  .ob-day { background: #ffffff; border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 0.5rem 0.7rem; font-size: 0.8rem; cursor: pointer; color: #1f2937; transition: all 0.2s; }
  .ob-day.selected { border-color: #3b82f6; background: #3b82f6; color: #fff; }

  .ob-btn { display: flex; justify-content: center; align-items: center; background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; border: none; border-radius: 14px; padding: 1rem; font-size: 1rem; font-weight: 600; font-family: 'Sora',sans-serif; cursor: pointer; transition: opacity 0.2s; margin-top: 0.5rem; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
  .ob-btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
  .ob-btn:not(:disabled):hover { opacity: 0.9; }

  .ob-done { align-items: center; text-align: center; }
  .ob-check { width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); margin-bottom: 1rem;}
  .ob-done h2 { font-size: 1.8rem; color: #111827; }
  .ob-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; width: 100%; margin: 0.5rem 0; }
  .ob-sum-item { background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 0.8rem; }
  .ob-sum-item span { display: block; font-size: 0.75rem; color: #6b7280; margin-bottom: 0.3rem; }
  .ob-sum-item strong { font-size: 1.1rem; color: #3b82f6; font-family: 'Space Mono',monospace; }

  /* ── BOTTOM NAV ── */
  .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 430px; background: #ffffff; border-top: 1px solid #e5e7eb; display: flex; padding: 0.5rem 0 0.8rem; z-index: 100; box-shadow: 0 -4px 12px rgba(0,0,0,0.03); }
  .nav-btn { flex: 1; background: none; border: none; color: #9ca3af; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 0.3rem; padding: 0.3rem; transition: color 0.2s; }
  .nav-btn.active { color: #3b82f6; }
  .nav-icon { display: flex; align-items: center; justify-content: center; }
  .nav-label { font-size: 0.65rem; font-family: 'Sora',sans-serif; font-weight: 600; }

  /* ── COMMON ── */
  .tab-content { padding: 1.2rem 1rem; display: flex; flex-direction: column; gap: 1rem; }
  .tab-title { font-size: 1.4rem; font-weight: 700; margin-bottom: 0.2rem; color: #111827; }
  .empty { color: #6b7280; font-size: 0.85rem; text-align: center; padding: 1rem 0; }

  /* ── HOME ── */
  .home-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.2rem; }
  .greeting { font-size: 1.3rem; font-weight: 700; color: #111827; }
  .date-label { font-size: 0.78rem; color: #6b7280; text-transform: capitalize; margin-top: 0.2rem; }
  .bmi-badge { background: #ffffff; border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 0.6rem 0.9rem; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
  .bmi-badge span { display: block; font-size: 0.65rem; color: #6b7280; }
  .bmi-badge strong { font-family: 'Space Mono',monospace; color: #3b82f6; font-size: 1.1rem; }

  .next-injection-card { background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 1.5px solid #bfdbfe; border-radius: 16px; padding: 1rem 1.2rem; display: flex; gap: 1rem; align-items: center; }
  .inj-label { font-size: 0.72rem; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
  .inj-date { font-size: 1rem; font-weight: 700; margin: 0.2rem 0; color: #1e3a8a; }
  .inj-dose { font-size: 0.8rem; color: #2563eb; font-family: 'Space Mono',monospace; }

  .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem; }
  .stat-card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 0.9rem; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
  .stat-card span { display: block; font-size: 0.72rem; color: #6b7280; margin-bottom: 0.3rem; }
  .stat-card strong { font-size: 1.2rem; font-family: 'Space Mono',monospace; color: #111827; }
  .stat-card.green strong { color: #10b981; }
  .stat-card.orange strong { color: #f59e0b; }
  .stat-card.blue strong { color: #3b82f6; }
  .stat-card.purple strong { color: #8b5cf6; }

  .quick-log-card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 1.2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
  .quick-log-card h3 { font-size: 0.9rem; font-weight: 600; margin-bottom: 1rem; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em; }
  .quick-row { margin-bottom: 1rem; }
  .quick-row label { display: block; font-size: 0.78rem; color: #6b7280; margin-bottom: 0.4rem; font-weight: 600; }
  .quick-row input { width: 100%; background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 10px; color: #1f2937; padding: 0.6rem 0.9rem; font-size: 0.95rem; font-family: 'Sora',sans-serif; outline: none; }
  .quick-row input:focus { border-color: #3b82f6; background: #ffffff; }

  .hunger-scale { display: flex; gap: 0.4rem; flex-wrap: wrap; }
  .hunger-btn { display: flex; align-items: center; justify-content: center; gap: 4px; background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 0.4rem 0.6rem; font-size: 0.78rem; cursor: pointer; color: #4b5563; transition: all 0.2s; }
  .hunger-btn.selected { border-color: #3b82f6; background: #eff6ff; color: #1d4ed8; }

  .water-btns { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.5rem; }
  .water-btns button { display: flex; align-items: center; justify-content: center; background: #eff6ff; border: 1px solid #bfdbfe; color: #2563eb; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; transition: background 0.2s; }
  .water-btns button:hover { background: #dbeafe; }
  .water-btns span { font-family: 'Space Mono',monospace; font-size: 1rem; color: #1f2937; }
  .water-bar { height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
  .water-fill { height: 100%; background: linear-gradient(90deg, #60a5fa, #3b82f6); border-radius: 4px; transition: width 0.4s; }

  /* ── MEDS ── */
  .med-card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 1.2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
  .med-card h3 { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.8rem; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em; }
  .rotation-subtitle { font-size: 0.8rem; color: #6b7280; margin-bottom: 0.8rem; }
  .rotation-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem; margin-bottom: 1rem; }
  .rotation-site { background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 0.8rem; text-align: center; position: relative; }
  .rotation-site .site-icon { display: flex; justify-content: center; margin-bottom: 0.4rem; }
  .rotation-site span { font-size: 0.8rem; display: block; color: #4b5563; }
  .rotation-site.last { border-color: #fca5a5; background: #fef2f2; }
  .rotation-site.next { border-color: #6ee7b7; background: #ecfdf5; }
  .site-badge { position: absolute; top: -8px; right: 8px; font-size: 0.65rem; padding: 0.2rem 0.5rem; border-radius: 20px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  .last-badge { background: #ef4444; color: #fff; }
  .next-badge { background: #10b981; color: #fff; }

  .register-btn { width: 100%; background: linear-gradient(135deg, #3b82f6, #2563eb); border: none; border-radius: 12px; color: #fff; padding: 0.85rem; font-size: 0.95rem; font-weight: 600; font-family: 'Sora',sans-serif; cursor: pointer; transition: opacity 0.2s; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
  .register-btn:hover { opacity: 0.9; }

  .inj-history { display: flex; flex-direction: column; gap: 0.5rem; }
  .inj-row { display: flex; align-items: center; gap: 0.7rem; padding: 0.6rem 0; border-bottom: 1px solid #f3f4f6; }
  .inj-site { flex: 1; font-size: 0.85rem; color: #1f2937; }
  .inj-dose-tag { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 0.2rem 0.5rem; font-size: 0.75rem; font-family: 'Space Mono',monospace; color: #2563eb; }
  .inj-date-small { font-size: 0.72rem; color: #6b7280; }

  /* ── NUTRITION & API SEARCH ── */
  .macro-overview { display: flex; gap: 1rem; }
  .macro-item { flex: 1; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 1rem; display: flex; align-items: center; gap: 0.8rem; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
  .macro-item > div:last-child strong { display: block; font-size: 0.85rem; font-family: 'Space Mono',monospace; color: #111827; }
  .macro-item > div:last-child span { font-size: 0.72rem; color: #6b7280; }
  .macro-ring { width: 50px; height: 50px; border-radius: 50%; background: conic-gradient(#3b82f6 calc(var(--pct) * 3.6deg), #e5e7eb 0deg); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; flex-shrink: 0; color: #1f2937; position: relative; }
  .macro-ring::before { content: ""; position: absolute; width: 40px; height: 40px; background: #fff; border-radius: 50%; z-index: -1; }
  .macro-ring.protein { background: conic-gradient(#8b5cf6 calc(var(--pct) * 3.6deg), #e5e7eb 0deg); }

  .water-card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 1.2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
  .water-header { display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.7rem; color: #1f2937; font-weight: 600;}
  .water-header span:last-child { color: #3b82f6; font-family: 'Space Mono',monospace; font-weight: bold; }
  .water-track { height: 10px; background: #f3f4f6; border-radius: 5px; margin-bottom: 0.8rem; overflow: hidden; }
  .water-fill-big { height: 100%; background: linear-gradient(90deg, #60a5fa, #3b82f6); border-radius: 5px; transition: width 0.3s; }
  .water-quick-btns { display: flex; gap: 0.5rem; }
  .water-quick { flex: 1; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; color: #2563eb; padding: 0.5rem; font-size: 0.78rem; cursor: pointer; font-family: 'Sora',sans-serif; font-weight: 600; }
  .water-quick.reset { background: #f3f4f6; border-color: #e5e7eb; color: #6b7280; }

  /* Estilos da API de Busca */
  .api-search-card { background: #ffffff; border: 1.5px dashed #93c5fd; border-radius: 16px; padding: 1.2rem; margin: 0.5rem 0; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
  .api-search-card h3 { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.2rem; color: #2563eb; text-transform: uppercase; }
  .api-search-row { display: flex; gap: 0.5rem; }
  .api-results { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; max-height: 250px; overflow-y: auto; padding-right: 0.5rem; }
  .api-result-item { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 0.8rem; cursor: pointer; transition: border-color 0.2s; position: relative; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  .api-result-item:hover { border-color: #3b82f6; }
  .api-result-item strong { display: block; font-size: 0.85rem; margin-bottom: 0.3rem; padding-right: 70px; color: #1f2937; }
  .api-result-item span { font-size: 0.75rem; color: #6b7280; font-family: 'Space Mono', monospace; }
  .api-add-btn { position: absolute; top: 0.8rem; right: 0.8rem; font-size: 0.7rem; background: #eff6ff; color: #2563eb; padding: 0.3rem 0.5rem; border-radius: 6px; font-weight: bold; display: flex; align-items: center; gap: 4px; }

  .meal-add-card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 1.2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
  .meal-add-card h3 { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.8rem; color: #4b5563; text-transform: uppercase; }
  .meal-input { width: 100%; background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 10px; color: #1f2937; padding: 0.65rem 0.9rem; font-size: 0.9rem; font-family: 'Sora',sans-serif; outline: none; margin-bottom: 0.7rem; }
  .meal-input:focus { border-color: #3b82f6; background: #ffffff; }
  .meal-macros-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; margin-bottom: 0.8rem; }
  .meal-macros-row input { background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 8px; color: #1f2937; padding: 0.5rem; font-size: 0.8rem; font-family: 'Sora',sans-serif; outline: none; text-align: center; width: 100%; }
  .meal-macros-row input:focus { border-color: #3b82f6; background: #ffffff; }

  .meals-list h3 { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.7rem; color: #4b5563; text-transform: uppercase; }
  .meal-row { display: flex; align-items: center; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 0.8rem; gap: 0.7rem; margin-bottom: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  .meal-info { flex: 1; }
  .meal-info strong { display: block; font-size: 0.9rem; margin-bottom: 0.2rem; color: #111827; }
  .meal-info span { font-size: 0.75rem; color: #6b7280; }
  .meal-del { background: #fef2f2; border: 1px solid #fecaca; color: #ef4444; width: 28px; height: 28px; border-radius: 50%; font-size: 1.1rem; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
  .meal-del:hover { background: #fee2e2; }

  /* ── HEALTH ── */
  .health-card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 1.2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
  .health-card h3 { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.8rem; color: #4b5563; text-transform: uppercase; }
  .symptoms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.7rem; }
  .symptom-btn { background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 10px; color: #4b5563; padding: 0.55rem; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; font-family: 'Sora',sans-serif; }
  .symptom-btn.active { border-color: #ef4444; background: #fef2f2; color: #b91c1c; font-weight: bold; }
  .symptom-note { font-size: 0.78rem; color: #9a3412; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 0.6rem; line-height: 1.4; }

  .workout-types { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.8rem; }
  .workout-type-btn { background: #f9fafb; border: 1.5px solid #e5e7eb; border-radius: 10px; color: #4b5563; padding: 0.55rem; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; font-family: 'Sora',sans-serif; }
  .workout-type-btn.selected { border-color: #3b82f6; background: #eff6ff; color: #1d4ed8; font-weight: bold; }
  .muscle-tip { background: #fefce8; border: 1px solid #fde047; border-radius: 10px; padding: 0.7rem; font-size: 0.78rem; color: #a16207; margin: 0.5rem 0; }
  .workouts-list { margin-top: 0.8rem; }
  .workout-row { display: flex; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid #f3f4f6; font-size: 0.8rem; color: #6b7280; }
  .workout-row span:first-child { color: #111827; font-weight: 600; }

  .photo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem; margin-top: 0.8rem; }
  .photo-item { border-radius: 10px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
  .photo-item img { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; }
  .photo-item span { display: block; font-size: 0.7rem; color: #4b5563; text-align: center; padding: 0.4rem; background: #f9fafb; font-weight: 600; }

  /* ── PROGRESS ── */
  .progress-hero { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 1.2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
  .progress-weights { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
  .pw-item { text-align: center; }
  .pw-item span { display: block; font-size: 0.7rem; color: #6b7280; margin-bottom: 0.3rem; font-weight: 600; }
  .pw-item strong { font-family: 'Space Mono',monospace; font-size: 1rem; color: #111827; }
  .pw-item.current strong { color: #3b82f6; font-size: 1.3rem; }
  .pw-item.goal strong { color: #10b981; }
  .pw-arrow { color: #d1d5db; display: flex; align-items: center; justify-content: center; }
  .progress-bar-container { }
  .progress-bar-label { display: flex; justify-content: space-between; font-size: 0.75rem; color: #6b7280; margin-bottom: 0.4rem; font-weight: 600; }
  .progress-bar-track { height: 10px; background: #f3f4f6; border-radius: 5px; overflow: hidden; }
  .progress-bar-fill { height: 100%; background: linear-gradient(90deg, #60a5fa, #10b981); border-radius: 5px; transition: width 0.5s ease; }

  .bmi-card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 1.2rem; display: flex; align-items: center; gap: 1.2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
  .bmi-value { font-family: 'Space Mono',monospace; font-size: 2.5rem; font-weight: 700; color: #3b82f6; flex-shrink: 0; }
  .bmi-cat { font-size: 0.95rem; font-weight: 700; }
  .bmi-label { font-size: 0.75rem; color: #6b7280; margin-top: 0.2rem; }
  .bmi-scale { display: flex; gap: 2px; margin-top: 0.6rem; border-radius: 4px; overflow: hidden; height: 6px; }
  .bmi-seg { height: 100%; flex: 1; }

  .weight-history h3 { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.8rem; color: #4b5563; text-transform: uppercase; }
  .mini-chart { display: flex; align-items: flex-end; gap: 0.4rem; height: 120px; padding: 0.5rem 0; }
  .chart-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.3rem; height: 100%; }
  .chart-bar-wrap { flex: 1; display: flex; align-items: flex-end; width: 100%; }
  .chart-bar { width: 100%; background: linear-gradient(180deg, #60a5fa, #3b82f6); border-radius: 4px 4px 0 0; position: relative; min-height: 8px; transition: height 0.3s; }
  .chart-val { position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 0.6rem; color: #2563eb; font-weight: bold; font-family: 'Space Mono',monospace; }
  .chart-label { font-size: 0.6rem; color: #6b7280; text-align: center; font-weight: 600; }

  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
`;