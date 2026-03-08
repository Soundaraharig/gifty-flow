import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const OrderSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/my-orders", { replace: true }), 4000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in text-center">
      <div className="text-7xl mb-6 animate-scale-in">🎉</div>
      <h2 className="font-display text-3xl font-bold text-foreground mb-3">
        Order Placed!
      </h2>
      <p className="text-muted-foreground text-base max-w-xs">
        Thank you! Our team will contact you shortly to confirm your order.
      </p>
      <button
        onClick={() => navigate("/my-orders", { replace: true })}
        className="mt-8 px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:opacity-90 transition-opacity"
      >
        View My Orders
      </button>
    </div>
  );
};

export default OrderSuccess;
