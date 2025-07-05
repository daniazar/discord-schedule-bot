import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type TitleRow = { channel_id: string; title: string; id: number };
type SignupRow = {
    id: number;
    channel_id: string;
    user_id: string;
    username: string;
    time: string;
};

function isoLocal(dt: string) {
    const d = new Date(dt);
    return d.toLocaleString();
}

export default function Dashboard() {
    const [titles, setTitles] = useState<TitleRow[]>([]);
    const [signups, setSignups] = useState<SignupRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [editTitle, setEditTitle] = useState<{ [key: string]: string }>({});
    const [addSignup, setAddSignup] = useState<{ [key: string]: { username: string; time: string } }>({});
    const [channelFilter, setChannelFilter] = useState("");

    async function fetchData() {
        setLoading(true);
        const { data: t } = await supabase.from("titles").select("*").order("title");
        const { data: s } = await supabase.from("signups").select("*").order("time");
        setTitles(t || []);
        setSignups(s || []);
        setLoading(false);
    }

    useEffect(() => { fetchData(); }, []);

    async function handleTitleSave(channel_id: string) {
        const newTitle = editTitle[channel_id];
        await supabase.from("titles").upsert({ channel_id, title: newTitle });
        setEditTitle((prev) => ({ ...prev, [channel_id]: "" }));
        fetchData();
    }

    async function handleTitleDelete(channel_id: string) {
        if (!window.confirm("Delete this list and all its signups?")) return;
        await supabase.from("titles").delete().eq("channel_id", channel_id);
        await supabase.from("signups").delete().eq("channel_id", channel_id);
        fetchData();
    }

    async function handleSignupAdd(channel_id: string) {
        const { username, time } = addSignup[channel_id] || {};
        if (!username || !time) return;
        await supabase.from("signups").insert([{ channel_id, username, user_id: username, time }]);
        setAddSignup((prev) => ({ ...prev, [channel_id]: { username: "", time: "" } }));
        fetchData();
    }

    async function handleSignupRemove(signup_id: number) {
        await supabase.from("signups").delete().eq("id", signup_id);
        fetchData();
    }

    async function handleAddList() {
        const newChannelId = prompt("Enter a unique channel_id (any string; e.g. test-channel):");
        const newTitle = prompt("Enter title for the new list:");
        if (!newChannelId || !newTitle) return;
        await supabase.from("titles").insert([{ channel_id: newChannelId, title: newTitle }]);
        fetchData();
    }

    const filteredTitles = channelFilter
        ? titles.filter((t) => t.channel_id.includes(channelFilter) || t.title.includes(channelFilter))
        : titles;

    return (
        <div style= {{ maxWidth: 900, margin: "auto", padding: 24 }
}>
    <h1>Discord Schedule Dashboard </h1>
        < button onClick = { handleAddList } > + New List </button>
            < input
type = "text"
placeholder = "Filter by channel or title"
style = {{ marginLeft: 16, marginBottom: 16 }}
value = { channelFilter }
onChange = {(e) => setChannelFilter(e.target.value)}
      />
{ loading ? <p>Loading…</p> : null }
{
    filteredTitles.map((title) => (
        <div key= { title.channel_id } style = {{ border: "1px solid #ccc", borderRadius: 8, margin: "22px 0", padding: 18 }}>
            <div style={ { display: "flex", alignItems: "center" } }>
                <strong style={ { fontSize: 20 } }> { title.title } </strong>
                    < span style = {{ marginLeft: 12, color: "#888" }}> ({ title.channel_id }) </span>
                        < button style = {{ marginLeft: 16 }} onClick = {() => setEditTitle(t => ({ ...t, [title.channel_id]: title.title }))}> Edit Title </button>
                            < button style = {{ marginLeft: 6, color: "red" }} onClick = {() => handleTitleDelete(title.channel_id)}> Delete List </button>
                                </div>
{
    editTitle[title.channel_id] !== undefined && (
        <div style={ { margin: "8px 0" } }>
            <input
                type="text"
    value = { editTitle[title.channel_id]}
    onChange = {
        e =>
        setEditTitle(t => ({ ...t, [title.channel_id]: e.target.value }))
}
style = {{ marginRight: 8 }}
              />
    < button onClick = {() => handleTitleSave(title.channel_id)}> Save </button>
        < button onClick = {() => setEditTitle(t => { const nt = { ...t }; delete nt[title.channel_id]; return nt; })}> Cancel </button>
            </div>
          )}
<table style={ { width: "100%", marginTop: 14, borderCollapse: "collapse" } }>
    <thead>
    <tr>
    <th align="left" > Time(UTC) </th>
        < th align = "left" > User </th>
            < th > </th>
            </tr>
            </thead>
            <tbody>
{
    signups.filter(s => s.channel_id === title.channel_id).map(s => (
        <tr key= { s.id } >
        <td>{ isoLocal(s.time)
} </td>
    < td > { s.username } </td>
    < td >
    <button onClick={ () => handleSignupRemove(s.id) }> Remove </button>
        </td>
        </tr>
              ))}
<tr>
    <td>
    <input
                    type="datetime-local"
value = { addSignup[title.channel_id]?.time || "" }
onChange = {
    e =>
    setAddSignup(s => ({
        ...s,
        [title.channel_id]: {
            ...s[title.channel_id],
            time: e.target.value,
        },
    }))
                    }
                  />
    </td>
    < td >
    <input
                    type="text"
placeholder = "Username"
value = { addSignup[title.channel_id]?.username || "" }
onChange = {
    e =>
    setAddSignup(s => ({
        ...s,
        [title.channel_id]: {
            ...s[title.channel_id],
            username: e.target.value,
        },
    }))
                    }
                  />
    </td>
    < td >
    <button onClick={ () => handleSignupAdd(title.channel_id) }> Add </button>
        </td>
        </tr>
        </tbody>
        </table>
        </div>
      ))}
{ !filteredTitles.length && !loading && <div>No lists found.</div> }
<footer style={ { marginTop: 40, color: "#888", fontSize: 13 } }>
    Open dashboard – all changes are live in Supabase and Discord bot
        </footer>
        </div>
  );
}