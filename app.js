
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* =========================================
   SILENNS CLUB - APLICACIÓN PRINCIPAL
========================================= */

const SUPABASE_URL = "https://xbpebgcssdzeiodueuhe.supabase.co";
const SUPABASE_KEY = "sb_publishable_q2UabT0vQffBnzkw-WDDKA_1HelZysX";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let currentProfile = null;
let isAdmin = false;

let profiles = [];
let teams = [];
let teamMembers = [];
let championships = [];
let events = [];
let results = [];
let champions = [];
let gallery = [];
let registrations = [];

/* =========================================
   HELPERS
========================================= */

const $ = id => document.getElementById(id);

function escapeHTML(value) {
 return String(value ?? "").replace(/[&<>"']/g, char => ({
  "&":"&amp;",
  "<":"&lt;",
  ">":"&gt;",
  '"':"&quot;",
  "'":"&#039;"
 })[char]);
}

function toast(message) {
 const element = $("toast");
 if (!element) return;

 element.textContent = message;
 element.style.display = "block";

 clearTimeout(toast.timer);
 toast.timer = setTimeout(() => {
  element.style.display = "none";
 }, 3500);
}

function formatDate(value) {
 if (!value) return "Fecha pendiente";

 const date = new Date(value);

 if (Number.isNaN(date.getTime())) return "Fecha pendiente";

 return date.toLocaleString("es-AR", {
  dateStyle:"medium",
  timeStyle:"short"
 });
}

function showEmpty(id, message) {
 const element = $(id);
 if (element) element.innerHTML = `<div class="empty">${escapeHTML(message)}</div>`;
}

function setText(id, value) {
 const element = $(id);
 if (element) element.textContent = value;
}

function getFormData(form) {
 return Object.fromEntries(new FormData(form).entries());
}

function setStatus(message) {
 setText("user-status", message);
}

function isWRC(game) {
 return /wrc|rally/i.test(game || "");
}

function isF1(game) {
 return /f1|formula/i.test(game || "");
}

function updateStats() {
 setText("stat-pilots", profiles.length);
 setText("stat-teams", teams.length);
 setText("stat-events", events.length);
 setText("stat-championships", championships.length);
}

function getTeamName(teamId) {
 const team = teams.find(item => item.id === teamId);
 return team ? team.name : "Equipo";
}

function getPilotName(pilotId) {
 const pilot = profiles.find(item => item.id === pilotId);
 return pilot?.display_name || pilot?.full_name || "Piloto";
}

/* =========================================
   CARGA DE DATOS
========================================= */

async function loadProfiles() {
 const { data, error } = await supabase
  .from("profiles")
  .select("*")
  .order("created_at", { ascending:false });

 if (error) {
  console.error("Error cargando pilotos:", error);
  profiles = [];
 } else {
  profiles = data || [];
 }

 renderPilots();
 updateStats();
}

async function loadTeams() {
 const { data, error } = await supabase
  .from("teams")
  .select("*")
  .order("created_at", { ascending:false });

 if (error) {
  console.error("Error cargando equipos:", error);
  teams = [];
 } else {
  teams = data || [];
 }

 const membersResponse = await supabase
  .from("team_members")
  .select("*");

 if (membersResponse.error) {
  console.error("Error cargando integrantes:", membersResponse.error);
  teamMembers = [];
 } else {
  teamMembers = membersResponse.data || [];
 }

 renderTeams();
 fillTeamSelects();
 renderMyTeam();
 updateStats();
}

async function loadChampionships() {
 const { data, error } = await supabase
  .from("championships")
  .select("*")
  .order("created_at", { ascending:false });

 if (error) {
  console.error("Error cargando campeonatos:", error);
  championships = [];
 } else {
  championships = data || [];
 }

 renderChampionships();
 updateStats();
}

async function loadEvents() {
 const { data, error } = await supabase
  .from("events")
  .select("*")
  .order("starts_at", { ascending:true });

 if (error) {
  console.error("Error cargando eventos:", error);
  events = [];
 } else {
  events = data || [];
 }

 renderEvents();
 fillEventSelect();
 updateStats();
}

