# Discord Schedule Bot

A Discord bot with a web dashboard for managing community schedules and signups. Schedule events by hour with support for both Discord users and non-Discord participants.

## Features

- 🕒 **Hour-based scheduling** - Schedule events by UTC hour (0-23)
- 👥 **Multi-user support** - Add Discord users or non-Discord participants by name
- 📊 **Web dashboard** - Modern web interface for managing schedules
- 🔄 **Real-time sync** - Dashboard and Discord commands stay in sync
- 🌍 **UTC timezone** - All times are in UTC for global coordination
- 📱 **Smart time handling** - Automatically assumes next day for past hours

## Discord Commands

### `/add` - Schedule a signup

Schedule yourself or someone else for a specific time.

**Examples:**
```
/add hour:14
# Schedules you for today at 14:00 UTC (2 PM)

/add hour:0
# If it's currently 3 UTC, schedules you for tomorrow at 00:00 UTC

/add hour:20 day:15
# Schedules you for day 15 at 20:00 UTC (8 PM)

/add hour:9 name:John
# Schedules "John" (non-Discord user) for today at 09:00 UTC
```

**Parameters:**
- `hour` (required): 0-23, representing UTC hour
- `day` (optional): 1-31, day of the month (defaults to today)
- `name` (optional): Name for non-Discord participants (defaults to your Discord username)

### `/remove` - Remove signups

Remove yourself or someone else from scheduled times.

**Examples:**
```
/remove
# Removes you from ALL upcoming signups

/remove hour:14
# Removes you from today at 14:00 UTC

/remove hour:20 day:15
# Removes you from day 15 at 20:00 UTC

/remove hour:9 name:John
# Removes "John" from today at 09:00 UTC
```

**Parameters:**
- `hour` (optional): 0-23, specific hour to remove from
- `day` (optional): 1-31, specific day (only used with hour)
- `name` (optional): Name of non-Discord participant to remove

### `/list` - View current schedule

Display all upcoming signups sorted by day and hour.

**Example:**
```
/list
```

**Sample Output:**
```
**My Schedule**

Upcoming Schedule:
1. @alice - Day 5 at 08:00 Jul 5, 2025 8:00 AM
2. **Bob** - Day 5 at 14:00 Jul 5, 2025 2:00 PM
3. @charlie - Day 5 at 20:00 Jul 5, 2025 8:00 PM
4. **Diana** - Day 6 at 02:00 Jul 6, 2025 2:00 AM
5. @eve - Day 6 at 09:00 Jul 6, 2025 9:00 AM
```

### `/next` - See who's up next

Show the next upcoming signup with time until the event.

**Example:**
```
/next
```

**Sample Output:**
```
**Next up:** @alice
📅 Day 5 at 08:00 (in 2h 15m)
Jul 5, 2025 8:00 AM
```

### `/settitle` - Set list title

Change the title displayed at the top of the schedule list.

**Example:**
```
/settitle title:Daily Streaming Schedule
```

### `/config` - Configure new list

Set up a new schedule list with a title and clear all existing signups.

**Example:**
```
/config title:Weekly Gaming Sessions
```

### `/clear` - Clear everything

Delete all signups and the title for the current channel.

**Example:**
```
/clear
```

## Web Dashboard

Access the web dashboard at your deployed URL to:

- 📋 View all schedule lists across channels
- ✏️ Edit titles and manage signups
- 🔍 Filter by channel or title
- ➕ Add new schedule lists
- 🗑️ Remove signups or entire lists

**Dashboard Features:**
- Real-time sync with Discord bot
- UTC timezone clearly labeled
- Modern, responsive design
- Direct time input with UTC guidance

## Time Handling Logic

### Smart Past Hour Detection
When adding a signup:

- **No day specified + past hour**: Assumes next day
  - Current time: `15:00 UTC`, `/add hour:10` → Tomorrow at `10:00 UTC`
