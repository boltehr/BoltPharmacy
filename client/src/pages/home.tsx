import HeroSection from "@/components/home/HeroSection";
import PopularMedications from "@/components/home/PopularMedications";
import HowItWorks from "@/components/home/HowItWorks";
import MedicationCategories from "@/components/home/MedicationCategories";
import UploadPrescription from "@/components/home/UploadPrescription";
import OrderTracking from "@/components/home/OrderTracking";
import Testimonials from "@/components/home/Testimonials";
import Insurance from "@/components/home/Insurance";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/lib/context/auth";

const Home = () => {
  const { user } = useAuth();
  
  return (
    <>
      <Helmet>
        <title>BoltEHR Pharmacy Platform | Home</title>
        <meta name="description" content="Find affordable medications delivered directly to your door with BoltEHR Pharmacy Platform." />
      </Helmet>
      
      <HeroSection />
      <PopularMedications />
      <HowItWorks />
      <MedicationCategories />
      <UploadPrescription />
      <OrderTracking />
      <Testimonials />
      {user && <Insurance />}
    </>
  );
};

export default Home;
