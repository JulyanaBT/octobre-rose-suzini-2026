import test from 'node:test';
import assert from 'node:assert/strict';
import {maintenanceKey,maintenanceApplies} from '../maintenance.js';
test('maintenance covers aliases without blocking account and admin recovery',()=>{
 for(const p of ['raquettes','bt','tennis','club-raquettes'])assert.equal(maintenanceKey(p),'raquettes');
 for(const p of ['contacts','flyer','club-infos'])assert.equal(maintenanceKey(p),'infos');
 for(const p of ['admin-maintenance','admin','club-compte','club-parametres','club-reset'])assert.equal(maintenanceKey(p),null);
});
test('selected pages block public; admin always bypasses; Club switch is respected',()=>{
 const settings={pages:['participants'],club_blocked:false};
 assert.equal(maintenanceApplies('participants',settings,null),true);
 assert.equal(maintenanceApplies('accueil',settings,null),false);
 assert.equal(maintenanceApplies('participants',settings,'admin'),false);
 assert.equal(maintenanceApplies('club-participants',settings,'club'),false);
 settings.club_blocked=true;
 assert.equal(maintenanceApplies('club-participants',settings,'club'),true);
 assert.equal(maintenanceApplies('participants',settings,'club'),true);
 assert.equal(maintenanceApplies('club-participants',settings,'admin'),false);
});
