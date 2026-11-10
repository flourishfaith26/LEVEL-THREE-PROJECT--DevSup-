import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const navigate = useNavigate();

    useEffect(() => {
        const handleMessage = (e) => {
            if (e.data === 'devsup:navigate:login' || e.data?.action === 'navigate_login') {
                navigate('/login');
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [navigate]);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100vh',
            margin: 0,
            padding: 0,
            overflow: 'hidden',
            backgroundColor: '#0F172A',
            zIndex: 1
        }}>
            <iframe
                src="/landing.html"
                title="DevSup — Developer Communication Platform"
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block',
                    margin: 0,
                    padding: 0
                }}
            />
        </div>
    );
}
