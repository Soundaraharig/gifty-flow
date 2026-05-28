const HeroSection = () => {
  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-rose opacity-50" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-medium tracking-widest uppercase text-rose-gold mb-4">
            Handcrafted with Love
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6">
            Gifts That Speak{" "}
            <span className="text-gradient-rose">From the Heart</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
            Custom photo frames, resin art & personalized gifts — crafted uniquely for your loved ones.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
