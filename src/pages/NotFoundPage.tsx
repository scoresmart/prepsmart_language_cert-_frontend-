import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-muted/30 p-6 text-center">
      <p className="font-display text-4xl text-primary">404</p>
      <p className="text-sm text-muted-foreground">This path does not exist in the LC portal.</p>
      <Button asChild>
        <Link to="/dashboard">Go to dashboard</Link>
      </Button>
    </div>
  );
}
