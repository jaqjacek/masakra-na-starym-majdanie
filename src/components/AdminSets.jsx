import React, { useState, useEffect } from 'react';
import '../assets/css/admin.css';
import Footer from './Footer';
import { VERSION_INFO } from '../constants/version';
import { SERVER_URL } from '../constants/constants';

const AdminSets = () => {
  const [availableSets, setAvailableSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState('');
  const [loadedSetData, setLoadedSetData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showGenForm, setShowGenForm] = useState(false);
  
  const [draggedPawn, setDraggedPawn] = useState(null);

  const [genDisplayName, setGenDisplayName] = useState('');
  const [genDescription, setGenDescription] = useState('');
  const [genMaxPower, setGenMaxPower] = useState(6);
  const [genPawns, setGenPawns] = useState({ bardak: 80, ghost: 30, werewolf: 20, vampire: 10 });
  const [genPawnsInPlayLimit, setGenPawnsInPlayLimit] = useState({ bardak: 80, ghost: 30, werewolf: 20, vampire: 10 });
  const [genPower, setGenPower] = useState({ vampire: 3, werewolf: 2, ghost: 1, bardak: 1 });

  const fetchSets = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/sets`);
      const list = await res.json(); setAvailableSets(list);
    } catch (_err) { console.error(_err); }
  };

  const fetchSetDetails = async (setName) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/sets/details/${setName}`);
      const data = await res.json(); setLoadedSetData(data);
    } catch (_err) { console.error(_err); }
  };

  useEffect(() => { fetchSets(); }, []);
  useEffect(() => {
    if (selectedSet) fetchSetDetails(selectedSet);
    else { setLoadedSetData(null); setIsEditMode(false); }
  }, [selectedSet]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${SERVER_URL}/api/sets/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: genDisplayName, description: genDescription, pawns: genPawns, pawnsInPlayLimit: genPawnsInPlayLimit, power: genPower, maxPower: genMaxPower })
      });
      const result = await response.json();
      setShowGenForm(false); 
      const res = await fetch(`${SERVER_URL}/api/sets`);
      const list = await res.json();
      setAvailableSets(list);
      setSelectedSet(result.name);
      alert(`Set generated: ${result.name}`);
    } catch (_err) { alert('Failed to generate set'); }
  };

  const handleSaveEdits = async () => {
    if (!selectedSet || !loadedSetData) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/sets/save/${selectedSet}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setsData: loadedSetData })
      });
      const data = await res.json();
      alert(data.message);
      setIsEditMode(false);
      fetchSetDetails(selectedSet); // Refresh to get re-indexed state
    } catch (_err) { alert('Failed to save set'); }
  };

  const handleSort = async () => {
    if (!selectedSet) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/sets/sort/${selectedSet}`, { method: 'POST' });
      const data = await res.json();
      setLoadedSetData(data.setsData);
      alert(data.message);
    } catch (_err) { alert('Failed to sort set'); }
  };

  const setAsDefault = async () => {
    if (!selectedSet || !loadedSetData) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/sets/default/${selectedSet}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setsData: loadedSetData })
      });
      const data = await res.json();
      alert(data.message);
    } catch (_err) { alert('Failed to set default'); }
  };

  const handleDuplicateSet = async () => {
    if (!selectedSet) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/sets/duplicate/${selectedSet}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        const listRes = await fetch(`${SERVER_URL}/api/sets`);
        const list = await listRes.json();
        setAvailableSets(list);
        setSelectedSet(data.name);
      } else {
        alert(data.error || 'Failed to duplicate set');
      }
    } catch (_err) {
      alert('Failed to duplicate set');
    }
  };

  const handleAddEmptySet = () => {
    if (!loadedSetData) return;
    const newData = JSON.parse(JSON.stringify(loadedSetData));
    const nextId = Math.max(0, ...[...(newData.drawPile || []), ...(newData.heldSets || []), ...(newData.discardPile || [])].map(s => s.id)) + 1;
    if (!newData.drawPile) newData.drawPile = [];
    newData.drawPile.push({ id: nextId, content: {}, used: false, power: 0, ownerId: null });
    setLoadedSetData(newData);
  };

  const handleClonePawn = (setId, race) => {
    if (!isEditMode) return;
    const newData = JSON.parse(JSON.stringify(loadedSetData));
    const piles = [...(newData.drawPile || []), ...(newData.heldSets || []), ...(newData.discardPile || [])];
    const targetSet = piles.find(s => s.id === setId);
    if (targetSet) {
      targetSet.content[race] = (targetSet.content[race] || 0) + 1;
      const powerMap = newData.power || { vampire: 3, werewolf: 2, ghost: 1, bardak: 1 };
      targetSet.power = Object.entries(targetSet.content).reduce((sum, [r, c]) => sum + (powerMap[r] || 0) * c, 0);
      setLoadedSetData(newData);
    }
  };

  const handleRemovePawn = (setId, race) => {
    if (!isEditMode) return;
    const newData = JSON.parse(JSON.stringify(loadedSetData));
    const piles = [...(newData.drawPile || []), ...(newData.heldSets || []), ...(newData.discardPile || [])];
    const targetSet = piles.find(s => s.id === setId);
    if (targetSet && targetSet.content[race] > 0) {
      targetSet.content[race] -= 1;
      if (targetSet.content[race] === 0) {
        delete targetSet.content[race];
      }
      const powerMap = newData.power || { vampire: 3, werewolf: 2, ghost: 1, bardak: 1 };
      targetSet.power = Object.entries(targetSet.content).reduce((sum, [r, c]) => sum + (powerMap[r] || 0) * c, 0);
      setLoadedSetData(newData);
    }
  };

  const toggleGenForm = () => {
    if (!showGenForm) {
      if (loadedSetData) {
        setGenDisplayName(loadedSetData.displayName || '');
        setGenDescription(loadedSetData.description || '');
        setGenMaxPower(loadedSetData.maxPower || 6);
        setGenPawns(loadedSetData.pawns || { bardak: 80, ghost: 30, werewolf: 20, vampire: 10 });
        setGenPawnsInPlayLimit(loadedSetData.pawnsInPlayLimit || loadedSetData.pawns || { bardak: 80, ghost: 30, werewolf: 20, vampire: 10 });
        setGenPower(loadedSetData.power || { vampire: 3, werewolf: 2, ghost: 1, bardak: 1 });
      } else {
        setGenDisplayName(''); setGenDescription(''); setGenMaxPower(6);
        setGenPawns({ bardak: 80, ghost: 30, werewolf: 20, vampire: 10 });
        setGenPawnsInPlayLimit({ bardak: 80, ghost: 30, werewolf: 20, vampire: 10 });
        setGenPower({ vampire: 3, werewolf: 2, ghost: 1, bardak: 1 });
      }
    }
    setShowGenForm(!showGenForm);
  };

  const onPawnDragStart = (race, fromSetId) => { if (isEditMode) setDraggedPawn({ race, fromSetId }); };
  const onPawnDrop = (toSetId) => {
    if (!isEditMode || !draggedPawn || draggedPawn.fromSetId === toSetId) { setDraggedPawn(null); return; }
    const { race, fromSetId } = draggedPawn;
    const newData = JSON.parse(JSON.stringify(loadedSetData));
    const piles = [...(newData.drawPile || []), ...(newData.heldSets || []), ...(newData.discardPile || [])];
    const sourceSet = piles.find(s => s.id === fromSetId);
    const targetSet = piles.find(s => s.id === toSetId);
    if (sourceSet && targetSet && sourceSet.content[race] > 0) {
      sourceSet.content[race] -= 1; if (sourceSet.content[race] === 0) delete sourceSet.content[race];
      targetSet.content[race] = (targetSet.content[race] || 0) + 1;
      const powerMap = newData.power || { vampire: 3, werewolf: 2, ghost: 1, bardak: 1 };
      const calculatePower = (content) => Object.entries(content).reduce((sum, [r, count]) => sum + (powerMap[r] || 0) * count, 0);
      sourceSet.power = calculatePower(sourceSet.content);
      targetSet.power = calculatePower(targetSet.content);
      setLoadedSetData(newData);
    }
    setDraggedPawn(null);
  };

  return (
    <div className="admin-page-content">
      <div className="admin-actions-bar">
        <select value={selectedSet} onChange={(e) => setSelectedSet(e.target.value)}>
          <option value="">Select Set to Manage...</option>
          {availableSets.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {selectedSet && (
          <>
            <button className="action-button btn-edit-mode" onClick={() => setIsEditMode(!isEditMode)}>{isEditMode ? 'Exit Edit Mode' : 'Edit Mode'}</button>
            <button className="action-button btn-sort" onClick={handleSort}>Sort Set</button>
            <button className="action-button btn-default" onClick={setAsDefault}>Set Default</button>
            <button className="action-button btn-duplicate" onClick={handleDuplicateSet}>Duplicate Set</button>
            {isEditMode && <button className="action-button btn-add" onClick={handleAddEmptySet}>+ Add Empty Set</button>}
            {isEditMode && <button className="action-button btn-save" onClick={handleSaveEdits}>Save Changes</button>}
          </>
        )}
        <button className="action-button btn-create" onClick={toggleGenForm}>{showGenForm ? 'Hide Form' : 'Generate New Set'}</button>
      </div>

      {showGenForm && (
        <form className="generation-form" onSubmit={handleGenerate}>
          <h3>Generate New Set</h3>
          <div className="form-row">
            <div className="form-group"><label>Display Name:</label><input type="text" value={genDisplayName} onChange={e => setGenDisplayName(e.target.value)} /></div>
            <div className="form-group"><label>Max Power:</label><input type="number" value={genMaxPower} onChange={e => setGenMaxPower(parseInt(e.target.value))} /></div>
          </div>
          <div className="form-grid">
            <div><h4>Pawn Totals</h4>{Object.keys(genPawns).map(race => (<div key={race} className="input-row"><label>{race}:</label><input type="number" value={genPawns[race]} onChange={e => setGenPawns({...genPawns, [race]: parseInt(e.target.value)})} /></div>))}</div>
            <div><h4>Play Limits</h4>{Object.keys(genPawnsInPlayLimit).map(race => (<div key={race} className="input-row"><label>{race}:</label><input type="number" value={genPawnsInPlayLimit[race]} onChange={e => setGenPawnsInPlayLimit({...genPawnsInPlayLimit, [race]: parseInt(e.target.value)})} /></div>))}</div>
            <div><h4>Power Config</h4>{Object.keys(genPower).map(race => (<div key={race} className="input-row"><label>{race}:</label><input type="number" value={genPower[race]} onChange={e => setGenPower({...genPower, [race]: parseInt(e.target.value)})} /></div>))}</div>
          </div>
          <button type="submit" className="action-button download-btn">Generate & Save</button>
        </form>
      )}

      {loadedSetData && (
        <div className={`admin-sets-editor ${isEditMode ? 'editing' : ''}`}>
          <div className="editor-section">
            <div className="editor-header-with-stats">
              <h4>Draw Pile ({loadedSetData.drawPile?.length || 0})</h4>
              <div className="set-totals-summary">
                {['vampire', 'werewolf', 'ghost', 'bardak'].map(race => {
                  const total = [...(loadedSetData.drawPile || []), ...(loadedSetData.heldSets || []), ...(loadedSetData.discardPile || [])]
                    .reduce((sum, set) => sum + (set.content[race] || 0), 0);
                  
                  const limits = loadedSetData.pawnsInPlayLimit || loadedSetData.pawns || { bardak: 80, ghost: 30, werewolf: 20, vampire: 10 };

                  return (
                    <div key={race} className="stat-item-group">
                      <div className="stat-item">
                        <div className={`set-icon ${race}`}></div>
                        <span>{total}</span>
                      </div>
                      <div className="limit-display">
                        <label>L:</label>
                        {isEditMode ? (
                          <input 
                            type="number" 
                            value={limits[race]} 
                            onChange={(e) => {
                              const newData = JSON.parse(JSON.stringify(loadedSetData));
                              if (!newData.pawnsInPlayLimit) newData.pawnsInPlayLimit = JSON.parse(JSON.stringify(limits));
                              newData.pawnsInPlayLimit[race] = parseInt(e.target.value);
                              setLoadedSetData(newData);
                            }}
                          />
                        ) : (
                          <span className="limit-value">{limits[race]}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="sets-container">
              {(loadedSetData.drawPile || []).map(set => (
                <EditableSet 
                  key={set.id} 
                  set={set} 
                  isEditMode={isEditMode} 
                  onPawnDragStart={onPawnDragStart} 
                  onPawnDrop={onPawnDrop}
                  onClonePawn={handleClonePawn}
                  onRemovePawn={handleRemovePawn}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

const EditableSet = ({ set, isEditMode, onPawnDragStart, onPawnDrop, onClonePawn, onRemovePawn }) => {
  const racePriority = { vampire: 0, werewolf: 1, ghost: 2, bardak: 3 };
  const allPawns = [];
  Object.entries(set.content).forEach(([race, count]) => { for (let i = 0; i < count; i++) allPawns.push(race); });
  allPawns.sort((a, b) => racePriority[a] - racePriority[b]);

  return (
    <div className="pawn-set editable" onDragOver={(e) => isEditMode && e.preventDefault()} onDrop={() => isEditMode && onPawnDrop(set.id)}>
      <div className="set-header"><span>Set {set.id}</span><span className="power-badge">P: {set.power}</span></div>
      <div className="set-content">
        {allPawns.map((race, index) => (
          <div 
            key={`${race}-${index}`} 
            className={`set-icon ${race} ${isEditMode ? 'draggable' : ''}`} 
            draggable={isEditMode} 
            onDragStart={() => isEditMode && onPawnDragStart(race, set.id)}
            onMouseDown={(e) => { 
              if (e.button !== 0) return;
              if (e.shiftKey) {
                e.stopPropagation();
                onClonePawn(set.id, race);
              } else if (e.ctrlKey || e.metaKey) {
                e.stopPropagation();
                onRemovePawn(set.id, race);
              }
            }}
            title={isEditMode ? "Drag to move | Shift+LPP to clone | Ctrl+LPP to remove" : ""}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default AdminSets;
