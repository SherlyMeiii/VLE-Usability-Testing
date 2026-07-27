/* ============================================================
   Shared script for the v2 pages: dashboard / course / assignment /
   participant / instructor. Every section below checks that its elements
   exist before wiring up listeners, so this one file is safe to include
   on every page even though each page only has some of these components.
   ============================================================ */

// ---------- Generic toast + demo-download helpers ----------
// Used everywhere below so that every button gives some visible feedback instead of doing
// nothing (per explicit request: 我功能都要可以互動喔，不要給我卡在那邊).
function showToast(msg){
  let el=document.getElementById('__toast');
  if(!el){ el=document.createElement('div'); el.id='__toast'; el.className='toast'; document.body.appendChild(el); }
  el.textContent=msg;
  el.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t=setTimeout(()=>el.classList.remove('show'),2200);
}
function simulateDownload(btn,filename){
  const original=btn.textContent;
  btn.disabled=true;
  btn.textContent='Preparing…';
  setTimeout(()=>{
    btn.textContent='✓ Downloaded';
    showToast('⬇ '+filename+' downloaded (demo)');
    setTimeout(()=>{ btn.textContent=original; btn.disabled=false; },1600);
  },700);
}

// ---------- Top nav: user menu + edit mode ----------
const userMenuBtn=document.getElementById('userMenuBtn');
const userMenuPanel=document.getElementById('userMenuPanel');
userMenuBtn?.addEventListener('click',(e)=>{
  e.stopPropagation();
  userMenuPanel?.classList.toggle('open');
});
document.getElementById('signOutBtn')?.addEventListener('click',(e)=>{
  e.preventDefault();
  showToast('👋 Signed out (demo)');
  userMenuPanel?.classList.remove('open');
});
document.addEventListener('click',(e)=>{
  if(userMenuPanel && userMenuPanel.classList.contains('open') && !userMenuPanel.contains(e.target) && e.target!==userMenuBtn && !userMenuBtn?.contains(e.target)){
    userMenuPanel.classList.remove('open');
  }
});
const editModeToggle=document.getElementById('editModeToggle');
editModeToggle?.addEventListener('change',()=>{
  showToast(editModeToggle.checked ? '✏️ Edit mode on' : 'Edit mode off');
});

// ---------- Generic modal open/close helper ----------
function openModal(id){ document.getElementById(id)?.classList.add('open'); }
function closeModal(id){ document.getElementById(id)?.classList.remove('open'); }
document.querySelectorAll('[data-open-modal]').forEach(btn=>{
  btn.addEventListener('click',()=>openModal(btn.getAttribute('data-open-modal')));
});
document.querySelectorAll('[data-close-modal]').forEach(btn=>{
  btn.addEventListener('click',()=>closeModal(btn.getAttribute('data-close-modal')));
});
document.querySelectorAll('.modal-overlay').forEach(overlay=>{
  overlay.addEventListener('click',(e)=>{ if(e.target===overlay) overlay.classList.remove('open'); });
});

// ---------- Horizontal scroll row buttons ----------
document.querySelectorAll('[data-scroll-target]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const row=document.querySelector(btn.getAttribute('data-scroll-target'));
    if(!row)return;
    const dir=btn.getAttribute('data-dir')==='prev'?-1:1;
    row.scrollBy({left:dir*280,behavior:'smooth'});
  });
});

// ---------- Course cards on the Dashboard -> open the Course page ----------
document.querySelectorAll('.course-card').forEach(card=>{
  card.addEventListener('click',()=>{ window.location.href = card.dataset.href || 'v3-course.html'; });
});

