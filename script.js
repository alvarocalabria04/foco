'use strict';
const $ = s => document.querySelector(s);
const DURACION = { foco: 25 * 60, descanso: 5 * 60 };
const CIRC = 2 * Math.PI * 54;

let estado = cargar();
let modo = 'foco', resta = DURACION.foco, reloj = null;

function cargar() {
  try { return JSON.parse(localStorage.getItem('foco')) || { tareas: [], activa: null }; }
  catch { return { tareas: [], activa: null }; }
}
const guardar = () => localStorage.setItem('foco', JSON.stringify(estado));
const tareaActiva = () => estado.tareas.find(t => t.id === estado.activa);

function pintarTiempo() {
  const m = String(Math.floor(resta / 60)).padStart(2, '0');
  const s = String(resta % 60).padStart(2, '0');
  $('#tiempo').textContent = `${m}:${s}`;
  $('#arco').style.strokeDashoffset = CIRC * (1 - resta / DURACION[modo]);
  $('#modo').textContent = modo === 'foco' ? 'Enfoque' : 'Descanso';
  $('#inicio').textContent = reloj ? 'Pausar' : 'Iniciar';
  const t = tareaActiva();
  $('#actual').textContent = modo === 'descanso' ? 'Respira y estira las piernas'
    : t ? t.texto : 'Elige una tarea para empezar';
  document.title = reloj ? `${$('#tiempo').textContent} · Foco` : 'Foco · Tareas y temporizador';
}

function pintarLista() {
  const ul = $('#lista');
  ul.replaceChildren();
  if (!estado.tareas.length) {
    const p = document.createElement('li');
    p.className = 'vacio';
    p.textContent = 'Aún no hay tareas. Escribe la primera arriba.';
    ul.append(p);
  }
  for (const t of estado.tareas) {
    const li = document.createElement('li');
    li.className = (t.hecha ? 'hecha ' : '') + (t.id === estado.activa ? 'activa' : '');

    const chk = document.createElement('input');
    chk.type = 'checkbox'; chk.checked = t.hecha;
    chk.setAttribute('aria-label', `Completar ${t.texto}`);
    chk.onchange = () => { t.hecha = chk.checked; guardar(); pintarLista(); };

    const txt = document.createElement('button');
    txt.className = 'texto'; txt.textContent = t.texto;
    txt.title = 'Enfocarme en esta tarea';
    txt.onclick = () => { estado.activa = t.id; guardar(); pintarLista(); pintarTiempo(); };

    const pomos = document.createElement('span');
    pomos.className = 'pomos'; pomos.textContent = t.pomos ? `🍅 ${t.pomos}` : '';

    const del = document.createElement('button');
    del.className = 'borrar'; del.textContent = '×';
    del.setAttribute('aria-label', `Borrar ${t.texto}`);
    del.onclick = () => {
      estado.tareas = estado.tareas.filter(x => x.id !== t.id);
      if (estado.activa === t.id) estado.activa = null;
      guardar(); pintarLista(); pintarTiempo();
    };

    li.append(chk, txt, pomos, del);
    ul.append(li);
  }
  const hechas = estado.tareas.filter(t => t.hecha).length;
  const total = estado.tareas.reduce((n, t) => n + t.pomos, 0);
  $('#resumen').textContent = estado.tareas.length
    ? `${hechas} de ${estado.tareas.length} completadas · ${total} sesiones de enfoque` : '';
}

function parar() { clearInterval(reloj); reloj = null; }

function terminar() {
  parar();
  if (modo === 'foco') { const t = tareaActiva(); if (t) { t.pomos++; guardar(); pintarLista(); } }
  modo = modo === 'foco' ? 'descanso' : 'foco';
  resta = DURACION[modo];
  pintarTiempo();
}

$('#inicio').onclick = () => {
  if (reloj) { parar(); }
  else reloj = setInterval(() => { if (--resta <= 0) terminar(); pintarTiempo(); }, 1000);
  pintarTiempo();
};
$('#reinicio').onclick = () => { parar(); resta = DURACION[modo]; pintarTiempo(); };
$('#saltar').onclick = () => { parar(); modo = modo === 'foco' ? 'descanso' : 'foco'; resta = DURACION[modo]; pintarTiempo(); };

$('#form').onsubmit = e => {
  e.preventDefault();
  const texto = $('#nueva').value.trim();
  if (!texto) return;
  const t = { id: Date.now(), texto, hecha: false, pomos: 0 };
  estado.tareas.push(t);
  if (!estado.activa) estado.activa = t.id;
  $('#nueva').value = '';
  guardar(); pintarLista(); pintarTiempo();
};

pintarLista();
pintarTiempo();
