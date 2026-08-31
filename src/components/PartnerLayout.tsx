import React,{useState} from 'react';
import {PartnerScreen,PartnerHome,PartnerAppointment,PartnerSupport,PartnerModule,PartnerProfile,PartnerNav} from './PartnerExperience';
interface Props{onOpenEmergency:()=>void}
export const PartnerLayout:React.FC<Props>=({onOpenEmergency})=>{const[s,setS]=useState<PartnerScreen>('home');return <>{s==='home'&&<PartnerHome onAppointment={()=>setS('appointment')} onSupport={()=>setS('support')}/>} {s==='appointment'&&<PartnerAppointment/>} {s==='support'&&<PartnerSupport onModule={()=>setS('module')}/>} {s==='module'&&<PartnerModule/>} {s==='profile'&&<PartnerProfile/>}<PartnerNav screen={s} setScreen={setS} onEmergency={onOpenEmergency}/></>};
