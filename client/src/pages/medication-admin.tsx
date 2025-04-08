import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/context/auth";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  PlusCircle, 
  Pencil, 
  Trash2, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Tag,
  DollarSign
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Form for creating or editing medications
const MedicationForm = ({ 
  medication = null, 
  onClose = () => {}, 
  categories = [] 
}: { 
  medication?: any, 
  onClose?: () => void,
  categories?: any[]
}) => {
  const [formData, setFormData] = useState({
    name: "",
    genericName: "",
    brandName: "",
    description: "",
    uses: "",
    sideEffects: "",
    dosage: "",
    price: 0,
    retailPrice: 0,
    requiresPrescription: true,
    inStock: true,
    category: "",
    imageUrl: "",
    popularity: 0
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Prefill form if editing existing medication
  useEffect(() => {
    if (medication) {
      setFormData({
        name: medication.name || "",
        genericName: medication.genericName || "",
        brandName: medication.brandName || "",
        description: medication.description || "",
        uses: medication.uses || "",
        sideEffects: medication.sideEffects || "",
        dosage: medication.dosage || "",
        price: medication.price || 0,
        retailPrice: medication.retailPrice || 0,
        requiresPrescription: medication.requiresPrescription !== false,
        inStock: medication.inStock !== false,
        category: medication.category || "",
        imageUrl: medication.imageUrl || "",
        popularity: medication.popularity || 0
      });
    }
  }, [medication]);

  // Create or update medication mutation
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (medication) {
        // Update existing medication
        const res = await apiRequest("PUT", `/api/medications/${medication.id}`, data);
        return res.json();
      } else {
        // Create new medication
        const res = await apiRequest("POST", "/api/medications", data);
        return res.json();
      }
    },
    onSuccess: () => {
      // Invalidate medications query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/medications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/medications/popular'] });
      toast({
        title: medication ? "Medication updated" : "Medication created",
        description: medication 
          ? `${formData.name} has been updated successfully` 
          : `${formData.name} has been added to the catalog`,
        variant: "default",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save medication",
        variant: "destructive",
      });
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Convert numeric values
    if (name === "price" || name === "retailPrice" || name === "popularity") {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.price) {
      toast({
        title: "Validation Error",
        description: "Name and price are required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Execute the mutation
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
            <Input 
              id="name" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="Medication name" 
              required 
            />
          </div>
          
          <div>
            <Label htmlFor="genericName">Generic Name</Label>
            <Input 
              id="genericName" 
              name="genericName" 
              value={formData.genericName} 
              onChange={handleChange} 
              placeholder="Generic name" 
            />
          </div>
          
          <div>
            <Label htmlFor="brandName">Brand Name</Label>
            <Input 
              id="brandName" 
              name="brandName" 
              value={formData.brandName} 
              onChange={handleChange} 
              placeholder="Brand name" 
            />
          </div>
          
          <div>
            <Label htmlFor="category">Category</Label>
            <Select 
              name="category"
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="price">Price <span className="text-red-500">*</span></Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  $
                </span>
                <Input 
                  id="price" 
                  name="price" 
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price} 
                  onChange={handleChange} 
                  className="pl-7"
                  required 
                />
              </div>
            </div>
            
            <div className="flex-1">
              <Label htmlFor="retailPrice">Retail Price</Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  $
                </span>
                <Input 
                  id="retailPrice" 
                  name="retailPrice" 
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.retailPrice} 
                  onChange={handleChange} 
                  className="pl-7"
                />
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input 
              id="imageUrl" 
              name="imageUrl" 
              value={formData.imageUrl} 
              onChange={handleChange} 
              placeholder="URL to product image" 
            />
          </div>
          
          <div>
            <Label htmlFor="popularity">Popularity Ranking</Label>
            <Input 
              id="popularity" 
              name="popularity" 
              type="number"
              min="0"
              value={formData.popularity} 
              onChange={handleChange} 
              placeholder="0-100 (higher is more popular)" 
            />
            <p className="text-xs text-muted-foreground mt-1">
              Higher numbers appear first in popular listings
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Description of the medication" 
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="uses">Uses</Label>
            <Textarea 
              id="uses" 
              name="uses" 
              value={formData.uses} 
              onChange={handleChange} 
              placeholder="What the medication is used for" 
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="sideEffects">Side Effects</Label>
            <Textarea 
              id="sideEffects" 
              name="sideEffects" 
              value={formData.sideEffects} 
              onChange={handleChange} 
              placeholder="Potential side effects" 
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="dosage">Dosage</Label>
            <Textarea 
              id="dosage" 
              name="dosage" 
              value={formData.dosage} 
              onChange={handleChange} 
              placeholder="Recommended dosage" 
              rows={2}
            />
          </div>
          
          <div className="flex space-x-8 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="requiresPrescription" 
                checked={formData.requiresPrescription} 
                onCheckedChange={(checked) => handleCheckboxChange('requiresPrescription', checked === true)}
              />
              <Label htmlFor="requiresPrescription">Requires Prescription</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="inStock" 
                checked={formData.inStock} 
                onCheckedChange={(checked) => handleCheckboxChange('inStock', checked === true)}
              />
              <Label htmlFor="inStock">In Stock</Label>
            </div>
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : medication ? "Update Medication" : "Add Medication"}
        </Button>
      </DialogFooter>
    </form>
  );
};

// Confirmation Dialog for deleting medications
const DeleteConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  medicationName,
  isDeleting
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: () => void, 
  medicationName: string,
  isDeleting: boolean
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <span className="font-medium">{medicationName}</span>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main Medication Management Page
const MedicationAdmin = () => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [prescriptionFilter, setPrescriptionFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<any>(null);
  const itemsPerPage = 10;
  
  // Fetch medications with search and filter parameters
  const { data: allMedications, isLoading: isLoadingMedications } = useQuery({
    queryKey: ['/api/medications'],
    queryFn: async () => {
      const res = await fetch('/api/medications');
      if (!res.ok) throw new Error('Failed to fetch medications');
      return res.json();
    },
  });

  // Fetch categories for the dropdown
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });

  // Delete medication mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/medications/${id}`);
      return res.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/medications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/medications/popular'] });
      toast({
        title: "Medication deleted",
        description: `${selectedMedication?.name} has been deleted successfully`,
        variant: "default",
      });
      setIsDeleteDialogOpen(false);
      setSelectedMedication(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete medication",
        variant: "destructive",
      });
    }
  });

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, navigate, toast]);

  // Filter and paginate medications
  const filteredMedications = allMedications ? allMedications.filter((med: any) => {
    const matchesSearch = searchTerm === "" || 
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (med.genericName && med.genericName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (med.brandName && med.brandName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === "" || med.category === categoryFilter;
    
    const matchesPrescription = prescriptionFilter === "" || 
      (prescriptionFilter === "yes" && med.requiresPrescription) ||
      (prescriptionFilter === "no" && !med.requiresPrescription);
      
    const matchesStock = stockFilter === "" || 
      (stockFilter === "yes" && med.inStock) ||
      (stockFilter === "no" && !med.inStock);
    
    return matchesSearch && matchesCategory && matchesPrescription && matchesStock;
  }) : [];
  
  const totalPages = Math.ceil(filteredMedications.length / itemsPerPage);
  const paginatedMedications = filteredMedications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEdit = (medication: any) => {
    setSelectedMedication(medication);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (medication: any) => {
    setSelectedMedication(medication);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedMedication) {
      deleteMutation.mutate(selectedMedication.id);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setPrescriptionFilter("");
    setStockFilter("");
    setCurrentPage(1);
  };
  
  if (!user) {
    return <div className="p-8 text-center">Loading...</div>;
  }
  
  if (user.role !== 'admin') {
    return <div className="p-8 text-center">Access Denied</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Medication Management | Admin Dashboard</title>
      </Helmet>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Medication Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Medication
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Add New Medication</DialogTitle>
              <DialogDescription>
                Fill in the details to add a new medication to the catalog.
              </DialogDescription>
            </DialogHeader>
            <MedicationForm 
              onClose={() => setIsAddDialogOpen(false)} 
              categories={categories || []}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-1 md:col-span-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search medications..."
                  className="pl-9 w-full"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
            
            <div>
              <Select 
                value={categoryFilter} 
                onValueChange={(value) => {
                  setCategoryFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories && categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-2">
              <div className="flex-1">
                <Select 
                  value={prescriptionFilter} 
                  onValueChange={(value) => {
                    setPrescriptionFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Prescription" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="yes">Required</SelectItem>
                    <SelectItem value="no">Not Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Select 
                  value={stockFilter} 
                  onValueChange={(value) => {
                    setStockFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="yes">In Stock</SelectItem>
                    <SelectItem value="no">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {(searchTerm || categoryFilter || prescriptionFilter || stockFilter) && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredMedications.length} {filteredMedications.length === 1 ? "result" : "results"}
              </div>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoadingMedications || isLoadingCategories ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredMedications.length === 0 ? (
            <div className="text-center p-8">
              <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">No medications found</h3>
              <p className="text-muted-foreground mt-1">
                {searchTerm || categoryFilter || prescriptionFilter || stockFilter 
                  ? "Try adjusting your filters or search criteria" 
                  : "Add your first medication to get started"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMedications.map((medication: any) => (
                  <TableRow key={medication.id}>
                    <TableCell className="font-medium">
                      <div>
                        {medication.name}
                        {medication.genericName && (
                          <p className="text-sm text-muted-foreground">
                            {medication.genericName}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {medication.category ? (
                        <Badge variant="outline">
                          <Tag className="mr-1 h-3 w-3" />
                          {medication.category}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Uncategorized</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-muted-foreground mr-1" />
                        <span>{medication.price.toFixed(2)}</span>
                      </div>
                      {medication.retailPrice > 0 && (
                        <div className="text-sm text-muted-foreground">
                          <s>Retail: ${medication.retailPrice.toFixed(2)}</s>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {medication.requiresPrescription ? (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">
                            Prescription
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                            OTC
                          </Badge>
                        )}
                        
                        {medication.inStock ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            In Stock
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <XCircle className="mr-1 h-3 w-3" />
                            Out of Stock
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(medication)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(medication)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        
        {totalPages > 1 && (
          <CardFooter className="border-t pt-6">
            <div className="w-full">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={page === currentPage}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Edit medication dialog */}
      {selectedMedication && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Edit Medication</DialogTitle>
              <DialogDescription>
                Update the details of {selectedMedication.name}.
              </DialogDescription>
            </DialogHeader>
            <MedicationForm 
              medication={selectedMedication} 
              onClose={() => setIsEditDialogOpen(false)} 
              categories={categories || []}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        medicationName={selectedMedication?.name || ""}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};

export default MedicationAdmin;