async function loadResults() {
 const { data, error } = await supabase
  .from("results")
  .select("*")
  .order("points", { ascending:false });

 if (error) {
  console.error("Error cargando resultados:", error);
  results = [];
 } else {
  results = data || [];
 }

 renderStandings();
}

async function loadChampions() {
 const { data, error } = await supabase
  .from("champions")
  .select("*")
  .order("date", { ascending:false });

 if (error) {
  console.error("Error cargando campeones:", error);
  champions = [];
 } else {
  champions = data || [];
 }

 renderChampions();
}

async function loadGallery() {
 const { data, error } = await supabase
  .from("gallery")
  .select("*")
  .order("created_at", { ascending:false });

 if (error) {
  console.error("Error cargando galería:", error);
  gallery = [];
 } else {
  gallery = data || [];
 }

 renderGallery();
}

async function loadRegistrations() {
 const { data, error } = await supabase
  .from("registrations")
  .select("*");

 if (error) {
  console.error("Error cargando inscripciones:", error);
  registrations = [];
 } else {
  registrations = data || [];
 }
}

async function loadAll() {
 await Promise.all([
  loadProfiles(),
  loadTeams(),
  loadChampionships(),
  loadEvents(),
  loadResults(),
  loadChampions(),
  loadGallery(),
  loadRegistrations()
 ]);
}

/* =========================================
   RENDER: CAMPEONATOS
========================================= */

function championshipCard(championship) {
 const registered = registrations.some(item =>
  item.championship_id === championship.id &&
  item.pilot_id === currentUser?.id
 );

 const button = currentUser
  ? `<button class="btn ${registered ? "purple" : "primary"} championship-register" data-id="${escapeHTML(championship.id)}" ${registered ? "disabled" : ""}>
      ${registered ? "Inscripto" : "Inscribirme"}
     </button>`
  : `<button class="btn championship-register" data-login="true">Ingresar para inscribirme</button>`;

 return `
  <div class="list-item">
   <div>
    <span class="tag">${escapeHTML(championship.game)}</span>
    <h3>${escapeHTML(championship.name)}</h3>
    <p>${escapeHTML(championship.description || "Competencia SILENNS CLUB")}</p>
    <p>Estado: ${escapeHTML(championship.status)}</p>
   </div>
   ${button}
  </div>
 `;
}

function renderChampionships() {
 const wrc = championships.filter(item => isWRC(item.game));
 const f1 = championships.filter(item => isF1(item.game));

 if ($("wrc-championships")) {
  $("wrc-championships").innerHTML = wrc.length
   ? wrc.map(championshipCard).join("")
   : `<div class="empty">Todavía no hay campeonatos WRC publicados.</div>`;
 }

 if ($("f1-championships")) {
  $("f1-championships").innerHTML = f1.length
   ? f1.map(championshipCard).join("")
   : `<div class="empty">Todavía no hay campeonatos F1 publicados.</div>`;
 }

 if ($("championships-list")) {
  $("championships-list").innerHTML = championships.length
   ? championships.map(championshipCard).join("")
   : `<div class="empty">Todavía no hay campeonatos publicados.</div>`;
 }
}

async function registerChampionship(championshipId) {
 if (!currentUser) {
  openAuth();
  toast("Primero tenés que ingresar a tu cuenta.");
  return;
 }

 const alreadyRegistered = registrations.some(item =>
  item.championship_id === championshipId &&
  item.pilot_id === currentUser.id
 );

 if (alreadyRegistered) {
  toast("Ya estás inscripto en este campeonato.");
  return;
 }

 const { error } = await supabase
  .from("registrations")
  .insert({
   championship_id:championshipId,
   pilot_id:currentUser.id
  });

 if (error) {
  console.error(error);
  toast("No se pudo completar la inscripción. Revisá los permisos.");
  return;
 }

 toast("¡Inscripción realizada!");
 await loadRegistrations();
 renderChampionships();
}

/* =========================================
   RENDER: EVENTOS
========================================= */

