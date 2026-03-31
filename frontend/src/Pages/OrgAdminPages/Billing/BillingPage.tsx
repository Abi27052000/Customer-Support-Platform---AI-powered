import React, { useState, useEffect } from 'react';

interface BillingStatus {
  subscriptionStatus: string;
  premiumServices: {
    callTranscription: boolean;
    callSummarization: boolean;
  };
}

const BillingPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<BillingStatus | null>(null);

  useEffect(() => {
    fetch('/api/billing/status', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
      setStatus(data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setError('Failed to load billing status');
      setLoading(false);
    });
  }, []);

  const subscriptionStatus = status?.subscriptionStatus || 'none';

  if (loading) {
    return (
      <div className="flex justify-center p-12 text-slate-400 font-medium animate-pulse">
        Loading subscription details...
      </div>
    );
  }

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.message || 'Failed to start checkout');
      }
    } catch (err) {
      setError('An error occurred while redirecting to Stripe');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="border-b border-slate-50 pb-8">
            <h3 className="text-2xl font-bold text-slate-800">Financial Suite</h3>
            <p className="text-slate-400 font-medium mt-1">Manage subscriptions, billing cycles, and enterprise assets.</p>
        </div>

        {subscriptionStatus === 'pending_payment' && (
            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-2xl shadow-indigo-100 border border-indigo-500/30">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="space-y-4">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black tracking-[0.2em] uppercase">Pending Subscription</span>
                        <h4 className="text-4xl font-black">Premium Services Bundle</h4>
                        <p className="text-indigo-100 font-medium text-sm leading-relaxed max-w-sm">
                            Unlock high-accuracy Call Transcription and Automated Call Summarization for your agents. Assigned by your platform administrator.
                        </p>
                        <p className="text-2xl font-black text-white mt-4">$99.00 <span className="text-sm font-medium text-indigo-200">/ month</span></p>
                    </div>
                    
                    <div className="w-full md:w-auto">
                        <button 
                            onClick={handleCheckout} 
                            disabled={checkoutLoading}
                            className="w-full px-8 py-4 bg-white text-indigo-700 font-black rounded-2xl hover:bg-slate-50 transition-colors shadow-lg disabled:opacity-50"
                        >
                            {checkoutLoading ? 'Redirecting to Stripe...' : 'SUBSCRIBE NOW'}
                        </button>
                        {error && <p className="text-red-200 text-sm mt-3 font-medium bg-red-900/50 p-2 rounded">{error}</p>}
                    </div>
                </div>
            </div>
        )}
        
        {subscriptionStatus === 'active' && (
             <div className="p-8 rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xl shadow-teal-100 border border-teal-400">
                <div className="space-y-4">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black tracking-[0.2em] uppercase">Active Plan</span>
                    <h4 className="text-4xl font-black">Premium Subscription Active</h4>
                    <p className="text-teal-50 font-medium text-sm leading-relaxed max-w-sm">
                        You have full access to Call Transcription and Summarization. Your payment method is securely vault in Stripe.
                    </p>
                </div>
            </div>
        )}

        {subscriptionStatus === 'none' && (
             <div className="p-8 rounded-[2rem] bg-white text-slate-800 shadow-sm border border-slate-200">
                <div className="space-y-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black tracking-[0.2em] uppercase border border-slate-200">Free Tier</span>
                    <h4 className="text-3xl font-black">No Premium Services Required</h4>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-sm">
                        Your organization is currently using the free tier services. If you need Call Transcription or Summarization, please request them from your Platform Admin.
                    </p>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Tier</span>
                <p className="text-lg font-black text-slate-800 mt-1">Free Services</p>
                <p className="text-sm text-slate-500 mt-1">AI Chat and AI Voice are currently free for your organization.</p>
            </div>
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Support</span>
                <p className="text-lg font-black text-slate-800 mt-1">Contact Platform Admin</p>
                <p className="text-sm text-slate-500 mt-1">Reach out for invoice modifications or feature limits.</p>
            </div>
        </div>
    </div>
  );
};

export default BillingPage;
