import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {BASE_URL} from '@env';
import {ApiClient} from '../api/client';
import {worker, WorkerState} from '../worker/worker';
import {startWorker, stopWorker} from '../worker/foregroundService';
import {
  AppConfig,
  clearAll,
  getWorkerEnabled,
  loadConfig,
  saveConfig,
} from '../storage/config';

const DEFAULT_BASE_URL = BASE_URL ?? 'http://192.168.1.10:4008';

interface AppContextValue {
  ready: boolean;
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  config: AppConfig | null;
  workerState: WorkerState;

  unpair: () => Promise<void>;
  /** Claim a device by its code and make it the active worker device. */
  selectDevice: (code: string) => Promise<void>;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

const Ctx = createContext<AppContextValue | undefined>(undefined);

export function AppStateProvider({children}: {children: React.ReactNode}) {
  const [ready, setReady] = useState(false);
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [workerState, setWorkerState] = useState<WorkerState>(worker.getState());

  useEffect(() => {
    const unsub = worker.subscribe(setWorkerState);
    (async () => {
      await worker.init();
      const savedConfig = await loadConfig();
      if (savedConfig) setBaseUrl(savedConfig.baseUrl);
      setConfig(savedConfig);
      // Auto-resume the worker if a device was active and running.
      if (savedConfig && (await getWorkerEnabled())) {
        await worker.configure(savedConfig);
        await startWorker();
      }
      setReady(true);
    })();
    return unsub;
  }, []);

  const unpair = useCallback(async () => {
    await stopWorker();
    await clearAll();
    await worker.clear();
    setConfig(null);
  }, []);

  /** Shared: claim a code → persist device config → point the worker at it. */
  const activateDevice = useCallback(
    async (code: string) => {
      const res = await ApiClient.claim(baseUrl, code);
      const cfg: AppConfig = {
        baseUrl,
        token: res.token,
        deviceId: res.device.deviceId,
        deviceName: res.device.name,
        sendLimitPerMinute: res.device.sendLimitPerMinute ?? 60,
      };
      await saveConfig(cfg);
      await worker.configure(cfg);
      await worker.resetCounters();
      setConfig(cfg);
    },
    [baseUrl],
  );

  const selectDevice = useCallback((code: string) => activateDevice(code), [activateDevice]);

  const start = useCallback(async () => {
    await startWorker();
  }, []);

  const stop = useCallback(async () => {
    await stopWorker();
  }, []);

  return (
    <Ctx.Provider
      value={{
        ready,
        baseUrl,
        setBaseUrl,
        config,
        workerState,
        unpair,
        selectDevice,
        start,
        stop,
      }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAppState(): AppContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return ctx;
}