function renderEvents() {
 const container = $("events-list");
 if (!container) return;

 if (!events.length) {
  showEmpty("events-list", "Todavía no hay eventos publicados.");
  return;
 }

 container.innerHTML = events.map(event => `
  <div class="list-item">
   <div>
    <span class="tag">${escapeHTML(event.status)}</span>
    <h3>${escapeHTML(event.name)}</h3>
    <p>${escapeHTML(event.country || "Ubicación pendiente")}</p>
    <p>${escapeHTML(formatDate(event.starts_at))}</p>
   </div>
  </div>
 `).join("");
}

/* =========================================
   RENDER: PILOTOS
========================================= */

function renderPilots() {
 const container = $("pilots-list");
 if (!container) return;

 if (!profiles.length) {
  showEmpty("pilots-list", "Todavía no hay pilotos registrados.");
  return;
 }

 container.innerHTML = profiles.map(pilot => {
  const avatar = pilot.avatar_url ||
   "https://placehold.co/300x300/101522/00e5ff?text=PILOTO";

  const pilotTeam = teamMembers.find(member =>
   member.profile_id === pilot.id
  );

  return `
   <article class="card">
    <div class="card-body">
     <img class="avatar" src="${escapeHTML(avatar)}"
      alt="Foto de ${escapeHTML(pilot.display_name)}"
      onerror="this.src='https://placehold.co/300x300/101522/00e5ff?text=PILOTO'">
     <span class="tag">${escapeHTML(pilot.country || "País no indicado")}</span>
     <h3>${escapeHTML(pilot.display_name || "Piloto")}</h3>
     <p>${escapeHTML(pilot.platform || "Plataforma no indicada")}</p>
     <p>${escapeHTML(pilot.input_device || "Control no indicado")}</p>
     <p>Equipo: ${escapeHTML(pilotTeam ? getTeamName(pilotTeam.team_id) : "Sin equipo")}</p>
     <p>Juegos: ${escapeHTML((pilot.games || []).join(", ") || "Sin juegos indicados")}</p>
    </div>
   </article>
  `;
 }).join("");
}

/* =========================================
   PERFIL DEL USUARIO
========================================= */

function fillProfileForm() {
 if (!currentProfile) return;

 const fields = {
  "profile-full-name":currentProfile.full_name,
  "profile-display-name":currentProfile.display_name,
  "profile-country":currentProfile.country,
  "profile-birth-date":currentProfile.birth_date,
  "profile-platform":currentProfile.platform,
  "profile-ea-id":currentProfile.ea_id,
  "profile-input-device":currentProfile.input_device,
  "profile-wheel-model":currentProfile.wheel_model
 };

 Object.entries(fields).forEach(([id, value]) => {
  if ($(id)) $(id).value = value || "";
 });

 const games = currentProfile.games || [];

 document.querySelectorAll('input[name="games"]').forEach(input => {
  input.checked = games.includes(input.value);
 });
}

async function saveProfile(event) {
 event.preventDefault();

 if (!currentUser) {
  toast("Tenés que ingresar primero.");
  openAuth();
  return;
 }

 const form = event.currentTarget;
 const formData = getFormData(form);

 const games = Array.from(
  document.querySelectorAll('input[name="games"]:checked')
 ).map(input => input.value);

 let avatarUrl = currentProfile?.avatar_url || null;

 const avatarFile = $("profile-avatar")?.files?.[0];

 if (avatarFile) {
  const extension = avatarFile.name.split(".").pop();
  const fileName = `${currentUser.id}-${Date.now()}.${extension}`;
  const filePath = fileName;

  const { error:uploadError } = await supabase.storage
   .from("pilot-avatars")
   .upload(filePath, avatarFile, { upsert:true });

  if (uploadError) {
   console.error("Error subiendo avatar:", uploadError);
   toast("No se pudo subir la foto. Revisá el bucket pilot-avatars.");
   return;
  }

  const { data:urlData } = supabase.storage
   .from("pilot-avatars")
   .getPublicUrl(filePath);

  avatarUrl = urlData.publicUrl;
 }

 const profileData = {
  id:currentUser.id,
  display_name:formData.display_name || formData.full_name || "Piloto",
  full_name:formData.full_name || null,
  country:formData.country || null,
  birth_date:formData.birth_date || null,
  platform:formData.platform || null,
  ea_id:formData.ea_id || null,
  input_device:formData.input_device || null,
  wheel_model:formData.wheel_model || null,
  games,
  avatar_url:avatarUrl
 };

 const { error } = await supabase
  .from("profiles")
  .upsert(profileData, { onConflict:"id" });

 if (error) {
  console.error("Error guardando perfil:", error);
  toast("No se pudo guardar el perfil. Revisá los permisos de Supabase.");
  return;
 }

 toast("¡Perfil actualizado!");
 await loadProfiles();
 await refreshUser();
 form.reset();
 fillProfileForm();
}

