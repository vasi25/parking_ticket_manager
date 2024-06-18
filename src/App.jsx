import { useState, useEffect } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { Toaster } from 'sonner';
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from './supabase.js';
import Dashboard from './Dashboard.jsx';

const customTheme = {
  ...ThemeSupa,
  default: {
    ...ThemeSupa.default,
    colors: {
      ...ThemeSupa.default.colors,
      inputText: 'white', // Change input text color to white
      inputBg: '#333', // Optional: Change input background color for better contrast
    },
  },
};

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <div
        className='flex flex-col justify-center items-center h-screen'
        style={{ backgroundColor: 'black', color: 'white' }}
      >
        <h1 className='text-3xl mb-5'>Autentificare</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: customTheme }}
          providers={[]}
        />
      </div>
    );
  }

  return (
    <>
      <Toaster
        position='top-right'
        duration='10000'
        closeButton
        richColors
        toastOptions={{
          style: { marginTop: '57px' },
        }}
      />
      <Dashboard />
    </>
  );
}