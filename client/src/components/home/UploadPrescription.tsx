import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, CheckCircle, Info } from "lucide-react";
import { useAuth } from "@/lib/context/auth";
import { useQuery } from "@tanstack/react-query";

const UploadPrescription = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const [doctorPhone, setDoctorPhone] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data: prescriptions } = useQuery({
    queryKey: ["/api/prescriptions/user", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/prescriptions/user/${user.id}`);
      return res.json();
    },
    enabled: !!user,
  });

  const hasPendingPrescriptions = prescriptions?.some(
    (prescription: any) => prescription.status === "pending"
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Check if file is one of the accepted formats
    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file format",
        description: "Please upload a JPG, PNG, or PDF file",
        variant: "destructive",
      });
      return;
    }
    
    // Check file size (5MB max)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a prescription file to upload",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, we would upload the file to a server
    // and then create a prescription record with the file URL
    toast({
      title: "Prescription uploaded",
      description: "Your prescription has been submitted for review",
    });
    
    // Reset form
    setFile(null);
    setDoctorName("");
    setDoctorPhone("");
  };

  const handleRequestFromDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName || !doctorPhone) {
      toast({
        title: "Missing information",
        description: "Please provide both doctor's name and phone number",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, we would send the request to the doctor
    toast({
      title: "Request sent",
      description: "We've sent a request to your doctor for your prescription",
    });
    
    // Reset form
    setDoctorName("");
    setDoctorPhone("");
  };

  return (
    <section className="py-8 md:py-12 bg-primary-light bg-opacity-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/2 p-6 md:p-8 lg:p-10">
              <h2 className="text-2xl font-bold text-neutral-900">Upload Your Prescription</h2>
              <p className="mt-2 text-neutral-600">
                We need your prescription to process your medication order. You can upload it here or have your doctor send it directly.
              </p>

              <div
                className={`mt-6 border-2 ${
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
                {file && (
                  <div className="mt-3">
                    <Button onClick={handleSubmit}>Upload Prescription</Button>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium text-neutral-900">
                  Or Request from Your Doctor
                </h3>
                <form className="mt-3 space-y-4" onSubmit={handleRequestFromDoctor}>
                  <div>
                    <Label htmlFor="doctor-name" className="block text-sm font-medium text-neutral-700">
                      Doctor's Name
                    </Label>
                    <Input
                      type="text"
                      id="doctor-name"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="doctor-phone" className="block text-sm font-medium text-neutral-700">
                      Doctor's Phone
                    </Label>
                    <Input
                      type="text"
                      id="doctor-phone"
                      value={doctorPhone}
                      onChange={(e) => setDoctorPhone(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button type="submit" className="w-full">Request from Doctor</Button>
                </form>
              </div>
            </div>

            <div className="md:w-1/2 bg-neutral-50 p-6 md:p-8 lg:p-10 border-t md:border-t-0 md:border-l border-neutral-200">
              <h3 className="text-lg font-medium text-neutral-900">
                Prescription Requirements
              </h3>

              <ul className="mt-4 space-y-3">
                {[
                  "Must be issued by a licensed prescriber",
                  "Must include full prescription information",
                  "Must be less than one year old",
                  "Must be clearly legible",
                ].map((requirement, index) => (
                  <li key={index} className="flex">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-neutral-700">{requirement}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 bg-neutral-100 rounded-lg p-4">
                <h4 className="font-medium text-neutral-900 flex items-center">
                  <Info className="h-4 w-4 text-blue-500 mr-1" />
                  Questions about your prescription?
                </h4>
                <p className="mt-1 text-sm text-neutral-600">
                  Our pharmacists are available to help. Contact us at (800) 555-1234 or{" "}
                  <a href="mailto:support@boltrx.com" className="text-primary hover:text-primary-dark">
                    support@boltrx.com
                  </a>
                </p>
              </div>

              <div className="mt-6">
                <CardContent className="p-0 bg-white rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-neutral-800 p-4 text-white flex justify-between items-center">
                    <h4 className="font-medium">Current Prescription Status</h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      hasPendingPrescriptions ? "bg-amber-500" : "bg-green-500"
                    }`}>
                      {hasPendingPrescriptions ? "Pending Review" : "Ready for Orders"}
                    </span>
                  </div>
                  <div className="p-4">
                    {hasPendingPrescriptions ? (
                      <p className="text-sm text-neutral-700">
                        You have prescriptions that are being reviewed by our pharmacy team. We'll let you know when they're approved.
                      </p>
                    ) : (
                      <p className="text-sm text-neutral-700">
                        No pending prescriptions. Upload a new prescription to order medications that require one.
                      </p>
                    )}
                  </div>
                </CardContent>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default UploadPrescription;