// ---------- Course search / filter ----------
function setupFilter(formSelector,cardSelector){
  const form=document.querySelector(formSelector);
  if(!form)return;
  const input=form.querySelector('input[type="search"]');
  const teacher=form.querySelector('[data-filter="teacher"]');
  const year=form.querySelector('[data-filter="year"]');
  const cards=()=>document.querySelectorAll(cardSelector);
  function apply(){
    const q=(input?.value||'').trim().toLowerCase();
    const t=teacher?.value||'';
    const y=year?.value||'';
    cards().forEach(card=>{
      const name=(card.dataset.name||'').toLowerCase();
      const cardTeacher=card.dataset.teacher||'';
      const cardYear=card.dataset.year||'';
      const matches=(!q||name.includes(q)) && (!t||cardTeacher===t) && (!y||cardYear===y);
      card.style.display=matches?'':'none';
    });
  }
  input?.addEventListener('input',apply);
  teacher?.addEventListener('change',apply);
  year?.addEventListener('change',apply);
}
setupFilter('#courseFilter','.course-card[data-name]');

// ---------- All-courses "+" card ----------
document.querySelectorAll('.all-courses-card').forEach(card=>{
  const plus=card.querySelector('.plus');
  plus?.addEventListener('click',(e)=>{
    e.stopPropagation();
    const nowDone = plus.textContent.trim()!=='✓';
    plus.textContent = nowDone ? '✓' : '+';
    plus.style.background = nowDone ? '#16a34a' : '';
    plus.style.color = nowDone ? '#fff' : '';
    card.querySelector('span')?.replaceChildren(document.createTextNode(nowDone ? 'Added to Dashboard' : 'All Courses Area'));
  });
  card.addEventListener('click',(e)=>{
    if(e.target===plus)return;
    window.location.href = card.getAttribute('data-browse-href') || '#all-courses';
  });
});

// ---------- Achievement "View Full" + Timetable "View Full" (comments #17 / #18) ----------
// Both open a modal; what's inside is our own call per the comment ("你自己決定長怎樣先").

// ---------- Week block collapse (Course page) ----------
document.querySelectorAll('.week-block .week-head').forEach(head=>{
  head.addEventListener('click',()=>{
    head.closest('.week-block').classList.toggle('collapsed');
  });
});
document.getElementById('collapseAllBtn')?.addEventListener('click',(e)=>{
  const blocks=document.querySelectorAll('.week-block');
  const anyOpen=[...blocks].some(b=>!b.classList.contains('collapsed'));
  blocks.forEach(b=>b.classList.toggle('collapsed',anyOpen));
  e.target.textContent = anyOpen ? 'Expand all' : 'Collapse all';
});

// ---------- Homework rows collapse as their own mini "section" ----------
document.querySelectorAll('.sub-section .sub-section-head').forEach(head=>{
  head.addEventListener('click',(e)=>{
    if(e.target.closest('.bm-btn') || e.target.closest('.complete-btn'))return;
    head.closest('.sub-section').classList.toggle('collapsed');
  });
});

// ---------- Instructor page accordion rows ----------
document.querySelectorAll('.info-row .info-row-head').forEach(head=>{
  head.addEventListener('click',()=>head.closest('.info-row').classList.toggle('collapsed'));
});

// ---------- Mark as Complete (comment #13: 我要有這個功能) ----------
// Completion state is persisted in localStorage (shared with v3-preview.html's "Activity
// Details" checkmark) so marking an item done here also shows as done on its preview page.
const COMPLETE_KEY='learngold_completed_v3';
function getCompleted(){ try{ return JSON.parse(localStorage.getItem(COMPLETE_KEY))||[]; }catch(e){ return []; } }
function saveCompleted(list){ try{ localStorage.setItem(COMPLETE_KEY, JSON.stringify(list)); }catch(e){} }
function isCompleted(id){ return getCompleted().includes(id); }
function toggleCompleted(id){
  let list=getCompleted();
  list = list.includes(id) ? list.filter(x=>x!==id) : [...list,id];
  saveCompleted(list);
  return list.includes(id);
}
document.querySelectorAll('.complete-btn').forEach(btn=>{
  const id=btn.dataset.completeId;
  if(id && isCompleted(id)){
    btn.classList.add('done');
    btn.textContent='✓ Completed';
  }
  btn.addEventListener('click',(e)=>{
    e.preventDefault();
    e.stopPropagation();
    let done;
    if(id){ done=toggleCompleted(id); }
    else { done=!btn.classList.contains('done'); }
    btn.classList.toggle('done',done);
    btn.textContent = done ? '✓ Completed' : 'Mark as Complete';
    updateCourseProgress();
  });
});

