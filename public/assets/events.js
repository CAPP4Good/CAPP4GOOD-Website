/* Shared rendering for the events calendar.
   Used by the home page (the next few events) and /events/ (the full list).
   Both pages call CAPPEvents.render() with the paths that suit their depth. */
(function (global) {
  'use strict';

  var DEFAULT_SOURCE = 'assets/events.json';
  var DEFAULT_IMAGE = 'images/CAPP4Good_wide.png';
  // Times in events.json are campus-local. Naming the zone explicitly keeps a
  // calendar entry correct even when it is added from another timezone.
  var TIMEZONE = 'America/Chicago';
  var DEFAULT_DURATION_MIN = 60;

  // "YYYY-MM-DD" is parsed as UTC midnight by new Date(), which renders as the
  // previous day in any timezone behind UTC. Build the date in local time instead
  // so the calendar date shows exactly as written in events.json.
  // Returns null for a blank or invalid date; those events render as "Date TBD".
  function parseLocalDate(value) {
    const [y, m, d] = String(value || '').split('-').map(Number);
    if (!y || !m || !d) return null;
    const parsed = new Date(y, m - 1, d);
    // Reject dates that rolled over (e.g. "2026-02-30") instead of showing the wrong day.
    const exact = parsed.getFullYear() === y
      && parsed.getMonth() === m - 1
      && parsed.getDate() === d;
    return exact ? parsed : null;
  }

  function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  // Undated ("Date TBD") events sort to the end, after everything scheduled.
  function byDate(a, b) {
    if (!a._date || !b._date) return (a._date ? 0 : 1) - (b._date ? 0 : 1);
    return a._date - b._date;
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ---- "Add to your calendar" -------------------------------------------
     Builds a Google Calendar template URL and an .ics file for one event.
     An event with no date cannot be scheduled, so it gets no button.        */

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function ymd(date) {
    return String(date.getFullYear()) + pad(date.getMonth() + 1) + pad(date.getDate());
  }

  // "12:30" -> minutes since midnight, or null if absent/malformed.
  function parseTime(value) {
    const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || '').trim());
    if (!match) return null;
    const h = Number(match[1]);
    const m = Number(match[2]);
    if (h > 23 || m > 59) return null;
    return h * 60 + m;
  }

  function hhmmss(minutes) {
    const wrapped = ((minutes % 1440) + 1440) % 1440;
    return pad(Math.floor(wrapped / 60)) + pad(wrapped % 60) + '00';
  }

  // Renders minutes-since-midnight on the event's own day, so the label follows
  // the reader's locale the same way the date does (1:30 PM in the US, 13:30 elsewhere).
  function formatTime(date, minutes) {
    const at = new Date(date.getFullYear(), date.getMonth(), date.getDate(),
      Math.floor(minutes / 60), minutes % 60);
    return at.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  // "12:30 PM - 1:30 PM", or just the start when no end time is recorded.
  function timeLabel(event) {
    if (!event._date) return '';
    const start = parseTime(event.startTime);
    if (start === null) return '';
    const end = parseTime(event.endTime);
    const startStr = formatTime(event._date, start);
    if (end === null || end <= start) return startStr;
    return startStr + ' - ' + formatTime(event._date, end);
  }

  // Returns the start/end stamps for one event, all-day or timed.
  function calendarSpan(event) {
    if (!event._date) return null;
    const start = parseTime(event.startTime);
    if (start === null) {
      // All-day. DTEND is exclusive, so it points at the following day.
      const next = new Date(event._date.getFullYear(), event._date.getMonth(), event._date.getDate() + 1);
      return { allDay: true, start: ymd(event._date), end: ymd(next) };
    }
    let end = parseTime(event.endTime);
    if (end === null || end <= start) end = start + DEFAULT_DURATION_MIN;
    const endDay = new Date(event._date.getFullYear(), event._date.getMonth(), event._date.getDate() + Math.floor(end / 1440));
    return {
      allDay: false,
      start: ymd(event._date) + 'T' + hhmmss(start),
      end: ymd(endDay) + 'T' + hhmmss(end),
    };
  }

  function googleUrl(event, span) {
    const params = [
      'action=TEMPLATE',
      'text=' + encodeURIComponent(event.title || 'CAPP 4 Good event'),
      'dates=' + span.start + '/' + span.end,
      'details=' + encodeURIComponent(event.description || ''),
    ];
    // ctz tells Google the times are campus-local; it is meaningless for all-day.
    if (!span.allDay) params.push('ctz=' + encodeURIComponent(TIMEZONE));
    return 'https://calendar.google.com/calendar/render?' + params.join('&');
  }

  function icsEscape(value) {
    return String(value == null ? '' : value)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  // RFC 5545 caps a content line at 75 octets; fold well short of that so
  // multi-byte characters in a description cannot push a line over.
  function foldLine(line) {
    if (line.length <= 70) return line;
    const parts = [line.slice(0, 70)];
    let rest = line.slice(70);
    while (rest.length > 69) {
      parts.push(' ' + rest.slice(0, 69));
      rest = rest.slice(69);
    }
    if (rest) parts.push(' ' + rest);
    return parts.join('\r\n');
  }

  function slug(value) {
    return String(value || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'event';
  }

  function buildIcs(event, span) {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const dt = span.allDay
      ? ['DTSTART;VALUE=DATE:' + span.start, 'DTEND;VALUE=DATE:' + span.end]
      : ['DTSTART;TZID=' + TIMEZONE + ':' + span.start, 'DTEND;TZID=' + TIMEZONE + ':' + span.end];
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CAPP 4 Good//Events//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + span.start + '-' + slug(event.title) + '@capp4good',
      'DTSTAMP:' + stamp,
    ].concat(dt, [
      'SUMMARY:' + icsEscape(event.title),
      'DESCRIPTION:' + icsEscape(event.description),
      'END:VEVENT',
      'END:VCALENDAR',
    ]);
    return lines.map(foldLine).join('\r\n') + '\r\n';
  }

  function icsHref(text) {
    // A blob URL is used rather than a data: URI because Safari has historically
    // refused to honour the download attribute on data: URIs.
    if (global.URL && global.URL.createObjectURL && global.Blob) {
      return global.URL.createObjectURL(new global.Blob([text], { type: 'text/calendar;charset=utf-8' }));
    }
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(text);
  }

  function calendarHtml(event) {
    const span = calendarSpan(event);
    if (!span) return '';   // no date yet, nothing to add
    return `<details class="event-calendar">
      <summary>Add to calendar</summary>
      <div class="event-calendar-menu">
        <a href="${esc(googleUrl(event, span))}" target="_blank" rel="noopener">Google Calendar</a>
        <a href="${esc(icsHref(buildIcs(event, span)))}" download="${esc(slug(event.title))}.ics">Apple, Outlook (.ics)</a>
      </div>
    </details>`;
  }

  function cardHtml(event, assetBase) {
    const dateStr = event._date
      ? event._date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Date TBD';
    // Image paths in events.json are relative to the site root, so a page in a
    // subdirectory passes assetBase ('../') to reach them.
    const image = assetBase + (event.image || DEFAULT_IMAGE);
    const timeStr = timeLabel(event);
    const linkHtml = event.link
      ? `<div class="event-link"><a class="ba b--moon-gray bg-light-gray br2 color-inherit dib f7 hover-bg-moon-gray link ph3 pv2" href="${esc(event.link)}" target="_blank" rel="noopener">RSVP</a></div>`
      : '';
    // One row at the foot of the card: RSVP on the left, calendar on the right.
    const actions = [linkHtml, calendarHtml(event)].filter(Boolean).join('\n        ');
    const actionsHtml = actions ? `<div class="event-actions">\n        ${actions}\n      </div>` : '';
    return `<div class="event-card">
      <div class="event-image"><img src="${esc(image)}" alt="${esc(event.title)}"></div>
      <div class="event-date">${esc(dateStr)}${timeStr ? `<span class="event-time">${esc(timeStr)}</span>` : ''}</div>
      <div class="event-title">${esc(event.title)}</div>
      <div class="event-desc">${esc(event.description)}</div>
      ${actionsHtml}
    </div>`;
  }

  // The home page wraps the list in a horizontal slider with arrows; the events
  // page does not, so this is a no-op there.
  function wireSlider(grid) {
    const shell = grid.closest('.events-shell');
    if (!shell) return;
    grid.scrollLeft = 0;
    const prev = shell.querySelector('.event-nav.prev');
    const next = shell.querySelector('.event-nav.next');
    const step = () => grid.clientWidth * 0.75;
    if (prev) prev.onclick = () => grid.scrollBy({ left: -step(), behavior: 'smooth' });
    if (next) next.onclick = () => grid.scrollBy({ left: step(), behavior: 'smooth' });
  }

  /* Options:
       target       CSS selector for the container (default '#events-grid')
       source       URL of events.json, relative to the calling page
       assetBase    prefix that turns a root-relative image path into one this page can use
       upcomingOnly drop events whose date has already passed
       limit        show at most this many, after filtering and sorting
       emptyMessage shown when nothing matches                                  */
  function render(options) {
    const opts = options || {};
    const grid = document.querySelector(opts.target || '#events-grid');
    if (!grid) return;
    const source = opts.source || DEFAULT_SOURCE;
    const assetBase = opts.assetBase || '';

    fetch(source)
      .then((response) => {
        if (!response.ok) throw new Error(response.status + ' ' + response.statusText);
        return response.json();
      })
      .then((events) => {
        let list = events.map((e) => ({ ...e, _date: parseLocalDate(e.date) }));
        if (opts.upcomingOnly) {
          const today = startOfToday();
          // An event stays "upcoming" for the whole of its own day. Undated events
          // have not happened yet either, so they stay in the list.
          list = list.filter((e) => !e._date || e._date >= today);
        }
        list.sort(byDate);
        if (opts.limit) list = list.slice(0, opts.limit);

        if (!list.length) {
          grid.innerHTML = `<div class="muted">${esc(opts.emptyMessage || 'No events available.')}</div>`;
          return;
        }
        grid.innerHTML = list.map((e) => cardHtml(e, assetBase)).join('');
        wireSlider(grid);
      })
      .catch((error) => {
        // Logged so the next failure names itself instead of only showing the notice.
        console.error('Could not load events from ' + source + ':', error);
        grid.innerHTML = '<div class="muted">Unable to load events right now.</div>';
      });
  }

  global.CAPPEvents = { render: render, parseLocalDate: parseLocalDate };
})(window);
