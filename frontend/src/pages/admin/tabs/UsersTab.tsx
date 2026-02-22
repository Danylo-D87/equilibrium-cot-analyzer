/**
 * UsersTab — admin user management table.
 * Lists all users and allows admins to manage roles, permissions, and status.
 */
import { useEffect, useState, useCallback } from 'react';
import { fetchJson } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';

// ── Types ─────────────────────────────────────────────────────

interface UserListItem {
    id: string;
    email: string;
    nickname: string | null;
    role: 'admin' | 'user';
    is_active: boolean;
    permissions: string[];
    created_at: string;
}

const ALL_PERMISSIONS = ['cot', 'journal'] as const;
type Permission = typeof ALL_PERMISSIONS[number];

// ── Helpers ───────────────────────────────────────────────────

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Europe/Kiev',
    });
}

// ── Permission badge ─────────────────────────────────────────

function PermBadge({
    perm,
    active,
    disabled,
    onToggle,
}: {
    perm: string;
    active: boolean;
    disabled: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            onClick={onToggle}
            disabled={disabled}
            title={active ? `Revoke ${perm}` : `Grant ${perm}`}
            className={`px-2 py-0.5 text-[8px] font-sans tracking-[0.15em] uppercase border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${active
                    ? 'border-[#c4a87c]/40 text-[#c4a87c]/70 bg-[#c4a87c]/[0.06] hover:bg-[#c4a87c]/[0.02] hover:border-[#c4a87c]/20'
                    : 'border-white/[0.06] text-white/20 hover:border-[#c4a87c]/30 hover:text-[#c4a87c]/40'
                }`}
        >
            {perm}
        </button>
    );
}

// ── Main Component ───────────────────────────────────────────

