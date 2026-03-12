import React, { useState } from 'react';
import { MessageCircle } from '../../assets/icons/MessageCircle';
import { Clock } from '../../assets/icons/Clock';
import { Check } from '../../assets/icons/Check';
import { AlertCircle } from '../../assets/icons/AlertCircle';
import { User } from '../../assets/icons/User';
import { adminApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const SupportTickets = () => {
  const [filter, setFilter] = useState('open'); // open, in-progress, resolved, all
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tickets, setTickets] = useState([]);
  const { showToast } = useToast();

  React.useEffect(() => {
    adminApi
      .getSupportTickets()
      .then((items) => setTickets(Array.isArray(items) ? items : []))
      .catch((e) => showToast(e?.message || 'Failed to load support tickets', 'error'));
  }, [showToast]);

  const filteredTickets = filter === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === filter);

  const stats = {
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in-progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    total: tickets.length,
  };

  const handleReply = (ticketId) => {
    const reply = prompt('Enter your reply:');
    if (reply) {
      adminApi
        .updateSupportTicketStatus(ticketId, 'in-progress', reply)
        .then(() => {
          setTickets((prev) =>
            prev.map((ticket) =>
              ticket.id === ticketId
                ? { ...ticket, status: 'in-progress', updatedAt: new Date().toISOString() }
                : ticket,
            ),
          );
          showToast('Reply sent', 'success');
        })
        .catch((e) => showToast(e?.message || 'Failed to reply', 'error'));
    }
  };

  const handleResolve = (ticketId) => {
    adminApi
      .updateSupportTicketStatus(ticketId, 'resolved')
      .then(() => {
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket.id === ticketId ? { ...ticket, status: 'resolved', updatedAt: new Date().toISOString() } : ticket,
          ),
        );
        showToast('Ticket marked as resolved', 'success');
      })
      .catch((e) => showToast(e?.message || 'Failed to update ticket', 'error'));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-white/5 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-900 text-zoop-obsidian dark:text-white">Support Tickets</h1>
          <p className="text-gray-500 mt-1">Manage customer support requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:glass-card rounded-2xl p-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Open Tickets</p>
                <p className="text-3xl font-black text-red-500">{stats.open}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle width={24} height={24} stroke="#ef4444" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:glass-card rounded-2xl p-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">In Progress</p>
                <p className="text-3xl font-black text-orange-500">{stats.inProgress}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock width={24} height={24} stroke="#f97316" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:glass-card rounded-2xl p-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Resolved</p>
                <p className="text-3xl font-black text-green-500">{stats.resolved}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Check width={24} height={24} stroke="#22c55e" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:glass-card rounded-2xl p-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Total Tickets</p>
                <p className="text-3xl font-black text-zoop-obsidian dark:text-white">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 dark:bg-white/10 rounded-xl flex items-center justify-center">
                <MessageCircle width={24} height={24} stroke="#1f2937" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white dark:glass-card rounded-2xl p-2 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] flex gap-2">
          {['open', 'in-progress', 'resolved', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                filter === tab
                  ? 'bg-zoop-moss text-zoop-obsidian dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100'
              }`}
            >
              {tab === 'in-progress' ? 'In Progress' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tickets List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white dark:glass-card rounded-2xl p-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:shadow-lg transition-all cursor-pointer"
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zoop-moss/20 rounded-full flex items-center justify-center">
                    <User width={20} height={20} className="text-zoop-obsidian dark:text-white" />
                  </div>
                  <div>
                    <p className="font-black text-zoop-obsidian dark:text-white">{ticket.customer || ticket.name || ticket.email || "User"}</p>
                    <p className="text-xs text-gray-500">{ticket.email}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  ticket.priority === 'high' ? 'bg-red-100 text-red-700' :
                  ticket.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {ticket.priority}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-black text-gray-400 uppercase">{ticket.id}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs text-gray-500">{ticket.category || 'General'}</span>
                </div>
                <h3 className="text-lg font-black text-zoop-obsidian dark:text-white mb-2">{ticket.subject || ticket.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{ticket.message || ticket.description}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock width={14} height={14} />
                  <span>{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : ticket.lastUpdate}</span>
                </div>
                <div className="flex gap-2">
                  {ticket.status !== 'resolved' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReply(ticket.id);
                        }}
                        className="px-4 py-2 bg-zoop-obsidian text-white rounded-lg text-xs font-bold hover:bg-zoop-moss hover:text-zoop-obsidian transition-all"
                      >
                        Reply
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResolve(ticket.id);
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-all"
                      >
                        Resolve
                      </button>
                    </>
                  )}
                  {ticket.status === 'resolved' && (
                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-black uppercase">
                      Resolved
                    </span>
                  )}
                </div>
              </div>

              {ticket.orderId && (
                <div className="mt-3 text-xs">
                  <span className="text-gray-500">Order: </span>
                  <span className="text-zoop-moss font-bold">{ticket.orderId}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredTickets.length === 0 && (
          <div className="bg-white dark:glass-card rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-xl font-black text-zoop-obsidian dark:text-white mb-2">
              No {filter} tickets
            </h3>
            <p className="text-gray-500">
              There are no tickets in the {filter} status
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportTickets;
