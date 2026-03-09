const API_BASE = '/api/map';

export const fetchMap = async () => {
  const response = await fetch(API_BASE);
  if (!response.ok) throw new Error('Failed to fetch map');
  return response.json();
};

export const updateMap = async (board) => {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(board),
  });
  if (!response.ok) throw new Error('Failed to update map');
  return response.json();
};

export const resetMap = async () => {
  const response = await fetch(API_BASE, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to reset map');
  return response.json();
};
