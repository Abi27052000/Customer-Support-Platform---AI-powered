import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

interface Organization {
    id: string;
    name: string;
}

export default function OrgPicker() {
    const { orgs, token, setToken, user } = useAuth();
    const [availableOrgs, setAvailableOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Fetch all organizations to show what's available to join
    useEffect(() => {
        const fetchAllOrgs = async () => {
            try {
                const res = await fetch('/api/auth/organizations');
                const data = await res.json();
                if (res.ok) {
                    // data.organizations contains the full list from backend
                    // We need to filter out orgs the user is already in
                    const joinedIds = orgs.map(o => o.id);
                    const filtered = data.organizations.map((o: any) => ({
                        id: o._id,
                        name: o.name
                    })).filter((o: Organization) => !joinedIds.includes(o.id));

                    setAvailableOrgs(filtered);
                }
            } catch (err) {
                console.error('Failed to fetch orgs', err);
            }
        };
        fetchAllOrgs();
    }, [orgs]);

    const handleSelect = async (orgId: string) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/select-org', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ orgId })
            });

            const data = await res.json();
            if (res.ok) {
                setToken(data.token);
                // Refresh and go home
                navigate('/');
            } else {
                setError(data.message || 'Failed to select organization');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="max-w-4xl w-full">
                <h1 className="text-3xl font-bold text-[#2D2A8C] text-center mb-2">Welcome, {user?.name}</h1>
                <p className="text-slate-500 text-center mb-10">Select an organization to access your dashboard.</p>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-center">{error}</div>}

                {/* Section 1: Joined Organizations */}
                {orgs.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2">Your Organizations</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {orgs.map((org) => (
                                <button
                                    key={org.id}
                                    onClick={() => handleSelect(org.id)}
                                    disabled={loading}
                                    className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col items-center text-center group"
                                >
                                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <span className="text-xl font-bold">{org.name.charAt(0)}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-1">{org.name}</h3>
                                    <p className="text-sm text-indigo-600 font-medium">Enter Dashboard</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Section 2: Available to Join */}
                {availableOrgs.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2">Available to Join</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {availableOrgs.map((org) => (
                                <div
                                    key={org.id}
                                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center"
                                >
                                    <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mb-4">
                                        <span className="text-xl font-bold">{org.name.charAt(0)}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-1">{org.name}</h3>
                                    <button
                                        onClick={() => handleSelect(org.id)}
                                        disabled={loading}
                                        className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors w-full"
                                    >
                                        Join Organization
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {orgs.length === 0 && availableOrgs.length === 0 && (
                    <div className="bg-white p-12 rounded-2xl shadow-sm text-center">
                        <h3 className="text-xl font-bold text-slate-800 mb-2">No Organizations Found</h3>
                        <p className="text-slate-500">There are no organizations available for you to join right now. Please contact your administrator.</p>
                        <button onClick={() => navigate('/login')} className="mt-6 text-indigo-600 hover:underline">Log Out</button>
                    </div>
                )}
            </div>
        </div>
    );
}
