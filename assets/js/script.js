const questions = [
  {q:"Choose the correct sentence:",a:["This place is a dump.","This place are a dump."],c:0,why:"Correct — “place” is singular, so it takes “is.”"},
  {q:"I shall marry ___ I like.",a:["whoever","whomever"],c:0,why:"“Whoever” works here because it functions as the subject within the clause."},
  {q:"Choose the correct word:",a:["altogether","all together"],c:0,why:"“Altogether” means completely or on the whole."},
  {q:"Do me a favour. ___ your technique.",a:["Alter","Altar"],c:0,why:"“Alter” is the verb meaning to change."},
  {q:"Which word is a verb?",a:["plays","mother-in-law","green"],c:0,why:"“Plays” expresses an action."},
  {q:"Identify the relative pronoun:",a:["who","when","how"],c:0,why:"“Who” can introduce a relative clause referring to a person."},
  {q:"Which is a direct question?",a:["Why are you late?","Please explain why you're late."],c:0,why:"The first sentence directly asks a question."},
  {q:"Which means 'not interested'?",a:["uninterested","disinterested"],c:0,why:"“Uninterested” means not interested; “disinterested” traditionally means impartial."},
  {q:"Choose the correct spelling:",a:["vie","vye"],c:0,why:"The verb is spelled “vie.”"},
  {q:"What is a denotation of 'jolly'?",a:["happy","sailor","Roger"],c:0,why:"“Jolly” can mean cheerful or happy."}
];

const tips = [
  "A semicolon can join two closely related complete sentences.",
  "Use “fewer” for things you can count and “less” for quantities you cannot.",
  "An apostrophe does not make an ordinary noun plural.",
  "A strong verb usually beats a weak verb plus an adverb.",
  "If removing a clause changes the identity of the noun, you probably do not need commas around it.",
  "Read difficult sentences aloud. Your ear often catches what your eyes miss."
];

let current=0,score=0,answered=false;
const qText=document.getElementById("questionText");
const answers=document.getElementById("answers");
const feedback=document.getElementById("feedback");
const next=document.getElementById("nextBtn");
const qCount=document.getElementById("questionCount");
const scoreEl=document.getElementById("score");
const bar=document.getElementById("progressBar");
const pct=document.getElementById("progressPercent");

function renderQuestion(){
  answered=false; next.disabled=true; feedback.textContent="";
  const item=questions[current];
  qText.textContent=item.q;
  qCount.textContent=`Question ${current+1} of ${questions.length}`;
  scoreEl.textContent=`${score} correct`;
  const progress=Math.round(((current+1)/questions.length)*100);
  bar.style.width=`${progress}%`; pct.textContent=`${progress}%`;
  answers.innerHTML="";
  item.a.forEach((txt,i)=>{
    const btn=document.createElement("button");
    btn.className="answer"; btn.textContent=txt;
    btn.addEventListener("click",()=>selectAnswer(btn,i));
    answers.appendChild(btn);
  });
}

function selectAnswer(btn,index){
  if(answered)return;
  answered=true;
  const item=questions[current];
  const all=[...document.querySelectorAll(".answer")];
  if(index===item.c){
    score++;btn.classList.add("correct");
    feedback.textContent="✓ "+item.why;
  }else{
    btn.classList.add("wrong");
    all[item.c].classList.add("correct");
    feedback.textContent="Not quite. "+item.why;
  }
  scoreEl.textContent=`${score} correct`;
  next.disabled=false;
}

function restartQuiz(){
  current=0;score=0;
  next.innerHTML='Next question <span>→</span>';
  next.onclick=null;
  renderQuestion();
}

next.addEventListener("click",()=>{
  if(current<questions.length-1){current++;renderQuestion();return}
  qText.textContent=`You scored ${score} out of ${questions.length}.`;
  answers.innerHTML="";
  feedback.textContent=score>=8?"Monster level: impressive.":"A respectable start. Want another go?";
  qCount.textContent="Challenge complete";pct.textContent="100%";bar.style.width="100%";
  next.disabled=false;next.innerHTML='Restart challenge <span>↻</span>';
  next.onclick=restartQuiz;
});

renderQuestion();

document.getElementById("newTipBtn").addEventListener("click",()=>{
  const tip=document.getElementById("monsterTip");
  let nextTip=tips[Math.floor(Math.random()*tips.length)];
  while(nextTip===tip.textContent && tips.length>1){nextTip=tips[Math.floor(Math.random()*tips.length)]}
  tip.animate([{opacity:.2,transform:"translateY(3px)"},{opacity:1,transform:"translateY(0)"}],{duration:260});
  tip.textContent=nextTip;
});

document.querySelectorAll("[data-scroll]").forEach(el=>{
  el.addEventListener("click",()=>document.querySelector(el.dataset.scroll)?.scrollIntoView({behavior:"smooth"}))
});

const search=document.getElementById("lessonSearch");
const cards=[...document.querySelectorAll(".lesson-card")];
const none=document.getElementById("noResults");
function runSearch(value){
  const term=value.trim().toLowerCase();
  let visible=0;
  cards.forEach(card=>{
    const match=!term||(card.textContent+" "+card.dataset.keywords).toLowerCase().includes(term);
    card.style.display=match?"block":"none";
    if(match)visible++;
  });
  none.hidden=visible!==0;
  document.getElementById("popular").scrollIntoView({behavior:"smooth"});
}
document.getElementById("searchBtn").addEventListener("click",()=>runSearch(search.value));
search.addEventListener("keydown",e=>{if(e.key==="Enter")runSearch(search.value)});
document.querySelectorAll("[data-search]").forEach(btn=>{
  btn.addEventListener("click",()=>{search.value=btn.dataset.search;runSearch(btn.dataset.search)})
});

const mobileMenu=document.getElementById("mobileMenu");
const mobilePanel=document.getElementById("mobilePanel");
mobileMenu.addEventListener("click",()=>{
  const open=mobilePanel.classList.toggle("open");
  mobileMenu.setAttribute("aria-expanded",String(open));
});
mobilePanel.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>mobilePanel.classList.remove("open")));
