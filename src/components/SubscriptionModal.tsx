import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from './ui/dialog';
import { Button } from './ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from './ui/select';
import { toast } from 'sonner';
import { Check, TrendingUp, CreditCard } from 'lucide-react';
import {
  Subscription,
  SubscriptionService,
  UserSubscription
} from '../services/SubscriptionService';

const subscriptionService = SubscriptionService.getInstance();

interface SubscriptionModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PLAN_BENEFITS = [
  'Unlimited waste pickup requests',
  'Priority scheduling',
  'QR code verification',
  'Email & SMS notifications',
  'Reward points on every pickup',
  '24/7 customer support',
];

export default function SubscriptionModal({
  userId,
  onClose,
  onSuccess
}: SubscriptionModalProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Subscription | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'flutterwave'>('paystack');
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ Helpers for discount
  const getDiscountedPrice = (plan: Subscription) => {
    if (plan.name.toLowerCase() === 'quarterly') return plan.price * 0.9;
    if (plan.name.toLowerCase() === 'yearly') return plan.price * 0.8;
    return plan.price;
  };

  const getSavingsText = (planName: string) => {
    if (planName.toLowerCase() === 'quarterly') return 'Save 10%';
    if (planName.toLowerCase() === 'yearly') return 'Save 20%';
    return '';
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);

  // ✅ Fetch plans and current subscription
  const fetchSubscription = async () => {
    try {
      const res = (await subscriptionService.querySubscription()).sanitized;
      setSubscriptions(res.content);
      setSelectedPlan(res.content[0] || null);

      const current = await subscriptionService.queryUserSubscription({
        user_id: userId,
        status: 'ACTIVE'
      });
      const userSub = current.sanitized.content[0];

      if (userSub) {
        const matchedPlan = res.content.find(plan => plan.external_id === userSub.plan_id);
        setCurrentSubscription({
          ...userSub,
          plan_name: matchedPlan?.name || 'Unknown Plan'
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load subscriptions');
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  // ✅ Subscribe flow
  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    setIsProcessing(true);

    try {
      const now = new Date();
      const endDate = new Date(now);

      switch (selectedPlan.name.toLowerCase()) {
        case 'monthly': endDate.setMonth(endDate.getMonth() + 1); break;
        case 'quarterly': endDate.setMonth(endDate.getMonth() + 3); break;
        case 'yearly': endDate.setFullYear(endDate.getFullYear() + 1); break;
      }

      const newSubscription = (await subscriptionService.createUserSubscription({
        plan_id: selectedPlan.external_id,
        start_date: now,
        end_date: endDate
      })).sanitized;

      // simulate delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      await subscriptionService.createSubcriptionPayment({
        amount: getDiscountedPrice(selectedPlan),
        payment_method: paymentMethod,
        subscription_id: selectedPlan.external_id,
        user_subscription_id: newSubscription.external_id,
        reference: `${paymentMethod.toUpperCase()}-${Date.now()}`
      });

      toast.success(`${selectedPlan.name} subscription activated!`);
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Subscription failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">

        <DialogHeader>
          <DialogTitle>Subscribe to Recycling Service</DialogTitle>
          <DialogDescription>
            Choose a plan to start submitting waste pickup requests
          </DialogDescription>
        </DialogHeader>

        {/* ✅ Current Plan */}
        {currentSubscription && (
          <Card className="border-green-200 bg-green-50 mb-4">
            <CardContent className="p-4 flex justify-between">
              <div>
                <p className="text-sm font-medium text-green-900">Current Plan</p>
                <p className="text-sm text-green-700 capitalize">
                  {currentSubscription.plan_name} - Active until{' '}
                  {new Date(currentSubscription.end_date).toLocaleDateString('en-NG')}
                </p>
              </div>
              <Badge className="bg-green-600">Active</Badge>
            </CardContent>
          </Card>
        )}

        {/* ✅ Plans */}
        <div className="grid md:grid-cols-3 gap-4 my-6">
          {subscriptions.map(plan => (
            <Card
              key={plan.external_id}
              onClick={() => setSelectedPlan(plan)}
              className={`cursor-pointer transition ${
                selectedPlan?.external_id === plan.external_id
                  ? 'border-green-600 ring-2 ring-green-600'
                  : currentSubscription?.plan_id === plan.external_id
                  ? 'border-blue-500 ring-2 ring-blue-500'
                  : 'hover:border-green-300'
              }`}
            >
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle className="capitalize">{plan.name}</CardTitle>
                  {getSavingsText(plan.name) && (
                    <Badge>{getSavingsText(plan.name)}</Badge>
                  )}
                </div>

                <CardDescription className="text-2xl font-bold">
                  {getSavingsText(plan.name) ? (
                    <div className="flex flex-col">
                      <span className="line-through text-gray-400 text-sm">
                        {formatCurrency(plan.price)}
                      </span>
                      <span className="text-green-600">
                        {formatCurrency(getDiscountedPrice(plan))}
                      </span>
                    </div>
                  ) : (
                    formatCurrency(plan.price)
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="space-y-2 text-sm">
                  {PLAN_BENEFITS.map((benefit, i) => (
                    <li key={i} className="flex gap-2">
                      <Check className="size-4 text-green-600" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ✅ Payment */}
        <div className="space-y-4">
          <div>
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paystack">Paystack</SelectItem>
                <SelectItem value="flutterwave">Flutterwave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg text-sm">
            <TrendingUp className="inline mr-2 size-4" />
            Demo payment. Real integration should redirect to gateway.
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between">
              <span>Plan</span>
              <span>{selectedPlan?.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount</span>
              <span>
                {selectedPlan ? formatCurrency(getDiscountedPrice(selectedPlan)) : formatCurrency(0)}
              </span>
            </div>
          </div>
        </div>

        {/* ✅ Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleSubscribe}
            disabled={isProcessing || !selectedPlan}
            className="bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? 'Processing...' : 'Subscribe Now'}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}