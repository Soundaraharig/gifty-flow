import { useNavigate } from "react-router-dom";

const stats = [
  { value: "500+", label: "Orders Delivered" },
  { value: "4.8★", label: "Avg Rating" },
  { value: "50+", label: "Art Styles" },
  { value: "100%", label: "Handcrafted" },
];

const StatsAndCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 md:py-28 bg-primary/5">
      <div className="container mx-auto px-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-16">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <p className="font-display text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center max-w-lg mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Create Something Special?
          </h2>
          <p className="text-muted-foreground mt-4">
            Turn your favorite memories into handcrafted art. The perfect gift for every occasion.
          </p>
        </div>
      </div>
    </section>
  );
};

export default StatsAndCTA;
