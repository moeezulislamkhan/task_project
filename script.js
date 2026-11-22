(function(){
var KEY="taskboard.v1", tasks=[], filter="all", query="", dragId=null, editId=null;
var COL={Work:"var(--work)",Personal:"var(--personal)",Study:"var(--study)"};
var $=function(id){return document.getElementById(id)};

function saveToLocalStorage(){try{localStorage.setItem(KEY,JSON.stringify(tasks))}catch(e){}}
function loadFromLocalStorage(){try{var r=localStorage.getItem(KEY);var a=r?JSON.parse(r):[];return Array.isArray(a)?a:[]}catch(e){return []}}

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function today(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function fmt(s){var p=s.split("-");return new Date(p[0],p[1]-1,p[2]).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}

function addTask(){
  var t=$("text").value.trim(); if(!t){$("text").focus();return}
  tasks.unshift({id:uid(),text:t,category:$("cat").value,due:$("due").value,done:false});
  $("text").value="";$("due").value="";saveToLocalStorage();render();$("text").focus();
}
function toggle(id){var t=tasks.find(function(x){return x.id===id});if(t){t.done=!t.done;saveToLocalStorage();render(true)}}
function remove(id,el){
  el.classList.add("removing");
  setTimeout(function(){tasks=tasks.filter(function(x){return x.id!==id});saveToLocalStorage();render()},250);
}
function update(id,text){
  var t=tasks.find(function(x){return x.id===id});text=text.trim();
  if(t&&text)t.text=text; editId=null; saveToLocalStorage(); render();
}
function move(from,to){
  if(from===to)return;
  var a=tasks.findIndex(function(x){return x.id===from}),b=tasks.findIndex(function(x){return x.id===to});
  if(a<0||b<0)return; var it=tasks.splice(a,1)[0]; tasks.splice(b,0,it); saveToLocalStorage(); render();
}

function visible(){
  return tasks.filter(function(t){
    if(filter==="active"&&t.done)return false;
    if(filter==="done"&&!t.done)return false;
    return !query||(t.text+" "+t.category).toLowerCase().indexOf(query)>-1;
  });
}

function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}

function row(t){
  var li=el("li","task"+(t.done?" done":""));
  li.style.setProperty("--c",COL[t.category]||"var(--line)");
  li.draggable=editId!==t.id; li.dataset.id=t.id;
  var grip=el("span","grip","⋮⋮");grip.setAttribute("aria-hidden","true");grip.title="Drag to reorder";
  var cb=el("input","check");cb.type="checkbox";cb.checked=t.done;cb.setAttribute("aria-label","Mark complete");
  cb.onchange=function(){toggle(t.id)};
  var body=el("div","body");
  if(editId===t.id){
    var inp=el("input","edit");inp.type="text";inp.value=t.text;inp.maxLength=120;
    inp.onkeydown=function(e){if(e.key==="Enter")update(t.id,inp.value);if(e.key==="Escape"){editId=null;render()}};
    inp.onblur=function(){if(editId===t.id)update(t.id,inp.value)};
    body.appendChild(inp);setTimeout(function(){inp.focus();inp.select()},0);
  }else{
    var title=el("span","title",t.text);title.ondblclick=function(){editId=t.id;render()};
    body.appendChild(title);
  }
  var meta=el("div","meta");meta.appendChild(el("span","cat",t.category));
  if(t.due){var late=!t.done&&t.due<today();meta.appendChild(el("span",late?"late":"",(late?"Overdue · ":"Due ")+fmt(t.due)))}
  body.appendChild(meta);
  var ed=el("button","ib","Edit");ed.onclick=function(){editId=t.id;render()};
  var del=el("button","ib del","Delete");del.onclick=function(){remove(t.id,li)};
  li.append(grip,cb,body,ed,del);

  li.ondragstart=function(e){dragId=t.id;li.classList.add("drag");e.dataTransfer.effectAllowed="move";try{e.dataTransfer.setData("text/plain",t.id)}catch(x){}};
  li.ondragend=function(){dragId=null;li.classList.remove("drag")};
  li.ondragover=function(e){if(dragId){e.preventDefault();li.classList.add("over")}};
  li.ondragleave=function(){li.classList.remove("over")};
  li.ondrop=function(e){e.preventDefault();li.classList.remove("over");if(dragId)move(dragId,t.id)};
  return li;
}

function render(noAnim){
  var list=$("list");list.textContent="";
  var items=visible();
  items.forEach(function(t){var r=row(t);if(noAnim)r.style.animation="none";list.appendChild(r)});
  if(!items.length){
    var li=el("li","empty",tasks.length?"No tasks match this view.":"No tasks yet. Add your first one above.");list.appendChild(li);
  }
  var left=tasks.filter(function(t){return !t.done}).length;
  $("count").textContent=left+" active · "+(tasks.length-left)+" completed";
  $("clear").hidden=tasks.length===left;
  document.querySelectorAll(".tab").forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.f===filter))});
}

$("addBtn").onclick=addTask;
$("text").onkeydown=function(e){if(e.key==="Enter")addTask()};
$("q").oninput=function(e){query=e.target.value.trim().toLowerCase();render(true)};
$("clear").onclick=function(){tasks=tasks.filter(function(t){return !t.done});saveToLocalStorage();render()};
document.querySelectorAll(".tab").forEach(function(b){b.onclick=function(){filter=b.dataset.f;render(true)}});

tasks=loadFromLocalStorage();
render(true);
})();