// ---------- Download All (comment #14: 要有download all / 最後可以全部下載課件) ----------
document.getElementById('downloadAllBtn')?.addEventListener('click',()=>{
  const btn=document.getElementById('downloadAllBtn');
  const original=btn.textContent;
  btn.textContent='Preparing files…';
  btn.disabled=true;
  setTimeout(()=>{
    btn.textContent='✓ All materials downloaded';
    setTimeout(()=>{ btn.textContent=original; btn.disabled=false; },1800);
  },900);
});

// ---------- Click a material row to preview it (comment #15) ----------
// Clicking a material item navigates to a real standalone page (v3-preview.html) that
// simulates opening a ppt/word/pdf file, with its own Download + Bookmark actions — see
// v3-preview.html. Each .material-item link already carries ?id=&title=&type=&week= in its
// href (set directly in the HTML), so no click-interception JS is needed here anymore.

// ---------- Bookmarks ----------
const BOOKMARK_KEY='learngold_bookmarks_v3';
function getBookmarks(){ try{ return JSON.parse(localStorage.getItem(BOOKMARK_KEY))||[]; }catch(err){ return []; } }
function saveBookmarks(list){ try{ localStorage.setItem(BOOKMARK_KEY, JSON.stringify(list)); }catch(err){} }
function topicLabel(id){
  const row=document.getElementById(id);
  const label=row?.querySelector('.m-title') || row?.querySelector('.material-item');
  return label ? label.textContent.trim() : id;
}
function refreshBookmarkUI(){
  const marks=getBookmarks();
  document.querySelectorAll('.bm-btn').forEach(btn=>{
    const on=marks.includes(btn.dataset.bmId);
    btn.textContent = on ? '★' : '☆';
    btn.classList.toggle('active',on);
  });
  const countEl=document.getElementById('bmCount');
  if(countEl) countEl.textContent = marks.length ? `(${marks.length})` : '';
  const listEl=document.getElementById('bookmarksList');
  if(listEl){
    listEl.innerHTML = marks.length
      ? marks.map(id=>`<a href="#${id}" class="bm-entry" data-id="${id}">⭐ ${topicLabel(id)}</a>`).join('')
      : '<div class="bm-empty">尚未收藏任何項目 · No bookmarks yet</div>';
  }
}
document.querySelectorAll('.bm-btn').forEach(btn=>{
  btn.addEventListener('click',(e)=>{
    e.preventDefault();
    e.stopPropagation();
    const id=btn.dataset.bmId;
    let marks=getBookmarks();
    marks = marks.includes(id) ? marks.filter(m=>m!==id) : [...marks, id];
    saveBookmarks(marks);
    refreshBookmarkUI();
  });
});
const bookmarksBtn=document.getElementById('bookmarksBtn');
const bookmarksPanel=document.getElementById('bookmarksPanel');
bookmarksBtn?.addEventListener('click',(e)=>{
  e.stopPropagation();
  bookmarksPanel?.classList.toggle('open');
});
bookmarksPanel?.addEventListener('click',(e)=>{
  const entry=e.target.closest('.bm-entry');
  if(!entry)return;
  e.preventDefault();
  const target=document.getElementById(entry.dataset.id);
  if(target){
    target.classList.remove('collapsed');
    target.closest('.week-block')?.classList.remove('collapsed');
    target.scrollIntoView({behavior:'smooth',block:'center'});
  }
  bookmarksPanel.classList.remove('open');
});
document.addEventListener('click',(e)=>{
  if(bookmarksPanel && bookmarksPanel.classList.contains('open') && !bookmarksPanel.contains(e.target) && e.target!==bookmarksBtn){
    bookmarksPanel.classList.remove('open');
  }
});
refreshBookmarkUI();

