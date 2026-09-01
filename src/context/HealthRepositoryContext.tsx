import React,{createContext,useContext} from 'react';
import type { HealthRepository } from '../contracts/healthRepository';
import { firestoreHealthRepository } from '../repositories/firestoreHealthRepository';

const HealthRepositoryContext=createContext<HealthRepository>(firestoreHealthRepository);

export const HealthRepositoryProvider:React.FC<{repository?:HealthRepository;children:React.ReactNode}>=({repository=firestoreHealthRepository,children})=><HealthRepositoryContext.Provider value={repository}>{children}</HealthRepositoryContext.Provider>;

export const useHealthRepository=()=>useContext(HealthRepositoryContext);
