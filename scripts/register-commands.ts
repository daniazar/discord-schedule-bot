import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const TOKEN = process.env.DISCORD_BOT_TOKEN!;
const CLIENT_ID = process.env.DISCORD_APPLICATION_ID!;

const commands = [
    {
        name: 'add',
        description: 'Sign up for a specific time (ISO 8601, e.g. 2025-07-06T19:00:00Z)',
        options: [
            {
                name: 'time',
                description: 'Time (ISO 8601 UTC, e.g. 2025-07-06T19:00:00Z)',
                type: 3, // STRING
                required: true,
            },
        ],
    },
    {
        name: 'remove',
        description: 'Remove yourself from the list',
    },
    {
        name: 'list',
        description: 'Show the current and next signups',
    },
    {
        name: 'settitle',
        description: 'Set the title for the signup list',
        options: [
            {
                name: 'title',
                description: 'Title',
                type: 3, // STRING
                required: true,
            },
        ],
    },
    {
        name: 'config',
        description: 'Configure a new list for this channel with a title (and clear all signups)',
        options: [
            {
                name: 'title',
                description: 'Title for the list',
                type: 3, // STRING
                required: true,
            },
        ],
    },
    {
        name: 'clear',
        description: 'Delete all signups and the title for this channel',
    },
    {
        name: 'next',
        description: 'Tag the user whose time is starting or closest to now',
    },
];

async function main() {
    const response = await fetch(
        `https://discord.com/api/v10/applications/${CLIENT_ID}/commands`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `Bot ${TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(commands),
        }
    );
    if (response.ok) {
        console.log('Commands registered');
    } else {
        console.error('Error:', await response.text());
    }
}
main();