// ---------- Course-wide progress readout driven by Mark as Complete state ----------
// This also drives the TOC sidebar's own "X% · Y of N" readout (#tocPct/#tocLabel/#tocBar).
// That readout used to be driven by scroll position ("topics viewed" as you scrolled past
// them) — removed per explicit request (全部改成靜態，不要跟著動了): it's now based purely on
// Mark as Complete state, same as the rest of the page, so it only changes when you actually
// click something — never from scrolling.
function updateCourseProgress(){
  const items=document.querySelectorAll('.complete-btn');
  if(!items.length)return;
  const done=[...items].filter(b=>b.classList.contains('done')).length;
  const pct = items.length ? Math.round((done/items.length)*100) : 0;
  const pctEl=document.getElementById('coursePct');
  const labelEl=document.getElementById('courseCompleteLabel');
  if(pctEl) pctEl.textContent=pct+'%';
  if(labelEl) labelEl.textContent=`${done} of ${items.length} topics complete`;
  const tocPctEl=document.getElementById('tocPct');
  const tocLabelEl=document.getElementById('tocLabel');
  const tocBarEl=document.getElementById('tocBar');
  if(tocPctEl) tocPctEl.textContent=pct+'%';
  if(tocLabelEl) tocLabelEl.textContent=`${done} of ${items.length} topics complete`;
  if(tocBarEl) tocBarEl.style.width=pct+'%';
}

// ---------- Participant page: search + group filter ----------
const participantSearch=document.getElementById('participantSearch');
const groupFilter=document.getElementById('groupFilter');
function applyParticipantFilter(){
  const q=(participantSearch?.value||'').trim().toLowerCase();
  const g=groupFilter?.value||'';
  document.querySelectorAll('.participant-table tbody tr').forEach(row=>{
    const name=(row.dataset.name||'').toLowerCase();
    const group=row.dataset.group||'';
    row.hidden = !((!q||name.includes(q)) && (!g||group===g));
  });
}
participantSearch?.addEventListener('input',applyParticipantFilter);
groupFilter?.addEventListener('change',applyParticipantFilter);

// ---------- Calendar page: filters actually work now ----------
// Category checkboxes (Deadlines/Courses/School Events/Exams) + per-course checkboxes
// (Calculus III/Data Structures/Thermodynamics/Linear Algebra) both drive visibility of
// the matching .cal-chip (month grid) and .week-ahead-item (The Week Ahead panel) — a
// course chip only shows when BOTH its "Courses" category AND its own course box are checked.
const calFilterBoxes=[...document.querySelectorAll('[data-cal-filter]')];
const calCourseBoxes=[...document.querySelectorAll('[data-cal-course]')];
if(calFilterBoxes.length || calCourseBoxes.length){
  const COURSE_CLASSES=['calc','ds','thermo','linalg'];
  function applyCalendarFilter(){
    const catState={};
    calFilterBoxes.forEach(b=>{ catState[b.dataset.calFilter]=b.checked; });
    const courseState={};
    calCourseBoxes.forEach(b=>{ courseState[b.dataset.calCourse]=b.checked; });

    document.querySelectorAll('.cal-chip, .week-ahead-item').forEach(el=>{
      let visible = true;
      const courseClass = el.dataset.course || COURSE_CLASSES.find(c=>el.classList.contains(c));
      if(courseClass){
        visible = visible && (courseState[courseClass]!==false);
      }
      if(el.classList.contains('deadline')) visible = visible && (catState.deadline!==false);
      if(el.classList.contains('exam')) visible = visible && (catState.exam!==false);
      if(el.classList.contains('event')) visible = visible && (catState.event!==false);
      if(!el.classList.contains('deadline') && !el.classList.contains('exam') && !el.classList.contains('event') && COURSE_CLASSES.find(c=>el.classList.contains(c))){
        visible = visible && (catState.courses!==false);
      }
      el.style.display = visible ? '' : 'none';
    });
  }
  [...calFilterBoxes, ...calCourseBoxes].forEach(b=>b.addEventListener('change',applyCalendarFilter));
  applyCalendarFilter();
}