/* =========================================
   RENDER: EQUIPOS
========================================= */

function renderTeams() {
 const container = $("teams-list");
 if (!container) return;

 if (!teams.length) {
  showEmpty("teams-list", "Todavía no hay equipos creados.");
  return;
 }

 container.innerHTML = teams.map(team => {
  const members = teamMembers.filter(item => item.team_id === team.id);

  const logo = team.logo_url ||
   "https://placehold.co/500x250/101522/00e5ff?text=TEAM";

  return `
   <article class="card">
    <div class="card-image">
     <img src="${escapeHTML(logo)}" alt="Logo ${escapeHTML(team.name)}"
      style="width:100%;height:155px;object-fit:contain"
      onerror="this.style.display='none'">
    </div>
    <div class="card-body">
     <span class="tag">${escapeHTML(team.country || "Equipo")}</span>
     <h3>${escapeHTML(team.name)}</h3>
     <p>${members.length} integrante(s)</p>
    </div>
   </article>
  `;
 }).join("");
}

function fillTeamSelects() {
 const selects = [
  "join-team-select",
  "admin-result-team",
  "admin-champion-team"
 ];

 selects.forEach(id => {
  const select = $(id);
  if (!select) return;

  const oldValue = select.value;
  const firstOption = id === "join-team-select"
   ? "Seleccionar equipo"
   : "Seleccionar equipo";

  select.innerHTML = `<option value="">${firstOption}</option>`;

  teams.forEach(team => {
   const option = document.createElement("option");
   option.value = team.id;
   option.textContent = team.name;
   select.appendChild(option);
  });

  if (teams.some(team => team.id === oldValue)) {
   select.value = oldValue;
  }
 });
}

function renderMyTeam() {
 const element = $("my-team-info");
 if (!element) return;

 if (!currentUser) {
  element.textContent = "Iniciá sesión para consultar tu equipo.";
  return;
 }

 const membership = teamMembers.find(item =>
  item.profile_id === currentUser.id
 );

 if (!membership) {
  element.textContent = "Todavía no pertenecés a ningún equipo.";
  return;
 }

 element.textContent = `Tu equipo actual es: ${getTeamName(membership.team_id)}.`;
}

async function createTeam(event) {
 event.preventDefault();

 if (!currentUser) {
  toast("Tenés que ingresar para crear un equipo.");
  openAuth();
  return;
 }

 const membership = teamMembers.find(item =>
  item.profile_id === currentUser.id
 );

 if (membership) {
  toast("Ya pertenecés a un equipo. Primero tendrías que salir del actual.");
  return;
 }

 const data = getFormData(event.currentTarget);

 const { data:team, error } = await supabase
  .from("teams")
  .insert({
   name:data.name,
   country:data.country || null,
   logo_url:data.logo_url || null
  })
  .select()
  .single();

 if (error) {
  console.error("Error creando equipo:", error);
  toast("No se pudo crear el equipo. Revisá si el nombre ya existe.");
  return;
 }

 const { error:memberError } = await supabase
  .from("team_members")
  .insert({
   team_id:team.id,
   profile_id:currentUser.id
  });

 if (memberError) {
  console.error("Error agregando creador al equipo:", memberError);
  toast("El equipo se creó, pero no se pudo agregar tu perfil como integrante.");
 } else {
  toast("¡Equipo creado correctamente!");
 }

 event.currentTarget.reset();
 await loadTeams();
}

