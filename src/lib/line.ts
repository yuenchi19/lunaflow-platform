import crypto from 'crypto';

interface LineMessage {
    to: string;
    messages: any[];
}

export class LineClient {
    private channelAccessToken: string;
    private channelSecret: string;

    constructor(token: string, secret: string) {
        this.channelAccessToken = token;
        this.channelSecret = secret;
    }

    async pushMessage(userId: string, messages: any[]) {
        const res = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.channelAccessToken}`
            },
            body: JSON.stringify({
                to: userId,
                messages: messages
            })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(`LINE API Error: ${JSON.stringify(error)}`);
        }
        return res.json();
    }

    // Verify Webhook Signature
    verifySignature(body: string, signature: string): boolean {
        const hash = crypto
            .createHmac('sha256', this.channelSecret)
            .update(body)
            .digest('base64');
        return hash === signature;
    }
}

// Singleton instance
export const lineClient = new LineClient(
    process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    process.env.LINE_CHANNEL_SECRET || ''
);
