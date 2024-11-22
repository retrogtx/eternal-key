'use client';

import React, { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Particles from "@/components/ui/particles";
import FeaturesSectionDemo from "@/components/blocks/features-section-demo-2";
import { Hero } from '@/components/home/Hero';
import { HowItWorks } from '@/components/home/HowItWorks';
import { FAQ } from '@/components/home/FAQ';
import { Dashboard } from '@/components/home/Dashboard';

const Homepage: FC = () => {
  const { connected } = useWallet();

  if (connected) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="relative min-h-screen flex flex-col">
        <Particles
          className="absolute inset-0"
          quantity={300}
          staticity={30}
          ease={50}
          color="#ffffff"
        />
        <div className="relative z-10 text-center space-y-16 p-8 max-w-6xl mx-auto">
          <Hero />
          <FeaturesSectionDemo />
          <HowItWorks />
          <FAQ />
          
          {/* Trust Indicators */}
          <div className="pt-16 border-t border-zinc-900">
            <div className="flex flex-wrap justify-center text-zinc-500 text-sm">
              <a href="https://twitter.com/amritwt" className="hover:underline">@amritwt</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;