async function joinTeam(event) {
 event.preventDefault();

 if (!currentUser) {
  openAuth();
  toast("Tenés que ingresar primero.");
  return;
 }

 const teamId = $("join-team-select")?.value;

 if (!teamId) {
  toast("Seleccioná un equipo.");
  return;
 }

 const membership = teamMembers.find(item =>
  item.profile_id === currentUser.id
 );

 if (membership) {
  toast("Ya pertenecés a un equipo.");
  return;
 }

 const { error } = await supabase
  .from("team_members")
  .insert({
   team_id:teamId,
   profile_id:currentUser.id
  });

 if (error) {
  console.error("Error uniéndose al equipo:", error);
  toast("No se pudo unir al equipo. Revisá los permisos.");
  return;
 }

 toast("¡Ya sos integrante del equipo!");
 await loadTeams();
}

/* =========================================
   RESULTADOS Y CLASIFICACIÓN
========================================= */

function renderStandings() {
 const container = $("standings-list");
 if (!container) return;

 if (!results.length) {
  showEmpty("standings-list", "Todavía no hay resultados cargados.");
  return;
 }

 const totals = {};

 results.forEach(result => {
  if (!totals[result.team_id]) {
   totals[result.team_id] = 0;
  }

  totals[result.team_id] += Number(result.points) || 0;
 });

 const ranking = Object.entries(totals)
  .map(([teamId, points]) => ({
   teamId,
   points,
   name:getTeamName(teamId)
  }))
  .sort((a,b) => b.points - a.points);

 container.innerHTML = `
  <div style="overflow-x:auto">
   <table style="width:100%;border-collapse:collapse;text-align:left">
    <thead>
     <tr style="color:var(--cyan);border-bottom:1px solid var(--line)">
      <th style="padding:12px">POS.</th>
      <th style="padding:12px">EQUIPO</th>
      <th style="padding:12px">PUNTOS</th>
     </tr>
    </thead>
    <tbody>
     ${ranking.map((item,index) => `
      <tr style="border-bottom:1px solid var(--line)">
       <td style="padding:12px">${index + 1}</td>
       <td style="padding:12px;font-weight:700">${escapeHTML(item.name)}</td>
       <td style="padding:12px;color:var(--cyan);font-weight:800">${item.points}</td>
      </tr>
     `).join("")}
    </tbody>
   </table>
  </div>
 `;
}

/* =========================================
   SALÓN DE LA FAMA
========================================= */

function renderChampions() {
 const container = $("champions-list");
 if (!container) return;

 if (!champions.length) {
  showEmpty("champions-list", "Todavía no hay campeones registrados.");
  return;
 }

 container.innerHTML = champions.map(champion => `
  <article class="card">
   <div class="card-image">★ CHAMPION ★</div>
   <div class="card-body">
    <span class="tag">Temporada ${escapeHTML(champion.season)}</span>
    <h3>${escapeHTML(getTeamName(champion.team_id))}</h3>
    <p>${escapeHTML(champion.description || "Campeón SILENNS CLUB")}</p>
    <p>${escapeHTML(champion.date || "")}</p>
   </div>
  </article>
 `).join("");
}

/* =========================================
   GALERÍA
========================================= */

function renderGallery() {
 const container = $("gallery-list");
 if (!container) return;

 if (!gallery.length) {
  showEmpty("gallery-list", "Todavía no hay imágenes en la galería.");
  return;
 }

 container.innerHTML = gallery.map(item => `
  <article class="card">
   <img src="${escapeHTML(item.image_url)}"
    alt="${escapeHTML(item.title || "Imagen de la comunidad")}"
    style="width:100%;height:210px;object-fit:cover"
    onerror="this.style.display='none'">
   <div class="card-body">
    <h3>${escapeHTML(item.title || "Momento de carrera")}</h3>
    <p>Por: ${escapeHTML(item.pilot_id ? getPilotName(item.pilot_id) : "Comunidad")}</p>
   </div>
  </article>
 `).join("");
}

/* =========================================
   SELECTS DEL ADMIN
========================================= */

function fillEventSelect() {
 const select = $("admin-result-event");
 if (!select) return;

 const oldValue = select.value;
 select.innerHTML = '<option value="">Seleccionar evento</option>';

 events.forEach(event => {
  const option = document.createElement("o
