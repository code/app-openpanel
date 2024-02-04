import { Queue } from 'bullmq';

import type { IServiceCreateEventPayload } from '@mixan/db';

import { connection } from './connection';

export interface EventsQueuePayloadCreateEvent {
  type: 'createEvent';
  payload: IServiceCreateEventPayload;
}
export interface EventsQueuePayloadCreateSessionEnd {
  type: 'createSessionEnd';
  payload: Pick<IServiceCreateEventPayload, 'profileId'>;
}
export type EventsQueuePayload =
  | EventsQueuePayloadCreateEvent
  | EventsQueuePayloadCreateSessionEnd;

export interface CronQueuePayload {
  type: 'salt';
  payload: undefined;
}

export const eventsQueue = new Queue<EventsQueuePayload>('events', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 10,
  },
});

export const cronQueue = new Queue<CronQueuePayload>('cron', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 10,
  },
});
