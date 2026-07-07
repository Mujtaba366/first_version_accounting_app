import { useEffect, useState } from 'react';
import './index.css'
import AuthScreen from './screens/AuthScreen';
import Main from './screens/nav';
import { request } from './screens/lib/api';

function App() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      try {
        const payload = await request<{ authenticated?: boolean }>('/api/auth/session', {
          method: 'GET',
        });

        if (active) {
          setIsAuthed(Boolean(payload.authenticated));
        }
      } catch {
        if (active) {
          setIsAuthed(false);
        }
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    };

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthed(true);
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Loading...
      </div>
    );
  }

  if (!isAuthed) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return <Main />
}

export default App
