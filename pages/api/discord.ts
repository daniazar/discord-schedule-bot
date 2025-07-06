import { NextApiRequest, NextApiResponse } from 'next';
import nacl from 'tweetnacl';
import { supabase } from '../../lib/supabase';

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;

export const config = { api: { bodyParser: false } };

async function getRawBody(req: any): Promise<Buffer> {
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

function verifyDiscordRequest(req: NextApiRequest, rawBody: Buffer): boolean {
    const signature = req.headers['x-signature-ed25519'] as string;
    const timestamp = req.headers['x-signature-timestamp'] as string;
    if (!signature || !timestamp) return false;
    return nacl.sign.detached.verify(
        Buffer.from(timestamp + rawBody.toString('utf8')),
        Buffer.from(signature, 'hex'),
        Buffer.from(DISCORD_PUBLIC_KEY, 'hex')
    );
}

function isoToDiscordTimestamp(time: string) {
    return `<t:${Math.floor(new Date(time).getTime() / 1000)}:f>`;
}

// Fetch channel name using Discord API
async function getChannelName(channel_id: string) {
    const resp = await fetch(`https://discord.com/api/v10/channels/${channel_id}`, {
        headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` }
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.name || null;
}

// Ensure title exists for this channel, creating it if needed
async function ensureChannelTitle(channel_id: string) {
    const { data: titleRow } = await supabase
        .from('titles')
        .select('title')
        .eq('channel_id', channel_id)
        .maybeSingle();
    if (titleRow?.title) return titleRow.title;

    // No title: fetch channel name from Discord, set as title
    const name = await getChannelName(channel_id);
    if (!name) return null;
    await supabase
        .from('titles')
        .upsert({ channel_id, title: name }, { onConflict: 'channel_id' });
    return name;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('Discord webhook received:', {
        method: req.method,
        hasPublicKey: !!DISCORD_PUBLIC_KEY,
        publicKeyLength: DISCORD_PUBLIC_KEY?.length,
        hasSignature: !!req.headers['x-signature-ed25519'],
        hasTimestamp: !!req.headers['x-signature-timestamp']
    });

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const rawBody = await getRawBody(req);
    let body;
    try {
        body = JSON.parse(rawBody.toString('utf8'));
    } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON' });
    }

    if (!verifyDiscordRequest(req, rawBody)) {
        return res.status(401).send('Invalid request signature');
    }

    const { type, data, member, channel_id, guild_id, user } = body;

    // Discord ping-pong for verification
    if (type === 1) return res.status(200).json({ type: 1 });

    // Slash commands
    if (type === 2) {
        const command = data.name;
        // Always ensure title exists for this channel (creates with channel name if missing)
        await ensureChannelTitle(channel_id);

        if (command === 'add') {
            const time = data.options[0].value;
            const signupTime = new Date(time);
            if (isNaN(signupTime.getTime()) || signupTime < new Date()) {
                return res.status(200).json({
                    type: 4,
                    data: { content: 'Please provide a valid future time in ISO8601 format (e.g. 2025-07-06T19:00:00Z).' },
                });
            }
            const { data: exists } = await supabase
                .from('signups')
                .select('*')
                .eq('channel_id', channel_id)
                .eq('time', time)
                .maybeSingle();
            if (exists) {
                return res.status(200).json({
                    type: 4,
                    data: { content: 'That time is already booked in this channel!' },
                });
            }
            await supabase.from('signups').insert([
                {
                    guild_id,
                    channel_id,
                    user_id: user?.id || member.user.id,
                    username: user?.username || member.user.username,
                    time,
                }
            ]);
            return res.status(200).json({
                type: 4,
                data: { content: `You have been added at ${isoToDiscordTimestamp(time)}.` }
            });
        }

        if (command === 'remove') {
            await supabase
                .from('signups')
                .delete()
                .eq('channel_id', channel_id)
                .eq('user_id', user?.id || member.user.id)
                .gte('time', new Date().toISOString());
            return res.status(200).json({
                type: 4,
                data: { content: 'You have been removed from all upcoming slots for this channel.' }
            });
        }

        if (command === 'list') {
            await supabase
                .from('signups')
                .delete()
                .eq('channel_id', channel_id)
                .lt('time', new Date().toISOString());

            const { data: titleRow } = await supabase
                .from('titles')
                .select('title')
                .eq('channel_id', channel_id)
                .maybeSingle();

            const { data: signups } = await supabase
                .from('signups')
                .select('*')
                .eq('channel_id', channel_id)
                .gte('time', new Date().toISOString())
                .order('time', { ascending: true });

            let content = '';
            if (titleRow) content += `**${titleRow.title}**\n`;
            if (!signups || signups.length === 0) {
                content += '_No signups for upcoming times._';
            } else {
                content += signups.map(
                    s => `• <@${s.user_id}> at ${isoToDiscordTimestamp(s.time)}`
                ).join('\n');
            }
            return res.status(200).json({
                type: 4,
                data: { content }
            });
        }

        if (command === 'next') {
            const now = new Date();
            const { data: signups } = await supabase
                .from('signups')
                .select('*')
                .eq('channel_id', channel_id)
                .order('time', { ascending: true });

            if (!signups || signups.length === 0) {
                return res.status(200).json({
                    type: 4,
                    data: { content: 'No signups in this channel.' }
                });
            }

            // Find the signup with the closest time to now (future or past)
            let closest = signups[0];
            let minDiff = Math.abs(new Date(signups[0].time).getTime() - now.getTime());
            for (const s of signups) {
                const diff = Math.abs(new Date(s.time).getTime() - now.getTime());
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = s;
                }
            }

            return res.status(200).json({
                type: 4,
                data: { content: `Next up: <@${closest.user_id}> at ${isoToDiscordTimestamp(closest.time)}` }
            });
        }

        if (command === 'settitle') {
            const title = data.options[0].value;
            await supabase
                .from('titles')
                .upsert({ channel_id, title }, { onConflict: 'channel_id' });
            return res.status(200).json({
                type: 4,
                data: { content: `List title set to: **${title}**` }
            });
        }

        if (command === 'config') {
            const title = data.options[0].value;
            // Upsert the title (overwrite if exists)
            await supabase
                .from('titles')
                .upsert({ channel_id, title }, { onConflict: 'channel_id' });
            // Clear all signups for this channel
            await supabase
                .from('signups')
                .delete()
                .eq('channel_id', channel_id);
            return res.status(200).json({
                type: 4,
                data: { content: `Configuration set! New list title: **${title}** and all previous signups were cleared.` }
            });
        }

        if (command === 'clear') {
            // Delete all signups and title for this channel
            await supabase
                .from('signups')
                .delete()
                .eq('channel_id', channel_id);
            await supabase
                .from('titles')
                .delete()
                .eq('channel_id', channel_id);
            return res.status(200).json({
                type: 4,
                data: { content: 'All signups and the title for this channel have been deleted.' }
            });
        }

        return res.status(200).json({ type: 4, data: { content: 'Unknown command.' } });
    }

    return res.status(400).json({ error: 'Bad request' });
}