- **Day specified + past time**: Assumes next month
  - Current: Day 20, `/add hour:10 day:15` → Next month day 15 at `10:00 UTC`

### Sorting
All lists are sorted by:
1. **Day** (chronological order)
2. **Hour** within each day (00:00 → 23:00)

## Common Examples

### Daily Gaming Schedule:
```bash
/config title:Daily Gaming Sessions
/add hour:20 name:Alice
/add hour:21
/add hour:22 name:Bob
/list
```

### Weekly Event Planning:
```bash
/settitle title:Weekly Events
/add hour:18 day:1 name:Monday Meeting
/add hour:20 day:3 name:Wednesday Game Night
/add hour:15 day:6 name:Saturday Tournament
```

### Quick Personal Scheduling:
```bash
/add hour:9    # Morning session
/add hour:14   # Afternoon session
/add hour:20   # Evening session
/next          # Check what's coming up
```

## Setup and Deployment

### Prerequisites
- Node.js 18+
- Discord Application with Bot Token
- Supabase project
- Vercel account (for deployment)

### Environment Variables
```env
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_APPLICATION_ID=your_app_id_here
DISCORD_PUBLIC_KEY=your_public_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Local Development
```bash
# Install dependencies
npm install

# Register Discord commands
node scripts/register-commands.js

# Start development server
npm run dev
```

### Supabase Schema

The bot uses two Supabase tables:

**titles**
```sql
CREATE TABLE titles (
  id SERIAL PRIMARY KEY,
  channel_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL
);
```

**signups**
```sql
CREATE TABLE signups (
  id SERIAL PRIMARY KEY,
  guild_id TEXT,
  channel_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  time TIMESTAMP WITH TIME ZONE NOT NULL
);
```

## Setup

1. **Create a Discord App and Bot**

   - Get your `DISCORD_PUBLIC_KEY`, `DISCORD_APPLICATION_ID`, and `DISCORD_BOT_TOKEN`.

2. **Deploy Supabase**

   - Create a project at [supabase.com](https://supabase.com).
   - Create the tables as shown above.
   - Get your `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ANON_KEY`.

3. **Configure Environment Variables**

   - Copy `.env.example` to `.env.local` and fill in the values.

4. **Deploy on Vercel**

   - Push to GitHub and import to [Vercel](https://vercel.com).
   - Set all env variables in your Vercel project.

5. **Register Discord Slash Commands**

   - Run `npm run register-commands` once locally.

6. **Set Discord Interaction Endpoint**

   - In the Discord Developer Portal, set your interaction endpoint to:
     ```
     https://YOUR-VERCEL-DEPLOYMENT.vercel.app/api/discord
     ```

7. **Invite the Bot to your Server**

   - Go to “OAuth2” > “URL Generator” in the Discord Developer Portal.
   - Select `bot` and `applications.commands` scopes.
   - Under Bot Permissions, select `Send Messages`, `Read Message History`.
   - Paste the generated link in your browser, select your server, and authorize.

8. **Access the Dashboard**

   - Go to `/dashboard` on your deployment to view and manage all lists and signups.

## Usage Tips

### For Server Admins
- Use `/config` to set up new schedule lists
- Use `/settitle` to update list names  
- Use `/clear` to reset a channel's schedule

### For Users
- Always specify hours in UTC (0-23)
- Use `/add hour:X name:Someone` to add non-Discord participants
- Use `/list` to check the current schedule
- Use `/next` to see who's up next

### Best Practices
- Establish clear UTC time conventions for your community
- Use descriptive titles like "Daily Streaming Schedule" or "Weekly Raid Times"
- Add non-Discord participants by name for complete scheduling

## Support

For issues or questions about the bot:
1. Check this README for command examples
2. Use `/list` to verify current signups
3. Contact your server administrator

---

**Developed by Daniel Azar**

*All times are in UTC. Discord timestamps will automatically convert to your local timezone.*