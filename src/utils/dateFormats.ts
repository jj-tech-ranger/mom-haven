const KE_LOCALE='en-KE';
const dateFormatter=new Intl.DateTimeFormat(KE_LOCALE,{day:'numeric',month:'short',year:'numeric'});
const shortDateFormatter=new Intl.DateTimeFormat(KE_LOCALE,{day:'numeric',month:'short'});

export function formatKenyaDate(value:string|Date){const date=value instanceof Date?value:new Date(value);return dateFormatter.format(date)}
export function formatKenyaShortDate(value:string|Date){const date=value instanceof Date?value:new Date(value);return shortDateFormatter.format(date)}
export function ageInDays(dob:string,at=new Date()){return Math.max(0,Math.floor((at.getTime()-new Date(`${dob}T00:00:00`).getTime())/86400000))}
export function formatChildAge(dob:string,date:Date){const days=Math.max(0,Math.floor((date.getTime()-new Date(`${dob}T00:00:00`).getTime())/86400000));if(days<60)return `${days} day${days===1?'':'s'} old`;const months=Math.floor(days/30.4375);if(months<24)return `${months} month${months===1?'':'s'} old`;return `${Math.floor(months/12)} years old`}
