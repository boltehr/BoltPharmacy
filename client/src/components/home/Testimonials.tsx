import { Card, CardContent } from "@/components/ui/card";
import { Star, StarHalf } from "lucide-react";

const testimonials = [
  {
    text: "I'm saving over $200 a month on my medications with BoltEHR. The process was simple and their customer service is excellent.",
    author: "Sarah J.",
    medication: "Diabetes medication",
    rating: 5,
  },
  {
    text: "The shipping was faster than I expected, and the price was a fraction of what I was paying at my local pharmacy. So glad I found this service!",
    author: "Michael T.",
    medication: "Heart medication",
    rating: 4.5,
  },
  {
    text: "As someone without insurance, BoltEHR has been a lifesaver. I can finally afford the medications I need without breaking the bank.",
    author: "Lisa M.",
    medication: "Anxiety medication",
    rating: 5,
  },
];

const Testimonials = () => {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="h-5 w-5 fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="h-5 w-5 fill-yellow-400 text-yellow-400" />);
    }

    return stars;
  };

  return (
    <section className="py-8 md:py-12 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
            What Our Customers Say
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-neutral-600">
            Real people, real savings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {renderStars(testimonial.rating)}
                  </div>
                </div>
                <p className="text-neutral-700">"{testimonial.text}"</p>
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <p className="font-medium text-neutral-900">{testimonial.author}</p>
                  <p className="text-sm text-neutral-600">{testimonial.medication}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
