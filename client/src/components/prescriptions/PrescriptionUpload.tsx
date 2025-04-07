import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/context/auth";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  AlertCircle, 
  CheckCircle,
  FileText, 
  FileUp, 
  Trash2,
  UploadCloud 
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  doctorName: z.string().min(1, "Doctor's name is required"),
  doctorPhone: z.string().min(10, "Please enter a valid phone number"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const PrescriptionUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<"upload" | "doctor">("upload");

  // Get existing prescriptions
  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ["/api/prescriptions/user", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/prescriptions/user/${user.id}`);
      return res.json();
    },
    enabled: !!user,
  });

  // Upload prescription mutation
  const { mutate: uploadPrescription, isPending: isUploading } = useMutation({
    mutationFn: async (data: any) => {
      // In a real app, we would upload the file to a storage service
      // and get a URL back, then save that URL with the prescription data
      
      // For this demo, we'll just create a prescription record without a real file
      return apiRequest("POST", "/api/prescriptions", {
        ...data,
        userId: user?.id,
        status: "pending",
        fileUrl: "https://example.com/prescription.pdf", // Mock URL
      });
    },
    onSuccess: () => {
      toast({
        title: "Prescription uploaded",
        description: "Your prescription has been submitted for review",
      });
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions/user", user?.id] });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your prescription",
        variant: "destructive",
      });
    },
  });

  // Delete prescription mutation
  const { mutate: deletePrescription } = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PUT", `/api/prescriptions/${id}`, {
        status: "cancelled",
      });
    },
    onSuccess: () => {
      toast({
        title: "Prescription cancelled",
        description: "Your prescription has been cancelled",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions/user", user?.id] });
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      doctorName: "",
      doctorPhone: "",
      notes: "",
    },
  });

  // Handle file drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Process the selected file
  const handleFile = (file: File) => {
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file format",
        description: "Please upload a JPG, PNG, or PDF file",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    setFile(file);
    toast({
      title: "File selected",
      description: `${file.name} is ready to upload`,
    });
  };

  // Handle file upload submission
  const handleUploadSubmit = () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a prescription file to upload",
        variant: "destructive",
      });
      return;
    }
    
    uploadPrescription({
      doctorName: "Not provided",
      doctorPhone: "Not provided",
      notes: `File: ${file.name}`,
    });
  };

  // Handle doctor request form submission
  const onSubmit = (values: FormValues) => {
    uploadPrescription(values);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4">
        <Button
          variant={uploadMethod === "upload" ? "default" : "outline"}
          onClick={() => setUploadMethod("upload")}
          className="flex-1"
        >
          <FileUp className="mr-2 h-4 w-4" />
          Upload Prescription
        </Button>
        <Button
          variant={uploadMethod === "doctor" ? "default" : "outline"}
          onClick={() => setUploadMethod("doctor")}
          className="flex-1"
        >
          <FileText className="mr-2 h-4 w-4" />
          Request from Doctor
        </Button>
      </div>

      {uploadMethod === "upload" ? (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Upload Prescription</h3>
            
            <div
              className={`mt-4 border-2 ${
                dragActive ? "border-primary" : "border-dashed border-neutral-300"
              } rounded-lg p-6 text-center transition-colors duration-200`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="mx-auto flex justify-center">
                <UploadCloud className="h-10 w-10 text-neutral-400" />
              </div>
              <p className="mt-1 text-sm text-neutral-600">
                {file ? file.name : "Drag and drop your prescription here, or"}
              </p>
              <div className="mt-2">
                <Label
                  htmlFor="prescription-upload"
                  className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 cursor-pointer"
                >
                  Browse Files
                  <Input
                    id="prescription-upload"
                    type="file"
                    className="sr-only"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileInput}
                  />
                </Label>
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                Accepted formats: JPG, PNG, PDF (Max 5MB)
              </p>
            </div>

            {file && (
              <div className="mt-4 bg-neutral-50 p-4 rounded-md flex justify-between items-center">
                <div className="flex items-center">
                  <div className="bg-neutral-200 rounded-md p-2 mr-3">
                    <FileText className="h-6 w-6 text-neutral-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-neutral-500">
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  <Trash2 className="h-4 w-4 text-neutral-500" />
                </Button>
              </div>
            )}

            <div className="mt-6">
              <Button
                className="w-full"
                onClick={handleUploadSubmit}
                disabled={!file || isUploading}
              >
                {isUploading ? "Uploading..." : "Upload Prescription"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Request from Doctor</h3>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="doctorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Doctor's Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="doctorPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Doctor's Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any special instructions or information for your doctor"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional: Add details about your prescription needs
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isUploading}
                >
                  {isUploading ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Your Prescriptions</h3>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-neutral-600">Loading prescriptions...</p>
            </div>
          ) : prescriptions?.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No prescriptions found</AlertTitle>
              <AlertDescription>
                You haven't uploaded any prescriptions yet.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {prescriptions?.map((prescription: any) => (
                <div 
                  key={prescription.id} 
                  className="border rounded-md p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full ${
                        prescription.status === "approved" 
                          ? "bg-green-100" 
                          : prescription.status === "pending" 
                          ? "bg-amber-100"
                          : "bg-red-100"
                      }`}>
                        {prescription.status === "approved" ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : prescription.status === "pending" ? (
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium">
                          {prescription.doctorName !== "Not provided" 
                            ? `Dr. ${prescription.doctorName}` 
                            : "Uploaded Prescription"}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {new Date(prescription.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge status={prescription.status} />
                  </div>
                  
                  {prescription.notes && (
                    <div className="mt-2 text-sm text-neutral-600">
                      <p className="font-medium">Notes:</p>
                      <p>{prescription.notes}</p>
                    </div>
                  )}
                  
                  {prescription.status === "pending" && (
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePrescription(prescription.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Helper component for status badges
const Badge = ({ status }: { status: string }) => {
  let bgColor = "bg-neutral-100";
  let textColor = "text-neutral-800";
  
  switch (status) {
    case "approved":
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      break;
    case "pending":
      bgColor = "bg-amber-100";
      textColor = "text-amber-800";
      break;
    case "rejected":
    case "cancelled":
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      break;
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default PrescriptionUpload;
