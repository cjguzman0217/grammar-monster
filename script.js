const questions = [
  {q:"Choose the correct sentence:", a:["This place is a dump.","This place are a dump."], c:0, why:"Correct — “place” is singular, so it takes “is.”"},
  {q:"I shall marry ___ I like.", a:["whoever","whomever"], c:0, why:"“Whoever” is the subject of “I like” in this construction."},
  {q:"Choose the correct word:", a:["altogether","all together"], c:0, why:"“Altogether” means completely or on the whole."},
  {q:"Do me a favour. ___ your technique.", a:["Alter","Altar"], c:0, why:"“Alter” is the verb meaning to change."},
  {q:"Which word is a verb?", a:["plays","mother-in-law","green"], c:0, why:"“Plays” expresses an action."},
  {q:"Identify the relative pronoun:", a:["who","when","how"], c:0, why:"“Who” can introduce a relative clause referring to a person."},
  {q:"Which is a direct question?", a:["Why are you late?","Please explain why you're late."], c:0, why:"The first sentence directly asks a question."},
  {q:"Which means 'not interested'?", a:["uninterested","disinterested"], c:0, why:"“Uninterested” means not interested; “disinterested” traditionally means impartial."},
  {q:"Choose the correct spelling:", a:["vie","vye"], c:0, why:"The verb is spelled “vie.”"},
  {q:"What is a denotation of 'jolly'?", a:["happy","sailor","Roger"], c:0, why:"“Jolly” can mean cheerful or happy."}
];

let current = 0, score = 0, answered = false;
const questionText = document.getElementById("questionText");
const answers = document.getElementById("answers");
const feedback = document.getElementById("feedback");
const nextBtn = document.getElementById("nextBtn");
const questionCount = document.getElementById("questionCount");
const scoreEl = document.getElementById("score");
const progressBar = document.getElementById("progressBar");

function renderQuestion(){
  answered = false;
  nextBtn.disabled = true;
  feedback.textContent = "";
  const item = questions[current];
  questionText.textContent = item.q;
  questionCount.textContent = `Question ${current + 1} of ${questions.length}`;
  scoreEl.textContent = `${score} correct`;
  progressBar.style.width = `${((current + 1)/questions.length)*100}%`;
  answers.innerHTML = "";
  item.a.forEach((answer, i)=>{
    const btn = document.createElement("button");
    btn.className = "answer";
    btn.textContent = answer;
    btn.onclick = ()=>selectAnswer(btn,i);
    answers.appendChild(btn);
  });
}
function selectAnswer(btn,index){
  if(answered) return;
  answered = true;
  const item = questions[current];
  const all = [...document.querySelectorAll(".answer")];
  if(index === item.c){
    score++;
    btn.classList.add("correct");
    feedback.textContent = "✓ " + item.why;
  } else {
    btn.classList.add("wrong");
    all[item.c].classList.add("correct");
    feedback.textContent = "Not quite. " + item.why;
  }
  scoreEl.textContent = `${score} correct`;
  nextBtn.disabled = false;
}
nextBtn.addEventListener("click",()=>{
  if(current < questions.length-1){
    current++;
    renderQuestion();
  } else {
    questionText.textContent = `You scored ${score} out of ${questions.length}.`;
    answers.innerHTML = "";
    feedback.textContent = score >= 8 ? "Excellent work." : "Want another go?";
    nextBtn.textContent = "Restart test ↻";
    nextBtn.disabled = false;
    nextBtn.onclick = ()=>{
      current=0;score=0;nextBtn.textContent="Next question →";nextBtn.onclick=null;
      renderQuestion();
    }
  }
});
renderQuestion();

document.querySelectorAll("[data-scroll]").forEach(btn=>{
  btn.addEventListener("click",()=>document.querySelector(btn.dataset.scroll)?.scrollIntoView({behavior:"smooth"}));
});

const search = document.getElementById("lessonSearch");
const cards = [...document.querySelectorAll(".lesson-card")];
const noResults = document.getElementById("noResults");
function runSearch(value){
  const term = value.trim().toLowerCase();
  let visible = 0;
  cards.forEach(card=>{
    const match = !term || (card.textContent + " " + card.dataset.keywords).toLowerCase().includes(term);
    card.style.display = match ? "flex" : "none";
    if(match) visible++;
  });
  noResults.hidden = visible !== 0;
  document.getElementById("popular").scrollIntoView({behavior:"smooth"});
}
document.getElementById("searchBtn").addEventListener("click",()=>runSearch(search.value));
search.addEventListener("keydown",e=>{if(e.key==="Enter") runSearch(search.value)});
document.querySelectorAll("[data-search]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    search.value = btn.dataset.search;
    runSearch(btn.dataset.search);
  });
});
