const steps = [
  {
    number: "01",
    emoji: "🎨",
    title: "Choose Your Style",
    description: "Pick from oil painting, watercolor, pop art & more artistic editing styles.",
  },
  {
    number: "02",
    emoji: "📐",
    title: "Select Size & Frame",
    description: "Choose the perfect size and frame material to match your space.",
  },
  {
    number: "03",
    emoji: "📞",
    title: "Team Will Contact You",
    description: "Our team will reach out to collect your photo & finalize details.",
  },
  {
    number: "04",
    emoji: "🎁",
    title: "Receive Your Gift",
    description: "We handcraft & deliver your masterpiece, gift-wrapped and ready.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 md:py-28 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-2">Simple Process</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            How It Works
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <div key={i} className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
                {step.emoji}
              </div>
              <p className="text-xs font-bold text-primary tracking-widest mb-1">{step.number}</p>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
