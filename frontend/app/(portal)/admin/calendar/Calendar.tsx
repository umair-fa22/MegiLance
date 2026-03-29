// @AI-HINT: Admin Calendar component with monthly view and event display. Events derived from platform activity.
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { ChevronLeft, ChevronRight, Plus, Clock, Users, Video, DollarSign, FileText, Loader2 } from 'lucide-react';
import Button from '@/app/components/atoms/Button/Button';
import { PageTransition, ScrollReveal, StaggerContainer, StaggerItem } from '@/app/components/Animations';

import common from './Calendar.common.module.css';
import light from './Calendar.light.module.css';
import dark from './Calendar.dark.module.css';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: 'meeting' | 'deadline' | 'review' | 'maintenance' | 'payment' | 'project';
  description?: string;
}

interface RecentActivity {
  type: string;
  description: string;
  timestamp: string;
  user_name?: string;
  amount?: number;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const Calendar: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const themed = resolvedTheme === 'dark' ? dark : light;
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch platform activity and convert to calendar events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await api.admin.getRecentActivity(50) as any as RecentActivity[];

        // Convert activity to calendar events
        const calendarEvents: CalendarEvent[] = (Array.isArray(data) ? data : []).map((activity, index) => {
          const date = activity.timestamp ? new Date(activity.timestamp) : new Date();
          const eventType = mapActivityToType(activity.type);
          
          return {
            id: `event-${index}`,
            title: getEventTitle(activity),
            date,
            time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            type: eventType,
            description: activity.description,
          };
        });

