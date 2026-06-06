import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, CheckCircle2, Loader2, LogOut, Search, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../Context/AuthContext';

interface Organization {
    id: string;
    name: string;
}

const initials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'O';

const OrgCard = ({
    org,
    action,
    disabled,
    variant,
    onSelect,
}: {
    org: Organization;
    action: string;
    disabled: boolean;
    variant: 'joined' | 'available';
    onSelect: (id: string) => void;
}) => (
    <button
        onClick={() => onSelect(org.id)}
        disabled={disabled}
        className="group w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#2D2A8C]/40 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
    >
        <div className="flex items-start gap-4">
            <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    variant === 'joined'
                        ? 'bg-[#2D2A8C] text-white'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-[#2D2A8C] group-hover:text-white'
                } transition`}
            >
                {initials(org.name)}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-slate-900">{org.name}</h3>
                        <p className="mt-1 text-xs text-slate-500">
                            {variant === 'joined' ? 'Already connected to your account' : 'Available organization workspace'}
                        </p>
                    </div>
                    {variant === 'joined' && <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />}
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            variant === 'joined'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-indigo-50 text-[#2D2A8C]'
                        }`}
                    >
                        {variant === 'joined' ? 'Member' : 'Open to join'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-[#2D2A8C]">
                        {action}
                        <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
                    </span>
                </div>
            </div>
        </div>
    </button>
);

export default function OrgPicker() {
    const { orgs, token, setToken, user, logout } = useAuth();
    const [availableOrgs, setAvailableOrgs] = useState<Organization[]>([]);
    const [fetching, setFetching] = useState(true);
    const [selectingId, setSelectingId] = useState('');
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAllOrgs = async () => {
            try {
                setFetching(true);
                const res = await fetch('/api/auth/organizations');
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || 'Failed to load organizations');
                }

                const joinedIds = new Set(orgs.map((org) => org.id));
                const filtered = (data.organizations || [])
                    .map((org: any) => ({
                        id: org._id,
                        name: org.name,
                    }))
                    .filter((org: Organization) => org.id && org.name && !joinedIds.has(org.id));

                setAvailableOrgs(filtered);
                setError('');
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load organizations');
            } finally {
                setFetching(false);
            }
        };

        void fetchAllOrgs();
    }, [orgs]);

    const joinedMatches = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return orgs;
        return orgs.filter((org) => org.name.toLowerCase().includes(needle));
    }, [orgs, query]);

    const availableMatches = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return availableOrgs;
        return availableOrgs.filter((org) => org.name.toLowerCase().includes(needle));
    }, [availableOrgs, query]);

    const totalCount = orgs.length + availableOrgs.length;
    const visibleCount = joinedMatches.length + availableMatches.length;

    const handleSelect = async (orgId: string) => {
        setSelectingId(orgId);
        setError('');
        try {
            const res = await fetch('/api/auth/select-org', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ orgId }),
            });

            const data = await res.json();
            if (res.ok) {
                setToken(data.token);
                navigate('/');
            } else {
                setError(data.message || 'Failed to select organization');
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setSelectingId('');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2D2A8C] text-white">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Support IQ</p>
                            <p className="text-xs text-slate-500">Organization access</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                        <LogOut size={16} />
                        Sign out
                    </button>
                </div>
            </div>

            <main className="mx-auto max-w-6xl px-6 py-8">
                <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-[#2D2A8C]">
                            <ShieldCheck size={14} />
                            Secure workspace selection
                        </div>
                        <h1 className="mt-4 text-3xl font-bold text-slate-950">
                            Welcome, {user?.name || 'there'}
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                            Choose the organization you want to work with. Your dashboard, AI chat context, tickets, and reports will use the selected workspace.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Users size={16} />
                                <span className="text-xs font-medium">Memberships</span>
                            </div>
                            <p className="mt-2 text-2xl font-bold text-slate-900">{orgs.length}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Building2 size={16} />
                                <span className="text-xs font-medium">Available</span>
                            </div>
                            <p className="mt-2 text-2xl font-bold text-slate-900">{availableOrgs.length}</p>
                        </div>
                    </div>
                </section>

                <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Organizations</p>
                            <p className="text-xs text-slate-500">
                                Showing {visibleCount} of {totalCount} workspaces
                            </p>
                        </div>
                        <div className="relative w-full md:w-80">
                            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-[#2D2A8C] focus:bg-white"
                                placeholder="Search organizations"
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {fetching ? (
                    <div className="mt-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white py-16 text-slate-500">
                        <Loader2 size={20} className="mr-2 animate-spin" />
                        Loading organizations...
                    </div>
                ) : (
                    <div className="mt-8 space-y-10">
                        {joinedMatches.length > 0 && (
                            <section>
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-slate-900">Your Organizations</h2>
                                    <span className="text-xs font-medium text-slate-500">{joinedMatches.length} joined</span>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {joinedMatches.map((org) => (
                                        <OrgCard
                                            key={org.id}
                                            org={org}
                                            action={selectingId === org.id ? 'Entering...' : 'Enter'}
                                            disabled={Boolean(selectingId)}
                                            variant="joined"
                                            onSelect={handleSelect}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {availableMatches.length > 0 && (
                            <section>
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-slate-900">Available to Join</h2>
                                    <span className="text-xs font-medium text-slate-500">{availableMatches.length} available</span>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {availableMatches.map((org) => (
                                        <OrgCard
                                            key={org.id}
                                            org={org}
                                            action={selectingId === org.id ? 'Joining...' : 'Join'}
                                            disabled={Boolean(selectingId)}
                                            variant="available"
                                            onSelect={handleSelect}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {visibleCount === 0 && (
                            <div className="rounded-lg border border-slate-200 bg-white p-10 text-center shadow-sm">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                    <Building2 size={24} />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                                    {query ? 'No organizations match your search' : 'No organizations found'}
                                </h3>
                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                    {query
                                        ? 'Try a different organization name.'
                                        : 'There are no organizations available for your account right now. Please contact your administrator.'}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
