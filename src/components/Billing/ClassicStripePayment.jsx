import { useState } from 'react';
import { paymentService } from '../../services/paymentService';
import { formatPaymentError } from '../../utils/paymentErrors';

/**
 * Matches DNL classic portal online payment: amount + card number + expiry
 * posted to POST /home/client/payment (see ClientPortalPaymentGatewayHistory).
 */
export default function ClassicStripePayment({
  amount,
  clientName,
  disabled,
  onSuccess,
  onError,
}) {
  const [cardnumber, setCardnumber] = useState('');
  const [cardexpmonth, setCardexpmonth] = useState('');
  const [cardexpyear, setCardexpyear] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled || processing) return;

    const digits = cardnumber.replace(/\D/g, '');
    const month = cardexpmonth.replace(/\D/g, '');
    let year = cardexpyear.replace(/\D/g, '');
    if (year.length === 2) year = `20${year}`;

    if (digits.length < 13) {
      onError('Enter a valid card number.');
      return;
    }
    if (!month || Number(month) < 1 || Number(month) > 12) {
      onError('Enter a valid expiry month (01–12).');
      return;
    }
    if (year.length !== 4) {
      onError('Enter a valid expiry year (YYYY).');
      return;
    }

    setProcessing(true);
    onError('');
    try {
      const result = await paymentService.createStripePayment({
        amount,
        clientName,
        cardnumber: digits,
        cardexpmonth: month.padStart(2, '0'),
        cardexpyear: year,
      });
      onSuccess(result);
      setCardnumber('');
      setCardexpmonth('');
      setCardexpyear('');
    } catch (err) {
      onError(formatPaymentError(err));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 max-w-md space-y-3">
      <div>
        <label htmlFor="card-number" className="mb-1 block text-sm font-medium text-slate-700">
          Card number
        </label>
        <input
          id="card-number"
          type="text"
          inputMode="numeric"
          autoComplete="cc-number"
          value={cardnumber}
          onChange={(e) => setCardnumber(e.target.value)}
          placeholder="4242 4242 4242 4242"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="card-exp-m" className="mb-1 block text-sm font-medium text-slate-700">
            Exp. month
          </label>
          <input
            id="card-exp-m"
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp-month"
            maxLength={2}
            value={cardexpmonth}
            onChange={(e) => setCardexpmonth(e.target.value)}
            placeholder="MM"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
        </div>
        <div>
          <label htmlFor="card-exp-y" className="mb-1 block text-sm font-medium text-slate-700">
            Exp. year
          </label>
          <input
            id="card-exp-y"
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp-year"
            maxLength={4}
            value={cardexpyear}
            onChange={(e) => setCardexpyear(e.target.value)}
            placeholder="YYYY"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={disabled || processing}
        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {processing ? 'Processing…' : `Pay $${Number(amount).toFixed(2)}`}
      </button>
    </form>
  );
}
