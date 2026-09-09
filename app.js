document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. Live Countdown Timer
  // ==========================================
  const departureDate = new Date('2026-09-11T18:40:00+02:00').getTime();
  const countdownEl = document.getElementById('countdown-pill');

  function updateCountdown() {
    if (!countdownEl) return;
    const now = new Date().getTime();
    const diff = departureDate - now;

    if (diff <= 0) {
      countdownEl.innerText = '✈️ Поездка началась! Счастливого отдыха в Греции!';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    countdownEl.innerText = `⏳ До вылета: ${days}д ${hours}ч ${mins}мин`;
  }

  updateCountdown();
  setInterval(updateCountdown, 60000);

  // ==========================================
  // 2. Main 2-Area Segmented Navigation
  // ==========================================
  const segmentBtns = document.querySelectorAll('.segment-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  segmentBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;

      segmentBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetEl = document.getElementById(`tab-${targetTab}`);
      if (targetEl) {
        targetEl.classList.add('active');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Jump from Overview rows in Master Plan to Day-by-Day
  document.querySelectorAll('.overview-row').forEach(row => {
    row.addEventListener('click', (e) => {
      e.preventDefault();
      const targetDay = row.dataset.jumpDay;
      
      // Switch to Day-by-Day tab
      const daysTabBtn = document.querySelector('.segment-btn[data-tab="days"]');
      if (daysTabBtn) daysTabBtn.click();

      // Filter or scroll to that day
      setTimeout(() => {
        const dayChip = document.querySelector(`.day-filter-chip[data-day="${targetDay}"]`);
        if (dayChip) dayChip.click();
        const dayEl = document.getElementById(`day-${targetDay}`);
        if (dayEl) dayEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    });
  });

  // ==========================================
  // 3. Day Filter Chips in Day-by-Day Journey
  // ==========================================
  const dayChips = document.querySelectorAll('.day-filter-chip');
  const dayChapters = document.querySelectorAll('.day-chapter');

  dayChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const day = chip.dataset.day;

      dayChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      if (day === 'all') {
        dayChapters.forEach(ch => ch.style.display = 'block');
      } else {
        dayChapters.forEach(ch => {
          if (ch.id === `day-${day}`) {
            ch.style.display = 'block';
            ch.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            ch.style.display = 'none';
          }
        });
      }
    });
  });

  // ==========================================
  // 4. Central Audio Manager & Docked Player
  // ==========================================
  const audio = document.getElementById('global-audio');
  const catalog = window.AUDIO_CATALOG || [];

  // Docked player DOM elements
  const dockedTitle = document.getElementById('docked-title');
  const dockedSubtitle = document.getElementById('docked-subtitle');
  const dockedArtwork = document.querySelector('.docked-artwork');
  const dockedPlayBtn = document.getElementById('docked-play');
  const dockedPrevBtn = document.getElementById('docked-prev');
  const dockedNextBtn = document.getElementById('docked-next');
  const dockedProgress = document.getElementById('docked-progress');
  const dockedCurTime = document.getElementById('docked-cur-time');
  const dockedTotalTime = document.getElementById('docked-total-time');
  const dockedSpeedBtn = document.getElementById('docked-speed');

  let currentTrackId = null;
  let isPlaying = false;
  let playbackRate = 1.0;

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function getArtworkForDest(dest) {
    switch (dest) {
      case 'athens': return '🏛';
      case 'paros': return '⛵️';
      case 'naxos': return '☀️';
      case 'santorini': return '🌋';
      default: return '🇬🇷';
    }
  }

  function getTrackById(id) {
    return catalog.find(t => t.id === id);
  }

  function updateAllWidgetsUI() {
    document.querySelectorAll('.widget-play-btn').forEach(btn => {
      const trackId = btn.dataset.trackId;
      if (trackId === currentTrackId && isPlaying) {
        btn.innerText = '⏸';
        btn.classList.add('playing');
      } else {
        btn.innerText = '▶';
        btn.classList.remove('playing');
      }
    });

    if (dockedPlayBtn) {
      dockedPlayBtn.innerText = isPlaying ? '⏸' : '▶';
    }
  }

  function playTrack(trackId) {
    const track = getTrackById(trackId);
    if (!track) return;

    if (currentTrackId !== trackId) {
      currentTrackId = trackId;
      audio.src = track.file;
      audio.playbackRate = playbackRate;

      if (dockedTitle) dockedTitle.innerText = track.title;
      if (dockedSubtitle) dockedSubtitle.innerText = track.subtitle;
      if (dockedArtwork) dockedArtwork.innerText = getArtworkForDest(track.dest);

      try {
        localStorage.setItem('greece_active_track_id', trackId);
      } catch(e) {}
    }

    isPlaying = true;
    audio.play().catch(e => console.log('Audio playback initiated:', e));
    updateAllWidgetsUI();
  }

  function pauseAudio() {
    isPlaying = false;
    audio.pause();
    updateAllWidgetsUI();
  }

  function toggleTrack(trackId) {
    if (currentTrackId === trackId && isPlaying) {
      pauseAudio();
    } else {
      playTrack(trackId);
    }
  }

  // Click on any embedded audio widget button
  document.querySelectorAll('.widget-play-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const trackId = btn.dataset.trackId;
      toggleTrack(trackId);
    });
  });

  // Docked Play Button
  if (dockedPlayBtn) {
    dockedPlayBtn.addEventListener('click', () => {
      if (isPlaying) {
        pauseAudio();
      } else {
        if (!currentTrackId && catalog.length > 0) {
          playTrack(catalog[0].id);
        } else if (currentTrackId) {
          playTrack(currentTrackId);
        }
      }
    });
  }

  // Next / Prev track
  function advanceTrack(offset) {
    if (!catalog.length) return;
    let idx = catalog.findIndex(t => t.id === currentTrackId);
    if (idx === -1) idx = 0;
    let nextIdx = (idx + offset + catalog.length) % catalog.length;
    playTrack(catalog[nextIdx].id);
  }

  if (dockedPrevBtn) dockedPrevBtn.addEventListener('click', () => advanceTrack(-1));
  if (dockedNextBtn) dockedNextBtn.addEventListener('click', () => advanceTrack(1));

  // Audio Time Update
  audio.addEventListener('timeupdate', () => {
    if (!isNaN(audio.duration) && audio.duration > 0) {
      const pct = (audio.currentTime / audio.duration) * 100;
      if (dockedProgress) dockedProgress.value = pct;
      if (dockedCurTime) dockedCurTime.innerText = formatTime(audio.currentTime);
      if (dockedTotalTime) dockedTotalTime.innerText = formatTime(audio.duration);

      // Also update widget slider for the currently active track
      const activeWidgetSlider = document.querySelector(`.widget-slider[data-track-id="${currentTrackId}"]`);
      if (activeWidgetSlider) activeWidgetSlider.value = pct;

      const activeWidgetTime = document.querySelector(`.widget-time[data-track-id="${currentTrackId}"]`);
      if (activeWidgetTime) activeWidgetTime.innerText = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    }
  });

  audio.addEventListener('loadedmetadata', () => {
    if (dockedTotalTime && !isNaN(audio.duration)) {
      dockedTotalTime.innerText = formatTime(audio.duration);
    }
    const activeWidgetTime = document.querySelector(`.widget-time[data-track-id="${currentTrackId}"]`);
    if (activeWidgetTime && !isNaN(audio.duration)) {
      activeWidgetTime.innerText = `0:00 / ${formatTime(audio.duration)}`;
    }
  });

  audio.addEventListener('ended', () => {
    advanceTrack(1);
  });

  // Docked Progress Scrub
  if (dockedProgress) {
    dockedProgress.addEventListener('input', () => {
      if (!isNaN(audio.duration)) {
        audio.currentTime = (dockedProgress.value / 100) * audio.duration;
      }
    });
  }

  // Speed Toggle Button
  const speeds = [1.0, 1.25, 1.5];
  if (dockedSpeedBtn) {
    dockedSpeedBtn.addEventListener('click', () => {
      let curIdx = speeds.indexOf(playbackRate);
      let nextIdx = (curIdx + 1) % speeds.length;
      playbackRate = speeds[nextIdx];
      audio.playbackRate = playbackRate;
      dockedSpeedBtn.innerText = `${playbackRate}x`;
    });
  }

  // Keyboard Shortcuts (Space to play/pause, left/right arrows to seek)
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (isPlaying) pauseAudio();
      else if (currentTrackId) playTrack(currentTrackId);
      else if (catalog.length > 0) playTrack(catalog[0].id);
    } else if (e.code === 'ArrowLeft') {
      audio.currentTime = Math.max(0, audio.currentTime - 10);
    } else if (e.code === 'ArrowRight') {
      audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
    }
  });

  // Initialize initial track state from storage or default
  try {
    const saved = localStorage.getItem('greece_active_track_id');
    const initialTrack = catalog.find(t => t.id === saved) || catalog[0];
    if (initialTrack) {
      currentTrackId = initialTrack.id;
      audio.src = initialTrack.file;
      if (dockedTitle) dockedTitle.innerText = initialTrack.title;
      if (dockedSubtitle) dockedSubtitle.innerText = initialTrack.subtitle;
      if (dockedArtwork) dockedArtwork.innerText = getArtworkForDest(initialTrack.dest);
    }
  } catch(e) {}

  // ==========================================
  // 5. Historical Deep-Dive Modal Controller
  // ==========================================
  const modalOverlay = document.getElementById('history-modal');
  const modalBadges = document.getElementById('modal-badges');
  const modalTitle = document.getElementById('modal-title');
  const modalSubtitle = document.getElementById('modal-subtitle');
  const modalBody = document.getElementById('modal-body');
  const modalFooterRef = document.getElementById('modal-footer-ref');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  function openHistoryModal(guideKey) {
    if (!window.HISTORICAL_GUIDES || !window.HISTORICAL_GUIDES[guideKey]) {
      console.warn('Historical guide not found for key:', guideKey);
      return;
    }
    const guide = window.HISTORICAL_GUIDES[guideKey];

    if (modalBadges) {
      modalBadges.innerHTML = `
        <span class="history-badge">${guide.badge || '🏛 История'}</span>
        <span class="history-time-badge">📖 ${guide.readingTime || '2-3 мин'}</span>
      `;
    }

    if (modalTitle) modalTitle.innerText = guide.title;
    if (modalSubtitle) modalSubtitle.innerText = guide.subtitle || '';

    // Build multi-paragraph sections
    let html = '';
    guide.sections.forEach(sec => {
      html += `
        <div class="history-section">
          <h4>${sec.heading}</h4>
          ${sec.content}
        </div>
      `;
    });

    // Fun facts callout
    if (guide.funFacts && guide.funFacts.length > 0) {
      html += `
        <div class="history-facts-box">
          <h5>💡 Любопытные факты & Исторические детали</h5>
          <ul>
            ${guide.funFacts.map(fact => `<li>${fact}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    if (modalBody) {
      modalBody.innerHTML = html;
      modalBody.scrollTop = 0;
    }

    // Cross-reference audio track in footer
    if (modalFooterRef) {
      if (guide.linkedTracks && guide.linkedTracks.length > 0) {
        const trackId = guide.linkedTracks[0];
        const trackMeta = (window.AUDIO_CATALOG || []).find(t => t.id === trackId);
        const trackTitle = trackMeta ? trackMeta.title : 'Аудиогид Gemini Aoede';
        modalFooterRef.innerHTML = `
          <div class="history-audio-ref">
            <span>🎙 Связанный аудиогид:</span>
            <strong>${trackTitle}</strong>
          </div>
          <button class="history-play-track-btn" data-track-id="${trackId}">
            ▶ Слушать трек
          </button>
        `;

        const playBtn = modalFooterRef.querySelector('.history-play-track-btn');
        if (playBtn) {
          playBtn.addEventListener('click', () => {
            playTrack(trackId);
            closeHistoryModal();
          });
        }
      } else {
        modalFooterRef.innerHTML = `
          <span class="history-audio-ref">✨ Приятного погружения в историю Эллады!</span>
          <button class="history-play-track-btn" id="modal-close-footer-btn">Закрыть</button>
        `;
        const closeFooterBtn = document.getElementById('modal-close-footer-btn');
        if (closeFooterBtn) closeFooterBtn.addEventListener('click', closeHistoryModal);
      }
    }

    if (modalOverlay) {
      modalOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeHistoryModal() {
    if (modalOverlay) modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Bind all read buttons
  document.querySelectorAll('.history-read-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const guideKey = btn.dataset.guideKey;
      openHistoryModal(guideKey);
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeHistoryModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeHistoryModal();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('open')) {
      closeHistoryModal();
    }
  });
});
