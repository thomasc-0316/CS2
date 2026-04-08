const PERF_GLOBAL_KEY = '__CS2_PERF_MONITOR__';

const isPerfEnabled = () => {
  if (typeof __DEV__ !== 'undefined') {
    return __DEV__ || process.env.NODE_ENV === 'test';
  }
  return process.env.NODE_ENV === 'test';
};

const now = () => {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
};

const createState = () => ({
  sessionStartedAt: now(),
  traceSeq: 0,
  listenerSeq: 0,
  traces: {},
  completedTraces: [],
  renderCounts: {},
  network: {
    totalCalls: 0,
    byOperation: {},
  },
  listeners: {
    active: 0,
    maxActive: 0,
    totalStarted: 0,
    totalStopped: 0,
    byTarget: {},
    activeTokens: {},
  },
});

const getGlobalState = () => {
  if (!globalThis[PERF_GLOBAL_KEY]) {
    globalThis[PERF_GLOBAL_KEY] = createState();
  }
  return globalThis[PERF_GLOBAL_KEY];
};

export const resetPerfMetrics = () => {
  globalThis[PERF_GLOBAL_KEY] = createState();
};

export const startScreenTrace = ({ screen, transition }) => {
  if (!isPerfEnabled()) return null;
  const state = getGlobalState();
  state.traceSeq += 1;
  const traceId = `${screen || 'screen'}-${state.traceSeq}`;
  state.traces[traceId] = {
    id: traceId,
    screen: screen || 'unknown',
    transition: transition || null,
    startedAt: now(),
    firstContentAt: null,
    dataReadyAt: null,
    endedAt: null,
  };
  return traceId;
};

export const markScreenFirstContent = (traceId) => {
  if (!isPerfEnabled() || !traceId) return;
  const state = getGlobalState();
  const trace = state.traces[traceId];
  if (!trace || trace.firstContentAt !== null) return;
  trace.firstContentAt = now();
};

export const markScreenDataReady = (traceId) => {
  if (!isPerfEnabled() || !traceId) return;
  const state = getGlobalState();
  const trace = state.traces[traceId];
  if (!trace || trace.dataReadyAt !== null) return;
  trace.dataReadyAt = now();
};

export const endScreenTrace = (traceId) => {
  if (!isPerfEnabled() || !traceId) return;
  const state = getGlobalState();
  const trace = state.traces[traceId];
  if (!trace) return;
  trace.endedAt = now();
  state.completedTraces.push({
    ...trace,
    firstContentMs:
      trace.firstContentAt !== null ? Math.max(0, trace.firstContentAt - trace.startedAt) : null,
    dataReadyMs:
      trace.dataReadyAt !== null ? Math.max(0, trace.dataReadyAt - trace.startedAt) : null,
    lifetimeMs:
      trace.endedAt !== null ? Math.max(0, trace.endedAt - trace.startedAt) : null,
  });
  delete state.traces[traceId];
};

export const trackRender = (componentName) => {
  if (!isPerfEnabled()) return;
  const state = getGlobalState();
  const key = componentName || 'unknown-component';
  state.renderCounts[key] = (state.renderCounts[key] || 0) + 1;
};

export const trackNetworkCall = (operation, target = 'unknown') => {
  if (!isPerfEnabled()) return;
  const state = getGlobalState();
  const key = `${operation}:${target}`;
  state.network.totalCalls += 1;
  state.network.byOperation[key] = (state.network.byOperation[key] || 0) + 1;
};

export const beginListener = (target = 'unknown') => {
  if (!isPerfEnabled()) return null;
  const state = getGlobalState();
  state.listenerSeq += 1;
  const token = `listener-${state.listenerSeq}`;
  state.listeners.activeTokens[token] = target;
  state.listeners.active += 1;
  state.listeners.totalStarted += 1;
  state.listeners.maxActive = Math.max(state.listeners.maxActive, state.listeners.active);
  state.listeners.byTarget[target] = (state.listeners.byTarget[target] || 0) + 1;
  return token;
};

export const endListener = (token) => {
  if (!isPerfEnabled() || !token) return;
  const state = getGlobalState();
  if (!state.listeners.activeTokens[token]) return;
  delete state.listeners.activeTokens[token];
  state.listeners.active = Math.max(0, state.listeners.active - 1);
  state.listeners.totalStopped += 1;
};

export const getPerfMetrics = () => {
  const state = getGlobalState();
  return JSON.parse(
    JSON.stringify({
      sessionStartedAt: state.sessionStartedAt,
      completedTraces: state.completedTraces,
      activeTraces: Object.values(state.traces),
      renderCounts: state.renderCounts,
      network: state.network,
      listeners: {
        active: state.listeners.active,
        maxActive: state.listeners.maxActive,
        totalStarted: state.listeners.totalStarted,
        totalStopped: state.listeners.totalStopped,
        byTarget: state.listeners.byTarget,
      },
    }),
  );
};

export const perfEnabled = isPerfEnabled;
