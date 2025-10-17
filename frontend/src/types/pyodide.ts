// Pyodide TypeScript interface definitions
declare global {
  interface Window {
    loadPyodide: () => Promise<PyodideInterface>;
  }
}

export interface PyodideInterface {
  runPython: (code: string) => any;
  runPythonAsync: (code: string) => Promise<any>;
  loadPackage: (names: string | string[]) => Promise<void>;
  loadPackagesFromImports: (code: string) => Promise<void>;
  globals: {
    get: (name: string) => any;
    set: (name: string, value: any) => void;
  };
  registerJsModule: (name: string, module: any) => void;
  unregisterJsModule: (name: string) => void;
  toPy: (obj: any) => any;
  toJs: (obj: any, options?: any) => any;
  isPyProxy: (obj: any) => boolean;
  version: string;
}
