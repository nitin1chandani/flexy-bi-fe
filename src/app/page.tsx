import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-2xl w-full text-center py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Empowering Accountants with{" "}
          <span className="text-blue-600">FlexyBI</span>
        </h1>
        <p className="text-lg text-gray-700 mb-8">
          Go beyond building reports—generate actionable insights from your Excel,
          PDF, and CSV files. Flexy BI helps accountants unlock the full potential
          of their data, making analysis effortless and impactful.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Button asChild size="lg">
            <Link href="/login">Get Started</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
        
        <p className="text-md text-gray-500 mt-8 italic">
          🚧 Flexy BI is currently under development. Stay tuned for something
          amazing!
        </p>
      </div>
      <footer className="w-full text-center text-xs text-gray-400 mt-8 pb-4">
        &copy; {new Date().getFullYear()} Flexy BI. Founded by Nitin Chandani,
        Manan Saini, Bhavesh Pandey.
      </footer>
    </main>
  );
}
