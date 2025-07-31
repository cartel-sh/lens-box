import type { Metadata } from "next";
import Link from "next/link";
import { PackageOpen, Brush, Sprout } from "lucide-react";

export const metadata: Metadata = {
  title: "Box",
  description: "reach your people on box",
  openGraph: {
    title: "Box",
    description: "reach your people on box",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

const LandingPage = () => {
  return (
    <div className="relative min-h-screen">
      <div className="flex flex-col min-h-screen relative z-10 px-4">
        <div className="pt-20 pb-20 space-y-32 max-w-4xl mx-auto w-full">
          <h1 className="text-5xl font-bold drop-shadow-md dark:drop-shadow-glow flex items-center gap-4">
            <PackageOpen className="w-16 h-16 text-primary" />
            Lens-in-a-Box!
          </h1>

          <div className="text-2xl">
            <p className="text-primary/60">
              <span className="text-primary font-semibold">Minimalist social.</span>{" "}
              We cut off everything unnecessary, leaving you with a cleaner experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <p className="text-primary/60">
                <span className="text-primary font-semibold">Secure.</span>{" "}
                Backed by Ethereum's security.
              </p>
            </div>

            <div>
              <p className="text-primary/60">
                <span className="text-primary font-semibold">Open.</span>{" "}
                Built by{" "}
                <Link
                  href="https://github.com/cartel-sh/lens-box"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline hover:underline-offset-4 transition-all"
                >
                  the community
                </Link>
                .
              </p>
            </div>

            <div>
              <p className="text-primary/60">
                <span className="text-primary font-semibold">Free.</span>{" "}
                Box is a public good for the people.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-primary/60">
                <span className="text-primary font-semibold">Portable.</span>{" "}
                Start with box and then use your account across dozens of other apps.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Link
                href="https://art.lens.box"
                target="_blank"
                rel="noopener noreferrer"
                className="block relative p-6 pb-16 border border-border rounded-lg hover:shadow-lg transition-shadow min-h-[140px]"
              >
                <p className="text-primary font-semibold">Everyone is an artist.</p>
                <div className="text-sm text-primary/60 absolute bottom-6 left-6 flex items-center gap-2">
                  <Brush className="w-4 h-4" />
                  art.lens.box
                </div>
              </Link>

              <Link
                href="https://awesome.lens.box"
                target="_blank"
                rel="noopener noreferrer"
                className="block relative p-6 pb-16 border border-border rounded-lg hover:shadow-lg transition-shadow min-h-[140px]"
              >
                <p className="text-primary font-semibold">So many experiences to discover.</p>
                <div className="text-sm text-primary/60 absolute bottom-6 left-6 flex items-center gap-2">
                  <Sprout className="w-4 h-4" />
                  awesome.lens.box
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
