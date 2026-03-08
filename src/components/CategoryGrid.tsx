import { useNavigate } from "react-router-dom";
import CategoryCard from "./CategoryCard";
import photoFramesImg from "@/assets/category-photo-frames.jpg";
import resinArtImg from "@/assets/category-resin-art.jpg";
import customGiftsImg from "@/assets/category-custom-gifts.jpg";

const categories = [
  {
    id: "photo-frames",
    title: "Photo Frames",
    description: "Custom frames with artistic editing styles",
    image: photoFramesImg,
    available: true,
  },
  {
    id: "resin-art",
    title: "Resin Art",
    description: "Beautiful handcrafted resin artwork",
    image: resinArtImg,
    available: false,
  },
  {
    id: "custom-gifts",
    title: "Custom Gifts",
    description: "Personalized gifts for every occasion",
    image: customGiftsImg,
    available: false,
  },
];

const CategoryGrid = () => {
  const navigate = useNavigate();

  return (
    <section id="categories" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Our Collections
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Choose a category to start designing your perfect gift
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              title={cat.title}
              description={cat.description}
              image={cat.image}
              available={cat.available}
              onClick={() => cat.available && navigate(`/configure/${cat.id}`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
