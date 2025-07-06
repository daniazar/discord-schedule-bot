import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// We'll initialize this after fetching config
let supabase: any = null;

type TitleRow = { channel_id: string; title: string; id: number };
type SignupRow = {
    id: number;
    channel_id: string;
    user_id: string;
    username: string;
    time: string;
};

function formatUtcTime(dt: string) {
    const d = new Date(dt);
    const utcHour = d.getUTCHours();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[d.getUTCDay()];
    return `${utcHour.toString().padStart(2, '0')}:00 UTC (${dayName})`;
}

const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
    },
    header: {
        textAlign: 'center' as const,
        marginBottom: '32px',
    },
    title: {
        fontSize: '2.5rem',
        fontWeight: '700',
        color: '#1e293b',
        margin: '0 0 8px 0',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
    },
    subtitle: {
        fontSize: '1.1rem',
        color: '#64748b',
        margin: '0',
        fontWeight: '400',
    },
    controls: {
        display: 'flex',
        gap: '16px',
        marginBottom: '32px',
        alignItems: 'center',
        flexWrap: 'wrap' as const,
    },
    primaryButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 20px',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
    },
    buttonIcon: {
        fontSize: '16px',
        fontWeight: 'bold',
    },
    searchInput: {
        padding: '12px 16px',
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '14px',
        minWidth: '300px',
        transition: 'border-color 0.2s ease',
        outline: 'none',
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
    },
    loadingState: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        padding: '40px',
        color: '#64748b',
    },
    loadingText: {
        marginTop: '16px',
        fontSize: '16px',
        color: '#64748b',
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '4px solid #e2e8f0',
        borderTop: '4px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e2e8f0',
        transition: 'box-shadow 0.2s ease',
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap' as const,
        gap: '12px',
    },
    cardTitle: {
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#1e293b',
        margin: '0',
    },
    channelId: {
        color: '#64748b',
        fontSize: '14px',
        fontWeight: '500',
        backgroundColor: '#f1f5f9',
        padding: '4px 8px',
        borderRadius: '6px',
    },
    button: {
        padding: '8px 16px',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    editButton: {
        backgroundColor: '#f59e0b',
        color: 'white',
    },
    deleteButton: {
        backgroundColor: '#ef4444',
        color: 'white',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        marginTop: '16px',
    },
    tableHeader: {
        backgroundColor: '#f8fafc',
        padding: '12px',
        textAlign: 'left' as const,
        fontWeight: '600',
        color: '#374151',
        fontSize: '14px',
        borderBottom: '2px solid #e5e7eb',
    },
    tableCell: {
        padding: '12px',
        borderBottom: '1px solid #e5e7eb',
        fontSize: '14px',
        color: '#374151',
    },
    input: {
        padding: '8px 12px',
        border: '2px solid #e2e8f0',
        borderRadius: '6px',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.2s ease',
    },
    editForm: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        marginTop: '12px',
        padding: '16px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
    },
    emptyState: {
        textAlign: 'center' as const,
        padding: '60px 20px',
        color: '#64748b',
    },
    emptyStateIcon: {
        fontSize: '48px',
        marginBottom: '16px',
        opacity: '0.5',
    },
    footer: {
        marginTop: '48px',
        textAlign: 'center' as const,
        color: '#64748b',
        fontSize: '14px',
        padding: '24px',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
    },
};

