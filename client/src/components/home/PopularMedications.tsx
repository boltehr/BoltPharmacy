import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import MedicationCard from "@/components/medications/MedicationCard";
import { Skeleton } from "@/components/ui/skeleton";

const PopularMedications = () => {
  const { data: medications, isLoading } = useQuery({
    queryKey: ["/api/medications/popular"],
    queryFn: async () => {
      const res = await fetch("/api/medications/popular");
      if (!res.ok) throw new Error("Failed to fetch medications");
      return res.json();
    },
  });

  const LoadingSkeleton = () => (
    <>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm p-4">
          <div className="flex justify-between items-start">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-36 mt-1" />
          <Skeleton className="h-4 w-52 mt-4" />
          <Skeleton className="h-4 w-44 mt-1" />
          <div className="mt-4 flex justify-between items-baseline">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-9 w-full mt-4" />
        </div>
      ))}
    </>
  );

  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">Popular Medications</h2>
          <Link href="/medications">
            <Button variant="link" className="text-primary hover:text-primary-dark font-medium flex items-center">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            medications?.map((medication: any) => (
              <MedicationCard key={medication.id} medication={medication} />
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default PopularMedications;
