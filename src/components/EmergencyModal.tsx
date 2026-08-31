import React from 'react';
import EmergencyFlow from './EmergencyFlow';
interface EmergencyModalProps{isOpen:boolean;onClose:()=>void;partnerPhone?:string;transportPlan?:string}
export const EmergencyModal:React.FC<EmergencyModalProps>=({isOpen,onClose})=>isOpen?<EmergencyFlow onClose={onClose}/>:null;