export default function UsersTab() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionPending, setActionPending] = useState<string | null>(null); // userId being acted on
    const [search, setSearch] = useState('');

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchJson<UserListItem[]>('/api/v1/users');
            setUsers(data);
        } catch (e: any) {
            setError(e?.message ?? 'Failed to load users');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const toggleRole = async (user: UserListItem) => {
        if (user.id === currentUser?.id) return; // protect self
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        setActionPending(user.id + ':role');
        try {
            const updated = await fetchJson<UserListItem>(`/api/v1/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });
            setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, role: updated.role } : u)));
        } catch {
            // silently fail — keep table
        } finally {
            setActionPending(null);
        }
    };

    const toggleActive = async (user: UserListItem) => {
        if (user.id === currentUser?.id) return;
        setActionPending(user.id + ':active');
        try {
            const updated = await fetchJson<UserListItem>(`/api/v1/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !user.is_active }),
            });
            setUsers(prev =>
                prev.map(u => (u.id === user.id ? { ...u, is_active: updated.is_active } : u)),
            );
        } catch {
            //
        } finally {
            setActionPending(null);
        }
    };

    const togglePermission = async (user: UserListItem, perm: Permission) => {
        const hasPerm = user.permissions.includes(perm);
        setActionPending(user.id + ':' + perm);
        try {
            if (hasPerm) {
                await fetchJson(`/api/v1/users/${user.id}/permissions/${perm}`, {
                    method: 'DELETE',
                });
                setUsers(prev =>
                    prev.map(u =>
                        u.id === user.id
                            ? { ...u, permissions: u.permissions.filter(p => p !== perm) }
                            : u,
                    ),
                );
            } else {
                await fetchJson(`/api/v1/users/${user.id}/permissions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ permission: perm }),
                });
                setUsers(prev =>
                    prev.map(u =>
                        u.id === user.id ? { ...u, permissions: [...u.permissions, perm] } : u,
                    ),
                );
            }
        } catch {
            //
        } finally {
            setActionPending(null);
        }
    };

    const filtered = users.filter(u => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            u.email.toLowerCase().includes(q) ||
            (u.nickname ?? '').toLowerCase().includes(q)
        );
    });

    return (
        <div className="space-y-4">
            {/* ── Header row ── */}
            <div className="flex items-center gap-4">
                <input
                    type="text"
                    placeholder="Search by email or nickname…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 max-w-xs bg-transparent border border-white/[0.08] text-white/50 placeholder:text-white/20 text-[11px] px-3 py-1.5 focus:border-[#c4a87c]/30 focus:text-white/60 outline-none transition-colors"
                />
                <button
                    onClick={fetchUsers}
                    className="ml-auto px-4 py-1.5 text-[9px] font-sans tracking-[0.18em] uppercase border border-[#c4a87c]/20 text-[#c4a87c]/50 hover:border-[#c4a87c]/40 hover:text-[#c4a87c]/70 transition-all duration-300"
                >
                    Refresh
                </button>
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="border border-red-900/40 bg-red-950/20 p-4 text-[11px] text-red-400/70">
                    {error}
                </div>
            )}

            {/* ── Table ── */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/[0.04]">
                            {[
                                'Email / Nickname',
                                'Role',
                                'Permissions',
                                'Status',
                                'Registered',
                                'Actions',
                            ].map(h => (
                                <th
                                    key={h}
                                    className="pb-3 pr-6 text-[8px] font-sans tracking-[0.22em] uppercase text-white/25 font-normal whitespace-nowrap"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-white/[0.02]">
                                    {Array.from({ length: 6 }).map((_, j) => (
                                        <td key={j} className="py-3 pr-6">
                                            <div className="h-3 bg-white/[0.03] rounded animate-pulse w-20" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="py-10 text-center text-[11px] text-white/20"
                                >
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            filtered.map(user => {
                                const isSelf = user.id === currentUser?.id;
                                const isPending = actionPending?.startsWith(user.id);
                                const isAdmin = user.role === 'admin';

                                return (
                                    <tr
                                        key={user.id}
                                        className={`border-b border-white/[0.02] transition-colors hover:bg-white/[0.01] ${isSelf ? 'opacity-60' : ''}`}
                                    >
                                        {/* Email / Nickname */}
                                        <td className="py-3 pr-6">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[11px] text-white/60 font-sans">
                                                    {user.email}
                                                </span>
                                                {user.nickname && (
                                                    <span className="text-[9px] text-white/25 font-sans">
                                                        {user.nickname}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Role */}
                                        <td className="py-3 pr-6">
                                            <span
                                                className={`text-[9px] font-sans tracking-[0.15em] uppercase ${isAdmin
                                                        ? 'text-[#c4a87c]/70'
                                                        : 'text-white/30'
                                                    }`}
                                            >
                                                {user.role}
                                            </span>
                                        </td>

                                        {/* Permissions */}
                                        <td className="py-3 pr-6">
                                            <div className="flex gap-1.5">
                                                {ALL_PERMISSIONS.map(perm => (
                                                    <PermBadge
                                                        key={perm}
                                                        perm={perm}
                                                        active={
                                                            isAdmin ||
                                                            user.permissions.includes(perm)
                                                        }
                                                        disabled={
                                                            isAdmin || isPending === true || isSelf
                                                        }
                                                        onToggle={() =>
                                                            togglePermission(user, perm)
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="py-3 pr-6">
                                            <span
                                                className={`text-[9px] font-sans tracking-[0.15em] uppercase ${user.is_active
                                                        ? 'text-emerald-400/50'
                                                        : 'text-red-400/40'
                                                    }`}
                                            >
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>

                                        {/* Registered */}
                                        <td className="py-3 pr-6 whitespace-nowrap">
                                            <span className="text-[10px] text-white/25 font-sans">
                                                {formatDate(user.created_at)}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3">
                                            {isSelf ? (
                                                <span className="text-[8px] text-white/15 italic">
                                                    (you)
                                                </span>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    {/* Toggle role */}
                                                    <button
                                                        disabled={isPending}
                                                        onClick={() => toggleRole(user)}
                                                        title={
                                                            isAdmin
                                                                ? 'Demote to user'
                                                                : 'Promote to admin'
                                                        }
                                                        className={`px-2 py-0.5 text-[8px] font-sans tracking-[0.12em] uppercase border transition-all duration-200 disabled:opacity-40 ${isAdmin
                                                                ? 'border-[#c4a87c]/25 text-[#c4a87c]/50 hover:border-red-500/30 hover:text-red-400/50'
                                                                : 'border-white/[0.06] text-white/25 hover:border-[#c4a87c]/30 hover:text-[#c4a87c]/50'
                                                            }`}
                                                    >
                                                        {isPending && actionPending === user.id + ':role'
                                                            ? '…'
                                                            : isAdmin
                                                                ? 'Demote'
                                                                : 'Make admin'}
                                                    </button>

                                                    {/* Toggle active */}
                                                    <button
                                                        disabled={isPending}
                                                        onClick={() => toggleActive(user)}
                                                        title={
                                                            user.is_active
                                                                ? 'Deactivate'
                                                                : 'Activate'
                                                        }
                                                        className={`px-2 py-0.5 text-[8px] font-sans tracking-[0.12em] uppercase border transition-all duration-200 disabled:opacity-40 ${user.is_active
                                                                ? 'border-white/[0.06] text-white/25 hover:border-red-500/30 hover:text-red-400/50'
                                                                : 'border-emerald-800/30 text-emerald-500/40 hover:border-emerald-600/40 hover:text-emerald-400/60'
                                                            }`}
                                                    >
                                                        {isPending &&
                                                            actionPending === user.id + ':active'
                                                            ? '…'
                                                            : user.is_active
                                                                ? 'Deactivate'
                                                                : 'Activate'}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Count ── */}
            {!loading && (
                <p className="text-[9px] font-sans tracking-[0.15em] text-white/20 uppercase">
                    {filtered.length} user{filtered.length !== 1 ? 's' : ''}
                    {search ? ` matching "${search}"` : ''}
                </p>
            )}
        </div>
    );
}
