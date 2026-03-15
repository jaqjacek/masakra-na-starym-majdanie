import React, { useState, useEffect, useCallback } from 'react';
import SetsPanel from './SetsPanel';
import { PAWN_TYPES } from '../constants/pawnTypes';
import { VERSION_INFO } from '../constants/version';

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
  const [genPower, setGenPower] = useState({ vampire: 3, werewolf: 2, ghost: 1, bardak: 1 });

  useEffect(() => { fetchSets(); }, []);
  useEffect(() => {
    if (selectedSet) fetchSetDetails(selectedSet);
    else { setLoadedSetData(null); setIsEditMode(false); }
  }, [selectedSet]);

  const fetchSets = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/sets');
      const list = await res.json();
      setAvailableSets(list);
    } catch (err) { console.error(err); }
  };

  const fetchSetDetails = async (setName) => {
    try {
      const res = await fetch(`http://localhost:3001/api/sets/details/${setName}`);
      const data = await res.json();
      setLoadedSetData(data);
    } catch (err) { console.error(err); }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/api/sets/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: genDisplayName, description: genDescription, pawns: genPawns, power: genPower, maxPower: genMaxPower })
      });
      const result = await response.json();
      setShowGenForm(false); fetchSets();
      alert(`Set generated: ${result.name}`);
    } catch (err) { alert('Failed to generate set'); }
  };

  const handleSaveEdits = async () => {
    if (!selectedSet || !loadedSetData) return;
    try {
      const res = await fetch(`http://localhost:3001/api/sets/save/${selectedSet}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setsData: loadedSetData })
      });
      const data = await res.json();
      alert(data.message);
      setIsEditMode(false);
    } catch (err) { alert('Failed to save set'); }
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
      const calculatePower = (content) => Object.entries(content).reduce((sum, [r, count]) => sum + ((newData.power || {vampire:3,werewolf:2,ghost:1,bardak:1})[r] || 0) * count, 0);
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
          <><button className="action-button" style={{ backgroundColor: '#9b59b6' }} onClick={() => setIsEditMode(!isEditMode)}>{isEditMode ? 'Exit Edit Mode' : 'Edit Set (Drag Pawns)'}</button>
          {isEditMode && <button className="action-button" style={{ backgroundColor: '#27ae60' }} onClick={handleSaveEdits}>Save Changes</button>}</>
        )}
        <button className="action-button download-btn" onClick={() => setShowGenForm(!showGenForm)}>{showGenForm ? 'Hide Form' : 'Generate New Set'}</button>
      </div>

      {showGenForm && (
        <form className="generation-form" onSubmit={handleGenerate}>
          <h3>Generate New Predefined Set</h3>
          <div className="form-row"><div className="form-group"><label>Display Name:</label><input type="text" value={genDisplayName} onChange={e => setGenDisplayName(e.target.value)} /></div>
          <div className="form-group"><label>Max Power:</label><input type="number" value={genMaxPower} onChange={e => setGenMaxPower(parseInt(e.target.value))} /></div></div>
          <div className="form-grid">
            <div><h4>Pawn Totals</h4>{Object.keys(genPawns).map(race => (<div key={race} className="input-row"><label>{race}:</label><input type="number" value={genPawns[race]} onChange={e => setGenPawns({...genPawns, [race]: parseInt(e.target.value)})} /></div>))}</div>
            <div><h4>Power Config</h4>{Object.keys(genPower).map(race => (<div key={race} className="input-row"><label>{race}:</label><input type="number" value={genPower[race]} onChange={e => setGenPower({...genPower, [race]: parseInt(e.target.value)})} /></div>))}</div>
          </div>
          <button type="submit" className="action-button download-btn">Generate & Save</button>
        </form>
      )}

      {loadedSetData && (
        <div className={`admin-sets-editor ${isEditMode ? 'editing' : ''}`}>
          <div className="editor-section">
            <h4>Draw Pile ({loadedSetData.drawPile?.length || 0})</h4>
            <div className="sets-container">
              {(loadedSetData.drawPile || []).map(set => (
                <EditableSet key={set.id} set={set} isEditMode={isEditMode} onPawnDragStart={onPawnDragStart} onPawnDrop={onPawnDrop} />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="landing-footnote">
        <span>{VERSION_INFO.branch}</span>
        <span>{VERSION_INFO.tag}</span>
        <span>#{VERSION_INFO.hash}</span>
        <span>{VERSION_INFO.date} {VERSION_INFO.time}</span>
      </div>
    </div>
  );
};

const EditableSet = ({ set, isEditMode, onPawnDragStart, onPawnDrop }) => {
  const racePriority = { vampire: 0, werewolf: 1, ghost: 2, bardak: 3 };
  
  // Create a flat array of all pawns in the set
  const allPawns = [];
  Object.entries(set.content).forEach(([race, count]) => {
    for (let i = 0; i < count; i++) {
      allPawns.push(race);
    }
  });

  // Sort by priority V > W > G > B
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
          ></div>
        ))}
      </div>
    </div>
  );
};

export default AdminSets;
