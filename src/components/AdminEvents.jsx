import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import '../assets/css/admin.css';
import '../assets/css/panels/scoring.css';
import { VERSION_INFO } from '../constants/version';
import { SERVER_URL } from '../constants/constants';

const AdminEvents = () => {
  const { t } = useTranslation();
  const [availableLists, setAvailableLists] = useState([]);
  const [masterEvents, setMasterEvents] = useState([]);
  const [selectedList, setSelectedList] = useState('');
  const [activeIds, setActiveIds] = useState(new Set());
  const [hasChanges, setHasChanges] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');

  // Fetch all created event lists
  const fetchEventLists = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/events`);
      const list = await res.json();
      setAvailableLists(list);
    } catch (_err) {
      console.error('Failed to fetch event lists', _err);
      alert(t('admin_events_failed_fetch_lists', { defaultValue: 'Failed to fetch event lists' }));
    }
  }, [t]);

  // Fetch the master pool of all possible events
  const fetchMasterEvents = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/events/all`);
      const all = await res.json();
      // Sort master list by ID for structured presentation
      all.sort((a, b) => a.id - b.id);
      setMasterEvents(all);
    } catch (_err) {
      console.error('Failed to fetch master events list', _err);
      alert(t('admin_events_failed_fetch_all', { defaultValue: 'Failed to fetch master events list' }));
    }
  }, [t]);

  // Fetch details of selected event list
  const fetchListDetails = useCallback(async (listName) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/events/details/${listName}`);
      const data = await res.json();
      const active = new Set(data.map(e => e.id));
      setActiveIds(active);
      setHasChanges(false);
    } catch (_err) {
      console.error('Failed to load event list details', _err);
      alert(t('admin_events_failed_load_details', { defaultValue: 'Failed to load event list details' }));
    }
  }, [t]);

  useEffect(() => {
    fetchEventLists();
    fetchMasterEvents();
  }, [fetchEventLists, fetchMasterEvents]);

  useEffect(() => {
    if (selectedList) {
      fetchListDetails(selectedList);
    } else {
      setActiveIds(new Set());
      setHasChanges(false);
    }
  }, [selectedList, fetchListDetails]);

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
        alert(result.error || t('admin_events_failed_create', { defaultValue: 'Failed to create list' }));
      }
    } catch (_err) {
      alert(t('admin_events_failed_create', { defaultValue: 'Failed to create new event list' }));
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
        alert(data.error || t('admin_events_failed_save', { defaultValue: 'Failed to save' }));
      }
    } catch (_err) {
      alert(t('admin_events_failed_save', { defaultValue: 'Failed to save event list' }));
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
        alert(data.error || t('admin_events_failed_default', { defaultValue: 'Failed to set default' }));
      }
    } catch (_err) {
      alert(t('admin_events_failed_default', { defaultValue: 'Failed to set default events list' }));
    }
  };

  return (
    <div className="admin-page-content">
      <div className="admin-actions-bar">
        <select value={selectedList} onChange={(e) => setSelectedList(e.target.value)}>
          <option value="">{t('admin_events_select', { defaultValue: 'Select Events List to Manage...' })}</option>
          {availableLists.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        {selectedList && (
          <>
            <button 
              className="action-button btn-save" 
              onClick={handleSaveList}
            >
              {t('admin_events_save_btn', { defaultValue: 'Save List' })}
            </button>
            <button 
              className="action-button btn-default" 
              onClick={handleSetDefault}
            >
              {t('admin_events_default_btn', { defaultValue: 'Set Default' })}
            </button>
          </>
        )}
        <button 
          className="action-button btn-create" 
          onClick={handleCreateListClick}
        >
          {t('admin_events_create_btn', { defaultValue: 'Create New List' })}
        </button>
      </div>

      {selectedList && (
        <div className="admin-events-list">
          <h3 className="editing-title">
            {t('admin_events_editing_title', { defaultValue: 'Editing Event List:' })} <span>{selectedList}</span>
            {hasChanges && <span className="unsaved-changes-badge">{t('admin_events_unsaved_changes', { defaultValue: '(Unsaved changes)' })}</span>}
          </h3>
          <div className="events-table-header">
            <span>{t('admin_events_in_game', { defaultValue: 'In Game' })}</span>
            <span>{t('admin_events_name_hdr', { defaultValue: 'Event Name' })}</span>
            <span>{t('admin_events_type_hdr', { defaultValue: 'Type' })}</span>
            <span>{t('admin_events_preview_hdr', { defaultValue: 'Hover Preview / Status Info' })}</span>
          </div>
          {masterEvents.map(event => {
            const isChecked = activeIds.has(event.id);
            const localizedTitle = t(`event.${event.id}.title`, { defaultValue: event.title });
            const localizedDesc = t(`event.${event.id}.description`, { defaultValue: event.description });
            return (
              <div key={event.id} className="events-table-row">
                <input 
                  type="checkbox" 
                  checked={isChecked}
                  onChange={() => handleCheckboxChange(event.id)}
                />
                <span className="event-name-tooltip-trigger">
                  {localizedTitle}
                  <span className="event-name-tooltip-content">
                    <strong>{localizedTitle}</strong>
                    <hr />
                    {localizedDesc}
                  </span>
                </span>
                <span>
                  <span className={`event-type-badge ${event.type}`}>
                    {event.type}
                  </span>
                </span>
                <span className="event-meta-info">
                  ID: {event.id} | {isChecked ? t('admin_events_included', { defaultValue: 'Included' }) : t('admin_events_excluded', { defaultValue: 'Excluded' })}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="scoring-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="scoring-modal-content create-list-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-x" onClick={() => setShowCreateModal(false)}>×</button>
            <h3 className="modal-title">
              {t('admin_events_modal_create_title', { defaultValue: 'Create New Event List' })}
            </h3>
            <form onSubmit={handleCreateListSubmit} className="modal-form">
              <div className="form-group">
                <label>
                  {t('admin_events_modal_list_name', { defaultValue: 'List Name:' })}
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
                  className="modal-input"
                />
                <small>
                  {t('admin_events_modal_allowed_chars', { defaultValue: 'Use alphanumeric characters and underscores only.' })}
                </small>
              </div>
              <div className="modal-actions-row">
                <button
                  type="button"
                  className="action-button btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  {t('admin_events_modal_cancel_btn', { defaultValue: 'Cancel' })}
                </button>
                <button
                  type="submit"
                  className="action-button btn-save"
                >
                  {t('admin_events_modal_create_btn', { defaultValue: 'Create' })}
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
