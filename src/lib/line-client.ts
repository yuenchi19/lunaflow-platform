
import { Client } from '@line/bot-sdk';

const clientConfig = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// Create a client only if tokens are present to avoid build crashes locally if missing
export const lineClient = process.env.LINE_CHANNEL_ACCESS_TOKEN
    ? new Client(clientConfig)
    : null;
