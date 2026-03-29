// @AI-HINT: Availability calendar for freelancer scheduling, time slots, and bookings
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { availabilityApi } from '@/lib/api';
import Button from '@/app/components/atoms/Button/Button';
import { PageTransition } from '@/app/components/Animations/PageTransition';
import { ScrollReveal } from '@/app/components/Animations/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/app/components/Animations/StaggerContainer';
import Input from '@/app/components/atoms/Input/Input';
import Select from '@/app/components/molecules/Select/Select';
import commonStyles from './Availability.common.module.css';
import lightStyles from './Availability.light.module.css';
import darkStyles from './Availability.dark.module.css';

interface TimeSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  is_available: boolean;
}

interface Booking {
  id: string;
  client_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  project_title?: string;
  notes?: string;
}

interface AvailabilitySettings {
  timezone: string;
  default_slot_duration: number;
  buffer_time: number;
  auto_accept_bookings: boolean;
  max_bookings_per_day: number;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

export default function AvailabilityPage() {
  const { resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('schedule');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<AvailabilitySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Partial<TimeSlot> | null>(null);
  const [deleteSlotId, setDeleteSlotId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [slotsRes, bookingsRes, settingsRes] = await Promise.all([
        (availabilityApi as any).getSlots?.().catch(() => []),
        (availabilityApi as any).getBookings?.().catch(() => []),
        (availabilityApi as any).getSettings?.().catch(() => null)
      ]);
      setSlots(slotsRes || []);
      setBookings(bookingsRes || []);
      setSettings(settingsRes);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load availability data:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSlot = async () => {
    if (!editingSlot) return;
    try {
      if (editingSlot.id) {
        await (availabilityApi as any).updateSlot(editingSlot.id, editingSlot);
      } else {
        await (availabilityApi as any).createSlot(editingSlot);
      }
      setShowSlotModal(false);
      setEditingSlot(null);
      loadData();
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to save slot:', err);
      }
    }
  };

  const handleDeleteSlot = (slotId: string) => {
    setDeleteSlotId(slotId);
  };

  const confirmDeleteSlot = async () => {
    if (!deleteSlotId) return;
    try {
      await (availabilityApi as any).deleteSlot(deleteSlotId);
      loadData();
      showToast('Time slot deleted');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete slot:', err);
      }
    } finally {
      setDeleteSlotId(null);
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'confirm' | 'cancel') => {
    try {
      if (action === 'confirm') {
        await (availabilityApi as any).confirmBooking(bookingId);
      } else {
        await (availabilityApi as any).cancelBooking(bookingId);
      }
      loadData();
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to update booking:', err);
      }
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    try {
      await (availabilityApi as any).updateSettings(settings);
      showToast('Settings saved successfully!');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to save settings:', err);
      }
    }
  };

  const getSlotsByDay = (dayIndex: number) => {
    return slots.filter(s => s.day_of_week === dayIndex);
  };

  const getBookingStatus = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: 'Pending', color: '#f59e0b' },
      confirmed: { label: 'Confirmed', color: '#27ae60' },
      cancelled: { label: 'Cancelled', color: '#e81123' },
      completed: { label: 'Completed', color: '#4573df' }
    };
    return statusMap[status] || { label: status, color: '#64748b' };
  };

  const themeStyles = resolvedTheme === 'light' ? lightStyles : darkStyles;

  const tabs = [
    { id: 'schedule', label: '📅 Weekly Schedule' },
    { id: 'bookings', label: '📋 Bookings' },
    { id: 'settings', label: '⚙️ Settings' }
  ];

  if (loading) {
    return (
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <div className={commonStyles.loading}>Loading availability...</div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className={cn(commonStyles.container, themeStyles.container)}>
        <ScrollReveal>
          <header className={commonStyles.header}>
            <div>
              <h1 className={cn(commonStyles.title, themeStyles.title)}>Availability Calendar</h1>
              <p className={cn(commonStyles.subtitle, themeStyles.subtitle)}>
                Manage your schedule and bookings
              </p>
            </div>
            <Button variant="primary" onClick={() => { setEditingSlot({}); setShowSlotModal(true); }}>
              + Add Time Slot
            </Button>
          </header>
        </ScrollReveal>

        {/* Stats Row */}
        <StaggerContainer className={commonStyles.statsRow} delay={0.1}>
          <StaggerItem className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <span className={commonStyles.statIcon}>📆</span>
            <div className={commonStyles.statInfo}>
              <strong>{slots.length}</strong>
              <span>Time Slots</span>
            </div>
          </StaggerItem>
          <StaggerItem className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <span className={commonStyles.statIcon}>⏳</span>
            <div className={commonStyles.statInfo}>
              <strong>{bookings.filter(b => b.status === 'pending').length}</strong>
              <span>Pending</span>
            </div>
          </StaggerItem>
          <StaggerItem className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <span className={commonStyles.statIcon}>✅</span>
            <div className={commonStyles.statInfo}>
              <strong>{bookings.filter(b => b.status === 'confirmed').length}</strong>
              <span>Confirmed</span>
            </div>
          </StaggerItem>
          <StaggerItem className={cn(commonStyles.statCard, themeStyles.statCard)}>
            <span className={commonStyles.statIcon}>🎯</span>
            <div className={commonStyles.statInfo}>
              <strong>{bookings.filter(b => b.status === 'completed').length}</strong>
              <span>Completed</span>
            </div>
          </StaggerItem>
        </StaggerContainer>

        <ScrollReveal delay={0.2}>
          <div className={cn(commonStyles.tabs, themeStyles.tabs || '')}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  commonStyles.tab,
                  themeStyles.tab,
                  activeTab === tab.id && commonStyles.tabActive,
                  activeTab === tab.id && themeStyles.tabActive
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </ScrollReveal>

        <div className={commonStyles.tabContent}>
          {activeTab === 'schedule' && (
            <ScrollReveal className={commonStyles.scheduleSection}>
              <div className={cn(commonStyles.weekGrid, themeStyles.weekGrid)}>
                {DAYS.map((day, dayIndex) => (
                  <div key={day} className={cn(commonStyles.dayColumn, themeStyles.dayColumn)}>
                    <div className={cn(commonStyles.dayHeader, themeStyles.dayHeader)}>
                      {day}
                    </div>
                    <div className={commonStyles.daySlots}>
                      {getSlotsByDay(dayIndex).length === 0 ? (
                        <div className={cn(commonStyles.noSlots, themeStyles.noSlots)}>
                          No slots
                        </div>
                      ) : (
                        getSlotsByDay(dayIndex).map(slot => (
                          <div
                            key={slot.id}
                            className={cn(
                              commonStyles.slotItem,
                              themeStyles.slotItem,
                              slot.is_available && commonStyles.available
                            )}
                          >
                            <span className={commonStyles.slotTime}>
                              {slot.start_time} - {slot.end_time}
                            </span>
                            {slot.is_recurring && <span className={commonStyles.recurringBadge}>🔁</span>}
                            <div className={commonStyles.slotActions}>
                              <button
                                onClick={() => { setEditingSlot(slot); setShowSlotModal(true); }}
                                className={commonStyles.slotBtn}
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteSlot(slot.id)}
                                className={commonStyles.slotBtn}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          )}

          {activeTab === 'bookings' && (
            <div className={commonStyles.bookingsSection}>
              {bookings.length === 0 ? (
                <ScrollReveal className={cn(commonStyles.emptyCard, themeStyles.emptyCard)}>
                  <span>📭</span>
                  <h3>No Bookings Yet</h3>
                  <p>When clients book your time, they will appear here.</p>
                </ScrollReveal>
              ) : (
                <StaggerContainer className={commonStyles.bookingsList}>
                  {bookings.map(booking => {
                    const status = getBookingStatus(booking.status);
                    return (
                      <StaggerItem key={booking.id} className={cn(commonStyles.bookingCard, themeStyles.bookingCard)}>
                        <div className={commonStyles.bookingHeader}>
                          <div>
                            <h3>{booking.client_name}</h3>
                            {booking.project_title && (
                              <p className={commonStyles.projectTitle}>{booking.project_title}</p>
                            )}
                          </div>
                          <span
                            className={commonStyles.statusBadge}
                            style={{ backgroundColor: status.color }}
                          >
                            {status.label}
                          </span>
                        </div>
                        <div className={commonStyles.bookingDetails}>
                          <div className={commonStyles.detailItem}>
                            <span>📅</span>
                            <strong>{new Date(booking.date).toLocaleDateString()}</strong>
                          </div>
                          <div className={commonStyles.detailItem}>
                            <span>⏰</span>
                            <strong>{booking.start_time} - {booking.end_time}</strong>
                          </div>
                        </div>
                        {booking.notes && (
                          <p className={cn(commonStyles.bookingNotes, themeStyles.bookingNotes)}>
                            {booking.notes}
                          </p>
                        )}
                        {booking.status === 'pending' && (
                          <div className={commonStyles.bookingActions}>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleBookingAction(booking.id, 'confirm')}
                            >
                              ✓ Confirm
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleBookingAction(booking.id, 'cancel')}
                            >
                              ✕ Decline
                            </Button>
                          </div>
                        )}
                      </StaggerItem>
                    );
                  })}
                </StaggerContainer>
              )}
            </div>
          )}

          {activeTab === 'settings' && settings && (
            <ScrollReveal className={commonStyles.settingsSection}>
              <div className={cn(commonStyles.settingsCard, themeStyles.settingsCard)}>
                <h3>Availability Settings</h3>
                
                <div className={commonStyles.settingGroup}>
                  <label>Timezone</label>
                  <Select
                    id="timezone"
                    value={settings.timezone}
                    onChange={e => setSettings({ ...settings, timezone: e.target.value })}
                    options={[
                      { value: 'UTC', label: 'UTC' },
                      { value: 'America/New_York', label: 'Eastern Time' },
                      { value: 'America/Los_Angeles', label: 'Pacific Time' },
                      { value: 'Europe/London', label: 'London' },
                      { value: 'Asia/Tokyo', label: 'Tokyo' },
                    ]}
                  />
                </div>

                <div className={commonStyles.settingGroup}>
                  <label>Default Slot Duration (minutes)</label>
                  <Input
                    type="number"
                    value={settings.default_slot_duration}
                    onChange={e => setSettings({ ...settings, default_slot_duration: parseInt(e.target.value) })}
                    min={15}
                  />
                </div>

                <div className={commonStyles.settingGroup}>
                  <label>Buffer Time Between Meetings (minutes)</label>
                  <Input
                    type="number"
                    value={settings.buffer_time}
                    onChange={e => setSettings({ ...settings, buffer_time: parseInt(e.target.value) })}
                    min={0}
                  />
                </div>

                <div className={commonStyles.settingGroup}>
                  <label>Max Bookings Per Day</label>
                  <Input
                    type="number"
                    value={settings.max_bookings_per_day}
                    onChange={e => setSettings({ ...settings, max_bookings_per_day: parseInt(e.target.value) })}
                    min={1}
                  />
                </div>

                <div className={commonStyles.settingGroup}>
                  <label className={commonStyles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={settings.auto_accept_bookings}
                      onChange={e => setSettings({ ...settings, auto_accept_bookings: e.target.checked })}
                    />
                    Auto-accept bookings
                  </label>
                </div>

                <Button variant="primary" onClick={handleSaveSettings}>
                  Save Settings
                </Button>
              </div>
            </ScrollReveal>
          )}
        </div>

        {/* Time Slot Modal */}
        {showSlotModal && (
          <div className={commonStyles.modalOverlay} onClick={() => setShowSlotModal(false)}>
            <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={e => e.stopPropagation()}>
              <h2>{editingSlot?.id ? 'Edit Time Slot' : 'Add Time Slot'}</h2>
              
              <div className={commonStyles.formGroup}>
                <label>Day of Week</label>
                <select
                  value={editingSlot?.day_of_week ?? 1}
                  onChange={e => setEditingSlot({ ...editingSlot, day_of_week: parseInt(e.target.value) })}
                  className={cn(commonStyles.input, themeStyles.input)}
                >
                  {DAYS.map((day, i) => (
                    <option key={day} value={i}>{day}</option>
                  ))}
                </select>
              </div>

              <div className={commonStyles.formRow}>
                <div className={commonStyles.formGroup}>
                  <label>Start Time</label>
                  <select
                    value={editingSlot?.start_time ?? '09:00'}
                    onChange={e => setEditingSlot({ ...editingSlot, start_time: e.target.value })}
                    className={cn(commonStyles.input, themeStyles.input)}
                  >
                    {HOURS.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div className={commonStyles.formGroup}>
                  <label>End Time</label>
                  <select
                    value={editingSlot?.end_time ?? '17:00'}
                    onChange={e => setEditingSlot({ ...editingSlot, end_time: e.target.value })}
                    className={cn(commonStyles.input, themeStyles.input)}
                  >
                    {HOURS.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={commonStyles.formGroup}>
                <label className={commonStyles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={editingSlot?.is_recurring ?? true}
                    onChange={e => setEditingSlot({ ...editingSlot, is_recurring: e.target.checked })}
                  />
                  Recurring weekly
                </label>
              </div>

              <div className={commonStyles.formGroup}>
                <label className={commonStyles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={editingSlot?.is_available ?? true}
                    onChange={e => setEditingSlot({ ...editingSlot, is_available: e.target.checked })}
                  />
                  Available for bookings
                </label>
              </div>

              <div className={commonStyles.modalActions}>
                <Button variant="secondary" onClick={() => setShowSlotModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveSlot}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Slot Confirmation */}
        {deleteSlotId && (
          <div className={commonStyles.modalOverlay} onClick={() => setDeleteSlotId(null)}>
            <div className={cn(commonStyles.modal, themeStyles.modal)} onClick={e => e.stopPropagation()}>
              <h2>Delete Time Slot</h2>
              <p className={commonStyles.confirmText}>
                Are you sure you want to delete this time slot?
              </p>
              <div className={commonStyles.modalActions}>
                <Button variant="secondary" onClick={() => setDeleteSlotId(null)}>Cancel</Button>
                <Button variant="danger" onClick={confirmDeleteSlot}>Delete</Button>
              </div>
            </div>
          </div>
        )}

        {/* Toast notification */}
        {toast && (
          <div className={commonStyles.successToast}>
            {toast}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
