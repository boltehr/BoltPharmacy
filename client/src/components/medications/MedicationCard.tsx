import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useCart } from "@/lib/context/cart";

interface MedicationCardProps {
  medication: {
    id: number;
    name: string;
    genericName?: string;
    brandName?: string;
    uses?: string;
    price: number;
    retailPrice?: number;
    inStock: boolean;
    requiresPrescription: boolean;
    imageUrl?: string;
  };
}

const MedicationCard = ({ medication }: MedicationCardProps) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart({
      id: medication.id,
      name: medication.name,
      price: medication.price,
      dosage: medication.uses || "",
      requiresPrescription: medication.requiresPrescription,
      imageUrl: medication.imageUrl,
    });
  };

  const discount = medication.retailPrice 
    ? Math.round(((medication.retailPrice - medication.price) / medication.retailPrice) * 100) 
    : 0;

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg text-neutral-900">
              <Link href={`/medications/${medication.id}`} className="hover:text-primary">
                {medication.name}
              </Link>
            </h3>
            <p className="text-neutral-600 text-sm">
              {medication.genericName && medication.brandName
                ? `Generic for ${medication.brandName}`
                : medication.genericName || ""}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <Badge variant={medication.inStock ? "default" : "destructive"}>
              {medication.inStock ? "In Stock" : "Out of Stock"}
            </Badge>
            {medication.requiresPrescription && (
              <Badge variant="outline" className="text-xs">
                Prescription
              </Badge>
            )}
          </div>
        </div>

        {medication.uses && (
          <div className="mt-2">
            <p className="text-sm font-medium text-neutral-700">Common uses:</p>
            <p className="text-sm text-neutral-600">{medication.uses}</p>
          </div>
        )}

        <div className="mt-4 flex justify-between items-baseline">
          <div>
            <span className="text-2xl font-bold text-primary">
              ${medication.price.toFixed(2)}
            </span>
            <span className="text-sm text-neutral-500 ml-1">/ month</span>
          </div>
          {medication.retailPrice && (
            <div className="flex flex-col items-end">
              <span className="text-sm text-neutral-600 line-through">
                ${medication.retailPrice.toFixed(2)}
              </span>
              {discount > 0 && (
                <span className="text-xs text-green-600 font-medium">
                  Save {discount}%
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-4">
          <Button
            className="w-full"
            disabled={!medication.inStock}
            onClick={handleAddToCart}
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MedicationCard;
