import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card, ErrorNote, Input, Label } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export function LoginPage() {
  const [params] = useSearchParams();
  const next = params.get('next') ?? '/trips';
  const { session } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) navigate(next, { replace: true });
  }, [session, next, navigate]);

  const redirectTo = `${window.location.origin}${next}`;

  const sendCode = async () => {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  const verify = async () => {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    setBusy(false);
    if (error) setError(error.message);
  };

  return (
    <div className="mx-auto max-w-md">
      <Card className="space-y-4 p-6">
        <h1 className="text-xl font-semibold">Sign in to save your itinerary</h1>
        <Button variant="outline" className="w-full" onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })}>
          Continue with Google
        </Button>
        <div className="text-center text-xs text-stone-400">or use email</div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" disabled={sent} />
        </div>
        {sent ? (
          <>
            <div>
              <Label>6-digit code (or click the link in the email)</Label>
              <Input inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
            </div>
            <Button className="w-full" loading={busy} disabled={code.length < 6} onClick={verify}>Verify & continue</Button>
          </>
        ) : (
          <Button className="w-full" loading={busy} disabled={!email.includes('@')} onClick={sendCode}>Email me a sign-in code</Button>
        )}
        {error && <ErrorNote>{error}</ErrorNote>}
      </Card>
    </div>
  );
}
