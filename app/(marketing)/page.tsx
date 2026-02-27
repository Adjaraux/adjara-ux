import HeroSection from '@/components/hero-section';
import ServicesGrid from '@/components/services-grid';
import ContactForm from '@/components/contact-form';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#05080f]">
      <HeroSection />
      <ServicesGrid />
      <ContactForm />
    </div>
  );
}
