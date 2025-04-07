import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { useCart } from "@/lib/context/cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Helmet } from "react-helmet-async";
import { 
  ArrowLeft, 
  FileText, 
  Heart, 
  Info, 
  Minus, 
  Package, 
  Plus, 
  ShieldAlert, 
  ShoppingCart 
} from "lucide-react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const MedicationDetail = () => {
  const params = useParams();
  const [, navigate] = useLocation();
  const { cart, addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  
  const medicationId = Number(params.id);
  
  // Get medication details
  const { data: medication, isLoading, error } = useQuery({
    queryKey: [`/api/medications/${medicationId}`],
    queryFn: async () => {
      const res = await fetch(`/api/medications/${medicationId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch medication details");
      }
      return res.json();
    },
  });
  
  // Get the active tab from the URL hash
  const [activeTab, setActiveTab] = useState("overview");
  
  // Get similar medications
  const { data: similarMedications } = useQuery({
    queryKey: [medication?.category ? `/api/medications/category/${medication.category}` : null],
    queryFn: async () => {
      if (!medication?.category) return [];
      const res = await fetch(`/api/medications/category/${medication.category}`);
      return res.json();
    },
    enabled: !!medication?.category,
  });
  
  const otherMedications = similarMedications?.filter(
    (med: any) => med.id !== medicationId
  ).slice(0, 4);
  
  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(1, quantity + change);
    setQuantity(newQuantity);
  };
  
  const handleAddToCart = () => {
    if (medication) {
      addToCart({
        medicationId: medication.id,
        name: medication.name,
        price: medication.price,
        quantity,
        requiresPrescription: medication.requiresPrescription,
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/3 mb-6"></div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square h-80 bg-neutral-200 rounded"></div>
            <div className="space-y-4">
              <div className="h-10 bg-neutral-200 rounded w-2/3"></div>
              <div className="h-5 bg-neutral-200 rounded w-1/2"></div>
              <div className="h-20 bg-neutral-200 rounded w-full"></div>
              <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
              <div className="h-12 bg-neutral-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !medication) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load medication details. Please try again later.
            <Button variant="outline" className="mt-4" onClick={() => navigate("/medications")}>
              Return to Medications
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const discount = medication.retailPrice 
    ? Math.round(((medication.retailPrice - medication.price) / medication.retailPrice) * 100) 
    : 0;
  
  return (
    <>
      <Helmet>
        <title>{medication.name} | BoltEHR Pharmacy</title>
        <meta name="description" content={medication.description || `Buy ${medication.name} online at wholesale prices.`} />
      </Helmet>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/medications">Medications</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/medications?category=${medication.category}`}>
              {medication.category}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>{medication.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Medication Image */}
          <div className="flex items-center justify-center bg-white rounded-lg border border-neutral-200 p-10">
            <div className="aspect-square w-4/5">
              <svg viewBox="0 0 256 256" className="h-full w-full text-neutral-300">
                <rect width="256" height="256" fill="none" />
                <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM176,152a8,8,0,0,1-8,8H144v24a8,8,0,0,1-8,8H120a8,8,0,0,1-8-8V160H88a8,8,0,0,1-8-8V136a8,8,0,0,1,8-8h24V104a8,8,0,0,1,8-8h16a8,8,0,0,1,8,8v24h24a8,8,0,0,1,8,8Z" fill="currentColor" opacity="0.2" />
                <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216V200ZM144,128h24a8,8,0,0,1,8,8v16a8,8,0,0,1-8,8H144v24a8,8,0,0,1-8,8H120a8,8,0,0,1-8-8V160H88a8,8,0,0,1-8-8V136a8,8,0,0,1,8-8h24V104a8,8,0,0,1,8-8h16a8,8,0,0,1,8,8Zm0,16v16h24V144Zm-16-40H120v40H88v16h32v40h8V160h32V144H128V104Z" fill="currentColor" />
              </svg>
            </div>
          </div>
          
          {/* Medication Details */}
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">{medication.name}</h1>
                <p className="text-neutral-600 mt-1">
                  {medication.genericName && medication.brandName
                    ? `Generic for ${medication.brandName}`
                    : medication.genericName || ""}
                </p>
              </div>
              <Badge 
                variant={medication.inStock ? "default" : "destructive"}
                className="text-sm"
              >
                {medication.inStock ? "In Stock" : "Out of Stock"}
              </Badge>
            </div>
            
            {medication.description && (
              <p className="mt-4 text-neutral-700">{medication.description}</p>
            )}
            
            <div className="mt-6 flex items-baseline">
              <span className="text-3xl font-bold text-primary">${medication.price.toFixed(2)}</span>
              <span className="text-sm text-neutral-500 ml-2">/ month</span>
              {medication.retailPrice && (
                <div className="ml-4 flex flex-col">
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
            
            {medication.requiresPrescription && (
              <div className="mt-4">
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertTitle>Prescription Required</AlertTitle>
                  <AlertDescription>
                    This medication requires a valid prescription.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            <div className="mt-6">
              <p className="font-medium text-sm text-neutral-700 mb-2">Quantity:</p>
              <div className="flex items-center w-32 mb-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center">{quantity}</div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex space-x-4">
                <Button 
                  size="lg"
                  className="flex-1"
                  disabled={!medication.inStock}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                
                <Button variant="outline" size="lg">
                  <Heart className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="flex items-start">
                <Package className="h-5 w-5 text-neutral-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Fast Shipping</p>
                  <p className="text-xs text-neutral-500">Delivered in 3-5 days</p>
                </div>
              </div>
              <div className="flex items-start">
                <ShieldAlert className="h-5 w-5 text-neutral-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">100% Authentic</p>
                  <p className="text-xs text-neutral-500">FDA Approved medications</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Details Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="dosage">Dosage & Administration</TabsTrigger>
              <TabsTrigger value="side-effects">Side Effects</TabsTrigger>
            </TabsList>
            <div className="mt-6 bg-white rounded-lg border border-neutral-200 p-6">
              <TabsContent value="overview" className="space-y-4">
                <h2 className="text-xl font-semibold text-neutral-900">Overview</h2>
                <p className="text-neutral-700">{medication.description || "No overview information available."}</p>
                
                {medication.uses && (
                  <>
                    <h3 className="text-lg font-medium mt-4">Common Uses</h3>
                    <p className="text-neutral-700">{medication.uses}</p>
                  </>
                )}
                
                <div className="mt-4 bg-neutral-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Important Information</p>
                      <p className="text-sm text-neutral-600 mt-1">
                        This information is not a substitute for medical advice. Always consult with your healthcare provider.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="dosage" className="space-y-4">
                <h2 className="text-xl font-semibold text-neutral-900">Dosage & Administration</h2>
                <p className="text-neutral-700">{medication.dosage || "No dosage information available."}</p>
                
                <div className="mt-4 bg-neutral-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Important Information</p>
                      <p className="text-sm text-neutral-600 mt-1">
                        Follow your doctor's directions regarding dosage. Do not change the dosage without consulting your healthcare provider.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="side-effects" className="space-y-4">
                <h2 className="text-xl font-semibold text-neutral-900">Side Effects</h2>
                <p className="text-neutral-700">{medication.sideEffects || "No side effects information available."}</p>
                
                <div className="mt-4 bg-neutral-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Contact Your Doctor</p>
                      <p className="text-sm text-neutral-600 mt-1">
                        Contact your healthcare provider immediately if you experience any severe or unusual side effects.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
        
        {/* Similar Medications */}
        {otherMedications?.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-900">Similar Medications</h2>
              <Link href={`/medications?category=${medication.category}`}>
                <Button variant="link" className="font-medium">
                  View All
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {otherMedications.map((med: any) => (
                <Card key={med.id} className="hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-4">
                    <Link href={`/medications/${med.id}`}>
                      <h3 className="font-semibold text-lg text-neutral-900 hover:text-primary">{med.name}</h3>
                    </Link>
                    <p className="text-neutral-600 text-sm">
                      {med.genericName && med.brandName
                        ? `Generic for ${med.brandName}`
                        : med.genericName || ""}
                    </p>
                    
                    <div className="mt-4 flex justify-between items-baseline">
                      <div>
                        <span className="text-xl font-bold text-primary">${med.price.toFixed(2)}</span>
                      </div>
                      <Badge variant={med.inStock ? "default" : "destructive"} className="text-xs">
                        {med.inStock ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </div>
                    
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      disabled={!med.inStock}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addToCart({
                          medicationId: med.id,
                          name: med.name,
                          price: med.price,
                          quantity: 1,
                          requiresPrescription: med.requiresPrescription,
                        });
                      }}
                    >
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* Back to medications button */}
        <div className="mt-12">
          <Button variant="outline" asChild>
            <Link href="/medications">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Medications
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
};

export default MedicationDetail;
