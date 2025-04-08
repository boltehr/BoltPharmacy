import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { WhiteLabelConfig } from "@/lib/context/whiteLabel";
import { Button } from "@/components/ui/button";
import { Pill, ArrowRight, Box, Truck, User } from "lucide-react";
import MedicationCard from "@/components/medications/MedicationCard";

interface MedicationCategory {
  id: number;
  name: string;
  slug: string;
}

interface PopularMedication {
  id: number;
  name: string;
  price: number;
  dosage: string;
  generic: boolean;
  discount_price?: number;
  imageUrl?: string;
}

const Home = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<MedicationCategory[]>([]);
  const [popularMedications, setPopularMedications] = useState<PopularMedication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // In parallel fetch categories and popular medications
        const [categoriesResponse, medicationsResponse] = await Promise.all([
          apiRequest("GET", "/api/categories"),
          apiRequest("GET", "/api/medications/popular")
        ]);
        
        if (categoriesResponse.ok) {
          const data = await categoriesResponse.json();
          setCategories(data);
        }
        
        if (medicationsResponse.ok) {
          const data = await medicationsResponse.json();
          setPopularMedications(data);
        }
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Steps section data
  const steps = [
    {
      title: t("home.step1"),
      description: "Search from our wide selection of affordable medications",
      icon: <Pill className="h-10 w-10" />,
    },
    {
      title: t("home.step2"),
      description: "Upload your doctor's prescription securely through our platform",
      icon: <Box className="h-10 w-10" />,
    },
    {
      title: t("home.step3"),
      description: "Review your order and complete the checkout process",
      icon: <User className="h-10 w-10" />,
    },
    {
      title: t("home.step4"),
      description: "Receive your medications delivered right to your door",
      icon: <Truck className="h-10 w-10" />,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-primary/5 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              {t("home.title")}
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("home.subtitle")}
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/medications">
                  <a>{t("common.medications")}</a>
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/prescriptions">
                  <a>{t("common.prescriptions")}</a>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Medications Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">{t("home.popular")}</h2>
            <Link href="/medications">
              <a className="text-primary flex items-center hover:underline">
                {t("home.viewAll")}
                <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-muted animate-pulse rounded-lg h-64"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {popularMedications.map((medication) => (
                <MedicationCard 
                  key={medication.id} 
                  medication={{
                    id: medication.id,
                    name: medication.name,
                    price: medication.discount_price || medication.price,
                    retailPrice: medication.discount_price ? medication.price : undefined,
                    genericName: medication.generic ? medication.name : undefined,
                    inStock: true,
                    requiresPrescription: false,
                    uses: medication.dosage
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8">{t("home.categories")}</h2>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-muted animate-pulse rounded-lg h-16"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((category) => (
                <Link 
                  key={category.id} 
                  href={`/medications?category=${category.slug}`}
                >
                  <a className="bg-background p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center h-16 text-center">
                    <span className="font-medium">{category.name}</span>
                  </a>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-12">{t("home.howItWorks")}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="bg-primary/10 p-5 rounded-full mb-4">
                  {step.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">{t("home.about")}</h2>
            <p className="text-lg">
              {t("home.about_text")}
            </p>
            <Button 
              asChild 
              variant="outline" 
              className="mt-8 border-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
              <Link href="/about">
                <a>{t("common.learnMore")}</a>
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;