'use client';

import React, { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const DeadManSwitch = dynamic(
  () => import('@/components/DeadManSwitch'),
  { ssr: false }
);

const HomePage: FC = () => {
  const { connected } = useWallet();

  return (
    <div className="min-h-screen bg-black">
      {!connected ? (
        <div className="relative min-h-screen flex flex-col items-center justify-center">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

          <div className="relative text-center space-y-16 p-8 max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="space-y-6">
              <div className="inline-block mb-4">
                <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-zinc-900 text-zinc-400 border border-zinc-800">
                  Pass your Crypto
                </span>
              </div>
              <h1 className="text-6xl font-bold text-white tracking-tight">
                Eternal Key
              </h1>
              <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                The next generation of digital asset inheritance. 
                Secure, automated, and decentralized on Solana. Currently in beta.
              </p>
            </div>
            
            {/* CTA Button */}
            <div className="inline-block">
              <WalletMultiButton className="!bg-white !text-black hover:!bg-zinc-200 !px-8 !py-4 !rounded-lg !font-medium !text-base transition-colors" />
            </div>
            
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-24">
              {[
                {
                  title: "Security First",
                  description: "Military-grade encryption with blockchain security",
                  icon: "🔐"
                },
                {
                  title: "Automation",
                  description: "Intelligent triggers with customizable periods",
                  icon: "⚡"
                },
                {
                  title: "Full Control",
                  description: "Complete authority over your digital assets",
                  icon: "🎯"
                }
              ].map((feature) => (
                <div 
                  key={feature.title} 
                  className="p-6 bg-zinc-900/50 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition-colors"
                >
                  <div className="text-2xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-zinc-400 text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Trust Indicators */}
            <div className="pt-16 border-t border-zinc-900">
              <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 text-zinc-500 text-sm">
                <span>Enterprise Security</span>
                <span>Instant Execution</span>
                <span>Decentralized</span>
                <span>Full Transparency</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-black text-white">
          {/* Dashboard Navigation */}
          <nav className="bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50 border-b border-zinc-800">
            <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-medium text-white">
                  Eternal Key
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Dashboard
                </span>
              </div>
              <WalletMultiButton className="!bg-white !text-black hover:!bg-zinc-200 !rounded-lg !text-sm transition-colors" />
            </div>
          </nav>
          
          {/* Dashboard Content */}
          <main className="max-w-6xl mx-auto p-6">
            <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-6">
              <DeadManSwitch />
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default HomePage;