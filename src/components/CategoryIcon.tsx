import { Monitor, Briefcase, Lightbulb, BarChart, TrendingUp, Package, Wrench, Palette, HelpCircle, LucideProps } from "lucide-react";

interface CategoryIconProps extends LucideProps {
  name: string;
}

export function CategoryIcon({ name, ...props }: CategoryIconProps) {
  switch (name) {
    case "Monitor": return <Monitor {...props} />;
    case "Briefcase": return <Briefcase {...props} />;
    case "Lightbulb": return <Lightbulb {...props} />;
    case "BarChart": return <BarChart {...props} />;
    case "TrendingUp": return <TrendingUp {...props} />;
    case "Package": return <Package {...props} />;
    case "Wrench": return <Wrench {...props} />;
    case "Palette": return <Palette {...props} />;
    default: return <HelpCircle {...props} />;
  }
}
