import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/context/auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Icons
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  ClipboardList,
  Eye,
  FileText,
  FilePlus2,
  Filter,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldX,
  User,
  XCircle,
} from "lucide-react";

// Verification form schema
const verificationFormSchema = z.object({
  verificationStatus: z.string(),
  verificationMethod: z.string(),
  verificationNotes: z.string().optional(),
  expirationDate: z.date().optional(),
  status: z.string().optional(),
});

type VerificationFormValues = z.infer<typeof verificationFormSchema>;

// Revocation form schema
const revocationFormSchema = z.object({
  reason: z.string().min(5, "Reason must be at least 5 characters"),
});

type RevocationFormValues = z.infer<typeof revocationFormSchema>;

// Type for prescription from API
type Prescription = {
  id: number;
  userId: number;
  doctorName: string | null;
  doctorPhone: string | null;
  uploadDate: string;
  status: string;
  fileUrl: string | null;
  notes: string | null;
  verificationStatus: string;
  verifiedBy: number | null;
  verificationDate: string | null;
  verificationMethod: string | null;
  verificationNotes: string | null;
  expirationDate: string | null;
  securityCode: string | null;
  revoked: boolean;
  revokedReason: string | null;
  user?: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
  };
};

const PrescriptionVerification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("unverified");
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Redirect if not admin
  if (user?.role !== "admin") {
    return (
      <div className="container mx-auto py-12">
        <Alert variant="destructive">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access the prescription verification system.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Query prescriptions based on tab
  const { data: prescriptions, isLoading, refetch } = useQuery({
    queryKey: ["/api/prescriptions/verification/queue", activeTab],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/prescriptions/verification/queue?status=${activeTab === "unverified" ? "unverified" : activeTab}`
      );
      return res.json();
    },
  });

  // Verify prescription mutation
  const { mutate: verifyPrescription, isPending: isVerifying } = useMutation({
    mutationFn: async (data: VerificationFormValues & { id: number }) => {
      const { id, ...verificationData } = data;
      return apiRequest("POST", `/api/prescriptions/${id}/verify`, verificationData);
    },
    onSuccess: () => {
      toast({
        title: "Prescription verified",
        description: "The prescription has been successfully verified",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions/verification/queue"] });
      setIsVerifyDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Verification failed",
        description: error.message || "There was an error verifying the prescription",
        variant: "destructive",
      });
    },
  });

  // Revoke prescription mutation
  const { mutate: revokePrescription, isPending: isRevoking } = useMutation({
    mutationFn: async (data: RevocationFormValues & { id: number }) => {
      const { id, ...revocationData } = data;
      return apiRequest("POST", `/api/prescriptions/${id}/revoke`, revocationData);
    },
    onSuccess: () => {
      toast({
        title: "Prescription revoked",
        description: "The prescription has been successfully revoked",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions/verification/queue"] });
      setIsRevokeDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Revocation failed",
        description: error.message || "There was an error revoking the prescription",
        variant: "destructive",
      });
    },
  });

  // Generate new security code mutation
  const { mutate: generateSecurityCode, isPending: isGeneratingCode } = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/prescriptions/${id}/security-code`, {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Security Code Generated",
        description: `New code: ${data.securityCode}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions/verification/queue"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate code",
        description: error.message || "There was an error generating a new security code",
        variant: "destructive",
      });
    },
  });

  // Verification form
  const verificationForm = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationFormSchema),
    defaultValues: {
      verificationStatus: "verified",
      verificationMethod: "manual",
      verificationNotes: "",
      status: "approved",
    },
  });

  // Revocation form
  const revocationForm = useForm<RevocationFormValues>({
    resolver: zodResolver(revocationFormSchema),
    defaultValues: {
      reason: "",
    },
  });

  // Handle open verify dialog
  const handleOpenVerifyDialog = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    
    // Calculate default expiration date (1 year from now)
    const defaultExpDate = new Date();
    defaultExpDate.setFullYear(defaultExpDate.getFullYear() + 1);
    
    // Reset form with default values
    verificationForm.reset({
      verificationStatus: "verified",
      verificationMethod: "manual",
      verificationNotes: "",
      expirationDate: defaultExpDate,
      status: "approved",
    });
    
    setIsVerifyDialogOpen(true);
  };

  // Handle open revoke dialog
  const handleOpenRevokeDialog = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    revocationForm.reset({
      reason: "",
    });
    setIsRevokeDialogOpen(true);
  };

  // Handle verify form submission
  const onVerifySubmit = (values: VerificationFormValues) => {
    if (!selectedPrescription) return;
    
    verifyPrescription({
      id: selectedPrescription.id,
      ...values,
    });
  };

  // Handle revoke form submission
  const onRevokeSubmit = (values: RevocationFormValues) => {
    if (!selectedPrescription) return;
    
    revokePrescription({
      id: selectedPrescription.id,
      ...values,
    });
  };

  // Toggle row expansion
  const toggleExpandRow = (id: number) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(id);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Helmet>
        <title>Prescription Verification | BoltEHR Pharmacy</title>
        <meta name="description" content="Verify and manage prescription requests" />
      </Helmet>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Prescription Verification</h1>
          <p className="text-muted-foreground">
            Verify prescriptions before approving medication orders
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="unverified" className="flex items-center">
            <ClipboardList className="mr-2 h-4 w-4" />
            Pending Verification
          </TabsTrigger>
          <TabsTrigger value="verified" className="flex items-center">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Verified
          </TabsTrigger>
          <TabsTrigger value="failed" className="flex items-center">
            <ShieldX className="mr-2 h-4 w-4" />
            Failed Verification
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>
              {activeTab === "unverified" && "Pending Verification"}
              {activeTab === "verified" && "Verified Prescriptions"}
              {activeTab === "failed" && "Failed Verifications"}
            </CardTitle>
            <CardDescription>
              {activeTab === "unverified" && "Review and verify uploaded prescriptions"}
              {activeTab === "verified" && "Previously verified prescriptions"}
              {activeTab === "failed" && "Prescriptions that failed verification"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : prescriptions?.length ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead></TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Date Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prescriptions.map((prescription: Prescription) => (
                      <>
                        <TableRow key={prescription.id}>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpandRow(prescription.id)}
                            >
                              {expandedRow === prescription.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium flex items-center">
                              <User className="h-4 w-4 mr-2 text-muted-foreground" />
                              {prescription.user?.firstName && prescription.user?.lastName
                                ? `${prescription.user.firstName} ${prescription.user.lastName}`
                                : "Unknown Patient"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {prescription.user?.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {prescription.doctorName || "Not specified"}
                            </div>
                            {prescription.doctorPhone && (
                              <div className="text-sm text-muted-foreground flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {prescription.doctorPhone}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {prescription.uploadDate
                              ? format(new Date(prescription.uploadDate), "MMM d, yyyy")
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <VerificationBadge status={prescription.verificationStatus} />
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {activeTab === "unverified" && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleOpenVerifyDialog(prescription)}
                                >
                                  <ClipboardCheck className="h-4 w-4 mr-1" />
                                  Verify
                                </Button>
                              )}
                              {activeTab === "verified" && !prescription.revoked && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleOpenRevokeDialog(prescription)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Revoke
                                </Button>
                              )}
                              {activeTab === "verified" && !prescription.revoked && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => generateSecurityCode(prescription.id)}
                                  disabled={isGeneratingCode}
                                >
                                  <RefreshCw className="h-4 w-4 mr-1" />
                                  New Code
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedRow === prescription.id && (
                          <TableRow className="bg-muted/50">
                            <TableCell colSpan={6}>
                              <div className="p-4">
                                <h4 className="font-semibold mb-2">Prescription Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <dl className="space-y-2">
                                      <div>
                                        <dt className="text-sm font-medium text-muted-foreground">
                                          Notes
                                        </dt>
                                        <dd>
                                          {prescription.notes || "No notes provided"}
                                        </dd>
                                      </div>
                                      <div>
                                        <dt className="text-sm font-medium text-muted-foreground">
                                          Security Code
                                        </dt>
                                        <dd className="font-mono">
                                          {prescription.securityCode || "None"}
                                        </dd>
                                      </div>
                                      {prescription.verificationDate && (
                                        <div>
                                          <dt className="text-sm font-medium text-muted-foreground">
                                            Verified On
                                          </dt>
                                          <dd>
                                            {format(new Date(prescription.verificationDate), "PPP")}
                                          </dd>
                                        </div>
                                      )}
                                      {prescription.expirationDate && (
                                        <div>
                                          <dt className="text-sm font-medium text-muted-foreground">
                                            Expiration
                                          </dt>
                                          <dd>
                                            {format(new Date(prescription.expirationDate), "PPP")}
                                          </dd>
                                        </div>
                                      )}
                                    </dl>
                                  </div>
                                  <div>
                                    <dl className="space-y-2">
                                      {prescription.verifiedBy && (
                                        <div>
                                          <dt className="text-sm font-medium text-muted-foreground">
                                            Verified By
                                          </dt>
                                          <dd>
                                            Admin #{prescription.verifiedBy}
                                          </dd>
                                        </div>
                                      )}
                                      {prescription.verificationMethod && (
                                        <div>
                                          <dt className="text-sm font-medium text-muted-foreground">
                                            Verification Method
                                          </dt>
                                          <dd className="capitalize">
                                            {prescription.verificationMethod}
                                          </dd>
                                        </div>
                                      )}
                                      {prescription.verificationNotes && (
                                        <div>
                                          <dt className="text-sm font-medium text-muted-foreground">
                                            Verification Notes
                                          </dt>
                                          <dd>
                                            {prescription.verificationNotes}
                                          </dd>
                                        </div>
                                      )}
                                      {prescription.revoked && (
                                        <div>
                                          <dt className="text-sm font-medium text-muted-foreground text-red-500">
                                            Revocation Reason
                                          </dt>
                                          <dd className="text-red-500">
                                            {prescription.revokedReason}
                                          </dd>
                                        </div>
                                      )}
                                    </dl>
                                  </div>
                                </div>
                                {prescription.fileUrl && (
                                  <div className="mt-4">
                                    <h4 className="font-semibold">Prescription File</h4>
                                    <div className="bg-neutral-100 p-4 rounded mt-2 text-center">
                                      <FileText className="h-10 w-10 text-neutral-400 mx-auto mb-2" />
                                      <p className="text-sm font-medium">
                                        Click to view uploaded prescription
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        (Demo: This is a mock image. In production, the actual prescription would be displayed.)
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-10">
                <FilePlus2 className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No prescriptions found</h3>
                <p className="text-muted-foreground mt-1">
                  {activeTab === "unverified" && "There are no prescriptions waiting for verification."}
                  {activeTab === "verified" && "No verified prescriptions found."}
                  {activeTab === "failed" && "No failed verifications found."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>

      {/* Verify Prescription Dialog */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Prescription</DialogTitle>
            <DialogDescription>
              Review and verify the prescription for{" "}
              {selectedPrescription?.user?.firstName
                ? `${selectedPrescription.user.firstName} ${selectedPrescription.user.lastName}`
                : "Unknown Patient"}
            </DialogDescription>
          </DialogHeader>
          <Form {...verificationForm}>
            <form onSubmit={verificationForm.handleSubmit(onVerifySubmit)} className="space-y-4">
              <FormField
                control={verificationForm.control}
                name="verificationStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select verification status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={verificationForm.control}
                name="verificationMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select verification method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="manual">Manual Review</SelectItem>
                        <SelectItem value="phone">Phone Verification</SelectItem>
                        <SelectItem value="database">Database Lookup</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={verificationForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={verificationForm.control}
                name="expirationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expiration Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`pl-3 text-left font-normal ${
                              !field.value && "text-muted-foreground"
                            }`}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When this prescription will expire (default is one year from today)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={verificationForm.control}
                name="verificationNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any notes about the verification process"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsVerifyDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isVerifying}>
                  {isVerifying ? "Verifying..." : "Complete Verification"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Revoke Prescription Dialog */}
      <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revoke Prescription</DialogTitle>
            <DialogDescription>
              This will permanently revoke the verified prescription and cancel any pending orders.
            </DialogDescription>
          </DialogHeader>
          <Form {...revocationForm}>
            <form onSubmit={revocationForm.handleSubmit(onRevokeSubmit)} className="space-y-4">
              <FormField
                control={revocationForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Revocation</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the reason for revoking this prescription"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This reason will be shown to the patient and other admins
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRevokeDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" disabled={isRevoking}>
                  {isRevoking ? "Revoking..." : "Revoke Prescription"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper component for verification status badges
const VerificationBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "verified":
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    case "unverified":
    default:
      return (
        <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
          <ClipboardList className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
  }
};

export default PrescriptionVerification;