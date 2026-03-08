interface CategoryCardProps {
  title: string;
  description: string;
  image: string;
  onClick: () => void;
  available?: boolean;
}

const CategoryCard = ({ title, description, image, onClick, available = true }: CategoryCardProps) => {
  return (
    <button
      onClick={onClick}
      disabled={!available}
      className="group relative rounded-2xl overflow-hidden shadow-rose transition-all duration-300 hover:scale-[1.02] hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed text-left"
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3 className="font-display text-xl font-semibold text-primary-foreground mb-1">{title}</h3>
        <p className="text-sm text-primary-foreground/80">{description}</p>
        {!available && (
          <span className="inline-block mt-2 text-xs bg-primary-foreground/20 text-primary-foreground px-3 py-1 rounded-full">
            Coming Soon
          </span>
        )}
      </div>
    </button>
  );
};

export default CategoryCard;
