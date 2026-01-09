'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function StaffLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) return alert('Enter email and password');
    setLoading(true);

    // 1️⃣ Log in staff
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      return alert(error.message);
    }

    // 2️⃣ Get staff role from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user!.id)
      .single();

    if (profileError || !profile) {
      setLoading(false);
      return alert('Profile not found');
    }

    // 3️⃣ Check role
    if (profile.role !== 'staff') {
      setLoading(false);
      return alert('Not authorized');
    }

    setLoading(false);
    // 4️⃣ Redirect to kitchen page
    router.push('/kitchen');
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold mb-6 text-center">Staff Login</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full mb-4 p-2 border rounded"
      />
      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full p-2 bg-green-600 text-white rounded"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </div>
  );
}
