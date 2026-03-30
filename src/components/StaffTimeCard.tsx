import React, { useState, useEffect, useRef } from 'react';
import { Clock, LogIn, LogOut, MoreVertical, History, Bell, HelpCircle } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../store/authContext';
import { useUIStore } from '../store/uiStore';
import type { DTRRecord } from '../types';

export const StaffTimeCard: React.FC = () => {
  const { user } = useAuth();
  const { dtrRecords, addDTRRecord, updateDTRRecord } = useAppStore();
  const { showNotification } = useUIStore();
  const [todayRecord, setTodayRecord] = useState<DTRRecord | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showMenu, setShowMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split('T')[0];

  // Check if user has timed in today
  useEffect(() => {
    if (user) {
      const record = dtrRecords.find(
        (r) => r.staffId === user.id && r.date === today
      );
      setTodayRecord(record || null);
    }
  }, [dtrRecords, user, today]);

  // Update current time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTimeIn = () => {
    if (!user) return;

    const timeInStr = currentTime.toTimeString().split(' ')[0];
    const now = new Date();
    const currentHour = now.getHours();

    // Determine status (before 8 AM = on_time, after 8 AM = late)
    const status = currentHour < 8 ? 'on_time' : 'late';

    const newRecord: DTRRecord = {
      id: `dtr_${Date.now()}`,
      staffId: user.id,
      staffName: `${user.first_name} ${user.last_name}`,
      date: today,
      timeIn: timeInStr,
      status: status,
      createdAt: new Date().toISOString(),
    };

    addDTRRecord(newRecord);
    setTodayRecord(newRecord);
    showNotification(
      `Timed in at ${timeInStr} (${status === 'on_time' ? 'On Time' : 'Late'})`,
      'success'
    );
  };

  const handleTimeOut = () => {
    if (!todayRecord) return;

    const timeOutStr = currentTime.toTimeString().split(' ')[0];

    // Calculate duration in minutes
    const [timeInH, timeInM] = todayRecord.timeIn.split(':').map(Number);
    const [timeOutH, timeOutM] = timeOutStr.split(':').map(Number);

    const timeInMins = timeInH * 60 + timeInM;
    const timeOutMins = timeOutH * 60 + timeOutM;
    const duration = Math.max(0, timeOutMins - timeInMins);

    updateDTRRecord(todayRecord.id, {
      timeOut: timeOutStr,
      duration: duration,
    });

    setTodayRecord({
      ...todayRecord,
      timeOut: timeOutStr,
      duration: duration,
    });

    showNotification(
      `Timed out at ${timeOutStr} (Duration: ${Math.floor(duration / 60)}h ${duration % 60}m)`,
      'success'
    );
  };

  const getWeeklyHistory = () => {
    if (!user) return [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    return dtrRecords.filter(
      (r) => r.staffId === user.id && r.date >= sevenDaysAgoStr
    );
  };

  const handleViewHistory = () => {
    showNotification('Opening your last 7 days of time records', 'success');
    setShowHistory(true);
    setShowMenu(false);
  };

  const handleNotifications = () => {
    showNotification('Notifications enabled for time tracking alerts', 'success');
    setShowMenu(false);
  };

  const handleHelp = () => {
    showNotification(
      'Time In before 8 AM = On Time | After 8 AM = Late | Click Time Out to end your shift',
      'success'
    );
    setShowMenu(false);
  };

  // Only show for staff members
  if (!user || user.role !== 'staff') {
    return null;
  }

  return (
    <div className="relative bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-950 rounded-xl p-6 max-w-sm overflow-hidden">
      {/* Dark Purple Overlay */}
      <div className="absolute inset-0 rounded-xl bg-purple-900 opacity-10" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header with Menu */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Clock size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Time In/Out</h3>
              <p className="text-xs text-slate-600">Daily Time Record</p>
            </div>
          </div>

          {/* Menu Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-purple-200 rounded-lg transition-colors"
              title="Options"
            >
              <MoreVertical size={20} className="text-purple-600" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-purple-200 z-50">
                <button
                  onClick={handleViewHistory}
                  className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-purple-50 border-b border-purple-100 text-left text-slate-700"
                >
                  <History size={16} className="text-purple-600" />
                  <span className="text-sm">View History (7 days)</span>
                </button>
                <button
                  onClick={handleNotifications}
                  className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-purple-50 border-b border-purple-100 text-left text-slate-700"
                >
                  <Bell size={16} className="text-purple-600" />
                  <span className="text-sm">Notifications</span>
                </button>
                <button
                  onClick={handleHelp}
                  className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-purple-50 text-left text-slate-700"
                >
                  <HelpCircle size={16} className="text-purple-600" />
                  <span className="text-sm">Help & Info</span>
                </button>
              </div>
            )}
          </div>
        </div>

      {/* Current Time Display */}
      <div className="mb-6 p-4 bg-white rounded-lg border border-purple-200">
        <p className="text-xs text-slate-600 mb-1">Current Time</p>
        <p className="text-2xl font-mono font-bold text-purple-600">
          {currentTime.toLocaleTimeString()}
        </p>
        <p className="text-xs text-slate-500 mt-2">
          {currentTime.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Status Display */}
      {todayRecord && (
        <div className="mb-6 p-4 bg-white rounded-lg border border-purple-200 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Timed In:</span>
            <span className="font-mono font-bold text-slate-900">
              {todayRecord.timeIn}
            </span>
          </div>
          {todayRecord.timeOut && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Timed Out:</span>
                <span className="font-mono font-bold text-slate-900">
                  {todayRecord.timeOut}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Duration:</span>
                <span className="font-mono font-bold text-slate-900">
                  {Math.floor((todayRecord.duration || 0) / 60)}h{' '}
                  {(todayRecord.duration || 0) % 60}m
                </span>
              </div>
            </>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Status:</span>
            <span
              className={`text-xs font-bold px-2 py-1 rounded ${
                todayRecord.status === 'on_time'
                  ? 'bg-green-100 text-green-800'
                  : todayRecord.status === 'late'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-slate-100 text-slate-800'
              }`}
            >
              {todayRecord.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        {!todayRecord ? (
          <button
            onClick={handleTimeIn}
            className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            <LogIn size={20} />
            <span>Time In</span>
          </button>
        ) : !todayRecord.timeOut ? (
          <button
            onClick={handleTimeOut}
            className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold"
          >
            <LogOut size={20} />
            <span>Time Out</span>
          </button>
        ) : (
          <div className="w-full bg-slate-200 text-slate-700 px-4 py-3 rounded-lg text-center font-semibold">
            Already timed out today
          </div>
        )}
      </div>

      {/* Info */}
      <p className="text-xs text-slate-600 mt-4 text-center">
        {currentTime.getHours() < 8
          ? 'You will be marked as on time if you time in within the hour'
          : 'You are currently late. Time in will be recorded as late.'}
      </p>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">7-Day History</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {getWeeklyHistory().length > 0 ? (
                getWeeklyHistory().map((record) => (
                  <div
                    key={record.id}
                    className="p-3 bg-purple-50 rounded-lg border border-purple-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          {record.timeIn}
                          {record.timeOut && ` - ${record.timeOut}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded ${
                            record.status === 'on_time'
                              ? 'bg-green-100 text-green-800'
                              : record.status === 'late'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {record.status.replace('_', ' ')}
                        </span>
                        {record.duration && (
                          <p className="text-xs text-slate-600 mt-1">
                            {Math.floor(record.duration / 60)}h{' '}
                            {record.duration % 60}m
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-600 py-4">
                  No records in the last 7 days
                </p>
              )}
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="w-full mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