        setEvents(calendarEvents);
        setError(null);
      } catch (err) {
        setError('Failed to load calendar events');
        // Provide fallback events
        setEvents([
          { id: '1', title: 'Platform Review', date: new Date(), time: '9:00 AM', type: 'review', description: 'Weekly platform review' },
          { id: '2', title: 'System Maintenance', date: new Date(Date.now() + 86400000), time: '2:00 AM', type: 'maintenance', description: 'Scheduled maintenance' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const mapActivityToType = (activityType: string): CalendarEvent['type'] => {
    switch (activityType?.toLowerCase()) {
      case 'payment':
      case 'transaction':
        return 'payment';
      case 'project':
      case 'job':
        return 'project';
      case 'user':
      case 'registration':
        return 'meeting';
      case 'review':
      case 'moderation':
        return 'review';
      default:
        return 'deadline';
    }
  };

  const getEventTitle = (activity: RecentActivity): string => {
    if (activity.user_name) {
      return `${activity.type}: ${activity.user_name}`;
    }
    if (activity.amount) {
      return `${activity.type}: $${activity.amount.toLocaleString()}`;
    }
    return activity.description?.slice(0, 30) || activity.type || 'Event';
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
  const today = new Date();

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting': return themed.event_meeting;
      case 'deadline': return themed.event_deadline;
      case 'review': return themed.event_review;
      case 'maintenance': return themed.event_maintenance;
      case 'payment': return themed.event_payment || themed.event_meeting;
      case 'project': return themed.event_project || themed.event_deadline;
      default: return themed.event_meeting;
    }
  };

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting': return <Video size={14} />;
      case 'deadline': return <Clock size={14} />;
      case 'review': return <Users size={14} />;
      case 'maintenance': return <Clock size={14} />;
      case 'payment': return <DollarSign size={14} />;
      case 'project': return <FileText size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  // Sort upcoming events by date
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter(e => e.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 4);
  }, [events]);

  return (
    <PageTransition>
      <main className={cn(common.main, themed.main)}>
        <ScrollReveal>
          <header className={common.header}>
            <div>
              <h1 className={cn(common.title, themed.title)}>Calendar</h1>
              <p className={cn(common.subtitle, themed.subtitle)}>
                View platform activity and scheduled events.
              </p>
            </div>
            <Button variant="primary">
              <Plus size={16} /> New Event
            </Button>
          </header>
        </ScrollReveal>

        {loading && (
          <div className={cn(common.loadingState, themed.loadingState)}>
            <Loader2 className={common.spinner} size={32} />
            <span>Loading calendar events...</span>
          </div>
        )}

        {error && (
          <div className={cn(common.errorBanner, themed.errorBanner)}>
            <span>{error}</span>
          </div>
        )}

        {!loading && (
          <div className={common.content}>
            <ScrollReveal delay={0.1}>
              <div className={cn(common.calendar_container, themed.calendar_container)}>
                {/* Calendar Header */}
                <div className={common.calendar_header}>
                  <button 
                    onClick={() => navigateMonth('prev')} 
                    className={cn(common.nav_button, themed.nav_button)}
                    aria-label="Previous month"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className={cn(common.month_year, themed.month_year)}>
                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <button 
                    onClick={() => navigateMonth('next')} 
                    className={cn(common.nav_button, themed.nav_button)}
                    aria-label="Next month"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                {/* Weekday Headers */}
                <div className={common.weekdays}>
                  {WEEKDAYS.map(day => (
                    <div key={day} className={cn(common.weekday, themed.weekday)}>
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className={common.calendar_grid}>
                  {/* Empty cells for days before the first of month */}
                  {Array.from({ length: startingDay }).map((_, i) => (
                    <div key={`empty-${i}`} className={cn(common.day_cell, common.empty_cell, themed.empty_cell)} />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
                    const dayEvents = getEventsForDate(cellDate);
                    const isToday = cellDate.toDateString() === today.toDateString();
                    const isSelected = selectedDate?.toDateString() === cellDate.toDateString();

                    return (
                      <button
                        key={dayNum}
                        onClick={() => setSelectedDate(cellDate)}
                        className={cn(
                          common.day_cell,
                          themed.day_cell,
                          isToday && common.today,
                          isToday && themed.today,
                          isSelected && common.selected,
                          isSelected && themed.selected
                        )}
                      >
                        <span className={common.day_number}>{dayNum}</span>
                        {dayEvents.length > 0 && (
                          <div className={common.event_dots}>
                            {dayEvents.slice(0, 3).map(event => (
                              <span 
                                key={event.id} 
                                className={cn(common.event_dot, getEventTypeColor(event.type))}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </ScrollReveal>

            {/* Event Details Panel */}
            <ScrollReveal delay={0.2}>
              <div className={cn(common.events_panel, themed.events_panel)}>
                <h3 className={cn(common.panel_title, themed.panel_title)}>
                  {selectedDate 
                    ? `Events for ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}`
                    : 'Select a date'
                  }
                </h3>

                {selectedEvents.length === 0 ? (
                  <p className={cn(common.no_events, themed.no_events)}>
                    No events scheduled for this day.
                  </p>
                ) : (
                  <StaggerContainer className={common.events_list}>
                    {selectedEvents.map(event => (
                      <StaggerItem key={event.id} className={cn(common.event_card, themed.event_card)}>
                        <div className={common.event_time}>
                          {event.time}
                        </div>
                        <div className={common.event_details}>
                          <div className={common.event_header}>
                            <h4 className={cn(common.event_title, themed.event_title)}>{event.title}</h4>
                            <span className={cn(common.event_type, getEventTypeColor(event.type))}>
                              {getEventIcon(event.type)}
                              {event.type}
                            </span>
                          </div>
                          {event.description && (
                            <p className={cn(common.event_desc, themed.event_desc)}>{event.description}</p>
                          )}
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                )}

                {/* Upcoming Events Section */}
                <div className={common.upcoming_section}>
                  <h4 className={cn(common.upcoming_title, themed.upcoming_title)}>Upcoming</h4>
                  <StaggerContainer className={common.upcoming_list}>
                    {upcomingEvents.map(event => (
                      <StaggerItem key={`upcoming-${event.id}`} className={cn(common.upcoming_item, themed.upcoming_item)}>
                        <div className={common.upcoming_date}>
                          <span className={common.upcoming_day}>{event.date.getDate()}</span>
                          <span className={common.upcoming_month}>{MONTHS[event.date.getMonth()].slice(0, 3)}</span>
                        </div>
                        <div className={common.upcoming_info}>
                          <span className={cn(common.upcoming_event_title, themed.upcoming_event_title)}>{event.title}</span>
                          <span className={common.upcoming_time}>{event.time}</span>
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                </div>
              </div>
            </ScrollReveal>
          </div>
        )}
      </main>
    </PageTransition>
  );
};

export default Calendar;
