import Header from '@/components/header';
import Footer from '@/components/footer';

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="dark flex flex-col min-h-[100dvh] bg-[#05080f] selection:bg-brand-orange/30">
            <Header />
            <main className="flex-grow w-full">
                {children}
            </main>
            <Footer />
        </div>
    );
}
