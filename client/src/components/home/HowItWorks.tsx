import { Search, FileText, Truck } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      title: "1. Find Your Medication",
      description: "Search our catalog for your prescribed medications at wholesale prices.",
      icon: <Search className="h-6 w-6" />,
    },
    {
      title: "2. Submit Your Prescription",
      description: "Upload your prescription or have your doctor send it directly to us.",
      icon: <FileText className="h-6 w-6" />,
    },
    {
      title: "3. Receive Your Order",
      description: "We'll deliver your medications right to your door in discreet packaging.",
      icon: <Truck className="h-6 w-6" />,
    },
  ];

  return (
    <section className="py-8 md:py-12 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">How It Works</h2>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-neutral-600">
            Get your prescriptions delivered in just a few easy steps
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary bg-opacity-10 text-primary mb-4">
                {step.icon}
              </div>
              <h3 className="text-lg font-medium text-neutral-900">{step.title}</h3>
              <p className="mt-2 text-neutral-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
