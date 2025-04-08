import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/context/auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { LogIn, CreditCard, Bell, Mail, MessageSquare } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  dateOfBirth: z.string().optional(),
  sexAtBirth: z.string().optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const communicationsFormSchema = z.object({
  orderStatusMethod: z.enum(["email", "sms"], {
    required_error: "Please select a notification method",
  }),
  receivePromotions: z.boolean().default(true),
  promotionsMethod: z.enum(["email", "sms", "none"], {
    required_error: "Please select a promotions method",
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;
type CommunicationsFormValues = z.infer<typeof communicationsFormSchema>;

const Account = () => {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      city: user?.city || "",
      state: user?.state || "",
      zipCode: user?.zipCode || "",
      dateOfBirth: user?.dateOfBirth || "",
      sexAtBirth: user?.sexAtBirth || "",
    },
  });
  
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  const communicationsForm = useForm<CommunicationsFormValues>({
    resolver: zodResolver(communicationsFormSchema),
    defaultValues: {
      orderStatusMethod: user?.orderStatusMethod as "email" | "sms" || "email",
      receivePromotions: user?.receivePromotions ?? true,
      promotionsMethod: user?.promotionsMethod as "email" | "sms" | "none" || "email",
    },
  });
  
  // Update profile mutation
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      return apiRequest("PUT", `/api/users/${user?.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update profile",
        description: "There was an error updating your profile",
        variant: "destructive",
      });
    },
  });
  
  // Update password mutation
  const { mutate: updatePassword, isPending: isUpdatingPassword } = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      return apiRequest("PUT", `/api/users/${user?.id}`, {
        password: data.newPassword,
      });
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
      });
      passwordForm.reset();
    },
    onError: () => {
      toast({
        title: "Failed to update password",
        description: "There was an error updating your password",
        variant: "destructive",
      });
    },
  });
  
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfile(data);
  };
  
  const onPasswordSubmit = (data: PasswordFormValues) => {
    updatePassword(data);
  };
  
  // Update communications preferences mutation
  const { mutate: updateCommunications, isPending: isUpdatingCommunications } = useMutation({
    mutationFn: async (data: CommunicationsFormValues) => {
      return apiRequest("PUT", `/api/users/${user?.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Communication preferences updated",
        description: "Your communication preferences have been updated successfully",
      });
      // Refresh user data in cache
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: () => {
      toast({
        title: "Failed to update communication preferences",
        description: "There was an error updating your communication preferences",
        variant: "destructive",
      });
    },
  });
  
  const onCommunicationsSubmit = (data: CommunicationsFormValues) => {
    updateCommunications(data);
  };
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Helmet>
          <title>Account | BoltEHR Pharmacy</title>
          <meta name="description" content="Manage your account settings and personal information." />
        </Helmet>
        
        <div className="text-center py-12">
          <LogIn className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Sign In Required</h1>
          <p className="text-neutral-600 max-w-md mx-auto mb-6">
            You need to be signed in to access your account settings. Please sign in to continue.
          </p>
          <Button>Sign In</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Helmet>
        <title>Account | BoltEHR Pharmacy</title>
        <meta name="description" content="Manage your account settings and personal information." />
      </Helmet>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Account Settings</h1>
        <p className="text-neutral-600 mt-1">
          Manage your account details and preferences
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-auto grid-cols-4 md:inline-flex">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={profileForm.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="sexAtBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sex at Birth</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                            >
                              <option value="">Select...</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                              <option value="Prefer not to say">Prefer not to say</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={profileForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={profileForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" disabled={isUpdatingProfile}>
                    {isUpdatingProfile ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Update your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          Password must be at least 8 characters long
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={isUpdatingPassword}>
                    {isUpdatingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="communications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Communication Preferences</CardTitle>
              <CardDescription>
                Manage how and when you receive notifications and promotional messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...communicationsForm}>
                <form onSubmit={communicationsForm.handleSubmit(onCommunicationsSubmit)} className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                      <Bell className="mr-2 h-5 w-5 text-muted-foreground" />
                      Order Status Notifications
                    </h3>
                    
                    <FormField
                      control={communicationsForm.control}
                      name="orderStatusMethod"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>How would you like to receive order status updates?</FormLabel>
                          <FormControl>
                            <div className="flex flex-col space-y-3">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  value="email"
                                  checked={field.value === "email"}
                                  onChange={() => field.onChange("email")}
                                  className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                />
                                <div className="flex items-center">
                                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span>Email</span>
                                </div>
                              </label>
                              
                              <label className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  value="sms"
                                  checked={field.value === "sms"}
                                  onChange={() => field.onChange("sms")}
                                  className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                />
                                <div className="flex items-center">
                                  <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span>SMS Text Message</span>
                                </div>
                              </label>
                            </div>
                          </FormControl>
                          <FormDescription>
                            We'll send you updates when your order status changes (processing, shipped, delivered)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                      <Mail className="mr-2 h-5 w-5 text-muted-foreground" />
                      Promotional Communications
                    </h3>
                    
                    <FormField
                      control={communicationsForm.control}
                      name="receivePromotions"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-6">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              className="h-4 w-4 mt-1 border-gray-300 text-primary focus:ring-primary"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Receive promotional messages and discounts</FormLabel>
                            <FormDescription>
                              Get updates about special offers, discounts and new medications
                            </FormDescription>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {communicationsForm.watch("receivePromotions") && (
                      <FormField
                        control={communicationsForm.control}
                        name="promotionsMethod"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>How would you like to receive promotions?</FormLabel>
                            <FormControl>
                              <div className="flex flex-col space-y-3">
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    value="email"
                                    checked={field.value === "email"}
                                    onChange={() => field.onChange("email")}
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                  />
                                  <div className="flex items-center">
                                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>Email</span>
                                  </div>
                                </label>
                                
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    value="sms"
                                    checked={field.value === "sms"}
                                    onChange={() => field.onChange("sms")}
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                  />
                                  <div className="flex items-center">
                                    <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>SMS Text Message</span>
                                  </div>
                                </label>
                                
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    value="none"
                                    checked={field.value === "none"}
                                    onChange={() => field.onChange("none")}
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                  />
                                  <span>No promotions</span>
                                </label>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  <Button type="submit" disabled={isUpdatingCommunications}>
                    {isUpdatingCommunications ? "Saving Preferences..." : "Save Communication Preferences"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Manage your payment methods for orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg border">
                  <div className="flex items-center gap-4">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">No payment methods saved</p>
                      <p className="text-sm text-muted-foreground">Add a payment method to make checkout faster</p>
                    </div>
                  </div>
                  <Link to="/payment-methods">
                    <Button>
                      Add Payment Method
                    </Button>
                  </Link>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>Your payment information is securely stored and processed by our payment provider.</p>
                  <p className="mt-2">We support credit cards, Apple Pay, and Google Pay.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Account;
