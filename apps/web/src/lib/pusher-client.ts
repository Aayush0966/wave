import PusherClient from 'pusher-js';

const appKey = process.env.NEXT_PUBLIC_PUSHER_KEY;

if (!appKey) {
  throw new Error('NEXT_PUBLIC_PUSHER_KEY is required to initialize Pusher');
}

export const pusherClient = new PusherClient(
  appKey,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  }
);
