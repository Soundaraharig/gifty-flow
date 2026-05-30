import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { CartProvider } from "@/hooks/useCart";
import ProtectedRoute from "@/components/ProtectedRoute";
import BugReportButton from "@/components/BugReportButton";
import AuthPage from "./pages/AuthPage";
import Index from "./pages/Index";
import ConfiguratorPage from "./pages/ConfiguratorPage";
import ResinConfiguratorPage from "./pages/ResinConfiguratorPage";
import StyleCollectionPage from "./pages/StyleCollectionPage";
import StyleGalleryPage from "./pages/StyleGalleryPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import AdminPage from "./pages/AdminPage";
import CategoriesPage from "./pages/CategoriesPage";
import CartPage from "./pages/CartPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import BuyCreditsPage from "./pages/BuyCreditsPage";
import NotFound from "./pages/NotFound";
import ARFrameScanner from "./components/ARFrameScanner";
import ScanFramePage from "./pages/ScanFramePage";
import ChatAssistantPage from "./pages/ChatAssistantPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BugReportButton />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/" element={<Index />} />
                <Route path="/configure/photo-frames/styles" element={<ProtectedRoute><StyleCollectionPage /></ProtectedRoute>} />
                <Route path="/configure/photo-frames" element={<ProtectedRoute><ConfiguratorPage /></ProtectedRoute>} />

                <Route path="/configure/resin-art" element={<ProtectedRoute><ResinConfiguratorPage /></ProtectedRoute>} />
                <Route path="/style-gallery/:styleId" element={<ProtectedRoute><StyleGalleryPage /></ProtectedRoute>} />
                <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
                <Route path="/my-orders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
                <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
                <Route path="/subscribe" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
                <Route path="/buy-credits" element={<ProtectedRoute><BuyCreditsPage /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                <Route path="/assistant" element={<ChatAssistantPage />} />
                <Route path="/scan/:frameId" element={<ARFrameScanner />} />
                <Route path="/scan-frame" element={<ScanFramePage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
