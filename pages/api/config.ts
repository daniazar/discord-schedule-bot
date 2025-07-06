import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Return the public configuration that the client needs
    res.status(200).json({
        supabaseUrl: process.env.SUPABASE_URL2_SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_URL2_NEXT_PUBLIC_SUPABASE_ANON_KEY
    });
}