export default function Dashboard() {
    const [titles, setTitles] = useState<TitleRow[]>([]);
    const [signups, setSignups] = useState<SignupRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [editTitle, setEditTitle] = useState<{ [key: string]: string }>({});
    const [addSignup, setAddSignup] = useState<{ [key: string]: { username: string; time: string } }>({});
    const [channelFilter, setChannelFilter] = useState("");
    const [configLoaded, setConfigLoaded] = useState(false);

    async function initializeSupabase() {
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
            setConfigLoaded(true);
        } catch (error) {
            console.error('Failed to load config:', error);
        }
    }

    async function fetchData() {
        if (!supabase) return;
        setLoading(true);
        const { data: t } = await supabase.from("titles").select("*").order("title");
        const { data: s } = await supabase.from("signups").select("*").order("time");
        setTitles(t || []);
        setSignups(s || []);
        setLoading(false);
    }

    useEffect(() => { 
        initializeSupabase();
    }, []);

    useEffect(() => {
        if (configLoaded) {
            fetchData();
        }
    }, [configLoaded]);

    async function handleTitleSave(channel_id: string) {
        if (!supabase) return;
        const newTitle = editTitle[channel_id];
        await supabase.from("titles").upsert({ channel_id, title: newTitle });
        setEditTitle((prev) => ({ ...prev, [channel_id]: "" }));
        fetchData();
    }

    async function handleTitleDelete(channel_id: string) {
        if (!supabase || !window.confirm("Delete this list and all its signups?")) return;
        await supabase.from("titles").delete().eq("channel_id", channel_id);
        await supabase.from("signups").delete().eq("channel_id", channel_id);
        fetchData();
    }

    async function handleSignupAdd(channel_id: string) {
        if (!supabase) return;
        const { username, time } = addSignup[channel_id] || {};
        if (!username || !time) return;
        await supabase.from("signups").insert([{ channel_id, username, user_id: username, time }]);
        setAddSignup((prev) => ({ ...prev, [channel_id]: { username: "", time: "" } }));
        fetchData();
    }

    async function handleSignupRemove(signup_id: number) {
        if (!supabase) return;
        await supabase.from("signups").delete().eq("id", signup_id);
        fetchData();
    }

    async function handleAddList() {
        if (!supabase) return;
        const newChannelId = prompt("Enter a unique channel_id (any string; e.g. test-channel):");
        const newTitle = prompt("Enter title for the new list:");
        if (!newChannelId || !newTitle) return;
        await supabase.from("titles").insert([{ channel_id: newChannelId, title: newTitle }]);
        fetchData();
    }

    const filteredTitles = channelFilter
        ? titles.filter((t) => t.channel_id.includes(channelFilter) || t.title.includes(channelFilter))
        : titles;

    if (!configLoaded) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p style={styles.loadingText}>Initializing dashboard...</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Discord Schedule Dashboard</h1>
                <p style={styles.subtitle}>Manage your Discord community schedules • All times in UTC</p>
            </div>
            
            <div style={styles.controls}>
                <button style={styles.primaryButton} onClick={handleAddList}>
                    <span style={styles.buttonIcon}>+</span>
                    New List
                </button>
                <input
                    type="text"
                    placeholder="Filter by channel or title..."
                    style={styles.searchInput}
                    value={channelFilter}
                    onChange={(e) => setChannelFilter(e.target.value)}
                />
                <div style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#dbeafe', 
                    color: '#1e40af', 
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: '1px solid #bfdbfe'
                }}>
                    🌍 All times are displayed in UTC
                </div>
            </div>

            {loading && (
                <div style={styles.loadingState}>
                    <div style={styles.spinner}></div>
                    <p>Loading data...</p>
                </div>
            )}
            <div style={styles.container}>
                {filteredTitles.map((title) => (
                    <div key={title.channel_id} style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h2 style={styles.cardTitle}>{title.title}</h2>
                            <span style={styles.channelId}>{title.channel_id}</span>
                            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                                <button 
                                    style={{ ...styles.button, ...styles.editButton }} 
                                    onClick={() => setEditTitle(t => ({ ...t, [title.channel_id]: title.title }))}
                                >
                                    Edit Title
                                </button>
                                <button 
                                    style={{ ...styles.button, ...styles.deleteButton }} 
                                    onClick={() => handleTitleDelete(title.channel_id)}
                                >
                                    Delete List
                                </button>
                            </div>
                        </div>

                        {editTitle[title.channel_id] !== undefined && (
                            <div style={styles.editForm}>
                                <input
                                    type="text"
                                    value={editTitle[title.channel_id]}
                                    onChange={e => setEditTitle(t => ({ ...t, [title.channel_id]: e.target.value }))}
                                    style={{ ...styles.input, flex: '1' }}
                                    placeholder="Enter new title..."
                                />
                                <button 
                                    style={{ ...styles.button, backgroundColor: '#10b981', color: 'white' }}
                                    onClick={() => handleTitleSave(title.channel_id)}
                                >
                                    Save
                                </button>
                                <button 
                                    style={{ ...styles.button, backgroundColor: '#6b7280', color: 'white' }}
                                    onClick={() => setEditTitle(t => { const nt = { ...t }; delete nt[title.channel_id]; return nt; })}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.tableHeader}>Time (UTC)</th>
                                    <th style={styles.tableHeader}>User</th>
                                    <th style={styles.tableHeader}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {signups.filter(s => s.channel_id === title.channel_id).map(s => (
                                    <tr key={s.id}>
                                        <td style={styles.tableCell}>{formatUtcTime(s.time)}</td>
                                        <td style={styles.tableCell}>
                                            <span style={{ 
                                                backgroundColor: '#ddd6fe', 
                                                color: '#5b21b6', 
                                                padding: '4px 8px', 
                                                borderRadius: '4px',
                                                fontWeight: '500'
                                            }}>
                                                {s.username}
                                            </span>
                                        </td>
                                        <td style={styles.tableCell}>
                                            <button 
                                                style={{ ...styles.button, ...styles.deleteButton, fontSize: '12px', padding: '6px 12px' }}
                                                onClick={() => handleSignupRemove(s.id)}
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                <tr style={{ backgroundColor: '#f8fafc' }}>
                                    <td style={styles.tableCell}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <input
                                                type="datetime-local"
                                                value={addSignup[title.channel_id]?.time || ""}
                                                onChange={e =>
                                                    setAddSignup(s => ({
                                                        ...s,
                                                        [title.channel_id]: {
                                                            ...s[title.channel_id],
                                                            time: e.target.value,
                                                        },
                                                    }))
                                                }
                                                style={styles.input}
                                            />
                                            <small style={{ color: '#64748b', fontSize: '12px' }}>
                                                Enter time in UTC timezone
                                            </small>
                                        </div>
                                    </td>
                                    <td style={styles.tableCell}>
                                        <input
                                            type="text"
                                            placeholder="Enter username..."
                                            value={addSignup[title.channel_id]?.username || ""}
                                            onChange={e =>
                                                setAddSignup(s => ({
                                                    ...s,
                                                    [title.channel_id]: {
                                                        ...s[title.channel_id],
                                                        username: e.target.value,
                                                    },
                                                }))
                                            }
                                            style={styles.input}
                                        />
                                    </td>
                                    <td style={styles.tableCell}>
                                        <button 
                                            style={{ ...styles.button, backgroundColor: '#10b981', color: 'white' }}
                                            onClick={() => handleSignupAdd(title.channel_id)}
                                        >
                                            Add
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ))}

                {!filteredTitles.length && !loading && (
                    <div style={styles.emptyState}>
                        <div style={styles.emptyStateIcon}>📅</div>
                        <h3 style={{ color: '#374151', marginBottom: '8px' }}>No schedule lists found</h3>
                        <p style={{ marginBottom: '24px' }}>Create your first schedule list to get started</p>
                        <button style={styles.primaryButton} onClick={handleAddList}>
                            <span style={styles.buttonIcon}>+</span>
                            Create New List
                        </button>
                    </div>
                )}

                <footer style={styles.footer}>
                    <p style={{ margin: '0 0 12px 0', fontWeight: '600' }}>
                        🚀 Live Dashboard - All changes sync automatically with Supabase and Discord bot
                    </p>
                    <p style={{ margin: '0 0 12px 0', fontSize: '13px', lineHeight: '1.5' }}>
                        <strong>Discord Commands:</strong> Use <code>/add hour:14</code> or <code>/add hour:14 day:monday</code> (UTC) • 
                        <code>/remove hour:14</code> • <code>/list</code> • <code>/next</code><br/>
                        Add non-Discord users with <code>/add hour:14 name:username</code>
                    </p>
                    <p style={{ margin: '0', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                        Developed by Daniel Azar
                    </p>
                </footer>
            </div>

            <style jsx global>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                body {
                    margin: 0;
                    background-color: #f8fafc;
                }
                
                input:focus {
                    border-color: #3b82f6 !important;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                
                button:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
                }
                
                .card:hover {
                    box-shadow: 0 8px 25px -1px rgba(0, 0, 0, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.06);
                }
                
                code {
                    background-color: #f1f5f9;
                    color: #475569;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    font-size: 12px;
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
}