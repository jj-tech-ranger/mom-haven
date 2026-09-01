import type {ComponentType} from 'react';
export {DANGER_SIGNS,DANGER_SIGN_PATTERNS,SELF_HARM_OR_VIOLENCE_PATTERNS,POSITIVE_TEST_CONTEXT,classifyLayerOne,matchesPositivePregnancyTestContext} from '../../shared/safety/dangerSignTriage';
export type {DangerSign,DangerSignCategory,LayerOneResult} from '../../shared/safety/dangerSignTriage';
export type DangerSignIcon=ComponentType<{className?:string}>;
