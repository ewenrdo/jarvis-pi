import React, { useEffect, useState } from 'react';
import { rrulestr } from 'rrule';
import PdaCard from '../PdaCard/PdaCard';
import OfflinePlaceholder from '../OfflinePlaceholder/OfflinePlaceholder';

const ICAL_SOURCES = [
  {
    name: 'Just do it (Principal Proton)',
    url: import.meta.env.VITE_PROTON_ICAL_URL,
    color: '#58a6ff',
    shouldSync: true,
    ignoreRecurringWithoutWO: true
  },
  {
    name: 'L3 MI (Université Paris Cité)',
    url: import.meta.env.VITE_L3MI_ICAL_URL,
    color: '#ff7b72',
    shouldSync: true,
    ignoreRecurringWithoutWO: false
  },
  {
    name: 'Anglais L3A (S1)',
    url: import.meta.env.VITE_ANGLAIS_L3A_ICAL_URL,
    color: '#bc8cff',
    shouldSync: true,
    ignoreRecurringWithoutWO: false
  }
];

function parseICSLight(icsText, targetStart, targetEnd, targetStr, source) {
  const matchedEvents = [];
  const rawBlocks = icsText.split('BEGIN:VEVENT');
  const cancelledOccurrences = new Set();

  for (let i = 1; i < rawBlocks.length; i++) {
    const block = rawBlocks[i].split('END:VEVENT')[0];

    if (block.includes('STATUS:CANCELLED')) {
      const uidMatch = block.match(/UID:(.*)/);
      const recurrenceIdMatch = block.match(/RECURRENCE-ID(;[^:]+)?:([\wT]+)/);

      if (uidMatch && recurrenceIdMatch) {
        const uid = uidMatch[1].trim();
        const recurrenceDateStr = recurrenceIdMatch[2].trim().substring(0, 8);
        cancelledOccurrences.add(`${uid}_${recurrenceDateStr}`);
      }
    }
  }

  for (let i = 1; i < rawBlocks.length; i++) {
    const block = rawBlocks[i].split('END:VEVENT')[0];

    if (block.includes('STATUS:CANCELLED')) continue;

    const uidMatch = block.match(/UID:(.*)/);
    const uid = uidMatch ? uidMatch[1].trim() : null;

    const dtstartMatch = block.match(/DTSTART(;[^:]+)?:([\wT]+)/);
    if (!dtstartMatch) continue;

    const dtstartParams = dtstartMatch[1] || '';
    const dtstartVal = dtstartMatch[2].trim();
    const isAllDay = dtstartParams.includes('VALUE=DATE') || dtstartVal.length === 8;

    const summaryMatch = block.match(/SUMMARY:(.*)/);
    const summary = summaryMatch ? summaryMatch[1].trim() : 'Sans titre';

    const locationMatch = block.match(/LOCATION:(.*)/);
    const location = locationMatch ? locationMatch[1].trim() : '';

    const rruleMatch = block.match(/RRULE:(.*)/);
    const rruleStr = rruleMatch ? rruleMatch[1].trim() : null;

    const exdateMatches = [...block.matchAll(/EXDATE(;[^:]+)?:([\wT]+)/g)];
    const exdates = exdateMatches.map((match) => match[2].trim().substring(0, 8));

    if (exdates.includes(targetStr)) continue;

    let startDate = null;
    if (isAllDay) {
      const year = dtstartVal.substring(0, 4);
      const month = dtstartVal.substring(4, 6);
      const day = dtstartVal.substring(6, 8);
      startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0);
    } else {
      const year = dtstartVal.substring(0, 4);
      const month = dtstartVal.substring(4, 6);
      const day = dtstartVal.substring(6, 8);
      const hour = dtstartVal.substring(9, 11) || '00';
      const minute = dtstartVal.substring(11, 13) || '00';
      const second = dtstartVal.substring(13, 15) || '00';

      if (dtstartVal.endsWith('Z')) {
        startDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second)));
      } else {
        startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
      }
    }

    if (Number.isNaN(startDate.getTime())) continue;

    if (rruleStr) {
      if (source.ignoreRecurringWithoutWO && !summary.includes('WO ')) {
        continue;
      }

      const hasLimit = rruleStr.includes('UNTIL=') || rruleStr.includes('COUNT=');
      const startYear = startDate.getFullYear();
      const currentYear = targetStart.getFullYear();

      if (!hasLimit && (rruleStr.includes('FREQ=DAILY') || rruleStr.includes('FREQ=WEEKLY'))) {
        if (startYear < currentYear) continue;
      }

      try {
        if (startDate <= targetEnd) {
          const rule = rrulestr(rruleStr, { dtstart: startDate });
          const occurrences = rule.between(targetStart, targetEnd, true);

          occurrences.forEach((occDate) => {
            const occYear = occDate.getFullYear();
            const occMonth = String(occDate.getMonth() + 1).padStart(2, '0');
            const occDay = String(occDate.getDate()).padStart(2, '0');
            const occDateStr = `${occYear}${occMonth}${occDay}`;

            if (uid && cancelledOccurrences.has(`${uid}_${occDateStr}`)) {
              return;
            }

            matchedEvents.push({
              start: occDate,
              summary,
              location,
              isAllDay,
              color: source.color,
              sourceName: source.name
            });
          });
        }
      } catch {
        // Règle mal formée
      }
    } else if (dtstartVal.startsWith(targetStr)) {
      matchedEvents.push({
        start: startDate,
        summary,
        location,
        isAllDay,
        color: source.color,
        sourceName: source.name
      });
    }
  }

  return matchedEvents;
}

