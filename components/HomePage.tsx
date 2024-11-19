'use client';

import React, { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { NetworkSwitcher } from './NetworkSwitcher';
import { CardSpotlight } from "@/components/ui/card-spotlight";

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
                  description: "Built on Solana, the most secure blockchain",
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

            {/* Authentication Steps Card */}
            <div className="flex justify-center mt-24">
              <CardSpotlight className="max-w-md">
                <p className="text-xl font-bold relative z-20 mt-2 text-white">
                  How it works
                </p>
                <div className="text-neutral-200 mt-4 relative z-20">
                  Follow these steps to set up your inheritance:
                  <ul className="list-none mt-4 space-y-3">
                    <Step title="Connect your Solana wallet" />
                    <Step title="Enter your beneficiary's wallet address" />
                    <Step title="Enter amount to pass" />
                    <Step title="Configure check-in period" />
                    <Step title="Create switch" />
                    <Step title="Wait for time to pass" />
                    <Step title="Withdraw from beneficiary's wallet!" />
                  </ul>
                </div>
                <p className="text-neutral-300 mt-6 relative z-20 text-sm">
                  You can cancel the switch anytime until the time is up.
                </p>
              </CardSpotlight>
            </div>

            {/* FAQ Section */}
            <div className="mt-16 max-w-2xl mx-auto text-left">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Frequently Asked Questions</h2>
              <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem value="item-1" className="border-none bg-zinc-900/50 rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline text-white py-4">
                    How does Eternal Key work?
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-400 pb-4">
                    Eternal Key uses smart contracts on the Solana blockchain to create a secure, automated inheritance system. 
                    Set up automatic transfers that trigger if you don&apos;t check in within your specified timeframe.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border-none bg-zinc-900/50 rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline text-white py-4">
                    What happens to my assets?
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-400 pb-4">
                    Your assets remain securely locked in the smart contract until either you miss a check-in deadline or you choose to cancel the escrow and withdraw them. 
                    You maintain full control over your assets while the switch is active. Once the time is up, only the beneficiary wallet can withdraw the assets.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border-none bg-zinc-900/50 rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline text-white py-4">
                    Is this secure?
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-400 pb-4">
                    Yes, alot. Eternal Key is built on Solana&apos;s blockchain, ensuring maximum security and transparency. 
                    All transactions and rules are enforced by smart contracts, making the process completely trustless and automated.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border-none bg-zinc-900/50 rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline text-white py-4">
                    How do I verify this so I can trust it?
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-400 pb-4">
                    You can verify the code and smart contract by checking the source code on <a href="https://github.com/amritwt/eternal-key" className="underline">Github</a>.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Trust Indicators */}
            <div className="pt-16 border-t border-zinc-900">
              <div className="flex flex-wrap justify-center text-zinc-500 text-sm">
              <a href="https://twitter.com/amritwt" className="hover:underline">@amritwt</a>
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
                <NetworkSwitcher />
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

const Step = ({ title }: { title: string }) => {
  return (
    <li className="flex gap-2 items-start">
      <CheckIcon />
      <p className="text-white">{title}</p>
    </li>
  );
};

const CheckIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path
        d="M12 2c-.218 0 -.432 .002 -.642 .005l-.616 .017l-.299 .013l-.579 .034l-.553 .046c-4.785 .464 -6.732 2.411 -7.196 7.196l-.046 .553l-.034 .579c-.005 .098 -.01 .198 -.013 .299l-.017 .616l-.004 .318l-.001 .324c0 .218 .002 .432 .005 .642l.017 .616l.013 .299l.034 .579l.046 .553c.464 4.785 2.411 6.732 7.196 7.196l.553 .046l.579 .034c.098 .005 .198 .01 .299 .013l.616 .017l.642 .005l.642 -.005l.616 -.017l.299 -.013l.579 -.034l.553 -.046c4.785 -.464 6.732 -2.411 7.196 -7.196l.046 -.553l.034 -.579c.005 -.098 .01 -.198 .013 -.299l.017 -.616l.005 -.642l-.005 -.642l-.017 -.616l-.013 -.299l-.034 -.579l-.046 -.553c-.464 -4.785 -2.411 -6.732 -7.196 -7.196l-.553 -.046l-.579 -.034a28.058 28.058 0 0 0 -.299 -.013l-.616 -.017l-.318 -.004l-.324 -.001zm2.293 7.293a1 1 0 0 1 1.497 1.32l-.083 .094l-4 4a1 1 0 0 1 -1.32 .083l-.094 -.083l-2 -2a1 1 0 0 1 1.32 -1.497l.094 .083l1.293 1.292l3.293 -3.292z"
        fill="currentColor"
        strokeWidth="0"
      />
    </svg>
  );
};

export default HomePage;