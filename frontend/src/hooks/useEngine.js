import { useEffect, useState } from 'react';
import api from '../api/axios.js';

// Shared, fetched-once view of which Groq model the backend auto-selected.
let engine = null;
let inflight = null;
const listeners = new Set();

function publish(next) {
  engine = next;
  listeners.forEach((fn) => fn(engine));
}

export function refreshEngine() {
  inflight = api
    .get('/model')
    .then(({ data }) => publish(data))
    .catch(() => publish({ configured: false, model: null, offline: true }))
    .finally(() => { inflight = null; });
  return inflight;
}

/** Called after a generation so the UI shows the model that actually answered. */
export function setEngineModel(model) {
  if (!model?.id) return;
  publish({ ...(engine || {}), configured: true, model: model.id, label: model.label });
}

export function useEngine() {
  const [state, setState] = useState(engine);

  useEffect(() => {
    listeners.add(setState);
    if (!engine && !inflight) refreshEngine();
    return () => listeners.delete(setState);
  }, []);

  return state;
}

export function engineLabel(state) {
  if (!state) return 'Connecting…';
  if (!state.configured) return state.offline ? 'Engine offline' : 'Add Groq key';
  return state.label || state.model || 'Auto';
}
