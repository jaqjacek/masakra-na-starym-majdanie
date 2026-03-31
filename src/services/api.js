import { SERVER_URL } from '../constants/constants';

const API_BASE = `${SERVER_URL}/api/map`;

export const fetchMap = async (gameId) => {
  const response = await fetch(`${API_BASE}/${gameId}`);
  if (!response.ok) throw new Error('Failed to fetch map');
  return response.json();
};

export const updateMap = async (gameId, board) => {
  const response = await fetch(`${API_BASE}/${gameId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(board),
  });
  if (!response.ok) throw new Error('Failed to update map');
  return response.json();
};

export const resetMap = async (gameId) => {
  const response = await fetch(`${API_BASE}/${gameId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to reset map');
  return response.json();
};
