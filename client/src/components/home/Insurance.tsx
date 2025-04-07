import { useState } from "react";
import { useAuth } from "@/lib/context/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Info } from "lucide-react";

const Insurance = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [insurance, setInsurance] = useState({
    provider: "",
    memberId: "",
    groupNumber: "",
    phoneNumber: "",
    isPrimary: false,
  });

  // Fetch existing insurance info
  const { data: insuranceData } = useQuery({
    queryKey: ["/api/insurance/user", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/insurance/user/${user.id}`);
      return res.json();
    },
    enabled: !!user,
  });

  // Mutation for saving insurance info
  const { mutate: saveInsurance, isPending } = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/insurance", {
        ...data,
        userId: user?.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Insurance information saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/insurance/user", user?.id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save insurance information",
        variant: "destructive",
      });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInsurance((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setInsurance((prev) => ({ ...prev, provider: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setInsurance((prev) => ({ ...prev, isPrimary: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveInsurance(insurance);
  };

  const insuranceProviders = [
    "Blue Cross Blue Shield",
    "Aetna",
    "Cigna",
    "UnitedHealthcare",
    "Humana",
    "Kaiser Permanente",
    "Other"
  ];

  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="md:w-1/2 mb-8 md:mb-0 md:pr-10">
            <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
              Add Your Insurance Details
            </h2>
            <p className="mt-3 text-lg text-neutral-600">
              We work with many insurance providers to help you get the best price on your medications.
            </p>

            <div className="mt-8 bg-neutral-50 p-4 rounded-lg">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">Insurance Not Required</p>
                  <p className="text-sm text-neutral-600 mt-1">
                    Our prices are often lower than insurance copays. You're welcome to compare both options to find the best price.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">Your Insurance Benefits</h3>
                  <p className="text-neutral-600 text-sm mb-4">
                    Adding your insurance information allows us to:
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Check if your insurance covers your medications",
                      "Compare insurance prices with our direct prices",
                      "Process claims directly with your insurance provider",
                      "Coordinate benefits if you have multiple insurance plans"
                    ].map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-neutral-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="md:w-1/2 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">
              Enter Your Insurance Information
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="insurance-provider">Insurance Provider</Label>
                  <Select
                    value={insurance.provider}
                    onValueChange={handleSelectChange}
                  >
                    <SelectTrigger id="insurance-provider">
                      <SelectValue placeholder="Select your insurance provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {insuranceProviders.map((provider) => (
                        <SelectItem key={provider} value={provider}>
                          {provider}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="member-id">Member ID</Label>
                  <Input
                    type="text"
                    id="member-id"
                    name="memberId"
                    value={insurance.memberId}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label htmlFor="group-number">Group Number</Label>
                  <Input
                    type="text"
                    id="group-number"
                    name="groupNumber"
                    value={insurance.groupNumber}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label htmlFor="phone-number">Phone Number on Back of Card</Label>
                  <Input
                    type="tel"
                    id="phone-number"
                    name="phoneNumber"
                    value={insurance.phoneNumber}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex items-start">
                  <Checkbox
                    id="primary-insurance"
                    checked={insurance.isPrimary}
                    onCheckedChange={handleCheckboxChange}
                  />
                  <div className="ml-3 text-sm">
                    <Label
                      htmlFor="primary-insurance"
                      className="font-medium text-neutral-700"
                    >
                      This is my primary insurance
                    </Label>
                  </div>
                </div>

                <div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isPending}
                  >
                    {isPending ? "Saving..." : "Save Insurance Information"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Insurance;