// ---------- Left-hand Table of Contents (Course page) ----------
// Static navigational list, by explicit request (算了收回、全部改成靜態、不要跟著動了、
// progress tracker 不要互相影響對方，各自滑就好): the sidebar and the material area each
// scroll completely independently now — no scrollspy, no auto-expand-on-scroll, no highlight
// that chases your scroll position, no pointer arrow. Clicking a week/topic still works (that's
// a direct user action, not "following"), and the sidebar's own overflow list (if it's ever
// tall enough to need one) scrolls on its own without touching or being touched by the material
// area's scroll position.
const tocTree=document.getElementById('tocTree');
if(tocTree){
  const tocWeeks=[...tocTree.querySelectorAll('.toc-week')];
  const tocSubs=[...tocTree.querySelectorAll('.toc-sub')];

  function setWeekOpen(weekEl,open){ weekEl.classList.toggle('collapsed',!open); }

  tocWeeks.forEach(weekEl=>{
    const head=weekEl.querySelector('.toc-week-head');
    head.addEventListener('click',()=>{
      const willOpen=weekEl.classList.contains('collapsed');
      setWeekOpen(weekEl,willOpen);
      const mainBlock=document.getElementById(weekEl.dataset.week);
      mainBlock?.classList.toggle('collapsed',!willOpen);
      if(willOpen){ mainBlock?.scrollIntoView({behavior:'smooth',block:'start'}); }
    });
  });

  tocSubs.forEach(sub=>{
    sub.addEventListener('click',(e)=>{
      e.preventDefault();
      const target=document.querySelector(sub.getAttribute('href'));
      if(!target)return;
      const weekEl=sub.closest('.toc-week');
      setWeekOpen(weekEl,true);
      document.getElementById(weekEl.dataset.week)?.classList.remove('collapsed');
      target.classList.remove('collapsed');
      target.scrollIntoView({behavior:'smooth',block:'center'});
    });
  });

  function setAll(open){
    tocWeeks.forEach(w=>setWeekOpen(w,open));
    document.querySelectorAll('.week-block').forEach(b=>b.classList.toggle('collapsed',!open));
    const btn=document.getElementById('collapseAllBtn');
    if(btn) btn.textContent = open ? 'Collapse all' : 'Expand all';
  }
  document.getElementById('tocExpandAll')?.addEventListener('click',(e)=>{e.preventDefault();setAll(true);});
  document.getElementById('tocCollapseAll')?.addEventListener('click',(e)=>{e.preventDefault();setAll(false);});

  document.getElementById('tocSearch')?.addEventListener('input',(e)=>{
    const q=e.target.value.trim().toLowerCase();
    tocWeeks.forEach(weekEl=>{
      const text=weekEl.textContent.toLowerCase();
      const match=!q||text.includes(q);
      weekEl.hidden=!match;
      if(q && match) setWeekOpen(weekEl,true);
    });
  });
}

updateCourseProgress();

// ============================================================
// Make every remaining button feel interactive (per explicit request: 我功能都要可以
// 互動喔，不要給我卡在那邊). None of this is a real backend — everything below is a
// clearly-labelled demo action (toast feedback, simulated download, or a real navigation
// to another page in the prototype) rather than a dead, unresponsive button.
// ============================================================

// ---------- Top-nav icon buttons (present on every page) ----------
document.querySelector('[title="Microsoft Teams"]')?.addEventListener('click',()=>window.open('https://teams.microsoft.com/','_blank'));
document.querySelector('[title="Outlook"]')?.addEventListener('click',()=>window.open('https://outlook.office.com/','_blank'));
document.querySelector('[title="my goldsmiths"]')?.addEventListener('click',()=>window.open('https://my.gold.ac.uk/','_blank'));
document.querySelector('[title="收藏夾 Favourites"]')?.addEventListener('click',(e)=>{
  const on=e.currentTarget.classList.toggle('active');
  showToast(on ? '★ 已加入收藏 Added to Favourites' : '☆ 已移除收藏 Removed from Favourites');
});
document.querySelector('[title="Notifications"]')?.addEventListener('click',()=>showToast('🔔 No new notifications'));
document.querySelector('[title="Messages"]')?.addEventListener('click',()=>showToast('💬 No new messages'));
document.querySelector('[title="my goldsmiths"]')?.addEventListener('click',()=>window.open('https://my.gold.ac.uk/','_blank'));
document.querySelector('[title="Outlook"]')?.addEventListener('click',()=>window.open('https://outlook.office.com/','_blank'));
document.querySelector('[title="Microsoft Teams"]')?.addEventListener('click',()=>window.open('https://teams.microsoft.com/','_blank'));


