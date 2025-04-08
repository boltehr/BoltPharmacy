import { useAuth } from '@/lib/context/auth';
import { useQuery } from '@tanstack/react-query';

// This hook handles fetching and determining completion status for the onboarding wizard steps
export const useOnboardingProgress = () => {
  const { user } = useAuth();
  
  // Check if user has added any medications to their personal list
  const { data: userMedications, isLoading: userMedicationsLoading } = useQuery({
    queryKey: ['/api/user-medications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/user-medications/${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch user medications');
      return res.json();
    },
    enabled: !!user,
  });

  // Check if user has uploaded any prescriptions
  const { data: prescriptions, isLoading: prescriptionsLoading } = useQuery({
    queryKey: ['/api/prescriptions/user', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/prescriptions/user/${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch prescriptions');
      return res.json();
    },
    enabled: !!user,
  });

  // Check if user has completed any orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders/user', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/orders/user/${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
    enabled: !!user,
  });

  // Check if user has added payment method(s)
  const { data: paymentMethods, isLoading: paymentMethodsLoading } = useQuery({
    queryKey: ['/api/payment-methods', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/payment-methods/${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch payment methods');
      return res.json();
    },
    enabled: !!user,
  });

  const isProfileCompleted = user?.isProfileComplete || false;
  const hasMedications = !userMedicationsLoading && Array.isArray(userMedications) && userMedications.length > 0;
  const hasPrescriptions = !prescriptionsLoading && Array.isArray(prescriptions) && prescriptions.length > 0;
  const hasOrders = !ordersLoading && Array.isArray(orders) && orders.length > 0;
  const hasPaymentMethods = !paymentMethodsLoading && Array.isArray(paymentMethods) && paymentMethods.length > 0;

  const loading = userMedicationsLoading || prescriptionsLoading || ordersLoading || paymentMethodsLoading;

  return {
    steps: [
      {
        id: "profile",
        isCompleted: isProfileCompleted,
      },
      {
        id: "medications",
        isCompleted: hasMedications,
      },
      {
        id: "prescriptions",
        isCompleted: hasPrescriptions,
      },
      {
        id: "checkout",
        isCompleted: hasOrders,
      },
      {
        id: "payment",
        isCompleted: hasPaymentMethods,
      },
    ],
    loading,
  };
};