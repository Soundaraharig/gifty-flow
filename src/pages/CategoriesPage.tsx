import Header from "@/components/Header";
import CategoryGrid from "@/components/CategoryGrid";

const CategoriesPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        <CategoryGrid />
      </div>
    </div>
  );
};

export default CategoriesPage;
