import { useEffect, useState } from 'react';
import './index.css'
import AuthScreen from './screens/AuthScreen';
import Main from './screens/nav';

function App() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Session check failed');
        }

        const payload = await response.json() as { authenticated?: boolean };

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