export default function AgendaWidget({
  focused,
  isOnline,
  isAgendaLocked,
  isTodayAgenda,
  formattedAgendaDateLabel,
  agendaDate,
  agendaContainerRef
}) {
  const [events, setEvents] = useState([]);
  const [isAgendaLoading, setIsAgendaLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;

    const loadAllCalendars = async () => {
      if (!isOnline) {
        if (isSubscribed) {
          setIsAgendaLoading(false);
          setEvents([]);
        }
        return;
      }

      if (isSubscribed) {
        setIsAgendaLoading(true);
      }

      const targetStart = new Date(agendaDate.getFullYear(), agendaDate.getMonth(), agendaDate.getDate(), 0, 0, 0);
      const targetEnd = new Date(agendaDate.getFullYear(), agendaDate.getMonth(), agendaDate.getDate(), 23, 59, 59);
      const year = agendaDate.getFullYear();
      const month = String(agendaDate.getMonth() + 1).padStart(2, '0');
      const day = String(agendaDate.getDate()).padStart(2, '0');
      const targetStr = `${year}${month}${day}`;

      let combinedEvents = [];
      const activeSources = ICAL_SOURCES.filter((source) => source.shouldSync && source.url);

      for (const source of activeSources) {
        if (!isSubscribed) break;
        try {
          const response = await fetch(source.url);
          if (!response.ok) continue;

          const rawText = await response.text();
          const sourceEvents = parseICSLight(rawText, targetStart, targetEnd, targetStr, source);
          combinedEvents = combinedEvents.concat(sourceEvents);
        } catch {
          // Ignore les échecs individuels de source pour ne pas bloquer les autres agendas
        }
      }

      if (isSubscribed) {
        combinedEvents.sort((left, right) => left.start - right.start);
        setEvents(combinedEvents);
        setIsAgendaLoading(false);
      }
    };

    loadAllCalendars();

    return () => {
      isSubscribed = false;
    };
  }, [agendaDate, isOnline]);

  return (
    <PdaCard
      focused={focused}
      locked={isAgendaLocked}
      title={isTodayAgenda ? 'Agenda du jour' : `Agenda (${formattedAgendaDateLabel})`}
      icon="📅"
      bodyStyle={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 50px)' }}
    >
      <div
        className="agenda-scroll-area"
        ref={agendaContainerRef}
        style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}
      >
        {!isOnline ? (
          <OfflinePlaceholder label="Agenda indisponible (hors ligne)" />
        ) : isAgendaLoading ? (
          <div className="agenda-loading">Chargement des agendas...</div>
        ) : events.length === 0 ? (
          <div className="agenda-empty">Aucun événement prévu ce jour.</div>
        ) : (
          <div className="agenda-feed">
            {events.map((event, index) => (
              <div key={index} className="agenda-item" style={{ borderLeftColor: event.color }}>
                <span className="time-tag" style={{ color: event.color }}>
                  {event.isAllDay ? 'Journée' : event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="details">
                  <div className="title">{event.summary}</div>
                  <div className="sub">
                    {event.location && `📍 ${event.location}`}
                    {event.location && event.sourceName && ' | '}
                    {event.sourceName && `👤 ${event.sourceName}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="agenda-note"
        style={{
          fontSize: '0.7rem',
          color: '#8b949e',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '6px',
          marginTop: '6px',
          textAlign: 'center',
          flexShrink: 0
        }}
      >
        {isAgendaLocked ? '⬅️ ➡️ Changer de jour | [OK] Quitter' : '💡 [OK] Verrouiller pour changer de date'}
      </div>
    </PdaCard>
  );
}