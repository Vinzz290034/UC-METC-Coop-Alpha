import React, { useState } from 'react';
import { ChevronLeft, Calendar, Clock, MapPin, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  category: string;
  attendees: number;
  status: 'upcoming' | 'ongoing' | 'ended';
  image: string;
}

export const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const events: Event[] = [
    {
      id: 1,
      title: 'Back to School 2026',
      date: 'June 15, 2026',
      time: '8:00 AM - 5:00 PM',
      location: 'UC METC Coop Office & Campus',
      description: 'Start your semester right! Shop for school essentials, uniforms, and office supplies at discounted cooperative prices. Join our membership drive and get exclusive back-to-school benefits. Special discounts of up to 20% off on selected items.',
      category: 'shopping',
      attendees: 250,
      status: 'upcoming',
      image: '🛍️',
    },
    {
      id: 2,
      title: '11th General Assembly',
      date: 'July 20, 2026',
      time: '2:00 PM - 5:00 PM',
      location: 'UC METC Multipurpose Hall',
      description: 'Annual meeting for all members. Discuss cooperative policies, financial reports, member welfare programs, and elect new officers. Your voice matters in shaping UC METC\'s future. Free refreshments provided for all attendees.',
      category: 'meeting',
      attendees: 150,
      status: 'upcoming',
      image: '🤝',
    },
    {
      id: 3,
      title: 'Cooperative Orientation for New Members',
      date: 'May 30, 2026',
      time: '10:00 AM - 12:00 PM',
      location: 'UC METC Office - Room E-5',
      description: 'Learn about UC METC\'s mission, vision, and available services. Understand membership benefits, locker policies, and how to maximize your cooperative experience. Great opportunity to meet fellow members and staff.',
      category: 'orientation',
      attendees: 80,
      status: 'upcoming',
      image: '📖',
    },
    {
      id: 4,
      title: 'Financial Workshop: Budget Management for Students',
      date: 'April 20, 2026',
      time: '3:00 PM - 5:00 PM',
      location: 'Room A-102',
      description: 'Learn practical budgeting tips and financial management strategies. Expert speakers will discuss saving, investing, and making smart purchasing decisions. Open to all students and coop members.',
      category: 'workshop',
      attendees: 120,
      status: 'upcoming',
      image: '💰',
    },
    {
      id: 5,
      title: 'Membership Drive Month',
      date: 'April 1 - 30, 2026',
      time: 'All Day',
      location: 'UC METC Office & Campus Booths',
      description: 'Special month-long campaign to encourage new membership. Enjoy special registration bonuses, exclusive merchandise discounts, and raffle draws. First 100 members get free t-shirts.',
      category: 'campaign',
      attendees: 500,
      status: 'ongoing',
      image: '🎁',
    },
    {
      id: 6,
      title: 'Sports Fest 2025',
      date: 'March 15, 2025',
      time: '8:00 AM - 5:00 PM',
      location: 'Campus Sports Complex',
      description: 'Annual sports competition featuring various games and activities. Teams from different departments compete for prizes. Free entry for all UC METC members.',
      category: 'sports',
      attendees: 300,
      status: 'ended',
      image: '⚽',
    },
  ];

  const categories = [
    { value: 'all', label: 'All Events' },
    { value: 'meeting', label: 'Meetings' },
    { value: 'shopping', label: 'Shopping Events' },
    { value: 'workshop', label: 'Workshops' },
    { value: 'orientation', label: 'Orientation' },
    { value: 'campaign', label: 'Campaigns' },
    { value: 'sports', label: 'Sports' },
  ];

  const filteredEvents = filterCategory === 'all'
    ? events
    : events.filter(e => e.category === filterCategory);

  const upcomingEvents = filteredEvents.filter(e => e.status === 'upcoming');
  const ongoingEvents = filteredEvents.filter(e => e.status === 'ongoing');
  const endedEvents = filteredEvents.filter(e => e.status === 'ended');

  const statusConfig = {
    upcoming: { color: 'bg-blue-100', textColor: 'text-blue-800', label: 'Upcoming' },
    ongoing: { color: 'bg-green-100', textColor: 'text-green-800', label: 'Ongoing' },
    ended: { color: 'bg-slate-100', textColor: 'text-slate-800', label: 'Ended' },
  };

  const EventCard = ({ event }: { event: Event }) => (
    <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer hover:scale-105">
      {/* Event Image */}
      <div className="h-32 bg-gradient-to-br from-purple-100 to-green-100 flex items-center justify-center text-5xl relative overflow-hidden">
        <span className="group-hover:scale-110 transition-transform duration-300">
          {event.image}
        </span>
      </div>

      {/* Event Info */}
      <div className="p-6">
        {/* Status Badge */}
        <div className="mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig[event.status].color} ${statusConfig[event.status].textColor}`}>
            {statusConfig[event.status].label}
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-2">
          {event.title}
        </h3>

        {/* Date and Time */}
        <div className="space-y-2 mb-4 text-sm text-slate-600">
          <div className="flex items-center space-x-2">
            <Calendar size={16} className="text-purple-600" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock size={16} className="text-purple-600" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin size={16} className="text-purple-600" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </div>

        {/* Attendees */}
        <div className="flex items-center space-x-1 text-sm text-slate-600 mb-4">
          <Users size={16} />
          <span>{event.attendees} expected attendees</span>
        </div>

        {/* View Details Button */}
        <button
          onClick={() => setSelectedEvent(event)}
          className="w-full bg-gradient-to-r from-purple-600 to-green-600 text-white py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-green-700 transition-all duration-300 flex items-center justify-center space-x-2"
        >
          <span>View Details</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 via-purple-300 to-purple-400 py-8 px-4 animate-slide-in-right">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ChevronLeft size={24} className="text-slate-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">UPCOMING EVENTS</h1>
            <p className="text-slate-700">Stay updated with UC METC activities</p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 overflow-x-auto">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Filter by Category</h2>
          <div className="flex space-x-3 pb-2">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setFilterCategory(category.value)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-300 ${
                  filterCategory === category.value
                    ? 'bg-gradient-to-r from-purple-600 to-green-600 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming Events Section */}
        {upcomingEvents.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">📅 Upcoming Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {/* Ongoing Events Section */}
        {ongoingEvents.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">🔴 Ongoing Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ongoingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {/* Ended Events Section */}
        {endedEvents.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">📌 Past Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {endedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {/* No Events Message */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600 text-lg">No events found in this category.</p>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full animate-scale-in max-h-[90vh] overflow-y-auto">
            {/* Event Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-5xl">{selectedEvent.image}</span>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig[selectedEvent.status].color} ${statusConfig[selectedEvent.status].textColor}`}>
                      {statusConfig[selectedEvent.status].label}
                    </span>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-slate-900">{selectedEvent.title}</h2>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Event Details */}
            <div className="space-y-4 mb-8 pb-8 border-b border-slate-200">
              <div className="flex items-start space-x-4">
                <Calendar className="text-purple-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm text-slate-600 font-medium">Date</p>
                  <p className="text-lg text-slate-900">{selectedEvent.date}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Clock className="text-purple-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm text-slate-600 font-medium">Time</p>
                  <p className="text-lg text-slate-900">{selectedEvent.time}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <MapPin className="text-purple-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm text-slate-600 font-medium">Location</p>
                  <p className="text-lg text-slate-900">{selectedEvent.location}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Users className="text-purple-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm text-slate-600 font-medium">Expected Attendees</p>
                  <p className="text-lg text-slate-900">{selectedEvent.attendees} people</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-3">About This Event</h3>
              <p className="text-slate-700 leading-relaxed">
                {selectedEvent.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedEvent(null)}
                className="flex-1 px-4 py-3 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold transition-all duration-200"
              >
                Close
              </button>
              {selectedEvent.status === 'upcoming' && (
                <button
                  className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white font-semibold transition-all duration-200 shadow-lg"
                >
                  Register Interest
                </button>
              )}
              {selectedEvent.status === 'ongoing' && (
                <button
                  className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold transition-all duration-200 shadow-lg"
                >
                  Join Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
