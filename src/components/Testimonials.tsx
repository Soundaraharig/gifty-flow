const testimonials = [
  {
    name: "Priya S.",
    location: "Mumbai",
    text: "Ordered an oil painting style frame for my parents' anniversary. They were in tears! Absolutely stunning quality.",
    rating: 5,
  },
  {
    name: "Rahul M.",
    location: "Bangalore",
    text: "The watercolor frame I got for my girlfriend was gorgeous. Packaging was premium and delivery was quick. Highly recommend!",
    rating: 5,
  },
  {
    name: "Ananya K.",
    location: "Delhi",
    text: "I've ordered 3 times now — pop art, pencil sketch, and mosaic. Each one is unique and beautifully crafted. My go-to gift shop!",
    rating: 5,
  },
  {
    name: "Vikram T.",
    location: "Pune",
    text: "Gifted a vintage retro frame to my best friend. The attention to detail is amazing. Worth every rupee.",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-2">Happy Customers</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            What People Say
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex text-accent text-sm mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <span key={j}>★</span>
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-4">"{t.text}"</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
