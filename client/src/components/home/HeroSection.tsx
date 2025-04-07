import { Search } from "@/components/ui/search";

const HeroSection = () => {
  return (
    <section className="bg-primary-light bg-opacity-10 py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
            Find Your Medications at Affordable Prices
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-neutral-600">
            Shop prescription medications at wholesale prices and get them delivered to your door.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-4">
            <Search />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
