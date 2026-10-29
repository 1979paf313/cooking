(()=>{'use strict';
const recipes=(window.BUNDLED_RECIPES||[]).slice().sort((a,b)=>a.title.localeCompare(b.title));
const $=id=>document.getElementById(id);
const state={recipe:null,mode:'multiplier',factor:1,step:0};
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Kitchen-friendly display; numeric values stay untouched for arithmetic.
const kitchenFractions=[[0,''],[1/8,'⅛'],[1/4,'¼'],[1/3,'⅓'],[3/8,'⅜'],[1/2,'½'],[5/8,'⅝'],[2/3,'⅔'],[3/4,'¾'],[7/8,'⅞'],[1,'']];
const mixed=n=>{let whole=Math.floor(n+1e-9),part=n-whole;let [v,glyph]=kitchenFractions.reduce((best,x)=>Math.abs(x[0]-part)<Math.abs(best[0]-part)?x:best);let rounded=whole+(v===1?1:v);if(v===1)return String(whole+1);return (whole?String(whole):'')+(glyph?(whole?' ':'')+glyph:'')||'0'};
const fmt=n=>{if(n===null||n===undefined||!Number.isFinite(Number(n)))return 'as needed';n=Number(n);if(n===0)return '0';return (Math.abs(n-(Math.floor(n*8+0.5)/8))>0.025?'≈':'')+mixed(n)};
const unitForDisplay=(unit,n)=>{
  if(!unit||unit==='each')return '';
  const p={cup:'cups',loaf:'loaves',slice:'slices',clove:'cloves',jar:'jars',pinch:'pinches'};
  const singular={cups:'cup',loaves:'loaf',slices:'slice',cloves:'clove',jars:'jar',pinches:'pinch'};
  if(Math.abs(n-1)<1e-9)return singular[unit]||unit;
  return p[unit]||unit;
};
const quantity=(n,unit)=>{
  if(n===null||n===undefined||!Number.isFinite(Number(n)))return 'as needed';
  unit=unitForDisplay(unit,Number(n));
  n=Number(n);if(n===0)return `0${unit?' '+unit:''}`;
  // A cup remainder near a whole tablespoon is easier to measure than a decimal cup.
  if((unit==='cup'||unit==='cups')&&n>=0.3){
    let eighths=Math.floor(n*8+1e-8),base=eighths/8,remainder=(n-base)*16;
    if(remainder>=0.75&&remainder<=2.25){let spoons=Math.round(remainder);return `${base>0?mixed(base)+(base<=1?' cup + ':' cups + '):''}${spoons} tbsp${Math.abs(remainder-spoons)>0.15?' (approx.)':''}`;}
  }
  let rounded=mixed(n),fraction=kitchenFractions.reduce((best,x)=>Math.abs(x[0]-(n-Math.floor(n)))<Math.abs(best[0]-(n-Math.floor(n)))?x:best)[0];
  let diff=Math.abs((Math.floor(n)+(fraction===1?1:fraction))-n);
  let qual=diff>0.025?'≈':'';
  return `${qual}${rounded}${unit?' '+unit:''}`;
};
const factors=i=>i.scale_mode==='fixed'||i.scale_mode==='to_taste'||i.scale_mode==='manual'?1:state.factor;
const ingText=i=>quantity(i.quantity===null?null:i.quantity*factors(i),i.unit);
const lookup=id=>state.recipe.ingredients.find(i=>i.id===id);
const steps=()=>state.recipe.phases.flatMap(p=>p.steps.map(s=>({...s,phase:p.name})));
const typeIcons={full_dish:'🍲',sauce:'🥣',dip:'🥣',assembly:'🍝',dessert:'🍪'};
const persist=()=>{try{localStorage.setItem('kitchenNotesLast',JSON.stringify({id:state.recipe?.id,mode:state.mode,factor:state.factor,step:state.step}))}catch(e){}};
function show(page){['browse','detail','cook'].forEach(p=>$(p).classList.toggle('hidden',p!==page));$('browseBtn').style.visibility=page==='browse'?'hidden':'visible';window.scrollTo(0,0)}
function drawList(){let q=$('search').value.trim().toLowerCase();let results=recipes.filter(r=>(r.title+' '+r.tags.join(' ')+' '+r.ingredients.map(i=>i.name).join(' ')).toLowerCase().includes(q));$('recipeList').innerHTML=results.map(r=>`<button class="recipe-tile" data-id="${escapeHtml(r.id)}"><span class="tile-icon">${r.id.includes('cookie')?'🍪':r.id.includes('mustard')?'🥣':r.id.includes('parm')?'🍝':r.id.includes('pie')?'🥧':'🍛'}</span><span><strong>${escapeHtml(r.title)}</strong><small>${r.phases.length} phases · ${r.phases.reduce((n,p)=>n+p.steps.length,0)} steps</small></span><span class="tile-arrow">›</span></button>`).join('')||'<div class="no-results">No matching recipes.</div>';$('recipeList').querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>openRecipe(b.dataset.id));}
function openRecipe(id){let r=recipes.find(x=>x.id===id);if(!r)return;state.recipe=r;state.factor=1;state.step=0;state.mode='multiplier';renderRecipe();show('detail');persist()}
function renderRecipe(){let r=state.recipe;$('recipeTitle').textContent=r.title;$('desc').textContent=r.standardization?.description||'';$('category').textContent=r.recipe_type.replace(/_/g,' ');let meta=[`${r.ingredients.length} ingredients`,`${steps().length} steps`];if(r.time?.total_minutes)meta.push(`${r.time.total_minutes} min total`);if(r.nutrition?.total_carbs_g!=null)meta.push(`≈${r.nutrition.total_carbs_g}g carbs / batch`);$('meta').innerHTML=meta.map(t=>`<span class="pill">${escapeHtml(t)}</span>`).join('');$('scaleModes').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.mode));renderScale();renderFull();}
function basis(){return state.recipe.ingredients.find(i=>i.id===state.recipe.standardization?.scale_basis?.ingredient_id)}
function renderScale(){let r=state.recipe,base=basis();let ctrl=$('scaleControls');if(state.mode==='multiplier')ctrl.innerHTML=`<label for="scaleInput">Multiply recipe by</label><input id="scaleInput" type="number" min="0.1" max="30" step="0.1" value="${Number(state.factor.toFixed(3))}"><b>×</b>`;
else if(state.mode==='ingredient'&&base)ctrl.innerHTML=`<label for="scaleInput">${escapeHtml(base.name)}</label><input id="scaleInput" type="number" min="0.01" max="999" step="any" value="${Number((base.quantity*state.factor).toFixed(3))}"><b>${escapeHtml(base.unit||'')}</b>`;
else if(state.mode==='servings'&&r.yield_info?.servings)ctrl.innerHTML=`<label for="scaleInput">Desired servings</label><input id="scaleInput" type="number" min="1" max="300" step="any" value="${Number((r.yield_info.servings*state.factor).toFixed(3))}">`;
else {ctrl.innerHTML='<span class="muted">Not available for this recipe yet.</span>'}
let hint=state.mode==='servings'&&!r.yield_info?.servings?'Original serving yield was not established. Use multiplier or main ingredient.':state.mode==='ingredient'&&!base?'No main ingredient is defined for this recipe. Use multiplier.':`Current batch: ${fmt(state.factor)}× the original recipe`;$('scaleMessage').textContent=hint;
let input=$('scaleInput');if(input)input.onchange=()=>{let v=Number(input.value);if(!Number.isFinite(v)||v<=0){renderScale();return}state.factor=Math.min(30,state.mode==='ingredient'?v/base.quantity:state.mode==='servings'?v/r.yield_info.servings:v);renderScale();renderFull();persist()};}
function ingredientRow(i){return `<div class="ingredient-row"><span class="qty">${escapeHtml(ingText(i))}</span><span>${escapeHtml(i.name)}${i.preparation?` <span class="prep">· ${escapeHtml(i.preparation)}</span>`:''}${i.optional?' <span class="prep">(optional)</span>':''}</span></div>`}
function renderFull(){let r=state.recipe;const phaseIngredients=p=>{let ids=[];p.steps.forEach(s=>(s.ingredient_uses||[]).forEach(u=>{if(!ids.includes(u.ingredient_id))ids.push(u.ingredient_id)}));return ids.map(lookup).filter(Boolean)};
let leftovers=r.ingredients.filter(i=>!r.phases.some(p=>p.steps.some(s=>s.ingredient_uses?.some(u=>u.ingredient_id===i.id))));let out='<div class="eyebrow">INGREDIENTS</div>';
for(let p of r.phases){let arr=phaseIngredients(p);if(arr.length)out+=`<section class="ingredient-group"><h2 class="section-heading">${escapeHtml(p.name)}</h2>${arr.map(ingredientRow).join('')}</section>`}
if(leftovers.length)out+=`<section class="ingredient-group"><h2 class="section-heading">Other ingredients</h2>${leftovers.map(ingredientRow).join('')}</section>`;
out+='<div class="eyebrow" style="margin-top:30px">METHOD</div>';let num=0;for(let p of r.phases){out+=`<section class="phase-section"><h2 class="section-heading">${escapeHtml(p.name)}</h2><ol class="steps-list">`;for(let s of p.steps){num++;out+=`<li><span class="step-number">${num}</span><span>${escapeHtml(s.instruction)}</span></li>`}out+='</ol></section>'}
if(state.factor!==1)out+='<div class="scale-alert">Some instructions contain quantities or cooking times from the original recipe. Use the rescaled ingredient amounts above; check cooking time and doneness independently.</div>';
if(r.notes?.length){out+='<h2 class="section-heading">Kitchen notes</h2>';out+=r.notes.map(n=>`<div class="note">${escapeHtml(typeof n==='string'?n:JSON.stringify(n))}</div>`).join('')}
if(r.nutrition?.total_carbs_g===null)out+='<div class="note">Carbohydrate estimate: not calculated yet. Serving weights have not been verified.</div>';
$('fullContent').innerHTML=out;}
function renderCook(){let all=steps(),s=all[state.step];if(!s)return;let frac=(state.step+1)/all.length;$('cookCount').textContent=`${state.step+1} / ${all.length}`;$('progressBar').style.width=`${frac*100}%`;$('cookPhase').textContent=s.phase;$('cookStepLabel').textContent=`STEP ${state.step+1}`;$('cookInstruction').textContent=s.instruction;
let ingredientUses=s.ingredient_uses||[];let html=ingredientUses.length?'<div class="step-ingredient-title">For this step</div>'+ingredientUses.map(use=>{let ing=lookup(use.ingredient_id);if(!ing)return '';let q=use.quantity!==undefined?quantity(use.quantity*(ing.scale_mode==='proportional'?state.factor:1),use.unit||ing.unit):ingText(ing);return `<div class="step-ing"><span>${escapeHtml(ing.name)}</span><strong>${escapeHtml(q)}</strong></div>`}).join(''):'<div class="muted tiny">No ingredients to measure for this step.</div>';
$('stepIngredients').innerHTML=html;let extra='';if(s.temperature_f)extra+=`<span class="pill">🌡 ${s.temperature_f}°F</span> `;if(s.time_minutes)extra+=`<span class="pill">⏱ ${s.time_minutes} min</span>`;if(state.factor!==1)extra+='<div class="scale-alert">Ingredient amounts above are scaled. Written instructions may mention original quantities; cooking time may change.</div>';$('stepExtra').innerHTML=`<div class="cook-note">${extra}</div>`;
$('nextPreview').innerHTML=all[state.step+1]?`<b>UP NEXT</b>${escapeHtml(all[state.step+1].instruction)}`:'<b>ALL DONE</b>Enjoy your meal!';$('prevStep').disabled=state.step===0;$('nextStep').textContent=state.step===all.length-1?'Finish ✓':'Next →';persist()}
function navigate(dir){if(!state.recipe)return;let n=steps().length;if(dir>0&&state.step===n-1){show('detail');return}state.step=Math.min(n-1,Math.max(0,state.step+dir));renderCook()}
$('search').oninput=drawList;$('browseBtn').onclick=()=>{drawList();show('browse')};$('backBtn').onclick=()=>show('browse');$('exitCook').onclick=()=>show('detail');$('startCook').onclick=()=>{renderCook();show('cook')};$('cookTab').onclick=()=>{renderCook();show('cook')};$('fullTab').onclick=()=>{};$('prevStep').onclick=()=>navigate(-1);$('nextStep').onclick=()=>navigate(1);$('resetScale').onclick=()=>{state.factor=1;renderScale();renderFull();persist()};$('scaleModes').querySelectorAll('button').forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;renderRecipe();persist()});
let startX=null;let cook=$('cook');cook.addEventListener('touchstart',e=>{if(e.touches.length===1)startX=e.touches[0].clientX},{passive:true});cook.addEventListener('touchend',e=>{if(startX===null)return;let dx=e.changedTouches[0].clientX-startX;startX=null;if(Math.abs(dx)>75)navigate(dx<0?1:-1)},{passive:true});document.addEventListener('keydown',e=>{if(!$('cook').classList.contains('hidden')){if(e.key==='ArrowRight')navigate(1);if(e.key==='ArrowLeft')navigate(-1)}});
drawList();try{let saved=JSON.parse(localStorage.getItem('kitchenNotesLast')||'null');if(saved&&recipes.some(r=>r.id===saved.id)){openRecipe(saved.id);state.factor=Number(saved.factor)>0?Number(saved.factor):1;state.step=Math.min(steps().length-1,Math.max(0,saved.step||0));state.mode=saved.mode||'multiplier';renderRecipe();}}catch(e){}
})();
