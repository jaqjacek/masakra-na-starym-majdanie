import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'uiLayout';
const QUERY = '(max-width: 768px)';

function readLayout() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'mobile' || value === 'desktop' || value === 'auto') return value;
  } catch {
    /* ignore */
  }
  return 'auto';
}

function getNarrow() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(QUERY).matches;
}

export function computeIsMobileUi(uiLayout, narrow) {
  return uiLayout === 'mobile' || (uiLayout === 'auto' && !!narrow);
}

export function useMobileUi() {
  const [uiLayout, setUiLayoutState] = useState(readLayout);
  const [narrow, setNarrow] = useState(getNarrow);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = () => setNarrow(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setUiLayout = useCallback((mode) => {
    const next = mode === 'mobile' || mode === 'desktop' ? mode : 'auto';
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    setUiLayoutState(next);
  }, []);

  const isMobileUi = computeIsMobileUi(uiLayout, narrow);

  useEffect(() => {
    document.documentElement.classList.toggle('mobile-ui', isMobileUi);
    return () => document.documentElement.classList.remove('mobile-ui');
  }, [isMobileUi]);

  return { isMobileUi, uiLayout, setUiLayout };
}
