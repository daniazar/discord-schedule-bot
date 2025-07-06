import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    // Log the request details for debugging
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    console.log('Environment variables check:');
    console.log('DISCORD_PUBLIC_KEY exists:', !!process.env.DISCORD_PUBLIC_KEY);
    console.log('DISCORD_PUBLIC_KEY value:', process.env.DISCORD_PUBLIC_KEY);
    
    if (req.method === 'GET') {
        return res.status(200).json({ 
            message: 'Discord endpoint is reachable',
            hasPublicKey: !!process.env.DISCORD_PUBLIC_KEY,
            publicKey: process.env.DISCORD_PUBLIC_KEY ? 'Set' : 'Missing',
            timestamp: new Date().toISOString(),
            fullPublicKey: process.env.DISCORD_PUBLIC_KEY // Show full key for debugging
        });
    }
    
    if (req.method === 'POST') {
        return res.status(200).json({ 
            message: 'POST request received',
            headers: req.headers,
            hasSignature: !!req.headers['x-signature-ed25519'],
            hasTimestamp: !!req.headers['x-signature-timestamp'],
            signature: req.headers['x-signature-ed25519'],
            timestamp: req.headers['x-signature-timestamp']
        });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
}
