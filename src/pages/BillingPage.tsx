import { useEffect } from 'react';
import { CreditCard, Download, TrendingUp } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export const BillingPage: React.FC = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const { sales, lockerRentals, keyDuplications } = useAppStore();

  const calculateTotalRevenue = () => {
    const salesTotal = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const rentalTotal = lockerRentals.reduce((sum, r) => sum + r.rentalFee, 0);
    const keyTotal = keyDuplications.reduce((sum, k) => sum + k.fee, 0);
    return salesTotal + rentalTotal + keyTotal;
  };

  const revenueBreakdown = [
    {
      name: 'Uniform Sales',
      amount: sales.reduce((sum, s) => sum + s.totalAmount, 0),
      icon: '📦',
      color: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      name: 'Locker Rentals',
      amount: lockerRentals.reduce((sum, r) => sum + r.rentalFee, 0),
      icon: '🔒',
      color: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      name: 'Key Duplications',
      amount: keyDuplications.reduce((sum, k) => sum + k.fee, 0),
      icon: '🔑',
      color: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
  ];

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Billing & Payments</h1>
          <p className="text-slate-600 mt-2">Financial overview and transaction history</p>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-8 text-white mb-8 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-purple-100 mb-2">Total Revenue</p>
              <h2 className="text-4xl font-bold mb-4">
                ₱{calculateTotalRevenue().toLocaleString()}
              </h2>
              <p className="text-purple-100 text-sm">
                From {sales.length} sales, {lockerRentals.length} rentals, {keyDuplications.length} key requests
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <TrendingUp size={32} />
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {revenueBreakdown.map((item, idx) => (
            <div
              key={idx}
              className={`${item.color} border ${item.borderColor} rounded-xl p-6`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-3xl">{item.icon}</div>
                <p className="text-slate-600 font-semibold text-sm">{item.name}</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                ₱{item.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sales */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <CreditCard size={20} />
              <span>Recent Sales</span>
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sales.slice(-10).map((sale) => (
                <div
                  key={sale.id}
                  className="flex justify-between items-center pb-3 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {sale.receiptNo}
                    </p>
                    <p className="text-xs text-slate-500">
                      {sale.paymentMethod.toUpperCase()} • {new Date(sale.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-bold text-slate-900">
                    ₱{sale.totalAmount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Locker Rental Revenue */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <CreditCard size={20} />
              <span>Active Locker Rentals</span>
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {lockerRentals
                .filter((r) => r.status === 'active')
                .slice(-10)
                .map((rental) => (
                  <div
                    key={rental.id}
                    className="flex justify-between items-center pb-3 border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        Locker {rental.lockerId}
                      </p>
                      <p className="text-xs text-slate-500">
                        Expires: {rental.expiryDate}
                      </p>
                    </div>
                    <p className="font-bold text-slate-900">
                      ₱{rental.rentalFee.toLocaleString()}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Export */}
        <div className="mt-8 flex justify-end">
          <button className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all">
            <Download size={20} />
            <span>Export Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
