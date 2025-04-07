import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Heart, Brain, Cross, Droplet, Wind, MoreHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const categoryIcons = {
  "Heart Health": <Heart className="h-6 w-6" />,
  "Mental Health": <Brain className="h-6 w-6" />,
  "Antibiotics": <Cross className="h-6 w-6" />,
  "Diabetes": <Droplet className="h-6 w-6" />,
  "Asthma": <Wind className="h-6 w-6" />,
  "More": <MoreHorizontal className="h-6 w-6" />,
};

const MedicationCategories = () => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  // Limit to first 5 categories + "View All"
  const visibleCategories = categories ? categories.slice(0, 5) : [];

  const LoadingSkeleton = () => (
    <>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-neutral-50 rounded-lg p-4 text-center">
          <div className="flex justify-center mb-2">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="h-5 w-24 mx-auto" />
        </div>
      ))}
    </>
  );

  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">Browse by Category</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <>
              {visibleCategories.map((category: any) => (
                <Link
                  key={category.id}
                  href={`/medications?category=${encodeURIComponent(category.name)}`}
                  className="group"
                >
                  <div className="bg-neutral-50 rounded-lg p-4 text-center transition-all duration-200 hover:bg-primary-light hover:bg-opacity-20">
                    <div className="text-neutral-500 group-hover:text-primary mb-2">
                      {categoryIcons[category.name as keyof typeof categoryIcons] || 
                        <Cross className="h-6 w-6" />}
                    </div>
                    <h3 className="text-sm font-medium text-neutral-900">{category.name}</h3>
                  </div>
                </Link>
              ))}
              <Link href="/medications" className="group">
                <div className="bg-neutral-50 rounded-lg p-4 text-center transition-all duration-200 hover:bg-primary-light hover:bg-opacity-20">
                  <div className="text-neutral-500 group-hover:text-primary mb-2">
                    <MoreHorizontal className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-medium text-neutral-900">View All</h3>
                </div>
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default MedicationCategories;
