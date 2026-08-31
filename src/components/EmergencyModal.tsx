import React,{useEffect,useState} from 'react';
import EmergencyFlow from './EmergencyFlow';
interface EmergencyModalProps{isOpen:boolean;onClose:()=>void;partnerPhone?:string;transportPlan?:string}
export const EmergencyModal:React.FC<EmergencyModalProps>=({isOpen,onClose})=>{const[interceptOpen,setInterceptOpen]=useState(false);useEffect(()=>{const handler=()=>setInterceptOpen(true);window.addEventListener('mom-haven-open-emergency',handler);return()=>window.removeEventListener('mom-haven-open-emergency',handler)},[]);const open=isOpen||interceptOpen;return open?<EmergencyFlow onClose={()=>{setInterceptOpen(false);onClose()}}/>:null};
