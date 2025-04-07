import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search } from "@/components/ui/search";
import MedicationCard from "@/components/medications/MedicationCard";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Helmet } from "react-helmet-async";
import { Filter, SlidersHorizontal } from "lucide-react";

const Medications = () => {
  const [location] = useLocation();
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search));
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    priceRange: [0, 100],
    inStock: true,
    requiresPrescription: undefined as boolean | undefined,
    sort: "popularity",
  });

  // Get query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearchParams(params);
    
    if (params.has("category")) {
      setFilters(prev => ({ ...prev, category: params.get("category") || "" }));
    }
    
    if (params.has("search")) {
      // If search term is provided, we'll use that in the API query
    }
  }, [location]);

  // Fetch medications
  const { data: medications, isLoading } = useQuery({
    queryKey: [
      filters.category ? `/api/medications/category/${filters.category}` : "/api/medications",
      page,
      filters
    ],
    queryFn: async () => {
      let url = "/api/medications";
      
      if (filters.category) {
        url = `/api/medications/category/${filters.category}`;
      } else if (searchParams.has("search")) {
        url = `/api/medications/search?q=${searchParams.get("search")}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch medications");
      return res.json();
    },
  });

  // Fetch categories for filters
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  // Filter and sort medications
  const filteredMedications = medications
    ? medications
        .filter((med: any) => {
          if (filters.inStock && !med.inStock) return false;
          if (filters.requiresPrescription !== undefined && 
              med.requiresPrescription !== filters.requiresPrescription) return false;
          if (med.price < filters.priceRange[0] || med.price > filters.priceRange[1]) return false;
          return true;
        })
        .sort((a: any, b: any) => {
          switch (filters.sort) {
            case "price-low":
              return a.price - b.price;
            case "price-high":
              return b.price - a.price;
            case "name":
              return a.name.localeCompare(b.name);
            case "popularity":
            default:
              return b.popularity - a.popularity;
          }
        })
    : [];

  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };

  // Pagination
  const itemsPerPage = 12;
  const totalPages = filteredMedications.length 
    ? Math.ceil(filteredMedications.length / itemsPerPage) 
    : 1;
  
  const paginatedMedications = filteredMedications.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const LoadingSkeleton = () => (
    <>
      {Array(8).fill(0).map((_, i) => (
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

  // Page title based on filters
  const getPageTitle = () => {
    if (searchParams.has("search")) {
      return `Search results for "${searchParams.get("search")}"`;
    }
    if (filters.category) {
      return filters.category;
    }
    return "All Medications";
  };

  return (
    <>
      <Helmet>
        <title>{getPageTitle()} | BoltEHR Pharmacy</title>
        <meta 
          name="description" 
          content="Browse our catalog of affordable medications available for delivery."
        />
      </Helmet>
      
      <section className="bg-primary-light bg-opacity-10 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">{getPageTitle()}</h1>
          <div className="bg-white rounded-lg shadow-md p-4">
            <Search placeholder="Search medications..." />
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Mobile filter toggle */}
            <div className="md:hidden w-full mb-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>

            {/* Filters sidebar */}
            <div className={`${showFilters ? 'block' : 'hidden'} md:block md:w-64 flex-shrink-0`}>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    <Filter className="h-5 w-5 mr-2" />
                    <h2 className="text-lg font-semibold">Filters</h2>
                  </div>

                  <Accordion type="single" collapsible defaultValue="category">
                    <AccordionItem value="category">
                      <AccordionTrigger>Category</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Checkbox 
                              id="all-categories"
                              checked={filters.category === ""}
                              onCheckedChange={() => handleFilterChange("category", "")}
                            />
                            <Label htmlFor="all-categories" className="ml-2">
                              All Categories
                            </Label>
                          </div>
                          {categories?.map((category: any) => (
                            <div key={category.id} className="flex items-center">
                              <Checkbox 
                                id={`category-${category.id}`}
                                checked={filters.category === category.name}
                                onCheckedChange={() => handleFilterChange("category", category.name)}
                              />
                              <Label htmlFor={`category-${category.id}`} className="ml-2">
                                {category.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="price">
                      <AccordionTrigger>Price Range</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          <Slider 
                            defaultValue={[0, 100]} 
                            min={0} 
                            max={100} 
                            step={1}
                            value={filters.priceRange}
                            onValueChange={(value) => handleFilterChange("priceRange", value)}
                          />
                          <div className="flex justify-between">
                            <div>
                              <Label htmlFor="min-price">Min</Label>
                              <Input 
                                id="min-price"
                                type="number"
                                className="w-20"
                                value={filters.priceRange[0]}
                                onChange={(e) => handleFilterChange("priceRange", [
                                  parseInt(e.target.value),
                                  filters.priceRange[1]
                                ])}
                              />
                            </div>
                            <div>
                              <Label htmlFor="max-price">Max</Label>
                              <Input 
                                id="max-price"
                                type="number"
                                className="w-20"
                                value={filters.priceRange[1]}
                                onChange={(e) => handleFilterChange("priceRange", [
                                  filters.priceRange[0],
                                  parseInt(e.target.value)
                                ])}
                              />
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="availability">
                      <AccordionTrigger>Availability</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Checkbox 
                              id="in-stock"
                              checked={filters.inStock}
                              onCheckedChange={(checked) => 
                                handleFilterChange("inStock", checked)
                              }
                            />
                            <Label htmlFor="in-stock" className="ml-2">
                              In Stock Only
                            </Label>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="prescription">
                      <AccordionTrigger>Prescription</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Checkbox 
                              id="all-prescription"
                              checked={filters.requiresPrescription === undefined}
                              onCheckedChange={() => 
                                handleFilterChange("requiresPrescription", undefined)
                              }
                            />
                            <Label htmlFor="all-prescription" className="ml-2">
                              All
                            </Label>
                          </div>
                          <div className="flex items-center">
                            <Checkbox 
                              id="prescription-required"
                              checked={filters.requiresPrescription === true}
                              onCheckedChange={() => 
                                handleFilterChange("requiresPrescription", true)
                              }
                            />
                            <Label htmlFor="prescription-required" className="ml-2">
                              Prescription Required
                            </Label>
                          </div>
                          <div className="flex items-center">
                            <Checkbox 
                              id="no-prescription"
                              checked={filters.requiresPrescription === false}
                              onCheckedChange={() => 
                                handleFilterChange("requiresPrescription", false)
                              }
                            />
                            <Label htmlFor="no-prescription" className="ml-2">
                              No Prescription Needed
                            </Label>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  
                  <div className="mt-6">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setFilters({
                          category: "",
                          priceRange: [0, 100],
                          inStock: true,
                          requiresPrescription: undefined,
                          sort: "popularity",
                        });
                        setPage(1);
                      }}
                    >
                      Reset Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Medications grid */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <p className="text-neutral-600">
                  {isLoading 
                    ? "Loading..." 
                    : `Showing ${paginatedMedications.length} of ${filteredMedications.length} medications`
                  }
                </p>
                <div className="flex items-center">
                  <Label htmlFor="sort-by" className="mr-2 whitespace-nowrap">Sort by:</Label>
                  <Select
                    value={filters.sort}
                    onValueChange={(value) => handleFilterChange("sort", value)}
                  >
                    <SelectTrigger id="sort-by" className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popularity">Popularity</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? (
                  <LoadingSkeleton />
                ) : paginatedMedications.length > 0 ? (
                  paginatedMedications.map((medication: any) => (
                    <MedicationCard key={medication.id} medication={medication} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <h3 className="text-lg font-medium text-neutral-900">No medications found</h3>
                    <p className="mt-2 text-neutral-600">
                      Try adjusting your filters to find what you're looking for.
                    </p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {filteredMedications.length > itemsPerPage && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          if (page > 1) setPage(page - 1);
                        }}
                        aria-disabled={page === 1}
                        className={page === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      
                      // Calculate page numbers to show based on current page
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setPage(pageNum);
                            }}
                            isActive={page === pageNum}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          if (page < totalPages) setPage(page + 1);
                        }}
                        aria-disabled={page === totalPages}
                        className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Medications;
