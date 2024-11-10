'use client';

import React, { FC, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const Landing: FC = () => {
  const { connected } = useWallet();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (connected && !isRedirecting) {
      setIsRedirecting(true);
      router.push('/dashboard');
    }
  }, [connected, router, isRedirecting]);

  // Prevent flickering by not rendering during redirect
  if (isRedirecting) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="text-center space-y-8 p-8">
        <h1 className="text-6xl font-bold mb-4">Dead Man&apos;s Switch</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Secure your digital assets with our decentralized dead man&apos;s switch. 
          Set up automatic transfers that trigger if you don&apos;t check in regularly.
        </p>
        
        <div className="mt-8">
          <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 transition-colors" />
        </div>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="p-6 bg-gray-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Secure</h3>
            <p className="text-gray-400">Built on Solana blockchain for maximum security and transparency</p>
          </div>
          <div className="p-6 bg-gray-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Flexible</h3>
            <p className="text-gray-400">Customize your check-in periods and beneficiary addresses</p>
          </div>
          <div className="p-6 bg-gray-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Reliable</h3>
            <p className="text-gray-400">Automated execution ensures your wishes are carried out</p>
          </div>
        </div>

        <div className="mt-16 max-w-2xl mx-auto text-left">
          <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="bg-gray-800/50 rounded-lg border border-gray-700 px-4">
              <AccordionTrigger className="hover:no-underline">
                How does the Dead Man&apos;s Switch work?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Our Dead Man&apos;s Switch is a smart contract on the Solana blockchain that monitors your check-in activity. 
                If you fail to check in within your specified timeframe, the contract automatically transfers your assets to your designated beneficiary.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-gray-800/50 rounded-lg border border-gray-700 px-4">
              <AccordionTrigger className="hover:no-underline">
                What happens to my assets in the meantime?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Your assets remain securely locked in the smart contract until either you miss a check-in deadline or you choose to withdraw them. 
                You maintain full control over your assets while the switch is active.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-gray-800/50 rounded-lg border border-gray-700 px-4">
              <AccordionTrigger className="hover:no-underline">
                Can I customize the check-in period?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Yes, you can set custom check-in periods that suit your needs. Whether you want daily, weekly, or monthly check-ins, 
                our system is flexible to accommodate your preferences.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-gray-800/50 rounded-lg border border-gray-700 px-4">
              <AccordionTrigger className="hover:no-underline">
                Is the service secure?
              </AccordionTrigger>
              <AccordionContent className="text-gray-300">
                Yes, our service is built on Solana&apos;s blockchain technology, ensuring maximum security and transparency. 
                All transactions and rules are enforced by smart contracts, making the process completely trustless and automated.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default Landing; 