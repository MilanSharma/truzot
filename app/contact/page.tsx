import B2BNav from "@/components/B2BNav";
import B2BFooter from "@/components/B2BFooter";
import ContactContent from "@/components/ContactContent";

export const metadata = {
  title: "Contact — Truzot",
  description: "Get in touch with the Truzot team for questions about enterprise synthetic API failure and recovery datasets, custom data requests, or partnership inquiries.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <B2BNav />
      <ContactContent />
      <B2BFooter />
    </div>
  );
}
