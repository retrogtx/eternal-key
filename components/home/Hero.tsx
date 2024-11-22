import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "lucide-react";
import AnimatedShinyText from "@/components/ui/animated-shiny-text";
import dynamic from 'next/dynamic';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export const Hero = () => {
  return (
    <div className="space-y-6 pt-24">
      <div className="flex flex-col items-center gap-2">
        <div className={cn(
          "group rounded-full border border-white/10 bg-neutral-900 text-sm text-white/70 transition-all ease-in hover:border-white/20"
        )}>
          <AnimatedShinyText className="inline-flex items-center justify-center px-3 py-0.5 transition ease-out">
            <span>✨ Join the beta</span>
            <ArrowRightIcon className="ml-1 size-2.5 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
          </AnimatedShinyText>
        </div>
        <h1 className="text-6xl font-bold text-white tracking-tight">
          Eternal Key
        </h1>
      </div>
      <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
        The next generation of digital asset inheritance.
        <br />
        Secure, automated, and decentralized on Solana.
      </p>
      <div className="inline-block">
        <WalletMultiButton className="!bg-white !text-black hover:!bg-zinc-200 !px-8 !py-4 !rounded-lg !font-medium !text-base transition-colors" />
      </div>
    </div>
  );
}; 