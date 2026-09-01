import React,{useEffect,useState} from 'react';
import EmergencyFlow from './EmergencyFlow';
import {refreshEmergencyDefaultsCache} from '../lib/emergencyDefaultsCache';
import {AccessibleModal} from './AccessibleModal';
interface EmergencyModalProps{isOpen:boolean;onClose:()=>void;partnerPhone?:string;transportPlan?:string}
export const EmergencyModal:React.FC<EmergencyModalProps>=({isOpen,onClose})=>{const[interceptOpen,setInterceptOpen]=useState(false);useEffect(()=>{const handler=()=>setInterceptOpen(true);window.addEventListener('mom-haven-open-emergency',handler);return()=>window.removeEventListener('mom-haven-open-emergency',handler)},[]);const open=isOpen||interceptOpen;useEffect(()=>{if(open)void refreshEmergencyDefaultsCache().catch(()=>{})},[open]);const close=()=>{setInterceptOpen(false);onClose()};return <AccessibleModal isOpen={open} onClose={close} titleId="emergency-dialog-title" title="Emergency triage and facility locator"><div id="emergency-dialog-title" className="sr-only">Emergency triage and facility locator</div><EmergencyFlow onClose={close}/></AccessibleModal>};
