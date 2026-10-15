import React,{createContext,useCallback,useContext,useMemo} from 'react';

/**
 * The User PWA never receives or manages upstream market-provider secrets.
 * Prices are fetched from the Dhahabi backend, which owns provider credentials.
 * This compatibility context remains only because legacy extracted routes import it.
 */
export interface ApiKeyEntry {
 id:string;key:string;label:string;enabled:boolean;
 status:'active'|'quota_exceeded'|'invalid'|'unknown';
 lastUsed:number|null;lastError:string|null;requestCount:number;addedAt:number;
}
interface ApiKeyContextType {
 keys:ApiKeyEntry[];
 addKey:(key:string,label:string)=>void;
 removeKey:(id:string)=>void;
 updateKey:(id:string,updates:Partial<Pick<ApiKeyEntry,'key'|'label'|'enabled'>>)=>void;
 toggleKey:(id:string)=>void;
 getActiveKey:()=>ApiKeyEntry|null;
 markKeyStatus:(id:string,status:ApiKeyEntry['status'],error?:string)=>void;
 rotateToNextKey:(failedKeyId:string)=>ApiKeyEntry|null;
 testKey:(key:string)=>Promise<{valid:boolean;error?:string}>;
 refreshAllStatuses:()=>Promise<void>;
}
const ApiKeyContext=createContext<ApiKeyContextType|undefined>(undefined);

export function ApiKeyProvider({children}:{children:React.ReactNode}){
 const ignore=useCallback(()=>{},[]);
 const none=useCallback(()=>null,[]);
 const testKey=useCallback(async()=>({valid:false,error:'Provider keys are server-managed.'}),[]);
 const refreshAllStatuses=useCallback(async()=>{},[]);
 const value=useMemo<ApiKeyContextType>(()=>({
  keys:[],addKey:ignore,removeKey:ignore,updateKey:ignore,toggleKey:ignore,
  getActiveKey:none,markKeyStatus:ignore,rotateToNextKey:none,testKey,refreshAllStatuses
 }),[ignore,none,testKey,refreshAllStatuses]);
 return <ApiKeyContext.Provider value={value}>{children}</ApiKeyContext.Provider>;
}

export function useApiKeys(){
 const context=useContext(ApiKeyContext);
 if(!context)throw new Error('useApiKeys must be used within ApiKeyProvider');
 return context;
}
