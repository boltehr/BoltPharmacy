import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/context/auth";
import { useState } from "react";
import { Redirect, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PasswordInput } from "@/components/ui/password-input";
import { Checkbox } from "@/components/ui/checkbox";

// Login form schema
const loginFormSchema = z.object({
  email: z.string()
    .email("Please enter a valid email address (e.g., name@example.com)"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Register form schema with strong password requirements and confirmation
const registerFormSchema = z.object({
  email: z.string()
    .email("Please enter a valid email address (e.g., name@example.com)"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .refine(password => /[A-Z]/.test(password), {
      message: "Password must contain at least one uppercase letter"
    })
    .refine(password => /[a-z]/.test(password), {
      message: "Password must contain at least one lowercase letter"
    })
    .refine(password => /[0-9]/.test(password), {
      message: "Password must contain at least one number"
    })
    .refine(password => /[^A-Za-z0-9]/.test(password), {
      message: "Password must contain at least one special character"
    }),
  confirmPassword: z.string()
    .min(1, "Please confirm your password"),
  phone: z.string()
    .min(10, "Please enter a valid cell phone number with at least 10 digits")
    .max(15, "Phone number is too long")
    .refine(val => {
      // Support formats like: +1 (555) 123-4567, 555-123-4567, 5551234567
      return /^(\+\d{1,3})?[\s.-]?\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})$/.test(val);
    }, {
      message: "Please enter a valid cell phone number (e.g., 555-123-4567)"
    }),
  termsAgreed: z.boolean().refine(val => val === true, {
    message: "You must agree to the Terms & Conditions and Privacy Policy"
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginFormSchema>;
type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function AuthPage() {
  const { user, login, register, forgotPassword } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      termsAgreed: false,
    },
  });
  
  // Forgot password form
  const forgotPasswordForm = useForm<{ email: string }>({
    resolver: zodResolver(z.object({
      email: z.string().email("Please enter a valid email address")
    })),
    defaultValues: {
      email: "",
    },
  });

  // Submit handlers
  const onLoginSubmit = async (values: LoginFormValues) => {
    try {
      await login({
        email: values.email,
        password: values.password
      });
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const onRegisterSubmit = async (values: RegisterFormValues) => {
    try {
      await register(values);
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };
  
  const onForgotPasswordSubmit = async (values: { email: string }) => {
    try {
      await forgotPassword(values.email);
      // Reset form and go back to login
      forgotPasswordForm.reset();
      setShowForgotPassword(false);
    } catch (error) {
      console.error("Password reset request failed:", error);
    }
  };

  // Get redirect path from URL if any
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const redirectTo = searchParams.get('redirect') || '/';

  // Redirect if already logged in
  if (user) {
    return <Redirect to={redirectTo} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side: Form */}
        <Card className="w-full shadow-lg border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {activeTab === "login" ? "Sign in to your account" : "Create an account"}
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === "login"
                ? "Enter your credentials to sign in"
                : "Fill out the form to create your account"}
            </CardDescription>
          </CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            {/* Login Form */}
            <TabsContent value="login">
              {showForgotPassword ? (
                <Form {...forgotPasswordForm}>
                  <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4 p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium">Reset Password</h3>
                      <p className="text-sm text-muted-foreground">
                        Enter your email address below and we'll send you a link to reset your password.
                      </p>
                    </div>
                    <FormField
                      control={forgotPasswordForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="example@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-col space-y-2">
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={forgotPasswordForm.formState.isSubmitting}
                      >
                        {forgotPasswordForm.formState.isSubmitting 
                          ? "Sending reset link..." 
                          : "Send Reset Link"
                        }
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        className="w-full" 
                        onClick={() => setShowForgotPassword(false)}
                      >
                        Back to Login
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4 p-6">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="example@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <PasswordInput {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end mb-2">
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-xs" 
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                      >
                        Forgot password?
                      </Button>
                    </div>
                    <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                      {loginForm.formState.isSubmitting ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
              )}
            </TabsContent>
            
            {/* Register Form */}
            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4 p-6">
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="example@email.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <PasswordInput {...field} />
                        </FormControl>
                        <div className="text-xs text-muted-foreground mt-1">
                          Must be at least 8 characters with uppercase, lowercase, number & special character
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <PasswordInput {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cell Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="555-123-4567" {...field} />
                        </FormControl>
                        <div className="text-xs text-muted-foreground mt-1">
                          Mobile number for SMS delivery notifications and order updates
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="termsAgreed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border mt-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal">
                            I am at least 18 years old and agree to{" "}
                            <a href="/terms" className="text-primary hover:underline">Terms & Conditions</a>{" "}
                            and{" "}
                            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={registerForm.formState.isSubmitting}>
                    {registerForm.formState.isSubmitting ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
          <CardFooter className="border-t pt-4 pb-6 px-6">
            <div className="text-sm text-center w-full text-muted-foreground">
              {activeTab === "login" ? (
                <>
                  Don't have an account?{" "}
                  <Button variant="link" className="p-0" onClick={() => setActiveTab("register")}>
                    Register
                  </Button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Button variant="link" className="p-0" onClick={() => setActiveTab("login")}>
                    Sign in
                  </Button>
                </>
              )}
            </div>
          </CardFooter>
        </Card>

        {/* Right side: Hero */}
        <div className="hidden md:flex flex-col space-y-6">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">BoltEHR Pharmacy Platform</h1>
            <p className="text-muted-foreground">
              Access low-cost medications and manage your prescriptions with our secure platform.
            </p>
          </div>
          <div className="grid gap-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-primary/10">
                <svg
                  className="h-6 w-6 text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Secure & Private</h3>
                <p className="text-sm text-muted-foreground">Your health information is protected</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-primary/10">
                <svg
                  className="h-6 w-6 text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Save on Medications</h3>
                <p className="text-sm text-muted-foreground">Up to 80% off retail prices</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-primary/10">
                <svg
                  className="h-6 w-6 text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Home Delivery</h3>
                <p className="text-sm text-muted-foreground">Medications delivered to your door</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}