import AuthForm from '@/components/auth-form';

export default function AuthPage() {
    return (
        <main className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md">
                <AuthForm />
            </div>
        </main>
    );
}
