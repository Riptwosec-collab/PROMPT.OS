'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { streamAiRun } from '../../lib/ai/run-stream.mjs';
import { createRunState, reduceRunState } from '../../lib/ai/run-state.mjs';

export default function usePromptRun({ runner = streamAiRun, provider = 'openai', model } = {}) {
  const [state, dispatch] = useReducer(reduceRunState, undefined, createRunState);
  const controllerRef = useRef(null);

  const stop = useCallback(() => {
    const controller = controllerRef.current;
    if (!controller) return;
    controllerRef.current = null;
    controller.abort();
    dispatch({ type: 'stop' });
  }, []);

  const reset = useCallback(() => {
    const controller = controllerRef.current;
    if (controller) controller.abort();
    controllerRef.current = null;
    dispatch({ type: 'reset' });
  }, []);

  const run = useCallback(async ({ prompt } = {}) => {
    const previous = controllerRef.current;
    if (previous) previous.abort();

    const controller = new AbortController();
    controllerRef.current = controller;
    dispatch({ type: 'prepare', startedAt: Date.now() });
    dispatch({ type: 'start' });

    try {
      await runner({
        provider,
        model,
        prompt,
        signal: controller.signal,
        onDelta: (delta) => {
          if (controllerRef.current === controller && !controller.signal.aborted) {
            dispatch({ type: 'delta', delta });
          }
        },
        onMeta: (meta) => {
          if (controllerRef.current === controller && !controller.signal.aborted) {
            dispatch({ type: 'meta', meta });
          }
        },
      });

      if (controllerRef.current === controller && !controller.signal.aborted) {
        controllerRef.current = null;
        dispatch({ type: 'complete' });
      }
    } catch (error) {
      if (controller.signal.aborted || error?.name === 'AbortError') {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
          dispatch({ type: 'stop' });
        }
        return;
      }

      if (controllerRef.current === controller) {
        controllerRef.current = null;
        dispatch({ type: 'fail', error: error?.message || 'Run failed' });
      }
    }
  }, [model, provider, runner]);

  useEffect(() => () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  return { state, run, stop, reset };
}
