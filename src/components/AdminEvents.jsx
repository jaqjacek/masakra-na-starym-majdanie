import React, { useState, useEffect } from 'react';
import '../assets/css/admin.css';
import Footer from './Footer';
import { VERSION_INFO } from '../constants/version';
import { SERVER_URL } from '../constants/constants';

const AdminEvents = () => {
  const [availableLists, setAvailableLists] = useState([]);
  const [masterEvents, setMasterEvents] = useState([]);
  const [selectedList, setSelectedList] = useState('');
  const [activeIds, setActiveIds] = useState(new Set());
  const [hasChanges, setHasChanges] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');

  // Fetch all created event lists
  const fetchEventLists = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/events`);
      const list = await res.json();
      setAvailableLists(list);
    } catch (_err) {
      console.error('Failed to fetch event lists', _err);
    }
  };

  // Fetch the master pool of all possible events
  const fetchMasterEvents = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/events/all`);
      const all = await res.json();
      // Sort master list by ID for structured presentation
      all.sort((a, b) => a.id - b.id);
      setMasterEvents(all);
    } catch (_err) {
      console.error('Failed to fetch master events list', _err);
    }
  };

  // Fetch details of selected event list
  const fetchListDetails = async (listName) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/events/details/${listName}`);
      const data = await res.json();
      const active = new Set(data.map(e => e.id));
      setActiveIds(active);
      setHasChanges(false);
    } catch (_err) {
      console.error('Failed to load event list details', _err);
    }
  };

  useEffect(() => {
    fetchEventLists();
    fetchMasterEvents();
  }, []);

  useEffect(() => {
    if (selectedList) {
      fetchListDetails(selectedList);
    } else {
      setActiveIds(new Set());
      setHasChanges(false);
    }
  }, [selectedList]);

  // Construct array of events selected/chosen
  const getChosenEventsData = () => {
    return masterEvents.filter(e => activeIds.has(e.id));
  };

  const handleCheckboxChange = (eventId) => {
    const next = new Set(activeIds);
    if (next.has(eventId)) {
      next.delete(eventId);
    } else {
      next.add(eventId);
    }
    setActiveIds(next);
    setHasChanges(true);
  };

  const handleCreateListClick = () => {
    setNewListName('');
    setShowCreateModal(true);
  };

  const handleCreateListSubmit = async (e) => {
    if (e) e.preventDefault();
    const name = newListName.trim();
    if (!name) return;
    try {
      const response = await fetch(`${SERVER_URL}/api/events/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        await fetchEventLists();
        setSelectedList(result.name);
        setShowCreateModal(false);
        setNewListName('');
      } else {
        alert(result.error || 'Failed to create list');
      }
    } catch (_err) {
      alert('Failed to create new event list');
    }
  };

  const handleSaveList = async () => {
    if (!selectedList) return;
    const eventsData = getChosenEventsData();
    try {
      const response = await fetch(`${SERVER_URL}/api/events/save/${selectedList}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventsData })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        setHasChanges(false);
      } else {
        alert(data.error || 'Failed to save');
      }
    } catch (_err) {
      alert('Failed to save event list');
    }
  };

  const handleSetDefault = async () => {
    if (!selectedList) return;
    const eventsData = getChosenEventsData();
    try {
      const response = await fetch(`${SERVER_URL}/api/events/default/${selectedList}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventsData })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        setHasChanges(false);
      } else {
        alert(data.error || 'Failed to set default');
      }
    } catch (_err) {
      alert('Failed to set default events list');
    }
  };

  return (
    <div className="admin-page-content">
      <div className="admin-actions-bar">
        <select value={selectedList} onChange={(e) => setSelectedList(e.target.value)}>
          <option value="">Select Events List to Manage...</option>
          {availableLists.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        {selectedList && (
          <>
            <button 
              className="action-button" 
              style={{ backgroundColor: '#27ae60' }} 
              onClick={handleSaveList}
            >
              Save List
            </button>
            <button 
              className="action-button" 
              style={{ backgroundColor: '#e74c3c' }} 
              onClick={handleSetDefault}
            >
              Set Default
            </button>
          </>
        )}
        <button 
          className="action-button download-btn" 
          onClick={handleCreateListClick}
        >
          Create New List
        </button>
      </div>

      {selectedList && (
        <div className="admin-events-list">
          <h3 style={{ margin: '0 0 1rem 0', color: '#f1c40f' }}>
            Editing Event List: <span style={{ color: '#fff' }}>{selectedList}</span>
            {hasChanges && <span style={{ color: '#e74c3c', fontSize: '1rem', marginLeft: '1rem' }}>(Unsaved changes)</span>}
          </h3>
          <div className="events-table-header">
            <span>In Game</span>
            <span>Event Name</span>
            <span>Type</span>
            <span>Hover Preview / Status Info</span>
          </div>
          {masterEvents.map(event => {
            const isChecked = activeIds.has(event.id);
            return (
              <div key={event.id} className="events-table-row">
                <input 
                  type="checkbox" 
                  checked={isChecked}
                  onChange={() => handleCheckboxChange(event.id)}
                />
                <span className="event-name-tooltip-trigger">
                  {event.title}
                  <span className="event-name-tooltip-content">
                    <strong>{event.title}</strong>
                    <hr style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.2)', margin: '5px 0' }} />
                    {event.description}
                  </span>
                </span>
                <span>
                  <span className={`event-type-badge ${event.type}`}>
                    {event.type}
                  </span>
                </span>
                <span style={{ color: '#888', fontSize: '0.9rem' }}>
                  ID: {event.id} | {isChecked ? 'Included' : 'Excluded'}
                </span>
              </div>
            );
          })}
        </div>
      )}
      <Footer versionInfo={VERSION_INFO} />

      {showCreateModal && (
        <div className="scoring-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="scoring-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <button className="modal-close-x" onClick={() => setShowCreateModal(false)}>×</button>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#3e2723', textAlign: 'center', fontFamily: 'inherit' }}>
              Create New Event List
            </h3>
            <form onSubmit={handleCreateListSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: 'bold', color: '#3e2723' }}>
                  List Name:
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g. custom_events"
                  pattern="^[a-zA-Z0-9_]+$"
                  title="Alphanumeric characters and underscores only"
                  required
                  autoFocus
                  style={{
                    padding: '0.8rem',
                    fontSize: '1rem',
                    borderRadius: '6px',
                    border: '2px solid #3e2723',
                    background: 'rgba(255, 255, 255, 0.85)',
                    color: '#3e2723',
                    outline: 'none',
                  }}
                />
                <small style={{ color: '#5d4037', fontSize: '0.8rem' }}>
                  Use alphanumeric characters and underscores only.
                </small>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="action-button"
                  style={{ backgroundColor: '#7f8c8d', fontSize: '1.1rem', padding: '0.6rem 1.2rem', cursor: 'pointer' }}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="action-button"
                  style={{ backgroundColor: '#27ae60', fontSize: '1.1rem', padding: '0.6rem 1.2rem', cursor: 'pointer' }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