// ---------- Achievement / All-Courses header action buttons ----------
document.querySelectorAll('.achv-head .actions button').forEach(btn=>{
  const label=btn.textContent.trim();
  btn.addEventListener('click',()=>{
    if(label.includes('Export')) simulateDownload(btn,'Achievement_Report.pdf');
    else if(label.includes('Term Selector')) showToast('🗓 Term Selector (demo) — showing Term 2 · 2024–25');
    else if(label.includes('PDF')) simulateDownload(btn,'All_Courses_Summary.pdf');
    else if(label.includes('Month View')) showToast('🗓 Month View (demo)');
  });
});
document.querySelectorAll('.report-card .primary').forEach(btn=>{
  if(btn.textContent.includes('View Term Deadlines')) btn.addEventListener('click',()=>{ location.href='v3-calendar.html'; });
});
document.querySelectorAll('.quick-action-row').forEach(row=>{
  row.addEventListener('click',()=>{
    if(row.textContent.includes('Transcript')) simulateDownload(row,'Full_Transcript.pdf');
    else showToast('✉️ Email sent to your academic advisor (demo)');
  });
});
document.querySelectorAll('.pdf-btn').forEach(btn=>{
  btn.addEventListener('click',()=>simulateDownload(btn, btn.textContent.replace('⤓','').trim().replace(/\s+/g,'_')+'.pdf'));
});
document.querySelector('.archive-card.projected')?.addEventListener('click',()=>showToast('🔮 Projection based on your current trajectory (demo)'));

// ---------- Calendar page ----------
document.getElementById('addEventBtn')?.addEventListener('click',()=>showToast('+ Add Event (demo) — form not wired up in this prototype'));
document.querySelectorAll('.cal-nav-btn').forEach(btn=>{
  btn.addEventListener('click',()=>showToast('Demo prototype — only August 2026 is populated with data'));
});
document.querySelectorAll('.cal-main-head .view-btns button').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.cal-main-head .view-btns button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    showToast(btn.textContent.trim()+' view (demo) — Month view is the only one populated');
  });
});

// ---------- All Courses Area: Enroll / Audit buttons ----------
document.querySelectorAll('.enroll-primary').forEach(btn=>{
  btn.addEventListener('click',(e)=>{
    e.stopPropagation();
    const done=btn.textContent.includes('✓');
    btn.textContent = done ? 'Enroll' : '✓ Enrolled';
    showToast(done ? 'Enrolment cancelled (demo)' : '✓ Enrolled (demo)');
  });
});
document.querySelectorAll('.enroll-secondary').forEach(btn=>{
  btn.addEventListener('click',(e)=>{
    e.stopPropagation();
    const done=btn.textContent.includes('✓');
    btn.textContent = done ? 'Audit' : '✓ Auditing';
    showToast(done ? 'No longer auditing (demo)' : 'Now auditing this course (demo)');
  });
});

// ---------- Instructor page: Book Office Hours ----------
document.querySelectorAll('.instructor-card .primary').forEach(btn=>{
  btn.addEventListener('click',()=>showToast('📅 Office hours request sent to Dr Rafael Tahir (demo)'));
});

// ---------- Assignment page: Choose file / upload simulation ----------
document.querySelectorAll('.upload-area .primary').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const area=btn.closest('.upload-area');
    const p=area?.querySelector('p');
    if(p) p.textContent='✓ submission_draft.pdf selected';
    btn.textContent='Change file';
    showToast('File selected (demo) — this prototype does not upload anywhere');
  });
});
