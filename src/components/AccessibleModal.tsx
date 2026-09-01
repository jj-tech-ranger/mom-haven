import React, { useEffect, useRef } from 'react';

interface AccessibleModalProps { isOpen:boolean; onClose:()=>void; titleId:string; title:string; children:React.ReactNode }
const FOCUSABLE='button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
export const AccessibleModal:React.FC<AccessibleModalProps>=({isOpen,onClose,titleId,title,children})=>{
 const modalRef=useRef<HTMLDivElement>(null); const triggerRef=useRef<HTMLElement|null>(null);
 useEffect(()=>{if(!isOpen)return; triggerRef.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const frame=requestAnimationFrame(()=>modalRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus());
  const onKeyDown=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();onClose();return} if(e.key!=='Tab')return; const nodes=Array.from(modalRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)??[]); if(!nodes.length){e.preventDefault();return} const first=nodes[0],last=nodes[nodes.length-1]; if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}};
  document.addEventListener('keydown',onKeyDown); return()=>{cancelAnimationFrame(frame);document.removeEventListener('keydown',onKeyDown);triggerRef.current?.focus()};
 },[isOpen,onClose]);
 if(!isOpen)return null; return <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="contents"><h2 id={titleId} className="sr-only">{title}</h2>{children}</div>;
};
