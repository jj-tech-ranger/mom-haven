import assert from 'node:assert/strict';
import {getKepiDueItems,getKepiSchedule} from './kepiEngine';

const schedule=getKepiSchedule('2026-01-01',new Date('2026-07-01T00:00:00Z'));
assert.equal(schedule.find(item=>item.id==='opv-1')?.scheduledDate,'2026-02-12');
assert.equal(schedule.find(item=>item.id==='mr-1')?.scheduledDate,'2026-07-02');
assert.equal(schedule.find(item=>item.id==='opv-1')?.recommendedActionDate,'2026-07-01');
const due=getKepiDueItems('2026-01-01',[{vaccine:'OPV',dose:'1st dose'}],new Date('2026-07-01T00:00:00Z'));
assert.equal(due.some(item=>item.id==='opv-1'),false);
assert.equal(due.some(item=>item.id==='mr-1'),true);
console.log('KEPI engine tests passed');
