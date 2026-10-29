import B2BNav from "@/components/B2BNav";
import B2BFooter from "@/components/B2BFooter";
import CustomDataContent from "@/components/CustomDataContent";

export const metadata = {
  title: "Custom Data — Truzot",
  description: "Enterprise custom synthetic API failure and recovery trajectories tailored to your domain, schema, and use case. 100% schema-validated.",
};

export default function CustomDataPage() {
  return (
    <div className="min-h-screen">
      <B2BNav />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <CustomDataContent />
        </div>
      </main>

      <B2BFooter />
    </div>
  );
}
